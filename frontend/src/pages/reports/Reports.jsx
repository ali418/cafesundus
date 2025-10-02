import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrency } from '../../redux/slices/settingsSlice';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Search,
  Print,
  FileDownload,
  AttachMoney,
  TrendingUp,
  ShoppingCart,
  Inventory,
  Category,
  People,
} from '@mui/icons-material';
// Using standard HTML date inputs instead of MUI date pickers
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import apiService from '../../api/apiService';

// Demo data for sales report
const demoSalesData = [
  { date: '2023-01-01', sales: 4000, profit: 2400, transactions: 12 },
  { date: '2023-01-02', sales: 3000, profit: 1398, transactions: 10 },
  { date: '2023-01-03', sales: 2000, profit: 9800, transactions: 8 },
  { date: '2023-01-04', sales: 2780, profit: 3908, transactions: 15 },
  { date: '2023-01-05', sales: 1890, profit: 4800, transactions: 7 },
  { date: '2023-01-06', sales: 2390, profit: 3800, transactions: 11 },
  { date: '2023-01-07', sales: 3490, profit: 4300, transactions: 14 },
  { date: '2023-01-08', sales: 2490, profit: 3300, transactions: 9 },
  { date: '2023-01-09', sales: 2900, profit: 4100, transactions: 13 },
  { date: '2023-01-10', sales: 3200, profit: 4500, transactions: 16 },
];

// Demo data for category distribution
const demoCategoryData = [
  { name: 'Fruits', value: 400 },
  { name: 'Vegetables', value: 300 },
  { name: 'Dairy', value: 300 },
  { name: 'Bakery', value: 200 },
  { name: 'Meat', value: 150 },
  { name: 'Grains', value: 100 },
];

// Demo data for top selling products
const demoTopProducts = [
  { id: 1, name: 'Apples', category: 'Fruits', quantity: 120, revenue: 480, profit: 240 },
  { id: 2, name: 'Milk', category: 'Dairy', quantity: 100, revenue: 400, profit: 200 },
  { id: 3, name: 'Bread', category: 'Bakery', quantity: 90, revenue: 270, profit: 135 },
  { id: 4, name: 'Chicken', category: 'Meat', quantity: 80, revenue: 640, profit: 320 },
  { id: 5, name: 'Tomatoes', category: 'Vegetables', quantity: 75, revenue: 225, profit: 112 },
  { id: 6, name: 'Rice', category: 'Grains', quantity: 70, revenue: 280, profit: 140 },
  { id: 7, name: 'Eggs', category: 'Dairy', quantity: 65, revenue: 195, profit: 97 },
  { id: 8, name: 'Bananas', category: 'Fruits', quantity: 60, revenue: 180, profit: 90 },
  { id: 9, name: 'Potatoes', category: 'Vegetables', quantity: 55, revenue: 165, profit: 82 },
  { id: 10, name: 'Beef', category: 'Meat', quantity: 50, revenue: 500, profit: 250 },
];

// Demo data for inventory
const demoInventoryData = [
  { id: 1, name: 'Apples', category: 'Fruits', currentStock: 50, minStock: 20, value: 200 },
  { id: 2, name: 'Milk', category: 'Dairy', currentStock: 30, minStock: 15, value: 120 },
  { id: 3, name: 'Bread', category: 'Bakery', currentStock: 25, minStock: 10, value: 75 },
  { id: 4, name: 'Chicken', category: 'Meat', currentStock: 15, minStock: 10, value: 120 },
  { id: 5, name: 'Tomatoes', category: 'Vegetables', currentStock: 40, minStock: 15, value: 120 },
  { id: 6, name: 'Rice', category: 'Grains', currentStock: 60, minStock: 20, value: 240 },
  { id: 7, name: 'Eggs', category: 'Dairy', currentStock: 45, minStock: 20, value: 135 },
  { id: 8, name: 'Bananas', category: 'Fruits', currentStock: 35, minStock: 15, value: 105 },
  { id: 9, name: 'Potatoes', category: 'Vegetables', currentStock: 55, minStock: 20, value: 165 },
  { id: 10, name: 'Beef', category: 'Meat', currentStock: 10, minStock: 5, value: 100 },
];

// Demo data for customers
const demoCustomerData = [
  { id: 1, name: 'John Doe', totalPurchases: 1200, visits: 8, lastPurchase: '2023-01-05', loyaltyPoints: 120 },
  { id: 2, name: 'Jane Smith', totalPurchases: 950, visits: 6, lastPurchase: '2023-01-07', loyaltyPoints: 95 },
  { id: 3, name: 'Robert Johnson', totalPurchases: 1500, visits: 10, lastPurchase: '2023-01-02', loyaltyPoints: 150 },
  { id: 4, name: 'Emily Davis', totalPurchases: 800, visits: 5, lastPurchase: '2023-01-08', loyaltyPoints: 80 },
  { id: 5, name: 'Michael Brown', totalPurchases: 2000, visits: 12, lastPurchase: '2023-01-01', loyaltyPoints: 200 },
  { id: 6, name: 'Sarah Wilson', totalPurchases: 600, visits: 4, lastPurchase: '2023-01-09', loyaltyPoints: 60 },
  { id: 7, name: 'David Taylor', totalPurchases: 1100, visits: 7, lastPurchase: '2023-01-04', loyaltyPoints: 110 },
  { id: 8, name: 'Lisa Anderson', totalPurchases: 1300, visits: 9, lastPurchase: '2023-01-03', loyaltyPoints: 130 },
  { id: 9, name: 'James Martinez', totalPurchases: 750, visits: 5, lastPurchase: '2023-01-06', loyaltyPoints: 75 },
  { id: 10, name: 'Jennifer Thomas', totalPurchases: 1700, visits: 11, lastPurchase: '2023-01-01', loyaltyPoints: 170 },
];

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Reports = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currency = useSelector(selectCurrency);
  
  // Set document title
  useEffect(() => {
    document.title = t('common:pageTitle.reports');
  }, [t]);
  
  // State for date range
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6); // last 7 days including today
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  });
  
  // State for report type
  const [reportType, setReportType] = useState('sales');
  
  // State for category filter
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // State for categories
  const [categories, setCategories] = useState([]);
  
  // State for search term
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for loading
  const [loading, setLoading] = useState(false);
  
  // State for error
  const [error, setError] = useState(null);
  
  // State for report data
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Format date for API
  const formatDateForAPI = (date) => {
    if (!date) return '';
    return date instanceof Date 
      ? date.toISOString().split('T')[0]
      : new Date(date).toISOString().split('T')[0];
  };
  
  // Handle report type change
  const handleReportTypeChange = (event, newValue) => {
    setReportType(newValue);
    setPage(0);
  };
  
  // Handle category filter change
  const handleCategoryFilterChange = (event) => {
    setCategoryFilter(event.target.value);
    setPage(0);
  };
  
  // Handle search term change
  const handleSearchTermChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Filter data based on search term and category filter
  const getFilteredData = (data) => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    return data.filter(item => {
      const matchesSearch = searchTerm === '' || 
        (item && item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || 
        (item && item.category && item.category === categoryFilter);
      
      return matchesSearch && matchesCategory;
    });
  };
  
  // Load reports data
  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Format dates for API
      const formattedStartDate = formatDateForAPI(startDate);
      const formattedEndDate = formatDateForAPI(endDate);
      
      // Fetch reports data
      const [salesResponse, topProductsResponse, categoryResponse, inventoryResponse, customerResponse] = await Promise.all([
        apiService.getSalesReport(formattedStartDate, formattedEndDate),
        apiService.getTopSellingProducts(formattedStartDate, formattedEndDate),
        apiService.getSalesByCategory(formattedStartDate, formattedEndDate),
        apiService.getInventoryReport(),
        apiService.getCustomerReport(formattedStartDate, formattedEndDate)
      ]);
      
      console.log('Sales Report Response:', salesResponse);
      console.log('Top Products Response:', topProductsResponse);
      console.log('Category Response:', categoryResponse);
      console.log('Inventory Response:', inventoryResponse);
      console.log('Customer Response:', customerResponse);
      
      // Process sales data
      const processedSalesData = salesResponse?.dailySales?.map(item => ({
        date: item.date,
        sales: parseFloat(item.revenue) || 0,
        profit: parseFloat(item.revenue * 0.3) || 0, // Assuming 30% profit margin if not provided
        transactions: parseInt(item.count) || 0
      })) || [];
      
      // Process category data
      const processedCategoryData = categoryResponse?.map(item => ({
        name: item.category || 'Uncategorized',
        value: parseFloat(item.totalRevenue) || 0
      })) || [];
      
      // Process top products data
      const processedTopProducts = topProductsResponse?.map(item => ({
        id: item.productId || item.id,
        name: item.Product?.name || item.name || 'Unknown Product',
        category: item.Product?.category || item.category || 'Uncategorized',
        quantity: parseInt(item.totalQuantity || item.quantity) || 0,
        revenue: parseFloat(item.totalRevenue || item.revenue) || 0,
        profit: parseFloat((item.totalRevenue || item.revenue) * 0.3) || 0 // Assuming 30% profit margin if not provided
      })) || [];
      
      // Process inventory data
      const processedInventoryData = inventoryResponse?.inventory?.map(item => ({
        id: item.id || item.productId,
        name: item.product?.name || 'Unknown Product',
        category: item.product?.category || 'Uncategorized',
        currentStock: parseInt(item.quantity) || 0,
        minStock: parseInt(item.minStockLevel || item.min_quantity) || 0,
        value: parseFloat(item.product?.price * item.quantity) || 0
      })) || [];
      
      // Process customer data
      const processedCustomerData = customerResponse?.customers?.map(item => ({
        id: item.customerId,
        name: item.name || 'Unknown Customer',
        totalPurchases: parseFloat(item.totalSpent) || 0,
        visits: parseInt(item.saleCount) || 0,
        lastPurchase: item.lastPurchaseDate,
        loyaltyPoints: parseInt(item.totalSpent / 10) || 0 // Assuming 1 point per $10 spent if not provided
      })) || [];
      
      // Set state with processed data
      setSalesData(processedSalesData);
      setCategoryData(processedCategoryData);
      setTopProducts(processedTopProducts);
      setInventoryData(processedInventoryData);
      setCustomerData(processedCustomerData);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError(t('reports:errorLoading'));
      
      // Clear data if API fails (do not use demo data)
      setSalesData([]);
      setCategoryData([]);
      setTopProducts([]);
      setInventoryData([]);
      setCustomerData([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, t]);
  
  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiService.getCategories();
        setCategories(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error('Error loading categories:', err);
        setCategories([]);
      }
    };
    
    loadCategories();
  }, []);
  
  // Load reports data on mount and when date range changes
  useEffect(() => {
    loadReports();
  }, [loadReports]);
  
  // Calculate total sales
  const totalSales = useMemo(() => {
    return salesData.reduce((sum, item) => sum + (item.sales || 0), 0);
  }, [salesData]);
  
  // Calculate total profit
  const totalProfit = useMemo(() => {
    return salesData.reduce((sum, item) => sum + (item.profit || 0), 0);
  }, [salesData]);
  
  // Calculate total transactions
  const totalTransactions = useMemo(() => {
    return salesData.reduce((sum, item) => sum + (item.transactions || 0), 0);
  }, [salesData]);
  
  // Calculate total inventory value
  const totalInventoryValue = useMemo(() => {
    return inventoryData.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [inventoryData]);
  
  // Calculate profit margin
  const profitMargin = useMemo(() => {
    return totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  }, [totalSales, totalProfit]);
  
  // Handle print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);
  
  // Handle export to PDF
  const handleExport = useCallback(() => {
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(t('reports:title'), 14, 22);
    
    // Add date range
    doc.setFontSize(12);
    doc.text(`${t('reports:dateRange')}: ${formatDate(startDate)} - ${formatDate(endDate)}`, 14, 30);
    
    // Add report type
    doc.text(`${t('reports:reportType')}: ${t(`reports:${reportType}Report`)}`, 14, 38);
    
    // Add summary
    doc.setFontSize(14);
    doc.text(t('reports:summary'), 14, 48);
    
    // Add summary data
    doc.setFontSize(12);
    doc.text(`${t('reports:totalSales')}: ${currency.symbol} ${totalSales.toLocaleString()}`, 14, 56);
    doc.text(`${t('reports:totalProfit')}: ${currency.symbol} ${totalProfit.toLocaleString()}`, 14, 64);
    doc.text(`${t('reports:profitMargin')}: ${profitMargin.toFixed(1)}%`, 14, 72);
    doc.text(`${t('reports:totalTransactions')}: ${totalTransactions}`, 14, 80);
    
    // Add table data based on report type
    doc.setFontSize(14);
    doc.text(t(`reports:${reportType}Report`), 14, 92);
    
    // Add table
    let tableData = [];
    let tableColumns = [];
    
    if (reportType === 'sales') {
      tableColumns = [
        { header: t('date'), dataKey: 'date' },
        { header: t('reports:sales'), dataKey: 'sales' },
        { header: t('reports:transactions'), dataKey: 'transactions' },
        { header: t('reports:profit'), dataKey: 'profit' },
        { header: t('reports:profitMargin'), dataKey: 'profitMargin' }
      ];
      
      tableData = salesData.map(item => ({
        date: formatDate(item.date),
        sales: `${currency.symbol} ${item.sales.toLocaleString()}`,
        transactions: item.transactions,
        profit: `${currency.symbol} ${item.profit.toLocaleString()}`,
        profitMargin: `${(((item.profit || 0) / (item.sales || 1)) * 100).toFixed(1)}%`
      }));
    } else if (reportType === 'products') {
      tableColumns = [
        { header: t('products:product'), dataKey: 'name' },
        { header: t('products:category'), dataKey: 'category' },
        { header: t('reports:quantity'), dataKey: 'quantity' },
        { header: t('reports:revenue'), dataKey: 'revenue' },
        { header: t('reports:profit'), dataKey: 'profit' }
      ];
      
      tableData = getFilteredData(topProducts || []).map(item => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        revenue: `${currency.symbol} ${item.revenue.toLocaleString()}`,
        profit: `${currency.symbol} ${item.profit.toLocaleString()}`
      }));
    } else if (reportType === 'inventory') {
      tableColumns = [
        { header: t('products:product'), dataKey: 'name' },
        { header: t('products:category'), dataKey: 'category' },
        { header: t('inventory:currentStock'), dataKey: 'currentStock' },
        { header: t('inventory:minStock'), dataKey: 'minStock' },
        { header: t('inventory:value'), dataKey: 'value' }
      ];
      
      tableData = getFilteredData(inventoryData || []).map(item => ({
        name: item.name,
        category: item.category,
        currentStock: item.currentStock,
        minStock: item.minStock,
        value: `${currency.symbol} ${item.value.toLocaleString()}`
      }));
    } else if (reportType === 'customers') {
      tableColumns = [
        { header: t('customers:customer'), dataKey: 'name' },
        { header: t('customers:totalPurchases'), dataKey: 'totalPurchases' },
        { header: t('reports:visits'), dataKey: 'visits' },
        { header: t('reports:avgPurchaseValue'), dataKey: 'avgPurchaseValue' },
        { header: t('customers:lastPurchase'), dataKey: 'lastPurchase' },
        { header: t('customers:loyaltyPoints'), dataKey: 'loyaltyPoints' }
      ];
      
      tableData = getFilteredData(customerData || []).map(item => ({
        name: item.name,
        totalPurchases: `${currency.symbol} ${item.totalPurchases.toLocaleString()}`,
        visits: item.visits,
        avgPurchaseValue: `${currency.symbol} ${(item.totalPurchases / (item.visits || 1)).toFixed(2)}`,
        lastPurchase: formatDate(item.lastPurchase),
        loyaltyPoints: item.loyaltyPoints
      }));
    }
    
    // Add table to PDF
    autoTable(doc, {
      startY: 100,
      head: [tableColumns.map(col => col.header)],
      body: tableData.map(row => tableColumns.map(col => row[col.dataKey])),
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [66, 66, 66] },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });

    // حفظ الملف
    doc.save(`${t('reports:title')}_${formatDate(startDate)}_${formatDate(endDate)}.pdf`);
  }) // Close handleExport function

  return (
    <Box sx={{ p: 3 }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', width: '100%' }}>
          {t('reports:title')}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Print />}
            sx={{ marginInlineEnd: 1 }}
            onClick={handlePrint}
            dir="ltr"
          >
            {t('reports:print')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleExport}
            dir="ltr"
          >
            {t('reports:export')}
          </Button>
        </Box>
      </Box>
      
      {/* Report filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              label={t('reports:startDate')}
              type="date"
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label={t('reports:endDate')}
              type="date"
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="category-filter-label">{t('products:category')}</InputLabel>
              <Select
                labelId="category-filter-label"
                value={categoryFilter}
                onChange={handleCategoryFilterChange}
                label={t('products:category')}
              >
                <MenuItem value="all">{t('common:all')}</MenuItem>
                {Array.isArray(categories) && categories.map((category) => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label={t('common:search')}
              value={searchTerm}
              onChange={handleSearchTermChange}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Loading and error states */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}
      
      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                {t('reports:totalSales')}
              </Typography>
              <Typography variant="h4" component="div" color="primary">
                {`${currency.symbol} ${totalSales.toLocaleString()}`}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {t('reports:dateRange')}: {formatDate(startDate)} - {formatDate(endDate)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                {t('reports:totalProfit')}
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {`${currency.symbol} ${totalProfit.toLocaleString()}`}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {t('reports:profitMargin')}: {profitMargin.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                {t('reports:totalTransactions')}
              </Typography>
              <Typography variant="h4" component="div" color="info.main">
                {totalTransactions.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {t('reports:avgTransactionValue')}: {`${currency.symbol} ${totalTransactions > 0 ? (totalSales / totalTransactions).toFixed(2) : '0.00'}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
       
       </Grid>
       
       {/* Report tabs */}
       <Paper sx={{ mb: 3 }}>
        <Tabs
          value={reportType}
          onChange={handleReportTypeChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="sales" icon={<AttachMoney />} label={t('reports:salesReport')} />
          <Tab value="products" icon={<Category />} label={t('reports:productReport')} />
          {/* <Tab value="inventory" icon={<Inventory />} label={t('reports:inventoryReport')} /> */}
          <Tab value="customers" icon={<People />} label={t('reports:customerReport')} />
        </Tabs>
      </Paper>
      
      {/* Sales Report */}
      {reportType === 'sales' && (
        <div>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                {t('reports:salesTrend')}
              </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={salesData}
                    margin={{ top: 5, right: document.dir === 'rtl' ? 20 : 30, left: document.dir === 'rtl' ? 30 : 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#8884d8" name={t('reports:sales')} />
                    <Line type="monotone" dataKey="profit" stroke="#82ca9d" name={t('reports:profit')} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  {t('reports:salesByCategory')}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={300}>
                   <PieChart>
                    <Pie
                      data={categoryData || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value } = {}) => `${name || 'Unknown'}: ${currency.symbol} ${value || 0}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('date')}</TableCell>
                    <TableCell align="right">{t('reports:sales')}</TableCell>
                    <TableCell align="right">{t('reports:transactions')}</TableCell>
                    <TableCell align="right">{t('reports:profit')}</TableCell>
                    <TableCell align="right">{t('reports:profitMargin')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((row) => (
                          <TableRow key={row.date}>
                            <TableCell>{formatDate(row.date)}</TableCell>
                            <TableCell align="right">{`${currency.symbol} ${row.sales.toLocaleString()}`}</TableCell>
                            <TableCell align="right">{row.transactions}</TableCell>
                            <TableCell align="right">{`${currency.symbol} ${row.profit.toLocaleString()}`}</TableCell>
                            <TableCell align="right">{(((row.profit || 0) / (row.sales || 1)) * 100).toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={salesData.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage={t('rowsPerPage')}
                />
              </Paper>
            </Grid>
          </Grid>
        </div>
      )}
      
      {/* Product Report */}
      {reportType === 'products' && (
        <div>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  {t('reports:topSellingProducts')}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={300}>
                  {(() => {
                    const filteredProducts = getFilteredData(topProducts || []);
                    return (
                      <BarChart
                        data={filteredProducts}
                        margin={{ top: 5, right: document.dir === 'rtl' ? 20 : 30, left: document.dir === 'rtl' ? 30 : 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="quantity" fill="#8884d8" name={t('reports:quantity')} />
                        <Bar dataKey="revenue" fill="#82ca9d" name={t('reports:revenue')} />
                      </BarChart>
                    );
                  })()}
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  {t('reports:profitByProduct')}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={300}>
                  {(() => {
                    const filteredProducts = getFilteredData(topProducts || []);
                    return (
                      <BarChart
                        data={filteredProducts}
                        margin={{ top: 5, right: document.dir === 'rtl' ? 20 : 30, left: document.dir === 'rtl' ? 30 : 20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="profit" fill="#82ca9d" name={t('reports:profit')} />
                      </BarChart>
                    );
                  })()}
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('products:product')}</TableCell>
                        <TableCell>{t('products:category')}</TableCell>
                        <TableCell align="right">{t('reports:quantity')}</TableCell>
                        <TableCell align="right">{t('reports:revenue')}</TableCell>
                        <TableCell align="right">{t('reports:profit')}</TableCell>
                        <TableCell align="right">{t('reports:profitMargin')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getFilteredData(topProducts)
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.category}</TableCell>
                            <TableCell align="right">{row.quantity}</TableCell>
                            <TableCell align="right">{`${currency.symbol} ${row.revenue.toLocaleString()}`}</TableCell>
                            <TableCell align="right">{`${currency.symbol} ${row.profit.toLocaleString()}`}</TableCell>
                            <TableCell align="right">{(((row.profit || 0) / (row.revenue || 1)) * 100).toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={getFilteredData(topProducts).length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage={t('rowsPerPage')}
                />
              </Paper>
            </Grid>
          </Grid>
        </div>
      )}
      
      {/* Inventory Report */}
      {reportType === 'inventory' && (
        <div>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  {t('reports:stockLevels')}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={300}>
                  {(() => {
                    const filteredInventory = getFilteredData(inventoryData || []);
                    return (
                      <BarChart
                        data={filteredInventory}
                        margin={{ top: 5, right: document.dir === 'rtl' ? 20 : 30, left: document.dir === 'rtl' ? 30 : 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="currentStock" fill="#8884d8" name={t('inventory:currentStock')} />
                        <Bar dataKey="minStock" fill="#82ca9d" name={t('inventory:minStock')} />
                      </BarChart>
                    );
                  })()}
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  {t('reports:inventoryValue')}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={300}>
                  {(() => {
                    const filteredInventory = getFilteredData(inventoryData || []);
                    return (
                      <PieChart>
                        <Pie
                          data={filteredInventory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value } = {}) => `${name || 'Unknown'}: ${currency.symbol} ${value || 0}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {filteredInventory?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    );
                  })()}
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('products:product')}</TableCell>
                        <TableCell>{t('products:category')}</TableCell>
                        <TableCell align="right">{t('inventory:currentStock')}</TableCell>
                        <TableCell align="right">{t('inventory:minStock')}</TableCell>
                        <TableCell align="right">{t('inventory:value')}</TableCell>
                        <TableCell align="right">{t('reports:stockStatus')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getFilteredData(inventoryData)
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((row) => (
                          <TableRow 
                            key={row.id}
                            sx={{
                              bgcolor: row.currentStock <= row.minStock ? 'error.light' : 'inherit'
                            }}
                          >
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.category}</TableCell>
                            <TableCell align="right">{row.currentStock}</TableCell>
                            <TableCell align="right">{row.minStock}</TableCell>
                            <TableCell align="right">{`${currency.symbol} ${row.value.toLocaleString()}`}</TableCell>
                            <TableCell align="right">
                              {row.currentStock <= row.minStock ? 
                                t('inventory:lowStock') : 
                                t('inventory:inStock')}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={getFilteredData(inventoryData).length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage={t('rowsPerPage')}
                />
              </Paper>
            </Grid>
          </Grid>
        </div>
      )}
      
      {/* Customer Report */}
      {reportType === 'customers' && (
        <div>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('customers:customer')}</TableCell>
                        <TableCell align="right">{t('customers:totalPurchases')}</TableCell>
                        <TableCell align="right">{t('reports:visits')}</TableCell>
                        <TableCell align="right">{t('reports:avgPurchaseValue')}</TableCell>
                        <TableCell>{t('customers:lastPurchase')}</TableCell>
                        <TableCell align="right">{t('customers:loyaltyPoints')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getFilteredData(customerData)
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.name}</TableCell>
                            <TableCell align="right">{`${currency.symbol} ${row.totalPurchases.toLocaleString()}`}</TableCell>
                            <TableCell align="right">{row.visits}</TableCell>
                            <TableCell align="right">{`${currency.symbol} ${(row.totalPurchases / (row.visits || 1)).toFixed(2)}`}</TableCell>
                            <TableCell>{formatDate(row.lastPurchase)}</TableCell>
                            <TableCell align="right">{row.loyaltyPoints}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={getFilteredData(customerData).length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage={t('rowsPerPage')}
                />
              </Paper>
            </Grid>
          </Grid>
        </div>
      )}
    </Box>
  );
}

export default memo(Reports);
