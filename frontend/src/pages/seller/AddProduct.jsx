import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellerService, adminService, uploadService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import SolarIcon from '../../components/common/SolarIcon';
import ProductImg from '../../components/common/ProductImg';

export const AddProduct = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [stock, setStock] = useState('10');
  const [availability, setAvailability] = useState('IN_STOCK');
  const [condition, setCondition] = useState('NEW');
  const [location, setLocation] = useState('Xorazm');
  const [warranty, setWarranty] = useState('1 yil rasmiy kafolat');
  const [delivery, setDelivery] = useState('Yetkazib berish mavjud');

  // Dynamic Specifications
  const [specList, setSpecList] = useState([
    { key: 'Rang', value: 'Qora' },
    { key: 'Kafolat muddati', value: '12 oy' }
  ]);

  // Uploaded Images
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService.getCategories().then(setCategories).catch(() => {});
    adminService.getBrands().then(setBrands).catch(() => {});
  }, []);

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
      setImages([...images, res.url]);
    } catch (err) {
      alert("Rasmni yuklashda xatolik: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImages(prev => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
      await sellerService.createProduct({
        name,
        category_id: categoryId || undefined,
        brand_id: brandId || undefined,
        model: model || undefined,
        sku: sku || undefined,
        barcode: barcode || undefined,
        description: description || undefined,
        price: parseFloat(price),
        old_price: oldPrice ? parseFloat(oldPrice) : undefined,
        currency: 'UZS',
        stock: parseInt(stock, 10) || 0,
        availability,
        condition,
        location,
        warranty,
        delivery,
        specifications: Object.keys(specObj).length > 0 ? specObj : undefined,
        images
      });

      navigate('/seller/products');
    } catch (err) {
      setError(err.response?.data?.detail || "Mahsulotni yaratishda xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Yangi mahsulot qo'shish
        </h1>
        <p className="text-xs text-slate-500">
          Mahsulot qo'shilgach, holati &ldquo;Tasdiqlash kutilmoqda (PENDING_APPROVAL)&rdquo; bo'ladi va moderator tekshiruviga yuboriladi.
        </p>
      </div>

      {user?.seller_status === 'PENDING' && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 shadow-xs">
          <SolarIcon name="Warning" size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-amber-900">
              Do'koningiz tasdiqlash jarayonida (Status: PENDING)
            </h4>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Sizning do'koningiz hozirda administrator tomonidan tekshirilmoqda. Administrator do'konni tekshirib tasdiqlagach (APPROVED), tizimga to'liq mahsulot qo'shishingiz mumkin bo'ladi.
            </p>
          </div>
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
                <option value="NEW">Yangi (Qadoqda)</option>
                <option value="REFURBISHED">Tiklagan (Refurbished)</option>
                <option value="USED">Ishlatilgan</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-medium mb-1">Tavsif</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mahsulotning o'ziga xos xususiyatlari, qadoqlanishi va afzalliklari..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Narx va mavjudlik */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <SolarIcon name="Tag" size={16} className="text-orange-600" />
            <span>Narx va ombor (Zaxira)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Joriy narx (so'm) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Masalan: 4500000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white font-numeric font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Eski narx (so'm)</label>
              <input
                type="number"
                value={oldPrice}
                onChange={(e) => setOldPrice(e.target.value)}
                placeholder="Masalan: 4900000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white font-numeric"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Zaxira soni (dona) *</label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white font-numeric"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Mavjudlik holati</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:bg-white"
              >
                <option value="IN_STOCK">Mavjud (Omborda)</option>
                <option value="OUT_OF_STOCK">Tugagan</option>
                <option value="PRE_ORDER">Buyurtma asosida</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Kafolat shartlari</label>
              <input
                type="text"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="1 yil rasmiy kafolat"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Yetkazib berish</label>
              <input
                type="text"
                value={delivery}
                onChange={(e) => setDelivery(e.target.value)}
                placeholder="1 kunda bepul yetkazish"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Rasmlar yuklash */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <SolarIcon name="Eye" size={16} className="text-orange-600" />
            <span>Mahsulot rasmlari</span>
          </h3>

          <div className="flex flex-wrap gap-4 items-center mb-2">
            {images.map((img, i) => (
              <div key={i} className="w-20 h-20 rounded border border-slate-200 bg-slate-50 relative p-1 flex items-center justify-center">
                <ProductImg src={img} alt="" className="max-h-full max-w-full object-contain" iconSize={20} iconContainerClass="w-12 h-12" />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5"
                >
                  <SolarIcon name="Close" size={12} />
                </button>
              </div>
            ))}

            <label className="w-20 h-20 rounded border border-dashed border-slate-300 hover:border-orange-500 bg-slate-50 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-orange-600 transition-colors">
              <SolarIcon name="Plus" size={20} />
              <span className="text-[10px] mt-1">{uploading ? '...' : 'Yuklash'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
            <input
              type="url"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="yoki rasm havolasini (URL) kiriting..."
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:outline-none focus:bg-white"
            />
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-bold cursor-pointer transition-colors"
            >
              Havoladan qo'shish
            </button>
          </div>

          <span className="text-[11px] text-slate-400 block mt-1.5">
            JPG, PNG yoki WebP formatida, maksimal 10MB yoki to'g'ridan-to'g'ri rasm havolasi.
          </span>
        </div>

        {/* Section 4: Texnik parametrlar (Specifications) */}
        <div>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SolarIcon name="Settings" size={16} className="text-orange-600" />
              <span>Texnik xususiyatlar (Spetsifikatsiya)</span>
            </h3>
            <button
              type="button"
              onClick={handleAddSpec}
              className="text-orange-600 hover:text-orange-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <SolarIcon name="Plus" size={14} />
              <span>Xususiyat qo'shish</span>
            </button>
          </div>

          <div className="space-y-2">
            {specList.map((spec, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Parametr (masalan: Xotira hajmi)"
                  value={spec.key}
                  onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white"
                />
                <input
                  type="text"
                  placeholder="Qiymat (masalan: 256 GB)"
                  value={spec.value}
                  onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(index)}
                  className="p-1.5 text-slate-400 hover:text-rose-600"
                >
                  <SolarIcon name="CloseCircle" size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/seller/products')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={submitting || user?.seller_status === 'PENDING'}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {user?.seller_status === 'PENDING' 
              ? "Do'kon tasdiqlanishi kutilmoqda (PENDING)..." 
              : submitting 
                ? 'Saqlanmoqda...' 
                : "Mahsulotni yaratish va tasdiqqa yuborish"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
