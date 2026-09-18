import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { aiService } from '../../api/services';
import { formatPrice } from '../../utils/formatters';
import SolarIcon from '../../components/common/SolarIcon';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';

const SESSIONS_STORAGE_KEY = 'milliynarx_ai_sessions_v1';

export const AiAdvisorPage = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [selectedQuickProduct, setSelectedQuickProduct] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialPromptHandledRef = useRef(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          const latest = parsed[0];
          setCurrentSessionId(latest.id);
          setMessages(latest.messages || []);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
    }
  }, []);

  // Save sessions to localStorage
  const saveSessionsToStorage = (updatedSessions) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch (e) {
      console.error("Failed to save chat sessions:", e);
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input on session switch
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentSessionId]);

  const quickTopics = [
    {
      icon: "Box",
      title: "Barcha mahsulotlar jadvali",
      desc: "Bozordagi mashhur texnikalar solishtirma jadvali",
      query: "Bozordagi barcha asosiy mahsulotlar, ularning narxi, kafolati va xususiyatlarini solishtirib jadval shaklida taqdim eting."
    },
    {
      icon: "Chart",
      title: "Narxlar tendensiyasi",
      desc: "Texnika va tovarlar narxlari tendensiyasi",
      query: "Hozirgi kunda texnika bozorida narxlar o'sishi yoki pasayishi kuzatilmoqdami?"
    },
    {
      icon: "Shield",
      title: "Tejamkor xarid maslahati",
      desc: "Xarid qilish uchun eng qulay fursat",
      query: "Xarid qilishda qanday qilib pulni tejash va qulay fursatni tanlash mumkin?"
    },
    {
      icon: "Store",
      title: "Sotuvchilar uchun strategiya",
      desc: "Raqobatbardosh narx belgilash",
      query: "Men sotuvchiman. Mahsulotimga qanday qilib raqobatbardosh narx belgilashim kerak?"
    }
  ];

  // Start fresh new chat
  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInputMessage('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Switch to an existing session
  const handleSelectSession = (sessionId) => {
    const sess = sessions.find(s => s.id === sessionId);
    if (sess) {
      setCurrentSessionId(sess.id);
      setMessages(sess.messages || []);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Delete a session
  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== sessionId);
    saveSessionsToStorage(updated);

    if (currentSessionId === sessionId) {
      if (updated.length > 0) {
        setCurrentSessionId(updated[0].id);
        setMessages(updated[0].messages || []);
      } else {
        handleNewChat();
      }
    }
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (window.confirm("Barcha suhbatlar tarixini tozalashni tasdiqlaysizmi?")) {
      saveSessionsToStorage([]);
      handleNewChat();
    }
  };

  // Send message
  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage = { role: 'user', content: query, time: timeStr };
    const updatedHistory = [...messages, userMessage];

    setMessages(updatedHistory);
    setInputMessage('');
    setLoading(true);

    let activeId = currentSessionId;
    let isBrandNewSession = false;

    if (!activeId) {
      activeId = `sess-${Date.now()}`;
      isBrandNewSession = true;
      setCurrentSessionId(activeId);
    }

    try {
      // Send prior messages as history (excluding the current query which is passed as 1st argument)
      const apiHistory = messages.slice(-8).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await aiService.chat(query, apiHistory);
      
      const resNow = new Date();
      const resTimeStr = resNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const assistantMessage = {
        role: 'assistant',
        content: res.reply,
        suggested_products: res.suggested_products || [],
        time: resTimeStr
      };

      const finalMessages = [...updatedHistory, assistantMessage];
      setMessages(finalMessages);

      // Smart title automatically generated by AI or intelligent fallback
      const smartTitle = res.session_title || (query.length > 32 ? query.slice(0, 32) + '...' : query);
      
      if (isBrandNewSession) {
        const newSession = {
          id: activeId,
          title: smartTitle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: finalMessages
        };
        const updatedSessions = [newSession, ...sessions.filter(s => s.id !== activeId)];
        saveSessionsToStorage(updatedSessions);
      } else {
        const updatedSessions = sessions.map(s => {
          if (s.id === activeId) {
            return {
              ...s,
              title: res.session_title && (!s.title || s.title.includes('...')) ? res.session_title : s.title,
              updatedAt: Date.now(),
              messages: finalMessages
            };
          }
          return s;
        });
        saveSessionsToStorage(updatedSessions);
      }
    } catch (err) {
      const resNow = new Date();
      const resTimeStr = resNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const errMessage = {
        role: 'assistant',
        content: "Kechirasiz, sun'iy intellekt xizmati bilan aloqa o'rnatishda vaqtincha uzilish bo'ldi. Iltimos, qaytadan urinib ko'ring.",
        suggested_products: [],
        time: resTimeStr
      };
      setMessages(prev => [...prev, errMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Handle auto prompt from URL (e.g. from /compare page)
  useEffect(() => {
    const promptFromUrl = searchParams.get('prompt') || searchParams.get('q');
    if (promptFromUrl && !initialPromptHandledRef.current) {
      initialPromptHandledRef.current = true;
      handleSendMessage(promptFromUrl);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const handleCopy = (text, idx) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight > 180) {
      setShowScrollBottom(true);
    } else {
      setShowScrollBottom(false);
    }
  };

  const formatSessionDate = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return `${d.getDate()}.${d.getMonth() + 1}`;
  };

  return (
    <div className="w-full px-2 sm:px-4 lg:px-6 py-2 sm:py-3 h-[calc(100dvh-57px-56px)] md:h-[calc(100vh-108px)] flex flex-col min-h-0">
      {/* 1. Full-Width Top Header Strip */}
      <div className="flex items-center justify-between gap-3 pb-2 sm:pb-2.5 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* History Sidebar Toggle Button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-2xs ${
              sidebarOpen 
                ? 'bg-orange-50 border-orange-200 text-orange-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-600'
            }`}
            title={sidebarOpen ? "Suhbatlar tarixini yashirish" : "Suhbatlar tarixini ko'rsatish"}
          >
            <SolarIcon name="Sidebar" size={17} />
            <span className="hidden md:inline-block">{sidebarOpen ? "Tarixni yopish" : "Suhbatlar tarixi"}</span>
          </button>

          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 p-1 flex items-center justify-center shadow-2xs shrink-0">
            <img src="/aiimg.png" alt="AI" className="w-full h-full object-contain drop-shadow-xs" />
          </div>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 truncate">
              <span>AI Bozor Tahlilchisi</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-orange-800 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full font-sans shrink-0">
                Codexa jamoasi
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-numeric shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Jonli Bozor Tahlili
              </span>
            </h1>
          </div>
        </div>

        {/* Right action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleNewChat}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Yangi suhbat boshlash"
          >
            <SolarIcon name="Plus" size={14} />
            <span>Yangi suhbat</span>
          </button>
        </div>
      </div>

      {/* 2. Full-Width Main Workspace: Collapsible History Sidebar + Full-Width Chat Terminal */}
      <div className="w-full flex-1 min-h-0 flex items-stretch gap-3 relative">
        {/* ========================================================================= */}
        {/* LEFT SIDEBAR: SUHBATLAR TARIXI (CHAT SESSIONS HISTORY)                     */}
        {/* ========================================================================= */}
        {sidebarOpen && (
          <>
            {/* Mobile Backdrop */}
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
            />

            <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 p-3.5 flex flex-col shadow-2xl md:static md:z-auto md:w-64 sm:md:w-72 md:shrink-0 md:border md:border-slate-200/90 md:rounded-2xl sm:md:rounded-3xl md:shadow-xs h-full min-h-0 animate-in slide-in-from-left duration-200">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-800 px-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  <SolarIcon name="History" size={14} className="text-orange-600" />
                  <span>Suhbatlar</span>
                  <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-mono">
                    {sessions.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleNewChat}
                    className="p-1 rounded-lg hover:bg-orange-50 text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
                    title="Yangi suhbat"
                  >
                    <SolarIcon name="Plus" size={15} />
                  </button>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                    title="Yopish"
                  >
                    <SolarIcon name="Close" size={16} />
                  </button>
                </div>
              </div>

              {/* Sessions Scrollable List */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin">
                {sessions.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                      <SolarIcon name="Chat" size={18} />
                    </div>
                    <p className="text-xs">Hozircha saqlangan suhbatlar mavjud emas.</p>
                    <p className="text-[11px] text-slate-400">Yangi savol yozsangiz, AI uni avtomatik nomlab saqlaydi.</p>
                  </div>
                ) : (
                  sessions.map((sess) => {
                    const isActive = sess.id === currentSessionId;
                    return (
                      <div
                        key={sess.id}
                        onClick={() => handleSelectSession(sess.id)}
                        className={`group w-full p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 text-xs ${
                          isActive
                            ? 'bg-orange-50/80 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800 text-orange-950 dark:text-orange-300 font-semibold shadow-2xs'
                            : 'bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <SolarIcon 
                            name="Chat" 
                            size={14} 
                            className={isActive ? 'text-orange-600 shrink-0' : 'text-slate-400 shrink-0'} 
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs leading-tight font-medium">
                              {sess.title || 'Yangi suhbat'}
                            </p>
                            <span className="text-[10px] text-slate-400 font-numeric">
                              {formatSessionDate(sess.updatedAt)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(sess.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer shrink-0"
                          title="Suhbatni o'chirish"
                        >
                          <SolarIcon name="Trash" size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sidebar Bottom Footer: Clear All History */}
              {sessions.length > 0 && (
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 px-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleClearAllHistory}
                    className="w-full py-1.5 text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <SolarIcon name="Trash" size={13} />
                    <span>Barcha tarixni tozalash</span>
                  </button>
                </div>
              )}
            </aside>
          </>
        )}

        {/* ========================================================================= */}
        {/* RIGHT FULL-WIDTH CHAT TERMINAL                                            */}
        {/* ========================================================================= */}
        <div className="flex-1 min-w-0 bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden flex flex-col h-full relative">
          {/* Messages Scroll Area */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6 space-y-4 bg-slate-50/40 scrollbar-thin relative"
          >
            {/* Empty State / Welcome Screen */}
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-5">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-orange-50 border border-orange-200 p-2.5 flex items-center justify-center shadow-xs animate-in zoom-in-95 duration-200">
                  <img src="/aiimg.png" alt="AI" className="w-full h-full object-contain drop-shadow-sm" />
                </div>

                <div className="max-w-lg space-y-2">
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                    Codexa AI Bozor Tahlilchisi xizmatingizda
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
                    <strong>Bozor-Analitika (B2B AI Platform):</strong> Bozorlardagi real narx-navo, talab-taklif va sotuvchilar spredini real vaqtda tahlil qiluvchi aqlli savdo-axborot tizimi. Biz onlayn do'kon emasmiz — mustaqil tahlil orqali eng arzon va maqbul takliflarni taqqoslab beramiz.
                  </p>
                </div>

                {/* 4 Interactive Quick Topic Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl pt-2 text-left">
                  {quickTopics.map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(t.query)}
                      className="p-3.5 bg-white hover:bg-orange-50/70 border border-slate-200 hover:border-orange-300 rounded-2xl text-xs text-slate-700 hover:text-orange-700 transition-all shadow-2xs hover:shadow-xs cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="font-bold flex items-center justify-between mb-1">
                        <span className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-orange-100/80 text-orange-600 flex items-center justify-center">
                            <SolarIcon name={t.icon} size={14} />
                          </div>
                          <span className="truncate">{t.title}</span>
                        </span>
                        <SolarIcon name="ArrowRight" size={13} className="text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 pl-8">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Bubbles */}
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className={`flex items-start gap-2.5 max-w-[96%] sm:max-w-[88%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Assistant Avatar */}
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 p-1 shrink-0 mt-0.5 shadow-2xs">
                      <img src="/aiimg.png" alt="AI" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {/* Bubble Container */}
                  <div
                    className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed transition-all ${
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-br-xs shadow-sm font-medium whitespace-pre-wrap'
                        : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-2xs w-full'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <div>{m.content}</div>
                    ) : (
                      /* Automatic Table, Heading, Bold, Italic, and KaTeX Markdown Parser */
                      <MarkdownRenderer content={m.content} />
                    )}
                  </div>
                </div>

                {/* Action Strip under Assistant Message (Copy & Time) */}
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-3 pl-10.5 text-[11px] text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleCopy(m.content, idx)}
                      className="flex items-center gap-1 text-slate-500 hover:text-orange-700 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-200/60"
                      title="Javobdan nusxa olish"
                    >
                      <SolarIcon 
                        name={copiedIdx === idx ? "CheckCircle" : "Copy"} 
                        size={12} 
                        className={copiedIdx === idx ? "text-emerald-600" : ""} 
                      />
                      <span>{copiedIdx === idx ? "Nusxalandi!" : "Nusxa olish"}</span>
                    </button>
                    {m.time && <span>&bull; {m.time}</span>}
                  </div>
                )}

                {/* Suggested Product Cards */}
                {m.suggested_products && m.suggested_products.length > 0 && (
                  <div className="w-full max-w-[96%] sm:max-w-[88%] space-y-2 pt-1 sm:pl-10.5">
                    <div className="text-[10px] font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1">
                      <SolarIcon name="Box" size={12} />
                      <span>Bozordagi tavsiya etilgan takliflar:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {m.suggested_products.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => setSelectedQuickProduct(prod)}
                          className="p-3 bg-white border border-orange-200/90 rounded-2xl shadow-2xs hover:border-orange-500 hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-98"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                              {prod.image_url ? (
                                <img src={prod.image_url} alt="" className="w-full h-full object-contain p-1" />
                              ) : (
                                <SolarIcon name="Box" size={20} className="text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-orange-600 transition-colors">
                                {prod.name}
                              </h4>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 font-numeric">
                                <span className="font-extrabold text-orange-600">{formatPrice(prod.price)}</span>
                                <span className="truncate">&bull; {prod.seller_name || "Do'kon"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg text-[10px] font-bold group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            Ko'rish
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-3 text-slate-600 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs w-fit shadow-2xs animate-pulse">
                <div className="w-6 h-6 rounded-lg bg-orange-50 border border-orange-200 p-0.5 shrink-0">
                  <img src="/aiimg.png" alt="AI" className="w-full h-full object-contain animate-bounce" />
                </div>
                <span>AI bozor ma'lumotlarini hisoblab, jadval va xulosalar tayyorlamoqda...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Scroll to Bottom Button */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="absolute bottom-28 right-5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-orange-600 text-xs font-semibold rounded-full shadow-md flex items-center gap-1.5 transition-all animate-in fade-in cursor-pointer z-10 hover:border-orange-300"
            >
              <SolarIcon name="Down" size={13} />
              <span>Pastga</span>
            </button>
          )}

          {/* 3. Bottom Chat Input Area & Quick Chips */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0 space-y-2.5">
            {/* Quick topic suggestion chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              {quickTopics.map((topic, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(topic.query)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-xs font-semibold text-slate-600 hover:text-orange-700 whitespace-nowrap transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                >
                  <SolarIcon name={topic.icon} size={13} className="text-orange-600" />
                  <span>{topic.title}</span>
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Savolingizni yozing (masalan: Eng arzon iPhone 15 qayerda? Yoki: Barcha noutbuki jadval qilib bering)..."
                  disabled={loading}
                  className="w-full pl-4 pr-9 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors disabled:opacity-50 shadow-inner"
                />
                {inputMessage.length > 0 && !loading && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputMessage('');
                      inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Tozalash"
                  >
                    <SolarIcon name="Close" size={14} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="px-4 sm:px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-bold rounded-2xl transition-all cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5 active:scale-95"
                title="Yuborish"
              >
                <span className="hidden sm:inline-block text-xs font-semibold">Yuborish</span>
                <SolarIcon name="ArrowRight" size={16} />
              </button>
            </form>

            {/* Micro Helper Bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <img src="/aiimg.png" alt="AI" className="w-3.5 h-3.5 object-contain" />
                <span>Milliy Narx &bull; Sun'iy Intellekt Maslahatchisi</span>
              </span>
              <span className="text-slate-400 hidden sm:inline-block">
                <span className="font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-600 mr-1">Enter</span>
                yuborish
              </span>
              <span className="text-emerald-600 font-medium">100% Real bozor ma'lumotlari</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* QUICK VIEW PRODUCT MODAL (OPENS DIRECTLY INSIDE AI ADVISOR)               */}
      {/* ========================================================================= */}
      {selectedQuickProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tavsiya etilgan mahsulot</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuickProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <SolarIcon name="Close" size={18} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="w-32 h-32 sm:w-36 sm:h-36 bg-slate-50 border border-slate-100 rounded-2xl p-2.5 flex items-center justify-center shrink-0 overflow-hidden">
                {selectedQuickProduct.image_url ? (
                  <img 
                    src={selectedQuickProduct.image_url} 
                    alt={selectedQuickProduct.name} 
                    className="w-full h-full object-contain" 
                  />
                ) : (
                  <SolarIcon name="Box" size={40} className="text-slate-300" />
                )}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0 text-left">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {selectedQuickProduct.name}
                </h3>
                <div className="text-xl font-extrabold text-orange-600 font-numeric">
                  {formatPrice(selectedQuickProduct.price)}
                </div>
                <div className="text-xs text-slate-500 space-y-0.5">
                  <div>Sotuvchi: <strong>{selectedQuickProduct.seller_name || "Rasmiy do'kon"}</strong></div>
                  {selectedQuickProduct.brand && <div>Brend: <strong>{selectedQuickProduct.brand}</strong></div>}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const prod = selectedQuickProduct;
                  setSelectedQuickProduct(null);
                  handleSendMessage(`${prod.name} mahsulotining narxi ${prod.price?.toLocaleString()} so'm ekan. Ushbu mahsulot haqida xarid tahlili va bozor maslahati bering.`);
                }}
                className="flex-1 py-2.5 px-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              >
                <SolarIcon name="Sparkles" size={14} />
                <span>AI bilan tahlil qilish</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigate(`/product/${selectedQuickProduct.slug || selectedQuickProduct.id}`);
                }}
                className="py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <span>Batafsil ko'rish</span>
                <SolarIcon name="ArrowRight" size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAdvisorPage;
