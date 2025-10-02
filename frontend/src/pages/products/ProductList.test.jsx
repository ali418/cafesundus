import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import axios from 'axios';
import ProductList from './ProductList';

// Mock axios
jest.mock('axios');

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Create mock store
const mockStore = configureStore([]);

describe('ProductList Component', () => {
  let store;
  let mockDispatch;

  // Sample product data
  const mockProducts = [
    {
      id: 1,
      name: 'Product 1',
      description: 'Description for product 1',
      price: 99.99,
      category: { id: 1, name: 'Category 1' },
      stock: 50,
      status: 'active',
      createdAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      name: 'Product 2',
      description: 'Description for product 2',
      price: 149.99,
      category: { id: 2, name: 'Category 2' },
      stock: 25,
      status: 'active',
      createdAt: '2023-01-02T00:00:00.000Z',
    },
    {
      id: 3,
      name: 'Product 3',
      description: 'Description for product 3',
      price: 199.99,
      category: { id: 1, name: 'Category 1' },
      stock: 10,
      status: 'inactive',
      createdAt: '2023-01-03T00:00:00.000Z',
    },
  ];

  // Sample categories data
  const mockCategories = [
    { id: 1, name: 'Category 1' },
    { id: 2, name: 'Category 2' },
    { id: 3, name: 'Category 3' },
  ];

  beforeEach(() => {
    // Set up a mock store
    store = mockStore({
      auth: {
        isAuthenticated: true,
        user: {
          id: 1,
          name: 'Test User',
          role: 'admin',
        },
      },
      products: {
        items: mockProducts,
        loading: false,
        error: null,
        totalItems: mockProducts.length,
        totalPages: 1,
        currentPage: 1,
      },
      categories: {
        items: mockCategories,
        loading: false,
      },
      // Provide settings slice so currency comes from Redux like the app
      settings: {
        themeMode: 'light',
        language: 'en',
        store: {
          currencyCode: 'USD',
          currencySymbol: '$',
        },
        status: 'idle',
        error: null,
      },
    });

    // Mock dispatch function
    mockDispatch = jest.fn();
    store.dispatch = mockDispatch;

    // Mock axios responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/products')) {
        return Promise.resolve({
          data: {
            products: mockProducts,
            totalItems: mockProducts.length,
            totalPages: 1,
            currentPage: 1,
          },
        });
      } else if (url.includes('/api/categories')) {
        return Promise.resolve({
          data: mockCategories,
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    axios.delete.mockResolvedValue({ data: { message: 'Product deleted successfully' } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderProductList = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <ProductList />
        </BrowserRouter>
      </Provider>
    );
  };

  test('renders product list with data', async () => {
    renderProductList();

    // Check if products are rendered
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('Product 3')).toBeInTheDocument();
    });

    // Check if price is formatted correctly using Redux currency symbol
    const symbol = store.getState().settings.store.currencySymbol || '$';
    expect(screen.getByText(`${symbol}99.99`)).toBeInTheDocument();
    expect(screen.getByText(`${symbol}149.99`)).toBeInTheDocument();
    expect(screen.getByText(`${symbol}199.99`)).toBeInTheDocument();

    // Check if categories are displayed
    expect(screen.getAllByText('Category 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Category 2').length).toBeGreaterThan(0);

    // Check if action buttons are rendered
    expect(screen.getAllByRole('button', { name: /edit/i }).length).toBe(3);
    expect(screen.getAllByRole('button', { name: /delete/i }).length).toBe(3);
  });

  test('filters products by search term', async () => {
    renderProductList();

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Get search input and type in it
    const searchInput = screen.getByPlaceholderText(/search products/i);
    fireEvent.change(searchInput, { target: { value: 'Product 1' } });

    // Submit search form
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    // Check if dispatch was called with search action
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('products/fetchProducts'),
          payload: expect.objectContaining({
            search: 'Product 1',
          }),
        })
      );
    });
  });

  test('filters products by category', async () => {
    renderProductList();

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Get category filter and select a category
    const categoryFilter = screen.getByLabelText(/category/i);
    fireEvent.change(categoryFilter, { target: { value: '1' } });

    // Check if dispatch was called with category filter action
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('products/fetchProducts'),
          payload: expect.objectContaining({
            categoryId: '1',
          }),
        })
      );
    });
  });

  test('filters products by status', async () => {
    renderProductList();

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Get status filter and select inactive status
    const statusFilter = screen.getByLabelText(/status/i);
    fireEvent.change(statusFilter, { target: { value: 'inactive' } });

    // Check if dispatch was called with status filter action
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('products/fetchProducts'),
          payload: expect.objectContaining({
            status: 'inactive',
          }),
        })
      );
    });
  });

  test('sorts products by different fields', async () => {
    renderProductList();

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Get sort select and change to price
    const sortSelect = screen.getByLabelText(/sort by/i);
    fireEvent.change(sortSelect, { target: { value: 'price' } });

    // Check if dispatch was called with sort action
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('products/fetchProducts'),
          payload: expect.objectContaining({
            sortBy: 'price',
          }),
        })
      );
    });

    // Change sort direction
    const sortDirectionButton = screen.getByRole('button', { name: /sort direction/i });
    fireEvent.click(sortDirectionButton);

    // Check if dispatch was called with sort direction action
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('products/fetchProducts'),
          payload: expect.objectContaining({
            sortDirection: 'desc',
          }),
        })
      );
    });
  });

  test('navigates to add product page', async () => {
    renderProductList();

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Get add product button and click it
    const addButton = screen.getByRole('button', { name: /add product/i });
    fireEvent.click(addButton);

    // Check if navigation was attempted
    // Note: We can't directly test navigation in this setup,
    // but we can check if the button has the correct attributes
    expect(addButton.closest('a')).toHaveAttribute('href', '/products/add');
  });

  test('navigates to edit product page', async () => {
    renderProductList();

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Get edit buttons and click the first one
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    // Check if navigation was attempted
    expect(editButtons[0].closest('a')).toHaveAttribute('href', '/products/edit/1');
  });

  test('deletes a product', async () => {
    renderProductList();

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Get delete buttons and click the first one
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion in the dialog
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    // Check if API was called with correct product ID
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/api/products/1')
      );
    });

    // Check if dispatch was called to refresh products
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('products/fetchProducts'),
        })
      );
    });
  });

  test('handles pagination', async () => {
    // Mock store with pagination data
    store = mockStore({
      auth: {
        isAuthenticated: true,
        user: {
          id: 1,
          name: 'Test User',
          role: 'admin',
        },
      },
      products: {
        items: mockProducts,
        loading: false,
        error: null,
        totalItems: 30,
        totalPages: 3,
        currentPage: 1,
      },
      categories: {
        items: mockCategories,
        loading: false,
      },
    });

    mockDispatch = jest.fn();
    store.dispatch = mockDispatch;

    renderProductList();

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Get pagination buttons and click the next page button
    const nextPageButton = screen.getByRole('button', { name: /next page/i });
    fireEvent.click(nextPageButton);

    // Check if dispatch was called with page change action
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('products/fetchProducts'),
          payload: expect.objectContaining({
            page: 2,
          }),
        })
      );
    });
  });

  test('handles API error', async () => {
    // Mock API error
    axios.get.mockRejectedValue({
      response: {
        data: {
          message: 'Failed to fetch products',
        },
        status: 500,
      },
    });

    // Mock store with error state
    store = mockStore({
      auth: {
        isAuthenticated: true,
        user: {
          id: 1,
          name: 'Test User',
          role: 'admin',
        },
      },
      products: {
        items: [],
        loading: false,
        error: 'Failed to fetch products',
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      },
      categories: {
        items: mockCategories,
        loading: false,
      },
    });

    renderProductList();

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch products/i)).toBeInTheDocument();
    });
  });
});