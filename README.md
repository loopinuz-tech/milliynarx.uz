# 📊 Milliy Narx — O'zbekiston Bozor Narxlari Tahlil Platformasi
### *National Price Intelligence & Market Analytics Terminal (B2B & B2C)*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![DeepSeek AI](https://img.shields.io/badge/AI_Engine-DeepSeek_v4_Flash-4D6BFE.svg?style=flat)](https://openrouter.ai/)
[![Telegram Bot](https://img.shields.io/badge/Telegram_Bot-@milliynarxbot-26A5E4.svg?style=flat&logo=telegram&logoColor=white)](https://t.me/milliynarxbot)
[![Google OAuth](https://img.shields.io/badge/SSO-Google_OAuth_2.0-4285F4.svg?style=flat&logo=google&logoColor=white)](https://console.cloud.google.com/)
[![License](https://img.shields.io/badge/License-Proprietary-orange.svg?style=flat)]()

**Milliy Narx** — O'zbekiston Respublikasining yirik savdo majmualari (*Abu Saxiy, Malika Texnomarkazi, O'rikzor, Sergeli, Qo'yliq va boshqalar*) hamda rasmiy distribyutorlik tarmoqlaridagi tovarlar narxlarini real vaqt rejimida taqqoslovchi, sun'iy intellekt (**DeepSeek AI**) yordamida bozor konyunkturasini tahlil qiluvchi mustaqil axborot-tahliliy terminali.

---

## 🌟 Asosiy Xususiyatlar

### 1. 🔍 Xaridorlar uchun (Smart Price Discovery)
* **Real Bozorlararo Narx Taqqoslash (`/compare`):** Bir xil tovarning Abu Saxiy, Malika, Sergeli va boshqa bozorlardagi narxlarini yonma-yon solishtirish, eng arzon narxni va narxlar farqini (spred) aniqlash.
* **Tarixiy Narxlar Dinamikasi:** O'tgan 30, 90 va 365 kunlik narx tendensiyalari grafigi, mavsumiy tebranishlar tahlili.
* **Aqlli Qidiruv & Avtoto'ldirish (`/search`):** Kategoriya, brend, bozor majmuasi va narx oralig'i bo'yicha tezkor ko'p parametrli filtrlar.
* **Telegram Narx Pasayishi Xabarnomalari (`/alerts`):** Tovar narxi foydalanuvchi belgilagan maqsadli chegaradan tushganda `@milliynarxbot` orqali tezkor bildirishnoma yetkazish.

### 2. 🏪 Do'konlar va Treyderlar uchun (Seller Intelligence)
* **100% Bepul Mahsulot Joylash:** Yangi do'konlar uchun ro'yxatdan o'tish va tovar takliflarini joylash bepul.
* **Do'konni Bosqichma-bosqich Sozlash (`/onboarding`):** Do'kon rekvizitlari, STIR (INN), rasmiy bozor manzili, to'lov turlari (Click, Payme, Terminal, Naqd) va logotip yuklash.
* **Raqobatchilar Narxlari Monitoringi:** O'z tovarining boshqa sotuvchilarga nisbatan qimmat yoki arzonligini real vaqtda kuzatish va narxni optimallashtirish.
* **Boshqaruv Paneli (`/seller`):** Ko'rishlar soni, saqlanganlar (sevimlilar), konversiya ko'rsatkichlari va savdo tahlillari.

### 3. 🤖 Codexa AI — Sun'iy Intellekt Bozor Maslahatchisi (`/ai-advisor`)
* **DeepSeek v4 Flash (OpenRouter):** So'nggi avlod neyrotarmoqlari orqali bozor tahlili.
* **Gallyutsinatsiyasiz Faktik Tahlil:** Faqat ma'lumotlar bazasidagi tasdiqlangan raqamlar, haqiqiy narxlar va do'kon takliflari asosida qisqa, aniq va lo'nda tahliliy xulosalar generatsiyasi.
* **Bozor Arbitraji & Spred Hisoblagich:** Do'konlar o'rtasidagi eng katta narx tafovutlari va qulay xarid vaqti bo'yicha tavsiyalar.

### 4. 🔐 3 Bosqichli Kirish Tizimi (Multi-Provider SSO)
* **Elektron pochta & Parol:** `bcrypt` xeshlash va JWT Access Token (7 kunlik sessiya).
* **Telegram orqali 1-Bosishda Kirish:** Deep-link (`t.me/milliynarxbot?start=auth_...`) yoki 6 xonali bir martalik xavfsiz tasdiqlash kodi.
* **Google OAuth 2.0 SSO:** Google Identity Services (GSI) orqali yagona tugma bilan avtorizatsiya. Sotuvchilar uchun avtomatik `/onboarding` ga yo'naltirish.

### 5. 📱 Mukammal Mobil Moslashuv (Mobile-First Responsive)
* Barcha asosiy sahifalar (`/dashboard`, `/search`, `/ai-advisor`, `/compare`, `/admin`, `/seller`, `/profile`) smartfon ekranlari uchun to'liq moslashtirilgan.
* Gorizontal jadvallar uchun surish bannerlari (`swipe hints`), qisqartirilgan sticky ustunlar va pastki mobil panel uchun xavfsiz oraliqlar (`pb-24`).
* Tungi va kunduzgi rejim (**Dark / Light mode**) to'liq qo'llab-quvvatlanadi.

---

## 🏛️ Tizim Arxitekturasi

```text
                                [ FOYDALANUVCHI / SMARTFON / DESKTOP ]
                                                  │
                                                  ▼
                               [ Nginx Reverse Proxy (SSL / TLS 1.3) ]
                                ├── https://milliynarx.eduxa.uz (Frontend)
                                ├── /api/*  → FastAPI Backend (Port 8000)
                                └── /uploads/* → Static Media Storage
                                                  │
                ┌─────────────────────────────────┴─────────────────────────────────┐
                ▼                                                                   ▼
      [ FastAPI REST API ]                                                [ React 19 SPA ]
      ├── /api/auth (Login, Reg, Google, Telegram)                        ├── Vite Client Terminal
      ├── /api/products (Catalog, Search, Stats)                          ├── TailwindCSS v4
      ├── /api/compare (Matrix, Spreads)                                  ├── Solar Icons Engine
      ├── /api/ai (DeepSeek Engine)                                       ├── Theme Context (Dark/Light)
      ├── /api/telegram (Webhook & Daemon)                                └── Auth & Role Routing
      └── /api/seller & /api/admin                                                  │
                │                                                                   │
    ┌───────────┴───────────┐                                                       ▼
    ▼                       ▼                                           [ External Integrations ]
[ PostgreSQL / SQLite ]   [ Redis / Background Tasks ]                  ├── Google Cloud OAuth 2.0
├── 24 ta bog'langan     ├── Telegram Long-Polling daemon              ├── Telegram Bot API (@milliynarxbot)
│   jadvallar           └── Asinxron narx tekshiruvlari                └── OpenRouter DeepSeek API
└── UUID identifikatorlar
```

---

## 📁 Loyiha Tuzilishi

```text
milliynarx/
├── backend/                        # Python FastAPI Backend
│   ├── app/
│   │   ├── api/                    # REST API yo'nalishlari
│   │   │   ├── auth.py             # Login, Register, Google OAuth, Telegram SSO
│   │   │   ├── products.py         # Katalog, qidiruv, narx trendlari, takliflar
│   │   │   ├── compare.py          # Tovarlarni yonma-yon solishtirish
│   │   │   ├── ai.py               # DeepSeek bozor tahlili va chat
│   │   │   ├── telegram.py         # Bot webhook va qo'lda ulash
│   │   │   ├── seller.py           # Sotuvchi boshqaruvi va onboarding
│   │   │   ├── admin.py            # Administrator moderatsiyasi
│   │   │   ├── alerts.py           # Narx ogohlantirishlari
│   │   │   ├── favorites.py        # Sevimlilar ro'yxati
│   │   │   ├── data_sources.py     # Bozor manbalari adapterlari
│   │   │   └── uploads.py          # Rasmlar yuklash servisi
│   │   ├── core/                   # Xavfsizlik, JWT va konfiguratsiya
│   │   │   ├── config.py           # Settings va muhit o'zgaruvchilari
│   │   │   ├── security.py         # bcrypt va JWT shifrlash
│   │   │   └── slug.py             # URL-slug generatori
│   │   ├── db/                     # Ma'lumotlar bazasi
│   │   │   ├── models.py           # 24 ta SQLAlchemy ORM modellari
│   │   │   └── session.py          # DB Session boshqaruvi
│   │   ├── schemas/                # Pydantic validatsiya sxemalari
│   │   ├── services/               # Telegram bot va tashqi xizmatlar
│   │   └── main.py                 # FastAPI asosiy ilova konfiguratsiyasi
│   ├── requirements.txt            # Python kutubxonalari
│   └── run.py                      # Uvicorn ishga tushirish skripti
│
├── frontend/                       # React 19 + Vite Frontend
│   ├── public/                     # Favicon, logotiplar va statik resurslar
│   ├── src/
│   │   ├── api/                    # Axios API mijozi va servislar
│   │   │   ├── client.js           # JWT interceptor va xatoliklar filtri
│   │   │   └── services.js         # REST so'rov funksiyalari
│   │   ├── components/             # Qayta ishlatiluvchi komponentlar
│   │   │   ├── auth/               # GoogleLoginButton, TelegramModal, ProtectedRoute
│   │   │   ├── common/             # LineChart, SolarIcon, PlanBillingModal
│   │   │   └── layout/             # Header, Footer, Sidebar, DashboardLayout
│   │   ├── contexts/               # React Context (AuthContext, ThemeContext)
│   │   ├── pages/                  # Ilova sahifalari
│   │   │   ├── public/             # Landing, Search, Product, Compare, AI Advisor,
│   │   │   │                       # TermsPage, PrivacyPage, PolicyPage, Login, Register
│   │   │   ├── buyer/              # Dashboard, Favorites, Alerts, Profile
│   │   │   ├── seller/             # SellerDashboard, SellerProducts, Onboarding, Store
│   │   │   └── admin/              # AdminDashboard, AdminSellers, AdminProducts, Users
│   │   ├── router/                 # AppRouter (Marshrutlash va redirectlar)
│   │   └── index.css               # Tailwind CSS v4 dizayn tizimi
│   ├── package.json                # NPM paketlari va skriptlar
│   └── vite.config.js              # Vite konfiguratsiyasi
│
├── deployment/                     # Serverga o'rnatish skriptlari
│   ├── nginx_milliynarx.conf       # Nginx konfiguratsiya shabloni
│   └── setup_contabo.sh            # VPS avtomatik o'rnatish skripti
├── uploads/                        # Yuklangan mahsulot va do'kon logotiplari
├── .env.example                    # Muhit o'zgaruvchilari namunasi
└── README.md                       # Loyiha bosh qo'llanmasi
```

---

## ⚖️ Huquqiy va Xavfsizlik Sahifalari (Trust Center)

O'zbekiston Respublikasi qonunchiligi va elektron tijorat talablariga mos ravishda 3 ta rasmiy sahifa yaratilgan:

| Sahifa | URL | Mazmuni |
| :--- | :--- | :--- |
| **Foydalanish shartlari** | `/terms` | Ommaviy oferta, platforma mustaqil tahlil terminali maqomi, bepul katalog qoidalari va sotuvchilar talablari |
| **Maxfiylik siyosati** | `/privacy` | O'zbekiston Respublikasi **O'RQ-547 "Shaxsga doir ma'lumotlar to'g'risida"**gi Qonuniga muvofiq ma'lumotlarni yig'ish, saqlash va shifrlash siyosati |
| **Xavfsizlik & Cookie** | `/policy` | Majburiy va tahliliy Cookie'lar, Codexa AI axloqiy kodeksi, 3 bosqichli KYB moderatsiyasi va API Rate Limiting |

*Shuningdek, xato yozilgan yo'llar (`/privasy`, `/policsy`, `/policies`, `/terms-of-service`, `/privacy-policy`) avtomatik tarzda asosiy sahifaga yo'naltiriladi.*

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

### 3. Frontend sozlash (Node.js 18+)
```bash
cd frontend

# Kutubxonalarni o'rnatish
npm install

# Frontend .env faylini yaratish
echo VITE_GOOGLE_CLIENT_ID=355205646431-6c3sa3um31o322ffr8800o58ip3gsl5h.apps.googleusercontent.com > .env

# Dasturchi rejimida ishga tushirish
npm run dev
# Ilova http://localhost:5173 da ochiladi
```

---

## 🚀 VPS Serverga O'rnatish (Production Deployment)

### 1. Serverda Nginx konfiguratsiyasi
`/etc/nginx/sites-available/milliynarx`:
```nginx
server {
    server_name milliynarx.eduxa.uz;

    # Frontend SPA statik fayllari
    location / {
        root /var/www/milliynarx/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Yuklangan media fayllar
    location /uploads/ {
        alias /var/www/milliynarx/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # FastAPI REST API proksi
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Backend uchun Systemd Xizmati
`/etc/systemd/system/milliynarx-backend.service`:
```ini
[Unit]
Description=Milliy Narx FastAPI Backend Daemon
After=network.target

[Service]
User=root
WorkingDirectory=/var/www/milliynarx
ExecStart=/var/www/milliynarx/venv/bin/python backend/run.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Xizmatni faollashtirish:
```bash
sudo systemctl daemon-reload
sudo systemctl enable milliynarx-backend
sudo systemctl restart milliynarx-backend
```

### 3. Telegram Webhook o'rnatish
Serverda webhook manzilini faollashtirish:
```bash
curl -F "url=https://milliynarx.eduxa.uz/api/telegram/webhook" https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook
```

---

## 🔌 Asosiy API Endpointlar Xaritasi

| Metod | Yo'l | Tavsif | Kirish huquqi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Yangi xaridor yoki do'kon ro'yxatdan o'tkazish | Ochiq |
| `POST` | `/api/auth/login` | Email va parol bilan tizimga kirish | Ochiq |
| `POST` | `/api/auth/google` | Google SSO ID token orqali kirish / ro'yxatdan o'tish | Ochiq |
| `POST` | `/api/auth/telegram-session` | Telegram deep-link sessiyasini boshlash | Ochiq |
| `POST` | `/api/auth/telegram-code-login` | 6 xonali Telegram kodi orqali kirish | Ochiq |
| `GET` | `/api/products` | Tovar katalogi va saralash | Ochiq |
| `GET` | `/api/products/search` | Ko'p parametrli tahliliy qidiruv | Ochiq |
| `GET` | `/api/products/{id}` | Tovar sahifasi, barcha sotuvchilar takliflari | Ochiq |
| `GET` | `/api/products/price-trends` | Bozor narxlari grafigi va dinamikasi | Ochiq |
| `GET` | `/api/compare` | Tovarlarni yonma-yon solishtirish va spred tahlili | Ochiq |
| `POST` | `/api/ai/analyze-market` | DeepSeek AI bozor xulosasi generatsiyasi | Ochiq / Foydalanuvchi |
| `GET` | `/api/seller/metrics` | Do'kon tahliliy ko'rsatkichlari | Faqat SELLER |
| `POST` | `/api/seller/onboarding-complete` | Do'konni to'liq ro'yxatdan o'tkazish | Faqat SELLER |
| `GET` | `/api/admin/metrics` | Bosh administrator ko'rsatkichlari | Faqat ADMIN |
| `POST` | `/api/admin/sellers/{id}/approve`| Do'konni moderatsiyadan o'tkazish | Faqat ADMIN |

---

## 👥 Mualliflar va Qo'llab-quvvatlash

* **Loyiha:** Milliy Narx (milliynarx.uz / milliynarx.eduxa.uz)
* **Manzil:** Xorazm viloyati, O'zbekiston
* **Aloqa:** [support@milliynarx.uz](mailto:support@milliynarx.uz) | [legal@milliynarx.uz](mailto:legal@milliynarx.uz)
* **Telegram Bot:** [@milliynarxbot](https://t.me/milliynarxbot)

---
*© 2026 Milliy Narx. Barcha huquqlar himoyalangan.*
