# Milliy Narx — O'zbekiston Bozor Narxlari Tahlil Platformasi (Market Intelligence Terminal)

Ishlab chiqarishga to'liq tayyor (Production-ready), to'liq stekli bozor narxlari tahlil terminali.

---

## 1. Asosiy Tamoyil: 100% Real Ma'lumotlar (Zero Fake Data)

Ushbu loyihada:
- **0** demo mahsulotlar
- **0** soxta sotuvchilar
- **0** soxta narxlar
- **0** soxta foydalanuvchilar
- **0** soxta statistikalar
- **0** soxta grafik nuqtalari
- **0** soxta sharhlar yoki daromadlar

Agar ma'lumotlar bazasi bo'sh bo'lsa, interfeys professional o'zbek tilidagi bo'sh holatlarni (*Empty States*) aks ettiradi:
- *"Ma'lumot mavjud emas"*
- *"Mahsulotlar hali qo'shilmagan."*
- *"Sotuvchilar topilmadi."*
- *"Narx tarixi mavjud emas."*
- *"Hali yetarli ma'lumot yig'ilmagan."*

---

## 2. Texnologik Stek

| Qism | Texnologiya | Izoh |
| :--- | :--- | :--- |
| **Frontend** | Vite + React + JavaScript | To'liq ekranga yoyiladigan moliyaviy terminal (`100vw`) |
| **Routing** | React Router v6 | Rolga asoslangan marshrutlash |
| **Stillashtirish** | Tailwind CSS v4 | Deep Blue, Dark Slate, Charcoal, Toza chegaralar |
| **Ikonkalar** | `@solar-icons/vue` / Solar Icons SVG | Toza vektor ikonkalari, emojisiz tizim |
| **Backend** | Python 3.11 + FastAPI | Aloxida ajratilgan REST API serveri |
| **Ma'lumotlar bazasi** | PostgreSQL (Contabo VPS) | UUID kalitlar, indekslar, 24 ta bog'langan jadvallar |
| **Proksi & SSL** | Nginx + Let's Encrypt | HTTP/2, Gzip, Xavfsizlik sarlavhalari |
| **Jarayon nazorati** | systemd / Docker Compose | 24/7 uzluksiz ishlash kafolati |
| **Sun'iy Intellekt** | OpenAI API (Faqat Backendda) | Faqat real bazadagi raqamlarga asoslangan tahlil |

---

## 3. Server Arxitekturasi (Contabo VPS)

```
Foydalanuvchi
     ↓
   Nginx (Port 80 / 443 HTTPS)
     ├── milliy-narx.uz /              →  Vite React Frontend (dist/ statik fayllari)
     ├── /uploads/                     →  /var/www/milliynarx/uploads (Mahsulot rasmlari)
     └── /api/                         →  FastAPI REST API (http://127.0.0.1:8000)
                                              ↓
                                           PostgreSQL (milliynarx)
                                              ↓
                                           Contabo SSD xotirasi
```

---

## 4. Ma'lumotlar Bazasi Jadvallari (24 ta)

1. `users` — Foydalanuvchi hisoblari va autentifikatsiya
2. `profiles` — Foydalanuvchi shaxsiy profillari
3. `roles` — ADMIN, SELLER, BUYER rollari
4. `sellers` — Tasdiqlangan va tekshiruvdagi do'konlar
5. `seller_profiles` — Do'kon rekvizitlari, INN, logotip va manzillar
6. `categories` — Mahsulot kategoriyalari daraxti
7. `brands` — Rasmiy brendlar
8. `products` — Mahsulotlar katalogi va to'liq xususiyatlari
9. `product_images` — Mahsulot rasmlari galereyasi
10. `product_variants` — Mahsulot variantlari (rang, o'lcham, xotira)
11. `offers` — Turli sotuvchilarning ayni bir mahsulot bo'yicha takliflari
12. `price_history` — Real narx o'zgarishlarining o'zgarmas tarixi
13. `inventory` — Ombor qoldiqlari
14. `favorites` — Xaridorlar saqlagan mahsulotlar
15. `searches` — Real qidiruvlar jurnali
16. `search_results` — Qidiruv natijalari tahlili
17. `price_alerts` — Narx pasayishi bo'yicha ogohlantirishlar
18. `notifications` — Tizim va narx bildirishnomalari
19. `subscriptions` — Obunalar
20. `subscription_plans` — Obuna tarif rejalari
21. `payments` — Haqiqiy to'lovlar
22. `analytics_events` — Real ko'rishlar va bosishlar hodisalari
23. `ai_analyses` — AI bozor xulosalari arxivi
24. `data_sources` — Modulli adapterlar (`DataSourceAdapter`)
25. `audit_logs` — Administrator va xavfsizlik audit jurnali

---

## 5. Uchta Asosiy Foydalanuvchi Roli

### 1. ADMIN (`/admin`)
- **Ko'rsatkichlar**: Faqat bazadagi real sonlar (bo'sh bo'lsa `0`, hech qanday soxta 1,240 emas).
- **Sotuvchilar moderatsiyasi**: Do'konlarni tekshirish, tasdiqlash (`APPROVED`), rad etish (`REJECTED`) yoki to'xtatish (`SUSPENDED`).
- **Mahsulotlar moderatsiyasi**: Sotuvchilar kiritgan takliflarni ko'rib chiqish va `ACTIVE` holatiga o'tkazish.
- **Katalog boshqaruvi**: Kategoriyalar va brendlar qo'shish.
- **Adapterlar monitoringi**: Uzum, Yandex, Ozon holatini haqqoniy ko'rish (`NOT_CONFIGURED`).

### 2. SELLER (`/seller`)
- **Ro'yxatdan o'tish**: Do'kon nomi, INN va faoliyat ma'lumotlari bilan ro'yxatdan o'tadi (`PENDING` maqomi).
- **Mahsulot qo'shish**: Nomi, modeli, SKU, narxi, parametrlari va rasmlari bilan taklif kiritadi (`PENDING_APPROVAL`).
- **Narxni yangilash**: Narx o'zgarganda avtomatik ravishda `price_history` jadvaliga yoziladi va faol narx ogohlantirishlari bo'lgan xaridorlarga xabar yuboriladi.
- **Real analitika**: O'z mahsulotlarining haqiqiy ko'rishlar soni va saqlanganlar soni.

### 3. BUYER (`/`)
- **Qidiruv & Filtrlar**: Real vaqt rejimida PostgreSQL bazasidan izlash, narx, kategoriya va joylashuv bo'yicha saralash.
- **Mahsulot sahifasi**: Real narx grafigi, bozor statistikasi (eng past, eng yuqori, o'rtacha narx, sotuvchilar soni).
- **Taqqoslash (`/compare`)**: 2 tadan 5 tagacha bo'lgan real mahsulotlarni solishtirish.
- **Narx ogohlantirishlari (`/alerts`)**: Maqsadli narx belgilash. Haqiqiy sotuvchi narxni tushirganda xabar olish.
- **Sevimlilar (`/favorites`)**: Ma'qul kelgan takliflarni saqlash.

---

## 6. Mahsulot Hayot Sikli (Real Data Flow)

```
SOTUVCHI:
Ro'yxatdan o'tish → Admin tasdiqlashi (APPROVED) → Mahsulot qo'shish → PENDING_APPROVAL
                                                                           ↓
                                                                 Admin tasdiqlashi
                                                                           ↓
XARIDOR:                                                                ACTIVE
Qidiruv natijasi ← Baza tahlili ← Real narx grafigi ← Real AI xulosasi ←───┘
```

---

## 7. Mahalliy Ishga Tushirish (Local Development)

### Backend:
```bash
# Virtual muhit va bog'liqliklar
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r backend/requirements.txt

# Backendni ishga tushirish (Port: 8000)
python backend/run.py
```

### Backend Testlarini Tekshirish:
```bash
python backend/test_backend.py
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
# Brauzerda ochish: http://localhost:5173
```

---

## 8. Contabo VPS Serveriga O'rnatish (Production Deployment)

### 1-Usul: Avtomatlashtirilgan Skript Orqali
```bash
git clone <repository_url> /var/www/milliynarx
cd /var/www/milliynarx
chmod +x deployment/setup_contabo.sh
sudo ./deployment/setup_contabo.sh
```

### 2-Usul: Docker Compose Orqali (1-bosqichli ishga tushirish)
```bash
cd /var/www/milliynarx/deployment
docker-compose up -d --build
```

---

## 9. Xavfsizlik Kafolati

- Hech qanday maxfiy kalitlar (`OPENAI_API_KEY`, `JWT_SECRET`, DB parollari) frontend kodiga chiqarilmagan.
- Barcha parollar zamonaviy `bcrypt` xeshlash algoritmi orqali himoyalangan.
- Rollar asosidagi ruxsatnomalar to'g'ridan-to'g'ri backend API darajasida tekshiriladi.
