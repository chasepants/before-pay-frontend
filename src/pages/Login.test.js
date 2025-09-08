import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Login from './Login';
import userSlice from '../store/userSlice';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

// Mock the EmailAuth component
jest.mock('../components/EmailAuth', () => {
  return function MockEmailAuth({ mode, onSuccess, onError }) {
    return (
      <div data-testid="email-auth-component">
        <div>Email Auth Component - Mode: {mode}</div>
        <button 
          onClick={() => onSuccess({ token: 'mock-token', user: { _id: '1', firstName: 'John' } })}
          data-testid="mock-email-success"
        >
          Mock Email Success
        </button>
        <button 
          onClick={() => onError('Mock email error')}
          data-testid="mock-email-error"
        >
          Mock Email Error
        </button>
      </div>
    );
  };
});

// Mock window.location
const mockLocation = {
  href: ''
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      user: userSlice,
    },
    preloadedState: {
      user: {
        user: null,
        loading: false,
        error: null,
        ...initialState.user,
      },
    },
  });
};

// Helper function to render component with store and router
const renderWithProviders = (component, { initialState = {} } = {}) => {
  const store = createMockStore(initialState);
  return render(
    <Provider store={store}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </Provider>
  );
};

describe('Login', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLocation.href = '';
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    test('renders login form with all elements', () => {
      renderWithProviders(<Login />);

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to continue saving towards your goals')).toBeInTheDocument();
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
      expect(screen.getByText('Continue with Microsoft')).toBeInTheDocument();
      expect(screen.getByText('Sign in with email')).toBeInTheDocument();
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      expect(screen.getByText('Sign up')).toBeInTheDocument();
    });

    test('renders logo', () => {
      renderWithProviders(<Login />);

      const logo = screen.getByAltText('Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'beforepay-logo.png');
    });

    test('renders terms and privacy links', () => {
      renderWithProviders(<Login />);

      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });

    test('renders forgot password link', () => {
      renderWithProviders(<Login />);

      expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
    });
  });

  describe('Google Authentication', () => {
    test('redirects to Google OAuth when Google button is clicked', () => {
      renderWithProviders(<Login />);

      const googleButton = screen.getByText('Continue with Google');
      fireEvent.click(googleButton);

      expect(mockLocation.href).toBe(`${process.env.REACT_APP_API_URL}/api/auth/google`);
    });

    test('shows loading state when Google button is clicked', () => {
      renderWithProviders(<Login />);

      const googleButton = screen.getByText('Continue with Google');
      fireEvent.click(googleButton);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(googleButton).toBeDisabled();
    });
  });

  describe('Email Authentication', () => {
    test('opens email auth modal when email button is clicked', () => {
      renderWithProviders(<Login />);

      const emailButton = screen.getByText('Sign in with email');
      fireEvent.click(emailButton);

      expect(screen.getByTestId('email-auth-modal')).toBeInTheDocument();
      expect(screen.getByTestId('email-auth-modal-title')).toBeInTheDocument();
      expect(screen.getByTestId('email-auth-component')).toBeInTheDocument();
    });

    test('closes email auth modal when close button is clicked', () => {
      renderWithProviders(<Login />);

      // Open modal
      const emailButton = screen.getByText('Sign in with email');
      fireEvent.click(emailButton);

      expect(screen.getByTestId('email-auth-modal')).toBeInTheDocument();

      // Close modal using the close button
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      // Wait for the modal to close
      waitFor(() => {
        expect(screen.queryByTestId('email-auth-modal')).not.toBeInTheDocument();
      });
    });

    test('handles successful email authentication', async () => {
      renderWithProviders(<Login />);

      // Open email auth modal
      const emailButton = screen.getByText('Sign in with email');
      fireEvent.click(emailButton);

      // Trigger successful authentication
      const successButton = screen.getByTestId('mock-email-success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });

      // Check that user data is stored in localStorage
      expect(localStorage.getItem('authToken')).toBe('mock-token');
      expect(localStorage.getItem('user')).toBe(JSON.stringify({ _id: '1', firstName: 'John' }));
    });

    test('handles email authentication error', () => {
      renderWithProviders(<Login />);

      // Open email auth modal
      const emailButton = screen.getByText('Sign in with email');
      fireEvent.click(emailButton);

      // Trigger error
      const errorButton = screen.getByTestId('mock-email-error');
      fireEvent.click(errorButton);

      // Should not navigate on error
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('navigates to signup from email modal', () => {
      renderWithProviders(<Login />);

      // Open email auth modal
      const emailButton = screen.getByText('Sign in with email');
      fireEvent.click(emailButton);

      // Click signup link in modal
      const signupLink = screen.getByTestId('modal-signup-link');
      fireEvent.click(signupLink);

      expect(mockNavigate).toHaveBeenCalledWith('/signup');
    });
  });

  describe('Coming Soon Providers', () => {
    test('shows alert for Apple authentication', () => {
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      renderWithProviders(<Login />);

      const appleButton = screen.getByText('Continue with Apple');
      fireEvent.click(appleButton);

      expect(mockAlert).toHaveBeenCalledWith('Apple authentication is coming soon!');
      mockAlert.mockRestore();
    });

    test('shows alert for Microsoft authentication', () => {
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      renderWithProviders(<Login />);

      const microsoftButton = screen.getByText('Continue with Microsoft');
      fireEvent.click(microsoftButton);

      expect(mockAlert).toHaveBeenCalledWith('Microsoft authentication is coming soon!');
      mockAlert.mockRestore();
    });

    test('shows "Soon" badges on coming soon providers', () => {
      renderWithProviders(<Login />);

      const soonBadges = screen.getAllByText('Soon');
      expect(soonBadges).toHaveLength(2);
    });
  });

  describe('Navigation', () => {
    test('navigates to signup when signup link is clicked', () => {
      renderWithProviders(<Login />);

      const signupLink = screen.getByText('Sign up');
      fireEvent.click(signupLink);

      expect(mockNavigate).toHaveBeenCalledWith('/signup');
    });
  });

  describe('UI Elements', () => {
    test('renders all authentication provider buttons', () => {
      renderWithProviders(<Login />);

      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
      expect(screen.getByText('Continue with Microsoft')).toBeInTheDocument();
      expect(screen.getByText('Sign in with email')).toBeInTheDocument();
    });

    test('renders divider text', () => {
      renderWithProviders(<Login />);

      expect(screen.getByText('or')).toBeInTheDocument();
    });

    test('renders footer links', () => {
      renderWithProviders(<Login />);

      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      expect(screen.getByText('Sign up')).toBeInTheDocument();
    });

    test('applies correct styling classes', () => {
      renderWithProviders(<Login />);

      const card = screen.getByText('Welcome Back').closest('.card');
      expect(card).toHaveClass('border-0', 'shadow-lg');

      const container = screen.getByText('Welcome Back').closest('.container');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', () => {
      renderWithProviders(<Login />);

      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Welcome Back');
    });

    test('has proper button roles', () => {
      renderWithProviders(<Login />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Check that all buttons are accessible
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    test('has proper link elements', () => {
      renderWithProviders(<Login />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Modal Functionality', () => {
    test('email auth modal has correct title', () => {
      renderWithProviders(<Login />);

      const emailButton = screen.getByText('Sign in with email');
      fireEvent.click(emailButton);

      expect(screen.getByTestId('email-auth-modal-title')).toBeInTheDocument();
    });

    test('email auth modal passes correct props to EmailAuth component', () => {
      renderWithProviders(<Login />);

      const emailButton = screen.getByText('Sign in with email');
      fireEvent.click(emailButton);

      const emailAuthComponent = screen.getByTestId('email-auth-component');
      expect(emailAuthComponent).toBeInTheDocument();
      expect(emailAuthComponent).toHaveTextContent('Mode: login');
    });

    test('email auth modal has signup link in footer', () => {
      renderWithProviders(<Login />);

      const emailButton = screen.getByText('Sign in with email');
      fireEvent.click(emailButton);

      expect(screen.getByTestId('modal-signup-link')).toBeInTheDocument();
    });
  });

  describe('Environment Variables', () => {
    test('uses correct API URL for Google OAuth', () => {
      const originalEnv = process.env.REACT_APP_API_URL;
      process.env.REACT_APP_API_URL = 'https://test-api.com';

      renderWithProviders(<Login />);

      const googleButton = screen.getByText('Continue with Google');
      fireEvent.click(googleButton);

      expect(mockLocation.href).toBe('https://test-api.com/api/auth/google');

      // Restore original value
      process.env.REACT_APP_API_URL = originalEnv;
    });
  });

  describe('Loading States', () => {
    test('shows spinner when Google authentication is loading', () => {
      renderWithProviders(<Login />);

      const googleButton = screen.getByText('Continue with Google');
      fireEvent.click(googleButton);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('disables Google button when loading', () => {
      renderWithProviders(<Login />);

      const googleButton = screen.getByText('Continue with Google');
      fireEvent.click(googleButton);

      expect(googleButton).toBeDisabled();
    });
  });
});
