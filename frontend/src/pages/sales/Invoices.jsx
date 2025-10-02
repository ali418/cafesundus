import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import apiService from '../../api/apiService';
import { useReactToPrint } from 'react-to-print'
import InvoicePrint from '../../components/InvoicePrint'
import { selectUser } from '../../redux/slices/authSlice';

const Invoices = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Print handling
  const printRef = useRef(null);
  const [printInvoiceData, setPrintInvoiceData] = useState(null);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  const parseAmount = (val) => {
    const n = Number.parseFloat(val);
    return Number.isNaN(n) ? 0 : n;
  };

  const normalizeInvoice = (sale) => ({
    id: sale.id,
    date: sale.saleDate ? new Date(sale.saleDate) : new Date(),
    dueDate: sale.saleDate ? new Date(new Date(sale.saleDate).getTime() + 30 * 24 * 60 * 60 * 1000) : new Date(), // 30 days from sale date
    customer: sale.customer?.name || sale.customer?.email || '-',
    total: parseAmount(sale.totalAmount),
    status: sale.paymentStatus === 'paid' ? 'paid' : sale.paymentStatus === 'pending' ? 'pending' : 'overdue',
    paymentMethod: sale.paymentMethod || 'cash',
  });

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getSales();
      const mapped = (Array.isArray(data) ? data : []).map(normalizeInvoice);
      setInvoices(mapped);
      setFilteredInvoices(mapped);
    } catch (e) {
      console.error(e);
      setError(e.userMessage || e.message || t('sales:errors.failedToLoadInvoices'));
      setInvoices([]);
      setFilteredInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Listen for sales:updated events from POS to refresh invoices
  useEffect(() => {
    const handleSalesUpdate = (event) => {
      console.log('Invoices list refreshing due to POS event:', event.detail);
      loadInvoices();
    };
  
    window.addEventListener('sales:updated', handleSalesUpdate);
    return () => window.removeEventListener('sales:updated', handleSalesUpdate);
  }, []);

  // Filter invoices based on search term
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = invoices.filter(
      (invoice) =>
        (invoice.customer || '').toLowerCase().includes(term) ||
        (invoice.id || '').toString().toLowerCase().includes(term) ||
        invoice.total.toString().includes(searchTerm)
    );
    setFilteredInvoices(filtered);
    setPage(0);
  }, [searchTerm, invoices]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleViewInvoice = (id) => {
    navigate(`/sales/${id}`);
  };

  const handleEditInvoice = (id) => {
    navigate(`/invoices/edit/${id}`);
  };

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    try {
      await apiService.deleteSale(invoiceToDelete.id);
      const updated = invoices.filter((inv) => inv.id !== invoiceToDelete.id);
      setInvoices(updated);
      setFilteredInvoices(updated);
    } catch (e) {
      console.error(e);
      setError(e.userMessage || e.message || t('sales:errors.failedToDeleteInvoice'));
    } finally {
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

  const handlePrintInvoice = async (id) => {
    try {
      const sale = await apiService.getSaleById(id)
      // Normalize to invoice shape expected by InvoicePrint
      const invoice = {
        id: sale.id,
        customer: sale.customer || null,
        date: sale.saleDate ? new Date(sale.saleDate) : new Date(),
        dueDate: sale.saleDate ? new Date(new Date(sale.saleDate).getTime() + 30 * 24 * 60 * 60 * 1000) : new Date(),
        items: (sale.items || []).map(item => ({
          id: item.id,
          product: item.Product || { id: item.productId, name: item.product?.name || 'Unknown Product', unit: item.unit || 'piece', price: item.unitPrice || item.price || 0 },
          quantity: item.quantity || 0,
          price: Number(item.unitPrice ?? item.price ?? item.Product?.price ?? 0),
          total: Number(item.totalPrice ?? item.total ?? item.subtotal ?? 0)
        })),
        subtotal: Number(sale.subtotal || 0),
        tax: Number(sale.taxAmount || sale.tax || 0),
        discount: Number(sale.discountAmount || sale.discount || 0),
        total: Number(sale.totalAmount || sale.total || 0),
        notes: sale.notes || '',
        status: sale.paymentStatus === 'paid' ? 'paid' : sale.paymentStatus === 'pending' ? 'pending' : 'overdue',
        paymentMethod: sale.paymentMethod || 'cash',
      }
      setPrintInvoiceData(invoice)
      // Using timeout to ensure the hidden component renders with data before printing
      setTimeout(() => {
        try { handlePrint && handlePrint() } catch (e) { console.error(e) }
      }, 0)
    } catch (e) {
      console.error('Failed to load invoice for printing', e)
      setError(e.userMessage || e.message || t('sales:errors.failedToLoadInvoices'))
    }
  }
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  useEffect(() => {
    document.title = t('pageTitle.invoices');
  }, [i18n.language, t]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', width: '100%' }}>
          {t('sales:invoices')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/invoices/add')}
        >
          {t('sales:newInvoice')}
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={t('search')}
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          {loading && <Typography variant="body2">{t('loading')}</Typography>}
          {error && <Typography variant="body2" color="error">{error}</Typography>}
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="invoices table">
            <TableHead>
              <TableRow>
                <TableCell>{t('id')}</TableCell>
                <TableCell>{t('date')}</TableCell>
                <TableCell>{t('sales:dueDate')}</TableCell>
                <TableCell>{t('customers:customer')}</TableCell>
                <TableCell align="right">{t('total')}</TableCell>
                <TableCell>{t('status')}</TableCell>
                <TableCell>{t('sales:paymentMethod')}</TableCell>
                <TableCell align="center">{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell component="th" scope="row">
                      #{typeof invoice.id === 'string' ? invoice.id.slice(0, 8) : invoice.id}
                    </TableCell>
                    <TableCell>
                      {format(invoice.date, 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell>
                      {format(invoice.dueDate, 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell>{invoice.customer}</TableCell>
                    <TableCell align="right">
                      {Number(invoice.total).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t(`sales.invoiceStatus.${invoice.status}`)}
                        color={getStatusColor(invoice.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {t(`sales.paymentMethods.${invoice.paymentMethod}`)}
                    </TableCell>
                    {currentUser && currentUser.role !== 'cashier' && (
                      <TableCell>{invoice.cashier}</TableCell>
                    )}
                    <TableCell align="center">
                      <Tooltip title={t('view')}>
                        <IconButton
                          onClick={() => handleViewInvoice(invoice.id)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('edit')}>
                        <IconButton
                          onClick={() => handleEditInvoice(invoice.id)}
                          color="secondary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('print')}>
                        <IconButton
                          onClick={() => handlePrintInvoice(invoice.id)}
                          color="info"
                        >
                          <PrintIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('delete')}>
                        <IconButton
                          onClick={() => handleDeleteClick(invoice)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredInvoices.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {t('noRecordsFound')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredInvoices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={t('rowsPerPage')}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {t('confirmDelete')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {t('sales.deleteConfirmation', {
              id: invoiceToDelete?.id,
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>{t('cancel')}</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden component used for printing */}
      <Box sx={{ position: 'absolute', top: -10000, left: -10000 }}>
        <InvoicePrint ref={printRef} invoice={printInvoiceData} />
      </Box>
    </Box>
  );
};

export default Invoices;