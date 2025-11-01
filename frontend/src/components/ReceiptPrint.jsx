import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import QRCodeWrapper from './QRCodeWrapper';

const ReceiptPrint = ({ receiptData, onPrintFinished }) => {
  const { t } = useTranslation();

  // الـ Hook ده هيشتغل مرة واحدة بس أول ما الكومبوننت يترسم
  useEffect(() => {
    // 3. اطبع الفاتورة
    window.print();

    // 4. بلغ الكومبوننت الأب إن الطباعة خلصت
    // (بنحطها جوه setTimeout صغير عشان نضمن إن نافذة الطباعة قفلت)
    const timer = setTimeout(() => {
      onPrintFinished();
    }, 100); // 100 ميلي ثانية كافية

    // (Cleanup function)
    return () => clearTimeout(timer);
  }, []); // [] معناها: اشتغل مرة واحدة بس

  // هنا تصميم الفاتورة نفسها

  return (
    <Box id="receipt-to-print"> {/* اتأكد إن الـ ID ده مطابق للـ CSS */}
      <div className="receipt-header">
        {receiptData?.storeSettings?.receiptShowLogo && receiptData?.storeSettings?.logoUrl && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <img src={receiptData.storeSettings.logoUrl} alt="logo" style={{ maxHeight: 60, objectFit: 'contain' }} />
          </Box>
        )}
        <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
          {receiptData?.storeSettings?.name || t('appName')}
        </Typography>
        <Typography variant="body2" align="center" gutterBottom>
          {[receiptData?.storeSettings?.address, receiptData?.storeSettings?.city, receiptData?.storeSettings?.country].filter(Boolean).join(', ')}
        </Typography>
        {receiptData?.storeSettings?.phone && (
          <Typography variant="body2" align="center" gutterBottom>
            Tel: {receiptData.storeSettings.phone}
          </Typography>
        )}
        
        <Typography variant="subtitle2" align="center" gutterBottom>
          {t('sales:receiptNumber')}: {receiptData?.receiptNumber || 'INV-9010'}
        </Typography>
        <Typography variant="subtitle2" align="center" gutterBottom>
          {t('sales:date')}: {new Date(receiptData?.createdSale?.createdAt || Date.now()).toLocaleString('ar-EG')}
        </Typography>
        {receiptData?.currentUser && (
          <Typography variant="subtitle2" align="center" gutterBottom>
            {t('sales:cashier')}: {receiptData.currentUser?.fullName || receiptData.currentUser?.username || receiptData.currentUser?.name || 'Admin User'}
          </Typography>
        )}
        <Typography variant="subtitle2" align="center" gutterBottom>
          {t('sales:customer')}: {t(`sales.customers.${receiptData?.selectedCustomer?.name}`, { defaultValue: receiptData?.selectedCustomer?.name || 'walkInCustomer' })}
        </Typography>
      </div>
      
      <div className="receipt-items">
        <Typography variant="subtitle1" align="center" gutterBottom>
          {t('sales:items')}
        </Typography>
        {receiptData?.cartItems?.map((item) => (
          <Box key={item.id} sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {item.name} × {item.quantity}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                {receiptData?.currency?.symbol} {item.price.toFixed(2)} × {item.quantity}
              </Typography>
              <Typography variant="body2">
                {receiptData?.currency?.symbol} {(item.price * item.quantity).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        ))}
      </div>
      
      <div className="receipt-totals">
        <Typography variant="subtitle2" align="right">
          <strong>{t('sales:subtotal')}:</strong> {receiptData?.currency?.symbol} {receiptData?.subtotal?.toFixed(2)}
        </Typography>
        {receiptData?.storeSettings?.receiptShowTaxDetails && (
          <Typography variant="subtitle2" align="right">
            <strong>{t('sales:tax')} ({receiptData?.taxRatePercent}%):</strong> {receiptData?.currency?.symbol} {receiptData?.tax?.toFixed(2)}
          </Typography>
        )}
        <Typography variant="subtitle2" align="right">
          <strong>{t('sales:total')}:</strong> {receiptData?.currency?.symbol} {receiptData?.total?.toFixed(2)}
        </Typography>
      </div>
      
      <div className="receipt-payment-info">
        <Typography variant="subtitle2" align="center">
          <strong>{t('sales:amountPaid')}:</strong> {receiptData?.currency?.symbol} {receiptData?.amountPaid?.toFixed(2)}
        </Typography>
        <Typography variant="subtitle2" align="center">
          <strong>{t('sales:changeAmount')}:</strong> {receiptData?.currency?.symbol} {receiptData?.change?.toFixed(2)}
        </Typography>
        <Typography variant="subtitle2" align="center">
          <strong>{t('sales:paymentMethod')}:</strong> {t(`sales:paymentMethods.${receiptData?.paymentMethod}`)}
        </Typography>
      </div>
      
      <div className="receipt-footer">
        {receiptData?.storeSettings?.invoiceTerms && (
          <Typography
            variant="caption"
            align="center"
            display="block"
            sx={{ whiteSpace: 'pre-line', mb: 1, color: 'text.secondary', fontSize: '0.7rem' }}
          >
            {receiptData.storeSettings.invoiceTerms}
          </Typography>
        )}
        <Typography variant="body2" align="center" sx={{ fontStyle: 'italic' }}>
          {receiptData?.storeSettings?.receiptFooterText || t('thankYou')}
        </Typography>

        {receiptData?.storeSettings?.receiptShowOnlineOrderQR && (
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