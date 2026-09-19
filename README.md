# 📊 Milliy Narx — O'zbekiston Bozor Narxlari Tahlil Platformasi
### *National Price Intelligence, Live Web Scraper & Market Analytics Terminal (B2B & B2C)*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Web Scraper](https://img.shields.io/badge/Web_Scraper-Live_Engine-FF6B6B.svg?style=flat&logo=python&logoColor=white)](https://requests.readthedocs.io/)
[![DeepSeek AI](https://img.shields.io/badge/AI_Engine-DeepSeek_v4_Flash-4D6BFE.svg?style=flat)](https://openrouter.ai/)
[![Telegram Bot](https://img.shields.io/badge/Telegram_Bot-@milliynarxbot-26A5E4.svg?style=flat&logo=telegram&logoColor=white)](https://t.me/milliynarxbot)
[![Google OAuth](https://img.shields.io/badge/SSO-Google_OAuth_2.0-4285F4.svg?style=flat&logo=google&logoColor=white)](https://console.cloud.google.com/)
[![License](https://img.shields.io/badge/License-Proprietary-orange.svg?style=flat)]()

**Milliy Narx** — O'zbekiston Respublikasining yirik chakana va ulgurji savdo tarmoqlari (*Texnomart, MediaPark, Olcha, Abu Saxiy, Malika Texnomarkazi, O'rikzor va boshqalar*) tovarlarining real narxlarini avtomatlashtirilgan **Jonli Web Scraping** orqali to'playdigan, sun'iy intellekt (**DeepSeek AI**) yordamida bozor konyunkturasini tahlil qiluvchi mustaqil axborot-tahliliy terminali.

---

## 🌟 Asosiy Imkoniyatlar va Modullar

### 1. 🔍 Xaridorlar uchun (Smart Price Discovery)
* **Bozorlararo Jonli Narx Taqqoslash (`/compare`):** Bir xil tovarning Texnomart, Malika, Abu Saxiy va boshqa do'konlardagi real narxlarini yonma-yon solishtirish, eng arzon taklif va narx spredini (tebranishini) aniqlash.
* **Tarixiy Narxlar Dinamikasi:** O'tgan 30, 90 va 365 kunlik narx tendensiyalari grafigi, mavsumiy o'zgarishlar va narxning pasayish/ko'tarilish dinamikasi.
* **Aqlli Qidiruv & Avtoto'ldirish (`/search`):** Kategoriya, brend, bozor majmuasi va narx oralig'i bo'yicha tezkor ko'p parametrli filtrlar.
* **Telegram Narx Pasayishi Xabarnomalari (`/alerts`):** Tovar narxi foydalanuvchi belgilagan maqsadli chegaradan tushganda `@milliynarxbot` orqali tezkor bildirishnoma yetkazish.

### 2. 🕷️ Jonli Web Scraping & Ma'lumotlar Sinxronizatsiyasi (Data Pipeline)
* **Haqiqiy Bozor Integratsiyasi:** Texnomart.uz va boshqa yirik riteylerlarning veb-kataloglaridan real vaqt rejimida mahsulot nomlari, naqd narxlari, rasmlari va xususiyatlarini skreyping qilish.
* **Avtomatik Kategoriya va Brend Bog'lash:** Olingan tovarlar milliy platforma kategoriyalariga (Smartfonlar, Noutbuklar, Televizorlar, Maishiy texnika va b.) avtomatik moslashtiriladi.
* **Tarixiy Narx Nuqtalarini Yozib Borish:** Har bir yangilanishda narx o'zgarishlari `PricePoint` modeliga muhrlanib, tahliliy grafiklar uchun tarixiy ma'lumotlar bazasini shakllantiradi.
* **Admin orqali 1-Bosishda Sinxronlash:** Admin panelning "Ma'lumot manbalari" sahifasida "Hozir yangilash (Live Scrape)" tugmasi orqali istalgan vaqtda jonli sinxronizatsiya.
* **CLI Skript:** Terminal orqali to'g'ridan-to'g'ri `python backend/scraper.py` buyrug'i bilan yangilash imkoniyati.

### 3. 🏪 Do'konlar va Treyderlar uchun (Seller Intelligence)
* **100% Bepul Mahsulot Joylash:** Yangi mahalliy do'konlar uchun ro'yxatdan o'tish va tovar takliflarini joylash bepul.
* **Do'konni Bosqichma-bosqich Sozlash (`/onboarding`):** Do'kon rekvizitlari, STIR (INN), rasmiy bozor manzili, to'lov turlari (Click, Payme, Terminal, Naqd) va logotip yuklash.
* **Raqobatchilar Narxlari Monitoringi:** O'z tovarining boshqa sotuvchilarga nisbatan qimmat yoki arzonligini real vaqtda kuzatish va narxni optimallashtirish.
* **Sotuvchi Boshqaruv Paneli (`/seller`):** Ko'rishlar soni, saqlanganlar (sevimlilar), konversiya ko'rsatkichlari va tovar boshqaruvi.

### 4. 🤖 Codexa AI — Sun'iy Intellekt Bozor Maslahatchisi (`/ai-advisor`)
* **DeepSeek v4 Flash (OpenRouter):** Eng yangi avlod neyrotarmoqlari orqali xolis bozor tahlili.
* **Gallyutsinatsiyasiz Faktik Tahlil:** Faqat ma'lumotlar bazasidagi tasdiqlangan raqamlar, haqiqiy narxlar va do'kon takliflari asosida qisqa, aniq va lo'nda tahliliy xulosalar generatsiyasi.
* **Bozor Arbitraji & Spred Hisoblagich:** Do'konlar o'rtasidagi eng katta narx tafovutlari va eng maqbul xarid vaqti bo'yicha tavsiyalar.

### 5. 🛡️ Mustaqil Administrator Terminali (`admin/`, Port 5174)
* Alohida portda (`:5174`) ishlovchi to'liq xavfsiz boshqaruv tizimi:
  * **AdminDashboard:** Tizim metrikalari, tovarlar, sotuvchilar, foydalanuvchilar soni.
  * **AdminProducts:** Barcha tovarlarni ko'rish, tahrirlash, tasdiqlash, narxlarini boshqarish.
  * **AdminSellers:** Yangi do'konlarni tekshirish (KYB) va moderatsiyadan o'tkazish.
  * **AdminCategories & Brands:** Kategoriya daraxti va brendlar katalogini boshqarish.
  * **AdminDataSources:** Tashqi manbalar (Texnomart, MediaPark, Olcha) holati va jonli skreyping tugmasi.
  * **AdminAuditLogs:** Xavfsizlik hodisalari va ma'murlar harakatlari auditi.

### 6. 🔐 3 Bosqichli Kirish Tizimi (Multi-Provider SSO)
* **Elektron pochta & Parol:** `bcrypt` xeshlash va JWT Access Token (7 kunlik sessiya).
* **Telegram orqali 1-Bosishda Kirish:** Deep-link (`t.me/milliynarxbot?start=auth_...`) yoki 6 xonali bir martalik xavfsiz tasdiqlash kodi.
* **Google OAuth 2.0 SSO:** Google Identity Services (GSI) orqali yagona tugma bilan avtorizatsiya.

### 7. 🎨 Dinamik Dark / Light Rejim va Moslashuvchan Dizayn
* **Dinamik Logotip Tizimi:** Dark rejimda `/topbarimgdark.png` (qora fonga moslashuvchan, oq hoshiyasiz), Light rejimda `/topbarnmimg.png` avtomatik almashadi (Header, MobileDrawer, Footer, Login/Register).
* **Mobile-First Responsive:** Barcha asosiy sahifalar smartfon ekranlari uchun to'liq moslashtirilgan.
* **Rich Glassmorphism & Micro-animations:** Zamonaviy premium vizual ko'rinish va yuqori tezlik.

---

## 🏛️ Tizim Arxitekturasi

```text
                                [ FOYDALANUVCHI / SMARTFON / DESKTOP ]
                                                   │
                                                   ▼
                                [ Nginx Reverse Proxy (SSL / TLS 1.3) ]
                                 ├── https://milliynarx.uz (Frontend - Port 5173)
                                 ├── https://admin.milliynarx.uz (Admin - Port 5174)
                                 ├── /api/*  → FastAPI Backend (Port 8000)
                                 └── /uploads/* → Static Media Storage
                                                   │
                 ┌─────────────────────────────────┴─────────────────────────────────┐
                 ▼                                                                   ▼
       [ FastAPI REST API ]                                                [ React 19 SPA ]
       ├── /api/auth (Login, Reg, Google, Telegram)                        ├── Frontend (Port 5173)
       ├── /api/products (Catalog, Search, Stats)                          ├── Admin Terminal (Port 5174)
       ├── /api/compare (Matrix, Spreads)                                  ├── TailwindCSS v4 Dizayn Tizimi
       ├── /api/ai (DeepSeek Engine)                                       ├── Theme Context (Dark / Light)
       ├── /api/scraper (Live Web Scraper & Sync)                          └── Auth & Role Routing
       ├── /api/telegram (Webhook & Daemon)                                          │
       └── /api/seller & /api/admin                                                  │
                 │                                                                   ▼
     ┌───────────┴───────────┐                                           [ External Integrations ]
     ▼                       ▼                                           ├── Google Cloud OAuth 2.0
 [ PostgreSQL / SQLite ]   [ Scraper Engine & Daemons ]                  ├── Telegram Bot API (@milliynarxbot)
 ├── 24 ta bog'langan     ├── TexnomartAdapter (Live Scrape)            ├── OpenRouter DeepSeek API
 │   jadvallar           ├── Telegram Long-Polling daemon              └── Texnomart.uz Catalog
 └── UUID identifikatorlar └── Asinxron narx tekshiruvlari
```

---

## 📁 Loyiha Tuzilishi

```text
milliynarx/
├── backend/                        # Python FastAPI Backend (Port 8000)
│   ├── app/
│   │   ├── adapters/               # Jonli Web Scraper adapterlari
│   │   │   ├── base.py             # Baza adapter abstraksiyasi
│   │   │   └── texnomart.py        # Texnomart.uz jonli skreyping adapteri
│   │   ├── api/                    # REST API yo'nalishlari
│   │   │   ├── auth.py             # Login, Register, Google OAuth, Telegram SSO
│   │   │   ├── products.py         # Katalog, qidiruv, narx trendlari, takliflar
│   │   │   ├── compare.py          # Tovarlarni yonma-yon solishtirish
│   │   │   ├── ai.py               # DeepSeek bozor tahlili va chat
│   │   │   ├── scraper.py          # Jonli skreyping API boshqaruvi
│   │   │   ├── data_sources.py     # Bozor manbalari boshqaruvi
│   │   │   ├── telegram.py         # Bot webhook va avtorizatsiya
│   │   │   ├── seller.py           # Sotuvchi boshqaruvi va onboarding
│   │   │   ├── admin.py            # Administrator moderatsiyasi
│   │   │   ├── alerts.py           # Narx ogohlantirishlari
│   │   │   ├── favorites.py        # Sevimlilar ro'yxati
│   │   │   └── uploads.py          # Rasmlar yuklash servisi
│   │   ├── core/                   # Xavfsizlik, JWT va konfiguratsiya
│   │   │   ├── config.py           # Settings va muhit o'zgaruvchilari
│   │   │   ├── security.py         # bcrypt va JWT shifrlash
│   │   │   └── slug.py             # URL-slug generatori
│   │   ├── db/                     # Ma'lumotlar bazasi
│   │   │   ├── models.py           # 24 ta SQLAlchemy ORM modellari
│   │   │   └── session.py          # DB Session boshqaruvi
│   │   ├── schemas/                # Pydantic validatsiya sxemalari
│   │   ├── services/               # ScraperService, TelegramBotService
│   │   └── main.py                 # FastAPI asosiy ilova konfiguratsiyasi
│   ├── scraper.py                  # Mustaqil CLI Web Scraper skripti
│   ├── requirements.txt            # Python kutubxonalari
│   └── run.py                      # Uvicorn ishga tushirish skripti
│
├── frontend/                       # React 19 + Vite Platforma (Port 5173 - Xaridor & Sotuvchilar)
│   ├── public/                     # Favicon, topbarimgdark.png, topbarnmimg.png va resurslar
│   ├── src/
│   │   ├── api/                    # Axios API mijozi va servislar
│   │   ├── components/             # Layout (Header, Footer, MobileDrawer), auth, modallar
│   │   ├── contexts/               # AuthContext, ThemeContext (Dinamik logotip boshqaruvi)
│   │   ├── pages/
│   │   │   ├── public/             # Landing, Search, Product, Compare, AI Advisor, Legal
│   │   │   ├── buyer/              # BuyerDashboard, Favorites, Alerts, Profile
│   │   │   └── seller/             # SellerDashboard, SellerProducts, Onboarding, Store
│   │   ├── router/                 # AppRouter (Marshrutlash va xavfsiz yo'naltirish)
│   │   └── index.css               # Tailwind CSS v4 dizayn tizimi
│   ├── package.json                # NPM paketlari va skriptlar
│   └── vite.config.js              # Vite konfiguratsiyasi (Port 5173)
│
├── admin/                          # React 19 + Vite Standalone Admin Terminal (Port 5174)
│   ├── src/
│   │   ├── api/                    # Admin API mijozi va servislar
│   │   ├── components/             # AdminLayout, AdminSidebar, AdminHeader, Badge
│   │   ├── contexts/               # Admin AuthContext (faqat ADMIN roli uchun)
│   │   ├── pages/                  # AdminDashboard, AdminSellers, AdminProducts,
│   │   │                           # AdminUsers, AdminCategories, DataSources (Live Scrape), AuditLogs
│   │   ├── router/                 # AdminRouter va AdminProtectedRoute
│   │   └── index.css               # Stillar va dizayn
│   ├── package.json                # Admin bog'liqliklari
│   └── vite.config.js              # Vite konfiguratsiyasi (Port 5174, backend proxy)
│
├── deployment/                     # Serverga o'rnatish skriptlari
│   ├── nginx.conf                  # Nginx konfiguratsiya shabloni
│   └── setup_contabo.sh            # VPS avtomatik o'rnatish skripti
├── uploads/                        # Yuklangan mahsulot va do'kon logotiplari
├── .env.example                    # Muhit o'zgaruvchilari namunasi
└── README.md                       # Loyiha bosh qo'llanmasi
```

---

## 🛠️ O'rnatish va Ishga Tushirish (Local Development)

### 1. Repozitoriyadan nusxa olish
```bash
git clone https://github.com/loopinuz-tech/milliynarx.uz.git
cd milliynarx
```

### 2. Backend sozlash (Python 3.11+)
```bash
# Virtual muhit yaratish va faollashtirish
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux / macOS

# Kutubxonalarni o'rnatish
pip install -r backend/requirements.txt

# .env faylini yaratish
copy .env.example .env      # Windows
# cp .env.example .env      # Linux / macOS
```

`.env` faylini o'z kalitlaringiz bilan to'ldiring:
```ini
JWT_SECRET=your-super-secret-jwt-key
DATABASE_URL=sqlite:///./milliy_narx.db

# DeepSeek AI (OpenRouter)
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key
OPENROUTER_MODEL=deepseek/deepseek-v4-flash-0731:free

# Google OAuth Credentials
GOOGLE_CLIENT_ID=355205646431-6c3sa3um31o322ffr8800o58ip3gsl5h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-secret

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=milliynarxbot
```

Backend serverini ishga tushirish:
```bash
python backend/run.py
# Server http://localhost:8000 da ishga tushadi
# Swagger API hujjatlari: http://localhost:8000/api/docs
```

### 3. Web Scraper orqali real ma'lumotlarni yuklash (Ixtiyoriy)
Mahsulotlar bazasiga Texnomart.uz dan eng so'nggi real narxlar va mahsulotlarni yuklash:
```bash
python backend/scraper.py
```

### 4. Frontend sozlash (Node.js 18+)
```bash
cd frontend
npm install
npm run dev
# Xaridor & Sotuvchilar portali http://localhost:5173 da ochiladi
```

### 5. Admin Terminalini sozlash (Alohida oyna yoki terminalda)
```bash
cd admin
npm install
npm run dev
# Admin Boshqaruv Terminali http://localhost:5174 da ochiladi
```

---

## 🔌 Asosiy API Endpointlar Xaritasi

| Metod | Yo'l | Tavsif | Kirish huquqi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Yangi xaridor yoki do'kon ro'yxatdan o'tkazish | Ochiq |
| `POST` | `/api/auth/login` | Email va parol bilan tizimga kirish | Ochiq |
| `POST` | `/api/auth/google` | Google SSO ID token orqali kirish | Ochiq |
| `POST` | `/api/auth/telegram-session` | Telegram deep-link sessiyasini boshlash | Ochiq |
| `POST` | `/api/auth/telegram-code-login` | 6 xonali Telegram kodi orqali kirish | Ochiq |
| `GET` | `/api/products` | Tovar katalogi va saralash | Ochiq |
| `GET` | `/api/products/search` | Ko'p parametrli tahliliy qidiruv | Ochiq |
| `GET` | `/api/products/{id}` | Tovar sahifasi, barcha sotuvchilar takliflari | Ochiq |
| `GET` | `/api/products/price-trends` | Bozor narxlari grafigi va dinamikasi | Ochiq |
| `GET` | `/api/compare` | Tovarlarni yonma-yon solishtirish va spred tahlili | Ochiq |
| `POST` | `/api/ai/analyze-market` | DeepSeek AI bozor xulosasi generatsiyasi | Ochiq / Foydalanuvchi |
| `POST` | `/api/scraper/scrape/{source_id}`| Texnomart/MediaPark jonli skreypingini chaqirish | Faqat ADMIN |
| `GET` | `/api/data-sources` | Barcha ma'lumot manbalari ro'yxati va holati | Faqat ADMIN |
| `GET` | `/api/seller/metrics` | Do'kon tahliliy ko'rsatkichlari | Faqat SELLER |
| `POST` | `/api/seller/onboarding-complete` | Do'konni to'liq ro'yxatdan o'tkazish | Faqat SELLER |
| `GET` | `/api/admin/metrics` | Bosh administrator ko'rsatkichlari | Faqat ADMIN |
| `POST` | `/api/admin/sellers/{id}/approve`| Do'konni moderatsiyadan o'tkazish | Faqat ADMIN |

---

## ⚖️ Huquqiy va Xavfsizlik Sahifalari (Trust Center)

O'zbekiston Respublikasi qonunchiligi va elektron tijorat talablariga mos ravishda rasmiy sahifalar yaratilgan:

| Sahifa | URL | Mazmuni |
| :--- | :--- | :--- |
| **Foydalanish shartlari** | `/terms` | Ommaviy oferta, platforma mustaqil tahlil terminali maqomi, bepul katalog qoidalari va sotuvchilar talablari |
| **Maxfiylik siyosati** | `/privacy` | O'zbekiston Respublikasi **O'RQ-547 "Shaxsga doir ma'lumotlar to'g'risida"**gi Qonuniga muvofiq ma'lumotlarni yig'ish va saqlash siyosati |
| **Xavfsizlik & Cookie** | `/policy` | Cookie fayllari, Codexa AI axloqiy kodeksi, 3 bosqichli KYB moderatsiyasi va API Rate Limiting |

---

## 👥 Mualliflar va Qo'llab-quvvatlash

* **Loyiha:** Milliy Narx (milliynarx.uz)
* **Manzil:** O'zbekiston Respublikasi
* **Aloqa:** [support@milliynarx.uz](mailto:support@milliynarx.uz) | [legal@milliynarx.uz](mailto:legal@milliynarx.uz)
* **Telegram Bot:** [@milliynarxbot](https://t.me/milliynarxbot)

---
*© 2026 Milliy Narx. Barcha huquqlar himoyalangan.*
