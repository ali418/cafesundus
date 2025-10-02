import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Typography, Box, Paper } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

/**
 * مكون مساعد للتعامل مع مشاكل الشبكة عند استخدام رمز QR
 * يعرض معلومات مفيدة للمستخدم عند تغيير شبكة الواي فاي
 */
const QRCodeNetworkHelper = ({ url }) => {
  const [showHelper, setShowHelper] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);

  // استخراج المعلومات من عنوان URL
  useEffect(() => {
    try {
      const currentUrl = new URL(window.location.href);
      const onlineUrl = new URL(url);
      
      setNetworkInfo({
        currentHost: currentUrl.hostname,
        targetHost: onlineUrl.hostname,
        isSameOrigin: currentUrl.origin === onlineUrl.origin
      });
    } catch (error) {
      console.error('خطأ في تحليل عنوان URL:', error);
    }
  }, [url]);

  if (!networkInfo) return null;

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Button 
        startIcon={<HelpOutlineIcon />}
        onClick={() => setShowHelper(!showHelper)}
        variant="text"
        color="primary"
        size="small"
      >
        {showHelper ? 'إخفاء المساعدة' : 'مشاكل في الوصول للصفحة؟'}
      </Button>

      {showHelper && (
        <Paper elevation={2} sx={{ p: 2, mt: 1, bgcolor: '#f8f9fa' }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            <WifiIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
            مساعدة في حالة تغيير شبكة الواي فاي
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            إذا قمت بتغيير شبكة الواي فاي، قد تحتاج إلى تحديث إعدادات التطبيق ليعمل بشكل صحيح.
          </Alert>

          <Typography variant="body2" paragraph>
            <strong>الحل:</strong> قم بتشغيل ملف <code>setup-network.bat</code> الموجود في المجلد الرئيسي للتطبيق،
            واتبع التعليمات لتحديث عنوان IP للخادم.
          </Typography>

          <Typography variant="body2" paragraph>
            <strong>ملاحظة هامة:</strong> تأكد من أن جهازك متصل بنفس شبكة الواي فاي التي يتصل بها الخادم.
          </Typography>

          <Typography variant="caption" color="textSecondary">
            معلومات الشبكة الحالية: {networkInfo.currentHost} → {networkInfo.targetHost}
            {!networkInfo.isSameOrigin && ' (مختلفة)'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

QRCodeNetworkHelper.propTypes = {
  url: PropTypes.string.isRequired
};

export default QRCodeNetworkHelper;