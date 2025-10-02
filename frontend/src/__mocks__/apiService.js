// Mock implementation of apiService
const apiService = {
  getProducts: jest.fn(() => Promise.resolve([])),
  getProductById: jest.fn((id) => Promise.resolve({})),
  createProduct: jest.fn((productData) => Promise.resolve(productData)),
  updateProduct: jest.fn((id, productData) => Promise.resolve(productData)),
  deleteProduct: jest.fn((id) => Promise.resolve()),
  
  getCategories: jest.fn(() => Promise.resolve([])),
  getCategoryById: jest.fn((id) => Promise.resolve({})),
  createCategory: jest.fn((categoryData) => Promise.resolve(categoryData)),
  updateCategory: jest.fn((id, categoryData) => Promise.resolve(categoryData)),
  deleteCategory: jest.fn((id) => Promise.resolve()),
  
  getSales: jest.fn(() => Promise.resolve([])),
  getSaleById: jest.fn((id) => Promise.resolve({})),
  createSale: jest.fn((saleData) => Promise.resolve(saleData)),
  deleteSale: jest.fn((id) => Promise.resolve()),
  
  getCustomers: jest.fn(() => Promise.resolve([])),
  
  uploadFile: jest.fn((file) => Promise.resolve({ fileName: 'test.jpg' })),
  deleteFile: jest.fn((fileName) => Promise.resolve()),
  
  isServerRunning: jest.fn(() => Promise.resolve(true)),
  
  getInventory: jest.fn(() => Promise.resolve([])),
  getInventoryById: jest.fn((id) => Promise.resolve({})),
  createInventory: jest.fn((inventoryData) => Promise.resolve(inventoryData)),
  updateInventory: jest.fn((id, inventoryData) => Promise.resolve(inventoryData)),
  adjustInventory: jest.fn((id, adjustmentData) => Promise.resolve()),
  deleteInventory: jest.fn((id) => Promise.resolve()),
  getInventoryTransactions: jest.fn((id) => Promise.resolve([])),
  
  getFallbackProducts: jest.fn(() => []),
  getFallbackCategories: jest.fn(() => []),
  
  getLowStockProducts: jest.fn(() => Promise.resolve([])),
  getSalesReport: jest.fn((startDate, endDate) => Promise.resolve({})),
  getRevenueReport: jest.fn((startDate, endDate, groupBy) => Promise.resolve({})),
  getInventoryReport: jest.fn(() => Promise.resolve({})),
  getTopSellingProducts: jest.fn((startDate, endDate, limit) => Promise.resolve([])),
  getSalesByCategory: jest.fn((startDate, endDate) => Promise.resolve([])),
  getCustomerReport: jest.fn((startDate, endDate) => Promise.resolve({})),
  
  getNotifications: jest.fn(() => Promise.resolve([])),
  markNotificationAsRead: jest.fn((id) => Promise.resolve()),
  markAllNotificationsAsRead: jest.fn(() => Promise.resolve()),
  deleteNotification: jest.fn((id) => Promise.resolve()),
  getUnreadNotificationsCount: jest.fn(() => Promise.resolve(0)),
  
  getSettings: jest.fn(() => Promise.resolve({})),
  updateSettings: jest.fn((settings) => Promise.resolve(settings))
};

export default apiService;