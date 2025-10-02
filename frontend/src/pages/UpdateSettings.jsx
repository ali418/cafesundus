import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateSettings } from '../redux/slices/settingsSlice';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UpdateSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const updateDatabaseSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const payload = {
        currency_code: 'UGX',
        currency_symbol: 'UGX'
      };
      
      // Try to update using Redux first
      try {
        await dispatch(updateSettings(payload)).unwrap();
      } catch (reduxError) {
        console.log('Redux update failed, trying direct API call', reduxError);
        
        // Fallback to direct API call if Redux fails
        const token = localStorage.getItem('auth_token');
        await axios.put('/api/v1/settings', payload, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (e) {
      console.error('Failed to update settings', e);
      setError(e.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateDatabaseSettings();
  }, []);

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <Typography variant="h4" gutterBottom>
        تحديث إعدادات العملة
      </Typography>
      
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            جاري تحديث إعدادات العملة...
          </Typography>
        </Box>
      )}
      
      {error && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="error">
            {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={updateDatabaseSettings}
          >
            إعادة المحاولة
          </Button>
        </Box>
      )}
      
      {success && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="success.main">
            تم تحديث إعدادات العملة بنجاح!
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/dashboard')}
          >
            العودة إلى لوحة التحكم
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default UpdateSettings;