import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productService, adminService } from '../../api/services';
import { formatPrice } from '../../utils/formatters';
import SolarIcon from '../../components/common/SolarIcon';
import EmptyState from '../../components/common/EmptyState';
import { TableRowSkeleton } from '../../components/common/Skeleton';
import SearchAutocomplete from '../../components/common/SearchAutocomplete';
import CategoryAnalyticsHub from '../../components/analytics/CategoryAnalyticsHub';
import SellersComparisonDrawer from '../../components/common/SellersComparisonDrawer';
import { FilterIcon } from '@solar-icons/react/linear/filter';

const CATEGORY_IMAGE_MAP = {
  'smartfonlar': '/gadgetjs.png',
  'smartfonlar va gadjetlar': '/gadgetjs.png',
  'noutbuklar': '/laptop.png',
  'noutbuklar va it-uskunalar': '/laptop.png',
  'maishiy-texnika': '/texnika.png',
  'maishiy texnika': '/texnika.png',
  'televizorlar': '/tv.png',
  'televizorlar va audio': '/tv.png',
  'qurilish-mollari': '/qurilish.png',
  'qurilish mollari va xomashyo': '/qurilish.png',
  'oziq-ovqat': '/food.png',
  'oziq-ovqat va agrosanoat': '/food.png',
  'avto': '/car.png',
  'avtomobil ehtiyot qismlari': '/car.png',
  'kiyim': '/clothes.png',
  'kiyim va poyabzal': '/clothes.png',
  'mebel': '/mebel.png',
  'mebel va interyer jihozlari': '/mebel.png',
  'tekstil': '/toqimachilik.png',
  "to'qimachilik va tekstil xomashyosi": '/toqimachilik.png',
  'agro-texnika': '/qishloq.png',
  "qishloq xo'jaligi va o'g'itlar": '/qishloq.png',
  'sanoat-uskunalari': '/sanoat.png',
  'sanoat uskunalari va stanoklar': '/sanoat.png',
  'farmatsevtika': '/tibbiyot.png',
  'tibbiyot va farmatsevtika': '/tibbiyot.png',
  'kimyo-polimer': '/kimyo.png',
  'kimyo': '/kimyo.png',
  'kimyo mahsulotlari va polimerlar': '/kimyo.png'
};

const getCategoryImg = (cat) => {
  if (!cat) return '/gadgetjs.png';
  if (cat.image_url) return cat.image_url;
  const slug = (cat.slug || '').toLowerCase().trim();
  const name = (cat.name || '').toLowerCase().trim();
  return CATEGORY_IMAGE_MAP[slug] || CATEGORY_IMAGE_MAP[name] || '/gadgetjs.png';
};

const CATEGORY_PLACEHOLDER_ICONS = {
  "yoqilg'i": "GasStation", "energiya": "GasStation",
  "o'g'it": "Leaf", "agrokimyo": "Leaf",
  "oziq-ovqat": "Cup", "qishloq": "Cup",
  "qurilish": "Buildings", "metall": "Widget", "metallurgiya": "Widget",
  "moy": "WaterDrop", "surkov": "WaterDrop",
  "kimyo": "TestTube", "plastik": "Box", "polimer": "Box",
  "to'qimachilik": "Hanger", "tekstil": "Hanger", "paxta": "Leaf",
  "smartfon": "Smartphone", "telefon": "Smartphone",
  "noutbuk": "Laptop", "kompyuter": "Laptop",
  "televizor": "Monitor", "maishiy": "Fridge", "texnika": "Fridge",
  "mebel": "Armchair", "kiyim": "Hanger",
  "tibbiyot": "Heart", "farmatsevtika": "Heart",
};

function getProductIcon(categoryName) {
  if (!categoryName) return "Box";
  const lower = categoryName.toLowerCase();
  for (const [keyword, icon] of Object.entries(CATEGORY_PLACEHOLDER_ICONS)) {
    if (lower.includes(keyword)) return icon;
  }
  return "Box";
}

function ProductImg({ src, alt, categoryName, className, iconSize = 24, iconContainerClass = "w-12 h-12" }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`${iconContainerClass} rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center`}>
        <SolarIcon name={getProductIcon(categoryName)} size={iconSize} className="text-orange-400 dark:text-orange-500" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const sortParam = searchParams.get('sort') || 'relevant';
  const minPriceParam = searchParams.get('min_price') || '';
  const maxPriceParam = searchParams.get('max_price') || '';
  const locationParam = searchParams.get('location') || '';

  const [products, setProducts] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');

  // Drawer state for multi-seller comparison (Images 2 & 3)
  const [comparisonProductId, setComparisonProductId] = useState(null);

  // Mobile Bottom Sheet Filter state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filter form state
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedLocation, setSelectedLocation] = useState(locationParam);
  const [sortBy, setSortBy] = useState(sortParam);
  const [minPrice, setMinPrice] = useState(minPriceParam);
  const [maxPrice, setMaxPrice] = useState(maxPriceParam);
  const [brandSearch, setBrandSearch] = useState('');

  const activeFilterCount = (selectedCategory ? 1 : 0) + 
    (selectedLocation ? 1 : 0) + 
    (minPrice || maxPrice ? 1 : 0) + 
    (brandSearch ? 1 : 0);

  // Fetch Category Stats & All Categories on mount
  useEffect(() => {
    productService.getCategoryStats()
      .then(stats => setCategoryStats(stats))
      .catch(() => {});

    adminService.getCategories()
      .then(cats => setCategories(cats))
      .catch(() => {});
  }, []);

  // Synchronize filter inputs with URL searchParams
  useEffect(() => {
    setSearchTerm(queryParam);
    setSelectedCategory(categoryParam);
    setSortBy(sortParam);
    setMinPrice(minPriceParam);
    setMaxPrice(maxPriceParam);
    setSelectedLocation(locationParam);
  }, [queryParam, categoryParam, sortParam, minPriceParam, maxPriceParam, locationParam]);

  // Fetch Products based on current filters
  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        const params = {
          sort_by: sortBy === 'relevant' ? undefined : sortBy,
          category_id: selectedCategory || undefined,
          location: selectedLocation || undefined,
          min_price: minPrice ? parseFloat(minPrice) : undefined,
          max_price: maxPrice ? parseFloat(maxPrice) : undefined,
          limit: 60
        };

        let data = [];
        if (queryParam.trim()) {
          data = await productService.searchProducts({ q: queryParam, ...params });
        } else {
          data = await productService.getProducts(params);
        }
        setProducts(data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [queryParam, selectedCategory, selectedLocation, sortBy, minPrice, maxPrice]);

  const updateSearchFilters = (overrides = {}) => {
    const newParams = {};
    const qVal = overrides.q !== undefined ? overrides.q : searchTerm;
    const catVal = overrides.category !== undefined ? overrides.category : selectedCategory;
    const locVal = overrides.location !== undefined ? overrides.location : selectedLocation;
    const sortVal = overrides.sort !== undefined ? overrides.sort : sortBy;
    const minVal = overrides.min_price !== undefined ? overrides.min_price : minPrice;
    const maxVal = overrides.max_price !== undefined ? overrides.max_price : maxPrice;

    if (qVal && qVal.trim()) newParams.q = qVal.trim();
    if (catVal) newParams.category = catVal;
    if (locVal) newParams.location = locVal;
    if (sortVal && sortVal !== 'relevant') newParams.sort = sortVal;
    if (minVal) newParams.min_price = minVal;
    if (maxVal) newParams.max_price = maxVal;

    setSearchParams(newParams);
  };

  const handleCategorySelect = (catIdOrSlug) => {
    const newCat = selectedCategory === catIdOrSlug ? '' : catIdOrSlug;
    setSelectedCategory(newCat);
    updateSearchFilters({ category: newCat });
  };

  const handleResetFilter = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedLocation('');
    setSortBy('relevant');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams({});
  };

  // Predefined trading centers in Uzbekistan (Savdo-sanoat palatasi B2B coverage)
  const tradingHubs = [
    { name: "Barcha Bozorlar", value: "" },
    { name: "Malika Savdo Markazi", value: "Malika" },
    { name: "Abu Saxiy Majmuasi", value: "Abu Saxiy" },
    { name: "Chilonzor B2B Savdo", value: "Chilonzor" },
    { name: "O'rikzor Ulgurji", value: "O'rikzor" },
    { name: "Qo'yliq Agrosanoat", value: "Qo'yliq" },
    { name: "Navoiy Standart", value: "Navoiy" },
    { name: "Sergeli Avto Bozor", value: "Sergeli" }
  ];

  // Distinct Brands from products
  const availableBrands = Array.from(
    new Set(products.map(p => p.brand_name).filter(Boolean))
  ).filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()));

  // Active Category Details (if selected)
  const activeCatObject = categoryStats.find(c => c.id === selectedCategory || c.slug === selectedCategory) 
    || categories.find(c => c.id === selectedCategory || c.slug === selectedCategory);

  return (
    <div className="w-full max-w-[1680px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-6 pb-24 md:pb-12">
      
      {/* 1. TOP POPULAR CATEGORIES / BRANDS BAR (IMAGE 1 G2G STYLE) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse" />
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wider">
              Bozor Toifalari va Yo'nalishlar
            </h2>
          </div>
          {selectedCategory && (
            <button
              onClick={() => handleCategorySelect('')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer flex items-center gap-1 transition"
            >
              <span>Barcha toifalarni ko'rsatish</span>
              <SolarIcon name="CloseCircle" size={14} />
            </button>
          )}
        </div>

        {/* Categories Cards Row - Horizontal touch rail on mobile, grid on tablet/desktop */}
        <div className="flex sm:grid overflow-x-auto sm:overflow-visible no-scrollbar pb-2 sm:pb-0 gap-2.5 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 snap-x snap-mandatory scroll-smooth -mx-1 px-1">
          {categoryStats.map((c) => {
            const isSelected = selectedCategory === c.id || selectedCategory === c.slug;
            const catImg = getCategoryImg(c);
            return (
              <div
                key={c.id}
                onClick={() => handleCategorySelect(c.id)}
                className={`w-28 sm:w-auto shrink-0 snap-start relative group rounded-2xl p-2 sm:p-3 transition-all duration-200 cursor-pointer overflow-hidden border flex flex-col justify-between select-none active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-br from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/25 border-orange-600 ring-2 ring-orange-400/50 scale-[1.02]'
                    : 'bg-white dark:bg-[#0B0F19] hover:bg-orange-50/40 dark:hover:bg-slate-800/80 border-slate-200/90 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500 text-slate-900 dark:text-white shadow-2xs hover:shadow-md'
                }`}
              >
                {/* 3D Category Image Badge */}
                <div className={`w-full h-16 sm:h-28 rounded-xl mb-1.5 sm:mb-2 flex items-center justify-center overflow-hidden transition-all duration-300 relative ${
                  isSelected ? 'bg-black/15' : 'bg-slate-50/80 dark:bg-slate-800/60 group-hover:bg-orange-50/60 dark:group-hover:bg-slate-800'
                }`}>
                  <img
                    src={catImg}
                    alt={c.name}
                    className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-300 drop-shadow-xs"
                    loading="lazy"
                  />
                  {isSelected && (
                    <span className="absolute top-1 right-1 p-0.5 sm:p-1 bg-white text-orange-600 rounded-full shadow-md animate-in zoom-in duration-150">
                      <SolarIcon name="CheckCircle" size={13} />
                    </span>
                  )}
                </div>

                <div className="relative z-10 px-0.5">
                  <h3 className={`text-[11px] sm:text-sm font-extrabold line-clamp-1 leading-snug ${
                    isSelected ? 'text-white' : 'text-slate-900 dark:text-white group-hover:text-orange-600'
                  }`} title={c.name}>
                    {c.name}
                  </h3>
                </div>

                <div className={`text-[9px] sm:text-[11px] font-semibold mt-1 sm:mt-2 pt-1 sm:pt-1.5 border-t font-numeric relative z-10 flex items-center justify-between px-0.5 ${
                  isSelected ? 'text-white/90 border-white/20' : 'text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 group-hover:text-slate-700'
                }`}>
                  <span>{c.products_count} ta</span>
                  <SolarIcon name="ArrowRight" size={11} className={isSelected ? 'text-white/80' : 'text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-transform'} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. CATEGORY MARKET INTELLIGENCE HUB (CHAMBER OF COMMERCE TASK #19) */}
      {selectedCategory && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-300">
          <CategoryAnalyticsHub
            categoryId={selectedCategory}
            categoryName={activeCatObject?.name}
            onClose={() => handleCategorySelect('')}
          />
        </section>
      )}

      {/* 3. MAIN CATALOG & FILTER LAYOUT (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: G2G STYLE FILTERS SIDEBAR (3 cols - Hidden on Mobile) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FilterIcon size={18} className="text-orange-600" />
              <span className="font-extrabold text-slate-900 text-sm">Filtrlar</span>
            </div>
            <button
              onClick={handleResetFilter}
              className="text-xs font-semibold text-slate-500 hover:text-orange-600 transition cursor-pointer"
            >
              Tozalash
            </button>
          </div>

          {/* Category Tree Filter */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Kategoriyalar
            </span>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              <label 
                onClick={() => handleCategorySelect('')}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition ${
                  !selectedCategory ? 'bg-orange-50 text-orange-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="cat_radio"
                    checked={!selectedCategory}
                    onChange={() => handleCategorySelect('')}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <span>Barcha toifalar</span>
                </div>
                <span className="text-slate-400 font-numeric">{products.length}</span>
              </label>

              {categoryStats.map(c => {
                const isSelected = selectedCategory === c.id || selectedCategory === c.slug;
                return (
                  <label
                    key={c.id}
                    onClick={() => handleCategorySelect(c.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition ${
                      isSelected ? 'bg-orange-50 text-orange-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <input
                        type="radio"
                        name="cat_radio"
                        checked={isSelected}
                        onChange={() => handleCategorySelect(c.id)}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <img src={getCategoryImg(c)} alt="" className="w-5 h-5 object-contain rounded shrink-0" />
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span className="text-slate-400 font-numeric ml-2 shrink-0">{c.products_count}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Trading Hub / Bozor Filter */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Bozor / Savdo Majmuasi
            </span>
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                updateSearchFilters({ location: e.target.value });
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:border-orange-500 outline-none"
            >
              {tradingHubs.map(h => (
                <option key={h.value} value={h.value}>{h.name}</option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          {availableBrands.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Brendlar
              </span>
              <input
                type="text"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                placeholder="Brend bo'yicha qidirish..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none mb-2"
              />
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {availableBrands.map(b => (
                  <label
                    key={b}
                    onClick={() => {
                      const newTerm = searchTerm === b ? '' : b;
                      setSearchTerm(newTerm);
                      updateSearchFilters({ q: newTerm });
                    }}
                    className="flex items-center justify-between px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    <span>{b}</span>
                    <span className="text-slate-400 text-[11px] font-mono">
                      {products.filter(p => p.brand_name === b).length}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Narx oralig'i (so'm)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-numeric outline-none"
              />
              <span className="text-slate-400">&mdash;</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-numeric outline-none"
              />
            </div>
            <button
              onClick={() => updateSearchFilters()}
              className="w-full py-1.5 mt-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Narxni qo'llash
            </button>
          </div>
        </aside>

        {/* RIGHT COLUMN: SEARCH BAR, SORTING & PRODUCTS (9 cols) */}
        <div className="lg:col-span-9 space-y-5">
          
          {/* Top Search & Filter Bar */}
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xs space-y-2.5 sm:space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
              <div className="flex-1 w-full relative">
                <SearchAutocomplete
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSubmit={(term) => {
                    setSearchTerm(term);
                    updateSearchFilters({ q: term });
                  }}
                  variant="filter"
                  placeholder="Mahsulot nomi, model, SKU yoki toifa bo'yicha qidirish..."
                  showButton={false}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
                {/* Mobile Filter Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden px-3 sm:px-3.5 py-2 sm:py-2.5 bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
                >
                  <FilterIcon size={16} className="text-orange-600 dark:text-orange-400" />
                  <span>Filtrlar</span>
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      updateSearchFilters({ sort: e.target.value });
                    }}
                    className="px-2.5 sm:px-3 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:border-orange-500 transition-all font-medium"
                  >
                    <option value="relevant">Tavsiya etilgan</option>
                    <option value="price_asc">Arzondan qimmatga</option>
                    <option value="price_desc">Qimmatdan arzonga</option>
                    <option value="newest">Yangi takliflar</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => updateSearchFilters()}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-orange-600/20 active:scale-95 cursor-pointer"
                  >
                    <SolarIcon name="Search" size={15} />
                    <span className="hidden sm:inline">Qidirish</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Active Filter Chips Row (Mobile Native UX) */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs border-t border-slate-100 dark:border-slate-800 pt-2">
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 font-bold text-[11px] shrink-0">
                    <span>Toifa: {activeCatObject?.name || selectedCategory}</span>
                    <button type="button" onClick={() => handleCategorySelect('')} className="hover:text-orange-900 dark:hover:text-white cursor-pointer ml-0.5">
                      <SolarIcon name="Close" size={12} />
                    </button>
                  </span>
                )}
                {selectedLocation && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-[11px] shrink-0">
                    <span>Bozor: {selectedLocation}</span>
                    <button type="button" onClick={() => { setSelectedLocation(''); updateSearchFilters({ location: '' }); }} className="hover:text-blue-900 dark:hover:text-white cursor-pointer ml-0.5">
                      <SolarIcon name="Close" size={12} />
                    </button>
                  </span>
                )}
                {(minPrice || maxPrice) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] shrink-0">
                    <span>Narx: {minPrice ? formatPrice(minPrice) : '0'} &mdash; {maxPrice ? formatPrice(maxPrice) : 'max'}</span>
                    <button type="button" onClick={() => { setMinPrice(''); setMaxPrice(''); updateSearchFilters({ min_price: '', max_price: '' }); }} className="hover:text-emerald-900 dark:hover:text-white cursor-pointer ml-0.5">
                      <SolarIcon name="Close" size={12} />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 underline shrink-0 px-1 cursor-pointer"
                >
                  Hammasini tozalash
                </button>
              </div>
            )}
          </div>

          {/* Results Summary and View Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="text-xs sm:text-sm text-slate-600">
              Topilgan takliflar: <strong className="text-slate-900 font-numeric">{products.length}</strong> ta
              {selectedCategory && activeCatObject && (
                <span> &bull; Toifa: <strong className="text-orange-600">{activeCatObject.name}</strong></span>
              )}
              {queryParam && (
                <span> &bull; Qidiruv: &ldquo;<strong className="text-slate-800">{queryParam}</strong>&rdquo;</span>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition ${
                  viewMode === 'grid' ? 'bg-white text-orange-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="G2G Karta ko'rinishi (1-rasm)"
              >
                <SolarIcon name="Dashboard" size={15} />
                <span className="hidden sm:inline">Kartalar</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition ${
                  viewMode === 'table' ? 'bg-white text-orange-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Terminal jadval ko'rinishi"
              >
                <SolarIcon name="Document" size={15} />
                <span className="hidden sm:inline">Jadval</span>
              </button>
            </div>
          </div>

          {/* 4. PRODUCTS DISPLAY: GRID OR TABLE */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6">
              <table className="w-full">
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRowSkeleton key={i} columns={6} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon="Search"
              title="Ushbu parametrlar bo'yicha mahsulot topilmadi"
              description="Bazada hozircha mos keluvchi taklif topilmadi. Qidiruv so'zini yoki filtrlarni o'zgartirib ko'ring."
              actionLabel="Barcha takliflarni ko'rish"
              onAction={handleResetFilter}
            />
          ) : viewMode === 'grid' ? (
            /* G2G Style Cards Grid (IMAGE 1) - 2 columns on mobile, 3 on desktop */
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {products.map((p) => {
                const primaryImg = p.images?.find(i => i.is_primary)?.image_url || p.images?.[0]?.image_url;
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/product/${p.slug || p.id}`)}
                    className="bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-500 rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer relative active:scale-[0.98]"
                  >
                    <div>
                      {/* Product Image Box */}
                      <div className="h-32 sm:h-44 w-full bg-slate-50/70 dark:bg-slate-800/40 rounded-xl sm:rounded-2xl mb-2.5 sm:mb-3 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800 relative">
                        <ProductImg
                          src={primaryImg}
                          alt={p.name}
                          categoryName={p.category_name}
                          className="h-full w-full object-contain p-2 sm:p-3 group-hover:scale-105 transition-transform duration-200"
                          iconSize={32}
                          iconContainerClass="w-16 h-16"
                        />
                      </div>

                      {/* Title & Brand */}
                      <div className="text-[10px] sm:text-[11px] text-orange-600 dark:text-orange-400 uppercase font-bold tracking-wider mb-1 truncate">
                        {p.brand_name || 'Bozor Taklifi'}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors mb-2 leading-snug min-h-[32px] sm:min-h-[40px]">
                        {p.name}
                      </h4>

                      {/* Store Count */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                        <SolarIcon name="Shop" size={13} className="text-orange-500 shrink-0" />
                        <span>{p.sellers_count || 1} ta do'kon taklifi</span>
                      </div>
                    </div>

                    {/* Bottom Pricing & Action */}
                    <div className="pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          {(p.sellers_count || 1) > 1 ? "Boshlang'ich narx" : "Narxi"}
                        </div>
                        <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-numeric truncate">
                          {formatPrice(p.min_price || p.price)}
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 group-hover:bg-orange-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0 shadow-2xs">
                        <SolarIcon name="ArrowRight" size={14} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table Matrix View */
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
              {/* Mobile swipe hint banner */}
              <div className="sm:hidden flex items-center justify-between px-3.5 py-2 bg-slate-100/90 text-[11px] text-slate-600 border-b border-slate-200">
                <span className="flex items-center gap-1.5 font-medium">
                  <SolarIcon name="AltArrowLeft" size={13} className="text-orange-600 animate-pulse" />
                  <span>Jadvalni surib ko'ring</span>
                  <SolarIcon name="AltArrowRight" size={13} className="text-orange-600 animate-pulse" />
                </span>
                <span className="font-bold text-slate-500 font-numeric">{products.length} ta taklif</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[540px] sm:min-w-[760px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3 sm:px-4">Mahsulot</th>
                      <th className="py-3 px-3 hidden sm:table-cell">Toifa & Model</th>
                      <th className="py-3 px-3">Sotuvchi Do'kon</th>
                      <th className="py-3 px-3 hidden md:table-cell">Bozor</th>
                      <th className="py-3 px-3 sm:px-4 text-right">Narx</th>
                      <th className="py-3 px-3 sm:px-4 text-right">Harakat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {products.map((p) => {
                      const primaryImg = p.images?.find(i => i.is_primary)?.image_url || p.images?.[0]?.image_url;
                      return (
                        <tr 
                          key={p.id}
                          onClick={() => navigate(`/product/${p.slug || p.id}`)}
                          className="hover:bg-orange-50/30 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-3 sm:px-4">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                                <ProductImg
                                  src={primaryImg}
                                  alt={p.name}
                                  categoryName={p.category_name}
                                  className="w-full h-full object-contain"
                                  iconSize={18}
                                  iconContainerClass="w-9 h-9 sm:w-10 sm:h-10"
                                />
                              </div>
                              <div className="truncate max-w-[140px] sm:max-w-xs md:max-w-sm">
                                <span className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors text-xs">
                                  {p.name}
                                </span>
                                <div className="text-[10px] text-slate-400 font-mono sm:hidden">
                                  {p.category_name || p.brand_name}
                                </div>
                                {p.sku && (
                                  <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
                                    SKU: {p.sku}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 hidden sm:table-cell">
                            <div className="font-bold text-slate-800">{p.category_name || '-'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{p.model || '-'}</div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 text-xs truncate max-w-[120px] sm:max-w-none">
                              {(p.sellers_count || 1) > 1 ? `${p.sellers_count} ta do'kon` : (p.seller_name || "Bozor do'koni")}
                            </div>
                            <div className="text-[10px] text-orange-600 font-bold truncate">
                              {(p.sellers_count || 1) > 1 ? "Eng arzon taklif" : "Tasdiqlangan"}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-slate-600 font-medium hidden md:table-cell">
                            {p.location || 'Toshkent'}
                          </td>

                          <td className="py-3 px-3 sm:px-4 text-right">
                            <div className="font-black text-slate-900 text-xs sm:text-sm font-numeric whitespace-nowrap">
                              {formatPrice(p.min_price || p.price)}
                            </div>
                            {p.max_price && p.max_price > (p.min_price || p.price) && (
                              <div className="text-[9px] sm:text-[10px] text-slate-400 font-numeric whitespace-nowrap">
                                maks: {formatPrice(p.max_price)}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 sm:px-4 text-right">
                            <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setComparisonProductId(p.id);
                                }}
                                className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center gap-1 shrink-0"
                                title="Barcha do'konlar narxlarini ko'rish"
                              >
                                <SolarIcon name="Shop" size={13} />
                                <span className="hidden sm:inline">{p.sellers_count || 1} do'kon</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/product/${p.slug || p.id}`);
                                }}
                                className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] sm:text-xs font-bold transition shrink-0"
                              >
                                Batafsil
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. MULTI-SELLER COMPARISON DRAWER (IMAGES 2 & 3 STYLE) */}
      {comparisonProductId && (
        <SellersComparisonDrawer
          productId={comparisonProductId}
          onClose={() => setComparisonProductId(null)}
        />
      )}

      {/* 6. MOBILE BOTTOM-SHEET FILTER DRAWER */}
      {/* 6. MOBILE BOTTOM-SHEET FILTER DRAWER (NATIVE PULL-UP SHEET) */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-end justify-center lg:hidden animate-in fade-in duration-200">
          <div className="w-full max-h-[88vh] bg-white dark:bg-[#0B0F19] rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            {/* Sheet Handle */}
            <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto my-2 shrink-0" />

            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-[#0B0F19] z-10">
              <div className="flex items-center gap-2">
                <FilterIcon size={18} className="text-orange-600 dark:text-orange-400" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Filtrlar</h3>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition cursor-pointer"
                  >
                    Tozalash
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl cursor-pointer"
                >
                  <SolarIcon name="CloseCircle" size={22} />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
              {/* Category Filter */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                  Kategoriyalar
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCategorySelect('')}
                    className={`p-2.5 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition cursor-pointer ${
                      !selectedCategory 
                        ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-700 dark:text-orange-300 font-bold shadow-2xs' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span>Barcha toifalar</span>
                    <span className="text-slate-400 text-[10px] font-numeric">{products.length}</span>
                  </button>
                  {categoryStats.map(c => {
                    const isSelected = selectedCategory === c.id || selectedCategory === c.slug;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleCategorySelect(c.id)}
                        className={`p-2.5 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition cursor-pointer ${
                          isSelected 
                            ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-700 dark:text-orange-300 font-bold shadow-2xs' 
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <span className="truncate">{c.name}</span>
                        <span className="text-slate-400 text-[10px] font-numeric ml-1">{c.products_count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Trading Hub / Bozor Filter */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                  Bozor / Savdo Majmuasi
                </span>
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    updateSearchFilters({ location: e.target.value });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:border-orange-500 outline-none font-medium"
                >
                  {tradingHubs.map(h => (
                    <option key={h.value} value={h.value}>{h.name}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                  Narx oralig'i (so'm)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min narx"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-numeric outline-none text-slate-900 dark:text-white"
                  />
                  <span className="text-slate-400">&mdash;</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Maks narx"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-numeric outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Brand Filter */}
              {availableBrands.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    Brendlar
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {availableBrands.map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          const newTerm = searchTerm === b ? '' : b;
                          setSearchTerm(newTerm);
                          updateSearchFilters({ q: newTerm });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          searchTerm === b 
                            ? 'bg-orange-500 text-white border-orange-500' 
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Action Footer with safe bottom padding */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B0F19] sticky bottom-0 bottom-bar-safe">
              <button
                type="button"
                onClick={() => {
                  updateSearchFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white rounded-2xl text-xs font-extrabold transition shadow-md shadow-orange-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Natijalarni ko'rsatish ({products.length} ta taklif)</span>
                <SolarIcon name="ArrowRight" size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
