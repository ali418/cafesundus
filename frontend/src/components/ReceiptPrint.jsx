import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import QRCodeWrapper from './QRCodeWrapper';

const ReceiptPrint = ({ 
  receiptData, 
  cartItems, 
  selectedCustomer, 
  currentUser, 
  storeSettings, 
  currency, 
  subtotal, 
  tax, 
  taxRatePercent, 
  total, 
  amountPaid, 
  change, 
  paymentMethod,
  onPrintComplete 
}) => {
  const { t } = useTranslation();

  // هذا الـ useEffect سيعمل بمجرد أن يتم render للكومبوننت في الـ DOM
  useEffect(() => {
    // إعطاء React وقت قصير لإنهاء الـ render
    const printTimer = setTimeout(() => {
      window.print();
      
      // استدعاء callback بعد الطباعة (اختياري)
      if (onPrintComplete) {
        onPrintComplete();
      }
    }, 100);

    // تنظيف الـ timer عند unmount
    return () => clearTimeout(printTimer);
  }, []); // [] يعني أنه سيعمل مرة واحدة فقط عند الـ mount

  return (
    <Box id="receipt-to-print">
      <div className="receipt-header">
        {storeSettings?.receiptShowLogo && storeSettings?.logoUrl && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <img src={storeSettings.logoUrl} alt="logo" style={{ maxHeight: 60, objectFit: 'contain' }} />
          </Box>
        )}
        <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
          {storeSettings?.name || t('appName')}
        </Typography>
        <Typography variant="body2" align="center" gutterBottom>
          {[storeSettings?.address, storeSettings?.city, storeSettings?.country].filter(Boolean).join(', ')}
        </Typography>
        {storeSettings?.phone && (
          <Typography variant="body2" align="center" gutterBottom>
            Tel: {storeSettings.phone}
          </Typography>
        )}
        
        <Typography variant="subtitle2" align="center" gutterBottom>
          {t('sales:receiptNumber')}: {receiptData?.receiptNumber || 'INV-9010'}
        </Typography>
        <Typography variant="subtitle2" align="center" gutterBottom>
          {t('sales:date')}: {new Date(receiptData?.createdSale?.createdAt || Date.now()).toLocaleString('ar-EG')}
        </Typography>
        {currentUser && (
          <Typography variant="subtitle2" align="center" gutterBottom>
            {t('sales:cashier')}: {currentUser?.fullName || currentUser?.username || currentUser?.name || 'Admin User'}
          </Typography>
        )}
        <Typography variant="subtitle2" align="center" gutterBottom>
          {t('sales:customer')}: {t(`sales.customers.${selectedCustomer?.name}`, { defaultValue: selectedCustomer?.name || 'walkInCustomer' })}
        </Typography>
      </div>
      
      <div className="receipt-items">
        <Typography variant="subtitle1" align="center" gutterBottom>
          {t('sales:items')}
        </Typography>
        {cartItems.map((item) => (
          <Box key={item.id} sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {item.name} × {item.quantity}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                {currency.symbol} {item.price.toFixed(2)} × {item.quantity}
              </Typography>
              <Typography variant="body2">
                {currency.symbol} {(item.price * item.quantity).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        ))}
      </div>
      
      <div className="receipt-totals">
        <Typography variant="subtitle2" align="right">
          <strong>{t('sales:subtotal')}:</strong> {currency.symbol} {subtotal.toFixed(2)}
        </Typography>
        {storeSettings?.receiptShowTaxDetails && (
          <Typography variant="subtitle2" align="right">
            <strong>{t('sales:tax')} ({taxRatePercent}%):</strong> {currency.symbol} {tax.toFixed(2)}
          </Typography>
        )}
        <Typography variant="subtitle2" align="right">
          <strong>{t('sales:total')}:</strong> {currency.symbol} {total.toFixed(2)}
        </Typography>
      </div>
      
      <div className="receipt-payment-info">
        <Typography variant="subtitle2" align="center">
          <strong>{t('sales:amountPaid')}:</strong> {currency.symbol} {(parseFloat(amountPaid || 0)).toFixed(2)}
        </Typography>
        <Typography variant="subtitle2" align="center">
          <strong>{t('sales:changeAmount')}:</strong> {currency.symbol} {(change > 0 ? change : 0).toFixed(2)}
        </Typography>
        <Typography variant="subtitle2" align="center">
          <strong>{t('sales:paymentMethod')}:</strong> {t(`sales:paymentMethods.${paymentMethod}`)}
        </Typography>
      </div>
      
      <div className="receipt-footer">
        {storeSettings?.invoiceTerms && (
          <Typography
            variant="caption"
            align="center"
            display="block"
            sx={{ whiteSpace: 'pre-line', mb: 1, color: 'text.secondary', fontSize: '0.7rem' }}
          >
            {storeSettings.invoiceTerms}
          </Typography>
        )}
        <Typography variant="body2" align="center" sx={{ fontStyle: 'italic' }}>
          {storeSettings?.receiptFooterText || t('thankYou')}
        </Typography>

        {storeSettings?.receiptShowOnlineOrderQR && (
          <Box sx={{ textAlign: 'center', my: 1 }}>
            <Typography variant="caption" display="block" gutterBottom>
              {t('online:scanQRCode', 'امسح رمز QR للطلب أونلاين')}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <QRCodeWrapper
                value={`${window.location.origin}/online-order`}
                size={120}
                level="M"
                includeMargin
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {t('online:orVisitLink', 'أو قم بزيارة هذا الرابط')}: {`${window.location.origin}/online-order`}
            </Typography>
          </Box>
        )}
      </div>
    </Box>
  );
};

export default ReceiptPrint;