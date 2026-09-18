import React, { useState, useEffect } from 'react';
import { sellerService, uploadService } from '../../api/services';
import SolarIcon from '../../components/common/SolarIcon';
import Badge from '../../components/common/Badge';

export const SellerStore = () => {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [city, setCity] = useState('Xorazm');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type, message }

  useEffect(() => {
    loadStore();
  }, []);

  async function loadStore() {
    try {
      setLoading(true);
      const data = await sellerService.getStore();
      setStore(data);
      if (data) {
        setStoreName(data.store_name || '');
        setDescription(data.description || '');
        setLogoUrl(data.logo_url || '');
        setContactPhone(data.contact_phone || '');
        setCity(data.city || 'Xorazm');
        setAddress(data.address || '');
        setWebsite(data.website || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const res = await uploadService.uploadFile(file);
      setLogoUrl(res.url);
    } catch (err) {
      alert("Logo yuklashda xatolik: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (!storeName.trim()) {
      alert("Do'kon nomini kiriting");
      return;
    }

    try {
      setSaving(true);
      const updated = await sellerService.updateStore({
        store_name: storeName.trim(),
        description: description.trim() || null,
        logo_url: logoUrl || null,
        contact_phone: contactPhone.trim() || null,
        city: city.trim() || 'Xorazm',
        address: address.trim() || null,
        website: website.trim() || null
      });

      setStore(updated);
      setIsEditing(false);
      setFeedback({ type: 'success', message: "Do'kon profilingiz muvaffaqiyatli saqlandi!" });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: 'error', message: "Profilni yangilashda xatolik yuz berdi: " + (err.response?.data?.detail || err.message) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="w-full p-12 text-center text-xs text-slate-400">Do'kon ma'lumotlari yuklanmoqda...</div>;
  }

  return (
    <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Do'kon profili & rekvizitlari
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Platformadagi rasmiy do'kon profilingiz, kontaktlar va verifikatsiya ma'lumotlari
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge status={store?.status} size="sm" />
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-orange-600/25 transition-all active:scale-95 cursor-pointer"
            >
              <SolarIcon name="Pen" size={15} />
              <span>Profilni tahrirlash</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 ${feedback.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'}`}>
          <SolarIcon name={feedback.type === 'success' ? 'CheckCircle' : 'CloseCircle'} size={18} />
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Store Header Card - Full Width */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xs flex flex-wrap items-center justify-between gap-6 transition-colors">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
            {store?.logo_url ? (
              <img src={store.logo_url} alt={store.store_name} className="w-full h-full object-cover" />
            ) : (
              <SolarIcon name="Shop" size={36} className="text-orange-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{store?.store_name}</h2>
              {store?.is_verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold">
                  <SolarIcon name="CheckCircle" size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Tasdiqlangan</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Identifikator: <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{store?.slug}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8 text-xs sm:text-sm">
          <div className="text-left sm:text-right">
            <span className="block text-[11px] text-slate-400 uppercase font-bold tracking-wider">Reyting</span>
            <div className="flex items-center gap-1 font-black text-slate-900 dark:text-white text-lg mt-0.5 font-numeric">
              <SolarIcon name="Star" size={16} className="text-amber-500" />
              <span>{store?.rating ? Number(store.rating).toFixed(1) : "5.0"}</span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="block text-[11px] text-slate-400 uppercase font-bold tracking-wider">Joylashuv</span>
            <span className="font-black text-slate-900 dark:text-white text-lg mt-0.5 block">{store?.city || "Xorazm"}</span>
          </div>
        </div>
      </div>

      {/* Edit Form or Read-only Display */}
      {isEditing ? (
        <form onSubmit={handleSaveStore} className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 text-xs shadow-xs transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <SolarIcon name="Pen" size={16} className="text-orange-600" />
              <span>Do'kon ma'lumotlarini yangilash</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <SolarIcon name="Close" size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">Do'kon logotipi</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <SolarIcon name="Shop" size={24} className="text-slate-400" />
                  )}
                </div>
                <label className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5">
                  <SolarIcon name="Upload" size={14} />
                  <span>{uploadingLogo ? "Yuklanmoqda..." : "Yangi logo yuklash"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                  >
                    O'chirish
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Do'kon nomi *</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Do'kon rasmiy nomi"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-[#111827] focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Aloqa telefoni</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-[#111827] font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Shahar / Viloyat</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Xorazm"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-[#111827]"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Veb-sayt / Telegram havola</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://t.me/dokon_rasmiy"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-[#111827] font-mono"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Aniq manzil (Ofis / Magazin)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Urganch sh., Al-Xorazmiy ko'chasi, 12-uy"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-[#111827]"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Do'kon haqida batafsil tavsif</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Do'koningiz faoliyati, xizmat ko'rsatish sohalari va afzalliklari..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-[#111827] resize-y"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <SolarIcon name="Check" size={15} />
              <span>{saving ? "Saqlanmoqda..." : "Saqlash"}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 text-xs shadow-xs transition-colors">
          {/* Section: Rekvizitlar */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              Yuridik & Ro'yxatdan o'tish ma'lumotlari
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-[#151D2C] rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-400 block mb-1 font-medium">STIR / INN</span>
                <span className="text-base font-mono font-bold text-slate-900 dark:text-white">{store?.tax_id || "123456"}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-[#151D2C] rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-400 block mb-1 font-medium">Davlat ro'yxat raqami</span>
                <span className="text-base font-mono font-bold text-slate-900 dark:text-white">{store?.business_reg_number || "Kiritilmagan"}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-[#151D2C] rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-400 block mb-1 font-medium">Platforma Verifikatsiyasi</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <SolarIcon name="CheckCircle" size={16} />
                  <span>{store?.is_verified ? "Rasmiy Tasdiqlangan" : "Tekshiruvda"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Section: Aloqa va Manzil */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              Aloqa va Joylashuv
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-[#151D2C] rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-400 block mb-1 font-medium">Shahar / Joylashuv</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">{store?.city || "Xorazm"}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-[#151D2C] rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-400 block mb-1 font-medium">Aloqa telefoni</span>
                <span className="text-base font-mono font-bold text-slate-900 dark:text-white">{store?.contact_phone || "+998888584969"}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-[#151D2C] rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-400 block mb-1 font-medium">Manzil</span>
                <span className="text-base text-slate-900 dark:text-white font-medium">{store?.address || "sadblsa"}</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-[#151D2C] rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-400 dark:text-slate-400 block mb-1 font-medium">Veb-sayt / Kanal</span>
                <span className="text-base font-mono text-slate-900 dark:text-white truncate block">
                  {store?.website ? (
                    <a href={store.website} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">
                      {store.website}
                    </a>
                  ) : "https://educontest.uz"}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Tavsif */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              Do'kon haqida
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#151D2C] p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              {store?.description || "Rasmiy do'kon profilingiz faoliyati, mahsulotlar kafolati va mijozlarga xizmat ko'rsatish shartlari."}
            </p>
          </div>

          {/* Verification Status Banner */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <span className={`w-3.5 h-3.5 rounded-full ${store?.is_verified ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-amber-500 ring-4 ring-amber-500/20'}`} />
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                  {store?.is_verified ? "Rasmiy tekshirilgan va tasdiqlangan do'kon" : "Moderator tasdig'i kutilmoqda"}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  {store?.is_verified
                    ? "Sizning do'koningiz MilliyNarx platformasi tomonidan to'liq verifikatsiyadan o'tgan va xaridorlar ishonchi yuqori."
                    : "Profilingiz administrator tomonidan ko'rib chiqilmoqda."}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerStore;
