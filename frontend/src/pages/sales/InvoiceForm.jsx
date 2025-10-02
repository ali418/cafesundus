import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrency } from '../../redux/slices/settingsSlice';
import { selectUser } from '../../redux/slices/authSlice';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import apiService from '../../api/apiService';

const InvoiceForm = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = Boolean(id);
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [error, setError] = useState('');
  const currency = useSelector(selectCurrency);
  const currentUser = useSelector(selectUser);
  
  // Get query parameters
  const queryParams = new URLSearchParams(location.search);
  const saleId = queryParams.get('saleId');

  // Load customers and products data
  const loadData = async () => {
    try {
      const [customersData, productsData] = await Promise.all([
        apiService.getCustomers(),
        apiService.getProducts()
      ]);
      setCustomers(customersData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.userMessage || 'Failed to load data');
    }
  };

  // Convert sale data to invoice format
  const convertSaleToInvoice = (sale) => {
    if (!sale) return null;
    
    // Map sale items with product details
    const mappedItems = (sale.items || []).map(item => ({
      id: item.id,
      product: item.Product || {
        id: item.productId,
        name: 'Unknown Product',
        price: item.unitPrice || 0,
        unit: 'piece'
      },
      quantity: item.quantity || 0,
      price: parseFloat(item.unitPrice || 0),
      total: parseFloat(item.totalPrice || item.subtotal || 0),
    }));

    // Find customer in the loaded customers list or use sale customer data
    const customerData = sale.customer || {};
    const foundCustomer = customers.find(c => c.id === sale.customerId) || {
      id: sale.customerId,
      name: customerData.name || 'Unknown Customer',
      email: customerData.email || '',
      phone: customerData.phone || ''
    };

    return {
      id: sale.id,
      customer: foundCustomer,
      date: sale.saleDate ? new Date(sale.saleDate) : new Date(),
      dueDate: sale.saleDate 
        ? new Date(new Date(sale.saleDate).getTime() + 30 * 24 * 60 * 60 * 1000) 
        : new Date(new Date().setDate(new Date().getDate() + 30)),
      items: mappedItems,
      subtotal: parseFloat(sale.subtotal || 0),
      tax: parseFloat(sale.taxAmount || 0),
      discount: parseFloat(sale.discountAmount || 0),
      total: parseFloat(sale.totalAmount || 0),
      notes: sale.notes || '',
      status: sale.paymentStatus === 'paid' ? 'paid' : sale.paymentStatus === 'pending' ? 'pending' : 'overdue',
      paymentMethod: sale.paymentMethod || 'cash',
    };
  };

  useEffect(() => {
    const initializeForm = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Load customers and products first
        await loadData();
        
        let invoiceData = null;
        
        if (isEditing && id) {
          // Editing existing invoice - fetch sale by URL id
          const sale = await apiService.getSaleById(id);
          invoiceData = convertSaleToInvoice(sale);
        } else if (saleId) {
          // Creating invoice from sale - fetch sale by query param
          const sale = await apiService.getSaleById(saleId);
          invoiceData = convertSaleToInvoice(sale);
        } else {
          // Creating new invoice
          invoiceData = {
            customer: null,
            date: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            items: [],
            subtotal: 0,
            tax: 0,
            discount: 0,
            total: 0,
            notes: '',
            status: 'pending',
            paymentMethod: 'cash',
          };
        }
        
        setInvoice(invoiceData);
      } catch (error) {
        console.error('Error initializing form:', error);
        setError(error.userMessage || 'Failed to load invoice data');
      } finally {
        setLoading(false);
      }
    };

    initializeForm();
  }, [isEditing, id, saleId]);

  const validationSchema = Yup.object({
    customer: Yup.object().nullable().required(t('validation:required')),
    date: Yup.date().required(t('validation:required')),
    dueDate: Yup.date().required(t('validation:required')),
    status: Yup.string().required(t('validation:required')),
    paymentMethod: Yup.string().required(t('validation:required')),
  });

  const formik = useFormik({
    initialValues: invoice || {
      customer: null,
      date: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      notes: '',
      status: 'pending',
      paymentMethod: 'cash',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        // Prepare sale data
        const saleData = {
          customerId: values.customer?.id,
          items: values.items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.price,
            discount: 0,
          })),
          subtotal: values.subtotal,
          taxAmount: values.tax,
          discountAmount: values.discount,
          totalAmount: values.total,
          paymentMethod: values.paymentMethod,
          paymentStatus: values.status,
          notes: values.notes,
          // إضافة معلومات المستخدم الحالي (الكاشير)
          userId: currentUser?.id,
          cashier: currentUser?.name,
        };

        if (isEditing && id) {
          // Update existing sale
          await apiService.updateSale(id, {
            paymentStatus: values.status,
            paymentMethod: values.paymentMethod,
            notes: values.notes,
          });
        } else {
          // Create new sale
          await apiService.createSale(saleData);
        }
        
        navigate('/invoices');
      } catch (error) {
        console.error('Error saving invoice:', error);
        setError(error.userMessage || 'Failed to save invoice');
      }
    },
  });

  const calculateTotals = () => {
    const subtotal = formik.values.items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - formik.values.discount + formik.values.tax;
    
    formik.setFieldValue('subtotal', subtotal);
    formik.setFieldValue('total', total);
  };

  useEffect(() => {
    if (formik.values.items) {
      calculateTotals();
    }
  }, [formik.values.items, formik.values.discount, formik.values.tax]);

  const handleAddProduct = () => {
    if (!selectedProduct || productQuantity <= 0) return;
    
    const existingItemIndex = formik.values.items.findIndex(
      (item) => item.product.id === selectedProduct.id
    );
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...formik.values.items];
      const item = updatedItems[existingItemIndex];
      item.quantity += productQuantity;
      item.total = item.quantity * item.price;
      formik.setFieldValue('items', updatedItems);
    } else {
      // Add new item
      const newItem = {
        id: Date.now(), // Temporary ID
        product: selectedProduct,
        quantity: productQuantity,
        price: selectedProduct.price,
        total: selectedProduct.price * productQuantity,
      };
      formik.setFieldValue('items', [...formik.values.items, newItem]);
    }
    
    // Reset form
    setSelectedProduct(null);
    setProductQuantity(1);
    setProductDialogOpen(false);
  };

  const handleRemoveItem = (itemId) => {
    const updatedItems = formik.values.items.filter((item) => item.id !== itemId);
    formik.setFieldValue('items', updatedItems);
  };

  const handleProductDialogOpen = () => {
    setProductDialogOpen(true);
  };

  const handleProductDialogClose = () => {
    setProductDialogOpen(false);
    setSelectedProduct(null);
    setProductQuantity(1);
  };

  useEffect(() => {
    document.title = isEditing
      ? t('pageTitle.editInvoice')
      : t('pageTitle.newInvoice');
  }, [i18n.language, isEditing, t]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>{t('loading')}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        <Button onClick={() => navigate('/invoices')} variant="contained">
          {t('goBack')}
        </Button>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate('/invoices')} sx={{ marginInlineEnd: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ textAlign: 'center', width: '100%' }}>
              {isEditing ? t('sales:editInvoice') : t('sales:newInvoice')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={formik.handleSubmit}
            disabled={!formik.isValid || formik.values.items.length === 0}
          >
            {t('save')}
          </Button>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  {t('sales:invoiceInfo')}
                </Typography>
                
                <Autocomplete
                  id="customer"
                  options={customers}
                  getOptionLabel={(option) => option.name}
                  value={formik.values.customer}
                  onChange={(event, newValue) => {
                    formik.setFieldValue('customer', newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('customers:customer')}
                      margin="normal"
                      error={formik.touched.customer && Boolean(formik.errors.customer)}
                      helperText={formik.touched.customer && formik.errors.customer}
                      required
                    />
                  )}
                  fullWidth
                />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      id="date"
                      name="date"
                      label={t('date')}
                      type="date"
                      value={formik.values.date ? new Date(formik.values.date).toISOString().split('T')[0] : ''}
                      onChange={formik.handleChange}
                      error={formik.touched.date && Boolean(formik.errors.date)}
                      helperText={formik.touched.date && formik.errors.date}
                      InputLabelProps={{ shrink: true }}
                      margin="normal"
                      required
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      id="dueDate"
                      name="dueDate"
                      label={t('sales:dueDate')}
                      type="date"
                      value={formik.values.dueDate ? new Date(formik.values.dueDate).toISOString().split('T')[0] : ''}
                      onChange={formik.handleChange}
                      error={formik.touched.dueDate && Boolean(formik.errors.dueDate)}
                      helperText={formik.touched.dueDate && formik.errors.dueDate}
                      InputLabelProps={{ shrink: true }}
                      margin="normal"
                      required
                    />
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth margin="normal" required>
                      <InputLabel id="status-label">{t('status')}</InputLabel>
                      <Select
                        labelId="status-label"
                        id="status"
                        name="status"
                        value={formik.values.status}
                        onChange={formik.handleChange}
                        error={formik.touched.status && Boolean(formik.errors.status)}
                      >
                        <MenuItem value="pending">{t('sales:invoiceStatus.pending')}</MenuItem>
                        <MenuItem value="paid">{t('sales:invoiceStatus.paid')}</MenuItem>
                        <MenuItem value="overdue">{t('sales:invoiceStatus.overdue')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth margin="normal" required>
                      <InputLabel id="payment-method-label">{t('sales:paymentMethod')}</InputLabel>
                      <Select
                        labelId="payment-method-label"
                        id="paymentMethod"
                        name="paymentMethod"
                        value={formik.values.paymentMethod}
                        onChange={formik.handleChange}
                        error={formik.touched.paymentMethod && Boolean(formik.errors.paymentMethod)}
                      >
                        <MenuItem value="cash">{t('sales:paymentMethods.cash')}</MenuItem>
                        <MenuItem value="credit_card">{t('sales:paymentMethods.card')}</MenuItem>
                        <MenuItem value="bank_transfer">{t('sales:paymentMethods.bank_transfer')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  {t('sales:invoiceDetails')}
                </Typography>
                
                <TextField
                  fullWidth
                  id="notes"
                  name="notes"
                  label={t('notes')}
                  multiline
                  rows={4}
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  margin="normal"
                />
                
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      id="subtotal"
                      name="subtotal"
                      label={t('subtotal')}
                      type="number"
                      value={formik.values.subtotal.toFixed(2)}
                      InputProps={{
                        readOnly: true,
                        startAdornment: <InputAdornment position="start">{currency.symbol}</InputAdornment>,
                      }}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      id="tax"
                      name="tax"
                      label={t('tax')}
                      type="number"
                      value={formik.values.tax}
                      onChange={formik.handleChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">{currency.symbol}</InputAdornment>,
                      }}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      id="discount"
                      name="discount"
                      label={t('discount')}
                      type="number"
                      value={formik.values.discount}
                      onChange={formik.handleChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">{currency.symbol}</InputAdornment>,
                      }}
                      margin="normal"
                    />
                  </Grid>
                </Grid>
                
                <TextField
                  fullWidth
                  id="total"
                  name="total"
                  label={t('total')}
                  type="number"
                  value={formik.values.total.toFixed(2)}
                  InputProps={{
                    readOnly: true,
                    startAdornment: <InputAdornment position="start">{currency.symbol}</InputAdornment>,
                  }}
                  margin="normal"
                  sx={{ mt: 2 }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                {t('sales:items')}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleProductDialogOpen}
                disabled={isEditing} // Disable adding items when editing
              >
                {t('sales:addItem')}
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('products:product')}</TableCell>
                    <TableCell align="right">{t('quantity')}</TableCell>
                    <TableCell>{t('unit')}</TableCell>
                    <TableCell align="right">{t('price')}</TableCell>
                    <TableCell align="right">{t('total')}</TableCell>
                    {!isEditing && <TableCell align="center">{t('actions')}</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formik.values.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product?.name || 'Unknown Product'}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell>{item.product?.unit || 'piece'}</TableCell>
                      <TableCell align="right">{currency.symbol}{item.price.toFixed(2)}</TableCell>
                      <TableCell align="right">{currency.symbol}{item.total.toFixed(2)}</TableCell>
                      {!isEditing && (
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {formik.values.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isEditing ? 5 : 6} align="center">
                        {t('sales:noItemsAdded')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </form>
        </Paper>

        {/* Add Product Dialog */}
        <Dialog open={productDialogOpen} onClose={handleProductDialogClose}>
          <DialogTitle>{t('sales:addItem')}</DialogTitle>
          <DialogContent>
            <Autocomplete
              id="product-select"
              options={products}
              getOptionLabel={(option) => option.name}
              value={selectedProduct}
              onChange={(event, newValue) => {
                setSelectedProduct(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('products:product')}
                  margin="normal"
                  required
                />
              )}
              fullWidth
            />
            
            <TextField
              fullWidth
              id="quantity"
              label={t('quantity')}
              type="number"
              value={productQuantity}
              onChange={(e) => setProductQuantity(Number(e.target.value))}
              margin="normal"
              InputProps={{ inputProps: { min: 1 } }}
              required
            />
            
            {selectedProduct && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>{t('price')}:</strong> {currency.symbol}{selectedProduct.price.toFixed(2)} / {selectedProduct.unit || 'piece'}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('total')}:</strong> {currency.symbol}{(selectedProduct.price * productQuantity).toFixed(2)}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleProductDialogClose}>{t('cancel')}</Button>
            <Button
              onClick={handleAddProduct}
              color="primary"
              disabled={!selectedProduct || productQuantity <= 0}
            >
              {t('add')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
    );
};

export default InvoiceForm;