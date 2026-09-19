import React, { useState, useEffect } from 'react';
import { adminService } from '../api/services';
import { formatDate } from '../utils/formatters';
import SolarIcon from '../components/common/SolarIcon';
import EmptyState from '../components/common/EmptyState';

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const data = await adminService.getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Audit & Xavfsizlik Jurnali
          </h1>
          <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full font-numeric">
            {logs.length} ta qayd
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500">
          Administrator va tizim amallari, status o'zgarishlari va qarorlarining o'zgarmas arxivi
        </p>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-xs sm:text-sm text-slate-400 shadow-2xs">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto mb-3" />
          <span>Audit jurnali yuklanmoqda...</span>
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon="Document"
          title="Audit qaydlari hali mavjud emas"
          description="Platformada administratorlar tomonidan statuslar o'zgartirilganda barcha amallar bu yerda qayd etiladi."
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
          {/* Mobile swipe hint banner */}
          <div className="sm:hidden flex items-center justify-between px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
            <span className="flex items-center gap-1.5 font-medium">
              <SolarIcon name="AltArrowLeft" size={13} className="text-orange-600 animate-pulse" />
              <span>Jadvalni surib ko'ring</span>
              <SolarIcon name="AltArrowRight" size={13} className="text-orange-600 animate-pulse" />
            </span>
            <span className="font-bold text-slate-500 font-numeric">{logs.length} ta qayd</span>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[760px] text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Vaqt</th>
                  <th className="py-3.5 px-4">Amal (Action)</th>
                  <th className="py-3.5 px-4">Obyekt turi</th>
                  <th className="py-3.5 px-4">Obyekt ID</th>
                  <th className="py-3.5 px-4">Yangi qiymatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-numeric text-[11px] whitespace-nowrap">
                      {formatDate(l.created_at)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/60 font-bold text-[11px]">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-sans font-medium">
                      {l.entity_type}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {l.entity_id ? `${l.entity_id.slice(0, 8)}...` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 text-[11px] max-w-xs truncate">
                      {l.new_values ? JSON.stringify(l.new_values) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;

