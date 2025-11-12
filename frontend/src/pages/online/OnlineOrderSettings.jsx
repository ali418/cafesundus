import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Paper, Typography, Grid, Switch, FormControlLabel, TextField, Button, Chip, Stack } from '@mui/material';
import { Save as SaveIcon, AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiService from '../../api/apiService';

const weekdayLabelsAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const weekdayLabelsEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const OnlineOrderSettings = () => {
  const { t, i18n } = useTranslation(['online']);
  const isArabic = i18n.language && i18n.language.startsWith('ar');
  const dayLabels = isArabic ? weekdayLabelsAr : weekdayLabelsEn;

  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  const [days, setDays] = useState([0,1,2,3,4,5,6]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const s = await apiService.getSettings();
        setEnabled(Boolean(s.online_orders_enabled ?? true));
        // Backend may return HH:mm:ss; time input expects HH:mm
        const start = (s.online_orders_start_time || '00:00').slice(0, 5);
        const end = (s.online_orders_end_time || '23:59').slice(0, 5);
        setStartTime(start);
        setEndTime(end);
        // Ensure days are numeric 0-6 even if backend returns strings
        const rawDays = Array.isArray(s.online_orders_days) ? s.online_orders_days : [0,1,2,3,4,5,6];
        const numericDays = rawDays.map(d => Number(d)).filter(n => Number.isInteger(n));
        setDays(numericDays);
      } catch (e) {
        console.error('Failed to load settings', e);
        toast.error(t('online:scheduleUpdateFailed', 'فشل تحميل إعدادات الجدولة'));
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [t]);

  const toggleDay = (idx) => {
    setDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx].sort((a,b)=>a-b));
  };

  const save = async () => {
    try {
      setLoading(true);
      const payload = {
        online_orders_enabled: enabled,
        online_orders_start_time: startTime,
        online_orders_end_time: endTime,
        // Ensure payload days are numbers 0-6
        online_orders_days: (Array.isArray(days) ? days : []).map(d => Number(d)).filter(n => Number.isInteger(n)),
      };
      await apiService.updateSettings(payload);
      toast.success(t('online:scheduleUpdated', 'تم تحديث جدول الطلبات بنجاح'));
    } catch (e) {
      console.error('Failed to save schedule', e);
      toast.error(t('online:scheduleUpdateFailed', 'فشل تحديث جدول الطلبات'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTimeIcon /> {t('online:onlineOrderSchedule', 'جدولة الطلبات الأونلاين')}
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
              label={t('online:onlineOrdersEnabled', 'تفعيل الطلبات الأونلاين')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('online:startTime', 'وقت البدء')}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('online:endTime', 'وقت الانتهاء')}
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('online:availableDays', 'الأيام المتاحة')}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {dayLabels.map((label, idx) => (
                <Chip
                  key={label}
                  label={label}
                  color={days.includes(idx) ? 'primary' : 'default'}
                  variant={days.includes(idx) ? 'filled' : 'outlined'}
                  onClick={() => toggleDay(idx)}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={save} disabled={loading}>
              {t('online:save', 'حفظ')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default OnlineOrderSettings;