import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import i18n, { reloadAllTranslations } from './i18n/i18n';
import App from './App';
import store from './redux/store';
import './index.css';

// Attempt to reload all translations on application startup
if (window.i18n && typeof window.i18n.reloadAllTranslations === 'function') {
  console.log('Reloading all translations on application startup...');
  window.i18n.reloadAllTranslations();
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // Removed React.StrictMode to avoid double-invocation of effects in development
  <Provider store={store}>
    <BrowserRouter>
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>جاري تحميل الترجمات...</div>}>
        <App />
      </Suspense>
    </BrowserRouter>
  </Provider>
);