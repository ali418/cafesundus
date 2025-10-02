import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Stack,
  CardHeader,
  Divider,
  ButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  FileDownload as ExportIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  TrendingUp,
  TrendingDown,
  Receipt,
  AttachMoney,
  CreditCard,
  AccountBalance,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isAfter, isBefore, isSameDay, startOfDay, endOfDay, subDays } from 'date-fns';
import apiService from '../../api/apiService';
import { useSelector } from 'react-redux';
import { selectCurrency } from '../../redux/slices/settingsSlice';
import { selectUser } from '../../redux/slices/authSlice';
import { toast } from 'react-toastify';
// Charts
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

const Sales = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const currency = useSelector(selectCurrency);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter states
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [selectedCashier, setSelectedCashier] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // KPI states
  const [kpiData, setKpiData] = useState({
    todayRevenue: 0,
    monthRevenue: 0,
    avgTicket: 0,
    totalTransactions: 0,
    todayTransactions: 0,
  });

  // Sorting states
  const [orderBy, setOrderBy] = useState('date');
  const [orderDirection, setOrderDirection] = useState('desc');

  // Trend chart data (last 30 days)
  const [trendData, setTrendData] = useState([]);

  const parseAmount = (val) => {
    const n = Number.parseFloat(val);
    return Number.isNaN(n) ? 0 : n;
  };

  const normalizeSale = (s) => {
    const parsed = s.saleDate ? new Date(s.saleDate) : new Date();
    const safeDate = isNaN(parsed?.getTime?.()) ? new Date() : parsed;
    return {
      id: s.id,
      date: safeDate,
      customer: s.customer?.name || s.customer?.fullName || s.customer?.email || '-',
      total: parseAmount(s.totalAmount),
      status: s.status || 'completed',
      paymentMethod: s.paymentMethod || 'cash',
      // تحسين ترتيب الأولوية لاسم الكاشير
      cashier: s.cashier || s.createdBy?.fullName || s.createdBy?.username || s.user?.fullName || s.user?.username || '-',
      // تحسين ترتيب الأولوية لمعرف الكاشير وإضافة createdById كبديل
      cashierId: s.cashierId || s.user?.id || s.userId || s.createdBy?.id || s.createdById || null,
      itemsCount: s.items?.length || 0,
      source: s.source || 'pos', // Add source property (online or pos)
    };
  };

  const calculateKPIs = (data) => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    const completedOrAccepted = (data || []).filter((s) =>
      ['completed', 'accepted'].includes((s.status || '').toLowerCase())
    );

    const todaySales = completedOrAccepted.filter((s) => isSameDay(s.date, today));
    const monthSales = completedOrAccepted.filter((s) => s.date.getMonth() === month && s.date.getFullYear() === year);

    const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const monthRevenue = monthSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const totalRevenue = completedOrAccepted.reduce((sum, s) => sum + Number(s.total || 0), 0);

    setKpiData({
      todayRevenue,
      monthRevenue,
      avgTicket: completedOrAccepted.length > 0 ? totalRevenue / completedOrAccepted.length : 0,
      totalTransactions: completedOrAccepted.length,
      todayTransactions: todaySales.length,
    });
  };

  const buildTrendData = (data) => {
    // Last 30 days only, group by day
    const end = new Date();
    const start = subDays(end, 29);
    const completedOrAccepted = (data || []).filter(
      (s) => ['completed', 'accepted'].includes((s.status || '').toLowerCase()) && s.date >= start && s.date <= end
    );

    const map = new Map();
    for (let i = 0; i < 30; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const key = format(d, 'yyyy-MM-dd');
      map.set(key, 0);
    }

    completedOrAccepted.forEach((s) => {
      const key = format(s.date, 'yyyy-MM-dd');
      if (map.has(key)) map.set(key, map.get(key) + Number(s.total || 0));
    });

    const arr = Array.from(map.entries()).map(([key, value]) => ({
      name: format(new Date(key), 'MM-dd'),
      sales: Number(value || 0),
    }));
    setTrendData(arr);
  };

  const loadSales = async () => {
    setLoading(true);
    setError('');
    try {
      const raw = await apiService.getSales();
      const mapped = (Array.isArray(raw) ? raw : []).map(normalizeSale);

      // Filter: include online orders only when accepted or completed
      let filtered = mapped.filter((s) => {
        if ((s.source || '').toLowerCase() === 'online') {
          return ['accepted', 'completed'].includes((s.status || '').toLowerCase());
        }
        return true;
      });

      // Remove the cashier filter to show all sales for cashier role
      // if (user && user.role === 'cashier') {
      //   filtered = filtered.filter((s) => String(s.cashierId ?? '') === String(user.id ?? ''));
      // }

      setSales(filtered);
      calculateKPIs(filtered);
      buildTrendData(filtered);
      applyFilters(filtered);
    } catch (e) {
      console.error(e);
      setError(e.userMessage || e.message || t('sales:errors.failedToLoadSales'));
      toast.error(t('common:errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (salesData = sales) => {
    let filtered = [...salesData];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (sale) =>
          (sale.customer || '').toLowerCase().includes(term) ||
          (sale.id || '').toString().toLowerCase().includes(term) ||
          (sale.cashier || '').toLowerCase().includes(term) ||
          sale.total.toString().includes(searchTerm),
      );
    }

    // Date range filter
    if (fromDate) {
      filtered = filtered.filter(sale => isAfter(sale.date, startOfDay(fromDate)) || isSameDay(sale.date, fromDate));
    }
    if (toDate) {
      filtered = filtered.filter(sale => isBefore(sale.date, endOfDay(toDate)) || isSameDay(sale.date, toDate));
    }

    // Cashier filter
    if (selectedCashier) {
      filtered = filtered.filter(sale => sale.cashier === selectedCashier);
    }

    // Payment method filter
    if (selectedPaymentMethod) {
      filtered = filtered.filter(sale => sale.paymentMethod === selectedPaymentMethod);
    }

    setFilteredSales(filtered);
    setPage(0);
  };

  const clearFilters = () => {
    setFromDate(null);
    setToDate(null);
    setSelectedCashier('');
    setSelectedPaymentMethod('');
    setSearchTerm('');
    setFilteredSales(sales);
  };

  const applyQuickRange = (range) => {
    const now = new Date();
    if (range === '7d') {
      setFromDate(subDays(now, 6));
      setToDate(now);
    } else if (range === '30d') {
      setFromDate(subDays(now, 29));
      setToDate(now);
    } else if (range === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(start);
      setToDate(now);
    } else {
      // all
      setFromDate(null);
      setToDate(null);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Date',
      'Customer',
      'Cashier',
      'Items',
      'Total',
      'Payment Method',
      'Status'
    ];
    
    const csvData = filteredSales.map(sale => [
      sale.id,
      format(sale.date, 'yyyy-MM-dd HH:mm'),
      sale.customer,
      sale.cashier,
      sale.itemsCount,
      sale.total.toFixed(2),
      sale.paymentMethod,
      sale.status
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPaymentMethodChip = (method) => {
    const m = method || 'cash';
    switch (m) {
      case 'cash':
        return <Chip size="small" icon={<AttachMoney />} label={t(`sales.paymentMethods.cash`)} color="success" variant="outlined" />;
      case 'credit_card':
      case 'card':
        return <Chip size="small" icon={<CreditCard />} label={t(`sales.paymentMethods.card`)} color="primary" variant="outlined" />;
      case 'bank_transfer':
        return <Chip size="small" icon={<AccountBalance />} label={t(`sales.paymentMethods.bank_transfer`)} color="info" variant="outlined" />;
      default:
        return <Chip size="small" label={t(`sales.paymentMethods.${m}`, { defaultValue: m })} variant="outlined" />;
    }
  };

  // Get unique cashiers and payment methods for filters
  const uniqueCashiers = [...new Set(sales.map(s => s.cashier).filter(Boolean))];
  const uniquePaymentMethods = [...new Set(sales.map(s => s.paymentMethod).filter(Boolean))];

  useEffect(() => {
    loadSales();
  }, []);

  // Listen for sales:updated events from POS
  useEffect(() => {
    const handleSalesUpdate = (event) => {
      console.log('Sales list refreshing due to POS event:', event.detail);
      loadSales();
    };

    window.addEventListener('sales:updated', handleSalesUpdate);

    return () => {
      window.removeEventListener('sales:updated', handleSalesUpdate);
    };
  }, []);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, fromDate, toDate, selectedCashier, selectedPaymentMethod, sales]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleViewSale = (id) => {
    navigate(`/sales/${id}`);
  };

  const handleDeleteClick = (sale) => {
    setSaleToDelete(sale);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!saleToDelete) return;
    try {
      await apiService.deleteSale(saleToDelete.id);
      // Reload sales from server so cancelled status and KPIs are accurate
      await loadSales();
    } catch (e) {
      console.error(e);
      setError(e.userMessage || e.message || t('sales:errors.failedToDeleteSale'));
    } finally {
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSaleToDelete(null);
  };

  const handlePrintSale = (id) => {
    // Navigate to sale details with auto-print flag
    navigate(`/sales/${id}?print=1`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  useEffect(() => {
    // Update document title based on current language
    document.title = t('pageTitle.sales');
  }, [i18n.language, t]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedSales = [...filteredSales].sort((a, b) => {
    const dir = orderDirection === 'asc' ? 1 : -1;
    switch (orderBy) {
      case 'id':
        return (a.id > b.id ? 1 : a.id < b.id ? -1 : 0) * dir;
      case 'date':
        return ((a.date?.getTime?.() || 0) - (b.date?.getTime?.() || 0)) * dir;
      case 'customer':
        return (a.customer || '').localeCompare(b.customer || '') * dir;
      case 'itemsCount':
        return ((a.itemsCount || 0) - (b.itemsCount || 0)) * dir;
      case 'total':
        return ((a.total || 0) - (b.total || 0)) * dir;
      case 'status':
        return (a.status || '').localeCompare(b.status || '') * dir;
      case 'paymentMethod':
        return (a.paymentMethod || '').localeCompare(b.paymentMethod || '') * dir;
      default:
        return 0;
    }
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', width: '100%' }}>
            {t('sales:sales')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/pos')}
          >
            {t('sales:newSale')}
          </Button>
        </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    {t('sales:todayRevenue')}
                  </Typography>
                  <Typography variant="h6">
                    {currency.symbol}{kpiData.todayRevenue.toFixed(2)}
                  </Typography>
                </Box>
                <AttachMoney color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    {t('sales:monthRevenue')}
                  </Typography>
                  <Typography variant="h6">
                    {currency.symbol}{kpiData.monthRevenue.toFixed(2)}
                  </Typography>
                </Box>
                <TrendingUp color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    {t('sales:avgTicket')}
                  </Typography>
                  <Typography variant="h6">
                    {currency.symbol}{kpiData.avgTicket.toFixed(2)}
                  </Typography>
                </Box>
                <Receipt color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    {t('sales:todayTransactions')}
                  </Typography>
                  <Typography variant="h6">
                    {kpiData.todayTransactions}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {t('sales:totalTransactions')}: {kpiData.totalTransactions}
                  </Typography>
                </Box>
                <TrendingDown color="secondary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sales Overview Mini Chart */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title={t('sales:salesOverview', { defaultValue: 'Sales Overview' })} />
        <Divider />
        <CardContent sx={{ height: 220 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="body2">{t('loading')}</Typography>
            </Box>
          ) : trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#2E7D32" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip formatter={(value) => `${currency.symbol}${Number(value).toFixed(2)}`} />
                <Legend />
                <Area type="monotone" dataKey="sales" stroke="#2E7D32" fillOpacity={1} fill="url(#colorSales)" name={t('sales:sales')} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="body1" color="text.secondary">
                {t('noRecordsFound')}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Paper sx={{ width: '100%', mb: 2 }}>
        {/* Search and Filters */}
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                variant="outlined"
                placeholder={t('search')}
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 250 }}
              />
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFiltersOpen(!filtersOpen)}
                color={filtersOpen ? 'primary' : 'inherit'}
              >
                {t('filter')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={exportToCSV}
                disabled={filteredSales.length === 0}
              >
                {t('export')}
              </Button>
              {/* Quick Ranges */}
              <ButtonGroup variant="text" size="small" sx={{ ml: 'auto', flexWrap: 'wrap' }}>
                <Button onClick={() => applyQuickRange('7d')}>{t('last7Days', { defaultValue: 'Last 7 days' })}</Button>
                <Button onClick={() => applyQuickRange('30d')}>{t('last30Days', { defaultValue: 'Last 30 days' })}</Button>
                <Button onClick={() => applyQuickRange('month')}>{t('thisMonth', { defaultValue: 'This Month' })}</Button>
                <Button onClick={() => applyQuickRange('all')}>{t('all')}</Button>
              </ButtonGroup>
              {loading && <Typography variant="body2">{t('loading')}</Typography>}
              {error && <Typography variant="body2" color="error">{error}</Typography>}
            </Box>

            {/* Collapsible Filters */}
            {filtersOpen && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <DatePicker
                  label={t('sales:fromDate')}
                  value={fromDate}
                  onChange={setFromDate}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { minWidth: 150 }
                    }
                  }}
                />
                <DatePicker
                  label={t('sales:toDate')}
                  value={toDate}
                  onChange={setToDate}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { minWidth: 150 }
                    }
                  }}
                />
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('sales:cashier')}</InputLabel>
                  <Select
                    value={selectedCashier}
                    label={t('sales:cashier')}
                    onChange={(e) => setSelectedCashier(e.target.value)}
                  >
                    <MenuItem value="">{t('all')}</MenuItem>
                    {uniqueCashiers.map((cashier) => (
                      <MenuItem key={cashier} value={cashier}>
                        {cashier}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>{t('sales:paymentMethod')}</InputLabel>
                  <Select
                    value={selectedPaymentMethod}
                    label={t('sales:paymentMethod')}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="">{t('all')}</MenuItem>
                    {uniquePaymentMethods.map((method) => (
                      <MenuItem key={method} value={method}>
                        {t(`sales.paymentMethods.${method}`, { defaultValue: method })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  size="small"
                >
                  {t('sales:clearFilters')}
                </Button>
              </Box>
            )}
          </Stack>
        </Box>

        <TableContainer sx={{ maxHeight: 560 }}>
          <Table stickyHeader sx={{ minWidth: 650 }} aria-label="sales table">
            <TableHead>
              <TableRow>
                <TableCell sortDirection={orderBy === 'id' ? orderDirection : false}>
                  <TableSortLabel
                    active={orderBy === 'id'}
                    direction={orderBy === 'id' ? orderDirection : 'asc'}
                    onClick={() => handleRequestSort('id')}
                  >
                    {t('id')}
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'date' ? orderDirection : false}>
                  <TableSortLabel
                    active={orderBy === 'date'}
                    direction={orderBy === 'date' ? orderDirection : 'asc'}
                    onClick={() => handleRequestSort('date')}
                  >
                    {t('date')}
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'customer' ? orderDirection : false}>
                  <TableSortLabel
                    active={orderBy === 'customer'}
                    direction={orderBy === 'customer' ? orderDirection : 'asc'}
                    onClick={() => handleRequestSort('customer')}
                  >
                    {t('customers:customer')}
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  {t('sales:cashier')}
                </TableCell>
                <TableCell align="center" sortDirection={orderBy === 'itemsCount' ? orderDirection : false}>
                  <TableSortLabel
                    active={orderBy === 'itemsCount'}
                    direction={orderBy === 'itemsCount' ? orderDirection : 'asc'}
                    onClick={() => handleRequestSort('itemsCount')}
                  >
                    {t('sales:items')}
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sortDirection={orderBy === 'total' ? orderDirection : false}>
                  <TableSortLabel
                    active={orderBy === 'total'}
                    direction={orderBy === 'total' ? orderDirection : 'asc'}
                    onClick={() => handleRequestSort('total')}
                  >
                    {t('total')}
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'status' ? orderDirection : false}>
                  <TableSortLabel
                    active={orderBy === 'status'}
                    direction={orderBy === 'status' ? orderDirection : 'asc'}
                    onClick={() => handleRequestSort('status')}
                  >
                    {t('status')}
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'paymentMethod' ? orderDirection : false}>
                  <TableSortLabel
                    active={orderBy === 'paymentMethod'}
                    direction={orderBy === 'paymentMethod' ? orderDirection : 'asc'}
                    onClick={() => handleRequestSort('paymentMethod')}
                  >
                    {t('sales:paymentMethod')}
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedSales
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((sale, idx) => (
                  <TableRow key={sale.id} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
                    <TableCell component="th" scope="row">
                      #{typeof sale.id === 'string' ? sale.id.slice(0, 8) : sale.id}
                    </TableCell>
                    <TableCell>
                      {sale?.date && !isNaN(new Date(sale.date).getTime())
                        ? format(sale.date, 'yyyy-MM-dd HH:mm')
                        : '-'}
                    </TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell>{sale.cashier}</TableCell>
                    <TableCell align="center">{sale.itemsCount}</TableCell>
                    <TableCell align="right">
                      {currency.symbol}{Number(sale.total).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t(`sales.status.${sale.status}`)}
                        color={getStatusColor(sale.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {getPaymentMethodChip(sale.paymentMethod)}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('view')}>
                        <IconButton
                          onClick={() => handleViewSale(sale.id)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('print')}>
                        <IconButton
                          onClick={() => handlePrintSale(sale.id)}
                          color="secondary"
                        >
                          <PrintIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('delete')}>
                        <IconButton
                          onClick={() => handleDeleteClick(sale)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredSales.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={user && user.role !== 'cashier' ? 9 : 8} align="center">
                    {t('noRecordsFound')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSales.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={t('rowsPerPage')}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {t('confirmDelete')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {t('sales.deleteConfirmation', {
              id: saleToDelete?.id,
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>{t('cancel')}</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  </LocalizationProvider>
  );
};

export default Sales;