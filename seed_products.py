import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, PROJECT_ROOT)

from backend.app.db.session import SessionLocal
from backend.app.db.models import (
    Seller, Category, Brand, Product, ProductImage, PriceHistory, Inventory, Offer
)

def seed_marketplace_products():
    db = SessionLocal()
    try:
        current_count = db.query(Product).count()
        if current_count > 0:
            print(f"Products already exist in DB: {current_count}. Skipping seed.")
            return

        seller = db.query(Seller).first()
        if not seller:
            print("No seller found! Please make sure system is initialized.")
            return

        print(f"Using approved seller: '{seller.store_name}' (ID: {seller.id})")

        # Map categories and brands
        cats = {c.name.lower(): c.id for c in db.query(Category).all()}
        # Also map slugs
        cat_slugs = {c.slug: c.id for c in db.query(Category).all()}
        brands = {b.name.lower(): b.id for b in db.query(Brand).all()}

        sample_products = [
            {
                "name": "Apple iPhone 15 Pro 128GB Natural Titanium",
                "slug": "apple-iphone-15-pro-128gb-natural-titanium",
                "model": "A3101",
                "sku": "IPH-15P-128-NT",
                "barcode": "195949012345",
                "brand": "apple",
                "category_slug": "smartfonlar",
                "category_name": "smartfonlar va telefonlar",
                "price": 14200000.0,
                "old_price": 15500000.0,
                "stock": 18,
                "description": "Apple A17 Pro chip, titan korpus, 48 MP asosiy kamera va USB-C porti bilan eng kuchli iPhone.",
                "warranty": "1 yil rasmiy Apple kafolati",
                "image": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80"
            },
            {
                "name": "Samsung Galaxy S24 Ultra 256GB Titanium Gray",
                "slug": "samsung-galaxy-s24-ultra-256gb",
                "model": "SM-S928B",
                "sku": "SAM-S24U-256-GR",
                "barcode": "8806095123456",
                "brand": "samsung",
                "category_slug": "smartfonlar",
                "category_name": "smartfonlar va telefonlar",
                "price": 15800000.0,
                "old_price": 17200000.0,
                "stock": 12,
                "description": "Galaxy AI bilan jihozlangan 200MP kamera, Snapdragon 8 Gen 3 va o'rnatilgan S-Pen stilus.",
                "warranty": "1 yil rasmiy kafolat",
                "image": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80"
            },
            {
                "name": "Artel Grand Inverter 12 Sovutish Tizimi",
                "slug": "artel-grand-inverter-12",
                "model": "ART-INV-12G",
                "sku": "ART-INV-12-WHITE",
                "barcode": "4780012345678",
                "brand": "artel",
                "category_slug": "maishiy-texnika",
                "category_name": "maishiy texnika",
                "price": 4850000.0,
                "old_price": 5200000.0,
                "stock": 25,
                "description": "A+++ energiya samaradorligi, Wi-Fi smart boshqaruv, R32 ekologik freon, 35-40 kv.m maydon uchun.",
                "warranty": "3 yil to'liq kafolat",
                "image": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80"
            },
            {
                "name": "Xiaomi Redmi Note 13 Pro 8/256GB Midnight Black",
                "slug": "xiaomi-redmi-note-13-pro-256gb",
                "model": "2312DRA50G",
                "sku": "XIA-RN13P-256",
                "barcode": "6941812754321",
                "brand": "xiaomi",
                "category_slug": "smartfonlar",
                "category_name": "smartfonlar va telefonlar",
                "price": 3450000.0,
                "old_price": 3800000.0,
                "stock": 30,
                "description": "200 MP ultra-tiniq kamera, 120Hz AMOLED displey, 67W tezkor quvvatlash va 5000 mAh batareya.",
                "warranty": "1 yil rasmiy kafolat",
                "image": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80"
            },
            {
                "name": "Sony PlayStation 5 Slim Digital Edition",
                "slug": "sony-playstation-5-slim-digital",
                "model": "CFI-2000B",
                "sku": "SNY-PS5-SLIM-DE",
                "barcode": "711719572459",
                "brand": "sony",
                "category_slug": "televizorlar",
                "category_name": "televizorlar va audio",
                "price": 6300000.0,
                "old_price": 6800000.0,
                "stock": 10,
                "description": "Yangi ixcham korpus, 1TB tezkor SSD xotira, 4K 120Hz geyming va DualSense haptik boshqaruv.",
                "warranty": "1 yil rasmiy kafolat",
                "image": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80"
            },
            {
                "name": "LG Smart TV 43 LED Full HD AI ThinQ",
                "slug": "lg-smart-tv-43-led-full-hd",
                "model": "43LM6370PLA",
                "sku": "LG-TV-43-FHD",
                "barcode": "8806091234567",
                "brand": "lg",
                "category_slug": "televizorlar",
                "category_name": "televizorlar va audio",
                "price": 3950000.0,
                "old_price": 4300000.0,
                "stock": 14,
                "description": "WebOS Smart tizimi, HDR10 Pro, Dolby Audio va sun'iy intellektga asoslangan ovozli boshqaruv.",
                "warranty": "3 yil rasmiy kafolat",
                "image": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80"
            },
            {
                "name": "HP Victus 15 Gaming Laptop (Core i5 / RTX 3050 / 16GB / 512GB)",
                "slug": "hp-victus-15-gaming-core-i5",
                "model": "15-fa1093dx",
                "sku": "HP-VIC-15-505",
                "barcode": "197029123456",
                "brand": "hp",
                "category_slug": "noutbuklar",
                "category_name": "noutbuklar va kompyuterlar",
                "price": 8900000.0,
                "old_price": 9500000.0,
                "stock": 8,
                "description": "15.6 dyuymli 144Hz FHD ekran, Intel Core i5-13420H, Nvidia GeForce RTX 3050 6GB GDDR6.",
                "warranty": "1 yil rasmiy HP kafolati",
                "image": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80"
            },
            {
                "name": "Lenovo ThinkPad E14 Gen 5 (Ryzen 5 / 16GB / 512GB SSD)",
                "slug": "lenovo-thinkpad-e14-gen-5",
                "model": "21JR0005CD",
                "sku": "LEN-TP-E14-G5",
                "barcode": "196803123456",
                "brand": "lenovo",
                "category_slug": "noutbuklar",
                "category_name": "noutbuklar va kompyuterlar",
                "price": 7900000.0,
                "old_price": 8400000.0,
                "stock": 11,
                "description": "Bardoshli biznes noutbuk, alyuminiy korpus, TrackPoint, 14 dyuym IPS WUXGA displey.",
                "warranty": "2 yil xalqaro kafolat",
                "image": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80"
            },
            {
                "name": "Artel HD 340 Sovutgich (Muzlatgich bilan)",
                "slug": "artel-hd-340-sovutgich",
                "model": "HD-340-RN",
                "sku": "ART-FR-340-SILVER",
                "barcode": "4780098765432",
                "brand": "artel",
                "category_slug": "maishiy-texnika",
                "category_name": "maishiy texnika",
                "price": 3650000.0,
                "old_price": 3950000.0,
                "stock": 16,
                "description": "A+ energiya tejamkorligi, DeFrost tizimi, umumiy hajmi 260 litr, kumushrang chidamli emal.",
                "warranty": "3 yil rasmiy kafolat",
                "image": "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&auto=format&fit=crop&q=80"
            },
            {
                "name": "Samsung Kir Yuvish Mashinasi 7kg EcoBubble",
                "slug": "samsung-kir-yuvish-mashinasi-7kg-ecobubble",
                "model": "WW70TA026AX",
                "sku": "SAM-WM-7KG-EB",
                "barcode": "8806098765432",
                "brand": "samsung",
                "category_slug": "maishiy-texnika",
                "category_name": "maishiy texnika",
                "price": 5400000.0,
                "old_price": 5800000.0,
                "stock": 9,
                "description": "EcoBubble texnologiyasi, bug' bilan tozalash (Hygiene Steam), raqamli inverter motor (10 yil kafolat).",
                "warranty": "3 yil rasmiy kafolat",
                "image": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80"
            }
        ]

        added = 0
        for sp in sample_products:
            # Find category
            cat_id = cat_slugs.get(sp["category_slug"]) or cats.get(sp["category_name"])
            brand_id = brands.get(sp["brand"])

            product = Product(
                seller_id=seller.id,
                category_id=cat_id,
                brand_id=brand_id,
                name=sp["name"],
                slug=sp["slug"],
                model=sp["model"],
                sku=sp["sku"],
                barcode=sp["barcode"],
                description=sp["description"],
                price=sp["price"],
                old_price=sp["old_price"],
                currency="UZS",
                stock=sp["stock"],
                availability="IN_STOCK",
                condition="NEW",
                location="Toshkent shahri",
                warranty=sp["warranty"],
                delivery="1 kun ichida yetkazib berish",
                status="ACTIVE"
            )
            db.add(product)
            db.flush()

            # Image
            img = ProductImage(
                product_id=product.id,
                image_url=sp["image"],
                is_primary=True,
                display_order=0
            )
            db.add(img)

            # Price History
            ph = PriceHistory(
                product_id=product.id,
                seller_id=seller.id,
                price=sp["price"],
                source="MANUAL_SELLER"
            )
            db.add(ph)

            # Inventory
            inv = Inventory(
                product_id=product.id,
                seller_id=seller.id,
                quantity=sp["stock"],
                reserved=0
            )
            db.add(inv)

            # Offer
            offer = Offer(
                product_id=product.id,
                seller_id=seller.id,
                price=sp["price"],
                stock=sp["stock"],
                availability="IN_STOCK"
            )
            db.add(offer)

            added += 1

        db.commit()
        print(f"Successfully seeded {added} real active products into the marketplace!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding products: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_marketplace_products()
