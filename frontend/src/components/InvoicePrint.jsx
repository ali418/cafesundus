import React, { forwardRef } from 'react';
import { useSelector } from 'react-redux';
import { selectStoreSettings } from '../redux/slices/settingsSlice';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { format } from 'date-fns';

const InvoicePrint = forwardRef(({ invoice }, ref) => {
  const { t } = useTranslation();
  const storeSettings = useSelector(selectStoreSettings);

  if (!invoice) {
    return (
      <Box ref={ref} sx={{ display: 'none' }}>
        <Typography>{t('noInvoiceData')}</Typography>
      </Box>
    );
  }

  // Generate invoice number using settings
  const invoiceNumber = `${storeSettings?.invoicePrefix || 'INV'}${invoice.id}${storeSettings?.invoiceSuffix || ''}`;
  const derivedTaxPercent = invoice?.subtotal ? Number((((invoice.tax || 0) / invoice.subtotal) * 100).toFixed(2)) : 0;
  const taxRatePercent = Number(storeSettings?.taxRate) || derivedTaxPercent;

  return (
    <Box ref={ref} id="receipt-container" className="receipt-container" sx={{ p: 3, maxWidth: '210mm', margin: '0 auto', backgroundColor: 'white', color: 'black' }}>
      <Paper elevation={0} sx={{ p: 0 }}>
        {/* Header Section */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            {storeSettings?.invoiceShowLogo && storeSettings?.logoUrl && (
              <Box sx={{ mb: 2 }}>
                <img 
                  src={storeSettings.logoUrl} 
                  alt="Store Logo" 
                  style={{ maxHeight: 80, objectFit: 'contain' }}
                />
              </Box>
            )}
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
              {storeSettings?.name || t('appName')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {storeSettings?.address && `${storeSettings.address}`}
            </Typography>
            {storeSettings?.city && (
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {[storeSettings.city, storeSettings.state, storeSettings.country].filter(Boolean).join(', ')}
              </Typography>
            )}
            {storeSettings?.phone && (
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {t('phone')}: {storeSettings.phone}
              </Typography>
            )}
            {storeSettings?.email && (
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {t('email')}: {storeSettings.email}
              </Typography>
            )}
            {storeSettings?.invoiceShowTaxNumber && storeSettings?.taxRate > 0 && (
              <Typography variant="body2">
                {t('taxNumber')}: {storeSettings.taxRate}%
              </Typography>
            )}
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
              {t('sales:invoice')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>{t('sales:invoiceNumber')}:</strong> {invoiceNumber}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>{t('date')}:</strong> {format(new Date(invoice.date), 'yyyy-MM-dd')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>{t('sales:dueDate')}:</strong> {format(new Date(invoice.dueDate), 'yyyy-MM-dd')}
            </Typography>
            <Typography variant="body1">
              <strong>{t('status')}:</strong> {t(`sales.invoiceStatus.${invoice.status}`)}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Customer Information */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              {t('sales:billTo')}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {invoice.customer?.name || t('sales:walkInCustomer')}
            </Typography>
            {invoice.customer?.email && (
              <Typography variant="body2">
                {invoice.customer.email}
              </Typography>
            )}
            {invoice.customer?.phone && (
              <Typography variant="body2">
                {invoice.customer.phone}
              </Typography>
            )}
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Typography variant="body1">
              <strong>{t('sales:paymentMethod')}:</strong> {t(`sales.paymentMethods.${invoice.paymentMethod}`)}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Items Table */}
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('products:product')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('quantity')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('unit')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('price')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('total')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell>{item.product?.name || t('unknownProduct')}</TableCell>
                    <TableCell align="center">{item.quantity || 0}</TableCell>
                    <TableCell align="center">{item.product?.unit || 'piece'}</TableCell>
                    <TableCell align="right">
                      {storeSettings?.currencySymbol || '$'}{(item.price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      {storeSettings?.currencySymbol || '$'}{(item.total || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    {t('sales:noItems')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Totals Section */}
        <Grid container justifyContent="flex-end" sx={{ mb: 3 }}>
          <Grid item xs={6} md={4}>
            <Box sx={{ border: '1px solid #ddd', p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">{t('subtotal')}:</Typography>
                <Typography variant="body1">
                  {storeSettings?.currencySymbol || '$'}{(invoice.subtotal || 0).toFixed(2)}
                </Typography>
              </Box>
              {(invoice.tax || 0) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">{t('tax')}{taxRatePercent > 0 ? ` (${taxRatePercent}%)` : ''}:</Typography>
                  <Typography variant="body1">
                    {storeSettings?.currencySymbol || '$'}{(invoice.tax || 0).toFixed(2)}
                  </Typography>
                </Box>
              )}
              {(invoice.discount || 0) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">{t('discount')}:</Typography>
                  <Typography variant="body1">
                    -{storeSettings?.currencySymbol || '$'}{(invoice.discount || 0).toFixed(2)}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {t('total')}:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {storeSettings?.currencySymbol || '$'}{(invoice.total || 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Notes Section */}
        {invoice.notes && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              {t('notes')}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {invoice.notes}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Terms and Conditions */}
        {storeSettings?.invoiceTerms && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              {t('sales:termsAndConditions')}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
              {storeSettings.invoiceTerms}
            </Typography>
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #ddd' }}>
          {storeSettings?.invoiceFooterText && (
            <Typography variant="body2" align="center" sx={{ mb: 2, fontStyle: 'italic' }}>
              {storeSettings.invoiceFooterText}
            </Typography>
          )}
          
          {/* Signature Section */}
          {storeSettings?.invoiceShowSignature && (
            <Grid container spacing={4} sx={{ mt: 3 }}>
              <Grid item xs={6}>
                <Box sx={{ borderBottom: '1px solid #333', mb: 1, height: 40 }} />
                <Typography variant="body2" align="center">
                  {t('sales:customerSignature')}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ borderBottom: '1px solid #333', mb: 1, height: 40 }} />
                <Typography variant="body2" align="center">
                  {t('sales:storeRepresentative')}
                </Typography>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  );
});

InvoicePrint.displayName = 'InvoicePrint';

export default InvoicePrint;