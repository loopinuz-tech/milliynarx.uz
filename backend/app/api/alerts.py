from typing import List
from datetime import datetime
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.db.session import get_db
from backend.app.db.models import User, PriceAlert, Notification, Product, Offer
from backend.app.api.auth import get_current_user
from backend.app.schemas.schemas import PriceAlertCreate, PriceAlertOut
from backend.app.services.telegram_bot import send_telegram_notification, format_price

router = APIRouter(prefix="/alerts", tags=["alerts"])
logger = logging.getLogger("alerts_api")

@router.get("", response_model=List[PriceAlertOut])
def get_user_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alerts = db.query(PriceAlert).filter(
        PriceAlert.user_id == current_user.id
    ).order_by(desc(PriceAlert.created_at)).all()
    
    return [
        PriceAlertOut(
            id=a.id,
            product_id=a.product_id,
            product_name=a.product.name if a.product else None,
            product_price=a.product.price if a.product else None,
            target_price=a.target_price,
            is_active=a.is_active,
            triggered=a.triggered,
            triggered_at=a.triggered_at,
            created_at=a.created_at
        ) for a in alerts
    ]

@router.post("", response_model=PriceAlertOut)
def create_price_alert(
    alert_in: PriceAlertCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == alert_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
        
    alert = PriceAlert(
        user_id=current_user.id,
        product_id=product.id,
        target_price=alert_in.target_price,
        is_active=True,
        triggered=False
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    # Notify user on Telegram if connected
    try:
        send_telegram_notification(
            user_id=current_user.id,
            title="🔔 Yangi narx kuzatuvi o'rnatildi",
            message=(
                f"📦 <b>{product.name}</b>\n"
                f"💰 Joriy narx: <b>{format_price(product.price)}</b>\n"
                f"🎯 Maqsadli narx: <b>{format_price(alert.target_price)}</b>\n\n"
                f"<i>Mahsulot narxi siz ko'rsatgan darajaga yetganda, darhol ushbu bot orqali xabar beramiz.</i>"
            ),
            product_id=product.id
        )
    except Exception as e:
        logger.warning(f"Telegram notification on alert create failed: {e}")
    
    return PriceAlertOut(
        id=alert.id,
        product_id=alert.product_id,
        product_name=product.name,
        product_price=product.price,
        target_price=alert.target_price,
        is_active=alert.is_active,
        triggered=alert.triggered,
        triggered_at=alert.triggered_at,
        created_at=alert.created_at
    )

@router.delete("/{alert_id}")
def delete_price_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(PriceAlert).filter(
        PriceAlert.id == alert_id,
        PriceAlert.user_id == current_user.id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Ogohlantirish topilmadi")
        
    db.delete(alert)
    db.commit()
    return {"success": True, "message": "Narx ogohlantirishi o'chirildi"}

@router.post("/test-trigger/{alert_id}")
def test_trigger_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Test a price drop alert trigger.
    Updates alert to triggered status, creates an in-app notification, and sends Telegram alert!
    """
    alert = db.query(PriceAlert).filter(
        PriceAlert.id == alert_id,
        PriceAlert.user_id == current_user.id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Ogohlantirish topilmadi")
    
    product = alert.product
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    
    alert.triggered = True
    alert.triggered_at = datetime.utcnow()
    
    # In-app notification
    notif = Notification(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=f"🔥 Narx tushdi: {product.name}",
        message=f"{product.name} narxi siz kutgan {format_price(alert.target_price)} darajasiga yetdi! Joriy narx: {format_price(product.price)}.",
        type="PRICE_DROP",
        is_read=False,
        link=f"/product/{product.id}"
    )
    db.add(notif)
    db.commit()
    
    # Telegram push notification
    delivered = send_telegram_notification(
        user_id=current_user.id,
        title="🔥 SHOSHILING! NARX TUSHDI!",
        message=(
            f"📦 <b>{product.name}</b>\n\n"
            f"🎉 Narx siz belgilagan <b>{format_price(alert.target_price)}</b> darajasiga yetdi!\n"
            f"💰 Joriy taklif: <b>{format_price(product.price)}</b>\n\n"
            f"<i>Fursatdan foydalanib xarid qilish uchun quyidagi tugmani bosing:</i>"
        ),
        product_id=product.id
    )
    
    return {
        "success": True,
        "delivered_to_telegram": delivered,
        "message": "Narx tushishi bildirishnomasi tizimga va Telegramga muvaffaqiyatli yuborildi!"
    }

@router.post("/check-all")
def check_all_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Scan user's active price alerts against current product prices"""
    alerts = db.query(PriceAlert).filter(
        PriceAlert.user_id == current_user.id,
        PriceAlert.is_active == True,
        PriceAlert.triggered == False
    ).all()
    
    triggered_count = 0
    for a in alerts:
        if a.product and a.product.price and a.product.price <= a.target_price:
            a.triggered = True
            a.triggered_at = datetime.utcnow()
            
            notif = Notification(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                title=f"🔥 Narx tushdi: {a.product.name}",
                message=f"{a.product.name} narxi siz kutgan darajaga yetdi: {format_price(a.product.price)}",
                type="PRICE_DROP",
                is_read=False,
                link=f"/product/{a.product.id}"
            )
            db.add(notif)
            
            send_telegram_notification(
                user_id=current_user.id,
                title="🔥 NARX TUSHDI!",
                message=(
                    f"📦 <b>{a.product.name}</b>\n"
                    f"💰 Yangi arzon narx: <b>{format_price(a.product.price)}</b>\n"
                    f"🎯 Sizning maqsadingiz: {format_price(a.target_price)}"
                ),
                product_id=a.product.id
            )
            triggered_count += 1
            
    db.commit()
    return {"success": True, "checked": len(alerts), "triggered": triggered_count}

@router.get("/notifications")
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(desc(Notification.created_at)).limit(30).all()
    
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "link": n.link,
            "created_at": n.created_at
        } for n in notifs
    ]

@router.patch("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"success": True}
