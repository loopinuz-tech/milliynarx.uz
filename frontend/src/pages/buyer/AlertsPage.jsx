import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertService, telegramService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice, formatDate } from '../../utils/formatters';
import SolarIcon from '../../components/common/SolarIcon';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';

export const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tgStatus, setTgStatus] = useState(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [showManualConnect, setShowManualConnect] = useState(false);
  const [manualChatId, setManualChatId] = useState('');
  const [manualUsername, setManualUsername] = useState('');
  const [notificationMsg, setNotificationMsg] = useState(null);

  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const showToast = (type, text) => {
    setNotificationMsg({ type, text });
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  async function loadData() {
    try {
      setLoading(true);
      const [alertsData, connData] = await Promise.all([
        alertService.getAlerts().catch(() => []),
        telegramService.getConnection().catch(() => null)
      ]);
      setAlerts(alertsData || []);
      setTgStatus(connData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleCheckConnection = async () => {
    try {
      setTgLoading(true);
      const data = await telegramService.getConnection();
      setTgStatus(data);
      if (data?.connected) {
        showToast('success', "Telegram hisobingiz muvaffaqiyatli bog'langan!");
      } else {
        showToast('info', "Hozircha bog'lanish topilmadi. Botda 'Start' tugmasini bosganingizga ishonch hosil qiling.");
      }
    } catch (err) {
      showToast('error', "Bog'lanishni tekshirishda xatolik");
    } finally {
      setTgLoading(false);
    }
  };

  const handleManualConnect = async (e) => {
    e.preventDefault();
    if (!manualChatId.trim()) {
      showToast('error', "Telegram Chat ID kiritilishi shart!");
      return;
    }
    try {
      setTgLoading(true);
      const res = await telegramService.connectManual(manualChatId.trim(), manualUsername.trim() || null);
      showToast('success', res.message || "Telegram muvaffaqiyatli bog'landi!");
      setShowManualConnect(false);
      setManualChatId('');
      setManualUsername('');
      const updated = await telegramService.getConnection();
      setTgStatus(updated);
    } catch (err) {
      showToast('error', err.response?.data?.detail || "Qo'lda ulashda xatolik yuz berdi");
    } finally {
      setTgLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Rostdan ham Telegram hisobingizni uzmoqchimisiz?")) return;
    try {
      setTgLoading(true);
      await telegramService.disconnect();
      showToast('info', "Telegram hisobi uzildi.");
      const updated = await telegramService.getConnection();
      setTgStatus(updated);
    } catch (err) {
      showToast('error', "Ulanishni uzishda xatolik");
    } finally {
      setTgLoading(false);
    }
  };

  const handleSendTestAlert = async () => {
    try {
      setTestSending(true);
      const res = await telegramService.sendTestAlert();
      showToast('success', res.message || "Sinov bildirishnomasi Telegramingizga yuborildi!");
    } catch (err) {
      showToast('error', err.response?.data?.detail || "Sinov xabarini yuborishda xatolik yuz berdi");
    } finally {
      setTestSending(false);
    }
  };

  const handleTestTrigger = async (alertId) => {
    try {
      const res = await alertService.testTriggerAlert(alertId);
      showToast('success', res.message || "Narx tushishi xabari yuborildi!");
      // Refresh alerts to reflect triggered status
      const updated = await alertService.getAlerts();
      setAlerts(updated);
    } catch (err) {
      showToast('error', "Sinov bildirishnomasini yuborishda xatolik");
    }
  };

  const handleDelete = async (alertId) => {
    try {
      await alertService.deleteAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      showToast('info', "Narx ogohlantirishi o'chirildi");
    } catch (err) {
      showToast('error', "O'chirishda xatolik");
    }
  };

  const handleCheckAllAlerts = async () => {
    try {
      const res = await alertService.checkAllAlerts();
      showToast('info', `${res.checked} ta ogohlantirish tekshirildi, ${res.triggered} ta faollashdi.`);
      const updated = await alertService.getAlerts();
      setAlerts(updated);
    } catch (err) {
      showToast('error', "Tekshirishda xatolik");
    }
  };

  const botDeepLink = tgStatus?.connect_link || `https://t.me/milliynarxbot?start=link_${user?.id}`;

  if (loading) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
        <SolarIcon name="Refresh" size={24} className="animate-spin text-orange-500 mr-2" />
        Narx ogohlantirishlari va Telegram ma'lumotlari yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Toast Alert message */}
      {notificationMsg && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-lg transition-all animate-fade-in ${
          notificationMsg.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400' 
            : notificationMsg.type === 'error'
            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400'
            : 'bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-400'
        }`}>
          <div className="flex items-center gap-2">
            <SolarIcon 
              name={notificationMsg.type === 'success' ? 'CheckCircle' : notificationMsg.type === 'error' ? 'CloseCircle' : 'InfoCircle'} 
              size={18} 
            />
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="opacity-70 hover:opacity-100">
            <SolarIcon name="Close" size={14} />
          </button>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Narx ogohlantirishlari</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 font-bold font-numeric">
              {alerts.length} ta
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mahsulot narxi siz belgilagan darajaga yetganda tizim sizga Telegram va platforma orqali darhol xabar beradi
          </p>
        </div>

        {alerts.length > 0 && (
          <button
            onClick={handleCheckAllAlerts}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
          >
            <SolarIcon name="Refresh" size={14} />
            <span>Bozor narxlarini tekshirish</span>
          </button>
        )}
      </div>

      {/* TELEGRAM BOT INTEGRATION CARD */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/80 via-white to-sky-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2AABEE] to-[#229ED9] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Telegram Bot Integratsiyasi
                </h2>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/70 text-[#229ED9]">
                  @milliynarxbot
                </span>
                {tgStatus?.connected ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Ulangan {tgStatus.telegram_username ? `(${tgStatus.telegram_username})` : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Ulanmagan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                {tgStatus?.connected 
                  ? "Sizning hisobingiz Telegram bot bilan bog'langan. Tizim narx tushishi, chegirmalar va yangi aksiyalar haqidagi bildirishnomalarni bevosita Telegramingizga yetkazadi."
                  : "Narx tushishi haqidagi xabarlarni telefoningizga tezkor push-xabar ko'rinishida olish uchun profilingizni @milliynarxbot ga ulang."
                }
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto shrink-0">
            {tgStatus?.connected ? (
              <>
                <button
                  onClick={handleSendTestAlert}
                  disabled={testSending}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 active:scale-95 transition disabled:opacity-50"
                  title="Telegramga sinov xabari yuborish"
                >
                  <SolarIcon name={testSending ? "Refresh" : "Bell"} size={14} className={testSending ? "animate-spin" : ""} />
                  <span>{testSending ? "Yuborilmoqda..." : "Sinov xabari yuborish"}</span>
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={tgLoading}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 text-xs font-medium transition"
                  title="Ulanishni uzish"
                >
                  Uzish
                </button>
              </>
            ) : (
              <>
                <a
                  href={botDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2AABEE] to-[#229ED9] hover:from-[#229ED9] hover:to-[#1b88bd] text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition"
                >
                  <SolarIcon name="Send" size={14} />
                  <span>Telegramda ulash</span>
                </a>
                <button
                  onClick={handleCheckConnection}
                  disabled={tgLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition"
                >
                  <SolarIcon name="Refresh" size={14} className={tgLoading ? "animate-spin" : ""} />
                  <span>Tekshirish</span>
                </button>
                <button
                  onClick={() => setShowManualConnect(!showManualConnect)}
                  className="px-2.5 py-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showManualConnect ? "Yopish" : "ID orqali"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Optional manual connect form */}
        {showManualConnect && !tgStatus?.connected && (
          <form onSubmit={handleManualConnect} className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900/40 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Telegram Chat ID (Masalan: 123456789)
              </label>
              <input
                type="text"
                value={manualChatId}
                onChange={(e) => setManualChatId(e.target.value)}
                placeholder="ID kiriting (@userinfobot dan olish mumkin)"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Telegram Username (ixtiyoriy)
              </label>
              <input
                type="text"
                value={manualUsername}
                onChange={(e) => setManualUsername(e.target.value)}
                placeholder="@username"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={tgLoading}
                className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {tgLoading ? "Saqlanmoqda..." : "Saqlash va sinash"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ALERTS SECTION (Mobile Cards + Desktop Table) */}
      {alerts.length === 0 ? (
        <EmptyState
          icon="Bell"
          title="Faol ogohlantirishlar yo'q"
          description="Sizni qiziqtirgan mahsulot narxi arzonlashganda birinchi bo'lib bilish uchun mahsulot sahifasida 'Narx tushganda ogohlantirish' tugmasini bosing."
          actionLabel="Katalogga o'tish"
          onAction={() => navigate('/search')}
        />
      ) : (
        <div className="space-y-4 pb-20 md:pb-8">
          {/* Mobile Card Layout (< md screens) */}
          <div className="block md:hidden space-y-3">
            {alerts.map(a => (
              <div 
                key={a.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 transition hover:border-orange-300 dark:hover:border-orange-500/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div 
                    onClick={() => navigate(`/product/${a.product_slug || a.slug || a.product_id}`)}
                    className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 cursor-pointer active:text-orange-600"
                  >
                    {a.product_name || "Mahsulot"}
                  </div>
                  <Badge 
                    status={a.triggered ? 'ACTIVE' : (a.is_active ? 'PENDING' : 'ARCHIVED')}
                    text={a.triggered ? "Tushdi!" : (a.is_active ? "Faol" : "To'xtagan")}
                    size="xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Joriy narx</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 font-numeric">
                      {formatPrice(a.product_price)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Kutilgan narx</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400 font-numeric">
                      &le; {formatPrice(a.target_price)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span className="font-numeric">{formatDate(a.created_at)}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestTrigger(a.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-semibold text-xs active:scale-95 transition inline-flex items-center gap-1"
                    >
                      <SolarIcon name="Send" size={13} />
                      <span>Sinash</span>
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 active:text-rose-600 rounded-lg"
                    >
                      <SolarIcon name="CloseCircle" size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>= md screens) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px]">
                    <th className="py-3.5 px-4">Mahsulot</th>
                    <th className="py-3.5 px-4 text-right">Joriy narx</th>
                    <th className="py-3.5 px-4 text-right">Maqsadli narx</th>
                    <th className="py-3.5 px-4 text-center">Holat</th>
                    <th className="py-3.5 px-4">Yaratilgan</th>
                    <th className="py-3.5 px-4 text-right">Harakat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {alerts.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td 
                        className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-orange-600 dark:hover:text-orange-400" 
                        onClick={() => navigate(`/product/${a.product_slug || a.slug || a.product_id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <span>{a.product_name || "Mahsulot"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-numeric font-medium text-slate-900 dark:text-slate-200">
                        {formatPrice(a.product_price)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-numeric font-bold text-orange-600 dark:text-orange-400">
                        &le; {formatPrice(a.target_price)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge 
                          status={a.triggered ? 'ACTIVE' : (a.is_active ? 'PENDING' : 'ARCHIVED')}
                          text={a.triggered ? "Tushdi! (Xabar yetkazildi)" : (a.is_active ? "Kuzatilmoqda" : "To'xtatilgan")}
                          size="xs"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 dark:text-slate-500 font-numeric whitespace-nowrap">
                        {formatDate(a.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleTestTrigger(a.id)}
                            className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/60 font-medium text-[11px] transition inline-flex items-center gap-1"
                            title="Narx tushishini sinab ko'rish (Telegramga bildirishnoma jo'natish)"
                          >
                            <SolarIcon name="Send" size={12} />
                            <span>Sinov</span>
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            title="O'chirish"
                          >
                            <SolarIcon name="CloseCircle" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
