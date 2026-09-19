import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../../api/services';
import SolarIcon from './SolarIcon';
import { formatPrice } from '../../utils/formatters';
import ProductImg from './ProductImg';

export const AiAdvisorModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeProductId, setActiveProductId] = useState(null);
  const [activeProductName, setActiveProductName] = useState('');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Listen to global open event
  useEffect(() => {
    const handleOpenEvent = (e) => {
      setIsOpen(true);
      if (e.detail?.productId) {
        setActiveProductId(e.detail.productId);
        setActiveProductName(e.detail.productName || '');
      }
      if (e.detail?.initialMessage) {
        handleSendMessage(e.detail.initialMessage, e.detail.productId);
      }
    };

    window.addEventListener('open-ai-advisor', handleOpenEvent);
    return () => window.removeEventListener('open-ai-advisor', handleOpenEvent);
  }, [messages]);

  const quickPrompts = [
    { icon: "Box", label: "Eng arzon telefonlar qayerda?", query: "Bozorda eng arzon telefon qaysi va qayerdan olish mumkin?" },
    { icon: "Chart", label: "Narxlar tendensiyasi", query: "Hozirgi kunda texnika bozorida narxlar o'sishi yoki pasayishi kuzatilmoqdami?" },
    { icon: "Shield", label: "Tejamkor xarid maslahati", query: "Xarid qilishda qanday qilib pulni tejash va qulay fursatni tanlash mumkin?" },
    { icon: "Store", label: "Sotuvchi narx strategiyasi", query: "Men sotuvchiman. Mahsulotimga qanday qilib raqobatbardosh narx belgilashim kerak?" }
  ];

  const handleSendMessage = async (textToSend = null, prodId = null) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    const currentProductId = prodId !== null ? prodId : activeProductId;

    // Append user message
    const newHistory = [
      ...messages,
      { role: 'user', content: query }
    ];
    setMessages(newHistory);
    setInputMessage('');
    setLoading(true);

    try {
      // Build API history payload (last 5 messages)
      const apiHistory = newHistory.slice(-5).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await aiService.chat(query, apiHistory, currentProductId);
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          suggested_products: res.suggested_products || []
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Kechirasiz, sun'iy intellekt xizmati bilan aloqa o'rnatishda vaqtincha xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
          suggested_products: [],
          model_used: 'Xatolik'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setActiveProductId(null);
    setActiveProductName('');
  };

  const formatTextWithHighlights = (text) => {
    if (!text) return '';
    // Process markdown-style bold and list markers
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let formatted = line;
      // Bold replace
      const parts = formatted.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={idx} className={`${line.trim().startsWith('•') || line.trim().startsWith('-') ? 'pl-2 py-0.5' : 'py-0.5'}`}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </div>
      );
    });
  };

  return (
    <>
      {/* 1. Floating Trigger Button (Bottom Right) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-40 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xl shadow-orange-600/30 hover:shadow-orange-600/50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border border-white/20"
            title="Milliy Narx AI Maslahatchisi"
          >
            {/* Glowing flame aura */}
            <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 opacity-40 blur-md group-hover:opacity-75 transition duration-300 -z-10" />
            
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center p-0.5">
              <img src="/aiimg.png" alt="AI" className="w-full h-full object-contain" />
            </div>
            <span>AI Maslahatchi</span>
          </button>
        </div>
      )}

      {/* 2. Interactive AI Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[94vw] sm:w-[440px] h-[85vh] sm:h-[620px] max-h-[700px] bg-white dark:bg-[#0B0F19] rounded-3xl shadow-2xl border border-orange-200/90 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white px-5 py-4 flex items-center justify-between shrink-0 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shadow-inner p-1">
                <img src="/aiimg.png" alt="AI" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-extrabold tracking-tight">Milliy Narx AI</h3>
                </div>
                <p className="text-[11px] text-orange-100 font-medium">
                  {activeProductName ? `Mahsulot tahlili: ${activeProductName.slice(0, 22)}...` : "Jonli O'zbekiston bozor tahlilchisi"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 relative z-10">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/ai-advisor');
                }}
                className="p-1.5 text-orange-100 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                title="Alohida sahifaga o'tish"
              >
                <SolarIcon name="ArrowRight" size={16} />
              </button>
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="p-1.5 text-orange-100 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                  title="Suhbatni tozalash"
                >
                  <SolarIcon name="Trash" size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-orange-100 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                title="Yopish"
              >
                <SolarIcon name="Close" size={18} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70 dark:bg-[#0D1424] scrollbar-thin">
            {/* Empty State / Welcome Screen */}
            {messages.length === 0 && (
              <div className="py-6 px-2 flex flex-col items-center text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-orange-100/80 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60 flex items-center justify-center shadow-sm p-1.5">
                  <img src="/aiimg.png" alt="AI" className="w-full h-full object-contain drop-shadow-xs" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    Assalomu alaykum!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Men O'zbekistonning 1-mustaqil narx tahlil platformasi Sun'iy Intellekt maslahatchisiman. Bozordagi narxlar va eng tejamkor xarid bo'yicha savol bering.
                  </p>
                </div>

                {/* Quick Prompts */}
                <div className="w-full space-y-2 pt-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left px-1">
                    Tezkor savollar:
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 text-left">
                    {quickPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(p.query)}
                        className="w-full p-2.5 bg-white dark:bg-[#151D2C] hover:bg-orange-50/80 dark:hover:bg-orange-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-orange-300 dark:hover:border-orange-500/50 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:text-orange-700 dark:hover:text-orange-400 font-medium transition-all shadow-2xs flex items-center justify-between group cursor-pointer"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <SolarIcon name={p.icon} size={15} className="text-orange-600 shrink-0" />
                          <span className="truncate">{p.label}</span>
                        </span>
                        <SolarIcon name="ArrowRight" size={14} className="text-slate-400 group-hover:text-orange-600 transition-transform group-hover:translate-x-0.5 shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Render Messages */}
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className={`flex items-start gap-2 max-w-[90%] sm:max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60 p-0.5 shrink-0 mt-0.5 shadow-2xs">
                      <img src="/aiimg.png" alt="AI" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-orange-600 text-white rounded-br-xs shadow-sm font-medium'
                        : 'bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <div>{m.content}</div>
                    ) : (
                      <div>{formatTextWithHighlights(m.content)}</div>
                    )}
                  </div>
                </div>

                {/* Suggested Products Cards (if any) */}
                {m.suggested_products && m.suggested_products.length > 0 && (
                  <div className="pl-8 w-full space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-400">
                      Tavsiya etilgan mahsulotlar:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.suggested_products.map((p, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => {
                            setIsOpen(false);
                            navigate(`/product/${p.slug || p.id}`);
                          }}
                          className="p-2.5 bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 hover:border-orange-500 rounded-xl transition cursor-pointer flex items-center gap-2.5 group shadow-2xs"
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 p-1 shrink-0 flex items-center justify-center">
                            <ProductImg src={p.image_url} alt={p.name} categoryName={p.category_name} className="max-h-full max-w-full object-contain" iconSize={18} iconContainerClass="w-8 h-8" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-orange-600 transition">
                              {p.name}
                            </h5>
                            <span className="text-xs font-bold text-orange-600 font-numeric">
                              {formatPrice(p.min_price || p.price)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp or spacer */}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs w-fit shadow-2xs animate-pulse">
                <div className="w-5 h-5 rounded-md bg-orange-50 border border-orange-200 p-0.5 shrink-0">
                  <img src="/aiimg.png" alt="AI" className="w-full h-full object-contain animate-bounce" />
                </div>
                <span>AI bozor ma'lumotlarini tahlil qilmoqda...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="p-3 bg-white dark:bg-[#0B0F19] border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Savolingizni yozing (masalan: Eng arzon iPhone qaysi?)..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-[#1A2234] transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="p-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:hover:bg-orange-600 text-white rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
                title="Yuborish"
              >
                <SolarIcon name="ArrowRight" size={18} />
              </button>
            </form>
            
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-numeric">
              <span>Milliy Narx &bull; Sun'iy Intellekt</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">100% Haqiqiy bozor ma'lumotlari</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiAdvisorModal;
