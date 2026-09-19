import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';

// Public Pages
import LandingPage from '../pages/public/LandingPage';
import SearchPage from '../pages/public/SearchPage';
import ProductPage from '../pages/public/ProductPage';
import ComparePage from '../pages/public/ComparePage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import AiAdvisorPage from '../pages/public/AiAdvisorPage';
import TermsPage from '../pages/public/TermsPage';
import PrivacyPage from '../pages/public/PrivacyPage';
import PolicyPage from '../pages/public/PolicyPage';

// Buyer Pages
import BuyerDashboard from '../pages/buyer/BuyerDashboard';
import FavoritesPage from '../pages/buyer/FavoritesPage';
import AlertsPage from '../pages/buyer/AlertsPage';
import ProfilePage from '../pages/buyer/ProfilePage';

// Seller Pages
import SellerDashboard from '../pages/seller/SellerDashboard';
import SellerProducts from '../pages/seller/SellerProducts';
import AddProduct from '../pages/seller/AddProduct';
import EditProduct from '../pages/seller/EditProduct';
import SellerPriceHistory from '../pages/seller/SellerPriceHistory';
import SellerStore from '../pages/seller/SellerStore';
import OnboardingPage from '../pages/seller/OnboardingPage';

// Standalone Admin Panel Redirect (Running separately on port 5174)
const AdminRedirect = () => {
  React.useEffect(() => {
    window.location.href = 'http://localhost:5174';
  }, []);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      </div>
      <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
        Administrator Boshqaruv Markaziga Yo'naltirilmoqda...
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
        Admin paneli xavfsizlik va mustaqillik talablariga asosan alohida xavfsiz portda (5174) ishlamoqda.
      </p>
      <a
        href="http://localhost:5174"
        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
      >
        To'g'ridan-to'g'ri o'tish (5174) &rarr;
      </a>
    </div>
  );
};

import ProtectedRoute from '../components/auth/ProtectedRoute';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        {/* Public Routes */}
        <Route index element={<LandingPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="product/:id" element={<ProductPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="ai-advisor" element={<AiAdvisorPage />} />
        <Route path="ai-maslahatchi" element={<Navigate to="/ai-advisor" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Legal, Privacy & Platform Policies */}
        <Route path="terms" element={<TermsPage />} />
        <Route path="terms-of-service" element={<Navigate to="/terms" replace />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="privasy" element={<Navigate to="/privacy" replace />} />
        <Route path="privacy-policy" element={<Navigate to="/privacy" replace />} />
        <Route path="policy" element={<PolicyPage />} />
        <Route path="policsy" element={<Navigate to="/policy" replace />} />
        <Route path="policies" element={<Navigate to="/policy" replace />} />

        {/* Buyer & User Dashboard Routes */}
        <Route path="dashboard" element={<ProtectedRoute><BuyerDashboard /></ProtectedRoute>} />
        <Route path="favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
        <Route path="alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Seller Routes */}
        <Route path="onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="seller" element={<ProtectedRoute requiredRole="SELLER"><SellerDashboard /></ProtectedRoute>} />
        <Route path="seller/products" element={<ProtectedRoute requiredRole="SELLER"><SellerProducts /></ProtectedRoute>} />
        <Route path="seller/products/new" element={<ProtectedRoute requiredRole="SELLER"><AddProduct /></ProtectedRoute>} />
        <Route path="seller/products/:id/edit" element={<ProtectedRoute requiredRole="SELLER"><EditProduct /></ProtectedRoute>} />
        <Route path="seller/price-history" element={<ProtectedRoute requiredRole="SELLER"><SellerPriceHistory /></ProtectedRoute>} />
        <Route path="seller/store" element={<ProtectedRoute requiredRole="SELLER"><SellerStore /></ProtectedRoute>} />

        {/* Admin Routes - Seamless Redirect to Standalone Admin App (port 5174) */}
        <Route path="admin" element={<AdminRedirect />} />
        <Route path="admin/*" element={<AdminRedirect />} />

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;
