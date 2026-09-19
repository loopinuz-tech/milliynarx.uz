import React, { useState, useEffect } from 'react';
import { adminService, uploadService } from '../../api/services';
import { formatPrice, formatDate } from '../../utils/formatters';
import SolarIcon from '../../components/common/SolarIcon';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';

const REJECTION_REASONS = [
  "Narx bozordagi narxga mos kelmaydi yoki noto'g'ri ko'rsatilgan",
  "Mahsulot tavsifi va xususiyatlari yetarli emas",
  "Rasm sifati past yoki boshqa platforma belgilari mavjud",
  "Taqiqlangan yoki litsenziyalanmagan mahsulot",
  "Kategoriya yoki brend noto'g'ri tanlangan"
];

export const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState(null);

  // Rejection Modal State
  const [rejectingProduct, setRejectingProduct] = useState(null);
  const [selectedPresetReason, setSelectedPresetReason] = useState(REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  // Product Inspection Modal State
  const [inspectedProduct, setInspectedProduct] = useState(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Delete Confirmation State
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Create Product Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sellers, setSellers] = useState([]);

  // Create Form Fields
  const [createName, setCreateName] = useState('');
  const [createCatId, setCreateCatId] = useState('');
  const [createBrandId, setCreateBrandId] = useState('');
  const [createSellerId, setCreateSellerId] = useState('');
  const [createModel, setCreateModel] = useState('');
  const [createSku, setCreateSku] = useState('');
  const [createBarcode, setCreateBarcode] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createPrice, setCreatePrice] = useState('');
  const [createOldPrice, setCreateOldPrice] = useState('');
  const [createStock, setCreateStock] = useState('10');
  const [createCondition, setCreateCondition] = useState('NEW');
  const [createLocation, setCreateLocation] = useState('Toshkent');
  const [createWarranty, setCreateWarranty] = useState('1 yil rasmiy kafolat');
  const [createDelivery, setCreateDelivery] = useState('1 kunda bepul yetkazish');
  const [createImages, setCreateImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [createSpecs, setCreateSpecs] = useState([
    { key: 'Rang', value: '' }
  ]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    loadProducts();
    adminService.getCategories().then(setCategories).catch(() => {});
    adminService.getBrands().then(setBrands).catch(() => {});
    adminService.getSellers().then(setSellers).catch(() => {});
  }, [statusFilter]);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await adminService.getProducts({ status_filter: statusFilter || undefined });
      setProducts(data || []);

      if (!statusFilter) {
        setAllProducts(data || []);
      } else {
        adminService.getProducts().then(res => setAllProducts(res || [])).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleApprove = async (product) => {
    try {
      setActionLoading(product.id);
      await adminService.updateProductStatus(product.id, 'ACTIVE');

      showNotification('success', `"${product.name}" mahsuloti muvaffaqiyatli tasdiqlandi va platformada faol bo'ldi!`);
      
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: 'ACTIVE' } : p));
      setAllProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: 'ACTIVE' } : p));
      if (inspectedProduct?.id === product.id) {
        setInspectedProduct(prev => ({ ...prev, status: 'ACTIVE' }));
      }
    } catch (err) {
      alert("Holatni yangilashda xatolik: " + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (product) => {
    setRejectingProduct(product);
    setSelectedPresetReason(REJECTION_REASONS[0]);
    setCustomReason('');
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingProduct) return;

    const finalReason = customReason.trim() 
      ? `${selectedPresetReason}. Izoh: ${customReason.trim()}`
      : selectedPresetReason;

    try {
      setActionLoading(rejectingProduct.id);
      await adminService.updateProductStatus(rejectingProduct.id, 'REJECTED', finalReason);

      showNotification('warning', `"${rejectingProduct.name}" mahsuloti rad etildi. Sabab: ${finalReason}`);

      setProducts(prev => prev.map(p => p.id === rejectingProduct.id ? { ...p, status: 'REJECTED', rejection_reason: finalReason } : p));
      setAllProducts(prev => prev.map(p => p.id === rejectingProduct.id ? { ...p, status: 'REJECTED', rejection_reason: finalReason } : p));
      if (inspectedProduct?.id === rejectingProduct.id) {
        setInspectedProduct(prev => ({ ...prev, status: 'REJECTED', rejection_reason: finalReason }));
      }
      setRejectingProduct(null);
    } catch (err) {
      alert("Rad etishda xatolik yuz berdi: " + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setDeleting(true);
      await adminService.deleteProduct(productToDelete.id);
      showNotification('success', `"${productToDelete.name}" mahsuloti muvaffaqiyatli o'chirildi.`);

      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setAllProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      if (inspectedProduct?.id === productToDelete.id) {
        setInspectedProduct(null);
      }
      setProductToDelete(null);
    } catch (err) {
      alert("O'chirishda xatolik: " + (err.response?.data?.detail || err.message));
    } finally {
      setDeleting(false);
    }
  };

  const openInspectModal = (product) => {
    setInspectedProduct(product);
    setActiveImgIndex(0);
  };

  const pendingCount = allProducts.filter(p => p.status === 'PENDING_APPROVAL').length;
  const activeCount = allProducts.filter(p => p.status === 'ACTIVE').length;
  const rejectedCount = allProducts.filter(p => p.status === 'REJECTED').length;

  const openCreateModal = () => {
    setCreateName('');
    setCreateCatId(categories[0]?.id || '');
    setCreateBrandId(brands[0]?.id || '');
    setCreateSellerId('');
    setCreateModel('');
    setCreateSku('');
    setCreateBarcode('');
    setCreateDesc('');
    setCreatePrice('');
    setCreateOldPrice('');
    setCreateStock('10');
    setCreateCondition('NEW');
    setCreateLocation('Toshkent');
    setCreateWarranty('1 yil rasmiy kafolat');
    setCreateDelivery('1 kunda bepul yetkazish');
    setCreateImages([]);
    setImageUrlInput('');
    setCreateSpecs([{ key: 'Rang', value: '' }]);
    setCreateError('');
    setIsCreateModalOpen(true);
  };

  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const res = await uploadService.uploadFile(file);
      setCreateImages(prev => [...prev, res.url]);
    } catch (err) {
      alert("Rasmni yuklashda xatolik: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setCreateImages(prev => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (idx) => {
    setCreateImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSetPrimaryImage = (idx) => {
    setCreateImages(prev => {
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.unshift(item);
      return copy;
    });
  };

  const handleAddSpec = () => {
    setCreateSpecs(prev => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpec = (idx) => {
    setCreateSpecs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx, field, val) => {
    setCreateSpecs(prev => {
      const copy = [...prev];
      copy[idx][field] = val;
      return copy;
    });
  };

  const handleCreateProductSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createName.trim()) {
      setCreateError("Iltimos, mahsulot nomini kiriting.");
      return;
    }
    if (!createPrice || parseFloat(createPrice) <= 0) {
      setCreateError("Iltimos, to'g'ri narx kiriting.");
      return;
    }

    const specObj = {};
    createSpecs.forEach(s => {
      if (s.key.trim() && s.value.trim()) {
        specObj[s.key.trim()] = s.value.trim();
      }
    });

    try {
      setSubmittingCreate(true);
      const payload = {
        name: createName.trim(),
        category_id: createCatId || undefined,
        brand_id: createBrandId || undefined,
        seller_id: createSellerId || undefined,
        model: createModel.trim() || undefined,
        sku: createSku.trim() || undefined,
        barcode: createBarcode.trim() || undefined,
        description: createDesc.trim() || undefined,
        price: parseFloat(createPrice),
        old_price: createOldPrice ? parseFloat(createOldPrice) : undefined,
        currency: 'UZS',
        stock: parseInt(createStock, 10) || 0,
        availability: 'IN_STOCK',
        condition: createCondition,
        location: createLocation,
        warranty: createWarranty,
        delivery: createDelivery,
        specifications: Object.keys(specObj).length > 0 ? specObj : undefined,
        images: createImages
      };

      const res = await adminService.createProduct(payload, createSellerId || null);
      showNotification('success', `"${res.name}" mahsuloti muvaffaqiyatli qo'shildi va faol bo'ldi!`);
      setIsCreateModalOpen(false);
      await loadProducts();
    } catch (err) {
      setCreateError(err.response?.data?.detail || "Mahsulot qo'shishda xatolik yuz berdi.");
    } finally {
      setSubmittingCreate(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-6 pb-24 md:pb-12">
      {/* Page Header & Status Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Mahsulotlar Moderatsiyasi
            </h1>
            <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full font-numeric">
              {products.length} ta mahsulot
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Sotuvchilar tomonidan kiritilgan takliflarni tekshirish, rad etish sababini belgilash va faollashtirish
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <SolarIcon name="Plus" size={16} />
            <span>Yangi mahsulot qo'shish</span>
          </button>

          {/* Responsive Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === '' 
                ? 'bg-white text-slate-900 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <span>Barchasi</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 rounded-full font-numeric">
              {allProducts.length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('PENDING_APPROVAL')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'PENDING_APPROVAL' 
                ? 'bg-amber-500 text-white shadow-xs font-bold' 
                : 'text-slate-600 hover:text-amber-700 font-medium'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Kutilmoqda</span>
            {pendingCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-numeric ${
                statusFilter === 'PENDING_APPROVAL' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'ACTIVE' 
                ? 'bg-emerald-600 text-white shadow-xs font-bold' 
                : 'text-slate-600 hover:text-emerald-700 font-medium'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Faol</span>
            {activeCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-numeric ${
                statusFilter === 'ACTIVE' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {activeCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'REJECTED' 
                ? 'bg-rose-600 text-white shadow-xs font-bold' 
                : 'text-slate-600 hover:text-rose-700 font-medium'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Rad etilgan</span>
            {rejectedCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-numeric ${
                statusFilter === 'REJECTED' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'
              }`}>
                {rejectedCount}
              </span>
            )}
          </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <div className="flex items-center gap-2">
            <SolarIcon name={notification.type === 'success' ? 'CheckCircle' : 'Warning'} size={18} />
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
          >
            Yopish
          </button>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center shadow-xs">
          <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Mahsulotlar moderatsiya ro'yxati yuklanmoqda...</p>
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon="Box"
          title="Mahsulotlar topilmadi"
          description={statusFilter ? `Ushbu "${statusFilter}" filtri bo'yicha hech qanday mahsulot mavjud emas.` : "Platformada hali birorta ham mahsulot qo'shilmagan."}
        />
      ) : (
        <div className="space-y-4 pb-24 md:pb-8">
          {/* Mobile Card Layout (< md screens) */}
          <div className="block md:hidden space-y-3">
            {products.map(p => {
              const primaryImg = p.images?.find(i => i.is_primary)?.image_url || p.images?.[0]?.image_url;
              const isActioning = actionLoading === p.id;
              return (
                <div 
                  key={p.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div 
                      onClick={() => openInspectModal(p)}
                      className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                    >
                      {primaryImg ? (
                        <img src={primaryImg} alt={p.name} className="w-full h-full object-contain" />
                      ) : (
                        <SolarIcon name="Box" size={20} className="text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {p.model || p.sku || 'SKU yo\'q'}
                        </span>
                        <Badge status={p.status} size="xs" />
                      </div>
                      <h3 
                        onClick={() => openInspectModal(p)}
                        className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 cursor-pointer active:text-orange-600"
                      >
                        {p.name}
                      </h3>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {p.seller_name || 'Do\'kon'} &bull; <span className="text-amber-500 font-bold">{p.seller_rating ? Number(p.seller_rating).toFixed(1) : "5.0"}★</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Narxi</span>
                      <span className="font-bold text-slate-900 dark:text-white font-numeric">
                        {formatPrice(p.price)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Zaxira</span>
                      <span className={p.stock > 0 ? 'text-slate-700 dark:text-slate-300 font-semibold' : 'text-rose-600 font-bold'}>
                        {p.stock} dona
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                    <button
                      onClick={() => openInspectModal(p)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95"
                    >
                      <SolarIcon name="Eye" size={13} />
                      <span>Ko'rish</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {p.status !== 'ACTIVE' && (
                        <button
                          onClick={() => handleApprove(p)}
                          disabled={isActioning}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 disabled:opacity-50"
                        >
                          <SolarIcon name="Check" size={13} />
                          <span>Tasdiqlash</span>
                        </button>
                      )}

                      {p.status !== 'REJECTED' && (
                        <button
                          onClick={() => openRejectModal(p)}
                          disabled={isActioning}
                          className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 disabled:opacity-50"
                        >
                          <SolarIcon name="Close" size={13} />
                          <span>Rad etish</span>
                        </button>
                      )}

                      <button
                        onClick={() => setProductToDelete(p)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl active:scale-95"
                      >
                        <SolarIcon name="Trash" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (>= md screens) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px] text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Mahsulot</th>
                    <th className="py-3 px-3">Do'kon (Seller)</th>
                    <th className="py-3 px-3">Kategoriya & Brend</th>
                    <th className="py-3 px-4 text-right">Narxi</th>
                    <th className="py-3 px-3 text-center">Zaxira</th>
                    <th className="py-3 px-3 text-center">Holat</th>
                    <th className="py-3 px-4 text-right">Harakatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-normal">
                  {products.map(p => {
                    const primaryImg = p.images?.find(i => i.is_primary)?.image_url || p.images?.[0]?.image_url;
                    const isActioning = actionLoading === p.id;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div 
                              onClick={() => openInspectModal(p)}
                              className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:border-orange-500 transition-colors"
                            >
                              {primaryImg ? (
                                <img src={primaryImg} alt={p.name} className="w-full h-full object-contain" />
                              ) : (
                                <SolarIcon name="Box" size={20} className="text-slate-400" />
                              )}
                            </div>
                            <div className="max-w-xs">
                              <span 
                                onClick={() => openInspectModal(p)}
                                className="font-bold text-slate-900 dark:text-white block truncate hover:text-orange-600 cursor-pointer"
                              >
                                {p.name}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span>Model: {p.model || '-'}</span>
                                <span>&bull;</span>
                                <span>SKU: {p.sku || '-'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{p.seller_name || 'Noma\'lum'}</div>
                          <div className="flex items-center gap-1 text-[10px] text-amber-600 mt-0.5">
                            <SolarIcon name="Star" size={10} />
                            <span>{p.seller_rating ? Number(p.seller_rating).toFixed(1) : "5.0"}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="text-slate-800 dark:text-slate-200 font-medium">{p.category_name || '-'}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">{p.brand_name || '-'}</div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-numeric">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {formatPrice(p.price)}
                          </span>
                          {p.old_price && (
                            <div className="text-[10px] text-slate-400 line-through">
                              {formatPrice(p.old_price)}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center font-numeric">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.stock > 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                          }`}>
                            {p.stock} dona
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <Badge status={p.status} size="xs" />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openInspectModal(p)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                              title="Batafsil ko'rish"
                            >
                              <SolarIcon name="Eye" size={14} />
                            </button>

                            {p.status !== 'ACTIVE' && (
                              <button
                                onClick={() => handleApprove(p)}
                                disabled={isActioning}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Tasdiqlash va faollashtirish"
                              >
                                <SolarIcon name="Check" size={13} />
                                <span className="hidden sm:inline">Tasdiqlash</span>
                              </button>
                            )}

                            {p.status !== 'REJECTED' && (
                              <button
                                onClick={() => openRejectModal(p)}
                                disabled={isActioning}
                                className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Rad etish"
                              >
                                <SolarIcon name="Close" size={13} />
                                <span className="hidden sm:inline">Rad etish</span>
                              </button>
                            )}

                            <button
                              onClick={() => setProductToDelete(p)}
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 hover:text-rose-700 border border-rose-200 dark:border-rose-900/50 rounded-lg transition-colors cursor-pointer"
                              title="Mahsulotni o'chirish"
                            >
                              <SolarIcon name="Trash" size={14} />
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
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <SolarIcon name="Warning" size={18} />
                <span>Mahsulotni rad etish</span>
              </div>
              <button
                onClick={() => setRejectingProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 cursor-pointer"
              >
                <SolarIcon name="Close" size={16} />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Mahsulot: <strong className="text-slate-900">"{rejectingProduct.name}"</strong>
              <br />
              Rad etish sababi sotuvchining kabinetiga bildirishnoma sifatida yuboriladi:
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Standart sababni tanlang:</label>
                <select
                  value={selectedPresetReason}
                  onChange={(e) => setSelectedPresetReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white"
                >
                  {REJECTION_REASONS.map((r, i) => (
                    <option key={i} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Qo'shimcha izoh / Tavsiyalar (ixtiyoriy):</label>
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Masalan: Mahsulot rasmining o'lchami kamida 600x600 bo'lishi kerak..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white resize-y"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingProduct(null)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading !== null}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <SolarIcon name="Close" size={14} />
                  <span>Rad etishni tasdiqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Inspection Modal */}
      {inspectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Mahsulot tafsilotlari</span>
                <Badge status={inspectedProduct.status} size="xs" />
              </div>
              <button
                onClick={() => setInspectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 cursor-pointer"
              >
                <SolarIcon name="Close" size={16} />
              </button>
            </div>

            {/* Images & Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="w-full h-52 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden mb-2">
                  {inspectedProduct.images && inspectedProduct.images.length > 0 ? (
                    <img
                      src={inspectedProduct.images[activeImgIndex]?.image_url || inspectedProduct.images[0]?.image_url}
                      alt={inspectedProduct.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <SolarIcon name="Box" size={48} className="text-slate-300" />
                  )}
                </div>

                {inspectedProduct.images && inspectedProduct.images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {inspectedProduct.images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveImgIndex(idx)}
                        className={`w-12 h-12 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden cursor-pointer ${
                          activeImgIndex === idx ? 'border-orange-500 ring-2 ring-orange-200' : 'border-slate-200'
                        }`}
                      >
                        <img src={img.image_url} alt="thumb" className="w-full h-full object-contain" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{inspectedProduct.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {inspectedProduct.id}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 font-numeric">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Narxi:</span>
                    <span className="font-bold text-slate-900 text-sm">{formatPrice(inspectedProduct.price)}</span>
                  </div>
                  {inspectedProduct.old_price && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Eski narxi:</span>
                      <span className="line-through">{formatPrice(inspectedProduct.old_price)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                    <span className="text-slate-500">Zaxira:</span>
                    <span className="font-semibold text-slate-800">{inspectedProduct.stock} dona</span>
                  </div>
                </div>

                <div className="space-y-1 text-slate-600">
                  <div><strong>Do'kon:</strong> {inspectedProduct.seller_name}</div>
                  <div><strong>Kategoriya:</strong> {inspectedProduct.category_name || '-'}</div>
                  <div><strong>Brend:</strong> {inspectedProduct.brand_name || '-'}</div>
                  <div><strong>Holati:</strong> {inspectedProduct.condition || 'NEW'}</div>
                  <div><strong>Joylashuv:</strong> {inspectedProduct.location || 'Xorazm'}</div>
                  {inspectedProduct.warranty && <div><strong>Kafolat:</strong> {inspectedProduct.warranty}</div>}
                </div>
              </div>
            </div>

            {/* Description & Specs */}
            {inspectedProduct.description && (
              <div>
                <strong className="block text-slate-900 mb-1">Tavsif:</strong>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
                  {inspectedProduct.description}
                </p>
              </div>
            )}

            {inspectedProduct.specifications && Object.keys(inspectedProduct.specifications).length > 0 && (
              <div>
                <strong className="block text-slate-900 mb-1">Texnik xususiyatlar:</strong>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(inspectedProduct.specifications).map(([k, v]) => (
                    <div key={k} className="p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">{k}</span>
                      <span className="font-semibold text-slate-800">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inspectedProduct.rejection_reason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                <strong>Oxirgi rad etish sababi:</strong>
                <p className="mt-0.5">{inspectedProduct.rejection_reason}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setProductToDelete(inspectedProduct)}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
              >
                <SolarIcon name="TrashBinTrash" size={14} />
                <span>Mahsulotni o'chirish</span>
              </button>

              <div className="flex items-center gap-2">
                {inspectedProduct.status !== 'ACTIVE' && (
                  <button
                    onClick={() => handleApprove(inspectedProduct)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <SolarIcon name="Check" size={14} />
                    <span>Tasdiqlash</span>
                  </button>
                )}
                {inspectedProduct.status !== 'REJECTED' && (
                  <button
                    onClick={() => openRejectModal(inspectedProduct)}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <SolarIcon name="Close" size={14} />
                    <span>Rad etish</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <SolarIcon name="TrashBinTrash" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Mahsulotni butunlay o'chirish</h3>
                <p className="text-xs text-slate-500">Administrator amali</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Rostdan ham <strong className="text-slate-900">"{productToDelete.name}"</strong> mahsulotini platformadan butunlay o'chirmoqchimisiz? Ushbu mahsulotga tegishli barcha rasmlar va narxlar tarixi ham o'chiriladi.
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={deleting}
                className="px-3 py-1.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <SolarIcon name="TrashBinTrash" size={14} />
                <span>{deleting ? "O'chirilmoqda..." : "Ha, o'chirilsin"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add Product Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <SolarIcon name="Box" size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Yangi mahsulot qo'shish</h3>
                  <p className="text-xs text-slate-500">Administrator tomonidan to'g'ridan-to'g'ri faol mahsulot kiritish</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <SolarIcon name="Close" size={18} />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <SolarIcon name="CloseCircle" size={16} />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProductSubmit} className="space-y-4 text-xs">
              {/* Product Name */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mahsulot nomi *</label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Masalan: Artel Inverter 12 Konditsioner"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 font-medium"
                />
              </div>

              {/* Category, Brand, Seller Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kategoriya</label>
                  <select
                    value={createCatId}
                    onChange={(e) => setCreateCatId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white font-medium"
                  >
                    <option value="">Tanlang...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Brend</label>
                  <select
                    value={createBrandId}
                    onChange={(e) => setCreateBrandId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white font-medium"
                  >
                    <option value="">Tanlang...</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Sotuvchi / Do'kon</label>
                  <select
                    value={createSellerId}
                    onChange={(e) => setCreateSellerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white font-medium"
                  >
                    <option value="">Milliy Narx Rasmiy Do'koni</option>
                    {sellers.filter(s => s.status === 'APPROVED').map(s => (
                      <option key={s.id} value={s.id}>{s.store_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Stock Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Narxi (so'm) *</label>
                  <input
                    type="number"
                    required
                    value={createPrice}
                    onChange={(e) => setCreatePrice(e.target.value)}
                    placeholder="4500000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white font-bold font-numeric"
                  />
                  {createPrice && !isNaN(createPrice) && (
                    <span className="text-[10px] text-orange-600 font-bold block mt-0.5">
                      {formatPrice(parseFloat(createPrice))}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Eski narxi (so'm)</label>
                  <input
                    type="number"
                    value={createOldPrice}
                    onChange={(e) => setCreateOldPrice(e.target.value)}
                    placeholder="5000000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white font-numeric"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ombor zaxirasi (dona)</label>
                  <input
                    type="number"
                    value={createStock}
                    onChange={(e) => setCreateStock(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white font-numeric"
                  />
                </div>
              </div>

              {/* Model, SKU, Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Model</label>
                  <input
                    type="text"
                    value={createModel}
                    onChange={(e) => setCreateModel(e.target.value)}
                    placeholder="ART-INV-12"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">SKU artikuli</label>
                  <input
                    type="text"
                    value={createSku}
                    onChange={(e) => setCreateSku(e.target.value)}
                    placeholder="ARTEL-12-WHITE"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Shtrix-kod (Barcode)</label>
                  <input
                    type="text"
                    value={createBarcode}
                    onChange={(e) => setCreateBarcode(e.target.value)}
                    placeholder="4780012345678"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Condition, Location, Warranty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Holati</label>
                  <select
                    value={createCondition}
                    onChange={(e) => setCreateCondition(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white"
                  >
                    <option value="NEW">Yangi (Qadoqda)</option>
                    <option value="REFURBISHED">Tiklagan (Refurbished)</option>
                    <option value="USED">Ishlatilgan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Joylashuv</label>
                  <input
                    type="text"
                    value={createLocation}
                    onChange={(e) => setCreateLocation(e.target.value)}
                    placeholder="Toshkent"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kafolat</label>
                  <input
                    type="text"
                    value={createWarranty}
                    onChange={(e) => setCreateWarranty(e.target.value)}
                    placeholder="1 yil rasmiy kafolat"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <SolarIcon name="Camera" size={16} className="text-orange-600" />
                    <span>Mahsulot rasmlari ({createImages.length} ta)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">JPG, PNG, WebP (maks 10MB)</span>
                </div>

                {/* Thumbnails grid */}
                <div className="flex flex-wrap gap-2.5 items-center">
                  {createImages.map((imgUrl, i) => (
                    <div key={i} className="w-18 h-18 rounded-xl border border-slate-200 bg-white relative p-1 flex items-center justify-center group shadow-2xs">
                      <img src={imgUrl} alt="" className="max-h-full max-w-full object-contain rounded" />
                      {i === 0 && (
                        <span className="absolute bottom-0.5 left-0.5 right-0.5 bg-orange-600/90 text-white text-[8px] font-bold text-center rounded py-0.2">
                          Asosiy
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {i !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(i)}
                            title="Asosiy rasm qilish"
                            className="p-1 bg-white/90 rounded text-slate-800 hover:text-orange-600 cursor-pointer"
                          >
                            <SolarIcon name="Star" size={12} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          title="O'chirish"
                          className="p-1 bg-rose-600 rounded text-white hover:bg-rose-700 cursor-pointer"
                        >
                          <SolarIcon name="Close" size={12} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* File Upload Button */}
                  <label className="w-18 h-18 rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-500 bg-white flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-orange-600 transition-colors shadow-2xs">
                    <SolarIcon name="Upload" size={18} />
                    <span className="text-[9px] mt-0.5 font-semibold">
                      {uploadingImage ? 'Yuklan...' : '+ Fayl'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* URL Paste Option */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/70">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="yoki rasm havolasini (URL) kiriting..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-[11px] focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Qo'shish
                  </button>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900">Texnik parametrlar (Spetsifikatsiya)</span>
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="text-orange-600 font-bold hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                  >
                    <SolarIcon name="Plus" size={12} />
                    <span>Qo'shish</span>
                  </button>
                </div>
                <div className="space-y-1.5">
                  {createSpecs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nomi (masalan: Xotira)"
                        value={spec.key}
                        onChange={(e) => handleSpecChange(i, 'key', e.target.value)}
                        className="w-1/3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Qiymati (masalan: 128 GB)"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(i, 'value', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(i)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <SolarIcon name="Close" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tavsif</label>
                <textarea
                  rows={3}
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="Mahsulot haqida to'liq ma'lumot..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white"
                />
              </div>

              {/* Submit / Cancel */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={submittingCreate}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <SolarIcon name="Check" size={15} />
                  <span>{submittingCreate ? "Saqlanmoqda..." : "Mahsulotni yaratish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
