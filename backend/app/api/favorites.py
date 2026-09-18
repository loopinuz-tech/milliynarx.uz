from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.db.session import get_db
from backend.app.db.models import User, Favorite, Product
from backend.app.api.auth import get_current_user
from backend.app.schemas.schemas import ProductOut

router = APIRouter(prefix="/favorites", tags=["favorites"])

@router.get("")
def get_user_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    favs = db.query(Favorite).filter(
        Favorite.user_id == current_user.id
    ).order_by(desc(Favorite.created_at)).all()
    
    result = []
    for f in favs:
        p = f.product
        if not p:
            continue
        primary_img = next((img.image_url for img in p.images if img.is_primary), None)
        if not primary_img and p.images:
            primary_img = p.images[0].image_url
            
        result.append({
            "favorite_id": f.id,
            "product_id": p.id,
            "name": p.name,
            "seller_name": p.seller.store_name if p.seller else None,
            "price": p.price,
            "old_price": p.old_price,
            "availability": p.availability,
            "image": primary_img,
            "created_at": f.created_at
        })
    return result

@router.post("/{product_id}")
def toggle_favorite(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
        
    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.product_id == product_id
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return {"favorited": False, "message": "Mahsulot sevimlilardan olib tashlandi"}
    else:
        new_fav = Favorite(user_id=current_user.id, product_id=product_id)
        db.add(new_fav)
        db.commit()
        return {"favorited": True, "message": "Mahsulot sevimlilarga qo'shildi"}

@router.delete("/{product_id}")
def remove_favorite(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.product_id == product_id
    ).first()
    if fav:
        db.delete(fav)
        db.commit()
    return {"success": True, "message": "Mahsulot sevimlilardan olib tashlandi"}
