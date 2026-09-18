import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SolarIcon from './SolarIcon';

const DEMO_SCENARIOS = [
  {
    id: 'phone',
    icon: 'phone',
    tabLabel: 'Smartfon narxi',
    userQuery: 'iPhone 15 Pro 128GB hozir xarid qilish foydalimi yoki narxi tushishini kutaymi?',
    badge: 'Kutish tavsiya etiladi',
    badgeType: 'warning', // amber
    summary: 'Oxirgi 30 kunda narx 12,400,000 so‘mdan 11,850,000 so‘mga tushdi (-4.4%). Kelgusi 10-14 kunda yangi yetkazib berish hisobiga yana pasayishi kutilmoqda.',
    metrics: [
      { label: 'Bozor narxi', val: '11,850,000 so‘m', icon: 'tag', color: 'text-amber-600 dark:text-amber-400' },
      { label: 'Kutilayotgan tejam', val: '~350,000 so‘m', icon: 'trend', color: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'Tavsiya vaqti', val: '10-15 kunda', icon: 'clock', color: 'text-blue-600 dark:text-blue-400' }
    ]
  },
  {
    id: 'tv',
    icon: 'tv',
    tabLabel: 'Smart TV qidiruvi',
    userQuery: 'Artel 43 Smart TV eng arzon rasmiy narxi qaysi do‘konda?',
    badge: 'Xarid uchun ayni fursat',
    badgeType: 'success', // emerald
    summary: '6 ta rasmiy do‘kon va bozor narxlari tekshirildi. Eng past narx 2,890,000 so‘m bilan Texnomartda qayd etildi (bozor o‘rtacha narxidan 9% arzon).',
    metrics: [
      { label: 'Eng arzon taklif', val: '2,890,000 so‘m', icon: 'tag', color: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'O‘rtacha narx', val: '3,170,000 so‘m', icon: 'chart', color: 'text-amber-600 dark:text-amber-400' },
      { label: 'Kafolat muddati', val: '12 oy rasmiy', icon: 'shield', color: 'text-blue-600 dark:text-blue-400' }
    ]
  },
  {
    id: 'seller',
    icon: 'store',
    tabLabel: 'Sotuvchi strategiyasi',
    userQuery: 'Kiyim-kechak do‘konim bor. Yangi mavsum uchun raqobatbardosh narx qanday bo‘ladi?',
    badge: 'B2B Narx Strategiyasi',
    badgeType: 'info', // blue
    summary: 'Bozor o‘rtacha marjasi 18-22% atrofida. Boshlang‘ich aksiyada raqobatchilardan 3% arzonroq narx belgilash xaridor oqimini 40% ga oshiradi.',
    metrics: [
      { label: 'Tavsiya marja', val: '19.5%', icon: 'chart', color: 'text-blue-600 dark:text-blue-400' },
      { label: 'Bozor talabi', val: 'Yuqori (Trend)', icon: 'trend', color: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'Konversiya o‘sishi', val: '+40%', icon: 'trend', color: 'text-orange-600 dark:text-orange-400' }
    ]
  }
];

export const AiAdvisorDemo = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  // Animation lifecycle: 'typing_query' -> 'thinking' -> 'typing_response' -> 'done'
  const [stage, setStage] = useState('typing_query');
  const [displayedQuery, setDisplayedQuery] = useState('');
  const [displayedResponse, setDisplayedResponse] = useState('');

  const navigate = useNavigate();
  const current = DEMO_SCENARIOS[activeTab];

  // Switch or reset tab
  const handleTabClick = (idx) => {
    if (idx === activeTab) {
      // Replay
      setStage('typing_query');
      setDisplayedQuery('');
      setDisplayedResponse('');
    } else {
      setActiveTab(idx);
    }
  };

  // Reset states whenever tab switches
  useEffect(() => {
    setStage('typing_query');
    setDisplayedQuery('');
    setDisplayedResponse('');
  }, [activeTab]);

  // Stage 1: Typing Query character-by-character
  useEffect(() => {
    if (stage !== 'typing_query') return;
    const target = current.userQuery;

    if (displayedQuery.length < target.length) {
      const timer = setTimeout(() => {
        // Stream 2 characters per tick for fluid natural pacing
        const nextLen = Math.min(displayedQuery.length + 2, target.length);
        setDisplayedQuery(target.slice(0, nextLen));
      }, 22);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setStage('thinking');
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [stage, displayedQuery, current.userQuery]);

  // Stage 2: Thinking indicator (brief market analysis calculation)
  useEffect(() => {
    if (stage !== 'thinking') return;
    const timer = setTimeout(() => {
      setStage('typing_response');
      setDisplayedResponse('');
    }, 650);
    return () => clearTimeout(timer);
  }, [stage]);

  // Stage 3: Streaming AI response character-by-character
  useEffect(() => {
    if (stage !== 'typing_response') return;
    const target = current.summary;

    if (displayedResponse.length < target.length) {
      const timer = setTimeout(() => {
        const nextLen = Math.min(displayedResponse.length + 3, target.length);
        setDisplayedResponse(target.slice(0, nextLen));
      }, 18);
      return () => clearTimeout(timer);
    } else {
      setStage('done');
    }
  }, [stage, displayedResponse, current.summary]);

  // Stage 4: Completed, wait and auto-advance to next scenario (pause if user is hovering)
  useEffect(() => {
    if (stage !== 'done') return;
    if (isHovered) return;

    const timer = setTimeout(() => {
      setActiveTab((prev) => (prev + 1) % DEMO_SCENARIOS.length);
    }, 5500);

    return () => clearTimeout(timer);
  }, [stage, isHovered, activeTab]);

  const handleSendCustom = (e) => {
    e?.preventDefault?.();
    const query = customInput.trim() || current.userQuery;
    navigate(`/ai-advisor?q=${encodeURIComponent(query)}`);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full max-w-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden select-none transition-colors duration-200"
    >
      {/* 1. Terminal Window Header */}
      <div className="bg-slate-50/90 dark:bg-slate-950/85 px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500/80" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 ml-2">
            MilliyNarx AI Terminal
          </span>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setStage('typing_query');
              setDisplayedQuery('');
              setDisplayedResponse('');
            }}
            title="Qayta ijro etish"
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2 py-0.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 transition text-[11px] flex items-center gap-1 cursor-pointer"
          >
            <SolarIcon name="clock" size={12} />
            <span className="hidden sm:inline text-[10px] font-mono">Qayta ijro</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ONLAYN TAHLIL</span>
          </div>
        </div>
      </div>

      {/* 2. Scenario Tabs with Solar Icons (No emoji) */}
      <div className="bg-slate-100/70 dark:bg-slate-950/50 px-3 py-2 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none transition-colors">
        {DEMO_SCENARIOS.map((sc, idx) => {
          const isActive = activeTab === idx;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => handleTabClick(idx)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-600 text-white shadow-xs font-bold'
                  : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-200/70 dark:border-transparent'
              }`}
            >
              <SolarIcon name={sc.icon} size={15} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
              <span>{sc.tabLabel}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Live Chat Simulation Area */}
      <div className="p-4 sm:p-5 space-y-4 text-xs font-sans min-h-[300px] flex flex-col justify-center bg-slate-50/40 dark:bg-transparent transition-colors">
        
        {/* User Prompt (Savol yuborish) with Animated Typing */}
        <div className="flex items-start gap-3 justify-end">
          <div className="bg-orange-50/90 dark:bg-orange-500/10 border border-orange-200/90 dark:border-orange-500/30 rounded-2xl rounded-tr-xs p-3.5 text-slate-800 dark:text-slate-100 max-w-[88%] shadow-xs transition-all">
            <div className="text-[10px] font-mono text-orange-600 dark:text-orange-400 font-bold mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span>Sizning so‘rovingiz:</span>
            </div>
            <p className="text-xs sm:text-[13px] leading-relaxed font-medium text-slate-800 dark:text-slate-100 min-h-[36px]">
              "{displayedQuery}"
              {stage === 'typing_query' && (
                <span className="inline-block w-1.5 h-3.5 bg-orange-500 ml-0.5 animate-pulse align-middle" />
              )}
            </p>
          </div>
          
          <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <SolarIcon name="user" size={15} />
          </div>
        </div>

        {/* AI Market Response (Avtomatik javob olish) */}
        <div className="flex items-start gap-3 justify-start">
          <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 shadow-xs dark:shadow-md relative">
            <img src="/aiimg.png" alt="AI" className="w-full h-full object-contain" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </div>

          <div className="bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl rounded-tl-xs p-3.5 sm:p-4 text-slate-700 dark:text-slate-200 flex-1 space-y-3 shadow-xs dark:shadow-md transition-colors">
            {/* AI Header & Badge */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <SolarIcon name="sparkles" size={13} className="text-orange-500" />
                <span className="font-bold text-slate-900 dark:text-white text-xs">MilliyNarx AI Maslahatchi</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Bozor Tahlili</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                current.badgeType === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                  : current.badgeType === 'warning'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
                  : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
              }`}>
                {current.badge}
              </span>
            </div>

            {/* AI Body: Thinking shimmer or Animated Typewriter Response */}
            {stage === 'thinking' ? (
              <div className="flex items-center gap-2.5 py-3 text-xs font-mono text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">Bozor tahlili hisoblanmoqda...</span>
              </div>
            ) : stage === 'typing_query' ? (
              <div className="py-2 text-[11px] text-slate-400 dark:text-slate-500 font-mono italic">
                So‘rov kutilmoqda...
              </div>
            ) : (
              <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed font-normal min-h-[44px]">
                {displayedResponse}
                {stage === 'typing_response' && (
                  <span className="inline-block w-1.5 h-3.5 bg-orange-500 ml-0.5 animate-pulse align-middle" />
                )}
              </p>
            )}

            {/* Key Data Metrics Grid */}
            {(stage === 'typing_response' || stage === 'done') && (
              <div className={`grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 transition-all duration-500 ${
                stage === 'done' ? 'opacity-100 translate-y-0' : 'opacity-70'
              }`}>
                {current.metrics.map((m, i) => (
                  <div key={i} className="bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/50 rounded-xl p-2 text-center shadow-2xs">
                    <div className="flex items-center justify-center gap-1 text-[9px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      <SolarIcon name={m.icon} size={11} className={m.color} />
                      <span className="truncate">{m.label}</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white font-mono mt-0.5 truncate">
                      {m.val}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. Interactive Live Prompt Input Bar */}
      <form onSubmit={handleSendCustom} className="p-3 bg-slate-50/90 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 transition-colors">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-orange-500">
            <SolarIcon name="sparkles" size={14} />
          </div>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={`Masalan: "${current.userQuery.slice(0, 36)}..."`}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-colors shadow-2xs"
          />
        </div>
        <button
          type="submit"
          className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95"
        >
          <span>Tahlil</span>
          <SolarIcon name="arrowright" size={14} />
        </button>
      </form>
    </div>
  );
};

export default AiAdvisorDemo;
