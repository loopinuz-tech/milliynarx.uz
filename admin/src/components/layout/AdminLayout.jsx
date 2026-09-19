import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 overflow-x-hidden transition-colors duration-200">
      {/* Fixed/Collapsible Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] transition-colors duration-200">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 sm:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
