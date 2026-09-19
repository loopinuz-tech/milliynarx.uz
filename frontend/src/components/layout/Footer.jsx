import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import SolarIcon from '../common/SolarIcon';
import { useTheme } from '../../contexts/ThemeContext';

export const Footer = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <footer className="w-full bg-white dark:bg-[#0B0F19] border-t border-slate-200/90 dark:border-slate-800 mt-auto transition-colors">
      {/* Upper Footer: Multi-Column Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8">
          
          {/* Col 1: Brand Info & Live Trust Indicators */}
          <div className="sm:col-span-2 lg:col-span-2 space-y-4">
            <NavLink to="/" className="flex items-center group py-0.5 w-fit" title="Milliy Narx">
              <img
                src={isDark ? "/topbarimgdark.png" : "/topbarnmimg.png"}
                alt="Milliy Narx"
                className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-[1.01]"
              />
            </NavLink>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              O'zbekistonning birinchi mustaqil bozor narxlari va takliflar tahlil platformasi. Hech qanday soxta chegirmalar va bo'rttirilgan sharhlarsiz, faqat rasmiy tekshirilgan sotuvchilarning real ma'lumotlari.
            </p>

            <div className="pt-1">
              <a
                href="https://t.me/milliynarxbot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800/60 rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-102"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span>Telegram Bot: @milliynarxbot</span>
              </a>
            </div>
          </div>

          {/* Col 2: Bozor & Tahlil */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <SolarIcon name="Chart" size={15} className="text-orange-600" />
              <span>Bozor & Tahlil</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <NavLink to="/" className="hover:text-orange-600 transition-colors flex items-center gap-2">
                  <SolarIcon name="Dashboard" size={13} className="text-slate-400" />
                  <span>Bozor monitoringi</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/search" className="hover:text-orange-600 transition-colors flex items-center gap-2">
                  <SolarIcon name="Search" size={13} className="text-slate-400" />
                  <span>Narx qidiruvi & tahlil</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/compare" className="hover:text-orange-600 transition-colors flex items-center gap-2">
                  <SolarIcon name="Compare" size={13} className="text-slate-400" />
                  <span>Tovarlarni taqqoslash</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/alerts" className="hover:text-orange-600 transition-colors flex items-center gap-2">
                  <SolarIcon name="Bell" size={13} className="text-slate-400" />
                  <span>Narx ogohlantirishlari</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/favorites" className="hover:text-orange-600 transition-colors flex items-center gap-2">
                  <SolarIcon name="Heart" size={13} className="text-slate-400" />
                  <span>Sevimlilar ro'yxati</span>
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Col 3: Ommabop Kategoriyalar */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <SolarIcon name="Box" size={15} className="text-orange-600" />
              <span>Kategoriyalar</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              {[
                { name: 'Smartfonlar', query: 'Smartfon' },
                { name: 'Noutbuklar', query: 'Noutbuk' },
                { name: 'Maishiy texnika', query: 'Maishiy' },
                { name: 'Televizorlar', query: 'Televizor' },
                { name: 'Barcha bo\'limlar', query: '' }
              ].map(cat => (
                <li key={cat.name}>
                  <button 
                    onClick={() => navigate(cat.query ? `/search?q=${encodeURIComponent(cat.query)}` : '/search')}
                    className="hover:text-orange-600 transition-colors flex items-center gap-2 text-left cursor-pointer"
                  >
                    <SolarIcon name="ChevronRight" size={12} className="text-slate-400" />
                    <span>{cat.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Sotuvchilar & Biznes */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <SolarIcon name="Store" size={15} className="text-orange-600" />
              <span>Sotuvchilar Uchun</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <NavLink to="/register" className="hover:text-orange-600 transition-colors flex items-center gap-2">
                  <SolarIcon name="Plus" size={13} className="text-orange-600" />
                  <span className="font-bold text-orange-600">Do'kon ro'yxatdan o'tkazish</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/seller" className="hover:text-orange-600 transition-colors flex items-center gap-2">
                  <SolarIcon name="Dashboard" size={13} className="text-slate-400" />
                  <span>Sotuvchi boshqaruv paneli</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/login" className="hover:text-orange-600 transition-colors flex items-center gap-2">
                  <SolarIcon name="User" size={13} className="text-slate-400" />
                  <span>Tizimga kirish</span>
                </NavLink>
              </li>
              <li>
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-500 leading-relaxed">
                  Har bir yangi do'kon STIR (INN) orqali administrator tomonidan tekshirilib tasdiqlanadi.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Footer: Copyright & Legal */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#070B12] py-4 pb-20 md:pb-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 dark:text-slate-200 tracking-tight">MILLIY NARX</span>
            <span>&bull;</span>
            <span className="font-numeric">&copy; {new Date().getFullYear()} Barcha huquqlar himoyalangan.</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap justify-center">
            <NavLink to="/terms" className="hover:text-orange-600 transition-colors font-medium">
              Foydalanish shartlari
            </NavLink>
            <span>&bull;</span>
            <NavLink to="/privacy" className="hover:text-orange-600 transition-colors font-medium">
              Maxfiylik siyosati
            </NavLink>
            <span>&bull;</span>
            <NavLink to="/policy" className="hover:text-orange-600 transition-colors font-medium">
              Xavfsizlik & Cookie
            </NavLink>
            <span className="hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline text-slate-400 font-mono">Xorazm, O'zbekiston</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
