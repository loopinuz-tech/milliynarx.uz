import React, { useState, useEffect } from 'react';
import { adminService } from '../api/services';
import SolarIcon from '../components/common/SolarIcon';
import Badge from '../components/common/Badge';

export const AdminDataSources = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDataSources();
  }, []);

  async function loadDataSources() {
    try {
      setLoading(true);
      const data = await adminService.getDataSources();
      setSources(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  async function handleTriggerScraper() {
    try {
      setSyncing(true);
      setSyncMsg(null);
      const res = await adminService.triggerScraperSync(5);
      setSyncMsg({
        type: 'success',
        text: `Muvaffaqiyatli scrape qilindi: ${res.scraped_total || 0} ta tovar tahlil qilindi, ${res.products_created || 0} ta yangi qo'shildi, ${res.products_updated || 0} ta yangilandi!`
      });
      await loadDataSources();
    } catch (err) {
      setSyncMsg({
        type: 'error',
        text: err.response?.data?.detail || "Skraping jarayonida xatolik yuz berdi"
      });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Ma'lumot Manbalari & Live Scraper
            </h1>
            <span className="text-xs font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 px-2.5 py-0.5 rounded-full font-numeric">
              {sources.length} ta manba
            </span>
          </div>

          {/* Quick sync button */}
          <button
            type="button"
            onClick={handleTriggerScraper}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            {syncing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Texnomart scrape qilinmoqda...</span>
              </>
            ) : (
              <>
                <SolarIcon name="clock" size={15} />
                <span>Texnomart Scraperni ishga tushirish</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Modulli tashqi bozor integratsiyalari va real vaqtdagi Web Scraper oqimlari.
        </p>
      </div>

      {/* Sync Message Notification */}
      {syncMsg && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xs border ${
          syncMsg.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
        }`}>
          <span>{syncMsg.text}</span>
          <button 
            type="button" 
            onClick={() => setSyncMsg(null)}
            className="text-xs underline font-bold cursor-pointer"
          >
            Yopish
          </button>
        </div>
      )}

      {/* Zero Fake Data Standarti Alert */}
      <div className="p-4 sm:p-5 bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 rounded-2xl text-xs sm:text-sm text-orange-950 dark:text-orange-200 leading-relaxed shadow-2xs">
        <strong className="font-bold text-orange-900 dark:text-orange-300">Zero Fake Data standarti:</strong> Platformadagi barcha narxlar va mahsulotlar real sotuvchilar va <strong className="text-orange-600 dark:text-orange-400">Texnomart.uz Live Web Scraper</strong> orqali olingan haqiqiy bozor ma'lumotlariga tayanadi.
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-12 text-center text-xs sm:text-sm text-slate-400 shadow-2xs">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto mb-3" />
          <span>Manbalar holati tekshirilmoqda...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {sources.map(src => {
            const isTexnomart = src.adapter_code === 'TEXNOMART' || src.name.toLowerCase().includes('texnomart');
            return (
              <div 
                key={src.id} 
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs transition-all ${
                  isTexnomart 
                    ? 'border-orange-400 dark:border-orange-500/70 ring-1 ring-orange-400/20' 
                    : 'border-slate-200/90 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                        isTexnomart
                          ? 'bg-orange-500 text-white border-orange-600'
                          : 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800/60'
                      }`}>
                        <SolarIcon name="Database" size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">{src.name}</h3>
                        <span className="text-[11px] font-mono text-slate-400 truncate block">{src.adapter_code}</span>
                      </div>
                    </div>
                    <Badge status={src.status} size="xs" />
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                    {isTexnomart
                      ? "Texnomart.uz rasmiy riteyleri orqali real vaqtdagi narxlar, mahsulotlar va ombordagi mavjudlikni to'g'ridan-to'g'ri scrape qiluvchi faol modul."
                      : src.adapter_code === 'MANUAL_SELLER' 
                      ? "Milliy Narx platformasiga ro'yxatdan o'tgan rasmiy sotuvchilar ma'lumotlar oqimi."
                      : `${src.name} rasmiy API adapteri. Sozlash uchun rasmiy API kaliti va sertifikat talab etiladi.`}
                  </p>

                  {isTexnomart && (
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={handleTriggerScraper}
                        disabled={syncing}
                        className="w-full py-2 px-3 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/60 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {syncing ? (
                          <>
                            <div className="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                            <span>Scrape qilinmoqda...</span>
                          </>
                        ) : (
                          <>
                            <SolarIcon name="clock" size={14} />
                            <span>Hozir yangilash (Live Scrape)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-numeric">
                  <span>
                    {src.last_sync_at ? (
                      <>Oxirgi sinxron: <strong className="text-slate-700 dark:text-slate-300 font-mono">{new Date(src.last_sync_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</strong></>
                    ) : (
                      <>Adapter: <strong className="text-slate-800 dark:text-slate-200 font-mono">DataSourceAdapter</strong></>
                    )}
                  </span>
                  <span className={`font-semibold ${src.status === 'CONNECTED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {src.status === 'CONNECTED' ? 'Faol ulanish' : 'Sozlanmagan'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDataSources;
