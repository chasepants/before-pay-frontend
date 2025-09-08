import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Signup from './Signup';
import userSlice from '../store/userSlice';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

// Mock the EmailAuth component with controllable behavior
let mockEmailAuthResponse = {
  token: 'mock-token',
  user: { _id: '1', firstName: 'John' },
  emailVerificationSent: true,
  emailVerified: false
};

jest.mock('../components/EmailAuth', () => {
  return function MockEmailAuth({ mode, onSuccess, onError }) {
    return (
      <div data-testid="email-auth-component">
        <div>Email Auth Component - Mode: {mode}</div>
        <button 
          onClick={() => onSuccess(mockEmailAuthResponse)}
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

describe('Signup', () => {
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
    test('renders signup form with all elements', () => {
      renderWithProviders(<Signup />);

      expect(screen.getByText('Create Your Account')).toBeInTheDocument();
      expect(screen.getByText('Start saving towards your goals today')).toBeInTheDocument();
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
      expect(screen.getByText('Continue with Microsoft')).toBeInTheDocument();
      expect(screen.getByText('Sign up with email')).toBeInTheDocument();
      expect(screen.getByText('Already have an account?')).toBeInTheDocument();
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });

    test('renders logo', () => {
      renderWithProviders(<Signup />);

      const logo = screen.getByAltText('Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'beforepay-logo.png');
    });

    test('renders terms and privacy links', () => {
      renderWithProviders(<Signup />);

      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });

    test('renders coming soon badges', () => {
      renderWithProviders(<Signup />);

      const soonBadges = screen.getAllByText('Soon');
      expect(soonBadges).toHaveLength(2);
    });
  });

  describe('Google Authentication', () => {
    test('redirects to Google OAuth when Google button is clicked', () => {
      renderWithProviders(<Signup />);

      const googleButton = screen.getByText('Continue with Google');
      fireEvent.click(googleButton);

      expect(mockLocation.href).toBe(`${process.env.REACT_APP_API_URL}/api/auth/google`);
    });

    test('shows loading state when Google button is clicked', () => {
      renderWithProviders(<Signup />);

      const googleButton = screen.getByText('Continue with Google');
      fireEvent.click(googleButton);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(googleButton).toBeDisabled();
    });
  });

  describe('Email Authentication', () => {
    test('opens email auth modal when email button is clicked', () => {
      renderWithProviders(<Signup />);

      const emailButton = screen.getByText('Sign up with email');
      fireEvent.click(emailButton);

      expect(screen.getByText('Create Account with Email')).toBeInTheDocument();
      expect(screen.getByTestId('email-auth-component')).toBeInTheDocument();
    });

    test('closes email auth modal when close button is clicked', () => {
      renderWithProviders(<Signup />);

      // Open modal
      const emailButton = screen.getByText('Sign up with email');
      fireEvent.click(emailButton);

      expect(screen.getByText('Create Account with Email')).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      // The modal element stays in DOM but becomes hidden
      const modal = screen.getByTestId('email-auth-modal');
      expect(modal).not.toHaveClass('show');
    });

    test('handles successful email authentication', async () => {
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      renderWithProviders(<Signup />);

      // Open email auth modal
      const emailButton = screen.getByText('Sign up with email');
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

      // Check that email verification alert was shown
      expect(mockAlert).toHaveBeenCalledWith('Account created successfully! Please check your email and click the verification link to complete your registration.');
      
      mockAlert.mockRestore();
    });

    test('handles email authentication error', () => {
      renderWithProviders(<Signup />);

      // Open email auth modal
      const emailButton = screen.getByText('Sign up with email');
      fireEvent.click(emailButton);

      // Trigger error
      const errorButton = screen.getByTestId('mock-email-error');
      fireEvent.click(errorButton);

      // Should not navigate on error
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('navigates to login from email modal', () => {
      renderWithProviders(<Signup />);

      // Open email auth modal
      const emailButton = screen.getByText('Sign up with email');
      fireEvent.click(emailButton);

      // Click sign in link in modal using data-testid
      const signInLink = screen.getByTestId('modal-signin-link');
      fireEvent.click(signInLink);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Coming Soon Providers', () => {
    test('shows alert for Apple authentication', () => {
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      renderWithProviders(<Signup />);

      const appleButton = screen.getByText('Continue with Apple');
      fireEvent.click(appleButton);

      expect(mockAlert).toHaveBeenCalledWith('Apple authentication is coming soon!');
      mockAlert.mockRestore();
    });

    test('shows alert for Microsoft authentication', () => {
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      renderWithProviders(<Signup />);

      const microsoftButton = screen.getByText('Continue with Microsoft');
      fireEvent.click(microsoftButton);

      expect(mockAlert).toHaveBeenCalledWith('Microsoft authentication is coming soon!');
      mockAlert.mockRestore();
    });
  });

  describe('Navigation', () => {
    test('navigates to login when sign in link is clicked', () => {
      renderWithProviders(<Signup />);

      // Use data-testid to target the main sign in link
      const signInLink = screen.getByTestId('main-signin-link');
      fireEvent.click(signInLink);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('UI Elements', () => {
    test('renders all authentication provider buttons', () => {
      renderWithProviders(<Signup />);

      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      expect(screen.getByText('Continue with Apple')).toBeInTheDocument();
      expect(screen.getByText('Continue with Microsoft')).toBeInTheDocument();
      expect(screen.getByText('Sign up with email')).toBeInTheDocument();
    });

    test('renders divider text', () => {
      renderWithProviders(<Signup />);

      expect(screen.getByText('or')).toBeInTheDocument();
    });

    test('renders footer links', () => {
      renderWithProviders(<Signup />);

      expect(screen.getByText('Already have an account?')).toBeInTheDocument();
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });

    test('applies correct styling classes', () => {
      renderWithProviders(<Signup />);

      const card = screen.getByText('Create Your Account').closest('.card');
      expect(card).toHaveClass('border-0', 'shadow-lg');

      const container = screen.getByText('Create Your Account').closest('.container');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', () => {
      renderWithProviders(<Signup />);

      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Create Your Account');
    });

    test('has proper button roles', () => {
      renderWithProviders(<Signup />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Check that all buttons are accessible
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    test('has proper link elements', () => {
      renderWithProviders(<Signup />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Modal Functionality', () => {
    test('email auth modal has correct title', () => {
      renderWithProviders(<Signup />);

      const emailButton = screen.getByText('Sign up with email');
      fireEvent.click(emailButton);

      expect(screen.getByTestId('email-auth-modal-title')).toBeInTheDocument();
    });

    test('email auth modal passes correct props to EmailAuth component', () => {
      renderWithProviders(<Signup />);

      const emailButton = screen.getByText('Sign up with email');
      fireEvent.click(emailButton);

      const emailAuthComponent = screen.getByTestId('email-auth-component');
      expect(emailAuthComponent).toBeInTheDocument();
      expect(emailAuthComponent).toHaveTextContent('Mode: register');
    });

    test('email auth modal has sign in link in footer', () => {
      renderWithProviders(<Signup />);

      const emailButton = screen.getByText('Sign up with email');
      fireEvent.click(emailButton);

      expect(screen.getByTestId('modal-signin-link')).toBeInTheDocument();
    });
  });

  describe('Environment Variables', () => {
    test('uses correct API URL for Google OAuth', () => {
      const originalEnv = process.env.REACT_APP_API_URL;
      process.env.REACT_APP_API_URL = 'https://test-api.com';

      renderWithProviders(<Signup />);

      const googleButton = screen.getByText('Continue with Google');
      fireEvent.click(googleButton);

      expect(mockLocation.href).toBe('https://test-api.com/api/auth/google');

      // Restore original value
      process.env.REACT_APP_API_URL = originalEnv;
    });
  });

  describe('Loading States', () => {
    test('shows spinner when Google authentication is loading', () => {
      renderWithProviders(<Signup />);

      const googleButton = screen.getByText('Continue with Google');
      fireEvent.click(googleButton);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('disables Google button when loading', () => {
      renderWithProviders(<Signup />);

      const googleButton = screen.getByText('Continue with Google');
      fireEvent.click(googleButton);

      expect(googleButton).toBeDisabled();
    });
  });

  describe('Email Verification', () => {
    test('shows email verification alert when emailVerificationSent is true', async () => {
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      // Set up mock response for unverified email
      mockEmailAuthResponse = {
        token: 'mock-token',
        user: { _id: '1', firstName: 'John' },
        emailVerificationSent: true,
        emailVerified: false
      };
      
      renderWithProviders(<Signup />);

      // Open email auth modal
      const emailButton = screen.getByText('Sign up with email');
      fireEvent.click(emailButton);

      // Trigger successful authentication with email verification
      const successButton = screen.getByTestId('mock-email-success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Account created successfully! Please check your email and click the verification link to complete your registration.');
      });

      mockAlert.mockRestore();
    });

    test('does not show email verification alert when emailVerified is true', async () => {
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      // Set up mock response for verified email
      mockEmailAuthResponse = {
        token: 'mock-token',
        user: { _id: '1', firstName: 'John' },
        emailVerificationSent: true,
        emailVerified: true // Email is already verified
      };
      
      renderWithProviders(<Signup />);

      // Open email auth modal
      const emailButton = screen.getByText('Sign up with email');
      fireEvent.click(emailButton);

      // Trigger successful authentication
      const successButton = screen.getByTestId('mock-email-success');
      fireEvent.click(successButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });

      // Should not show email verification alert
      expect(mockAlert).not.toHaveBeenCalledWith('Account created successfully! Please check your email and click the verification link to complete your registration.');

      mockAlert.mockRestore();
    });
  });
});
