import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  Avatar,
  Button,
  TextField,
  Link,
  Grid,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LockOutlined as LockOutlinedIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';

// Redux actions
import {
  resetPasswordRequest,
  resetPasswordSuccess,
  resetPasswordFailure,
  selectAuthLoading,
  selectAuthError,
} from '../../redux/slices/authSlice';

const ResetPassword = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Set document title
  useEffect(() => {
    document.title = t('pageTitle.resetPassword');
  }, [t]);
  
  // Get token from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  
  // Redirect if no token is provided
  useEffect(() => {
    if (!token) {
      navigate('/forgot-password');
    }
  }, [token, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (formData.password !== formData.confirmPassword) {
      dispatch(resetPasswordFailure(t('passwordsDontMatch')));
      return;
    }
    
    if (formData.password.length < 6) {
      dispatch(resetPasswordFailure(t('passwordTooShort')));
      return;
    }
    
    dispatch(resetPasswordRequest());
    
    try {
      // In a real application, this would be an API call with the token
      // For demo purposes, we'll simulate a successful reset after a delay
      setTimeout(() => {
        // Simulate successful password reset
        dispatch(resetPasswordSuccess());
        setSubmitted(true);
      }, 1500);
    } catch (err) {
      dispatch(resetPasswordFailure(err.message || t('resetFailed')));
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
        <LockOutlinedIcon />
      </Avatar>
      <Typography component="h1" variant="h5">
        {t('resetPassword')}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
          {error}
        </Alert>
      )}
      
      {submitted ? (
        <Box sx={{ mt: 3, width: '100%', textAlign: 'center' }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('passwordResetSuccessful')}
          </Alert>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('canNowLogin')}
          </Typography>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            sx={{ mt: 2 }}
          >
            {t('backToLogin')}
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label={t('newPassword')}
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label={t('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={handleClickShowConfirmPassword}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : t('auth:resetPassword')}
          </Button>
          <Grid container justifyContent="center">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                {t('auth:backToLogin')}
              </Link>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ResetPassword;