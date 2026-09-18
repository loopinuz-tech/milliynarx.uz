from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import Product
from backend.app.schemas.schemas import ProductOut

router = APIRouter(prefix="/compare", tags=["compare"])

@router.get("")
def compare_products(
    ids: str = Query(..., description="Comma separated list of product IDs (1-5)"),
    db: Session = Depends(get_db)
):
    product_ids = [pid.strip() for pid in ids.split(",") if pid.strip()]
    if len(product_ids) < 1 or len(product_ids) > 5:
        raise HTTPException(
            status_code=400,
            detail="Taqqoslash uchun 1 tadan 5 tagacha mahsulot tanlanishi kerak."
        )
        
    products = db.query(Product).filter(
        Product.id.in_(product_ids),
        Product.status == "ACTIVE"
    ).all()
    
    if len(products) < 1:
        raise HTTPException(
            status_code=404,
            detail="Taqqoslash uchun faol mahsulotlar topilmadi."
        )
        
    # Preserve order of requested IDs
    prod_map = {p.id: p for p in products}
    ordered_products = [prod_map[pid] for pid in product_ids if pid in prod_map]
    
    # Extract all unique specification keys across products (sorted for consistency)
    all_spec_keys = set()
    for p in ordered_products:
        if p.specifications and isinstance(p.specifications, dict):
            for k in p.specifications.keys():
                all_spec_keys.add(k)
    sorted_spec_keys = sorted(list(all_spec_keys))
    
    # Compute differences for each specification key
    specs_diff = {}
    for k in sorted_spec_keys:
        vals = []
        for p in ordered_products:
            val = p.specifications.get(k) if p.specifications and isinstance(p.specifications, dict) else None
            vals.append(str(val) if val is not None else "-")
        # Diff is True if not all values are identical
        specs_diff[k] = len(set(vals)) > 1

    # Find product with lowest price
    lowest_price_id = min(ordered_products, key=lambda p: p.price).id if ordered_products else None

    result = []
    for p in ordered_products:
        primary_img = next((img.image_url for img in p.images if img.is_primary), None)
        if not primary_img and p.images:
            primary_img = p.images[0].image_url
            
        result.append({
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "seller_id": p.seller_id,
            "seller_name": p.seller.store_name if p.seller else None,
            "seller_rating": p.seller.rating if p.seller else 0.0,
            "brand": p.brand.name if p.brand else None,
            "category": p.category.name if p.category else None,
            "model": p.model,
            "price": p.price,
            "old_price": p.old_price,
            "availability": p.availability,
            "condition": p.condition,
            "location": p.location,
            "warranty": p.warranty,
            "delivery": p.delivery,
            "image": primary_img,
            "specifications": p.specifications or {},
            "updated_at": p.updated_at
        })
        
    return {
        "products": result,
        "specification_keys": sorted_spec_keys,
        "specs_diff": specs_diff,
        "lowest_price_id": lowest_price_id
    }
