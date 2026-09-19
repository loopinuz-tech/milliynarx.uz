import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import SolarIcon from '../../components/common/SolarIcon';

export const TermsPage = () => {
  const [activeTab, setActiveTab] = useState('all');

  const lastUpdated = "19-Sentabr, 2026";

  const sections = [
    {
      id: 'general',
      num: '1',
      title: "Umumiy qoidalar va Platforma maqomi",
      content: (
        <div className="space-y-3">
          <p>
            1.1. Ushbu Foydalanish shartlari (keyingi o'rinlarda — <strong>"Shartlar"</strong>) <strong>"Milliy Narx"</strong> (milliynarx.uz) axborot-tahliliy B2B va B2C narxlar monitoringi platformasidan foydalanish tartib-qoidalarini belgilaydi.
          </p>
          <p>
            1.2. <strong>"Milliy Narx"</strong> — O'zbekiston Respublikasining yirik savdo majmualari (Abu Saxiy, Malika, Chilonzor, O'rikzor, Sergeli, Qo'yliq va boshqalar) hamda rasmiy dilerlik tarmoqlaridagi tovarlar narxlarini real vaqt rejimida taqqoslovchi, sun'iy intellekt (Codexa AI) yordamida bozor konyunkturasini tahlil qiluvchi mustaqil axborot-monitoring terminali hisoblanadi.
          </p>
          <div className="p-4 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 rounded-2xl text-xs text-orange-900 dark:text-orange-300">
            <strong>Muhim eslatma:</strong> Platforma to'g'ridan-to'g'ri tovar sotuvchi onlayn-do'kon (retailer) emas. "Milliy Narx" tovarlarga egalik qilmaydi, balki tasdiqlangan mustaqil sotuvchilar (treyderlar, distribyutorlar) takliflarini o'rganish, solishtirish va eng maqbul narxlarni topish uchun tahliliy vositalarni taqdim etadi.
          </div>
        </div>
      )
    },
    {
      id: 'users',
      num: '2',
      title: "Xaridorlar va Foydalanuvchilar huquqlari",
      content: (
        <div className="space-y-3">
          <p>
            2.1. Foydalanuvchi platforma orqali bozor kataloglarini ko'rish, narxlar grafigini tahlil qilish, tovarlarni parametrlar bo'yicha taqqoslash va sun'iy intellekt maslahatchisidan bepul bazaviy foydalanish huquqiga ega.
          </p>
          <p>
            2.2. Foydalanuvchi ro'yxatdan o'tganda to'g'ri va haqiqiy aloqa ma'lumotlarini taqdim etish majburiyatini oladi. Birovning shaxsiga tegishli ma'lumotlardan foydalanish qat'iyan taqiqlanadi.
          </p>
          <p>
            2.3. Narxlar pasayishi to'g'risida Telegram-bot (<code>@milliynarxbot</code>) yoki elektron pochta orqali bildirishnomalarni yoqish va o'chirish foydalanuvchining shaxsiy kabinetida ixtiyoriy amalga oshiriladi.
          </p>
        </div>
      )
    },
    {
      id: 'sellers',
      num: '3',
      title: "Sotuvchilar (Do'konlar) va Mahsulot joylash talablari",
      content: (
        <div className="space-y-3">
          <p>
            3.1. Platformada sotuvchi (treyder) sifatida ro'yxatdan o'tgan har bir yuridik shaxs yoki yakka tartibdagi tadbirkor o'zining <strong>STIR (INN)</strong>, savdo markazidagi do'kon manzili va rasmiy sertifikat/kafolat shartlarini ko'rsatishi shart.
          </p>
          <p>
            3.2. Barcha yangi do'konlar va ularning dastlabki tovar takliflari moderator (administrator) tomonidan 24 soat ichida tekshiriladi (KYB — Know Your Business).
          </p>
          <p>
            3.3. <strong>Haqiqiy narx kafolati:</strong> Sotuvchi kiritgan narxlar xaridor do'konga murojaat qilgan vaqtda haqiqiy bo'lishi shart. Soxta, ataylab past ko'rsatilgan yoki aldovli narxlarni kiritgan sotuvchilar hisobi ogohlantirishsiz bloklanadi.
          </p>
          <p>
            3.4. Sotuvchilar uchun platformada mahsulotlarni katalogga joylash va narxlarni boshqarish <strong>100% bepul</strong> taqdim etiladi.
          </p>
        </div>
      )
    },
    {
      id: 'ai-disclaimer',
      num: '4',
      title: "Sun'iy Intellekt (AI Advisor) xulosalari va tavsiyalari",
      content: (
        <div className="space-y-3">
          <p>
            4.1. "Milliy Narx" AI Maslahatchisi va Bozor Tahlili modullari yirik tildagi neyrotarmoqlar va real vaqtli bozor statistikasi asosida generatsiya qilinadi.
          </p>
          <p>
            4.2. AI bergan tavsiyalar, narx dinamikasi prognozlari va bozor xulosalari faqat <strong>axborot-tahliliy xarakterga ega</strong> bo'lib, to'g'ridan-to'g'ri moliyaviy yoki qat'iy investitsion kafolat hisoblanmaydi.
          </p>
          <p>
            4.3. Foydalanuvchi har qanday yirik tovar xarididan oldin sotuvchi bilan shaxsan bog'lanib, tovar holati va shartlarini aniqlashtirish tavsiya etiladi.
          </p>
        </div>
      )
    },
    {
      id: 'pro-enterprise',
      num: '5',
      title: "Pro va Enterprise Tarif Rejalari",
      content: (
        <div className="space-y-3">
          <p>
            5.1. Platformaning bazaviy qismlari barcha xaridorlar va do'konlar uchun bepul. Kengaytirilgan tahlil (kunlik 100+ ta AI so'rovi, 5 tagacha tovar parallel taqqoslash, bozorlararo spred va arbitraj) <strong>Pro Treyder</strong> va <strong>Enterprise</strong> tariflarida taqdim etiladi.
          </p>
          <p>
            5.2. To'lovlar O'zbekiston Respublikasi milliy to'lov tizimlari (Click, Payme) yoki B2B hisob-faktura (shartnoma) orqali amalga oshiriladi.
          </p>
          <p>
            5.3. Xizmat faollashtirilgach, qonunchilikda belgilangan hollar bundan mustasno, foydalanilgan davr uchun to'lov qaytarilmaydi.
          </p>
        </div>
      )
    },
    {
      id: 'liability',
      num: '6',
      title: "Tomonlarning javobgarligi va Cheklovlar",
      content: (
        <div className="space-y-3">
          <p>
            6.1. Platforma do'konlar va xaridorlar o'rtasida tuziladigan bevosita oldi-sotdi shartnomalari, tovar yetkazib berish va kafolat majburiyatlariga uchinchi tomon sifatida aralashmaydi.
          </p>
          <p>
            6.2. Platformadan avtomatlashtirilgan zararli botlar orqali noqonuniy ma'lumotlarni so'rib olish (DDoS, ruxsatsiz agressiv scraping) qat'iyan taqiqlanadi va huquqiy javobgarlikka sabab bo'ladi.
          </p>
        </div>
      )
    },
    {
      id: 'contact',
      num: '7',
      title: "Yuridik manzil va Bog'lanish",
      content: (
        <div className="space-y-2 text-xs">
          <p>
            Foydalanish shartlari yoki platforma ishi bo'yicha har qanday savol va murojaatlar uchun:
          </p>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1 font-mono">
            <div><strong>Platforma:</strong> "Milliy Narx" B2B & B2C Price Intelligence</div>
            <div><strong>Manzil:</strong> Xorazm viloyati, Urganch shahri, O'zbekiston</div>
            <div><strong>Email:</strong> support@milliynarx.uz | legal@milliynarx.uz</div>
            <div><strong>Telegram:</strong> @milliynarxbot</div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#070B12] py-6 sm:py-10 pb-24 md:pb-16 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <NavLink to="/" className="hover:text-orange-600 transition">Bosh sahifa</NavLink>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-bold">Foydalanish shartlari</span>
        </div>

        {/* Top Hero Banner */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                <SolarIcon name="Document" size={14} />
                <span>Ommaviy Oferta & Shartnoma</span>
              </span>
              <span className="text-xs text-slate-400 font-numeric">
                Oxirgi yangilanish: {lastUpdated}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Platformadan Foydalanish Shartlari
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              "Milliy Narx" axborot-tahlil terminali orqali narxlarni solishtirish, sun'iy intellekt maslahatlaridan foydalanish va tovarlar katalogini boshqarishning huquqiy qoidalari.
            </p>

            {/* Quick Links to Privacy and Policy */}
            <div className="pt-2 flex items-center gap-3 flex-wrap text-xs">
              <NavLink
                to="/privacy"
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/50 text-slate-700 dark:text-slate-300 hover:text-orange-600 font-semibold transition flex items-center gap-1.5"
              >
                <SolarIcon name="ShieldCheck" size={14} className="text-emerald-500" />
                <span>Maxfiylik siyosati</span>
              </NavLink>
              <NavLink
                to="/policy"
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/50 text-slate-700 dark:text-slate-300 hover:text-orange-600 font-semibold transition flex items-center gap-1.5"
              >
                <SolarIcon name="Settings" size={14} className="text-orange-500" />
                <span>Xavfsizlik va Cookie siyosati</span>
              </NavLink>
            </div>
          </div>
        </div>

        {/* Content Section Cards */}
        <div className="space-y-6">
          {sections.map(sec => (
            <div
              key={sec.id}
              id={sec.id}
              className="bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4 transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs font-numeric shrink-0">
                  {sec.num}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {sec.title}
                </h2>
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {sec.content}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Trust Seal */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <SolarIcon name="ShieldCheck" size={26} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black">
                Savdo-Sanoat Palatasi va Bozor Standartlari
              </h3>
              <p className="text-xs text-orange-100 mt-0.5">
                Barcha qoidalar O'zbekiston Respublikasi Fuqarolik kodeksi va elektron tijorat me'yorlariga to'la muvofiqdir.
              </p>
            </div>
          </div>
          <NavLink
            to="/search"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition text-center shadow-md shrink-0"
          >
            Bozor Katalogiga O'tish
          </NavLink>
        </div>

      </div>
    </div>
  );
};

export default TermsPage;
