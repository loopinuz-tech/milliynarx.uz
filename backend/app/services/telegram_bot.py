import os
import sys
import time
import html
import re
import logging
import requests
import threading
import secrets
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple

# Ensure backend path is accessible
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app.core.config import settings
from backend.app.db.session import SessionLocal
from backend.app.db import models

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("telegram_bot")

BOT_TOKEN = settings.TELEGRAM_BOT_TOKEN or "8802850363:AAHLKqMDEMZ_QSmYXPuop_-gwT-W5NW1D80"
API_BASE = f"https://api.telegram.org/bot{BOT_TOKEN}"
WEB_APP_URL = "https://milliynarx.uz"

# Global offset tracker for polling and sync
_LAST_UPDATE_OFFSET = 0

def send_message(chat_id: int, text: str, reply_markup: Optional[Dict[str, Any]] = None, parse_mode: str = "HTML"):
    """Send text message to Telegram user with automatic HTML fallback"""
    try:
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
            "disable_web_page_preview": False
        }
        if reply_markup:
            payload["reply_markup"] = reply_markup
        
        resp = requests.post(f"{API_BASE}/sendMessage", json=payload, timeout=10)
        result = resp.json()
        if not result.get("ok"):
            # If Telegram complains about entity parsing (e.g. unescaped < or > in names), strip HTML and retry
            if "can't parse entities" in str(result.get("description", "")):
                plain = re.sub(r'<[^>]*>', '', text)
                payload["text"] = plain
                payload.pop("parse_mode", None)
                retry_resp = requests.post(f"{API_BASE}/sendMessage", json=payload, timeout=10)
                return retry_resp.json()
            logger.error(f"Telegram sendMessage failed for {chat_id}: {result}")
        return result
    except Exception as e:
        logger.error(f"Failed to send Telegram message to {chat_id}: {e}")
        return None

def answer_callback(callback_query_id: str, text: str = "", show_alert: bool = False):
    """Acknowledge a Telegram callback query"""
    try:
        requests.post(f"{API_BASE}/answerCallbackQuery", json={
            "callback_query_id": callback_query_id,
            "text": text,
            "show_alert": show_alert
        }, timeout=5)
    except Exception as e:
        logger.warning(f"Failed to answer callback query: {e}")

def format_price(amount: float) -> str:
    """Format number as Uzbek sum (e.g. 2 750 000 so'm)"""
    if not amount:
        return "0 so'm"
    return f"{amount:,.0f} so'm".replace(",", " ")

# ==========================================
# ROLE RESOLUTION & DYNAMIC KEYBOARDS
# ==========================================

def get_user_context(chat_id: int) -> Tuple[Optional[models.User], str, Optional[models.Seller]]:
    """Resolve user, active role, and seller profile from database"""
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.telegram_chat_id == str(chat_id)).first()
        if not user:
            return None, "GUEST", None
        role = user.role or "BUYER"
        seller = user.seller if role == "SELLER" else None
        return user, role, seller
    finally:
        db.close()

def get_buyer_keyboard():
    """Menu tailored for Buyers / Consumers"""
    return {
        "keyboard": [
            [
                {"text": "🔍 Narx qidirish"},
                {"text": "🔔 Mening ogohlantirishlarim"}
            ],
            [
                {"text": "❤️ Sevimlilarim"},
                {"text": "🤖 AI Xarid Maslahatchisi"}
            ],
            [
                {"text": "📊 Bozor Kategoriyalari"},
                {"text": "👤 Profilim va Rol"}
            ]
        ],
        "resize_keyboard": True,
        "is_persistent": True
    }

def get_seller_keyboard():
    """Menu tailored for Merchants / Store Owners (B2B)"""
    return {
        "keyboard": [
            [
                {"text": "🏪 Mening do'konim"},
                {"text": "📦 Mahsulotlarim va narxlar"}
            ],
            [
                {"text": "➕ Narx kiritish / yangilash"},
                {"text": "📊 Raqobatchilar tahlili"}
            ],
            [
                {"text": "🤖 AI Sotuvchi Maslahatchisi"},
                {"text": "👤 Profilim va Rol"}
            ]
        ],
        "resize_keyboard": True,
        "is_persistent": True
    }

def get_admin_keyboard():
    """Menu tailored for Platform Admins & Moderators"""
    return {
        "keyboard": [
            [
                {"text": "📈 Platforma Ko'rsatkichlari"},
                {"text": "⏳ Do'konlar Moderatsiyasi"}
            ],
            [
                {"text": "⚠️ Narx Anomaliyalari"},
                {"text": "🔍 Global Qidiruv"}
            ],
            [
                {"text": "👥 Foydalanuvchilar Statistikasi"},
                {"text": "👤 Profilim va Rol"}
            ]
        ],
        "resize_keyboard": True,
        "is_persistent": True
    }

def get_guest_keyboard():
    """Menu for unlinked guests"""
    return {
        "keyboard": [
            [
                {"text": "🔢 Kirish kodi"},
                {"text": "🔗 Akkauntni bog'lash"}
            ],
            [
                {"text": "🔍 Narx qidirish"},
                {"text": "🤖 AI Maslahatchi"}
            ],
            [
                {"text": "📊 Bozor Kategoriyalari"},
                {"text": "🌐 Milliy Narx Sayti"}
            ]
        ],
        "resize_keyboard": True,
        "is_persistent": True
    }

def get_keyboard_by_role(role: str):
    if role == "ADMIN":
        return get_admin_keyboard()
    elif role == "SELLER":
        return get_seller_keyboard()
    elif role == "BUYER":
        return get_buyer_keyboard()
    return get_guest_keyboard()

# ==========================================
# COMMAND & EVENT HANDLERS
# ==========================================

def handle_start(chat_id: int, user_first_name: str, payload: Optional[str] = None, username: Optional[str] = None):
    """
    Handle /start command.
    Links account if payload is given, otherwise displays tailored role greeting.
    """
    safe_name = html.escape(user_first_name or "Foydalanuvchi")
    
    # 1. Handle deep link linking or instant browser auth
    if payload:
        if payload.startswith("auth_"):
            session_token = payload.strip()
            db = SessionLocal()
            try:
                user = db.query(models.User).filter(models.User.telegram_chat_id == str(chat_id)).first()
                if not user:
                    clean_name = user_first_name or "Foydalanuvchi"
                    username_slug = username or str(chat_id)[-6:]
                    auto_email = f"tg_{username_slug}@milliynarx.uz"
                    if db.query(models.User).filter(models.User.email == auto_email).first():
                        auto_email = f"tg_{chat_id}@milliynarx.uz"
                    
                    from backend.app.core.security import get_password_hash
                    user = models.User(
                        email=auto_email,
                        phone=None,
                        hashed_password=get_password_hash(secrets.token_urlsafe(16)),
                        role="BUYER",
                        is_active=True,
                        is_verified=True,
                        telegram_chat_id=str(chat_id),
                        telegram_username=f"@{username}" if username else user_first_name,
                        telegram_connected_at=datetime.utcnow()
                    )
                    db.add(user)
                    db.flush()
                    profile = models.Profile(user_id=user.id, full_name=clean_name)
                    db.add(profile)
                    db.commit()
                    db.refresh(user)
                else:
                    user.telegram_username = f"@{username}" if username else user_first_name
                    user.telegram_connected_at = datetime.utcnow()
                    db.commit()
                    db.refresh(user)

                from backend.app.core.security import create_access_token
                from backend.app.api.auth import approve_telegram_session
                
                access_token = create_access_token(subject=user.id, role=user.role)
                user_payload = {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role,
                    "is_active": user.is_active,
                    "full_name": user.profile.full_name if user.profile else user_first_name,
                    "store_name": user.seller.store_name if user.seller else None,
                    "seller_status": user.seller.status if user.seller else None,
                    "telegram_chat_id": user.telegram_chat_id,
                    "telegram_username": user.telegram_username
                }
                approve_telegram_session(session_token, access_token, user_payload)

                send_message(
                    chat_id,
                    f"🎉 <b>Muvaffaqiyatli avtorizatsiya!</b>\n\n"
                    f"Assalomu alaykum, <b>{safe_name}</b>!\n"
                    f"🌐 <b>Milliy Narx</b> platformasidagi brauzeringizga muvaffaqiyatli kirdingiz.\n\n"
                    f"Veb-sahifa avtomatik tarzda profilingizni ochadi.",
                    reply_markup=get_keyboard_by_role(user.role)
                )
                return
            finally:
                db.close()

        clean_id = payload.replace("link_", "").strip()
        db = SessionLocal()
        try:
            user = db.query(models.User).filter(
                (models.User.id == clean_id) | (models.User.id.startswith(clean_id))
            ).first()

            if user:
                user.telegram_chat_id = str(chat_id)
                user.telegram_username = f"@{username}" if username else user_first_name
                user.telegram_connected_at = datetime.utcnow()
                db.commit()

                user_role = user.role or "BUYER"
                store_title = user.seller.store_name if user.seller else ""

                role_label = {
                    "ADMIN": "🛡 Bosh Administrator (SuperAdmin)",
                    "SELLER": f"🏪 Sotuvchi / Do'kon egasi ({store_title})" if store_title else "🏪 Sotuvchi",
                    "BUYER": "👤 Xaridor (Oddiy foydalanuvchi)"
                }.get(user_role, user_role)

                success_text = (
                    f"🎉 <b>Akkauntingiz muvaffaqiyatli bog'landi!</b>\n\n"
                    f"Assalomu alaykum, <b>{safe_name}</b>!\n"
                    f"Sizning <b>Milliy Narx</b> profilingiz ushbu botga ulandi.\n\n"
                    f"👤 <b>Elektron pochta:</b> <code>{html.escape(user.email)}</code>\n"
                    f"🔰 <b>Sizning rolingiz:</b> <b>{html.escape(role_label)}</b>\n\n"
                    f"<i>Bot funksiyalari va klaviaturasi sizning rolingizga moslashtirildi!</i>"
                )
                kb = get_keyboard_by_role(user_role)
                send_message(chat_id, success_text, reply_markup=kb)
                return
        finally:
            db.close()

    # 2. Tailored greeting based on user role
    user, role, seller = get_user_context(chat_id)

    if role == "SELLER" and seller:
        seller_text = (
            f"Assalomu alaykum, <b>{safe_name}</b>!\n\n"
            f"🏪 <b>Milliy Narx &bull; Sotuvchi Kabineti</b>\n"
            f"🏬 Do'koningiz: <b>{html.escape(seller.store_name)}</b>\n"
            f"⭐ Reyting: <b>{seller.rating:.1f}</b> &bull; Holat: <b>{seller.status}</b>\n\n"
            f"<b>Sotuvchi vositalari:</b>\n"
            f"• 🏪 <b>Mening do'konim:</b> Faol tovarlar va do'kon profili;\n"
            f"• 📦 <b>Mahsulotlarim:</b> Narxlaringiz va qoldiq holati;\n"
            f"• ➕ <b>Narx kiritish:</b> <code>Mahsulot | Narx</code> shaklida tezkor qo'shish;\n"
            f"• 📊 <b>Raqobatchilar tahlili:</b> Narxingiz bozorga nisbatan qanchalik raqobatbardosh ekanligi;\n"
            f"• 🤖 <b>AI Maslahatchi:</b> Marja va narx strategiyasi tavsiyalari.\n\n"
            f"👇 <i>Quyidagi sotuvchi menyusidan foydalaning:</i>"
        )
        send_message(chat_id, seller_text, reply_markup=get_seller_keyboard())

    elif role == "ADMIN":
        admin_text = (
            f"Assalomu alaykum, <b>{safe_name}</b>!\n\n"
            f"🛡 <b>Milliy Narx &bull; Administrator Boshqaruv Terminali</b>\n\n"
            f"<b>Moderator funksiyalari:</b>\n"
            f"• 📈 <b>Platforma Ko'rsatkichlari:</b> Tizimdagi jonli statistika;\n"
            f"• ⏳ <b>Do'konlar Moderatsiyasi:</b> Yangi do'konlarni tasdiqlash / rad etish;\n"
            f"• ⚠️ <b>Narx Anomaliyalari:</b> Shubhali va keskin o'zgargan narxlar;\n"
            f"• 👥 <b>Statistika:</b> Foydalanuvchilar va do'konlar soni.\n\n"
            f"👇 <i>Quyidagi boshqaruv menyusidan foydalaning:</i>"
        )
        send_message(chat_id, admin_text, reply_markup=get_admin_keyboard())

    elif role == "BUYER":
        buyer_text = (
            f"Assalomu alaykum, <b>{safe_name}</b>!\n\n"
            f"🇺🇿 <b>Milliy Narx &bull; Xaridor Kabineti</b>\n\n"
            f"<b>Siz uchun qulay imkoniyatlar:</b>\n"
            f"• 🔍 <b>Narx qidirish:</b> O'zbekiston bozorlaridagi eng arzon takliflarni topish;\n"
            f"• 🔔 <b>Mening ogohlantirishlarim:</b> Narxi tushganda sizga xabar beriladigan tovarlar;\n"
            f"• ❤️ <b>Sevimlilar:</b> Doimiy kuzatuvdagi mahsulotlaringiz;\n"
            f"• 🤖 <b>AI Xarid Maslahatchisi:</b> Aqlli xarid tavsiyalari va tahlil.\n\n"
            f"👇 <i>Mahsulot nomini yozing yoki kerakli bo'limni tanlang:</i>"
        )
        send_message(chat_id, buyer_text, reply_markup=get_buyer_keyboard())

    else:
        # GUEST
        guest_text = (
            f"Assalomu alaykum, <b>{safe_name}</b>!\n\n"
            f"🇺🇿 <b>Milliy Narx AI Bot</b> — O'zbekiston bozor narxlari tahlil portaliga xush kelibsiz!\n\n"
            f"<b>Bu bot orqali:</b>\n"
            f"• Istalgan tovarning <b>eng arzon narxini</b> topishingiz;\n"
            f"• O'z hisobingizni bog'lab, <b>narx tushishi bildirishnomalarini</b> olishingiz mumkin.\n\n"
            f"👇 <i>Hisobingizni ulash uchun <b>'🔗 Akkauntni bog'lash'</b> tugmasini bosing:</i>"
        )
        send_message(chat_id, guest_text, reply_markup=get_guest_keyboard())

# ==========================================
# SOTUVCHI (SELLER) XUSUSIY FUNKSIYALARI
# ==========================================

def handle_seller_store(chat_id: int, user: models.User, seller: models.Seller):
    """Show store overview and management card for seller"""
    db = SessionLocal()
    try:
        products_count = db.query(models.Product).filter(models.Product.seller_id == seller.id).count()
        offers_count = db.query(models.Offer).filter(models.Offer.seller_id == seller.id).count()
        city = seller.profile.city if seller.profile else "Toshkent"
        
        text = (
            f"🏪 <b>Do'koningiz Ma'lumotlari:</b>\n\n"
            f"🏬 <b>Nomi:</b> {html.escape(seller.store_name)}\n"
            f"📍 <b>Shahar:</b> {html.escape(city)}\n"
            f"⭐ <b>Reyting:</b> <code>{seller.rating:.1f} / 5.0</code> ({seller.rating_count} ta baho)\n"
            f"📦 <b>Kiritilgan mahsulotlar:</b> <b>{products_count} ta</b>\n"
            f"🏷 <b>Faol takliflar (Offers):</b> <b>{offers_count} ta</b>\n"
            f"📌 <b>Hisob holati:</b> <code>{seller.status}</code>\n"
            f"🛡 <b>Verifikatsiya:</b> {'✅ Tasdiqlangan' if seller.is_verified else '⏳ Kutilmoqda'}\n\n"
            f"<i>Tovarlar narxini yangilash uchun <b>'➕ Narx kiritish'</b> tugmasidan foydalaning.</i>"
        )
        inline_kb = {
            "inline_keyboard": [
                [{"text": "🌐 Veb-kabinetda ochish", "url": f"{WEB_APP_URL}/seller"}],
                [{"text": "📦 Mahsulotlarim ro'yxati", "url": f"{WEB_APP_URL}/seller/products"}]
            ]
        }
        send_message(chat_id, text, reply_markup=inline_kb)
    finally:
        db.close()

def handle_seller_products(chat_id: int, user: models.User, seller: models.Seller):
    """List seller's products with stock and price"""
    db = SessionLocal()
    try:
        products = db.query(models.Product).filter(models.Product.seller_id == seller.id).limit(8).all()
        if not products:
            text = (
                f"📦 <b>{html.escape(seller.store_name)}</b> do'konida hali mahsulotlar kiritilmagan.\n\n"
                f"Yangi tovar qo'shish uchun shunchaki xabar yuboring:\n"
                f"<code>Mahsulot nomi | Narx | [Qoldiq soni]</code>"
            )
            send_message(chat_id, text)
            return

        text = f"📦 <b>{html.escape(seller.store_name)} — Mahsulotlaringiz ({len(products)} ta ko'rsatilmoqda):</b>\n\n"
        for idx, p in enumerate(products, 1):
            text += f"{idx}. <b>{html.escape(p.name)}</b>\n"
            text += f"   💰 Narx: <code>{format_price(p.price)}</code> &bull; Qoldiq: {p.stock} ta\n"
            text += f"   📍 Joylashuv: {html.escape(p.location)} &bull; Holat: {p.status}\n\n"

        text += "💡 <i>Narxni tezkor yangilash uchun: <code>Mahsulot nomi | Yangi Narx</code> yuboring.</i>"
        inline_kb = {
            "inline_keyboard": [
                [{"text": "➕ Yangi mahsulot qo'shish", "url": f"{WEB_APP_URL}/seller/products/new"}],
                [{"text": "🌐 Barcha tovarlarni boshqarish", "url": f"{WEB_APP_URL}/seller/products"}]
            ]
        }
        send_message(chat_id, text, reply_markup=inline_kb)
    finally:
        db.close()

def handle_seller_competitor_analysis(chat_id: int, user: models.User, seller: models.Seller):
    """Market benchmark intelligence for the seller's inventory"""
    db = SessionLocal()
    try:
        my_products = db.query(models.Product).filter(models.Product.seller_id == seller.id).limit(5).all()
        if not my_products:
            send_message(chat_id, "📊 Raqobatchilar tahlili uchun avval do'koningizga kamida bitta mahsulot kiritishingiz kerak.")
            return

        text = f"📊 <b>Bozor Raqobatchilari Tahlili: {html.escape(seller.store_name)}</b>\n\n"
        
        for p in my_products:
            # Find all offers or products with similar name
            all_similar = db.query(models.Product).filter(
                models.Product.name.ilike(f"%{p.name[:15]}%"),
                models.Product.id != p.id
            ).all()

            if not all_similar:
                text += f"• <b>{html.escape(p.name)}:</b> <code>{format_price(p.price)}</code>\n"
                text += f"  ℹ️ <i>Bozorda to'g'ridan-to'g'ri analoglar topilmadi.</i>\n\n"
                continue

            prices = [sim.price for sim in all_similar if sim.price]
            min_competitor = min(prices)
            avg_competitor = sum(prices) / len(prices)

            text += f"• <b>{html.escape(p.name)}:</b>\n"
            text += f"  🏷 Sizning narxingiz: <code>{format_price(p.price)}</code>\n"
            text += f"  📉 Bozorning eng arzon narxi: <code>{format_price(min_competitor)}</code>\n"
            text += f"  📈 Raqobatchilar o'rtacha narxi: <code>{format_price(avg_competitor)}</code>\n"

            if p.price <= min_competitor:
                text += f"  🟢 <b>Siz bozorda eng arzon narx bilan yetakchisiz! (Best Price)</b>\n\n"
            else:
                diff = p.price - min_competitor
                pct = (diff / p.price) * 100
                text += f"  🔴 <i>Raqobatchi sizdan {format_price(diff)} ({pct:.1f}%) arzonroq sotmoqda!</i>\n\n"

        text += "💡 <i>Tavsiya: Savdo hajmini oshirish uchun narxlaringizni bozor benchmarkiga moslang.</i>"
        inline_kb = {
            "inline_keyboard": [
                [{"text": "📊 Narxlar dinamikasi tarixi", "url": f"{WEB_APP_URL}/seller/price-history"}]
            ]
        }
        send_message(chat_id, text, reply_markup=inline_kb)
    finally:
        db.close()

def handle_seller_quick_price_input(chat_id: int, user: models.User, seller: models.Seller, text: str):
    """
    Direct price entry for recognized seller:
    Format: Mahsulot nomi | Narx | [Qoldiq]
    Example: Artel Muzlatgich 280L | 3150000 | 12
    """
    parts = [p.strip() for p in text.split("|")]
    if len(parts) < 2:
        help_text = (
            f"➕ <b>{html.escape(seller.store_name)} uchun narx kiritish:</b>\n\n"
            f"Xabarni quyidagi shaklda yuboring:\n"
            f"<code>Mahsulot nomi | Narx | [Qoldiq soni]</code>\n\n"
            f"<b>Misol:</b>\n"
            f"<code>Artel Muzlatgich 280L | 3150000 | 10</code>\n"
            f"<code>iPhone 15 128GB | 9700000</code>\n\n"
            f"<i>Sotuvchi sifatida tizimga ulangansiz — do'kon nomi avtomatik biriktiriladi!</i>"
        )
        send_message(chat_id, help_text)
        return

    product_name = parts[0]
    raw_price = parts[1].replace(" ", "").replace("so'm", "").replace("sum", "").replace(",", "")
    stock = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 10

    try:
        price = float(raw_price)
    except ValueError:
        send_message(chat_id, "❌ <b>Narx noto'g'ri kiritildi!</b> Faqat raqam kiriting (masalan: <code>3150000</code>).")
        return

    db = SessionLocal()
    try:
        # Check if product already exists in seller's store
        product = db.query(models.Product).filter(
            models.Product.seller_id == seller.id,
            models.Product.name.ilike(f"%{product_name}%")
        ).first()

        import uuid
        if product:
            product.old_price = product.price
            product.price = price
            product.stock = stock
            product.updated_at = datetime.utcnow()
            action_label = "narxi yangilandi"
        else:
            product = models.Product(
                id=str(uuid.uuid4()),
                seller_id=seller.id,
                name=product_name,
                slug=f"{product_name.lower().replace(' ', '-')}-{int(time.time())}",
                price=price,
                location=seller.profile.city if seller.profile else "Toshkent",
                status="ACTIVE",
                stock=stock
            )
            db.add(product)
            db.flush()
            action_label = "yangi mahsulot sifatida qo'shildi"

        # Record offer and history
        offer = models.Offer(
            id=str(uuid.uuid4()),
            product_id=product.id,
            seller_id=seller.id,
            price=price,
            stock=stock,
            availability="IN_STOCK",
            condition="NEW"
        )
        db.add(offer)

        history = models.PriceHistory(
            id=str(uuid.uuid4()),
            product_id=product.id,
            seller_id=seller.id,
            price=price,
            source="TELEGRAM_SELLER"
        )
        db.add(history)
        db.commit()

        success_msg = (
            f"✅ <b>Muvaffaqiyatli qabul qilindi!</b>\n\n"
            f"🏬 Do'kon: <b>{html.escape(seller.store_name)}</b>\n"
            f"📦 Mahsulot: <b>{html.escape(product_name)}</b> ({action_label})\n"
            f"💰 Narx: <b>{format_price(price)}</b>\n"
            f"📦 Qoldiq: <b>{stock} ta</b>\n\n"
            f"<i>Ma'lumot real vaqtda Milliy Narx bozor tahlili algoritmlariga kiritildi.</i>"
        )
        inline_kb = {
            "inline_keyboard": [
                [{"text": "🌐 Saytda ko'rish", "url": f"{WEB_APP_URL}/product/{product.id}"}]
            ]
        }
        send_message(chat_id, success_msg, reply_markup=inline_kb)
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding seller price: {e}")
        send_message(chat_id, f"❌ Xatolik yuz berdi: {e}")
    finally:
        db.close()

# ==========================================
# XARIDOR (BUYER) XUSUSIY FUNKSIYALARI
# ==========================================

def handle_buyer_alerts(chat_id: int, user: models.User):
    """List buyer's active price drop alerts"""
    db = SessionLocal()
    try:
        alerts = db.query(models.PriceAlert).filter(models.PriceAlert.user_id == user.id).all()
        if not alerts:
            text = (
                "🔔 <b>Sizda hozircha faol narx ogohlantirishlari yo'q.</b>\n\n"
                "Mahsulot narxi arzonlashganda Telegram orqali birinchi bo'lib bilish uchun "
                "platformada 'Narx tushganda ogohlantirish' tugmasini bosing yoki botda qidiruv qiling."
            )
            inline_kb = {
                "inline_keyboard": [
                    [{"text": "🔍 Bozor narxlarini qidirish", "url": f"{WEB_APP_URL}/search"}]
                ]
            }
            send_message(chat_id, text, reply_markup=inline_kb)
            return

        text = f"🔔 <b>Sizning narx ogohlantirishlaringiz ({len(alerts)} ta):</b>\n\n"
        for idx, a in enumerate(alerts, 1):
            pname = a.product.name if a.product else "Mahsulot"
            current_p = a.product.price if a.product else 0
            status_icon = "🔥 TUSHDI!" if a.triggered else ("⏳ Kuzatilmoqda" if a.is_active else "To'xtatilgan")
            
            text += f"{idx}. <b>{html.escape(pname)}</b>\n"
            text += f"   💰 Joriy narx: <code>{format_price(current_p)}</code>\n"
            text += f"   🎯 Maqsadli narx: <code>{format_price(a.target_price)}</code>\n"
            text += f"   📌 Holat: <b>{status_icon}</b>\n\n"

        inline_kb = {
            "inline_keyboard": [
                [{"text": "📱 Kabinetda boshqarish", "url": f"{WEB_APP_URL}/alerts"}]
            ]
        }
        send_message(chat_id, text, reply_markup=inline_kb)
    finally:
        db.close()

def handle_buyer_favorites(chat_id: int, user: models.User):
    """List buyer's saved favorite products"""
    db = SessionLocal()
    try:
        favs = db.query(models.Favorite).filter(models.Favorite.user_id == user.id).all()
        if not favs:
            text = (
                "❤️ <b>Sevimli mahsulotlaringiz ro'yxati bo'sh.</b>\n\n"
                "Qiziqqan tovarlaringizni sevimlilar ro'yxatiga saqlab, ularning narx dinamikasini kuzatishingiz mumkin."
            )
            send_message(chat_id, text)
            return

        text = f"❤️ <b>Sevimli mahsulotlaringiz ({len(favs)} ta):</b>\n\n"
        for idx, f in enumerate(favs[:8], 1):
            p = f.product
            if p:
                text += f"{idx}. <b>{html.escape(p.name)}</b> — <code>{format_price(p.price)}</code>\n"

        inline_kb = {
            "inline_keyboard": [
                [{"text": "🌐 Sevimlilarni platformada ko'rish", "url": f"{WEB_APP_URL}/favorites"}]
            ]
        }
        send_message(chat_id, text, reply_markup=inline_kb)
    finally:
        db.close()

# ==========================================
# ADMIN (SUPERADMIN) XUSUSIY FUNKSIYALARI
# ==========================================

def handle_admin_metrics(chat_id: int, user: models.User):
    """Platform health and live operational metrics for Admins"""
    db = SessionLocal()
    try:
        products_count = db.query(models.Product).count()
        offers_count = db.query(models.Offer).count()
        sellers_approved = db.query(models.Seller).filter(models.Seller.status == "APPROVED").count()
        sellers_pending = db.query(models.Seller).filter(models.Seller.status == "PENDING").count()
        users_count = db.query(models.User).count()
        buyers_count = db.query(models.User).filter(models.User.role == "BUYER").count()
        alerts_count = db.query(models.PriceAlert).count()
        history_count = db.query(models.PriceHistory).count()

        text = (
            f"📈 <b>Milliy Narx &bull; Platforma Monitoring Ko'rsatkichlari</b>\n\n"
            f"📦 <b>Mahsulotlar katalogi:</b> <b>{products_count} ta</b>\n"
            f"🏷 <b>Faol narx takliflari (Offers):</b> <b>{offers_count} ta</b>\n"
            f"📊 <b>Narx o'zgarishlari tarixi:</b> <b>{history_count} ta yozuv</b>\n\n"
            f"🏬 <b>Do'konlar & Sotuvchilar:</b>\n"
            f"   • Faol (Approved): <b>{sellers_approved} ta</b>\n"
            f"   • Moderatsiyada (Pending): <b>{sellers_pending} ta</b> ⏳\n\n"
            f"👥 <b>Foydalanuvchilar:</b> <b>{users_count} ta</b>\n"
            f"   • Xaridorlar (Buyers): {buyers_count} ta\n"
            f"   • Faol narx ogohlantirishlari: {alerts_count} ta\n\n"
            f"⚡ <i>Tizim normal holatda ishlamoqda (API 200 OK).</i>"
        )
        inline_kb = {
            "inline_keyboard": [
                [{"text": "🛡 Admin Monitoring Terminali", "url": f"{WEB_APP_URL}/admin"}],
                [{"text": "⏳ Do'konlar Moderatsiyasi", "url": f"{WEB_APP_URL}/admin/sellers"}]
            ]
        }
        send_message(chat_id, text, reply_markup=inline_kb)
    finally:
        db.close()

def handle_admin_pending_sellers(chat_id: int, user: models.User):
    """List pending sellers needing verification and approval"""
    db = SessionLocal()
    try:
        pending = db.query(models.Seller).filter(models.Seller.status == "PENDING").limit(5).all()
        if not pending:
            send_message(chat_id, "✅ <b>Ajoyib!</b> Hozirda tasdiqlashni kutayotgan yangi do'konlar yo'q.")
            return

        text = f"⏳ <b>Tasdiqlashni kutayotgan do'konlar ({len(pending)} ta):</b>\n\n"
        inline_buttons = []
        for s in pending:
            city = s.profile.city if s.profile else "Noma'lum"
            text += f"🏬 <b>{html.escape(s.store_name)}</b>\n"
            text += f"   📍 Shahar: {html.escape(city)} &bull; STIR/INN: {s.tax_id or 'Kiritilmagan'}\n"
            text += f"   📅 Sana: {s.created_at.strftime('%Y-%m-%d %H:%M')}\n\n"
            inline_buttons.append([
                {"text": f"✅ Tasdiqlash: {s.store_name[:18]}", "url": f"{WEB_APP_URL}/admin/sellers"}
            ])

        inline_buttons.append([{"text": "🛡 To'liq moderatsiya paneliga o'tish", "url": f"{WEB_APP_URL}/admin/sellers"}])
        inline_kb = {"inline_keyboard": inline_buttons}
        send_message(chat_id, text, reply_markup=inline_kb)
    finally:
        db.close()

def handle_admin_anomalies(chat_id: int, user: models.User):
    """Detect wide price spreads and potential arbitrage anomalies"""
    db = SessionLocal()
    try:
        products = db.query(models.Product).limit(30).all()
        anomalies = []

        for p in products:
            offers = db.query(models.Offer).filter(models.Offer.product_id == p.id).all()
            if len(offers) >= 2:
                prices = [o.price for o in offers]
                min_p = min(prices)
                max_p = max(prices)
                spread_pct = ((max_p - min_p) / min_p) * 100
                if spread_pct >= 25:
                    anomalies.append((p.name, min_p, max_p, spread_pct, len(offers)))

        if not anomalies:
            send_message(chat_id, "✅ <b>Tizimda keskin narx anomaliyalari aniqlanmadi.</b> Narxlar barqaror spred doirasida.")
            return

        text = f"⚠️ <b>Aniqlangan Bozor Narx Anomaliyalari ({len(anomalies)} ta):</b>\n\n"
        for name, min_p, max_p, pct, cnt in anomalies[:5]:
            text += f"• <b>{html.escape(name)}</b>\n"
            text += f"  Min: <code>{format_price(min_p)}</code> &bull; Max: <code>{format_price(max_p)}</code>\n"
            text += f"  ⚡ Spred farqi: <b>+{pct:.1f}%</b> ({cnt} ta do'konda)\n\n"

        text += "💡 <i>Spred 25% dan yuqori bo'lgan tovarlarda arbitraj imkoniyatlari yoki noto'g'ri kiritilgan narxlar bo'lishi mumkin.</i>"
        send_message(chat_id, text)
    finally:
        db.close()

# ==========================================
# UMUMIY QIDIRUV VA AI MASLAHATCHI
# ==========================================

def handle_search(chat_id: int, query: str):
    """Search products in database and return rich price intelligence card"""
    db = SessionLocal()
    try:
        clean_q = query.strip()
        safe_q = html.escape(clean_q)
        
        products = db.query(models.Product).filter(
            (models.Product.name.ilike(f"%{clean_q}%")) |
            (models.Product.model.ilike(f"%{clean_q}%")) |
            (models.Product.description.ilike(f"%{clean_q}%"))
        ).limit(6).all()

        if not products:
            text = (
                f"🔍 <b>'{safe_q}'</b> bo'yicha bazadan mahsulot topilmadi.\n\n"
                f"Iltimos, nomini qisqaroq yoki umumiyroq yozib ko'ring (masalan: <i>Samsung, Lenovo, Artel, Sement, Yog', Televizor</i>) "
                f"yoki platformaning to'liq qidiruvidan foydalaning:"
            )
            inline_kb = {
                "inline_keyboard": [
                    [{"text": "🌐 Platformada qidirish", "url": f"{WEB_APP_URL}/search?q={clean_q}"}]
                ]
            }
            send_message(chat_id, text, reply_markup=inline_kb)
            return

        # Detailed benchmark card for top match
        top = products[0]
        offers = db.query(models.Offer).filter(models.Offer.product_id == top.id).all()
        all_prices = [o.price for o in offers] if offers else [top.price]
        if top.price and top.price not in all_prices:
            all_prices.append(top.price)

        min_p = min(all_prices)
        max_p = max(all_prices)
        avg_p = sum(all_prices) / len(all_prices) if all_prices else min_p
        savings = avg_p - min_p if avg_p > min_p else 0
        spread_pct = ((max_p - min_p) / min_p * 100) if min_p > 0 else 0

        best_seller_name = "Rasmiy bozor do'koni"
        if offers:
            cheapest_offer = min(offers, key=lambda x: x.price)
            if cheapest_offer.seller:
                best_seller_name = cheapest_offer.seller.store_name
        elif top.seller:
            best_seller_name = top.seller.store_name

        category_name = top.category.name if top.category else "Umumiy"
        card = (
            f"📊 <b>Bozor Tahlili: {html.escape(top.name)}</b>\n"
            f"🏷 Kategoriya: <i>{html.escape(category_name)}</i>\n"
            f"🏬 Solishtirilgan do'konlar: <b>{len(all_prices)} ta do'kon</b>\n\n"
            f"🟢 <b>Eng arzon narx (Benchmark):</b> <code>{format_price(min_p)}</code>\n"
            f"👤 Tavsiya etilgan do'kon: <b>{html.escape(best_seller_name)}</b>\n\n"
            f"📈 <b>O'rtacha bozor narxi:</b> <code>{format_price(avg_p)}</code>\n"
            f"🔴 <b>Maksimal narx:</b> <code>{format_price(max_p)}</code>\n"
            f"💰 <b>Bozor narx spredi:</b> <code>+{format_price(max_p - min_p)} (+{spread_pct:.1f}%)</code>\n"
        )

        if savings > 0:
            card += f"\n💡 <i>Eng arzon taklifdan xarid qilib, o'rtacha <b>{format_price(savings)}</b> tejashingiz mumkin!</i>\n"

        inline_buttons = [
            [{"text": f"📊 {top.name[:24]} — Narxlar", "url": f"{WEB_APP_URL}/product/{top.id}"}]
        ]

        if len(products) > 1:
            card += f"\n<b>Boshqa topilgan variantlar:</b>\n"
            for p in products[1:4]:
                card += f"• <b>{html.escape(p.name)}</b> — <code>{format_price(p.price)}</code>\n"
                inline_buttons.append([
                    {"text": f"🏷 {p.name[:25]} ({format_price(p.price)})", "url": f"{WEB_APP_URL}/product/{p.id}"}
                ])

        inline_buttons.append([
            {"text": "🌐 To'liq katalogda qidirish", "url": f"{WEB_APP_URL}/search?q={clean_q}"}
        ])

        inline_kb = {"inline_keyboard": inline_buttons}
        send_message(chat_id, card, reply_markup=inline_kb)
    finally:
        db.close()

def handle_ai_query(chat_id: int, user_prompt: str):
    """Query DeepSeek OpenRouter AI engine for market insights tailored to role"""
    user, role, seller = get_user_context(chat_id)
    send_message(chat_id, "🤖 <i>Sun'iy Intellekt bozor ma'lumotlarini tahlil qilmoqda...</i>")
    
    db = SessionLocal()
    try:
        products_count = db.query(models.Product).count()
        sellers_count = db.query(models.Seller).count()
        categories = [c.name for c in db.query(models.Category).limit(6).all()]
        
        role_instruction = "Sen iste'molchi va xaridorlarga eng tejamkor xarid qilishni o'rgatasan."
        if role == "SELLER":
            role_instruction = f"Foydalanuvchi do'kon sotuvchisi ({seller.store_name if seller else ''}). Tovarlarni raqobatbardosh narxlash, marja va savdoni oshirish bo'yicha tahlil ber."
        elif role == "ADMIN":
            role_instruction = "Foydalanuvchi platforma moderatori. Bozor yaxlitligi, narx anomaliyalari va statistik tahlil ber."

        system_prompt = (
            f"Sen 'Milliy Narx' platformasining O'zbekiston bozorlari bo'yicha Sun'iy Intellekt tahlilchisisan. {role_instruction} "
            f"O'zbekiston bozoridagi narxlar bo'yicha aniq, professional, o'zbek tilida qisqa va tushunarli javob ber. "
            f"Hozirda platformada {products_count} ta tovar va {sellers_count} ta do'konlar narxlari solishtirilmoqda. "
            f"Asosiy kategoriyalar: {', '.join(categories)}."
        )
        
        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://milliynarx.uz",
            "X-Title": "Milliy Narx Telegram Bot"
        }
        payload = {
            "model": settings.OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.4,
            "max_tokens": 500
        }
        
        resp = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=25)
        ai_text = ""
        if resp.status_code == 200:
            data = resp.json()
            choices = data.get("choices", [])
            if choices:
                ai_text = choices[0].get("message", {}).get("content") or ""

        if not ai_text:
            ai_text = (
                f"Bozor tahliliga ko'ra: '{user_prompt}' bo'yicha hozirda O'zbekiston bozorlarida turli toifadagi qulay modellar mavjud. "
                f"Eng ma'qul narx va rasmiy kafolatli variantlarni tanlash uchun platformamizdagi do'konlar takliflarini solishtirishni tavsiya qilamiz."
            )
        else:
            ai_text = ai_text.strip()
            
        formatted_resp = (
            f"🤖 <b>Codexa AI Bozor Xulosasi:</b>\n\n"
            f"{html.escape(ai_text)}\n\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"📊 <i>Milliy Narx &bull; 100% Haqiqiy Bozor Ma'lumotlari</i>"
        )
        inline_kb = {
            "inline_keyboard": [
                [{"text": "🌐 Platformada to'liq tahlil", "url": f"{WEB_APP_URL}/ai-advisor"}]
            ]
        }
        send_message(chat_id, formatted_resp, reply_markup=inline_kb)
    except Exception as e:
        logger.error(f"AI query failed: {e}")
        send_message(chat_id, "Kechirasiz, sun'iy intellekt xizmatida vaqtinchalik uzilish yuz berdi. Iltimos, keyinroq urinib ko'ring.")
    finally:
        db.close()

def handle_categories(chat_id: int):
    """List market categories and product counts"""
    db = SessionLocal()
    try:
        categories = db.query(models.Category).filter(models.Category.is_active == True).all()
        text = "📊 <b>Milliy Narx — Bozor Kategoriyalari:</b>\n\n"
        for c in categories:
            cnt = db.query(models.Product).filter(models.Product.category_id == c.id).count()
            text += f"• <b>{html.escape(c.name)}</b> — <i>{cnt} ta faol taklif</i>\n"
        
        text += "\n<i>Istalgan mahsulot narxini bilish uchun nomini to'g'ridan-to'g'ri yozing!</i>"
        inline_kb = {
            "inline_keyboard": [
                [{"text": "🌐 Kategoriyalar bo'yicha qidirish", "url": f"{WEB_APP_URL}/search"}]
            ]
        }
        send_message(chat_id, text, reply_markup=inline_kb)
    finally:
        db.close()

def handle_profile_and_role(chat_id: int):
    """Display user profile, connected email, and active role"""
    user, role, seller = get_user_context(chat_id)
    if not user:
        text = (
            "👤 <b>Sizning holatingiz:</b> Mehmon (Bog'lanmagan)\n\n"
            "Platforma hisobingizni ulash orqali to'liq imkoniyatlardan foydalanishingiz mumkin."
        )
        send_message(chat_id, text, reply_markup=get_guest_keyboard())
        return

    store_info = f"\n🏬 <b>Do'kon nomi:</b> {html.escape(seller.store_name)}" if seller else ""
    role_uz = {
        "ADMIN": "🛡 Bosh Administrator (SuperAdmin)",
        "SELLER": "🏪 Sotuvchi (Do'kon egasi)",
        "BUYER": "👤 Xaridor (Oddiy foydalanuvchi)"
    }.get(role, role)

    text = (
        f"👤 <b>Foydalanuvchi Profili:</b>\n\n"
        f"📧 <b>Hisob:</b> <code>{html.escape(user.email)}</code>\n"
        f"🔰 <b>Faol rol:</b> <b>{role_uz}</b>{store_info}\n"
        f"🆔 <b>Telegram Chat ID:</b> <code>{chat_id}</code>\n"
        f"📅 <b>Bog'langan sana:</b> {user.telegram_connected_at.strftime('%Y-%m-%d') if user.telegram_connected_at else 'Yaqinda'}\n\n"
        f"<i>Klaviaturangiz ushbu rolga moslashtirilgan.</i>"
    )
    inline_kb = {
        "inline_keyboard": [
            [{"text": "📱 Veb-kabinetga o'tish", "url": f"{WEB_APP_URL}/alerts"}]
        ]
    }
    send_message(chat_id, text, reply_markup=inline_kb)

def handle_role_switch_test(chat_id: int, new_role: str):
    """Convenient tester command to switch role for testing: /role buyer|seller|admin"""
    user, _, _ = get_user_context(chat_id)
    if not user:
        send_message(chat_id, "❌ Avval hisobingizni bog'lang.")
        return
    
    clean_role = new_role.upper().strip()
    if clean_role not in ["BUYER", "SELLER", "ADMIN"]:
        send_message(chat_id, "Iltimos, to'g'ri rol tanlang: <code>/role buyer</code>, <code>/role seller</code>, yoki <code>/role admin</code>")
        return

    db = SessionLocal()
    try:
        db_user = db.query(models.User).filter(models.User.id == user.id).first()
        db_user.role = clean_role
        
        # If switching to seller and doesn't have a seller, create dummy demo store
        if clean_role == "SELLER" and not db_user.seller:
            import uuid
            new_seller = models.Seller(
                id=str(uuid.uuid4()),
                user_id=db_user.id,
                store_name="Artel Rasmiy Do'kon",
                slug=f"artel-rasmiy-{int(time.time())}",
                status="APPROVED",
                rating=4.9,
                rating_count=12,
                is_verified=True
            )
            db.add(new_seller)

        db.commit()
        send_message(chat_id, f"✅ Sizning rolingiz <b>{clean_role}</b> ga muvaffaqiyatli almashtirildi!")
        handle_start(chat_id, user.telegram_username or "Foydalanuvchi")
    finally:
        db.close()

# ==========================================
# NOTIFICATION DISPATCHER
# ==========================================

def send_telegram_notification(
    user_id: str, 
    title: str, 
    message: str, 
    product_id: Optional[str] = None, 
    link_url: Optional[str] = None
) -> bool:
    """Send push notification to user's connected Telegram chat"""
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user or not user.telegram_chat_id:
            logger.info(f"User {user_id} does not have a linked Telegram chat_id.")
            return False
        
        chat_id = int(user.telegram_chat_id)
        
        formatted_text = (
            f"🔔 <b>{title}</b>\n\n"
            f"{message}\n\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"⚡ <i>Milliy Narx &bull; Tezkor narx bildirishnomalari</i>"
        )
        
        target_url = link_url
        if not target_url and product_id:
            target_url = f"{WEB_APP_URL}/product/{product_id}"
        elif not target_url:
            target_url = f"{WEB_APP_URL}/alerts"
            
        reply_markup = {
            "inline_keyboard": [
                [{"text": "📱 Platformada ko'rish", "url": target_url}]
            ]
        }
        
        res = send_message(chat_id, formatted_text, reply_markup=reply_markup)
        success = res is not None and res.get("ok", False)
        if success:
            logger.info(f"Notification delivered successfully to Telegram chat {chat_id}")
        return success
    except Exception as e:
        logger.error(f"Failed to deliver notification to user {user_id}: {e}")
        return False
    finally:
        db.close()

# ==========================================
# MAIN DISPATCHER
# ==========================================

def process_update(update: Dict[str, Any]):
    """Process incoming Telegram update and route to role-appropriate handler"""
    if "callback_query" in update:
        cq = update["callback_query"]
        cq_id = cq.get("id")
        chat_id = cq.get("message", {}).get("chat", {}).get("id")
        data = cq.get("data", "")
        answer_callback(cq_id, "Qabul qilindi!")
        return

    if "message" not in update:
        return
    
    msg = update["message"]
    chat_id = msg.get("chat", {}).get("id")
    text = msg.get("text", "").strip()
    from_user = msg.get("from", {})
    first_name = from_user.get("first_name", "Foydalanuvchi")
    username = from_user.get("username")
    
    if not chat_id or not text:
        return

    logger.info(f"Received message from {chat_id} ({first_name} @{username}): {text}")

    # Resolve context
    user, role, seller = get_user_context(chat_id)

    # 1. Universal commands
    if text.startswith("/start"):
        parts = text.split(" ", 1)
        payload = parts[1].strip() if len(parts) > 1 else None
        handle_start(chat_id, first_name, payload=payload, username=username)
        return
    elif text.startswith("/menu"):
        handle_start(chat_id, first_name, username=username)
        return
    elif text.startswith("/role"):
        parts = text.split(" ", 1)
        if len(parts) > 1:
            handle_role_switch_test(chat_id, parts[1].strip())
        else:
            handle_profile_and_role(chat_id)
        return
    elif text.startswith("/search"):
        parts = text.split(" ", 1)
        q = parts[1].strip() if len(parts) > 1 else ""
        if q:
            handle_search(chat_id, q)
        else:
            send_message(chat_id, "🔍 Qidirmoqchi bo'lgan mahsulot nomini kiriting. Masalan: <code>/search Lenovo</code>")
        return
    elif text in ["👤 Profilim va Rol", "/profile"]:
        handle_profile_and_role(chat_id)
        return
    elif text == "🌐 Milliy Narx Sayti":
        send_message(chat_id, "🌐 <b>Milliy Narx</b> rasmiy veb-platformasi:\nO'zbekistonning 1-mustaqil bozor narxlari tahlil portali.", reply_markup={
            "inline_keyboard": [[{"text": "🌐 Saytni ochish (milliynarx.uz)", "url": "https://milliynarx.uz"}]]
        })
        return
    elif text in ["🔢 Kirish kodi", "/kod", "/code", "/login"]:
        from backend.app.api.auth import create_telegram_auth_code
        code = create_telegram_auth_code(chat_id, first_name, username)
        msg = (
            f"🔢 <b>Milliy Narx Kirish Kodi:</b> <code>{code}</code>\n\n"
            f"⏳ Ushbu 6-xonali kod <b>5 daqiqa</b> davomida amal qiladi.\n\n"
            f"Saytdagi ro'yxatdan o'tish yoki kirish oynasiga ushbu kodni kiriting."
        )
        send_message(chat_id, msg)
        return
    elif text == "🔗 Akkauntni bog'lash":
        link_info = (
            "🔗 <b>Akkauntni bog'lash yo'riqnomasi:</b>\n\n"
            "1. Brauzerda <a href='https://milliynarx.uz/alerts'>Milliy Narx</a> sahifasiga kiring;\n"
            "2. <b>'Telegramda ulash'</b> tugmasini bosing;\n"
            "3. Botga kelganingizda profilingiz avtomatik aniqlanadi va klaviatura rolingizga moslanadi!"
        )
        send_message(chat_id, link_info)
        return

    # 2. SELLER-SPECIFIC ACTIONS
    if role == "SELLER" and seller:
        if text in ["🏪 Mening do'konim", "/store"]:
            handle_seller_store(chat_id, user, seller)
            return
        elif text in ["📦 Mahsulotlarim va narxlar", "/my_products"]:
            handle_seller_products(chat_id, user, seller)
            return
        elif text in ["📊 Raqobatchilar tahlili", "/competitors"]:
            handle_seller_competitor_analysis(chat_id, user, seller)
            return
        elif text in ["➕ Narx kiritish / yangilash", "/add_price"]:
            handle_seller_quick_price_input(chat_id, user, seller, "")
            return
        elif text in ["🤖 AI Sotuvchi Maslahatchisi", "/seller_ai"]:
            send_message(chat_id, f"🤖 <b>{html.escape(seller.store_name)}</b> uchun AI savdo maslahatchisi.\nBozor narxlari yoki marja bo'yicha savolingizni yozing:")
            return
        elif "|" in text:
            handle_seller_quick_price_input(chat_id, user, seller, text)
            return

    # 3. ADMIN-SPECIFIC ACTIONS
    if role == "ADMIN":
        if text in ["📈 Platforma Ko'rsatkichlari", "/metrics"]:
            handle_admin_metrics(chat_id, user)
            return
        elif text in ["⏳ Do'konlar Moderatsiyasi", "/moderation"]:
            handle_admin_pending_sellers(chat_id, user)
            return
        elif text in ["⚠️ Narx Anomaliyalari", "/anomalies"]:
            handle_admin_anomalies(chat_id, user)
            return
        elif text in ["👥 Foydalanuvchilar Statistikasi", "/users_stats"]:
            handle_admin_metrics(chat_id, user)
            return
        elif text == "🔍 Global Qidiruv":
            send_message(chat_id, "🔍 Istalgan tovar yoki do'kon nomini kiriting:")
            return

    # 4. BUYER-SPECIFIC ACTIONS
    if role == "BUYER":
        if text in ["🔔 Mening ogohlantirishlarim", "/alerts"]:
            handle_buyer_alerts(chat_id, user)
            return
        elif text in ["❤️ Sevimlilarim", "/favorites"]:
            handle_buyer_favorites(chat_id, user)
            return
        elif text in ["🤖 AI Xarid Maslahatchisi", "/buyer_ai"]:
            send_message(chat_id, "🤖 Xarid qilish bo'yicha qanday maslahat kerak? Tovarni yozing (masalan: <i>Hozir muzlatgich olish qulaymi?</i>):")
            return

    # 5. Shared features
    if text == "🔍 Narx qidirish":
        send_message(chat_id, "🔍 Qaysi mahsulot narxini bilmoqchisiz? Nomini yozing (masalan: <i>Lenovo, iPhone, Artel, Sement</i>):")
    elif text in ["🤖 AI Maslahatchi", "🤖 AI Maslahatchisi"]:
        send_message(chat_id, "🤖 Bozor bo'yicha savolingizni yozing:")
    elif text == "📊 Bozor Kategoriyalari":
        handle_categories(chat_id)
    elif "|" in text:
        # Fallback seller input format with store name
        send_message(chat_id, "Do'kon narxini kiritish uchun: <code>Mahsulot | Narx</code> shaklida yuboring.")
    elif any(kw in text.lower() for kw in ["maslahat", "tavsiya", "nima uchun", "qanday", "arzonmi", "qimmatmi", "?", "ai"]):
        handle_ai_query(chat_id, text)
    else:
        # Default fallback: Product price search
        handle_search(chat_id, text)

# ==========================================
# POLLING & THREAD WORKERS
# ==========================================

def sync_pending_updates(limit: int = 25) -> int:
    """Synchronously fetch and process pending updates from Telegram API once"""
    global _LAST_UPDATE_OFFSET
    try:
        url = f"{API_BASE}/getUpdates?offset={_LAST_UPDATE_OFFSET}&limit={limit}&timeout=1"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok"):
                updates = data.get("result", [])
                processed = 0
                for item in updates:
                    _LAST_UPDATE_OFFSET = item["update_id"] + 1
                    try:
                        process_update(item)
                        processed += 1
                    except Exception as err:
                        logger.error(f"Error handling update {item.get('update_id')}: {err}")
                return processed
    except Exception as e:
        logger.error(f"Failed to sync Telegram updates: {e}")
    return 0

def run_bot_polling():
    """Continuous long-polling loop for daemon execution"""
    global _LAST_UPDATE_OFFSET
    logger.info("Starting Milliy Narx Telegram Bot continuous long-polling loop with role-based routing...")
    while True:
        try:
            url = f"{API_BASE}/getUpdates?offset={_LAST_UPDATE_OFFSET}&timeout=10"
            resp = requests.get(url, timeout=20)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("ok"):
                    for item in data.get("result", []):
                        _LAST_UPDATE_OFFSET = item["update_id"] + 1
                        try:
                            process_update(item)
                        except Exception as err:
                            logger.error(f"Error handling update {item.get('update_id')}: {err}")
            elif resp.status_code == 409:
                logger.warning("Conflict with another bot instance. Retrying in 5s...")
                time.sleep(5)
            else:
                time.sleep(2)
        except Exception as e:
            logger.error(f"Telegram polling exception: {e}")
            time.sleep(3)

def start_bot_background_thread():
    """Start Telegram bot in background daemon thread"""
    t = threading.Thread(target=run_bot_polling, daemon=True, name="MilliyNarxTelegramBot")
    t.start()
    logger.info("Milliy Narx Telegram Bot daemon background thread launched with role-based engine!")
    return t

if __name__ == "__main__":
    print(f"Starting Milliy Narx Telegram Bot (@{settings.TELEGRAM_BOT_USERNAME}) ...")
    run_bot_polling()
