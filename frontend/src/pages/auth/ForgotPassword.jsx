import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  CircularProgress,
  Alert,
} from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';

// Redux actions
import {
  forgotPasswordRequest,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  selectAuthLoading,
  selectAuthError,
} from '../../redux/slices/authSlice';

const ForgotPassword = () => {
  const { t } = useTranslation('auth');
  const dispatch = useDispatch();
  
  // Set document title
  React.useEffect(() => {
    document.title = t('pageTitle.forgotPassword');
  }, [t]);
  
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  
  const handleChange = (e) => {
    setEmail(e.target.value);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      dispatch(forgotPasswordFailure(t('emailRequired')));
      return;
    }
    
    dispatch(forgotPasswordRequest());
    
    try {
      // In a real application, this would be an API call
      // For demo purposes, we'll simulate a successful request after a delay
      setTimeout(() => {
        // Simulate successful password reset email
        dispatch(forgotPasswordSuccess());
        setSubmitted(true);
      }, 1500);
    } catch (err) {
      dispatch(forgotPasswordFailure(err.message || t('resetRequestFailed')));
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
        {t('forgotPassword')}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
          {error}
        </Alert>
      )}
      
      {submitted ? (
        <Box sx={{ mt: 3, width: '100%', textAlign: 'center' }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('passwordResetEmailSent')}
          </Alert>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {t('checkEmailForInstructions')}
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
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('forgotPasswordInstructions')}
          </Typography>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label={t('email')}
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={handleChange}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : t('sendResetLink')}
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

export default ForgotPassword;