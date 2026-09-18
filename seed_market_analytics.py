import os
import sys
import uuid
import random
from datetime import datetime, timedelta

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, PROJECT_ROOT)

from backend.app.db.session import SessionLocal
from backend.app.db.models import (
    User, Profile, Seller, SellerProfile, Category, Brand, Product, ProductImage,
    PriceHistory, Inventory, Offer, AIAnalysis
)
from backend.app.core.security import get_password_hash

def seed_market_analytics_data():
    db = SessionLocal()
    try:
        print("=== Seeding Milliy Narx Bozor-Analitika Database (Hackathon #19) ===")

        # 1. Categories definitions
        categories_data = [
            {
                "name": "Smartfonlar va gadjetlar",
                "slug": "smartfonlar",
                "icon": "Smartphone",
                "description": "Mobil aloqa vositalari, planshetlar va aqlli gadjetlar ulgurji va chakana bozor takliflari"
            },
            {
                "name": "Noutbuklar va IT-uskunalar",
                "slug": "noutbuklar",
                "icon": "Laptop",
                "description": "Biznes va professional noutbuklar, kompyuter aksessuarlari va IT qurilmalar"
            },
            {
                "name": "Maishiy texnika",
                "slug": "maishiy-texnika",
                "icon": "Home",
                "description": "Konditsionerlar, muzlatgichlar, kir yuvish mashinalari va maishiy elektronika"
            },
            {
                "name": "Qurilish mollari va xomashyo",
                "slug": "qurilish-mollari",
                "icon": "Shield",
                "description": "Armatura, sement, gipsokarton, metall prokat va qurilish xomashyosi ulgurji savdosi"
            },
            {
                "name": "Oziq-ovqat va agrosanoat",
                "slug": "oziq-ovqat",
                "icon": "Cart",
                "description": "Guruch, shakar, o'simlik yog'i, un va qishloq xo'jaligi mahsulotlari B2B ulgurji takliflari"
            },
            {
                "name": "Avtomobil ehtiyot qismlari",
                "slug": "avto",
                "icon": "Car",
                "description": "Avtomobil ehtiyot qismlari, akkumulyatorlar, moylar va avto-aksessuarlar"
            },
            {
                "name": "Televizorlar va audio",
                "slug": "televizorlar",
                "icon": "Tv",
                "description": "Smart televizorlar, akustika tizimlari va multimedia qurilmalari"
            }
        ]

        cat_map = {}
        for cdata in categories_data:
            cat = db.query(Category).filter(Category.slug == cdata["slug"]).first()
            if not cat:
                cat = Category(
                    name=cdata["name"],
                    slug=cdata["slug"],
                    icon=cdata["icon"],
                    description=cdata["description"],
                    is_active=True
                )
                db.add(cat)
                db.flush()
            else:
                cat.name = cdata["name"]
                cat.icon = cdata["icon"]
                cat.description = cdata["description"]
                cat.is_active = True
                db.flush()
            cat_map[cdata["slug"]] = cat

        # 2. Brands
        brands_data = [
            ("Apple", "apple"),
            ("Samsung", "samsung"),
            ("Xiaomi", "xiaomi"),
            ("Artel", "artel"),
            ("HP", "hp"),
            ("Lenovo", "lenovo"),
            ("Sony", "sony"),
            ("LG", "lg"),
            ("Bekobod Metal", "bekobod-metal"),
            ("Qizilqum Sement", "qizilqum-sement"),
            ("Knauf", "knauf"),
            ("Xorazm Shakar", "xorazm-shakar"),
            ("Oltin Kalit", "oltin-kalit"),
            ("Castrol", "castrol"),
            ("Bars", "bars")
        ]
        brand_map = {}
        for bname, bslug in brands_data:
            br = db.query(Brand).filter(Brand.slug == bslug).first()
            if not br:
                br = Brand(name=bname, slug=bslug, is_active=True)
                db.add(br)
                db.flush()
            brand_map[bslug] = br

        # 3. Real B2B Market Sellers across Uzbek major hubs
        sellers_info = [
            {
                "email": "malika.tech@milliynarx.uz",
                "store_name": "Malika Savdo Markazi (TechnoHub)",
                "slug": "malika-technohub",
                "rating": 4.98,
                "city": "Toshkent shahri, Malika bozori, A-24",
                "phone": "+998712001122",
                "warranty_default": "12 oy rasmiy kafolat",
                "delivery_default": "Shahar bo'ylab 2 soatda yetkazish"
            },
            {
                "email": "abusaxiy.trade@milliynarx.uz",
                "store_name": "Abu Saxiy Ulgurji Savdo Markazi",
                "slug": "abu-saxiy-ulgurji",
                "rating": 4.95,
                "city": "Toshkent shahri, Abu Saxiy majmuasi, 7-blok",
                "phone": "+998712003344",
                "warranty_default": "1 yil rasmiy kafolat",
                "delivery_default": "Respublika bo'ylab 24 soatda"
            },
            {
                "email": "chilonzor.b2b@milliynarx.uz",
                "store_name": "Chilonzor B2B Savdo Uyi",
                "slug": "chilonzor-b2b",
                "rating": 4.92,
                "city": "Toshkent shahri, Chilonzor 19-mavze",
                "phone": "+998712005566",
                "warranty_default": "12 oy to'liq kafolat",
                "delivery_default": "1 kunda bepul yetkazib berish"
            },
            {
                "email": "artel.dealer@milliynarx.uz",
                "store_name": "Artel Rasmiy B2B Dileri",
                "slug": "artel-rasmiy-diler",
                "rating": 4.99,
                "city": "Toshkent shahri, Yashnobod texnoparki",
                "phone": "+998712007788",
                "warranty_default": "3 yil to'liq zavod kafolati",
                "delivery_default": "Yetkazib berish va o'rnatish bepul"
            },
            {
                "email": "urikzor.agro@milliynarx.uz",
                "store_name": "O'rikzor Ulgurji Savdo Majmuasi",
                "slug": "urikzor-ulgurji",
                "rating": 4.94,
                "city": "Toshkent viloyati, O'rikzor ulgurji bozori",
                "phone": "+998712009900",
                "warranty_default": "Sifat sertifikati mavjud",
                "delivery_default": "Fura va yuk mashinalarida yetkazish"
            },
            {
                "email": "qoyliq.agro@milliynarx.uz",
                "store_name": "Qo'yliq Agrosanoat B2B Markazi",
                "slug": "qoyliq-agro-b2b",
                "rating": 4.91,
                "city": "Toshkent shahri, Qo'yliq dehqon bozori logistika qismi",
                "phone": "+998712004455",
                "warranty_default": "Standart GOST talablariga mos",
                "delivery_default": "Ulgurji partiyalarni yuklab berish"
            },
            {
                "email": "navoiy.metall@milliynarx.uz",
                "store_name": "Navoiy Standart Qurilish Mollari",
                "slug": "navoiy-standart-stroy",
                "rating": 4.96,
                "city": "Toshkent shahri, Navoiy ko'chasi qurilish bozori",
                "phone": "+998712006677",
                "warranty_default": "Zavod laboratoriya sertifikati",
                "delivery_default": "Kran-manipulyator bilan yetkazish"
            },
            {
                "email": "sergeli.avto@milliynarx.uz",
                "store_name": "Sergeli Avto-Ehtiyot Ulgurji",
                "slug": "sergeli-avto-ulgurji",
                "rating": 4.93,
                "city": "Toshkent shahri, Sergeli mashina bozori",
                "phone": "+998712008899",
                "warranty_default": "6 oy kafolat",
                "delivery_default": "Tezkor yetkazib berish mavjud"
            }
        ]

        seller_map = {}
        for sinfo in sellers_info:
            user = db.query(User).filter(User.email == sinfo["email"]).first()
            if not user:
                user = User(
                    email=sinfo["email"],
                    phone=sinfo["phone"],
                    hashed_password=get_password_hash("SellerPass2026!"),
                    role="SELLER",
                    is_active=True,
                    is_verified=True
                )
                db.add(user)
                db.flush()

                prof = Profile(
                    user_id=user.id,
                    full_name=sinfo["store_name"],
                    phone=sinfo["phone"],
                    bio=sinfo["city"]
                )
                db.add(prof)

            seller = db.query(Seller).filter(Seller.user_id == user.id).first()
            if not seller:
                seller = Seller(
                    user_id=user.id,
                    store_name=sinfo["store_name"],
                    slug=sinfo["slug"],
                    business_reg_number=f"REG-{random.randint(100000, 999999)}",
                    tax_id=f"TIN-{random.randint(100000000, 999999999)}",
                    status="APPROVED",
                    rating=sinfo["rating"],
                    is_verified=True
                )
                db.add(seller)
                db.flush()

                sp = SellerProfile(
                    seller_id=seller.id,
                    description=f"{sinfo['store_name']} - O'zbekiston bozorlarida ishonchli B2B va chakana narxlar hamkori.",
                    address=sinfo["city"],
                    city=sinfo["city"].split(",")[0].strip()
                )
                db.add(sp)
            seller_map[sinfo["slug"]] = seller

        # 4. Products Master Data Catalog (across 7 categories)
        products_catalog = [
            # --- Smartfonlar va gadjetlar ---
            {
                "name": "Apple iPhone 15 Pro 128GB Natural Titanium",
                "slug": "apple-iphone-15-pro-128gb-natural-titanium",
                "model": "A3101",
                "sku": "IPH-15P-128-NT",
                "brand_slug": "apple",
                "category_slug": "smartfonlar",
                "base_price": 14200000.0,
                "old_price": 15600000.0,
                "description": "Apple A17 Pro chip, titan korpus, 48 MP asosiy kamera va USB-C porti. Xalqaro model.",
                "image": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "abu-saxiy-ulgurji", "price": 13950000.0, "stock": 45},
                    {"seller": "malika-technohub", "price": 14200000.0, "stock": 30},
                    {"seller": "chilonzor-b2b", "price": 14500000.0, "stock": 18}
                ]
            },
            {
                "name": "Samsung Galaxy S24 Ultra 12/256GB Titanium Gray",
                "slug": "samsung-galaxy-s24-ultra-256gb-gray",
                "model": "SM-S928B",
                "sku": "SAM-S24U-256-GR",
                "brand_slug": "samsung",
                "category_slug": "smartfonlar",
                "base_price": 15400000.0,
                "old_price": 16900000.0,
                "description": "Galaxy AI bilan jihozlangan 200MP kamera, Snapdragon 8 Gen 3 va o'rnatilgan S-Pen stilus.",
                "image": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "malika-technohub", "price": 15100000.0, "stock": 25},
                    {"seller": "abu-saxiy-ulgurji", "price": 15400000.0, "stock": 40},
                    {"seller": "chilonzor-b2b", "price": 15850000.0, "stock": 12}
                ]
            },
            {
                "name": "Xiaomi 14 Pro 12/256GB Black Leica Optics",
                "slug": "xiaomi-14-pro-12-256gb-black",
                "model": "23116PN5BC",
                "sku": "XIA-14P-256-BLK",
                "brand_slug": "xiaomi",
                "category_slug": "smartfonlar",
                "base_price": 9600000.0,
                "old_price": 10500000.0,
                "description": "Snapdragon 8 Gen 3, Leica Summilux optika linzalari, 120W HyperCharge tezkor quvvatlash.",
                "image": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "abu-saxiy-ulgurji", "price": 9350000.0, "stock": 50},
                    {"seller": "malika-technohub", "price": 9600000.0, "stock": 35},
                    {"seller": "chilonzor-b2b", "price": 9850000.0, "stock": 20}
                ]
            },
            {
                "name": "Xiaomi Redmi Note 13 Pro 8/256GB Midnight Black",
                "slug": "xiaomi-redmi-note-13-pro-8-256gb",
                "model": "2312DRA50G",
                "sku": "XIA-RN13P-256",
                "brand_slug": "xiaomi",
                "category_slug": "smartfonlar",
                "base_price": 3350000.0,
                "old_price": 3750000.0,
                "description": "200 MP kamera, 120Hz AMOLED displey, 67W quvvatlash, 5000 mAh batareya. Ommabop B2B model.",
                "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "abu-saxiy-ulgurji", "price": 3200000.0, "stock": 120},
                    {"seller": "malika-technohub", "price": 3350000.0, "stock": 75},
                    {"seller": "chilonzor-b2b", "price": 3490000.0, "stock": 40}
                ]
            },

            # --- Noutbuklar va IT-uskunalar ---
            {
                "name": "Apple MacBook Air 13 M3 8-core CPU / 8GB / 256GB Space Gray",
                "slug": "apple-macbook-air-13-m3-8gb-256gb",
                "model": "MRXN3",
                "sku": "APL-MBA-M3-13",
                "brand_slug": "apple",
                "category_slug": "noutbuklar",
                "base_price": 13800000.0,
                "old_price": 14900000.0,
                "description": "Apple M3 arxitekturasi, 18 soat batareya avtonomiyasi, Liquid Retina ekran, MagSafe 3.",
                "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "malika-technohub", "price": 13500000.0, "stock": 15},
                    {"seller": "abu-saxiy-ulgurji", "price": 13800000.0, "stock": 25},
                    {"seller": "chilonzor-b2b", "price": 14100000.0, "stock": 10}
                ]
            },
            {
                "name": "HP Victus 15 Gaming Laptop (Core i5-13420H / RTX 3050 6GB / 16GB / 512GB)",
                "slug": "hp-victus-15-gaming-core-i5-rtx3050",
                "model": "15-fa1093dx",
                "sku": "HP-VIC-15-3050",
                "brand_slug": "hp",
                "category_slug": "noutbuklar",
                "base_price": 8600000.0,
                "old_price": 9300000.0,
                "description": "15.6 dyuym 144Hz FHD ekran, Intel Core i5 13-avlod, GeForce RTX 3050 6GB. Ofis va geyming.",
                "image": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "malika-technohub", "price": 8450000.0, "stock": 20},
                    {"seller": "abu-saxiy-ulgurji", "price": 8600000.0, "stock": 35},
                    {"seller": "chilonzor-b2b", "price": 8900000.0, "stock": 14}
                ]
            },
            {
                "name": "Lenovo ThinkPad E14 Gen 5 (AMD Ryzen 5 7530U / 16GB / 512GB SSD)",
                "slug": "lenovo-thinkpad-e14-gen-5-ryzen-5",
                "model": "21JR0005CD",
                "sku": "LEN-TP-E14-G5",
                "brand_slug": "lenovo",
                "category_slug": "noutbuklar",
                "base_price": 7700000.0,
                "old_price": 8300000.0,
                "description": "Korporativ darajadagi noutbuk, alyuminiy korpus, TrackPoint, 14 dyuym IPS WUXGA displey.",
                "image": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "malika-technohub", "price": 7500000.0, "stock": 18},
                    {"seller": "chilonzor-b2b", "price": 7700000.0, "stock": 22},
                    {"seller": "abu-saxiy-ulgurji", "price": 7950000.0, "stock": 30}
                ]
            },

            # --- Maishiy texnika ---
            {
                "name": "Artel Grand Inverter 12 Sovutish Tizimi (Konditsioner)",
                "slug": "artel-grand-inverter-12-konditsioner",
                "model": "ART-INV-12G",
                "sku": "ART-INV-12-WHITE",
                "brand_slug": "artel",
                "category_slug": "maishiy-texnika",
                "base_price": 4750000.0,
                "old_price": 5200000.0,
                "description": "A+++ energiya samaradorligi, Wi-Fi boshqaruv, R32 ekologik freon, 35-40 kv.m maydon uchun.",
                "image": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "artel-rasmiy-diler", "price": 4600000.0, "stock": 60},
                    {"seller": "abu-saxiy-ulgurji", "price": 4750000.0, "stock": 45},
                    {"seller": "chilonzor-b2b", "price": 4950000.0, "stock": 25}
                ]
            },
            {
                "name": "Samsung EcoBubble 7kg Inverter Kir Yuvish Mashinasi",
                "slug": "samsung-ecobubble-7kg-kir-yuvish",
                "model": "WW70TA026AX",
                "sku": "SAM-WM-7KG-EB",
                "brand_slug": "samsung",
                "category_slug": "maishiy-texnika",
                "base_price": 5300000.0,
                "old_price": 5800000.0,
                "description": "EcoBubble ko'pikli tozalash, gigiyenik bug' funksiyasi, 10 yil kafolatli invertor motor.",
                "image": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "abu-saxiy-ulgurji", "price": 5150000.0, "stock": 35},
                    {"seller": "artel-rasmiy-diler", "price": 5300000.0, "stock": 20},
                    {"seller": "chilonzor-b2b", "price": 5550000.0, "stock": 15}
                ]
            },
            {
                "name": "Artel HD 340 Sovutgich (No Frost Kumushrang)",
                "slug": "artel-hd-340-sovutgich-kumushrang",
                "model": "HD-340-RN",
                "sku": "ART-FR-340-SLV",
                "brand_slug": "artel",
                "category_slug": "maishiy-texnika",
                "base_price": 3600000.0,
                "old_price": 3950000.0,
                "description": "A+ sinf tejamkorlik, 260 litr umumiy hajm, kumushrang chidamli qoplama, jim ishlash tizimi.",
                "image": "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "artel-rasmiy-diler", "price": 3480000.0, "stock": 50},
                    {"seller": "abu-saxiy-ulgurji", "price": 3600000.0, "stock": 40},
                    {"seller": "chilonzor-b2b", "price": 3780000.0, "stock": 20}
                ]
            },

            # --- Qurilish mollari va xomashyo (B2B) ---
            {
                "name": "Bekobod Armatura A500C D12mm (1 tonna ulgurji)",
                "slug": "bekobod-armatura-a500c-d12mm-tonna",
                "model": "A500C-D12",
                "sku": "ARM-BK-12-TON",
                "brand_slug": "bekobod-metal",
                "category_slug": "qurilish-mollari",
                "base_price": 8400000.0,
                "old_price": 9100000.0,
                "description": "O'zbekiston metallurgiya kombinati (Bekobod) mahsuloti. Standart GOST 52544-2006. 1 tonna narxi.",
                "image": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "navoiy-standart-stroy", "price": 8200000.0, "stock": 150},
                    {"seller": "chilonzor-b2b", "price": 8400000.0, "stock": 80},
                    {"seller": "abu-saxiy-ulgurji", "price": 8700000.0, "stock": 60}
                ]
            },
            {
                "name": "Qizilqum Sement M500 (50kg qop, ulgurji partiya)",
                "slug": "qizilqum-sement-m500-50kg-qop",
                "model": "M-500-D0",
                "sku": "SEM-QZ-M500",
                "brand_slug": "qizilqum-sement",
                "category_slug": "qurilish-mollari",
                "base_price": 54000.0,
                "old_price": 60000.0,
                "description": "Yuqori mustahkamlikdagi portlendsement. B2B qurilish tashkilotlari uchun zavod kafolati bilan.",
                "image": "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "navoiy-standart-stroy", "price": 51500.0, "stock": 2500},
                    {"seller": "chilonzor-b2b", "price": 54000.0, "stock": 1200},
                    {"seller": "abu-saxiy-ulgurji", "price": 56000.0, "stock": 800}
                ]
            },
            {
                "name": "Knauf Namlikka Chidamli Gipsokarton 12.5mm (GSP-H2)",
                "slug": "knauf-gipsokarton-namlikka-chidamli-12-5mm",
                "model": "GSP-H2-12.5",
                "sku": "KNF-GK-12-GRN",
                "brand_slug": "knauf",
                "category_slug": "qurilish-mollari",
                "base_price": 68000.0,
                "old_price": 75000.0,
                "description": "Knauf Buxoro zavodi mahsuloti, 2500x1200x12.5mm. Ichki pardozlash va vanna xonalari uchun.",
                "image": "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "navoiy-standart-stroy", "price": 65000.0, "stock": 800},
                    {"seller": "chilonzor-b2b", "price": 68000.0, "stock": 450},
                    {"seller": "abu-saxiy-ulgurji", "price": 71000.0, "stock": 300}
                ]
            },

            # --- Oziq-ovqat va agrosanoat (Ulgurji B2B) ---
            {
                "name": "Samarqand Lazir Guruch (1-nav, 50kg qop ulgurji)",
                "slug": "samarqand-lazir-guruch-50kg-qop",
                "model": "LAZIR-SELECT",
                "sku": "AGR-RIC-50-LZR",
                "brand_slug": None,
                "category_slug": "oziq-ovqat",
                "base_price": 950000.0,
                "old_price": 1050000.0,
                "description": "Tanlangan Samarqand Lazir navli tozalangan guruch. Restoranlar, to'yxonalar va ulgurji xaridorlarga.",
                "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "urikzor-ulgurji", "price": 910000.0, "stock": 350},
                    {"seller": "qoyliq-agro-b2b", "price": 950000.0, "stock": 500},
                    {"seller": "chilonzor-b2b", "price": 985000.0, "stock": 120}
                ]
            },
            {
                "name": "Oltin Kalit Rafinatsiyalangan Paxta Yog'i 5 Litr (blok)",
                "slug": "oltin-kalit-paxta-yogi-5-litr",
                "model": "OK-OIL-5L",
                "sku": "OIL-OK-5L-BLK",
                "brand_slug": "oltin-kalit",
                "category_slug": "oziq-ovqat",
                "base_price": 78000.0,
                "old_price": 86000.0,
                "description": "Oliy navli tozalangan paxta yog'i. Standartlashtirilgan O'zDst talablariga mos. Blokda 3 dona.",
                "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "qoyliq-agro-b2b", "price": 74500.0, "stock": 900},
                    {"seller": "urikzor-ulgurji", "price": 78000.0, "stock": 650},
                    {"seller": "chilonzor-b2b", "price": 81000.0, "stock": 300}
                ]
            },
            {
                "name": "Xorazm Shakar Oliy Navli Shakar (50kg qop ulgurji)",
                "slug": "xorazm-shakar-50kg-qop-ulgurji",
                "model": "XOR-SUGAR-50",
                "sku": "AGR-SGR-50KG",
                "brand_slug": "xorazm-shakar",
                "category_slug": "oziq-ovqat",
                "base_price": 540000.0,
                "old_price": 590000.0,
                "description": "Xorazm Shakar OAJ mahsuloti, toza oq qand lavlagi shakari. Qandolatchilar va distribyutorlarga.",
                "image": "https://images.unsplash.com/photo-1612197527762-8efb5314a4ce?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "urikzor-ulgurji", "price": 520000.0, "stock": 800},
                    {"seller": "qoyliq-agro-b2b", "price": 540000.0, "stock": 1100},
                    {"seller": "chilonzor-b2b", "price": 560000.0, "stock": 250}
                ]
            },

            # --- Avtomobil ehtiyot qismlari ---
            {
                "name": "Cobalt / Gentra Old Tormoz Kolodkasi (Koreya Sangsin Hi-Q)",
                "slug": "cobalt-gentra-old-tormoz-kolodkasi-sangsin-hiq",
                "model": "SP-1399",
                "sku": "BRK-HIQ-SP1399",
                "brand_slug": None,
                "category_slug": "avto",
                "base_price": 185000.0,
                "old_price": 220000.0,
                "description": "Original Sangsin Brake (Koreya) disk tormoz kolodkalari. Chevrolet Cobalt va Gentra avtomobillari uchun.",
                "image": "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "sergeli-avto-ulgurji", "price": 170000.0, "stock": 250},
                    {"seller": "chilonzor-b2b", "price": 185000.0, "stock": 90},
                    {"seller": "abu-saxiy-ulgurji", "price": 200000.0, "stock": 60}
                ]
            },
            {
                "name": "Bars Silver 60Ah 540A Avtomobil Akkumulyatori",
                "slug": "bars-silver-60ah-avtomobil-akkumulyatori",
                "model": "BARS-60-SLV",
                "sku": "BAT-BARS-60AH",
                "brand_slug": "bars",
                "category_slug": "avto",
                "base_price": 580000.0,
                "old_price": 640000.0,
                "description": "Kalsiy-kumush texnologiyasi asosida ishlab chiqarilgan kuchli akkumulyator. 18 oy kafolat bilan.",
                "image": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "sergeli-avto-ulgurji", "price": 550000.0, "stock": 120},
                    {"seller": "chilonzor-b2b", "price": 580000.0, "stock": 70},
                    {"seller": "abu-saxiy-ulgurji", "price": 610000.0, "stock": 45}
                ]
            },
            {
                "name": "Castrol Edge 5W-30 Sintetik Motor Moyi 4 Litr",
                "slug": "castrol-edge-5w30-sintetik-motor-moyi-4l",
                "model": "EDGE-5W30-4L",
                "sku": "OIL-CAS-5W30",
                "brand_slug": "castrol",
                "category_slug": "avto",
                "base_price": 490000.0,
                "old_price": 550000.0,
                "description": "Fluid TITANIUM texnologiyasi bilan kuchaytirilgan to'liq sintetik dvigatel moyi. Original Germaniya.",
                "image": "https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "sergeli-avto-ulgurji", "price": 465000.0, "stock": 180},
                    {"seller": "chilonzor-b2b", "price": 490000.0, "stock": 85},
                    {"seller": "abu-saxiy-ulgurji", "price": 520000.0, "stock": 50}
                ]
            },

            # --- Televizorlar va audio ---
            {
                "name": "Samsung 55 Crystal UHD 4K Smart TV",
                "slug": "samsung-55-crystal-uhd-4k-smart-tv",
                "model": "UE55CU7100UXRU",
                "sku": "SAM-TV-55-CU71",
                "brand_slug": "samsung",
                "category_slug": "televizorlar",
                "base_price": 5900000.0,
                "old_price": 6500000.0,
                "description": "Crystal Processor 4K, HDR10+, Tizen OS, yupqa ramkasiz dizayn va sun'iy intellektli ovoz tizimi.",
                "image": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "abu-saxiy-ulgurji", "price": 5700000.0, "stock": 40},
                    {"seller": "malika-technohub", "price": 5900000.0, "stock": 30},
                    {"seller": "chilonzor-b2b", "price": 6200000.0, "stock": 15}
                ]
            },
            {
                "name": "Sony PlayStation 5 Slim Digital Edition 1TB",
                "slug": "sony-playstation-5-slim-digital-1tb",
                "model": "CFI-2000B",
                "sku": "SNY-PS5-SLM-1TB",
                "brand_slug": "sony",
                "category_slug": "televizorlar",
                "base_price": 6250000.0,
                "old_price": 6800000.0,
                "description": "Ixcham korpus, 1TB o'ta tezkor SSD xotira, 4K 120fps geyming va DualSense haptik boshqaruv pulti.",
                "image": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80",
                "sellers": [
                    {"seller": "malika-technohub", "price": 6100000.0, "stock": 35},
                    {"seller": "abu-saxiy-ulgurji", "price": 6250000.0, "stock": 45},
                    {"seller": "chilonzor-b2b", "price": 6490000.0, "stock": 20}
                ]
            }
        ]

        # First, clean existing products to prevent duplicates and ensure multi-seller linkages
        db.query(PriceHistory).delete()
        db.query(Inventory).delete()
        db.query(Offer).delete()
        db.query(ProductImage).delete()
        db.query(Product).delete()
        db.commit()

        print(f"Adding {len(products_catalog)} master products with multi-seller competitive offers...")

        total_created_products = 0
        total_created_offers = 0

        for item in products_catalog:
            cat = cat_map.get(item["category_slug"])
            brand = brand_map.get(item["brand_slug"]) if item.get("brand_slug") else None

            # Primary seller is the first seller in the list
            primary_seller_info = item["sellers"][0]
            primary_seller = seller_map.get(primary_seller_info["seller"])

            p = Product(
                seller_id=primary_seller.id,
                category_id=cat.id if cat else None,
                brand_id=brand.id if brand else None,
                name=item["name"],
                slug=item["slug"],
                model=item["model"],
                sku=item["sku"],
                barcode=str(random.randint(100000000000, 999999999999)),
                description=item["description"],
                price=primary_seller_info["price"],
                old_price=item.get("old_price", primary_seller_info["price"] * 1.1),
                currency="UZS",
                stock=primary_seller_info["stock"],
                availability="IN_STOCK",
                condition="NEW",
                location=primary_seller.profile.city if hasattr(primary_seller, "profile") and primary_seller.profile else "Toshkent shahri",
                warranty="12 oy rasmiy kafolat",
                delivery="1 kunda yetkazib berish",
                status="ACTIVE"
            )
            db.add(p)
            db.flush()

            # Image
            p_img = ProductImage(
                product_id=p.id,
                image_url=item["image"],
                is_primary=True,
                display_order=0
            )
            db.add(p_img)

            # Historical Price records for charts (30 days, 20 days, 10 days, 5 days ago, and today)
            price_points = [
                (datetime.utcnow() - timedelta(days=28), item["base_price"] * 1.06),
                (datetime.utcnow() - timedelta(days=21), item["base_price"] * 1.04),
                (datetime.utcnow() - timedelta(days=14), item["base_price"] * 1.02),
                (datetime.utcnow() - timedelta(days=7), item["base_price"] * 1.01),
                (datetime.utcnow(), primary_seller_info["price"])
            ]
            for r_date, r_price in price_points:
                ph = PriceHistory(
                    product_id=p.id,
                    seller_id=primary_seller.id,
                    price=round(r_price, -3), # round to thousands
                    source="AGGREGATED_MARKET",
                    recorded_at=r_date
                )
                db.add(ph)

            # Primary Product Inventory
            inv = Inventory(
                product_id=p.id,
                seller_id=primary_seller.id,
                quantity=primary_seller_info["stock"],
                reserved=0
            )
            db.add(inv)

            # Competing seller listings for this exact model (creating market spread!)
            for s_idx, comp_seller_data in enumerate(item["sellers"]):
                s_obj = seller_map.get(comp_seller_data["seller"])
                if not s_obj:
                    continue

                # Add Offer record for primary product
                off = Offer(
                    product_id=p.id,
                    seller_id=s_obj.id,
                    price=comp_seller_data["price"],
                    stock=comp_seller_data["stock"],
                    availability="IN_STOCK"
                )
                db.add(off)
                total_created_offers += 1

                # If not primary seller, also create a sibling product entry with same model so queries find it
                if s_idx > 0:
                    comp_product = Product(
                        seller_id=s_obj.id,
                        category_id=cat.id if cat else None,
                        brand_id=brand.id if brand else None,
                        name=item["name"],
                        slug=f"{item['slug']}-{s_obj.slug}",
                        model=item["model"],
                        sku=f"{item['sku']}-{s_idx}",
                        barcode=str(random.randint(100000000000, 999999999999)),
                        description=item["description"],
                        price=comp_seller_data["price"],
                        old_price=item.get("old_price"),
                        currency="UZS",
                        stock=comp_seller_data["stock"],
                        availability="IN_STOCK",
                        condition="NEW",
                        location=s_obj.profile.city if hasattr(s_obj, "profile") and s_obj.profile else "Toshkent shahri",
                        warranty="Rasmiy kafolat",
                        delivery="Yetkazib beriladi",
                        status="ACTIVE"
                    )
                    db.add(comp_product)
                    db.flush()

                    comp_img = ProductImage(
                        product_id=comp_product.id,
                        image_url=item["image"],
                        is_primary=True,
                        display_order=0
                    )
                    db.add(comp_img)

                    # Comp seller inventory
                    inv_comp = Inventory(
                        product_id=comp_product.id,
                        seller_id=s_obj.id,
                        quantity=comp_seller_data["stock"],
                        reserved=0
                    )
                    db.add(inv_comp)

                    # Comp seller price history
                    ph_comp = PriceHistory(
                        product_id=comp_product.id,
                        seller_id=s_obj.id,
                        price=comp_seller_data["price"],
                        source="SELLER_DIRECT",
                        recorded_at=datetime.utcnow()
                    )
                    db.add(ph_comp)
                    total_created_products += 1

        db.commit()
        print(f"SUCCESS: Seeded {len(sellers_info)} B2B Sellers, {len(categories_data)} Categories, {total_created_products} Products, and {total_created_offers} Offers!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_market_analytics_data()
