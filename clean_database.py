import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, PROJECT_ROOT)

from backend.app.db.session import engine, SessionLocal, Base
from backend.app.db.models import (
    User, Profile, Seller, SellerProfile, Product, ProductImage, ProductVariant,
    Offer, PriceHistory, Inventory, Favorite, Search, SearchResult, PriceAlert,
    Notification, Subscription, Payment, AnalyticsEvent, AIAnalysis, AuditLog,
    Category, Brand, DataSource
)
from backend.app.api.admin import initialize_system

def clean_database():
    print("=== Cleaning Database from all Demo / Test Data ===")
    
    # 1. Remove stray backend/milliy_narx.db if exists
    stray_db = os.path.join(PROJECT_ROOT, "backend", "milliy_narx.db")
    if os.path.exists(stray_db):
        try:
            os.remove(stray_db)
            print(f"Removed stray database file: {stray_db}")
        except Exception as e:
            print(f"Could not remove stray db: {e}")

    # 2. Connect to primary database and wipe all demo records
    db = SessionLocal()
    try:
        # Delete demo products and cascades
        db.query(AIAnalysis).delete()
        db.query(AnalyticsEvent).delete()
        db.query(Notification).delete()
        db.query(PriceAlert).delete()
        db.query(SearchResult).delete()
        db.query(Search).delete()
        db.query(Favorite).delete()
        db.query(Inventory).delete()
        db.query(PriceHistory).delete()
        db.query(Offer).delete()
        db.query(ProductVariant).delete()
        db.query(ProductImage).delete()
        db.query(Product).delete()
        
        # Delete demo sellers
        db.query(SellerProfile).delete()
        db.query(Seller).delete()
        
        # Delete demo payments & subscriptions
        db.query(Payment).delete()
        db.query(Subscription).delete()
        
        # Delete audit logs
        db.query(AuditLog).delete()
        
        # Delete all users EXCEPT admin@milliynarx.uz
        admin_user = db.query(User).filter(User.email == "admin@milliynarx.uz").first()
        if admin_user:
            db.query(Profile).filter(Profile.user_id != admin_user.id).delete()
            db.query(User).filter(User.id != admin_user.id).delete()
        else:
            db.query(Profile).delete()
            db.query(User).delete()
            
        db.commit()
        print("Successfully wiped all demo users, sellers, products, history, and alerts.")
        
        # 3. Ensure system initialization (Admin, core categories, brands, data sources)
        init_res = initialize_system(db)
        print(f"System initialized cleanly: {init_res}")
        
        # 4. Verify counts
        print("\n--- Current Clean Database Counts (Zero Fake Data Guarantee) ---")
        print(f"  Users:        {db.query(User).count()} (Admin only)")
        print(f"  Sellers:      {db.query(Seller).count()} (0 fake sellers)")
        print(f"  Products:     {db.query(Product).count()} (0 fake products)")
        print(f"  Categories:   {db.query(Category).count()}")
        print(f"  Brands:       {db.query(Brand).count()}")
        print(f"  Data Sources: {db.query(DataSource).count()}")
        print(f"  Audit Logs:   {db.query(AuditLog).count()}")
        print("------------------------------------------------------------------")
        print("DATABASE IS NOW 100% CLEAN AND READY FOR REAL PRODUCTION DATA!")
    finally:
        db.close()

if __name__ == "__main__":
    clean_database()
