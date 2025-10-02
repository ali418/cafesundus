import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, updateSettings, selectStoreSettings, selectCurrency } from '../redux/slices/settingsSlice';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  Store,
  Email,
  Phone as PhoneIcon,
  LocationOn,
  AttachMoney,
  CloudUpload,
  CloudDownload,
  Delete as DeleteIcon,
  Inventory,
  Receipt,
  People,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const Settings = () => {
  const { t, i18n } = useTranslation(['common', 'settings']);
  const dispatch = useDispatch();
  const storeSettings = useSelector(selectStoreSettings);
  const currency = useSelector(selectCurrency);
  const [loading, setLoading] = useState(true);
  
  // Demo data
  const currencies = [
    {code:'UGX',name:'Ugandan Shilling',symbol:'UGX'},
    // {code:'SDG',name:'Sudanese Pound',symbol:'SDG'},
    // { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
    // { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    // { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  ];
  
  const backupFrequencies = [
    { value: 'daily', label: t('settings:daily') },
    { value: 'weekly', label: t('settings:weekly') },
    { value: 'monthly', label: t('settings:monthly') },
  ];
  
  const paymentMethods = [
    { value: 'cash', label: t('settings:cash') },
    { value: 'credit', label: t('settings:creditCard') },
    { value: 'debit', label: t('settings:debitCard') },
    { value: 'mobile', label: t('settings:mobilePayment') },
  ];
  
  const shippingMethods = [
    { value: 'standard', label: t('settings:standardShipping') },
    { value: 'express', label: t('settings:expressShipping') },
    { value: 'pickup', label: t('settings:storePickup') },
  ];
  
  // State
  const [settings, setSettings] = useState({
    store: {
      name: storeSettings?.name || 'My Grocery Store',
      email: storeSettings?.email || '',
      phone: storeSettings?.phone || '',
      address: storeSettings?.address || '',
      city: storeSettings?.city || '',
      state: storeSettings?.state || '',
      postalCode: storeSettings?.postalCode || '',
      country: storeSettings?.country || '',
      website: storeSettings?.website || '',
      taxRate: storeSettings?.taxRate ?? 0,
      currency: storeSettings?.currencyCode || 'UGX',
      logo: storeSettings?.logoUrl || null,
      language: i18n.language,
    },
    invoice: {
      prefix: storeSettings?.invoicePrefix ?? 'INV',
      suffix: storeSettings?.invoiceSuffix ?? '',
      nextNumber: storeSettings?.invoiceNextNumber ?? 1001,
      showLogo: storeSettings?.invoiceShowLogo ?? true,
      showTaxNumber: storeSettings?.invoiceShowTaxNumber ?? true,
      showSignature: storeSettings?.invoiceShowSignature ?? true,
      footerText: storeSettings?.invoiceFooterText ?? 'Thank you for your business!',
      termsAndConditions: storeSettings?.invoiceTerms ?? 'All sales are final. Returns accepted within 30 days with receipt.',
    },
    receipt: {
      showLogo: storeSettings?.receiptShowLogo ?? true,
      showTaxDetails: storeSettings?.receiptShowTaxDetails ?? true,
      printAutomatically: storeSettings?.receiptPrintAutomatically ?? false,
      footerText: storeSettings?.receiptFooterText ?? 'Thank you for shopping with us!',
      // NEW: toggle to show QR for online order on receipts
      showOnlineOrderQR: storeSettings?.receiptShowOnlineOrderQR ?? false,
    },
    payment: {
      acceptCash: storeSettings?.acceptCash ?? true,
      acceptCreditCards: storeSettings?.acceptCreditCards ?? true,
      acceptDebitCards: storeSettings?.acceptDebitCards ?? true,
      acceptMobilePayments: storeSettings?.acceptMobilePayments ?? true,
      defaultPaymentMethod: storeSettings?.defaultPaymentMethod || 'cash',
      mtnPhoneNumber: storeSettings?.mtnPhoneNumber || '',
      airtelPhoneNumber: storeSettings?.airtelPhoneNumber || '',
      mobilePinDigits: storeSettings?.mobilePinDigits || 4,
    },
    shipping: {
      enableShipping: false,
      defaultShippingMethod: 'standard',
      freeShippingThreshold: 50,
    },
    notifications: {
      lowStock: true,
      newOrders: true,
      customerReturns: false,
      systemUpdates: true,
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      lastBackup: '2023-06-15 08:30:00',
    },
  });
  
  const [tabValue, setTabValue] = useState(0);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  // Effect to update local settings when storeSettings change
  useEffect(() => {
    if (storeSettings) {
      setSettings(prev => ({
        ...prev,
        store: {
          name: storeSettings.name || 'My Grocery Store',
          email: storeSettings.email || '',
          phone: storeSettings.phone || '',
          address: storeSettings.address || '',
          city: storeSettings.city || '',
          state: storeSettings.state || '',
          postalCode: storeSettings.postalCode || '',
          country: storeSettings.country || '',
          website: storeSettings.website || '',
          taxRate: storeSettings.taxRate ?? 0,
          currency: storeSettings.currencyCode || 'UGX',
          logo: storeSettings.logoUrl || null,
          language: i18n.language,
        },
        invoice: {
          prefix: storeSettings.invoicePrefix ?? 'INV',
          suffix: storeSettings.invoiceSuffix ?? '',
          nextNumber: storeSettings.invoiceNextNumber ?? 1001,
          showLogo: storeSettings.invoiceShowLogo ?? true,
          showTaxNumber: storeSettings.invoiceShowTaxNumber ?? true,
          showSignature: storeSettings.invoiceShowSignature ?? true,
          footerText: storeSettings.invoiceFooterText ?? 'Thank you for your business!',
          termsAndConditions: storeSettings.invoiceTerms ?? 'All sales are final. Returns accepted within 30 days with receipt.',
        },
        receipt: {
          showLogo: storeSettings.receiptShowLogo ?? true,
          showTaxDetails: storeSettings.receiptShowTaxDetails ?? true,
          printAutomatically: storeSettings.receiptPrintAutomatically ?? false,
          footerText: storeSettings.receiptFooterText ?? 'Thank you for shopping with us!',
          showOnlineOrderQR: storeSettings.receiptShowOnlineOrderQR ?? false,
        },
        payment: {
          acceptCash: storeSettings.acceptCash ?? true,
          acceptCreditCards: storeSettings.acceptCreditCards ?? true,
          acceptDebitCards: storeSettings.acceptDebitCards ?? true,
          acceptMobilePayments: storeSettings.acceptMobilePayments ?? true,
          defaultPaymentMethod: storeSettings.defaultPaymentMethod || 'cash',
          mtnPhoneNumber: storeSettings.mtnPhoneNumber || '',
          airtelPhoneNumber: storeSettings.airtelPhoneNumber || '',
          mobilePinDigits: storeSettings.mobilePinDigits || 4,
        }
      }));
      setLoading(false);
    }
  }, [storeSettings, i18n.language]);
  
  // Handlers
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleStoreChange = (event) => {
    const { name, value } = event.target;
    setSettings(prev => ({
      ...prev,
      store: {
        ...prev.store,
        [name]: value,
      },
    }));
  };
  
  const handleInvoiceChange = (event) => {
    const { name, value, checked } = event.target;
    const newValue = event.target.type === 'checkbox' ? checked : value;
    
    setSettings(prev => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        [name]: newValue,
      },
    }));
  };
  
  const handleReceiptChange = (event) => {
    const { name, value, checked } = event.target;
    const newValue = event.target.type === 'checkbox' ? checked : value;
    
    setSettings(prev => ({
      ...prev,
      receipt: {
        ...prev.receipt,
        [name]: newValue,
      },
    }));
  };
  
  const handleNotificationChange = (event) => {
    const { name, checked } = event.target;
    
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: checked,
      },
    }));
  };
  
  const handleBackupChange = (event) => {
    const { name, value, checked } = event.target;
    const newValue = event.target.type === 'checkbox' ? checked : value;
    
    setSettings(prev => ({
      ...prev,
      backup: {
        ...prev.backup,
        [name]: newValue,
      },
    }));
  };
  
  const handlePaymentChange = (event) => {
    const { name, value, checked } = event.target;
    const newValue = event.target.type === 'checkbox' ? checked : value;
    
    setSettings(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        [name]: newValue,
      },
    }));
  };
  
  const handleShippingChange = (event) => {
    const { name, value, checked } = event.target;
    const newValue = event.target.type === 'checkbox' ? checked : value;
    
    setSettings(prev => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        [name]: newValue,
      },
    }));
  };
  
  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSettings(prev => ({
          ...prev,
          store: {
            ...prev.store,
            logo: e.target.result,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSaveSettings = async () => {
    try {
      const payload = {
        store_name: settings.store.name,
        email: settings.store.email,
        phone: settings.store.phone,
        address: settings.store.address,
        city: settings.store.city,
        state: settings.store.state,
        postal_code: settings.store.postalCode,
        country: settings.store.country,
        website: settings.store.website,
        tax_rate: settings.store.taxRate,
        currency_code: settings.store.currency,
        // Use the symbol from the selected currency
        currency_symbol: currencies.find(c => c.code === settings.store.currency)?.symbol || 'USh',
        logo_url: settings.store.logo,
        language: settings.store.language,
        // Invoice settings
        invoice_prefix: settings.invoice.prefix,
        invoice_suffix: settings.invoice.suffix,
        invoice_next_number: Number(settings.invoice.nextNumber) || 1,
        invoice_show_logo: Boolean(settings.invoice.showLogo),
        invoice_show_tax_number: Boolean(settings.invoice.showTaxNumber),
        invoice_show_signature: Boolean(settings.invoice.showSignature),
        invoice_footer_text: settings.invoice.footerText || '',
        invoice_terms_and_conditions: settings.invoice.termsAndConditions || '',
        // Receipt settings
        receipt_show_logo: Boolean(settings.receipt.showLogo),
        receipt_show_tax_details: Boolean(settings.receipt.showTaxDetails),
        receipt_print_automatically: Boolean(settings.receipt.printAutomatically),
        receipt_footer_text: settings.receipt.footerText || '',
        // NEW
        receipt_show_online_order_qr: Boolean(settings.receipt.showOnlineOrderQR),
        // Payment settings
        accept_cash: Boolean(settings.payment.acceptCash),
        accept_credit_cards: Boolean(settings.payment.acceptCreditCards),
        accept_debit_cards: Boolean(settings.payment.acceptDebitCards),
        accept_mobile_payments: Boolean(settings.payment.acceptMobilePayments),
        default_payment_method: settings.payment.defaultPaymentMethod || 'cash',
        mtn_phone_number: settings.payment.mtnPhoneNumber || '',
        airtel_phone_number: settings.payment.airtelPhoneNumber || '',
        mobile_pin_digits: settings.payment.mobilePinDigits || 4,
      };
      await dispatch(updateSettings(payload)).unwrap();
      setNotification({ open: true, message: t('settings:settingsSaved'), severity: 'success' });
    } catch (e) {
      console.error('Failed to save settings', e);
      setNotification({ open: true, message: t('settings:saveFailed', { defaultValue: 'Failed to save settings' }), severity: 'error' });
    }
  };
  
  const handleNotificationClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    
    setNotification({
      ...notification,
      open: false,
    });
  };
  
  const handleLanguageChange = () => {
    // Always use Arabic language
    const language = 'ar';
    i18n.changeLanguage(language);
    setSettings(prev => ({
      ...prev,
      store: {
        ...prev.store,
        language,
      },
    }));
  };
  
  // Sync local settings when Redux storeSettings changes (after fetchSettings)
  useEffect(() => {
    if (!storeSettings) return;
    setSettings(prev => ({
      ...prev,
      store: {
        ...prev.store,
        name: storeSettings.name || '',
        email: storeSettings.email || '',
        phone: storeSettings.phone || '',
        address: storeSettings.address || '',
        city: storeSettings.city || '',
        state: storeSettings.state || '',
        postalCode: storeSettings.postalCode || '',
        country: storeSettings.country || '',
        website: storeSettings.website || '',
        taxRate: storeSettings.taxRate ?? 0,
        currency: storeSettings.currencyCode || 'UGX',
        logo: storeSettings.logoUrl || null,
        language: i18n.language,
      },
      invoice: {
        ...prev.invoice,
        prefix: storeSettings.invoicePrefix ?? 'INV',
        suffix: storeSettings.invoiceSuffix ?? '',
        nextNumber: storeSettings.invoiceNextNumber ?? 1001,
        showLogo: storeSettings.invoiceShowLogo ?? true,
        showTaxNumber: storeSettings.invoiceShowTaxNumber ?? true,
        showSignature: storeSettings.invoiceShowSignature ?? true,
        footerText: storeSettings.invoiceFooterText ?? '',
        termsAndConditions: storeSettings.invoiceTerms ?? '',
      },
      receipt: {
        ...prev.receipt,
        showLogo: storeSettings.receiptShowLogo ?? true,
        showTaxDetails: storeSettings.receiptShowTaxDetails ?? true,
        printAutomatically: storeSettings.receiptPrintAutomatically ?? false,
        footerText: storeSettings.receiptFooterText ?? '',
        showOnlineOrderQR: storeSettings.receiptShowOnlineOrderQR ?? false,
      },
      payment: {
        ...prev.payment,
        acceptCash: storeSettings.acceptCash ?? prev.payment.acceptCash,
        acceptCreditCards: storeSettings.acceptCreditCards ?? prev.payment.acceptCreditCards,
        acceptDebitCards: storeSettings.acceptDebitCards ?? prev.payment.acceptDebitCards,
        acceptMobilePayments: storeSettings.acceptMobilePayments ?? prev.payment.acceptMobilePayments,
        defaultPaymentMethod: storeSettings.defaultPaymentMethod || prev.payment.defaultPaymentMethod,
        mtnPhoneNumber: storeSettings.mtnPhoneNumber || '',
        airtelPhoneNumber: storeSettings.airtelPhoneNumber || '',
        mobilePinDigits: storeSettings.mobilePinDigits || 4,
      }
    }));
  }, [storeSettings, i18n.language]);
  
  useEffect(() => {
    document.title = t('pageTitle.settings');
  }, [i18n.language, t]);
  
  return (
    <Box sx={{ p: 3, maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" component="h1" sx={{ minWidth: 0, flexShrink: 1, textAlign: 'center', width: '100%' }}>
          {t('settings')}
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          sx={{ flexShrink: 0 }}
        >
          {t('save')}
        </Button>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant='scrollable'
          scrollButtons='auto'
          allowScrollButtonsMobile
          aria-label="settings tabs"
          sx={{
            '& .MuiTabs-flexContainer': {
              flexWrap: 'nowrap'
            }
          }}
        >
          <Tab label={t('settings:storeInformation')} />
          {/* <Tab label={t('settings:invoiceSettings')} /> */}
          <Tab label={t('settings:receiptSettings')} />
          <Tab label={t('settings:paymentMethods')} />
          <Tab label={t('settings:shipping')} />
          <Tab label={t('settings:notifications')} />
          <Tab label={t('settings:backupRestore')} />
        </Tabs>
      </Paper>
      
      {/* Store Information Tab */}
      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: { xs: 120, sm: 150 },
                    height: { xs: 120, sm: 150 },
                    border: '1px dashed grey',
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: 2,
                    backgroundImage: settings.store.logo ? `url(${settings.store.logo})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {!settings.store.logo && (
                    <Typography variant="body2" color="textSecondary" align="center" sx={{ px: 1 }}>
                      {t('settings:storeLogo')}
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                  >
                    {t('upload')}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </Button>
                  
                  {settings.store.logo && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          store: {
                            ...prev.store,
                            logo: null,
                          },
                        }));
                      }}
                      startIcon={<DeleteIcon />}
                    >
                      {t('delete')}
                    </Button>
                  )}
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <IconButton
                  color="primary"
                  sx={{ mx: 1 }}
                  disabled
                >
                  🇸🇦
                </IconButton>
              </Box>
              
              <FormControl fullWidth>
                <InputLabel id="currency-select-label">{t('settings:currency')}</InputLabel>
                <Select
                  labelId="currency-select-label"
                  name="currency"
                  value={settings.store.currency}
                  label={t('settings:currency')}
                  onChange={handleStoreChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <AttachMoney />
                    </InputAdornment>
                  }
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency.code} value={currency.code}>
                      {`${currency.name}  (${currency.symbol})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} lg={8}>
              <Typography variant="h6" gutterBottom>
                {t('settings:storeDetails')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('settings:storeName')}
                    name="name"
                    value={settings.store.name}
                    onChange={handleStoreChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Store />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('email')}
                    name="email"
                    value={settings.store.email}
                    onChange={handleStoreChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('phone')}
                    name="phone"
                    value={settings.store.phone}
                    onChange={handleStoreChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon />
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
                    value={settings.store.address}
                    onChange={handleStoreChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('city')}
                    name="city"
                    value={settings.store.city}
                    onChange={handleStoreChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('state')}
                    name="state"
                    value={settings.store.state}
                    onChange={handleStoreChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('postalCode')}
                    name="postalCode"
                    value={settings.store.postalCode}
                    onChange={handleStoreChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('country')}
                    name="country"
                    value={settings.store.country}
                    onChange={handleStoreChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('settings:website')}
                    name="website"
                    value={settings.store.website}
                    onChange={handleStoreChange}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('settings:taxRate')}
                    name="taxRate"
                    value={settings.store.taxRate}
                    onChange={handleStoreChange}
                    type="number"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Invoice Settings Tab */}
      {tabValue === -1 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              {t('settings:invoiceSettings')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label={t('settings:invoicePrefix')}
                  name="prefix"
                  value={settings.invoice.prefix}
                  onChange={handleInvoiceChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label={t('settings:invoiceSuffix')}
                  name="suffix"
                  value={settings.invoice.suffix}
                  onChange={handleInvoiceChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label={t('settings:nextInvoiceNumber')}
                  name="nextNumber"
                  value={settings.invoice.nextNumber}
                  onChange={handleInvoiceChange}
                  type="number"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.invoice.showLogo}
                      onChange={handleInvoiceChange}
                      name="showLogo"
                      color="primary"
                    />
                  }
                  label={t('settings:showLogo')}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.invoice.showTaxNumber}
                      onChange={handleInvoiceChange}
                      name="showTaxNumber"
                      color="primary"
                    />
                  }
                  label={t('settings:showTaxNumber')}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.invoice.showSignature}
                      onChange={handleInvoiceChange}
                      name="showSignature"
                      color="primary"
                    />
                  }
                  label={t('settings:showSignature')}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('settings:footerText')}
                  name="footerText"
                  value={settings.invoice.footerText}
                  onChange={handleInvoiceChange}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('settings:termsAndConditions')}
                  name="termsAndConditions"
                  value={settings.invoice.termsAndConditions}
                  onChange={handleInvoiceChange}
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}
      
      {/* Receipt Settings Tab */}
      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              {t('settings:receiptSettings')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.receipt.showLogo}
                      onChange={handleReceiptChange}
                      name="showLogo"
                      color="primary"
                    />
                  }
                  label={t('settings:showLogo')}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.receipt.showTaxDetails}
                      onChange={handleReceiptChange}
                      name="showTaxDetails"
                      color="primary"
                    />
                  }
                  label={t('settings:showTaxDetails')}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.receipt.printAutomatically}
                      onChange={handleReceiptChange}
                      name="printAutomatically"
                      color="primary"
                    />
                  }
                  label={t('settings:printAutomatically')}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.receipt.showOnlineOrderQR}
                      onChange={handleReceiptChange}
                      name="showOnlineOrderQR"
                      color="primary"
                    />
                  }
                  label={t('settings:showOnlineOrderQR')}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('settings:footerText')}
                  name="footerText"
                  value={settings.receipt.footerText}
                  onChange={handleReceiptChange}
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}
      
      {/* Payment Methods Tab */}
      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              {t('settings:paymentMethods')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.payment.acceptCash}
                      onChange={handlePaymentChange}
                      name="acceptCash"
                      color="primary"
                    />
                  }
                  label={t('settings:acceptCash')}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.payment.acceptCreditCards}
                      onChange={handlePaymentChange}
                      name="acceptCreditCards"
                      color="primary"
                    />
                  }
                  label={t('settings:acceptCreditCards')}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.payment.acceptDebitCards}
                      onChange={handlePaymentChange}
                      name="acceptDebitCards"
                      color="primary"
                    />
                  }
                  label={t('settings:acceptDebitCards')}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.payment.acceptMobilePayments}
                      onChange={handlePaymentChange}
                      name="acceptMobilePayments"
                      color="primary"
                    />
                  }
                  label={t('settings:acceptMobilePayments')}
                />
              </Grid>
              
              {settings.payment.acceptMobilePayments && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('settings:mtnPhoneNumber')}
                      name="mtnPhoneNumber"
                      value={settings.payment.mtnPhoneNumber}
                      onChange={handlePaymentChange}
                      placeholder="+256 XX XXX XXXX"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon sx={{ color: '#FFCC00' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('settings:airtelPhoneNumber')}
                      name="airtelPhoneNumber"
                      value={settings.payment.airtelPhoneNumber}
                      onChange={handlePaymentChange}
                      disabled={!settings.payment.acceptMobilePayments}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('settings:mobilePinDigits')}
                      name="mobilePinDigits"
                      type="number"
                      InputProps={{ inputProps: { min: 1, max: 10 } }}
                      value={settings.payment.mobilePinDigits}
                      onChange={handlePaymentChange}
                      disabled={!settings.payment.acceptMobilePayments}
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="default-payment-method-label">{t('settings:defaultPaymentMethod')}</InputLabel>
                  <Select
                    labelId="default-payment-method-label"
                    name="defaultPaymentMethod"
                    value={settings.payment.defaultPaymentMethod}
                    label={t('settings:defaultPaymentMethod')}
                    onChange={handlePaymentChange}
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method.value} value={method.value}>
                        {method.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}
      
      {/* Shipping Tab */}
      {tabValue === 3 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              {t('settings:shipping')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.shipping.enableShipping}
                      onChange={handleShippingChange}
                      name="enableShipping"
                      color="primary"
                    />
                  }
                  label={t('settings:enableShipping')}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!settings.shipping.enableShipping}>
                  <InputLabel id="default-shipping-method-label">{t('settings:defaultShippingMethod')}</InputLabel>
                  <Select
                    labelId="default-shipping-method-label"
                    name="defaultShippingMethod"
                    value={settings.shipping.defaultShippingMethod}
                    label={t('settings:defaultShippingMethod')}
                    onChange={handleShippingChange}
                  >
                    {shippingMethods.map((method) => (
                      <MenuItem key={method.value} value={method.value}>
                        {method.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('settings:freeShippingThreshold')}
                  name="freeShippingThreshold"
                  value={settings.shipping.freeShippingThreshold}
                  onChange={handleShippingChange}
                  type="number"
                  disabled={!settings.shipping.enableShipping}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{currency.symbol}</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}
      
      {/* Notifications Tab */}
      {tabValue === 4 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              {t('settings:notifications')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <Inventory />
                </ListItemIcon>
                <ListItemText primary={t('settings:lowStockNotifications')} />
                <Switch
                  edge="end"
                  checked={settings.notifications.lowStock}
                  onChange={handleNotificationChange}
                  name="lowStock"
                  color="primary"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Receipt />
                </ListItemIcon>
                <ListItemText primary={t('settings:newOrderNotifications')} />
                <Switch
                  edge="end"
                  checked={settings.notifications.newOrders}
                  onChange={handleNotificationChange}
                  name="newOrders"
                  color="primary"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <People />
                </ListItemIcon>
                <ListItemText primary={t('settings:customerReturnNotifications')} />
                <Switch
                  edge="end"
                  checked={settings.notifications.customerReturns}
                  onChange={handleNotificationChange}
                  name="customerReturns"
                  color="primary"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary={t('settings:systemUpdateNotifications')} />
                <Switch
                  edge="end"
                  checked={settings.notifications.systemUpdates}
                  onChange={handleNotificationChange}
                  name="systemUpdates"
                  color="primary"
                />
              </ListItem>
            </List>
          </Box>
        </Paper>
      )}
      
      {/* Backup & Restore Tab */}
      {tabValue === 5 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              {t('settings:backupRestore')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.backup.autoBackup}
                      onChange={handleBackupChange}
                      name="autoBackup"
                      color="primary"
                    />
                  }
                  label={t('settings:autoBackup')}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!settings.backup.autoBackup}>
                  <InputLabel id="backup-frequency-label">{t('settings:backupFrequency')}</InputLabel>
                  <Select
                    labelId="backup-frequency-label"
                    name="backupFrequency"
                    value={settings.backup.backupFrequency}
                    label={t('settings:backupFrequency')}
                    onChange={handleBackupChange}
                  >
                    {backupFrequencies.map((frequency) => (
                      <MenuItem key={frequency.value} value={frequency.value}>
                        {frequency.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('settings:lastBackup')}
                  value={settings.backup.lastBackup}
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<CloudUpload />}
                  onClick={() => {
                    setNotification({
                      open: true,
                      message: t('settings:backupCreated'),
                      severity: 'success',
                    });
                    
                    // Update last backup time
                    const now = new Date();
                    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                    
                    setSettings(prev => ({
                      ...prev,
                      backup: {
                        ...prev.backup,
                        lastBackup: formattedDate,
                      },
                    }));
                  }}
                >
                  {t('settings:createBackup')}
                </Button>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  startIcon={<CloudUpload />}
                  component="label"
                >
                  {t('settings:restoreBackup')}
                  <input
                    type="file"
                    hidden
                    accept=".json"
                    onChange={() => {
                      setNotification({
                        open: true,
                        message: t('settings:backupRestored'),
                        severity: 'success',
                      });
                    }}
                  />
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}
      
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

export default Settings;
