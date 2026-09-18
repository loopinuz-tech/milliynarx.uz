import React, { useState, useEffect } from 'react';
import { adminService } from '../../api/services';
import { formatDate, formatPrice } from '../../utils/formatters';
import SolarIcon from '../../components/common/SolarIcon';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';

export const AdminSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [allSellers, setAllSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState(null);

  // Seller Details Modal
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [sellerDetails, setSellerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadSellers();
  }, [filter]);

  async function loadSellers() {
    try {
      setLoading(true);
      const data = await adminService.getSellers({ status_filter: filter || undefined });
      setSellers(data || []);

      if (!filter) {
        setAllSellers(data || []);
      } else {
        adminService.getSellers().then(res => setAllSellers(res || [])).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to load sellers:", err);
    } finally {
      setLoading(false);
    }
  }

  const openSellerDetails = async (sellerId) => {
    setSelectedSellerId(sellerId);
    setSellerDetails(null);
    try {
      setLoadingDetails(true);
      const data = await adminService.getSellerDetails(sellerId);
      setSellerDetails(data);
    } catch (err) {
      alert("Sotuvchi ma'lumotlarini yuklashda xatolik: " + (err.response?.data?.detail || err.message));
      setSelectedSellerId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateStatus = async (seller, newStatus) => {
    try {
      setActionLoading(seller.id);
      await adminService.updateSellerStatus(seller.id, newStatus);
      
      const statusLabelUz = newStatus === 'APPROVED' ? 'tasdiqlandi (APPROVED)' : 
                            newStatus === 'REJECTED' ? 'rad etildi (REJECTED)' : 
                            newStatus === 'SUSPENDED' ? "to'xtatildi (SUSPENDED)" : newStatus;

      setNotification({
        type: newStatus === 'APPROVED' ? 'success' : 'warning',
        message: `"${seller.store_name}" do'koni holati muvaffaqiyatli ${statusLabelUz}!`
      });

      // Optimistic update
      setSellers(prev => prev.map(s => s.id === seller.id ? { ...s, status: newStatus } : s));
      setAllSellers(prev => prev.map(s => s.id === seller.id ? { ...s, status: newStatus } : s));
      if (sellerDetails?.id === seller.id) {
        setSellerDetails(prev => ({ ...prev, status: newStatus }));
      }

      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      alert("Holatni o'zgartirishda xatolik yuz berdi: " + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = allSellers.filter(s => s.status === 'PENDING').length;
  const approvedCount = allSellers.filter(s => s.status === 'APPROVED').length;
  const suspendedCount = allSellers.filter(s => s.status === 'SUSPENDED').length;

  const filteredSellers = sellers.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.store_name?.toLowerCase().includes(q) ||
      s.tax_id?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Page Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sotuvchilar Moderatsiyasi
            </h1>
            <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full font-numeric">
              {sellers.length} ta do'kon
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Haqiqiy do'konlar verifikatsiyasi, yuridik ma'lumotlari, faoliyatini tasdiqlash va cheklash
          </p>
        </div>

        {/* Filter Tabs with Live Badges */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setFilter('')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filter === '' 
                ? 'bg-white text-slate-900 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <span>Barchasi</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 rounded-full font-numeric">
              {allSellers.length}
            </span>
          </button>
          
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filter === 'PENDING' 
                ? 'bg-amber-500 text-white shadow-xs font-bold' 
                : 'text-slate-600 hover:text-amber-700 font-medium'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Kutilmoqda</span>
            {pendingCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-numeric ${
                filter === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter('APPROVED')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filter === 'APPROVED' 
                ? 'bg-emerald-600 text-white shadow-xs font-bold' 
                : 'text-slate-600 hover:text-emerald-700 font-medium'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Tasdiqlangan</span>
            {approvedCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-numeric ${
                filter === 'APPROVED' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {approvedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter('SUSPENDED')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filter === 'SUSPENDED' 
                ? 'bg-rose-600 text-white shadow-xs font-bold' 
                : 'text-slate-600 hover:text-rose-700 font-medium'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>To'xtatilgan</span>
            {suspendedCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-numeric ${
                filter === 'SUSPENDED' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'
              }`}>
                {suspendedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <SolarIcon name="Magnifer" size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Do'kon nomi, STIR (INN) yoki email bo'yicha qidirish..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
          >
            Tozalash
          </button>
        )}
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

      {loading ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-xs sm:text-sm text-slate-400 shadow-2xs">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto mb-3" />
          <span>Sotuvchilar ro'yxati tekshirilmoqda...</span>
        </div>
      ) : filteredSellers.length === 0 ? (
        <EmptyState
          icon="Shop"
          title={searchQuery ? "Qidiruv bo'yicha sotuvchi topilmadi" : filter === 'PENDING' ? "Tasdiqlanishi kutilayotgan do'konlar yo'q" : "Sotuvchilar topilmadi"}
          description={
            filter === 'PENDING'
              ? "Barcha ro'yxatdan o'tgan do'konlar tekshiruvdan o'tgan va tasdiqlangan."
              : "Hozirda ushbu mezon bo'yicha ma'lumotlar bazasida sotuvchilar mavjud emas."
          }
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[780px] text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Do'kon nomi</th>
                  <th className="py-3.5 px-3">Elektron pochta & Tel</th>
                  <th className="py-3.5 px-3">STIR (INN) & Reg</th>
                  <th className="py-3.5 px-3">Shahar</th>
                  <th className="py-3.5 px-3 text-center">Mahsulotlar</th>
                  <th className="py-3.5 px-3 text-center">Holat</th>
                  <th className="py-3.5 px-4 text-right">Moderatsiya amali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSellers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div 
                          onClick={() => openSellerDetails(s.id)}
                          className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 cursor-pointer hover:border-orange-500 transition-colors"
                        >
                          <SolarIcon name="Shop" size={18} />
                        </div>
                        <div>
                          <div 
                            onClick={() => openSellerDetails(s.id)}
                            className="font-bold text-slate-900 text-xs sm:text-sm hover:text-orange-600 cursor-pointer"
                          >
                            {s.store_name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">Sana: {formatDate(s.created_at)}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-medium text-slate-800">{s.email || '-'}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{s.phone || '-'}</div>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-600">
                      <div>INN: <strong className="text-slate-800">{s.tax_id || '-'}</strong></div>
                      <div className="text-[10px] text-slate-400">Reg: {s.business_reg_number || '-'}</div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-700">
                      {s.city || 'Xorazm'}
                    </td>

                    <td className="py-3.5 px-3 text-center font-black text-slate-900 font-numeric text-xs sm:text-sm">
                      {s.products_count} ta
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <Badge status={s.status} size="xs" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openSellerDetails(s.id)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Do'kon ma'lumotlarini ko'rish"
                        >
                          <SolarIcon name="Eye" size={14} />
                        </button>

                        {s.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(s, 'APPROVED')}
                            disabled={actionLoading === s.id}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1"
                            title="Do'konni tasdiqlash va faollashtirish"
                          >
                            <SolarIcon name="CheckCircle" size={13} />
                            <span className="hidden sm:inline">Tasdiqlash</span>
                          </button>
                        )}

                        {s.status !== 'REJECTED' && s.status !== 'SUSPENDED' && (
                          <button
                            onClick={() => handleUpdateStatus(s, 'REJECTED')}
                            disabled={actionLoading === s.id}
                            className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer border border-rose-200/80 flex items-center gap-1"
                            title="Do'konni rad etish"
                          >
                            <SolarIcon name="CloseCircle" size={13} />
                            <span className="hidden sm:inline">Rad etish</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Seller Details Modal */}
      {selectedSellerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Sotuvchi va Do'kon rekvizitlari</span>
                {sellerDetails && <Badge status={sellerDetails.status} size="xs" />}
              </div>
              <button
                onClick={() => setSelectedSellerId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 cursor-pointer"
              >
                <SolarIcon name="Close" size={16} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Sotuvchi ma'lumotlari yuklanmoqda...
              </div>
            ) : sellerDetails ? (
              <div className="space-y-5">
                {/* Store Profile Card */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {sellerDetails.logo_url ? (
                      <img src={sellerDetails.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <SolarIcon name="Shop" size={24} className="text-orange-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{sellerDetails.store_name}</h3>
                    <p className="text-slate-400 font-mono text-[11px]">slug: {sellerDetails.slug}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${sellerDetails.is_verified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-[11px] font-semibold text-slate-700">
                        {sellerDetails.is_verified ? "Rasmiy verifikatsiyalangan" : "Verifikatsiyalanmagan"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legal & Account Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">STIR / INN</span>
                    <strong className="text-slate-800 font-mono text-xs">{sellerDetails.tax_id || "Kiritilmagan"}</strong>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Davlat ro'yxat raqami</span>
                    <strong className="text-slate-800 font-mono text-xs">{sellerDetails.business_reg_number || "Kiritilmagan"}</strong>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Elektron pochta</span>
                    <strong className="text-slate-800 font-mono text-xs">{sellerDetails.email || "-"}</strong>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Telefon raqam</span>
                    <strong className="text-slate-800 font-mono text-xs">{sellerDetails.phone || sellerDetails.contact_phone || "-"}</strong>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Shahar / Joylashuv</span>
                    <strong className="text-slate-800 text-xs">{sellerDetails.city || "Xorazm"}</strong>
                  </div>
                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">Manzil</span>
                    <strong className="text-slate-800 text-xs">{sellerDetails.address || "Kiritilmagan"}</strong>
                  </div>
                </div>

                {sellerDetails.description && (
                  <div>
                    <strong className="block text-slate-900 mb-1">Do'kon tavsifi:</strong>
                    <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
                      {sellerDetails.description}
                    </p>
                  </div>
                )}

                {/* Seller's Products Summary */}
                <div>
                  <strong className="block text-slate-900 mb-2">
                    Joylashtirilgan tovarlar ({sellerDetails.products?.length || 0} ta):
                  </strong>
                  {sellerDetails.products && sellerDetails.products.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      {sellerDetails.products.map(p => (
                        <div key={p.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" />
                              ) : (
                                <SolarIcon name="Box" size={14} className="text-slate-400" />
                              )}
                            </div>
                            <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-bold text-slate-900 font-numeric">{formatPrice(p.price)}</span>
                            <Badge status={p.status} size="xs" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">Do'konda hali tovarlar mavjud emas.</p>
                  )}
                </div>

                {/* Moderation Actions Inside Modal */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {sellerDetails.status !== 'SUSPENDED' && (
                      <button
                        onClick={() => handleUpdateStatus(sellerDetails, 'SUSPENDED')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-rose-700 rounded-lg font-bold border border-slate-200 transition-colors cursor-pointer"
                      >
                        Faoliyatni to'xtatish
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {sellerDetails.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleUpdateStatus(sellerDetails, 'REJECTED')}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg font-bold border border-rose-200 transition-colors cursor-pointer"
                      >
                        Rad etish
                      </button>
                    )}
                    {sellerDetails.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleUpdateStatus(sellerDetails, 'APPROVED')}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <SolarIcon name="CheckCircle" size={14} />
                        <span>Tasdiqlash</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellers;
