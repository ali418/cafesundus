import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Container, Paper, Typography, Grid } from '@mui/material';
import { useSelector } from 'react-redux';
import { selectStoreSettings } from '../../redux/slices/settingsSlice';

const AuthLayout = () => {
  const { t } = useTranslation('common');
  const storeSettings = useSelector(selectStoreSettings);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" component="div">
          {storeSettings?.name || t('appName')}
        </Typography>
      </Box>

      {/* Main content */}
      <Container component="main" maxWidth="sm" sx={{ mb: 4, flexGrow: 1, display: 'flex', alignItems: 'center' }}>
        <Grid container justifyContent="center" alignItems="center">
          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, md: 4 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: 2,
              }}
            >
              <Outlet />
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          textAlign: 'center',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {(storeSettings?.name || t('appName'))} © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthLayout;