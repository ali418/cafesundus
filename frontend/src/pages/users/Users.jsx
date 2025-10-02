import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  TablePagination,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Divider,
  Switch,
  FormControlLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material';

import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Person,
  PersonAdd,
  AdminPanelSettings,
  SupervisorAccount,
  AccountCircle,
  ShoppingCart,
  Block,
  CheckCircle,
  Refresh,
  FilterList,
  Close,
  MoreVert,
  History,
  Security,
  Inventory,
  AttachMoney,
} from '@mui/icons-material';

import apiService from '../../api/apiService';
import { formatDate } from '../../utils/formatters';

const roleIcons = {
  admin: <AdminPanelSettings color="primary" />,
  manager: <SupervisorAccount color="secondary" />,
  cashier: <ShoppingCart color="action" />,
  user: <AccountCircle color="disabled" />,
  storekeeper: <Inventory color="success" />,
  accountant: <AttachMoney color="warning" />,
  staff: <Person color="info" />,
};

const roleColors = {
  admin: 'error',
  manager: 'secondary',
  cashier: 'info',
  user: 'default',
  storekeeper: 'success',
  accountant: 'warning',
  staff: 'primary',
};

const Users = () => {
  const { t } = useTranslation(['common', 'users']);
  const currentUser = useSelector((state) => state.auth.user);
  
  // State for users list
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false); // New state for showing deleted users
  
  // State for user form dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    role: 'staff',
    password: '',
    confirmPassword: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});
  
  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for user details dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // State for notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  // Fetch users with search and filters
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getUsers({
        page: page + 1, // API uses 1-based indexing
        limit: rowsPerPage,
        search: searchTerm,
        role: roleFilter,
        includeDeleted: includeDeleted, // Pass the includeDeleted flag
      });
      
      setUsers(response.data || []);
      setTotalUsers(response.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, roleFilter, includeDeleted]); // Add includeDeleted to dependencies
  
  // Fetch user details including login history
  const fetchUserDetails = useCallback(async (userId) => {
    try {
      const user = await apiService.getUserById(userId);
      setUserDetails(user);
      
      // Fetch login history when details dialog is opened
      setLoadingHistory(true);
      const historyResponse = await apiService.getUserLoginHistory(userId, { page: 1, limit: 10 });
      setLoginHistory(historyResponse.data || []);
    } catch (err) {
      console.error(`Error fetching user details for ${userId}:`, err);
      setNotification({
        open: true,
        message: err.message || 'Failed to load user details',
        severity: 'error',
      });
    } finally {
      setLoadingHistory(false);
    }
  }, []);
  
  // Initial load
  useEffect(() => {
    document.title = t('pageTitle.users');
    fetchUsers();
  }, [fetchUsers, t]);
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0); // Reset to first page when search changes
  };
  
  // Handle role filter change
  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(0); // Reset to first page when filter changes
  };
  
  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setPage(0);
  };
  
  // Open create user dialog
  const handleCreateUser = () => {
    setFormMode('create');
    setFormData({
      username: '',
      email: '',
      fullName: '',
      phone: '',
      role: 'cashier',
      password: '',
      confirmPassword: '',
      isActive: true,
    });
    setFormErrors({});
    setDialogOpen(true);
  };
  
  // Open edit user dialog
  const handleEditUser = (user) => {
    setFormMode('edit');
    setSelectedUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      fullName: user.fullName || '',
      phone: user.phone || '',
      role: user.role || 'staff',
      password: '',
      confirmPassword: '',
      isActive: user.isActive !== undefined ? user.isActive : true,
    });
    setFormErrors({});
    setDialogOpen(true);
  };
  
  // Open user details dialog
  const handleViewUser = async (user) => {
    setTabValue(0); // Reset to first tab
    setUserDetails(null); // Clear previous details
    setLoginHistory([]); // Clear previous history
    setDetailsDialogOpen(true);
    await fetchUserDetails(user.id);
  };
  
  // Open delete confirmation dialog
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = name === 'isActive' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = t('users:usernameRequired');
    }
    
    if (!formData.email.trim()) {
      errors.email = t('users:emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t('users:invalidEmail');
    }
    
    if (formMode === 'create') {
      if (!formData.password) {
        errors.password = t('users:passwordRequired');
      } else if (formData.password.length < 6) {
        errors.password = t('users:passwordTooShort');
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = t('users:passwordsDoNotMatch');
      }
    } else if (formData.password) {
      // In edit mode, password is optional but if provided, validate it
      if (formData.password.length < 6) {
        errors.password = t('users:passwordTooShort');
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = t('users:passwordsDoNotMatch');
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        role: formData.role,
        isActive: formData.isActive,
      };
      
      if (formData.password) {
        payload.password = formData.password;
      }
      
      if (formMode === 'create') {
        await apiService.createUser(payload);
        setNotification({
          open: true,
          message: t('users:userCreated'),
          severity: 'success',
        });
      } else {
        await apiService.updateUser(selectedUser.id, payload);
        setNotification({
          open: true,
          message: t('users:userUpdated'),
          severity: 'success',
        });
      }
      
      setDialogOpen(false);
      fetchUsers(); // Refresh the users list
    } catch (err) {
      console.error('Error saving user:', err);
      setNotification({
        open: true,
        message: err.message || 'Failed to save user',
        severity: 'error',
      });
    }
  };
  
  // Delete user
  const handleDeleteUser = async () => {
    try {
      await apiService.deleteUser(userToDelete.id);
      setNotification({
        open: true,
        message: t('users:userDeleted'),
        severity: 'success',
      });
      setDeleteDialogOpen(false);
      fetchUsers(); // Refresh the users list
    } catch (err) {
      console.error(`Error deleting user ${userToDelete.id}:`, err);
      setNotification({
        open: true,
        message: err.message || 'Failed to delete user',
        severity: 'error',
      });
    }
  };
  
  // Toggle user active status
  const handleToggleStatus = async (user) => {
    try {
      await apiService.toggleUserStatus(user.id, !user.isActive);
      setNotification({
        open: true,
        message: user.isActive ? t('users:userDeactivated') : t('users:userActivated'),
        severity: 'success',
      });
      fetchUsers(); // Refresh the users list
    } catch (err) {
      console.error(`Error toggling status for user ${user.id}:`, err);
      setNotification({
        open: true,
        message: err.message || 'Failed to update user status',
        severity: 'error',
      });
    }
  };
  
  // Handle tab change in user details dialog
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  // Render role badge
  const renderRoleBadge = (role) => (
    <Chip
      icon={roleIcons[role] || <Person />}
      label={t(`users:roles.${role}`)}
      color={roleColors[role] || 'default'}
      size="small"
      variant="outlined"
    />
  );
  
  // Render status badge
  const renderStatusBadge = (isActive) => (
    <Chip
      icon={isActive ? <CheckCircle /> : <Block />}
      label={isActive ? t('users:active') : t('users:inactive')}
      color={isActive ? 'success' : 'default'}
      size="small"
      variant="outlined"
    />
  );
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ textAlign: 'center', width: '100%' }}>
          {t('users:usersManagement')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAdd />}
          onClick={handleCreateUser}
        >
          {t('users:addUser')}
        </Button>
      </Box>
      
      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: showFilters ? 2 : 0 }}>
          <TextField
            variant="outlined"
            placeholder={t('search')}
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, mr: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={toggleFilters}
            sx={{ minWidth: 120 }}
          >
            {t('filters')}
          </Button>
          {(searchTerm || roleFilter) && (
            <Button
              variant="text"
              startIcon={<Refresh />}
              onClick={resetFilters}
              sx={{ ml: 1 }}
            >
              {t('reset')}
            </Button>
          )}
        </Box>
        
        {showFilters && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <FormControl variant="outlined" sx={{ minWidth: 200, mr: 2 }}>
              <InputLabel id="role-filter-label">{t('users:role')}</InputLabel>
              <Select
                labelId="role-filter-label"
                value={roleFilter}
                onChange={handleRoleFilterChange}
                label={t('users:role')}
              >
                <MenuItem value="">{t('all')}</MenuItem>
                <MenuItem value="staff">{t('users:roles.staff')}</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={includeDeleted}
                  onChange={(e) => {
                    setIncludeDeleted(e.target.checked);
                    setPage(0); // Reset to first page when filter changes
                  }}
                  color="primary"
                />
              }
              label={t('users:showDeletedUsers') || 'عرض المستخدمين المحذوفين'}
              sx={{ mr: 2 }}
            />
          </Box>
        )}
      </Paper>
      
      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Users Grid */}
      <Box sx={{ position: 'relative', minHeight: 400 }}>
        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}
        
        {users.length === 0 && !loading ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            {searchTerm || roleFilter
              ? t('users:noUsersMatchFilter')
              : t('users:noUsers')}
          </Alert>
        ) : (
          <>
            <Grid container spacing={3}>
              {users.map((user) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: user.role === 'admin' ? 'error.main' : 'primary.main',
                            mr: 2,
                          }}
                        >
                          {user.fullName?.charAt(0) || user.username?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="div" noWrap>
                            {user.fullName || user.username}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {user.username}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {user.email}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {renderRoleBadge(user.role)}
                        {renderStatusBadge(user.isActive)}
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary" display="block">
                        {t('users:lastLogin')}: {user.lastLogin ? formatDate(user.lastLogin) : t('users:never')}
                      </Typography>
                    </CardContent>
                    
                    <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => handleViewUser(user)}
                      >
                        {t('view')}
                      </Button>
                      
                      <Box>
                        {/* Don't allow editing or deleting yourself */}
                        {currentUser?.id !== user.id && (
                          <>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditUser(user)}
                              aria-label={t('edit')}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(user)}
                              aria-label={t('delete')}
                              disabled={user.role === 'admin'} // Prevent deleting admins
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <TablePagination
                component="div"
                count={totalUsers}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[8, 16, 24, 32]}
                labelRowsPerPage={t('itemsPerPage')}
              />
            </Box>
          </>
        )}
      </Box>
      
      {/* User Form Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {formMode === 'create' ? t('users:addUser') : t('users:editUser')}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('users:username')}
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                error={!!formErrors.username}
                helperText={formErrors.username}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('users:email')}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('users:fullName')}
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('users:phone')}
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="role-label">{t('users:role')}</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  label={t('users:role')}
                >
                  {/* <MenuItem value="admin">{t('users:roles.admin')}</MenuItem>
                  <MenuItem value="manager">{t('users:roles.manager')}</MenuItem> */}
                  <MenuItem value="cashier">{t('users:roles.cashier')}</MenuItem>
                  {/* <MenuItem value="storekeeper">{t('users:roles.storekeeper')}</MenuItem>
                  <MenuItem value="accountant">{t('users:roles.accountant')}</MenuItem>
                  <MenuItem value="staff">{t('users:roles.staff')}</MenuItem> */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('users:password')}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                error={!!formErrors.password}
                helperText={formErrors.password}
                margin="normal"
                required={formMode === 'create'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('password')}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('users:confirmPassword')}
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
                margin="normal"
                required={formMode === 'create' || formData.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('confirmPassword')}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label={t('users:accountActive')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
          >
            {formMode === 'create' ? t('users:addUser') : t('users:saveChanges')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* User Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('users:userDetails')}
        </DialogTitle>
        <DialogContent dividers>
          {!userDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: userDetails.role === 'admin' ? 'error.main' : 'primary.main',
                      mr: 3,
                      fontSize: 32,
                    }}
                  >
                    {userDetails.fullName?.charAt(0) || userDetails.username?.charAt(0) || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="h5">
                      {userDetails.fullName || userDetails.username}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {renderRoleBadge(userDetails.role)}
                      {renderStatusBadge(userDetails.isActive)}
                    </Box>
                  </Box>
                </Box>
              </Box>
              
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
              >
                <Tab icon={<Person />} label={t('users:basicInfo')} />
                <Tab icon={<Security />} label={t('users:security')} />
                <Tab icon={<History />} label={t('users:loginHistory')} />
              </Tabs>
              
              {/* Basic Info Tab */}
              {tabValue === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('users:username')}
                    </Typography>
                    <Typography variant="body1">
                      {userDetails.username}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('users:email')}
                    </Typography>
                    <Typography variant="body1">
                      {userDetails.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('users:fullName')}
                    </Typography>
                    <Typography variant="body1">
                      {userDetails.fullName || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('users:phone')}
                    </Typography>
                    <Typography variant="body1">
                      {userDetails.phone || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('users:createdAt')}
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(userDetails.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('users:lastLogin')}
                    </Typography>
                    <Typography variant="body1">
                      {userDetails.lastLogin ? formatDate(userDetails.lastLogin) : t('users:never')}
                    </Typography>
                  </Grid>
                </Grid>
              )}
              
              {/* Security Tab */}
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('users:accountSecurity')}
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Security />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('users:accountStatus')}
                        secondary={userDetails.isActive ? t('users:active') : t('users:inactive')}
                      />
                      {currentUser?.id !== userDetails.id && (
                        <ListItemSecondaryAction>
                          <Switch
                            edge="end"
                            checked={userDetails.isActive}
                            onChange={() => handleToggleStatus(userDetails)}
                            color="primary"
                          />
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AdminPanelSettings />
                      </ListItemIcon>
                      <ListItemText
                        primary={t('users:userRole')}
                        secondary={t(`users:roles.${userDetails.role}`)}
                      />
                    </ListItem>
                  </List>
                  
                  {currentUser?.id !== userDetails.id && (
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                          setDetailsDialogOpen(false);
                          handleEditUser(userDetails);
                        }}
                        startIcon={<Edit />}
                      >
                        {t('users:editUser')}
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
              
              {/* Login History Tab */}
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {t('users:recentLogins')}
                  </Typography>
                  
                  {loadingHistory ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : loginHistory.length === 0 ? (
                    <Alert severity="info">
                      {t('users:noLoginHistory')}
                    </Alert>
                  ) : (
                    <List>
                      {loginHistory.map((login) => (
                        <ListItem key={login.id} divider>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body1">
                                  {formatDate(login.loginTime || login.createdAt)}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color={login.status === 'success' ? 'success.main' : 'error.main'}
                                >
                                  {login.status === 'success' ? t('success') : t('error')}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  IP: {login.ipAddress || login.ip || '-'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {t('users:device')}: {login.device || '-'}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            {t('close')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>{t('users:confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('users:deleteUserConfirmation', { username: userToDelete?.username || '' })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;