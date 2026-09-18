from fastapi import APIRouter, Request, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
import requests
import logging
from typing import Dict, Any, Optional

from backend.app.db.session import get_db
from backend.app.db.models import User
from backend.app.core.config import settings
from backend.app.api.auth import get_current_user
from backend.app.services.telegram_bot import (
    process_update, 
    send_message, 
    send_telegram_notification,
    sync_pending_updates,
    BOT_TOKEN, 
    API_BASE
)

router = APIRouter(prefix="/telegram", tags=["telegram"])
logger = logging.getLogger("telegram_api")

class ManualConnectRequest(BaseModel):
    telegram_chat_id: str
    telegram_username: Optional[str] = None

@router.get("/status")
def get_bot_status():
    """Check Telegram bot status and live metadata"""
    try:
        resp = requests.get(f"{API_BASE}/getMe", timeout=8)
        if resp.status_code == 200 and resp.json().get("ok"):
            bot_info = resp.json()["result"]
            return {
                "status": "ONLINE",
                "bot_id": bot_info.get("id"),
                "first_name": bot_info.get("first_name"),
                "username": bot_info.get("username"),
                "bot_url": f"https://t.me/{bot_info.get('username')}",
                "webhook_ready": True
            }
        return {
            "status": "ERROR",
            "detail": "Telegram API did not return ok: true",
            "bot_username": settings.TELEGRAM_BOT_USERNAME
        }
    except Exception as e:
        return {
            "status": "OFFLINE",
            "detail": str(e),
            "bot_username": settings.TELEGRAM_BOT_USERNAME
        }

@router.get("/my-connection")
def get_my_connection(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's Telegram connection status.
    Performs a quick sync of any pending updates to automatically catch recent /start actions.
    """
    try:
        sync_pending_updates(limit=10)
        db.refresh(current_user)
    except Exception as e:
        logger.warning(f"Quick sync in my-connection failed: {e}")

    connected = bool(current_user.telegram_chat_id)
    return {
        "connected": connected,
        "telegram_chat_id": current_user.telegram_chat_id,
        "telegram_username": current_user.telegram_username,
        "telegram_connected_at": current_user.telegram_connected_at,
        "connect_link": f"https://t.me/{settings.TELEGRAM_BOT_USERNAME}?start=link_{current_user.id}",
        "connect_code": current_user.id[:8],
        "bot_username": settings.TELEGRAM_BOT_USERNAME
    }

@router.post("/connect-manual")
def connect_manual(
    req: ManualConnectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually link Telegram Chat ID and username to the authenticated user"""
    clean_id = req.telegram_chat_id.strip()
    if not clean_id:
        raise HTTPException(status_code=400, detail="Telegram Chat ID kiritilmadi")

    current_user.telegram_chat_id = clean_id
    current_user.telegram_username = req.telegram_username.strip() if req.telegram_username else None
    current_user.telegram_connected_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    # Send a confirmation alert to verify the chat_id works
    send_telegram_notification(
        user_id=current_user.id,
        title="🎉 Akkaunt muvaffaqiyatli bog'landi!",
        message=(
            f"Assalomu alaykum!\n"
            f"Sizning <b>Milliy Narx</b> profilingiz (<code>{current_user.email}</code>) ushbu Telegram hisobiga muvaffaqiyatli ulandi.\n\n"
            f"Barcha narx tushishi ogohlantirishlari va chegirmalar shu yerga yetkaziladi!"
        )
    )

    return {
        "success": True,
        "message": "Telegram muvaffaqiyatli bog'landi!",
        "telegram_chat_id": current_user.telegram_chat_id,
        "telegram_username": current_user.telegram_username
    }

@router.post("/disconnect")
def disconnect_telegram(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unlink Telegram account from current user"""
    current_user.telegram_chat_id = None
    current_user.telegram_username = None
    current_user.telegram_connected_at = None
    db.commit()
    return {"success": True, "message": "Telegram hisobi uzildi"}

@router.post("/test-alert")
def send_test_alert(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send an immediate test notification to the user's connected Telegram chat"""
    if not current_user.telegram_chat_id:
        raise HTTPException(
            status_code=400, 
            detail="Telegram hisobingiz hali ulanmagan. Avval botga ulaning!"
        )

    user_name = current_user.email
    if current_user.profile and current_user.profile.full_name:
        user_name = current_user.profile.full_name

    delivered = send_telegram_notification(
        user_id=current_user.id,
        title="🔔 Milliy Narx — Sinov Bildirishnomasi",
        message=(
            f"Hurmatli <b>{user_name}</b>!\n\n"
            f"✅ Sizning Telegram akkauntingiz Milliy Narx tizimi bilan 100% to'g'ri integratsiya qilingan.\n\n"
            f"Endi siz:\n"
            f"• 📉 Narx belgilangan darajadan arzonlashganda;\n"
            f"• 🏷 Do'konlar chegirmalari chiqqanda;\n"
            f"• ⚡ Shaxsiy narx ogohlantirishlaringiz bo'yicha\n\n"
            f"tezkor bildirishnomalarni Telegramingizga qabul qilasiz!"
        )
    )

    if not delivered:
        raise HTTPException(
            status_code=500,
            detail="Telegram orqali xabar yuborishda xatolik. Chat ID to'g'riligini tekshiring."
        )

    return {
        "success": True, 
        "message": "Sinov bildirishnomasi Telegram akkauntingizga muvaffaqiyatli yuborildi!"
    }

@router.get("/sync")
def sync_updates():
    """Manually trigger a sync of pending updates from Telegram API"""
    processed = sync_pending_updates(limit=25)
    return {"ok": True, "processed": processed}

@router.post("/webhook")
async def telegram_webhook(request: Request):
    """
    Webhook handler for Telegram updates in production.
    Telegram calls this endpoint when users send messages to @milliynarxbot.
    """
    try:
        update: Dict[str, Any] = await request.json()
        process_update(update)
        return {"ok": True}
    except Exception as e:
        logger.error(f"Error processing Telegram webhook: {e}")
        return {"ok": False, "error": str(e)}

@router.post("/set-webhook")
def set_webhook(url: str):
    """Register public webhook URL with Telegram API"""
    try:
        resp = requests.post(
            f"{API_BASE}/setWebhook",
            json={"url": f"{url}/api/telegram/webhook"},
            timeout=10
        )
        return resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
