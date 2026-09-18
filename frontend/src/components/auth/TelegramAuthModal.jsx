import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../api/client';
import SolarIcon from '../common/SolarIcon';

export const TelegramAuthModal = ({ isOpen, onClose, onSuccess, role = 'BUYER' }) => {
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' or 'code'
  const [loadingSession, setLoadingSession] = useState(false);
  const [botUrl, setBotUrl] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [pollStatus, setPollStatus] = useState('WAITING'); // 'WAITING', 'APPROVED', 'EXPIRED'
  
  // Code entry state
  const [code, setCode] = useState('');
  const [codeSubmitting, setCodeSubmitting] = useState(false);
  const [codeError, setCodeError] = useState('');

  const pollIntervalRef = useRef(null);

  // Initialize Telegram Deep-Link session on open
  useEffect(() => {
    if (!isOpen) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setCode('');
      setCodeError('');
      setPollStatus('WAITING');
      return;
    }

    let isMounted = true;
    async function initSession() {
      try {
        setLoadingSession(true);
        const res = await apiClient.post('/auth/telegram-session', { role });
        if (isMounted && res.data) {
          setBotUrl(res.data.bot_url);
          setSessionToken(res.data.session_token);

          // Start polling
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = setInterval(async () => {
            try {
              const checkRes = await apiClient.get('/auth/telegram-session-check', {
                params: { session_token: res.data.session_token }
              });
              if (checkRes.data?.status === 'APPROVED') {
                clearInterval(pollIntervalRef.current);
                setPollStatus('APPROVED');
                if (onSuccess) {
                  onSuccess(checkRes.data.access_token, checkRes.data.user);
                }
              } else if (checkRes.data?.status === 'EXPIRED') {
                clearInterval(pollIntervalRef.current);
                setPollStatus('EXPIRED');
              }
            } catch (err) {
              console.error("Polling check failed", err);
            }
          }, 2000);
        }
      } catch (err) {
        console.error("Failed to init telegram session", err);
      } finally {
        if (isMounted) setLoadingSession(false);
      }
    }

    initSession();

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, role]);

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.trim().length < 6) {
      setCodeError("Iltimos, 6 xonali raqamli kodni to'liq kiriting");
      return;
    }

    setCodeError('');
    setCodeSubmitting(true);
    try {
      const res = await apiClient.post('/auth/telegram-code-login', {
        code: code.trim(),
        role
      });
      if (res.data?.access_token && onSuccess) {
        onSuccess(res.data.access_token, res.data.user);
      }
    } catch (err) {
      setCodeError(err.response?.data?.detail || "Kiritilgan kod noto'g'ri yoki uning muddati tugagan.");
    } finally {
      setCodeSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#0E1524] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <SolarIcon name="CloseCircle" size={20} />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#0088cc]/10 border border-[#0088cc]/30 flex items-center justify-center text-[#0088cc] shadow-xs">
            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Telegram orqali tezkor kirish
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Parolsiz va 1 soniyada xavfsiz avtorizatsiya
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-5 text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'direct'
                ? 'bg-white dark:bg-[#151D2C] text-[#0088cc] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SolarIcon name="Send" size={16} />
            <span>Bot orqali kirish</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'code'
                ? 'bg-white dark:bg-[#151D2C] text-[#0088cc] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SolarIcon name="Key" size={16} />
            <span>6-xonali kod bilan</span>
          </button>
        </div>

        {/* Tab 1: Deep Link Direct Bot Login */}
        {activeTab === 'direct' && (
          <div className="space-y-4">
            <div className="p-4 bg-sky-50/70 dark:bg-[#0A1628] border border-sky-200/80 dark:border-sky-900/40 rounded-2xl text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-sky-800 dark:text-sky-300">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0088cc] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0088cc]"></span>
                </span>
                <span>Telegram tasdig'i kutilmoqda...</span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Quyidagi tugmani bosing va botda <strong>/start</strong> tugmasini yuboring. Brauzeringiz avtomatik tarzda tizimga kiradi.
              </p>

              <a
                href={botUrl || "https://t.me/milliynarxbot"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-98"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
                </svg>
                <span>Telegram Botni ochish</span>
                <SolarIcon name="ArrowRight" size={16} />
              </a>
            </div>

            <div className="text-center">
              <span className="text-xs text-slate-400 font-mono">
                Rasmiy bot: @milliynarxbot
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: 6-Digit PIN Code Verification */}
        {activeTab === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <div>1. Telegramda <strong>@milliynarxbot</strong> ga kiring;</div>
              <div>2. Botga <strong>/kod</strong> yuboring yoki menyudan <strong>🔢 Kirish kodi</strong> ni bosing;</div>
              <div>3. Olingan 6-xonali kodni quyidagi maydonga kiriting:</div>
            </div>

            {codeError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <SolarIcon name="CloseCircle" size={15} className="shrink-0" />
                <span>{codeError}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs mb-1 text-center">
                6 xonali tasdiqlash kodi
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 px-4 bg-slate-50 dark:bg-[#151D2C] border-2 border-slate-200 dark:border-slate-700 focus:border-[#0088cc] rounded-2xl text-slate-900 dark:text-white font-bold outline-none transition-all"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={codeSubmitting || code.length < 6}
              className="w-full py-3 px-4 bg-[#0088cc] hover:bg-[#0077b5] disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
            >
              {codeSubmitting ? (
                <span>Tekshirilmoqda...</span>
              ) : (
                <>
                  <span>Kodni tasdiqlash va kirish</span>
                  <SolarIcon name="CheckCircle" size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default TelegramAuthModal;
