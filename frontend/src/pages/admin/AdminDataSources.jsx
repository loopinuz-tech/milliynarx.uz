import React, { useState, useEffect } from 'react';
import { adminService } from '../../api/services';
import SolarIcon from '../../components/common/SolarIcon';
import Badge from '../../components/common/Badge';

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
      setSources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Ma'lumot Manbalari & Adapterlar
          </h1>
          <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full font-numeric">
            {sources.length} ta manba
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Modulli tashqi bozor integratsiyalari holati. Har bir manbaning holati haqqoniy aks ettiriladi.
        </p>
      </div>

      <div className="p-4 sm:p-5 bg-orange-50/70 border border-orange-200 rounded-2xl text-xs sm:text-sm text-orange-950 leading-relaxed shadow-2xs">
        <strong className="font-bold text-orange-900">Zero Fake Data standarti:</strong> Platformada hech qanday soxta API ma'lumotlari yaratilmaydi. Manba sozlanmagan bo'lsa, holat doimo <code className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-mono text-xs">NOT_CONFIGURED</code> ko'rinishida bo'ladi. Hozirda asosiy real ma'lumotlar oqimi ro'yxatdan o'tgan rasmiy sotuvchilar orqali amalga oshirilmoqda.
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-xs sm:text-sm text-slate-400 shadow-2xs">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto mb-3" />
          <span>Manbalar holati tekshirilmoqda...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sources.map(src => (
            <div key={src.id} className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:border-orange-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                      <SolarIcon name="Database" size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">{src.name}</h3>
                      <span className="text-[11px] font-mono text-slate-400">{src.adapter_code}</span>
                    </div>
                  </div>
                  <Badge status={src.status} size="xs" />
                </div>

                <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                  {src.adapter_code === 'MANUAL_SELLER' 
                    ? "Milliy Narx platformasiga ro'yxatdan o'tgan rasmiy sotuvchilar ma'lumotlar oqimi."
                    : `${src.name} rasmiy API adapteri. Sozlash uchun rasmiy API kaliti va sertifikat talab etiladi.`}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-numeric">
                <span>Adapter: <strong className="text-slate-800 font-mono">DataSourceAdapter</strong></span>
                <span className={`font-semibold ${src.status === 'CONNECTED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {src.status === 'CONNECTED' ? 'Faol ulanish' : 'Sozlanmagan'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDataSources;
