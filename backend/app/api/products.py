import statistics
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc, func
from backend.app.db.session import get_db
from backend.app.db.models import (
    Product, ProductImage, Seller, Category, Brand, PriceHistory, Offer, 
    AnalyticsEvent, Search, SearchResult, SubscriptionPlan
)
from backend.app.schemas.schemas import ProductOut, ProductDetailOut, MarketStatsOut, PriceHistoryOut

router = APIRouter(prefix="/products", tags=["products"])

@router.get("", response_model=List[ProductOut])
def get_products(
    category_id: Optional[str] = None,
    brand_id: Optional[str] = None,
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    condition: Optional[str] = None,
    availability: Optional[str] = None,
    sort_by: Optional[str] = "newest", # newest, price_asc, price_desc
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    # Only return ACTIVE products to public
    query = db.query(Product).filter(Product.status == "ACTIVE")
    
    if category_id:
        cat = db.query(Category).filter(
            or_(Category.id == category_id, Category.slug == category_id, Category.name.ilike(category_id))
        ).first()
        if cat:
            query = query.filter(Product.category_id == cat.id)
        else:
            query = query.filter(Product.category_id == category_id)
    if brand_id:
        br = db.query(Brand).filter(
            or_(Brand.id == brand_id, Brand.slug == brand_id, Brand.name.ilike(brand_id))
        ).first()
        if br:
            query = query.filter(Product.brand_id == br.id)
        else:
            query = query.filter(Product.brand_id == brand_id)
    if location:
        query = query.filter(Product.location.ilike(f"%{location}%"))
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if condition:
        query = query.filter(Product.condition == condition)
    if availability:
        query = query.filter(Product.availability == availability)
        
    if sort_by == "price_asc":
        query = query.order_by(asc(Product.price))
    elif sort_by == "price_desc":
        query = query.order_by(desc(Product.price))
    else: # newest
        query = query.order_by(desc(Product.created_at))
        
    products = query.offset(skip).limit(limit).all()
    
    # Deduplicate so each unique product model appears as exactly ONE card with seller count
    seen_models = set()
    unique_products = []
    for p in products:
        key = p.model.strip().lower() if p.model else p.name.strip().lower()[:25]
        if key in seen_models:
            continue
        seen_models.add(key)
        unique_products.append(p)

    result = []
    for p in unique_products:
        offer_prices = [o.price for o in p.offers if o.price and o.price > 0]
        all_prices = ([p.price] if p.price else []) + offer_prices
        unique_sellers = set([o.seller_id for o in p.offers if o.seller_id] + ([p.seller_id] if p.seller_id else []))
        min_p = min(all_prices) if all_prices else p.price
        max_p = max(all_prices) if all_prices else p.price
        s_count = len(unique_sellers) if unique_sellers else 1

        result.append(ProductOut(
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
            price=min_p,
            old_price=p.old_price,
            min_price=min_p,
            max_price=max_p,
            sellers_count=s_count,
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
        ))
    return result

@router.get("/search", response_model=List[ProductOut])
def search_products(
    q: str = Query(..., min_length=1),
    category_id: Optional[str] = None,
    brand_id: Optional[str] = None,
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    condition: Optional[str] = None,
    sort_by: Optional[str] = "relevant",
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    request: Request = None,
    db: Session = Depends(get_db)
):
    search_term = f"%{q.strip()}%"
    
    # Query matching across name, brand, model, sku, barcode, description
    base_filter = and_(
        Product.status == "ACTIVE",
        or_(
            Product.name.ilike(search_term),
            Product.model.ilike(search_term),
            Product.sku.ilike(search_term),
            Product.barcode.ilike(search_term),
            Product.description.ilike(search_term)
        )
    )
    
    query = db.query(Product).filter(base_filter)
    
    if category_id:
        cat = db.query(Category).filter(
            or_(Category.id == category_id, Category.slug == category_id, Category.name.ilike(category_id))
        ).first()
        if cat:
            query = query.filter(Product.category_id == cat.id)
        else:
            query = query.filter(Product.category_id == category_id)
    if brand_id:
        br = db.query(Brand).filter(
            or_(Brand.id == brand_id, Brand.slug == brand_id, Brand.name.ilike(brand_id))
        ).first()
        if br:
            query = query.filter(Product.brand_id == br.id)
        else:
            query = query.filter(Product.brand_id == brand_id)
    if location:
        query = query.filter(Product.location.ilike(f"%{location}%"))
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if condition:
        query = query.filter(Product.condition == condition)
        
    if sort_by == "price_asc":
        query = query.order_by(asc(Product.price))
    elif sort_by == "price_desc":
        query = query.order_by(desc(Product.price))
    else:
        query = query.order_by(desc(Product.updated_at))
        
    products = query.offset(skip).limit(limit).all()
    total_found = query.count()
    
    # Log real search in database
    try:
        ip = request.client.host if request and request.client else None
        search_log = Search(
            query=q.strip(),
            result_count=total_found,
            ip_address=ip
        )
        db.add(search_log)
        db.commit()
    except Exception:
        db.rollback()
        
    # Deduplicate search results
    seen_models = set()
    unique_products = []
    for p in products:
        key = p.model.strip().lower() if p.model else p.name.strip().lower()[:25]
        if key in seen_models:
            continue
        seen_models.add(key)
        unique_products.append(p)

    result = []
    for p in unique_products:
        offer_prices = [o.price for o in p.offers if o.price and o.price > 0]
        all_prices = ([p.price] if p.price else []) + offer_prices
        unique_sellers = set([o.seller_id for o in p.offers if o.seller_id] + ([p.seller_id] if p.seller_id else []))
        min_p = min(all_prices) if all_prices else p.price
        max_p = max(all_prices) if all_prices else p.price
        s_count = len(unique_sellers) if unique_sellers else 1

        result.append(ProductOut(
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
            price=min_p,
            old_price=p.old_price,
            min_price=min_p,
            max_price=max_p,
            sellers_count=s_count,
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
        ))
    return result

@router.get("/suggest")
def get_search_suggestions(
    q: Optional[str] = Query("", description="Qidiruv so'zi"),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db)
):
    query_text = (q or "").strip()
    
    # If empty query, return popular/latest products and categories
    if not query_text:
        latest_products = db.query(Product).filter(
            Product.status == "ACTIVE"
        ).order_by(desc(Product.created_at)).limit(limit).all()
        
        prods = []
        for p in latest_products:
            primary_img = None
            if p.images:
                prim = next((img.image_url for img in p.images if img.is_primary), None)
                primary_img = prim or (p.images[0].image_url if len(p.images) > 0 else None)
            prods.append({
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "price": p.price,
                "old_price": p.old_price,
                "category_name": p.category.name if p.category else None,
                "category_id": p.category_id,
                "brand_name": p.brand.name if p.brand else None,
                "brand_id": p.brand_id,
                "seller_name": p.seller.store_name if p.seller else None,
                "image_url": primary_img
            })
            
        top_cats = db.query(Category).filter(Category.is_active == True).limit(5).all()
        return {
            "query": "",
            "total_matches": len(prods),
            "products": prods,
            "categories": [{"id": c.id, "name": c.name, "slug": c.slug, "icon": c.icon} for c in top_cats],
            "brands": [],
            "suggestions": [p["name"] for p in prods[:4]]
        }

    # 1. Multi-word search for products joining Brand and Category
    words = query_text.split()
    prod_query = db.query(Product).outerjoin(Brand, Product.brand_id == Brand.id).outerjoin(Category, Product.category_id == Category.id).filter(
        Product.status == "ACTIVE"
    )
    
    word_filters = []
    for w in words:
        term = f"%{w}%"
        word_filters.append(
            or_(
                Product.name.ilike(term),
                Product.model.ilike(term),
                Product.sku.ilike(term),
                Product.barcode.ilike(term),
                Product.description.ilike(term),
                Brand.name.ilike(term),
                Category.name.ilike(term)
            )
        )
    if word_filters:
        prod_query = prod_query.filter(and_(*word_filters))
        
    products = prod_query.order_by(desc(Product.updated_at)).limit(limit).all()
    total_matches = prod_query.count()
    
    suggested_products = []
    for p in products:
        primary_img = None
        if p.images:
            prim = next((img.image_url for img in p.images if img.is_primary), None)
            primary_img = prim or (p.images[0].image_url if len(p.images) > 0 else None)
            
        suggested_products.append({
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "price": p.price,
            "old_price": p.old_price,
            "category_name": p.category.name if p.category else None,
            "category_id": p.category_id,
            "brand_name": p.brand.name if p.brand else None,
            "brand_id": p.brand_id,
            "seller_name": p.seller.store_name if p.seller else None,
            "image_url": primary_img
        })
        
    # 2. Match categories
    search_term = f"%{query_text}%"
    categories = db.query(Category).filter(
        Category.is_active == True,
        or_(
            Category.name.ilike(search_term),
            Category.slug.ilike(search_term)
        )
    ).limit(3).all()
    
    suggested_categories = [
        {
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "icon": c.icon
        } for c in categories
    ]
    
    # 3. Match brands
    brands = db.query(Brand).filter(
        Brand.is_active == True,
        or_(
            Brand.name.ilike(search_term),
            Brand.slug.ilike(search_term)
        )
    ).limit(3).all()
    
    suggested_brands = [
        {
            "id": b.id,
            "name": b.name,
            "slug": b.slug,
            "logo_url": b.logo_url
        } for b in brands
    ]
    
    # 4. Generate Google-like keyword completions (query_suggestions)
    # Distinct suggestions from product names, brands, categories
    suggestions = []
    seen = set()
    
    # Brand suggestions
    for b in suggested_brands:
        if b["name"].lower() not in seen:
            suggestions.append(b["name"])
            seen.add(b["name"].lower())
            
    # Product name suggestions
    for p in suggested_products:
        p_name = p["name"]
        if p_name.lower() not in seen:
            suggestions.append(p_name)
            seen.add(p_name.lower())
        if len(suggestions) >= 6:
            break
            
    # Category suggestions
    for c in suggested_categories:
        if c["name"].lower() not in seen:
            suggestions.append(c["name"])
            seen.add(c["name"].lower())
        if len(suggestions) >= 6:
            break

    return {
        "query": query_text,
        "total_matches": total_matches,
        "products": suggested_products,
        "categories": suggested_categories,
        "brands": suggested_brands,
        "suggestions": suggestions[:6]
    }

@router.get("/category-stats")
def get_categories_stats(db: Session = Depends(get_db)):
    """
    Returns summary metrics for all active categories for top filter cards (Image 1 style).
    """
    category_images = {
        "smartfonlar": "/gadgetjs.png",
        "smartfonlar-va-gadjetlar": "/gadgetjs.png",
        "noutbuklar": "/laptop.png",
        "noutbuklar-va-it-uskunalar": "/laptop.png",
        "maishiy-texnika": "/texnika.png",
        "televizorlar": "/tv.png",
        "televizorlar-va-audio": "/tv.png",
        "qurilish-mollari": "/qurilish.png",
        "qurilish-mollari-va-xomashyo": "/qurilish.png",
        "oziq-ovqat": "/food.png",
        "oziq-ovqat-va-agrosanoat": "/food.png",
        "avto": "/car.png",
        "avtomobil-ehtiyot-qismlari": "/car.png",
        "kiyim": "/clothes.png",
        "kiyim-va-poyabzal": "/clothes.png",
        "mebel": "/mebel.png",
        "mebel-va-interyer-jihozlari": "/mebel.png",
        "tekstil": "/toqimachilik.png",
        "toqimachilik-va-tekstil-xomashyosi": "/toqimachilik.png",
        "agro-texnika": "/qishloq.png",
        "qishloq-xojaligi-va-ogitlar": "/qishloq.png",
        "sanoat-uskunalari": "/sanoat.png",
        "sanoat-uskunalari-va-stanoklar": "/sanoat.png",
        "farmatsevtika": "/tibbiyot.png",
        "tibbiyot-va-farmatsevtika": "/tibbiyot.png",
        "kimyo-polimer": "/kimyo.png",
        "kimyo-mahsulotlari-va-polimerlar": "/kimyo.png",
        "kimyo": "/kimyo.png"
    }

    categories = db.query(Category).filter(Category.is_active == True).all()
    stats = []
    for c in categories:
        prods = db.query(Product).filter(
            Product.category_id == c.id,
            Product.status == "ACTIVE"
        ).all()
        
        prices = [p.price for p in prods if p.price and p.price > 0]
        seller_ids = set(p.seller_id for p in prods if p.seller_id)
        
        min_p = min(prices) if prices else 0
        max_p = max(prices) if prices else 0
        avg_p = sum(prices) / len(prices) if prices else 0
        
        stats.append({
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "icon": c.icon,
            "image_url": category_images.get(c.slug, "/gadgetjs.png"),
            "description": c.description,
            "products_count": len(prods),
            "sellers_count": len(seller_ids),
            "min_price": min_p,
            "max_price": max_p,
            "avg_price": round(avg_p, 2),
            "savings_spread": max_p - min_p
        })
    return stats

@router.get("/price-trends")
def get_market_price_trends(db: Session = Depends(get_db)):
    """
    Returns real aggregated market price trends and spreads over historical checkpoints.
    100% genuine database data from PriceHistory table.
    """
    trends = db.query(
        func.date(PriceHistory.recorded_at).label('date'),
        func.avg(PriceHistory.price).label('avg_price'),
        func.min(PriceHistory.price).label('min_price'),
        func.max(PriceHistory.price).label('max_price'),
        func.count(PriceHistory.id).label('count')
    ).group_by(func.date(PriceHistory.recorded_at)).order_by(func.date(PriceHistory.recorded_at)).all()
    
    result = []
    month_names = {
        '01': 'Yan', '02': 'Fev', '03': 'Mar', '04': 'Apr',
        '05': 'May', '06': 'Iyun', '07': 'Iyul', '08': 'Avg',
        '09': 'Sen', '10': 'Okt', '11': 'Noy', '12': 'Dek'
    }
    for t in trends:
        d_str = str(t.date)
        parts = d_str.split('-')
        label = f"{int(parts[2])} {month_names.get(parts[1], parts[1])}" if len(parts) == 3 else d_str
        avg_val = round(float(t.avg_price or 0))
        min_val = round(float(t.min_price or 0))
        max_val = round(float(t.max_price or 0))
        result.append({
            "date": d_str,
            "label": label,
            "marketPrice": avg_val,
            "bestPrice": min_val,
            "savings": max(0, avg_val - min_val),
            "maxPrice": max_val,
            "samplesCount": t.count
        })
    return result

@router.get("/subscription-plans")
def get_public_subscription_plans(db: Session = Depends(get_db)):
    """
    Returns official Monetization Model plans from database (START, BUSINESS, PRO).
    100% genuine database data.
    """
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    order_map = {"START": 1, "BUSINESS": 2, "PRO": 3}
    sorted_plans = sorted(plans, key=lambda p: order_map.get(p.tier, 99))
    return [
        {
            "id": p.id,
            "tier": p.tier,
            "name": p.name,
            "price_monthly": p.price_monthly,
            "features": p.features,
            "is_active": p.is_active
        }
        for p in sorted_plans
    ]

@router.get("/category/{category_id}/analytics")
def get_category_analytics(category_id: str, db: Session = Depends(get_db)):
    """
    Detailed Market Analytics Hub for a specific Category, addressing Chamber of Commerce Task #19.
    """
    cat = db.query(Category).filter(
        or_(Category.id == category_id, Category.slug == category_id)
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Kategoriya topilmadi")

    prods = db.query(Product).filter(
        Product.category_id == cat.id,
        Product.status == "ACTIVE"
    ).all()

    prices = [p.price for p in prods if p.price and p.price > 0]
    unique_sellers = set(p.seller_id for p in prods if p.seller_id)
    seller_objs = db.query(Seller).filter(Seller.id.in_(unique_sellers)).all() if unique_sellers else []

    min_p = min(prices) if prices else 0
    max_p = max(prices) if prices else 0
    avg_p = sum(prices) / len(prices) if prices else 0
    median_p = statistics.median(prices) if prices else 0
    spread_amt = max_p - min_p
    spread_pct = round((spread_amt / min_p) * 100, 1) if min_p > 0 else 0

    # Aggregate historical price trend points for this category
    product_ids = [p.id for p in prods]
    histories = db.query(PriceHistory).filter(
        PriceHistory.product_id.in_(product_ids)
    ).order_by(asc(PriceHistory.recorded_at)).all()

    # Bucket histories by date into trend points
    date_buckets = {}
    for h in histories:
        d_str = h.recorded_at.strftime("%Y-%m-%d")
        if d_str not in date_buckets:
            date_buckets[d_str] = []
        date_buckets[d_str].append(h.price)

    price_trend = []
    for d_str, d_prices in date_buckets.items():
        price_trend.append({
            "date": d_str,
            "avg_price": round(sum(d_prices) / len(d_prices), 2),
            "min_price": min(d_prices),
            "max_price": max(d_prices),
            "records_count": len(d_prices)
        })

    # Group products by model or name to display comparisons
    grouped = {}
    for p in prods:
        key = p.model or p.name
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(p)

    product_comparisons = []
    for key, p_list in list(grouped.items())[:8]:
        p_prices = [p.price for p in p_list if p.price]
        first_p = p_list[0]
        img_url = first_p.images[0].image_url if first_p.images else None
        p_min = min(p_prices) if p_prices else 0
        p_max = max(p_prices) if p_prices else 0
        p_avg = sum(p_prices) / len(p_prices) if p_prices else 0
        product_comparisons.append({
            "id": first_p.id,
            "name": first_p.name,
            "model": first_p.model,
            "image_url": img_url,
            "min_price": p_min,
            "avg_price": round(p_avg, 2),
            "max_price": p_max,
            "sellers_count": len(p_list),
            "spread": p_max - p_min,
            "spread_pct": round(((p_max - p_min) / p_min) * 100, 1) if p_min > 0 else 0
        })

    # AI Bozor Tahlili va Treyderlik Xulosasi (#19-vazifa: Savdo-sanoat palatasi)
    top_sellers_names = ", ".join([s.store_name for s in seller_objs[:3]])
    ai_summary = (
        f"Codexa AI Bozor Tahlili (Savdo-sanoat palatasi 19-muammo yechimi): '{cat.name}' toifasida "
        f"tasdiqlangan {len(seller_objs)} ta mustaqil savdo subyektlari bo'yicha jami {len(prods)} ta narx taklifi qayd etildi. "
        f"Bozorning o'rtacha benchmark narxi {avg_p:,.0f} so'mni tashkil qilmoqda. Eng qulay taklif {min_p:,.0f} so'm, "
        f"eng yuqori narx esa {max_p:,.0f} so'm bo'lib, narx spredi {spread_amt:,.0f} so'm ({spread_pct}%) ga yetmoqda. "
        f"Asosiy likvid takliflar {top_sellers_names or 'ulgurji markazlar'} tomonidan taqdim etilmoqda. "
        f"Tadbirkorlar va xaridorlar ushbu narx spredidan foydalanib o'rtacha {spread_pct}% gacha xarid xarajatlarini tejashlari mumkin."
    )

    verdict = "BUY_NOW" if spread_pct > 12 else ("FAIR_PRICE" if spread_pct >= 5 else "WAIT")
    recommendation = (
        f"Ushbu toifada ulgurji va B2B xaridlar uchun qulay narx spredi mavjud. Eng arzon benchmark narxidan foydalanib, "
        f"to'g'ridan-to'g'ri birinchi qo'l do'konlar orqali xarid qilish tavsiya etiladi."
    )

    return {
        "category": {
            "id": cat.id,
            "name": cat.name,
            "slug": cat.slug,
            "icon": cat.icon,
            "description": cat.description
        },
        "stats": {
            "total_products": len(prods),
            "total_models": len(grouped),
            "active_sellers_count": len(seller_objs),
            "min_price": min_p,
            "max_price": max_p,
            "avg_price": round(avg_p, 2),
            "median_price": round(median_p, 2),
            "spread_amount": spread_amt,
            "spread_percent": spread_pct
        },
        "price_trend": price_trend,
        "product_comparisons": product_comparisons,
        "sellers": [
            {
                "id": s.id,
                "name": s.store_name,
                "rating": s.rating,
                "city": s.profile.city if hasattr(s, "profile") and s.profile else "Toshkent"
            } for s in seller_objs
        ],
        "ai_analysis": {
            "verdict": verdict,
            "summary": ai_summary,
            "recommendation": recommendation,
            "source": "Codexa AI Bozor Tahlilchisi"
        }
    }

@router.get("/{product_id}/all-sellers")
def get_product_all_sellers(product_id: str, db: Session = Depends(get_db)):
    """
    Returns full list of sellers and competitive offers for this product model (Image 3 style).
    Accepts either product UUID or slug.
    """
    product = db.query(Product).filter(
        or_(Product.id == product_id, Product.slug == product_id)
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")

    sellers_list = []
    seen_sellers = set()

    # 1. Direct offers from Offer table for this product
    offers = db.query(Offer).filter(Offer.product_id == product.id).all()
    for off in offers:
        s = off.seller
        if not s or s.id in seen_sellers:
            continue
        seen_sellers.add(s.id)
        sellers_list.append({
            "product_id": product.id,
            "seller_id": s.id,
            "seller_name": s.store_name,
            "seller_rating": s.rating,
            "seller_city": s.profile.city if hasattr(s, "profile") and s.profile else (product.location or "Toshkent"),
            "price": off.price,
            "old_price": off.old_price,
            "warranty": product.warranty or "12 oy rasmiy",
            "delivery": f"{off.delivery_days} kun ichida" if off.delivery_days else "1 kun ichida",
            "stock": off.stock,
            "condition": off.condition or "NEW",
            "is_current": (s.id == product.seller_id)
        })

    # 2. Primary seller of this product if not already in list
    if product.seller and product.seller.id not in seen_sellers:
        seen_sellers.add(product.seller.id)
        sellers_list.append({
            "product_id": product.id,
            "seller_id": product.seller.id,
            "seller_name": product.seller.store_name,
            "seller_rating": product.seller.rating,
            "seller_city": product.seller.profile.city if hasattr(product.seller, "profile") and product.seller.profile else (product.location or "Toshkent"),
            "price": product.price,
            "old_price": product.old_price,
            "warranty": product.warranty or "12 oy rasmiy",
            "delivery": product.delivery or "1 kun ichida",
            "stock": product.stock,
            "condition": product.condition or "NEW",
            "is_current": True
        })

    # 3. Competing products with same model or name
    comp_products = db.query(Product).filter(
        Product.status == "ACTIVE",
        Product.id != product.id,
        or_(
            and_(Product.model == product.model, Product.model.isnot(None), Product.model != ""),
            Product.name == product.name
        )
    ).all()
    for cp in comp_products:
        s = cp.seller
        if not s or s.id in seen_sellers:
            continue
        seen_sellers.add(s.id)
        sellers_list.append({
            "product_id": cp.id,
            "seller_id": s.id,
            "seller_name": s.store_name,
            "seller_rating": s.rating,
            "seller_city": s.profile.city if hasattr(s, "profile") and s.profile else (cp.location or "Toshkent"),
            "price": cp.price,
            "old_price": cp.old_price,
            "warranty": cp.warranty or "12 oy rasmiy",
            "delivery": cp.delivery or "1 kun ichida",
            "stock": cp.stock,
            "condition": cp.condition or "NEW",
            "is_current": False
        })

    prices = [s["price"] for s in sellers_list if s.get("price")]
    min_price = min(prices) if prices else product.price

    for s in sellers_list:
        diff_amount = (s["price"] - min_price) if s.get("price") else 0
        diff_pct = round((diff_amount / min_price) * 100, 1) if min_price > 0 else 0
        s["diff_from_min"] = diff_amount
        s["diff_percent"] = diff_pct
        s["is_lowest"] = (s["price"] == min_price)

    sellers_list.sort(key=lambda x: x["price"])

    return {
        "product_id": product.id,
        "product_name": product.name,
        "model": product.model,
        "category_name": product.category.name if product.category else None,
        "min_price": min_price,
        "max_price": max(prices) if prices else product.price,
        "avg_price": round(sum(prices) / len(prices), 2) if prices else product.price,
        "total_sellers": len(sellers_list),
        "sellers": sellers_list
    }

@router.get("/{product_id}", response_model=ProductDetailOut)
def get_product_detail(product_id: str, db: Session = Depends(get_db)):
    """
    Returns product details, images, price history, and market stats.
    Accepts either product UUID or slug.
    """
    product = db.query(Product).filter(
        or_(Product.id == product_id, Product.slug == product_id)
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
        
    # Record view event
    try:
        event = AnalyticsEvent(
            product_id=product.id,
            event_type="VIEW"
        )
        db.add(event)
        db.commit()
    except Exception:
        db.rollback()

    # Query real price history for this product
    history_records = db.query(PriceHistory).filter(
        PriceHistory.product_id == product.id
    ).order_by(desc(PriceHistory.recorded_at)).all()
    
    price_history = [
        PriceHistoryOut(
            id=h.id,
            price=h.price,
            old_price=h.old_price,
            change_amount=h.change_amount,
            change_percent=h.change_percent,
            source=h.source,
            recorded_at=h.recorded_at
        ) for h in history_records
    ]
    
    # Calculate real market statistics from database across same model/name offers
    # Find all active products or offers matching this product's model or exact name
    comp_query = db.query(Product.price, Product.seller_id).filter(
        Product.status == "ACTIVE",
        or_(
            Product.id == product.id,
            and_(Product.model == product.model, Product.model.isnot(None), Product.model != ""),
            Product.name == product.name
        )
    )
    comp_records = comp_query.all()
    
    prices = [r[0] for r in comp_records if r[0] is not None and r[0] > 0]
    unique_sellers = set(r[1] for r in comp_records if r[1] is not None)
    
    if len(prices) > 0:
        lowest_p = min(prices)
        highest_p = max(prices)
        avg_p = sum(prices) / len(prices)
        median_p = statistics.median(prices)
        p_range = highest_p - lowest_p
        p_dev = statistics.stdev(prices) if len(prices) > 1 else 0.0
        
        # Calculate 30d change from price history if exists
        change_pct = None
        if len(history_records) >= 2:
            first_p = history_records[-1].price
            latest_p = history_records[0].price
            if first_p > 0:
                change_pct = ((latest_p - first_p) / first_p) * 100
                
        market_stats = MarketStatsOut(
            has_data=True,
            lowest_price=lowest_p,
            highest_price=highest_p,
            average_price=round(avg_p, 2),
            median_price=round(median_p, 2),
            price_range=p_range,
            seller_count=len(unique_sellers),
            price_deviation=round(p_dev, 2),
            price_change_percent_30d=round(change_pct, 2) if change_pct is not None else None,
            message=None
        )
    else:
        market_stats = MarketStatsOut(
            has_data=False,
            seller_count=0,
            message="Bozor tahlili uchun yetarli ma'lumot mavjud emas."
        )
        
    # Get other seller offers for this same product/model
    other_offers_records = db.query(Product).filter(
        Product.status == "ACTIVE",
        Product.id != product.id,
        or_(
            and_(Product.model == product.model, Product.model.isnot(None), Product.model != ""),
            Product.name == product.name
        )
    ).limit(5).all()
    
    other_offers = [
        {
            "product_id": o.id,
            "seller_id": o.seller_id,
            "seller_name": o.seller.store_name if o.seller else "Sotuvchi",
            "seller_rating": o.seller.rating if o.seller else 0.0,
            "price": o.price,
            "availability": o.availability,
            "location": o.location,
            "delivery": o.delivery
        } for o in other_offers_records
    ]
    
    product_out = ProductOut(
        id=product.id,
        seller_id=product.seller_id,
        seller_name=product.seller.store_name if product.seller else None,
        seller_rating=product.seller.rating if product.seller else 0.0,
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
    
    return ProductDetailOut(
        product=product_out,
        price_history=price_history,
        market_stats=market_stats,
        other_offers=other_offers
    )
