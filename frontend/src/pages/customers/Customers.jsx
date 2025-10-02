import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrency } from '../../redux/slices/settingsSlice';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  MoreVert,
  Visibility,
  FileDownload,
  FileUpload,
  FilterList,
  Person,
  Phone,
  Email,
  LocationOn,
  ShoppingCart,
  Loyalty,
  CardGiftcard,
  ViewList,
  ViewModule,
} from '@mui/icons-material';
import apiService from '../../api/apiService';

// Demo data for customers
const demoCustomers = [
  { id: 1, name: 'Ahmed Ali', phone: '+249123456789', email: 'ahmed@example.com', address: 'Khartoum, Sudan', totalPurchases: 1250.50, loyaltyPoints: 125, memberSince: '2023-01-15', status: 'active', lastPurchase: '2023-05-10' },
  { id: 2, name: 'Fatima Mohammed', phone: '+249123456790', email: 'fatima@example.com', address: 'Omdurman, Sudan', totalPurchases: 850.75, loyaltyPoints: 85, memberSince: '2023-02-20', status: 'active', lastPurchase: '2023-05-12' },
  { id: 3, name: 'Omar Ibrahim', phone: '+249123456791', email: 'omar@example.com', address: 'Bahri, Sudan', totalPurchases: 2100.25, loyaltyPoints: 210, memberSince: '2023-01-05', status: 'active', lastPurchase: '2023-05-15' },
  { id: 4, name: 'Aisha Hamid', phone: '+249123456792', email: 'aisha@example.com', address: 'Khartoum, Sudan', totalPurchases: 450.00, loyaltyPoints: 45, memberSince: '2023-03-10', status: 'inactive', lastPurchase: '2023-04-01' },
  { id: 5, name: 'Khalid Ahmed', phone: '+249123456793', email: 'khalid@example.com', address: 'Omdurman, Sudan', totalPurchases: 1750.30, loyaltyPoints: 175, memberSince: '2023-01-25', status: 'active', lastPurchase: '2023-05-14' },
  { id: 6, name: 'Amina Hassan', phone: '+249123456794', email: 'amina@example.com', address: 'Khartoum, Sudan', totalPurchases: 950.60, loyaltyPoints: 95, memberSince: '2023-02-15', status: 'active', lastPurchase: '2023-05-11' },
  { id: 7, name: 'Mohammed Ali', phone: '+249123456795', email: 'mohammed@example.com', address: 'Bahri, Sudan', totalPurchases: 1500.00, loyaltyPoints: 150, memberSince: '2023-01-10', status: 'active', lastPurchase: '2023-05-13' },
  { id: 8, name: 'Zainab Omar', phone: '+249123456796', email: 'zainab@example.com', address: 'Khartoum, Sudan', totalPurchases: 350.25, loyaltyPoints: 35, memberSince: '2023-03-20', status: 'inactive', lastPurchase: '2023-04-05' },
  { id: 9, name: 'Ibrahim Khalid', phone: '+249123456797', email: 'ibrahim@example.com', address: 'Omdurman, Sudan', totalPurchases: 2250.75, loyaltyPoints: 225, memberSince: '2023-01-01', status: 'active', lastPurchase: '2023-05-09' },
  { id: 10, name: 'Hawa Ahmed', phone: '+249123456798', email: 'hawa@example.com', address: 'Khartoum, Sudan', totalPurchases: 750.50, loyaltyPoints: 75, memberSince: '2023-02-25', status: 'active', lastPurchase: '2023-05-08' },
];

// Demo data for customer purchases
const demoPurchases = [
  { id: 1, customerId: 1, date: '2023-05-10', invoiceNumber: 'INV-001', amount: 150.50, items: 5, status: 'completed' },
  { id: 2, customerId: 1, date: '2023-04-25', invoiceNumber: 'INV-002', amount: 200.00, items: 7, status: 'completed' },
  { id: 3, customerId: 1, date: '2023-04-10', invoiceNumber: 'INV-003', amount: 300.00, items: 10, status: 'completed' },
  { id: 4, customerId: 2, date: '2023-05-12', invoiceNumber: 'INV-004', amount: 120.75, items: 4, status: 'completed' },
  { id: 5, customerId: 2, date: '2023-04-20', invoiceNumber: 'INV-005', amount: 180.00, items: 6, status: 'completed' },
  { id: 6, customerId: 3, date: '2023-05-15', invoiceNumber: 'INV-006', amount: 250.25, items: 8, status: 'completed' },
  { id: 7, customerId: 3, date: '2023-05-01', invoiceNumber: 'INV-007', amount: 300.00, items: 9, status: 'completed' },
  { id: 8, customerId: 3, date: '2023-04-15', invoiceNumber: 'INV-008', amount: 350.00, items: 12, status: 'completed' },
  { id: 9, customerId: 4, date: '2023-04-01', invoiceNumber: 'INV-009', amount: 100.00, items: 3, status: 'completed' },
  { id: 10, customerId: 5, date: '2023-05-14', invoiceNumber: 'INV-010', amount: 200.30, items: 7, status: 'completed' },
];

// Demo data for loyalty rewards
// Moved into component to access currency safely
const Customers = () => {
  const currency = useSelector(selectCurrency);
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Demo data for loyalty rewards (now inside component to use currency and translations)
  const demoRewards = [
    { id: 1, name: t('customers:discount10'), pointsRequired: 100, description: t('customers:discount10Desc') },
    { id: 2, name: t('customers:discount20'), pointsRequired: 200, description: t('customers:discount20Desc') },
    { id: 3, name: t('customers:freeProduct'), pointsRequired: 150, description: t('customers:freeProductDesc', { symbol: currency?.symbol || '$' }) },
    { id: 4, name: t('customers:vipStatus'), pointsRequired: 500, description: t('customers:vipStatusDesc') },
  ];

  // Set document title
  useEffect(() => {
    document.title = t('pageTitle.customers');
  }, [t]);

  // State for customers
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  
  // State for loading, error and snackbar
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
    
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for view mode (list or grid)
  const [viewMode, setViewMode] = useState('list');
  
  // State for tabs
  const [tabValue, setTabValue] = useState(0);
  
  // State for selected customer (for purchases tab)
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  // State for customer purchases
  const [customerPurchases, setCustomerPurchases] = useState([]);
  
  // State for action menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCustomer, setMenuCustomer] = useState(null);
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // State for reward dialog
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  
  // Load customers from API
  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔄 بدء تحميل بيانات العملاء...');
        
        // 1. جلب العملاء المسجلين
        let registeredCustomers = [];
        try {
          console.log('📋 جلب العملاء المسجلين من API...');
          const customersResponse = await apiService.getCustomers();
          console.log('✅ استجابة API للعملاء المسجلين:', customersResponse);
          
          // توحيد شكل استجابة العملاء لتكون مصفوفة (قد تكون الاستجابة مصفوفة مباشرة أو كائن يحتوي على data، حتى تظهر العملاء المُضافين من CustomerForm في القائمة.
          const customersArray = Array.isArray(customersResponse)
            ? customersResponse
            : (Array.isArray(customersResponse?.data) ? customersResponse.data : []);
          
          if (Array.isArray(customersArray)) {
            registeredCustomers = customersArray.map(customer => ({
              ...customer,
              id: customer.id || customer._id || `reg-${Math.random().toString(36).substr(2, 9)}`,
              source: 'registered',
              memberSince: customer.createdAt ? new Date(customer.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              status: customer.status || 'active',
              totalPurchases: Number(customer.totalPurchases) || 0,
              loyaltyPoints: customer.loyaltyPoints || 0
            }));
            console.log('✅ تم معالجة العملاء المسجلين:', registeredCustomers);
          } else {
            console.warn('⚠️ بيانات العملاء المسجلين غير صالحة:', customersResponse);
          }
        } catch (customerError) {
          console.error('❌ خطأ في جلب العملاء المسجلين:', customerError);
          setSnackbar({
            open: true,
            message: 'فشل في تحميل العملاء المسجلين. ' + (customerError.userMessage || customerError.message),
            severity: 'error'
          });
        }
        
        // 2. استخراج العملاء من الطلبات الأونلاين
        let onlineCustomers = [];
        try {
          console.log('🛒 جلب الطلبات الأونلاين...');
          const ordersData = await apiService.getOrders();
          console.log('✅ استجابة API للطلبات:', ordersData);
          
          // التحقق من أن الاستجابة مصفوفة صالحة
          if (!Array.isArray(ordersData)) {
            console.warn('⚠️ استجابة الطلبات ليست مصفوفة صالحة:', ordersData);
          }
          
          if (Array.isArray(ordersData) && ordersData.length > 0) {
            // استخراج العملاء الفريدين من الطلبات
            const uniqueOnlineCustomers = new Map();
            
            console.log('🔍 بدء معالجة الطلبات، عدد الطلبات:', ordersData.length);
            ordersData.forEach((order, index) => {
              // استخراج معلومات العميل من الطلب (من association: customer أو customerInfo أو من الحقول الموجودة على الطلب نفسه)
              const customerInfo = (order.customer || order.customerInfo || {
                name: order.customerName,
                phone: order.customerPhone,
                email: order.customerEmail,
                address: order.deliveryAddress,
              });
              console.log(`📦 الطلب ${index + 1}:`, order.id, 'معلومات العميل:', customerInfo);
              
              if (customerInfo) {
                // تحقق من وجود رقم هاتف أو بريد إلكتروني على الأقل
                const customerPhone = customerInfo.phone || '';
                const customerEmail = customerInfo.email || '';
                const customerIdentifier = customerPhone || customerEmail;
                
                console.log(`📱 معرف العميل للطلب ${index + 1}:`, customerIdentifier);
                
                // استخدم رقم الهاتف كمعرف أساسي، وإذا لم يكن موجودًا استخدم البريد الإلكتروني
                if (customerIdentifier && !uniqueOnlineCustomers.has(customerIdentifier)) {
                  const customerData = {
                    id: `online-${customerIdentifier}`,
                    name: customerInfo.name || 'عميل أونلاين',
                    phone: customerPhone,
                    email: customerEmail,
                    address: customerInfo.address || '',
                    city: customerInfo.city || '',
                    state: customerInfo.state || '',
                    postalCode: customerInfo.postalCode || '',
                    country: customerInfo.country || '',
                    source: 'online',
                    status: 'active',
                    memberSince: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    totalPurchases: order.totalAmount || order.total || 0,
                    loyaltyPoints: 0,
                    lastOrder: {
                      id: order.id || order._id,
                      date: order.createdAt,
                      total: order.totalAmount || order.total
                    }
                  };
                  
                  console.log(`✅ إضافة عميل جديد من الطلب ${index + 1}:`, customerData);
                  uniqueOnlineCustomers.set(customerIdentifier, customerData);
                }
              } else {
                console.warn(`⚠️ الطلب ${index + 1} لا يحتوي على معلومات عميل`);
              }
            });
            
            onlineCustomers = Array.from(uniqueOnlineCustomers.values());
            console.log('✅ تم استخراج عملاء الأونلاين الفريدين:', onlineCustomers);
          } else {
            console.warn('⚠️ بيانات الطلبات غير صالحة أو لا توجد طلبات');
          }
        } catch (ordersError) {
          console.error('❌ خطأ في جلب الطلبات:', ordersError);
          setSnackbar({
            open: true,
            message: 'فشل في تحميل الطلبات الأونلاين. ' + (ordersError.userMessage || ordersError.message),
            severity: 'error'
          });
        }
        
        // 3. دمج العملاء من المصدرين
        const allCustomers = [...registeredCustomers, ...onlineCustomers];
        console.log('✅ إجمالي العملاء بعد الدمج:', allCustomers.length, allCustomers);
        
        if (allCustomers.length === 0) {
          console.warn('⚠️ لم يتم العثور على أي عملاء');
          // إضافة عميل افتراضي للاختبار إذا لم يكن هناك عملاء
          const demoCustomer = {
            id: 'demo-customer',
            name: 'عميل تجريبي',
            phone: '0500000000',
            email: 'demo@example.com',
            address: 'شارع الملك فهد',
            city: 'الرياض',
            state: '',
            postalCode: '',
            country: 'المملكة العربية السعودية',
            source: 'online',
            status: 'active',
            memberSince: new Date().toISOString().split('T')[0],
            totalPurchases: 0,
            loyaltyPoints: 0,
            lastOrder: null
          };
          allCustomers.push(demoCustomer);
          console.log('✅ تمت إضافة عميل تجريبي للاختبار:', demoCustomer);
        }
        
        setCustomers(allCustomers);
        setFilteredCustomers(allCustomers);
        setLoading(false);
        
        if (allCustomers.length === 0) {
          console.warn('⚠️ لم يتم العثور على أي عملاء');
          setSnackbar({
            open: true,
            message: 'لم يتم العثور على أي عملاء',
            severity: 'warning'
          });
        }
      } catch (error) {
        console.error('❌ خطأ عام في تحميل العملاء:', error);
        setError('فشل في تحميل بيانات العملاء. يرجى المحاولة مرة أخرى.');
        setSnackbar({
          open: true,
          message: 'فشل في تحميل بيانات العملاء. ' + (error.userMessage || error.message || 'يرجى المحاولة مرة أخرى.'),
          severity: 'error'
        });
        setLoading(false);
      }
    };
    
    loadCustomers();
  }, []);

  // Filter customers based on search query and status
  useEffect(() => {
    let filtered = customers;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    // Filter by source (registered/online)
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(customer => customer.source === sourceFilter);
    }
    
    setFilteredCustomers(filtered);
  }, [searchQuery, statusFilter, sourceFilter, customers]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      setSelectedCustomer(null);
    }
  };
  
  // Handle menu open
  const handleMenuOpen = (event, customer) => {
    setAnchorEl(event.currentTarget);
    setMenuCustomer(customer);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Handle view customer
  const handleViewCustomer = async () => {
    handleMenuClose();
    setSelectedCustomer(menuCustomer);
    
    // Load customer purchases
    try {
      const purchases = await getCustomerPurchases(menuCustomer.id);
      setCustomerPurchases(purchases);
      
      // Calculate total purchases and loyalty points
      if (menuCustomer) {
        const totalAmount = purchases.reduce((sum, purchase) => sum + parseFloat(purchase.amount || 0), 0);
        const updatedCustomer = {
          ...menuCustomer,
          totalPurchases: totalAmount,
          loyaltyPoints: Math.floor(totalAmount / 10) // 1 point for every $10 spent
        };
        setSelectedCustomer(updatedCustomer);
      }
    } catch (error) {
      console.error('Error loading customer purchases:', error);
    }
    
    setTabValue(1); // Switch to purchases tab
  };
  
  // Handle edit customer
  const handleEditCustomer = () => {
    handleMenuClose();
    navigate(`/customers/edit/${menuCustomer.id}`);
  };
  
  // Handle delete click
  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };
  
  // Confirm delete customer
  const confirmDeleteCustomer = () => {
    // Call API then update state
    apiService.deleteCustomer(menuCustomer.id)
      .then(() => {
        setCustomers(prevCustomers => prevCustomers.filter(customer => customer.id !== menuCustomer.id));
        setFilteredCustomers(prevCustomers => prevCustomers.filter(customer => customer.id !== menuCustomer.id));
      })
      .catch((e) => console.error('Delete failed', e))
      .finally(() => setDeleteDialogOpen(false));
  };
  
  // Handle reward dialog open
  const handleRewardDialogOpen = () => {
    handleMenuClose();
    setRewardDialogOpen(true);
  };
  
  // Handle reward selection
  const handleRewardSelect = (reward) => {
    setSelectedReward(reward);
  };
  
  // Handle reward redemption
  const handleRedeemReward = () => {
    if (selectedReward && menuCustomer) {
      // In a real app, you would update the customer's loyalty points and record the redemption
      setCustomers(prevCustomers => {
        return prevCustomers.map(customer => {
          if (customer.id === menuCustomer.id) {
            return {
              ...customer,
              loyaltyPoints: customer.loyaltyPoints - selectedReward.pointsRequired
            };
          }
          return customer;
        });
      });
      
      setRewardDialogOpen(false);
      setSelectedReward(null);
      
      // Show success message (in a real app)
      alert(`Reward ${selectedReward.name} redeemed successfully for ${menuCustomer.name}`);
    }
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
  
  // Get customer purchases
  const getCustomerPurchases = async (customerId) => {
    try {
      const sales = await apiService.getCustomerSales(customerId);
      return sales.map(sale => ({
        id: sale.id,
        customerId: sale.customerId,
        date: sale.saleDate || sale.createdAt,
        invoiceNumber: sale.invoiceNumber || `INV-${String(sale.id).substring(0, 6)}`,
        amount: typeof sale.totalAmount === 'number' ? sale.totalAmount : Number(sale.totalAmount) || 0,
        items: typeof sale.itemCount === 'number' ? sale.itemCount : Number(sale.itemCount) || 0,
        status: sale.status
      }));
    } catch (error) {
      console.error('Error fetching customer sales:', error);
      return [];
    }
  };
  
  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  // Get random color for avatar
  const getAvatarColor = (id) => {
    const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50'];
    return colors[id % colors.length];
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            icon={<Person />} 
            label={t('customers:customers')} 
          />
          <Tab 
            icon={<ShoppingCart />} 
            label={t('customers:purchases')} 
            disabled={!selectedCustomer}
          />
          <Tab 
            icon={<Loyalty />} 
            label={t('customers:loyaltyProgram')} 
          />
        </Tabs>
      </Paper>
      
      {/* Customers Tab */}
      {tabValue === 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ textAlign: 'center', width: '100%' }}>
              {t('customers:customers')}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => navigate('/customers/add')}
            >
              {t('customers:addCustomer')}
            </Button>
          </Box>
          
          {/* Filters and search */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label={t('status')}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">{t('all')}</MenuItem>
                  <MenuItem value="active">{t('active')}</MenuItem>
                  <MenuItem value="inactive">{t('inactive')}</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  fullWidth
                >
                  {t('filter')}
                </Button>
              </Grid>
              <Grid item xs={6} md={1}>
                <Tooltip title={t('export')}>
                  <IconButton color="primary">
                    <FileDownload />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item xs={6} md={1}>
                <Tooltip title={t('import')}>
                  <IconButton color="primary">
                    <FileUpload />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Tooltip title={t('listView')}>
                <IconButton 
                  color={viewMode === 'list' ? 'primary' : 'default'}
                  onClick={() => setViewMode('list')}
                >
                  <ViewList />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('gridView')}>
                <IconButton 
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                  onClick={() => setViewMode('grid')}
                >
                  <ViewModule />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
          
          {/* Customers list view */}
          {viewMode === 'list' && (
            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('customers:customer')}</TableCell>
                      <TableCell>{t('customers:contact')}</TableCell>
                      <TableCell>{t('customers:address')}</TableCell>
                      <TableCell align="right">{t('customers:totalPurchases')}</TableCell>
                      <TableCell align="right">{t('customers:loyaltyPoints')}</TableCell>
                      <TableCell>{t('customers:memberSince')}</TableCell>
                      <TableCell>{t('status')}</TableCell>
                      <TableCell>{t('customers:source')}</TableCell>
                      <TableCell align="center">{t('actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCustomers
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                sx={{ 
                                  bgcolor: getAvatarColor(customer.id),
                                  marginInlineEnd: 2
                                }}
                              >
                                {getInitials(customer.name)}
                              </Avatar>
                              <Typography variant="subtitle2">
                                {customer.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Phone fontSize="small" sx={{ marginInlineEnd: 1, color: 'text.secondary' }} />
                                {customer.phone}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Email fontSize="small" sx={{ marginInlineEnd: 1, color: 'text.secondary' }} />
                                {customer.email}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LocationOn fontSize="small" sx={{ marginInlineEnd: 1, color: 'text.secondary' }} />
                              {customer.address}
                            </Box>
                          </TableCell>
                          <TableCell align="right">{`${(currency?.symbol || '$')}${Number(customer.totalPurchases || 0).toFixed(2)}`}</TableCell>
                          <TableCell align="right">
                            <Chip 
                              icon={<Loyalty />} 
                              label={customer.loyaltyPoints} 
                              color="primary" 
                              size="small" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{customer.memberSince}</TableCell>
                          <TableCell>
                            <Chip 
                              label={customer.status === 'active' ? t('active') : t('inactive')} 
                              color={customer.status === 'active' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={customer.source === 'online' ? 'أونلاين' : 'مسجل'} 
                              color={customer.source === 'online' ? 'info' : 'default'}
                              size="small"
                              variant={customer.source === 'online' ? 'filled' : 'outlined'}
                              icon={customer.source === 'online' ? <ShoppingCart fontSize="small" /> : <Person fontSize="small" />}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              aria-label="more"
                              aria-controls="customer-menu"
                              aria-haspopup="true"
                              onClick={(e) => handleMenuOpen(e, customer)}
                            >
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredCustomers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage={t('rowsPerPage')}
              />
            </Paper>
          )}
          
          {/* Customers grid view */}
          {viewMode === 'grid' && (
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={3}>
                {filteredCustomers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((customer) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={customer.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: getAvatarColor(customer.id),
                                width: 56,
                                height: 56,
                                marginInlineEnd: 2
                              }}
                            >
                              {getInitials(customer.name)}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" component="div">
                                {customer.name}
                              </Typography>
                              <Chip 
                                label={customer.status === 'active' ? t('active') : t('inactive')} 
                                color={customer.status === 'active' ? 'success' : 'default'}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          </Box>
                          
                          <Divider sx={{ mb: 2 }} />
                          
                          <Box sx={{ mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Phone fontSize="small" sx={{ marginInlineEnd: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">{customer.phone}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Email fontSize="small" sx={{ marginInlineEnd: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">{customer.email}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LocationOn fontSize="small" sx={{ marginInlineEnd: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">{customer.address}</Typography>
                            </Box>
                          </Box>
                          
                          <Divider sx={{ mb: 2 }} />
                          
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                {t('customers:totalPurchases')}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {(currency?.symbol || '$')}{Number(customer.totalPurchases || 0).toFixed(2)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                {t('customers:loyaltyPoints')}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                <Chip 
                                  icon={<Loyalty />} 
                                  label={customer.loyaltyPoints} 
                                  color="primary" 
                                  size="small" 
                                  variant="outlined"
                                />
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                {t('customers:memberSince')}
                              </Typography>
                              <Typography variant="body2">
                                {customer.memberSince}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                {t('customers:lastPurchase')}
                              </Typography>
                              <Typography variant="body2">
                                {customer.lastPurchase}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                        <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
                          <Button
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setTabValue(1); // Switch to purchases tab
                            }}
>
                            {t('view')}
                          </Button>
                          <IconButton
                            aria-label="more"
                            aria-controls="customer-menu"
                            aria-haspopup="true"
                            onClick={(e) => handleMenuOpen(e, customer)}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <TablePagination
                  rowsPerPageOptions={[8, 12, 16, 24]}
                  component="div"
                  count={filteredCustomers.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage={t('itemsPerPage')}
                />
              </Box>
            </Box>
          )}
        </>
      )}
      
      {/* Purchases Tab */}
      {tabValue === 1 && selectedCustomer && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="h4" sx={{ textAlign: 'center' }}>
                {t('customers:customerPurchases')}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {selectedCustomer.name}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Person />}
              onClick={() => setTabValue(0)}
            >
              {t('customers:backToCustomers')}
            </Button>
          </Box>
          
          {/* Customer summary */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: getAvatarColor(selectedCustomer.id),
                      width: 64,
                      height: 64,
                      marginInlineEnd: 2
                    }}
                  >
                    {getInitials(selectedCustomer.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5">
                      {selectedCustomer.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Chip 
                        label={selectedCustomer.status === 'active' ? t('active') : t('inactive')} 
                        color={selectedCustomer.status === 'active' ? 'success' : 'default'}
                        size="small"
                        sx={{ marginInlineEnd: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {t('customers:memberSince')}: {selectedCustomer.memberSince}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('customers:phone')}
                    </Typography>
                    <Typography variant="body1">
                      {selectedCustomer.phone}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('customers:email')}
                    </Typography>
                    <Typography variant="body1">
                      {selectedCustomer.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      {t('customers:address')}
                    </Typography>
                    <Typography variant="body1">
                      {selectedCustomer.address}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {`${currency.symbol}${selectedCustomer.totalPurchases.toFixed(2)}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('customers:totalPurchases')}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {selectedCustomer.totalOrders || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('customers:totalOrders')}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    <Badge 
                      badgeContent={selectedCustomer.loyaltyPoints} 
                      color="primary"
                      showZero
                      max={999}
                    >
                      <Loyalty color="action" />
                    </Badge>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('customers:loyaltyPoints')}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Purchases table */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('date')}</TableCell>
                    <TableCell>{t('sales:invoiceNumber')}</TableCell>
                    <TableCell align="right">{t('sales:amount')}</TableCell>
                    <TableCell align="right">{t('sales:items')}</TableCell>
                    <TableCell>{t('status')}</TableCell>
                    <TableCell align="center">{t('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customerPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>{purchase.date}</TableCell>
                      <TableCell>{purchase.invoiceNumber}</TableCell>
                      <TableCell align="right">{`${currency.symbol}${purchase.amount.toFixed(2)}`}</TableCell>
                      <TableCell align="right">{purchase.items}</TableCell>
                      <TableCell>
                        <Chip 
                          label={t(`sales.${purchase.status}`)} 
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('view')}>
                          <IconButton size="small" onClick={() => navigate(`/sales/invoice/${purchase.invoiceNumber}`)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {customerPurchases.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          {t('customers:noPurchases')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
      
      {/* Loyalty Program Tab */}
      {tabValue === 2 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ textAlign: 'center', width: '100%' }}>
              {t('customers:loyaltyProgram')}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => navigate('/customers/rewards/add')}
>
              {t('customers:addReward')}
            </Button>
          </Box>
          
          {/* Rewards */}
          <Grid container spacing={3}>
            {demoRewards.map((reward) => (
              <Grid item xs={12} sm={6} md={3} key={reward.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CardGiftcard color="primary" sx={{ marginInlineEnd: 1 }} />
                      <Typography variant="h6" component="div">
                        {reward.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {reward.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip 
                        icon={<Loyalty />} 
                        label={`${reward.pointsRequired} ${t('customers:points')}`} 
                        color="primary" 
                        variant="outlined"
                      />
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => navigate(`/customers/rewards/edit/${reward.id}`)}
                      >
                        {t('edit')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
      
      {/* Action Menu */}
      <Menu
        id="customer-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewCustomer}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('view')} />
        </MenuItem>
        <MenuItem onClick={handleEditCustomer}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('edit')} />
        </MenuItem>
        <MenuItem onClick={handleRewardDialogOpen}>
          <ListItemIcon>
            <CardGiftcard fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('customers:redeemReward')} />
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('delete')} />
        </MenuItem>
      </Menu>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {t('customers:confirmDeleteCustomer')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {menuCustomer && (
              <>
                {t('thisActionCannotBeUndone')}<br />
                {t('customers:customer')}: <strong>{menuCustomer.name}</strong>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={confirmDeleteCustomer} color="error" autoFocus>
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Redeem Reward Dialog */}
      <Dialog
        open={rewardDialogOpen}
        onClose={() => setRewardDialogOpen(false)}
        aria-labelledby="reward-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="reward-dialog-title">
          {t('customers:redeemReward')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {menuCustomer && (
              <>
                {t('customers:customer')}: <strong>{menuCustomer.name}</strong><br />
                {t('customers:availablePoints')}: <strong>{menuCustomer.loyaltyPoints}</strong>
              </>
            )}
          </DialogContentText>
          
          <Typography variant="subtitle1" gutterBottom>
            {t('customers:selectReward')}:
          </Typography>
          
          <Grid container spacing={2}>
            {demoRewards.map((reward) => {
              const isDisabled = menuCustomer && menuCustomer.loyaltyPoints < reward.pointsRequired;
              
              return (
                <Grid item xs={12} key={reward.id}>
                  <Paper 
                    variant="outlined" 
                    sx={{
                      p: 2,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.6 : 1,
                      bgcolor: selectedReward?.id === reward.id ? 'action.selected' : 'background.paper',
                      '&:hover': {
                        bgcolor: isDisabled ? undefined : 'action.hover',
                      },
                    }}
                    onClick={() => !isDisabled && handleRewardSelect(reward)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1">
                          {reward.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {reward.description}
                        </Typography>
                      </Box>
                      <Chip 
                        icon={<Loyalty />} 
                        label={`${reward.pointsRequired} ${t('customers:points')}`} 
                        color="primary" 
                        variant={isDisabled ? 'outlined' : 'filled'}
                      />
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRewardDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleRedeemReward} 
            color="primary"
            disabled={!selectedReward || (menuCustomer && menuCustomer.loyaltyPoints < selectedReward?.pointsRequired)}
          >
            {t('customers:redeem')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;