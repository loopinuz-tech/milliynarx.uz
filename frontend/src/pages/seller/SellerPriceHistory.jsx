import React, { useState, useEffect } from 'react';
import { sellerService } from '../../api/services';
import { formatPrice, formatDate, formatPercent } from '../../utils/formatters';
import SolarIcon from '../../components/common/SolarIcon';
import EmptyState from '../../components/common/EmptyState';

export const SellerPriceHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const data = await sellerService.getPriceHistory();
        setHistory(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  if (loading) {
    return <div className="w-full p-8 text-center text-xs text-slate-400">Narx tarixi yuklanmoqda...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Narxlar tarixi jurnali ({history.length} ta yozuv)
        </h1>
        <p className="text-xs text-slate-500">
          Mahsulotlaringiz bo'yicha kiritilgan barcha narx o'zgarishlari vaqt ketma-ketligida saqlanadi
        </p>
      </div>

      {history.length === 0 ? (
        <EmptyState
          icon="Tag"
          title="Narx o'zgarishlari hali mavjud emas"
          description="Katalogdagi mahsulot narxini o'zgartirganingizda, har bir o'zgarish foiz va miqdor bilan birgalikda bu yerda saqlanadi."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">Qayd etilgan vaqt</th>
                <th className="py-3 px-4 text-right">Yangi narx</th>
                <th className="py-3 px-4 text-right">Oldingi narx</th>
                <th className="py-3 px-4 text-right">Farq (So'm)</th>
                <th className="py-3 px-4 text-right">O'zgarish foizi</th>
                <th className="py-3 px-4 text-center">Manba</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {history.map(h => (
                <tr key={h.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-numeric text-slate-600">
                    {formatDate(h.recorded_at)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 font-numeric">
                    {formatPrice(h.price)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 font-numeric">
                    {h.old_price ? formatPrice(h.old_price) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-numeric font-medium">
                    {h.change_amount ? (
                      <span className={h.change_amount < 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {h.change_amount > 0 ? '+' : ''}{formatPrice(h.change_amount)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-numeric font-semibold">
                    {h.change_percent ? (
                      <span className={h.change_percent < 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {formatPercent(h.change_percent)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-center text-[11px] font-mono text-slate-400">
                    {h.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SellerPriceHistory;
