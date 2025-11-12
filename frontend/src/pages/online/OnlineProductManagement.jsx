import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiService from '../../api/apiService';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardMedia,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { toast } from 'react-toastify';

const placeholderImage = `data:image/svg+xml;utf8,
<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>
  <rect width='100%' height='100%' fill='%23f5f5f5'/>
  <g fill='none' stroke='%23cccccc' stroke-width='4'>
    <rect x='50' y='40' width='300' height='220' rx='12' ry='12'/>
    <circle cx='200' cy='150' r='50'/>
  </g>
  <text x='200' y='260' font-family='Arial' font-size='18' fill='%23999999' text-anchor='middle'>No Image</text>
</svg>`;

const getProductImageUrl = (product) => {
  const raw = product?.image_url || product?.image || product?.imageUrl || '';
  let img = typeof raw === 'string' ? raw.trim() : '';
  if (!img) return placeholderImage;
  if (/^https?:\/\//i.test(img)) return img;
  img = img.replace(/\\\\/g, '/');
  const noQuery = img.split('#')[0].split('?')[0];
  if (noQuery.startsWith('/uploads/')) return noQuery;
  if (noQuery.includes('/uploads/')) {
    const idx = noQuery.indexOf('/uploads/');
    return noQuery.slice(idx);
  }
  if (noQuery.startsWith('uploads/')) return `/${noQuery}`;
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(noQuery)) {
    const parts = noQuery.split('/');
    const fileName = parts[parts.length - 1];
    return `/uploads/${fileName}`;
  }
  return placeholderImage;
};

const OnlineProductManagement = () => {
  const { t } = useTranslation(['online']);
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await apiService.getProducts();
        const normalized = (data || []).map(p => ({
          ...p,
          show_online: Boolean(p.show_online),
        }));
        setProducts(normalized);
        setFiltered(normalized);
      } catch (e) {
        console.error('Error loading products:', e);
        setError(e.userMessage || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const s = search.trim().toLowerCase();
    const next = !s
      ? products
      : products.filter(p =>
          (p.name || '').toLowerCase().includes(s) ||
          (p.description || '').toLowerCase().includes(s) ||
          String(p.id || '').includes(s)
        );
    setFiltered(next);
  }, [search, products]);

  const toggleShowOnline = async (product, checked) => {
    try {
      // Optimistic update
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, show_online: checked } : p));
      setFiltered(prev => prev.map(p => p.id === product.id ? { ...p, show_online: checked } : p));
      await apiService.updateProduct(product.id, { show_online: checked });
      toast.success(t('online:updatedSuccess', 'تم تحديث حالة العرض أونلاين'));
    } catch (e) {
      console.error('Error updating show_online:', e);
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, show_online: !checked } : p));
      setFiltered(prev => prev.map(p => p.id === product.id ? { ...p, show_online: !checked } : p));
      toast.error(t('online:updatedError', 'حدث خطأ أثناء التحديث'));
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
        {t('online:onlineProductManagement', 'إدارة المنتجات الأونلاين')}
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('online:searchProducts')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
        />
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(product => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="160"
                  image={getProductImageUrl(product)}
                  alt={product.name}
                />
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {product.category?.name || product.category || ''}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(product.show_online)}
                        onChange={(e) => toggleShowOnline(product, e.target.checked)}
                        color="primary"
                      />
                    }
                    label={t('online:showOnline', 'عرض المنتج أونلاين')}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default OnlineProductManagement;