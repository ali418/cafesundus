import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Alert, Snackbar, CircularProgress } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import rtlPlugin from 'stylis-plugin-rtl';

// Auth Service
import { initAuthFromStorage } from './services/authService';

// Layout Components
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth Pages - Small components, no need for lazy loading
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Main Pages - Lazy loaded for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/products/Products'));
const ProductForm = lazy(() => import('./pages/products/ProductForm'));
const Categories = lazy(() => import('./pages/products/Categories'));
const POS = lazy(() => import('./pages/sales/POS'));
const Sales = lazy(() => import('./pages/sales/Sales'));
const SaleDetails = lazy(() => import('./pages/sales/SaleDetails'));
// const Invoices = lazy(() => import('./pages/sales/Invoices'));
// const InvoiceForm = lazy(() => import('./pages/sales/InvoiceForm'));
// const Inventory = lazy(() => import('./pages/inventory/Inventory'));
// const StockAdjustment = lazy(() => import('./pages/inventory/StockAdjustment'));
const Customers = lazy(() => import('./pages/customers/Customers'));
const CustomerForm = lazy(() => import('./pages/customers/CustomerForm'));
const OnlineOrder = lazy(() => import('./pages/online/OnlineOrder'));
const OnlineOrderNotifications = lazy(() => import('./pages/online/OnlineOrderNotifications'));
const QRCodePage = lazy(() => import('./pages/online/QRCodePage'));
const Reports = lazy(() => import('./pages/reports/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const UpdateSettings = lazy(() => import('./pages/UpdateSettings'));
const Profile = lazy(() => import('./pages/Profile'));
const Users = lazy(() => import('./pages/users/Users'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading component for suspense fallback
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </div>
);

// Utilities
import { selectThemeMode, setThemeMode } from './redux/slices/settingsSlice';
import { selectIsAuthenticated, login } from './redux/slices/authSlice';
import { fetchSettings } from './redux/slices/settingsSlice';
import './i18n/i18n'; // Import i18n configuration

const App = () => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const themeMode = useSelector(selectThemeMode);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [currentLanguage, setCurrentLanguage] = React.useState(i18n.language);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [authError, setAuthError] = React.useState('');
  const [showAuthError, setShowAuthError] = React.useState(false);
  
  // Initialize authentication state from localStorage on app startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          console.log("No auth token found - user needs to login");
          setAuthChecked(true);
          return;
        }

        // Additional validation could be added here (API call to verify token)
        const { isAuthenticated: storedAuth, user } = initAuthFromStorage();
        if (storedAuth && user) {
          // Hydrate Redux store with user from storage
          dispatch(login(user));
        } else if (!user && token) {
          // Token exists but no user data - potential corruption
          throw new Error("بيانات الجلسة تالفة. الرجاء إعادة تسجيل الدخول.");
        }
      } catch (err) {
        console.error("خطأ في التحقق من الجلسة:", err);
        setAuthError(`حدث خطأ: ${err.message}`);
        setShowAuthError(true);
        // Clear corrupted auth data
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_refresh_token");
        localStorage.removeItem("auth_user");
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [dispatch]);
  
  // Fetch settings on initial mount for branding (works on public routes too)
  React.useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);
  
  // Update current language when i18n.language changes
  React.useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  // Create emotion cache for RTL support
  const [cacheRtl, setCacheRtl] = React.useState(null);
  const [cacheLtr, setCacheLtr] = React.useState(null);

  React.useEffect(() => {
    const ltrCache = createCache({
      key: 'mui-ltr',
      prepend: true,
    });

    const rtlCache = createCache({
      key: 'mui-rtl',
      prepend: true,
      stylisPlugins: [rtlPlugin],
    });

    setCacheLtr(ltrCache);
    setCacheRtl(rtlCache);
  }, []);
  
  // Create theme based on theme mode and language
  const theme = React.useMemo(() => {
    const isRTL = currentLanguage && currentLanguage.startsWith('ar');
    return createTheme({
      direction: isRTL ? 'rtl' : 'ltr', // RTL for Arabic, LTR for other languages
      palette: {
        mode: themeMode,
        primary: {
          main: '#000000', // تغيير من اللون الأخضر إلى الأسود
          light: '#333333',
          dark: '#000000',
          contrastText: '#ffffff'
        },
        secondary: {
          main: '#FFD700', // اللون الذهبي الكلاسيكي (Gold)
          light: '#FFFF00',
          dark: '#FFA000',
          contrastText: '#000000'
        },
        background: {
          default: '#ffffff',
          paper: '#f8f9fa'
        },
        text: {
          primary: '#212529',
          secondary: '#6c757d'
        }
      },
      typography: {
        fontFamily: isRTL 
          ? '"Tajawal", "Roboto", "Helvetica", "Arial", sans-serif' 
          : '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: 14,
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              direction: isRTL ? 'rtl' : 'ltr'
            }
          }
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 4
            }
          }
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 8
            }
          }
        }
      }
    });
  }, [currentLanguage, themeMode]);

  // Set document direction based on language - only on initial load
  useEffect(() => {
    // console.log(`Initial language setup: ${i18n.language}`);
    // Get preferred language from localStorage or use default
    const preferredLanguage = localStorage.getItem('preferredLanguage') || localStorage.getItem('language');
    
    // Only change language if it's different from current language
    if (preferredLanguage && preferredLanguage !== i18n.language) {
      // Use the promise returned by changeLanguage to ensure translations are loaded
      i18n.changeLanguage(preferredLanguage).then(() => {
        // console.log(`Language changed to ${preferredLanguage} and translations loaded successfully`);
      }).catch(error => {
        console.error(`Error changing language to ${preferredLanguage}:`, error);
      });
    }
    
    // Initial direction setup is now handled by i18n.js and LanguageSwitcher.jsx
  }, []); // Empty dependency array - only run once on mount

  // Persist theme mode across refresh: hydrate from localStorage on first load
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('themeMode');
      if (savedMode === 'dark' || savedMode === 'light') {
        if (savedMode !== themeMode) {
          dispatch(setThemeMode(savedMode));
        }
      }
    } catch (e) {
      // ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save theme mode to localStorage whenever it changes
  useEffect(() => {
    try {
      if (themeMode) {
        localStorage.setItem('themeMode', themeMode);
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [themeMode]);

  // Listen for language change events
  useEffect(() => {
    const handleLanguageChanged = (event) => {
      // console.log("Language changed event received in App.jsx:", event.detail);
      // Force re-render by updating the currentLanguage state
      if (event.detail && event.detail.language) {
        setCurrentLanguage(event.detail.language);
      }
      
      // Apply font family directly to body with !important to ensure it takes precedence
      if (event.detail.isRTL) {
        document.body.setAttribute('style', "font-family: 'Tajawal', sans-serif !important");
      } else {
        document.body.setAttribute('style', "font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif !important");
      }
      
      // Log font loading status
      if (event.detail.fontLoaded === false) {
        console.error('Font loading failed:', event.detail.error);
      }
      
      // Log translation loading status
      if (event.detail.translationsLoaded === false) {
        console.error('Translation loading failed:', event.detail.error);
      }
      
      // Reload all translations to ensure they are properly loaded
      if (window.i18n && typeof window.i18n.reloadAllTranslations === 'function') {
        // console.log('Reloading all translations after language change...');
        window.i18n.reloadAllTranslations(event.detail.language);
      }
    };
    
    // Listen for i18n errors
    const handleI18nError = (event) => {
      console.error("i18n error detected in App.jsx:", event.detail);
    };
    
    // Listen for successful loading of all namespaces
    const handleAllNamespacesLoaded = (event) => {
      // console.log("All namespaces loaded successfully:", event.detail);
      // Force re-render to ensure all translations are applied
      setCurrentLanguage(prev => prev === event.detail.language ? prev + '_refresh' : event.detail.language);
    };

    window.addEventListener('languageChanged', handleLanguageChanged);
    window.addEventListener('i18nError', handleI18nError);
    window.addEventListener('i18nAllNamespacesLoaded', handleAllNamespacesLoaded);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChanged);
      window.removeEventListener('i18nError', handleI18nError);
      window.removeEventListener('i18nAllNamespacesLoaded', handleAllNamespacesLoaded);
    };
  }, []);

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (!authChecked) {
      // Avoid redirecting before auth is initialized
      return null;
    }
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Role-based protected route component
  const RoleProtectedRoute = ({ children, allowedRoles }) => {
    const user = useSelector(state => state.auth.user);
    
    if (!authChecked) {
      // Avoid redirecting before auth is initialized
      return null;
    }
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    if (!user || !allowedRoles.includes(user.role)) {
      // Redirect cashiers to POS, others to dashboard
      if (user && user.role && user.role.toLowerCase() === 'cashier') {
        return <Navigate to="/pos" replace />;
      }
      // Redirect to dashboard if user doesn't have required role
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  // Use appropriate cache based on language direction
  const cache = (currentLanguage && currentLanguage.startsWith('ar')) ? cacheRtl : cacheLtr;

  if (!cache) {
    return null; // Loading state while cache is being created
  }

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastContainer 
          position="top-left"
          autoClose={5000}
          rtl={i18n.language && i18n.language.startsWith('ar')}
        />
        <Snackbar
          open={showAuthError}
          autoHideDuration={6000}
          onClose={() => setShowAuthError(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setShowAuthError(false)} severity="error" sx={{ width: '100%' }}>
            {authError || 'حدث خطأ غير متوقع أثناء التحقق من الجلسة.'}
          </Alert>
        </Snackbar>
        <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>
            
            {/* Main Routes - Wrapped with Suspense for lazy loading */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager', 'storekeeper', 'accountant', 'staff']}>
                  <Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>
                </RoleProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager', 'storekeeper', 'accountant', 'staff']}>
                  <Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>
                </RoleProtectedRoute>
              } />
              <Route path="/products" element={<Suspense fallback={<LoadingFallback />}><Products /></Suspense>} />
              <Route path="/products/add" element={<Suspense fallback={<LoadingFallback />}><ProductForm /></Suspense>} />
              <Route path="/products/edit/:id" element={<Suspense fallback={<LoadingFallback />}><ProductForm /></Suspense>} />
              <Route path="/categories" element={<Suspense fallback={<LoadingFallback />}><Categories /></Suspense>} />
              <Route path="/pos" element={<Suspense fallback={<LoadingFallback />}><POS /></Suspense>} />
              <Route path="/sales" element={<Suspense fallback={<LoadingFallback />}><Sales /></Suspense>} />
              <Route path="/sales/:id" element={<Suspense fallback={<LoadingFallback />}><SaleDetails /></Suspense>} />
              {/* Removed: Invoices routes */}
              {/* <Route path="/invoices" element={<Suspense fallback={<LoadingFallback />}><Invoices /></Suspense>} /> */}
              {/* <Route path="/invoices/add" element={<Suspense fallback={<LoadingFallback />}><InvoiceForm /></Suspense>} /> */}
              {/* <Route path="/invoices/edit/:id" element={<Suspense fallback={<LoadingFallback />}><InvoiceForm /></Suspense>} /> */}
              <Route path="/customers" element={<Suspense fallback={<LoadingFallback />}><Customers /></Suspense>} />
              <Route path="/customers/add" element={<Suspense fallback={<LoadingFallback />}><CustomerForm /></Suspense>} />
              <Route path="/customers/edit/:id" element={<Suspense fallback={<LoadingFallback />}><CustomerForm /></Suspense>} />
              {/* Removed: Inventory routes */}
              {/* <Route path="/inventory" element={<Suspense fallback={<LoadingFallback />}><Inventory /></Suspense>} /> */}
              {/* <Route path="/inventory/adjust" element={<Suspense fallback={<LoadingFallback />}><StockAdjustment /></Suspense>} /> */}
              <Route path="/reports" element={<Suspense fallback={<LoadingFallback />}><Reports /></Suspense>} />
              <Route path="/settings" element={<Suspense fallback={<LoadingFallback />}><Settings /></Suspense>} />
              <Route path="/update-settings" element={<Suspense fallback={<LoadingFallback />}><UpdateSettings /></Suspense>} />
              <Route path="/profile" element={<Suspense fallback={<LoadingFallback />}><Profile /></Suspense>} />
              <Route path="/users" element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<LoadingFallback />}><Users /></Suspense>
                </RoleProtectedRoute>
              } />
              <Route path="/online/notifications" element={
                <RoleProtectedRoute allowedRoles={['admin', 'cashier']}>
                  <Suspense fallback={<LoadingFallback />}><OnlineOrderNotifications /></Suspense>
                </RoleProtectedRoute>
              } />
            </Route>
            
            {/* Online Order Routes - Public */}
             <Route path="/online-order" element={<Suspense fallback={<LoadingFallback />}><OnlineOrder /></Suspense>} />
             <Route path="/qr-code" element={<Suspense fallback={<LoadingFallback />}><QRCodePage /></Suspense>} />
            
            {/* 404 Route */}
            <Route path="*" element={<Suspense fallback={<LoadingFallback />}><NotFound /></Suspense>} />
        </Routes>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default App;