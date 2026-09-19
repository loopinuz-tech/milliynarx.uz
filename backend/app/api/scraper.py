from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import DataSource, Product, Offer
from backend.app.services.scraper_service import scraper_service

router = APIRouter(prefix="/scraper", tags=["scraper"])

@router.get("/status")
def get_scraper_status(db: Session = Depends(get_db)):
    """Returns the current status of data scrapers and sync statistics"""
    ds = db.query(DataSource).filter(
        (DataSource.adapter_code == 'TEXNOMART') | (DataSource.name.ilike('%texnomart%'))
    ).first()

    texnomart_offers = db.query(Offer).join(Offer.seller).filter(
        Offer.seller.has(slug='texnomart-rasmiy-dokoni')
    ).count()

    total_products = db.query(Product).count()

    return {
        "connected": ds.status == "CONNECTED" if ds else False,
        "status": ds.status if ds else "NOT_CONFIGURED",
        "last_sync_at": ds.last_sync_at if ds else None,
        "adapter_name": "Texnomart.uz Live Web Scraper",
        "texnomart_offers_count": texnomart_offers,
        "total_products_count": total_products
    }

@router.post("/sync-texnomart")
def trigger_texnomart_sync(items_per_category: int = 5, db: Session = Depends(get_db)):
    """
    Triggers live web scraping of Texnomart.uz.
    Scrapes smartphones, laptops, TVs, and appliances.
    Updates existing products and seeds new products with live prices and images.
    """
    try:
        result = scraper_service.sync_texnomart(db, items_per_category=items_per_category)
        return {
            "success": True,
            "message": "Texnomart ma'lumotlari muvaffaqiyatli scrape qilindi va yangilandi",
            **result
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Skraping jarayonida xatolik yuz berdi: {str(e)}"
        )
