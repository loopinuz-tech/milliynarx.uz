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

// Buyer Pages
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

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminSellers from '../pages/admin/AdminSellers';
import AdminProducts from '../pages/admin/AdminProducts';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminCategories from '../pages/admin/AdminCategories';
import AdminDataSources from '../pages/admin/AdminDataSources';
import AdminAuditLogs from '../pages/admin/AdminAuditLogs';

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

        {/* Buyer Routes */}
        <Route path="favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
        <Route path="alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Seller Routes */}
        <Route path="onboarding" element={<ProtectedRoute requiredRole="SELLER"><OnboardingPage /></ProtectedRoute>} />
        <Route path="seller" element={<ProtectedRoute requiredRole="SELLER"><SellerDashboard /></ProtectedRoute>} />
        <Route path="seller/products" element={<ProtectedRoute requiredRole="SELLER"><SellerProducts /></ProtectedRoute>} />
        <Route path="seller/products/new" element={<ProtectedRoute requiredRole="SELLER"><AddProduct /></ProtectedRoute>} />
        <Route path="seller/products/:id/edit" element={<ProtectedRoute requiredRole="SELLER"><EditProduct /></ProtectedRoute>} />
        <Route path="seller/price-history" element={<ProtectedRoute requiredRole="SELLER"><SellerPriceHistory /></ProtectedRoute>} />
        <Route path="seller/store" element={<ProtectedRoute requiredRole="SELLER"><SellerStore /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/sellers" element={<ProtectedRoute requiredRole="ADMIN"><AdminSellers /></ProtectedRoute>} />
        <Route path="admin/products" element={<ProtectedRoute requiredRole="ADMIN"><AdminProducts /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute requiredRole="ADMIN"><AdminUsers /></ProtectedRoute>} />
        <Route path="admin/categories" element={<ProtectedRoute requiredRole="ADMIN"><AdminCategories /></ProtectedRoute>} />
        <Route path="admin/data-sources" element={<ProtectedRoute requiredRole="ADMIN"><AdminDataSources /></ProtectedRoute>} />
        <Route path="admin/audit-logs" element={<ProtectedRoute requiredRole="ADMIN"><AdminAuditLogs /></ProtectedRoute>} />

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;
