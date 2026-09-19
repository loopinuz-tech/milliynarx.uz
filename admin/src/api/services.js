import apiClient from './client';

export const authService = {
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  }
};

export const adminService = {
  getMetrics: async () => {
    const res = await apiClient.get('/admin/metrics');
    return res.data;
  },
  getSellers: async (params = {}) => {
    const res = await apiClient.get('/admin/sellers', { params });
    return res.data;
  },
  updateSellerStatus: async (sellerId, newStatus) => {
    const res = await apiClient.patch(`/admin/sellers/${sellerId}/status?new_status=${newStatus}`);
    return res.data;
  },
  getProducts: async (params = {}) => {
    const res = await apiClient.get('/admin/products', { params });
    return res.data;
  },
  updateProductStatus: async (productId, newStatus, rejectionReason = '') => {
    const url = rejectionReason 
      ? `/admin/products/${productId}/status?new_status=${newStatus}&rejection_reason=${encodeURIComponent(rejectionReason)}`
      : `/admin/products/${productId}/status?new_status=${newStatus}`;
    const res = await apiClient.patch(url);
    return res.data;
  },
  getSellerDetails: async (sellerId) => {
    const res = await apiClient.get(`/admin/sellers/${sellerId}/details`);
    return res.data;
  },
  deleteSeller: async (sellerId) => {
    const res = await apiClient.delete(`/admin/sellers/${sellerId}`);
    return res.data;
  },
  deleteProduct: async (productId) => {
    const res = await apiClient.delete(`/admin/products/${productId}`);
    return res.data;
  },
  getSellerProducts: async (sellerId = null) => {
    const url = sellerId ? `/admin/products?seller_id=${sellerId}` : '/admin/products';
    const res = await apiClient.get(url);
    return res.data;
  },
  getUsers: async (params = {}) => {
    const res = await apiClient.get('/admin/users', { params });
    return res.data;
  },
  updateUser: async (userId, data) => {
    const res = await apiClient.patch(`/admin/users/${userId}`, data);
    return res.data;
  },
  deleteUser: async (userId) => {
    const res = await apiClient.delete(`/admin/users/${userId}`);
    return res.data;
  },
  getCategories: async () => {
    const res = await apiClient.get('/admin/categories');
    return res.data;
  },
  createCategory: async ({ name, icon, description }) => {
    const res = await apiClient.post('/admin/categories', { name, icon, description });
    return res.data;
  },
  updateCategory: async (id, data) => {
    const res = await apiClient.patch(`/admin/categories/${id}`, data);
    return res.data;
  },
  deleteCategory: async (id) => {
    const res = await apiClient.delete(`/admin/categories/${id}`);
    return res.data;
  },
  getBrands: async () => {
    const res = await apiClient.get('/admin/brands');
    return res.data;
  },
  createBrand: async (data) => {
    const res = await apiClient.post('/admin/brands', data);
    return res.data;
  },
  updateBrand: async (id, data) => {
    const res = await apiClient.patch(`/admin/brands/${id}`, data);
    return res.data;
  },
  deleteBrand: async (id) => {
    const res = await apiClient.delete(`/admin/brands/${id}`);
    return res.data;
  },
  getDataSources: async () => {
    const res = await apiClient.get('/data-sources');
    return res.data;
  },
  updateDataSourceStatus: async (sourceId, statusVal, errorMessage = '') => {
    const res = await apiClient.patch(`/data-sources/${sourceId}/status?status_val=${statusVal}&error_message=${encodeURIComponent(errorMessage)}`);
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await apiClient.get('/admin/audit-logs');
    return res.data;
  },
  getTrends: async () => {
    const res = await apiClient.get('/admin/trends');
    return res.data;
  },
  triggerScraperSync: async (itemsPerCategory = 5) => {
    const res = await apiClient.post(`/scraper/sync-texnomart?items_per_category=${itemsPerCategory}`);
    return res.data;
  },
  getScraperStatus: async () => {
    const res = await apiClient.get('/scraper/status');
    return res.data;
  }
};

export const uploadService = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

export const productService = {
  getProducts: async (params = {}) => {
    const res = await apiClient.get('/products', { params });
    return res.data;
  },
  searchProducts: async (params = {}) => {
    const res = await apiClient.get('/products/search', { params });
    return res.data;
  },
  getProductDetail: async (id) => {
    const res = await apiClient.get(`/products/${id}`);
    return res.data;
  }
};
