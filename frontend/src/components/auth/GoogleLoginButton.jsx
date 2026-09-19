import React, { useEffect, useRef, useState } from 'react';
import { authService } from '../../api/services';

const GoogleLoginButton = ({
  onSuccess,
  onError,
  role = 'BUYER',
  mode = 'login', // 'login' | 'register'
  className = ''
}) => {
  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const roleRef = useRef(role);

  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  roleRef.current = role;

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    let checkTimer;
    let isMounted = true;

    const handleCredentialResponse = async (response) => {
      if (!response?.credential) {
        if (isMounted) setErrorMsg("Google ma'lumotlari qabul qilinmadi");
        onErrorRef.current?.("Google ma'lumotlari qabul qilinmadi");
        return;
      }

      if (isMounted) {
        setLoading(true);
        setErrorMsg('');
      }

      try {
        const data = await authService.googleLogin({
          credential: response.credential,
          role: roleRef.current || 'BUYER'
        });

        if (data && data.access_token) {
          onSuccessRef.current?.(data.access_token, data.user);
        } else {
          throw new Error("Token olinmadi");
        }
      } catch (err) {
        console.error("Google SSO Login Error:", err);
        const detail = err.response?.data?.detail || err.message || "Google orqali tizimga kirishda xatolik yuz berdi";
        if (isMounted) setErrorMsg(detail);
        onErrorRef.current?.(detail);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const setupGoogle = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return false;

      try {
        window._gsi_callback_handler = handleCredentialResponse;

        if (!window._gsi_initialized) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (res) => window._gsi_callback_handler?.(res),
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          window._gsi_initialized = true;
        }

        buttonRef.current.innerHTML = '';

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          width: 400,
        });

        return true;
      } catch (e) {
        console.warn("GSI setup error:", e);
        return false;
      }
    };

    if (!setupGoogle()) {
      checkTimer = setInterval(() => {
        if (setupGoogle()) {
          clearInterval(checkTimer);
        }
      }, 200);
    }

    return () => {
      isMounted = false;
      if (checkTimer) clearInterval(checkTimer);
    };
  }, [clientId]);

  const handleCustomClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  const label = mode === 'register' ? "Google orqali ro'yxatdan o'tish" : "Google orqali tezkor kirish";

  return (
    <div className={`w-full ${className}`}>
      {loading ? (
        <div className="w-full py-3 px-5 bg-white dark:bg-[#151D2C] border border-slate-200/90 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 shadow-xs animate-pulse">
          <svg className="animate-spin h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Google orqali tekshirilmoqda...</span>
        </div>
      ) : (
        <div className="relative w-full rounded-2xl overflow-hidden group">
          {/* Custom Styled Button matching Telegram button exactly */}
          <button
            type="button"
            onClick={handleCustomClick}
            className="w-full py-3 px-5 bg-white dark:bg-[#151D2C] hover:bg-slate-50 dark:hover:bg-[#1A2333] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{label}</span>
          </button>

          {/* Invisible Google iframe covering the entire button to capture clicks */}
          <div 
            ref={buttonRef} 
            className="absolute inset-0 opacity-[0.001] cursor-pointer overflow-hidden flex items-center justify-center pointer-events-auto [&>div]:!w-full [&>div]:!h-full [&_iframe]:!w-full [&_iframe]:!h-full [&_iframe]:!scale-[2.5] [&_iframe]:!cursor-pointer"
            title={label}
          />
        </div>
      )}

      {errorMsg && (
        <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 text-center font-medium">
          {errorMsg}
        </div>
      )}
    </div>
  );
};

export default GoogleLoginButton;
