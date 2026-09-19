import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import AdminProtectedRoute from '../components/auth/AdminProtectedRoute';

// Admin Pages
import AdminLoginPage from '../pages/AdminLoginPage';
import AdminDashboard from '../pages/AdminDashboard';
import AdminSellers from '../pages/AdminSellers';
import AdminProducts from '../pages/AdminProducts';
import AdminUsers from '../pages/AdminUsers';
import AdminCategories from '../pages/AdminCategories';
import AdminDataSources from '../pages/AdminDataSources';
import AdminAuditLogs from '../pages/AdminAuditLogs';

export const AdminRouter = () => {
  return (
    <Routes>
      {/* Public Auth for Admin */}
      <Route path="/login" element={<AdminLoginPage />} />

      {/* Protected Admin Routes */}
      <Route
        path="/"
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="sellers" element={<AdminSellers />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="data-sources" element={<AdminDataSources />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminRouter;
