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
    PriceHistory, Inventory, Offer
)
from backend.app.core.security import get_password_hash

def seed_14_categories_marketplace():
    db = SessionLocal()
    try:
        print("=== Seeding Exactly 14 Clean B2B Categories with Unique Master Products ===")

        # 1. Exactly 14 Comprehensive B2B and Market Categories
        categories_14 = [
            {
                "name": "Smartfonlar va gadjetlar",
                "slug": "smartfonlar",
                "icon": "Smartphone",
                "description": "Mobil aloqa vositalari, planshetlar va aqlli aksessuarlar ulgurji va chakana savdosi"
            },
            {
                "name": "Noutbuklar va IT-uskunalar",
                "slug": "noutbuklar",
                "icon": "Laptop",
                "description": "Biznes va professional noutbuklar, kompyuter komponentlari va tarmoq uskunalari"
            },
            {
                "name": "Maishiy texnika",
                "slug": "maishiy-texnika",
                "icon": "Home",
                "description": "Konditsionerlar, muzlatgichlar, kir yuvish mashinalari va oshxona texnikasi"
            },
            {
                "name": "Televizorlar va audio",
                "slug": "televizorlar",
                "icon": "Tv",
                "description": "Smart 4K televizorlar, geyming konsollari va akustik tizimlar"
            },
            {
                "name": "Qurilish mollari va xomashyo",
                "slug": "qurilish-mollari",
                "icon": "Shield",
                "description": "Armatura, sement, gipsokarton, metall prokat va qurilish materiallari ulgurji bozor"
            },
            {
                "name": "Oziq-ovqat va agrosanoat",
                "slug": "oziq-ovqat",
                "icon": "Cart",
                "description": "Guruch, shakar, o'simlik yog'i, un va oziq-ovqat xomashyosi B2B ta'minoti"
            },
            {
                "name": "Avtomobil ehtiyot qismlari",
                "slug": "avto",
                "icon": "Car",
                "description": "Avtomobil tormoz tizimlari, akkumulyatorlar, filtrlar va motor moylari"
            },
            {
                "name": "Kiyim va poyabzal",
                "slug": "kiyim",
                "icon": "TShirt",
                "description": "Erkaklar va ayollar kiyimlari, maxsus ish kiyimlari va charm poyabzallar"
            },
            {
                "name": "Mebel va interyer jihozlari",
                "slug": "mebel",
                "icon": "Home",
                "description": "Ofis mebellari, ergonomik kreslolar, oshxona stollari va korporativ jihozlar"
            },
            {
                "name": "To'qimachilik va tekstil xomashyosi",
                "slug": "tekstil",
                "icon": "Layers",
                "description": "Paxta ip-kalava, bo'z gazlamalar, trikotaj polotno va to'qimachilik xomashyosi"
            },
            {
                "name": "Qishloq xo'jaligi va o'g'itlar",
                "slug": "agro-texnika",
                "icon": "Leaf",
                "description": "Mineral o'g'itlar (karbamid, ammiak selitrasi), tomchilatib sug'orish tizimlari"
            },
            {
                "name": "Sanoat uskunalari va stanoklar",
                "slug": "sanoat-uskunalari",
                "icon": "Settings",
                "description": "Sanoat kompressorlari, payvandlash uskunalari, CNC dastgohlar va generatorlar"
            },
            {
                "name": "Tibbiyot va farmatsevtika",
                "slug": "farmatsevtika",
                "icon": "Heart",
                "description": "Tibbiy sarf materiallari, diagnostika qurilmalari, niqoblar va antiseptiklar"
            },
            {
                "name": "Kimyo mahsulotlari va polimerlar",
                "slug": "kimyo-polimer",
                "icon": "Atom",
                "description": "HDPE polimer granulalar, kaustik soda, sanoat reagentlari va texnik spirtlar"
            }
        ]

        # Sync categories: ensure exactly these 14 categories exist and are active
        cat_map = {}
        # Keep list of slugs
        target_slugs = [c["slug"] for c in categories_14]

        # Deactivate any non-matching categories
        for old_c in db.query(Category).all():
            if old_c.slug not in target_slugs:
                old_c.is_active = False

        for cdata in categories_14:
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

        # 2. Key B2B Verified Sellers
        sellers_info = [
            ("malika-technohub", "Malika Savdo Markazi (TechnoHub)", "Toshkent shahri, Malika bozori, A-24", 4.98),
            ("abu-saxiy-ulgurji", "Abu Saxiy Ulgurji Savdo Markazi", "Toshkent shahri, Abu Saxiy majmuasi, 7-blok", 4.95),
            ("chilonzor-b2b", "Chilonzor B2B Savdo Uyi", "Toshkent shahri, Chilonzor 19-mavze", 4.92),
            ("artel-rasmiy-diler", "Artel Rasmiy B2B Dileri", "Toshkent shahri, Yashnobod texnoparki", 4.99),
            ("urikzor-ulgurji", "O'rikzor Ulgurji Savdo Majmuasi", "Toshkent viloyati, O'rikzor ulgurji bozori", 4.94),
            ("qoyliq-agro-b2b", "Qo'yliq Agrosanoat B2B Markazi", "Toshkent shahri, Qo'yliq bozori logistika qismi", 4.91),
            ("navoiy-standart-stroy", "Navoiy Standart Qurilish Mollari", "Toshkent shahri, Navoiy ko'chasi bozori", 4.96),
            ("sergeli-avto-ulgurji", "Sergeli Avto-Ehtiyot Ulgurji", "Toshkent shahri, Sergeli mashina bozori", 4.93),
            ("bek-topi-tekstil", "Bek To'pi Tekstil Ulgurji", "Toshkent shahri, Bek To'pi savdo markazi", 4.90),
            ("yangiyol-mebel", "Yangiyo'l B2B Mebel Majmuasi", "Toshkent viloyati, Yangiyo'l sanoat zonasi", 4.88),
            ("chirchiq-kimyo", "Chirchiq Kimyo & Polimer Ta'minot", "Toshkent viloyati, Chirchiq kimyo klasteri", 4.94)
        ]

        seller_map = {}
        for sslug, sname, scity, srating in sellers_info:
            seller = db.query(Seller).filter(Seller.slug == sslug).first()
            if not seller:
                user = User(
                    email=f"{sslug}@milliynarx.uz",
                    phone="+99871200" + str(random.randint(1000, 9999)),
                    hashed_password=get_password_hash("SellerPass2026!"),
                    role="SELLER",
                    is_active=True,
                    is_verified=True
                )
                db.add(user)
                db.flush()

                prof = Profile(user_id=user.id, full_name=sname, phone=user.phone, bio=scity)
                db.add(prof)

                seller = Seller(
                    user_id=user.id,
                    store_name=sname,
                    slug=sslug,
                    business_reg_number=f"REG-{random.randint(100000, 999999)}",
                    tax_id=f"TIN-{random.randint(100000000, 999999999)}",
                    status="APPROVED",
                    rating=srating,
                    is_verified=True
                )
                db.add(seller)
                db.flush()

                sp = SellerProfile(seller_id=seller.id, description=sname, address=scity, city=scity.split(",")[0].strip())
                db.add(sp)
            seller_map[sslug] = seller

        # 3. Brands
        brands_list = [
            "Apple", "Samsung", "Xiaomi", "Artel", "HP", "Lenovo", "Sony", "LG",
            "Bekobod Metal", "Qizilqum Sement", "Knauf", "Xorazm Shakar", "Oltin Kalit",
            "Castrol", "Bars", "BMB Tekstil", "Comfort Mebel", "Navoiyazot", "Chirchiq Kimyo"
        ]
        brand_map = {}
        for b in brands_list:
            br = db.query(Brand).filter(Brand.name.ilike(b)).first()
            if not br:
                br = Brand(name=b, slug=b.lower().replace(" ", "-"), is_active=True)
                db.add(br)
                db.flush()
            brand_map[b.lower()] = br

        # 4. Clean previous products, offers, inventories, price_histories
        db.query(PriceHistory).delete()
        db.query(Inventory).delete()
        db.query(Offer).delete()
        db.query(ProductImage).delete()
        db.query(Product).delete()
        db.commit()

        # 5. Catalog of Master Products: exactly 1 Product record per item, with 3 competing seller offers each!
        master_products = [
            # 1. Smartfonlar va gadjetlar
            {
                "category": "smartfonlar",
                "name": "Apple iPhone 15 Pro 128GB Natural Titanium",
                "model": "A3101",
                "brand": "apple",
                "sku": "IPH-15P-128-NT",
                "description": "Apple A17 Pro chip, titan korpus, 48 MP kamera, USB-C. Xalqaro model.",
                "image": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("abu-saxiy-ulgurji", 13950000.0, 45),
                    ("malika-technohub", 14200000.0, 30),
                    ("chilonzor-b2b", 14500000.0, 18)
                ]
            },
            {
                "category": "smartfonlar",
                "name": "Samsung Galaxy S24 Ultra 12/256GB Titanium Gray",
                "model": "SM-S928B",
                "brand": "samsung",
                "sku": "SAM-S24U-256-GR",
                "description": "Galaxy AI, 200MP kamera, Snapdragon 8 Gen 3, o'rnatilgan S-Pen stilus.",
                "image": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("malika-technohub", 15100000.0, 25),
                    ("abu-saxiy-ulgurji", 15400000.0, 40),
                    ("chilonzor-b2b", 15850000.0, 15)
                ]
            },
            {
                "category": "smartfonlar",
                "name": "Xiaomi Redmi Note 13 Pro 8/256GB Midnight Black",
                "model": "2312DRA50G",
                "brand": "xiaomi",
                "sku": "XIA-RN13P-256",
                "description": "200 MP kamera, 120Hz AMOLED displey, 67W quvvatlash, 5000 mAh batareya.",
                "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("abu-saxiy-ulgurji", 3200000.0, 120),
                    ("malika-technohub", 3350000.0, 75),
                    ("chilonzor-b2b", 3490000.0, 40)
                ]
            },

            # 2. Noutbuklar va IT-uskunalar
            {
                "category": "noutbuklar",
                "name": "Apple MacBook Air 13 M3 8-core / 8GB / 256GB Space Gray",
                "model": "MRXN3",
                "brand": "apple",
                "sku": "APL-MBA-M3-13",
                "description": "Apple M3 chip, 18 soat avtonomiya, Liquid Retina displey, MagSafe 3.",
                "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("malika-technohub", 13500000.0, 15),
                    ("abu-saxiy-ulgurji", 13800000.0, 25),
                    ("chilonzor-b2b", 14100000.0, 10)
                ]
            },
            {
                "category": "noutbuklar",
                "name": "HP Victus 15 Gaming Laptop (Core i5-13420H / RTX 3050 / 16GB)",
                "model": "15-fa1093dx",
                "brand": "hp",
                "sku": "HP-VIC-15-3050",
                "description": "15.6 dyuym 144Hz FHD ekran, GeForce RTX 3050 6GB, 16GB DDR4, 512GB SSD.",
                "image": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("malika-technohub", 8450000.0, 20),
                    ("abu-saxiy-ulgurji", 8600000.0, 35),
                    ("chilonzor-b2b", 8900000.0, 14)
                ]
            },
            {
                "category": "noutbuklar",
                "name": "Lenovo ThinkPad E14 Gen 5 (Ryzen 5 7530U / 16GB / 512GB)",
                "model": "21JR0005CD",
                "brand": "lenovo",
                "sku": "LEN-TP-E14-G5",
                "description": "Biznes darajasidagi noutbuk, alyuminiy korpus, TrackPoint, 14 dyuym IPS displey.",
                "image": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("malika-technohub", 7500000.0, 18),
                    ("chilonzor-b2b", 7700000.0, 22),
                    ("abu-saxiy-ulgurji", 7950000.0, 30)
                ]
            },

            # 3. Maishiy texnika
            {
                "category": "maishiy-texnika",
                "name": "Artel Grand Inverter 12 Sovutish Tizimi (Konditsioner)",
                "model": "ART-INV-12G",
                "brand": "artel",
                "sku": "ART-INV-12-WHT",
                "description": "A+++ energiya tejamkorligi, Wi-Fi smart boshqaruv, R32 ekologik freon, 35-40 kv.m maydonga.",
                "image": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("artel-rasmiy-diler", 4600000.0, 60),
                    ("abu-saxiy-ulgurji", 4750000.0, 45),
                    ("chilonzor-b2b", 4950000.0, 25)
                ]
            },
            {
                "category": "maishiy-texnika",
                "name": "Samsung EcoBubble 7kg Inverter Kir Yuvish Mashinasi",
                "model": "WW70TA026AX",
                "brand": "samsung",
                "sku": "SAM-WM-7KG-EB",
                "description": "EcoBubble ko'pikli yuvish, gigiyenik bug' funksiyasi, 10 yil kafolatli invertor motor.",
                "image": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("abu-saxiy-ulgurji", 5150000.0, 35),
                    ("artel-rasmiy-diler", 5300000.0, 20),
                    ("chilonzor-b2b", 5550000.0, 15)
                ]
            },
            {
                "category": "maishiy-texnika",
                "name": "Artel HD 340 Sovutgich (No Frost Kumushrang)",
                "model": "HD-340-RN",
                "brand": "artel",
                "sku": "ART-FR-340-SLV",
                "description": "A+ energiya tejamkorlik, 260 litr hajm, kumushrang mustahkam korpus, DeFrost.",
                "image": "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("artel-rasmiy-diler", 3480000.0, 50),
                    ("abu-saxiy-ulgurji", 3600000.0, 40),
                    ("chilonzor-b2b", 3780000.0, 20)
                ]
            },

            # 4. Televizorlar va audio
            {
                "category": "televizorlar",
                "name": "Sony PlayStation 5 Slim Digital Edition 1TB",
                "model": "CFI-2000B",
                "brand": "sony",
                "sku": "SNY-PS5-SLM-1TB",
                "description": "Ixcham korpus, 1TB tezkor SSD xotira, 4K 120fps geyming va DualSense haptik pulti.",
                "image": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("malika-technohub", 6100000.0, 35),
                    ("abu-saxiy-ulgurji", 6250000.0, 45),
                    ("chilonzor-b2b", 6490000.0, 20)
                ]
            },
            {
                "category": "televizorlar",
                "name": "Samsung 55 Crystal UHD 4K Smart TV",
                "model": "UE55CU7100UXRU",
                "brand": "samsung",
                "sku": "SAM-TV-55-CU71",
                "description": "Crystal Processor 4K, HDR10+, Tizen OS, yupqa ramkasiz dizayn va AI ovoz tizimi.",
                "image": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("abu-saxiy-ulgurji", 5700000.0, 40),
                    ("malika-technohub", 5900000.0, 30),
                    ("chilonzor-b2b", 6200000.0, 15)
                ]
            },
            {
                "category": "televizorlar",
                "name": "LG Smart TV 43 Full HD AI ThinQ",
                "model": "43LM6370PLA",
                "brand": "lg",
                "sku": "LG-TV-43-FHD",
                "description": "WebOS Smart tizimi, HDR10 Pro, Dolby Audio va AI ovozli boshqaruv funksiyasi.",
                "image": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("abu-saxiy-ulgurji", 3850000.0, 40),
                    ("malika-technohub", 3950000.0, 25),
                    ("chilonzor-b2b", 4150000.0, 20)
                ]
            },

            # 5. Qurilish mollari va xomashyo
            {
                "category": "qurilish-mollari",
                "name": "Bekobod Armatura A500C D12mm (1 tonna ulgurji)",
                "model": "A500C-D12",
                "brand": "bekobod metal",
                "sku": "ARM-BK-12-TON",
                "description": "O'zbekiston metallurgiya kombinati (Bekobod). Standart GOST 52544-2006. Zavod kafolati.",
                "image": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("navoiy-standart-stroy", 8200000.0, 150),
                    ("chilonzor-b2b", 8400000.0, 80),
                    ("abu-saxiy-ulgurji", 8700000.0, 60)
                ]
            },
            {
                "category": "qurilish-mollari",
                "name": "Qizilqum Sement M500 (50kg qop, ulgurji partiya)",
                "model": "M-500-D0",
                "brand": "qizilqum sement",
                "sku": "SEM-QZ-M500",
                "description": "Yuqori mustahkamlikdagi portlendsement. B2B qurilish ob'ektlari uchun standart sertifikat.",
                "image": "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("navoiy-standart-stroy", 51500.0, 2500),
                    ("chilonzor-b2b", 54000.0, 1200),
                    ("abu-saxiy-ulgurji", 56000.0, 800)
                ]
            },
            {
                "category": "qurilish-mollari",
                "name": "Knauf Namlikka Chidamli Gipsokarton 12.5mm",
                "model": "GSP-H2-12.5",
                "brand": "knauf",
                "sku": "KNF-GK-12-GRN",
                "description": "Knauf Buxoro zavodi mahsuloti, 2500x1200x12.5mm. Ichki pardozlash va vanna xonalariga.",
                "image": "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("navoiy-standart-stroy", 65000.0, 800),
                    ("chilonzor-b2b", 68000.0, 450),
                    ("abu-saxiy-ulgurji", 71000.0, 300)
                ]
            },

            # 6. Oziq-ovqat va agrosanoat
            {
                "category": "oziq-ovqat",
                "name": "Samarqand Lazir Guruch (1-nav, 50kg qop ulgurji)",
                "model": "LAZIR-SELECT",
                "brand": None,
                "sku": "AGR-RIC-50-LZR",
                "description": "Tanlangan Samarqand Lazir navli guruch. Restoranlar, to'yxonalar va ulgurji xaridorlarga.",
                "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("urikzor-ulgurji", 910000.0, 350),
                    ("qoyliq-agro-b2b", 950000.0, 500),
                    ("chilonzor-b2b", 985000.0, 120)
                ]
            },
            {
                "category": "oziq-ovqat",
                "name": "Oltin Kalit Rafinatsiyalangan Paxta Yog'i 5L (blok)",
                "model": "OK-OIL-5L",
                "brand": "oltin kalit",
                "sku": "OIL-OK-5L-BLK",
                "description": "Oliy navli tozalangan paxta yog'i. Standart O'zDst talablariga mos. Blokda 3 dona.",
                "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("qoyliq-agro-b2b", 74500.0, 900),
                    ("urikzor-ulgurji", 78000.0, 650),
                    ("chilonzor-b2b", 81000.0, 300)
                ]
            },
            {
                "category": "oziq-ovqat",
                "name": "Xorazm Shakar Oliy Navli Shakar (50kg qop ulgurji)",
                "model": "XOR-SUGAR-50",
                "brand": "xorazm shakar",
                "sku": "AGR-SGR-50KG",
                "description": "Xorazm Shakar zavodi, toza oq qand lavlagi shakari. Qandolatchilar va distribyutorlarga.",
                "image": "https://images.unsplash.com/photo-1612197527762-8efb5314a4ce?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("urikzor-ulgurji", 520000.0, 800),
                    ("qoyliq-agro-b2b", 540000.0, 1100),
                    ("chilonzor-b2b", 560000.0, 250)
                ]
            },

            # 7. Avtomobil ehtiyot qismlari
            {
                "category": "avto",
                "name": "Cobalt / Gentra Old Tormoz Kolodkasi (Sangsin Hi-Q)",
                "model": "SP-1399",
                "brand": None,
                "sku": "BRK-HIQ-SP1399",
                "description": "Original Sangsin Brake (Koreya) disk tormoz kolodkalari Chevrolet avtomobillari uchun.",
                "image": "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("sergeli-avto-ulgurji", 170000.0, 250),
                    ("chilonzor-b2b", 185000.0, 90),
                    ("abu-saxiy-ulgurji", 200000.0, 60)
                ]
            },
            {
                "category": "avto",
                "name": "Bars Silver 60Ah 540A Avtomobil Akkumulyatori",
                "model": "BARS-60-SLV",
                "brand": "bars",
                "sku": "BAT-BARS-60AH",
                "description": "Kalsiy-kumush texnologiyali akkumulyator. 18 oy kafolat bilan barcha yengil avtomobillarga.",
                "image": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("sergeli-avto-ulgurji", 550000.0, 120),
                    ("chilonzor-b2b", 580000.0, 70),
                    ("abu-saxiy-ulgurji", 610000.0, 45)
                ]
            },
            {
                "category": "avto",
                "name": "Castrol Edge 5W-30 Sintetik Motor Moyi 4 Litr",
                "model": "EDGE-5W30-4L",
                "brand": "castrol",
                "sku": "OIL-CAS-5W30",
                "description": "Fluid TITANIUM texnologiyali to'liq sintetik dvigatel moyi. Original Germaniya mahsuloti.",
                "image": "https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("sergeli-avto-ulgurji", 465000.0, 180),
                    ("chilonzor-b2b", 490000.0, 85),
                    ("abu-saxiy-ulgurji", 520000.0, 50)
                ]
            },

            # 8. Kiyim va poyabzal
            {
                "category": "kiyim",
                "name": "Erkaklar Klassik Paxtali Ko'ylagi (BMB Collection)",
                "model": "BMB-SHIRT-CLS",
                "brand": "bmb tekstil",
                "sku": "TEX-SHR-CLS-01",
                "description": "100% tabiiy o'zbek paxtasi, yevropacha andoza, nafas oluvchi yuqori sifatli mato.",
                "image": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("bek-topi-tekstil", 145000.0, 400),
                    ("chilonzor-b2b", 160000.0, 180),
                    ("abu-saxiy-ulgurji", 175000.0, 120)
                ]
            },
            {
                "category": "kiyim",
                "name": "Maxsus Qishki Ishchi Kombinezoni va Kurtkasi (B2B)",
                "model": "SPEC-WNT-PRO",
                "brand": "bmb tekstil",
                "sku": "WRK-SUIT-WNT",
                "description": "Qurilish va sanoat ob'ektlari uchun issiq tutuvchi suv o'tkazmaydigan ish kiyimi to'plami.",
                "image": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("bek-topi-tekstil", 280000.0, 300),
                    ("navoiy-standart-stroy", 310000.0, 150),
                    ("chilonzor-b2b", 335000.0, 80)
                ]
            },

            # 9. Mebel va interyer jihozlari
            {
                "category": "mebel",
                "name": "Ergonomik Ofis Boshqaruv Kreslosi (Mesh Black)",
                "model": "OFC-CHR-ERG90",
                "brand": "comfort mebel",
                "sku": "MBL-CHR-ERG",
                "description": "Lomber qo'llab-quvvatlash, xrom poydevor, nafas oluvchi setka mato, 130kg yuklama.",
                "image": "https://images.unsplash.com/photo-1580481077194-4c8d7b30c14c?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("yangiyol-mebel", 780000.0, 85),
                    ("chilonzor-b2b", 830000.0, 40),
                    ("abu-saxiy-ulgurji", 890000.0, 25)
                ]
            },
            {
                "category": "mebel",
                "name": "Transformator Ofis Majlislar Stoli (8 kishilik)",
                "model": "CNF-TBL-8P",
                "brand": "comfort mebel",
                "sku": "MBL-TBL-CNF",
                "description": "Laminatlangan DSP, metall oyoqlar, qulay yig'iluvchi modulli konferensiya stoli.",
                "image": "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("yangiyol-mebel", 2400000.0, 30),
                    ("chilonzor-b2b", 2600000.0, 15),
                    ("malika-technohub", 2850000.0, 10)
                ]
            },

            # 10. To'qimachilik va tekstil xomashyosi
            {
                "category": "tekstil",
                "name": "100% Paxta Ip-Kalava Ne 30/1 Taroqli (1 tonna)",
                "model": "YRN-NE30-CMB",
                "brand": "bmb tekstil",
                "sku": "TEX-YRN-30-1T",
                "description": "O'zbekiston yigiruv korxonalari mahsuloti. Triko va to'quv sanoati uchun taroqli paxta ipi.",
                "image": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("bek-topi-tekstil", 28500000.0, 20),
                    ("chilonzor-b2b", 29800000.0, 12),
                    ("urikzor-ulgurji", 31200000.0, 8)
                ]
            },
            {
                "category": "tekstil",
                "name": "Oqartirilgan Bo'z Gazlama 100m Rulon (Paxta 100%)",
                "model": "FAB-COT-100M",
                "brand": "bmb tekstil",
                "sku": "TEX-FAB-WHT",
                "description": "Zichligi 140 g/m², eni 150 sm. Choyshab va shifoxona to'shak jildlari tikish uchun.",
                "image": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("bek-topi-tekstil", 1200000.0, 150),
                    ("urikzor-ulgurji", 1280000.0, 90),
                    ("chilonzor-b2b", 1360000.0, 50)
                ]
            },

            # 11. Qishloq xo'jaligi va o'g'itlar
            {
                "category": "agro-texnika",
                "name": "Karbamid Azotli Mineral O'g'it 50kg (Navoiyazot)",
                "model": "UREA-46-NAV",
                "brand": "navoiyazot",
                "sku": "AGR-FERT-50KG",
                "description": "Azot miqdori 46.2%. Barcha qishloq xo'jaligi ekinlari hosildorligini oshirish uchun asosiy o'g'it.",
                "image": "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("qoyliq-agro-b2b", 210000.0, 600),
                    ("urikzor-ulgurji", 225000.0, 400),
                    ("chilonzor-b2b", 240000.0, 200)
                ]
            },
            {
                "category": "agro-texnika",
                "name": "Tomchilatib Sug'orish Shlangi 500 metr (Labirintli)",
                "model": "DRP-16MM-500M",
                "brand": None,
                "sku": "AGR-DRP-500",
                "description": "Diametri 16mm, teshiklar oralig'i 20sm. Issiqxonalar va bog'lar uchun suv tejamkor tizim.",
                "image": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("qoyliq-agro-b2b", 380000.0, 250),
                    ("chilonzor-b2b", 410000.0, 120),
                    ("abu-saxiy-ulgurji", 440000.0, 70)
                ]
            },

            # 12. Sanoat uskunalari va stanoklar
            {
                "category": "sanoat-uskunalari",
                "name": "Sanoat Porshenli Havo Kompressori 100L (3 kVt)",
                "model": "CMP-100L-3KW",
                "brand": None,
                "sku": "IND-CMP-100L",
                "description": "Ishchi bosimi 8-10 bar, 3 fazali motor, avtomobil va mebel ustaxonalari uchun ishonchli kompressor.",
                "image": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("navoiy-standart-stroy", 3900000.0, 40),
                    ("malika-technohub", 4150000.0, 25),
                    ("chilonzor-b2b", 4400000.0, 15)
                ]
            },
            {
                "category": "sanoat-uskunalari",
                "name": "Invertorli Payvandlash Apparati IGBT 250A Professional",
                "model": "WLD-IGBT-250",
                "brand": None,
                "sku": "IND-WLD-250A",
                "description": "Hot start, Anti-stick funksiyalari, kuchlanish o'zgarishlariga chidamli, kabellar to'plami bilan.",
                "image": "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("navoiy-standart-stroy", 1150000.0, 90),
                    ("malika-technohub", 1240000.0, 60),
                    ("chilonzor-b2b", 1320000.0, 30)
                ]
            },

            # 13. Tibbiyot va farmatsevtika
            {
                "category": "farmatsevtika",
                "name": "Bir Martalik 3 Qavatli Tibbiy Niqob (1000 dona quti)",
                "model": "MSK-3PLY-1000",
                "brand": None,
                "sku": "MED-MSK-1000",
                "description": "Filtrlash darajasi BFE 98%+, elastik quloq ilmog'i va burun qisqichi bilan steril qadoqda.",
                "image": "https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("abu-saxiy-ulgurji", 95000.0, 1200),
                    ("chilonzor-b2b", 108000.0, 600),
                    ("urikzor-ulgurji", 120000.0, 400)
                ]
            },
            {
                "category": "farmatsevtika",
                "name": "Avtomatik Yelkaga O'lchovchi Elektron Tonometr",
                "model": "MED-TNM-AUTO",
                "brand": None,
                "sku": "MED-TNM-01",
                "description": "Katta LED ekran, xotira funksiyasi (90 ta o'lchov), universal manjeta (22-42 sm).",
                "image": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("malika-technohub", 480000.0, 95),
                    ("chilonzor-b2b", 520000.0, 50),
                    ("abu-saxiy-ulgurji", 560000.0, 30)
                ]
            },

            # 14. Kimyo mahsulotlari va polimerlar
            {
                "category": "kimyo-polimer",
                "name": "Polietilen Granulasi HDPE F-0120 Shurtan (1 tonna)",
                "model": "HDPE-F0120",
                "brand": "chirchiq kimyo",
                "sku": "CHM-HDPE-1T",
                "description": "Shurtan gaz kimyo majmuasi mahsuloti. Plyonka va paket ishlab chiqarish uchun yuqori bosimli polimer.",
                "image": "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("chirchiq-kimyo", 14800000.0, 40),
                    ("chilonzor-b2b", 15400000.0, 25),
                    ("navoiy-standart-stroy", 15900000.0, 15)
                ]
            },
            {
                "category": "kimyo-polimer",
                "name": "Kaustik Soda (O'yuvchi Natriy NaOH) 25kg qop",
                "model": "NAOH-99-25KG",
                "brand": "chirchiq kimyo",
                "sku": "CHM-SODA-25",
                "description": "Tozalik darajasi 99.5%, oq tangachasimon modda. To'qimachilik, sovun va neft sanoatida ishlatiladi.",
                "image": "https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?w=600&auto=format&fit=crop&q=80",
                "offers": [
                    ("chirchiq-kimyo", 270000.0, 350),
                    ("chilonzor-b2b", 295000.0, 180),
                    ("navoiy-standart-stroy", 320000.0, 100)
                ]
            }
        ]

        print(f"Creating {len(master_products)} Master Products with multiple competitive seller offers...")

        seeded_products_count = 0
        seeded_offers_count = 0

        for item in master_products:
            cat = cat_map.get(item["category"])
            b_key = item.get("brand")
            brand = brand_map.get(b_key) if b_key else None

            # Primary offer is the lowest priced offer
            sorted_offers = sorted(item["offers"], key=lambda x: x[1])
            prim_seller_slug, prim_price, prim_stock = sorted_offers[0]
            prim_seller = seller_map.get(prim_seller_slug)

            # 1. Create EXACTLY ONE Product record in Product table!
            p = Product(
                seller_id=prim_seller.id,
                category_id=cat.id if cat else None,
                brand_id=brand.id if brand else None,
                name=item["name"],
                slug=item["name"].lower().replace(" ", "-").replace("/", "-").replace("(", "").replace(")", ""),
                model=item["model"],
                sku=item["sku"],
                barcode=str(random.randint(100000000000, 999999999999)),
                description=item["description"],
                price=prim_price,
                old_price=round(prim_price * 1.1, -3),
                currency="UZS",
                stock=prim_stock,
                availability="IN_STOCK",
                condition="NEW",
                location=prim_seller.profile.city if hasattr(prim_seller, "profile") and prim_seller.profile else "Toshkent shahri",
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

            # Inventory
            inv = Inventory(
                product_id=p.id,
                seller_id=prim_seller.id,
                quantity=prim_stock,
                reserved=0
            )
            db.add(inv)

            # Historical Price records for charts (over past 30 days)
            price_points = [
                (datetime.utcnow() - timedelta(days=28), prim_price * 1.07),
                (datetime.utcnow() - timedelta(days=21), prim_price * 1.05),
                (datetime.utcnow() - timedelta(days=14), prim_price * 1.03),
                (datetime.utcnow() - timedelta(days=7), prim_price * 1.01),
                (datetime.utcnow(), prim_price)
            ]
            for r_date, r_price in price_points:
                ph = PriceHistory(
                    product_id=p.id,
                    seller_id=prim_seller.id,
                    price=round(r_price, -3),
                    source="AGGREGATED_MARKET",
                    recorded_at=r_date
                )
                db.add(ph)

            seeded_products_count += 1

            # 2. Add Offer rows for ALL sellers offering this product
            for s_slug, s_price, s_stock in item["offers"]:
                s_obj = seller_map.get(s_slug)
                if not s_obj:
                    continue

                off = Offer(
                    product_id=p.id,
                    seller_id=s_obj.id,
                    price=s_price,
                    old_price=round(s_price * 1.08, -3),
                    stock=s_stock,
                    availability="IN_STOCK",
                    condition="NEW",
                    delivery_days=1
                )
                db.add(off)
                seeded_offers_count += 1

        db.commit()
        print(f"SUCCESS: Seeded {len(categories_14)} Active Categories, {seeded_products_count} Unique Master Products, and {seeded_offers_count} Competing Offers!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_14_categories_marketplace()
