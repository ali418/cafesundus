import axios from 'axios';
import { getToken, getRefreshToken, saveAuthData, clearAuthData } from '../services/authService';

// Configure axios with defaults
axios.defaults.timeout = 10000; // 10 seconds timeout
axios.defaults.timeoutErrorMessage = 'Server request timed out. Please try again later.';

// Get API URL from environment variables with fallback
const API_URL = process.env.REACT_APP_API_URL || '/api/v1'; // Use relative path to work with CRA proxy

// Define direct backend URL for special cases
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3005';

// Create axios instance with retry logic
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication and logging
axiosInstance.interceptors.request.use(
  (config) => {
    // Add authentication token to request if available
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized error (token expired)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          // No refresh token available, clear auth data and reject
          clearAuthData();
          return Promise.reject({
            message: 'Authentication expired. Please login again.',
            originalError: error,
          });
        }
        
        // Call the refresh token endpoint
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken: refreshToken
        });
        
        // Save the new tokens
        if (response.data.token && response.data.refreshToken) {
          saveAuthData(response.data.token, response.data.refreshToken, response.data.user);
          
          // Update the failed request with the new token and retry
          originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // If refresh token fails, clear auth data and reject
        console.error('Token refresh failed:', refreshError);
        clearAuthData();
        return Promise.reject({
          message: 'Authentication expired. Please login again.',
          originalError: error,
        });
      }
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network Error: Unable to connect to the server. Please check your internet connection or the server status.');
      error.friendlyMessage = 'Unable to connect to the server. Please check your internet connection or try again later.';
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout Error: The request took too long to complete.');
      error.friendlyMessage = 'The request took too long to complete. Please try again later.';
    }
    
    // Handle server errors
    if (error.response && error.response.status >= 500) {
      console.error(`Server Error: ${error.response.status} ${error.response.statusText}`);
      error.friendlyMessage = 'The server encountered an error. Please try again later.';
    }
    
    // Handle client errors
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      console.error(`Client Error: ${error.response.status} ${error.response.statusText}`);
      error.friendlyMessage = error.response.data.message || 'An error occurred with your request. Please check your inputs and try again.';
    }
    
    return Promise.reject(error);
  }
);

const apiService = {
  // Auth
  async login(username, password) {
    try {
      const response = await axiosInstance.post('/auth/login', { username, password });
      return {
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        user: response.data.user,
      };
    } catch (error) {
      console.error('Error logging in:', error.message || error);
      throw new Error(error.friendlyMessage || error.response?.data?.message || 'Login failed. Please try again.');
    }
  },
  
  // Online Orders
  createOrder: async (orderData) => {
    try {
      const response = await axiosInstance.post('/orders', orderData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      error.userMessage = error.friendlyMessage || 'Failed to create order. Please try again later.';
      throw error;
    }
  },
  
  createOrderWithImage: async (formData) => {
    try {
      const response = await axiosInstance.post('/orders/with-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating order with image:', error);
      error.userMessage = error.friendlyMessage || 'Failed to create order. Please try again later.';
      throw error;
    }
  },
  
  getOrders: async (params) => {
    try {
      const response = await axiosInstance.get('/orders', { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load orders. Please try again later.';
      throw error;
    }
  },
  
  getOrderById: async (id) => {
    try {
      const response = await axiosInstance.get(`/orders/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      error.userMessage = error.friendlyMessage || `Failed to load order details. Please try again later.`;
      throw error;
    }
  },
  
  updateOrderStatus: async (id, status) => {
    try {
      const response = await axiosInstance.put(`/orders/${id}/status`, { status });
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error updating order status ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to update order status. Please try again later.';
      throw error;
    }
  },
  
  // Notifications
  getNotifications: async (params) => {
    try {
      const response = await axiosInstance.get('/notifications', { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load notifications. Please try again later.';
      throw error;
    }
  },
  
  getAdminNotifications: async (params) => {
    try {
      const response = await axiosInstance.get('/notifications/admin', { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load admin notifications. Please try again later.';
      throw error;
    }
  },
  
  getOnlineOrderNotifications: async (params) => {
    try {
      const response = await axiosInstance.get('/notifications/online-orders', { params });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching online order notifications:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load online order notifications. Please try again later.';
      throw error;
    }
  },
  
  getUnreadNotificationCount: async () => {
    try {
      const response = await axiosInstance.get('/notifications/unread-count');
      return response.data.data.count || 0;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      return 0; // Return 0 on error to avoid breaking the UI
    }
  },
  
  getUnreadOnlineOrderCount: async () => {
    try {
      const response = await axiosInstance.get('/notifications/unread-online-orders-count');
      return response.data.data.count || 0;
    } catch (error) {
      console.error('Error fetching unread online order count:', error);
      return 0; // Return 0 on error to avoid breaking the UI
    }
  },
  
  markNotificationAsRead: async (id) => {
    try {
      const response = await axiosInstance.put(`/notifications/${id}/read`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  },
  
  markAllNotificationsAsRead: async () => {
    try {
      const response = await axiosInstance.put('/notifications/mark-all-read');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Products
  // Use direct backend URL to avoid proxy timeout issues
  getProducts: async (params = {}) => {
    try {
      console.log('Fetching products directly from backend...');
      // Create a direct axios request to backend instead of using proxy
      const response = await axios.get(`${BACKEND_URL}/api/v1/products`, { 
        params, 
        timeout: 30000,
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      // Backend returns { success: true, count, data: [...] }
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },
  
  // Check if barcode exists
  checkBarcodeExists: async (barcode) => {
    try {
      const products = await apiService.getProducts();
      return products.some(product => product.barcode === barcode);
    } catch (error) {
      console.error('Error checking barcode existence:', error);
      error.userMessage = error.friendlyMessage || 'Failed to check barcode. Please try again later.';
      throw error;
    }
  },
  
  // Generate unique barcode
  generateUniqueBarcode: async () => {
    try {
      // Get all products to check against existing barcodes
      const products = await apiService.getProducts();
      const existingBarcodes = products.map(product => product.barcode).filter(Boolean);
      
      // Generate a new barcode and check if it already exists
      let newBarcode;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10; // Prevent infinite loop
      
      while (!isUnique && attempts < maxAttempts) {
        // Generate a random 12-digit barcode
        newBarcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        isUnique = !existingBarcodes.includes(newBarcode);
        attempts++;
      }
      
      if (!isUnique) {
        throw new Error('Could not generate a unique barcode after multiple attempts');
      }
      
      return newBarcode;
    } catch (error) {
      console.error('Error generating unique barcode:', error);
      error.userMessage = error.friendlyMessage || 'Failed to generate unique barcode. Please try again later.';
      throw error;
    }
  },

  getProductById: async (id) => {
    try {
      const response = await axiosInstance.get(`/products/${id}`);
      // The backend returns { success: true, data: {...product} }
      return response.data.data || {};
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      error.userMessage = error.friendlyMessage || `Failed to load product details. Please try again later.`;
      throw error;
    }
  },

  createProduct: async (productData) => {
    try {
      const response = await axiosInstance.post('/products', productData);
      // The backend returns { success: true, data: {...product} }
      return response.data.data || {};
    } catch (error) {
      console.error('Error creating product:', error);
      error.userMessage = error.friendlyMessage || 'Failed to create product. Please check your inputs and try again.';
      throw error;
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const response = await axiosInstance.put(`/products/${id}`, productData);
      // The backend returns { success: true, data: {...product} }
      return response.data.data || {};
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to update product. Please check your inputs and try again.';
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await axiosInstance.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to delete product. Please try again later.';
      throw error;
    }
  },

  // Categories
  getCategories: async () => {
    try {
      const response = await axiosInstance.get('/categories');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load categories. Please try again later.';
      throw error;
    }
  },

  getCategoryById: async (id) => {
    try {
      const response = await axiosInstance.get(`/categories/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      error.userMessage = error.friendlyMessage || `Failed to load category details. Please try again later.`;
      throw error;
    }
  },

  createCategory: async (categoryData) => {
    try {
      const response = await axiosInstance.post('/categories', categoryData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating category:', error);
      error.userMessage = error.friendlyMessage || 'Failed to create category. Please check your inputs and try again.';
      throw error;
    }
  },

  updateCategory: async (id, categoryData) => {
    try {
      const response = await axiosInstance.put(`/categories/${id}`, categoryData);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to update category. Please check your inputs and try again.';
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      const response = await axiosInstance.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to delete category. Please try again later.';
      throw error;
    }
  },

  // Sales API methods
  getSales: async () => {
    try {
      const response = await axiosInstance.get('/sales');
      console.log('Raw sales API response:', response);
      // The backend returns { success: true, count: X, data: [...sales] }
      const sales = response.data.data || [];
      console.log('Processed sales:', sales);
      return sales;
    } catch (error) {
      console.error('Error fetching sales:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load sales. Please try again later.';
      throw error;
    }
  },

  getSaleById: async (id) => {
    try {
      const response = await axiosInstance.get(`/sales/${id}`);
      return response.data.data || {};
    } catch (error) {
      console.error(`Error fetching sale ${id}:`, error);
      error.userMessage = error.friendlyMessage || `Failed to load sale details. Please try again later.`;
      throw error;
    }
  },

  createSale: async (saleData) => {
    try {
      const response = await axiosInstance.post('/sales', saleData);
      return response.data.data || {};
    } catch (error) {
      console.error('Error creating sale:', error);
      error.userMessage = error.friendlyMessage || 'Failed to create sale. Please check your inputs and try again.';
      throw error;
    }
  },

  deleteSale: async (id) => {
    try {
      const response = await axiosInstance.delete(`/sales/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting sale ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to delete sale. Please try again later.';
      throw error;
    }
  },

  updateSale: async (id, saleData) => {
    try {
      const response = await axiosInstance.put(`/sales/${id}`, saleData);
      return response.data.data || {};
    } catch (error) {
      console.error(`Error updating sale ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to update sale. Please check your inputs and try again.';
      throw error;
    }
  },

  // Customers API methods
  getCustomers: async () => {
    try {
      const response = await axiosInstance.get('/customers');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load customers. Please try again later.';
      throw error;
    }
  },

  getCustomerById: async (id) => {
    try {
      const response = await axiosInstance.get(`/customers/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching customer ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to load customer. Please try again later.';
      throw error;
    }
  },

  createCustomer: async (customerData) => {
    try {
      const response = await axiosInstance.post('/customers', customerData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      error.userMessage = error.friendlyMessage || 'Failed to create customer. Please check your inputs and try again.';
      throw error;
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      const response = await axiosInstance.put(`/customers/${id}`, customerData);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error updating customer ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to update customer. Please check your inputs and try again.';
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    try {
      const response = await axiosInstance.delete(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting customer ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to delete customer. Please try again later.';
      throw error;
    }
  },

  // Get customer sales history
  getCustomerSales: async (id) => {
    try {
      const response = await axiosInstance.get(`/customers/${id}/sales`);
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching customer sales ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to load customer sales history. Please try again later.';
      throw error;
    }
  },

  // File Upload API methods
  uploadFile: async (file) => {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Set headers for file upload
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      
      const response = await axiosInstance.post('/uploads', formData, config);
      return response.data.data || {};
    } catch (error) {
      console.error('Error uploading file:', error);
      error.userMessage = error.friendlyMessage || 'Failed to upload file. Please try again later.';
      throw error;
    }
  },

  deleteFile: async (fileName) => {
    try {
      const response = await axiosInstance.delete(`/uploads/${fileName}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting file ${fileName}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to delete file. Please try again later.';
      throw error;
    }
  },
  
  // Helper methods
  isServerRunning: async () => {
    try {
      await axiosInstance.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  },

  // Inventory API methods
  getInventory: async () => {
    try {
      const response = await axiosInstance.get('/inventory');
      console.log('Raw inventory API response:', response);
      // The backend returns { success: true, count: X, data: [...inventory] }
      const inventory = response.data.data || [];
      console.log('Processed inventory:', inventory);
      return inventory;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load inventory. Please try again later.';
      throw error;
    }
  },

  getInventoryById: async (id) => {
    try {
      const response = await axiosInstance.get(`/inventory/${id}`);
      return response.data.data || {};
    } catch (error) {
      console.error(`Error fetching inventory ${id}:`, error);
      error.userMessage = error.friendlyMessage || `Failed to load inventory details. Please try again later.`;
      throw error;
    }
  },

  createInventory: async (inventoryData) => {
    try {
      const response = await axiosInstance.post('/inventory', inventoryData);
      return response.data.data || {};
    } catch (error) {
      console.error('Error creating inventory:', error);
      error.userMessage = error.friendlyMessage || 'Failed to create inventory. Please check your inputs and try again.';
      throw error;
    }
  },

  updateInventory: async (id, inventoryData) => {
    try {
      const response = await axiosInstance.put(`/inventory/${id}`, inventoryData);
      return response.data.data || {};
    } catch (error) {
      console.error(`Error updating inventory ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to update inventory. Please check your inputs and try again.';
      throw error;
    }
  },

  adjustInventory: async (id, adjustmentData) => {
    try {
      const response = await axiosInstance.patch(`/inventory/${id}/adjust`, adjustmentData);
      return response.data.data || {};
    } catch (error) {
      console.error(`Error adjusting inventory ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to adjust inventory. Please check your inputs and try again.';
      throw error;
    }
  },

  deleteInventory: async (id) => {
    try {
      const response = await axiosInstance.delete(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting inventory ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to delete inventory. Please try again later.';
      throw error;
    }
  },

  getInventoryTransactions: async (id) => {
    try {
      const response = await axiosInstance.get(`/inventory/${id}/transactions`);
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching inventory transactions for ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to load inventory transactions. Please try again later.';
      throw error;
    }
  },

  // Fallback data methods
  getFallbackProducts: () => {
    return [
      // Empty array as fallback
    ];
  },

  getFallbackCategories: () => {
    return [
      { id: 1, name: 'All' }
    ];
  },
  // Reports API methods
  getLowStockProducts: async () => {
    try {
      const response = await axiosInstance.get('/reports/low-stock');
      console.log('Raw low stock API response:', response);
      // The backend returns { success: true, count: X, data: [...items] }
      const lowStockItems = response.data.data || [];
      console.log('Processed low stock items:', lowStockItems);
      return lowStockItems;
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load low stock products. Please try again later.';
      throw error;
    }
  },

  getSalesReport: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await axiosInstance.get(`/reports/sales?${params.toString()}`);
      console.log('Raw sales report API response:', response);
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching sales report:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load sales report. Please try again later.';
      throw error;
    }
  },

  getRevenueReport: async (startDate, endDate, groupBy = 'day') => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('groupBy', groupBy);
      
      const response = await axiosInstance.get(`/reports/revenue?${params.toString()}`);
      console.log('Raw revenue report API response:', response);
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching revenue report:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load revenue report. Please try again later.';
      throw error;
    }
  },

  getInventoryReport: async () => {
    try {
      const response = await axiosInstance.get('/reports/inventory');
      console.log('Raw inventory report API response:', response);
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load inventory report. Please try again later.';
      throw error;
    }
  },

  getTopSellingProducts: async (startDate, endDate, limit = 10) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('limit', limit.toString());
      
      const response = await axiosInstance.get(`/reports/top-products?${params.toString()}`);
      console.log('Raw top products API response:', response);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching top selling products:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load top selling products. Please try again later.';
      throw error;
    }
  },

  getSalesByCategory: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await axiosInstance.get(`/reports/sales-by-category?${params.toString()}`);
      console.log('Raw sales by category API response:', response);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching sales by category:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load sales by category. Please try again later.';
      throw error;
    }
  },

  getCustomerReport: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await axiosInstance.get(`/reports/customers?${params.toString()}`);
      console.log('Raw customer report API response:', response);
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching customer report:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load customer report. Please try again later.';
      throw error;
    }
  },

  // Notifications API methods
  getNotifications: async () => {
    try {
      const response = await axiosInstance.get('/notifications');
      console.log('Raw notifications API response:', response);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Return mock data if API fails
      return [
        {
          id: 1,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: 'Apple has low stock',
          isRead: false,
          createdAt: new Date().toISOString(),
          data: { item: 'Apple' }
        },
        {
          id: 2,
          type: 'new_order',
          title: 'New Order',
          message: 'New order #1234',
          isRead: false,
          createdAt: new Date().toISOString(),
          data: { number: '1234' }
        },
        {
          id: 3,
          type: 'payment_received',
          title: 'Payment Received',
          message: 'Payment received from Customer #5678',
          isRead: false,
          createdAt: new Date().toISOString(),
          data: { number: '5678' }
        }
      ];
    }
  },

  markNotificationAsRead: async (id) => {
    try {
      const response = await axiosInstance.patch(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to mark notification as read.';
      throw error;
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      const response = await axiosInstance.patch('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      error.userMessage = error.friendlyMessage || 'Failed to mark all notifications as read.';
      throw error;
    }
  },

  deleteNotification: async (id) => {
    try {
      const response = await axiosInstance.delete(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to delete notification.';
      throw error;
    }
  },

  getUnreadNotificationsCount: async () => {
    try {
      const response = await axiosInstance.get('/notifications/unread-count');
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
      // Return mock count if API fails
      return 3;
    }
  },

  // Settings
  getSettings: async () => {
    try {
      const response = await axiosInstance.get('/settings');
      // backend returns { success: true, data: {...} }
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load settings.';
      throw error;
    }
  },

  updateSettings: async (settings) => {
    try {
      const response = await axiosInstance.put('/settings', settings);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      error.userMessage = error.friendlyMessage || 'Failed to save settings.';
      throw error;
    }
  },
  async getProfile() {
    try {
      // Force authentication header to ensure we get the correct user profile
      const token = getToken();
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axiosInstance.get('/users/profile', config);
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching profile:', error.message || error);
      throw new Error(error.userMessage || 'Failed to fetch profile. Please try again.');
    }
  },

  // New: Login history for current user
  async getMyLoginHistory({ page = 1, limit = 20 } = {}) {
    try {
      // Force authentication header to ensure we get the correct user's login history
      const token = getToken();
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit }
      };
      const response = await axiosInstance.get('/users/profile/login-history', config);
      // backend returns { success, data: [], pagination }
      return response.data;
    } catch (error) {
      console.error('Error fetching my login history:', error.message || error);
      throw new Error(error.userMessage || 'Failed to fetch login history.');
    }
  },

  // New: Login history for a specific user (admin/self)
  async getUserLoginHistory(userId, { page = 1, limit = 20 } = {}) {
    try {
      const response = await axiosInstance.get(`/users/${userId}/login-history`, { params: { page, limit } });
      return response.data;
    } catch (error) {
      console.error(`Error fetching login history for user ${userId}:`, error.message || error);
      throw new Error(error.userMessage || 'Failed to fetch user login history.');
    }
  },

  async updateProfile(id, profileData) {
    try {
      // Force authentication header to ensure we update the correct user profile
      const token = getToken();
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axiosInstance.put(`/users/${id}`, profileData, config);
      return response.data.data || {};
    } catch (error) {
      console.error('Error updating profile:', error.message || error);
      throw new Error(error.userMessage || 'Failed to update profile. Please try again.');
    }
  },

  async changePassword(id, passwordData) {
    try {
      // Force authentication header to ensure we change password for the correct user
      const token = getToken();
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axiosInstance.patch(`/users/${id}/change-password`, passwordData, config);
      return response.data || {};
    } catch (error) {
      console.error('Error changing password:', error.message || error);
      throw new Error(error.userMessage || 'Failed to change password. Please try again.');
    }
  },

  // Users Management
  async getUsers({ page = 1, limit = 20, search = '', role = '', includeDeleted = false } = {}) {
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (role) params.role = role;
      if (includeDeleted) params.includeDeleted = true;
      
      const response = await axiosInstance.get('/users', { params });
      return response.data || { data: [], pagination: { total: 0 } };
    } catch (error) {
      console.error('Error fetching users:', error.message || error);
      throw new Error(error.userMessage || 'Failed to fetch users. Please try again.');
    }
  },

  async getUserById(id) {
    try {
      const response = await axiosInstance.get(`/users/${id}`);
      return response.data.data || {};
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error.message || error);
      throw new Error(error.userMessage || 'Failed to fetch user details. Please try again.');
    }
  },

  async createUser(userData) {
    try {
      const response = await axiosInstance.post('/users', userData);
      return response.data.data || {};
    } catch (error) {
      console.error('Error creating user:', error.message || error);
      throw new Error(error.userMessage || error.response?.data?.message || 'Failed to create user. Please try again.');
    }
  },

  async updateUser(id, userData) {
    try {
      const response = await axiosInstance.put(`/users/${id}`, userData);
      return response.data.data || {};
    } catch (error) {
      console.error(`Error updating user ${id}:`, error.message || error);
      throw new Error(error.userMessage || error.response?.data?.message || 'Failed to update user. Please try again.');
    }
  },

  async deleteUser(id) {
    try {
      const response = await axiosInstance.delete(`/users/${id}`);
      return response.data || {};
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error.message || error);
      throw new Error(error.userMessage || error.response?.data?.message || 'Failed to delete user. Please try again.');
    }
  },

  async toggleUserStatus(id, isActive) {
    try {
      const response = await axiosInstance.put(`/users/${id}`, { isActive });
      return response.data.data || {};
    } catch (error) {
      console.error(`Error toggling user status ${id}:`, error.message || error);
      throw new Error(error.userMessage || 'Failed to update user status. Please try again.');
    }
  }
};

export default apiService;