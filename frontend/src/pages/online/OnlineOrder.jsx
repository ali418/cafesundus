import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectCurrency, selectStoreSettings } from '../../redux/slices/settingsSlice';
import apiService from '../../api/apiService';
import { toast } from 'react-toastify';
import LanguageSwitcher from '../../components/LanguageSwitcher';
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
  DialogContentText,
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
  Container,
  AppBar,
  Toolbar,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
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
  Phone,
  Email,
  LocationOn,
  Category,
} from '@mui/icons-material';

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
  const img = typeof raw === 'string' ? raw.trim() : '';
  if (!img) return placeholderImage;

  // Absolute URL
  if (/^https?:\/\//i.test(img)) return img;

  // Normalize uploads path and use relative URL (works with proxy in dev and backend in prod)
  if (img.startsWith('/uploads/')) return img;
  if (img.startsWith('uploads/')) return '/' + img;

  // Likely a filename
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(img)) {
    return `/uploads/${img}`;
  }

  return placeholderImage;
};

const OnlineOrder = () => {
  const { t, i18n } = useTranslation(['online']);
  const currency = useSelector(selectCurrency);
  const storeSettings = useSelector(selectStoreSettings);

  // Set document title
  useEffect(() => {
    document.title = t('pageTitle.onlineOrder');
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
  
  // State for customer information
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: 'cashOnDelivery', // Default payment method
    mobilePaymentProvider: '', // MTn or Airtel
    transactionImage: null, // For payment receipt upload
  });
  
  // State for location loading
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // State for payment confirmation dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  // State for order process
  const [activeStep, setActiveStep] = useState(0);
  const steps = [t('selectProducts'), t('customerInfo'), t('confirmOrder')];
  
  // State for order submission
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState(null);

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
  
  // Fetch products and categories from API
  useEffect(() => {
    // Function to fetch products and categories
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch products directly
        const productsData = await apiService.getProducts();
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
          allCategories = allCategories.concat(categoriesData || []);
        } catch (catErr) {
          console.warn('Fetching categories failed, using default only', catErr);
        }
        setCategories(allCategories);
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

  // Add product to cart
  const addToCart = (product) => {
    setCartItems(prevItems => {
      // Check if product already exists in cart
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        // Product exists, update quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        return updatedItems;
      } else {
        // Product doesn't exist, add new item
        return [...prevItems, {
          id: product.id,
          name: product.name,
          price: product.price || product.selling_price || 0,
          quantity: 1,
          image: getProductImageUrl(product)
        }];
      }
    });
  };

  // Remove product from cart
  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  // Update product quantity in cart
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === productId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  // Handle customer info change
  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle payment method change
  const handlePaymentMethodChange = (e) => {
    const { value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      paymentMethod: value,
      // Reset mobile payment provider if not mobile payment
      mobilePaymentProvider: value === 'mobileMoney' ? prev.mobilePaymentProvider : ''
    }));
  };
  
  // Handle mobile payment provider change
  const handleMobileProviderChange = (e) => {
    const { value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      mobilePaymentProvider: value
    }));
    
    // Open confirmation dialog instead of payment app directly
    setSelectedProvider(value);
    setConfirmDialogOpen(true);
  };
  
  // Open mobile payment app with order total
  const openPaymentApp = (provider) => {
    // Only proceed if we have a total amount
    if (total <= 0) return;
    
    // Format amount without decimal places for mobile payment
    const amount = Math.round(total);
    
    // Get phone numbers from store settings
    const phoneNumbers = {
      mtn: storeSettings?.mtnPhoneNumber || '',
      airtel: storeSettings?.airtelPhoneNumber || ''
    };
    
    // Get the phone number for the selected provider
    const phoneNumber = phoneNumbers[provider];
    
    // If phone number is not set, show error
    if (!phoneNumber) {
      toast.error(t('phoneNumberNotSet', 'رقم الهاتف غير محدد لمزود الخدمة المحدد'));
      return;
    }
    
    // Get PIN digits from store settings
    const pinDigits = storeSettings?.mobilePinDigits || 4;
    
    // Create deep links based on provider
    let paymentUrl = '';
    let displayMessage = '';
    
    if (provider === 'mtn') {
      // MTN Money direct code format - using tel: protocol to open phone dialer
      // Format: tel:*321*phone_number*amount*pin#
      paymentUrl = `tel:*321*${phoneNumber}*${amount}*${'0'.repeat(pinDigits)}%23`;
      displayMessage = t('online:paymentInstructions', 'يرجى إدخال رقم PIN الخاص بك بدلاً من {{zeros}}', { zeros: '0'.repeat(pinDigits) });
    } else if (provider === 'airtel') {
      // Airtel Money format - using tel: protocol to open phone dialer
      // Format: tel:*166*amount*B number# (as per the correct Airtel Me2U format)
      paymentUrl = `tel:*166*${amount}*B${phoneNumber}%23`;
      displayMessage = t('online:airtelInstructions', 'بعد الضغط على الاتصال، سيتم تنفيذ عملية التحويل مباشرة إلى الرقم {{phoneNumber}} بمبلغ {{amount}}', { phoneNumber, amount });
    }
    
    // Open payment URL
    if (paymentUrl) {
      window.location.href = paymentUrl;
      toast.info(displayMessage);
    }
  };
  
  // Handle transaction image upload
  const handleTransactionImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCustomerInfo(prev => ({
        ...prev,
        transactionImage: file
      }));
    }
  };
  
  // Get user location and convert to address with detailed point information
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t('locationNotSupported', 'خدمة تحديد الموقع غير مدعومة في متصفحك'));
      return;
    }
    
    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const accuracy = position.coords.accuracy;
          
          // Format coordinates as numbers only
          const formattedCoords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          const accuracyInfo = `${t('accuracy', 'دقة')}: ${Math.round(accuracy)} ${t('meters', 'متر')}`;
          
          // Check if Google Maps API key is available
          const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
          if (!apiKey) {
            // If no API key, just show coordinates as numbers
            const pointInfo = formattedCoords;
            
            setCustomerInfo(prev => ({
              ...prev,
              address: pointInfo
            }));
            
            toast.warning(t('noApiKey', 'تم تحديد إحداثيات موقعك. يرجى إضافة مفتاح Google Maps API للحصول على عنوان مفصل.'));
            setLocationLoading(false);
            return;
          }
          
          // Use Google Maps Geocoding API to get address from coordinates
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=${i18n.language}`
          );
          
          const data = await response.json();
          
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            // Get the formatted address
            const formattedAddress = data.results[0].formatted_address;
            
            // Extract additional location details if available
            let locationDetails = [];
            if (data.results[0].address_components) {
              // Try to extract neighborhood, locality, and administrative area
              const components = data.results[0].address_components;
              const neighborhood = components.find(c => c.types.includes('neighborhood'))?.long_name;
              const locality = components.find(c => c.types.includes('locality'))?.long_name;
              const adminArea = components.find(c => c.types.includes('administrative_area_level_1'))?.long_name;
              
              if (neighborhood) locationDetails.push(neighborhood);
              if (locality && !locationDetails.includes(locality)) locationDetails.push(locality);
              if (adminArea && !locationDetails.includes(adminArea)) locationDetails.push(adminArea);
            }
            
            // Combine all information with coordinates as numbers only
            const detailedAddress = `${formattedAddress}\n${locationDetails.length > 0 ? locationDetails.join(', ') + '\n' : ''}${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            
            setCustomerInfo(prev => ({
              ...prev,
              address: detailedAddress
            }));
            
            toast.success(t('locationDetected', 'تم تحديد موقعك بنجاح'));
          } else {
            throw new Error(data.status || 'Unknown error');
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          toast.error(t('locationError', 'حدث خطأ أثناء تحديد موقعك. يرجى إدخال العنوان يدويًا.'));
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t('locationPermissionDenied', 'تم رفض إذن الوصول إلى الموقع');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t('locationUnavailable', 'معلومات الموقع غير متاحة');
            break;
          case error.TIMEOUT:
            errorMessage = t('locationTimeout', 'انتهت مهلة طلب الموقع');
            break;
          default:
            errorMessage = t('locationError', 'حدث خطأ أثناء تحديد موقعك');
        }
        
        toast.error(errorMessage);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle next step
  const handleNext = () => {
    if (activeStep === 0 && cartItems.length === 0) {
      toast.error(t('pleaseAddItems'));
      return;
    }
    
    if (activeStep === 1) {
      // Validate customer info
      if (!customerInfo.name || !customerInfo.phone) {
        toast.error(t('pleaseProvideInfo'));
        return;
      }
      
      // Validate payment method information
      if (customerInfo.paymentMethod === 'mobileMoney') {
        if (!customerInfo.mobilePaymentProvider) {
          toast.error(t('selectMobileProvider', 'يرجى اختيار مزود خدمة الدفع عبر الموبايل'));
          return;
        }
        
        if (!customerInfo.transactionImage) {
          toast.error(t('uploadTransactionReceipt', 'الرجاء تحميل إيصال المعاملة'));
          return;
        }
      }
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Submit order
  const submitOrder = async () => {
    try {
      setOrderSubmitting(true);
      
      // Validate payment method if mobile money is selected
      if (customerInfo.paymentMethod === 'mobileMoney') {
        if (!customerInfo.mobilePaymentProvider) {
          toast.error(t('selectMobileProvider', 'يرجى اختيار مزود خدمة الدفع عبر الموبايل'));
          setOrderSubmitting(false);
          return;
        }
        
        if (!customerInfo.transactionImage) {
          toast.error(t('uploadTransactionReceipt', 'الرجاء تحميل إيصال المعاملة'));
          setOrderSubmitting(false);
          return;
        }
      }
      
      // Create form data for file upload
      const formData = new FormData();
      
      // Prepare order data
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price
        })),
        customerInfo: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email,
          address: customerInfo.address,
          paymentMethod: customerInfo.paymentMethod,
          mobilePaymentProvider: customerInfo.mobilePaymentProvider
        },
        subtotal,
        tax,
        total,
        orderType: 'online'
      };
      
      // Add order data to form
      formData.append('orderData', JSON.stringify(orderData));
      
      // Add transaction image if available
      if (customerInfo.transactionImage) {
        formData.append('transactionImage', customerInfo.transactionImage);
      }
      
      // Submit order to API
      const response = await apiService.createOrderWithImage(formData);
      
      // Handle success
      setOrderNumber(response.orderNumber || response.id);
      setOrderComplete(true);
      setCartItems([]);
      toast.success(t('orderPlacedSuccessfully'));
      
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error(t('errorPlacingOrder'));
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Render product grid
  const renderProductGrid = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }
    
    if (filteredProducts.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography>{t('noProductsFound')}</Typography>
        </Box>
      );
    }
    
    return (
      <Grid container spacing={2}>
        {filteredProducts.map((product) => (
          <Grid item xs={6} sm={4} md={3} key={product.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: '0 16px 24px rgba(0, 0, 0, 0.15)'
                }
              }}
              onClick={() => addToCart(product)}
            >
              <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  height="160"
                  image={getProductImageUrl(product)}
                  alt={product.name}
                  sx={{ 
                    objectFit: 'cover',
                    transition: 'transform 0.5s',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                />
                {product.discount > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      bgcolor: 'error.main',
                      color: 'white',
                      borderRadius: '20px',
                      px: 1.5,
                      py: 0.5,
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    {t('discount')}
                  </Box>
                )}
              </Box>
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography 
                  gutterBottom 
                  variant="h6" 
                  component="div" 
                  noWrap
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '1rem',
                    lineHeight: 1.2
                  }}
                >
                  {product.name}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    height: '40px'
                  }}
                >
                  {product.description || ''}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#d4af37', 
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    }}
                  >
                    {currency.symbol}{parsePrice(product.price || product.selling_price).toFixed(2)}
                  </Typography>
                  <IconButton 
                    size="small" 
                    color="primary" 
                    sx={{ 
                      bgcolor: 'primary.light', 
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.main' }
                    }}
                  >
                    <Add />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render cart
  const renderCart = () => {
    if (cartItems.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <ShoppingCart sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography>{t('cartEmpty')}</Typography>
        </Box>
      );
    }
    
    return (
      <>
        <List>
          {cartItems.map((item) => (
            <ListItem key={item.id} divider>
              <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                <Box sx={{ width: 60, height: 60, mr: 2 }}>
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} 
                  />
                </Box>
                <ListItemText 
                  primary={item.name} 
                  secondary={`${currency.symbol}${parsePrice(item.price).toFixed(2)}`} 
                  sx={{ flex: 1 }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    size="small" 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                  <Typography sx={{ mx: 1, minWidth: '30px', textAlign: 'center' }}>
                    {item.quantity}
                  </Typography>
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
              </Box>
            </ListItem>
          ))}
        </List>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body1">{t('subtotal')}:</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" align="right">
                {currency.symbol}{subtotal.toFixed(2)}
              </Typography>
            </Grid>
            {tax > 0 && (
              <>
                <Grid item xs={6}>
                  <Typography variant="body1">{t('tax')} ({taxRatePercent}%):</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1" align="right">
                    {currency.symbol}{tax.toFixed(2)}
                  </Typography>
                </Grid>
              </>
            )}
            <Grid item xs={6}>
              <Typography variant="h6">{t('total')}:</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" align="right" color="primary">
                {currency.symbol}{total.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </>
    );
  };

  // Render customer info form
  const renderCustomerInfoForm = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('enterYourDetails')}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label={t('name')}
              name="name"
              value={customerInfo.name}
              onChange={handleCustomerInfoChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label={t('phone')}
              name="phone"
              value={customerInfo.phone}
              onChange={handleCustomerInfoChange}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('email')}
              name="email"
              value={customerInfo.email}
              onChange={handleCustomerInfoChange}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('address')}
              name="address"
              value={customerInfo.address}
              onChange={handleCustomerInfoChange}
              margin="normal"
              multiline
              rows={4}
              helperText={t('addressHelperText', 'أدخل عنوانك أو استخدم زر تحديد الموقع للحصول على عنوانك تلقائيًا')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={t('getLocationFromMap', 'الحصول على الموقع من الخريطة')}>
                      <span>
                        <IconButton
                          onClick={getUserLocation}
                          edge="end"
                          size="small"
                          disabled={locationLoading}
                          color="primary"
                          sx={{ 
                            bgcolor: 'rgba(25, 118, 210, 0.08)', 
                            '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.12)' },
                            mr: 1
                          }}
                        >
                          {locationLoading ? (
                            <CircularProgress size={20} />
                          ) : (
                            <LocationOn />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          {/* Payment Method Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              {t('paymentMethod', 'طريقة الدفع')}
            </Typography>
            <FormControl component="fieldset">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper 
                    elevation={customerInfo.paymentMethod === 'cashOnDelivery' ? 3 : 1}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: customerInfo.paymentMethod === 'cashOnDelivery' ? '2px solid #d4af37' : '1px solid #e0e0e0',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': { borderColor: '#d4af37' }
                    }}
                    onClick={() => handlePaymentMethodChange({ target: { value: 'cashOnDelivery' } })}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Radio
                        checked={customerInfo.paymentMethod === 'cashOnDelivery'}
                        onChange={handlePaymentMethodChange}
                        value="cashOnDelivery"
                        name="payment-method-radio"
                        sx={{ color: '#d4af37', '&.Mui-checked': { color: '#d4af37' } }}
                      />
                      <Box>
                        <Typography variant="subtitle1">{t('cashOnDelivery', 'الدفع عند التوصيل')}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('payWhenReceived', 'ادفع عند استلام طلبك')}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper 
                    elevation={customerInfo.paymentMethod === 'mobileMoney' ? 3 : 1}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: customerInfo.paymentMethod === 'mobileMoney' ? '2px solid #d4af37' : '1px solid #e0e0e0',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': { borderColor: '#d4af37' }
                    }}
                    onClick={() => handlePaymentMethodChange({ target: { value: 'mobileMoney' } })}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Radio
                        checked={customerInfo.paymentMethod === 'mobileMoney'}
                        onChange={handlePaymentMethodChange}
                        value="mobileMoney"
                        name="payment-method-radio"
                        sx={{ color: '#d4af37', '&.Mui-checked': { color: '#d4af37' } }}
                      />
                      <Box>
                        <Typography variant="subtitle1">{t('mobileMoney', 'الدفع عبر الموبايل')}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('payViaMobile', 'ادفع باستخدام خدمة الدفع عبر الموبايل')}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </FormControl>
          </Grid>
          
          {/* Mobile Money Provider Selection - Only shown when Mobile Money is selected */}
          {customerInfo.paymentMethod === 'mobileMoney' && (
            <Grid item xs={12}>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(212, 175, 55, 0.05)', borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {t('selectProvider', 'اختر مزود خدمة الدفع')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper 
                      elevation={customerInfo.mobilePaymentProvider === 'mtn' ? 3 : 1}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: customerInfo.mobilePaymentProvider === 'mtn' ? '2px solid #FFCC00' : '1px solid #e0e0e0',
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': { borderColor: '#FFCC00' },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100px',
                        backgroundColor: customerInfo.mobilePaymentProvider === 'mtn' ? 'rgba(255, 204, 0, 0.1)' : 'white'
                      }}
                      onClick={() => handleMobileProviderChange({ target: { value: 'mtn' } })}
                    >
                      <Typography variant="h6" align="center" sx={{ color: customerInfo.mobilePaymentProvider === 'mtn' ? '#FFCC00' : 'inherit' }}>MTN</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper 
                      elevation={customerInfo.mobilePaymentProvider === 'airtel' ? 3 : 1}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: customerInfo.mobilePaymentProvider === 'airtel' ? '2px solid #FF0000' : '1px solid #e0e0e0',
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': { borderColor: '#FF0000' },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100px',
                        backgroundColor: customerInfo.mobilePaymentProvider === 'airtel' ? 'rgba(255, 0, 0, 0.1)' : 'white'
                      }}
                      onClick={() => handleMobileProviderChange({ target: { value: 'airtel' } })}
                    >
                      <Typography variant="h6" align="center" sx={{ color: customerInfo.mobilePaymentProvider === 'airtel' ? '#FF0000' : 'inherit' }}>Airtel</Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                {customerInfo.mobilePaymentProvider && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {t('paymentInstructions', 'تعليمات الدفع')}
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                      <Typography variant="body2">
                        {t('sendMoneyTo', 'أرسل المبلغ إلى')}: <strong>{customerInfo.mobilePaymentProvider === 'mtn' ? (storeSettings?.payment?.mtnPhoneNumber || t('settings:mtnPhoneNumber', 'رقم هاتف MTN')) : (storeSettings?.payment?.airtelPhoneNumber || t('settings:airtelPhoneNumber', 'رقم هاتف Airtel'))}</strong>
                      </Typography>
                      <Typography variant="body2">
                        {t('amount', 'المبلغ')}: <strong>{currency.symbol}{total.toFixed(2)}</strong>
                      </Typography>
                      
                      {/* Open Payment App Button */}
                      <Box sx={{ mt: 2, mb: 2 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<Payment />}
                          onClick={() => openPaymentApp(customerInfo.mobilePaymentProvider)}
                          sx={{ 
                            bgcolor: '#d4af37', 
                            '&:hover': { bgcolor: '#c19b26' },
                            color: '#000',
                            fontWeight: 'bold'
                          }}
                        >
                          {t('openPaymentApp', 'فتح تطبيق الدفع')}
                          {total > 0 && ` (${currency.symbol}${Math.round(total)})`}
                        </Button>
                        <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                          {t('paymentAppInfo', 'سيتم فتح تطبيق الدفع تلقائيًا مع المبلغ المطلوب')}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {t('uploadReceipt', 'بعد إتمام عملية الدفع، يرجى تحميل صورة إيصال الدفع')}
                      </Typography>
                      
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<Receipt />}
                          sx={{ 
                            borderColor: '#d4af37', 
                            color: '#d4af37',
                            '&:hover': { borderColor: '#c19b26', backgroundColor: 'rgba(212, 175, 55, 0.08)' }
                          }}
                        >
                          {t('uploadReceiptImage', 'تحميل صورة الإيصال')}
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleTransactionImageUpload}
                          />
                        </Button>
                        {customerInfo.transactionImage && (
                          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                            <Chip 
                              label={customerInfo.transactionImage.name} 
                              onDelete={() => setCustomerInfo(prev => ({ ...prev, transactionImage: null }))}
                              color="primary"
                              sx={{ bgcolor: 'rgba(212, 175, 55, 0.2)', color: '#000' }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Box>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  // Render order confirmation
  const renderOrderConfirmation = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('orderSummary')}
        </Typography>
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t('customerInfo')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                {t('name')}:
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <Typography variant="body2">
                {customerInfo.name}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                {t('phone')}:
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <Typography variant="body2">
                {customerInfo.phone}
              </Typography>
            </Grid>
            {customerInfo.email && (
              <>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    {t('email')}:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">
                    {customerInfo.email}
                  </Typography>
                </Grid>
              </>
            )}
            {customerInfo.address && (
              <>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    {t('address')}:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">
                    {customerInfo.address}
                  </Typography>
                </Grid>
              </>
            )}
            
            {/* Payment Method Information */}
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                {t('paymentMethod', 'طريقة الدفع')}:
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <Typography variant="body2">
                {customerInfo.paymentMethod === 'cashOnDelivery' 
                  ? t('cashOnDelivery', 'الدفع عند التوصيل')
                  : t('mobileMoney', 'الدفع عبر الموبايل')}
              </Typography>
            </Grid>
            
            {/* Mobile Payment Provider - Only shown for mobile money */}
            {customerInfo.paymentMethod === 'mobileMoney' && (
              <>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    {t('provider', 'مزود الخدمة')}:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">
                    {customerInfo.mobilePaymentProvider.toUpperCase()}
                  </Typography>
                </Grid>
                
                {/* Transaction Receipt - Only shown if uploaded */}
                {customerInfo.transactionImage && (
                  <>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        {t('transactionReceipt', 'إيصال المعاملة')}:
                      </Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body2">
                        {customerInfo.transactionImage.name}
                      </Typography>
                    </Grid>
                  </>
                )}
              </>
            )}
          </Grid>
        </Paper>
        
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t('orderItems')}
          </Typography>
          <List>
            {cartItems.map((item) => (
              <ListItem key={item.id} divider>
                <ListItemText 
                  primary={item.name} 
                  secondary={`${item.quantity} x ${currency.symbol}${parsePrice(item.price).toFixed(2)}`} 
                />
                <Typography variant="body2">
                  {currency.symbol}{(item.quantity * parsePrice(item.price)).toFixed(2)}
                </Typography>
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body1">{t('subtotal')}:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1" align="right">
                  {currency.symbol}{subtotal.toFixed(2)}
                </Typography>
              </Grid>
              {tax > 0 && (
                <>
                  <Grid item xs={6}>
                    <Typography variant="body1">{t('tax')} ({taxRatePercent}%):</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1" align="right">
                      {currency.symbol}{tax.toFixed(2)}
                    </Typography>
                  </Grid>
                </>
              )}
              <Grid item xs={6}>
                <Typography variant="h6">{t('total')}:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" align="right" color="primary">
                  {currency.symbol}{total.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    );
  };

  // Render order complete
  const renderOrderComplete = () => {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom color="primary" sx={{ textAlign: 'center', width: '100%' }}>
          {t('thankYou')}
        </Typography>
        <Typography variant="h6" gutterBottom>
          {t('orderPlaced')}
        </Typography>
        {orderNumber && (
          <Typography variant="body1" gutterBottom>
            {t('orderNumber')}: <strong>{orderNumber}</strong>
          </Typography>
        )}
        <Typography variant="body1" sx={{ mt: 2 }}>
          {t('orderConfirmation')}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 3 }}
          onClick={() => {
            setActiveStep(0);
            setOrderComplete(false);
            setOrderNumber(null);
          }}
        >
          {t('placeNewOrder')}
        </Button>
      </Box>
    );
  };

  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Paper 
                sx={{ 
                  p: 3, 
                  mb: 2, 
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                }}
              >
                <Box sx={{ display: 'flex', mb: 3, gap: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                  <TextField
                    fullWidth
                    placeholder={t('searchProducts')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#d4af37' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        '&:hover fieldset': {
                          borderColor: '#d4af37',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#d4af37',
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-outlined.Mui-focused': {
                        color: '#d4af37',
                      },
                    }}
                  />
                  <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                    <InputLabel id="category-select-label">{t('category')}</InputLabel>
                    <Select
                      labelId="category-select-label"
                      value={selectedCategory}
                      label={t('category')}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      sx={{ 
                        borderRadius: '12px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#d4af37',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#d4af37',
                          borderWidth: 2,
                        },
                        '& .MuiSelect-select': {
                          padding: '12px 14px',
                        },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            borderRadius: 2,
                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                            mt: 0.5,
                            '& .MuiMenuItem-root': {
                              padding: '10px 16px',
                              '&:hover': {
                                backgroundColor: 'rgba(212, 175, 55, 0.08)',
                              },
                              '&.Mui-selected': {
                                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                                '&:hover': {
                                  backgroundColor: 'rgba(212, 175, 55, 0.2)',
                                },
                              },
                            },
                          },
                        },
                      }}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {t(`sales.categories.${category.name}`, { defaultValue: category.name })}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                {renderProductGrid()}
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden'
                }}
              >
                <Box 
                  sx={{ 
                    p: 2, 
                    background: 'linear-gradient(45deg, #d4af37 30%, #f5cc7f 90%)',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography 
                    variant="h6"
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontWeight: 'bold'
                    }}
                  >
                    <ShoppingCart sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {t('yourOrder', 'Your Order')}
                  </Typography>
                  <Badge 
                    badgeContent={cartItems.length} 
                    color="error"
                    sx={{ '& .MuiBadge-badge': { fontWeight: 'bold' } }}
                  >
                    <ShoppingCart />
                  </Badge>
                </Box>
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
                  {renderCart()}
                </Box>
                <Box sx={{ p: 2 }}>
                  <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleNext}
                  disabled={cartItems.length === 0}
                  sx={{ 
                    borderRadius: '12px', 
                    py: 1.5,
                    background: 'linear-gradient(45deg, #d4af37 30%, #f5cc7f 90%)',
                    color: '#000',
                    fontWeight: 'bold',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #c19b26 30%, #e5bc6f 90%)',
                      boxShadow: '0 6px 15px rgba(212, 175, 55, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {t('continue', 'Continue')}
                </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Paper>
                {renderCustomerInfoForm()}
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)' }}>
                <Box sx={{ p: 2, background: 'linear-gradient(45deg, #d4af37 30%, #f5cc7f 90%)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                    <ShoppingCart sx={{ mr: 1, verticalAlign: 'middle', color: '#000' }} />
                    {t('yourOrder', 'Your Order')}
                  </Typography>
                  <Badge badgeContent={cartItems.length} color="error" sx={{ '& .MuiBadge-badge': { bgcolor: '#fff', color: '#000', fontWeight: 'bold' } }}>
                    <ShoppingCart sx={{ color: '#000' }} />
                  </Badge>
                </Box>
                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                  {renderCart()}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Paper>
                {renderOrderConfirmation()}
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  <Typography variant="h6">
                  <ShoppingCart sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {t('yourOrder')}
                </Typography>
                </Box>
                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                  {renderCart()}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        );
      default:
        return 'Unknown step';
    }
  };

  // Main render
  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#f9f9f9',
      backgroundImage: 'linear-gradient(to bottom, #f5f5f5, #ffffff)',
      pt: 2,
      pb: 4
    }}>
      <AppBar 
        position="static" 
        elevation={3} 
        sx={{ 
          mb: 3, 
          background: 'linear-gradient(45deg, #d4af37 30%, #f5cc7f 90%)',
          borderRadius: '0 0 16px 16px'
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="h5" 
              component="div"
              sx={{ 
                fontWeight: 'bold',
                color: '#000',
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                letterSpacing: '0.5px'
              }}
            >
              Cafe Sundus
            </Typography>
          </Box>
          <LanguageSwitcher />
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg">
        {orderComplete ? (
          renderOrderComplete()
        ) : (
          <>
            <Paper 
              elevation={3}
              sx={{ 
                mb: 3, 
                p: 3, 
                borderRadius: 4,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)'
              }}
            >
              <Stepper 
                activeStep={activeStep} 
                alternativeLabel
                sx={{
                  '& .MuiStepLabel-root .Mui-completed': {
                    color: '#d4af37', // golden color for completed steps
                  },
                  '& .MuiStepLabel-root .Mui-active': {
                    color: '#d4af37', // golden color for active step
                  },
                  '& .MuiStepLabel-label.Mui-active.MuiStepLabel-alternativeLabel': {
                    color: 'rgba(0, 0, 0, 0.87)', // darker text for active step
                    fontWeight: 'bold',
                  },
                }}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>
            
            {getStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                {t('back', 'Back')}
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={submitOrder}
                  disabled={orderSubmitting}
                >
                  {orderSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    t('placeOrder', 'Place Order')
                  )}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                >
                  {t('continue')}
                </Button>
              )}
            </Box>
          </>
        )}
      </Container>

      {/* Payment Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        aria-labelledby="confirm-payment-dialog-title"
      >
        <DialogTitle id="confirm-payment-dialog-title">
          {t('confirmPayment', 'تأكيد الدفع')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('confirmPaymentMessage', 'هل أنت متأكد من الدفع باستخدام {{provider}}?', {
              provider: selectedProvider === 'mtn' ? 'MTN' : 'Airtel'
            })}
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            {t('confirmPaymentDescription', 'سيتم فتح تطبيق الدفع وستحتاج إلى إدخال {{pinDigits}} أرقام PIN لإتمام المعاملة.', {
              pinDigits: storeSettings?.payment?.mobilePinDigits || 4
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="primary">
            {t('no', 'لا')}
          </Button>
          <Button 
            onClick={() => {
              setConfirmDialogOpen(false);
              openPaymentApp(selectedProvider);
            }} 
            color="primary" 
            autoFocus
          >
            {t('yes', 'نعم')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OnlineOrder;