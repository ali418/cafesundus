import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Tooltip, Snackbar, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

// Styled components
const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '& .MuiToggleButtonGroup-grouped': {
    margin: theme.spacing(0.5),
    border: 0,
    '&.Mui-disabled': {
      border: 0,
    },
    '&:not(:first-of-type)': {
      borderRadius: theme.shape.borderRadius,
    },
    '&:first-of-type': {
      borderRadius: theme.shape.borderRadius,
    },
  },
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  '&.MuiToggleButton-root': {
    color: theme.palette.text.secondary,
    textTransform: 'none',
    fontWeight: 500,
    padding: theme.spacing(0.5, 1.5),
    fontSize: '0.875rem',
  },
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation('common');
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Listen for language change events
  useEffect(() => {
    const handleLanguageChanged = (event) => {
      console.log("Language changed event received in LanguageSwitcher:");
      
      // Reset error state on successful language change
      setError(null);
    };
    
    const handleI18nError = (event) => {
      console.error("i18n error detected:", event.detail);
      
      // Set error state and show snackbar
      setError({
        severity: 'error',
        message: `خطأ في تحميل ملفات اللغة: ${event.detail.language}/${event.detail.namespace} - ${event.detail.message}`,
        details: event.detail
      });
      
      setOpenSnackbar(true);
    };

    window.addEventListener('languageChanged', handleLanguageChanged);
    window.addEventListener('i18nError', handleI18nError);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChanged);
      window.removeEventListener('i18nError', handleI18nError);
    };
  }, []);

  const handleLanguageChange = async (event, newLanguage) => {
    if (!newLanguage || newLanguage === i18n.language) return;
    
    try {
      // Reset any previous errors
      setError(null);
      
      console.log(`Changing language to: ${newLanguage}`);
      
      // Save to localStorage first
      localStorage.setItem('preferredLanguage', newLanguage);
      localStorage.setItem('language', newLanguage);
      
      // Define font loading function for reuse
      const loadArabicFont = () => {
        return new Promise((resolve, reject) => {
          if (document.getElementById('tajawal-font')) {
            // Font already loaded
            resolve('Font already loaded');
            return;
          }
          
          try {
            // Create preload link for faster font loading
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'style';
            preloadLink.href = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap';
            document.head.appendChild(preloadLink);
            
            // Create actual stylesheet link
            const fontLink = document.createElement('link');
            fontLink.id = 'tajawal-font';
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap';
            
            fontLink.onload = () => {
              console.log('Arabic font (Tajawal) loaded successfully');
              resolve('Font loaded successfully');
            };
            
            fontLink.onerror = (error) => {
              console.error('Error loading Arabic font:', error);
              reject(error);
            };
            
            document.head.appendChild(fontLink);
            
            // Set a timeout in case the font takes too long to load
            setTimeout(() => {
              if (document.fonts && document.fonts.check) {
                const isFontLoaded = document.fonts.check('12px Tajawal');
                if (isFontLoaded) {
                  resolve('Font loaded via check');
                } else {
                  const err = new Error('Font load timeout');
                  reject(err);
                }
              } else {
                // If document.fonts is not supported, assume it loaded
                resolve('Font assumed loaded (no check support)');
              }
            }, 3000);
          } catch (error) {
            console.error('Error setting up Arabic font:', error);
            reject(error);
          }
        });
      };
      
      // Update document direction based on language
      const isRTL = newLanguage && newLanguage.startsWith('ar');
      document.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = newLanguage;
      document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
      document.body.dir = isRTL ? 'rtl' : 'ltr';
      
      // Set appropriate font family based on language
      const fontFamily = isRTL ? '"Tajawal", "Roboto", "Helvetica", "Arial", sans-serif' : '"Roboto", "Helvetica", "Arial", sans-serif';
      document.body.style.fontFamily = fontFamily;
      
      // Load font if needed and change language
      const fontPromise = isRTL ? loadArabicFont() : Promise.resolve('No font loading needed');
      
      // Import the reloadAllTranslations function if it exists in i18n
      let reloadTranslations = () => Promise.resolve('No reload function available');
      try {
        // Try to dynamically import the reloadAllTranslations function
        if (window.i18n && typeof window.i18n.reloadAllTranslations === 'function') {
          reloadTranslations = window.i18n.reloadAllTranslations;
          console.log('Found reloadAllTranslations function');
        }
      } catch (e) {
        console.warn('Could not import reloadAllTranslations:', e);
      }
      
      // Change language in i18next and reload translations
      // First load the font
      try {
        await fontPromise;
        console.log(`Font loaded for ${newLanguage}`);
      } catch (fontError) {
        console.warn('Font loading issue, but continuing with language change:', fontError);
      }
      
      // Then change the language - this returns a Promise that resolves when translations are loaded
      await i18n.changeLanguage(newLanguage)
        .then(() => {
          console.log(`Language changed to ${newLanguage} and translations loaded via i18n.changeLanguage`);
          
          // After language is changed, reload all translations to ensure everything is loaded
          return reloadTranslations(newLanguage);
        })
        .then(() => {
          console.log(`All translations reloaded for ${newLanguage}`);
          
          // Dispatch a custom event to notify other components
          const event = new CustomEvent('languageChanged', {
            detail: { 
              language: newLanguage, 
              isRTL: isRTL,
              fontFamily: isRTL ? 'Tajawal' : 'Roboto',
              fontLoaded: true,
              translationsLoaded: true
            }
          });
          window.dispatchEvent(event);
          
          // Show success message
          setError({
            severity: 'success',
            message: newLanguage && newLanguage.startsWith('ar') ? 'تم تغيير اللغة إلى العربية بنجاح' : 'Language changed to English successfully',
            details: null
          });
          setOpenSnackbar(true);
        })
        .catch(error => {
          console.error('Error during language change:', error);
          // Still dispatch event but with fontLoaded: false
          const event = new CustomEvent('languageChanged', {
            detail: { 
              language: newLanguage, 
              isRTL: isRTL,
              fontFamily: isRTL ? 'Tajawal' : 'Roboto',
              fontLoaded: false,
              error: error.message
            }
          });
          window.dispatchEvent(event);
          
          throw error; // Re-throw to be caught by outer catch
        });
    } catch (err) {
      console.error('Error changing language:', err);
      
      // Set error state and show snackbar
      setError({
        severity: 'error',
        message: `خطأ في تغيير اللغة: ${err.message}`,
        details: err
      });
      setOpenSnackbar(true);
    }
  };

  // Handle snackbar close
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  // إزالة أدوات الفحص وإعادة التحميل الخاصة بالترجمة (لم نعد نحتاجها)
  // كانت هنا دوال: checkTranslationFiles و reloadTranslations — تم حذفها بناءً على طلب المستخدم

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
      <StyledToggleButtonGroup
        value={i18n.language}
        exclusive
        onChange={handleLanguageChange}
        aria-label="language selector"
      >
        <StyledToggleButton value="ar">
          <Tooltip title={t('language.arabic') || 'العربية'} arrow>
            <span>عربي</span>
          </Tooltip>
        </StyledToggleButton>
        <StyledToggleButton value="en">
          <Tooltip title={t('language.english') || 'English'} arrow>
            <span>English</span>
          </Tooltip>
        </StyledToggleButton>
      </StyledToggleButtonGroup>
      
      {/* تمت إزالة أزرار فحص وإعادة تحميل الترجمات وفق طلب المستخدم */}
      
      {/* Error/Success Snackbar */}
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={error?.severity || 'info'} 
          sx={{ width: '100%' }}
        >
          {error?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LanguageSwitcher;
