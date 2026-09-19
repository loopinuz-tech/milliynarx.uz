from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from backend.app.db.session import get_db
from backend.app.db.models import (
    User, Profile, Seller, SellerProfile, Product, ProductImage, PriceHistory, Category, Brand, 
    Search, Payment, Subscription, Notification, DataSource, AuditLog
)
from backend.app.api.auth import require_role
from backend.app.core.security import get_password_hash
from backend.app.schemas.schemas import (
    AdminMetricsOut, ProductOut, ProductCreate, CategoryCreate, CategoryUpdate, BrandCreate, BrandUpdate, 
    ProductUpdate, UserOut, AdminUserUpdate
)
from backend.app.core.slug import generate_unique_slug

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/metrics", response_model=AdminMetricsOut)
def get_admin_metrics(
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_sellers = db.query(Seller).count()
    total_buyers = db.query(User).filter(User.role == "BUYER").count()
    total_products = db.query(Product).count()
    active_products = db.query(Product).filter(Product.status == "ACTIVE").count()
    pending_sellers = db.query(Seller).filter(Seller.status == "PENDING").count()
    pending_products = db.query(Product).filter(Product.status == "PENDING_APPROVAL").count()
    total_searches = db.query(Search).count()
    
    # Real revenue from successful payments
    revenue_sum = db.query(func.sum(Payment.amount)).filter(Payment.status == "SUCCESS").scalar()
    total_revenue = float(revenue_sum or 0.0)
    
    active_subscriptions = db.query(Subscription).filter(Subscription.status == "ACTIVE").count()
    
    return AdminMetricsOut(
        total_users=total_users,
        total_sellers=total_sellers,
        total_buyers=total_buyers,
        total_products=total_products,
        active_products=active_products,
        pending_sellers=pending_sellers,
        pending_products=pending_products,
        total_searches=total_searches,
        total_revenue=total_revenue,
        active_subscriptions=active_subscriptions
    )

@router.get("/trends")
def get_admin_trends(
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Returns platform-level real trends for searches, users, and price sync events.
    100% genuine database data.
    """
    sync_rows = db.query(
        func.date(PriceHistory.recorded_at).label('date'),
        func.count(PriceHistory.id).label('synced_count')
    ).group_by(func.date(PriceHistory.recorded_at)).order_by(func.date(PriceHistory.recorded_at)).all()
    
    search_rows = db.query(
        func.date(Search.created_at).label('date'),
        func.count(Search.id).label('search_count')
    ).group_by(func.date(Search.created_at)).all()
    search_map = {str(r.date): r.search_count for r in search_rows}
    
    user_rows = db.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('user_count')
    ).group_by(func.date(User.created_at)).all()
    user_map = {str(r.date): r.user_count for r in user_rows}

    month_names = {
        '01': 'Yan', '02': 'Fev', '03': 'Mar', '04': 'Apr',
        '05': 'May', '06': 'Iyun', '07': 'Iyul', '08': 'Avg',
        '09': 'Sen', '10': 'Okt', '11': 'Noy', '12': 'Dek'
    }

    trends = []
    for r in sync_rows:
        d_str = str(r.date)
        parts = d_str.split('-')
        label = f"{int(parts[2])} {month_names.get(parts[1], parts[1])}" if len(parts) == 3 else d_str
        trends.append({
            "date": d_str,
            "label": label,
            "syncedPrices": r.synced_count,
            "searches": search_map.get(d_str, 0),
            "newUsers": user_map.get(d_str, 0)
        })
    return trends

@router.get("/sellers")
def get_admin_sellers(
    status_filter: Optional[str] = None,
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    query = db.query(Seller)
    if status_filter:
        query = query.filter(Seller.status == status_filter)
    sellers = query.order_by(desc(Seller.created_at)).all()
    
    return [
        {
            "id": s.id,
            "user_id": s.user_id,
            "store_name": s.store_name,
            "slug": s.slug,
            "business_reg_number": s.business_reg_number,
            "tax_id": s.tax_id,
            "status": s.status,
            "rating": s.rating,
            "is_verified": s.is_verified,
            "created_at": s.created_at,
            "email": s.user.email if s.user else None,
            "phone": s.user.phone if s.user else None,
            "city": s.profile.city if s.profile else "Toshkent",
            "products_count": len(s.products)
        } for s in sellers
    ]

@router.patch("/sellers/{seller_id}/status")
def update_seller_status(
    seller_id: str,
    new_status: str = Query(..., pattern="^(APPROVED|REJECTED|SUSPENDED|PENDING)$"),
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Sotuvchi topilmadi")
        
    old_status = seller.status
    seller.status = new_status
    if new_status == "APPROVED":
        seller.is_verified = True
    seller.updated_at = datetime.utcnow()
    
    # Send notification to seller
    status_uz = {
        "APPROVED": "tasdiqlandi! Endi mahsulot qo'shishingiz mumkin.",
        "REJECTED": "rad etildi.",
        "SUSPENDED": "to'xtatildi.",
        "PENDING": "kutilmoqda."
    }.get(new_status, new_status)
    
    notif = Notification(
        user_id=seller.user_id,
        title=f"Do'kon holati o'zgartirildi: {new_status}",
        message=f"'{seller.store_name}' do'koningiz maqomi {status_uz}",
        type="APPROVAL",
        link="/seller"
    )
    db.add(notif)
    
    # Audit log
    audit = AuditLog(
        user_id=admin_user.id,
        action="UPDATE_SELLER_STATUS",
        entity_type="SELLER",
        entity_id=seller.id,
        old_values={"status": old_status},
        new_values={"status": new_status}
    )
    db.add(audit)
    
    db.commit()
    db.refresh(seller)
    return {"message": f"Sotuvchi holati {new_status} ga o'zgartirildi", "status": seller.status}

@router.get("/sellers/{seller_id}/details")
def get_seller_details(
    seller_id: str,
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Sotuvchi topilmadi")
        
    return {
        "id": seller.id,
        "user_id": seller.user_id,
        "store_name": seller.store_name,
        "slug": seller.slug,
        "business_reg_number": seller.business_reg_number,
        "tax_id": seller.tax_id,
        "status": seller.status,
        "rating": seller.rating,
        "rating_count": seller.rating_count,
        "is_verified": seller.is_verified,
        "created_at": seller.created_at,
        "email": seller.user.email if seller.user else None,
        "phone": seller.user.phone if seller.user else None,
        "description": seller.profile.description if seller.profile else None,
        "logo_url": seller.profile.logo_url if seller.profile else None,
        "address": seller.profile.address if seller.profile else None,
        "city": seller.profile.city if seller.profile else "Xorazm",
        "website": seller.profile.website if seller.profile else None,
        "contact_phone": seller.profile.contact_phone if seller.profile else None,
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "stock": p.stock,
                "status": p.status,
                "image_url": p.images[0].image_url if p.images else None
            } for p in seller.products
        ]
    }

@router.delete("/sellers/{seller_id}")
def delete_seller(
    seller_id: str,
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Sotuvchi do'koni topilmadi")
        
    store_name = seller.store_name
    seller_user = seller.user
    
    # Remove related price history entries
    db.query(PriceHistory).filter(PriceHistory.seller_id == seller.id).delete()
    
    # Audit log before deletion
    audit = AuditLog(
        user_id=admin_user.id,
        action="DELETE_SELLER",
        entity_type="SELLER",
        entity_id=seller.id,
        old_values={"store_name": store_name, "user_id": seller.user_id},
        new_values=None
    )
    db.add(audit)
    
    # Demote seller's user role to BUYER if applicable
    if seller_user and seller_user.role == "SELLER":
        seller_user.role = "BUYER"
    
    db.delete(seller)
    db.commit()
    return {"message": f"'{store_name}' do'koni va barcha tovarlari muvaffaqiyatli o'chirildi", "id": seller_id}

@router.get("/products", response_model=List[ProductOut])
def get_admin_products(
    status_filter: Optional[str] = None,
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if status_filter:
        query = query.filter(Product.status == status_filter)
    products = query.order_by(desc(Product.created_at)).all()
    
    return [
        ProductOut(
            id=p.id,
            seller_id=p.seller_id,
            seller_name=p.seller.store_name if p.seller else None,
            seller_rating=p.seller.rating if p.seller else 0.0,
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

@router.patch("/products/{product_id}/status")
def update_product_status(
    product_id: str,
    new_status: str = Query(..., pattern="^(ACTIVE|REJECTED|ARCHIVED|DRAFT|PENDING_APPROVAL)$"),
    rejection_reason: Optional[str] = None,
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
        
    old_status = product.status
    product.status = new_status
    if rejection_reason:
        product.rejection_reason = rejection_reason
    product.updated_at = datetime.utcnow()
    
    # Notify seller
    status_uz = "tasdiqlandi va platformada faol bo'ldi" if new_status == "ACTIVE" else "rad etildi"
    notif = Notification(
        user_id=product.seller.user_id,
        title=f"Mahsulot holati: {new_status}",
        message=f"'{product.name}' mahsuloti {status_uz}. {f'Sabab: {rejection_reason}' if rejection_reason else ''}",
        type="APPROVAL",
        link=f"/seller/products"
    )
    db.add(notif)
    
    # Audit log
    audit = AuditLog(
        user_id=admin_user.id,
        action="UPDATE_PRODUCT_STATUS",
        entity_type="PRODUCT",
        entity_id=product.id,
        old_values={"status": old_status},
        new_values={"status": new_status, "rejection_reason": rejection_reason}
    )
    db.add(audit)
    
    db.commit()
    return {"message": f"Mahsulot holati {new_status} ga o'zgartirildi", "status": product.status}

@router.post("/products", response_model=ProductOut)
def create_admin_product(
    product_in: ProductCreate,
    seller_id: Optional[str] = Query(None),
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    target_seller = None
    if seller_id:
        target_seller = db.query(Seller).filter(Seller.id == seller_id).first()
    elif product_in.seller_id:
        target_seller = db.query(Seller).filter(Seller.id == product_in.seller_id).first()
        
    if not target_seller:
        # Check if admin has a seller record
        target_seller = db.query(Seller).filter(Seller.user_id == admin_user.id).first()
        if not target_seller:
            # Create official platform seller for admin
            target_seller = Seller(
                user_id=admin_user.id,
                store_name="Milliy Narx Rasmiy Do'koni",
                slug="milliy-narx-rasmiy",
                status="APPROVED",
                rating=5.0,
                rating_count=1,
                is_verified=True
            )
            db.add(target_seller)
            db.flush()
            
            seller_prof = SellerProfile(
                seller_id=target_seller.id,
                description="Milliy Narx platformasining rasmiy kafolatlangan mahsulotlari",
                city="Toshkent"
            )
            db.add(seller_prof)
            db.flush()

    slug = generate_unique_slug(db, Product, product_in.name)
        
    product = Product(
        seller_id=target_seller.id,
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
        currency=product_in.currency or "UZS",
        stock=product_in.stock,
        availability=product_in.availability or "IN_STOCK",
        condition=product_in.condition or "NEW",
        location=product_in.location or "Toshkent",
        warranty=product_in.warranty,
        delivery=product_in.delivery,
        specifications=product_in.specifications,
        status="ACTIVE"
    )
    db.add(product)
    db.flush()
    
    if product_in.images:
        for idx, img_url in enumerate(product_in.images):
            if img_url and img_url.strip():
                img = ProductImage(
                    product_id=product.id,
                    image_url=img_url.strip(),
                    is_primary=(idx == 0),
                    display_order=idx
                )
                db.add(img)
            
    price_entry = PriceHistory(
        product_id=product.id,
        seller_id=target_seller.id,
        price=product.price,
        old_price=product.old_price,
        change_amount=0.0,
        change_percent=0.0,
        source="ADMIN_MANUAL",
        recorded_at=datetime.utcnow()
    )
    db.add(price_entry)
    
    audit = AuditLog(
        user_id=admin_user.id,
        action="CREATE_PRODUCT",
        entity_type="PRODUCT",
        entity_id=product.id,
        old_values=None,
        new_values={"name": product.name, "price": product.price, "seller": target_seller.store_name}
    )
    db.add(audit)
    
    db.commit()
    db.refresh(product)
    
    return ProductOut(
        id=product.id,
        seller_id=product.seller_id,
        seller_name=target_seller.store_name,
        seller_rating=target_seller.rating,
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
def delete_admin_product(
    product_id: str,
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
        
    audit = AuditLog(
        user_id=admin_user.id,
        action="DELETE_PRODUCT",
        entity_type="PRODUCT",
        entity_id=product.id,
        old_values={"name": product.name, "seller_id": product.seller_id, "price": product.price},
        new_values=None
    )
    db.add(audit)
    
    db.delete(product)
    db.commit()
    return {"message": "Mahsulot administrator tomonidan muvaffaqiyatli o'chirildi", "id": product_id}

@router.get("/users")
def get_admin_users(
    role: Optional[str] = None,
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    users = query.order_by(desc(User.created_at)).all()
    
    return [
        {
            "id": u.id,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "created_at": u.created_at,
            "full_name": u.profile.full_name if u.profile else None,
            "store_name": u.seller.store_name if u.seller else None
        } for u in users
    ]

@router.patch("/users/{user_id}")
def update_admin_user(
    user_id: str,
    user_in: AdminUserUpdate,
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
        
    old_values = {
        "role": user.role,
        "is_active": user.is_active,
        "phone": user.phone,
        "full_name": user.profile.full_name if user.profile else None
    }
    
    if user_in.full_name is not None:
        if not user.profile:
            user.profile = Profile(user_id=user.id, full_name=user_in.full_name)
            db.add(user.profile)
        else:
            user.profile.full_name = user_in.full_name
            
    if user_in.phone is not None:
        user.phone = user_in.phone
        if user.profile:
            user.profile.phone = user_in.phone
            
    if user_in.role is not None:
        if user_in.role not in ["BUYER", "SELLER", "ADMIN"]:
            raise HTTPException(status_code=400, detail="Noto'g'ri rol kiritildi")
        user.role = user_in.role
        
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
        
    user.updated_at = datetime.utcnow()
    
    audit = AuditLog(
        user_id=admin_user.id,
        action="UPDATE_USER",
        entity_type="USER",
        entity_id=user.id,
        old_values=old_values,
        new_values=user_in.dict(exclude_unset=True)
    )
    db.add(audit)
    
    db.commit()
    db.refresh(user)
    
    return {
        "id": user.id,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "created_at": user.created_at,
        "full_name": user.profile.full_name if user.profile else None,
        "store_name": user.seller.store_name if user.seller else None
    }

@router.delete("/users/{user_id}")
def delete_admin_user(
    user_id: str,
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=400, 
            detail="O'zingizning administrator akkauntingizni o'chira olmaysiz!"
        )
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
        
    email = user.email
    user_role = user.role
    
    # If user has a seller, delete price histories first
    if user.seller:
        db.query(PriceHistory).filter(PriceHistory.seller_id == user.seller.id).delete()
        
    # Unlink user from audit logs so FK ondelete doesn't conflict
    db.query(AuditLog).filter(AuditLog.user_id == user.id).update({AuditLog.user_id: None})
    
    audit = AuditLog(
        user_id=admin_user.id,
        action="DELETE_USER",
        entity_type="USER",
        entity_id=user.id,
        old_values={"email": email, "role": user_role},
        new_values=None
    )
    db.add(audit)
    
    db.delete(user)
    db.commit()
    
    return {"message": f"Foydalanuvchi '{email}' muvaffaqiyatli o'chirildi", "id": user_id}

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).filter(Category.is_active == True).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "icon": c.icon,
            "description": c.description,
            "products_count": db.query(Product).filter(Product.category_id == c.id, Product.status == "ACTIVE").count()
        } for c in categories
    ]

@router.post("/categories")
def create_category(
    category_in: Optional[CategoryCreate] = None,
    name: Optional[str] = Query(None),
    icon: Optional[str] = Query("Box"),
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    cat_name = category_in.name if category_in else name
    if not cat_name:
        raise HTTPException(status_code=400, detail="Kategoriya nomi talab qilinadi")
        
    cat_icon = category_in.icon if category_in and category_in.icon else icon or "Box"
    cat_desc = category_in.description if category_in else None
    parent_id = category_in.parent_id if category_in else None
    
    slug = generate_unique_slug(db, Category, cat_name)
    category = Category(
        name=cat_name,
        slug=slug,
        icon=cat_icon,
        description=cat_desc,
        parent_id=parent_id,
        is_active=True
    )
    db.add(category)
    
    audit = AuditLog(
        user_id=admin_user.id,
        action="CREATE_CATEGORY",
        entity_type="CATEGORY",
        entity_id=category.id,
        old_values=None,
        new_values={"name": cat_name, "slug": slug}
    )
    db.add(audit)
    
    db.commit()
    db.refresh(category)
    return category

@router.patch("/categories/{category_id}")
def update_category(
    category_id: str,
    category_in: CategoryUpdate,
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Kategoriya topilmadi")
        
    old_data = {"name": category.name, "icon": category.icon}
    update_data = category_in.dict(exclude_unset=True)
    
    if "name" in update_data and update_data["name"]:
        category.name = update_data["name"]
        category.slug = generate_unique_slug(db, Category, update_data["name"], current_id=category.id)
    if "icon" in update_data:
        category.icon = update_data["icon"]
    if "description" in update_data:
        category.description = update_data["description"]
    if "parent_id" in update_data:
        category.parent_id = update_data["parent_id"]
    if "is_active" in update_data and update_data["is_active"] is not None:
        category.is_active = update_data["is_active"]
        
    category.updated_at = datetime.utcnow()
    
    audit = AuditLog(
        user_id=admin_user.id,
        action="UPDATE_CATEGORY",
        entity_type="CATEGORY",
        entity_id=category.id,
        old_values=old_data,
        new_values=update_data
    )
    db.add(audit)
    
    db.commit()
    db.refresh(category)
    return category

@router.delete("/categories/{category_id}")
def delete_category(
    category_id: str,
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Kategoriya topilmadi")
        
    # Reassign or disassociate products to prevent orphaned integrity issues
    db.query(Product).filter(Product.category_id == category_id).update({Product.category_id: None})
    db.query(Category).filter(Category.parent_id == category_id).update({Category.parent_id: None})
    
    audit = AuditLog(
        user_id=admin_user.id,
        action="DELETE_CATEGORY",
        entity_type="CATEGORY",
        entity_id=category.id,
        old_values={"name": category.name},
        new_values=None
    )
    db.add(audit)
    
    db.delete(category)
    db.commit()
    return {"message": "Kategoriya muvaffaqiyatli o'chirildi", "id": category_id}

@router.get("/brands")
def get_brands(db: Session = Depends(get_db)):
    brands = db.query(Brand).filter(Brand.is_active == True).all()
    return [
        {
            "id": b.id,
            "name": b.name,
            "slug": b.slug,
            "logo_url": b.logo_url
        } for b in brands
    ]

@router.post("/brands")
def create_brand(
    brand_in: BrandCreate,
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    slug = generate_unique_slug(db, Brand, brand_in.name)
    brand = Brand(
        name=brand_in.name,
        slug=slug,
        logo_url=brand_in.logo_url,
        is_active=True
    )
    db.add(brand)
    
    audit = AuditLog(
        user_id=admin_user.id,
        action="CREATE_BRAND",
        entity_type="BRAND",
        entity_id=brand.id,
        old_values=None,
        new_values={"name": brand_in.name, "slug": slug}
    )
    db.add(audit)
    
    db.commit()
    db.refresh(brand)
    return brand

@router.patch("/brands/{brand_id}")
def update_brand(
    brand_id: str,
    brand_in: BrandUpdate,
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brend topilmadi")
        
    old_data = {"name": brand.name, "logo_url": brand.logo_url}
    update_data = brand_in.dict(exclude_unset=True)
    
    if "name" in update_data and update_data["name"]:
        brand.name = update_data["name"]
        brand.slug = generate_unique_slug(db, Brand, update_data["name"], current_id=brand.id)
    if "logo_url" in update_data:
        brand.logo_url = update_data["logo_url"]
    if "is_active" in update_data and update_data["is_active"] is not None:
        brand.is_active = update_data["is_active"]
        
    brand.updated_at = datetime.utcnow()
    
    audit = AuditLog(
        user_id=admin_user.id,
        action="UPDATE_BRAND",
        entity_type="BRAND",
        entity_id=brand.id,
        old_values=old_data,
        new_values=update_data
    )
    db.add(audit)
    
    db.commit()
    db.refresh(brand)
    return brand

@router.delete("/brands/{brand_id}")
def delete_brand(
    brand_id: str,
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brend topilmadi")
        
    # Reassign products brand_id to null
    db.query(Product).filter(Product.brand_id == brand_id).update({Product.brand_id: None})
    
    audit = AuditLog(
        user_id=admin_user.id,
        action="DELETE_BRAND",
        entity_type="BRAND",
        entity_id=brand.id,
        old_values={"name": brand.name},
        new_values=None
    )
    db.add(audit)
    
    db.delete(brand)
    db.commit()
    return {"message": "Brend muvaffaqiyatli o'chirildi", "id": brand_id}

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "old_values": l.old_values,
            "new_values": l.new_values,
            "created_at": l.created_at
        } for l in logs
    ]

@router.post("/init-db")
def initialize_system(db: Session = Depends(get_db)):
    """Initializes primary admin account and core taxonomy if not present."""
    admin_email = "admin@milliynarx.uz"
    admin = db.query(User).filter(User.email == admin_email).first()
    
    admin_created = False
    if not admin:
        admin = User(
            email=admin_email,
            phone="+998901234567",
            hashed_password=get_password_hash("AdminPass2026!"),
            role="ADMIN",
            is_active=True,
            is_verified=True
        )
        db.add(admin)
        db.flush()
        
        profile = Profile(
            user_id=admin.id,
            full_name="Bosh Administrator",
            phone="+998901234567"
        )
        db.add(profile)
        admin_created = True

    # Seed core categories if empty
    if db.query(Category).count() == 0:
        base_cats = [
            ("Smartfonlar va telefonlar", "smartfonlar", "Phone"),
            ("Noutbuklar va kompyuterlar", "noutbuklar", "Laptop"),
            ("Maishiy texnika", "maishiy-texnika", "Home"),
            ("Televizorlar va audio", "televizorlar", "Tv"),
            ("Kiyim va poyabzal", "kiyim", "TShirt"),
            ("Avtomobil mollari", "avto", "Car")
        ]
        for name, slug, icon in base_cats:
            cat = Category(name=name, slug=slug, icon=icon, is_active=True)
            db.add(cat)
            
    # Seed core brands if empty
    if db.query(Brand).count() == 0:
        base_brands = ["Apple", "Samsung", "Xiaomi", "Artel", "Sony", "LG", "HP", "Lenovo"]
        for b in base_brands:
            brand = Brand(name=b, slug=b.lower(), is_active=True)
            db.add(brand)

    # Seed data sources with real NOT_CONFIGURED status
    if db.query(DataSource).count() == 0:
        sources = [
            ("Uzum Market", "UZUM", "NOT_CONFIGURED"),
            ("Yandex Market", "YANDEX_MARKET", "NOT_CONFIGURED"),
            ("Ozon", "OZON", "NOT_CONFIGURED"),
            ("Wildberries", "WILDBERRIES", "NOT_CONFIGURED"),
            ("Manual Sotuvchilar", "MANUAL_SELLER", "CONNECTED")
        ]
        for name, code, status in sources:
            ds = DataSource(name=name, adapter_code=code, status=status)
            db.add(ds)

    db.commit()
    return {
        "status": "INITIALIZED",
        "admin_email": admin_email,
        "admin_created": admin_created
    }
