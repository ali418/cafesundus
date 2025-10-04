import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
  Divider,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Visibility,
  MoreVert,
  FileDownload,
  FilterList,
  Refresh,
  TrendingUp,
  TrendingDown,
  History,
  Inventory as InventoryIcon,
  Warning,
  CheckCircle,
  Error,
  QrCodeScanner,
} from '@mui/icons-material';
import apiService from '../../api/apiService';

// Demo data for inventory
const demoInventory = [
  { id: 1, productId: 1, productName: 'Apples', category: 'Fruits', currentStock: 50, minStock: 10, maxStock: 100, reorderPoint: 15, lastRestocked: '2023-05-15', status: 'ok' },
  { id: 2, productId: 2, productName: 'Bananas', category: 'Fruits', currentStock: 40, minStock: 10, maxStock: 80, reorderPoint: 15, lastRestocked: '2023-05-14', status: 'ok' },
  { id: 3, productId: 3, productName: 'Milk', category: 'Dairy', currentStock: 30, minStock: 5, maxStock: 50, reorderPoint: 10, lastRestocked: '2023-05-13', status: 'ok' },
  { id: 4, productId: 4, productName: 'Bread', category: 'Bakery', currentStock: 5, minStock: 5, maxStock: 30, reorderPoint: 10, lastRestocked: '2023-05-12', status: 'warning' },
  { id: 5, productId: 5, productName: 'Chicken', category: 'Meat', currentStock: 3, minStock: 5, maxStock: 20, reorderPoint: 8, lastRestocked: '2023-05-11', status: 'critical' },
  { id: 6, productId: 6, productName: 'Rice', category: 'Grains', currentStock: 60, minStock: 10, maxStock: 100, reorderPoint: 20, lastRestocked: '2023-05-10', status: 'ok' },
  { id: 7, productId: 7, productName: 'Tomatoes', category: 'Vegetables', currentStock: 45, minStock: 10, maxStock: 60, reorderPoint: 15, lastRestocked: '2023-05-09', status: 'ok' },
  { id: 8, productId: 8, productName: 'Cheese', category: 'Dairy', currentStock: 4, minStock: 5, maxStock: 25, reorderPoint: 8, lastRestocked: '2023-05-08', status: 'warning' },
  { id: 9, productId: 9, productName: 'Eggs', category: 'Dairy', currentStock: 35, minStock: 10, maxStock: 50, reorderPoint: 15, lastRestocked: '2023-05-07', status: 'ok' },
  { id: 10, productId: 10, productName: 'Potatoes', category: 'Vegetables', currentStock: 55, minStock: 10, maxStock: 70, reorderPoint: 20, lastRestocked: '2023-05-06', status: 'ok' },
  { id: 11, productId: 11, productName: 'Onions', category: 'Vegetables', currentStock: 65, minStock: 10, maxStock: 80, reorderPoint: 20, lastRestocked: '2023-05-05', status: 'ok' },
  { id: 12, productId: 12, productName: 'Oranges', category: 'Fruits', currentStock: 0, minStock: 5, maxStock: 40, reorderPoint: 10, lastRestocked: '2023-05-04', status: 'out_of_stock' },
];

// Demo data for inventory transactions
const demoTransactions = [
  { id: 1, date: '2023-05-15', productName: 'Apples', type: 'restock', quantity: 30, notes: 'Regular supplier delivery', user: 'Admin' },
  { id: 2, date: '2023-05-14', productName: 'Bananas', type: 'restock', quantity: 25, notes: 'Regular supplier delivery', user: 'Admin' },
  { id: 3, date: '2023-05-14', productName: 'Milk', type: 'restock', quantity: 20, notes: 'Regular supplier delivery', user: 'Admin' },
  { id: 4, date: '2023-05-13', productName: 'Bread', type: 'sale', quantity: -5, notes: 'Regular sale', user: 'Cashier1' },
  { id: 5, date: '2023-05-13', productName: 'Chicken', type: 'sale', quantity: -2, notes: 'Regular sale', user: 'Cashier2' },
  { id: 6, date: '2023-05-12', productName: 'Apples', type: 'sale', quantity: -10, notes: 'Regular sale', user: 'Cashier1' },
  { id: 7, date: '2023-05-12', productName: 'Bananas', type: 'sale', quantity: -8, notes: 'Regular sale', user: 'Cashier2' },
  { id: 8, date: '2023-05-11', productName: 'Milk', type: 'sale', quantity: -5, notes: 'Regular sale', user: 'Cashier1' },
  { id: 9, date: '2023-05-11', productName: 'Oranges', type: 'adjustment', quantity: -5, notes: 'Damaged stock', user: 'Manager' },
  { id: 10, date: '2023-05-10', productName: 'Cheese', type: 'adjustment', quantity: -2, notes: 'Expired', user: 'Manager' },
];

// Demo data for categories
const demoCategories = [
  { id: 1, name: 'All' },
  { id: 2, name: 'Fruits' },
  { id: 3, name: 'Vegetables' },
  { id: 4, name: 'Dairy' },
  { id: 5, name: 'Bakery' },
  { id: 6, name: 'Meat' },
  { id: 7, name: 'Grains' },
];

const Inventory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Set document title
  useEffect(() => {
    document.title = t('pageTitle.inventory');
  }, [t]);

  // State for inventory data
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(1); // Default to 'All'
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Additional state for barcode scan and products list
  const [products, setProducts] = useState([]);
  const [barcodeSearchActive, setBarcodeSearchActive] = useState(false);
  const [barcodeResultItems, setBarcodeResultItems] = useState([]);
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for tabs
  const [tabValue, setTabValue] = useState(0);
  
  // State for action menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // State for restock dialog
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState('');
  
  // Hoisted loader to reuse for refresh
  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const inventoryData = await apiService.getInventory();
      const transformedInventory = inventoryData.map(item => ({
        id: item.id,
        productId: item.productId || item.product_id,
        productName: item.product?.name || t('notAvailable'),
        category: item.product?.category || t('notAvailable'),
        currentStock: item.quantity || 0,
        minStock: item.minStockLevel || item.min_quantity || 0,
        maxStock: 100,
        reorderPoint: Math.max(item.minStockLevel || 0, 5),
        lastRestocked: item.updated_at ? new Date(item.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: getStockStatus(item.quantity || 0, item.minStockLevel || 0, Math.max(item.minStockLevel || 0, 5)),
        location: item.location || ''
      }));
      setInventory(transformedInventory);
      
      // Also load products to enable barcode lookups
      try {
        const productsData = await apiService.getProducts();
        setProducts(productsData || []);
      } catch (prodErr) {
        console.warn('Failed to load products for barcode lookup:', prodErr);
        setProducts([]);
      }
      
      // Load transactions for all inventory items
      try {
        const allTransactions = await Promise.all(
          transformedInventory.map(async (inv) => {
            try {
              const txs = await apiService.getInventoryTransactions(inv.id);
              return (txs || []).map((tx) => {
                const q = Number(tx.quantity) || 0;
                const baseType = tx.type || 'adjustment';
                const displayType = baseType === 'adjustment' ? (q > 0 ? 'restock' : 'adjustment') : baseType;
                return {
                  id: tx.id,
                  date: (tx.createdAt || tx.created_at || tx.date)
                    ? new Date(tx.createdAt || tx.created_at || tx.date).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                  productName: inv.productName,
                  type: displayType,
                  quantity: q, // preserve sign from backend
                  notes: tx.notes || tx.reason || '',
                  user: tx.createdBy?.fullName || tx.createdBy?.email || tx.user?.name || tx.user?.username || 'System',
                };
              });
            } catch (e) {
              console.error('Failed to load transactions for inventory', inv.id, e);
              return [];
            }
          })
        );
        setTransactions(allTransactions.flat());
      } catch (txErr) {
        console.error('Failed to load transactions list:', txErr);
        // Fallback to demo transactions
        setTransactions(demoTransactions);
      }
    } catch (error) {
      console.error('Error loading inventory data:', error);
      setError(error.userMessage || t('error'));
      setInventory(demoInventory);
      setTransactions(demoTransactions);
    } finally {
      setLoading(false);
    }
  };

  // Load data from API on component mount
  useEffect(() => {
    loadInventory();
  }, []);

  // Filter inventory based on search query, category, and status
  useEffect(() => {
    // If a barcode scan result is active, prioritize it and skip other filters
    if (barcodeSearchActive) {
      setFilteredInventory(barcodeResultItems);
      return;
    }

    let filtered = inventory;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== 1) { // If not 'All'
      const categoryName = demoCategories.find(cat => cat.id === selectedCategory)?.name;
      filtered = filtered.filter(item => item.category === categoryName);
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    setFilteredInventory(filtered);
  }, [searchQuery, selectedCategory, statusFilter, inventory, barcodeSearchActive, barcodeResultItems]);

  // Handle barcode search using current input (scanner usually sends Enter)
  const handleBarcodeSearch = (barcode) => {
    const code = (barcode || '').trim();
    if (!code) return;

    // Try match by explicit barcode field, then by id, then by name includes as fallback
    const product = (products || []).find(p =>
      (p.barcode && String(p.barcode) === code) ||
      (p.id && String(p.id) === code) ||
      (p.serial_number && String(p.serial_number) === code)
    ) || (products || []).find(p => p.name?.toLowerCase().includes(code.toLowerCase()));

    if (!product) {
      // No product found
      alert('Product not found for code: ' + code);
      return;
    }

    // Find corresponding inventory item by productId
    const invItem = (inventory || []).find(inv => String(inv.productId) === String(product.id));

    if (invItem) {
      setBarcodeResultItems([invItem]);
      setBarcodeSearchActive(true);
      setPage(0);
    } else {
      // If no inventory record, show empty with alert
      alert('No inventory record found for scanned product: ' + (product.name || code));
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle menu open
  const handleMenuOpen = (event, item) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Handle view item
  const handleViewItem = () => {
    handleMenuClose();
    navigate(`/products/view/${selectedItem.productId}`);
  };
  
  // Handle edit item
  const handleEditItem = () => {
    handleMenuClose();
    navigate(`/products/edit/${selectedItem.productId}`);
  };
  
  // Handle restock dialog open
  const handleRestockOpen = () => {
    handleMenuClose();
    setRestockDialogOpen(true);
  };
  
  // Handle restock submit
  const handleRestockSubmit = async () => {
    const quantity = parseInt(restockQuantity);
    if (quantity > 0 && selectedItem) {
      try {
        await apiService.adjustInventory(selectedItem.id, { quantity, type: 'add', reason: 'Restock' });
        // Reload inventory and transactions
        await loadInventory();
        setRestockDialogOpen(false);
        setRestockQuantity('');
      } catch (e) {
        console.error('Failed to restock via API:', e);
      }
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
  
  // Get stock status
  const getStockStatus = (currentStock, minStock, reorderPoint) => {
    if (currentStock <= 0) return 'out_of_stock';
    if (currentStock < minStock) return 'critical';
    if (currentStock <= reorderPoint) return 'warning';
    return 'ok';
  };
  
  // Get status chip color and label
  const getStatusChip = (status) => {
    switch (status) {
      case 'ok':
        return <Chip icon={<CheckCircle />} label={t('inventory:inStock')} color="success" size="small" />;
      case 'warning':
        return <Chip icon={<Warning />} label={t('inventory:lowStock')} color="warning" size="small" />;
      case 'critical':
        return <Chip icon={<Error />} label={t('inventory:criticalStock')} color="error" size="small" />;
      case 'out_of_stock':
        return <Chip icon={<Error />} label={t('inventory:outOfStock')} color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };
  
  // Get transaction type chip
  const getTransactionTypeChip = (type) => {
    switch (type) {
      case 'restock':
        return <Chip icon={<TrendingUp />} label={t('inventory:restock')} color="success" size="small" />;
      case 'sale':
        return <Chip icon={<TrendingDown />} label={t('inventory:sale')} color="primary" size="small" />;
      case 'adjustment':
        return <Chip icon={<Edit />} label={t('inventory:adjustment')} color="warning" size="small" />;
      default:
        return <Chip label={type} size="small" />;
    }
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ textAlign: 'center', width: '100%' }}>
          {t('inventory:inventory')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => navigate('/inventory/adjust')}
        >
          {t('inventory:addStock')}
        </Button>
      </Box>
      
      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('inventory:totalProducts')}
              </Typography>
              <Typography variant="h4">
                {inventory.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('inventory:lowStockItems')}
              </Typography>
              <Typography variant="h4">
                {inventory.filter(item => item.status === 'warning').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('inventory:criticalStockItems')}
              </Typography>
              <Typography variant="h4">
                {inventory.filter(item => item.status === 'critical').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('inventory:outOfStockItems')}
              </Typography>
              <Typography variant="h4">
                {inventory.filter(item => item.status === 'out_of_stock').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<InventoryIcon />} label={t('inventory:currentStock')} />
          <Tab icon={<History />} label={t('inventory:transactions')} />
        </Tabs>
      </Paper>
      
      {/* Current Stock Tab */}
      {tabValue === 0 && (
        <>
          {/* Filters and search */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setBarcodeSearchActive(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { handleBarcodeSearch(searchQuery); } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={t('inventory:scanBarcode') || 'Scan barcode'}>
                          <IconButton onClick={() => handleBarcodeSearch(searchQuery)}>
                            <QrCodeScanner />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="category-select-label">{t('products:category')}</InputLabel>
                  <Select
                    labelId="category-select-label"
                    value={selectedCategory}
                    label={t('products:category')}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {demoCategories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="status-select-label">{t('inventory:status')}</InputLabel>
                  <Select
                    labelId="status-select-label"
                    value={statusFilter}
                    label={t('inventory:status')}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem key="all" value="all">{t('all')}</MenuItem>
                    <MenuItem key="ok" value="ok">{t('inventory:inStock')}</MenuItem>
                    <MenuItem key="warning" value="warning">{t('inventory:lowStock')}</MenuItem>
                    <MenuItem key="critical" value="critical">{t('inventory:criticalStock')}</MenuItem>
                    <MenuItem key="out_of_stock" value="out_of_stock">{t('inventory:outOfStock')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} md={1}>
                <Tooltip title={t('export')}>
                  <IconButton color="primary">
                    <FileDownload />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item xs={6} md={1}>
                <Tooltip title={t('refresh')}>
                  <IconButton color="primary" onClick={loadInventory}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Low stock alert */}
          {inventory.some(item => item.status === 'critical' || item.status === 'out_of_stock') && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {t('inventory:lowStockAlert')}
            </Alert>
          )}
          
          {/* Inventory table */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('products:productName')}</TableCell>
                    <TableCell>{t('products:category')}</TableCell>
                    <TableCell align="right">{t('inventory:currentStock')}</TableCell>
                    <TableCell align="right">{t('inventory:minStock')}</TableCell>
                    <TableCell align="right">{t('inventory:reorderPoint')}</TableCell>
                    <TableCell>{t('inventory:lastRestocked')}</TableCell>
                    <TableCell>{t('inventory:status')}</TableCell>
                    <TableCell align="center">{t('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInventory
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell align="right">{item.currentStock}</TableCell>
                        <TableCell align="right">{item.minStock}</TableCell>
                        <TableCell align="right">{item.reorderPoint}</TableCell>
                        <TableCell>{item.lastRestocked}</TableCell>
                        <TableCell>{getStatusChip(item.status)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            aria-label="more"
                            aria-controls="inventory-menu"
                            aria-haspopup="true"
                            onClick={(e) => handleMenuOpen(e, item)}
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
              count={filteredInventory.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={t('rowsPerPage')}
            />
          </Paper>
        </>
      )}
      
      {/* Transactions Tab */}
      {tabValue === 1 && (
        <>
          {/* Filters and search for transactions */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  fullWidth
                >
                  {t('filter')}
                </Button>
              </Grid>
              <Grid item xs={12} md={2}>
                <Tooltip title={t('export')}>
                  <IconButton color="primary">
                    <FileDownload />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Transactions table */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('date')}</TableCell>
                    <TableCell>{t('products:productName')}</TableCell>
                    <TableCell>{t('inventory:transactionType')}</TableCell>
                    <TableCell align="right">{t('inventory:quantity')}</TableCell>
                    <TableCell>{t('notes')}</TableCell>
                    <TableCell>{t('user')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions
                    .filter(transaction => 
                      transaction.productName.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.productName}</TableCell>
                        <TableCell>{getTransactionTypeChip(transaction.type)}</TableCell>
                        <TableCell align="right" sx={{
                          color: transaction.quantity > 0 ? 'success.main' : 'error.main',
                          fontWeight: 'bold'
                        }}>
                          {transaction.quantity > 0 ? `+${transaction.quantity}` : transaction.quantity}
                        </TableCell>
                        <TableCell>{transaction.notes}</TableCell>
                        <TableCell>{transaction.user}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={transactions.filter(transaction => 
                transaction.productName.toLowerCase().includes(searchQuery.toLowerCase())
              ).length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={t('rowsPerPage')}
            />
          </Paper>
        </>
      )}
      
      {/* Action Menu */}
      <Menu
        id="inventory-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem key="view" onClick={handleViewItem}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('view')} />
        </MenuItem>
        <MenuItem key="edit" onClick={handleEditItem}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('edit')} />
        </MenuItem>
        <MenuItem key="restock" onClick={handleRestockOpen}>
          <ListItemIcon>
            <TrendingUp fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('inventory:restock')} />
        </MenuItem>
      </Menu>
      
      {/* Restock Dialog */}
      <Dialog
        open={restockDialogOpen}
        onClose={() => setRestockDialogOpen(false)}
        aria-labelledby="restock-dialog-title"
      >
        <DialogTitle id="restock-dialog-title">
          {t('inventory:restockProduct')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {selectedItem && (
              <>
                {t('products:product')}: <strong>{selectedItem.productName}</strong><br />
                {t('inventory:currentStock')}: <strong>{selectedItem.currentStock}</strong>
              </>
            )}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label={t('inventory:quantityToAdd')}
            type="number"
            fullWidth
            value={restockQuantity}
            onChange={(e) => setRestockQuantity(e.target.value)}
            InputProps={{
              inputProps: { min: 1 }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestockDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleRestockSubmit} 
            color="primary"
            disabled={!restockQuantity || parseInt(restockQuantity) <= 0}
          >
            {t('inventory:restock')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;