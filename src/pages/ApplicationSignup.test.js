import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ApplicationSignup from './ApplicationSignup';
import userSlice from '../store/userSlice';

// Mock the API
jest.mock('../api', () => ({
  get: jest.fn(),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

// Mock the Navbar component
jest.mock('../components/Navbar', () => {
  return function MockNavbar({ user }) {
    return (
      <nav data-testid="navbar">
        <div>Navbar</div>
        {user && <div>User: {user.firstName}</div>}
      </nav>
    );
  };
});

// Mock window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
  },
  writable: true,
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

describe('ApplicationSignup', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockReload.mockClear();
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading States', () => {
    test('returns null when user is loading', () => {
      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { loading: true }
        }
      });

      expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
    });

    test('returns null when user is not logged in', () => {
      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { user: null, loading: false }
        }
      });

      expect(screen.queryByTestId('navbar')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Logic', () => {
    test('navigates to home when user is approved', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: { id: 'form-123', token: 'token-123' } });

      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { 
            user: { 
              _id: '1', 
              firstName: 'John',
              unitCustomerId: 'unit-123',
              status: 'approved'
            },
            loading: false
          }
        }
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });
    });

    test('does not navigate when user is not approved', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: { id: 'form-123', token: 'token-123' } });

      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { 
            user: { 
              _id: '1', 
              firstName: 'John',
              status: 'pending'
            },
            loading: false
          }
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalledWith('/home');
    });
  });

  describe('Application Form Loading', () => {
    test('shows loading message when form is not loaded', async () => {
      const mockApi = require('../api');
      mockApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { 
            user: { _id: '1', firstName: 'John' },
            loading: false
          }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Loading application form...')).toBeInTheDocument();
      });
    });

    test('renders application form when loaded successfully', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ 
        data: { id: 'form-123', token: 'token-123' } 
      });

      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { 
            user: { _id: '1', firstName: 'John' },
            loading: false
          }
        }
      });

      await waitFor(() => {
        const formElement = document.querySelector('unit-elements-application-form');
        expect(formElement).toBeInTheDocument();
        expect(formElement).toHaveAttribute('application-form-id', 'form-123');
        expect(formElement).toHaveAttribute('application-form-token', 'token-123');
      });
    });
  });

  describe('Error Handling', () => {
    test('shows error message when API call fails', async () => {
      const mockApi = require('../api');
      mockApi.get.mockRejectedValue({ 
        response: { data: { error: 'API Error' } } 
      });

      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { 
            user: { _id: '1', firstName: 'John' },
            loading: false
          }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to load application form: API Error')).toBeInTheDocument();
      });
    });

    test('shows generic error when no specific error message', async () => {
      const mockApi = require('../api');
      mockApi.get.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { 
            user: { _id: '1', firstName: 'John' },
            loading: false
          }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to load application form: Network error')).toBeInTheDocument();
      });
    });

    test('shows retry button when error occurs', async () => {
      const mockApi = require('../api');
      mockApi.get.mockRejectedValue({ 
        response: { data: { error: 'API Error' } } 
      });

      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { 
            user: { _id: '1', firstName: 'John' },
            loading: false
          }
        }
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
      });
    });

    test('reloads page when retry button is clicked', async () => {
      const mockApi = require('../api');
      mockApi.get.mockRejectedValue({ 
        response: { data: { error: 'API Error' } } 
      });

      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { 
            user: { _id: '1', firstName: 'John' },
            loading: false
          }
        }
      });

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: 'Retry' });
        fireEvent.click(retryButton);
        expect(mockReload).toHaveBeenCalled();
      });
    });
  });

  describe('Unit Elements Integration', () => {
    test('sets up event listeners when form is loaded', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ 
        data: { id: 'form-123', token: 'token-123' } 
      });

      // Mock addEventListener
      const mockAddEventListener = jest.fn();
      const mockQuerySelector = jest.fn(() => ({
        addEventListener: mockAddEventListener
      }));
      document.querySelector = mockQuerySelector;

      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { 
            user: { _id: '1', firstName: 'John' },
            loading: false
          }
        }
      });

      await waitFor(() => {
        expect(mockQuerySelector).toHaveBeenCalledWith('unit-elements-application-form');
        expect(mockAddEventListener).toHaveBeenCalledWith('unitOnLoad', expect.any(Function));
        expect(mockAddEventListener).toHaveBeenCalledWith('unitApplicationFormCompleted', expect.any(Function));
      });
    });

    test('handles unitOnLoad event with errors', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ 
        data: { id: 'form-123', token: 'token-123' } 
      });

      let onLoadHandler;
      const mockAddEventListener = jest.fn((event, handler) => {
        if (event === 'unitOnLoad') {
          onLoadHandler = handler;
        }
      });
      const mockQuerySelector = jest.fn(() => ({
        addEventListener: mockAddEventListener
      }));
      document.querySelector = mockQuerySelector;

      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { 
            user: { _id: '1', firstName: 'John' },
            loading: false
          }
        }
      });

      await waitFor(() => {
        expect(mockAddEventListener).toHaveBeenCalled();
      });

      // Simulate unitOnLoad event with errors
      if (onLoadHandler) {
        onLoadHandler({
          detail: {
            errors: [{ title: 'Form initialization failed' }]
          }
        });
      }

      await waitFor(() => {
        expect(screen.getByText('Failed to initialize application form: Form initialization failed')).toBeInTheDocument();
      });
    });

    test('handles unitApplicationFormCompleted event', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ 
        data: { id: 'form-123', token: 'token-123' } 
      });

      let onCompletedHandler;
      const mockAddEventListener = jest.fn((event, handler) => {
        if (event === 'unitApplicationFormCompleted') {
          onCompletedHandler = handler;
        }
      });
      const mockQuerySelector = jest.fn(() => ({
        addEventListener: mockAddEventListener
      }));
      document.querySelector = mockQuerySelector;

      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { 
            user: { _id: '1', firstName: 'John' },
            loading: false
          }
        }
      });

      await waitFor(() => {
        expect(mockAddEventListener).toHaveBeenCalled();
      });

      // Simulate unitApplicationFormCompleted event
      if (onCompletedHandler) {
        onCompletedHandler({
          detail: { success: true }
        });
      }

      expect(mockNavigate).toHaveBeenCalledWith('/pending');
    });
  });

  describe('Component Structure', () => {
    test('renders navbar with user', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ 
        data: { id: 'form-123', token: 'token-123' } 
      });

      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { 
            user: { _id: '1', firstName: 'John' },
            loading: false
          }
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
        expect(screen.getByText('User: John')).toBeInTheDocument();
      });
    });

    test('has proper container structure', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ 
        data: { id: 'form-123', token: 'token-123' } 
      });

      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { 
            user: { _id: '1', firstName: 'John' },
            loading: false
          }
        }
      });

      await waitFor(() => {
        // Use screen.getByRole or screen.getByText to find elements instead of querySelector
        const container = screen.getByTestId('navbar').closest('.container');
        expect(container).toBeInTheDocument();
        expect(container).toHaveClass('mb-4');
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper error message styling', async () => {
      const mockApi = require('../api');
      mockApi.get.mockRejectedValue({ 
        response: { data: { error: 'API Error' } } 
      });

      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { 
            user: { _id: '1', firstName: 'John' },
            loading: false
          }
        }
      });

      await waitFor(() => {
        const errorMessage = screen.getByText('Failed to load application form: API Error');
        expect(errorMessage).toHaveStyle('color: red');
      });
    });

    test('has proper button styling', async () => {
      const mockApi = require('../api');
      mockApi.get.mockRejectedValue({ 
        response: { data: { error: 'API Error' } } 
      });

      renderWithProviders(<ApplicationSignup />, {
        initialState: {
          user: { 
            user: { _id: '1', firstName: 'John' },
            loading: false
          }
        }
      });

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: 'Retry' });
        expect(retryButton).toHaveClass('btn', 'btn-primary');
      });
    });
  });
});
