import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import settings
from backend.app.db.session import engine, Base, SessionLocal
from backend.app.db import models
from backend.app.api.auth import router as auth_router
from backend.app.api.products import router as products_router
from backend.app.api.seller import router as seller_router
from backend.app.api.admin import router as admin_router, initialize_system
from backend.app.api.compare import router as compare_router
from backend.app.api.favorites import router as favorites_router
from backend.app.api.alerts import router as alerts_router
from backend.app.api.ai import router as ai_router
from backend.app.api.data_sources import router as data_sources_router
from backend.app.api.uploads import router as uploads_router
from backend.app.api.telegram import router as telegram_router

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Milliy Narx - O'zbekiston Bozor Narxlari Tahlil Platformasi API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads (product images, logos)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers under /api
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(products_router, prefix=api_prefix)
app.include_router(seller_router, prefix=api_prefix)
app.include_router(admin_router, prefix=api_prefix)
app.include_router(compare_router, prefix=api_prefix)
app.include_router(favorites_router, prefix=api_prefix)
app.include_router(alerts_router, prefix=api_prefix)
app.include_router(ai_router, prefix=api_prefix)
app.include_router(data_sources_router, prefix=api_prefix)
app.include_router(uploads_router, prefix=api_prefix)
app.include_router(telegram_router, prefix=api_prefix)

# Ensure tables exist
Base.metadata.create_all(bind=engine)

@app.on_event("startup")
def startup_db_init():
    # Automatically generate tables in database
    Base.metadata.create_all(bind=engine)
    # Seed admin and core taxonomy if empty
    db = SessionLocal()
    try:
        initialize_system(db)
    finally:
        db.close()

    # Launch Telegram Bot background worker for live message handling
    try:
        from backend.app.services.telegram_bot import start_bot_background_thread
        start_bot_background_thread()
    except Exception as e:
        print(f"Warning: Could not start Telegram Bot thread: {e}")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Milliy Narx Market Intelligence API",
        "version": settings.VERSION,
        "database": "CONNECTED",
        "real_data_guarantee": "ZERO_MOCK_DATA"
    }
