import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { sellerService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/formatters';
import SolarIcon from '../../components/common/SolarIcon';
import Badge from '../../components/common/Badge';
import { MetricSkeleton } from '../../components/common/Skeleton';
import PlanBillingModal from '../../components/common/PlanBillingModal';

export const SellerDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [planInfo, setPlanInfo] = useState(null);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchPlanInfo = async () => {
    try {
      const res = await apiClient.get('/seller/plan');
      setPlanInfo(res.data);
    } catch (e) {
      console.error("Failed to load plan info", e);
    }
  };

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        const data = await sellerService.getMetrics();
        setMetrics(data);
        await fetchPlanInfo();
      } catch (err) {
        console.error("Failed to load seller metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-8 space-y-4 sm:space-y-6 pb-24 md:pb-8">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-extrabold text-lg shadow-sm shrink-0">
              {(metrics?.store_name || user?.store_name || "D")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {metrics?.store_name || user?.store_name || "Sotuvchi Do'koni"}
                </h1>
                <span className="p-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-md shrink-0" title="Tasdiqlangan do'kon">
                  <SolarIcon name="CheckCircle" size={14} />
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Sotuvchi Boshqaruv Paneli &bull; Real vaqt tahlili
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/seller/products/new')}
            className="w-full sm:w-auto min-h-[42px] px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-orange-600/20 transition cursor-pointer"
          >
            <SolarIcon name="Plus" size={16} />
            <span>Yangi mahsulot qo'shish</span>
          </button>
        </div>

        {/* Mobile Quick Action Toolbar (App Style) */}
        <div className="grid grid-cols-4 gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 sm:hidden">
          <button
            type="button"
            onClick={() => navigate('/seller/products/new')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/50 text-orange-700 dark:text-orange-300 active:scale-95 transition"
          >
            <SolarIcon name="Plus" size={18} className="mb-1" />
            <span className="text-[10px] font-bold">+ Mahsulot</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/seller/products')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 active:scale-95 transition"
          >
            <SolarIcon name="Box" size={18} className="mb-1 text-orange-600 dark:text-orange-400" />
            <span className="text-[10px] font-semibold">Katalog</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/seller/price-history')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 active:scale-95 transition"
          >
            <SolarIcon name="Chart" size={18} className="mb-1 text-indigo-600 dark:text-indigo-400" />
            <span className="text-[10px] font-semibold">Narxlar</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/seller/store')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 active:scale-95 transition"
          >
            <SolarIcon name="Store" size={18} className="mb-1 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] font-semibold">Sozlama</span>
          </button>
        </div>
      </div>

      {/* Seller Status Notice */}
      {metrics?.seller_status === 'PENDING' && (
        <div className="p-3.5 sm:p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-start gap-3">
          <div className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
            <SolarIcon name="Warning" size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
              Do'kon holati: Tasdiqlash kutilmoqda (PENDING)
            </h4>
            <p className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-400/90 mt-0.5 leading-relaxed">
              Sizning do'koningiz tekshirilmoqda. Tasdiqlangach (APPROVED), barcha mahsulotlaringiz xaridorlar qidiruvida faol aks etadi.
            </p>
          </div>
        </div>
      )}

      {/* Real Metrics Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <MetricSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
          {/* Card 1: Total Products */}
          <div 
            onClick={() => navigate('/seller/products')}
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-2xs active:scale-[0.98] transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jami Mahsulot</span>
              <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <SolarIcon name="Box" size={16} />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-numeric">
              {metrics?.total_products ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              Katalogdagi barcha yozuvlar
            </div>
          </div>

          {/* Card 2: Active Products */}
          <div 
            onClick={() => navigate('/seller/products')}
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-2xs active:scale-[0.98] transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Faol Sotuvda</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <SolarIcon name="CheckCircle" size={16} />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-numeric">
              {metrics?.active_products ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              Xaridorlar ko'ra oladigan
            </div>
          </div>

          {/* Card 3: Pending Approvals */}
          <div 
            onClick={() => navigate('/seller/products')}
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-2xs active:scale-[0.98] transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Moderatsiya</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <SolarIcon name="Clock" size={16} />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-numeric">
              {metrics?.pending_products ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              Admin tasdig'i kutilmoqda
            </div>
          </div>

          {/* Card 4: Out of Stock */}
          <div 
            onClick={() => navigate('/seller/products')}
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-2xs active:scale-[0.98] transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tugagan</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <SolarIcon name="CloseCircle" size={16} />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-numeric">
              {metrics?.out_of_stock ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              Zaxirasi tugagan tovarlar
            </div>
          </div>

          {/* Card 5: Inventory Value */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Katalog Qiymati</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <SolarIcon name="Wallet" size={16} />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-numeric truncate">
              {formatPrice(metrics?.total_inventory_value || 0)}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              Barcha faol qoldiq qiymati
            </div>
          </div>
        </div>
      )}

      {/* Subscription Plan Quota & Limits Strip */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-50 via-amber-50/50 to-orange-50/30 dark:from-orange-950/30 dark:via-[#111827] dark:to-orange-950/20 border border-orange-200/80 dark:border-orange-800/40 rounded-2xl sm:rounded-3xl shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <SolarIcon name="Crown" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Joriy Obuna:
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                  planInfo?.current_plan === 'PRO' 
                    ? 'bg-orange-600 text-white' 
                    : planInfo?.current_plan === 'ENTERPRISE'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}>
                  {planInfo?.current_plan || 'STARTER'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                AI So'rovlar kvotasi: <strong>{planInfo?.ai_queries_used ?? 0} / {planInfo?.current_plan === 'ENTERPRISE' ? 'Cheksiz' : `${planInfo?.ai_queries_limit ?? 5} ta`}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('/onboarding')}
              className="flex-1 sm:flex-none justify-center py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <SolarIcon name="Settings" size={14} />
              <span>Onboarding</span>
            </button>
            <button
              type="button"
              onClick={() => setBillingModalOpen(true)}
              className="flex-1 sm:flex-none justify-center py-2 px-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <SolarIcon name="Stars" size={14} />
              <span>Tarifni oshirish</span>
            </button>
          </div>
        </div>

        {/* Quota Progress Bar for AI Queries */}
        <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-orange-600 h-full rounded-full transition-all duration-500"
            style={{ 
              width: planInfo?.current_plan === 'ENTERPRISE' 
                ? '100%' 
                : `${Math.min(100, Math.round(((planInfo?.ai_queries_used || 0) / (planInfo?.ai_queries_limit || 5)) * 100))}%` 
            }}
          />
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div 
          onClick={() => navigate('/seller/products')}
          className="p-4 sm:p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-orange-400 dark:hover:border-orange-500 cursor-pointer transition-all flex items-center justify-between shadow-2xs active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <SolarIcon name="Box" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Mahsulotlar katalogi</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Narxlarni o'zgartirish va boshqarish</p>
            </div>
          </div>
          <SolarIcon name="ArrowRight" size={18} className="text-slate-400 shrink-0 ml-2" />
        </div>

        <div 
          onClick={() => navigate('/seller/price-history')}
          className="p-4 sm:p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-orange-400 dark:hover:border-orange-500 cursor-pointer transition-all flex items-center justify-between shadow-2xs active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <SolarIcon name="Chart" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Narx o'zgarishlari</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Barcha o'zgarishlar tarixi va jurnali</p>
            </div>
          </div>
          <SolarIcon name="ArrowRight" size={18} className="text-slate-400 shrink-0 ml-2" />
        </div>

        <div 
          onClick={() => navigate('/seller/store')}
          className="p-4 sm:p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-orange-400 dark:hover:border-orange-500 cursor-pointer transition-all flex items-center justify-between shadow-2xs active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <SolarIcon name="Store" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Do'kon sozlamalari</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Biznes rekvizitlari va manzillar</p>
            </div>
          </div>
          <SolarIcon name="ArrowRight" size={18} className="text-slate-400 shrink-0 ml-2" />
        </div>
      </div>

      {/* Plan Billing Modal */}
      <PlanBillingModal
        isOpen={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        selectedPlan="PRO"
        onSuccess={() => {
          fetchPlanInfo();
        }}
      />
    </div>
  );
};

export default SellerDashboard;
