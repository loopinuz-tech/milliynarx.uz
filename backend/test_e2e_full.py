import os
import sys
import tempfile
import uuid

# Ensure workspace root is on sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, PROJECT_ROOT)

# Use an isolated temporary SQLite DB for completely clean, zero-pollution E2E testing
test_db_file = os.path.join(tempfile.gettempdir(), f"milliynarx_e2e_{uuid.uuid4().hex[:8]}.db")
os.environ["DATABASE_URL"] = f"sqlite:///{test_db_file.replace(chr(92), '/')}"

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import engine, Base, SessionLocal
from backend.app.api.admin import initialize_system

def run_e2e_verification():
    print("=" * 70)
    print("MILLIY NARX — 11 BOSQICHLI TO'LIQ END-TO-END VERIFIKATSIYA TESTI")
    print("=" * 70)
    print(f"Test DB: {os.environ['DATABASE_URL']}")
    
    # Initialize fresh database schema
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        init_res = initialize_system(db)
        print(f"\n[QADAM 1] Tizim ishga tushirildi: Admin={init_res['admin_email']}")
    finally:
        db.close()

    with TestClient(app) as client:
        # 1. Healthcheck
        print("\n--- 1. Healthcheck & DB Bog'lanishi ---")
        res = client.get("/api/health")
        assert res.status_code == 200, res.text
        health = res.json()
        assert health["status"] == "healthy"
        assert health["database"] == "CONNECTED"
        assert health["real_data_guarantee"] == "ZERO_MOCK_DATA"
        print(f"  [OK] Server sog'lom: {health['service']} (v{health['version']})")

        # 2. Zero Fake Data Guarantee in empty DB
        print("\n--- 2. Zero Fake Data kafolatini tekshirish ---")
        res = client.get("/api/products")
        assert res.status_code == 200
        assert len(res.json()) == 0, f"Kutilmagan soxta mahsulotlar topildi: {len(res.json())}"
        print("  [OK] Yangi bazada 0 ta soxta mahsulot (100% haqiqiy bo'sh holat)")

        # 3. Admin Login & Real Metrics
        print("\n--- 3. Administrator Autentifikatsiyasi & Real Metrikalar ---")
        admin_login = client.post("/api/auth/login", json={
            "email": "admin@milliynarx.uz",
            "password": "AdminPass2026!"
        })
        assert admin_login.status_code == 200, f"Admin kirishda xatolik: {admin_login.text}"
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("  [OK] Admin tizimga kirdi (JWT token olindi)")

        metrics_res = client.get("/api/admin/metrics", headers=admin_headers)
        assert metrics_res.status_code == 200
        metrics = metrics_res.json()
        assert metrics["total_products"] == 0
        assert metrics["total_sellers"] == 0
        assert metrics["total_revenue"] == 0.0
        print(f"  [OK] Haqiqiy bazaviy metrikalar: foydalanuvchilar={metrics['total_users']}, mahsulotlar={metrics['total_products']}, tushum={metrics['total_revenue']} so'm")

        # 4. Seller Registration (Status = PENDING)
        print("\n--- 4. Sotuvchi ro'yxatdan o'tishi (Dastlabki status: PENDING) ---")
        seller_email = "artel_official@milliynarx.uz"
        seller_reg = client.post("/api/auth/register", json={
            "email": seller_email,
            "password": "SellerSecure2026!",
            "phone": "+998901234567",
            "role": "SELLER",
            "store_name": "Artel Electronics Rasmiy Do'koni",
            "business_reg_number": "REG-2026-UZB-991",
            "tax_id": "301982341",
            "location": "Toshkent shahri, Yashnobod tumani"
        })
        assert seller_reg.status_code == 200, f"Sotuvchi ro'yxatdan o'tmadi: {seller_reg.text}"
        seller_token = seller_reg.json()["access_token"]
        seller_headers = {"Authorization": f"Bearer {seller_token}"}
        assert seller_reg.json()["user"]["seller_status"] == "PENDING"
        print(f"  [OK] Sotuvchi ro'yxatdan o'tdi. Do'kon: '{seller_reg.json()['user']['store_name']}', Maqom: {seller_reg.json()['user']['seller_status']}")

        # 5. Security check: PENDING seller CANNOT create products
        print("\n--- 5. Xavfsizlik: PENDING holatdagi sotuvchi mahsulot qo'sha olmasligi ---")
        unapproved_add = client.post("/api/seller/products", headers=seller_headers, json={
            "name": "Artel Sovutgich",
            "price": 3500000.0,
            "stock": 5
        })
        assert unapproved_add.status_code == 403, f"Tasdiqlanmagan sotuvchi mahsulot qo'shib qo'ydi! Status: {unapproved_add.status_code}"
        print("  [OK] Tasdiqlanmagan sotuvchi bloklandi: HTTP 403 Forbidden")

        # 6. Admin moderates and approves Seller
        print("\n--- 6. Admin do'konni tekshirishi va tasdiqlashi (APPROVED) ---")
        sellers_list = client.get("/api/admin/sellers", headers=admin_headers).json()
        assert len(sellers_list) >= 1
        target_seller = next(s for s in sellers_list if s["email"] == seller_email)
        seller_id = target_seller["id"]
        assert target_seller["status"] == "PENDING"

        approve_seller_res = client.patch(
            f"/api/admin/sellers/{seller_id}/status?new_status=APPROVED",
            headers=admin_headers
        )
        assert approve_seller_res.status_code == 200, approve_seller_res.text
        print(f"  [OK] Admin '{target_seller['store_name']}' do'konini tasdiqladi (APPROVED)")

        # 7. Approved Seller adds real product (Status = PENDING_APPROVAL)
        print("\n--- 7. Tasdiqlangan sotuvchi mahsulot qo'shishi (PENDING_APPROVAL) ---")
        product_payload = {
            "name": "Artel Grand Inverter 12 Sovutish Tizimi",
            "model": "ART-INV-12G",
            "sku": "ART-INV-12-WHITE",
            "barcode": "4780012345678",
            "description": "A+++ energiya samaradorligi, Wi-Fi smart boshqaruv, R32 ekologik freon.",
            "price": 4850000.0,
            "old_price": 5200000.0,
            "currency": "UZS",
            "stock": 20,
            "availability": "IN_STOCK",
            "condition": "NEW",
            "location": "Toshkent",
            "warranty": "3 yil rasmiy kafolat",
            "delivery": "1 kunda bepul yetkazib berish",
            "specifications": {
                "Tavsiya etilgan maydon": "35-40 kv.m",
                "Quvvat": "12000 BTU",
                "Shovqin darajasi": "22 dB",
                "Kompressor turi": "Inverter"
            },
            "images": ["/uploads/artel-inverter-12.webp"]
        }
        prod_create_res = client.post("/api/seller/products", headers=seller_headers, json=product_payload)
        assert prod_create_res.status_code == 200, prod_create_res.text
        created_prod = prod_create_res.json()
        product_id = created_prod["id"]
        assert created_prod["status"] == "PENDING_APPROVAL"
        print(f"  [OK] Mahsulot kiritildi: ID={product_id}, Maqomi: {created_prod['status']}")

        # 8. Catalog Isolation: PENDING_APPROVAL product is hidden from public catalog & search
        print("\n--- 8. Katalog Izolyatsiyasi: Kutilayotgan mahsulot ommaga ko'rinmasligi ---")
        public_catalog = client.get("/api/products").json()
        assert len(public_catalog) == 0, "PENDING_APPROVAL mahsulot ommaviy katalogda ko'rindi!"
        search_res = client.get("/api/products/search?q=Artel").json()
        assert len(search_res) == 0, "PENDING_APPROVAL mahsulot qidiruvda ko'rindi!"
        print("  [OK] Kutilayotgan mahsulot ommaviy katalog va qidiruvdan to'liq yashirilgan")

        # 9. Admin reviews and approves Product to ACTIVE
        print("\n--- 9. Admin mahsulot moderatsiyasi & ACTIVE holatiga o'tkazish ---")
        pending_prods = client.get("/api/admin/products?status_filter=PENDING_APPROVAL", headers=admin_headers).json()
        assert any(p["id"] == product_id for p in pending_prods)

        approve_prod_res = client.patch(
            f"/api/admin/products/{product_id}/status?new_status=ACTIVE",
            headers=admin_headers
        )
        assert approve_prod_res.status_code == 200, approve_prod_res.text
        print("  [OK] Admin mahsulotni tasdiqladi (ACTIVE holatiga o'tkazildi)")

        # 10. Public Catalog & Real Search Flow
        print("\n--- 10. Ommaviy Katalog & Qidiruv Oqimi (Search -> Product) ---")
        public_catalog = client.get("/api/products").json()
        assert len(public_catalog) == 1
        assert public_catalog[0]["id"] == product_id
        print(f"  [OK] Ommaviy katalogda faol mahsulot paydo bo'ldi: '{public_catalog[0]['name']}'")

        search_res = client.get("/api/products/search?q=Inverter").json()
        assert len(search_res) == 1
        assert search_res[0]["id"] == product_id
        print(f"  [OK] Qidiruv 'Inverter' bo'yicha mahsulotni topdi: Narxi={search_res[0]['price']:,.0f} so'm")

        # 11. Product Detail, Real Market Stats & Price History
        print("\n--- 11. Mahsulot Tafsilotlari & Bozor Statistikasi ---")
        detail_res = client.get(f"/api/products/{product_id}")
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["product"]["id"] == product_id
        assert len(detail["price_history"]) >= 1
        assert detail["market_stats"]["has_data"] is True
        assert detail["market_stats"]["lowest_price"] == 4850000.0
        assert detail["market_stats"]["average_price"] == 4850000.0
        assert detail["market_stats"]["seller_count"] == 1
        print(f"  [OK] Bozor statistikasi: Eng past={detail['market_stats']['lowest_price']:,.0f}, O'rtacha={detail['market_stats']['average_price']:,.0f}")
        print(f"  [OK] Boshlang'ich narx tarixi qaydlari soni: {len(detail['price_history'])}")

        # 12. Buyer Registration & Favorites Flow
        print("\n--- 12. Xaridor Ro'yxatdan O'tishi & Sevimlilar Oqimi ---")
        buyer_email = "buyer_jasur@milliynarx.uz"
        buyer_reg = client.post("/api/auth/register", json={
            "email": buyer_email,
            "password": "BuyerPass2026!",
            "phone": "+998939998877",
            "role": "BUYER"
        })
        assert buyer_reg.status_code == 200
        buyer_token = buyer_reg.json()["access_token"]
        buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
        print("  [OK] Xaridor ro'yxatdan o'tdi va tizimga kirdi")

        fav_toggle = client.post(f"/api/favorites/{product_id}", headers=buyer_headers)
        assert fav_toggle.status_code == 200
        assert fav_toggle.json()["favorited"] is True
        fav_list = client.get("/api/favorites", headers=buyer_headers).json()
        assert len(fav_list) == 1
        assert fav_list[0]["product_id"] == product_id
        print("  [OK] Mahsulot xaridorning sevimlilar ro'yxatiga qo'shildi")

        # 13. Buyer sets Price Alert
        print("\n--- 13. Xaridor Narx Ogohlantirishini Belgilashi (Price Alert) ---")
        alert_res = client.post("/api/alerts", headers=buyer_headers, json={
            "product_id": product_id,
            "target_price": 4500000.0 # Alert when price drops <= 4.5M
        })
        assert alert_res.status_code == 200
        alert_data = alert_res.json()
        assert alert_data["is_active"] is True
        assert alert_data["triggered"] is False
        assert alert_data["target_price"] == 4500000.0
        print(f"  [OK] Narx ogohlantirishi yaratildi: Maqsadli narx <= {alert_data['target_price']:,.0f} so'm")

        # 14. Seller reduces price -> Price History updated -> Alert triggered & Notification sent
        print("\n--- 14. Sotuvchi narxni tushirishi -> Ogohlantirish ishga tushishi & Bildirishnoma ---")
        new_price = 4450000.0 # Dropped below 4,500,000
        update_price_res = client.patch(
            f"/api/seller/products/{product_id}",
            headers=seller_headers,
            json={"price": new_price}
        )
        assert update_price_res.status_code == 200
        assert update_price_res.json()["price"] == new_price
        print(f"  [OK] Sotuvchi narxni {new_price:,.0f} so'mga tushirdi")

        # Verify buyer received PRICE_DROP notification
        buyer_notifs = client.get("/api/alerts/notifications", headers=buyer_headers).json()
        assert len(buyer_notifs) >= 1
        price_drop_notif = next((n for n in buyer_notifs if n["type"] == "PRICE_DROP"), None)
        assert price_drop_notif is not None, "PRICE_DROP bildirishnomasi xaridorga yetib bormadi!"
        print(f"  [OK] Xaridorga avtomatik bildirishnoma bordi: '{price_drop_notif['title']}' — {price_drop_notif['message']}")

        # Verify alert marked as triggered
        buyer_alerts = client.get("/api/alerts", headers=buyer_headers).json()
        our_alert = next(a for a in buyer_alerts if a["id"] == alert_data["id"])
        assert our_alert["triggered"] is True
        assert our_alert["is_active"] is False
        print("  [OK] Narx ogohlantirishi muvaffaqiyatli 'triggered=True' holatiga o'tdi")

        # Mark notification as read
        read_res = client.patch(f"/api/alerts/notifications/{price_drop_notif['id']}/read", headers=buyer_headers)
        assert read_res.status_code == 200
        print("  [OK] Bildirishnoma o'qilgan deb belgilandi")

        # 15. AI Market Analysis with Real Database Metrics
        print("\n--- 15. Sun'iy Intellekt Bozor Tahlili (Faqat Real Bazadagi Raqamlar) ---")
        ai_res = client.post("/api/ai/analyze", json={"product_id": product_id})
        assert ai_res.status_code == 200, ai_res.text
        ai_data = ai_res.json()
        assert ai_data["status"] == "SUCCESS"
        assert len(ai_data["analysis_text"]) > 20
        assert ai_data["metrics_used"]["current_price"] == 4450000.0
        print(f"  [OK] AI Tahlil natijasi:\n      \"{ai_data['analysis_text']}\"")
        print(f"  [OK] AI hisob-kitob ko'rsatkichlari: {ai_data['metrics_used']}")

        # 16. Compare Flow (Search -> Multiple Products -> Compare)
        print("\n--- 16. Mahsulotlarni Taqqoslash Oqimi (/api/compare) ---")
        # Add 2nd product to compare
        prod2_payload = {
            "name": "Samsung WindFree 12 Smart Konditsioner",
            "model": "AR12TXEAAWKNER",
            "price": 5990000.0,
            "currency": "UZS",
            "stock": 10,
            "availability": "IN_STOCK",
            "condition": "NEW",
            "location": "Toshkent",
            "specifications": {
                "Tavsiya etilgan maydon": "35 kv.m",
                "Quvvat": "12000 BTU",
                "Shovqin darajasi": "19 dB",
                "Kompressor turi": "Digital Inverter 8-Pole"
            }
        }
        prod2_res = client.post("/api/seller/products", headers=seller_headers, json=prod2_payload)
        prod2_id = prod2_res.json()["id"]
        # Admin approves prod2
        client.patch(f"/api/admin/products/{prod2_id}/status?new_status=ACTIVE", headers=admin_headers)

        compare_res = client.get(f"/api/compare?ids={product_id},{prod2_id}")
        assert compare_res.status_code == 200
        comp_data = compare_res.json()
        assert len(comp_data["products"]) == 2
        assert "Quvvat" in comp_data["specification_keys"]
        print(f"  [OK] 2 ta faol mahsulot solishtirildi: '{comp_data['products'][0]['name']}' vs '{comp_data['products'][1]['name']}'")
        print(f"  [OK] Umumiy xususiyatlar kalitlari: {comp_data['specification_keys']}")

        # 17. Data Sources Status Verification
        print("\n--- 17. Ma'lumot Manbalari & Adapterlar Holati ---")
        ds_res = client.get("/api/data-sources")
        assert ds_res.status_code == 200
        sources = ds_res.json()
        uzum_src = next(s for s in sources if s["adapter_code"] == "UZUM")
        manual_src = next(s for s in sources if s["adapter_code"] == "MANUAL_SELLER")
        assert uzum_src["status"] == "NOT_CONFIGURED"
        assert manual_src["status"] == "CONNECTED"
        print(f"  [OK] Uzum Market adapter holati: {uzum_src['status']} (Zero Fake API)")
        print(f"  [OK] Manual sotuvchilar adapter holati: {manual_src['status']}")

        # 18. Audit Logs Completeness
        print("\n--- 18. Audit Jurnali & Administrator Harakatlari Arxivini Tekshirish ---")
        audit_res = client.get("/api/admin/audit-logs", headers=admin_headers)
        assert audit_res.status_code == 200
        logs = audit_res.json()
        assert len(logs) >= 3 # Seller approve, Prod 1 approve, Prod 2 approve
        actions = [l["action"] for l in logs]
        assert "UPDATE_SELLER_STATUS" in actions
        assert "UPDATE_PRODUCT_STATUS" in actions
        print(f"  [OK] Jami {len(logs)} ta audit qaydi mavjud. Qayd etilgan amallar: {set(actions)}")

    print("\n" + "=" * 70)
    print("BARCHA 18 TA REAL END-TO-END BOSQICH 100% MUVAFFAQIYATLI O'TDI!")
    print("=" * 70)
    
    # Clean up test DB
    try:
        if os.path.exists(test_db_file):
            os.remove(test_db_file)
    except Exception:
        pass

if __name__ == "__main__":
    run_e2e_verification()
