import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Autocomplete,
} from '@mui/material';
import {
  Save,
  Cancel,
  ArrowBack,
  Home,
  Add,
  Remove,
  Delete,
  TrendingUp,
  TrendingDown,
  Search,
} from '@mui/icons-material';
import apiService from '../../api/apiService';

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

// Adjustment reasons
const adjustmentReasons = [
  { id: 1, name: 'Damaged' },
  { id: 2, name: 'Expired' },
  { id: 3, name: 'Theft' },
  { id: 4, name: 'Counting Error' },
  { id: 5, name: 'Quality Control' },
  { id: 6, name: 'Returned by Customer' },
  { id: 7, name: 'Promotional Giveaway' },
  { id: 8, name: 'Internal Use' },
  { id: 9, name: 'Other' },
];

const StockAdjustment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // Set document title
  useEffect(() => {
    document.title = t('pageTitle.stockAdjustment');
  }, [t]);

  // State for products (loaded from API)
  const [products, setProducts] = useState([]);
  const [inventoryMap, setInventoryMap] = useState({}); // Map productId -> inventory item
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(1); // Default to 'All'
  
  // State for adjustment items
  const [adjustmentItems, setAdjustmentItems] = useState([]);
  
  // State for form data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: `ADJ-${Math.floor(Math.random() * 10000)}`,
    adjustmentType: 'decrease',
    reason: '',
    notes: '',
  });
  
  // State for selected product
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  
  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load products and inventory from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsRes, inventoryRes] = await Promise.all([
          apiService.getProducts(),
          apiService.getInventory(),
        ]);
        const productsWithStock = productsRes.map(p => {
          const invItem = inventoryRes.find(inv => inv.productId === p.id || inv.product_id === p.id);
          return {
            id: p.id,
            name: p.name,
            category: p.category || 'All',
            currentStock: invItem?.quantity ?? (p.stock ?? 0),
            minStock: invItem?.minStockLevel ?? 0,
            reorderPoint: Math.max(invItem?.minStockLevel ?? 0, 5),
          };
        });
        setProducts(productsWithStock);
        setFilteredProducts(productsWithStock);
        // Build inventory map
        const map = {};
        inventoryRes.forEach(inv => {
          const pid = inv.productId || inv.product_id;
          map[pid] = inv;
        });
        setInventoryMap(map);
      } catch (err) {
        console.error('Failed to load products/inventory:', err);
-        setNotification({ open: true, message: err.userMessage || 'Failed to load data', severity: 'error' });
        setNotification({ open: true, message: err.userMessage || t('error'), severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter products based on search query and category
  useEffect(() => {
    let filtered = products;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== 1) { // If not 'All'
      const categoryName = demoCategories.find(cat => cat.id === selectedCategory)?.name;
      filtered = filtered.filter(product => product.category === categoryName);
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle add item to adjustment
  const handleAddItem = () => {
    if (selectedProduct && quantity && parseInt(quantity) > 0) {
      // Check if product already exists in adjustment items
      const existingItemIndex = adjustmentItems.findIndex(item => item.productId === selectedProduct.id);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...adjustmentItems];
        updatedItems[existingItemIndex].quantity = parseInt(quantity);
        setAdjustmentItems(updatedItems);
      } else {
        // Add new item
        const newItem = {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          category: selectedProduct.category,
          currentStock: selectedProduct.currentStock,
          quantity: parseInt(quantity),
        };
        setAdjustmentItems([...adjustmentItems, newItem]);
      }
      
      // Reset selection
      setSelectedProduct(null);
      setQuantity('');
    }
  };

  // Handle remove item from adjustment
  const handleRemoveItem = (productId) => {
    setAdjustmentItems(adjustmentItems.filter(item => item.productId !== productId));
  };

  // Submit adjustments to backend for each item
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (adjustmentItems.length === 0) {
      setNotification({ open: true, message: t('inventory:noItemsSelected') || 'No items selected', severity: 'error' });
      return;
    }
    
    if (!formData.reason) {
      setNotification({ open: true, message: t('inventory:reasonRequired') || 'Reason is required', severity: 'error' });
      return;
    }

    try {
      // For each item, find its inventoryId and call adjust endpoint
      for (const item of adjustmentItems) {
        const inv = inventoryMap[item.productId];
        if (!inv) {
          // If inventory record doesn't exist, create it first with 0 quantity
          const created = await apiService.createInventory({ productId: item.productId, quantity: 0, minStockLevel: 0 });
          // Update map
          inventoryMap[item.productId] = created;
        }
        const inventoryId = (inventoryMap[item.productId].id);
        const type = formData.adjustmentType === 'increase' ? 'add' : 'subtract';
        await apiService.adjustInventory(inventoryId, { quantity: item.quantity, type, reason: formData.reason });
      }

      setNotification({ open: true, message: t('inventory:adjustmentSaved') || 'Adjustment saved', severity: 'success' });
      // Navigate back to inventory after a short delay
      setTimeout(() => {
        navigate('/inventory');
      }, 1000);
    } catch (err) {
      console.error('Failed to save adjustment:', err);
-      setNotification({ open: true, message: err.userMessage || 'Failed to save adjustment', severity: 'error' });
      setNotification({ open: true, message: err.userMessage || t('error'), severity: 'error' });
    }
  };

  // Get stock status
  const getStockStatus = (currentStock, minStock, reorderPoint) => {
    if (currentStock <= 0) return 'out_of_stock';
    if (currentStock < minStock) return 'critical';
    if (currentStock <= reorderPoint) return 'warning';
    return 'ok';
  };

  // Handle notification close
  const handleNotificationClose = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link 
            underline="hover" 
            color="inherit" 
            href="/" 
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Home sx={{ marginInlineEnd: 0.5 }} fontSize="inherit" />
            {t('home')}
          </Link>
        <Link
          underline="hover"
          color="inherit"
          href="/inventory"
          onClick={(e) => {
            e.preventDefault();
            navigate('/inventory');
          }}
        >
          {t('inventory:inventory')}
        </Link>
        <Typography color="text.primary">
          {t('inventory:stockAdjustment')}
        </Typography>
      </Breadcrumbs>
      
      {/* Page title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ textAlign: 'center', width: '100%' }}>
          {t('inventory:stockAdjustment')}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/inventory')}
        >
          {t('back')}
        </Button>
      </Box>
      
      {/* Adjustment form */}
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('date')}
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('inventory:reference')}
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">{t('inventory:adjustmentType')}</FormLabel>
              <RadioGroup
                row
                name="adjustmentType"
                value={formData.adjustmentType}
                onChange={handleChange}
              >
                <FormControlLabel 
                  value="increase" 
                  control={<Radio />} 
                  label={t('inventory:increase')} 
                />
                <FormControlLabel 
                  value="decrease" 
                  control={<Radio />} 
                  label={t('inventory:decrease')} 
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel id="reason-label">{t('inventory:reason')}</InputLabel>
              <Select
                labelId="reason-label"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                label={t('inventory:reason')}
              >
                {adjustmentReasons.map((reason) => (
                  <MenuItem key={reason.id} value={reason.name}>
                    {reason.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
                fullWidth
                label={t('notes')}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={4}
              />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Product selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('inventory:selectProducts')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <Autocomplete
              options={filteredProducts}
              getOptionLabel={(option) => option.name}
              value={selectedProduct}
              onChange={(event, newValue) => {
                setSelectedProduct(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('products:product')}
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
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
          
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label={t('inventory:quantity')}
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              InputProps={{
                inputProps: { min: 1 }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAddItem}
              disabled={!selectedProduct || !quantity || parseInt(quantity) <= 0}
            >
              {t('add')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Selected items */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('inventory:selectedItems')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {adjustmentItems.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('inventory:noItemsSelected')}
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('products:product')}</TableCell>
                  <TableCell>{t('products:category')}</TableCell>
                  <TableCell align="right">{t('inventory:currentStock')}</TableCell>
                  <TableCell align="right">{t('inventory:quantity')}</TableCell>
                  <TableCell align="right">{t('inventory:newStock')}</TableCell>
                  <TableCell align="center">{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {adjustmentItems.map((item) => {
                  const newStock = formData.adjustmentType === 'increase'
                    ? item.currentStock + item.quantity
                    : Math.max(0, item.currentStock - item.quantity);
                  
                  return (
                    <TableRow key={item.productId}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell align="right">{item.currentStock}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          icon={formData.adjustmentType === 'increase' ? <TrendingUp /> : <TrendingDown />}
                          label={item.quantity}
                          color={formData.adjustmentType === 'increase' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{newStock}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveItem(item.productId)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* Form actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Cancel />}
          onClick={() => navigate('/inventory')}
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={<Save />}
          onClick={handleSubmit}
          disabled={adjustmentItems.length === 0 || !formData.reason}
        >
          {t('save')}
        </Button>
      </Box>
      
      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleNotificationClose} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StockAdjustment;