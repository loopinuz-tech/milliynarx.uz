import React, { useState, useEffect } from 'react';
import { adminService } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/formatters';
import SolarIcon from '../components/common/SolarIcon';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';

export const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications
  const [notification, setNotification] = useState(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ full_name: '', phone: '', role: 'BUYER', is_active: true });
  const [savingUser, setSavingUser] = useState(false);

  // Delete User Modal State
  const [deletingUser, setDeletingUser] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await adminService.getUsers({ role: roleFilter || undefined });
      setUsers(data || []);
    } catch (err) {
      console.error("Foydalanuvchilarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  }

  const openEditModal = (u) => {
    setEditingUser(u);
    setEditFormData({
      full_name: u.full_name || '',
      phone: u.phone || '',
      role: u.role || 'BUYER',
      is_active: u.is_active ?? true
    });
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setSavingUser(true);
      const updated = await adminService.updateUser(editingUser.id, {
        full_name: editFormData.full_name.trim() || null,
        phone: editFormData.phone.trim() || null,
        role: editFormData.role,
        is_active: Boolean(editFormData.is_active)
      });

      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updated } : u));
      setNotification({
        type: 'success',
        message: `"${updated.email}" foydalanuvchi ma'lumotlari muvaffaqiyatli saqlandi.`
      });
      setEditingUser(null);
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      alert("Foydalanuvchini yangilashda xatolik: " + (err.response?.data?.detail || err.message));
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    if (deletingUser.id === currentUser?.id || deletingUser.email === currentUser?.email) {
      alert("O'zingizning administrator akkauntingizni o'chira olmaysiz!");
      return;
    }

    try {
      setDeletingLoading(true);
      await adminService.deleteUser(deletingUser.id);
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
      setNotification({
        type: 'success',
        message: `"${deletingUser.email}" foydalanuvchi akkaunti muvaffaqiyatli o'chirildi.`
      });
      setDeletingUser(null);
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      alert("Foydalanuvchini o'chirishda xatolik: " + (err.response?.data?.detail || err.message));
    } finally {
      setDeletingLoading(false);
    }
  };

  // Filter & Search
  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q) ||
      u.store_name?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-6">
      {/* Page Header & Role Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Foydalanuvchilar Bazasi
            </h1>
            <span className="text-xs font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 px-2.5 py-0.5 rounded-full font-numeric">
              {users.length} ta akkaunt
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Platformada ro'yxatdan o'tgan barcha akkauntlar (Admin, Sotuvchi, Xaridor)
          </p>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl text-xs overflow-x-auto shrink-0 scrollbar-none border border-slate-200/60 dark:border-slate-800">
          <button
            onClick={() => setRoleFilter('')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === '' 
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            Barchasi ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('BUYER')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === 'BUYER' 
                ? 'bg-orange-600 text-white shadow-xs font-bold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-orange-600 font-medium'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>Xaridorlar</span>
          </button>
          <button
            onClick={() => setRoleFilter('SELLER')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === 'SELLER' 
                ? 'bg-amber-500 text-white shadow-xs font-bold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-500 font-medium'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Sotuvchilar</span>
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === 'ADMIN' 
                ? 'bg-red-600 text-white shadow-xs font-bold' 
                : 'text-slate-600 dark:text-slate-400 hover:text-red-500 font-medium'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>Adminlar</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <SolarIcon name="Magnifer" size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Foydalanuvchi email, ism yoki telefon raqami bo'yicha qidirish..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium cursor-pointer"
          >
            Tozalash
          </button>
        )}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300' 
            : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            <SolarIcon name={notification.type === 'success' ? 'CheckCircle' : 'Warning'} size={18} />
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-xs"
          >
            Yopish
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-xs sm:text-sm text-slate-400 shadow-2xs">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto mb-3" />
          <span>Foydalanuvchilar ro'yxati yuklanmoqda...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon="Users"
          title="Foydalanuvchilar topilmadi"
          description="Qidiruv yoki tanlangan rol bo'yicha hech qanday foydalanuvchi mavjud emas."
        />
      ) : (
        <div className="space-y-4">
          {/* Mobile Card Layout (< md screens) */}
          <div className="block md:hidden space-y-3">
            {filteredUsers.map(u => (
              <div key={u.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold text-xs flex items-center justify-center border border-orange-100 dark:border-orange-800/50 shrink-0">
                      {(u.full_name || u.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-mono font-semibold text-slate-900 dark:text-white text-xs truncate max-w-[190px]">
                        {u.email}
                      </div>
                      {u.id === currentUser?.id ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">(Siz - Administrator)</span>
                      ) : (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {u.full_name || u.store_name || '-'}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    u.role === 'ADMIN' ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60' :
                    u.role === 'SELLER' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60' : 
                    'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60'
                  }`}>
                    {u.role}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <div>
                    <span className="block text-[10px] text-slate-400">Telefon:</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{u.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Holat:</span>
                    <Badge status={u.is_active ? 'ACTIVE' : 'ARCHIVED'} text={u.is_active ? "Faol" : "Nofaol"} size="xs" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-numeric">{formatDate(u.created_at)}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(u)}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/50 text-slate-700 dark:text-slate-300 hover:text-orange-600 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <SolarIcon name="Pen" size={13} />
                      <span>Tahrirlash</span>
                    </button>
                    <button
                      onClick={() => setDeletingUser(u)}
                      disabled={u.id === currentUser?.id}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                        u.id === currentUser?.id
                          ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                          : 'bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      <SolarIcon name="Trash" size={13} />
                      <span>O'chirish</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md screens) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse min-w-[850px] text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4 min-w-[240px]">Foydalanuvchi</th>
                  <th className="py-3.5 px-3 min-w-[170px]">Ism / Do'kon</th>
                  <th className="py-3.5 px-3 min-w-[130px] whitespace-nowrap">Telefon</th>
                  <th className="py-3.5 px-3 text-center min-w-[90px] whitespace-nowrap">Rol</th>
                  <th className="py-3.5 px-3 text-center min-w-[90px] whitespace-nowrap">Holat</th>
                  <th className="py-3.5 px-4 text-center min-w-[130px] whitespace-nowrap">Ro'yxatdan o'tgan</th>
                  <th className="py-3.5 px-4 text-right min-w-[100px] whitespace-nowrap">Harakatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold text-xs flex items-center justify-center border border-orange-100 dark:border-orange-800/50 shrink-0">
                          {(u.full_name || u.email || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-mono font-semibold text-slate-900 dark:text-white text-xs truncate max-w-[200px]">
                            {u.email}
                          </div>
                          {u.id === currentUser?.id && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">(Siz)</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-800 dark:text-slate-200 font-medium">
                      {u.full_name || u.store_name || '-'}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                      {u.phone || '-'}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        u.role === 'ADMIN' ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60' :
                        u.role === 'SELLER' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60' : 
                        'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <Badge status={u.is_active ? 'ACTIVE' : 'ARCHIVED'} text={u.is_active ? "Faol" : "Nofaol"} size="xs" />
                    </td>

                    <td className="py-3.5 px-4 text-center text-slate-400 dark:text-slate-500 font-numeric text-[11px]">
                      {formatDate(u.created_at)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/50 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 rounded-lg transition-colors cursor-pointer"
                          title="Foydalanuvchini tahrirlash"
                        >
                          <SolarIcon name="Pen" size={14} />
                        </button>

                        <button
                          onClick={() => setDeletingUser(u)}
                          disabled={u.id === currentUser?.id}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            u.id === currentUser?.id
                              ? 'opacity-30 cursor-not-allowed text-slate-400 bg-slate-100 dark:bg-slate-800'
                              : 'bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400'
                          }`}
                          title={u.id === currentUser?.id ? "O'z hisobingizni o'chira olmaysiz" : "Foydalanuvchini o'chirish"}
                        >
                          <SolarIcon name="Trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <SolarIcon name="Pen" size={18} className="text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Foydalanuvchini tahrirlash</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <SolarIcon name="Close" size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Elektron pochta (O'zgarmas)</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Ism va familiya</label>
                <input
                  type="text"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  placeholder="Masalan: Sardor Alimov"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Telefon raqam</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="+998901234567"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Foydalanuvchi roli</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="BUYER">Xaridor (BUYER)</option>
                    <option value="SELLER">Sotuvchi (SELLER)</option>
                    <option value="ADMIN">Administrator (ADMIN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Akkaunt holati</label>
                  <select
                    value={editFormData.is_active ? '1' : '0'}
                    onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.value === '1' })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="1">Faol (Active)</option>
                    <option value="0">Nofaol (Blocked)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingUser && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800/60">
                <SolarIcon name="Trash" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Foydalanuvchini o'chirish</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Ushbu amalni ortga qaytarib bo'lmaydi</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/40 rounded-xl border border-rose-200/80 dark:border-rose-800/50 text-slate-700 dark:text-slate-300 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white">
                "{deletingUser.email}" akkaunti butunlay o'chiriladi.
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Rol: <strong className="font-mono text-slate-800 dark:text-slate-200">{deletingUser.role}</strong>
                {deletingUser.full_name && ` • Ism: ${deletingUser.full_name}`}
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 pt-1 font-medium">
                Foydalanuvchining bildirishnomalari, sevimlilari va barcha bog'liq ma'lumotlari tozalab tashlanadi.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={deletingLoading}
                className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deletingLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Ha, butunlay o'chirilsin</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
