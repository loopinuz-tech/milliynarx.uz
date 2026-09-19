import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellerService } from '../../api/services';
import { formatPrice, formatDate } from '../../utils/formatters';
import SolarIcon from '../../components/common/SolarIcon';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import ProductImg from '../../components/common/ProductImg';

export const SellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await sellerService.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleStartPriceEdit = (p) => {
    setEditingPriceId(p.id);
    setNewPrice(p.price);
  };

  const handleSavePrice = async (productId) => {
    if (!newPrice || isNaN(newPrice) || parseFloat(newPrice) <= 0) {
      alert("Iltimos, to'g'ri narx kiriting.");
      return;
    }
    try {
      setSavingPrice(true);
      const updated = await sellerService.updateProduct(productId, { price: parseFloat(newPrice) });
      setProducts(prev => prev.map(p => p.id === productId ? updated : p));
      setEditingPriceId(null);
      setFeedback({ type: 'success', message: "Mahsulot narxi muvaffaqiyatli yangilandi!" });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: 'error', message: "Narxni yangilashda xatolik yuz berdi" });
    } finally {
      setSavingPrice(false);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setDeletingId(productToDelete.id);
      await sellerService.deleteProduct(productToDelete.id);
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setFeedback({ type: 'success', message: `"${productToDelete.name}" mahsuloti muvaffaqiyatli o'chirildi.` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: 'error', message: "Mahsulotni o'chirishda xatolik yuz berdi: " + (err.response?.data?.detail || err.message) });
    } finally {
      setDeletingId(null);
      setProductToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-6 pb-24 md:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Mahsulotlarim ({products.length} ta)
          </h1>
          <p className="text-xs text-slate-500">
            Katalogingizdagi barcha takliflar, narxlar va mahsulot boshqaruvi
          </p>
        </div>

        <button
          onClick={() => navigate('/seller/products/new')}
          className="w-full sm:w-auto justify-center px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <SolarIcon name="Plus" size={16} />
          <span>Yangi mahsulot qo'shish</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-3 rounded-md text-xs flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
          <SolarIcon name={feedback.type === 'success' ? 'CheckCircle' : 'CloseCircle'} size={16} />
          <span>{feedback.message}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-400">
          Mahsulotlar ro'yxati yuklanmoqda...
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon="Box"
          title="Mahsulotlar hali qo'shilmagan"
          description="Siz hali birorta ham mahsulot joylashtirmagansiz. 'Yangi mahsulot qo'shish' tugmasini bosib, birinchi taklifingizni kiriting."
          actionLabel="Mahsulot qo'shish"
          onAction={() => navigate('/seller/products/new')}
        />
      ) : (
        <div className="space-y-4 pb-20 md:pb-8">
          {/* Mobile Card Layout (< md screens) */}
          <div className="block md:hidden space-y-3">
            {products.map(p => {
              const primaryImg = p.images?.find(i => i.is_primary)?.image_url || p.images?.[0]?.image_url;
              const isEditing = editingPriceId === p.id;
              return (
                <div 
                  key={p.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                      <ProductImg src={primaryImg} alt={p.name} categoryName={p.category_name} className="w-full h-full object-contain" iconSize={20} iconContainerClass="w-14 h-14" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {p.model || p.sku || 'SKU yo\'q'}
                        </span>
                        <Badge status={p.status} size="xs" />
                      </div>
                      <h3 
                        onClick={() => navigate(`/product/${p.slug || p.id}`)}
                        className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 cursor-pointer active:text-orange-600"
                      >
                        {p.name}
                      </h3>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {p.brand_name || p.category_name || 'Katalog'} &bull; <span className={p.stock > 0 ? 'text-slate-700 dark:text-slate-300 font-semibold' : 'text-rose-600 font-bold'}>{p.stock} dona</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Edit Block */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Narxi:</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          className="w-28 px-2 py-1 bg-white dark:bg-slate-800 border border-orange-500 rounded-lg text-right font-numeric text-xs font-bold focus:outline-none dark:text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSavePrice(p.id)}
                          disabled={savingPrice}
                          className="p-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer"
                          title="Saqlash"
                        >
                          <SolarIcon name="Check" size={14} />
                        </button>
                        <button
                          onClick={() => setEditingPriceId(null)}
                          className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 cursor-pointer"
                          title="Bekor qilish"
                        >
                          <SolarIcon name="Close" size={14} />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onClick={() => handleStartPriceEdit(p)}
                        className="flex items-center gap-1 cursor-pointer active:scale-95 transition"
                      >
                        <span className="text-base font-black text-slate-900 dark:text-white font-numeric">
                          {formatPrice(p.price)}
                        </span>
                        <SolarIcon name="Pen" size={13} className="text-orange-500 ml-1" />
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-numeric">
                      {formatDate(p.updated_at)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/seller/products/${p.id}/edit`)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-700 dark:text-slate-200 hover:text-orange-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition active:scale-95"
                      >
                        <SolarIcon name="Pen" size={13} />
                        <span>Tahrirlash</span>
                      </button>
                      <button
                        onClick={() => setProductToDelete(p)}
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 rounded-xl transition active:scale-95"
                      >
                        <SolarIcon name="TrashBinTrash" size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/product/${p.slug || p.id}`)}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold active:scale-95"
                      >
                        Ko'rish
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table Layout (>= md screens) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-xs">
            <table className="w-full text-left border-collapse min-w-[760px] text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Mahsulot</th>
                  <th className="py-3 px-3">Model & SKU</th>
                  <th className="py-3 px-3">Zaxira (Stock)</th>
                  <th className="py-3 px-4 text-right">Narx (so'm)</th>
                  <th className="py-3 px-3 text-center">Holat</th>
                  <th className="py-3 px-3">Oxirgi yangilanish</th>
                  <th className="py-3 px-4 text-right">Harakatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {products.map(p => {
                  const primaryImg = p.images?.find(i => i.is_primary)?.image_url || p.images?.[0]?.image_url;
                  const isEditing = editingPriceId === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                            <ProductImg src={primaryImg} alt={p.name} categoryName={p.category_name} className="w-full h-full object-contain" iconSize={18} iconContainerClass="w-10 h-10" />
                          </div>
                          <div className="truncate max-w-xs">
                            <span className="font-semibold text-slate-900 dark:text-white block truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {p.brand_name || p.category_name || 'Katalog'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                        <div>{p.model || '-'}</div>
                        <div className="text-[10px] text-slate-400">{p.sku || '-'}</div>
                      </td>

                      <td className="py-3 px-3 font-numeric">
                        <span className={p.stock > 0 ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-rose-600 font-semibold'}>
                          {p.stock} dona
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              value={newPrice}
                              onChange={(e) => setNewPrice(e.target.value)}
                              className="w-28 px-2 py-1 bg-white dark:bg-slate-800 border border-orange-500 rounded-lg text-right font-numeric text-xs font-bold focus:outline-none dark:text-white"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSavePrice(p.id)}
                              disabled={savingPrice}
                              className="p-1 bg-orange-600 text-white rounded hover:bg-orange-700 cursor-pointer"
                              title="Saqlash"
                            >
                              <SolarIcon name="Check" size={14} />
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-300 cursor-pointer"
                              title="Bekor qilish"
                            >
                              <SolarIcon name="Close" size={14} />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => handleStartPriceEdit(p)}
                            className="group cursor-pointer inline-flex items-center gap-1 hover:text-orange-600"
                            title="Narxni tezkor o'zgartirish uchun bosing"
                          >
                            <span className="font-bold text-slate-900 dark:text-white group-hover:text-orange-600 font-numeric">
                              {formatPrice(p.price)}
                            </span>
                            <SolarIcon name="Pen" size={12} className="opacity-0 group-hover:opacity-100 text-orange-500" />
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <Badge status={p.status} size="xs" />
                      </td>

                      <td className="py-3 px-3 text-slate-400 dark:text-slate-500 font-numeric">
                        {formatDate(p.updated_at)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/seller/products/${p.id}/edit`)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-600 dark:text-slate-300 hover:text-orange-600 rounded-lg transition-colors cursor-pointer"
                            title="Tahrirlash"
                          >
                            <SolarIcon name="Pen" size={14} />
                          </button>
                          <button
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="O'chirish"
                          >
                            <SolarIcon name="TrashBinTrash" size={14} />
                          </button>
                          <button
                            onClick={() => navigate(`/product/${p.slug || p.id}`)}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-medium"
                            title="Bozorda ko'rish"
                          >
                            Ko'rish
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

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <SolarIcon name="TrashBinTrash" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Mahsulotni o'chirish</h3>
                <p className="text-xs text-slate-500">Ushbu amalni ortga qaytarib bo'lmaydi</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Rostdan ham <strong className="text-slate-900">"{productToDelete.name}"</strong> mahsulotini o'chirmoqchimisiz? Unga tegishli barcha rasmlar va narxlar tarixi ham o'chiriladi.
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={deletingId !== null}
                className="px-3 py-1.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingId !== null}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <SolarIcon name="TrashBinTrash" size={14} />
                <span>{deletingId ? "O'chirilmoqda..." : "Ha, o'chirilsin"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProducts;
