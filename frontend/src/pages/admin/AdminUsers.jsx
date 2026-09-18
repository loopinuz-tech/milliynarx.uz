import React, { useState, useEffect } from 'react';
import { adminService } from '../../api/services';
import { formatDate } from '../../utils/formatters';
import SolarIcon from '../../components/common/SolarIcon';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await adminService.getUsers({ role: roleFilter || undefined });
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Page Header & Role Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Foydalanuvchilar Bazasi
            </h1>
            <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full font-numeric">
              {users.length} ta akkaunt
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Platformada ro'yxatdan o'tgan barcha akkauntlar (Admin, Sotuvchi, Xaridor)
          </p>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setRoleFilter('')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              roleFilter === '' 
                ? 'bg-white text-slate-900 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            Barchasi
          </button>
          <button
            onClick={() => setRoleFilter('BUYER')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === 'BUYER' 
                ? 'bg-orange-600 text-white shadow-xs font-bold' 
                : 'text-slate-600 hover:text-orange-700 font-medium'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>Xaridorlar</span>
          </button>
          <button
            onClick={() => setRoleFilter('SELLER')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === 'SELLER' 
                ? 'bg-amber-500 text-white shadow-xs font-bold' 
                : 'text-slate-600 hover:text-amber-700 font-medium'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Sotuvchilar</span>
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === 'ADMIN' 
                ? 'bg-red-600 text-white shadow-xs font-bold' 
                : 'text-slate-600 hover:text-red-700 font-medium'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>Adminlar</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-xs sm:text-sm text-slate-400 shadow-2xs">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto mb-3" />
          <span>Foydalanuvchilar ro'yxati yuklanmoqda...</span>
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon="Users"
          title="Foydalanuvchilar topilmadi"
          description="Tanlangan rol bo'yicha hech qanday foydalanuvchi mavjud emas."
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[720px] text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Foydalanuvchi</th>
                  <th className="py-3.5 px-3">Ism / Do'kon</th>
                  <th className="py-3.5 px-3">Telefon</th>
                  <th className="py-3.5 px-3 text-center">Rol</th>
                  <th className="py-3.5 px-3 text-center">Holat</th>
                  <th className="py-3.5 px-4 text-right">Ro'yxatdan o'tgan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-700 font-bold text-xs flex items-center justify-center border border-orange-100 shrink-0">
                          {(u.full_name || u.email || 'U')[0].toUpperCase()}
                        </div>
                        <div className="font-mono font-semibold text-slate-900 text-xs truncate max-w-[200px]">
                          {u.email}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-800 font-medium">
                      {u.full_name || u.store_name || '-'}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-500 text-[11px]">
                      {u.phone || '-'}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        u.role === 'ADMIN' ? 'bg-red-100 text-red-700 border border-red-200' :
                        u.role === 'SELLER' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                        'bg-orange-100 text-orange-700 border border-orange-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <Badge status={u.is_active ? 'ACTIVE' : 'ARCHIVED'} text={u.is_active ? "Faol" : "Nofaol"} size="xs" />
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-400 font-numeric text-[11px]">
                      {formatDate(u.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
