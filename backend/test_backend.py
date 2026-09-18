import sys
import os
import tempfile
import uuid

# Add workspace root to sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, PROJECT_ROOT)

# Isolate test database
test_db_file = os.path.join(tempfile.gettempdir(), f"milliynarx_test_{uuid.uuid4().hex[:8]}.db")
os.environ["DATABASE_URL"] = f"sqlite:///{test_db_file.replace(chr(92), '/')}"

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import engine, Base, SessionLocal
from backend.app.api.admin import initialize_system

def test_full_pipeline():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        initialize_system(db)
    finally:
        db.close()

    with TestClient(app) as client:
        print("=== TEST 1: Healthcheck ===")
        res = client.get("/api/health")
        assert res.status_code == 200, res.text
        print("Healthcheck response:", res.json())
        
        print("\n=== TEST 2: Zero Mock Data Verification ===")
        res = client.get("/api/products")
        assert res.status_code == 200
        print(f"Products in fresh database: {len(res.json())} (Must be strictly 0 fake items)")
        assert len(res.json()) == 0, "Error: Found non-zero fake products!"
        
        print("\n=== TEST 3: Admin Login & Real Metrics ===")
        res = client.post("/api/auth/login", json={
            "email": "admin@milliynarx.uz",
            "password": "AdminPass2026!"
        })
        assert res.status_code == 200, res.text
        admin_token = res.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("Admin login successful. Token acquired.")
        
        res = client.get("/api/admin/metrics", headers=admin_headers)
        assert res.status_code == 200, res.text
        metrics = res.json()
        print("Admin Real Database Metrics:", metrics)
        assert metrics["total_products"] == 0
        assert metrics["total_revenue"] == 0.0
        
        print("\n=== TEST 4: Seller Registration (Status = PENDING) ===")
        res = client.post("/api/auth/register", json={
            "email": "seller@artelstore.uz",
            "password": "SellerPassword123!",
            "phone": "+998901112233",
            "role": "SELLER",
            "store_name": "Artel Official Store",
            "business_reg_number": "REG-884920",
            "tax_id": "TIN-992019",
            "location": "Toshkent shahri"
        })
        assert res.status_code == 200, res.text
        seller_token = res.json()["access_token"]
        seller_headers = {"Authorization": f"Bearer {seller_token}"}
        print("Seller registered. Current status:", res.json()["user"]["seller_status"])
        assert res.json()["user"]["seller_status"] == "PENDING"
        
        print("\n=== TEST 5: Admin Approves Seller ===")
        res = client.get("/api/admin/sellers", headers=admin_headers)
        assert res.status_code == 200
        sellers = res.json()
        seller_id = next(s["id"] for s in sellers if s["email"] == "seller@artelstore.uz")
        
        res = client.patch(f"/api/admin/sellers/{seller_id}/status?new_status=APPROVED", headers=admin_headers)
        assert res.status_code == 200
        print("Seller status updated to APPROVED by Admin.")
        
        print("\n=== TEST 6: Approved Seller Creates Real Product ===")
        res = client.post("/api/seller/products", headers=seller_headers, json={
            "name": "Artel Art Inverter 12 Sovutgich",
            "model": "Art-Inv-12",
            "sku": "ART-INV-12000",
            "barcode": "4780001234567",
            "description": "Eng so'nggi invertor texnologiyasiga ega energiya tejamkor konditsioner.",
            "price": 4590000.0,
            "old_price": 4890000.0,
            "currency": "UZS",
            "stock": 15,
            "availability": "IN_STOCK",
            "condition": "NEW",
            "location": "Toshkent",
            "warranty": "3 yil rasmiy kafolat",
            "delivery": "1 kun ichida yetkazib berish bepul",
            "specifications": {
                "Maydon": "35 kv.m gacha",
                "Quvvat": "12000 BTU",
                "Freon turi": "R32"
            },
            "images": ["/uploads/sample-artel.webp"]
        })
        assert res.status_code == 200, res.text
        product = res.json()
        product_id = product["id"]
        print(f"Product created. ID: {product_id}, Status: {product['status']} (Must be PENDING_APPROVAL)")
        assert product["status"] == "PENDING_APPROVAL"
        
        # Verify product is NOT yet in public products
        res = client.get("/api/products")
        assert len(res.json()) == 0, "Pending approval product should not be visible to public!"
        print("Verified: PENDING_APPROVAL product is correctly hidden from public catalog.")
        
        print("\n=== TEST 7: Admin Reviews and Approves Product ===")
        res = client.patch(f"/api/admin/products/{product_id}/status?new_status=ACTIVE", headers=admin_headers)
        assert res.status_code == 200
        print("Product approved to ACTIVE status by Admin.")
        
        print("\n=== TEST 8: Buyer Catalog & Real Search ===")
        res = client.get("/api/products")
        assert len(res.json()) == 1, "Active product should now be visible!"
        print(f"Active products visible to public: {len(res.json())}")
        
        res = client.get("/api/products/search?q=Artel")
        assert len(res.json()) == 1
        print(f"Search for 'Artel' returned: '{res.json()[0]['name']}' at {res.json()[0]['price']:,.0f} so'm")
        
        print("\n=== TEST 9: Real Market Statistics & Price History ===")
        res = client.get(f"/api/products/{product_id}")
        assert res.status_code == 200
        detail = res.json()
        print("Product details fetched.")
        print("Real Price History entries:", len(detail["price_history"]))
        assert len(detail["price_history"]) >= 1
        print("Calculated Market Stats:", detail["market_stats"])
        assert detail["market_stats"]["has_data"] is True
        assert detail["market_stats"]["lowest_price"] == 4590000.0
        
        print("\n=== TEST 10: Real AI Analysis (No Mock Numbers) ===")
        res = client.post("/api/ai/analyze", json={"product_id": product_id})
        assert res.status_code == 200
        ai_res = res.json()
        print("AI Analysis Output:\n", ai_res["analysis_text"])
        assert "4,590,000" in ai_res["analysis_text"] or "4 590 000" in ai_res["analysis_text"] or "4590000" in ai_res["analysis_text"]
        
        print("\n=== ALL 10 BACKEND VERIFICATION TESTS PASSED PERFECTLY! ===")

if __name__ == "__main__":
    test_full_pipeline()
