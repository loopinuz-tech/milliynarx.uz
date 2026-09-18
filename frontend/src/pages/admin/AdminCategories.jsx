import React, { useState, useEffect } from 'react';
import { adminService, uploadService } from '../../api/services';
import SolarIcon from '../../components/common/SolarIcon';

const ICON_PRESETS = [
  'Box', 'Phone', 'Laptop', 'Home', 'Tv', 'TShirt', 'Car', 
  'Camera', 'Watch', 'Headphones', 'Gamepad', 'Cart', 'Tag'
];

export const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null = new, object = edit
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Box');
  const [catDesc, setCatDesc] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  // Brand Modal State
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);

  // Delete confirmations
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'category' | 'brand', item }
  const [deleting, setDeleting] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadTaxonomy();
  }, []);

  async function loadTaxonomy() {
    try {
      setLoading(true);
      const [cats, brs] = await Promise.all([
        adminService.getCategories(),
        adminService.getBrands()
      ]);
      setCategories(cats || []);
      setBrands(brs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Category Actions
  const openNewCatModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatIcon('Box');
    setCatDesc('');
    setIsCatModalOpen(true);
  };

  const openEditCatModal = (cat) => {
    setEditingCategory(cat);
    setCatName(cat.name || '');
    setCatIcon(cat.icon || 'Box');
    setCatDesc(cat.description || '');
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      setSavingCat(true);
      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, {
          name: catName.trim(),
          icon: catIcon,
          description: catDesc.trim() || null
        });
        showFeedback('success', `"${catName}" kategoriyasi muvaffaqiyatli yangilandi!`);
      } else {
        await adminService.createCategory(catName.trim(), catIcon, catDesc.trim());
        showFeedback('success', `"${catName}" yangi kategoriyasi muvaffaqiyatli qo'shildi!`);
      }
      setIsCatModalOpen(false);
      await loadTaxonomy();
    } catch (err) {
      showFeedback('error', "Kategoriyani saqlashda xatolik: " + (err.response?.data?.detail || err.message));
    } finally {
      setSavingCat(false);
    }
  };

  // Brand Actions
  const openNewBrandModal = () => {
    setEditingBrand(null);
    setBrandName('');
    setBrandLogo('');
    setIsBrandModalOpen(true);
  };

  const openEditBrandModal = (brand) => {
    setEditingBrand(brand);
    setBrandName(brand.name || '');
    setBrandLogo(brand.logo_url || '');
    setIsBrandModalOpen(true);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const res = await uploadService.uploadFile(file);
      setBrandLogo(res.url);
    } catch (err) {
      alert("Logo yuklashda xatolik: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!brandName.trim()) return;

    try {
      setSavingBrand(true);
      if (editingBrand) {
        await adminService.updateBrand(editingBrand.id, {
          name: brandName.trim(),
          logo_url: brandLogo || null
        });
        showFeedback('success', `"${brandName}" brendi muvaffaqiyatli yangilandi!`);
      } else {
        await adminService.createBrand({
          name: brandName.trim(),
          logo_url: brandLogo || null
        });
        showFeedback('success', `"${brandName}" yangi brendi muvaffaqiyatli qo'shildi!`);
      }
      setIsBrandModalOpen(false);
      await loadTaxonomy();
    } catch (err) {
      showFeedback('error', "Brendni saqlashda xatolik: " + (err.response?.data?.detail || err.message));
    } finally {
      setSavingBrand(false);
    }
  };

  // Delete Action
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      if (itemToDelete.type === 'category') {
        await adminService.deleteCategory(itemToDelete.item.id);
        showFeedback('success', `"${itemToDelete.item.name}" kategoriyasi o'chirildi.`);
      } else {
        await adminService.deleteBrand(itemToDelete.item.id);
        showFeedback('success', `"${itemToDelete.item.name}" brendi o'chirildi.`);
      }
      setItemToDelete(null);
      await loadTaxonomy();
    } catch (err) {
      showFeedback('error', "O'chirishda xatolik yuz berdi: " + (err.response?.data?.detail || err.message));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Katalog Daraxti & Brendlar Boshqaruvi
            </h1>
            <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full font-numeric">
              {categories.length} kategoriya &bull; {brands.length} brend
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Platformadagi toifalar daraxti va rasmiy brendlar ro'yxatini to'liq boshqarish
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openNewCatModal}
            className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <SolarIcon name="Plus" size={15} />
            <span>Kategoriya qo'shish</span>
          </button>
          <button
            onClick={openNewBrandModal}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <SolarIcon name="Plus" size={15} />
            <span>Brend qo'shish</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          <SolarIcon name={feedback.type === 'success' ? 'CheckCircle' : 'CloseCircle'} size={18} />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Categories Panel */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                <SolarIcon name="Grid" size={16} />
              </div>
              <span>Kategoriyalar ({categories.length} ta)</span>
            </h2>
            <button
              onClick={openNewCatModal}
              className="text-xs text-orange-600 font-bold hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <SolarIcon name="Plus" size={14} />
              <span>Yangi</span>
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Kategoriyalar yuklanmoqda...</div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">Hozircha kategoriyalar yo'q.</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto scrollbar-thin">
              {categories.map(c => (
                <div key={c.id} className="py-3 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-lg transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50/70 border border-orange-100/70 flex items-center justify-center text-orange-600 shrink-0">
                      <SolarIcon name={c.icon || 'Box'} size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm">{c.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({c.slug})</span>
                      </div>
                      {c.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">{c.description}</p>
                      )}
                    </div>
                  </div>

                    <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-numeric text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      {c.products_count || 0} ta mahsulot
                    </span>
                    <button
                      onClick={() => openEditCatModal(c)}
                      className="p-1.5 text-slate-500 hover:text-orange-600 rounded-lg hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-colors cursor-pointer"
                      title="Tahrirlash"
                    >
                      <SolarIcon name="Pen" size={15} />
                    </button>
                    <button
                      onClick={() => setItemToDelete({ type: 'category', item: c })}
                      className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                      title="Kategoriyani o'chirish"
                    >
                      <SolarIcon name="Trash" size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Brands Panel */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <SolarIcon name="Tag" size={16} />
              </div>
              <span>Brendlar ({brands.length} ta)</span>
            </h2>
            <button
              onClick={openNewBrandModal}
              className="text-xs text-amber-700 font-bold hover:text-amber-800 flex items-center gap-1 cursor-pointer"
            >
              <SolarIcon name="Plus" size={14} />
              <span>Yangi</span>
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Brendlar yuklanmoqda...</div>
          ) : brands.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">Hozircha brendlar yo'q.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto scrollbar-thin">
              {brands.map(b => (
                <div key={b.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between hover:border-amber-300 transition-colors group">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden text-xs font-bold text-slate-700">
                      {b.logo_url ? (
                        <img src={b.logo_url} alt={b.name} className="w-full h-full object-contain" />
                      ) : (
                        b.name[0].toUpperCase()
                      )}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-slate-900 text-xs block truncate">{b.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">{b.slug}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditBrandModal(b)}
                      className="p-1.5 text-slate-500 hover:text-amber-700 rounded-lg hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-colors cursor-pointer"
                      title="Tahrirlash"
                    >
                      <SolarIcon name="Pen" size={13} />
                    </button>
                    <button
                      onClick={() => setItemToDelete({ type: 'brand', item: b })}
                      className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                      title="Brendni o'chirish"
                    >
                      <SolarIcon name="Trash" size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Modal (Create / Edit) */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <SolarIcon name="Grid" size={18} className="text-orange-600" />
                <span>{editingCategory ? "Kategoriyani tahrirlash" : "Yangi kategoriya qo'shish"}</span>
              </h3>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 cursor-pointer"
              >
                <SolarIcon name="Close" size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Kategoriya nomi *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Masalan: Maishiy texnika"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Ikonka</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {ICON_PRESETS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setCatIcon(icon)}
                      className={`p-2 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${
                        catIcon === icon
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                      title={icon}
                    >
                      <SolarIcon name={icon} size={16} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Tavsif (ixtiyoriy)</label>
                <textarea
                  rows={2}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Kategoriya qisqacha tavsifi..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white resize-y"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <SolarIcon name="Check" size={14} />
                  <span>{savingCat ? "Saqlanmoqda..." : "Saqlash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand Modal (Create / Edit) */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <SolarIcon name="Tag" size={18} className="text-amber-600" />
                <span>{editingBrand ? "Brendni tahrirlash" : "Yangi brend qo'shish"}</span>
              </h3>
              <button
                onClick={() => setIsBrandModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 cursor-pointer"
              >
                <SolarIcon name="Close" size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Brend nomi *</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Masalan: Samsung, Apple, Artel"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Brend logotipi</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {brandLogo ? (
                      <img src={brandLogo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <SolarIcon name="Tag" size={20} className="text-slate-400" />
                    )}
                  </div>
                  <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer transition-colors flex items-center gap-1.5">
                    <SolarIcon name="Upload" size={14} />
                    <span>{uploadingLogo ? "Yuklanmoqda..." : "Rasm yuklash"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                  {brandLogo && (
                    <button
                      type="button"
                      onClick={() => setBrandLogo('')}
                      className="text-rose-600 hover:text-rose-700 text-xs cursor-pointer"
                    >
                      O'chirish
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingBrand}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <SolarIcon name="Check" size={14} />
                  <span>{savingBrand ? "Saqlanmoqda..." : "Saqlash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <SolarIcon name="TrashBinTrash" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {itemToDelete.type === 'category' ? "Kategoriyani o'chirish" : "Brendni o'chirish"}
                </h3>
                <p className="text-xs text-slate-500">Ushbu amalni ortga qaytarib bo'lmaydi</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Rostdan ham <strong className="text-slate-900">"{itemToDelete.item.name}"</strong> nomli {itemToDelete.type === 'category' ? 'kategoriyani' : 'brendni'} o'chirmoqchimisiz?
              {itemToDelete.type === 'category' && itemToDelete.item.products_count > 0 && (
                <span className="block mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 font-medium">
                  Ogohlantirish: Ushbu kategoriyada {itemToDelete.item.products_count} ta mahsulot mavjud. Ular kategoriyasiz holatga o'tkaziladi.
                </span>
              )}
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deleting}
                className="px-3 py-1.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={confirmDelete}
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
    </div>
  );
};

export default AdminCategories;
