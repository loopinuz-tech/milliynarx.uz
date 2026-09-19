import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, favoriteService, alertService, aiService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice, formatDate, formatPercent } from '../../utils/formatters';
import SolarIcon from '../../components/common/SolarIcon';
import Badge from '../../components/common/Badge';
import PriceChart from '../../components/charts/PriceChart';
import Skeleton from '../../components/common/Skeleton';
import ProductImg from '../../components/common/ProductImg';

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

const SPEC_KEY_LABELS = {
  unit: "O'lchov birligi",
  source: "Ma'lumot manbai",
  last_period: "Oxirgi davr",
  direction: "Narx yo'nalishi",
  change_percent: "O'zgarish foizi",
  brand: "Brend",
  model: "Model",
  color: "Rangi",
  weight: "Og'irligi",
  size: "O'lchami",
  material: "Materiali",
  warranty: "Kafolat",
  country: "Ishlab chiqaruvchi mamlakat",
  power: "Quvvati",
  voltage: "Kuchlanish",
  capacity: "Sig'imi",
  frequency: "Chastota",
};


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

  // Historical + Current market price bounds (Min, Avg, Max)
  const historyPrices = price_history && price_history.length > 0 ? price_history.map(p => p.price) : [product.price];
  const marketMinPrice = Math.min(minSellerPrice, ...historyPrices);
  const marketMaxPrice = Math.max(maxSellerPrice, ...historyPrices);
  const marketAvgPrice = allSellersSorted.length > 1 
    ? Math.round(avgSellerPrice) 
    : Math.round(historyPrices.reduce((sum, p) => sum + p, 0) / historyPrices.length);

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
      {/* 1. TOP BREADCRUMB & ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-2 truncate">
          <span onClick={() => navigate('/')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer font-medium">Bosh sahifa</span>
          <span>/</span>
          <span onClick={() => navigate('/search')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer font-medium">Bozor Tahlili</span>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-200 font-bold truncate max-w-sm">{product.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddToCompare()}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <SolarIcon name="Compare" size={15} />
            <span>Taqqoslash</span>
          </button>
          <button
            onClick={handleToggleFavorite}
            className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer ${
              isFavorited 
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            <SolarIcon name="Heart" size={15} />
            <span>{isFavorited ? 'Saqlangan' : 'Saqlash'}</span>
          </button>
        </div>
      </div>

      {/* 2. THREE CORE MARKET PRICES (ENG KAM, O'RTACHA, ENG YUQORI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Eng kam narx */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Eng kam narx
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-numeric tracking-tight">
            {formatPrice(marketMinPrice)}
          </div>
        </div>

        {/* Metric 2: O'rtacha narx */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            O'rtacha narx
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-numeric tracking-tight">
            {formatPrice(marketAvgPrice)}
          </div>
        </div>

        {/* Metric 3: Eng yuqori narx */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Eng yuqori narx
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-numeric tracking-tight">
            {formatPrice(marketMaxPrice)}
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN PRODUCT CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs transition-colors">
        
        {/* Left Column (5 cols): Product Visual Gallery */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <div className="w-full h-72 sm:h-80 bg-slate-50/70 dark:bg-[#0E1524] rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200/80 dark:border-slate-800 relative group">
            <ProductImg
              src={images?.[selectedImg]?.image_url || images?.[0]?.image_url}
              alt={product.name}
              categoryName={product.category_name}
              className="max-h-full max-w-full object-contain p-6 group-hover:scale-105 transition-transform duration-200"
              iconSize={48}
              iconContainerClass="w-24 h-24"
            />
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
                  <ProductImg src={img.image_url} alt="" categoryName={product.category_name} className="w-full h-full object-contain" iconSize={16} iconContainerClass="w-10 h-10" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (7 cols): Clean Product Info & Pricing */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header Identity */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Price & Seller Information Table */}
            <div className="space-y-3">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-numeric tracking-tight">
                {formatPrice(product.price)}
              </div>

              {/* Specifications / Merchant Table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-[#111827]">
                <table className="w-full text-xs text-left border-collapse">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-[#151D2C] w-28 sm:w-32">
                        Sotuvchi
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900 dark:text-white">
                        {product.seller_name || "Rasmiy Diler"}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-[#151D2C]">
                        Joylashuv
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {product.location || "Toshkent viloyati"}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-[#151D2C]">
                        Yetkazish
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {product.delivery || '1 kunda yetkazib berish'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 font-medium text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-[#151D2C]">
                        Kafolat
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {product.warranty || '12 oy rasmiy kafolat'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Concise 1-Line Codexa AI Summary */}
            <div id="ai-section" className="p-3.5 bg-orange-50/40 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs transition-colors">
              <div className="flex items-center gap-2">
                <img src="/aiimg.png" alt="AI" className="w-4 h-4 object-contain shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {cleanAiSummary(aiResult?.analysis_text) || "Codexa AI: Mahsulot narxi barqaror muvozanatda turibdi, xarid uchun maqbul."}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAskAiAboutProduct}
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1 ml-auto cursor-pointer"
              >
                <span>AI bilan suhbat</span>
                <SolarIcon name="ArrowRight" size={12} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAlertModal(true)}
              className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
            >
              <SolarIcon name="Bell" size={16} />
              <span>Narx monitoringi</span>
            </button>

            <button
              onClick={handleAskAiAboutProduct}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <img src="/aiimg.png" alt="AI" className="w-4 h-4 object-contain rounded-full" />
              <span>AI Maslahatchi</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('sellers-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
            >
              <SolarIcon name="Shop" size={16} />
              <span>Barcha do'konlar ({allSellersSorted.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. HISTORICAL PRICE TREND CHART */}
      <PriceChart data={price_history} height={360} />

      {/* 5. SELLER OFFERS */}
      <div id="sellers-section" className="w-full bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-2 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <SolarIcon name="Shop" size={18} className="text-orange-600 shrink-0" />
            <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              Sotuvchilar takliflari
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/60">
              {allSellersSorted.length}
            </span>
          </div>

          {!isSingleSeller && (
            <div className="text-xs font-numeric text-slate-500 dark:text-slate-400">
              Eng arzon: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatPrice(minSellerPrice)}</strong>
            </div>
          )}
        </div>

        {/* Unified Clean Sellers List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {allSellersSorted.map((seller, idx) => {
            const isLowest = seller.price === minSellerPrice;
            const diffFromMin = seller.price - minSellerPrice;
            const diffPct = minSellerPrice > 0 ? (diffFromMin / minSellerPrice) * 100 : 0;

            return (
              <div
                key={seller.product_id || idx}
                className={`flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 py-3.5 px-3 rounded-2xl transition-colors ${
                  seller.is_current 
                    ? 'bg-orange-50/40 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-800/50' 
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* 1. Store info */}
                <div className="flex items-center gap-3 min-w-0 md:w-5/12">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/60 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                    {seller.seller_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {seller.seller_name}
                      </span>
                      {seller.is_current && (
                        <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 rounded text-[10px] font-bold shrink-0">
                          Ko'rilmoqda
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded text-[11px]">
                        ★ {seller.seller_rating || 5.0}
                      </span>
                      <span>&bull;</span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {seller.location || 'Toshkent shahri'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Kafolat va Yetkazish shartlari (Dedicated clean block) */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 pl-13 md:pl-0 md:w-4/12">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60">
                    <SolarIcon name="Shield" size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{seller.warranty || '12 oy rasmiy kafolat'}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60">
                    <SolarIcon name="Clock" size={13} className="text-slate-500 dark:text-slate-400 shrink-0" />
                    <span>{seller.delivery || '1 kunda yetkazib berish'}</span>
                  </div>
                </div>

                {/* 3. Price & Action */}
                <div className="flex items-center justify-between md:justify-end gap-3.5 shrink-0 pl-13 md:pl-0 md:w-3/12">
                  <div className="text-left md:text-right">
                    <div className="font-black text-base text-slate-900 dark:text-white font-numeric">
                      {formatPrice(seller.price)}
                    </div>
                    {!isSingleSeller && (
                      <div className="text-[11px]">
                        {isLowest ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Eng arzon taklif
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold font-numeric">
                            +{formatPrice(diffFromMin)} (+{diffPct.toFixed(0)}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!seller.is_current && (
                      <button
                        onClick={() => navigate(`/product/${seller.product_slug || seller.slug || seller.product_id}`)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
                      >
                        O'tish
                      </button>
                    )}
                    <button
                      onClick={() => handleAddToCompare(seller.product_id)}
                      className="px-3 py-1.5 bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-600 text-orange-700 dark:text-orange-300 hover:text-white border border-orange-200 dark:border-orange-800 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <SolarIcon name="Scale" size={13} />
                      <span>Taqqos</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. DETAILED SPECIFICATIONS MATRIX */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
            <SolarIcon name="Document" size={20} className="text-orange-600" />
            <span>To'liq Texnik Tavsiflar va Parametrlar</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
            {Object.entries(product.specifications).map(([key, val]) => (
              <div key={key} className="flex justify-between py-2.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">{SPEC_KEY_LABELS[key] || key}</span>
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
                      <ProductImg
                        src={itemImg}
                        alt={item.name}
                        categoryName={item.category_name}
                        className="w-full h-full object-contain"
                        iconSize={28}
                        iconContainerClass="w-14 h-14"
                      />
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
