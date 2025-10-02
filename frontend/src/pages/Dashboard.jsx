import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Inventory,
  ShoppingCart,
  MoreVert,
  Add,
  PointOfSale,
  Person,
  Receipt,
  Assessment,
  AddShoppingCart,
} from '@mui/icons-material';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrency } from '../redux/slices/settingsSlice';
import { selectUser } from '../redux/slices/authSlice';

// Charts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import apiService from '../api/apiService';

// Colors for charts - updated with gold and black theme
const COLORS = ['#FFD700', '#121212', '#DAA520', '#8B4513', '#D4AF37'];

const Dashboard = () => {
  const { t, i18n } = useTranslation('dashboard');
  const navigate = useNavigate();
  const currency = useSelector(selectCurrency);
  const user = useSelector(selectUser);

  // Redirect cashier immediately before any effects or data fetching
  // Make sure this runs before any other code
  if (user && user.role && user.role.toLowerCase() === 'cashier') {
    return <Navigate to="/pos" replace />;
  }

  // State for dynamic sections
  const [recentSales, setRecentSales] = useState([]);

  // Summary cards state
  const [todaySalesAmount, setTodaySalesAmount] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Charts data state
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New: period toggle and revenue loading
  const [period, setPeriod] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboardSalesPeriod');
      const allowed = ['1D', '1M', '6M', '1Y'];
      return allowed.includes(saved) ? saved : '6M';
    } catch {
      return '6M';
    }
  }); // 1D | 1M | 6M | 1Y
  const [revLoading, setRevLoading] = useState(false);

  // Trigger re-fetch when sales are updated elsewhere (e.g., POS or Online Orders)
  const [reloadTick, setReloadTick] = useState(0);

  // Helper: format currency for axis/tooltip
  const formatCurrency = (value) => {
    const num = Number(value || 0);
    return `${currency?.symbol || ''} ${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      return (
        <Paper elevation={3} sx={{ 
          p: 1.5, 
          borderRadius: '8px',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            background: 'linear-gradient(to bottom, #FFD700, #DAA520)'
          }
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{label}</Typography>
          <Typography variant="subtitle2" sx={{ mt: 0.5, color: '#000', fontWeight: 600 }}>
            {t('revenue')}: <span style={{ color: '#DAA520' }}>{formatCurrency(val)}</span>
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Helper: get date range by period
  const getDateRangeForPeriod = (p) => {
    const end = new Date();
    const start = new Date();
    let groupBy = 'day';
    if (p === '7D') {
      start.setDate(end.getDate() - 6);
      groupBy = 'day';
    } else if (p === '1M') {
      start.setMonth(end.getMonth() - 1);
      groupBy = 'day';
    } else if (p === '6M') {
      start.setMonth(end.getMonth() - 6);
      groupBy = 'month';
    } else if (p === '1Y') {
      start.setFullYear(end.getFullYear() - 1);
      groupBy = 'month';
    }
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];
    return { startDateStr, endDateStr, groupBy };
  };

  // Fetch revenue with selected period
  const fetchRevenueData = async (p) => {
    try {
      setRevLoading(true);
      
      // Check user role for report access
      const isAuthorized = user && (user.role === 'admin' || user.role === 'manager');
      
      if (isAuthorized) {
        const { startDateStr, endDateStr, groupBy } = getDateRangeForPeriod(p);
        const revenueResponse = await apiService.getRevenueReport(startDateStr, endDateStr, groupBy);
        if (revenueResponse && Array.isArray(revenueResponse.revenueData)) {
          const chartData = revenueResponse.revenueData.map((item) => ({
            name: item.period || item.period_date || item.date,
            sales: Number(item.revenue) || 0,
          }));
          setSalesData(chartData);
        } else {
          setSalesData([]);
        }
      } else {
        setSalesData([]);
        setError(t('common:accessDenied', { defaultValue: 'You do not have permission to view reports' }));
      }
    } catch (e) {
      console.error('Failed to fetch revenue data for period', p, e);
      setSalesData([]);
    } finally {
      setRevLoading(false);
    }
  };

  // When period changes, refetch revenue
  useEffect(() => {
    fetchRevenueData(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  // Persist selected period to localStorage so it survives refresh/navigation
  useEffect(() => {
    try {
      localStorage.setItem('dashboardSalesPeriod', period);
    } catch (e) {
      // ignore storage errors (e.g., private mode)
    }
  }, [period]);

  // Update document title based on current language
  useEffect(() => {
    document.title = t('common.pageTitle.dashboard', { ns: 'common' });
  }, [i18n.language, t]);

  // Listen for sales updates to refresh dashboard KPIs automatically
  useEffect(() => {
    const onSalesUpdated = () => setReloadTick((x) => x + 1);
    window.addEventListener('sales:updated', onSalesUpdated);
    return () => window.removeEventListener('sales:updated', onSalesUpdated);
  }, []);

  // Redirect cashier to POS page
  useEffect(() => {
    if (user && user.role === 'cashier') {
      navigate('/pos');
    }
  }, [user, navigate]);

  // Fetch recent sales + low stock + summary counts + chart data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    const fetchData = async () => {
      try {
        // Check user role for report access
        const isAuthorized = user && (user.role === 'admin' || user.role === 'manager');
        
        // Get date range for reports (last 6 months)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Fetch recent sales
        const sales = await apiService.getSales();
        // Map to dashboard friendly shape and take latest 5
        const mappedSales = (sales || [])
          .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
          .slice(0, 5)
          .map((s) => ({
            id: s.id,
            customer: s.customer?.name || t('sales:walkInCustomer', { defaultValue: 'Walk-in' }),
            amount: Number(s.totalAmount || 0),
            date: new Date(s.saleDate).toLocaleString(),
            items: Array.isArray(s.items) ? s.items.length : (s.itemsCount || 0),
          }));
        if (isMounted) setRecentSales(mappedSales);

        // Compute today's sales amount - include both completed and accepted orders
        const todayStr = new Date().toDateString();
        const todayAmount = (sales || [])
          .filter((s) => new Date(s.saleDate).toDateString() === todayStr && (['completed', 'accepted'].includes(s.status || 'completed')))
          .reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
        if (isMounted) setTodaySalesAmount(todayAmount);

        // Fetch revenue data for sales chart only if user is authorized
        if (isAuthorized) {
          const revenueResponse = await apiService.getRevenueReport(startDateStr, endDateStr, 'month');
          // Backend shape: { summary: {...}, revenueData: [ { period: 'YYYY-MM', revenue: '123.45', ... } ] }
          if (isMounted && revenueResponse && Array.isArray(revenueResponse.revenueData)) {
            const chartData = revenueResponse.revenueData.map((item) => ({
              name: item.period || item.period_date || item.date,
              sales: Number(item.revenue) || 0,
            }));
            setSalesData(chartData);
          } else if (isMounted) {
            setSalesData([]);
          }
        } else if (isMounted) {
          setSalesData([]);
          setError(t('common:accessDenied', { defaultValue: 'You do not have permission to view reports' }));
        }

        // Fetch sales by category for pie chart only if user is authorized
        if (isAuthorized) {
          const salesByCategory = await apiService.getSalesByCategory(startDateStr, endDateStr);
          if (isMounted && Array.isArray(salesByCategory)) {
            const pieData = salesByCategory.map((item) => ({
              name: item.category || t('reports:uncategorized'),
              value: Number(item.totalRevenue) || 0,
            }));
            setCategoryData(pieData);
          } else if (isMounted) {
            setCategoryData([]);
          }
        } else if (isMounted) {
          setCategoryData([]);
        }
      } catch (error) {
        console.error('Failed to fetch sales data:', error);
        if (isMounted) {
          setRecentSales([]);
          setTodaySalesAmount(0);
          setSalesData([]);
          setCategoryData([]);
          setError(t('common:errorLoadingData'));
        }
      }

      // Low stock products section removed as requested

      try {
        // Fetch totals for customers and products + include online customers from sales as unique
        const [customersResp, productsResp, salesForCustomers] = await Promise.all([
          apiService.getCustomers(),
          apiService.getProducts(),
          apiService.getSales(),
        ]);

        // Normalize arrays from API responses that might be array or { data: [] }
        const customersArray = Array.isArray(customersResp?.data)
          ? customersResp.data
          : (Array.isArray(customersResp) ? customersResp : []);
        const productsArray = Array.isArray(productsResp?.data)
          ? productsResp.data
          : (Array.isArray(productsResp) ? productsResp : []);
        const salesArray = Array.isArray(salesForCustomers) ? salesForCustomers : [];

        // Build a set of unique customer keys from registered list and from sales
        const uniqueKeys = new Set();
        const addKey = (val) => {
          if (val === undefined || val === null) return;
          const str = String(val).trim();
          if (str) uniqueKeys.add(str.toLowerCase());
        };

        customersArray.forEach((c) => {
          // Prefer stable identifiers first
          addKey(c.id ?? c._id ?? c.email ?? c.phone ?? c.mobile ?? c.contactPhone);
          // Fallback to name-based key if no stable identifier
          const name = (c.name || c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim());
          if (name) addKey(`name:${name}`);
        });

        salesArray.forEach((s) => {
          const cust = s?.customer;
          if (!cust) return;
          if (typeof cust === 'object') {
            addKey(cust.id ?? cust._id ?? cust.email ?? cust.phone ?? cust.mobile ?? cust.contactPhone);
            const name = (cust.name || cust.fullName || `${cust.firstName || ''} ${cust.lastName || ''}`.trim());
            if (name) addKey(`name:${name}`);
          } else if (typeof cust === 'string') {
            addKey(`name:${cust}`);
          }
        });

        if (isMounted) {
          setTotalCustomers(uniqueKeys.size);
          setTotalProducts(productsArray.length);
        }
      } catch (error) {
        console.error('Failed to fetch customers/products totals:', error);
        if (isMounted) {
          setTotalCustomers(0);
          setTotalProducts(0);
          setError((prev) => prev || t('common:errorLoadingData'));
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [t, reloadTick]);

  // Summary cards data (now dynamic) - updated with gold theme
  const summaryCards = [
    {
      title: t('todaySales'),
      value: `${currency.symbol} ${Number(todaySalesAmount || 0).toFixed(2)}`,
      icon: <TrendingUp />,
      color: '#DAA520', // Gold color
      onClick: () => navigate('/sales'),
    },
    {
      title: t('totalCustomers'),
      value: String(totalCustomers),
      icon: <People />,
      color: '#FFD700', // Gold color
      onClick: () => navigate('/customers'),
    },
    {
      title: t('totalProducts'),
      value: String(totalProducts),
      icon: <Inventory />,
      color: '#D4AF37', // Gold color
      onClick: () => navigate('/products'),
    },
    // Low Stock card removed as requested
  ];

  // Check if user has permission to view reports
  const isAuthorized = user && (user.role === 'admin' || user.role === 'manager');

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', width: '100%' }}>
        {t('dashboard')}
      </Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 3, textAlign: 'center', width: '100%' }}>
        {t('welcome')}
      </Typography>

      {/* Summary Cards - Only visible to authorized users */}
      {isAuthorized ? (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {summaryCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 120,
                  cursor: 'pointer',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 215, 0, 0.1)',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '5px',
                    height: '100%',
                    background: `linear-gradient(to bottom, ${card.color}, rgba(255, 215, 0, 0.5))`,
                  },
                  '&:hover': {
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                    transform: 'translateY(-3px)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                  },
                }}
                onClick={card.onClick}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ 
                    color: '#333',
                    fontWeight: 600,
                    letterSpacing: '0.5px'
                  }}>
                    {card.title}
                  </Typography>
                  <Avatar sx={{ 
                    bgcolor: card.color,
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    }
                  }}>
                    {card.icon}
                  </Avatar>
                </Box>
                <Typography variant="h4" component="div" sx={{ 
                  mt: 2,
                  fontWeight: 700,
                  color: '#333',
                  textShadow: '0px 1px 1px rgba(0, 0, 0, 0.1)'
                }}>
                  {card.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, mb: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            {t('common:welcomeMessage', { defaultValue: 'Welcome to the Management System' })}
          </Typography>
          
          {/* Different message for cashier vs other roles */}
          {user && user.role === 'cashier' ? (
            <Typography variant="body1" paragraph>
              {t('common:cashierWelcome', { defaultValue: 'Welcome to the Point of Sale system. You can create new sales, manage invoices, and add customers.' })}
            </Typography>
          ) : (
            <>
              <Typography variant="body1" paragraph>
                {t('common:accessDenied', { defaultValue: 'You do not have permission to view dashboard reports. Only admin and manager roles can access this data.' })}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('common:contactAdmin', { defaultValue: 'Please contact your administrator if you need access to this information.' })}
              </Typography>
            </>
          )}
          
          {/* Quick Access section removed as requested */}
        </Paper>
      )}



      {/* Error message - Hidden for cashier role */}
      {error && user && user.role !== 'cashier' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Charts and Lists */}
      <Grid container spacing={3}>
        {/* Sales Overview Chart - Only visible to authorized users */}
        {isAuthorized && (
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title={<Typography variant="h6" sx={{ fontWeight: 600, color: '#333', letterSpacing: '0.5px' }}>{t('salesOverview')}</Typography>}
              action={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={period}
                    onChange={(e, val) => { if (val) setPeriod(val); }}
                    aria-label="period-selector"
                    sx={{
                      '& .MuiToggleButtonGroup-grouped': {
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(255, 215, 0, 0.15)',
                          color: '#B8860B',
                          fontWeight: 600,
                        },
                        '&:hover': {
                          backgroundColor: 'rgba(255, 215, 0, 0.05)',
                        },
                        transition: 'all 0.3s ease',
                      }
                    }}
                  >
                    <ToggleButton value="1D" sx={{ borderRadius: '4px 0 0 4px' }}>1d</ToggleButton>
                    <ToggleButton value="1M">1m</ToggleButton>
                    <ToggleButton value="6M">6m</ToggleButton>
                    <ToggleButton value="1Y" sx={{ borderRadius: '0 4px 4px 0' }}>1y</ToggleButton>
                  </ToggleButtonGroup>
                  <Tooltip title={t('more')}>
                    <IconButton 
                      aria-label="settings" 
                      onClick={() => navigate('/reports')}
                      sx={{
                        color: '#DAA520',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 215, 0, 0.1)',
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />
            <Divider sx={{ borderColor: 'rgba(255, 215, 0, 0.1)' }} />
            <CardContent sx={{ height: 320 }}>
              {(loading || revLoading) ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#DAA520" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#DAA520" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 215, 0, 0.1)" />
                    <XAxis dataKey="name" tick={{ fill: '#333', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#333', fontSize: 12 }} tickFormatter={formatCurrency} width={80} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#F5F5F5' }} />
                    <Legend />
                    <Bar dataKey="sales" name={t('revenue')} fill="url(#revenueGradient)" stroke="#DAA520" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="text.secondary">
                    {t('common:noDataAvailable')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        )}

        {/* Sales by Category - Only visible to authorized users */}
        {isAuthorized && (
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" sx={{ fontWeight: 600, color: '#333', letterSpacing: '0.5px' }}>{t('salesByCategory')}</Typography>}
              action={
                <IconButton 
                  aria-label="settings" 
                  onClick={() => navigate('/reports')}
                  sx={{
                    color: '#DAA520',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 215, 0, 0.1)',
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <MoreVert />
                </IconButton>
              }
            />
            <Divider sx={{ borderColor: 'rgba(255, 215, 0, 0.1)' }} />
            <CardContent sx={{ height: 300 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="text.secondary">
                    {t('common:noDataAvailable')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        )}

        {/* Recent Sales - Only visible to authorized users */}
        {isAuthorized ? (
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title={<Typography variant="h6" sx={{ fontWeight: 600, color: '#333', letterSpacing: '0.5px' }}>{t('recentSales')}</Typography>}
              action={
                <Tooltip title={t('more')}>
                  <IconButton 
                    aria-label="more" 
                    onClick={() => navigate('/sales')}
                    sx={{
                      color: '#DAA520',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider sx={{ borderColor: 'rgba(255, 215, 0, 0.1)' }} />
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {recentSales.map((sale) => (
                <React.Fragment key={sale.id}>
                  <ListItem
                    alignItems="flex-start"
                    secondaryAction={
                      <Typography className="price-wrapper" variant="body2" color="text.primary">
                        {`${currency.symbol} ${sale.amount.toFixed(2)}`}
                      </Typography>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: '#DAA520',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        }
                      }}>
                        <ShoppingCart />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={sale.customer}
                      secondary={
                        <React.Fragment>
                          <Typography
                            sx={{ display: 'inline' }}
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {sale.date}
                          </Typography>
                          {` — ${sale.items} ${t('sales:items')}`}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Button
                  variant="text"
                  endIcon={<Add />}
                  onClick={() => navigate('/sales')}
                >
                  {t('viewMore')}
                </Button>
              </Box>
            </List>
          </Card>
        </Grid>
        ) : null}

        {/* Low Stock Products section removed as requested */}
      </Grid>
    </Box>
  );
};

export default Dashboard;