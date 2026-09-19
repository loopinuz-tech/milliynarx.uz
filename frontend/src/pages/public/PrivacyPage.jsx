import React from 'react';
import { NavLink } from 'react-router-dom';
import SolarIcon from '../../components/common/SolarIcon';

export const PrivacyPage = () => {
  const lastUpdated = "19-Sentabr, 2026";

  const sections = [
    {
      id: 'collection',
      num: '1',
      title: "To'planadigan shaxsiy ma'lumotlar ro'yxati",
      content: (
        <div className="space-y-3">
          <p>
            "Milliy Narx" (milliynarx.uz) foydalanuvchilarga sifatli va qulay xizmat ko'rsatish maqsadida quyidagi cheklangan hajmdagi ma'lumotlarni to'playdi:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li><strong>Hisob ma'lumotlari:</strong> Foydalanuvchi ismi, elektron pochta manzili va shifrlangan maxfiy parol.</li>
            <li><strong>Sotuvchi (Do'kon) ma'lumotlari:</strong> Yuridik yoki yakka tartibdagi tadbirkor STIR (INN), do'kon joylashgan savdo majmuasi va telefon raqami.</li>
            <li><strong>Telegram bildirishnomalari:</strong> Narx pasayishi xabarlarini yuborish uchun ixtiyoriy ravishda ulangan Telegram foydalanuvchi ID raqami.</li>
            <li><strong>Texnik ma'lumotlar:</strong> Tizim xavfsizligini ta'minlash va firibgarlikning oldini olish uchun IP-manzil, brauzer turi va kirish vaqti.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'purpose',
      num: '2',
      title: "Ma'lumotlardan foydalanish maqsadlari",
      content: (
        <div className="space-y-3">
          <p>
            Siz taqdim etgan barcha ma'lumotlar faqat quyidagi qat'iy maqsadlarda qayta ishlanadi:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <SolarIcon name="Bell" size={14} className="text-orange-500" />
                <span>Narx Signallari</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Siz kuzatuvga olgan mahsulot narxi arzonlashganda bir zumda xabar berish.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <SolarIcon name="Shield" size={14} className="text-emerald-500" />
                <span>Do'konlar Verifikatsiyasi</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Savdo majmualaridagi soxta treyderlar va yolg'on narxlar paydo bo'lishining oldini olish.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <SolarIcon name="Chart" size={14} className="text-blue-500" />
                <span>Anonim Bozor Tahlili</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                O'zbekiston hududlari bo'yicha tovarlar narxining o'rtacha dinamikasi va spredini hisoblash.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <SolarIcon name="Sparkles" size={14} className="text-purple-500" />
                <span>Shaxsiy AI Maslahatlari</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Savollaringizga aniq va qulay javob berish uchun suhbat kontekstini saqlash.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'protection',
      num: '3',
      title: "Ma'lumotlar xavfsizligi va Shifrlash",
      content: (
        <div className="space-y-3">
          <p>
            3.1. Barcha foydalanuvchi parollari bir tomonlama kriptografik xeshlar (bcrypt/argon2) orqali saqlanadi. Platforma xodimlari yoki administratorlar hech qachon sizning asl parolingizni ko'ra olmaydi.
          </p>
          <p>
            3.2. Platforma va brauzer o'rtasidagi barcha aloqa 256-bitli <strong>SSL / TLS shifrlash</strong> protokollari bilan himoyalangan.
          </p>
          <p>
            3.3. Ma'lumotlar bazasi zaxira nusxalari avtomatlashtirilgan xavfsiz serverlarda saqlanadi va begona kirishlardan to'liq himoyalangan.
          </p>
        </div>
      )
    },
    {
      id: 'third-parties',
      num: '4',
      title: "Uchinchi shaxslarga berilmaslik kafolati (Zero-Sale Policy)",
      content: (
        <div className="space-y-3">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-xs text-emerald-900 dark:text-emerald-300">
            <strong>Kafolat:</strong> "Milliy Narx" hech qanday sharoitda foydalanuvchilarning shaxsiy ma'lumotlarini (telefon, email, qidiruv tarixi) uchinchi tomon reklama agentliklariga yoki spamerlarga sotmaydi, ijaraga bermaydi va ulashmaydi.
          </div>
          <p>
            4.1. Ma'lumotlar faqat O'zbekiston Respublikasi qonunchiligida to'g'ridan-to'g'ri ko'zda tutilgan hollarda (sud qarori yoki huquqni muhofaza qiluvchi organlarning qonuniy so'rovi asosida) taqdim etilishi mumkin.
          </p>
        </div>
      )
    },
    {
      id: 'user-rights',
      num: '5',
      title: "Foydalanuvchining huquqlari va Ma'lumotlarni o'chirish",
      content: (
        <div className="space-y-3">
          <p>
            O'zbekiston Respublikasining "Shaxsga doir ma'lumotlar to'g'risida"gi Qonuniga muvofiq, har bir foydalanuvchi quyidagi huquqlarga ega:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li>O'z shaxsiy profilidagi ma'lumotlarni istalgan vaqtda ko'rish va tahrirlash;</li>
            <li>Telegram bildirishnomalari va narx signallarini bir zumda bekor qilish;</li>
            <li>O'z hisobini va barcha unga tegishli shaxsiy ma'lumotlarni butunlay o'chirib yuborishni talab qilish (Right to be Forgotten).</li>
          </ul>
          <p className="text-xs text-slate-500">
            Hisobni to'liq o'chirish uchun shaxsiy kabinetdagi sozlamalar bo'limidan yoki <code>privacy@milliynarx.uz</code> manziliga so'rov yuborish kifoya.
          </p>
        </div>
      )
    },
    {
      id: 'cookies',
      num: '6',
      title: "Cookie fayllari va Sessiyalar",
      content: (
        <div className="space-y-3">
          <p>
            Sayt tizimga kirish sessiyasini eslab qolish va siz tanlagan rejimni (masalan: Tungi/Kunduzgi rejim) saqlash uchun kichik xizmat cookie fayllaridan foydalanadi. Qo'shimcha ma'lumotlar uchun <NavLink to="/policy" className="text-orange-600 underline font-semibold">Cookie va Xavfsizlik Siyosati</NavLink> sahifasiga qarang.
          </p>
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
          <span className="text-slate-900 dark:text-white font-bold">Maxfiylik siyosati</span>
        </div>

        {/* Top Hero Banner */}
        <div className="bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                <SolarIcon name="ShieldCheck" size={14} />
                <span>O'zbekiston Qonunchiligiga Muvofiq</span>
              </span>
              <span className="text-xs text-slate-400 font-numeric">
                Oxirgi yangilanish: {lastUpdated}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Maxfiylik va Ma'lumotlar Xavfsizligi Siyosati
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              "Milliy Narx" platformasida sizning shaxsiy va biznes ma'lumotlaringiz qanday himoyalanishi, qayta ishlanishi va daxlsiz saqlanishi haqida to'liq axborot.
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
                to="/policy"
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/50 text-slate-700 dark:text-slate-300 hover:text-orange-600 font-semibold transition flex items-center gap-1.5"
              >
                <SolarIcon name="Settings" size={14} className="text-purple-500" />
                <span>Xavfsizlik & Cookie</span>
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
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs font-numeric shrink-0">
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

        {/* Bottom Trust Badge */}
        <div className="p-6 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
              <SolarIcon name="Lock" size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                O'zbekiston Respublikasi O'RQ-547-son Qonuni asosida
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Shaxsga doir ma'lumotlar bazasi O'zbekiston hududidagi serverlarda joylashgan.
              </p>
            </div>
          </div>
          <a
            href="mailto:privacy@milliynarx.uz"
            className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-orange-600 text-xs font-bold rounded-xl transition text-center shadow-2xs shrink-0"
          >
            Maxfiylik Xizmatiga Yozish
          </a>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPage;
