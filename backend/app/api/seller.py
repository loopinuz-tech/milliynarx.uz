import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from backend.app.db.session import get_db
from backend.app.db.models import (
    User, Seller, SellerProfile, Product, ProductImage, PriceHistory, 
    PriceAlert, Notification, AnalyticsEvent, Favorite, Subscription, Payment
)
from backend.app.api.auth import get_current_user, require_role
from backend.app.core.security import create_access_token
from backend.app.schemas.schemas import ProductOut, ProductCreate, ProductUpdate, PriceHistoryOut, SellerProfileUpdate
from backend.app.core.slug import generate_unique_slug

router = APIRouter(prefix="/seller", tags=["seller"])

def get_current_seller(
    current_user: User = Depends(require_role(["SELLER", "ADMIN"])),
    db: Session = Depends(get_db)
) -> Seller:
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sotuvchi profili topilmadi. Iltimos, do'koningizni ro'yxatdan o'tkazing."
        )
    return seller

@router.get("/metrics")
def get_seller_metrics(
    seller: Seller = Depends(get_current_seller),
    db: Session = Depends(get_db)
):
    total_products = db.query(Product).filter(Product.seller_id == seller.id).count()
    active_products = db.query(Product).filter(
        Product.seller_id == seller.id,
        Product.status == "ACTIVE"
    ).count()
    pending_products = db.query(Product).filter(
        Product.seller_id == seller.id,
        Product.status == "PENDING_APPROVAL"
    ).count()
    
    # Real views count from analytics_events
    views_count = db.query(AnalyticsEvent).join(
        Product, Product.id == AnalyticsEvent.product_id
    ).filter(
        Product.seller_id == seller.id,
        AnalyticsEvent.event_type == "VIEW"
    ).count()
    
    # Real favorites count
    favorites_count = db.query(Favorite).join(
        Product, Product.id == Favorite.product_id
    ).filter(
        Product.seller_id == seller.id
    ).count()
    
    return {
        "store_name": seller.store_name,
        "seller_status": seller.status,
        "is_verified": seller.is_verified,
        "total_products": total_products,
        "active_products": active_products,
        "pending_products": pending_products,
        "total_views": views_count,
        "total_favorites": favorites_count,
        "total_orders": 0 # Strict zero if no orders table filled yet
    }

@router.get("/products", response_model=List[ProductOut])
def get_seller_products(
    seller: Seller = Depends(get_current_seller),
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.seller_id == seller.id)
    if status_filter:
        query = query.filter(Product.status == status_filter)
        
    products = query.order_by(desc(Product.created_at)).all()
    
    return [
        ProductOut(
            id=p.id,
            seller_id=p.seller_id,
            seller_name=seller.store_name,
            seller_rating=seller.rating,
            category_id=p.category_id,
            category_name=p.category.name if p.category else None,
            brand_id=p.brand_id,
            brand_name=p.brand.name if p.brand else None,
            name=p.name,
            slug=p.slug,
            model=p.model,
            sku=p.sku,
            barcode=p.barcode,
            description=p.description,
            price=p.price,
            old_price=p.old_price,
            currency=p.currency,
            stock=p.stock,
            availability=p.availability,
            condition=p.condition,
            location=p.location,
            warranty=p.warranty,
            delivery=p.delivery,
            specifications=p.specifications,
            status=p.status,
            created_at=p.created_at,
            updated_at=p.updated_at,
            images=[
                {
                    "id": img.id,
                    "image_url": img.image_url,
                    "is_primary": img.is_primary,
                    "display_order": img.display_order
                } for img in p.images
            ]
        ) for p in products
    ]

@router.post("/products", response_model=ProductOut)
def create_product(
    product_in: ProductCreate,
    seller: Seller = Depends(get_current_seller),
    db: Session = Depends(get_db)
):
    if seller.status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sizning do'koningiz administrator tomonidan tasdiqlanmaguncha mahsulot qo'sha olmaysiz."
        )
        
    # Mahsulot yuklash barcha sotuvchilar uchun 100% bepul va cheksiz
    slug = generate_unique_slug(db, Product, product_in.name)
        
    product = Product(
        seller_id=seller.id,
        category_id=product_in.category_id,
        brand_id=product_in.brand_id,
        name=product_in.name,
        slug=slug,
        model=product_in.model,
        sku=product_in.sku,
        barcode=product_in.barcode,
        description=product_in.description,
        price=product_in.price,
        old_price=product_in.old_price,
        currency=product_in.currency,
        stock=product_in.stock,
        availability=product_in.availability,
        condition=product_in.condition,
        location=product_in.location,
        warranty=product_in.warranty,
        delivery=product_in.delivery,
        specifications=product_in.specifications,
        status="PENDING_APPROVAL" # Sent to admin for review
    )
    db.add(product)
    db.flush()
    
    # Add images if provided
    if product_in.images:
        for idx, img_url in enumerate(product_in.images):
            img = ProductImage(
                product_id=product.id,
                image_url=img_url,
                is_primary=(idx == 0),
                display_order=idx
            )
            db.add(img)
            
    # Add initial price to price history
    price_entry = PriceHistory(
        product_id=product.id,
        seller_id=seller.id,
        price=product.price,
        old_price=product.old_price,
        change_amount=0.0,
        change_percent=0.0,
        source="SELLER_MANUAL",
        recorded_at=datetime.utcnow()
    )
    db.add(price_entry)
    
    db.commit()
    db.refresh(product)
    
    return ProductOut(
        id=product.id,
        seller_id=product.seller_id,
        seller_name=seller.store_name,
        seller_rating=seller.rating,
        category_id=product.category_id,
        category_name=product.category.name if product.category else None,
        brand_id=product.brand_id,
        brand_name=product.brand.name if product.brand else None,
        name=product.name,
        slug=product.slug,
        model=product.model,
        sku=product.sku,
        barcode=product.barcode,
        description=product.description,
        price=product.price,
        old_price=product.old_price,
        currency=product.currency,
        stock=product.stock,
        availability=product.availability,
        condition=product.condition,
        location=product.location,
        warranty=product.warranty,
        delivery=product.delivery,
        specifications=product.specifications,
        status=product.status,
        created_at=product.created_at,
        updated_at=product.updated_at,
        images=[
            {
                "id": img.id,
                "image_url": img.image_url,
                "is_primary": img.is_primary,
                "display_order": img.display_order
            } for img in product.images
        ]
    )

@router.get("/products/{product_id}", response_model=ProductOut)
def get_seller_product(
    product_id: str,
    seller: Seller = Depends(get_current_seller),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.seller_id == seller.id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
        
    return ProductOut(
        id=product.id,
        seller_id=product.seller_id,
        seller_name=seller.store_name,
        seller_rating=seller.rating,
        category_id=product.category_id,
        category_name=product.category.name if product.category else None,
        brand_id=product.brand_id,
        brand_name=product.brand.name if product.brand else None,
        name=product.name,
        slug=product.slug,
        model=product.model,
        sku=product.sku,
        barcode=product.barcode,
        description=product.description,
        price=product.price,
        old_price=product.old_price,
        currency=product.currency,
        stock=product.stock,
        availability=product.availability,
        condition=product.condition,
        location=product.location,
        warranty=product.warranty,
        delivery=product.delivery,
        specifications=product.specifications,
        status=product.status,
        created_at=product.created_at,
        updated_at=product.updated_at,
        images=[
            {
                "id": img.id,
                "image_url": img.image_url,
                "is_primary": img.is_primary,
                "display_order": img.display_order
            } for img in product.images
        ]
    )

@router.patch("/products/{product_id}", response_model=ProductOut)
def update_product(
    product_id: str,
    product_in: ProductUpdate,
    seller: Seller = Depends(get_current_seller),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.seller_id == seller.id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
        
    old_price = product.price
    update_data = product_in.dict(exclude_unset=True)
    
    # Handle image list replacement if provided
    if "images" in update_data:
        images_list = update_data.pop("images")
        if images_list is not None:
            db.query(ProductImage).filter(ProductImage.product_id == product.id).delete()
            for idx, img_url in enumerate(images_list):
                img = ProductImage(
                    product_id=product.id,
                    image_url=img_url,
                    is_primary=(idx == 0),
                    display_order=idx
                )
                db.add(img)
    
    # If name changed, update slug cleanly
    if "name" in update_data and update_data["name"] and update_data["name"] != product.name:
        product.slug = generate_unique_slug(db, Product, update_data["name"], current_id=product.id)

    # If price changed, record in price_history and check price_alerts
    if "price" in update_data and update_data["price"] is not None and update_data["price"] != old_price:
        new_price = update_data["price"]
        change_amount = new_price - old_price
        change_percent = (change_amount / old_price) * 100 if old_price > 0 else 0
        
        # Keep track of old price
        product.old_price = old_price
        
        history = PriceHistory(
            product_id=product.id,
            seller_id=seller.id,
            price=new_price,
            old_price=old_price,
            change_amount=change_amount,
            change_percent=round(change_percent, 2),
            source="SELLER_MANUAL",
            recorded_at=datetime.utcnow()
        )
        db.add(history)
        
        # Check active price alerts for this product
        active_alerts = db.query(PriceAlert).filter(
            PriceAlert.product_id == product.id,
            PriceAlert.is_active == True,
            PriceAlert.target_price >= new_price
        ).all()
        
        for alert in active_alerts:
            alert.triggered = True
            alert.triggered_at = datetime.utcnow()
            alert.is_active = False # Triggered once
            
            notif = Notification(
                user_id=alert.user_id,
                title="Narx pasaydi!",
                message=f"'{product.name}' mahsuloti narxi {new_price:,.0f} so'mga tushdi (Maqsad: {alert.target_price:,.0f} so'm).",
                type="PRICE_DROP",
                link=f"/product/{product.id}"
            )
            db.add(notif)
            
    for field, value in update_data.items():
        setattr(product, field, value)
        
    product.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(product)
    
    return ProductOut(
        id=product.id,
        seller_id=product.seller_id,
        seller_name=seller.store_name,
        seller_rating=seller.rating,
        category_id=product.category_id,
        category_name=product.category.name if product.category else None,
        brand_id=product.brand_id,
        brand_name=product.brand.name if product.brand else None,
        name=product.name,
        slug=product.slug,
        model=product.model,
        sku=product.sku,
        barcode=product.barcode,
        description=product.description,
        price=product.price,
        old_price=product.old_price,
        currency=product.currency,
        stock=product.stock,
        availability=product.availability,
        condition=product.condition,
        location=product.location,
        warranty=product.warranty,
        delivery=product.delivery,
        specifications=product.specifications,
        status=product.status,
        created_at=product.created_at,
        updated_at=product.updated_at,
        images=[
            {
                "id": img.id,
                "image_url": img.image_url,
                "is_primary": img.is_primary,
                "display_order": img.display_order
            } for img in product.images
        ]
    )

@router.delete("/products/{product_id}")
def delete_seller_product(
    product_id: str,
    seller: Seller = Depends(get_current_seller),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.seller_id == seller.id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
        
    db.delete(product)
    db.commit()
    
    return {"message": "Mahsulot muvaffaqiyatli o'chirildi", "id": product_id}

@router.get("/price-history", response_model=List[PriceHistoryOut])
def get_seller_price_history(
    seller: Seller = Depends(get_current_seller),
    limit: int = 50,
    db: Session = Depends(get_db)
):
    history = db.query(PriceHistory).filter(
        PriceHistory.seller_id == seller.id
    ).order_by(desc(PriceHistory.recorded_at)).limit(limit).all()
    
    return [
        PriceHistoryOut(
            id=h.id,
            price=h.price,
            old_price=h.old_price,
            change_amount=h.change_amount,
            change_percent=h.change_percent,
            source=h.source,
            recorded_at=h.recorded_at
        ) for h in history
    ]

@router.get("/store")
def get_seller_store_details(
    seller: Seller = Depends(get_current_seller),
    db: Session = Depends(get_db)
):
    profile = seller.profile
    return {
        "id": seller.id,
        "store_name": seller.store_name,
        "slug": seller.slug,
        "business_reg_number": seller.business_reg_number,
        "tax_id": seller.tax_id,
        "status": seller.status,
        "rating": seller.rating,
        "is_verified": seller.is_verified,
        "created_at": seller.created_at,
        "description": profile.description if profile else None,
        "logo_url": profile.logo_url if profile else None,
        "banner_url": profile.banner_url if profile else None,
        "address": profile.address if profile else None,
        "city": profile.city if profile else "Xorazm",
        "region": profile.region if profile else None,
        "website": profile.website if profile else None,
        "contact_phone": profile.contact_phone if profile else None
    }

@router.patch("/store")
def update_seller_store(
    profile_in: SellerProfileUpdate,
    seller: Seller = Depends(get_current_seller),
    db: Session = Depends(get_db)
):
    if profile_in.store_name is not None and profile_in.store_name.strip():
        seller.store_name = profile_in.store_name.strip()
        
    profile = seller.profile
    if not profile:
        profile = SellerProfile(seller_id=seller.id)
        db.add(profile)
        db.flush()
        
    if profile_in.description is not None:
        profile.description = profile_in.description
    if profile_in.logo_url is not None:
        profile.logo_url = profile_in.logo_url
    if profile_in.banner_url is not None:
        profile.banner_url = profile_in.banner_url
    if profile_in.address is not None:
        profile.address = profile_in.address
    if profile_in.city is not None:
        profile.city = profile_in.city
    if profile_in.region is not None:
        profile.region = profile_in.region
    if profile_in.website is not None:
        profile.website = profile_in.website
    if profile_in.contact_phone is not None:
        profile.contact_phone = profile_in.contact_phone
        
    profile.updated_at = datetime.utcnow()
    seller.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(seller)
    db.refresh(profile)
        
    return {
        "id": seller.id,
        "store_name": seller.store_name,
        "slug": seller.slug,
        "business_reg_number": seller.business_reg_number,
        "tax_id": seller.tax_id,
        "status": seller.status,
        "rating": seller.rating,
        "is_verified": seller.is_verified,
        "created_at": seller.created_at,
        "description": profile.description,
        "logo_url": profile.logo_url,
        "banner_url": profile.banner_url,
        "address": profile.address,
        "city": profile.city,
        "region": profile.region,
        "website": profile.website,
        "contact_phone": profile.contact_phone
    }


# =======================================================
# ONBOARDING & BUSINESS MODEL (PRICING PLANS & LIMITS)
# =======================================================

from pydantic import BaseModel

class SellerOnboardingIn(BaseModel):
    store_name: str
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = "Toshkent"
    address: Optional[str] = None
    market_name: Optional[str] = None
    contact_phone: Optional[str] = None
    telegram_channel: Optional[str] = None
    business_reg_number: Optional[str] = None
    tax_id: Optional[str] = None
    monthly_turnover: Optional[str] = None
    payment_methods: Optional[List[str]] = None
    plan: Optional[str] = "STARTER"

class PlanUpgradeIn(BaseModel):
    plan: str # "PRO", "ENTERPRISE"
    payment_method: str = "click" # "click", "payme", "uzum", "invoice"
    period_months: int = 1

@router.get("/onboarding-status")
def get_onboarding_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        user_name = current_user.profile.full_name if current_user.profile and current_user.profile.full_name else current_user.email.split("@")[0]
        return {
            "onboarding_completed": False,
            "store_name": f"{user_name} Do'koni",
            "plan": "STARTER",
            "product_limit": 99999,
            "logo_url": None,
            "market_name": "Abu Saxiy savdo markazi",
            "monthly_turnover": "50_200_mln",
            "payment_methods": ["click", "payme", "cash", "terminal"]
        }
    profile = seller.profile
    return {
        "onboarding_completed": bool(seller.onboarding_completed),
        "store_name": seller.store_name,
        "plan": seller.plan or "STARTER",
        "product_limit": seller.product_limit or 99999,
        "logo_url": profile.logo_url if profile else None,
        "market_name": seller.market_name,
        "monthly_turnover": seller.monthly_turnover,
        "payment_methods": (seller.payment_methods or "").split(",") if seller.payment_methods else ["click", "payme", "cash", "terminal"]
    }

@router.post("/onboarding")
def complete_seller_onboarding(
    onboarding_in: SellerOnboardingIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save multi-step seller onboarding info, logo, location, payment methods and selected plan. Creates seller record if applicant is a buyer."""
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        default_name = (current_user.profile.full_name if current_user.profile and current_user.profile.full_name else current_user.email.split("@")[0]) + " Do'koni"
        raw_name = (onboarding_in.store_name or default_name).strip()
        slug = generate_unique_slug(db, Seller, raw_name)
        seller = Seller(
            user_id=current_user.id,
            store_name=raw_name,
            slug=slug,
            business_reg_number=onboarding_in.business_reg_number,
            tax_id=onboarding_in.tax_id,
            status="APPROVED",
            rating=0.0,
            rating_count=0,
            is_verified=False
        )
        db.add(seller)
        db.flush()
        current_user.role = "SELLER"
    else:
        if onboarding_in.store_name:
            seller.store_name = onboarding_in.store_name.strip()
        if onboarding_in.business_reg_number is not None:
            seller.business_reg_number = onboarding_in.business_reg_number.strip()
        if onboarding_in.tax_id is not None:
            seller.tax_id = onboarding_in.tax_id.strip()

    if onboarding_in.market_name is not None:
        seller.market_name = onboarding_in.market_name.strip()
    if onboarding_in.monthly_turnover is not None:
        seller.monthly_turnover = onboarding_in.monthly_turnover.strip()
    if onboarding_in.payment_methods:
        seller.payment_methods = ",".join(onboarding_in.payment_methods)
        
    # Configure subscription plan and quotas (Mahsulot joylash barcha tariflarda 100% bepul va cheksiz)
    selected_plan = (onboarding_in.plan or "STARTER").upper()
    seller.plan = selected_plan
    seller.product_limit = 99999  # Barcha foydalanuvchilar uchun mahsulot joylash bepul va cheksiz
    if selected_plan == "PRO":
        seller.ai_queries_limit = 100  # Kunlik 100 ta chuqur AI tahlil so'rovi
    elif selected_plan == "ENTERPRISE":
        seller.ai_queries_limit = 99999  # Cheksiz AI so'rovlar & real-vaqt monitoring
    else:  # STARTER
        seller.plan = "STARTER"
        seller.ai_queries_limit = 5  # Kunlik 5 ta AI so'rov
        
    seller.onboarding_completed = True
    seller.updated_at = datetime.utcnow()
    
    # Update or create profile
    profile = seller.profile
    if not profile:
        profile = SellerProfile(seller_id=seller.id)
        db.add(profile)
        db.flush()
        
    if onboarding_in.logo_url is not None:
        profile.logo_url = onboarding_in.logo_url
    if onboarding_in.banner_url is not None:
        profile.banner_url = onboarding_in.banner_url
    if onboarding_in.description is not None:
        profile.description = onboarding_in.description
    if onboarding_in.city is not None:
        profile.city = onboarding_in.city
    if onboarding_in.address is not None:
        profile.address = onboarding_in.address
    if onboarding_in.contact_phone is not None:
        profile.contact_phone = onboarding_in.contact_phone
    if onboarding_in.telegram_channel is not None:
        profile.website = onboarding_in.telegram_channel
        
    profile.updated_at = datetime.utcnow()
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(seller)
    db.refresh(current_user)

    new_token = create_access_token(subject=current_user.id, role=current_user.role)
    
    return {
        "success": True,
        "message": "Do'kon muvaffaqiyatli yaratildi va onboarding yakunlandi!",
        "access_token": new_token,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role,
            "is_active": current_user.is_active,
            "store_name": seller.store_name,
            "seller_status": seller.status
        },
        "seller": {
            "id": seller.id,
            "store_name": seller.store_name,
            "plan": seller.plan,
            "ai_queries_limit": seller.ai_queries_limit,
            "onboarding_completed": seller.onboarding_completed,
            "logo_url": profile.logo_url
        }
    }

@router.get("/plan")
def get_seller_plan_details(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve current subscription plan, AI intelligence quotas, and tier features"""
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    products_count = db.query(Product).filter(Product.seller_id == seller.id).count() if seller else 0
    current_plan = (seller.plan if seller else "STARTER") or "STARTER"
    
    ai_limit = (seller.ai_queries_limit if seller else None) or (99999 if current_plan == "ENTERPRISE" else (100 if current_plan == "PRO" else 5))
    ai_used = (seller.ai_queries_used if seller else 0) or 0
    payment_methods = (seller.payment_methods.split(",") if seller and seller.payment_methods else ["click", "payme", "cash"])
    
    return {
        "current_plan": current_plan,
        "products_count": products_count,
        "product_limit": 99999,
        "ai_queries_limit": ai_limit,
        "ai_queries_used": ai_used,
        "payment_methods": payment_methods,
        "plans": [
            {
                "id": "STARTER",
                "name": "Starter",
                "price": 0,
                "price_formatted": "0 so'm",
                "period": "Umrbod bepul",
                "ai_limit": "Kunlik 5 ta AI so'rov",
                "comparison_limit": "2 tagacha mahsulotni taqqoslash",
                "is_current": current_plan == "STARTER",
                "features": [
                    "Kunlik 5 ta AI bozor tahlili so'rovi",
                    "Cheksiz tovarlar katalogi (100% bepul joylash)",
                    "Bazaviy taqqoslash (bir vaqtda 2 tagacha tovar)",
                    "Haftalik o'rtacha bozor narxlari dinamikasi",
                    "Telegram orqali haftalik narx hisoboti"
                ]
            },
            {
                "id": "PRO",
                "name": "Pro Treyder",
                "price": 290000,
                "price_formatted": "290 000 so'm",
                "period": "oyiga",
                "ai_limit": "Kunlik 100 ta AI chuqur tahlil so'rovi",
                "comparison_limit": "5 tagacha mahsulotni to'liq taqqoslash",
                "is_popular": True,
                "is_current": current_plan == "PRO",
                "features": [
                    "Kunlik 100 ta AI chuqur tahlil so'rovlari (oyiga 3 000 ta)",
                    "Ertangi kunlik & haftalik narx prognozi (Machine Learning)",
                    "Bir vaqtning o'zida 5 tagacha tovarlarni parallel solishtirish",
                    "AI Arbitraj: eng arzon va eng qimmat bozorlar spredi tahlili",
                    "Raqobatchilar narxlarini real-vaqtda kuzatish va tezkor signallar",
                    "Cheksiz tovar joylash + Tasdiqlangan treyder nishoni"
                ]
            },
            {
                "id": "ENTERPRISE",
                "name": "Enterprise",
                "price": 890000,
                "price_formatted": "890 000 so'm",
                "period": "oyiga",
                "ai_limit": "Cheksiz AI so'rovlar & real-vaqt tahlil",
                "comparison_limit": "Barcha bozorlar bo'yicha cheksiz taqqoslash",
                "is_current": current_plan == "ENTERPRISE",
                "features": [
                    "Cheksiz AI bozor tahlili va real-vaqt so'rovlari",
                    "Avtomatlashtirilgan bozorlararo AI Arbitraj va xarid signallari",
                    "Ommaviy (bulk) mahsulotlar taqqoslash va Excel/PDF eksport",
                    "1C / ERP tizimlari bilan to'g'ridan-to'g'ri API integratsiyasi",
                    "B2B Rasmiy shartnoma va Invoys (Hisob-faktura)",
                    "24/7 Shaxsiy AI tahlilchi va individual biznes menejer"
                ]
            }
        ]
    }

@router.post("/plan/upgrade")
def upgrade_seller_plan(
    upgrade_in: PlanUpgradeIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process plan upgrade for AI market intelligence and simulation payment"""
    target_plan = upgrade_in.plan.upper()
    if target_plan not in ["PRO", "ENTERPRISE"]:
        raise HTTPException(status_code=400, detail="Noto'g'ri tarif rejasi tanlandi")
        
    prices = {
        "PRO": 290000,
        "ENTERPRISE": 890000
    }
    amount = prices.get(target_plan, 0) * max(1, upgrade_in.period_months)
    
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        # Create seller profile automatically for user upgrading
        store_name = f"{current_user.email.split('@')[0]} Tahlil Portfeli"
        slug = generate_unique_slug(db, Seller, store_name)
        seller = Seller(
            user_id=current_user.id,
            store_name=store_name,
            slug=slug,
            status="APPROVED",
            is_verified=True,
            plan=target_plan,
            product_limit=99999,
            ai_queries_limit=100 if target_plan == "PRO" else 99999,
            ai_queries_used=0
        )
        db.add(seller)
        current_user.role = "SELLER"
        db.flush()
        
        seller_prof = SellerProfile(seller_id=seller.id, city="Toshkent")
        db.add(seller_prof)
    else:
        # Update seller plan & AI intelligence quotas
        seller.plan = target_plan
        seller.product_limit = 99999
        if target_plan == "PRO":
            seller.ai_queries_limit = 100
        else:
            seller.ai_queries_limit = 99999
            
        seller.is_verified = True
        seller.updated_at = datetime.utcnow()
        
    # Also record in subscriptions and payments
    sub = Subscription(
        user_id=current_user.id,
        status="ACTIVE"
    )
    db.add(sub)
    db.flush()
    
    payment = Payment(
        user_id=current_user.id,
        subscription_id=sub.id,
        amount=amount,
        currency="UZS",
        provider=upgrade_in.payment_method.upper(),
        status="SUCCESS",
        transaction_id=f"TXN-{uuid.uuid4().hex[:10].upper()}"
    )
    db.add(payment)
    
    limit_text = "kunlik 100 ta chuqur AI tahlil va prognozlar" if target_plan == "PRO" else "cheksiz AI tahlil va avtomatlashtirilgan arbitraj"
    notif = Notification(
        user_id=current_user.id,
        title=f"Tabriklaymiz! '{target_plan}' tarifi faollashtirildi",
        message=f"{upgrade_in.payment_method.upper()} to'lov tizimi orqali {amount:,.0f} so'm muvaffaqiyatli qabul qilindi. Sizga {limit_text} imkoniyati taqdim etildi.",
        is_read=False,
        link="/profile"
    )
    db.add(notif)
    db.commit()
    
    return {
        "success": True,
        "message": f"{target_plan} tarifi muvaffaqiyatli faollashtirildi!",
        "plan": seller.plan,
        "ai_queries_limit": seller.ai_queries_limit,
        "paid_amount": amount,
        "payment_method": upgrade_in.payment_method
    }

