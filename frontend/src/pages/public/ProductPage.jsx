import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService, favoriteService, alertService, aiService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice, formatDate, formatPercent } from '../../utils/formatters';
import SolarIcon from '../../components/common/SolarIcon';
import Badge from '../../components/common/Badge';
import PriceChart from '../../components/charts/PriceChart';
import Skeleton from '../../components/common/Skeleton';

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

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-8">
      {/* 1. TOP BREADCRUMB & PLATFORM IDENTITY ROW */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2 truncate">
          <span onClick={() => navigate('/')} className="hover:text-slate-900 cursor-pointer font-medium">Bosh sahifa</span>
          <span>/</span>
          <span onClick={() => navigate('/search')} className="hover:text-slate-900 cursor-pointer font-medium">Bozor Tahlili</span>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate max-w-sm">{product.name}</span>
        </div>

        {/* Hackathon #19 Market Intelligence Tag */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-xl shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Bozor-Analitika (B2B AI Platform) &bull; Codexa jamoasi</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddToCompare()}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <SolarIcon name="Compare" size={15} />
              <span>Taqqoslash</span>
            </button>
            <button
              onClick={handleToggleFavorite}
              className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs ${
                isFavorited 
                  ? 'bg-rose-50 border-rose-200 text-rose-600' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <SolarIcon name="Heart" size={15} />
              <span>{isFavorited ? 'Saqlangan' : 'Sevimlilarga'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FULL-WIDTH PRODUCT OVERVIEW & TRADING INTELLIGENCE CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
        {/* Left: Product Images Gallery (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-between">
          <div className="w-full h-80 sm:h-96 bg-slate-50/60 rounded-2xl flex items-center justify-center overflow-hidden mb-4 border border-slate-100 relative group">
            {images.length > 0 ? (
              <img
                src={images[selectedImg]?.image_url || images[0]?.image_url}
                alt={product.name}
                className="max-h-full max-w-full object-contain p-6 group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <SolarIcon name="Box" size={64} className="text-slate-300" />
            )}
            {product.condition && (
              <span className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                {product.condition === 'NEW' ? 'Yangi Mahsulot' : product.condition}
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto max-w-full pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImg(idx)}
                  className={`w-14 h-14 rounded-xl border flex items-center justify-center p-1 overflow-hidden transition-all ${selectedImg === idx ? 'border-orange-600 ring-2 ring-orange-500/20 bg-orange-50/30' : 'border-slate-200 opacity-70 hover:opacity-100 bg-white'}`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Real Market Overview & Indicators (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider bg-orange-50 border border-orange-100 px-2.5 py-0.5 rounded-md">
                {product.brand_name || 'Bozor Texnikasi'}
              </span>
              <Badge status={product.availability} size="xs" />
              <span className="text-xs text-slate-400 font-mono">
                {product.category_name}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-4 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Price Box with Market Context */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-orange-50/20 dark:from-[#151D2C] dark:to-[#1A1813] border border-slate-200 dark:border-slate-800 rounded-2xl mb-5 flex flex-wrap items-baseline justify-between gap-4 shadow-2xs transition-colors">
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Ushbu sotuvchi taklifi:</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-numeric tracking-tight">
                  {formatPrice(product.price)}
                </div>
                {product.old_price && product.old_price > product.price && (
                  <div className="text-xs text-slate-400 dark:text-slate-500 line-through font-numeric mt-0.5">
                    {formatPrice(product.old_price)}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end text-right">
                <div className="text-xs text-slate-500 dark:text-slate-400">Sotuvchi do'kon:</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1">
                  <span>{product.seller_name || "Rasmiy do'kon"}</span>
                  <span className="p-0.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded">
                    <SolarIcon name="CheckCircle" size={13} />
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-400 font-mono">
                  {product.location || 'Toshkent'} &bull; Kafolat: {product.warranty || 'Mavjud'}
                </div>
              </div>
            </div>

            {/* Core Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-6">
              <div className="p-3 bg-slate-50 dark:bg-[#151D2C] rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-400 block mb-0.5 font-medium">Model:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono truncate block">{product.model || '-'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#151D2C] rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-400 block mb-0.5 font-medium">SKU / Kod:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono truncate block">{product.sku || '-'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#151D2C] rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-400 block mb-0.5 font-medium">Joylashuv:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">{product.location || 'Toshkent'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#151D2C] rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-400 block mb-0.5 font-medium">Kafolat:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">{product.warranty || 'Mavjud emas'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#151D2C] rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-400 block mb-0.5 font-medium">Yetkazib berish:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">{product.delivery || 'Kelishiladi'}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#151D2C] rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-400 block mb-0.5 font-medium">Holati:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">{product.condition === 'NEW' ? 'Yangi' : product.condition}</span>
              </div>
            </div>
          </div>

          {/* Action Row: Price Alert & AI Advisor Consultation */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAlertModal(true)}
              className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs cursor-pointer border border-transparent dark:border-slate-700"
            >
              <SolarIcon name="Bell" size={16} />
              <span>Narx tushganda ogohlantirish</span>
            </button>

            <button
              onClick={handleAskAiAboutProduct}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <img src="/aiimg.png" alt="AI" className="w-4 h-4 object-contain rounded-full shadow-2xs" />
              <span>AI Bozor Maslahati</span>
            </button>

            <button
              onClick={() => handleAddToCompare()}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer border border-transparent dark:border-slate-700"
            >
              <SolarIcon name="Compare" size={16} />
              <span>Taqqoslashga qo'shish</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. AUTOMATIC AI MARKET ARBITRAGE & TRADING VERDICT CARD */}
      <div className="w-full bg-gradient-to-r from-orange-50/80 via-amber-50/40 to-white dark:from-[#1A140E] dark:via-[#131A28] dark:to-[#101726] border border-orange-200 dark:border-orange-900/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 relative overflow-hidden transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-200/80 dark:border-orange-900/40 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white p-1 flex items-center justify-center shadow-2xs">
              <img src="/aiimg.png" alt="AI" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  Codexa AI Bozor Tahlili va Treyderlik Xulosasi
                </span>
                <span className="text-[10px] bg-orange-600 text-white px-2 py-0.5 rounded-full font-sans font-bold">
                  Codexa
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Hackathon #19-vazifa: Real vaqt rejimida bozorlarni tahlil qiluvchi aqlli savdo-axborot tizimi
              </p>
            </div>
          </div>

          {/* AI Verdict Badge */}
          {aiLoading ? (
            <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 text-xs font-bold animate-pulse">
              AI Tahlil hisoblanmoqda...
            </span>
          ) : aiResult?.verdict === 'BUY_NOW' ? (
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <SolarIcon name="CheckCircle" size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>Eng maqbul fursat (Xarid uchun qulay)</span>
            </span>
          ) : aiResult?.verdict === 'WAIT' ? (
            <span className="px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <SolarIcon name="Clock" size={15} className="text-amber-600 dark:text-amber-400" />
              <span>Narx pasayishini kutish tavsiya etiladi</span>
            </span>
          ) : (
            <span className="px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <SolarIcon name="Shield" size={15} className="text-blue-600 dark:text-blue-400" />
              <span>Bozor muvozanatli narxi</span>
            </span>
          )}
        </div>

        {/* AI Analysis Content or Image 2 Skeleton Shimmer Loader */}
        {aiLoading ? (
          <div className="space-y-3 py-1 animate-pulse">
            <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 font-semibold mb-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              <span>Bozordagi barcha mustaqil sotuvchilar takliflari, spredlar va tarixiy narx dinamikasi hisoblanmoqda...</span>
            </div>
            {/* 2-rasmdagi skeleton chiziqlari */}
            <div className="h-3.5 bg-slate-200 dark:bg-slate-700/80 rounded-full w-full"></div>
            <div className="h-3.5 bg-slate-200 dark:bg-slate-700/80 rounded-full w-5/6"></div>
            <div className="h-3.5 bg-slate-200 dark:bg-slate-700/80 rounded-full w-3/5"></div>
            <div className="h-10 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl w-full mt-2 border border-slate-200/50 dark:border-slate-700/40"></div>
          </div>
        ) : (
          <>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              {aiResult?.analysis_text || (
                `Bozor tahlili natijalariga ko'ra, '${product.name}' mahsuloti hozirda ${formatPrice(product.price)} qiymatida taklif etilmoqda. ` +
                `Bozorda eng past taklif ${formatPrice(minSellerPrice)}, eng yuqorisi esa ${formatPrice(maxSellerPrice)} so'mni tashkil etadi. ` +
                `Tadbirkorlar va xaridorlar ushbu narx spredidan unumli foydalanishlari mumkin.`
              )}
            </p>

            {aiResult?.recommendation && (
              <div className="p-3.5 bg-white/90 dark:bg-[#141C2E] rounded-xl border border-orange-200 dark:border-orange-900/50 text-xs text-orange-950 dark:text-orange-200 font-medium flex items-center gap-2">
                <SolarIcon name="Stars" size={16} className="text-orange-600 dark:text-orange-400 shrink-0" />
                <span><strong>Tavsiya:</strong> {aiResult.recommendation}</span>
              </div>
            )}
          </>
        )}

        {/* Real Key Indicators Strip */}
        <div className="pt-3 border-t border-orange-200/60 dark:border-orange-900/40 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-700 dark:text-slate-300 font-numeric">
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <div>Bozor minimumi: <strong className="text-emerald-700 dark:text-emerald-400">{formatPrice(minSellerPrice)}</strong></div>
            <div>Bozor o'rtachasi: <strong className="text-orange-700 dark:text-orange-400">{formatPrice(avgSellerPrice)}</strong></div>
            <div>Bozor maksimumi: <strong className="text-slate-800 dark:text-slate-200">{formatPrice(maxSellerPrice)}</strong></div>
            <div>Narx spredi (Arbitraj): <strong className="text-indigo-700 dark:text-indigo-400">{formatPrice(maxSellerPrice - minSellerPrice)}</strong></div>
            <div>Sotuvchilar soni: <strong className="text-slate-900 dark:text-slate-100">{allSellersSorted.length} ta do'kon</strong></div>
          </div>

          <button
            onClick={handleAskAiAboutProduct}
            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <img src="/aiimg.png" alt="AI" className="w-3.5 h-3.5 object-contain" />
            <span>AI bilan batafsil suhbat</span>
          </button>
        </div>
      </div>

      {/* 4. MULTI-SELLER COMPARISON MATRIX & SPREAD TABLE (ALL SELLERS IN MARKET) */}
      <div id="sellers-section" className="w-full bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <SolarIcon name="Shop" size={20} className="text-orange-600" />
              <span>Bozordagi barcha sotuvchilar takliflari ({allSellersSorted.length} ta do'kon)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Haqiqiy bozor do'konlari, narxlar spredi va yetkazib berish shartlari solishtirmasi
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Tartib:</span>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-semibold">
              Eng arzon narxdan boshlab
            </span>
          </div>
        </div>

        {/* Mobile View: Native App Seller Cards */}
        <div className="block md:hidden space-y-2.5">
          {allSellersSorted.map((seller, idx) => {
            const isLowest = seller.price === minSellerPrice;
            const diffFromMin = seller.price - minSellerPrice;
            const diffPct = minSellerPrice > 0 ? (diffFromMin / minSellerPrice) * 100 : 0;

            return (
              <div
                key={seller.product_id || idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  seller.is_current 
                    ? 'bg-orange-50/40 border-orange-300 ring-1 ring-orange-200' 
                    : 'bg-white border-slate-200/90 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                      {seller.seller_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>{seller.seller_name}</span>
                        {seller.is_current && (
                          <span className="px-1.5 py-0.2 bg-orange-100 text-orange-800 rounded text-[9px] font-bold">
                            Ko'rilmoqda
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">
                        ★ {seller.seller_rating || 5.0} &bull; {seller.location || 'Toshkent'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-sm text-slate-900 font-numeric">
                      {formatPrice(seller.price)}
                    </div>
                    {isLowest ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        Eng arzon
                      </span>
                    ) : (
                      <span className="text-[9px] text-rose-600 font-semibold font-numeric">
                        +{formatPrice(diffFromMin)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span>{seller.warranty || 'Kafolat bor'}</span>
                    <span>&bull;</span>
                    <span>{seller.delivery || 'Yetkazib berish'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!seller.is_current && (
                      <button
                        onClick={() => navigate(`/product/${seller.product_slug || seller.slug || seller.product_id}`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                      >
                        O'tish
                      </button>
                    )}
                    <button
                      onClick={() => handleAddToCompare(seller.product_id)}
                      className="px-2.5 py-1 bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-200 text-xs font-semibold rounded-lg transition"
                    >
                      Taqqos
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Sellers Comparison Table */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full border-collapse text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Sotuvchi va Do'kon</th>
                <th className="p-3.5">Taklif Narxi</th>
                <th className="p-3.5">Bozor Spredi (Farq)</th>
                <th className="p-3.5">Kafolat</th>
                <th className="p-3.5">Yetkazib berish</th>
                <th className="p-3.5">Joylashuv</th>
                <th className="p-3.5 text-right">Tahlil va Taqqoslash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {allSellersSorted.map((seller, idx) => {
                const isLowest = seller.price === minSellerPrice;
                const diffFromMin = seller.price - minSellerPrice;
                const diffPct = minSellerPrice > 0 ? (diffFromMin / minSellerPrice) * 100 : 0;

                return (
                  <tr key={seller.product_id || idx} className={`hover:bg-slate-50/70 transition-colors ${seller.is_current ? 'bg-orange-50/20' : ''}`}>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                          {seller.seller_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{seller.seller_name}</span>
                            {seller.is_current && (
                              <span className="px-1.5 py-0.2 bg-orange-100 text-orange-800 rounded text-[9px] font-bold">
                                Ko'rilayotgan taklif
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-emerald-600 font-medium">
                            ★ {seller.seller_rating || 5.0} &bull; Tasdiqlangan sotuvchi
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-extrabold text-sm text-slate-900 font-numeric">
                        {formatPrice(seller.price)}
                      </div>
                    </td>

                    <td className="p-3.5">
                      {isLowest ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <SolarIcon name="CheckCircle" size={12} className="text-emerald-600" />
                          Eng arzon (Benchmark)
                        </span>
                      ) : (
                        <span className="text-[11px] text-rose-600 font-semibold font-numeric">
                          +{formatPrice(diffFromMin)} (+{diffPct.toFixed(1)}%)
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 font-medium text-slate-800">
                      {seller.warranty || 'Mavjud emas'}
                    </td>

                    <td className="p-3.5 text-slate-600">
                      {seller.delivery || 'Kelishiladi'}
                    </td>

                    <td className="p-3.5 text-slate-600">
                      {seller.location || 'Toshkent'}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!seller.is_current && (
                          <button
                            onClick={() => navigate(`/product/${seller.product_slug || seller.slug || seller.product_id}`)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                          >
                            Ko'rish
                          </button>
                        )}
                        <button
                          onClick={() => handleAddToCompare(seller.product_id)}
                          className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-200 hover:border-transparent text-xs font-semibold rounded-lg transition"
                        >
                          Taqqoslash
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. INTERACTIVE SELLER PRICE COMPARISON TABLE-GRAPH (CHART + MATRIX) */}
      <div className="w-full bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-5 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <SolarIcon name="Chart" size={20} className="text-orange-600" />
              <span>Sotuvchilar Narxlari Solishtirma Grafigi (Table-Graph)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300">
                {allSellersSorted.length} ta do'kon
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bozordagi barcha sotuvchilar takliflari, spred grafigi va narx taqsimoti tahlili
            </p>
          </div>

          {/* Benchmark indicators pill row */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-numeric">
            <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Eng arzon: {formatPrice(minSellerPrice)}</span>
            </div>
            <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 rounded-xl font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>O'rtacha: {formatPrice(avgSellerPrice)}</span>
            </div>
            {maxSellerPrice > minSellerPrice && (
              <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Maksimum: {formatPrice(maxSellerPrice)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop View: Full Table Graph */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800">
          <table className="w-full border-collapse text-left text-xs min-w-[760px]">
            <thead className="bg-slate-50/80 dark:bg-[#151D2C] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-56">Sotuvchi va Do'kon</th>
                <th className="py-3 px-4 w-40">Taklif Narxi</th>
                <th className="py-3 px-4">Taqqoslama Narx Grafigi (Visual Bar)</th>
                <th className="py-3 px-4 w-36">Kafolat & Yetkazish</th>
                <th className="py-3 px-4 w-28 text-right">Harakat</th>
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
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400 font-numeric">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                          {seller.seller_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{seller.seller_name}</span>
                            {seller.is_current && (
                              <span className="px-1.5 py-0.2 bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 rounded text-[9px] font-bold">
                                Ko'rilmoqda
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                            <span className="text-amber-500 font-bold">★ {seller.seller_rating || 5.0}</span>
                            <span>&bull;</span>
                            <span>{seller.location || 'Toshkent'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
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

                    {/* Table-Graph Graphic Bar Column */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-numeric">
                          <span className="text-slate-400">Nisbiy narx:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {barWidth}% {isLowest ? "(Eng qulay)" : `(+${diffPct.toFixed(0)}% farq)`}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-[#1E293B] rounded-full overflow-hidden flex relative">
                          <div 
                            style={{ width: `${barWidth}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLowest 
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                                : seller.price <= avgSellerPrice 
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-400' 
                                  : 'bg-gradient-to-r from-rose-500 to-amber-500'
                            }`}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{seller.warranty || '12 oy'}</div>
                      <div className="text-[11px] text-slate-400">{seller.delivery || '1 kunda'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
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

        {/* Mobile View: Table-Graph Cards */}
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
                className="p-4 bg-slate-50/50 dark:bg-[#151D2C] border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center font-numeric">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {seller.seller_name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {seller.location || 'Toshkent'} &bull; ★ {seller.seller_rating || 5.0}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-sm text-slate-900 dark:text-white font-numeric">
                      {formatPrice(seller.price)}
                    </div>
                    {isLowest ? (
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                        Eng arzon taklif
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-rose-600 dark:text-rose-400 font-numeric">
                        +{formatPrice(diffFromMin)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Mobile Graph Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-[#1E293B] rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${barWidth}%` }}
                      className={`h-full rounded-full ${
                        isLowest 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                          : 'bg-gradient-to-r from-orange-500 to-amber-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <span>{seller.warranty || 'Kafolat mavjud'} &bull; {seller.delivery || 'Yetkazish'}</span>
                  <button
                    onClick={() => handleAddToCompare(seller.product_id)}
                    className="px-2.5 py-1 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-xs font-bold rounded-lg"
                  >
                    Taqqoslash
                  </button>
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
