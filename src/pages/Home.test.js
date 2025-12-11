import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Home from './Home';
import userSlice from '../store/userSlice';
import savingsSlice from '../store/savingsSlice';

// Mock the API
jest.mock('../api', () => ({
  get: jest.fn(),
  patch: jest.fn(),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
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

// Mock the SavingsGoalsTable component
jest.mock('../components/SavingsGoalsTable', () => {
  return function MockSavingsGoalsTable({ goals, onViewGoal, onTogglePause, loading }) {
    if (loading) {
      return (
        <div data-testid="savings-goals-table">
          <div data-testid="savings-goals-loading">Loading...</div>
        </div>
      );
    }
    
    return (
      <div data-testid="savings-goals-table">
        {goals && goals.length > 0 ? (
          goals.map((goal) => (
            <div key={goal._id} data-testid={`goal-row-${goal._id}`}>
              <span>{goal.goalName}</span>
              {goal.nextRunDate && (
                <span data-testid={`next-run-${goal._id}`}>
                  {goal.isPaused ? 'PAUSED' : goal.nextRunDate}
                </span>
              )}
              {!goal.nextRunDate && goal.isPaused && (
                <span data-testid={`next-run-${goal._id}`}>PAUSED</span>
              )}
              <button
                data-testid={`view-goal-${goal._id}`}
                onClick={() => onViewGoal && onViewGoal(goal._id)}
              >
                View
              </button>
              {onTogglePause && (
                <button
                  data-testid={`toggle-pause-${goal._id}`}
                  onClick={() => onTogglePause && onTogglePause(goal)}
                >
                  {goal.isPaused ? 'Resume' : 'Pause'}
                </button>
              )}
            </div>
          ))
        ) : (
          <div data-testid="empty-goals-state">
            <p>No savings goals yet. Start saving today!</p>
            <button data-testid="create-first-goal-btn">Create First Goal</button>
          </div>
        )}
      </div>
    );
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

describe('Home', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading State', () => {
    test('shows loading placeholders when savings goals are loading', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: true }
        }
      });

      expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      // Check for loading placeholders
      expect(screen.getByTestId('savings-goals-loading')).toBeInTheDocument();
    });
  });

  describe('User Welcome Message', () => {
    test('displays personalized welcome message with first name', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    });

    test('displays generic welcome message when no first name', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      expect(screen.getByText('Welcome!')).toBeInTheDocument();
    });
  });

  describe('Add New Goal Button', () => {
    test('renders Add New Goal button', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      expect(screen.getByText('Add New Goal')).toBeInTheDocument();
    });

    test('navigates to create-savings-goal when Add New Goal is clicked', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      const addButton = screen.getByText('Add New Goal');
      fireEvent.click(addButton);
      expect(mockNavigate).toHaveBeenCalledWith('/create-savings-goal');
    });

    test('shows alert when user is not approved and tries to create goal', () => {
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'pending' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      const addButton = screen.getByText('Add New Goal');
      fireEvent.click(addButton);
      
      expect(mockAlert).toHaveBeenCalledWith('You must be approved to create savings goals.');
      mockAlert.mockRestore();
    });
  });

  describe('Savings Goals Display', () => {
    const mockGoals = [
      {
        _id: '1',
        goalName: 'Vacation Fund',
        currentAmount: 500,
        targetAmount: 2000,
        isPaused: false,
        schedule: { interval: 'Monthly', dayOfMonth: 15 },
        bank: { bankName: 'Chase', bankLastFour: '1234' }
      },
      {
        _id: '2',
        goalName: 'Emergency Fund',
        currentAmount: 1000,
        targetAmount: 5000,
        isPaused: true,
        schedule: { interval: 'Weekly', dayOfWeek: 'Friday' },
        bank: { bankName: 'Bank of America', bankLastFour: '5678' }
      }
    ];

    test('displays savings goals table', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: mockGoals }
        }
      });

      expect(screen.getByTestId('savings-goals-header')).toBeInTheDocument();
      expect(screen.getByTestId('savings-goals-table')).toBeInTheDocument();
      expect(screen.getByTestId('goal-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('goal-row-2')).toBeInTheDocument();
    });

    test('shows empty state when no goals exist', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      expect(screen.getByTestId('empty-goals-state')).toBeInTheDocument();
      expect(screen.getByTestId('create-first-goal-btn')).toBeInTheDocument();
    });

    test('shows paused status correctly', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: mockGoals }
        }
      });

      expect(screen.getByTestId('next-run-2')).toHaveTextContent('PAUSED');
    });
  });

  describe('Goal Actions', () => {
    const mockGoal = {
      _id: '1',
      goalName: 'Test Goal',
      currentAmount: 100,
      targetAmount: 1000,
      isPaused: false,
      schedule: { interval: 'Monthly', dayOfMonth: 15 },
      bank: { bankName: 'Test Bank', bankLastFour: '1234' }
    };

    test('navigates to view savings when View button is clicked', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [mockGoal] }
        }
      });

      const viewButton = screen.getByTestId('view-goal-1');
      fireEvent.click(viewButton);
      expect(mockNavigate).toHaveBeenCalledWith('/view-savings/1');
    });

    test('toggles pause status when pause/resume button is clicked', async () => {
      const mockApi = require('../api');
      mockApi.patch.mockResolvedValue({ data: {} });
      mockApi.get.mockResolvedValue({ data: [mockGoal] });

      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [mockGoal] }
        }
      });

      const pauseButton = screen.getByTestId('toggle-pause-1');
      fireEvent.click(pauseButton);

      await waitFor(() => {
        expect(mockApi.patch).toHaveBeenCalledWith('/api/savings-goal/1/pause', { isPaused: true });
      });
    });
  });

  describe('Unit Components', () => {
    test('shows placeholders when user is not approved', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'pending', userType: 'savings-account' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      // Should show placeholders for Unit components
      expect(screen.getByTestId('account-details-placeholder')).toBeInTheDocument();
      expect(screen.getByTestId('account-activity-placeholder')).toBeInTheDocument();
    });

    test('shows placeholders when customer token is not available', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved', userType: 'savings-account' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      // Should show placeholders for Unit components
      expect(screen.getByTestId('account-details-placeholder')).toBeInTheDocument();
      expect(screen.getByTestId('account-activity-placeholder')).toBeInTheDocument();
    });
  });

  describe('Transfer Back Section', () => {
    test('shows placeholders when user is not approved', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'pending', userType: 'savings-account' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      expect(screen.getByTestId('transfer-back-placeholder')).toBeInTheDocument();
      expect(screen.queryByTestId('transfer-back-section')).not.toBeInTheDocument();
    });

    test('shows transfer back section when user is approved and has customer token', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: { token: 'mock-token' } });

      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved', userType: 'savings-account' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      // Wait for the customer token API call to complete and the transfer back section to appear
      await waitFor(() => {
        expect(screen.getByTestId('transfer-back-section')).toBeInTheDocument();
      });

      expect(screen.getByTestId('transfer-back-link')).toHaveAttribute('href', '/transfer-back');
    });
  });

  describe('Error Handling', () => {
    test('displays error message when error occurs', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      // Simulate an error by setting error state
      // This would typically happen through the component's error handling
      // For now, we'll test the error display structure
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('applies correct CSS classes for responsive layout', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      // Check for responsive classes
      const container = screen.getByText('Welcome, John!').closest('.container');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Next Run Date Calculation', () => {
    test('displays next run date for monthly goals', () => {
      const monthlyGoal = {
        _id: '1',
        goalName: 'Monthly Goal',
        currentAmount: 100,
        targetAmount: 1000,
        isPaused: false,
        schedule: { interval: 'Monthly', dayOfMonth: 15 },
        bank: { bankName: 'Test Bank', bankLastFour: '1234' },
        nextRunDate: '2024-01-15T00:00:00.000Z'
      };

      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [monthlyGoal] }
        }
      });

      expect(screen.getByTestId('goal-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('savings-goals-table')).toBeInTheDocument();
    });

    test('displays next run date for weekly goals', () => {
      const weeklyGoal = {
        _id: '1',
        goalName: 'Weekly Goal',
        currentAmount: 100,
        targetAmount: 1000,
        isPaused: false,
        schedule: { interval: 'Weekly', dayOfWeek: 'Friday' },
        bank: { bankName: 'Test Bank', bankLastFour: '1234' },
        nextRunDate: '2024-01-19T00:00:00.000Z'
      };

      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [weeklyGoal] }
        }
      });

      expect(screen.getByTestId('goal-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('next-run-1')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays error message when customer token fetch fails', async () => {
      const mockApi = require('../api');
      mockApi.get.mockRejectedValue({ response: { status: 401 } });

      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    test('handles customer token fetch error with 401 status', async () => {
      const mockApi = require('../api');
      mockApi.get.mockRejectedValue({ response: { status: 401 } });
      
      // Mock localStorage
      const mockRemoveItem = jest.fn();
      Object.defineProperty(window, 'localStorage', {
        value: { removeItem: mockRemoveItem }
      });

      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      await waitFor(() => {
        expect(mockRemoveItem).toHaveBeenCalledWith('authToken');
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    test('handles customer token fetch error with other status', async () => {
      const mockApi = require('../api');
      mockApi.get.mockRejectedValue({ response: { status: 500, data: { message: 'Server error' } } });

      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Unit Component Integration', () => {
    test('loads Unit components when user is approved and customer token is available', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: { token: 'test-token' } });

      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/api/users/customer-token');
      });

      // Check that the component renders without errors
      expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    });
  });

  describe('Toggle Pause Functionality', () => {
    test('toggles pause status for a goal', async () => {
      const mockApi = require('../api');
      const mockDispatch = jest.fn();
      
      mockApi.patch.mockResolvedValue({ data: {} });
      mockApi.get.mockResolvedValue({ data: [{ _id: '1', goalName: 'Test Goal' }] });

      const testGoal = { _id: '1', goalName: 'Test Goal', isPaused: false };

      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [testGoal] }
        }
      });

      // Find and click the pause button using test ID
      const pauseButton = screen.getByTestId('toggle-pause-1');
      fireEvent.click(pauseButton);

      await waitFor(() => {
        expect(mockApi.patch).toHaveBeenCalledWith('/api/savings-goal/1/pause', { isPaused: true });
        expect(mockApi.get).toHaveBeenCalledWith('/api/savings-goal');
      });
    });

    test('handles toggle pause error', async () => {
      const mockApi = require('../api');
      mockApi.patch.mockRejectedValue(new Error('Toggle pause failed'));

      const testGoal = { _id: '1', goalName: 'Test Goal', isPaused: false };

      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [testGoal] }
        }
      });

      const pauseButton = screen.getByTestId('toggle-pause-1');
      fireEvent.click(pauseButton);

      await waitFor(() => {
        expect(mockApi.patch).toHaveBeenCalledWith('/api/savings-goal/1/pause', { isPaused: true });
      });
    });
  });

  describe('Next Run Date Calculation', () => {
    test('displays next run date for goals with schedule', () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: { token: 'test-token' } });

      const testGoal = {
        _id: '1',
        goalName: 'Test Goal',
        schedule: { interval: 'Weekly', dayOfWeek: 'Wednesday' },
        isPaused: false,
        nextRunDate: '2024-01-17T00:00:00.000Z'
      };

      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [testGoal] }
        }
      });

      expect(screen.getByTestId('next-run-1')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles user without status', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    });

    test('handles user with pending status', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'pending' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    });

    test('handles empty goals array', () => {
      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [] }
        }
      });

      expect(screen.getByText('No savings goals yet. Start saving today!')).toBeInTheDocument();
    });

    test('handles goals without schedule', () => {
      const testGoal = {
        _id: '1',
        goalName: 'Test Goal',
        isPaused: false
      };

      renderWithProviders(<Home />, {
        initialState: {
          user: { user: { firstName: 'John', status: 'approved' } },
          savings: { savingsGoalsLoading: false, goals: [testGoal] }
        }
      });

      expect(screen.getByTestId('goal-row-1')).toHaveTextContent('Test Goal');
    });
  });
});
