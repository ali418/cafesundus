import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout as logoutAction } from '../redux/slices/authSlice';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip,
} from '@mui/material';
import {
  Save,
  Edit,
  Person,
  Email,
  Phone,
  Lock,
  Visibility,
  VisibilityOff,
  PhotoCamera,
  Notifications,
  Language,
  DarkMode,
  LightMode,
  Security,
  History,
  ExitToApp,
} from '@mui/icons-material';

import apiService from '../api/apiService';
import { setThemeMode, setLanguage, selectThemeMode, selectLanguage } from '../redux/slices/settingsSlice';

// Demo user data (fallback)

// Demo login history

const Profile = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // State for user data
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState(null);
  
  // State for form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  
  // State for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // State for showing/hiding passwords
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  
  // State for tabs
  const [tabValue, setTabValue] = useState(0);

  // Redux-based preferences
  const themeMode = useSelector(selectThemeMode);
  const currentLanguage = useSelector(selectLanguage);
  const isDarkMode = themeMode === 'dark';
  
  // State for edit mode
  const [editMode, setEditMode] = useState(false);
  
  // State for validation errors
  const [errors, setErrors] = useState({});
  
  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  


  // Login history state
  const [loginHistory, setLoginHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    if (editMode) {
      // Reset form data if canceling edit
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      });
      setErrors({});
    }
    setEditMode(!editMode);
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  
  // Handle password input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };
  
  // Handle preference change
  const handlePreferenceChange = (e) => {
    const { name, checked } = e.target;

    if (name === 'darkMode') {
      dispatch(setThemeMode(checked ? 'dark' : 'light'));
      return;
    } else if (name.startsWith('notifications.')) {
      const notificationType = name.split('.')[1];
      setUser(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          notifications: {
            ...prev.preferences.notifications,
            [notificationType]: checked,
          },
        },
      }));
    }
  };
  
  // Handle language change
  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
    dispatch(setLanguage(language));
  };
  
  // Handle avatar upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you would upload the file to a server
      // For demo purposes, we'll use a local URL
      const avatarUrl = URL.createObjectURL(file);
      setUser(prev => ({
        ...prev,
        avatar: avatarUrl,
      }));
    }
  };
  
  // Validate profile form
  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('validation:required');
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('validation:required');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('validation:required');
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = t('validation:invalidEmail');
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = t('validation:required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validate password form
  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = t('validation:required');
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = t('validation:required');
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = t('validation:passwordLength');
    }
    
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = t('validation:required');
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = t('validation:passwordsDoNotMatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Save profile changes
  const saveProfileChanges = async () => {
    if (validateProfileForm()) {
      try {
        const payload = {
          fullName: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
        };
        await apiService.updateProfile(user.id, payload);

        // Refetch the profile from server to ensure we have persisted values
        const data = await apiService.getProfile();
        const mapped = {
          id: data.id,
          firstName: data.fullName?.split(' ')[0] || data.username || '',
          lastName: data.fullName?.split(' ').slice(1).join(' ') || '',
          email: data.email || '',
          phone: data.phone || '',
          avatar: data.avatar || '',
          role: data.role || '',
          lastLogin: data.lastLogin || '',
          createdAt: data.createdAt || new Date().toISOString(),
          preferences: {
            darkMode: false,
            language: i18n.language,
            notifications: { email: true, push: true, system: true },
          }
        };
        setUser(mapped);
        setFormData({
          firstName: mapped.firstName,
          lastName: mapped.lastName,
          email: mapped.email,
          phone: mapped.phone,
        });

        setEditMode(false);
        setNotification({
          open: true,
          message: t('profile:profileUpdated'),
          severity: 'success',
        });
      } catch (err) {
        setNotification({
          open: true,
          message: err.message || t('error'),
          severity: 'error',
        });
      }
    }
  };

  // Change password
  const changePassword = async () => {
    if (validatePasswordForm()) {
      try {
        await apiService.changePassword(user.id, {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setNotification({
          open: true,
          message: t('profile:passwordChanged'),
          severity: 'success',
        });
      } catch (err) {
        setNotification({
          open: true,
          message: err.message || t('error'),
          severity: 'error',
        });
      }
    }
  };
  
  // Handle notification close
  const handleNotificationClose = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  // Handle logout
  const handleLogout = () => {
    dispatch(logoutAction());
    navigate('/login');
  };
  
  useEffect(() => {
    document.title = t('pageTitle.profile');
  }, [i18n.language, t]);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        setLoadingUser(true);
        setUserError(null);
        const data = await apiService.getProfile();
        // Map backend user fields to frontend expected structure
        const mapped = {
          id: data.id,
          firstName: data.fullName?.split(' ')[0] || data.username || '',
          lastName: data.fullName?.split(' ').slice(1).join(' ') || '',
          email: data.email || '',
          phone: data.phone || '',
          avatar: data.avatar || '',
          role: data.role || '',
          lastLogin: data.lastLogin || '',
          createdAt: data.createdAt || new Date().toISOString(),
          preferences: {
            darkMode: false,
            language: i18n.language,
            notifications: { email: true, push: true, system: true },
          }
        };
        if (isMounted) {
          setUser(mapped);
          setFormData({
            firstName: mapped.firstName,
            lastName: mapped.lastName,
            email: mapped.email,
            phone: mapped.phone,
          });
        }
      } catch (err) {
        console.error('Failed to load profile', err);
        if (isMounted) setUserError(err.message || 'Failed to load profile');
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, [i18n.language]);

  // Fetch login history when Profile tab loads or when switching to Login History tab
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      if (tabValue !== 3) return; // Only load when Login History tab is active
      try {
        setLoadingHistory(true);
        setHistoryError(null);
        const res = await apiService.getMyLoginHistory({ page: 1, limit: 20 });
        const items = res?.data || [];
        if (isMounted) setLoginHistory(items);
      } catch (err) {
        console.error('Failed to load login history', err);
        if (isMounted) setHistoryError(err.message || 'Failed to load login history');
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };
    fetchHistory();
    return () => { isMounted = false; };
  }, [tabValue]);

  if (loadingUser) {
    return <Typography sx={{ p: 3 }}>{t('loading')}...</Typography>;
  }

  if (userError) {
    return <Alert severity="error" sx={{ m: 3 }}>{userError}</Alert>;
  }

  if (!user) {
    return <Alert severity="warning" sx={{ m: 3 }}>{t('noData')}</Alert>;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    sx={{ width: 100, height: 100 }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: 'background.paper',
                      borderRadius: '50%',
                      padding: '4px',
                    }}
                  >
                    <IconButton
                      color="primary"
                      aria-label="upload picture"
                      component="label"
                      size="small"
                    >
                      <input
                        hidden
                        accept="image/*"
                        type="file"
                        onChange={handleAvatarUpload}
                      />
                      <PhotoCamera fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs>
                <Typography variant="h4">
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {user.role}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('profile:memberSince')}: {new Date(user.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('profile:lastLogin')}: {user.lastLogin}
                </Typography>
              </Grid>
              
              <Grid item>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ExitToApp />}
                  onClick={handleLogout}
                >
                  {t('auth:logout')}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Profile Content */}
        <Grid item xs={12}>
          <Paper sx={{ p: 0 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab icon={<Person />} label={t('profile:personalInfo')} />
              <Tab icon={<Lock />} label={t('profile:security')} />
              <Tab icon={<Notifications />} label={t('profile:preferences')} />
              <Tab icon={<History />} label={t('profile:loginHistory')} />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {/* Personal Information Tab */}
              {tabValue === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      {t('profile:personalInfo')}
                    </Typography>
                    <Button
                      variant={editMode ? "outlined" : "contained"}
                      color={editMode ? "error" : "primary"}
                      startIcon={editMode ? <Save /> : <Edit />}
                      onClick={editMode ? saveProfileChanges : toggleEditMode}
                    >
                      {editMode ? t('save') : t('edit')}
                    </Button>
                  </Box>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('firstName')}
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        error={!!errors.firstName}
                        helperText={errors.firstName}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('lastName')}
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        error={!!errors.lastName}
                        helperText={errors.lastName}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('email')}
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        error={!!errors.email}
                        helperText={errors.email}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('phone')}
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        error={!!errors.phone}
                        helperText={errors.phone}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    {editMode && (
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                          <Button
                            variant="outlined"
                            color="inherit"
                            onClick={toggleEditMode}
                            sx={{ marginInlineEnd: 1 }}
                          >
                            {t('cancel')}
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={saveProfileChanges}
                          >
                            {t('save')}
                          </Button>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
              
              {/* Security Tab */}
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('profile:changePassword')}
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('profile:currentPassword')}
                        name="currentPassword"
                        type={showPasswords.currentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        error={!!errors.currentPassword}
                        helperText={errors.currentPassword}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => togglePasswordVisibility('currentPassword')}
                                edge="end"
                              >
                                {showPasswords.currentPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('profile:newPassword')}
                        name="newPassword"
                        type={showPasswords.newPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        error={!!errors.newPassword}
                        helperText={errors.newPassword}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => togglePasswordVisibility('newPassword')}
                                edge="end"
                              >
                                {showPasswords.newPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('profile:confirmPassword')}
                        name="confirmPassword"
                        type={showPasswords.confirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => togglePasswordVisibility('confirmPassword')}
                                edge="end"
                              >
                                {showPasswords.confirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={changePassword}
                        >
                          {t('profile:updatePassword')}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      {t('profile:securitySettings')}
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <Security />
                        </ListItemIcon>
                        <ListItemText 
                          primary={t('profile:twoFactorAuth')} 
                          secondary={t('profile:twoFactorAuthDesc')}
                        />
                        <ListItemSecondaryAction>
                          <Button variant="outlined" color="primary">
                            {t('setup')}
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </Box>
                </Box>
              )}
              
              {/* Preferences Tab */}
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('profile:preferences')}
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        {isDarkMode ? <DarkMode /> : <LightMode />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={t('profile:darkMode')} 
                        secondary={t('profile:darkModeDesc')}
                      />
                      <Switch
                        edge="end"
                        checked={isDarkMode}
                        onChange={(e) => handlePreferenceChange(e)}
                        name="darkMode"
                        color="primary"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <Language />
                      </ListItemIcon>
                      <ListItemText 
                        primary={t('profile:language')} 
                        secondary={t('profile:languageDesc')}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="English">
                          <IconButton 
                            color={currentLanguage === 'en' ? 'primary' : 'default'}
                            onClick={() => handleLanguageChange('en')}
                          >
                            <Avatar sx={{ width: 24, height: 24 }}>EN</Avatar>
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="العربية">
                          <IconButton 
                            color={currentLanguage === 'ar' ? 'primary' : 'default'}
                            onClick={() => handleLanguageChange('ar')}
                          >
                            <Avatar sx={{ width: 24, height: 24 }}>AR</Avatar>
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Français">
                          <IconButton 
                            color={currentLanguage === 'fr' ? 'primary' : 'default'}
                            onClick={() => handleLanguageChange('fr')}
                          >
                            <Avatar sx={{ width: 24, height: 24 }}>FR</Avatar>
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Español">
                          <IconButton 
                            color={currentLanguage === 'es' ? 'primary' : 'default'}
                            onClick={() => handleLanguageChange('es')}
                          >
                            <Avatar sx={{ width: 24, height: 24 }}>ES</Avatar>
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                  </List>
                  
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    {t('profile:notificationPreferences')}
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Email />
                      </ListItemIcon>
                      <ListItemText 
                        primary={t('profile:emailNotifications')} 
                        secondary={t('profile:emailNotificationsDesc')}
                      />
                      <Switch
                        edge="end"
                        checked={user.preferences.notifications.email}
                        onChange={(e) => handlePreferenceChange(e)}
                        name="notifications.email"
                        color="primary"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <Notifications />
                      </ListItemIcon>
                      <ListItemText 
                        primary={t('profile:pushNotifications')} 
                        secondary={t('profile:pushNotificationsDesc')}
                      />
                      <Switch
                        edge="end"
                        checked={user.preferences.notifications.push}
                        onChange={(e) => handlePreferenceChange(e)}
                        name="notifications.push"
                        color="primary"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <Notifications />
                      </ListItemIcon>
                      <ListItemText 
                        primary={t('profile:systemNotifications')} 
                        secondary={t('profile:systemNotificationsDesc')}
                      />
                      <Switch
                        edge="end"
                        checked={user.preferences.notifications.system}
                        onChange={(e) => handlePreferenceChange(e)}
                        name="notifications.system"
                        color="primary"
                      />
                    </ListItem>
                  </List>
                </Box>
              )}
              
              {/* Login History Tab */}
              {tabValue === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('profile:loginHistory')}
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  {historyError && <Alert severity="error" sx={{ mb: 2 }}>{historyError}</Alert>}
                  {loadingHistory ? (
                    <Typography variant="body2">{t('loading')}...</Typography>
                  ) : (
                    <List>
                      {loginHistory.length === 0 ? (
                        <ListItem>
                          <ListItemText primary={t('noData')} />
                        </ListItem>
                      ) : (
                        loginHistory.map((login) => (
                          <ListItem key={login.id} divider>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body1">
                                    {new Date(login.loginTime || login.createdAt).toLocaleString()}
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    color={login.status === 'success' ? 'success.main' : 'error.main'}
                                  >
                                    {login.status === 'success' ? t('common:success') : t('common:error')}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    IP: {login.ipAddress || login.ip}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {t('profile:device')}: {login.device || '—'}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))
                      )}
                    </List>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
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

export default Profile;