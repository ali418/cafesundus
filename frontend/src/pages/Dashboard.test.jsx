import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import axios from 'axios';
import Dashboard from './Dashboard';

// Mock axios
jest.mock('axios');

// Mock the components used in Dashboard
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
}));

// Create mock store
const mockStore = configureStore([]);

describe('Dashboard Component', () => {
  let store;

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
    });

    // Mock axios responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/sales/summary')) {
        return Promise.resolve({
          data: {
            totalSales: 5000,
            totalOrders: 100,
            averageOrderValue: 50,
            salesByDay: [
              { date: '2023-05-01', total: 500 },
              { date: '2023-05-02', total: 600 },
              { date: '2023-05-03', total: 450 },
            ],
          },
        });
      } else if (url.includes('/api/products/top-selling')) {
        return Promise.resolve({
          data: [
            { name: 'Product 1', quantity: 50 },
            { name: 'Product 2', quantity: 40 },
            { name: 'Product 3', quantity: 30 },
          ],
        });
      } else if (url.includes('/api/inventory/low-stock')) {
        return Promise.resolve({
          data: [
            { name: 'Product 4', stock: 5 },
            { name: 'Product 5', stock: 3 },
          ],
        });
      } else if (url.includes('/api/customers/recent')) {
        return Promise.resolve({
          data: [
            { id: 1, name: 'Customer 1', email: 'customer1@example.com' },
            { id: 2, name: 'Customer 2', email: 'customer2@example.com' },
          ],
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard with loading state initially', () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );

    // Check for loading indicators
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
  });

  test('renders dashboard with data after loading', async () => {
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(4);
    });

    // Check for summary cards
    await waitFor(() => {
      expect(screen.getByText('5000')).toBeInTheDocument(); // Total Sales
      expect(screen.getByText('100')).toBeInTheDocument(); // Total Orders
      expect(screen.getByText('50')).toBeInTheDocument(); // Average Order Value
    });

    // Check for charts
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
    });

    // Check for top selling products
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('Product 3')).toBeInTheDocument();
    });

    // Check for low stock products
    await waitFor(() => {
      expect(screen.getByText('Product 4')).toBeInTheDocument();
      expect(screen.getByText('Product 5')).toBeInTheDocument();
    });

    // Check for recent customers
    await waitFor(() => {
      expect(screen.getByText('Customer 1')).toBeInTheDocument();
      expect(screen.getByText('Customer 2')).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    // Mock API error
    axios.get.mockRejectedValue(new Error('API Error'));

    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
    });
  });
});