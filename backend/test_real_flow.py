import requests

BASE_URL = "http://127.0.0.1:8000/api"

def test_full_real_flow():
    print("=== Testing Real Flow: Login, Register, Approve ===")
    
    # 1. Login as Admin
    print("\n1. Testing Admin Login...")
    admin_login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@milliynarx.uz",
        "password": "AdminPass2026!"
    })
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_data = admin_login_res.json()
    admin_token = admin_data["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"   [SUCCESS] Admin logged in. Role: {admin_data['user']['role']}")

    # 2. Get Admin Metrics
    print("\n2. Testing Admin Metrics from real database...")
    metrics_res = requests.get(f"{BASE_URL}/admin/metrics", headers=admin_headers)
    assert metrics_res.status_code == 200, f"Get metrics failed: {metrics_res.text}"
    metrics = metrics_res.json()
    print(f"   [SUCCESS] Real DB metrics: {metrics}")

    # 3. Register a new Seller
    seller_email = "test_seller_artel@milliynarx.uz"
    print(f"\n3. Registering a real seller: {seller_email}...")
    seller_reg_payload = {
        "email": seller_email,
        "phone": "+998901112233",
        "password": "SellerPass2026!",
        "role": "SELLER",
        "store_name": "Artel Official Store",
        "business_reg_number": "REG-2026-001",
        "tax_id": "305123456",
        "location": "Toshkent shahri"
    }
    seller_reg_res = requests.post(f"{BASE_URL}/auth/register", json=seller_reg_payload)
    if seller_reg_res.status_code == 400 and "allaqachon" in seller_reg_res.text:
        # Seller already registered, log in
        print("   Seller already exists, logging in...")
        seller_login_res = requests.post(f"{BASE_URL}/auth/login", json={
            "email": seller_email,
            "password": "SellerPass2026!"
        })
        seller_data = seller_login_res.json()
    else:
        assert seller_reg_res.status_code == 200, f"Seller reg failed: {seller_reg_res.text}"
        seller_data = seller_reg_res.json()

    seller_token = seller_data["access_token"]
    seller_headers = {"Authorization": f"Bearer {seller_token}"}
    print(f"   [SUCCESS] Seller registered/logged in. Initial status: {seller_data['user'].get('seller_status')}")

    # 4. Admin checks sellers and approves the seller
    print("\n4. Admin checks sellers list...")
    sellers_res = requests.get(f"{BASE_URL}/admin/sellers", headers=admin_headers)
    assert sellers_res.status_code == 200
    sellers = sellers_res.json()
    our_seller = next((s for s in sellers if s["email"] == seller_email), None)
    assert our_seller is not None, "Seller not found in admin sellers list"
    seller_id = our_seller["id"]
    print(f"   Found seller ID: {seller_id}, current status: {our_seller['status']}")

    if our_seller["status"] != "APPROVED":
        print(f"   Admin approving seller {seller_id}...")
        approve_res = requests.patch(f"{BASE_URL}/admin/sellers/{seller_id}/status?new_status=APPROVED", headers=admin_headers)
        assert approve_res.status_code == 200, f"Approve failed: {approve_res.text}"
        print(f"   [SUCCESS] Seller approved: {approve_res.json()}")

    # 5. Seller adds a real product
    print("\n5. Seller adding a product...")
    product_payload = {
        "name": "Artel Smart TV 43 LED Full HD",
        "price": 3150000.0,
        "old_price": 3500000.0,
        "currency": "UZS",
        "stock": 15,
        "availability": "IN_STOCK",
        "condition": "NEW",
        "location": "Toshkent shahri",
        "warranty": "3 yil rasmiy kafolat",
        "delivery": "1 kunda bepul yetkazish",
        "specifications": {
            "Ekran diagonali": "43 dyuym",
            "Ruxsat": "1920x1080 Full HD",
            "Smart TV": "Android TV"
        },
        "images": []
    }
    create_prod_res = requests.post(f"{BASE_URL}/seller/products", json=product_payload, headers=seller_headers)
    assert create_prod_res.status_code == 200, f"Create product failed: {create_prod_res.text}"
    prod_data = create_prod_res.json()
    product_id = prod_data["id"]
    print(f"   [SUCCESS] Product created: {prod_data['name']}, status: {prod_data['status']}")

    # 6. Admin moderates and approves the product
    print(f"\n6. Admin approving product {product_id}...")
    approve_prod_res = requests.patch(f"{BASE_URL}/admin/products/{product_id}/status?new_status=ACTIVE", headers=admin_headers)
    assert approve_prod_res.status_code == 200, f"Approve product failed: {approve_prod_res.text}"
    print(f"   [SUCCESS] Product approved and activated: {approve_prod_res.json()}")

    # 7. Check public marketplace listing
    print("\n7. Verifying product in public catalog...")
    public_prods_res = requests.get(f"{BASE_URL}/products")
    assert public_prods_res.status_code == 200
    public_products = public_prods_res.json()
    found_in_public = any(p["id"] == product_id for p in public_products)
    assert found_in_public, "Approved product is not found in public catalog!"
    print(f"   [SUCCESS] Product is LIVE on public marketplace! Found: {[p['name'] for p in public_products]}")

    # 8. Check audit log
    print("\n8. Checking Admin Audit Logs...")
    audit_res = requests.get(f"{BASE_URL}/admin/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    print(f"   [SUCCESS] Audit logs recorded {len(logs)} actions. Latest action: {logs[0]['action']} on {logs[0]['entity_type']}")

    print("\n=== ALL FLOWS VERIFIED SUCCESSFULLY (100% REAL LIVE DATA) ===")

if __name__ == "__main__":
    test_full_real_flow()
