import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import SolarIcon from '../../components/common/SolarIcon';

export const PolicyPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const lastUpdated = "19-Sentabr, 2026";

  const policies = [
    {
      id: 'cookie',
      category: 'tech',
      icon: 'Settings',
      title: "Cookie Fayllari va Sessiya Siyosati",
      summary: "Brauzerda qanday ma'lumotlar saqlanadi va ularni qanday boshqarish mumkin?",
      content: (
        <div className="space-y-3">
          <p>
            "Milliy Narx" platformasi sizga eng qulay, tezkor va moslashtirilgan interfeys taqdim etish uchun xizmat cookie-fayllari (Cookies) va mahalliy xotira (Local Storage) texnologiyalaridan foydalanadi:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="font-bold text-xs text-slate-900 dark:text-white mb-1">1. Zaruriy Cookielar</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tizimga kirish (JWT token sessiyasi) va xavfsizlik tekshiruvlari uchun xizmat qiladi. Ularsiz shaxsiy kabinet ishlamaydi.
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="font-bold text-xs text-slate-900 dark:text-white mb-1">2. Funktsional Cookielar</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Siz tanlagan interfeys rejimi (Kunduzgi / Tungi tema), til va taqqoslash uchun tanlangan tovarlar ro'yxatini eslab qoladi.
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="font-bold text-xs text-slate-900 dark:text-white mb-1">3. Tahliliy Cookielar</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Qaysi bozorlar va toifalar eng ko'p qidirilayotganini anonim tahlil qilish uchun yordam beradi.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Siz brauzeringiz sozlamalari orqali cookie-fayllarni istalgan vaqtda tozalashingiz yoki o'chirib qo'yishingiz mumkin.
          </p>
        </div>
      )
    },
    {
      id: 'ai-ethics',
      category: 'ai',
      icon: 'Sparkles',
      title: "Sun'iy Intellekt Axloqiy Kodeksi (AI Transparency & Ethics)",
      summary: "Codexa AI neyrotarmog'i qanday ishlaydi va uning xolislik prinsiplari nimalardan iborat?",
      content: (
        <div className="space-y-3">
          <p>
            "Milliy Narx" AI Maslahatchisi va bozor tahlilchisi quyidagi qat'iy axloqiy prinsiplar asosida ish yuritadi:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li><strong>Xolislik va Mustaqillik:</strong> AI biror do'kon yoki brendga sun'iy ustunlik bermaydi. Natijalar faqat haqiqiy narx, kafolat, joylashuv va xaridorlar reytingiga tayanadi.</li>
            <li><strong>Muzokaralarni Soxtalashtirmaslik:</strong> Sun'iy intellekt xulosalarida mavjud bo'lmagan tovarlar yoki yolg'on narxlar keltirilishi taqiqlanadi (anti-hallucination filtrlari mavjud).</li>
            <li><strong>Qisqa va Aniq Xulosa:</strong> Xaridor va treyderlarning vaqtini tejash uchun tahlillar ixcham, lo'nda va amaliy tilda beriladi.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'moderation',
      category: 'security',
      icon: 'Shield',
      title: "Sotuvchilar va Mahsulotlar Moderatsiyasi Siyosati",
      summary: "Katalogga kiritiladigan narxlar va do'konlar qanday tekshiriladi?",
      content: (
        <div className="space-y-3">
          <p>
            Bozordagi axborot ishonchliligini kafolatlash uchun barcha takliflar 3 bosqichli tekshiruvdan o'tadi:
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              <span className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 font-bold flex items-center justify-center shrink-0">1</span>
              <div>
                <strong className="text-slate-900 dark:text-white">STIR (INN) va Yuridik Tekshiruv:</strong> Sotuvchining Davlat soliq qo'mitasi bazasidagi ro'yxatdan o'tgan korxonasi yoki YTT maqomi tekshiriladi.
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <strong className="text-slate-900 dark:text-white">Narxlar Adekvatligi:</strong> Bozorning o'rtacha narxlariga nisbatan asossiz past (aldovli demping) yoki asossiz yuqori narxlar moderator e'tiboriga olinadi.
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 font-bold flex items-center justify-center shrink-0">3</span>
              <div>
                <strong className="text-slate-900 dark:text-white">Xaridorlar Fikr-Mulohazalari:</strong> Do'konga borib tovar olgan foydalanuvchilarning shikoyatlari bo'yicha do'kon reytingi pasaytiriladi yoki faoliyati to'xtatiladi.
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'cybersecurity',
      category: 'security',
      icon: 'Lock',
      title: "Kiberxavfsizlik va Anti-Abuse Siyosati",
      summary: "Platforma va uning foydalanuvchilari tashqi hujumlardan qanday himoyalanadi?",
      content: (
        <div className="space-y-3">
          <p>
            Platforma serverlari Cloud va Docker infratuzilmasida ishlaydi:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li><strong>Rate Limiting:</strong> Har bir IP-manzil bo'yicha daqiqalik so'rovlar limiti o'rnatilgan bo'lib, DDoS hujumlarining oldi olinadi.</li>
            <li><strong>Avtomatlashtirilgan Scraping Taqiqlanishi:</strong> API kalitisiz ommaviy ma'lumot so'rib olishga urinishlar avtomatik filtrlanadi va bloklanadi.</li>
            <li><strong>Muntazam Xavfsizlik Auditi:</strong> Baza yozuvlari va administrator amallari [AdminAuditLogs] tizimida doimiy qayd etiladi.</li>
          </ul>
        </div>
      )
    }
  ];

  const filtered = activeCategory === 'all' 
    ? policies 
    : policies.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#070B12] py-6 sm:py-10 pb-24 md:pb-16 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <NavLink to="/" className="hover:text-orange-600 transition">Bosh sahifa</NavLink>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-bold">Xavfsizlik va Siyosatlar</span>
        </div>

        {/* Top Hero Banner */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                <SolarIcon name="Settings" size={14} />
                <span>Xavfsizlik & Ishonch Markazi</span>
              </span>
              <span className="text-xs text-slate-400 font-numeric">
                Oxirgi yangilanish: {lastUpdated}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Platforma Siyosatlari va Xavfsizlik Qoidalari
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Cookie fayllaridan foydalanish, Sun'iy intellekt tahlillari shaffofligi, do'konlar moderatsiyasi va ma'lumotlar xavfsizligi standartlari.
            </p>

            {/* Quick Links */}
            <div className="pt-2 flex items-center gap-3 flex-wrap text-xs">
              <NavLink
                to="/terms"
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/50 text-slate-700 dark:text-slate-300 hover:text-orange-600 font-semibold transition flex items-center gap-1.5"
              >
                <SolarIcon name="Document" size={14} className="text-orange-500" />
                <span>Foydalanish shartlari</span>
              </NavLink>
              <NavLink
                to="/privacy"
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/50 text-slate-700 dark:text-slate-300 hover:text-orange-600 font-semibold transition flex items-center gap-1.5"
              >
                <SolarIcon name="ShieldCheck" size={14} className="text-emerald-500" />
                <span>Maxfiylik siyosati</span>
              </NavLink>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Barcha siyosatlar' },
            { id: 'tech', label: 'Cookie va Brauzer' },
            { id: 'ai', label: 'AI Axloqiy Kodeksi' },
            { id: 'security', label: 'Xavfsizlik va Moderatsiya' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-orange-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Policy Cards */}
        <div className="space-y-6">
          {filtered.map(p => (
            <div
              key={p.id}
              id={p.id}
              className="bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4 transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <SolarIcon name={p.icon} size={20} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      {p.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {p.summary}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {p.content}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Contact Help */}
        <div className="p-6 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Siyosatlar bo'yicha savollaringiz bormi?
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Bizning yuridik va xavfsizlik mutaxassislarimiz har qanday noaniqlikni hal qilishga tayyor.
            </p>
          </div>
          <a
            href="mailto:legal@milliynarx.uz"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm shadow-orange-600/20 transition active:scale-95 text-center shrink-0"
          >
            Yuridik Bo'limga Murojaat
          </a>
        </div>

      </div>
    </div>
  );
};

export default PolicyPage;
