from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import User, Profile, Seller, SellerProfile
from backend.app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from backend.app.core.slug import generate_unique_slug
from backend.app.schemas.schemas import UserRegister, UserLogin, Token, UserOut, UserProfileUpdate, ChangePasswordRequest
from backend.app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Autentifikatsiyadan o'tilmagan yoki token eskirgan",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user

def require_role(allowed_roles: list):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ushbu amalni bajarish uchun ruxsat berilmagan"
            )
        return current_user
    return role_checker

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ushbu elektron pochta allaqachon ro'yxatdan o'tgan"
        )
    
    role = user_in.role.upper()
    if role not in ["BUYER", "SELLER"]:
        role = "BUYER"
        
    new_user = User(
        email=user_in.email,
        phone=user_in.phone,
        hashed_password=get_password_hash(user_in.password),
        role=role,
        is_active=True,
        is_verified=False
    )
    db.add(new_user)
    db.flush()
    
    # Create empty profile
    profile = Profile(
        user_id=new_user.id,
        full_name=user_in.email.split("@")[0],
        phone=user_in.phone
    )
    db.add(profile)
    
    # If registering as SELLER, create seller record in PENDING state
    if role == "SELLER":
        store_name = user_in.store_name or f"Do'kon {user_in.email.split('@')[0]}"
        slug = generate_unique_slug(db, Seller, store_name)
            
        seller = Seller(
            user_id=new_user.id,
            store_name=store_name,
            slug=slug,
            business_reg_number=user_in.business_reg_number,
            tax_id=user_in.tax_id,
            status="PENDING", # Requires admin approval
            rating=0.0,
            rating_count=0,
            is_verified=False
        )
        db.add(seller)
        db.flush()
        
        seller_profile = SellerProfile(
            seller_id=seller.id,
            city=user_in.location or "Toshkent",
            contact_phone=user_in.phone,
            logo_url=user_in.logo_url
        )
        db.add(seller_profile)
        
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(subject=new_user.id, role=new_user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "role": new_user.role,
            "is_active": new_user.is_active,
            "store_name": new_user.seller.store_name if new_user.seller else None,
            "seller_status": new_user.seller.status if new_user.seller else None
        }
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Elektron pochta yoki parol noto'g'ri"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Foydalanuvchi hisobi faol emas"
        )
        
    access_token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "full_name": user.profile.full_name if user.profile else None,
            "store_name": user.seller.store_name if user.seller else None,
            "seller_status": user.seller.status if user.seller else None,
            "telegram_chat_id": user.telegram_chat_id,
            "telegram_username": user.telegram_username,
            "telegram_connected_at": user.telegram_connected_at
        }
    }

@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    seller_data = None
    plan = "STARTER"
    ai_limit = 5
    ai_used = 0
    if current_user.seller:
        plan = current_user.seller.plan or "STARTER"
        ai_limit = current_user.seller.ai_queries_limit or (99999 if plan == "ENTERPRISE" else (100 if plan == "PRO" else 5))
        ai_used = current_user.seller.ai_queries_used or 0
        seller_data = {
            "id": current_user.seller.id,
            "store_name": current_user.seller.store_name,
            "slug": current_user.seller.slug,
            "status": current_user.seller.status,
            "rating": current_user.seller.rating,
            "is_verified": current_user.seller.is_verified,
            "city": current_user.seller.profile.city if current_user.seller.profile else None,
            "plan": plan,
            "ai_queries_limit": ai_limit,
            "ai_queries_used": ai_used
        }
        
    return {
        "id": current_user.id,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at,
        "telegram_chat_id": current_user.telegram_chat_id,
        "telegram_username": current_user.telegram_username,
        "telegram_connected_at": current_user.telegram_connected_at,
        "plan": plan,
        "ai_queries_limit": ai_limit,
        "ai_queries_used": ai_used,
        "profile": {
            "full_name": current_user.profile.full_name if current_user.profile else None,
            "avatar_url": current_user.profile.avatar_url if current_user.profile else None,
            "bio": current_user.profile.bio if current_user.profile else None
        },
        "seller": seller_data
    }

@router.patch("/profile")
def update_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = current_user.profile
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.flush()
        
    if profile_in.full_name is not None:
        profile.full_name = profile_in.full_name.strip()
    if profile_in.phone is not None:
        profile.phone = profile_in.phone.strip()
        current_user.phone = profile_in.phone.strip()
    if profile_in.avatar_url is not None:
        profile.avatar_url = profile_in.avatar_url
    if profile_in.bio is not None:
        profile.bio = profile_in.bio.strip()
        
    profile.updated_at = datetime.utcnow()
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    db.refresh(profile)
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "profile": {
            "full_name": profile.full_name,
            "avatar_url": profile.avatar_url,
            "bio": profile.bio,
            "phone": profile.phone
        }
    }

@router.post("/change-password")
def change_password(
    pwd_in: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(pwd_in.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Joriy parol noto'g'ri kiritildi"
        )
        
    current_user.hashed_password = get_password_hash(pwd_in.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"success": True, "message": "Parol muvaffaqiyatli o'zgartirildi"}


# =======================================================
# TELEGRAM BOT AUTHENTICATION & QUICK LOGIN (SSO)
# =======================================================

import secrets
from datetime import timedelta
from pydantic import BaseModel

class TelegramCodeLogin(BaseModel):
    code: str
    role: Optional[str] = "BUYER"

class TelegramSessionInit(BaseModel):
    role: Optional[str] = "BUYER"

# session_token -> {"created_at": datetime, "status": "PENDING" | "APPROVED", "token": str, "user": dict}
TELEGRAM_AUTH_SESSIONS = {}
# 6-digit code -> {"chat_id": int, "username": str, "first_name": str, "expires_at": datetime}
TELEGRAM_AUTH_CODES = {}

def approve_telegram_session(session_token: str, access_token: str, user_payload: dict):
    """Called by Telegram Bot worker when user presses Start with auth_ session token"""
    if session_token in TELEGRAM_AUTH_SESSIONS:
        TELEGRAM_AUTH_SESSIONS[session_token]["status"] = "APPROVED"
        TELEGRAM_AUTH_SESSIONS[session_token]["token"] = access_token
        TELEGRAM_AUTH_SESSIONS[session_token]["user"] = user_payload
        return True
    return False

def create_telegram_auth_code(chat_id: int, first_name: str, username: Optional[str] = None) -> str:
    """Generate 6-digit one-time code for telegram login"""
    import random
    code = f"{random.randint(100000, 999999)}"
    TELEGRAM_AUTH_CODES[code] = {
        "chat_id": chat_id,
        "first_name": first_name,
        "username": username,
        "expires_at": datetime.utcnow() + timedelta(minutes=5)
    }
    return code

@router.post("/telegram-session")
def create_telegram_session(init_data: Optional[TelegramSessionInit] = None):
    """Initiate a Telegram deep-link login session for web browser"""
    session_token = f"auth_{secrets.token_hex(10)}"
    clean_now = datetime.utcnow()
    
    # Cleanup expired sessions older than 15 mins
    expired_keys = [k for k, v in TELEGRAM_AUTH_SESSIONS.items() if (clean_now - v["created_at"]).total_seconds() > 900]
    for k in expired_keys:
        TELEGRAM_AUTH_SESSIONS.pop(k, None)
        
    TELEGRAM_AUTH_SESSIONS[session_token] = {
        "created_at": clean_now,
        "status": "PENDING",
        "role": init_data.role if init_data else "BUYER",
        "token": None,
        "user": None
    }
    
    bot_username = "milliynarxbot"
    return {
        "session_token": session_token,
        "bot_username": bot_username,
        "bot_url": f"https://t.me/{bot_username}?start={session_token}"
    }

@router.get("/telegram-session-check")
def check_telegram_session(session_token: str):
    """Poll status of telegram deep-link login session"""
    session = TELEGRAM_AUTH_SESSIONS.get(session_token)
    if not session:
        return {"status": "EXPIRED"}
    if session["status"] == "APPROVED":
        return {
            "status": "APPROVED",
            "access_token": session["token"],
            "token_type": "bearer",
            "user": session["user"]
        }
    return {"status": "PENDING"}

@router.post("/telegram-code-login", response_model=Token)
def login_with_telegram_code(code_in: TelegramCodeLogin, db: Session = Depends(get_db)):
    """Authenticate via 6-digit one-time code generated from Telegram Bot"""
    clean_code = code_in.code.strip()
    code_data = TELEGRAM_AUTH_CODES.get(clean_code)
    
    if not code_data or datetime.utcnow() > code_data["expires_at"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kirish kodi noto'g'ri yoki uning muddati o'tgan. Botdan yangi kod oling."
        )
        
    chat_id = code_data["chat_id"]
    first_name = code_data.get("first_name") or "Foydalanuvchi"
    username = code_data.get("username")
    
    # Consume one-time code
    TELEGRAM_AUTH_CODES.pop(clean_code, None)
    
    # Find or register user
    user = db.query(User).filter(User.telegram_chat_id == str(chat_id)).first()
    if not user:
        role = (code_in.role or "BUYER").upper()
        if role not in ["BUYER", "SELLER"]:
            role = "BUYER"
        username_slug = username or str(chat_id)[-6:]
        auto_email = f"tg_{username_slug}@milliynarx.uz"
        if db.query(User).filter(User.email == auto_email).first():
            auto_email = f"tg_{chat_id}@milliynarx.uz"
            
        user = User(
            email=auto_email,
            phone=None,
            hashed_password=get_password_hash(secrets.token_urlsafe(16)),
            role=role,
            is_active=True,
            is_verified=True,
            telegram_chat_id=str(chat_id),
            telegram_username=f"@{username}" if username else first_name,
            telegram_connected_at=datetime.utcnow()
        )
        db.add(user)
        db.flush()
        profile = Profile(user_id=user.id, full_name=first_name)
        db.add(profile)
        
        if role == "SELLER":
            store_name = f"{first_name} Do'koni"
            slug = generate_unique_slug(db, Seller, store_name)
            seller = Seller(
                user_id=user.id,
                store_name=store_name,
                slug=slug,
                status="PENDING",
                rating=0.0,
                rating_count=0
            )
            db.add(seller)
            db.flush()
            seller_prof = SellerProfile(seller_id=seller.id, city="Toshkent")
            db.add(seller_prof)
            
        db.commit()
        db.refresh(user)
    else:
        user.telegram_connected_at = datetime.utcnow()
        if username:
            user.telegram_username = f"@{username}"
        db.commit()
        
    access_token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "full_name": user.profile.full_name if user.profile else first_name,
            "store_name": user.seller.store_name if user.seller else None,
            "seller_status": user.seller.status if user.seller else None,
            "telegram_chat_id": user.telegram_chat_id,
            "telegram_username": user.telegram_username,
            "telegram_connected_at": user.telegram_connected_at
        }
    }


# =======================================================
# GOOGLE OAUTH 2.0 SSO (SINGLE SIGN-ON)
# =======================================================

class GoogleLoginRequest(BaseModel):
    credential: str
    role: Optional[str] = "BUYER"

@router.post("/google", response_model=Token)
def google_auth_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate or register user using Google Identity Services ID Token (JWT).
    Verifies ID token with Google's public tokeninfo endpoint.
    """
    token_str = payload.credential.strip()
    if not token_str:
        raise HTTPException(status_code=400, detail="Google credential token kiritilmadi")

    # Verify with Google API
    try:
        import requests
        resp = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={token_str}",
            timeout=10
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=401,
                detail="Google tokeni haqiqiy emas yoki muddati o'tgan"
            )
        google_data = resp.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Google avtorizatsiya serveri bilan aloqa o'rnatib bo'lmadi: {str(e)}"
        )

    # Validate audience
    expected_aud = settings.GOOGLE_CLIENT_ID
    actual_aud = google_data.get("aud")
    if expected_aud and actual_aud != expected_aud:
        raise HTTPException(
            status_code=401,
            detail="Google Client ID mos kelmadi"
        )

    email = google_data.get("email")
    if not email:
        raise HTTPException(
            status_code=400,
            detail="Google hisobidan elektron pochta olinmadi"
        )

    full_name = google_data.get("name") or email.split("@")[0]
    picture = google_data.get("picture")

    # Find or register user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        role = (payload.role or "BUYER").upper()
        if role not in ["BUYER", "SELLER"]:
            role = "BUYER"

        user = User(
            email=email,
            phone=None,
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
            role=role,
            is_active=True,
            is_verified=True
        )
        db.add(user)
        db.flush()

        profile = Profile(
            user_id=user.id,
            full_name=full_name,
            avatar_url=picture
        )
        db.add(profile)

        if role == "SELLER":
            store_name = f"{full_name} Do'koni"
            slug = generate_unique_slug(db, Seller, store_name)
            seller = Seller(
                user_id=user.id,
                store_name=store_name,
                slug=slug,
                status="PENDING",
                rating=0.0,
                rating_count=0
            )
            db.add(seller)
            db.flush()
            seller_prof = SellerProfile(seller_id=seller.id, city="Toshkent")
            db.add(seller_prof)

        db.commit()
        db.refresh(user)

    else:
        # User already exists - upgrade to SELLER if registering as seller
        if (payload.role or "").upper() == "SELLER" and user.role != "SELLER":
            user.role = "SELLER"
            if not user.seller:
                store_name = f"{full_name} Do'koni"
                slug = generate_unique_slug(db, Seller, store_name)
                seller = Seller(
                    user_id=user.id,
                    store_name=store_name,
                    slug=slug,
                    status="PENDING",
                    rating=0.0,
                    rating_count=0
                )
                db.add(seller)
                db.flush()
                seller_prof = SellerProfile(seller_id=seller.id, city="Toshkent")
                db.add(seller_prof)
            db.commit()
            db.refresh(user)

        # Update profile picture/name if missing
        if user.profile:
            if not user.profile.avatar_url and picture:
                user.profile.avatar_url = picture
            if not user.profile.full_name and full_name:
                user.profile.full_name = full_name
            db.commit()
            db.refresh(user)

    db.refresh(user)
    access_token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "full_name": user.profile.full_name if user.profile else full_name,
            "avatar_url": user.profile.avatar_url if user.profile else picture,
            "store_name": user.seller.store_name if user.seller else None,
            "seller_status": user.seller.status if user.seller else None,
            "telegram_chat_id": user.telegram_chat_id,
            "telegram_username": user.telegram_username,
            "telegram_connected_at": user.telegram_connected_at
        }
    }


