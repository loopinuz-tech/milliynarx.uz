import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatters';
import apiClient from '../../api/client';
import SolarIcon from '../../components/common/SolarIcon';
import Badge from '../../components/common/Badge';
import PlanBillingModal from '../../components/common/PlanBillingModal';

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [modalSelectedPlan, setModalSelectedPlan] = useState('PRO');
  const [planData, setPlanData] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const isTgConnected = Boolean(user?.telegram_chat_id);
  const currentPlan = (user?.plan || planData?.current_plan || 'STARTER').toUpperCase();

  const fetchPlanDetails = async () => {
    setLoadingPlan(true);
    try {
      const res = await apiClient.get('/seller/plan');
      setPlanData(res.data);
    } catch {
      // Fallback if not fetched
    } finally {
      setLoadingPlan(false);
    }
  };

  useEffect(() => {
    fetchPlanDetails();
  }, []);

  const handleOpenBilling = (plan = 'PRO') => {
    setModalSelectedPlan(plan);
    setBillingModalOpen(true);
  };

  const handleBillingSuccess = async (result) => {
    setBillingModalOpen(false);
    setSuccessToast(result?.message || "Tarifingiz muvaffaqiyatli faollashtirildi!");
    if (refreshUser) {
      await refreshUser();
    }
    await fetchPlanDetails();
    setTimeout(() => {
      setSuccessToast('');
    }, 5000);
  };

  const planInfoMap = {
    STARTER: {
      name: "Starter",
      badgeClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700",
      colorClass: "text-slate-600 dark:text-slate-400",
      aiLimitText: "Kunlik 5 ta AI so'rov",
      comparisonText: "2 tagacha tovar parallel",
      priceText: "Umrbod bepul",
      badgeLabel: "BEPUL",
      features: [
        "Kunlik 5 ta AI bozor tahlili so'rovi",
        "Cheksiz tovarlar katalogi (100% bepul joylash)",
        "2 tagacha tovar narxlarini taqqoslash",
        "Haftalik o'rtacha bozor narxlari dinamikasi",
        "Telegram orqali haftalik narx hisoboti"
      ]
    },
    PRO: {
      name: "Pro Treyder",
      badgeClass: "bg-gradient-to-r from-orange-500/15 to-amber-500/15 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/60",
      colorClass: "text-orange-600 dark:text-orange-400",
      aiLimitText: "Kunlik 100 ta AI tahlil (oyiga 3 000 ta)",
      comparisonText: "5 tagacha tovar parallel",
      priceText: "290 000 so'm / oy",
      badgeLabel: "POPULAR",
      features: [
        "Kunlik 100 ta AI chuqur tahlil so'rovlari",
        "Ertangi kunlik & haftalik narx prognozi (Machine Learning)",
        "5 tagacha tovarlarni parallel solishtirish",
        "AI Arbitraj: eng arzon va eng qimmat bozorlar spredi",
        "Raqobatchilar narxlarini real-vaqtda kuzatish va tezkor signallar",
        "Tasdiqlangan treyder nishoni"
      ]
    },
    ENTERPRISE: {
      name: "Enterprise",
      badgeClass: "bg-gradient-to-r from-purple-500/15 to-indigo-500/15 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60",
      colorClass: "text-purple-600 dark:text-purple-400",
      aiLimitText: "Cheksiz AI so'rovlar",
      comparisonText: "Barcha bozorlar bo'yicha cheksiz",
      priceText: "890 000 so'm / oy",
      badgeLabel: "VIP",
      features: [
        "Cheksiz AI bozor tahlili va real-vaqt so'rovlari",
        "Avtomatlashtirilgan bozorlararo AI Arbitraj va xarid signallari",
        "Ommaviy (bulk) mahsulotlar tahlili va Excel/PDF eksport",
        "1C / ERP tizimlari bilan to'g'ridan-to'g'ri API integratsiyasi",
        "B2B Rasmiy shartnoma va Invoys (Hisob-faktura)",
        "24/7 Shaxsiy AI tahlilchi va individual menejer"
      ]
    }
  };

  const activePlanMeta = planInfoMap[currentPlan] || planInfoMap.STARTER;

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 pb-24 md:pb-12 space-y-6 transition-colors duration-200">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Foydalanuvchi profili
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Shaxsiy hisob, obuna tarifi, AI tahlil kvotalari va xavfsizlik
        </p>
      </div>

      {/* Success Alert Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-fade-in shadow-xs">
          <SolarIcon name="CheckCircle" size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* PC / Desktop Responsive 2-Column Grid (avoids empty space on the right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: User Header & Basic Info, Telegram, Shortcuts (lg:col-span-5) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. User Header & Basic Info Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 text-xs shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-orange-500/20 shrink-0">
                  {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {user?.full_name || user?.email}
                    </h2>
                    {user?.is_verified && (
                      <SolarIcon name="VerifiedCheck" size={16} className="text-sky-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-slate-400 dark:text-slate-500 font-mono text-xs mt-0.5 truncate">
                    {user?.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/60 text-orange-700 dark:text-orange-400">
                  {user?.role === 'SELLER' ? "Sotuvchi (Do'kon)" : (user?.role === 'ADMIN' ? "Admin" : "Xaridor")}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400">
                  Faol hisob
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl">
                <label className="text-slate-400 dark:text-slate-500 block mb-1 text-[11px] font-medium">
                  Tizimdagi rol va maqom
                </label>
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <SolarIcon name={user?.role === 'SELLER' ? "Store" : "User"} size={16} className="text-orange-500" />
                  <span>{user?.role || 'BUYER'}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl">
                <label className="text-slate-400 dark:text-slate-500 block mb-1 text-[11px] font-medium">
                  Telefon raqam
                </label>
                <div className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                  {user?.phone || "Kiritilmagan"}
                </div>
              </div>
            </div>

            {user?.store_name && (
              <div className="p-3.5 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <label className="text-orange-600 dark:text-orange-400 block mb-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Bog'langan Do'kon
                  </label>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {user.store_name}
                  </div>
                </div>
                <Link
                  to="/seller"
                  className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
                >
                  Do'kon boshqaruvi
                </Link>
              </div>
            )}
          </div>

          {/* 3. Telegram Status Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 text-xs shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                    <span>Telegram Bildirishnomalari</span>
                    {isTgConnected ? (
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                        Ulangan
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                        Ulanmagan
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isTgConnected 
                      ? (user?.telegram_username ? `${user.telegram_username} hisobiga muvaffaqiyatli ulangan` : 'Bot bilan faol bog\'langan')
                      : "Narx tushishi xabarlarini bevosita @milliynarxbot orqali olishingiz mumkin"
                    }
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                {!isTgConnected && (
                  <a
                    href="https://t.me/milliynarxbot"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1e8bc0] text-white text-xs font-bold transition active:scale-95 text-center shadow-xs"
                  >
                    Botni ulash
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/alerts')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750 transition active:scale-95 text-center"
                >
                  Ogohlantirishlar
                </button>
              </div>
            </div>
          </div>

          {/* 4. Quick Action Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/favorites')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-3 hover:border-orange-300 dark:hover:border-orange-500/30 transition text-left cursor-pointer shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center shrink-0">
                <SolarIcon name="Heart" size={18} />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">Saralanganlar</div>
                <div className="text-[10px] text-slate-400">Saqlangan tovarlar</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/alerts')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-3 hover:border-orange-300 dark:hover:border-orange-500/30 transition text-left cursor-pointer shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 flex items-center justify-center shrink-0">
                <SolarIcon name="Bell" size={18} />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">Ogohlantirishlar</div>
                <div className="text-[10px] text-slate-400">Narx monitoringi</div>
              </div>
            </button>

            {user?.role === 'SELLER' ? (
              <button
                onClick={() => navigate('/seller')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-3 hover:border-orange-300 dark:hover:border-orange-500/30 transition text-left cursor-pointer shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center shrink-0">
                  <SolarIcon name="Store" size={18} />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Sotuvchi Paneli</div>
                  <div className="text-[10px] text-slate-400">Do'kon va tovarlar</div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => navigate('/onboarding')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-3 hover:border-orange-300 dark:hover:border-orange-500/30 transition text-left cursor-pointer shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center shrink-0">
                  <SolarIcon name="Shop" size={18} />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Do'kon ochish</div>
                  <div className="text-[10px] text-slate-400">100% bepul tovar joylash</div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Obuna va AI Tahlil Imkoniyatlari (lg:col-span-7)            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* 2. OBUNA VA AI TAHLIL CARD (CORE REQUEST) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 text-xs shadow-xs relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                  <SolarIcon name="Crown" size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Obuna va AI Tahlil Imkoniyatlari
                    </h3>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${activePlanMeta.badgeClass}`}>
                      {activePlanMeta.badgeLabel}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Platformaning AI algoritmlari, ertangi narx prognozlari va bozor tahlili kvotalari
                  </p>
                </div>
              </div>

              {/* Current Active Plan Badge */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Joriy tarif:</span>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  {activePlanMeta.name}
                </span>
              </div>
            </div>

            {/* Quotas & Capacity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
              {/* AI Queries */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] font-medium mb-1.5">
                  <SolarIcon name="Sparkles" size={15} className="text-orange-500" />
                  <span>AI Bozor Tahlili</span>
                </div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {currentPlan === 'ENTERPRISE' 
                    ? "Cheksiz so'rovlar" 
                    : (currentPlan === 'PRO' ? "100 ta / kunlik" : "5 ta / kunlik")}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {currentPlan === 'STARTER' ? "Bazaviy tahlil rejimi" : "Chuqur Machine Learning tahlili"}
                </div>
              </div>

              {/* Price Comparison */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] font-medium mb-1.5">
                  <SolarIcon name="SortVertical" size={15} className="text-amber-500" />
                  <span>Narxlarni solishtirish</span>
                </div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {currentPlan === 'ENTERPRISE' 
                    ? "Cheksiz tovarlar" 
                    : (currentPlan === 'PRO' ? "5 tagacha parallel" : "2 tagacha parallel")}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {currentPlan === 'STARTER' ? "Bozorlararo taqqoslash" : "Barcha bozorlar & spred tahlili"}
                </div>
              </div>

              {/* Product Catalog (100% Free & Unlimited for all) */}
              <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold mb-1.5">
                  <SolarIcon name="Box" size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Mahsulotlar joylash</span>
                </div>
                <div className="text-sm font-extrabold text-emerald-900 dark:text-emerald-300">
                  100% Bepul va Cheksiz
                </div>
                <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                  Barcha foydalanuvchilar uchun
                </div>
              </div>
            </div>

            {/* Current Tier Features Checklist */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 relative z-10">
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                Joriy tarif imkoniyatlari ({activePlanMeta.name}):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                {activePlanMeta.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <SolarIcon name="CheckCircle" size={14} className="text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan Upgrade / Management Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-10">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {currentPlan === 'STARTER' 
                    ? "AI imkoniyatlarini maksimal darajada kengaytiring" 
                    : `${activePlanMeta.name} tarifi faol`}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentPlan === 'STARTER'
                    ? "Ertangi narx prognozlari va 100 ta AI so'rov uchun Pro tarifiga o'ting"
                    : "To'lov usullari: Click, Payme yoki naqd to'lov"}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                {currentPlan === 'STARTER' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenBilling('ENTERPRISE')}
                      className="w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition active:scale-98 cursor-pointer text-center"
                    >
                      Enterprise (890k)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenBilling('PRO')}
                      className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-md shadow-orange-600/20 transition-all active:scale-98 cursor-pointer flex items-center gap-1.5 text-center"
                    >
                      <SolarIcon name="Crown" size={16} />
                      <span>Pro ga oshirish (290 000 so'm)</span>
                    </button>
                  </>
                ) : currentPlan === 'PRO' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenBilling('PRO')}
                      className="w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition active:scale-98 cursor-pointer text-center"
                    >
                      Obunani uzaytirish
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenBilling('ENTERPRISE')}
                      className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 transition-all active:scale-98 cursor-pointer flex items-center gap-1.5 text-center"
                    >
                      <SolarIcon name="Crown" size={16} />
                      <span>Enterprise ga o'tish (890 000 so'm)</span>
                    </button>
                  </>
                ) : (
                  <div className="w-full sm:w-auto px-4 py-2 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 text-center">
                    <SolarIcon name="Crown" size={16} />
                    <span>Maksimal Enterprise Tarifi</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Plan Billing Modal */}
      <PlanBillingModal
        isOpen={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        selectedPlan={modalSelectedPlan}
        onSuccess={handleBillingSuccess}
      />
    </div>
  );
};

export default ProfilePage;
