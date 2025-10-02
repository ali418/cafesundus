import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrency } from '../../redux/slices/settingsSlice';
import apiService from '../../api/apiService';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Grid,
  Card,
  CardContent,
  CardMedia,
  FormControl,
  InputLabel,
  Select,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  MoreVert,
  Visibility,
  FileDownload,
  FileUpload,
  FilterList,
  Category,
  ViewModule,
  ViewList,
} from '@mui/icons-material';

// Fallback data in case API fails
const fallbackProducts = [];
const fallbackCategories = [{ id: 1, name: 'All' }];

// Helper function to get product image URL
const getProductImageUrl = (product) => {
  const placeholderImage = `data:image/svg+xml;utf8,
  <svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>
    <rect width='100%' height='100%' fill='%23f5f5f5'/>
    <g fill='none' stroke='%23cccccc' stroke-width='4'>
      <rect x='50' y='40' width='300' height='220' rx='12' ry='12'/>
      <circle cx='200' cy='150' r='50'/>
    </g>
    <text x='200' y='260' font-family='Arial' font-size='18' fill='%23999999' text-anchor='middle'>No Image</text>
  </svg>`;
  
  const raw = product?.image_url || product?.image || product?.imageUrl || '';
  const img = typeof raw === 'string' ? raw.trim() : '';
  if (!img) return placeholderImage;

  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith('/uploads/')) return img;
  if (img.startsWith('uploads/')) return '/' + img;
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(img)) return `/uploads/${img}`;
  return placeholderImage;
};

const Products = () => {
  const { t, i18n } = useTranslation(['products', 'common']);

  useEffect(() => {
    document.title = t('pageTitle.products', { ns: 'common' });
  }, [i18n.language, t]);
  const navigate = useNavigate();
  const currency = useSelector(selectCurrency);

  // State for products
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([{ id: 1, name: 'All' }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(1); // Default to 'All'
  
  // Function to fetch products and categories from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if server is running
      const isServerUp = await apiService.isServerRunning().catch(() => false);
      if (!isServerUp) {
        throw new Error('Server is not available');
      }
      
      // Fetch products
      const productsData = await apiService.getProducts();
      console.log('Products data:', productsData);

      // Normalize cost field to ensure consistent display in UI
      const normalizedProducts = (productsData || []).map((p) => {
        // Get the cost value from any of the possible field names
        const costValue = p?.cost ?? 
          p?.costPrice ?? 
          p?.cost_price ?? 
          p?.purchasePrice ?? 
          p?.purchase_price ?? 
          p?.buyingPrice ?? 
          p?.buying_price;
        
        // Convert to number if possible, otherwise keep as is
        const parsedCost = costValue !== null && costValue !== undefined && !isNaN(parseFloat(costValue)) 
          ? parseFloat(costValue) 
          : costValue;
        
        return {
          ...p,
          cost: parsedCost
        };
      });
      
      console.log('Normalized products with cost field:', normalizedProducts);

      // Fetch inventory and map quantities to products so stock reflects latest inventory
      let mappedProducts = normalizedProducts;
      try {
        const inventoryData = await apiService.getInventory();
        const qtyByProductId = new Map(
          (inventoryData || []).map((inv) => [inv.productId, Number(inv.quantity) || 0])
        );
        mappedProducts = (normalizedProducts || []).map((p) => ({
          ...p,
          // Prefer inventory quantity if exists; fallback to product.stock or 0
          stock: qtyByProductId.has(p.id) ? qtyByProductId.get(p.id) : (Number(p.stock) || 0),
        }));
      } catch (invErr) {
        console.warn('Failed to load inventory for products mapping, falling back to product.stock:', invErr);
        mappedProducts = (normalizedProducts || []).map((p) => ({
          ...p,
          stock: Number(p.stock) || 0,
        }));
      }

      setProducts(mappedProducts);
      setFilteredProducts(mappedProducts);
      
      // Fetch categories
      const categoriesData = await apiService.getCategories();
      console.log('Categories data:', categoriesData);

      // Add 'All' category if it doesn't exist
      const allCategoriesOption = [{ id: 1, name: 'All' }];
      const combinedCategories = allCategoriesOption.concat(categoriesData);
      setCategories(combinedCategories);
    } catch (err) {
      console.error('Error fetching data:', err);
      // Use the user-friendly message from the API service
      setError(err.userMessage || t('error'));
      // Use fallback data if API fails
      setProducts(apiService.getFallbackProducts());
      setCategories(apiService.getFallbackCategories());
    } finally {
      setLoading(false);
    }
  };
  
  // Call fetchData on component mount
  useEffect(() => {
    fetchData();
  }, []);
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for view mode (list or grid)
  const [viewMode, setViewMode] = useState('list');
  
  // State for action menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Filter products based on search query and selected category
  useEffect(() => {
    let filtered = products;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.includes(searchQuery) ||
        product.serial_number?.includes(searchQuery)
      );
    }
    
    // Filter by category
    if (selectedCategory !== 1) { // If not 'All'
      const categoryName = categories.find(cat => cat.id === selectedCategory)?.name;
      filtered = filtered.filter(product => 
        product.category?.name === categoryName || 
        product.category === categoryName
      );
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);
  
  // Handle menu open
  const handleMenuOpen = (event, product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Handle edit product
  const handleEditProduct = () => {
    handleMenuClose();
    navigate(`/products/edit/${selectedProduct.id}`);
  };
  
  // Handle view product
  const handleViewProduct = () => {
    handleMenuClose();
    // In a real app, you would navigate to a product details page
    alert(`View product: ${selectedProduct.name}`);
  };
  
  // Handle delete product
  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };
  
  // Confirm delete product
  const confirmDeleteProduct = async () => {
    try {
      await apiService.deleteProduct(selectedProduct.id);
      setProducts(prevProducts => prevProducts.filter(product => product.id !== selectedProduct.id));
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Error deleting product:', err);
      // Use the user-friendly message from the API service
      const errorMessage = err.userMessage || t('common:errorDeleting');
      setError(errorMessage);
      setDeleteDialogOpen(false);
    }
  };
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Get stock status chip color
  const getStockStatusColor = (stock) => {
    if (stock <= 5) return 'error';
    if (stock <= 15) return 'warning';
    return 'success';
  };
  
  // وظيفة طباعة الباركود
  const handlePrintBarcode = (barcode) => {
    if (!barcode) return;
    
    // إنشاء نافذة طباعة جديدة
    const printWindow = window.open('', '_blank');
    
    // إنشاء محتوى HTML للطباعة
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>طباعة الباركود</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin: 0;
            padding: 20px;
          }
          .barcode-container {
            margin: 20px auto;
            padding: 10px;
            border: 1px solid #ddd;
            display: inline-block;
          }
          .barcode-number {
            margin-top: 10px;
            font-size: 14px;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      </head>
      <body>
        <div class="barcode-container">
          <svg id="barcode"></svg>
          <div class="barcode-number">${barcode}</div>
        </div>
        <div class="no-print">
          <button onclick="window.print()">طباعة</button>
          <button onclick="window.close()">إغلاق</button>
        </div>
        
        <script>
          // توليد الباركود باستخدام مكتبة JsBarcode
          JsBarcode("#barcode", "${barcode}", {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: false
          });
        </script>
      </body>
      </html>
    `;
    
    // كتابة المحتوى في نافذة الطباعة
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ textAlign: 'center', width: '100%' }}>
          {t('products:products')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => navigate('/products/add')}
        >
          {t('products:addProduct')}
        </Button>
      </Box>
      
      {/* Loading indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
            <CircularProgress />
          </Box>
        )}
        
        {/* Error message */}
        {error && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              mb: 2, 
              backgroundColor: 'error.light', 
              color: 'error.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="body1">{error}</Typography>
            <Button 
              variant="contained" 
              color="error" 
              size="small"
              onClick={fetchData}
            >
              {t('common:retry')}
            </Button>
          </Paper>
        )}
        
        {/* Empty state */}
        {!loading && !error && products.length === 0 && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography align="center">
              {t('products:noProductsFound')}
            </Typography>
          </Box>
        )}
      
      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Empty State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', my: 2 }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {searchQuery || selectedCategory !== 1 
              ? t('products:noProductsFound') 
              : t('products:noProductsYet')}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<Add />}
            onClick={() => navigate('/products/add')}
            sx={{ mt: 2 }}
          >
            {t('products:addProduct')}
          </Button>
        </Paper>
      )}
      
      {/* Filters and search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={t('common:search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="category-select-label">{t('products:category')}</InputLabel>
              <Select
                labelId="category-select-label"
                value={selectedCategory}
                label={t('products:category')}
                onChange={(e) => setSelectedCategory(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <Category />
                  </InputAdornment>
                }
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              fullWidth
            >
              {t('common:filter')}
            </Button>
          </Grid>
          <Grid item xs={6} md={1}>
            <Tooltip title={t('common:export')}>
              <IconButton color="primary">
                <FileDownload />
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs={6} md={1}>
            <Tooltip title={t('import')}>

              <IconButton color="primary">
                <FileUpload />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title={t('listView')}>

            <IconButton 
              color={viewMode === 'list' ? 'primary' : 'default'}
              onClick={() => setViewMode('list')}
            >
              <ViewList />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('gridView')}>
            <IconButton 
              color={viewMode === 'grid' ? 'primary' : 'default'}
              onClick={() => setViewMode('grid')}
            >
              <ViewModule />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
      
      {/* Loading and error states */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <Typography>{t('common:loading')}</Typography>
        </Box>
      )}
      
      {error && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#FFF4F4' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}
      
      {/* Empty state */}
      {!loading && !error && filteredProducts.length === 0 && (
        <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <Typography>{t('common:noResults')}</Typography>
        </Paper>
      )}
      
      {/* Products list view */}
      {viewMode === 'list' && !loading && !error && filteredProducts.length > 0 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('products:productName')}</TableCell>
                  <TableCell>{t('products:category')}</TableCell>
                  <TableCell align="right">{t('products:price')}</TableCell>
                  <TableCell align="right">{t('products:costPrice')}</TableCell>
                  <TableCell align="center">{t('common:actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        {typeof product.category === 'object' 
                          ? product.category?.name 
                          : product.category}
                      </TableCell>
                      <TableCell align="right">
                        {typeof product.price === 'number' 
                          ? `${currency.symbol}${product.price.toFixed(2)}` 
                          : product.price}
                      </TableCell>
                      <TableCell align="right">
                        {typeof product.cost === 'number' && product.cost > 0
                          ? `${currency.symbol}${product.cost.toFixed(2)}` 
                          : (product.cost === 0 || product.cost === '0') 
                            ? `${currency.symbol}0.00`
                            : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('common:edit')}>
                          <IconButton 
                            size="small" 
                            onClick={() => navigate(`/products/edit/${product.id}`)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common:more')}>
                          <IconButton
                            size="small"
                            aria-label="more"
                            aria-controls="product-menu"
                            aria-haspopup="true"
                            onClick={(e) => handleMenuOpen(e, product)}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredProducts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={t('common:rowsPerPage')}
          />
        </Paper>
      )}
      
      {/* Products grid view */}
      {viewMode === 'grid' && !loading && !error && filteredProducts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={3}>
            {filteredProducts
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={getProductImageUrl(product)}
                      alt={product.name}
                      sx={{ objectFit: 'cover', backgroundColor: '#f5f5f5' }}
                      onError={(e) => {
                        const failingUrl = e?.target?.src;
                        console.error('خطأ في تحميل صورة المنتج:', {
                          productId: product?.id,
                          productName: product?.name,
                          imageUrlTried: failingUrl,
                          rawImageFields: {
                            image_url: product?.image_url,
                            image: product?.image,
                            imageUrl: product?.imageUrl,
                          },
                          errorEvent: e,
                        });
                        if (e && e.target) {
                          e.target.onerror = null;
                          e.target.src = placeholderImage;
                        }
                      }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Tooltip title={product.description || ''}>
                        <Typography gutterBottom variant="h6" component="div" noWrap>
                          {product.name}
                        </Typography>
                      </Tooltip>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {typeof product.category === 'object' 
                          ? product.category?.name 
                          : product.category}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="h6" color="primary">
                            {currency.symbol}{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t('products:costPrice')}: {typeof product.cost === 'number' && product.cost > 0
                              ? `${currency.symbol}${product.cost.toFixed(2)}` 
                              : (product.cost === 0 || product.cost === '0') 
                                ? `${currency.symbol}0.00`
                                : '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <Box>
                        <Button
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => {
                            setSelectedProduct(product);
                            handleEditProduct();
                          }}
                          color="primary"
                          sx={{ mr: 1 }}
                        >
                          {t('common:edit')}
                        </Button>
                      </Box>
                      <IconButton
                        aria-label="more"
                        aria-controls="product-menu"
                        aria-haspopup="true"
                        onClick={(e) => handleMenuOpen(e, product)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              ))}
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <TablePagination
              rowsPerPageOptions={[8, 16, 24, 32]}
              component="div"
              count={filteredProducts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={t('common:rowsPerPage')}
            />
          </Box>
        </Box>
      )}
      
      {/* Action Menu */}
      <Menu
        id="product-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewProduct}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('view')} />
        </MenuItem>
        <MenuItem onClick={handleEditProduct}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('edit')} />
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('delete')} />
        </MenuItem>
      </Menu>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {t('products:confirmDeleteProduct')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {selectedProduct && (
              <>
                {t('thisActionCannotBeUndone')}<br />
                {t('products:product')}: <strong>{selectedProduct.name}</strong>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={confirmDeleteProduct} color="error" autoFocus>
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;