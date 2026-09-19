import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { uploadService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import SolarIcon from '../../components/common/SolarIcon';
import PlanBillingModal from '../../components/common/PlanBillingModal';

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { loginWithToken, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [storeName, setStoreName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [categoryType, setCategoryType] = useState('elektronika');
  const [description, setDescription] = useState('');

  // Step 2: Location & Market
  const [marketName, setMarketName] = useState('Abu Saxiy savdo markazi');
  const [city, setCity] = useState('Toshkent');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [telegramChannel, setTelegramChannel] = useState('');
  const [taxId, setTaxId] = useState('');

  // Step 3: Turnover & Payment Methods
  const [monthlyTurnover, setMonthlyTurnover] = useState('50_200_mln');
  const [selectedPayments, setSelectedPayments] = useState(['click', 'payme', 'cash', 'terminal']);

  // Step 4: Business Plan
  const [selectedPlan, setSelectedPlan] = useState('PRO');
  const [billingModalOpen, setBillingModalOpen] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await apiClient.get('/seller/onboarding-status');
        if (res.data) {
          if (res.data.store_name) setStoreName(res.data.store_name);
          if (res.data.logo_url) setLogoUrl(res.data.logo_url);
          if (res.data.market_name) setMarketName(res.data.market_name);
          if (res.data.plan) setSelectedPlan(res.data.plan);
          if (res.data.payment_methods) setSelectedPayments(res.data.payment_methods);
        }
      } catch (err) {
        console.error("Failed to load onboarding status", err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadStatus();
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      setError('');
      const res = await uploadService.uploadFile(file);
      if (res?.url) {
        setLogoUrl(res.url);
      }
    } catch (err) {
      console.error("Logo upload failed", err);
      setError("Logotipni yuklashda xatolik yuz berdi. JPG, PNG yoki WEBP tanlang.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const togglePaymentMethod = (method) => {
    if (selectedPayments.includes(method)) {
      if (selectedPayments.length > 1) {
        setSelectedPayments(selectedPayments.filter(m => m !== method));
      }
    } else {
      setSelectedPayments([...selectedPayments, method]);
    }
  };

  const handleSaveAndComplete = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await apiClient.post('/seller/onboarding', {
        store_name: storeName,
        logo_url: logoUrl,
        description,
        city,
        address,
        market_name: marketName,
        contact_phone: contactPhone,
        telegram_channel: telegramChannel,
        tax_id: taxId,
        monthly_turnover: monthlyTurnover,
        payment_methods: selectedPayments,
        plan: selectedPlan
      });
      if (res.data?.access_token && res.data?.user) {
        loginWithToken(res.data.access_token, res.data.user);
      } else {
        await refreshUser();
      }
      navigate('/seller');
    } catch (err) {
      setError(err.response?.data?.detail || "Ma'lumotlarni saqlashda xatolik yuz berdi.");
    } finally {
      setSaving(false);
    }
  };

  const marketsList = [
    "Abu Saxiy savdo markazi",
    "Malika (Fleshka) texnika bozori",
    "O'rikzor ulgurji savdo majmuasi",
    "Qo'yliq dehqon va ulgurji bozori",
    "Bek Baraka ulgurji bozori",
    "Chilonzor buyum savdo majmuasi",
    "Samarqand markaziy savdo majmuasi",
    "Farg'ona / Andijon savdo markazlari",
    "Boshqa mustaqil savdo nuqtasi"
  ];

  const paymentOptions = [
    { id: 'click', name: 'Click Up', badge: 'Avtomatik' },
    { id: 'payme', name: 'Payme', badge: 'Avtomatik' },
    { id: 'uzum', name: 'Uzum Bank', badge: 'Nasiya' },
    { id: 'terminal', name: 'Uzcard / Humo Terminal', badge: 'Karta' },
    { id: 'cash', name: 'Naqd pul', badge: 'Do\'konda' },
    { id: 'invoice', name: 'Hisob-raqam (Invoys)', badge: 'B2B YTT/MCHJ' }
  ];

  if (loadingInitial) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] py-8 px-4 max-w-4xl mx-auto animate-fade-in">
      {/* Top Banner & Progress Header */}
      <div className="text-center mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800">
          Sotuvchi Onboarding &bull; Tezkor Integratsiya
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
          Do'koningizni platformaga sozlang
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto mt-1">
          Bozor tahlili, to'lov tizimlari va sotuvchi tarifini tanlab, savdoni boshlang
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mt-6">
          {[
            { step: 1, title: "Do'kon & Logo" },
            { step: 2, title: "Bozor & Manzil" },
            { step: 3, title: "To'lov & Savdo" },
            { step: 4, title: "Biznes Tarif" }
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setCurrentStep(s.step)}
              className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                currentStep === s.step
                  ? 'bg-orange-600 text-white shadow-xs'
                  : currentStep > s.step
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px]">
                {currentStep > s.step ? "✓" : s.step}
              </span>
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <SolarIcon name="CloseCircle" size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-white dark:bg-[#0E1524] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        
        {/* STEP 1: BRANDING & LOGO */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SolarIcon name="Store" size={20} className="text-orange-600" />
                <span>1-qadam: Do'kon brendi va logotipi</span>
              </h2>
              <p className="text-xs text-slate-400">Do'koningiz tashrif buyuruvchilarga qanday ko'rinishini belgilang</p>
            </div>

            {/* Store Logo Section */}
            <div className="p-4 bg-slate-50 dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-5">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative shadow-2xs">
                {logoUrl ? (
                  <img src={logoUrl} alt="Store Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <SolarIcon name="Camera" size={32} className="text-slate-400" />
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="text-center sm:text-left space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Do'kon logotipi yuklang
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Kvadrat yoki dumaloq shakldagi sifatli logotip xaridorlarda ishonch uyg'otadi. PNG, JPG yoki WEBP (maks. 5MB).
                </p>
                <label className="inline-flex items-center gap-2 py-2 px-4 bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950 border border-slate-200 dark:border-slate-700 hover:border-orange-300 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition shadow-2xs">
                  <SolarIcon name="Upload" size={15} />
                  <span>{logoUrl ? "Logotipni yangilash" : "Faylni tanlash"}</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Do'kon yoki brend nomi *
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Masalan: Artel Rasmiy Treyder"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:border-orange-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Asosiy faoliyat sohasi
                </label>
                <select
                  value={categoryType}
                  onChange={(e) => setCategoryType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:border-orange-500 outline-none transition cursor-pointer"
                >
                  <option value="elektronika">Elektronika va gadjetlar</option>
                  <option value="maishiy">Maishiy texnika va uskunalar</option>
                  <option value="qurilish">Qurilish mollari va xomashyo</option>
                  <option value="oziq-ovqat">Oziq-ovqat va agrosanoat</option>
                  <option value="tekstil">To'qimachilik va gazlamalar</option>
                  <option value="avto">Avtomobil ehtiyot qismlari</option>
                  <option value="boshqa">Boshqa soha</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs mb-1.5">
                Do'kon haqida qisqacha tavsif
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Biz to'g'ridan-to'g'ri ishlab chiqaruvchilardan eng qulay ulgurji va chakana narxlarda yetkazib beramiz..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:border-orange-500 outline-none transition"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-2.5 px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Keyingi qadam (Bozor & Manzil)</span>
                <SolarIcon name="ArrowRight" size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION & MARKET */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SolarIcon name="MapPoint" size={20} className="text-orange-600" />
                <span>2-qadam: Savdo nuqtasi va bozor joylashuvi</span>
              </h2>
              <p className="text-xs text-slate-400">Xaridorlar tovarlaringizni qayerdan olib ketishi mumkinligini ko'rsating</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Bozor yoki savdo majmuasi *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {marketsList.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMarketName(m)}
                      className={`py-2 px-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        marketName === m
                          ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span className="truncate">{m}</span>
                      {marketName === m && <SolarIcon name="CheckCircle" size={14} className="text-orange-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">Shahar / Viloyat</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Toshkent"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:border-orange-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">Do'kon / Rasta / Pavilyon raqami</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Masalan: B-blok, 45-do'kon"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:border-orange-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">Aloqa telefoni</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:border-orange-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">Telegram kanal / profil</label>
                  <input
                    type="text"
                    value={telegramChannel}
                    onChange={(e) => setTelegramChannel(e.target.value)}
                    placeholder="@sizning_dokon"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:border-orange-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Ortga
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="py-2.5 px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Keyingi qadam (To'lovlar)</span>
                <SolarIcon name="ArrowRight" size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: TURNOVER & PAYMENT SYSTEMS */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SolarIcon name="Wallet" size={20} className="text-orange-600" />
                <span>3-qadam: Savdo aylanmasi va To'lov usullari</span>
              </h2>
              <p className="text-xs text-slate-400">Do'koningiz qaysi to'lov tizimlari orqali hisob-kitob qilishini belgilang</p>
            </div>

            {/* Turnover brackets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Oylik savdo aylanmangiz taxminan:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'under_50_mln', label: "50 mln so'mgacha" },
                  { id: '50_200_mln', label: "50 - 200 mln so'm" },
                  { id: '200_1000_mln', label: "200 mln - 1 mlrd" },
                  { id: 'over_1_mlrd', label: "1 mlrd so'mdan ortiq" }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMonthlyTurnover(item.id)}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      monthlyTurnover === item.id
                        ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 font-bold shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Systems Checklist */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Qabul qilinadigan to'lov usullari (bir nechtasini tanlang):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                {paymentOptions.map((opt) => {
                  const isChecked = selectedPayments.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => togglePaymentMethod(opt.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isChecked
                          ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 text-slate-900 dark:text-white font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isChecked ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-300 dark:border-slate-700'
                        }`}>
                          {isChecked && <span className="text-[10px]">✓</span>}
                        </div>
                        <span>{opt.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {opt.badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Ortga
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="py-2.5 px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Keyingi qadam (Tarif rejalari)</span>
                <SolarIcon name="ArrowRight" size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: BUSINESS MODELS & PRICING PLANS */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <SolarIcon name="Crown" size={20} className="text-orange-600" />
                  <span>4-qadam: Biznes model va AI Tahlil Obunasi</span>
                </h2>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  ⚡ Mahsulot yuklash — barcha tariflarda bepul va cheksiz!
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tariflar do'konga tovar joylash uchun emas, balki <strong>AI tahlillar soni, narxlarni solishtirish ko'lami va bozor prognozlari</strong>ga qarab belgilanadi.
              </p>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* STARTER */}
              <div 
                onClick={() => setSelectedPlan('STARTER')}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between relative ${
                  selectedPlan === 'STARTER'
                    ? 'border-slate-900 dark:border-white ring-2 ring-slate-900/10 dark:ring-white/20 bg-slate-50/70 dark:bg-[#151D2C]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300">Starter</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">Umrbod Bepul</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mb-1 font-numeric">
                    0 so'm
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                    Bozorga endi kirayotgan sotuvchi va kichik savdo nuqtalari uchun
                  </p>
                  
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Cheksiz tovar</strong> joylash (bepul)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Kunlik 5 ta</strong> AI bozor tahlili</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>2 tagacha mahsulotni taqqoslash</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Haftalik o'rtacha bozor narxlari</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Telegram haftalik xabarnomasi</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${
                    selectedPlan === 'STARTER' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedPlan === 'STARTER' ? 'Tanlangan ✓' : 'Tanlash'}
                  </span>
                </div>
              </div>

              {/* PRO TRADER (RECOMMENDED) */}
              <div 
                onClick={() => setSelectedPlan('PRO')}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between relative ${
                  selectedPlan === 'PRO'
                    ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/40 dark:bg-orange-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-orange-300'
                }`}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                  Tavsiya etiladi
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase text-orange-600 dark:text-orange-400">Pro Treyder</span>
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-100 dark:bg-orange-950 px-2 py-0.5 rounded-full">Ommabop</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mb-1 font-numeric">
                    290 000 so'm <span className="text-xs font-normal text-slate-400">/oy</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                    Faol bozor treyderlari, do'konlar va raqobatbardosh sotuvchilar uchun
                  </p>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600 font-bold">✓</span>
                      <span><strong>Cheksiz tovar</strong> joylash (bepul)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600 font-bold">✓</span>
                      <span><strong>Kunlik 100 ta</strong> AI chuqur tahlil so'rovi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600 font-bold">✓</span>
                      <span><strong>Ertangi narx prognozi</strong> (AI Trend)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600 font-bold">✓</span>
                      <span>Bir vaqtda <strong>5 tagacha tovar</strong> taqqoslash</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600 font-bold">✓</span>
                      <span><strong>AI Arbitraj</strong>: bozorlararo spred tahlili</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600 font-bold">✓</span>
                      <span>Raqobatchilar narxidan tezkor xabarnomalar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600 font-bold">✓</span>
                      <span><strong>Tasdiqlangan treyder</strong> nishoni</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${
                    selectedPlan === 'PRO' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedPlan === 'PRO' ? 'Tanlangan ✓' : 'Tanlash'}
                  </span>
                </div>
              </div>

              {/* ENTERPRISE */}
              <div 
                onClick={() => setSelectedPlan('ENTERPRISE')}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between relative ${
                  selectedPlan === 'ENTERPRISE'
                    ? 'border-purple-600 ring-2 ring-purple-500/20 bg-purple-50/40 dark:bg-purple-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-purple-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold uppercase text-purple-700 dark:text-purple-400">Enterprise</span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-full">VIP B2B</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mb-1 font-numeric">
                    890 000 so'm <span className="text-xs font-normal text-slate-400">/oy</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                    Katta ulgurji korxonalar, importyorlar, riteyl tarmoqlar va distribyutorlar
                  </p>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 font-bold">✓</span>
                      <span><strong>Cheksiz AI so'rovlar</strong> va tahlillar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 font-bold">✓</span>
                      <span><strong>Barcha bozorlar</strong> bo'yicha cheksiz taqqoslash</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 font-bold">✓</span>
                      <span><strong>Avtomatlashtirilgan AI Arbitraj</strong> signallari</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 font-bold">✓</span>
                      <span><strong>1C / ERP / Excel</strong> to'g'ridan-to'g'ri API</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 font-bold">✓</span>
                      <span>B2B Rasmiy Shartnoma va Invoys</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 font-bold">✓</span>
                      <span>24/7 Shaxsiy AI tahlilchi va individual menejer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600 font-bold">✓</span>
                      <span>Qidiruvda eng yuqori VIP joy</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 ${
                    selectedPlan === 'ENTERPRISE' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedPlan === 'ENTERPRISE' ? 'Tanlangan ✓' : 'Tanlash'}
                  </span>
                </div>
              </div>
            </div>

            {/* Paid Plan Upgrade Modal Trigger Notice */}
            {selectedPlan !== 'STARTER' && (
              <div className="p-4 bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200 rounded-2xl text-xs flex items-center justify-between gap-4">
                <div>
                  <strong className="text-orange-900 dark:text-orange-300 block font-bold">
                    {selectedPlan === 'PRO' ? "Pro Treyder (290 000 so'm/oy)" : "Enterprise (890 000 so'm/oy)"} tanlandi
                  </strong>
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Click, Payme, Uzum Bank yoki Invoys orqali darhol to'lashingiz yoki kabinetdan keyinroq faollashtirishingiz mumkin.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBillingModalOpen(true)}
                  className="py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer shadow-xs active:scale-98"
                >
                  To'lov qilish
                </button>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Ortga
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAndComplete}
                className="py-3 px-7 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-md shadow-orange-600/20 active:scale-98 disabled:opacity-50"
              >
                {saving ? (
                  <span>Saqlanmoqda...</span>
                ) : (
                  <>
                    <span>Onboardingni yakunlash & Kabinetga o'tish</span>
                    <SolarIcon name="CheckCircle" size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Plan Billing Modal */}
      <PlanBillingModal
        isOpen={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        selectedPlan={selectedPlan}
        onSuccess={() => {
          setBillingModalOpen(false);
          handleSaveAndComplete();
        }}
      />
    </div>
  );
};

export default OnboardingPage;
