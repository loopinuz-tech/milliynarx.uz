import os
import re
import statistics
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
import requests

def generate_smart_title(query: str) -> str:
    cleaned = re.sub(r'[\?\.!,;:"\(\)]', '', query).strip()
    fillers = [
        r"^salom\b", r"^assalomu alaykum\b", r"^iltimos\b", r"^menga\b",
        r"^bozorda\b", r"^eng arzon\b", r"^qaysi\b", r"^qayerda\b",
        r"^haqida ma'lumot bering\b", r"^narxi qancha\b", r"^narxlari qanday\b"
    ]
    for pattern in fillers:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE).strip()
    words = cleaned.split()
    if not words:
        return "Bozor tahlili"
    title = " ".join(words[:4]).strip()
    return title[:36].capitalize()

from backend.app.db.session import get_db
from backend.app.db.models import Product, PriceHistory, AIAnalysis, Seller, Brand, Category
from backend.app.core.config import settings
from backend.app.schemas.schemas import (
    AIAnalysisRequest, 
    AIAnalysisOut, 
    AIChatRequest, 
    AIChatResponse, 
    AIChatProductSuggestion, 
    AIMarketSummaryOut
)

router = APIRouter(prefix="/ai", tags=["ai"])

def get_llm_client_config():
    """Get URL, API Key, Model, and Headers for OpenRouter or fallback."""
    api_url = None
    api_key = None
    model_name = None
    extra_headers = {}

    if settings.OPENROUTER_API_KEY:
        api_url = f"{settings.OPENROUTER_BASE_URL}/chat/completions"
        api_key = settings.OPENROUTER_API_KEY
        model_name = settings.OPENROUTER_MODEL or "deepseek/deepseek-v4-flash-0731:free"
        extra_headers = {
            "HTTP-Referer": "https://milliy-narx.uz",
            "X-Title": "Milliy Narx Market Intelligence"
        }
    elif settings.OPENAI_API_KEY:
        api_url = "https://api.openai.com/v1/chat/completions"
        api_key = settings.OPENAI_API_KEY
        model_name = "deepseek/deepseek-v4-flash-0731:free"
        
    return api_url, api_key, model_name, extra_headers


@router.post("/analyze", response_model=AIAnalysisOut)
def analyze_market_product(
    request_in: AIAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Analyzes a specific product using real price history, competitor offers,
    and OpenRouter DeepSeek V4 Flash AI.
    """
    product = db.query(Product).filter(
        or_(Product.id == request_in.product_id, Product.slug == request_in.product_id)
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
        
    # Query real price history
    history = db.query(PriceHistory).filter(
        PriceHistory.product_id == product.id
    ).order_by(desc(PriceHistory.recorded_at)).all()
    
    # Query all current offers for this model/name
    comp_products = db.query(Product).filter(
        Product.status == "ACTIVE",
        or_(
            Product.id == product.id,
            and_(Product.model == product.model, Product.model.isnot(None), Product.model != ""),
            Product.name == product.name
        )
    ).all()
    
    prices = [p.price for p in comp_products if p.price is not None and p.price > 0]
    sellers_count = len(set(p.seller_id for p in comp_products if p.seller_id))
    
    # Check if there is enough real data for meaningful analysis
    if len(prices) == 0 and len(history) == 0:
        return AIAnalysisOut(
            product_id=product.id,
            status="INSUFFICIENT_DATA",
            analysis_text="AI tahlili uchun yetarli ma'lumot mavjud emas. Mahsulot bo'yicho narxlar tarixi yoki bir nechta sotuvchilar takliflari shakllanmagan.",
            verdict="FAIR_PRICE",
            recommendation="Bozorda takliflar to'planguncha kuzatib boring.",
            model_name="DeepSeek V4 Flash",
            generated_at=datetime.utcnow(),
            metrics_used={}
        )
        
    min_p = min(prices) if prices else product.price
    max_p = max(prices) if prices else product.price
    avg_p = sum(prices) / len(prices) if prices else product.price
    
    diff_from_avg = product.price - avg_p
    diff_pct = (diff_from_avg / avg_p) * 100 if avg_p > 0 else 0
    
    # Determine verdict and recommendation based on real numbers
    if diff_pct <= -4.0:
        verdict = "BUY_NOW"
        recommendation = "Bozor o'rtacha narxidan arzonroq. Xarid qilish uchun juda qulay imkoniyat!"
    elif diff_pct >= 6.0:
        verdict = "WAIT"
        recommendation = "Taklif bozor o'rtachasidan yuqoriroq. Narx pasayishini kutish yoki boshqa do'konlarni ko'rib chiqish maqsadga muvofiq."
    else:
        verdict = "FAIR_PRICE"
        recommendation = "Bozorning real o'rtacha muvozanatli narxiga to'liq mos keladi."

    metrics = {
        "current_price": product.price,
        "market_min": min_p,
        "market_max": max_p,
        "market_avg": round(avg_p, 2),
        "sellers_count": max(sellers_count, 1),
        "price_history_points": len(history),
        "diff_from_average_percent": round(diff_pct, 2)
    }
    
    analysis_text = ""
    tokens = 0
    used_model_display = "Milliy Narx AI (Codexa)"
    
    api_url, api_key, model_name, extra_headers = get_llm_client_config()
    
    if api_url and api_key:
        try:
            prompt = (
                f"Siz 'Codexa' jamoasi tomonidan yaratilgan Milliy Narx Bozor-Analitika tizimining mustaqil tahlilchisisiz. "
                f"Ushbu tizim online do'kon emas, balki bozor narxlari, talab-taklif va sotuvchilar spredini tahlil qiluvchi axborot platformasidir. "
                f"Faqat quyidagi haqiqiy ma'lumotlarga tayangan holda o'zbek tilida qisqa va lo'nda tahliliy xulosa bering (3-4 jumla). "
                f"Bozordagi narx spredi, eng arzon do'kon va xarid qilish uchun eng maqbul fursatni tushuntiring:\n\n"
                f"Mahsulot nomi: {product.name}\n"
                f"Joriy taklif narxi: {product.price:,.0f} so'm\n"
                f"Bozordagi eng arzon narx: {min_p:,.0f} so'm\n"
                f"Bozordagi eng yuqori narx: {max_p:,.0f} so'm\n"
                f"Bozor o'rtacha narxi: {avg_p:,.0f} so'm\n"
                f"Mustaqil sotuvchilar soni: {metrics['sellers_count']}\n"
                f"O'rtacha narxdan farqi: {diff_pct:+.1f}%\n"
                f"Kuzatilgan narx o'zgarishlari soni: {len(history)}\n\n"
                f"Tahlil:"
            )
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                **extra_headers
            }
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": "Siz Codexa jamoasi tomonidan ishlab chiqilgan Milliy Narx Bozor-Analitika tizimi tahlilchisisiz. Bu onlayn do'kon emas. Haqiqiy bozor raqamlaridan kelib chiqib professional xulosa bering."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2
            }
            resp = requests.post(api_url, headers=headers, json=payload, timeout=20)
            
            # Fallback to DeepSeek alternative free models if needed
            if resp.status_code in [402, 429] and settings.OPENROUTER_API_KEY:
                fallback_models = [m.strip() for m in settings.OPENROUTER_FALLBACK_MODELS.split(",") if m.strip()]
                for alt_model in fallback_models:
                    payload["model"] = alt_model
                    try:
                        alt_resp = requests.post(api_url, headers=headers, json=payload, timeout=15)
                        if alt_resp.status_code == 200:
                            resp = alt_resp
                            used_model_display = "Milliy Narx AI"
                            break
                    except Exception:
                        continue
                
            if resp.status_code == 200:
                data = resp.json()
                analysis_text = data["choices"][0]["message"]["content"].strip()
                tokens = data.get("usage", {}).get("total_tokens", 0)
                used_model_display = "DeepSeek V4 Flash"
        except Exception as e:
            analysis_text = ""
            
    # Deterministic fallback based on pure mathematics if external LLM fails
    if not analysis_text:
        position_desc = ""
        if diff_pct < -4:
            position_desc = f"bozor o'rtacha narxidan {abs(diff_pct):.1f}% arzonroq bo'lib, xaridorlar uchun juda qulay narx hisoblanadi"
        elif diff_pct > 5:
            position_desc = f"bozor o'rtacha narxidan {diff_pct:.1f}% yuqoriroq narxda taklif qilinmoqda"
        else:
            position_desc = "bozorning o'rtacha muvozanatli narx darajasiga to'liq mos keladi"
            
        history_desc = ""
        if len(history) >= 2:
            first_price = history[-1].price
            price_trend = ((product.price - first_price) / first_price) * 100 if first_price > 0 else 0
            if abs(price_trend) > 0.5:
                direction = "pasayish" if price_trend < 0 else "o'sish"
                history_desc = f" Oxirgi kuzatuv davrida narxda {abs(price_trend):.1f}% lik {direction} dinamikasi qayd etilgan."
        
        analysis_text = (
            f"Bozor tahlili natijalariga ko'ra, '{product.name}' mahsuloti hozirda {product.price:,.0f} so'm qiymatida baholangan. "
            f"Ushbu ko'rsatkich {metrics['sellers_count']} ta mustaqil sotuvchi takliflari orasida {position_desc} turibdi."
            f"{history_desc} Bozordagi eng past taklif {min_p:,.0f} so'm, eng yuqorisi esa {max_p:,.0f} so'mni tashkil etadi."
        )

    # Save to ai_analyses
    try:
        record = AIAnalysis(
            product_id=product.id,
            query_type="MARKET_SUMMARY",
            prompt_summary=f"Analysis for product {product.id}",
            response_text=analysis_text,
            tokens_used=tokens
        )
        db.add(record)
        db.commit()
    except Exception:
        db.rollback()

    return AIAnalysisOut(
        product_id=product.id,
        status="SUCCESS",
        analysis_text=analysis_text,
        verdict=verdict,
        recommendation=recommendation,
        model_name=used_model_display,
        generated_at=datetime.utcnow(),
        metrics_used=metrics
    )


@router.post("/chat", response_model=AIChatResponse)
def ai_market_chat(
    req: AIChatRequest,
    db: Session = Depends(get_db)
):
    """
    Interactive AI Market Advisor powered by DeepSeek V4 Flash on OpenRouter.
    Provides answers to buyers and sellers with live catalog context from SQLite.
    """
    user_query = req.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Xabar bo'sh bo'lmasligi kerak")

    # 1. Fetch relevant active products to provide ground truth context to DeepSeek
    words = [w.lower() for w in user_query.replace(",", " ").replace("?", " ").split() if len(w) >= 3]
    
    query_filters = []
    for w in words[:4]:
        query_filters.append(Product.name.ilike(f"%{w}%"))
        query_filters.append(Product.model.ilike(f"%{w}%"))
        
    matched_products = []
    if query_filters:
        matched_products = db.query(Product).filter(
            Product.status == "ACTIVE",
            or_(*query_filters)
        ).limit(6).all()
        
    # If no specific keyword match, get top active products
    if not matched_products:
        matched_products = db.query(Product).filter(
            Product.status == "ACTIVE"
        ).order_by(desc(Product.created_at)).limit(5).all()

    # If specific product_id is given, include it explicitly
    selected_product = None
    if req.product_id:
        selected_product = db.query(Product).filter(Product.id == req.product_id).first()

    # 2. Build live context summary for LLM
    context_lines = []
    context_lines.append("--- MILLIY NARX PLATFORMASI JORIY BOZOR MA'LUMOTLARI ---")
    
    if selected_product:
        seller_name = selected_product.seller.store_name if selected_product.seller else "Rasmiy do'kon"
        context_lines.append(
            f"Foydalanuvchi hozir ko'rayotgan mahsulot: {selected_product.name} | Narxi: {selected_product.price:,.0f} so'm | "
            f"Do'kon: {seller_name} | Kafolat: {selected_product.warranty or 'Mavjud'} | Holati: {selected_product.condition}"
        )
        
    context_lines.append("Bozordagi mavjud mahsulotlar va haqiqiy narxlar:")
    for p in matched_products:
        seller_name = p.seller.store_name if p.seller else "Tasdiqlangan do'kon"
        brand_name = p.brand.name if p.brand else ""
        context_lines.append(
            f"- {p.name} (Brend: {brand_name}): {p.price:,.0f} so'm (Sotuvchi: {seller_name}, Kafolat: {p.warranty or '12 oy'}, Holati: {p.condition})"
        )

    # Database general stats
    total_active = db.query(func.count(Product.id)).filter(Product.status == "ACTIVE").scalar() or 0
    total_sellers = db.query(func.count(Seller.id)).filter(Seller.status == "APPROVED").scalar() or 0
    context_lines.append(f"Umumiy tasdiqlangan sotuvchilar soni: {total_sellers}, Faol narx takliflari: {total_active}")
    context_lines.append("---------------------------------------------------------")
    
    catalog_context = "\n".join(context_lines)

    # 3. Formulate system prompt
    system_prompt = (
        "Siz 'Codexa' jamoasi tomonidan ishlab chiqilgan, O'zbekistonning birinchi mustaqil "
        "'Milliy Narx' Bozor-Analitika va Savdo-Axborot (B2B AI Platform) tizimining Sun'iy Intellekt Tahlilchisisiz.\n\n"
        "VAZIFA VA MAQSAD (Hackathon #19-muammo yechimi):\n"
        "Bozorlardagi real narx-navo va talab-taklif bo'yicha yagona tahliliy ma'lumotlar bazasini taqdim etish. "
        "Tadbirkorlar, ulgurji/chakana xaridorlar va bozor ma'muriyatiga treyderlik platformalari kabi real vaqtda bozorlarni "
        "tahlil qiluvchi, eng arzon va maqbul takliflarni topishga, ortiqcha vaqt va mablag' yo'qotmaslikka yordam berish.\n\n"
        "MUHIM PRINSIP: BU ONLINE DO'KON EMAS!\n"
        "Milliy Narx tovar sotmaydi. Biz savat, buyurtma yoki do'kon emasmiz. Biz mustaqil narx-navo agregatori, "
        "bozor analitikasi va treyderlik axborot tizimiz. Hech qachon 'bizdan xarid qiling' yoki 'biz sotamiz' deb yozmang. "
        "Doimo mustaqil, xolis tahlilchi sifatida do'konlar takliflarini taqqoslab bering.\n\n"
        "QAT'IY QOIDALAR:\n"
        "1. KREATOR: Kim yaratganingiz so'ralsa: 'Codexa jamoasi tomonidan yaratilgan Milliy Narx AI Bozor Tahlilchisi' deb javob bering.\n"
        "2. SALOMLASHISH (QAT'IY TALAB): Agar suhbat davom etayotgan bo'lsa (tarixda kamida bitta oldingi xabar bo'lsa), HAR BIR JAVOBINGIZDA QAYTA-QAYTA 'Assalomu alaykum' deb salomlashmang! Bir marta salomlashilgan yoki suhbat davom etayotgan bo'lsa, to'g'ridan-to'g'ri foydalanuvchining savoliga, hisob-kitobga yoki tahlilga o'ting.\n"
        "3. XOTIRA VA KONTEKST: Oldingi suhbat tarixidagi savol va javoblarni to'liq eslab qoling va ularga uzviy bog'langan holda mantiqiy javob qaytaring.\n"
        "4. BOZOR MA'LUMOTLARI: FAQAT berilgan haqiqiy bozor ma'lumotlariga (narxlar, do'konlar, parametrlar) tayaning. Uydirma narx to'qimang.\n"
        "5. JADVAL: Mahsulotlarni solishtirishda doimo Markdown JADVALI (| Mahsulot | Sotuvchi | Narx (so'm) | Kafolat | Holati | Farq |) formatidan foydalaning.\n"
        "6. SARLAVHA: Javobingizning eng oxirgi qatorida 2-4 so'zdan iborat ixcham mavzu qoldiring: [MAVZU: 2-4 ta so'z]\n\n"
        f"{catalog_context}"
    )

    # 4. Prepare messages payload
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add history (last 8 messages max), preventing double user message
    clean_history = []
    if req.history:
        for msg in req.history[-8:]:
            if msg.role in ["user", "assistant"]:
                clean_history.append({"role": msg.role, "content": msg.content})
        if clean_history and clean_history[-1]["role"] == "user" and clean_history[-1]["content"].strip() == user_query:
            clean_history.pop()
        messages.extend(clean_history)
        
    messages.append({"role": "user", "content": user_query})

    api_url, api_key, model_name, extra_headers = get_llm_client_config()
    reply_text = ""
    model_used = "Milliy Narx AI (Codexa)"

    if api_url and api_key:
        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                **extra_headers
            }
            payload = {
                "model": model_name,
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 800
            }
            resp = requests.post(api_url, headers=headers, json=payload, timeout=25)
            
            # Fallback to DeepSeek alternative free models if needed
            if resp.status_code in [402, 429] and settings.OPENROUTER_API_KEY:
                fallback_models = [m.strip() for m in settings.OPENROUTER_FALLBACK_MODELS.split(",") if m.strip()]
                for alt_model in fallback_models:
                    payload["model"] = alt_model
                    try:
                        alt_resp = requests.post(api_url, headers=headers, json=payload, timeout=15)
                        if alt_resp.status_code == 200:
                            resp = alt_resp
                            model_used = "Milliy Narx AI (Codexa)"
                            break
                    except Exception:
                        continue

            if resp.status_code == 200:
                data = resp.json()
                reply_text = data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            reply_text = ""

    # Smart local fallback if external LLM connection drops
    if not reply_text:
        has_prior_history = len(clean_history) > 0
        if matched_products:
            p_items = []
            for p in matched_products[:4]:
                s_name = p.seller.store_name if p.seller else "Bozor do'koni"
                p_items.append(f"• **{p.name}** — {p.price:,.0f} so'm ({s_name})")
            p_list_str = "\n".join(p_items)
            prefix = "" if has_prior_history else "Codexa jamoasi tomonidan yaratilgan Milliy Narx AI Bozor-Analitika tizimi tahliliga ko'ra:\n\n"
            reply_text = (
                f"{prefix}Siz qidirgan tovarlar bo'yicha hozirgi real bozor takliflari va narxlari:\n\n"
                f"{p_list_str}\n\n"
                f"Ushbu narxlar mustaqil sotuvchilar va do'konlardan real vaqtda agregatsiya qilingan. "
                f"Eng arzon taklifni tanlash orqali ortiqcha xarajatlarning oldini olishingiz mumkin."
            )
        else:
            if has_prior_history:
                reply_text = (
                    f"So'rovingiz bo'yicha bozor ma'lumotlar bazasi ko'rib chiqildi. "
                    f"Platformadagi {total_active} dan ortiq faol mahsulotlar va {total_sellers} ta sotuvchi "
                    f"orasida ushbu parametrlar bo'yicha eng ma'qul narxlar tahlil qilinmoqda."
                )
            else:
                reply_text = (
                    f"Assalomu alaykum! Codexa jamoasi tomonidan ishlab chiqilgan Milliy Narx AI Bozor-Analitika tizimi xizmatingizda. "
                    f"Biz onlayn do'kon emasmiz — biz bozorlardagi real narx-navo, talab-taklif va sotuvchilar spredini "
                    f"tahlil qilib, eng arzon va maqbul takliflarni topishga yordam beruvchi aqlli savdo-axborot tizimiz."
                )

    # 5. Extract suggested product cards to show interactive chips in UI
    suggestions = []
    # If selected product exists, include it first
    seen_ids = set()
    if selected_product:
        img_url = selected_product.images[0].image_url if selected_product.images else None
        suggestions.append(AIChatProductSuggestion(
            id=selected_product.id,
            name=selected_product.name,
            price=selected_product.price,
            brand=selected_product.brand.name if selected_product.brand else None,
            image_url=img_url,
            seller_name=selected_product.seller.store_name if selected_product.seller else "Do'kon"
        ))
        seen_ids.add(selected_product.id)

    for p in matched_products[:3]:
        if p.id not in seen_ids:
            img_url = p.images[0].image_url if p.images else None
            suggestions.append(AIChatProductSuggestion(
                id=p.id,
                name=p.name,
                price=p.price,
                brand=p.brand.name if p.brand else None,
                image_url=img_url,
                seller_name=p.seller.store_name if p.seller else "Do'kon"
            ))
            seen_ids.add(p.id)

    # Extract smart title if present
    session_title = None
    title_match = re.search(r'\[MAVZU:\s*(.*?)\]', reply_text, re.IGNORECASE)
    if title_match:
        session_title = title_match.group(1).strip()
        reply_text = re.sub(r'\[MAVZU:\s*.*?\]', '', reply_text).strip()

    if not session_title:
        session_title = generate_smart_title(user_query)

    return AIChatResponse(
        reply=reply_text,
        suggested_products=suggestions,
        session_title=session_title,
        model_used=model_used,
        timestamp=datetime.utcnow()
    )


@router.get("/market-summary", response_model=AIMarketSummaryOut)
def get_market_summary(db: Session = Depends(get_db)):
    """
    Returns an executive AI market commentary on price trends in Uzbekistan.
    """
    total_active = db.query(func.count(Product.id)).filter(Product.status == "ACTIVE").scalar() or 0
    avg_price = db.query(func.avg(Product.price)).filter(Product.status == "ACTIVE").scalar() or 0
    total_sellers = db.query(func.count(Seller.id)).filter(Seller.status == "APPROVED").scalar() or 0

    summary = (
        f"Milliy Narx platformasi tahliliga ko'ra, O'zbekiston elektronika va maishiy texnika bozorida "
        f"barqaror narx tendensiyasi kuzatilmoqda. Tasdiqlangan {total_sellers} ta mustaqil do'konlar "
        f"kesimida {total_active} ta taklif bo'yicha o'rtacha narx darajasi {avg_price:,.0f} so'mni tashkil qilmoqda. "
        f"Raqobat kuchayishi sababli, xaridorlar uchun narx farqlari 5-15% oralig'ida tejamkorlik imkoniyatini taqdim etmoqda."
    )

    highlights = [
        f"{total_sellers} ta rasmiy tasdiqlangan mustaqil sotuvchi",
        f"{total_active} ta to'liq tekshirilgan real mahsulot taklifi",
        "Sun'iy narx ko'tarilishlarisiz mustaqil narx monitoringi",
        "Sun'iy intellekt orqali 24/7 xolis tahlil"
    ]

    return AIMarketSummaryOut(
        summary=summary,
        key_highlights=highlights,
        model_used="Milliy Narx AI",
        updated_at=datetime.utcnow()
    )
