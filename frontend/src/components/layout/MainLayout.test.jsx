import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import MainLayout from './MainLayout';

// Mock the components used in MainLayout
jest.mock('../LanguageSwitcher', () => () => <div data-testid="language-switcher">Language Switcher</div>);
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  useNavigate: () => jest.fn(),
}));

// Create mock store
const mockStore = configureStore([]);

describe('MainLayout Component', () => {
  let store;

  beforeEach(() => {
    // Set up a mock store with authenticated user
    store = mockStore({
      auth: {
        isAuthenticated: true,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin',
        },
        loading: false,
        error: null,
      },
      theme: {
        mode: 'light',
      },
    });

    // Mock dispatch function
    store.dispatch = jest.fn();
  });

  const renderMainLayout = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </Provider>
    );
  };

  test('renders main layout with sidebar and header', () => {
    renderMainLayout();
    
    // Check if the main components are rendered
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  test('toggles sidebar when menu button is clicked', () => {
    renderMainLayout();
    
    // Find the menu button and click it
    const menuButton = screen.getByLabelText('open drawer');
    
    // Initially sidebar should be open (in desktop view)
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Click to close sidebar
    fireEvent.click(menuButton);
    
    // Click again to open sidebar
    fireEvent.click(menuButton);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('dispatches logout action when logout button is clicked', () => {
    renderMainLayout();
    
    // Find and click the logout button
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    // Check if logout action was dispatched
    expect(store.dispatch).toHaveBeenCalled();
  });

  test('renders user profile menu when avatar is clicked', () => {
    renderMainLayout();
    
    // Find and click the avatar
    const avatar = screen.getByAltText('User Avatar');
    fireEvent.click(avatar);
    
    // Check if profile menu items are displayed
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('renders correct menu items in sidebar', () => {
    renderMainLayout();
    
    // Check if all main menu items are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    // Removed: Inventory menu no longer present
    // expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});