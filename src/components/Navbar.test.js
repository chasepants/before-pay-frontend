import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import NavbarComponent from './Navbar';
import api from '../api';

// Mock the API module
jest.mock('../api', () => ({
  get: jest.fn()
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate
}));

// Mock window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload
  },
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  removeItem: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock Bootstrap
Object.defineProperty(window, 'bootstrap', {
  value: {
    Collapse: jest.fn()
  },
  writable: true
});

describe('NavbarComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockReload.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should render navbar with logo when no user is provided', () => {
    renderWithRouter(<NavbarComponent user={null} />);
    
    expect(screen.getByAltText('App Logo')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('beforepay-logo.png'));
    expect(screen.getByRole('img')).toHaveStyle({ width: '150px' });
  });

  it('should render navbar with user menu when user is provided', () => {
    const user = { id: '1', name: 'Test User' };
    renderWithRouter(<NavbarComponent user={user} />);
    
    expect(screen.getByAltText('App Logo')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should render application link when user has no unitCustomerId and status is not approved', () => {
    const user = { id: '1', name: 'Test User', status: 'pending' };
    renderWithRouter(<NavbarComponent user={user} />);
    
    expect(screen.getByText('Application')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should not render application link when user has unitCustomerId', () => {
    const user = { id: '1', name: 'Test User', unitCustomerId: 'unit123' };
    renderWithRouter(<NavbarComponent user={user} />);
    
    expect(screen.queryByText('Application')).not.toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should not render application link when user status is approved', () => {
    const user = { id: '1', name: 'Test User', status: 'approved' };
    renderWithRouter(<NavbarComponent user={user} />);
    
    expect(screen.queryByText('Application')).not.toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should navigate to home when logo is clicked', () => {
    renderWithRouter(<NavbarComponent user={null} />);
    
    const logo = screen.getByAltText('App Logo');
    fireEvent.click(logo);
    
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('should handle application click and navigate to application-signup', () => {
    const user = { id: '1', name: 'Test User', status: 'pending' };
    renderWithRouter(<NavbarComponent user={user} />);
    
    const applicationLink = screen.getByText('Application');
    fireEvent.click(applicationLink);
    
    expect(mockNavigate).toHaveBeenCalledWith('/application-signup');
  });

  it('should handle logout successfully', async () => {
    const user = { id: '1', name: 'Test User' };
    api.get.mockResolvedValue({ data: {} });
    
    renderWithRouter(<NavbarComponent user={user} />);
    
    const logoutLink = screen.getByText('Logout');
    fireEvent.click(logoutLink);
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/auth/logout');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('unitVerifiedCustomerToken');
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(mockReload).toHaveBeenCalled();
    });
  });

  it('should handle logout error', async () => {
    const user = { id: '1', name: 'Test User' };
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    api.get.mockRejectedValue(new Error('Logout failed'));
    
    renderWithRouter(<NavbarComponent user={user} />);
    
    const logoutLink = screen.getByText('Logout');
    fireEvent.click(logoutLink);
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/auth/logout');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle toggle click', () => {
    const user = { id: '1', name: 'Test User' };
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Mock getElementById
    const mockNavbarNav = { classList: { toString: () => 'navbar-collapse' } };
    jest.spyOn(document, 'getElementById').mockReturnValue(mockNavbarNav);
    
    renderWithRouter(<NavbarComponent user={user} />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle navigation/i });
    fireEvent.click(toggleButton);
    
    expect(consoleLogSpy).toHaveBeenCalledWith('Hamburger menu toggled');
    expect(consoleLogSpy).toHaveBeenCalledWith('NavbarNav classList:', 'navbar-collapse');
    expect(consoleLogSpy).toHaveBeenCalledWith('Bootstrap collapse initialized:', true);
    
    consoleLogSpy.mockRestore();
  });

  it('should handle navigation error in application click', () => {
    const user = { id: '1', name: 'Test User', status: 'pending' };
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockNavigate.mockImplementation(() => {
      throw new Error('Navigation failed');
    });
    
    renderWithRouter(<NavbarComponent user={user} />);
    
    const applicationLink = screen.getByText('Application');
    fireEvent.click(applicationLink);
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('Navigation error:', expect.any(Error));
    
    consoleErrorSpy.mockRestore();
  });
});
