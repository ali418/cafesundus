import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
  Chip,
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
  Divider,
  FormControl,
  InputLabel,
  Select,
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
  Category,
  ViewModule,
  ViewList,
  ShoppingBasket,
} from '@mui/icons-material';
import apiService from '../../api/apiService';

// Demo data for categories
const demoCategories = [
  { id: 1, name: 'Fruits', description: 'Fresh fruits from local farms', productsCount: 15, image: 'https://via.placeholder.com/100', status: 'active' },
  { id: 2, name: 'Vegetables', description: 'Organic vegetables', productsCount: 20, image: 'https://via.placeholder.com/100', status: 'active' },
  { id: 3, name: 'Dairy', description: 'Milk, cheese, and other dairy products', productsCount: 12, image: 'https://via.placeholder.com/100', status: 'active' },
  { id: 4, name: 'Bakery', description: 'Fresh bread and pastries', productsCount: 8, image: 'https://via.placeholder.com/100', status: 'active' },
  { id: 5, name: 'Meat', description: 'Fresh meat and poultry', productsCount: 10, image: 'https://via.placeholder.com/100', status: 'active' },
  { id: 6, name: 'Grains', description: 'Rice, wheat, and other grains', productsCount: 5, image: 'https://via.placeholder.com/100', status: 'active' },
  { id: 7, name: 'Beverages', description: 'Soft drinks, juices, and water', productsCount: 18, image: 'https://via.placeholder.com/100', status: 'active' },
  { id: 8, name: 'Snacks', description: 'Chips, nuts, and other snacks', productsCount: 25, image: 'https://via.placeholder.com/100', status: 'active' },
  { id: 9, name: 'Canned Goods', description: 'Canned fruits, vegetables, and soups', productsCount: 14, image: 'https://via.placeholder.com/100', status: 'active' },
  { id: 10, name: 'Frozen Foods', description: 'Frozen meals and vegetables', productsCount: 9, image: 'https://via.placeholder.com/100', status: 'active' },
];

// Status options for filtering
const statusOptions = [
  { id: 1, name: 'All' },
  { id: 2, name: 'Active' },
  { id: 3, name: 'Inactive' },
];

const Categories = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Set document title
  useEffect(() => {
    document.title = t('pageTitle.categories');
  }, [t]);

  // State for categories
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(1); // Default to 'All'
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for view mode (list or grid)
  const [viewMode, setViewMode] = useState('list');
  
  // State for action menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // State for add/edit category dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    id: null,
    name: '',
    description: '',
    status: 'active',
    image: 'https://via.placeholder.com/100',
  });

  // Load categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiService.getCategories();
        const mapped = (data || []).map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description || '',
          productsCount: typeof c.productsCount === 'number' ? c.productsCount : 0,
          image: c.image_url || 'https://via.placeholder.com/100',
          status: c.is_active ? 'active' : 'inactive',
        }));
        setCategories(mapped);
        setFilteredCategories(mapped);
      } catch (error) {
        console.error('Failed to load categories:', error);
        // Fallback to demo data if needed
        // setCategories(demoCategories);
        // setFilteredCategories(demoCategories);
      }
    };
    fetchCategories();
  }, []);
  
  // Filter categories based on search query and selected status
  useEffect(() => {
    let filtered = categories;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(category =>
        (category.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by status
    if (selectedStatus !== 1) { // If not 'All'
      const statusName = statusOptions.find(status => status.id === selectedStatus)?.name.toLowerCase();
      filtered = filtered.filter(category => category.status === statusName);
    }
    
    setFilteredCategories(filtered);
  }, [searchQuery, selectedStatus, categories]);
  
  // Handle menu open
  const handleMenuOpen = (event, category) => {
    setAnchorEl(event.currentTarget);
    setSelectedCategory(category);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Handle edit category
  const handleEditCategory = () => {
    handleMenuClose();
    setCategoryFormData({
      id: selectedCategory.id,
      name: selectedCategory.name,
      description: selectedCategory.description,
      status: selectedCategory.status,
      image: selectedCategory.image,
    });
    setCategoryDialogOpen(true);
  };
  
  // Handle add new category
  const handleAddCategory = () => {
    setCategoryFormData({
      id: null,
      name: '',
      description: '',
      status: 'active',
      image: 'https://via.placeholder.com/100',
    });
    setCategoryDialogOpen(true);
  };
  
  // Handle view category
  const handleViewCategory = () => {
    handleMenuClose();
    // In a real app, you would navigate to a category details page or show a detailed dialog
    navigate(`/products?category=${selectedCategory.id}`);
  };
  
  // Handle delete category
  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };
  
  // Confirm delete category
  const confirmDeleteCategory = async () => {
    try {
      if (selectedCategory?.id) {
        await apiService.deleteCategory(selectedCategory.id);
      }
      setCategories(prevCategories => prevCategories.filter(category => category.id !== selectedCategory.id));
    } catch (error) {
      console.error('Failed to delete category:', error);
      const message = error?.userMessage || error?.message || 'Failed to delete category';
      if (typeof window !== 'undefined') {
        window.alert(message);
      }
    } finally {
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
  
  // Handle form input changes
  const handleCategoryFormChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle category form submission
  const handleCategoryFormSubmit = async () => {
    try {
      const payload = {
        name: categoryFormData.name,
        description: categoryFormData.description || '',
        is_active: categoryFormData.status === 'active',
        // imageUrl can be added when image upload is implemented
      };

      if (categoryFormData.id) {
        // Update existing category
        const updated = await apiService.updateCategory(categoryFormData.id, payload);
        const prevCount = (categories.find((cat) => cat.id === categoryFormData.id)?.productsCount) ?? 0;
        const mapped = {
          id: updated.id,
          name: updated.name,
          description: updated.description || '',
          productsCount: prevCount,
          image: updated.image_url || 'https://via.placeholder.com/100',
          status: updated.is_active ? 'active' : 'inactive',
        };
        setCategories(prevCategories =>
          prevCategories.map(category =>
            category.id === categoryFormData.id ? mapped : category
          )
        );
      } else {
        // Add new category
        const created = await apiService.createCategory(payload);
        const mapped = {
          id: created.id,
          name: created.name,
          description: created.description || '',
          productsCount: 0,
          image: created.image_url || 'https://via.placeholder.com/100',
          status: created.is_active ? 'active' : 'inactive',
        };
        setCategories(prevCategories => [...prevCategories, mapped]);
      }
      
      setCategoryDialogOpen(false);
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ textAlign: 'center', width: '100%' }}>
          {t('products:categories')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleAddCategory}
        >
          {t('products:addCategory')}
        </Button>
      </Box>
      
      {/* Filters and search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={t('search')}
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
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="status-select-label">{t('status')}</InputLabel>
              <Select
                labelId="status-select-label"
                value={selectedStatus}
                label={t('status')}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status.id} value={status.id}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={1}>
            <Tooltip title={t('export')}>
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
      
      {/* Categories list view */}
      {viewMode === 'list' && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('products:categoryName')}</TableCell>
              <TableCell>{t('description')}</TableCell>
              <TableCell align="right">{t('products:productsCount')}</TableCell>
              <TableCell>{t('status')}</TableCell>
              <TableCell align="center">{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCategories
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CardMedia
                            component="img"
                            sx={{ width: 40, height: 40, borderRadius: 1, marginInlineEnd: 2 }}
                            image={category.image}
                            alt={category.name}
                          />
                          {category.name}
                        </Box>
                      </TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          icon={<ShoppingBasket fontSize="small" />}
                          label={category.productsCount} 
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={category.status} 
                          color={category.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          aria-label="more"
                          aria-controls="category-menu"
                          aria-haspopup="true"
                          onClick={(e) => handleMenuOpen(e, category)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredCategories.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={t('rowsPerPage')}
          />
        </Paper>
      )}
      
      {/* Categories grid view */}
      {viewMode === 'grid' && (
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={3}>
            {filteredCategories
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((category) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={category.image}
                      alt={category.name}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="div">
                        {category.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {category.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Chip 
                          icon={<ShoppingBasket fontSize="small" />}
                          label={`${category.productsCount} ${t('products:products')}`} 
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                        <Chip 
                          label={category.status} 
                          color={category.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                    <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => {
                          setSelectedCategory(category);
                          handleEditCategory();
                        }}
                      >
                        {t('edit')}
                      </Button>
                      <IconButton
                        aria-label="more"
                        aria-controls="category-menu"
                        aria-haspopup="true"
                        onClick={(e) => handleMenuOpen(e, category)}
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
              rowsPerPageOptions={[8, 12, 16, 20]}
              component="div"
              count={filteredCategories.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={t('itemsPerPage')}
            />
          </Box>
        </Box>
      )}
      
      {/* Action Menu */}
      <Menu
        id="category-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewCategory}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('view')} />
        </MenuItem>
        <MenuItem onClick={handleEditCategory}>
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
          {t('products:confirmDeleteCategory')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {selectedCategory && (
              <>
                {t('thisActionCannotBeUndone')}<br />
                {t('products:category')}: <strong>{selectedCategory.name}</strong>
                {selectedCategory.productsCount > 0 && (
                  <>
                    <br />
                    <Typography color="error" sx={{ mt: 1 }}>
                      {t('products:categoryHasProducts', { count: selectedCategory.productsCount })}
                    </Typography>
                  </>
                )}
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={confirmDeleteCategory} color="error" autoFocus>
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add/Edit Category Dialog */}
      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        aria-labelledby="category-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="category-dialog-title">
          {categoryFormData.id ? t('products:editCategory') : t('products:addCategory')}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label={t('products:categoryName')}
              name="name"
              value={categoryFormData.name}
              onChange={handleCategoryFormChange}
              autoFocus
            />
            <TextField
              margin="normal"
              fullWidth
              label={t('description')}
              name="description"
              value={categoryFormData.description}
              onChange={handleCategoryFormChange}
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="category-status-label">{t('status')}</InputLabel>
              <Select
                labelId="category-status-label"
                name="status"
                value={categoryFormData.status}
                onChange={handleCategoryFormChange}
                label={t('status')}
              >
                <MenuItem value="active">{t('active')}</MenuItem>
                <MenuItem value="inactive">{t('inactive')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleCategoryFormSubmit} color="primary">
            {categoryFormData.id ? t('update') : t('save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Categories;