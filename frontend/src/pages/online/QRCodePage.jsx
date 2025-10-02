import React from 'react';
import { Box, Container, Typography, Paper, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
// import { QRCodeSVG } from 'qrcode.react';
import QRCodeWrapper from '../../components/QRCodeWrapper';

const QRCodePage = () => {
  const { t } = useTranslation(['online']);
  
  // Get the current domain
  const domain = window.location.origin;
  const onlineOrderUrl = `${domain}/online-order`;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          <Grid item xs={12} md={6} sx={{ textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom color="primary" fontWeight="bold" sx={{ textAlign: 'center', width: '100%' }}>
              {t('scanQRCode', 'Scan QR Code')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('scanQRCodeDescription', 'Scan this QR code with your mobile device to access our online ordering page.')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('orVisitLink', 'Or visit this link:')}
            </Typography>
            <Typography 
              variant="body1" 
              component="a" 
              href={onlineOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {onlineOrderUrl}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box 
              sx={{ 
                bgcolor: 'white', 
                p: 3, 
                borderRadius: 4,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                maxWidth: '100%',
                height: 'auto',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  background: 'linear-gradient(45deg, #d4af37, #f5cc7f)',
                  zIndex: -1,
                  borderRadius: 5,
                  opacity: 0.7
                }
              }}
            >
              <QRCodeWrapper 
                value={onlineOrderUrl} 
                size={250}
                level="H"
                includeMargin
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default QRCodePage;