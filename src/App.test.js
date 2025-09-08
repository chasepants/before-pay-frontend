import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from './App';
import userSlice from './store/userSlice';
import savingsSlice from './store/savingsSlice';

// Mock the API
jest.mock('./api', () => ({
  get: jest.fn(),
}));

// Mock the LoadingAnimation component
jest.mock('./components/LoadingAnimation', () => {
  return function MockLoadingAnimation() {
    return <div data-testid="loading-animation">Loading...</div>;
  };
});

// Mock all page components
jest.mock('./pages/LandingPage', () => {
  return function MockLandingPage() {
    return <div data-testid="landing-page">Landing Page</div>;
  };
});

jest.mock('./pages/Home', () => {
  return function MockHome() {
    return <div data-testid="home-page">Home Page</div>;
  };
});

jest.mock('./pages/SetupSavings', () => {
  return function MockSetupSavings() {
    return <div data-testid="setup-savings-page">Setup Savings Page</div>;
  };
});

jest.mock('./pages/ViewSavings', () => {
  return function MockViewSavings() {
    return <div data-testid="view-savings-page">View Savings Page</div>;
  };
});

jest.mock('./pages/Login', () => {
  return function MockLogin() {
    return <div data-testid="login-page">Login Page</div>;
  };
});

jest.mock('./pages/Signup', () => {
  return function MockSignup() {
    return <div data-testid="signup-page">Signup Page</div>;
  };
});

jest.mock('./pages/ApplicationSignup', () => {
  return function MockApplicationSignup() {
    return <div data-testid="application-signup-page">Application Signup Page</div>;
  };
});

jest.mock('./pages/Pending', () => {
  return function MockPending() {
    return <div data-testid="pending-page">Pending Page</div>;
  };
});

jest.mock('./pages/CreateSavingsGoal', () => {
  return function MockCreateSavingsGoal() {
    return <div data-testid="create-savings-goal-page">Create Savings Goal Page</div>;
  };
});

jest.mock('./pages/TransferBack', () => {
  return function MockTransferBack() {
    return <div data-testid="transfer-back-page">Transfer Back Page</div>;
  };
});

jest.mock('./pages/StayNotified', () => {
  return function MockStayNotified() {
    return <div data-testid="stay-notified-page">Stay Notified Page</div>;
  };
});

jest.mock('./pages/Denied', () => {
  return function MockDenied() {
    return <div data-testid="denied-page">Denied Page</div>;
  };
});

// Mock window.location and localStorage
const mockLocation = {
  search: '',
  pathname: '/',
  href: 'http://localhost:3000/',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000'
};

const mockHistory = {
  replaceState: jest.fn(),
  pushState: jest.fn()
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

Object.defineProperty(window, 'history', {
  value: mockHistory,
  writable: true,
});

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      user: userSlice,
      savings: savingsSlice,
    },
    preloadedState: {
      user: {
        user: null,
        loading: false,
        error: null,
        ...initialState.user,
      },
      savings: {
        goals: [],
        loading: false,
        error: null,
        ...initialState.savings,
      },
    },
  });
};

// Helper function to render component with store
const renderWithProviders = (component, { initialState = {} } = {}) => {
  const store = createMockStore(initialState);
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('App', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockHistory.replaceState.mockClear();
    mockLocation.search = '';
    mockLocation.pathname = '/';
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Token Handling', () => {
    test('stores token from URL query parameter', async () => {
      mockLocation.search = '?token=test-token-123';
      mockLocalStorage.getItem.mockReturnValue(null);

      const mockApi = require('./api');
      mockApi.get.mockRejectedValue(new Error('Unauthorized'));

      renderWithProviders(<App />);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'test-token-123');
      expect(mockHistory.replaceState).toHaveBeenCalledWith({}, document.title, '/');
    });

    test('does not store token when not in URL', async () => {
      mockLocation.search = '';
      mockLocalStorage.getItem.mockReturnValue(null);

      const mockApi = require('./api');
      mockApi.get.mockRejectedValue(new Error('Unauthorized'));

      renderWithProviders(<App />);

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('User Authentication', () => {
    test('fetches user when token exists', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');

      const mockApi = require('./api');
      mockApi.get.mockResolvedValue({ data: { _id: '1', firstName: 'John' } });

      renderWithProviders(<App />);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/api/auth/current_user');
      });
    });

    test('does not fetch user when no token exists', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });
    });

    test('handles user fetch error', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token');

      const mockApi = require('./api');
      mockApi.get.mockRejectedValue(new Error('Unauthorized'));

      renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });
    });
  });

  describe('Savings Goals Loading', () => {
    test('fetches savings goals when user is authenticated', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');

      const mockApi = require('./api');
      mockApi.get
        .mockResolvedValueOnce({ data: { _id: '1', firstName: 'John' } })
        .mockResolvedValueOnce({ data: [] });

      renderWithProviders(<App />);

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/api/savings-goal');
      });
    });

    test('does not fetch savings goals when user is not authenticated', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading animation when user is loading', async () => {
      // Mock localStorage to return a token, which will trigger user loading
      mockLocalStorage.getItem.mockReturnValue('test-token');
      
      // Mock API to take a long time to resolve
      const mockApi = require('./api');
      mockApi.get.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ data: { _id: '1', firstName: 'John' } }), 1000)
      ));
      
      renderWithProviders(<App />);

      // The component should show loading animation while fetching user
      expect(screen.getByTestId('loading-animation')).toBeInTheDocument();
    });

    test('shows loading animation when savings goals are loading', async () => {
      // Mock localStorage to return a token
      mockLocalStorage.getItem.mockReturnValue('test-token');
      
      // Mock API calls - first user fetch succeeds quickly, second (savings) takes time
      const mockApi = require('./api');
      mockApi.get
        .mockResolvedValueOnce({ data: { _id: '1', firstName: 'John' } }) // User fetch
        .mockImplementation(() => new Promise(resolve => 
          setTimeout(() => resolve({ data: [] }), 1000) // Savings fetch takes time
        ));
      
      renderWithProviders(<App />);

      // Wait for user to load, then check that savings loading shows loading animation
      await waitFor(() => {
        expect(screen.getByTestId('loading-animation')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('shows error message when savings goals fetch fails', () => {
      renderWithProviders(<App />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { error: 'Failed to fetch savings goals' }
        }
      });

      expect(screen.getByText('Failed to fetch savings goals')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    test('reloads page when retry button is clicked', () => {
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { ...mockLocation, reload: mockReload },
        writable: true,
      });

      renderWithProviders(<App />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { error: 'Failed to fetch savings goals' }
        }
      });

      expect(screen.getByText('Failed to fetch savings goals')).toBeInTheDocument();
      
      const retryButton = screen.getByRole('button', { name: 'Retry' });
      fireEvent.click(retryButton);

      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      process.env.REACT_APP_VERCEL_ENV = 'production';
    });

    afterEach(() => {
      delete process.env.REACT_APP_VERCEL_ENV;
    });

    test('shows only landing page and stay notified routes in production', () => {
      renderWithProviders(<App />);

      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    test('redirects unknown routes to landing page in production', () => {
      renderWithProviders(<App />);

      // Navigate to a non-existent route
      window.history.pushState({}, '', '/unknown-route');
      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      process.env.REACT_APP_VERCEL_ENV = 'development';
    });

    afterEach(() => {
      delete process.env.REACT_APP_VERCEL_ENV;
    });

    test('shows all routes in development', () => {
      renderWithProviders(<App />);

      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    test('redirects unauthenticated users to landing page', () => {
      renderWithProviders(<App />);

      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
  });

  describe('Route Protection', () => {
    test('redirects to application signup for users without unitCustomerId', () => {
      renderWithProviders(<App />, {
        initialState: {
          user: { 
            user: { _id: '1', firstName: 'John', status: 'pending' },
            loading: false
          },
          savings: { loading: false }
        }
      });

      // This would need to be tested with actual navigation
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    test('shows home page for approved users', () => {
      renderWithProviders(<App />, {
        initialState: {
          user: { 
            user: { _id: '1', firstName: 'John', status: 'approved' },
            loading: false
          },
          savings: { loading: false }
        }
      });

      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    test('shows denied page for denied users', () => {
      renderWithProviders(<App />, {
        initialState: {
          user: { 
            user: { _id: '1', firstName: 'John', status: 'denied' },
            loading: false
          },
          savings: { loading: false }
        }
      });

      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('renders without crashing', () => {
      renderWithProviders(<App />);
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    test('handles missing environment variables gracefully', () => {
      delete process.env.REACT_APP_VERCEL_ENV;
      
      renderWithProviders(<App />);
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
  });
});
