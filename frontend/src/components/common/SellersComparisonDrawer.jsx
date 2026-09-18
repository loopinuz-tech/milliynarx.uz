import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../api/services';
import { formatPrice } from '../../utils/formatters';
import SolarIcon from './SolarIcon';

export const SellersComparisonDrawer = ({ productId, onClose }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [sortBy, setSortBy] = useState('price_asc'); // 'price_asc' or 'rating'
  const [filterInstant, setFilterInstant] = useState(false);

  useEffect(() => {
    if (!productId) return;
    let isMounted = true;
    setLoading(true);

    productService.getProductAllSellers(productId)
      .then(res => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to load product sellers:", err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [productId]);

  if (!productId) return null;

  let sellers = data?.sellers ? [...data.sellers] : [];
  if (filterInstant) {
    sellers = sellers.filter(s => s.delivery && (s.delivery.includes('soat') || s.delivery.includes('1 kunda')));
  }
  if (sortBy === 'price_asc') {
    sellers.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'rating') {
    sellers.sort((a, b) => b.seller_rating - a.seller_rating);
  }

  const minPrice = data?.min_price || 0;
  const avgPrice = data?.avg_price || 0;
  const savingsPerUnit = avgPrice > minPrice ? avgPrice - minPrice : 0;
  const totalSavings = savingsPerUnit * quantity;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#0B0F19] h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200/90 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-orange-50/30 dark:from-[#111827] dark:to-[#171D2D] sticky top-0 z-10">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-orange-600/25">
                <SolarIcon name="Shop" size={18} />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Barcha Do'konlar Takliflari ({data?.total_sellers || sellers.length} ta sotuvchi)
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {data?.product_name || "Mahsulot narxlari solishtirmasi"}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <SolarIcon name="CloseCircle" size={22} />
            </button>
          </div>

          {/* Quick Filter & Sort bar (Image 3 style) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={filterInstant}
                  onChange={(e) => setFilterInstant(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 dark:bg-[#1E293B] dark:border-slate-700"
                />
                <span>Tezkor yetkazish</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 dark:text-slate-400">Saralash:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="price_asc">Eng arzon narxdan</option>
                <option value="rating">Reytingi yuqoridan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 flex-1">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : sellers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
              Ushbu filtrlar bo'yicha takliflar topilmadi.
            </div>
          ) : (
            <div className="space-y-3">
              {sellers.map((s, idx) => (
                <div
                  key={s.seller_id || idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    s.is_lowest
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 ring-1 ring-emerald-500/20 dark:ring-emerald-500/30 shadow-2xs'
                      : 'bg-white dark:bg-[#111827] border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {/* Seller Profile */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-extrabold text-sm shrink-0">
                        {s.seller_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{s.seller_name}</span>
                          <span className="text-emerald-500 dark:text-emerald-400" title="Tasdiqlangan sotuvchi">
                            <SolarIcon name="CheckCircle" size={14} />
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-numeric">★ {s.seller_rating}</span>
                          <span>&bull;</span>
                          <span>{s.seller_city}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price and Spread Badge */}
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-numeric">
                        {formatPrice(s.price)}
                      </div>
                      {s.is_lowest ? (
                        <span className="inline-block text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md mt-0.5 border border-emerald-200 dark:border-emerald-700/50">
                          Eng arzon taklif (Benchmark)
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] text-rose-600 dark:text-rose-400 font-semibold font-numeric mt-0.5">
                          +{formatPrice(s.diff_from_min)} (+{s.diff_percent}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Conditions & Details */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>Kafolat: <strong className="text-slate-800 dark:text-slate-200">{s.warranty}</strong></span>
                      <span>&bull;</span>
                      <span>Yetkazish: <strong className="text-slate-800 dark:text-slate-200">{s.delivery}</strong></span>
                      <span>&bull;</span>
                      <span>Omborda: <strong className="text-slate-800 dark:text-slate-200">{s.stock} ta</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onClose();
                          navigate(`/product/${s.product_slug || s.slug || s.product_id}`);
                        }}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-orange-600 dark:hover:bg-orange-600 text-slate-700 dark:text-slate-200 hover:text-white dark:hover:text-white rounded-lg font-bold text-xs transition cursor-pointer"
                      >
                        Batafsil tahlil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Procurement & Savings Calculator (B2B Feature) */}
        <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D1424] sticky bottom-0 z-10 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">Xarid miqdori (dona / partiya):</span>
            <div className="flex items-center gap-2 bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
              >
                -
              </button>
              <span className="w-10 text-center font-bold font-numeric text-slate-900 dark:text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-600 dark:text-slate-300 block">Eng arzon taklif bo'yicha jami:</span>
              <strong className="text-emerald-800 dark:text-emerald-400 font-black text-sm font-numeric">
                {formatPrice(minPrice * quantity)}
              </strong>
            </div>
            {totalSavings > 0 && (
              <div className="text-right">
                <span className="text-emerald-600 dark:text-emerald-400 block text-[11px]">Bozor o'rtachasiga nisbatan tejamkorlik:</span>
                <strong className="text-emerald-700 dark:text-emerald-300 font-black font-numeric">
                  +{formatPrice(totalSavings)}
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellersComparisonDrawer;
