import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Alert,
  Snackbar,
  TablePagination,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ShoppingBag as ShoppingBagIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Image as ImageIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiService from '../../api/apiService';
import { selectCurrency } from '../../redux/slices/settingsSlice';
// Import notification sound
import notificationSound from '../../assets/sounds/notification.mp3';

const OnlineOrderNotifications = () => {
  const { t } = useTranslation(['online', 'common']);
  const navigate = useNavigate();
  const currency = useSelector(selectCurrency);
  
  // State for orders
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true); // New state for auto-refresh toggle
  
  // Ref for notification sound
  const audioRef = useRef(new Audio(notificationSound));
  const intervalRef = useRef(null);
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    orderId: null,
    action: null
  });
  
  // State for image preview
  const [imagePreview, setImagePreview] = useState({
    open: false,
    url: ''
  });
  
  // Fetch order notifications
  const fetchOrderNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOnlineOrderNotifications({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        isRead: 'false'
      });
      
      if (response && Array.isArray(response)) {
        // Process notifications to extract order data
        const orderPromises = response.map(async (notification) => {
          try {
            // Get the order details using the relatedId
            const orderDetails = await apiService.getOrderById(notification.relatedId);
            return {
              ...orderDetails,
              notificationId: notification.id,
              notificationCreatedAt: notification.createdAt
            };
          } catch (error) {
            console.error(`Error fetching order details for notification ${notification.id}:`, error);
            return null;
          }
        });
        
        const orderResults = await Promise.all(orderPromises);
        const validOrders = orderResults.filter(order => order !== null);
        setOrders(validOrders);
      } else {
        setOrders([]);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error fetching order notifications:', error);
      setError(error.message || 'Failed to load order notifications');
      toast.error(t('common:errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch and polling
  useEffect(() => {
    if (!autoRefresh) return; // Only poll if auto-refresh is enabled
    
    let intervalId;
    let retryCount = 0;
    const maxRetries = 3;
    const baseInterval = 300000; // 5 minutes base interval (reduced server load)
    
    const pollNotifications = async () => {
      try {
        await fetchNotifications();
        retryCount = 0; // Reset retry count on success
      } catch (error) {
        console.error('Error polling notifications:', error);
        
        // Handle 429 error specifically
        if (error.response?.status === 429) {
          retryCount++;
          if (retryCount < maxRetries) {
            // Exponential backoff: wait longer after each failure
            const backoffDelay = baseInterval * Math.pow(2, retryCount);
            console.log(`Rate limited. Retrying in ${backoffDelay / 1000} seconds...`);
            
            // Clear current interval and set new one with backoff
            if (intervalId) clearInterval(intervalId);
            setTimeout(() => {
              intervalId = setInterval(pollNotifications, backoffDelay);
            }, backoffDelay);
            return;
          } else {
            console.warn('Max retries reached for notification polling. Stopping polling.');
            if (intervalId) clearInterval(intervalId);
            return;
          }
        }
      }
    };
    
    // Initial fetch
    pollNotifications();
    
    // Set up polling interval with reduced frequency (5 minutes)
    intervalId = setInterval(pollNotifications, baseInterval);
    intervalRef.current = intervalId;
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);
  
  // Play notification sound when new orders arrive
  useEffect(() => {
    if (orders.length > previousOrderCount && soundEnabled && previousOrderCount > 0) {
      audioRef.current.play().catch(error => {
        console.error('Error playing notification sound:', error);
      });
      toast.info('تم استلام طلب جديد!');
    }
    setPreviousOrderCount(orders.length);
  }, [orders.length, soundEnabled]);

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchNotifications();
  };

  // Toggle auto-refresh
  const handleAutoRefreshToggle = (event) => {
    setAutoRefresh(event.target.checked);
    if (!event.target.checked && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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
  
  // Handle order actions
  const handleAcceptOrder = async (order) => {
    try {
      // Extract customer data from order
      const customerData = {
        customerName: order.customerName || order.customer?.name,
        customerPhone: order.customerPhone || order.customer?.phone,
        customerEmail: order.customerEmail || order.customer?.email
      };
      
      // Accept order with customer data
      await apiService.acceptOnlineOrder(order.id, customerData);
      
      // Mark notification as read
      if (order.notificationId) {
        await apiService.markNotificationAsRead(order.notificationId);
      }
      
      toast.success(t('online:orderAccepted'));
      // Notify other pages to refresh sales data
      window.dispatchEvent(new CustomEvent('sales:updated', { detail: { orderId: order.id, status: 'accepted' } }));
      // Refresh notifications
      fetchOrderNotifications();
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error(t('online:errorAcceptingOrder'));
    }
  };
  
  const handleRejectOrder = async (order) => {
    try {
      // Update order status
      await apiService.updateOrderStatus(order.id, 'rejected');
      
      // Mark notification as read
      if (order.notificationId) {
        await apiService.markNotificationAsRead(order.notificationId);
      }
      
      toast.info(t('online:orderRejected'));
      // Notify other pages to refresh sales data (in case lists are showing the order)
      window.dispatchEvent(new CustomEvent('sales:updated', { detail: { orderId: order.id, status: 'rejected' } }));
      // Refresh notifications
      fetchOrderNotifications();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error(t('online:errorRejectingOrder'));
    }
  };
  
  // Open confirmation dialog
  const openConfirmDialog = (order, action) => {
    const title = action === 'accept' 
      ? t('online:confirmAcceptTitle', 'تأكيد قبول الطلب')
      : t('online:confirmRejectTitle', 'تأكيد رفض الطلب');
    
    const message = action === 'accept'
      ? t('online:confirmAcceptMessage', 'هل أنت متأكد من قبول هذا الطلب؟')
      : t('online:confirmRejectMessage', 'هل أنت متأكد من رفض هذا الطلب؟');
    
    setConfirmDialog({
      open: true,
      title,
      message,
      order,
      action
    });
  };
  
  // Close confirmation dialog
  const closeConfirmDialog = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };
  
  // Handle confirmation dialog action
  const handleConfirmAction = async () => {
    const { order, action } = confirmDialog;
    
    if (action === 'accept') {
      await handleAcceptOrder(order);
    } else if (action === 'reject') {
      await handleRejectOrder(order);
    }
    
    closeConfirmDialog();
  };
  
  // Open image preview
  const openImagePreview = (imageUrl) => {
    setImagePreview({
      open: true,
      url: imageUrl
    });
  };
  
  // Close image preview
  const closeImagePreview = () => {
    setImagePreview({
      ...imagePreview,
      open: false
    });
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Calculate total amount
  const calculateTotal = (order) => {
    if (!order || !order.saleItems || !Array.isArray(order.saleItems)) {
      return 0;
    }
    
    return order.saleItems.reduce((total, item) => {
      return total + (parseFloat(item.totalPrice) || 0);
    }, 0);
  };
  
  // Render payment method
  const renderPaymentMethod = (order) => {
    // Check both possible property names for payment method
    const paymentMethod = order?.paymentMethod || order?.payment_method;
    
    if (!order || !paymentMethod) return '';
    
    switch (paymentMethod) {
      case 'cash':
        return t('online:cashPayment', 'الدفع نقداً');
      case 'card':
        return t('online:cardPayment', 'الدفع بالبطاقة');
      case 'online':
        return t('online:onlinePayment', 'الدفع أونلاين');
      case 'mobileMoney':
        return t('online:mobileMoneyPayment', 'الدفع عبر المحفظة الإلكترونية');
      default:
        return paymentMethod;
    }
  };
  
  // Render payment provider
  const renderPaymentProvider = (order) => {
    // Check both possible property names for payment provider
    const paymentProvider = order?.mobilePaymentProvider || order?.mobile_payment_provider;
    
    if (!order || !paymentProvider) return null;
    
    return (
      <Chip 
        label={paymentProvider.toUpperCase()} 
        size="small" 
        color="primary" 
        variant="outlined"
        sx={{ ml: 1 }}
      />
    );
  };
  
  // Render order items
  const renderOrderItems = (order) => {
    if (!order || !order.saleItems || !Array.isArray(order.saleItems)) {
      return null;
    }
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('online:orderItems')}:
        </Typography>
        {order.saleItems.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              {item.quantity} x {item.product?.name || t('online:unknownProduct', 'منتج غير معروف')}
            </Typography>
            <Typography variant="body2">
              {parseFloat(item.totalPrice).toFixed(2)} {currency}
            </Typography>
          </Box>
        ))}
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2">
            {t('online:total')}:
          </Typography>
          <Typography variant="subtitle2" fontWeight="bold">
            {calculateTotal(order).toFixed(2)} {currency}
          </Typography>
        </Box>
      </Box>
    );
  };
  
  // Render order cards
  const renderOrderCards = () => {
    const paginatedOrders = orders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    
    return (
      <Grid container spacing={3}>
        {paginatedOrders.map((order) => (
          <Grid item xs={12} md={6} lg={4} key={order.id || order.notificationId}>
            <Card sx={{ 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              },
              position: 'relative',
              overflow: 'visible'
            }}>
              {order.notificationId && !order.read && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: 'error.main',
                    border: '2px solid white',
                    zIndex: 1
                  }}
                />
              )}
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <ShoppingBagIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="div">
                      {t('online:orderNumber')}: {order.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(order.createdAt)}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('online:customerInfo')}:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {(order.customer?.name || order.customerInfo?.name) || t('online:unknownCustomer', 'عميل غير معروف')}
                    </Typography>
                  </Box>
                  
                  {(order.customer?.phone || order.customerInfo?.phone) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {order.customer?.phone || order.customerInfo?.phone}
                      </Typography>
                    </Box>
                  )}
                  
                  {(order.customer?.email || order.customerInfo?.email) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {order.customer?.email || order.customerInfo?.email}
                      </Typography>
                    </Box>
                  )}
                  
                  {(order.customer?.address || order.customerInfo?.address) && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <LocationOnIcon fontSize="small" sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {order.customer?.address || order.customerInfo?.address}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PaymentIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {renderPaymentMethod(order)}
                      {renderPaymentProvider(order)}
                    </Typography>
                  </Box>
                  
                  {order.transactionImageUrl && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ReceiptIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Button 
                        size="small" 
                        startIcon={<ImageIcon />}
                        onClick={() => openImagePreview(order.transactionImageUrl)}
                      >
                        {t('online:viewReceipt', 'عرض الإيصال')}
                      </Button>
                    </Box>
                  )}
                </Box>
                
                {renderOrderItems(order)}
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CheckIcon />}
                  onClick={() => openConfirmDialog(order, 'accept')}
                  sx={{ mr: 1 }}
                >
                  {t('online:accept')}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CloseIcon />}
                  onClick={() => openConfirmDialog(order, 'reject')}
                >
                  {t('online:reject')}
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title={t('online:viewOrderDetails', 'عرض تفاصيل الطلب')}>
                  <IconButton 
                    color="primary" 
                    onClick={() => navigate(`/sales/${order.id}`)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('online:addCustomerInfo', 'إضافة معلومات العميل')}>
                  <IconButton 
                    color="secondary" 
                    onClick={() => {
                      // استخراج معلومات العميل من الطلب
                      const customerInfo = order.customer || order.customerInfo;
                      // التحقق من وجود معلومات العميل وأن لديها على الأقل الاسم ورقم الهاتف
                      if (customerInfo && (customerInfo.name || customerInfo.phone)) {
                        // الانتقال إلى صفحة إضافة عميل مع تمرير معلومات العميل
                        navigate('/customers/add', { 
                          state: { 
                            customerData: {
                              name: customerInfo.name,
                              email: customerInfo.email,
                              phone: customerInfo.phone,
                              address: customerInfo.address,
                              city: customerInfo.city,
                              state: customerInfo.state,
                              postalCode: customerInfo.postalCode,
                              country: customerInfo.country,
                              source: 'online' // تعيين مصدر العميل كأونلاين
                            } 
                          } 
                        });
                      } else {
                        toast.error(t('online:noCustomerInfo', 'لا توجد معلومات عميل متاحة'));
                      }
                    }}
                  >
                    <PersonIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // Toggle sound function
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    localStorage.setItem('notificationSoundEnabled', !soundEnabled);
  };

  // Load sound preference from localStorage
  useEffect(() => {
    const savedSoundPreference = localStorage.getItem('notificationSoundEnabled');
    if (savedSoundPreference !== null) {
      setSoundEnabled(savedSoundPreference === 'true');
    }
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('online:onlineOrderNotifications', 'إشعارات الطلبات الأونلاين')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Auto-refresh toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={handleAutoRefreshToggle}
                size="small"
              />
            }
            label="تحديث تلقائي"
          />
          
          {/* Manual refresh button */}
          <Button
            onClick={handleManualRefresh}
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
          >
            تحديث الإشعارات
          </Button>
          
          <Tooltip title={soundEnabled ? t('online:disableNotificationSound', 'تعطيل صوت الإشعارات') : t('online:enableNotificationSound', 'تفعيل صوت الإشعارات')}>
            <IconButton onClick={toggleSound} color={soundEnabled ? 'primary' : 'default'}>
              {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">
            {t('online:noNewOrdersFound')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('online:allOrdersProcessed')}
          </Typography>
        </Paper>
      ) : (
        <>
          {renderOrderCards()}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <TablePagination
              component="div"
              count={orders.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={t('common:rowsPerPage')}
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} ${t('common:of')} ${count}`
              }
            />
          </Box>
        </>
      )}
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog} color="primary">
            {t('common:cancel')}
          </Button>
          <Button onClick={handleConfirmAction} color="primary" autoFocus>
            {t('common:confirm')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Image Preview Dialog */}
      <Dialog
        open={imagePreview.open}
        onClose={closeImagePreview}
        maxWidth="md"
      >
        <DialogTitle>{t('online:transactionReceipt', 'إيصال المعاملة')}</DialogTitle>
        <DialogContent>
          {imagePreview.url && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <img 
                src={imagePreview.url} 
                alt={t('online:transactionReceipt', 'إيصال المعاملة')} 
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeImagePreview} color="primary">
            {t('common:close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OnlineOrderNotifications;