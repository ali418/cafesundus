import { createSlice } from '@reduxjs/toolkit';
import { clearAuthData } from '../../services/authService';

const initialState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  forgotPassword: {
    loading: false,
    success: false,
    error: null
  },
  resetPassword: {
    loading: false,
    success: false,
    error: null
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
    },
    logout: (state) => {
      // Clear authentication data from localStorage
      clearAuthData();
      // Update state
      state.isAuthenticated = false;
      state.user = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    forgotPasswordRequest: (state) => {
      state.forgotPassword.loading = true;
      state.forgotPassword.success = false;
      state.forgotPassword.error = null;
    },
    forgotPasswordSuccess: (state) => {
      state.forgotPassword.loading = false;
      state.forgotPassword.success = true;
      state.forgotPassword.error = null;
    },
    forgotPasswordFailure: (state, action) => {
      state.forgotPassword.loading = false;
      state.forgotPassword.success = false;
      state.forgotPassword.error = action.payload;
    },
    resetPasswordRequest: (state) => {
      state.resetPassword.loading = true;
      state.resetPassword.success = false;
      state.resetPassword.error = null;
    },
    resetPasswordSuccess: (state) => {
      state.resetPassword.loading = false;
      state.resetPassword.success = true;
      state.resetPassword.error = null;
    },
    resetPasswordFailure: (state, action) => {
      state.resetPassword.loading = false;
      state.resetPassword.success = false;
      state.resetPassword.error = action.payload;
    },
  },
});

export const {
  login,
  logout,
  setLoading,
  setError,
  forgotPasswordRequest,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  resetPasswordRequest,
  resetPasswordSuccess,
  resetPasswordFailure,
} = authSlice.actions;

// Selectors
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
// Aliases for backward compatibility
export const selectLoading = (state) => state.auth.loading;
export const selectError = (state) => state.auth.error;

export default authSlice.reducer;