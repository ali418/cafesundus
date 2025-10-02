import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import axios from 'axios';
import Login from './Login';

// Mock axios
jest.mock('axios');

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Create mock store
const mockStore = configureStore([]);

describe('Login Component', () => {
  let store;
  let mockDispatch;

  beforeEach(() => {
    // Set up a mock store
    store = mockStore({
      auth: {
        isAuthenticated: false,
        loading: false,
        error: null,
      },
    });

    // Mock dispatch function
    mockDispatch = jest.fn();
    store.dispatch = mockDispatch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderLoginComponent = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );
  };

  test('renders login form correctly', () => {
    renderLoginComponent();

    // Check if form elements are rendered
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  test('validates form inputs', async () => {
    renderLoginComponent();

    // Submit form without filling in any fields
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    // Fill in email with invalid format
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(loginButton);

    // Check for email format validation error
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  test('submits form with valid data', async () => {
    // Mock successful login API response
    axios.post.mockResolvedValue({
      data: {
        token: 'fake-token',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin',
        },
      },
    });

    renderLoginComponent();

    // Fill in form with valid data
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // Check if API was called with correct data
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        {
          email: 'test@example.com',
          password: 'password123',
        }
      );
    });

    // Check if dispatch was called with login action
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('auth/login'),
          payload: expect.objectContaining({
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
          }),
        })
      );
    });
  });

  test('handles login error', async () => {
    // Mock failed login API response
    axios.post.mockRejectedValue({
      response: {
        data: {
          message: 'Invalid credentials',
        },
        status: 401,
      },
    });

    renderLoginComponent();

    // Fill in form with valid data
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
    fireEvent.click(loginButton);

    // Check if error message is displayed
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('auth/setError'),
          payload: 'Invalid credentials',
        })
      );
    });
  });

  test('toggles password visibility', () => {
    renderLoginComponent();

    // Get password input and visibility toggle button
    const passwordInput = screen.getByLabelText(/password/i);
    const visibilityToggle = screen.getByRole('button', { name: /toggle password visibility/i });

    // Password should be hidden initially
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click visibility toggle
    fireEvent.click(visibilityToggle);

    // Password should be visible
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Click visibility toggle again
    fireEvent.click(visibilityToggle);

    // Password should be hidden again
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('navigates to forgot password page', () => {
    renderLoginComponent();

    // Get forgot password link
    const forgotPasswordLink = screen.getByText(/forgot password/i);

    // Click the link
    fireEvent.click(forgotPasswordLink);

    // Check if navigation was attempted
    // Note: We can't directly test navigation in this setup,
    // but we can check if the link has the correct attributes
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
  });

  test('navigates to register page', () => {
    renderLoginComponent();

    // Get register link
    const registerLink = screen.getByText(/register now/i);

    // Click the link
    fireEvent.click(registerLink);

    // Check if navigation was attempted
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });
});