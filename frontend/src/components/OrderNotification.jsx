import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { 
  Badge, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Box, 
  Divider, 
  Chip,
  Button,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  ShoppingBag as ShoppingBagIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiService from '../api/apiService';
import { toast } from 'react-toastify';

const OrderNotification = () => {
  const { t } = useTranslation(['online']);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true); // New state for auto-refresh toggle
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  
  // Handle menu open/close
  const handleMenuOpen = async (event) => {
    setAnchorEl(event.currentTarget);
    // Mark all as read when opening menu
    if (notifications.length > 0) {
      try {
        // Mark all notifications as read on server
        await apiService.markAllNotificationsAsRead();
        
        const updatedNotifications = notifications.map(notification => ({
          ...notification,
          read: true
        }));
        setNotifications(updatedNotifications);
        setUnreadCount(0);
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    }
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Fetch notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      // Get admin notifications for online orders
      const response = await apiService.getAdminNotifications({ type: 'order_status_admin', limit: 10 });
      if (response && Array.isArray(response)) {
        // Get unread count
        const unreadCountResponse = await apiService.getUnreadOnlineOrderCount();
        setUnreadCount(unreadCountResponse?.count || 0);
        
        // Process notifications
        const notificationsWithOrders = [];
        
        for (const notification of response) {
          try {
            if (notification.relatedId) {
              // Get order details
              const order = await apiService.getOrderById(notification.relatedId);
              if (order) {
                notificationsWithOrders.push({
                  id: notification.id,
                  notificationId: notification.id,
                  title: notification.title || t('newOrder', 'New Order'),
                  message: notification.message || t('orderFromCustomer', 'Order from {{name}}', { name: order.customerInfo?.name || 'Customer' }),
                  time: new Date(notification.createdAt || Date.now()),
                  read: notification.read || false,
                  order: order
                });
              }
            }
          } catch (error) {
            console.error('Error fetching order details:', error);
          }
        }
        
        setNotifications(notificationsWithOrders);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  // Handle order actions
  const handleAcceptOrder = async (notification) => {
    try {
      // Mark notification as read if it has a notification ID
      if (notification.notificationId) {
        await apiService.markNotificationAsRead(notification.notificationId);
      }
      
      // Update order status
      await apiService.updateOrderStatus(notification.order.id, 'accepted');
      toast.success(t('orderAccepted', 'Order accepted successfully'));
      
      // Remove from notifications
      setNotifications(prev => prev.filter(item => item.id !== notification.id));
      handleMenuClose();
      
      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error(t('errorAcceptingOrder', 'Error accepting order'));
    }
  };
  
  const handleRejectOrder = async (notification) => {
    try {
      // Mark notification as read if it has a notification ID
      if (notification.notificationId) {
        await apiService.markNotificationAsRead(notification.notificationId);
      }
      
      // Update order status
      await apiService.updateOrderStatus(notification.order.id, 'rejected');
      toast.info(t('orderRejected', 'Order rejected'));
      
      // Remove from notifications
      setNotifications(prev => prev.filter(item => item.id !== notification.id));
      handleMenuClose();
      
      // Refresh notifications
      fetchNotifications();
      handleMenuClose();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error(t('errorRejectingOrder', 'Error rejecting order'));
    }
  };
  
  const handleViewAllOrders = () => {
    navigate('/online/notifications');
    handleMenuClose();
  };

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
  
  // Poll for new notifications
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return; // Only poll if authenticated and auto-refresh is enabled
    
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
  }, [isAuthenticated, autoRefresh]); // Add autoRefresh to dependencies
  
  // Navigate to notifications page
  const handleViewAllNotifications = () => {
    navigate('/online/notifications');
    handleMenuClose();
  };
  
  // Format time
  const formatTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = now - date;
    
    // Less than a minute
    if (diff < 60000) {
      return t('justNow', 'Just now');
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return t('minutesAgo', '{{count}} minutes ago', { count: minutes });
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return t('hoursAgo', '{{count}} hours ago', { count: hours });
    }
    
    // Format as date
    return date.toLocaleDateString();
  };
  
  if (!isAuthenticated) return null;
  
  return (
    <>
      <audio ref={audioRef} preload="auto">
        <source src="/notification-sound.mp3" type="audio/mpeg" />
      </audio>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
          sx={{ fontSize: '0.8rem' }}
        />
        
        {/* Manual refresh button */}
        <Button
          size="small"
          onClick={handleManualRefresh}
          variant="outlined"
          sx={{ minWidth: 'auto', px: 1 }}
        >
          تحديث
        </Button>
        
        <IconButton
          color="inherit"
          onClick={handleMenuOpen}
          sx={{ position: 'relative' }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { width: 320, maxHeight: 500, overflow: 'auto' }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{t('notifications', 'Notifications')}</Typography>
          {notifications.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {notifications.length} {t('newOrders', 'new orders')}
            </Typography>
          )}
        </Box>
        
        <Divider />
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('noNewOrders', 'No new orders')}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem alignItems="flex-start" sx={{ 
                  px: 2, 
                  py: 1.5,
                  bgcolor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.08)'
                }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <ShoppingBagIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" component="div">
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.primary" component="span">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="div">
                          {formatTime(notification.time)}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            startIcon={<CheckIcon />}
                            onClick={() => handleAcceptOrder(notification)}
                          >
                            {t('accept', 'Accept')}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CloseIcon />}
                            onClick={() => handleRejectOrder(notification)}
                          >
                            {t('reject', 'Reject')}
                          </Button>
                        </Box>
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
        
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            size="small"
            onClick={handleViewAllNotifications}
          >
            {t('viewAll', 'View All')}
          </Button>
          <Button
            size="small"
            onClick={handleViewAllOrders}
          >
            {t('viewAllOrders', 'View All Orders')}
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default OrderNotification;