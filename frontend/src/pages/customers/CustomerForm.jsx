import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrency } from '../../redux/slices/settingsSlice';
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
  Card,
  CardMedia,
  IconButton,
  FormHelperText,
  Switch,
  FormControlLabel,
  Breadcrumbs,
  Link,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Save,
  Cancel,
  PhotoCamera,
  Delete,
  ArrowBack,
  Home,
  Email,
  Phone,
  LocationOn,
  Person,
} from '@mui/icons-material';
import apiService from '../../api/apiService';

// Demo data for customer groups
const demoCustomerGroups = [
  { id: 1, name: 'Regular' },
  { id: 2, name: 'VIP' },
  { id: 3, name: 'Wholesale' },
  { id: 4, name: 'Corporate' },
];

// Demo data for customers
const demoCustomers = [
  { 
    id: 1, 
    name: 'John Doe', 
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com', 
    phone: '+1 234 567 890', 
    mobile: '+1 234 567 891',
    address: '123 Main St, New York, NY 10001', 
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'USA',
    group: 'Regular', 
    status: 'active',
    taxId: 'TAX123456',
    notes: 'Prefers delivery in the evening',
    creditLimit: 1000,
    loyaltyPoints: 250,
    totalPurchases: 1250.50,
    memberSince: '2022-01-15',
    isActive: true,
    image: 'https://via.placeholder.com/300',
  },
  { 
    id: 2, 
    name: 'Jane Smith', 
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com', 
    phone: '+1 234 567 892', 
    mobile: '+1 234 567 893',
    address: '456 Park Ave, Boston, MA 02115', 
    city: 'Boston',
    state: 'MA',
    postalCode: '02115',
    country: 'USA',
    group: 'VIP', 
    status: 'active',
    taxId: 'TAX789012',
    notes: 'Allergic to nuts',
    creditLimit: 2000,
    loyaltyPoints: 500,
    totalPurchases: 3500.75,
    memberSince: '2021-05-20',
    isActive: true,
    image: 'https://via.placeholder.com/300',
  },
];

const CustomerForm = () => {
  const { t } = useTranslation(['customers', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const currency = useSelector(selectCurrency);
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // Set document title
  useEffect(() => {
    document.title = isEditMode
      ? t('pageTitle.editCustomer')
      : t('pageTitle.addCustomer');
  }, [isEditMode, t]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    notes: '',
    isActive: true,
    image: '/placeholder-image.png',
    source: 'registered', // إضافة حقل مصدر العميل (مسجل أو أونلاين)
  });

  // Validation state
  const [errors, setErrors] = useState({});
  
  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load customer data if in edit mode or from location state
  useEffect(() => {
    if (isEditMode) {
      // Load from API instead of demo data
      const loadCustomer = async () => {
        try {
          const customer = await apiService.getCustomerById(id);
          setFormData({
            name: customer.name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || '',
            city: customer.city || '',
            state: customer.state || '',
            postalCode: customer.postalCode || '',
            country: customer.country || '',
            notes: customer.notes || '',
            isActive: customer.isActive !== false,
            image: customer.image || '/placeholder-image.png',
            source: customer.source || 'registered', // تحميل مصدر العميل
          });
        } catch (err) {
          setNotification({ open: true, message: t('customerNotFound'), severity: 'error' });
          navigate('/customers');
        }
      };
      loadCustomer();
    } else {
      // استقبال بيانات العميل من صفحة الطلبات الأونلاين إذا كانت متوفرة
      if (location.state && location.state.customerData) {
        const customerData = location.state.customerData;
        setFormData({
          name: customerData.name || '',
          email: customerData.email || '',
          phone: customerData.phone || '',
          address: customerData.address || '',
          city: customerData.city || '',
          state: customerData.state || '',
          postalCode: customerData.postalCode || '',
          country: customerData.country || '',
          notes: '',
          isActive: true,
          image: '/placeholder-image.png',
          source: customerData.source || 'online', // تعيين مصدر العميل كأونلاين
        });
      }
    }
  }, [id, isEditMode, navigate, t]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you would upload the file to a server
      // For demo purposes, we'll use a local URL
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, image: imageUrl }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('validation:required');
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = t('validation:invalidEmail');
    if (formData.phone && !/^[+]?\d[\d\s\-()]*$/.test(formData.phone)) newErrors.phone = t('validation:invalidPhone');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const payload = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        postalCode: formData.postalCode || undefined,
        country: formData.country || undefined,
        notes: formData.notes || undefined,
        isActive: !!formData.isActive,
        source: formData.source || 'registered', // إضافة مصدر العميل للبيانات المرسلة
      };

      if (isEditMode) {
        await apiService.updateCustomer(id, payload);
      } else {
        await apiService.createCustomer(payload);
      }

      setNotification({ open: true, message: t('common:saveSuccess'), severity: 'success' });
      setTimeout(() => navigate('/customers'), 800);
    } catch (error) {
      setNotification({ open: true, message: error.userMessage || t('common:saveFailed'), severity: 'error' });
    }
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
          href="/customers"
          onClick={(e) => {
            e.preventDefault();
            navigate('/customers');
          }}
        >
          {t('customers:customers')}
        </Link>
        <Typography color="text.primary">
          {isEditMode ? t('customers:editCustomer') : t('customers:addCustomer')}
        </Typography>
      </Breadcrumbs>
      
      {/* Page title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ textAlign: 'center', width: '100%' }}>
          {isEditMode ? t('customers:editCustomer') : t('customers:addCustomer')}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/customers')}
        >
          {t('back')}
        </Button>
      </Box>
      
      {/* Customer form */}
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Left column - Basic info */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              {t('customers:personalInfo')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('customers:name')}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('customers:email')}
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('customers:phone')}
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={Boolean(errors.phone)}
                  helperText={errors.phone}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              {t('customers:addressInfo')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('customers:address')}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('customers:city')}
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('customers:state')}
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('customers:postalCode')}
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('customers:country')}
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              {t('customers:additionalInfo')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="source-label">{t('customers:source', 'مصدر العميل')}</InputLabel>
                  <Select
                    labelId="source-label"
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    label={t('customers:source', 'مصدر العميل')}
                  >
                    <MenuItem key="registered" value="registered">{t('customers:registered', 'مسجل')}</MenuItem>
                  <MenuItem key="online" value="online">{t('customers:online', 'أونلاين')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('customers:notes')}
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Grid>
          
          {/* Right column - Image and status */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              {t('customers:customerImage')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Card sx={{ width: '100%', mb: 2 }}>
                <CardMedia
                  component="img"
                  height="250"
                  image={formData.image}
                  alt={formData.name || t('customers:customerImage')}
                />
              </Card>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<PhotoCamera />}
                >
                  {t('upload')}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
                
                <IconButton 
                  color="error" 
                  onClick={() => setFormData(prev => ({ ...prev, image: '/placeholder-image.png' }))}
                  disabled={formData.image === '/placeholder-image.png'}
                >
                  <Delete />
                </IconButton>
              </Box>
            </Box>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              {t('customers:status')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleChange}
                  name="isActive"
                  color="primary"
                />
              }
              label={formData.isActive ? t('active') : t('inactive')}
            />
          </Grid>
          
          {/* Form actions */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={() => navigate('/customers')}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<Save />}
              >
                {isEditMode ? t('update') : t('save')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
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

export default CustomerForm;