import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, favoriteService, alertService, aiService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice, formatDate, formatPercent } from '../../utils/formatters';
import SolarIcon from '../../components/common/SolarIcon';
import Badge from '../../components/common/Badge';
import PriceChart from '../../components/charts/PriceChart';
import Skeleton from '../../components/common/Skeleton';

function cleanAiSummary(text) {
  if (!text) return '';
  let cleaned = text
    .replace(/^(\*\*Tahlil:\*\*|\*\*Codexa tahlili:\*\*|Tahlil shuni ko['’`]?rsatadiki,?\s*|Bozor tahlili shuni ko['’`]?rsatadiki,?\s*|Tahlil natijalariga ko['’`]?ra,?\s*|Tahlil natijasiga ko['’`]?ra,?\s*|Xulosa qilib aytganda,?\s*|Xulosa:\s*|Tahlil:\s*)/i, '')
    .replaceAll('**', '')
    .replaceAll('*', '')
    .trim();
    
  // Ensure maximum 2 concise sentences
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > 2) {
    cleaned = sentences.slice(0, 2).join(' ').trim();
  }
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

export const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);

  // Price Alert Modal state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [alertSuccess, setAlertSuccess] = useState(false);

  // AI Analysis state (auto-loaded)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Recommended products state
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);
        const res = await productService.getProductDetail(id);
        setData(res);
        if (res.product?.price) {
          setTargetPrice(Math.round(res.product.price * 0.95)); // Suggest 5% drop
        }

        // 1. Automatically run AI Market Analysis on product load
        setAiLoading(true);
        aiService.analyzeProduct(id)
          .then(aiRes => {
            setAiResult(aiRes);
          })
          .catch(aiErr => {
            console.error("Auto AI analysis failed:", aiErr);
          })
          .finally(() => {
            setAiLoading(false);
          });

        // 2. Fetch market alternatives & recommendations from same category
        try {
          let recs = [];
          if (res.product?.category_id) {
            recs = await productService.getProducts({ 
              category_id: res.product.category_id, 
              limit: 10 
            });
          }
          if (!recs || recs.length <= 1) {
            recs = await productService.getProducts({ limit: 10 });
          }
          setRecommendations((recs || []).filter(p => String(p.id) !== String(id)));
        } catch (recErr) {
          console.error("Failed to load recommendations:", recErr);
        }
      } catch (err) {
        setError("Mahsulot ma'lumotlarini yuklashda xatolik yuz berdi yoki mahsulot topilmadi.");
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await favoriteService.toggle(id);
      setIsFavorited(res.favorited);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await alertService.createAlert(id, parseFloat(targetPrice));
      setAlertSuccess(true);
      setTimeout(() => {
        setAlertSuccess(false);
        setShowAlertModal(false);
      }, 1500);
    } catch (err) {
      alert("Ogohlantirish yaratishda xatolik yuz berdi");
    }
  };

  const handleRunAiAnalysis = async () => {
    try {
      setAiLoading(true);
      const res = await aiService.analyzeProduct(id);
      setAiResult(res);
    } catch (err) {
      setAiResult({
        status: "ERROR",
        analysis_text: "AI tahlilini amalga oshirishda xatolik yuz berdi."
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddToCompare = (targetId = null) => {
    const productId = targetId || id;
    const existing = JSON.parse(localStorage.getItem('milliy_narx_compare') || '[]');
    if (!existing.includes(productId)) {
      if (existing.length >= 5) {
        alert("Taqqoslash uchun ko'pi bilan 5 ta mahsulot saqlanishi mumkin.");
        return;
      }
      existing.push(productId);
      localStorage.setItem('milliy_narx_compare', JSON.stringify(existing));
    }
    navigate(`/compare?ids=${existing.join(',')}`);
  };

  const handleAskAiAboutProduct = () => {
    if (!data?.product) return;
    const p = data.product;
    const prompt = `${p.name} mahsulotining narxi (${formatPrice(p.price)}), bozordagi boshqa sotuvchilar takliflari va narxlar tendensiyasi bo'yicha mustaqil tahlil va tavsiya bering. Ushbu narxda sotib olish hozir qanchalik maqbul?`;
    navigate(`/ai-advisor?prompt=${encodeURIComponent(prompt)}`);
  };

  if (loading) {
    return (
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-96 bg-white border border-slate-200 rounded-2xl" />
          <div className="lg:col-span-7 h-96 bg-white border border-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="w-full bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <SolarIcon name="CloseCircle" size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">{error}</h3>
          <button
            onClick={() => navigate('/search')}
            className="mt-4 px-5 py-2.5 bg-orange-600 text-white text-xs font-semibold rounded-xl hover:bg-orange-700 cursor-pointer"
          >
            Katalogga qaytish
          </button>
        </div>
      </div>
    );
  }

  const { product, price_history, market_stats, other_offers } = data;
  const images = product.images || [];

  // Construct comprehensive sellers list for this model across the market
  const currentSellerOffer = {
    product_id: product.id,
    seller_id: product.seller_id,
    seller_name: product.seller_name || "Rasmiy Bozor Do'koni",
    seller_rating: product.seller_rating || 5.0,
    price: product.price,
    availability: product.availability,
    location: product.location || "Toshkent shahri",
    warranty: product.warranty || "12 oy rasmiy",
    delivery: product.delivery || "1 kun ichida",
    condition: product.condition === 'NEW' ? 'Yangi' : product.condition,
    is_current: true
  };

  let allOffers = [currentSellerOffer];
  if (other_offers && Array.isArray(other_offers)) {
    other_offers.forEach(o => {
      if (String(o.product_id) !== String(product.id)) {
        allOffers.push({
          ...o,
          condition: 'Yangi',
          warranty: o.warranty || '12 oy',
          is_current: false
        });
      }
    });
  }

  // Sort sellers by price ascending
  const allSellersSorted = [...allOffers].sort((a, b) => a.price - b.price);
  const minSellerPrice = allSellersSorted.length > 0 ? allSellersSorted[0].price : product.price;
  const maxSellerPrice = allSellersSorted.length > 0 ? Math.max(...allSellersSorted.map(s => s.price)) : product.price;
  const avgSellerPrice = allSellersSorted.length > 0 
    ? allSellersSorted.reduce((sum, s) => sum + s.price, 0) / allSellersSorted.length 
    : product.price;

  // Real-time market terminal metrics
  const spread = Math.max(0, maxSellerPrice - minSellerPrice);
  const spreadPct = minSellerPrice > 0 ? ((spread / minSellerPrice) * 100).toFixed(1) : '0.0';
  const isBestOffer = product.price <= minSellerPrice;
  const isSingleSeller = allSellersSorted.length <= 1 || minSellerPrice === maxSellerPrice;
  const rangeMin = minSellerPrice;
  const rangeMax = maxSellerPrice;
  const rangeSpan = rangeMax - rangeMin || 1;
  const currentPosPct = isSingleSeller ? 100 : Math.min(100, Math.max(0, Math.round(((product.price - rangeMin) / rangeSpan) * 100)));

  // Calculate genuine historical price change if price_history has recorded entries
  let realPriceChange = null;
  if (price_history && price_history.length > 1) {
    const earliest = price_history[0].price;
    const current = product.price;
    if (earliest && earliest !== current) {
      const diff = current - earliest;
      const pct = ((diff / earliest) * 100).toFixed(1);
      realPriceChange = {
        earliest,
        diff,
        pct: Number(pct) > 0 ? `+${pct}%` : `${pct}%`,
        isDrop: diff < 0
      };
    }
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6">
      {/* 1. TOP BREADCRUMB & PLATFORM IDENTITY ROW */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-2 truncate">
          <span onClick={() => navigate('/')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer font-medium">Bosh sahifa</span>
          <span>/</span>
          <span onClick={() => navigate('/search')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer font-medium">Bozor Tahlili</span>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-200 font-bold truncate max-w-sm">{product.name}</span>
        </div>

        {/* Real-time Market Intelligence Status Tag */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-semibold rounded-xl shadow-2xs border border-slate-800 dark:border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Milliy Narx Terminali &bull; Real Bozor Ma'lumotlari</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddToCompare()}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <SolarIcon name="Compare" size={15} />
              <span>Taqqoslash</span>
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer ${
                isFavorited 
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200'
              }`}
            >
              <SolarIcon name="Heart" size={15} />
              <span>{isFavorited ? 'Saqlangan' : 'Monitoringga olish'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. HIGH-DENSITY MARKET INTELLIGENCE KPI STRIP (4 REAL METRICS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Spot Quote */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
            <span>Spot Kotirovka</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              FAOL
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-numeric tracking-tight">
            {formatPrice(product.price)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className={`font-semibold ${isBestOffer ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {isBestOffer ? "Eng arzon benchmark" : `+${formatPrice(product.price - minSellerPrice)}`}
            </span>
            {realPriceChange ? (
              <span className={`font-numeric font-semibold ${realPriceChange.isDrop ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {realPriceChange.pct} dinamika
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                Barqaror narx
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Market Corridor & Spread */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
            <span>Bozor Koridori</span>
            <span className="text-orange-600 dark:text-orange-400 font-mono text-[10px] bg-orange-50 dark:bg-orange-950/60 px-1.5 py-0.5 rounded font-bold">
              SPRED: {spread > 0 ? `${spreadPct}%` : '0.0%'}
            </span>
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-white font-numeric truncate">
            {isSingleSeller ? formatPrice(product.price) : `${formatPrice(minSellerPrice)} — ${formatPrice(maxSellerPrice)}`}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Arbitraj holati:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300 font-numeric">
              {spread > 0 ? formatPrice(spread) : "0 so'm (Monolit)"}
            </span>
          </div>
        </div>

        {/* Metric 3: Market Liquidity & Depth */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
            <span>Bozor Chuqurligi</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[10px] bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded font-bold">
              {allSellersSorted.length} TA DILER
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
            <span>{product.seller_name || "Rasmiy Do'kon"}</span>
            <span className="text-emerald-500">★ {product.seller_rating || 5.0}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Hudud:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{product.location || 'Toshkent'}</span>
          </div>
        </div>

        {/* Metric 4: Codexa AI Signal */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1">
              <img src="/aiimg.png" alt="AI" className="w-3.5 h-3.5 object-contain" />
              AI Algoritmik Signal
            </span>
            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 font-mono">CODEXA AI</span>
          </div>
          <div className="text-sm font-black tracking-tight">
            {aiLoading ? (
              <span className="text-slate-400 animate-pulse text-xs">Hisoblanmoqda...</span>
            ) : aiResult?.verdict === 'BUY_NOW' ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <SolarIcon name="CheckCircle" size={14} /> XARID UCHUN MAQBUL
              </span>
            ) : aiResult?.verdict === 'WAIT' ? (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <SolarIcon name="Clock" size={14} /> NARX TUSHISHINI KUTISH
              </span>
            ) : (
              <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <SolarIcon name="Shield" size={14} /> BOZOR MUVOZANATIDA
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {aiResult?.recommendation || "Bozor o'rtacha muvozanatli narxiga to'liq mos"}
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN FINANCIAL MARKET TERMINAL CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs transition-colors">
        
        {/* Left Column (5 cols): Technical Asset Profile & Verification Passport */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span>[KOD: {product.sku || product.model || 'B2B-TECH'}]</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-sans flex items-center gap-1">
              <SolarIcon name="CheckCircle" size={12} /> TASDIQLANGAN KATALOG
            </span>
          </div>

          {/* Compact Technical Viewport */}
          <div className="w-full h-72 sm:h-80 bg-slate-50/70 dark:bg-[#0E1524] rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200/80 dark:border-slate-800 relative group">
            {images.length > 0 ? (
              <img
                src={images[selectedImg]?.image_url || images[0]?.image_url}
                alt={product.name}
                className="max-h-full max-w-full object-contain p-6 group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <SolarIcon name="Box" size={56} className="text-slate-300 dark:text-slate-700" />
            )}

            {/* Technical Viewport Watermark Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              <span className="px-2 py-0.5 bg-slate-900/90 dark:bg-slate-800/90 text-white text-[10px] font-mono font-bold rounded backdrop-blur-xs">
                {product.condition === 'NEW' ? 'YANGI MAHSULOT' : product.condition}
              </span>
              {product.model && (
                <span className="px-2 py-0.5 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 text-[10px] font-mono rounded border border-slate-200 dark:border-slate-700">
                  MODEL: {product.model}
                </span>
              )}
            </div>

            {product.sku && (
              <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-800">
                SKU: {product.sku}
              </div>
            )}
          </div>

          {/* Image Selector Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto max-w-full pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImg(idx)}
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center p-1 overflow-hidden transition-all cursor-pointer ${
                    selectedImg === idx 
                      ? 'border-orange-600 ring-2 ring-orange-500/20 bg-orange-50/30 dark:bg-orange-950/30' 
                      : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100 bg-white dark:bg-slate-900'
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}

          {/* Institutional Asset Data Sheet (Specs Table) */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden text-xs">
            <div className="bg-slate-50 dark:bg-[#151D2C] px-3.5 py-2 font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <span>Rasmiy Xarakteristikalar</span>
              <span className="font-mono text-slate-400 dark:text-slate-500 font-normal">KATALOG</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#111827]">
              <div className="px-3.5 py-2 flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-400">Model kodi:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{product.model || '-'}</span>
              </div>
              <div className="px-3.5 py-2 flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-400">SKU / Kod:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{product.sku || '-'}</span>
              </div>
              <div className="px-3.5 py-2 flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-400">Brend / Ishlab chiqaruvchi:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{product.brand_name || 'Bozor Texnikasi'}</span>
              </div>
              <div className="px-3.5 py-2 flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-400">Kategoriya sektori:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{product.category_name}</span>
              </div>
              <div className="px-3.5 py-2 flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-400">Rasmiy Kafolat:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{product.warranty || 'Mavjud emas'}</span>
              </div>
              <div className="px-3.5 py-2 flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-400">Logistika va yetkazish:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{product.delivery || 'Kelishiladi'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Market Intelligence & Quotation Console */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Header Identity */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/80 px-2.5 py-0.5 rounded-md font-mono">
                  {product.brand_name || 'BOZOR KOTIROVKASI'}
                </span>
                <Badge status={product.availability} size="xs" />
                <span className="text-xs text-slate-400 font-mono">
                  {product.category_name}
                </span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 ml-auto hidden sm:inline">
                  OXIRGI YANGILANISH: {formatDate(product.updated_at || product.created_at)}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                {product.name}
              </h1>
            </div>

            {/* Visual Trading Range Corridor (Visual Price Gauge) */}
            {isSingleSeller ? (
              <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-[#151D2C] border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <SolarIcon name="Shield" size={14} className="text-emerald-600 dark:text-emerald-400" />
                    Bozor Kotirovkasi Holati
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                    100% BARQAROR BENCHMARK
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Yagona diler narxi: <strong className="text-slate-900 dark:text-white font-numeric text-sm">{formatPrice(product.price)}</strong></span>
                  <span>Bozor spredi: <strong className="text-emerald-600 dark:text-emerald-400 font-numeric">0 so'm (Tafovutsiz)</strong></span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ushbu mahsulot bo'yicha bozorda 1 ta rasmiy diler taklifi mavjud. Narx sun'iy koridorsiz, to'g'ridan-to'g'ri dilerning rasmiy kotirovkasiga to'liq mos keladi.
                </p>
              </div>
            ) : (
              <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-[#151D2C] border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <SolarIcon name="Chart" size={14} className="text-orange-600 dark:text-orange-400" />
                    Bozor Narx Shkalasi va Koridori (Price Corridor)
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    DIAPAZON: {formatPrice(minSellerPrice)} &mdash; {formatPrice(maxSellerPrice)}
                  </span>
                </div>

                {/* Graphical Range Bar */}
                <div className="relative pt-4 pb-2">
                  <div className="w-full h-3.5 bg-slate-200/90 dark:bg-slate-700/70 rounded-full relative overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-full opacity-80"
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Spot Needle Pinpoint */}
                  <div 
                    className="absolute top-1 transform -translate-x-1/2 flex flex-col items-center transition-all duration-500 pointer-events-none"
                    style={{ left: `${Math.min(95, Math.max(5, currentPosPct))}%` }}
                  >
                    <span className="px-2 py-0.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black font-numeric rounded-md shadow-md whitespace-nowrap">
                      Joriy: {formatPrice(product.price)}
                    </span>
                    <div className="w-2 h-2 bg-slate-900 dark:bg-white rotate-45 -mt-1" />
                  </div>
                </div>

                {/* Range Limits Footer */}
                <div className="flex items-center justify-between text-[11px] font-numeric text-slate-500 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Bozor Minimumi: <strong className="text-slate-800 dark:text-slate-200">{formatPrice(minSellerPrice)}</strong></span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>O'rtacha konsensus: <strong className="text-slate-800 dark:text-slate-200">{formatPrice(avgSellerPrice)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Maksimum: <strong className="text-slate-800 dark:text-slate-200">{formatPrice(maxSellerPrice)}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* Dealer Quotation & Arbitrage Summary Box */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-orange-50/20 dark:from-[#151D2C] dark:via-[#131C2E] dark:to-[#1A1813] border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-2xs">
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <span>Joriy Diler Kotirovkasi:</span>
                  {isBestOffer && (
                    <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded text-[9px] font-bold">
                      ENG ARZON (BENCHMARK)
                    </span>
                  )}
                </div>
                <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-numeric tracking-tight mt-0.5">
                  {formatPrice(product.price)}
                </div>
                {realPriceChange ? (
                  <div className="text-xs font-numeric mt-0.5 flex items-center gap-2">
                    <span className="text-slate-400 dark:text-slate-500 line-through">{formatPrice(realPriceChange.earliest)}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded text-[10px]">
                      {realPriceChange.pct} narx dinamikasi
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                    Rasmiy dilerning to'g'ridan-to'g'ri kotirovkasi
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end text-right">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold">Market-Meyker:</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 mt-0.5">
                  <span>{product.seller_name || "Rasmiy Diler"}</span>
                  <span className="p-0.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded">
                    <SolarIcon name="CheckCircle" size={13} />
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-400 font-mono mt-0.5">
                  ★ {product.seller_rating || 5.0} &bull; {product.location || 'Toshkent'}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                  Logistika: {product.delivery || '1 kunda'} &bull; Kafolat: {product.warranty || '12 oy'}
                </div>
              </div>
            </div>

            {/* Codexa AI Market Intelligence & Arbitrage Verdict Box */}
            <div id="ai-section" className="p-4 sm:p-5 bg-gradient-to-r from-orange-50/80 via-amber-50/30 to-white dark:from-[#1A140E] dark:via-[#131A28] dark:to-[#101726] border border-orange-200 dark:border-orange-900/60 rounded-2xl shadow-2xs space-y-3 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200/70 dark:border-orange-900/40 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-orange-600 text-white p-0.5 flex items-center justify-center shadow-2xs">
                    <img src="/aiimg.png" alt="AI" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                      Codexa AI Bozor Xulosasi
                    </span>
                    <span className="text-[9px] bg-orange-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                      Codexa
                    </span>
                  </div>
                </div>

                {/* AI Verdict Badge */}
                {aiLoading ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 text-[11px] font-bold animate-pulse">
                    Tahlil hisoblanmoqda...
                  </span>
                ) : aiResult?.verdict === 'BUY_NOW' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                    <SolarIcon name="CheckCircle" size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Eng maqbul fursat (Xarid uchun qulay)</span>
                  </span>
                ) : aiResult?.verdict === 'WAIT' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                    <SolarIcon name="Clock" size={13} className="text-amber-600 dark:text-amber-400" />
                    <span>Narx pasayishini kutish tavsiya</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                    <SolarIcon name="Shield" size={13} className="text-blue-600 dark:text-blue-400" />
                    <span>Bozor muvozanatli narxi</span>
                  </span>
                )}
              </div>

              {/* AI Analysis Text */}
              {aiLoading ? (
                <div className="space-y-2 py-1 animate-pulse">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700/80 rounded-full w-full"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700/80 rounded-full w-5/6"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700/80 rounded-full w-3/5"></div>
                </div>
              ) : (
                <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {cleanAiSummary(aiResult?.analysis_text) || (
                    isSingleSeller
                      ? `Mahsulot bozorning muvozanatli narxida (${formatPrice(product.price)}) barqaror turibdi. Hozirda xarid qilish maqsadga muvofiq.`
                      : isBestOffer
                      ? `Joriy taklif (${formatPrice(product.price)}) bozordagi eng arzon narx hisoblanadi. Xarid qilish uchun eng qulay fursat.`
                      : `Mahsulot bozorning o'rtacha muvozanatli narxida (${formatPrice(product.price)}) taklif etilmoqda. Xarid uchun qulay fursat.`
                  )}
                </p>
              )}

              {/* Recommendation chip + AI consultation link */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {aiResult?.recommendation ? (
                  <div className="flex-1 min-w-[200px] p-2 bg-white/90 dark:bg-[#141C2E] rounded-lg border border-orange-200/80 dark:border-orange-900/50 text-[11px] text-orange-950 dark:text-orange-200 font-medium flex items-center gap-1.5">
                    <SolarIcon name="Stars" size={14} className="text-orange-600 dark:text-orange-400 shrink-0" />
                    <span className="truncate"><strong>Tavsiya:</strong> {aiResult.recommendation}</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                    Mustaqil tahlil: Real bozor kotirovkalari asosida
                  </div>
                )}

                <button
                  onClick={handleAskAiAboutProduct}
                  className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center gap-1 ml-auto cursor-pointer transition-colors py-1 px-2.5 rounded-lg bg-white/80 dark:bg-slate-800 border border-orange-200 dark:border-orange-800/60 hover:bg-orange-50 dark:hover:bg-orange-950/50 shadow-2xs"
                >
                  <img src="/aiimg.png" alt="AI" className="w-3.5 h-3.5 object-contain" />
                  <span>AI bilan batafsil suhbat</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Row: Professional Trading Terminal Command Bar */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAlertModal(true)}
              className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs cursor-pointer border border-transparent dark:border-slate-700"
            >
              <SolarIcon name="Bell" size={16} />
              <span>Narx monitoringi o'rnatish</span>
            </button>

            <button
              onClick={handleAskAiAboutProduct}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <img src="/aiimg.png" alt="AI" className="w-4 h-4 object-contain rounded-full shadow-2xs" />
              <span>Codexa AI Maslahatchi</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('sellers-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer border border-transparent dark:border-slate-700"
            >
              <SolarIcon name="Shop" size={16} />
              <span>Barcha dilerlar ({allSellersSorted.length} ta)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE SELLER PRICE COMPARISON TABLE-GRAPH (CHART + MATRIX) */}
      <div id="sellers-section" className="w-full bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xs space-y-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <SolarIcon name="Chart" size={20} className="text-orange-600 shrink-0" />
              <span>Sotuvchilar Narxlari Solishtirma Grafigi (Table-Graph)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300">
                {allSellersSorted.length} ta do'kon
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bozordagi barcha sotuvchilar takliflari, spred grafigi va narx taqsimoti tahlili
            </p>
          </div>

          {/* Benchmark indicators pill row */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-numeric">
            <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="whitespace-nowrap">Eng arzon: {formatPrice(minSellerPrice)}</span>
            </div>
            <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="whitespace-nowrap">O'rtacha: {formatPrice(avgSellerPrice)}</span>
            </div>
            {maxSellerPrice > minSellerPrice && (
              <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                <span className="whitespace-nowrap">Maksimum: {formatPrice(maxSellerPrice)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop & Tablet View: Fully Responsive Table Graph */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-slate-50/90 dark:bg-[#151D2C] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3.5 w-10 text-center">#</th>
                <th className="py-3 px-3.5 min-w-[200px] lg:min-w-[240px]">Sotuvchi va Do'kon</th>
                <th className="py-3 px-3.5 w-36 lg:w-44 whitespace-nowrap">Taklif Narxi</th>
                <th className="py-3 px-3.5 w-48 sm:w-56 lg:w-64 max-w-[260px]">Taqqoslama Narx Grafigi</th>
                <th className="py-3 px-3.5 w-36 hidden lg:table-cell">Kafolat & Yetkazish</th>
                <th className="py-3 px-3.5 w-24 sm:w-28 text-right whitespace-nowrap">Harakat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {allSellersSorted.map((seller, idx) => {
                const isLowest = seller.price === minSellerPrice;
                const diffFromMin = seller.price - minSellerPrice;
                const diffPct = minSellerPrice > 0 ? (diffFromMin / minSellerPrice) * 100 : 0;
                const barWidth = maxSellerPrice > 0 
                  ? Math.max(15, Math.min(100, Math.round((seller.price / maxSellerPrice) * 100))) 
                  : 50;

                return (
                  <tr 
                    key={seller.product_id || idx} 
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                      seller.is_current ? 'bg-orange-50/20 dark:bg-orange-950/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-3.5 text-center font-bold text-slate-400 font-numeric">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                          {seller.seller_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{seller.seller_name}</span>
                            {seller.is_current && (
                              <span className="px-1.5 py-0.2 bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 rounded text-[9px] font-bold shrink-0">
                                Ko'rilmoqda
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span className="text-amber-500 font-bold">★ {seller.seller_rating || 5.0}</span>
                            <span>&bull;</span>
                            <span>{seller.location || 'Toshkent'}</span>
                            <span className="lg:hidden text-slate-400 dark:text-slate-500">
                              &bull; {seller.warranty || '12 oy'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <div className="font-black text-sm text-slate-900 dark:text-white font-numeric">
                        {formatPrice(seller.price)}
                      </div>
                      <div className="mt-0.5">
                        {isLowest ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                            <SolarIcon name="CheckCircle" size={11} className="text-emerald-600 dark:text-emerald-400" />
                            Benchmark (Eng arzon)
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold font-numeric">
                            +{formatPrice(diffFromMin)} (+{diffPct.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Table-Graph Graphic Bar Column - Strictly Contained & Responsive */}
                    <td className="py-3.5 px-3.5 w-48 sm:w-56 lg:w-64 max-w-[260px]">
                      <div className="space-y-1.5 max-w-[240px]">
                        <div className="flex items-center justify-between text-[11px] font-numeric">
                          <span className="text-slate-400 dark:text-slate-500">Nisbiy narx:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300 text-[10px] sm:text-[11px]">
                            {isSingleSeller 
                              ? "100% (Yagona taklif)" 
                              : isLowest 
                                ? "100% (Eng qulay)" 
                                : `+${diffPct.toFixed(0)}% farq`}
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-[#1E293B] rounded-full overflow-hidden flex relative">
                          <div 
                            style={{ width: `${isSingleSeller ? 100 : barWidth}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLowest || isSingleSeller
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                                : seller.price <= avgSellerPrice 
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-400' 
                                  : 'bg-gradient-to-r from-rose-500 to-amber-500'
                            }`}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3.5 text-xs text-slate-600 dark:text-slate-400 hidden lg:table-cell whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{seller.warranty || '12 oy'}</div>
                      <div className="text-[11px] text-slate-400">{seller.delivery || '1 kunda'}</div>
                    </td>

                    <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {!seller.is_current && (
                          <button
                            onClick={() => navigate(`/product/${seller.product_slug || seller.slug || seller.product_id}`)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
                          >
                            O'tish
                          </button>
                        )}
                        <button
                          onClick={() => handleAddToCompare(seller.product_id)}
                          className="px-2.5 py-1 bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-600 text-orange-700 dark:text-orange-300 hover:text-white border border-orange-200 dark:border-orange-800 text-xs font-semibold rounded-lg transition cursor-pointer"
                        >
                          Taqqos
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: High-Performance Seller Cards */}
        <div className="block md:hidden space-y-3">
          {allSellersSorted.map((seller, idx) => {
            const isLowest = seller.price === minSellerPrice;
            const diffFromMin = seller.price - minSellerPrice;
            const diffPct = minSellerPrice > 0 ? (diffFromMin / minSellerPrice) * 100 : 0;
            const barWidth = maxSellerPrice > 0 
              ? Math.max(15, Math.min(100, Math.round((seller.price / maxSellerPrice) * 100))) 
              : 50;

            return (
              <div 
                key={seller.product_id || idx}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-3 ${
                  seller.is_current 
                    ? 'bg-orange-50/40 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800 ring-1 ring-orange-200 dark:ring-orange-900/50' 
                    : 'bg-slate-50/60 dark:bg-[#151D2C] border-slate-200/90 dark:border-slate-800 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center font-numeric shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{seller.seller_name}</span>
                        {seller.is_current && (
                          <span className="px-1.5 py-0.2 bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 rounded text-[9px] font-bold shrink-0">
                            Ko'rilmoqda
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {seller.location || 'Toshkent'} &bull; <span className="text-amber-500 font-bold">★ {seller.seller_rating || 5.0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-black text-sm text-slate-900 dark:text-white font-numeric">
                      {formatPrice(seller.price)}
                    </div>
                    {isLowest ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        Eng arzon
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 font-numeric">
                        +{formatPrice(diffFromMin)} (+{diffPct.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Mobile Visual Bar */}
                <div className="space-y-1 bg-white/70 dark:bg-[#0E1524] p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center justify-between text-[10px] font-numeric text-slate-500 dark:text-slate-400">
                    <span>Nisbiy narx:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {isSingleSeller 
                        ? "100% (Yagona taklif)" 
                        : isLowest 
                          ? "100% (Eng qulay)" 
                          : `+${diffPct.toFixed(0)}% farq`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200/80 dark:bg-[#1E293B] rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${isSingleSeller ? 100 : barWidth}%` }}
                      className={`h-full rounded-full ${
                        isLowest || isSingleSeller
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                          : seller.price <= avgSellerPrice 
                            ? 'bg-gradient-to-r from-orange-500 to-amber-400' 
                            : 'bg-gradient-to-r from-rose-500 to-amber-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] truncate max-w-[180px]">
                    {seller.warranty || '12 oy'} &bull; {seller.delivery || 'Yetkazish'}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!seller.is_current && (
                      <button
                        onClick={() => navigate(`/product/${seller.product_slug || seller.slug || seller.product_id}`)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg"
                      >
                        O'tish
                      </button>
                    )}
                    <button
                      onClick={() => handleAddToCompare(seller.product_id)}
                      className="px-2.5 py-1 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-bold rounded-lg"
                    >
                      Taqqoslash
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. HISTORICAL PRICE TREND CHART */}
      <div className="w-full bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <SolarIcon name="History" size={20} className="text-orange-600" />
              <span>Narxlar Dinamikasi va O'zgarishlar Grafigi</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Bozordagi haqiqiy narx o'zgarishlari xronologiyasi
            </p>
          </div>
          <Badge status="ACTIVE" text="Real Vaqt Kuzatuv" size="xs" />
        </div>
        <PriceChart data={price_history} height={320} />
      </div>

      {/* 7. DETAILED SPECIFICATIONS MATRIX */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
            <SolarIcon name="Document" size={20} className="text-orange-600" />
            <span>To'liq Texnik Tavsiflar va Parametrlar</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
            {Object.entries(product.specifications).map(([key, val]) => (
              <div key={key} className="flex justify-between py-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">{key}</span>
                <span className="text-slate-900 font-bold text-right">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. MARKET ALTERNATIVES & RECOMMENDED PRODUCTS (TAVSIYA ETILADIGAN MAHSULOTLAR) */}
      {recommendations && recommendations.length > 0 && (
        <section className="w-full bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <SolarIcon name="Sparkles" size={20} className="text-orange-600" />
                <span>Bozordagi muqobil va tavsiya etiladigan mahsulotlar</span>
                <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-bold rounded-full">
                  {recommendations.length} ta
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ushbu toifadagi boshqa mustaqil takliflar bilan narx va sifat mutanosibligini solishtiring
              </p>
            </div>

            {product?.category_name && (
              <button
                type="button"
                onClick={() => navigate(`/search?category=${encodeURIComponent(product.category_name)}`)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Toifa bo'yicha barchasi</span>
                <SolarIcon name="ArrowRight" size={13} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {recommendations.slice(0, 10).map((item) => {
              const itemImg = item.images?.find(i => i.is_primary)?.image_url || item.images?.[0]?.image_url || item.image_url;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    navigate(`/product/${item.slug || item.id}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group bg-slate-50/50 hover:bg-white border border-slate-200/80 hover:border-orange-300 rounded-2xl p-3 sm:p-4 flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-sm cursor-pointer relative"
                >
                  <div>
                    <div className="w-full aspect-square bg-white rounded-xl border border-slate-100 p-2.5 flex items-center justify-center overflow-hidden mb-3 relative group-hover:scale-[1.02] transition-transform">
                      {itemImg ? (
                        <img
                          src={itemImg}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <SolarIcon name="Box" size={32} className="text-slate-300" />
                      )}
                      {item.condition && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-slate-900/70 text-white text-[9px] font-bold rounded uppercase">
                          {item.condition === 'NEW' ? 'Yangi' : item.condition}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug">
                      {item.name}
                    </h3>
                    <div className="text-[11px] text-slate-400 mt-1 truncate">
                      {item.seller_name || item.brand_name || "Rasmiy do'kon"}
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="font-numeric">
                      <span className="text-xs sm:text-sm font-extrabold text-orange-600">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCompare(item.id);
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-orange-600 text-slate-700 hover:text-white font-bold text-[10px] rounded-lg transition-colors"
                      title="Taqqoslashga qo'shish"
                    >
                      Taqqoslash
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 9. PRICE ALERT MODAL */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <SolarIcon name="Bell" size={18} className="text-orange-600" />
                <span>Narx tushganda ogohlantirish</span>
              </h3>
              <button
                onClick={() => setShowAlertModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <SolarIcon name="CloseCircle" size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Mahsulot narxi siz ko'rsatgan summadan pastga tushganda, tizim avtomatik ravishda bildirishnoma yuboradi.
            </p>

            {alertSuccess ? (
              <div className="py-4 text-center text-emerald-600 text-sm font-bold flex items-center justify-center gap-2">
                <SolarIcon name="CheckCircle" size={20} />
                <span>Ogohlantirish muvaffaqiyatli saqlandi!</span>
              </div>
            ) : (
              <form onSubmit={handleCreateAlert} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kutilayotgan maqsad narxi (so'm)
                  </label>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 rounded-xl text-sm font-numeric outline-none"
                    placeholder="Masalan: 7500000"
                  />
                  <div className="text-[11px] text-slate-400 mt-1">
                    Joriy narx: {formatPrice(product.price)}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAlertModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                  >
                    Ogohlantirishni yoqish
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 10. MOBILE FLOATING ACTION BAR (NATIVE APP EXPERIENCE) */}
      <div className="fixed bottom-14 left-0 right-0 z-30 md:hidden bg-white/95 dark:bg-[#0E131F]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between shadow-lg shadow-black/5">
        <div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {allSellersSorted.length > 1 ? "Eng arzon narx:" : "Narx:"}
          </div>
          <div className="text-base font-black text-slate-900 dark:text-white font-numeric">
            {formatPrice(minSellerPrice)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddToCompare()}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer"
            title="Taqqoslashga qo'shish"
          >
            <SolarIcon name="Compare" size={16} />
          </button>

          <button
            onClick={() => setShowAlertModal(true)}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer"
            title="Narx tushganda ogohlantirish"
          >
            <SolarIcon name="Bell" size={16} />
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('sellers-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-orange-600/25 flex items-center gap-1 cursor-pointer"
          >
            <SolarIcon name="Shop" size={15} />
            <span>Do'konlar ({allSellersSorted.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
