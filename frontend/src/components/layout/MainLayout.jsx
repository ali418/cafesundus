import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { styled, useTheme } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import LanguageSwitcher from '../LanguageSwitcher';
import OrderNotification from '../OrderNotification';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  PointOfSale as PointOfSaleIcon,
  Receipt as ReceiptIcon,
  Category as CategoryIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { selectStoreSettings } from '../../redux/slices/settingsSlice';

// Components

// Redux actions
import { logout, selectUser } from '../../redux/slices/authSlice';
import apiService from '../../api/apiService';
// Auth Service - not needed here as logout is handled in authSlice

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(6)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(6)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  // RTL support - the arrow icon will automatically flip based on the isRTL logic
}));

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isRTL',
})(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin', 'box-shadow', 'background'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  background: 'linear-gradient(135deg, #121212 0%, #2c2c2c 100%)',
  borderRadius: '0 0 16px 16px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  // إزالة قواعد الهوامش القديمة لأن CSS Grid يتولى التخطيط الآن
  // ...(open && {
  //   marginInlineStart: drawerWidth,
  //   width: `calc(100% - ${drawerWidth}px)`,
  //   transition: theme.transitions.create(['width', 'margin'], {
  //     easing: theme.transitions.easing.sharp,
  //     duration: theme.transitions.duration.enteringScreen,
  //   }),
  // }),
}));

const DrawerStyled = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  // تأكد من أن الورقة تشارك في التخطيط وليست مثبتة فوق المحتوى
  '& .MuiDrawer-paper': { 
    position: 'relative',
    background: 'linear-gradient(180deg, #121212 0%, #1a1a1a 100%)',
    color: '#fff',
    borderRight: '1px solid rgba(255, 215, 0, 0.1)',
    boxShadow: '4px 0 10px rgba(0, 0, 0, 0.1)',
  },
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': { 
      ...openedMixin(theme), 
      position: 'relative',
      background: 'linear-gradient(180deg, #121212 0%, #1a1a1a 100%)',
      color: '#fff',
      borderRight: '1px solid rgba(255, 215, 0, 0.1)',
      boxShadow: '4px 0 10px rgba(0, 0, 0, 0.1)',
    },
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': { 
      ...closedMixin(theme), 
      position: 'relative',
      background: 'linear-gradient(180deg, #121212 0%, #1a1a1a 100%)',
      color: '#fff',
      borderRight: '1px solid rgba(255, 215, 0, 0.1)',
      boxShadow: '4px 0 10px rgba(0, 0, 0, 0.1)',
    },
  }),
}));

// Main content wrapper with proper RTL support using logical properties
const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme }) => ({
  flexGrow: 1,
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  // إزالة أي حشوة جانبية لإلصاق المحتوى بحدود الشاشة
  paddingLeft: 0,
  paddingRight: 0,
  paddingInlineEnd: 0,
  paddingInlineStart: 0,
  // تأكد من عدم وجود هوامش جانبية
  marginLeft: 0,
  marginRight: 0,
  marginInlineStart: 0,
  marginInlineEnd: 0,
  // ضمان عدم تجاوز المحتوى حدود الشاشة مع تمكين التمرير العمودي داخل المحتوى
  maxWidth: '100%',
  height: '100dvh',
  minHeight: 0,
  overflowX: 'hidden',
  overflowY: 'auto',
  background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
}));

const MainLayout = () => {
  const theme = useTheme();
  const { t, i18n } = useTranslation(['common', 'dashboard', 'products', 'sales', 'customers', 'inventory', 'reports', 'users']);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const storeSettings = useSelector(selectStoreSettings);
  const isRTL = (typeof document !== 'undefined' ? document.dir === 'rtl' : (i18n.language && i18n.language.startsWith('ar')));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Sidebar state with localStorage persistence as specified by user
  const [open, setOpen] = useState(() => {
    if (isMobile) return false;
    // Apply user's localStorage logic
    const collapsed = localStorage.getItem('sidebarCollapsed');
    return collapsed !== 'true'; // return true if not collapsed
  });

  // User menu state
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleDrawerOpen = () => {
    setOpen(true);
    localStorage.setItem('sidebarCollapsed', 'false');
  };

  const handleDrawerClose = () => {
    setOpen(false);
    localStorage.setItem('sidebarCollapsed', 'true');
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // User menu handlers
  useEffect(() => {
    // Initialize any required data
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      setOpen(false);
    }
  };

  // Grid layout for sidebar positioned properly in both LTR and RTL
  const collapsedWidth = `calc(${theme.spacing(6)} + 1px)`;
  const drawerColWidth = open ? `${drawerWidth}px` : (isMobile ? '0px' : collapsedWidth);
  // Keep drawer on left for both RTL and LTR as per user request
  const gridTemplateColumns = `${drawerColWidth} 1fr`;
  const gridTemplateAreas = "'drawer content'";

  // Define all menu items with their role requirements
  const allMenuItems = [
    // لوحة التحكم - متاحة لجميع المستخدمين
    { text: t('dashboard:dashboard'), icon: <DashboardIcon />, path: '/dashboard', roles: ['admin', 'manager', 'cashier', 'storekeeper', 'accountant', 'staff'] },
    
    // المنتجات والفئات - متاحة للمدير والمخزن والكاشير
    { text: t('products:products'), icon: <InventoryIcon />, path: '/products', roles: ['admin', 'storekeeper', 'cashier'] },
    { text: t('products:categories'), icon: <CategoryIcon />, path: '/categories', roles: ['admin', 'storekeeper'] },
    
    // نقطة البيع - متاحة للمدير والكاشير فقط
    { text: t('sales:pos'), icon: <PointOfSaleIcon />, path: '/pos', roles: ['admin', 'cashier'] },
    
    // المبيعات - متاحة للمدير والكاشير والمحاسب
    { text: t('sales:sales'), icon: <ShoppingCartIcon />, path: '/sales', roles: ['admin', 'cashier', 'accountant'] },
    
    // إشعارات الطلبات الأونلاين - متاحة للمدير والكاشير
    { text: t('online:onlineOrderNotifications', 'إشعارات الطلبات الأونلاين'), icon: <NotificationsIcon />, path: '/online/notifications', roles: ['admin', 'cashier'] },
    
    // الفواتير - متاحة للمدير والكاشير والمحاسب
    // Removed: Invoices menu
    // { text: t('sales:invoices'), icon: <ReceiptIcon />, path: '/invoices', roles: ['admin', 'cashier', 'accountant'] },
    
    // العملاء - متاحة للمدير والكاشير والمحاسب
    { text: t('customers:customers'), icon: <PeopleIcon />, path: '/customers', roles: ['admin', 'cashier', 'accountant'] },
    
    // المخزون - متاحة للمدير والمخزن فقط
    // Removed: Inventory menu
    // { text: t('inventory:inventory'), icon: <InventoryIcon sx={{ transform: 'rotate(90deg)' }} />, path: '/inventory', roles: ['admin', 'storekeeper'] },
    
    // التقارير - متاحة للمدير والمخزن والمحاسب
    { text: t('reports:reports'), icon: <BarChartIcon />, path: '/reports', roles: ['admin', 'storekeeper', 'accountant'] },
    
    // إدارة المستخدمين - متاحة للمدير فقط
    { text: t('users:usersManagement'), icon: <GroupIcon />, path: '/users', roles: ['admin'] },
    // الإعدادات - متاحة للمدير فقط
    { text: t('settings'), icon: <SettingsIcon />, path: '/settings', roles: ['admin'] },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => {
    // If user role is not available or not in the roles array, don't show the item
    return user && user.role && item.roles.includes(user.role);
  });

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns,
      gridTemplateAreas,
      // لا فجوة بين الأعمدة
      gap: 0,
      height: '100dvh',
      minHeight: 0,
      overflow: 'hidden',
      transition: theme.transitions.create('grid-template-columns', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }}>
      <AppBarStyled position='fixed' open={open} isRTL={isRTL} sx={{ gridColumn: '1 / -1' }}>
        <Toolbar>
          <IconButton
            color='inherit'
            aria-label={open ? t('common.collapse', { defaultValue: 'Collapse sidebar' }) : t('common.expand', { defaultValue: 'Expand sidebar' })}
            onClick={open ? handleDrawerClose : handleDrawerOpen}
            edge='start'
            sx={{
              // لا تضيف مسافة إضافية بجانب الأيقونة
              marginInlineEnd: 0,
              color: '#FFD700',
              '&:hover': {
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s ease',
            }}
         >
            {open ? (isRTL ? <ChevronRightIcon /> : <ChevronLeftIcon />) : <MenuIcon />}
          </IconButton>
          <Typography 
            variant='h6' 
            noWrap 
            component='div' 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 'bold',
              color: '#FFD700',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              letterSpacing: '0.5px',
            }}
          >
            {storeSettings?.name || t('appName')}
          </Typography>

          <LanguageSwitcher />

          {/* Online Order Notifications */}
          <OrderNotification />

          {/* User Menu */}

          <Box sx={{ flexGrow: 0, marginInlineStart: 2 }}>
            <Tooltip title={t('profile')}>
              <IconButton 
                onClick={handleOpenUserMenu} 
                sx={{ 
                  p: 0,
                  border: '2px solid #FFD700',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
                  },
                }}
              >
                <Avatar 
                  alt={user?.name || 'User'} 
                  src='/static/images/avatar/1.jpg' 
                  sx={{
                    transition: 'all 0.3s ease',
                  }}
                />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ 
                mt: '45px',
                '& .MuiPaper-root': {
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  border: '1px solid rgba(255, 215, 0, 0.1)',
                  overflow: 'visible',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: -10,
                    right: isRTL ? 'auto' : 14,
                    left: isRTL ? 14 : 'auto',
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                    borderTop: '1px solid rgba(255, 215, 0, 0.1)',
                    borderLeft: '1px solid rgba(255, 215, 0, 0.1)',
                  },
                },
              }}
              id='menu-appbar'
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: isRTL ? 'left' : 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: isRTL ? 'left' : 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem 
                onClick={() => { handleCloseUserMenu(); navigate('/profile'); }}
                sx={{
                  borderRadius: '8px',
                  margin: '4px 8px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    '& .MuiListItemIcon-root': {
                      color: '#FFD700',
                    },
                    '& .MuiTypography-root': {
                      color: '#FFD700',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <PersonIcon fontSize='small' />
                </ListItemIcon>
                <Typography textAlign='center'>{t('profile')}</Typography>
              </MenuItem>
              <MenuItem 
                onClick={() => { handleCloseUserMenu(); navigate('/settings'); }}
                sx={{
                  borderRadius: '8px',
                  margin: '4px 8px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    '& .MuiListItemIcon-root': {
                      color: '#FFD700',
                    },
                    '& .MuiTypography-root': {
                      color: '#FFD700',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <SettingsIcon fontSize='small' />
                </ListItemIcon>
                <Typography textAlign='center'>{t('settings')}</Typography>
              </MenuItem>
              <Divider sx={{ margin: '4px 8px', borderColor: 'rgba(255, 215, 0, 0.1)' }} />
              <MenuItem 
                onClick={() => { handleCloseUserMenu(); handleLogout(); }}
                sx={{
                  borderRadius: '8px',
                  margin: '4px 8px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    '& .MuiListItemIcon-root': {
                      color: '#FF5555',
                    },
                    '& .MuiTypography-root': {
                      color: '#FF5555',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize='small' />
                </ListItemIcon>
                <Typography textAlign='center'>{t('logout')}</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBarStyled>
      <DrawerStyled variant='permanent' anchor='left' open={open} sx={{ gridArea: 'drawer', '& .MuiDrawer-paper': { height: '100%', boxSizing: 'border-box' } }}>
        <DrawerHeader sx={{ 
          borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
          background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.05) 0%, rgba(0, 0, 0, 0) 100%)',
        }}>
          <IconButton 
            onClick={handleDrawerClose}
            sx={{
              color: '#FFD700',
              '&:hover': {
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {isRTL ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider sx={{ borderColor: 'rgba(255, 215, 0, 0.1)' }} />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  borderRadius: '8px',
                  margin: '4px 8px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    '& .MuiListItemIcon-root': {
                      color: '#FFD700',
                    },
                    '& .MuiListItemText-primary': {
                      color: '#FFD700',
                    },
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 215, 0, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 215, 0, 0.3)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: '#FFD700',
                    },
                    '& .MuiListItemText-primary': {
                      color: '#FFD700',
                      fontWeight: 'bold',
                    },
                  },
                }}
                onClick={() => handleNavigate(item.path)}
                selected={window.location.pathname === item.path}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    // إزالة الهامش الجانبي لتقليل أي فراغ بصري
                    marginInlineEnd: 0,
                    justifyContent: 'center',
                    color: window.location.pathname === item.path ? '#FFD700' : 'inherit',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    opacity: open ? 1 : 0,
                    '& .MuiTypography-root': {
                      color: window.location.pathname === item.path ? '#FFD700' : 'inherit',
                      fontWeight: window.location.pathname === item.path ? 'bold' : 'normal',
                      transition: 'color 0.3s ease, font-weight 0.3s ease',
                    },
                  }} 
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DrawerStyled>
      <MainContent component='main' open={open} sx={{ gridArea: 'content', height: '100dvh', minHeight: 0, overflowX: 'hidden', overflowY: 'auto' }}>
        <DrawerHeader />
        <Outlet />
      </MainContent>
    </Box>
  );
};

export default MainLayout;