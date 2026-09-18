import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sellerService, adminService, uploadService } from '../../api/services';
import SolarIcon from '../../components/common/SolarIcon';

export const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [model, setModel] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [availability, setAvailability] = useState('IN_STOCK');
  const [condition, setCondition] = useState('NEW');
  const [location, setLocation] = useState('Xorazm');
  const [warranty, setWarranty] = useState('1 yil rasmiy kafolat');
  const [delivery, setDelivery] = useState('Yetkazib berish mavjud');

  // Dynamic Specifications
  const [specList, setSpecList] = useState([]);

  // Images
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [catData, brandData, prodData] = await Promise.all([
          adminService.getCategories().catch(() => []),
          adminService.getBrands().catch(() => []),
          sellerService.getProduct(id)
        ]);

        setCategories(catData || []);
        setBrands(brandData || []);

        if (prodData) {
          setName(prodData.name || '');
          setCategoryId(prodData.category_id || '');
          setBrandId(prodData.brand_id || '');
          setModel(prodData.model || '');
          setSku(prodData.sku || '');
          setBarcode(prodData.barcode || '');
          setDescription(prodData.description || '');
          setPrice(prodData.price !== undefined ? String(prodData.price) : '');
          setOldPrice(prodData.old_price !== undefined && prodData.old_price !== null ? String(prodData.old_price) : '');
          setStock(prodData.stock !== undefined ? String(prodData.stock) : '0');
          setAvailability(prodData.availability || 'IN_STOCK');
          setCondition(prodData.condition || 'NEW');
          setLocation(prodData.location || 'Xorazm');
          setWarranty(prodData.warranty || '');
          setDelivery(prodData.delivery || '');

          // Specifications
          if (prodData.specifications && typeof prodData.specifications === 'object') {
            const list = Object.entries(prodData.specifications).map(([key, value]) => ({
              key,
              value: String(value)
            }));
            setSpecList(list.length > 0 ? list : [{ key: 'Rang', value: 'Qora' }]);
          } else {
            setSpecList([{ key: 'Rang', value: 'Qora' }]);
          }

          // Images
          if (prodData.images && prodData.images.length > 0) {
            setImages(prodData.images.map(img => img.image_url));
          }
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
        setError("Mahsulot ma'lumotlarini yuklashda xatolik yuz berdi: " + (err.response?.data?.detail || err.message));
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      init();
    }
  }, [id]);

  const handleAddSpec = () => {
    setSpecList([...specList, { key: '', value: '' }]);
  };

  const handleRemoveSpec = (index) => {
    setSpecList(specList.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index, field, val) => {
    const updated = [...specList];
    updated[index][field] = val;
    setSpecList(updated);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await uploadService.uploadFile(file);
      setImages(prev => [...prev, res.url]);
    } catch (err) {
      alert("Rasmni yuklashda xatolik: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!price || parseFloat(price) <= 0) {
      setError("Iltimos, haqiqiy narxni kiriting.");
      return;
    }

    // Convert specs array to JSON object
    const specObj = {};
    specList.forEach(s => {
      if (s.key.trim() && s.value.trim()) {
        specObj[s.key.trim()] = s.value.trim();
      }
    });

    setSubmitting(true);
    try {
      await sellerService.updateProduct(id, {
        name,
        category_id: categoryId || null,
        brand_id: brandId || null,
        model: model || null,
        sku: sku || null,
        barcode: barcode || null,
        description: description || null,
        price: parseFloat(price),
        old_price: oldPrice ? parseFloat(oldPrice) : null,
        stock: parseInt(stock, 10) || 0,
        availability,
        condition,
        location,
        warranty: warranty || null,
        delivery: delivery || null,
        specifications: Object.keys(specObj).length > 0 ? specObj : null,
        images
      });

      setSuccessMsg("Mahsulot muvaffaqiyatli saqlandi!");
      setTimeout(() => {
        navigate('/seller/products');
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.detail || "Mahsulotni yangilashda xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-xs text-slate-400">
        Mahsulot ma'lumotlari yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/seller/products')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mb-2 cursor-pointer transition-colors"
          >
            <SolarIcon name="ArrowLeft" size={14} />
            <span>Mahsulotlar ro'yxatiga qaytish</span>
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Mahsulotni tahrirlash
          </h1>
          <p className="text-xs text-slate-500">
            Mahsulot parametrlari, narxi, zaxirasi va rasmlarini yangilang
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center gap-2">
          <SolarIcon name="CheckCircle" size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
          <SolarIcon name="CloseCircle" size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-6 text-xs">
        {/* Section 1: Asosiy ma'lumotlar */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <SolarIcon name="Box" size={16} className="text-orange-600" />
            <span>Asosiy ma'lumotlar</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-medium mb-1">Mahsulot to'liq nomi *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Samsung Galaxy S24 Ultra 12/256GB Titanium Gray"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Kategoriya</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:bg-white focus:border-orange-500"
              >
                <option value="">Tanlang...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Brend</label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:bg-white focus:border-orange-500"
              >
                <option value="">Tanlang...</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="SM-S928B"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">SKU (Artikul)</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU-882910"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Shtrix-kod (Barcode)</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="880609..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Mahsulot holati</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:bg-white"
              >
                <option value="NEW">Yangi (Upakovka)</option>
                <option value="REFURBISHED">Yangilangan (Refurbished)</option>
                <option value="USED">Ishlatilgan (Ideal holatda)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-medium mb-1">Batafsil tavsif</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mahsulot afzalliklari, to'plami va xususiyatlari..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white resize-y"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Narx va mavjudlik */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <SolarIcon name="Tag" size={16} className="text-orange-600" />
            <span>Narx va ombor zaxirasi</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Sotish narxi (so'm) *</label>
              <input
                type="number"
                required
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="15000000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 font-numeric font-bold focus:outline-none focus:bg-white focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Eski / Asl narx (so'm)</label>
              <input
                type="number"
                min="0"
                value={oldPrice}
                onChange={(e) => setOldPrice(e.target.value)}
                placeholder="16500000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 font-numeric focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Ombordagi zaxira (dona)</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 font-numeric focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Mavjudlik holati</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:bg-white"
              >
                <option value="IN_STOCK">Mavjud (Omborda bor)</option>
                <option value="OUT_OF_STOCK">Tugagan</option>
                <option value="PRE_ORDER">Buyurtma asosida</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Shahar / Joylashuv</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Kafolat shartlari</label>
              <input
                type="text"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="1 yil rasmiy servis"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-slate-700 font-medium mb-1">Yetkazib berish ma'lumoti</label>
              <input
                type="text"
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                placeholder="Butun O'zbekiston bo'ylab 1-2 kunda bepul"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Dinamik parametrlar */}
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SolarIcon name="Document" size={16} className="text-orange-600" />
              <span>Texnik xususiyatlar (Spetsifikatsiya)</span>
            </h3>
            <button
              type="button"
              onClick={handleAddSpec}
              className="text-[11px] text-orange-600 font-semibold hover:text-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <SolarIcon name="Plus" size={14} />
              <span>Xususiyat qo'shish</span>
            </button>
          </div>

          <div className="space-y-2">
            {specList.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Parametr (masalan: Xotira)"
                  value={s.key}
                  onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white"
                />
                <input
                  type="text"
                  placeholder="Qiymat (masalan: 256 GB)"
                  value={s.value}
                  onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                >
                  <SolarIcon name="TrashBinTrash" size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Mahsulot rasmlari */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <SolarIcon name="Gallery" size={16} className="text-orange-600" />
            <span>Mahsulot rasmlari</span>
          </h3>

          <div className="flex flex-wrap gap-3 items-center">
            {images.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded border border-slate-200 overflow-hidden group bg-slate-50">
                <img src={url} alt="product" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(i)}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <SolarIcon name="TrashBinTrash" size={12} />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-0 inset-x-0 bg-orange-600 text-white text-[9px] text-center font-bold py-0.5">
                    Asosiy
                  </span>
                )}
              </div>
            ))}

            <label className={`w-20 h-20 border border-dashed rounded flex flex-col items-center justify-center cursor-pointer transition-colors ${uploading ? 'bg-slate-50 border-slate-300' : 'border-slate-300 hover:border-orange-500 hover:bg-orange-50/20'}`}>
              <SolarIcon name="Upload" size={18} className={uploading ? 'text-slate-400 animate-bounce' : 'text-slate-400'} />
              <span className="text-[10px] text-slate-500 mt-1">
                {uploading ? 'Yuklanmoqda' : 'Rasm qo\'shish'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/seller/products')}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-semibold cursor-pointer"
          >
            Bekor qilish
          </button>

          <button
            type="submit"
            disabled={submitting || uploading}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <SolarIcon name="Check" size={16} />
            <span>{submitting ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
