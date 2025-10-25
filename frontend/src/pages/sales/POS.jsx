import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectCurrency, selectStoreSettings } from '../../redux/slices/settingsSlice';
import { selectUser } from '../../redux/slices/authSlice';
import apiService from '../../api/apiService';
import { toast } from 'react-toastify';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Card,
  CardContent,
  CardMedia,
  InputAdornment,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  Badge,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Add,
  Remove,
  Delete,
  ShoppingCart,
  Person,
  Receipt,
  LocalOffer,
  Payment,
  Print,
  Save,
  Cancel,
  Email,
  Sms,
  Category,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
// import { QRCodeSVG } from 'qrcode.react';
import QRCodeWrapper from '../../components/QRCodeWrapper';

// Placeholder image for products without images
const placeholderImage = `data:image/svg+xml;utf8,
<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>
  <rect width='100%' height='100%' fill='%23f5f5f5'/>
  <g fill='none' stroke='%23cccccc' stroke-width='4'>
    <rect x='50' y='40' width='300' height='220' rx='12' ry='12'/>
    <circle cx='200' cy='150' r='50'/>
  </g>
  <text x='200' y='260' font-family='Arial' font-size='18' fill='%23999999' text-anchor='middle'>No Image</text>
</svg>`;

// Helper to build a usable image URL for products
const getProductImageUrl = (product) => {
  // Prefer database field image_url
  const raw = product?.image_url || product?.image || product?.imageUrl || '';
  let img = typeof raw === 'string' ? raw.trim() : '';
  if (!img) return placeholderImage;

  // Normalize Windows-style backslashes and strip query/hash
  img = img.replace(/\\\\/g, '/');
  const noQuery = img.split('#')[0].split('?')[0];

  // Absolute URL
  if (/^https?:\/\//i.test(noQuery)) {
    try {
      const url = new URL(noQuery);
      if (url.origin === window.location.origin) return url.href;
      if (url.pathname.includes('/uploads/')) {
        const idx = url.pathname.indexOf('/uploads/');
        return url.pathname.slice(idx);
      }
      return url.href;
    } catch {
      // continue below
    }
  }

  // Normalize uploads path and use relative URL (works with proxy in dev and backend in prod)
  if (noQuery.startsWith('/uploads/')) return noQuery;
  if (noQuery.includes('/uploads/')) {
    const idx = noQuery.indexOf('/uploads/');
    return noQuery.slice(idx);
  }
  if (noQuery.startsWith('uploads/')) return '/' + noQuery;

  // Likely a filename
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(noQuery)) {
    const parts = noQuery.split('/');
    const fileName = parts[parts.length - 1];
    return `/uploads/${fileName}`;
  }

  return placeholderImage;
};

// Demo data for categories
const demoCategories = [
  { id: 1, name: 'all' },
  { id: 2, name: 'fruits' },
  { id: 3, name: 'vegetables' },
  { id: 4, name: 'dairy' },
  { id: 5, name: 'bakery' },
  { id: 6, name: 'meat' },
  { id: 7, name: 'grains' },
];

// Demo data for customers
const demoCustomers = [
  { id: 1, name: 'walkInCustomer', phone: '', email: '' },
  { id: 2, name: 'Ahmed Ali', phone: '0123456789', email: 'ahmed@example.com' },
  { id: 3, name: 'Sara Mohamed', phone: '0123456788', email: 'sara@example.com' },
  { id: 4, name: 'Khaled Ibrahim', phone: '0123456787', email: 'khaled@example.com' },
];

// Demo data for payment methods
const paymentMethods = [
  { id: 1, name: 'cash' },
  { id: 2, name: 'card' },
  { id: 3, name: 'bankTransfer' },
];

const POS = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currency = useSelector(selectCurrency);
// storeSettings is already declared above, removing duplicate declaration
  const currentUser = useSelector(selectUser);

  // Set document title
  useEffect(() => {
    document.title = t('pageTitle.pos');
  }, [i18n.language, t]);

  // State for cart items
  const [cartItems, setCartItems] = useState([]);
  
  // State for products and categories
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([{ id: 1, name: 'all' }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for product filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(1); // Default to 'All'
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // State for customer selection
  const [selectedCustomer, setSelectedCustomer] = useState({ id: null, name: 'walkInCustomer', phone: '', email: '' });
  const [customerOptions, setCustomerOptions] = useState([{ id: null, name: 'walkInCustomer', phone: '', email: '' }]);
  const [customersLoading, setCustomersLoading] = useState(false);
  
  // State for payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(1); // Default to 'Cash'
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // State for receipt dialog
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  
  // State for receipt data to show server receipt number
  const [receiptData, setReceiptData] = useState(null);
 const storeSettings = useSelector(selectStoreSettings);

  // Auto-print receipt when dialog opens if enabled in settings
  useEffect(() => {
    if (receiptDialogOpen && storeSettings?.receiptPrintAutomatically) {
      const timer = setTimeout(() => {
        try {
          window.print();
          // إضافة مستمع حدث لإغلاق نافذة الطباعة بعد الانتهاء
          window.addEventListener('afterprint', () => {
            // إغلاق نافذة الطباعة بعد الانتهاء
            setTimeout(() => {
              completeSale();
            }, 500);
          }, { once: true });
        } catch (e) {
          console.error('Auto print failed:', e);
          // في حالة فشل الطباعة، استمر في إغلاق النافذة
          setTimeout(() => {
            completeSale();
          }, 500);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [receiptDialogOpen, storeSettings?.receiptPrintAutomatically]);

  // Helper function to ensure number conversion
  const parsePrice = (price) => {
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? 0 : numPrice;
  };
  
  // Calculate totals with safe number conversion
  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = parsePrice(item.price);
    return sum + (itemPrice * item.quantity);
  }, 0);
  const taxRatePercent = Number(storeSettings?.taxRate) || 0;
  const tax = subtotal * (taxRatePercent / 100);
  const total = subtotal + tax;
  const change = amountPaid ? parseFloat(amountPaid) - total : 0;
  
  // Fetch products and categories from API
  useEffect(() => {
    // Function to fetch products and categories
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch products directly
        const productsData = await apiService.getProducts();
        console.log('Products data:', productsData);
        const safeProducts = Array.isArray(productsData) ? productsData.map(product => ({
          ...product,
          price: parsePrice(product.price), // Ensure price is a number
          stock: parseInt(product.stock) || 0 // Ensure stock is a number
        })) : [];
        setProducts(safeProducts);
        
        // Fetch categories (gracefully fallback to just 'All' if it fails)
        let allCategories = [{ id: 1, name: t('all') }];
        try {
          const categoriesData = await apiService.getCategories();
          console.log('Categories data:', categoriesData);
          // Sort categories by display_order, then by created_at
          const sortedCategories = (categoriesData || []).sort((a, b) => {
            if (a.display_order !== b.display_order) {
              return (a.display_order || 0) - (b.display_order || 0);
            }
            return new Date(a.created_at || 0) - new Date(b.created_at || 0);
          });
          allCategories = allCategories.concat(sortedCategories);
        } catch (catErr) {
          console.warn('Fetching categories failed, using default only', catErr);
        }
        setCategories(allCategories);

        // Fetch customers
        try {
          setCustomersLoading(true);
          const customers = await apiService.getCustomers();
          const normalized = (Array.isArray(customers) ? customers : []).map((c) => ({
            id: c.id || c.customerId || null,
            name: c.name || c.fullName || t('notAvailable'),
            phone: c.phone || c.phoneNumber || '',
            email: c.email || '',
          })).filter(c => c.id);
          setCustomerOptions([{ id: null, name: t('sales:walkInCustomer') }, ...normalized]);
        } catch (custErr) {
          console.warn('Fetching customers failed, using demo list', custErr);
        } finally {
          setCustomersLoading(false);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.userMessage || t('error'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter products based on search query and selected category
  useEffect(() => {
    let filtered = products;
    
    // Filter by search query (name, description, or barcode)
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.id?.toString().includes(searchQuery) // Use ID as barcode for now
      );
    }
    
    // Filter by category
    if (selectedCategory !== 1) { // If not 'All'
      const categoryName = categories.find(cat => cat.id === selectedCategory)?.name;
      filtered = filtered.filter(product => 
        product.category?.name === categoryName || 
        product.category === categoryName
      );
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products, categories]);
  
  // Barcode scanning functionality has been removed
  
  

  
  // Barcode scanner detection has been removed
  

  

  

  
  // Add product to cart with safe price conversion
  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      
      if (existingItem) {
        // If item already exists, increase quantity
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item with quantity 1 and ensure price is a number
        return [...prevItems, { 
          ...product, 
          quantity: 1,
          price: parsePrice(product.price) // Ensure price is number
        }];
      }
    });
  };
  
  // Remove product from cart
  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };
  
  // Update product quantity in cart
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };
  
  // Handle payment
  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      // Build sale payload according to backend requirements
      const items = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: parseFloat(item.price) || 0,
        discount: 0,
        notes: undefined,
      }));

      const methodName = paymentMethods.find(m => m.id === paymentMethod)?.name?.toLowerCase();
      // Map UI methods to backend ENUM: cash, credit_card, debit_card, mobile_payment, other
      let normalizedMethod = 'cash';
      if (methodName?.includes('card')) normalizedMethod = 'credit_card';
      else if (methodName?.includes('cash')) normalizedMethod = 'cash';
      else if (methodName?.includes('bank')) normalizedMethod = 'other';
      else normalizedMethod = 'other';
      
      // Only send customerId if it's a valid UUID-like string
      const customerIdValue = typeof selectedCustomer?.id === 'string' && selectedCustomer.id.match(/^[0-9a-fA-F-]{36}$/)
        ? selectedCustomer.id
        : undefined;

      const salePayload = {
        customerId: customerIdValue,
        items,
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxAmount: parseFloat(tax.toFixed(2)),
        discountAmount: 0,
        totalAmount: parseFloat(total.toFixed(2)),
        paymentMethod: normalizedMethod,
        paymentStatus: 'paid',
        notes: undefined,
        userId: currentUser?.id, // Add current user ID to identify the cashier
        cashierId: currentUser?.id, // Add cashier ID as alternative field
      };

      // Call API to create sale
      const created = await apiService.createSale(salePayload);
      console.log('Sale created:', created);

      // Store created sale to use receiptNumber
      const createdSale = created?.data || created; 
      setReceiptData({
        receiptNumber: createdSale?.receiptNumber,
        createdSale,
      });
      // Dispatch global event to refresh Sales/Invoices lists instantly
      try {
        window.dispatchEvent(new CustomEvent('sales:updated', { detail: createdSale }));
      } catch (e) {
        console.warn('Failed to dispatch sales:updated event', e);
      }
      
      setPaymentLoading(false);
      setPaymentDialogOpen(false);
      setReceiptDialogOpen(true);
    } catch (err) {
      console.error('Failed to complete payment:', err);
      alert(err.userMessage || err.friendlyMessage || t('sales:errors.paymentFailed'));
      setPaymentLoading(false);
    }
  };
  
  // Handle completing the sale
  const completeSale = () => {
    // Reset everything
    setCartItems([]);
    setSelectedCustomer(demoCustomers[0]);
    setSearchQuery('');
    setSelectedCategory(1);
    setAmountPaid('');
    setReceiptDialogOpen(false);

    // Navigate to sales page to view the new record
    navigate('/sales');
  };
  
  // Handle canceling the sale
  const cancelSale = () => {
    if (cartItems.length === 0) return;
    
    if (window.confirm(t('sales:confirmDeleteSale'))) {
      setCartItems([]);
      setSelectedCustomer(demoCustomers[0]);
    }
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', width: '100%' }}>
        {t('sales:pointOfSale')}
      </Typography>
      
      <Grid container spacing={2}>
        {/* Left side - Products */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            {/* Search and category filter */}
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={t('sales:searchProduct')}
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
 
              <Grid item xs={12} md={6}>
                <Tabs
                  value={selectedCategory}
                  onChange={(e, newValue) => setSelectedCategory(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="category tabs"
                  sx={{ maxWidth: '100%', overflow: 'hidden' }}
                >
                  {categories.map((category) => (
                    <Tab 
                      key={category.id} 
                      label={t(`sales.categories.${category.name}`)} 
                      value={category.id} 
                      icon={<Category />} 
                      iconPosition="start"
                    />
                  ))}
                </Tabs>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Products grid */}
          <Grid container spacing={2} sx={{ 
            flexWrap: 'wrap',
            '& .MuiGrid-item': {
              maxWidth: '100%'
            }
          }}>
            {filteredProducts.map((product) => (
              <Grid item xs={6} sm={4} md={3} xl={2} key={product.id} sx={{ minWidth: 0 }}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    cursor: 'pointer',
                    maxWidth: '100%',
                    '&:hover': { boxShadow: 6 },
                  }}
                  onClick={() => addToCart(product)}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={getProductImageUrl(product)}
                    alt={product.name}
                    sx={{ 
                      objectFit: 'cover',
                      backgroundColor: '#f5f5f5'
                    }}
                    onError={(e) => {
                      // Debug: سجل تفاصيل الخطأ عند فشل تحميل صورة المنتج
                      const failingUrl = e?.target?.src;
                      console.error("خطأ في تحميل صورة المنتج:", {
                        productId: product?.id,
                        productName: product?.name,
                        imageUrlTried: failingUrl,
                        rawImageFields: {
                          image_url: product?.image_url,
                          image: product?.image,
                          imageUrl: product?.imageUrl,
                        },
                        errorEvent: e,
                      });
                      // لمنع تكرار onError بشكل لا نهائي ثم عرض صورة بديلة
                      if (e && e.target) {
                        e.target.onerror = null;
                        e.target.src = placeholderImage;
                      }
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography gutterBottom variant="h6" component="div" noWrap>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {product.category}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {currency.symbol} {product.price.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
        
        {/* Right side - Cart */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Customer selection */}
            <Box sx={{ mb: 2 }}>
              <Autocomplete
                value={selectedCustomer}
                onChange={(event, newValue) => {
                  setSelectedCustomer(newValue || { id: null, name: t('sales:walkInCustomer') });
                }}
                options={customerOptions}
                loading={customersLoading}
                getOptionLabel={(option) => option?.name || ''}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('sales:customer')}
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body1">{t(`sales.customers.${option.name}`, { defaultValue: option.name })}</Typography>
                      {option.phone && (
                        <Typography variant="body2" color="text.secondary">
                          {option.phone}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
              />
            </Box>
            
            <Typography variant="h6" gutterBottom>
              {t('sales:items')}
            </Typography>
            
            {/* Cart items */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2, maxHeight: '400px' }}>
              {cartItems.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ShoppingCart sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    {t('sales:addItem')}
                  </Typography>
                </Box>
              ) : (
                <List sx={{ pt: 0 }}>
                  {cartItems.map((item) => (
                    <ListItem key={item.id} sx={{ py: 1, px: 0 }}>
                      <ListItemText
                        primary={item.name}
                        secondary={
                          <Typography variant="body2" color="text.primary">
                            {currency.symbol} {item.price.toFixed(2)} × {item.quantity} = {currency.symbol}{(item.price * item.quantity).toFixed(2)}
                          </Typography>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton 
                          size="small" 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                        <TextField
                          size="small"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              updateQuantity(item.id, value);
                            }
                          }}
                          inputProps={{ min: 1, style: { textAlign: 'center' } }}
                          sx={{ width: 40, mx: 1 }}
                        />
                        <IconButton 
                          size="small" 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
            
            {/* Cart summary */}
            <Box>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body1">{t('sales:subtotal')}:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1" align="right">{currency.symbol} {subtotal.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1" align="right">{currency.symbol} {tax.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" align="right">{currency.symbol} {total.toFixed(2)}</Typography>
                </Grid>
                {/* Action buttons */}
                <Grid item xs={12}>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Button
                        variant="outlined"
                        color="primary"
                        fullWidth
                        size="small"
                        disabled={cartItems.length === 0}
                        onClick={() => setPaymentDialogOpen(true)}
                        startIcon={<Payment />}
                        sx={{ fontSize: '0.75rem', py: 1 }}
                      >
                        SALES PAYMENT
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        size="small"
                        disabled={cartItems.length === 0}
                        onClick={cancelSale}
                        startIcon={<Cancel />}
                        sx={{ fontSize: '0.75rem', py: 1 }}
                      >
                        SALES CANCELSALE
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        variant="outlined"
                        color="secondary"
                        fullWidth
                        size="small"
                        disabled={cartItems.length === 0}
                        startIcon={<Save />}
                        sx={{ fontSize: '0.75rem', py: 1 }}
                      >
                        SALES HOLDSALE
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
                {/* Payment dialog inputs - REMOVED FROM CART SUMMARY */}
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('sales:payment')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="payment-method-label">{t('sales:paymentMethod')}</InputLabel>
                <Select
                  labelId="payment-method-label"
                  value={paymentMethod}
                  label={t('sales:paymentMethod')}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {paymentMethods.map((method) => (
                    <MenuItem key={method.id} value={method.id}>
                      {t(`sales.paymentMethods.${method.name}`, { defaultValue: method.name })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('sales:amountPaid')}
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">{currency.symbol}</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('sales:changeAmount')}
                value={change > 0 ? change.toFixed(2) : '0.00'}
                InputProps={{
                  readOnly: true,
                  startAdornment: <InputAdornment position="start">{currency.symbol}</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6">
                {t('sales:total')}: {currency.symbol}{total.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button 
            variant="contained" 
            onClick={handlePayment} 
            disabled={!amountPaid || parseFloat(amountPaid) < total || paymentLoading}
          >
            {paymentLoading ? <CircularProgress size={24} /> : t('sales:completeSale')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onClose={() => setReceiptDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('sales:receipt')}</DialogTitle>
        <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
         <Box id="receipt-print">
            <div className="receipt-header">
              {storeSettings?.receiptShowLogo && storeSettings?.logoUrl && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  <img src={storeSettings.logoUrl} alt="logo" style={{ maxHeight: 60, objectFit: 'contain' }} />
                </Box>
              )}
              <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
                {storeSettings?.name || t('appName')}
              </Typography>
              <Typography variant="body2" align="center" gutterBottom>
                {[storeSettings?.address, storeSettings?.city, storeSettings?.country].filter(Boolean).join(', ')}
              </Typography>
              {storeSettings?.phone && (
                <Typography variant="body2" align="center" gutterBottom>
                  Tel: {storeSettings.phone}
                </Typography>
              )}
              
              <Typography variant="subtitle2" align="center" gutterBottom>
                {t('sales:receiptNumber')}: {receiptData?.receiptNumber || 'INV-9010'}
              </Typography>
              <Typography variant="subtitle2" align="center" gutterBottom>
                {t('sales:date')}: {new Date(receiptData?.createdSale?.createdAt || Date.now()).toLocaleString('ar-EG')}
              </Typography>
              {currentUser && (
                <Typography variant="subtitle2" align="center" gutterBottom>
                  {t('sales:cashier')}: {currentUser?.fullName || currentUser?.username || currentUser?.name || 'Admin User'}
                </Typography>
              )}
              <Typography variant="subtitle2" align="center" gutterBottom>
                {t('sales:customer')}: {t(`sales.customers.${selectedCustomer?.name}`, { defaultValue: selectedCustomer?.name || 'walkInCustomer' })}
              </Typography>
            </div>
            
            <div className="receipt-items">
              <Typography variant="subtitle1" align="center" gutterBottom>
                {t('sales:items')}
              </Typography>
              {cartItems.map((item) => (
                <Box key={item.id} sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {item.name} × {item.quantity}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      {currency.symbol} {item.price.toFixed(2)} × {item.quantity}
                    </Typography>
                    <Typography variant="body2">
                      {currency.symbol} {(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </div>
            
            <div className="receipt-totals">
              <Typography variant="subtitle2" align="right">
                <strong>{t('sales:subtotal')}:</strong> {currency.symbol} {subtotal.toFixed(2)}
              </Typography>
              {storeSettings?.receiptShowTaxDetails && (
                <Typography variant="subtitle2" align="right">
                  <strong>{t('sales:tax')} ({taxRatePercent}%):</strong> {currency.symbol} {tax.toFixed(2)}
                </Typography>
              )}
              <Typography variant="subtitle2" align="right">
                <strong>{t('sales:total')}:</strong> {currency.symbol} {total.toFixed(2)}
              </Typography>
            </div>
            
            <div className="receipt-payment-info">
              <Typography variant="subtitle2" align="center">
                <strong>{t('sales:amountPaid')}:</strong> {currency.symbol} {(parseFloat(amountPaid || 0)).toFixed(2)}
              </Typography>
              <Typography variant="subtitle2" align="center">
                <strong>{t('sales:changeAmount')}:</strong> {currency.symbol} {(change > 0 ? change : 0).toFixed(2)}
              </Typography>
              <Typography variant="subtitle2" align="center">
                <strong>{t('sales:paymentMethod')}:</strong> {t(`sales:paymentMethods.${paymentMethod}`)}
              </Typography>
            </div>
            
            <div className="receipt-footer">
              {storeSettings?.invoiceTerms && (
                <Typography
                  variant="caption"
                  align="center"
                  display="block"
                  sx={{ whiteSpace: 'pre-line', mb: 1, color: 'text.secondary', fontSize: '0.7rem' }}
                >
                  {storeSettings.invoiceTerms}
                </Typography>
              )}
              <Typography variant="body2" align="center" sx={{ fontStyle: 'italic' }}>
                {storeSettings?.receiptFooterText || t('thankYou')}
              </Typography>

             {storeSettings?.receiptShowOnlineOrderQR && (
               <Box sx={{ textAlign: 'center', my: 1 }}>
                 <Typography variant="caption" display="block" gutterBottom>
                   {t('online:scanQRCode', 'امسح رمز QR للطلب أونلاين')}
                 </Typography>
                 <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                   <QRCodeWrapper
                     value={`${window.location.origin}/online-order`}
                     size={120}
                     level="M"
                     includeMargin
                     bgColor="#FFFFFF"
                     fgColor="#000000"
                   />
                 </Box>
                 <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                   {t('online:orVisitLink', 'أو قم بزيارة هذا الرابط')}: {`${window.location.origin}/online-order`}
                 </Typography>
               </Box>
             )}
            </div>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            startIcon={<Print />} 
            onClick={() => {
              try {
                window.print();
                // إضافة مستمع حدث لإغلاق نافذة الطباعة بعد الانتهاء
                window.addEventListener('afterprint', () => {
                  // إغلاق نافذة الطباعة بعد الانتهاء
                  setTimeout(() => {
                    completeSale();
                  }, 500);
                }, { once: true });
              } catch (e) {
                console.error('Manual print failed:', e);
                // في حالة فشل الطباعة، استمر في إغلاق النافذة
                setTimeout(() => {
                  completeSale();
                }, 500);
              }
            }}
          >
            {t('sales:printReceipt')}
          </Button>
          <Button startIcon={<Email />}>
            {t('sales:emailReceipt')}
          </Button>
          <Button startIcon={<Sms />}>
            {t('sales:smsReceipt')}
          </Button>
          <Button variant="contained" onClick={completeSale}>
            {t('done')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default POS;