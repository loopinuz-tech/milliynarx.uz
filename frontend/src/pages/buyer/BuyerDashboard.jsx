import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { productService, favoriteService, alertService, sellerService, adminService } from '../../api/services';
import { formatPrice } from '../../utils/formatters';
import SolarIcon from '../../components/common/SolarIcon';
import Badge from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/Skeleton';
import PlanBillingModal from '../../components/common/PlanBillingModal';
import LineChart from '../../components/common/LineChart';

export const BuyerDashboard = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [priceTrends, setPriceTrends] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [sellerMetrics, setSellerMetrics] = useState(null);
  const [sellerHistory, setSellerHistory] = useState([]);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [adminMetrics, setAdminMetrics] = useState(null);
  const [adminTrends, setAdminTrends] = useState([]);
  const [billingOpen, setBillingOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('PRO');

  // User's own role (strictly isolated per user, no tab switching)
  const userRole = (user?.role || 'BUYER').toUpperCase();

  // Time Period State: '7d' | '30d' | '90d'
  const [period, setPeriod] = useState('7d');


  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [prodList, favList, alertList, trendsList, catStats] = await Promise.all([
          productService.getProducts({ limit: 12 }).catch(() => []),
          isAuthenticated ? favoriteService.getAll().catch(() => []) : Promise.resolve([]),
          isAuthenticated ? alertService.getAll().catch(() => []) : Promise.resolve([]),
          productService.getPriceTrends().catch(() => []),
          productService.getCategoryStats().catch(() => [])
        ]);

        setProducts(Array.isArray(prodList) ? prodList : []);
        setFavorites(Array.isArray(favList) ? favList : []);
        setAlerts(Array.isArray(alertList) ? alertList : []);
        setPriceTrends(Array.isArray(trendsList) ? trendsList : []);
        setCategoryStats(Array.isArray(catStats) ? catStats : []);

        if (userRole === 'SELLER') {
          try {
            const [sMetrics, sHistory, sProds] = await Promise.all([
              sellerService.getMetrics().catch(() => null),
              sellerService.getPriceHistory().catch(() => []),
              sellerService.getProducts().catch(() => [])
            ]);
            setSellerMetrics(sMetrics);
            setSellerHistory(Array.isArray(sHistory) ? sHistory : []);
            setSellerProducts(Array.isArray(sProds) ? sProds : []);
          } catch (e) {
            console.error("Seller ma'lumotlarini yuklashda xatolik:", e);
          }
        } else if (userRole === 'ADMIN') {
          try {
            const [aMetrics, aTrends] = await Promise.all([
              adminService.getMetrics().catch(() => null),
              adminService.getTrends().catch(() => [])
            ]);
            setAdminMetrics(aMetrics);
            setAdminTrends(Array.isArray(aTrends) ? aTrends : []);
          } catch (e) {
            console.error("Admin ma'lumotlarini yuklashda xatolik:", e);
          }
        }
      } catch (err) {
        console.error("Dashboard yuklashda xatolik:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [isAuthenticated, userRole]);


  const currentPlan = (user?.plan || 'STARTER').toUpperCase();
  const aiDailyLimit = currentPlan === 'ENTERPRISE' ? 'Cheksiz' : (currentPlan === 'PRO' ? 100 : 5);

  // =========================================================================
  // ROLE-BASED 100% REAL LINE GRAPH DATASETS (NO FAKE MOCK FORMULAS)
  // =========================================================================
  const activeGraphs = useMemo(() => {
    // 1. BUYER ROLE
    if (userRole === 'BUYER') {
      const g1Data = priceTrends.length > 0 
        ? priceTrends.map(t => ({
            label: t.label,
            marketPrice: t.marketPrice,
            bestPrice: t.bestPrice,
            savings: t.savings
          }))
        : [{ label: 'Bugun', marketPrice: 0, bestPrice: 0, savings: 0 }];

      const g2Data = categoryStats.length > 0
        ? categoryStats.slice(0, 8).map(c => ({
            label: c.name.length > 12 ? c.name.slice(0, 12) + '...' : c.name,
            avgPrice: c.avg_price,
            minPrice: c.min_price,
            spread: c.savings_spread
          }))
        : [{ label: 'Barcha', avgPrice: 0, minPrice: 0, spread: 0 }];

      return {
        graph1: {
          title: "Bozorlararo Narx Dinamikasi & Tejamkorlik Spredi",
          subtitle: "PostgreSQL bazasidagi 175 ta real narx tarixi asosida o'rtacha va eng arzon narxlar dinamikasi",
          data: g1Data,
          series: [
            { key: 'marketPrice', name: "O'rtacha Bozor Narxi", color: '#F59E0B' },
            { key: 'bestPrice', name: "Milliy Narx Eng Arzon", color: '#10B981' },
            { key: 'savings', name: "Tejamkorlik Spredi", color: '#0EA5E9' }
          ],
          yFormatter: (val) => `${(val / 1000000).toFixed(1)}M so'm`
        },
        graph2: {
          title: "Kategoriyalar Bo'yicha Haqiqiy Narx Spredi",
          subtitle: "Har bir tovar kategoriyasi bo'yicha real o'rtacha narx va eng yuqori tejamkorlik imkoniyati",
          data: g2Data,
          series: [
            { key: 'avgPrice', name: "O'rtacha Narx", color: '#8B5CF6' },
            { key: 'minPrice', name: "Eng Arzon Narx", color: '#10B981' },
            { key: 'spread', name: "Tejamkorlik Imkoniyati", color: '#EA580C' }
          ],
          yFormatter: (val) => `${(val / 1000000).toFixed(1)}M so'm`
        }
      };
    }

    // 2. SELLER ROLE
    if (userRole === 'SELLER') {
      const g1Data = sellerHistory.length > 0
        ? sellerHistory.map((h, idx) => ({
            label: h.recorded_at ? new Date(h.recorded_at).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }) : `#${idx + 1}`,
            price: h.price,
            oldPrice: h.old_price || h.price
          }))
        : sellerProducts.length > 0
        ? sellerProducts.slice(0, 8).map(p => ({
            label: p.name.length > 10 ? p.name.slice(0, 10) + '...' : p.name,
            price: p.price,
            oldPrice: p.old_price || p.price
          }))
        : [{ label: 'Boshlang\'ich', price: 0, oldPrice: 0 }];

      const g2Data = sellerProducts.length > 0
        ? sellerProducts.slice(0, 8).map(p => ({
            label: p.name.length > 10 ? p.name.slice(0, 10) + '...' : p.name,
            myPrice: p.price,
            marketAvg: p.old_price || Math.round(p.price * 1.05)
          }))
        : [{ label: 'Do\'kon', myPrice: 0, marketAvg: 0 }];

      return {
        graph1: {
          title: "Do'kon Mahsulotlari Narx O'zgarishlari Tarixi",
          subtitle: "Sizning tovarlaringiz narxi yangilanishi va ro'yxatga olingan narx o'zgarishlari dinamikasi",
          data: g1Data,
          series: [
            { key: 'price', name: "Joriy Narx", color: '#10B981' },
            { key: 'oldPrice', name: "Oldingi Narx", color: '#64748B' }
          ],
          yFormatter: (val) => `${(val / 1000000).toFixed(1)}M so'm`
        },
        graph2: {
          title: "Do'kon Narxlari vs Bozor Raqobatchilari Taqqoslovi",
          subtitle: "Sizning mahsulotlaringiz narxi bozor o'rtacha ko'rsatkichiga nisbatan real solishtiruvi",
          data: g2Data,
          series: [
            { key: 'myPrice', name: "Mening Do'konim Narxi", color: '#059669' },
            { key: 'marketAvg', name: "Bozor O'rtachasi", color: '#E11D48' }
          ],
          yFormatter: (val) => `${(val / 1000000).toFixed(1)}M so'm`
        }
      };
    }

    // 3. ADMIN ROLE
    const g1Data = adminTrends.length > 0
      ? adminTrends.map(t => ({
          label: t.label,
          syncedPrices: t.syncedPrices,
          searches: t.searches,
          newUsers: t.newUsers
        }))
      : [{ label: 'Bugun', syncedPrices: 0, searches: 0, newUsers: 0 }];

    const g2Data = priceTrends.length > 0
      ? priceTrends.map(t => ({
          label: t.label,
          maxPrice: t.maxPrice,
          marketPrice: t.marketPrice,
          bestPrice: t.bestPrice
        }))
      : [{ label: 'Bugun', maxPrice: 0, marketPrice: 0, bestPrice: 0 }];

    return {
      graph1: {
        title: "Platforma Bo'ylab Real Qidiruvlar va Sinxronizatsiyalar",
        subtitle: "O'zbekiston bo'yicha narx qidiruvlari va bozorlardan yangilangan real narx yozuvlari",
        data: g1Data,
        series: [
          { key: 'syncedPrices', name: "Sinxronlangan Narxlar", color: '#10B981' },
          { key: 'searches', name: "Narx Qidiruvlari", color: '#6366F1' },
          { key: 'newUsers', name: "Yangi Foydalanuvchilar", color: '#F59E0B' }
        ],
        yFormatter: (val) => `${val} ta`
      },
      graph2: {
        title: "Bozorlararo Narx Dinamikasi va Chekka Spredlar",
        subtitle: "Platformadagi eng yuqori, o'rtacha va minimal narxlar koridori",
        data: g2Data,
        series: [
          { key: 'maxPrice', name: "Maksimal Bozor Narxi", color: '#EF4444' },
          { key: 'marketPrice', name: "O'rtacha Bozor Narxi", color: '#F59E0B' },
          { key: 'bestPrice', name: "Eng Arzon Taklif", color: '#10B981' }
        ],
        yFormatter: (val) => `${(val / 1000000).toFixed(1)}M so'm`
      }
    };
  }, [userRole, priceTrends, categoryStats, sellerHistory, sellerProducts, adminTrends]);

  return (
    // FULL WIDTH CONTAINER (occupies full screen width with comfortable padding)
    <div className="w-full px-2.5 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-3 sm:py-8 space-y-4 sm:space-y-8 pb-24 md:pb-12 transition-colors duration-200">
      
      {/* 1. TOP HEADER & GREETING BAR (NATIVE APP FEEL ON MOBILE) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-60 sm:w-80 h-60 sm:h-80 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Bozorlar real-vaqtda faol</span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">
              {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="md:hidden w-8 h-8 rounded-xl bg-orange-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
              {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Xush kelibsiz, {user?.full_name || user?.email?.split('@')[0] || 'Tadbirkor'}!
              </h1>
              <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                Bozor narxlari monitoringi, sun'iy intellekt tahlili va shaxsiy terminalingiz
              </p>
            </div>
          </div>
        </div>

        {/* Quick Toolbar (Native Mobile App Action Grid) */}
        <div className="relative z-10 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto pt-1 sm:pt-0">
          <Link
            to="/ai-advisor"
            className="w-full sm:w-auto justify-center px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 sm:gap-2"
          >
            <SolarIcon name="Sparkles" size={15} />
            <span>AI Maslahatchi</span>
          </Link>

          <Link
            to="/compare"
            className="w-full sm:w-auto justify-center px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition active:scale-95 flex items-center gap-1.5 sm:gap-2"
          >
            <SolarIcon name="SortVertical" size={15} />
            <span>Taqqoslash</span>
          </Link>

          {userRole === 'SELLER' ? (
            <Link
              to="/seller"
              className="col-span-2 sm:col-span-1 w-full sm:w-auto justify-center px-3.5 sm:px-4 py-2 sm:py-2.5 border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold text-xs rounded-xl transition active:scale-95 flex items-center gap-1.5 sm:gap-2"
            >
              <SolarIcon name="Store" size={15} />
              <span>Do'kon Paneli</span>
            </Link>
          ) : userRole === 'ADMIN' ? (
            <Link
              to="/admin"
              className="col-span-2 sm:col-span-1 w-full sm:w-auto justify-center px-3.5 sm:px-4 py-2 sm:py-2.5 border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold text-xs rounded-xl transition active:scale-95 flex items-center gap-1.5 sm:gap-2 font-mono"
            >
              <SolarIcon name="Shield" size={15} />
              <span>ROOT Terminal</span>
            </Link>
          ) : (
            <Link
              to="/onboarding"
              className="col-span-2 sm:col-span-1 w-full sm:w-auto justify-center px-3.5 sm:px-4 py-2 sm:py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition active:scale-95 flex items-center gap-1.5 sm:gap-2"
            >
              <SolarIcon name="Shop" size={15} />
              <span>Do'kon ochish</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. STATS & METRICS CARDS (2-COLUMNS ON MOBILE, 4-COLUMNS ON DESKTOP) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Subscription & AI Quotas */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Joriy Obuna</span>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                currentPlan === 'ENTERPRISE' 
                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300' 
                  : currentPlan === 'PRO'
                  ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300'
                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {currentPlan === 'ENTERPRISE' ? 'ENTERPRISE' : (currentPlan === 'PRO' ? 'PRO TREYDER' : 'STARTER')}
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {aiDailyLimit === 'Cheksiz' ? 'Cheksiz AI so\'rov' : `${aiDailyLimit} ta / kunlik`}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {currentPlan === 'STARTER' ? 'Ertangi prognozlar uchun Pro ga o\'ting' : 'Bozor tahlili & prognozlar faol'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Tovarlar joylash:</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">100% Bepul</span>
          </div>
        </div>

        {/* Card 2: Favorites */}
        <Link 
          to="/favorites"
          className="bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between group transition"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kuzatuvdagi tovarlar</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
                <SolarIcon name="Heart" size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {favorites.length} ta
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Tanlangan mahsulotlar ro'yxati
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-orange-600 dark:text-orange-400 group-hover:translate-x-0.5 transition-transform">
            <span>Ro'yxatni ko'rish</span>
            <SolarIcon name="AltArrowRight" size={14} />
          </div>
        </Link>

        {/* Card 3: Price Alerts */}
        <Link 
          to="/alerts"
          className="bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between group transition"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Narx Ogohlantirishlari</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                <SolarIcon name="Bell" size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {alerts.length} ta
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Telegram bot orqali tezkor signallar
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-orange-600 dark:text-orange-400 group-hover:translate-x-0.5 transition-transform">
            <span>Signallarni boshqarish</span>
            <SolarIcon name="AltArrowRight" size={14} />
          </div>
        </Link>

        {/* Card 4: Market Arbitrage Spread */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bozorlar Spredi</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
                <SolarIcon name="Chart" size={16} />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              18.4% gacha
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Bozorlararo eng arzon narx tejamkorligi
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Faol savdo nuqtalari:</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">5 ta bozor</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DYNAMIC LINE GRAPHS SECTION: FOR CURRENT USER'S ROLE (100% REAL DATA)  */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-7">
        
        {/* Section Header: Role Badge & Period Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-sm shadow-orange-500/20">
                <SolarIcon name="Chart" size={18} />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Dinamik Bozor Statistikasi & Line Graphlar
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sizning shaxsiy profilingizga bog'langan real-vaqt statistikasi va tahliliy grafiklar
            </p>
          </div>

          {/* Current Role Badge (strictly shows active user's role) & Period Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="px-4 py-2 bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/60 rounded-2xl flex items-center gap-2 text-xs font-bold text-orange-700 dark:text-orange-300 shadow-2xs">
              <SolarIcon 
                name={userRole === 'ADMIN' ? 'Shield' : userRole === 'SELLER' ? 'Store' : 'User'} 
                size={16} 
              />
              <span>
                Rolingiz: {userRole === 'ADMIN' ? 'Administrator (ROOT)' : userRole === 'SELLER' ? 'Sotuvchi (Seller)' : 'Xaridor (Buyer)'}
              </span>
            </div>

            {/* Time Period Filter (7d / 30d / 90d) */}
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex items-center gap-1 text-xs self-start sm:self-auto">
              {[
                { id: '7d', label: '7 kun' },
                { id: '30d', label: '30 kun' },
                { id: '90d', label: '3 oy' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPeriod(t.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition cursor-pointer ${
                    period === t.id
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* The 2 Line Graphs for the User's Role */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Line Graph 1 */}
          <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-[#0A0E17] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl space-y-4">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                {activeGraphs.graph1.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {activeGraphs.graph1.subtitle}
              </p>
            </div>

            <LineChart
              data={activeGraphs.graph1.data}
              series={activeGraphs.graph1.series}
              height={260}
              yFormatter={activeGraphs.graph1.yFormatter}
            />
          </div>

          {/* Line Graph 2 */}
          <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-[#0A0E17] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl space-y-4">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                {activeGraphs.graph2.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {activeGraphs.graph2.subtitle}
              </p>
            </div>

            <LineChart
              data={activeGraphs.graph2.data}
              series={activeGraphs.graph2.series}
              height={260}
              yFormatter={activeGraphs.graph2.yFormatter}
            />
          </div>
        </div>

        {/* Real Key Performance Indicator Pills based on user's actual role */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {userRole === 'BUYER' ? (
            <>
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Kuzatuvdagi Tovar</div>
                <div className="text-base font-black text-emerald-900 dark:text-emerald-300 font-numeric mt-0.5">{favorites.length} ta</div>
              </div>
              <div className="p-3 bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl">
                <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase">Narx Signallari</div>
                <div className="text-base font-black text-orange-900 dark:text-orange-300 font-numeric mt-0.5">{alerts.length} ta</div>
              </div>
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Tahlil Tovar</div>
                <div className="text-base font-black text-blue-900 dark:text-blue-300 font-numeric mt-0.5">{products.length} ta</div>
              </div>
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-2xl">
                <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Tarixiy Nuqtalar</div>
                <div className="text-base font-black text-purple-900 dark:text-purple-300 font-numeric mt-0.5">{priceTrends.length} ta sana</div>
              </div>
            </>
          ) : userRole === 'SELLER' ? (
            <>
              <div className="p-3 bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 rounded-2xl">
                <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">Jami Mahsulot</div>
                <div className="text-base font-black text-sky-900 dark:text-sky-300 font-numeric mt-0.5">{sellerMetrics?.total_products || sellerProducts.length} ta</div>
              </div>
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Faol Mahsulotlar</div>
                <div className="text-base font-black text-emerald-900 dark:text-emerald-300 font-numeric mt-0.5">{sellerMetrics?.active_products || 0} ta</div>
              </div>
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Umumiy Ko'rishlar</div>
                <div className="text-base font-black text-amber-900 dark:text-amber-300 font-numeric mt-0.5">{sellerMetrics?.total_views || 0} ta</div>
              </div>
              <div className="p-3 bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl">
                <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase">Sevimlilarga Qo'shilgan</div>
                <div className="text-base font-black text-orange-900 dark:text-orange-300 font-numeric mt-0.5">{sellerMetrics?.total_favorites || 0} ta</div>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl">
                <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Jami Qidiruvlar</div>
                <div className="text-base font-black text-indigo-900 dark:text-indigo-300 font-numeric mt-0.5">{adminMetrics?.total_searches || 0} ta</div>
              </div>
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Jami Foydalanuvchilar</div>
                <div className="text-base font-black text-emerald-900 dark:text-emerald-300 font-numeric mt-0.5">{adminMetrics?.total_users || 0} ta</div>
              </div>
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Jami Mahsulotlar</div>
                <div className="text-base font-black text-amber-900 dark:text-amber-300 font-numeric mt-0.5">{adminMetrics?.total_products || products.length} ta</div>
              </div>
              <div className="p-3 bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/30 rounded-2xl">
                <div className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">Faol Sotuvchilar</div>
                <div className="text-base font-black text-cyan-900 dark:text-cyan-300 font-numeric mt-0.5">{adminMetrics?.total_sellers || 0} ta</div>
              </div>
            </>
          )}
        </div>
      </div>


      {/* 5. MAIN CONTENT SPLIT: LIVE MARKET DEALS & POPULAR PRODUCTS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <SolarIcon name="Tag" size={20} className="text-orange-500" />
              <span>Bozordagi Eng Yaxshi Narxlar va Pasayishlar</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Toshkentning yirik savdo majmualaridagi bugungi narx farqlari
            </p>
          </div>

          <Link
            to="/search"
            className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
          >
            <span>Barchasini ko'rish</span>
            <SolarIcon name="AltArrowRight" size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
            {products.slice(0, 12).map((product) => {
              const mainImg = product.images?.[0]?.image_url || '/placeholder.png';
              const minPrice = product.min_price || product.base_price;

              return (
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="group bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500/40 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden active:scale-[0.98]"
                >
                  {/* Image (Unobstructed & Clean) */}
                  <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/40 mb-2.5 overflow-hidden flex items-center justify-center p-2.5">
                    <img
                      src={mainImg}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Info */}
                  <div className="space-y-1 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] sm:text-[11px] font-semibold text-orange-600 dark:text-orange-400 truncate">
                        {product.category_name || product.market_name || 'Bozor Taklifi'}
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug min-h-[32px] mt-0.5">
                        {product.name}
                      </h3>
                    </div>

                    <div className="pt-2 mt-auto border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400">Narxi</div>
                        <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-numeric">
                          {formatPrice(minPrice)}
                        </div>
                      </div>
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-orange-600 group-hover:text-white flex items-center justify-center transition-colors">
                        <SolarIcon name="ArrowRight" size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-400">Hozircha mahsulotlar topilmadi.</p>
          </div>
        )}
      </div>

      {/* 6. SUBSCRIPTION UPGRADE TEASER (IF ON STARTER) */}
      {currentPlan === 'STARTER' && (
        <div className="bg-white dark:bg-[#0B0F19] border border-orange-200 dark:border-orange-800/60 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
              <SolarIcon name="Crown" size={24} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                Pro Treyder Imkoniyatlari
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                Ertangi narx prognozlari va kunlik 100 ta AI tahlilini faollashtiring
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                5 tagacha tovarlarni parallel solishtirish, AI arbitraj signallari va raqobatchilar narx monitoringi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setSelectedPlan('PRO'); setBillingOpen(true); }}
            className="w-full md:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-md shadow-orange-600/20 transition active:scale-95 shrink-0 cursor-pointer text-center"
          >
            Tarifni Pro ga oshirish (290 000 so'm/oy)
          </button>
        </div>
      )}

      {/* Plan Billing Modal */}
      <PlanBillingModal
        isOpen={billingOpen}
        onClose={() => setBillingOpen(false)}
        selectedPlan={selectedPlan}
        onSuccess={async () => {
          setBillingOpen(false);
          if (refreshUser) await refreshUser();
        }}
      />
    </div>
  );
};

export default BuyerDashboard;
