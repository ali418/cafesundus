import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Grid,
} from '@mui/material';
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  SentimentDissatisfied as SadIcon,
} from '@mui/icons-material';
import { useEffect } from 'react';

const NotFound = () => {
  const { t, i18n } = useTranslation('notFound');
  const navigate = useNavigate();

  // Update document title based on current language
  useEffect(() => {
    document.title = t('common.pageTitle.notFound', { ns: 'common' });
  }, [i18n.language, t]);

  // Handle navigation to home
  const goToHome = () => {
    navigate('/');
  };

  // Handle navigation back
  const goBack = () => {
    navigate(-1);
  };

  return (
    <Container maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{
          p: 5,
          mt: 10,
          textAlign: 'center',
          borderRadius: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ mb: 4 }}>
          <SadIcon sx={{ fontSize: 100, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h1" component="h1" gutterBottom>
            404
          </Typography>
          <Typography variant="h4" component="h2" gutterBottom sx={{ textAlign: 'center', width: '100%' }}>
            {t('title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {t('message')}
          </Typography>
        </Box>

        <Grid container spacing={2} justifyContent="center">
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<HomeIcon />}
              onClick={goToHome}
              size="large"
            >
              {t('goHome')}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ArrowBackIcon />}
              onClick={goBack}
              size="large"
            >
              {t('goBack')}
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6 }}>
          <Typography variant="body2" color="text.secondary">
            {t('contactSupport')}
          </Typography>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold', mt: 1 }}>
            support@example.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFound;