import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../api/apiService';

const initialState = {
  themeMode: 'light',
  language: 'ar',
  store: {
    name: 'cafe sundus',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    website: '',
    taxRate: 0,
    currencyCode: 'UGX',
    currencySymbol: 'UGX',
    logoUrl: null,
    // New invoice/receipt settings in store branch for easy consumption
    invoicePrefix: 'INV',
    invoiceSuffix: '',
    invoiceNextNumber: 1001,
    invoiceShowLogo: true,
    invoiceShowTaxNumber: true,
    invoiceShowSignature: true,
    invoiceFooterText: 'Thank you for your business!',
    invoiceTerms: 'All sales are final. Returns accepted within 30 days with receipt.',
    receiptShowLogo: true,
    receiptShowTaxDetails: true,
    receiptPrintAutomatically: false,
    receiptFooterText: 'Thank you for shopping with us!',
    // Payment phone numbers (admin-configured)
    mtnPhoneNumber: '',
    airtelPhoneNumber: '',
    mobilePinDigits: 4,
    // NEW: show QR for online orders on receipts
    receiptShowOnlineOrderQR: false,
  },
  status: 'idle',
  error: null,
};

export const fetchSettings = createAsyncThunk('settings/fetchSettings', async () => {
  const res = await apiService.getSettings();
  return res; // expected shape matches backend
});

export const updateSettings = createAsyncThunk('settings/updateSettings', async (payload) => {
  const res = await apiService.updateSettings(payload);
  return res;
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setThemeMode: (state, action) => {
      state.themeMode = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    setStore: (state, action) => {
      state.store = { ...state.store, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        const s = action.payload;
        // Map backend (snake_case) to frontend (camelCase)
        state.store = {
          name: s.store_name,
          email: s.email || '',
          phone: s.phone || '',
          address: s.address || '',
          city: s.city || '',
          state: s.state || '',
          postalCode: s.postal_code || '',
          country: s.country || '',
          website: s.website || '',
          taxRate: s.tax_rate || 0,
          currencyCode: s.currency_code,
          currencySymbol: s.currency_symbol,
          logoUrl: s.logo_url || null,
          // New invoice/receipt
          invoicePrefix: s.invoice_prefix || 'INV',
          invoiceSuffix: s.invoice_suffix || '',
          invoiceNextNumber: s.invoice_next_number || 1001,
          invoiceShowLogo: s.invoice_show_logo ?? true,
          invoiceShowTaxNumber: s.invoice_show_tax_number ?? true,
          invoiceShowSignature: s.invoice_show_signature ?? true,
          invoiceFooterText: s.invoice_footer_text || 'Thank you for your business!',
          invoiceTerms: s.invoice_terms_and_conditions || 'All sales are final. Returns accepted within 30 days with receipt.',
          receiptShowLogo: s.receipt_show_logo ?? true,
          receiptShowTaxDetails: s.receipt_show_tax_details ?? true,
          receiptPrintAutomatically: s.receipt_print_automatically ?? false,
          receiptFooterText: s.receipt_footer_text || 'Thank you for shopping with us!',
          // Payment phone numbers
          mtnPhoneNumber: s.mtn_phone_number || '',
          airtelPhoneNumber: s.airtel_phone_number || '',
          mobilePinDigits: s.mobile_pin_digits || 4,
          // NEW
          receiptShowOnlineOrderQR: s.receipt_show_online_order_qr ?? false,
        };
        if (s.language) {
          state.language = s.language;
        }
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error?.message || 'Failed to load settings';
      })
      .addCase(updateSettings.pending, (state) => {
        state.status = 'saving';
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const s = action.payload;
        state.store = {
          name: s.store_name,
          email: s.email || '',
          phone: s.phone || '',
          address: s.address || '',
          city: s.city || '',
          state: s.state || '',
          postalCode: s.postal_code || '',
          country: s.country || '',
          website: s.website || '',
          taxRate: s.tax_rate || 0,
          currencyCode: s.currency_code,
          currencySymbol: s.currency_symbol,
          logoUrl: s.logo_url || null,
          // New invoice/receipt
          invoicePrefix: s.invoice_prefix || 'INV',
          invoiceSuffix: s.invoice_suffix || '',
          invoiceNextNumber: s.invoice_next_number || 1001,
          invoiceShowLogo: s.invoice_show_logo ?? true,
          invoiceShowTaxNumber: s.invoice_show_tax_number ?? true,
          invoiceShowSignature: s.invoice_show_signature ?? true,
          invoiceFooterText: s.invoice_footer_text || 'Thank you for your business!',
          invoiceTerms: s.invoice_terms_and_conditions || 'All sales are final. Returns accepted within 30 days with receipt.',
          receiptShowLogo: s.receipt_show_logo ?? true,
          receiptShowTaxDetails: s.receipt_show_tax_details ?? true,
          receiptPrintAutomatically: s.receipt_print_automatically ?? false,
          receiptFooterText: s.receipt_footer_text || 'Thank you for shopping with us!',
          // Payment phone numbers
          mtnPhoneNumber: s.mtn_phone_number || '',
          airtelPhoneNumber: s.airtel_phone_number || '',
          mobilePinDigits: s.mobile_pin_digits || 4,
          // NEW
          receiptShowOnlineOrderQR: s.receipt_show_online_order_qr ?? false,
        };
        if (s.language) {
          state.language = s.language;
        }
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error?.message || 'Failed to save settings';
      });
  }
});

export const { setThemeMode, setLanguage, setStore } = settingsSlice.actions;

// Selectors
export const selectThemeMode = (state) => state.settings.themeMode;
export const selectLanguage = (state) => state.settings.language;
export const selectStoreSettings = (state) => state.settings.store;
export const selectCurrency = (state) => ({ code: state.settings.store.currencyCode, symbol: state.settings.store.currencySymbol });

export default settingsSlice.reducer;