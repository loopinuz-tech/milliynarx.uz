import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileTabBar from './MobileTabBar';

export const DashboardLayout = () => {
  const location = useLocation();
  const isAiAdvisorPage = location.pathname.startsWith('/ai-advisor') || location.pathname.startsWith('/ai-maslahatchi');

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 overflow-x-clip transition-colors duration-200">
      {/* Top Header with Katalog Mega-Menu & Top Navigation */}
      <Header />

      {/* Main Terminal Viewport with bottom clearance for mobile tab bar */}
      <main className={`flex-1 w-full min-w-0 ${isAiAdvisorPage ? 'pb-14 md:pb-0' : 'pb-20 md:pb-0'}`}>
        <Outlet />
      </main>

      {/* Rich Multi-Column Terminal Footer - Hidden on AI Advisor page */}
      {!isAiAdvisorPage && <Footer />}

      {/* Native App-like Mobile Bottom Navigation Bar (md:hidden) */}
      <MobileTabBar />
    </div>
  );
};

export default DashboardLayout;

