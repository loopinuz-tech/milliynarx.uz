import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { compareService, productService } from '../../api/services';
import { formatPrice } from '../../utils/formatters';
import SolarIcon from '../../components/common/SolarIcon';
import Badge from '../../components/common/Badge';

export const ComparePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const idsParam = searchParams.get('ids') || '';

  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(false);

  // Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Popular/recommended products for empty state
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const searchInputRef = useRef(null);

  // Show Toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Sync with URL or LocalStorage
  useEffect(() => {
    if (!idsParam) {
      const saved = JSON.parse(localStorage.getItem('milliy_narx_compare') || '[]');
      if (saved.length > 0) {
        setSearchParams({ ids: saved.join(',') });
      } else {
        setComparisonData(null);
      }
    } else {
      const ids = idsParam.split(',').filter(Boolean);
      if (ids.length > 0) {
        loadComparison(ids);
      } else {
        setComparisonData(null);
      }
    }
  }, [idsParam]);

  // Fetch initial recommended products if list is empty or has 1 product
  useEffect(() => {
    async function fetchRecommended() {
      try {
        const res = await productService.getProducts({ limit: 6 });
        if (Array.isArray(res)) {
          setRecommendedProducts(res);
        }
      } catch (e) {
        // quiet fallback
      }
    }
    fetchRecommended();
  }, []);

  async function loadComparison(ids) {
    try {
      setLoading(true);
      setError(null);
      const res = await compareService.compare(ids);
      setComparisonData(res);
    } catch (err) {
      setError(err.response?.data?.detail || "Taqqoslash ma'lumotlarini yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }

  // Handle adding product
  const handleAddProduct = (productId) => {
    const currentIds = idsParam ? idsParam.split(',').filter(Boolean) : [];
    if (currentIds.includes(productId)) {
      showToast("Ushbu mahsulot taqqoslash ro'yxatida allaqachon mavjud");
      return;
    }
    if (currentIds.length >= 5) {
      showToast("Maksimal 5 ta mahsulotni taqqoslash mumkin");
      return;
    }

    const updatedIds = [...currentIds, productId];
    localStorage.setItem('milliy_narx_compare', JSON.stringify(updatedIds));
    setSearchParams({ ids: updatedIds.join(',') });
    setIsSearchOpen(false);
    setSearchQuery('');
    showToast("Mahsulot taqqoslashga qo'shildi");
  };

  // Handle removing product
  const handleRemoveProduct = (productId) => {
    const currentIds = idsParam.split(',').filter(id => id !== productId);
    localStorage.setItem('milliy_narx_compare', JSON.stringify(currentIds));
    if (currentIds.length > 0) {
      setSearchParams({ ids: currentIds.join(',') });
    } else {
      setSearchParams({});
      setComparisonData(null);
    }
    showToast("Mahsulot taqqoslashdan olib tashlandi");
  };

  // Handle clearing all products
  const handleClearAll = () => {
    if (window.confirm("Barcha mahsulotlarni taqqoslashdan tozalashni xohlaysizmi?")) {
      localStorage.removeItem('milliy_narx_compare');
      setSearchParams({});
      setComparisonData(null);
      showToast("Taqqoslash ro'yxati tozalandi");
    }
  };

  // Share Link
  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Taqqoslash havolasi nusxalandi!");
  };

  // AI Compare Verdict
  const handleAiCompare = () => {
    if (!comparisonData || !comparisonData.products || comparisonData.products.length === 0) return;
    const prods = comparisonData.products;

    let prompt = `Quyidagi ${prods.length} ta mahsulotni har tomonlama taqqoslab, xaridor uchun eng maqbulini tanlash bo'yicha professional xulosa va solishtirma jadval taqdim eting:\n\n`;
    prods.forEach((p, idx) => {
      prompt += `${idx + 1}. **${p.name}**\n   - Narxi: ${formatPrice(p.price)}\n   - Brend/Model: ${p.brand || '-'} / ${p.model || '-'}\n   - Sotuvchi: ${p.seller_name || 'Do\'kon'}\n   - Kafolat: ${p.warranty || 'aniqlanmagan'}\n   - Holati: ${p.condition || 'Yangi'}\n`;
    });
    prompt += `\nIltimos, javobingizda:\n1. Barcha mahsulotlarning asosiy parametrlarini Markdown jadvali ko'rinishida solishtiring.\n2. Narx va sifat mutanosibligi bo'yicha qaysi biri eng arzon va qaysi biri eng kuchli ekanligini ayting.\n3. Yakuniy ekspert tavsiyasini bering.`;

    navigate(`/ai-advisor?prompt=${encodeURIComponent(prompt)}`);
  };

  // Live product search in modal
  useEffect(() => {
    if (!isSearchOpen) return;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        if (!searchQuery.trim()) {
          const res = await productService.getProducts({ limit: 8 });
          setSearchResults(Array.isArray(res) ? res : []);
        } else {
          const res = await productService.searchProducts({ q: searchQuery.trim(), limit: 8 });
          setSearchResults(Array.isArray(res) ? res : []);
        }
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, isSearchOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [isSearchOpen]);

  const products = comparisonData?.products || [];
  const specKeys = comparisonData?.specification_keys || [];
  const specsDiff = comparisonData?.specs_diff || {};
  const lowestPriceId = comparisonData?.lowest_price_id;

  // Filtered spec keys
  const visibleSpecKeys = showOnlyDiffs
    ? specKeys.filter(k => specsDiff[k] === true)
    : specKeys;

  const diffCount = specKeys.filter(k => specsDiff[k] === true).length;
  const currentIds = idsParam ? idsParam.split(',').filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-slate-50/50 py-4 sm:py-8 pb-24 md:pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <SolarIcon name="CheckCircle" size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-5 sm:space-y-6">
        {/* Top Header Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
                  <SolarIcon name="Scale" size={20} />
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Mahsulotlarni taqqoslash
                </h1>
                {products.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 font-numeric">
                    {products.length} / 5 ta
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                Bozordagi real narxlar, texnik ko'rsatkichlar va do'kon shartlarini yonma-yon solishtiring
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
              {products.length > 0 && (
                <>
                  {/* AI Advisor Compare Button */}
                  <button
                    onClick={handleAiCompare}
                    className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all"
                    title="Sun'iy intellektdan taqqoslash bo'yicha chuqur tahlil va tavsiya olish"
                  >
                    <img src="/aiimg.png" alt="AI" className="w-4 h-4 rounded-full object-cover shadow-2xs" />
                    <span>AI Maslahat olish</span>
                  </button>

                  {/* Share Link */}
                  <button
                    onClick={handleShareLink}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition"
                    title="Havolani nusxalash"
                  >
                    <SolarIcon name="Document" size={16} />
                    <span>Ulashish</span>
                  </button>

                  {/* Clear All */}
                  <button
                    onClick={handleClearAll}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-xl transition"
                    title="Taqqoslashni tozalash"
                  >
                    <SolarIcon name="CloseCircle" size={16} />
                    <span>Tozalash</span>
                  </button>
                </>
              )}

              {/* Add Product Button */}
              {products.length < 5 && (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  <SolarIcon name="AddCircle" size={16} />
                  <span>Mahsulot qo'shish</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Toolbar (when 2+ products) */}
          {products.length >= 2 && (
            <div className="mt-4 sm:mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <span className="text-slate-500 font-medium text-[11px] sm:text-xs">Ko'rsatish:</span>
                <button
                  onClick={() => setShowOnlyDiffs(false)}
                  className={`flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg font-medium text-[11px] sm:text-xs transition ${
                    !showOnlyDiffs
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Barchasi ({specKeys.length})
                </button>
                <button
                  onClick={() => setShowOnlyDiffs(true)}
                  className={`flex-1 sm:flex-none text-center flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-[11px] sm:text-xs transition ${
                    showOnlyDiffs
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Faqat farqlar ({diffCount})</span>
                </button>
              </div>

              <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <SolarIcon name="ShieldCheck" size={14} className="text-emerald-500 shrink-0" />
                <span>Yashil hoshiya eng arzon narxni bildiradi</span>
              </div>
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="w-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-500 animate-pulse">
            <div className="inline-block p-3 bg-orange-50 text-orange-600 rounded-2xl mb-3">
              <SolarIcon name="Scale" size={32} />
            </div>
            <div className="font-semibold text-slate-700">Taqqoslash ma'lumotlari yuklanmoqda...</div>
            <div className="text-xs text-slate-400 mt-1">Bozordagi eng so'nggi narxlar tahlil qilinmoqda</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="w-full bg-white border border-rose-200 rounded-2xl p-8 text-center space-y-3">
            <div className="inline-block p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <SolarIcon name="CloseCircle" size={32} />
            </div>
            <div className="font-bold text-slate-900">Taqqoslashda xatolik yuz berdi</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => {
                localStorage.removeItem('milliy_narx_compare');
                setSearchParams({});
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Ro'yxatni tozalash va qayta urinish
            </button>
          </div>
        )}

        {/* EMPTY STATE: 0 Products */}
        {!loading && !error && products.length === 0 && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs">
              <div className="inline-flex p-4 bg-orange-50 text-orange-600 rounded-3xl mb-4 border border-orange-100">
                <SolarIcon name="Scale" size={40} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                Taqqoslash uchun mahsulot tanlanmagan
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
                Texnik xususiyatlar, sotuvchilar shartlari va eng past narxlarni bilish uchun kamida 2 ta mahsulot qo'shing.
              </p>

              {/* Direct Search Trigger */}
              <div className="max-w-md mx-auto flex items-center gap-2">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs sm:text-sm text-slate-400 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <SolarIcon name="Magnifier" size={18} className="text-slate-400" />
                    <span>Mahsulot nomini yozing (masalan: Lenovo, iPhone, Artel)...</span>
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-500">
                    Qidirish
                  </span>
                </button>
              </div>
            </div>

            {/* Recommended Products to Compare */}
            {recommendedProducts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Taqqoslash uchun tavsiya etiladigan mahsulotlar
                  </h3>
                  <button
                    onClick={() => navigate('/search')}
                    className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                  >
                    Barcha mahsulotlar &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  {recommendedProducts.map(p => {
                    const primaryImg = p.images?.find(img => img.is_primary)?.image_url || p.images?.[0]?.image_url;
                    return (
                      <div
                        key={p.id}
                        className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between hover:shadow-sm transition group"
                      >
                        <div>
                          <div className="h-24 sm:h-28 bg-slate-50 rounded-lg flex items-center justify-center p-2 mb-2">
                            {primaryImg ? (
                              <img src={primaryImg} alt={p.name} className="h-full max-w-full object-contain group-hover:scale-105 transition-transform" />
                            ) : (
                              <SolarIcon name="Box" size={24} className="text-slate-300" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mb-0.5">{p.brand_name || '-'}</div>
                          <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 mb-1.5" title={p.name}>
                            {p.name}
                          </h4>
                          <div className="text-xs font-bold text-slate-900 font-numeric mb-2">
                            {formatPrice(p.price)}
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddProduct(p.id)}
                          className="w-full py-1.5 bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white text-xs font-semibold rounded-lg transition border border-orange-200 hover:border-transparent flex items-center justify-center gap-1"
                        >
                          <SolarIcon name="AddCircle" size={14} />
                          <span>Taqqoslash</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1 PRODUCT SELECTED: Prompt for 2nd product */}
        {!loading && !error && products.length === 1 && (
          <div className="space-y-6">
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                  <SolarIcon name="CheckCircle" size={20} />
                </span>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-amber-900">
                    1 ta mahsulot tanlandi: {products[0].name}
                  </div>
                  <div className="text-[11px] sm:text-xs text-amber-700">
                    To'liq taqqoslash natijasini ko'rish uchun yana bitta mahsulot qo'shing.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-full sm:w-auto shrink-0 px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <SolarIcon name="AddCircle" size={16} />
                <span>2-mahsulotni tanlash</span>
              </button>
            </div>

            {/* Comparison preview grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Product 1 card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                    1-tanlangan mahsulot
                  </span>
                  <button
                    onClick={() => handleRemoveProduct(products[0].id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                    title="Olib tashlash"
                  >
                    <SolarIcon name="CloseCircle" size={18} />
                  </button>
                </div>

                <div className="h-40 bg-slate-50 rounded-xl flex items-center justify-center p-3 mb-4">
                  {products[0].image ? (
                    <img src={products[0].image} alt={products[0].name} className="h-full max-w-full object-contain" />
                  ) : (
                    <SolarIcon name="Box" size={40} className="text-slate-300" />
                  )}
                </div>

                <div className="text-xs text-slate-400 font-mono mb-1">
                  {products[0].brand || '-'} &bull; {products[0].model || '-'}
                </div>
                <h3 className="font-bold text-sm text-slate-900 line-clamp-2 mb-2">
                  {products[0].name}
                </h3>
                <div className="text-lg font-extrabold text-orange-600 font-numeric mb-4">
                  {formatPrice(products[0].price)}
                </div>

                <div className="space-y-1.5 text-xs pt-3 border-t border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Sotuvchi:</span>
                    <span className="font-medium">{products[0].seller_name || "Bozor do'koni"}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Kafolat:</span>
                    <span className="font-medium">{products[0].warranty || 'Mavjud emas'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Yetkazish:</span>
                    <span className="font-medium">{products[0].delivery || 'Kelishiladi'}</span>
                  </div>
                </div>
              </div>

              {/* Empty Slot 2 card */}
              <div
                onClick={() => setIsSearchOpen(true)}
                className="bg-white border-2 border-dashed border-orange-200 hover:border-orange-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition group min-h-[300px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-50 group-hover:bg-orange-100 text-orange-600 flex items-center justify-center mb-3 transition">
                  <SolarIcon name="AddCircle" size={28} />
                </div>
                <div className="font-bold text-sm text-slate-900 mb-1">
                  2-mahsulotni qo'shish
                </div>
                <p className="text-xs text-slate-500 max-w-xs mb-4">
                  Yonma-yon solishtirish uchun katalogdan istalgan ikkinchi modelni tanlang
                </p>
                <span className="px-3 py-1.5 bg-orange-600 group-hover:bg-orange-700 text-white text-xs font-semibold rounded-xl shadow-2xs transition">
                  Qidirish va tanlash
                </span>
              </div>
            </div>

            {/* Quick Suggestions */}
            {recommendedProducts.length > 0 && (
              <div className="space-y-3 pt-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tezkor qo'shish uchun variantlar
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  {recommendedProducts
                    .filter(p => p.id !== products[0].id)
                    .slice(0, 6)
                    .map(p => {
                      const primaryImg = p.images?.find(img => img.is_primary)?.image_url || p.images?.[0]?.image_url;
                      return (
                        <div
                          key={p.id}
                          className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between hover:shadow-sm transition group"
                        >
                          <div>
                            <div className="h-24 bg-slate-50 rounded-lg flex items-center justify-center p-2 mb-2">
                              {primaryImg ? (
                                <img src={primaryImg} alt={p.name} className="h-full max-w-full object-contain" />
                              ) : (
                                <SolarIcon name="Box" size={20} className="text-slate-300" />
                              )}
                            </div>
                            <h4 className="text-xs font-medium text-slate-900 line-clamp-1 mb-1" title={p.name}>
                              {p.name}
                            </h4>
                            <div className="text-xs font-bold text-slate-900 font-numeric mb-2">
                              {formatPrice(p.price)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddProduct(p.id)}
                            className="w-full py-1 bg-slate-900 hover:bg-orange-600 text-white text-[11px] font-semibold rounded-lg transition"
                          >
                            + Solishtirish
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2 TO 5 PRODUCTS: FULL COMPARISON MATRIX */}
        {!loading && !error && products.length >= 2 && (
          <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            {/* Mobile swipe hint banner */}
            <div className="sm:hidden flex items-center justify-between px-3.5 py-2 bg-slate-100/90 text-[11px] text-slate-600 border-b border-slate-200">
              <span className="flex items-center gap-1.5 font-medium">
                <SolarIcon name="AltArrowLeft" size={13} className="text-orange-600 animate-pulse" />
                <span>Yonma-yon surib taqqoslang</span>
                <SolarIcon name="AltArrowRight" size={13} className="text-orange-600 animate-pulse" />
              </span>
              <span className="font-bold text-slate-500 font-numeric">{products.length} ta mahsulot</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[560px] sm:min-w-[760px]">
                <thead>
                  {/* Row: Product cards header */}
                  <tr className="border-b border-slate-200 bg-slate-50/40">
                    <th className="p-2.5 sm:p-4 w-32 sm:w-56 align-top text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                      <div>Parametrlar</div>
                      <div className="text-[10px] sm:text-[11px] font-normal text-slate-400 lowercase mt-0.5">
                        {products.length} ta mahsulot
                      </div>
                    </th>

                    {products.map(p => {
                      const isLowest = p.id === lowestPriceId;
                      return (
                        <th key={p.id} className={`p-2.5 sm:p-4 min-w-[170px] sm:min-w-[220px] max-w-[240px] sm:max-w-[280px] align-top relative ${isLowest ? 'bg-emerald-50/20' : ''}`}>
                          <div className="flex items-center justify-between mb-2">
                            {isLowest ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <SolarIcon name="CheckCircle" size={12} className="text-emerald-600" />
                                Eng arzon taklif
                              </span>
                            ) : (
                              <span />
                            )}
                            <button
                              onClick={() => handleRemoveProduct(p.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 transition"
                              title="Taqqoslashdan olib tashlash"
                            >
                              <SolarIcon name="CloseCircle" size={18} />
                            </button>
                          </div>

                          <div className="h-24 sm:h-32 bg-white rounded-xl border border-slate-200/80 flex items-center justify-center p-1.5 sm:p-2 mb-2 sm:mb-3 shadow-2xs">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="h-full max-w-full object-contain" />
                            ) : (
                              <SolarIcon name="Box" size={32} className="text-slate-300" />
                            )}
                          </div>

                          <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono mb-0.5">
                            {p.brand || '-'} &bull; {p.model || '-'}
                          </div>
                          <div
                            onClick={() => navigate(`/product/${p.slug || p.id}`)}
                            className="font-bold text-xs sm:text-sm text-slate-900 hover:text-orange-600 cursor-pointer line-clamp-2 mb-2 leading-snug"
                            title={p.name}
                          >
                            {p.name}
                          </div>

                          <button
                            onClick={() => navigate(`/product/${p.slug || p.id}`)}
                            className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] sm:text-xs font-medium rounded-lg transition text-center flex items-center justify-center gap-1"
                          >
                            <span>Batafsil ko'rish</span>
                            <SolarIcon name="ArrowRight" size={12} />
                          </button>
                        </th>
                      );
                    })}

                    {/* Add More Slot Column */}
                    {products.length < 5 && (
                      <th className="p-2.5 sm:p-4 w-36 sm:w-44 align-middle text-center bg-slate-50/20 border-l border-slate-100">
                        <button
                          onClick={() => setIsSearchOpen(true)}
                          className="w-full h-full min-h-[170px] sm:min-h-[200px] border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-slate-500 hover:text-orange-600 transition group"
                        >
                          <div className="p-2 bg-slate-100 group-hover:bg-orange-50 rounded-xl mb-2 transition">
                            <SolarIcon name="AddCircle" size={20} />
                          </div>
                          <span className="text-xs font-semibold">+ Mahsulot qo'shish</span>
                          <span className="text-[10px] text-slate-400 mt-1">5 tagacha</span>
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {/* Row: Narx */}
                  <tr className="border-b border-slate-200 bg-slate-50/10">
                    <td className="p-2.5 sm:p-4 text-[11px] sm:text-xs font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-200 w-32 sm:w-56">
                      Joriy Narx
                    </td>
                    {products.map(p => {
                      const isLowest = p.id === lowestPriceId;
                      const lowestProd = products.find(x => x.id === lowestPriceId);
                      const diffPrice = lowestProd ? p.price - lowestProd.price : 0;

                      return (
                        <td key={p.id} className={`p-2.5 sm:p-4 ${isLowest ? 'bg-emerald-50/30' : ''}`}>
                          <div className={`text-sm sm:text-lg font-extrabold font-numeric ${isLowest ? 'text-emerald-700' : 'text-slate-900'}`}>
                            {formatPrice(p.price)}
                          </div>
                          {p.old_price && (
                            <div className="text-[10px] sm:text-xs text-slate-400 line-through font-numeric mt-0.5">
                              {formatPrice(p.old_price)}
                            </div>
                          )}
                          {!isLowest && diffPrice > 0 && (
                            <div className="text-[10px] sm:text-[11px] text-rose-500 font-medium mt-1">
                              +{formatPrice(diffPrice)} qimmatroq
                            </div>
                          )}
                          {isLowest && products.length > 1 && (
                            <div className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold mt-1">
                              Eng ma'qul narx
                            </div>
                          )}
                        </td>
                      );
                    })}
                    {products.length < 5 && <td className="p-2.5 sm:p-4 bg-slate-50/10" />}
                  </tr>

                  {/* Row: Sotuvchi */}
                  <tr>
                    <td className="p-2.5 sm:p-4 text-[11px] sm:text-xs font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-200 w-32 sm:w-56">
                      Sotuvchi va Do'kon
                    </td>
                    {products.map(p => (
                      <td key={p.id} className="p-2.5 sm:p-4 text-xs">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span className="truncate">{p.seller_name || "Bozor do'koni"}</span>
                          <span className="p-0.5 bg-emerald-50 text-emerald-600 rounded shrink-0">
                            <SolarIcon name="CheckCircle" size={12} />
                          </span>
                        </div>
                        {p.seller_rating > 0 && (
                          <div className="text-[10px] sm:text-[11px] text-amber-600 font-medium mt-0.5">
                            ★ {p.seller_rating.toFixed(1)} reyting
                          </div>
                        )}
                        <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                          {p.location || 'Toshkent shahri'}
                        </div>
                      </td>
                    ))}
                    {products.length < 5 && <td className="p-2.5 sm:p-4 bg-slate-50/10" />}
                  </tr>

                  {/* Row: Mavjudlik */}
                  <tr>
                    <td className="p-2.5 sm:p-4 text-[11px] sm:text-xs font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-200 w-32 sm:w-56">
                      Mavjudlik
                    </td>
                    {products.map(p => (
                      <td key={p.id} className="p-2.5 sm:p-4">
                        <Badge status={p.availability} size="xs" />
                      </td>
                    ))}
                    {products.length < 5 && <td className="p-2.5 sm:p-4 bg-slate-50/10" />}
                  </tr>

                  {/* Row: Holati */}
                  <tr>
                    <td className="p-2.5 sm:p-4 text-[11px] sm:text-xs font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-200 w-32 sm:w-56">
                      Mahsulot holati
                    </td>
                    {products.map(p => (
                      <td key={p.id} className="p-2.5 sm:p-4 text-xs text-slate-700 font-medium">
                        {p.condition || 'Yangi'}
                      </td>
                    ))}
                    {products.length < 5 && <td className="p-2.5 sm:p-4 bg-slate-50/10" />}
                  </tr>

                  {/* Row: Kafolat */}
                  <tr>
                    <td className="p-2.5 sm:p-4 text-[11px] sm:text-xs font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-200 w-32 sm:w-56">
                      Kafolat muddati
                    </td>
                    {products.map(p => (
                      <td key={p.id} className="p-2.5 sm:p-4 text-xs font-medium text-slate-800">
                        {p.warranty || 'Mavjud emas'}
                      </td>
                    ))}
                    {products.length < 5 && <td className="p-2.5 sm:p-4 bg-slate-50/10" />}
                  </tr>

                  {/* Row: Yetkazib berish */}
                  <tr>
                    <td className="p-2.5 sm:p-4 text-[11px] sm:text-xs font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-200 w-32 sm:w-56">
                      Yetkazib berish
                    </td>
                    {products.map(p => (
                      <td key={p.id} className="p-2.5 sm:p-4 text-xs text-slate-700">
                        {p.delivery || 'Kelishiladi'}
                      </td>
                    ))}
                    {products.length < 5 && <td className="p-2.5 sm:p-4 bg-slate-50/10" />}
                  </tr>

                  {/* Section Divider: Texnik Xususiyatlar */}
                  <tr className="bg-slate-100/70 border-y border-slate-200">
                    <td
                      colSpan={products.length + (products.length < 5 ? 2 : 1)}
                      className="p-2.5 sm:p-3 text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider"
                    >
                      Texnik Xususiyatlar va Parametrlar
                    </td>
                  </tr>

                  {/* Dynamic Specifications Rows */}
                  {visibleSpecKeys.length === 0 && showOnlyDiffs && (
                    <tr>
                      <td
                        colSpan={products.length + (products.length < 5 ? 2 : 1)}
                        className="p-4 sm:p-6 text-center text-xs text-slate-500"
                      >
                        Ushbu mahsulotlarning barcha texnik parametrlari bir xil.
                      </td>
                    </tr>
                  )}

                  {visibleSpecKeys.map(specKey => {
                    const isDiff = specsDiff[specKey] === true;
                    return (
                      <tr
                        key={specKey}
                        className={`border-b border-slate-100 transition-colors ${
                          isDiff ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <td className="p-2.5 sm:p-4 text-[11px] sm:text-xs font-semibold text-slate-600 sticky left-0 bg-white z-10 border-r border-slate-200 w-32 sm:w-56">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{specKey}</span>
                            {isDiff && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800" title="Mahsulotlar orasida farq bor">
                                Farqli
                              </span>
                            )}
                          </div>
                        </td>

                        {products.map(p => {
                          const val = p.specifications?.[specKey];
                          return (
                            <td
                              key={p.id}
                              className={`p-2.5 sm:p-4 text-xs ${
                                isDiff ? 'font-semibold text-slate-900' : 'text-slate-700'
                              }`}
                            >
                              {val !== undefined && val !== null && val !== '' ? String(val) : '-'}
                            </td>
                          );
                        })}

                        {products.length < 5 && <td className="p-2.5 sm:p-4 bg-slate-50/10" />}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SEARCH MODAL TO ADD PRODUCTS */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Taqqoslashga mahsulot qo'shish
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mavjud {currentIds.length} / 5 ta mahsulot
                </p>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                <SolarIcon name="CloseCircle" size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <SolarIcon
                  name="Magnifier"
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Mahsulot nomi, brendi yoki modeli bo'yicha qidiring..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <SolarIcon name="CloseCircle" size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Search Results List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {searching ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Mahsulotlar qidirilmoqda...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Mos mahsulotlar topilmadi
                </div>
              ) : (
                searchResults.map(p => {
                  const isAlreadyAdded = currentIds.includes(p.id);
                  const primaryImg = p.images?.find(img => img.is_primary)?.image_url || p.images?.[0]?.image_url;

                  return (
                    <div
                      key={p.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-1 shrink-0">
                          {primaryImg ? (
                            <img src={primaryImg} alt={p.name} className="h-full max-w-full object-contain" />
                          ) : (
                            <SolarIcon name="Box" size={20} className="text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] text-slate-400 font-mono">
                            {p.brand_name || '-'} &bull; {p.category_name || '-'}
                          </div>
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {p.name}
                          </div>
                          <div className="text-xs font-semibold text-orange-600 font-numeric">
                            {formatPrice(p.price)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddProduct(p.id)}
                        disabled={isAlreadyAdded}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                          isAlreadyAdded
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-orange-600 hover:bg-orange-700 text-white shadow-2xs'
                        }`}
                      >
                        {isAlreadyAdded ? "Qo'shilgan" : "+ Qo'shish"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsSearchOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparePage;
