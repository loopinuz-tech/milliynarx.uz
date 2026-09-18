import apiClient from './client';

export const authService = {
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },
  register: async (userData) => {
    const res = await apiClient.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
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
  getSuggestions: async (q, limit = 8) => {
    const res = await apiClient.get('/products/suggest', { params: { q, limit } });
    return res.data;
  },
  getProductDetail: async (id) => {
    const res = await apiClient.get(`/products/${id}`);
    return res.data;
  },
  getCategoryStats: async () => {
    const res = await apiClient.get('/products/category-stats');
    return res.data;
  },
  getCategoryAnalytics: async (categoryId) => {
    const res = await apiClient.get(`/products/category/${categoryId}/analytics`);
    return res.data;
  },
  getProductAllSellers: async (productId) => {
    const res = await apiClient.get(`/products/${productId}/all-sellers`);
    return res.data;
  }
};

export const sellerService = {
  getMetrics: async () => {
    const res = await apiClient.get('/seller/metrics');
    return res.data;
  },
  getProducts: async (params = {}) => {
    const res = await apiClient.get('/seller/products', { params });
    return res.data;
  },
  createProduct: async (data) => {
    const res = await apiClient.post('/seller/products', data);
    return res.data;
  },
  updateProduct: async (id, data) => {
    const res = await apiClient.patch(`/seller/products/${id}`, data);
    return res.data;
  },
  getPriceHistory: async () => {
    const res = await apiClient.get('/seller/price-history');
    return res.data;
  },
  getStore: async () => {
    const res = await apiClient.get('/seller/store');
    return res.data;
  },
  getProduct: async (id) => {
    const res = await apiClient.get(`/seller/products/${id}`);
    return res.data;
  },
  deleteProduct: async (id) => {
    const res = await apiClient.delete(`/seller/products/${id}`);
    return res.data;
  },
  updateStore: async (data) => {
    const res = await apiClient.patch('/seller/store', data);
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
  deleteProduct: async (productId) => {
    const res = await apiClient.delete(`/admin/products/${productId}`);
    return res.data;
  },
  createProduct: async (data, sellerId = null) => {
    const url = sellerId ? `/admin/products?seller_id=${sellerId}` : '/admin/products';
    const res = await apiClient.post(url, data);
    return res.data;
  },
  getUsers: async (params = {}) => {
    const res = await apiClient.get('/admin/users', { params });
    return res.data;
  },
  getCategories: async () => {
    const res = await apiClient.get('/admin/categories');
    return res.data;
  },
  createCategory: async (name, icon = 'Box', description = '') => {
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
  }
};

export const compareService = {
  compare: async (productIds) => {
    const res = await apiClient.get(`/compare?ids=${productIds.join(',')}`);
    return res.data;
  }
};

export const favoriteService = {
  getFavorites: async () => {
    const res = await apiClient.get('/favorites');
    return res.data;
  },
  toggle: async (productId) => {
    const res = await apiClient.post(`/favorites/${productId}`);
    return res.data;
  }
};

export const alertService = {
  getAlerts: async () => {
    const res = await apiClient.get('/alerts');
    return res.data;
  },
  createAlert: async (productId, targetPrice) => {
    const res = await apiClient.post('/alerts', { product_id: productId, target_price: targetPrice });
    return res.data;
  },
  deleteAlert: async (alertId) => {
    const res = await apiClient.delete(`/alerts/${alertId}`);
    return res.data;
  },
  getNotifications: async () => {
    const res = await apiClient.get('/alerts/notifications');
    return res.data;
  },
  markAsRead: async (notifId) => {
    const res = await apiClient.patch(`/alerts/notifications/${notifId}/read`);
    return res.data;
  },
  testTriggerAlert: async (alertId) => {
    const res = await apiClient.post(`/alerts/test-trigger/${alertId}`);
    return res.data;
  },
  checkAllAlerts: async () => {
    const res = await apiClient.post('/alerts/check-all');
    return res.data;
  }
};

export const telegramService = {
  getStatus: async () => {
    const res = await apiClient.get('/telegram/status');
    return res.data;
  },
  getConnection: async () => {
    const res = await apiClient.get('/telegram/my-connection');
    return res.data;
  },
  connectManual: async (chatId, username = null) => {
    const res = await apiClient.post('/telegram/connect-manual', {
      telegram_chat_id: String(chatId),
      telegram_username: username
    });
    return res.data;
  },
  disconnect: async () => {
    const res = await apiClient.post('/telegram/disconnect');
    return res.data;
  },
  sendTestAlert: async () => {
    const res = await apiClient.post('/telegram/test-alert');
    return res.data;
  },
  syncUpdates: async () => {
    const res = await apiClient.get('/telegram/sync');
    return res.data;
  }
};

export const aiService = {
  analyzeProduct: async (productId) => {
    const res = await apiClient.post('/ai/analyze', { product_id: productId });
    return res.data;
  },
  chat: async (message, history = [], productId = null) => {
    const res = await apiClient.post('/ai/chat', { 
      message, 
      history, 
      product_id: productId 
    });
    return res.data;
  },
  getMarketSummary: async () => {
    const res = await apiClient.get('/ai/market-summary');
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
