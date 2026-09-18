import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../api/services';
import { formatPrice } from '../../utils/formatters';
import SolarIcon from '../../components/common/SolarIcon';
import Badge from '../../components/common/Badge';
import { MetricSkeleton } from '../../components/common/Skeleton';

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        // Strictly fetch real database aggregations
        const data = await adminService.getMetrics();
        setMetrics(data);
      } catch (err) {
        console.error("Failed to load admin metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-24 md:pb-8">
      {/* Terminal Title & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Administrator Terminali
            </h1>
            <span className="text-[10px] font-mono bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-2 py-0.5 rounded-full font-bold">
              ROOT ACCESS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Faqat haqiqiy PostgreSQL ma'lumotlar bazasi ko'rsatkichlari (Zero Fake Data)
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => navigate('/admin/sellers')}
            className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <SolarIcon name="Store" size={15} className="text-slate-500 dark:text-slate-400" />
            <span>Sotuvchilar</span>
          </button>
          <button
            onClick={() => navigate('/admin/products')}
            className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-orange-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <SolarIcon name="Box" size={15} />
            <span>Moderatsiya</span>
          </button>
        </div>
      </div>

      {/* Real Database Metrics 10-Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <MetricSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Total Users */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-orange-300 dark:hover:border-orange-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Foydalanuvchilar</span>
              <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <SolarIcon name="Users" size={17} />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-numeric">
                {metrics?.total_users ?? 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">Jami ro'yxatdan o'tganlar</div>
            </div>
          </div>

          {/* Total Sellers */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-orange-300 dark:hover:border-orange-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sotuvchilar</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <SolarIcon name="Store" size={17} />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-numeric">
                {metrics?.total_sellers ?? 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">Rasmiy do'konlar bazasi</div>
            </div>
          </div>

          {/* Pending Sellers */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-amber-400 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kutilayotgan do'kon</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <SolarIcon name="Clock" size={17} />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-numeric">
                {metrics?.pending_sellers ?? 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">Tasdiqlanishi kerak</div>
            </div>
          </div>

          {/* Total Products */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-orange-300 dark:hover:border-orange-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jami Mahsulotlar</span>
              <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <SolarIcon name="Box" size={17} />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-numeric">
                {metrics?.total_products ?? 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">Barcha statusdagi takliflar</div>
            </div>
          </div>

          {/* Active Products */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-emerald-400 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Faol Mahsulotlar</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <SolarIcon name="CheckCircle" size={17} />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-numeric">
                {metrics?.active_products ?? 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">Katalogda ko'rinayotganlar</div>
            </div>
          </div>

          {/* Pending Products */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-amber-400 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Moderatsiya</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <SolarIcon name="Clock" size={17} />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-numeric">
                {metrics?.pending_products ?? 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">Moderatsiya navbatida</div>
            </div>
          </div>

          {/* Total Searches */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-orange-300 dark:hover:border-orange-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Qidiruvlar Jami</span>
              <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <SolarIcon name="Search" size={17} />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-numeric">
                {metrics?.total_searches ?? 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">Real qidiruv jurnali</div>
            </div>
          </div>

          {/* Total Buyers */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-orange-300 dark:hover:border-orange-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Xaridorlar</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <SolarIcon name="User" size={17} />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-numeric">
                {metrics?.total_buyers ?? 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">Aktiv xaridor hisoblari</div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-emerald-400 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jami Tushum</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <SolarIcon name="Wallet" size={17} />
              </div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-numeric truncate">
                {formatPrice(metrics?.total_revenue ?? 0)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">Haqiqiy to'lovlar summasi</div>
            </div>
          </div>

          {/* Active Subscriptions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-orange-300 dark:hover:border-orange-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Obunalar</span>
              <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <SolarIcon name="Shield" size={17} />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-numeric">
                {metrics?.active_subscriptions ?? 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">Faol tarif rejalari</div>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Attention Alerts */}
      {((metrics?.pending_sellers ?? 0) > 0 || (metrics?.pending_products ?? 0) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(metrics?.pending_sellers ?? 0) > 0 && (
            <div className="p-4 sm:p-5 bg-amber-50/90 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <SolarIcon name="Store" size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                    {metrics.pending_sellers} ta sotuvchi tasdiqlash kutilmoqda
                  </h4>
                  <p className="text-[11px] text-amber-700">
                    Yangi ro'yxatdan o'tgan do'konlar moderatsiyasi
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/sellers')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              >
                Tasdiqlash &rarr;
              </button>
            </div>
          )}

          {(metrics?.pending_products ?? 0) > 0 && (
            <div className="p-4 sm:p-5 bg-orange-50/90 border border-orange-300 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                  <SolarIcon name="Box" size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-orange-900">
                    {metrics.pending_products} ta mahsulot moderatsiya kutilmoqda
                  </h4>
                  <p className="text-[11px] text-orange-700">
                    Sotuvchilar kiritgan takliflar va narxlar tekshiruvi
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin/products')}
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              >
                Tekshirish &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Admin Modules Quick Grid */}
      <div>
        <h2 className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
          Boshqaruv Modullari
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div 
            onClick={() => navigate('/admin/sellers')}
            className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <SolarIcon name="Store" size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-1 group-hover:text-orange-600 transition-colors">
                Sotuvchilar nazorati
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Do'konlarni tasdiqlash, rad etish yoki to'xtatish
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-orange-600 dark:text-orange-400">
              <span>Boshqarish</span>
              <SolarIcon name="ArrowRight" size={14} />
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/products')}
            className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <SolarIcon name="Box" size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-1 group-hover:text-orange-600 transition-colors">
                Mahsulot moderatsiyasi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Narxlar va takliflarni tasdiqlash yoki qaytarish
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-orange-600 dark:text-orange-400">
              <span>Boshqarish</span>
              <SolarIcon name="ArrowRight" size={14} />
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/data-sources')}
            className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <SolarIcon name="Database" size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-1 group-hover:text-orange-600 transition-colors">
                Ma'lumot manbalari
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Uzum, Yandex, Ozon adapterlari integratsiya holati
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-orange-600 dark:text-orange-400">
              <span>Boshqarish</span>
              <SolarIcon name="ArrowRight" size={14} />
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/audit-logs')}
            className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <SolarIcon name="Document" size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-1 group-hover:text-orange-600 transition-colors">
                Audit jurnali
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Platformadagi barcha xavfsizlik va o'zgarish qaydlari
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-orange-600 dark:text-orange-400">
              <span>Boshqarish</span>
              <SolarIcon name="ArrowRight" size={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
