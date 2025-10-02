import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Get user language preference from localStorage or default to 'en'
 // Default to Arabic if no saved preference is found
const savedLanguage = localStorage.getItem('language') || localStorage.getItem('preferredLanguage') || 'ar';

// Create a global variable to track translation loading errors
window.i18nErrors = {
  loadingErrors: [],
  lastError: null,
  hasErrors: false
};

// Function to handle translation loading errors
const handleTranslationError = (error, lng, ns) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    language: lng,
    namespace: ns,
    message: error.message || 'Unknown error',
    status: error.status || 'unknown',
    details: error
  };
  
  console.error(`Translation loading error for ${lng}/${ns}:`, error);
  
  // Store error information
  window.i18nErrors.loadingErrors.push(errorInfo);
  window.i18nErrors.lastError = errorInfo;
  window.i18nErrors.hasErrors = true;
  
  // Dispatch an event for error handling
  window.dispatchEvent(new CustomEvent('i18nError', { detail: errorInfo }));
  
  // Try to reload the namespace after a short delay
  setTimeout(() => {
    console.log(`Attempting to reload namespace ${ns} for language ${lng}...`);
    i18n.loadNamespaces([ns]).then(() => {
      console.log(`Successfully reloaded namespace ${ns} for language ${lng}`);
    }).catch(reloadError => {
      console.error(`Failed to reload namespace ${ns} for language ${lng}:`, reloadError);
    });
  }, 1000);
  
  return errorInfo;
};

// Initialize i18next
i18n
  // Load translations from /public/locales
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Default language
    fallbackLng: 'en',
    // Use saved language or detected language
    lng: savedLanguage,
    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',
    // Namespace for translations
    ns: ['common', 'auth', 'dashboard', 'products', 'sales', 'customers', 'inventory', 'reports', 'notFound', 'profile', 'users', 'online'],
    defaultNS: 'common',

    // ✨ الإضافة المهمة: تحميل اللغات مسبقًا
    preload: ['en', 'ar'],

    // Interpolation configuration
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // React configuration
    react: {
      useSuspense: true, // Enable suspense to handle loading translations
      bindI18n: 'languageChanged loaded', // Events that trigger a re-render
    },
    // Backend configuration
    backend: {
      // Path to load translations from - use absolute path to ensure correct loading
      loadPath: `${window.location.origin}/locales/{{lng}}/{{ns}}.json`,
      // Add request options to handle CORS and caching
      requestOptions: {
        cache: 'no-cache', // Prevent caching to ensure fresh translations
        mode: 'cors',
      },
    },

    // Ensure language is loaded before rendering
    initImmediate: false,
    // Retry loading translations if they fail
    retry: true,
    // Fallback to key if translation is missing
    returnNull: false,
    returnEmptyString: false,
    // Add saveMissing to collect missing translations
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.warn(`i18next::translator: missingKey ${lng} ${ns} ${key} ${fallbackValue}`);
    }
  });

// Add event listeners for translation loading
i18n.on('failedLoading', (lng, ns, msg) => {
  handleTranslationError({ message: msg }, lng, ns);
});

i18n.store.on('added', (lng, ns) => {
  console.log(`Translation namespace ${ns} for language ${lng} loaded successfully`);
  // Dispatch an event for successful loading
  window.dispatchEvent(new CustomEvent('i18nNamespaceLoaded', { 
    detail: { language: lng, namespace: ns } 
  }));
});

i18n.store.on('failed', (lng, ns, msg) => {
  handleTranslationError({ message: msg }, lng, ns);
});

// Helper function to manually reload all namespaces
export const reloadAllTranslations = (language) => {
  const namespaces = ['common', 'auth', 'dashboard', 'products', 'sales', 'customers', 'inventory', 'reports', 'notFound', 'profile'];
  const currentLang = language || i18n.language;
  console.log(`Manually reloading all namespaces for language: ${currentLang}`);
  
  return i18n.loadNamespaces(namespaces).then(() => {
    console.log(`Successfully reloaded all namespaces for language: ${currentLang}`);
    // Dispatch an event for successful loading of all namespaces
    window.dispatchEvent(new CustomEvent('i18nAllNamespacesLoaded', { 
      detail: { language: currentLang, namespaces: namespaces } 
    }));
    return true;
  }).catch(error => {
    console.error(`Failed to reload namespaces for language: ${currentLang}`, error);
    return false;
  });
};

// Make reloadAllTranslations available globally
window.i18n = window.i18n || {};
window.i18n.reloadAllTranslations = reloadAllTranslations;

// Function to set document direction based on language
export const setDocumentDirection = (language) => {
  const isRTL = language && language.startsWith('ar');
  
  if (isRTL) {
    // Set RTL direction for Arabic - fix to ensure proper RTL rendering
    document.dir = 'rtl';
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
    document.documentElement.setAttribute('dir', 'rtl');
    document.body.dir = 'rtl'; // Add body dir for better compatibility
    
    // Load Arabic font if needed - improved method with preload
    if (!document.getElementById('tajawal-font')) {
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
        
        // Add onload and onerror handlers
        fontLink.onload = () => {
          console.log('Arabic font (Tajawal) loaded successfully');
          // Apply font immediately
          document.body.style.fontFamily = '"Tajawal", "Roboto", "Helvetica", "Arial", sans-serif';
        };
        
        fontLink.onerror = (error) => {
          console.error('Error loading Arabic font:', error);
          // Fallback to system Arabic fonts
          document.body.style.fontFamily = '"Arial", "Tahoma", sans-serif';
        };
        
        document.head.appendChild(fontLink);
      } catch (error) {
        console.error('Error setting up Arabic font:', error);
      }
    } else {
      // Font link already exists, apply font directly
      document.body.style.fontFamily = '"Tajawal", "Roboto", "Helvetica", "Arial", sans-serif';
    }
    console.log(`Direction set to RTL for Arabic`);
  } else {
    // Set LTR direction for other languages
    document.dir = 'ltr';
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = language;
    document.documentElement.setAttribute('dir', 'ltr');
    document.body.dir = 'ltr'; // Add body dir for better compatibility
    // Apply default font
    document.body.style.fontFamily = '"Roboto", "Helvetica", "Arial", sans-serif';
    console.log(`Direction set to LTR for ${language}`);
  }
};

// Set initial document direction
setDocumentDirection(i18n.language);

// Listen for language changes
i18n.on('languageChanged', (lng) => {
  // Save language preference to localStorage
  localStorage.setItem('language', lng);
  localStorage.setItem('preferredLanguage', lng);
  
  // Set document direction based on the selected language
  setDocumentDirection(lng);
  console.log(`Language changed to ${lng} in i18n.js`);
  
  // Apply font family to body element directly
  if (lng === 'ar') {
    document.body.style.fontFamily = '"Tajawal", "Roboto", "Helvetica", "Arial", sans-serif';
  } else {
    document.body.style.fontFamily = '"Roboto", "Helvetica", "Arial", sans-serif';
  }
  
  // Dispatch custom event for other components to react
  // Include isRTL flag and font information in the event detail
  window.dispatchEvent(new CustomEvent('languageChanged', { 
    detail: { 
      language: lng,
      isRTL: lng && lng.startsWith('ar'),
      fontFamily: (lng && lng.startsWith('ar')) ? 'Tajawal' : 'Roboto'
    } 
  }));
});

export default i18n;