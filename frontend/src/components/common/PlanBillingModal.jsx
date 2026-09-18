import React, { useState } from 'react';
import apiClient from '../../api/client';
import SolarIcon from './SolarIcon';

export const PlanBillingModal = ({ isOpen, onClose, selectedPlan = 'PRO', onSuccess }) => {
  const [periodMonths, setPeriodMonths] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('click');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  if (!isOpen) return null;

  const planPrices = {
    PRO: 290000,
    ENTERPRISE: 890000
  };

  const planTitles = {
    PRO: "Pro Treyder",
    ENTERPRISE: "Enterprise"
  };

  const basePrice = planPrices[selectedPlan] || 290000;
  const discountRate = periodMonths === 12 ? 0.2 : (periodMonths === 3 ? 0.1 : 0);
  const totalPrice = Math.round(basePrice * periodMonths * (1 - discountRate));

  const formatMoney = (val) => `${val.toLocaleString()} so'm`;

  const handlePay = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await apiClient.post('/seller/plan/upgrade', {
        plan: selectedPlan,
        payment_method: paymentMethod,
        period_months: periodMonths
      });
      setSuccessResult(res.data);
      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "To'lovni amalga oshirishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <SolarIcon name="CloseCircle" size={20} />
        </button>

        {!successResult ? (
          <div className="space-y-5">
            {/* Header */}
            <div>
              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                Tarifni faollashtirish
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {planTitles[selectedPlan]} tarifi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                AI bozor tahlili, ertangi narx prognozlari va kengaytirilgan narxlarni solishtirish vositalarini faollashtiring
              </p>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Obuna muddati:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { m: 1, label: '1 oy', discount: null },
                  { m: 3, label: '3 oy', discount: '-10%' },
                  { m: 12, label: '1 yil', discount: '-20%' }
                ].map((item) => (
                  <button
                    key={item.m}
                    type="button"
                    onClick={() => setPeriodMonths(item.m)}
                    className={`py-2.5 px-3 rounded-xl border text-center transition cursor-pointer relative ${
                      periodMonths === item.m
                        ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    {item.discount && (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                        {item.discount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                To'lov usulini tanlang:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Click */}
                <div
                  onClick={() => setPaymentMethod('click')}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                    paymentMethod === 'click'
                      ? 'border-[#0089d0] bg-[#0089d0]/10 text-slate-900 dark:text-white font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0089d0] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    C
                  </div>
                  <div>
                    <div className="text-xs">Click Up</div>
                    <div className="text-[10px] text-slate-400">Tezkor to'lov</div>
                  </div>
                </div>

                {/* Payme */}
                <div
                  onClick={() => setPaymentMethod('payme')}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                    paymentMethod === 'payme'
                      ? 'border-[#14B8A6] bg-[#14B8A6]/10 text-slate-900 dark:text-white font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#14B8A6] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    P
                  </div>
                  <div>
                    <div className="text-xs">Payme</div>
                    <div className="text-[10px] text-slate-400">Karta orqali</div>
                  </div>
                </div>

                {/* Uzum Bank */}
                <div
                  onClick={() => setPaymentMethod('uzum')}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                    paymentMethod === 'uzum'
                      ? 'border-[#7000FF] bg-[#7000FF]/10 text-slate-900 dark:text-white font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#7000FF] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    U
                  </div>
                  <div>
                    <div className="text-xs">Uzum Bank</div>
                    <div className="text-[10px] text-slate-400">Nasiya & To'lov</div>
                  </div>
                </div>

                {/* Bank Invoice */}
                <div
                  onClick={() => setPaymentMethod('invoice')}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                    paymentMethod === 'invoice'
                      ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/40 text-slate-900 dark:text-white font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <SolarIcon name="Document" size={16} />
                  </div>
                  <div>
                    <div className="text-xs">Invoys / Faktura</div>
                    <div className="text-[10px] text-slate-400">B2B shartnoma</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Summary Box */}
            <div className="p-4 bg-slate-50 dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Oylik narx:</span>
                <span className="font-numeric">{formatMoney(basePrice)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Muddat:</span>
                <span>{periodMonths} oy</span>
              </div>
              {discountRate > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Chegirma ({(discountRate * 100).toFixed(0)}%):</span>
                  <span className="font-numeric">-{formatMoney(Math.round(basePrice * periodMonths * discountRate))}</span>
                </div>
              )}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                <span>Jami to'lov:</span>
                <span className="text-orange-600 dark:text-orange-400 font-numeric">{formatMoney(totalPrice)}</span>
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <SolarIcon name="CloseCircle" size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Pay Button */}
            <button
              type="button"
              disabled={submitting}
              onClick={handlePay}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-orange-600/20 active:scale-98"
            >
              {submitting ? (
                <span>To'lov qabul qilinmoqda...</span>
              ) : (
                <>
                  <span>To'lash ({formatMoney(totalPrice)})</span>
                  <SolarIcon name="ArrowRight" size={16} />
                </>
              )}
            </button>
          </div>
        ) : (
          /* Payment Success Confirmation */
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <SolarIcon name="CheckCircle" size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                To'lov muvaffaqiyatli amalga oshirildi!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Do'koningiz uchun <strong>{planTitles[selectedPlan]}</strong> tarifi faollashtirildi. 
                AI bozor tahlili so'rovlari va chuqur narx monitoringi imkoniyatlari ochildi.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-[#151D2C] rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-left font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">To'lov tizimi:</span>
                <span className="font-bold uppercase text-slate-800 dark:text-slate-200">{successResult.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">To'langan summa:</span>
                <span className="font-bold text-orange-600">{formatMoney(successResult.paid_amount || totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Yangi imkoniyat:</span>
                <span className="font-bold text-emerald-600">{selectedPlan === 'ENTERPRISE' ? 'Cheksiz AI tahlil & API' : 'Kunlik 100 ta AI tahlil'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl text-xs sm:text-sm transition cursor-pointer"
            >
              Tushundim, kabinetga o'tish
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanBillingModal;
