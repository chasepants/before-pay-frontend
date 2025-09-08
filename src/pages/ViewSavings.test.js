import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ViewSavings from './ViewSavings';
import userSlice from '../store/userSlice';
import savingsSlice from '../store/savingsSlice';

// Mock the API
jest.mock('../api', () => ({
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
}));

// Mock useNavigate and useParams
const mockNavigate = jest.fn();
const mockParams = { savingsGoalId: 'test-goal-id' };
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

// Mock the Navbar component
jest.mock('../components/Navbar', () => {
  return function MockNavbar({ user }) {
    return <nav data-testid="navbar">Navbar</nav>;
  };
});

// Mock the LoadingAnimation component
jest.mock('../components/LoadingAnimation', () => {
  return function MockLoadingAnimation() {
    return <div data-testid="loading-animation">Loading...</div>;
  };
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

describe('ViewSavings', () => {
  const mockSavingsGoal = {
    _id: 'test-goal-id',
    goalName: 'Test Goal',
    description: 'Test Description',
    targetAmount: 1000,
    currentAmount: 500,
    category: 'custom',
    product: null,
    transfers: []
  };

  beforeEach(() => {
    mockNavigate.mockClear();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    test('redirects to home when user is not logged in', () => {
      renderWithProviders(<ViewSavings />, {
        initialState: { user: { user: null } }
      });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('shows loading animation when loading', () => {
      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });
      expect(screen.getByTestId('loading-animation')).toBeInTheDocument();
    });

    test('renders navbar', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('shows error message when goal is not found', async () => {
      const mockApi = require('../api');
      mockApi.get.mockRejectedValue({ response: { status: 404 } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Savings goal not found')).toBeInTheDocument();
      });
    });

    test('shows back to home button when error occurs', async () => {
      const mockApi = require('../api');
      mockApi.get.mockRejectedValue({ response: { status: 404 } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: 'Back to Home' });
        expect(backButton).toBeInTheDocument();
        fireEvent.click(backButton);
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });
    });
  });

  describe('Goal Display', () => {
    beforeEach(() => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: { transactions: [] } });
    });

    test('displays goal name from Redux store', async () => {
      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });
    });

    test('displays goal name from API when not in store', async () => {
      const mockApi = require('../api');
      mockApi.get
        .mockResolvedValueOnce({ data: mockSavingsGoal })
        .mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    test('fetches goal from API when not in store', async () => {
      const mockApi = require('../api');
      mockApi.get
        .mockResolvedValueOnce({ data: mockSavingsGoal })
        .mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/api/savings-goal/test-goal-id');
      });
    });

    test('fetches transactions when goal is loaded', async () => {
      const mockApi = require('../api');
      mockApi.get
        .mockResolvedValueOnce({ data: mockSavingsGoal })
        .mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/api/bank/transaction-history/test-goal-id');
      });
    });
  });
});
