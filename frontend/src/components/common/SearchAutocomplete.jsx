import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../api/services';
import { formatPrice } from '../../utils/formatters';
import SolarIcon from './SolarIcon';

/**
 * Helper to highlight query matches in search suggestions/product titles
 */
const HighlightMatch = ({ text = '', query = '' }) => {
  if (!query || !query.trim() || !text) return <span>{text}</span>;
  const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <span key={i} className="text-orange-600 font-bold underline decoration-orange-300 underline-offset-2">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

/**
 * SearchAutocomplete Component
 * Google Search style live suggestions dropdown powered by database products,
 * brands, categories and query completions.
 */
export const SearchAutocomplete = ({
  value = '',
  onChange,
  onSubmit,
  placeholder = "Mahsulot nomi, model, brend yoki SKU kiriting...",
  variant = 'hero', // 'hero' | 'header' | 'filter' | 'mobile'
  autoFocus = false,
  className = '',
  inputClassName = '',
  buttonLabel = 'Qidirish',
  showButton = true
}) => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    query: '',
    total_matches: 0,
    products: [],
    categories: [],
    brands: [],
    suggestions: []
  });
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounced suggestion fetch
  useEffect(() => {
    let active = true;
    const trimmed = (value || '').trim();

    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const res = await productService.getSuggestions(trimmed, 6);
        if (active) {
          setData(res || {
            query: trimmed,
            total_matches: 0,
            products: [],
            categories: [],
            brands: [],
            suggestions: []
          });
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error("Autocomplete error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value]);

  // Click outside listener to dismiss
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Compute all navigable items for keyboard navigation
  const navigableItems = [
    ...(data.suggestions || []).map((s) => ({ type: 'suggestion', text: s })),
    ...(data.products || []).map((p) => ({ type: 'product', data: p })),
    ...(data.categories || []).map((c) => ({ type: 'category', data: c })),
    ...(data.brands || []).map((b) => ({ type: 'brand', data: b }))
  ];

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < navigableItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : navigableItems.length - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && navigableItems[selectedIndex]) {
        e.preventDefault();
        const selected = navigableItems[selectedIndex];
        handleSelectItem(selected);
      } else {
        // Normal form submission
        handleFormSubmit(e);
      }
    }
  };

  const handleSelectItem = (item) => {
    setIsOpen(false);
    if (item.type === 'suggestion') {
      if (onChange) onChange(item.text);
      if (onSubmit) {
        onSubmit(item.text);
      } else {
        navigate(`/search?q=${encodeURIComponent(item.text)}`);
      }
    } else if (item.type === 'product') {
      navigate(`/product/${item.data.slug || item.data.id}`);
    } else if (item.type === 'category') {
      navigate(`/search?category=${encodeURIComponent(item.data.slug || item.data.id)}`);
    } else if (item.type === 'brand') {
      navigate(`/search?q=${encodeURIComponent(item.data.name)}`);
    }
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    setIsOpen(false);
    const queryTerm = (value || '').trim();
    if (onSubmit) {
      onSubmit(queryTerm);
    } else if (queryTerm) {
      navigate(`/search?q=${encodeURIComponent(queryTerm)}`);
    } else {
      navigate('/search');
    }
  };

  const handleClear = () => {
    if (onChange) onChange('');
    if (inputRef.current) inputRef.current.focus();
  };

  // Sizing and styling presets based on variant
  const isHero = variant === 'hero';
  const isHeader = variant === 'header';
  const isFilter = variant === 'filter';
  const isMobile = variant === 'mobile';

  const containerSizes = {
    hero: 'w-full max-w-2xl',
    header: 'w-full',
    filter: 'w-full',
    mobile: 'w-full'
  }[variant];

  const inputPadding = {
    hero: 'pl-11 pr-24 py-3.5 sm:py-4 text-sm sm:text-base rounded-2xl',
    header: 'pl-10 pr-24 py-2.5 text-xs sm:text-sm rounded-xl',
    filter: 'pl-10 pr-20 py-2.5 text-sm rounded-xl',
    mobile: 'pl-9 pr-20 py-2 text-xs rounded-xl'
  }[variant];

  const iconSizes = {
    hero: 20,
    header: 17,
    filter: 18,
    mobile: 16
  }[variant];

  const hasResults =
    (data.products && data.products.length > 0) ||
    (data.suggestions && data.suggestions.length > 0) ||
    (data.categories && data.categories.length > 0) ||
    (data.brands && data.brands.length > 0);

  return (
    <div ref={containerRef} className={`relative ${containerSizes} ${className}`}>
      {/* Search Input Form */}
      <form onSubmit={handleFormSubmit} className="relative w-full flex items-center">
        {/* Search Left Icon */}
        <div className="absolute left-3.5 sm:left-4 flex items-center pointer-events-none text-slate-400">
          <SolarIcon name="Search" size={iconSizes} />
        </div>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            if (onChange) onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck="false"
          className={`
            w-full bg-slate-50 text-slate-900 placeholder:text-slate-400 border border-slate-200
            focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20
            transition-all shadow-inner
            ${inputPadding}
            ${inputClassName}
          `}
        />

        {/* Clear 'X' Button & Subtle Loading Spinner */}
        <div className="absolute right-2 sm:right-2.5 flex items-center gap-1.5 z-10">
          {loading && (
            <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mr-1" />
          )}

          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
              title="Tozalash"
            >
              <SolarIcon name="Close" size={14} />
            </button>
          )}

          {showButton && (
            <button
              type="submit"
              className={`
                bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500
                text-white font-bold transition-all flex items-center justify-center gap-1.5
                shadow-sm shadow-orange-600/20 active:scale-95 cursor-pointer shrink-0
                ${
                  isHero
                    ? 'px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm'
                    : 'px-3 py-1.5 rounded-lg text-xs font-semibold'
                }
              `}
            >
              {isHero && <SolarIcon name="Search" size={15} />}
              <span>{buttonLabel}</span>
            </button>
          )}
        </div>
      </form>

      {/* Google-like Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200/90 rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150 divide-y divide-slate-100">
          {/* Header Info Bar */}
          <div className="px-4 py-2.5 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500 border-b border-slate-100">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              {value.trim() ? "Bozordagi mos takliflar" : "Ommabop mahsulotlar va toifalar"}
            </span>
            {data.total_matches > 0 && (
              <span className="text-[11px] text-slate-400">
                Topildi: <b className="text-orange-600">{data.total_matches} ta</b>
              </span>
            )}
          </div>

          {/* 1. Google-Style Text Suggestions (Search phrase completions) */}
          {data.suggestions && data.suggestions.length > 0 && (
            <div className="py-1">
              {data.suggestions.map((suggestion, idx) => {
                const itemIndex = idx;
                const isSelected = selectedIndex === itemIndex;
                return (
                  <button
                    key={`sug-${idx}`}
                    type="button"
                    onClick={() => handleSelectItem({ type: 'suggestion', text: suggestion })}
                    className={`
                      w-full px-4 py-2 text-left flex items-center gap-3 transition-colors cursor-pointer text-xs sm:text-sm
                      ${isSelected ? 'bg-orange-50 text-orange-900' : 'hover:bg-slate-50 text-slate-700'}
                    `}
                  >
                    <SolarIcon
                      name="Search"
                      size={15}
                      className={isSelected ? 'text-orange-600' : 'text-slate-400'}
                    />
                    <div className="flex-1 truncate">
                      <HighlightMatch text={suggestion} query={value} />
                    </div>
                    <span className="text-[11px] text-slate-400 group-hover:text-slate-600">
                      Qidirish &rarr;
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. Direct Matching Products from Database */}
          {data.products && data.products.length > 0 && (
            <div className="py-2 bg-slate-50/40">
              <div className="px-4 py-1 text-[11px] font-bold tracking-wider uppercase text-slate-400">
                Mahsulotlar
              </div>
              <div className="divide-y divide-slate-100/80">
                {data.products.map((prod, idx) => {
                  const itemIndex = (data.suggestions?.length || 0) + idx;
                  const isSelected = selectedIndex === itemIndex;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleSelectItem({ type: 'product', data: prod })}
                      className={`
                        px-4 py-2.5 flex items-center gap-3 transition-colors cursor-pointer
                        ${isSelected ? 'bg-orange-50/90' : 'hover:bg-white'}
                      `}
                    >
                      {/* Product Thumbnail */}
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-2xs">
                        {prod.image_url ? (
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <SolarIcon name="Box" size={20} className="text-slate-300" />
                        )}
                      </div>

                      {/* Title, Brand/Category pill */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                          <HighlightMatch text={prod.name} query={value} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          {prod.brand_name && (
                            <span className="px-1.5 py-0.5 bg-slate-100 font-medium rounded text-slate-600">
                              {prod.brand_name}
                            </span>
                          )}
                          {prod.category_name && (
                            <span className="truncate text-slate-400">
                              {prod.category_name}
                            </span>
                          )}
                          {prod.seller_name && (
                            <span className="hidden sm:inline text-slate-400 truncate">
                              &bull; {prod.seller_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price in Uzbek So'm */}
                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-sm font-bold text-orange-600">
                          {formatPrice(prod.price)}
                        </div>
                        {prod.old_price && prod.old_price > prod.price && (
                          <div className="text-[11px] text-slate-400 line-through">
                            {formatPrice(prod.old_price)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Matching Categories & Brands */}
          {((data.categories && data.categories.length > 0) || (data.brands && data.brands.length > 0)) && (
            <div className="px-4 py-2.5 bg-white flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Bo'limlar:
              </span>
              {data.categories?.map((cat) => (
                <button
                  key={`cat-${cat.id}`}
                  type="button"
                  onClick={() => handleSelectItem({ type: 'category', data: cat })}
                  className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer border border-orange-200/60"
                >
                  <SolarIcon name="Grid" size={12} className="text-orange-500" />
                  <span>{cat.name}</span>
                </button>
              ))}

              {data.brands?.map((brand) => (
                <button
                  key={`brand-${brand.id}`}
                  type="button"
                  onClick={() => handleSelectItem({ type: 'brand', data: brand })}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <SolarIcon name="Tag" size={12} className="text-slate-500" />
                  <span>{brand.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* 4. Empty State when query returned zero matches */}
          {!hasResults && value.trim().length > 0 && !loading && (
            <div className="px-4 py-8 text-center text-slate-500">
              <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <SolarIcon name="Search" size={20} />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                Bazada "{value.trim()}" bo'yicha mahsulot topilmadi
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Boshqa kalit so'z (masalan, iPhone, Artel, Samsung) bilan qidirib ko'ring.
              </p>
            </div>
          )}

          {/* 5. Footer: View All Results */}
          {value.trim() && (
            <div className="p-2 bg-slate-50/90 text-center">
              <button
                type="button"
                onClick={handleFormSubmit}
                className="w-full py-2 px-3 text-xs font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-100/50 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>"{value.trim()}" bo'yicha barcha natijalarni ko'rish</span>
                <SolarIcon name="ChevronRight" size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
