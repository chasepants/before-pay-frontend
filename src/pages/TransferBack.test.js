import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TransferBack from './TransferBack';
import userSlice from '../store/userSlice';

// Mock the API
jest.mock('../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
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

describe('TransferBack', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    // Reset API mocks
    const mockApi = require('../api');
    mockApi.get.mockClear();
    mockApi.post.mockClear();
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Navigation and Authentication', () => {
    test('redirects to home when user is not logged in', () => {
      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: null }
        }
      });

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('renders when user is logged in', () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('transfer-back-title')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    test('shows error when API call fails', async () => {
      const mockApi = require('../api');
      mockApi.get.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the error to appear after the API call fails
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to load goals');
      });
    });

    test('shows no error when API call succeeds', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the component to render, then check no error
      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Rendering', () => {
    const mockGoals = [
      {
        _id: '1',
        goalName: 'Vacation Fund',
        currentAmount: 1000,
        product: { title: 'Vacation Fund' }
      },
      {
        _id: '2',
        goalName: 'Emergency Fund',
        currentAmount: 500,
        product: { title: 'Emergency Fund' }
      }
    ];

    beforeEach(() => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: mockGoals });
    });

    test('renders form elements correctly', async () => {
      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the component to render
      await waitFor(() => {
        expect(screen.getByTestId('transfer-back-title')).toBeInTheDocument();
        expect(screen.getByTestId('total-amount-label')).toBeInTheDocument();
        expect(screen.getByTestId('allocation-help-text')).toBeInTheDocument();
        expect(screen.getByTestId('goal-header')).toBeInTheDocument();
        expect(screen.getByTestId('current-saved-header')).toBeInTheDocument();
        expect(screen.getByTestId('allocate-header')).toBeInTheDocument();
      });
    });

    test('renders goals table with data', async () => {
      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the goals to render
      await waitFor(() => {
        expect(screen.getByTestId('goal-name-1')).toHaveTextContent('Vacation Fund');
        expect(screen.getByTestId('goal-amount-1')).toHaveTextContent('$1000');
        expect(screen.getByTestId('goal-name-2')).toHaveTextContent('Emergency Fund');
        expect(screen.getByTestId('goal-amount-2')).toHaveTextContent('$500');
      });
    });

    test('shows no goals message when no goals exist', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: [] });

      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the no goals message to appear
      await waitFor(() => {
        expect(screen.getByTestId('no-goals-row')).toBeInTheDocument();
      });
    });
  });

  describe('Form Interaction', () => {
    const mockGoals = [
      {
        _id: '1',
        goalName: 'Vacation Fund',
        currentAmount: 1000,
        product: { title: 'Vacation Fund' }
      }
    ];

    beforeEach(() => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: mockGoals });
    });

    test('updates total amount when user types', async () => {
      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the component to render
      await waitFor(() => {
        expect(screen.getByTestId('total-amount-input')).toBeInTheDocument();
      });

      const totalAmountInput = screen.getByTestId('total-amount-input');
      fireEvent.change(totalAmountInput, { target: { value: '500' } });
      expect(totalAmountInput.value).toBe('500');
    });

    test('updates allocation when user changes slider', async () => {
      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the goals to render
      await waitFor(() => {
        expect(screen.getByTestId('goal-slider-1')).toBeInTheDocument();
      });

      // Set a total amount first
      const totalAmountInput = screen.getByTestId('total-amount-input');
      fireEvent.change(totalAmountInput, { target: { value: '1000' } });

      // Now change the slider
      const slider = screen.getByTestId('goal-slider-1');
      fireEvent.change(slider, { target: { value: '300' } });
      expect(slider.value).toBe('300');
    });

    test('updates allocation when user changes number input', async () => {
      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the goals to render
      await waitFor(() => {
        expect(screen.getByTestId('goal-input-1')).toBeInTheDocument();
      });

      // Set a total amount first
      const totalAmountInput = screen.getByTestId('total-amount-input');
      fireEvent.change(totalAmountInput, { target: { value: '1000' } });

      // Now change the number input
      const allocationInput = screen.getByTestId('goal-input-1');
      fireEvent.change(allocationInput, { target: { value: '200' } });
      expect(allocationInput.value).toBe('200');
    });

    test('prevents allocation from exceeding total amount', async () => {
      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the goals to render
      await waitFor(() => {
        expect(screen.getByTestId('goal-slider-1')).toBeInTheDocument();
      });

      // Set total amount to 500
      const totalAmountInput = screen.getByTestId('total-amount-input');
      fireEvent.change(totalAmountInput, { target: { value: '500' } });

      // Try to allocate 600 (more than total)
      const slider = screen.getByTestId('goal-slider-1');
      fireEvent.change(slider, { target: { value: '600' } });

      // Should be capped at 500
      expect(slider.value).toBe('500');
    });

    test('prevents allocation from exceeding goal amount', async () => {
      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the goals to render
      await waitFor(() => {
        expect(screen.getByTestId('goal-slider-1')).toBeInTheDocument();
      });

      // Set a total amount first (higher than the goal amount)
      const totalAmountInput = screen.getByTestId('total-amount-input');
      fireEvent.change(totalAmountInput, { target: { value: '2000' } });

      // Try to allocate more than the goal amount (1000)
      const slider = screen.getByTestId('goal-slider-1');
      fireEvent.change(slider, { target: { value: '1500' } });

      // Should be capped at 1000 (the goal amount)
      expect(slider.value).toBe('1000');
    });
  });

  describe('Form Submission', () => {
    const mockGoals = [
      {
        _id: '1',
        goalName: 'Vacation Fund',
        currentAmount: 1000,
        product: { title: 'Vacation Fund' }
      }
    ];

    beforeEach(() => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: mockGoals });
    });

    test('disables submit button when allocation does not match total', async () => {
      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the component to render
      await waitFor(() => {
        expect(screen.getByTestId('transfer-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('transfer-button');
      expect(submitButton).toBeDisabled();
    });

    test('enables submit button when allocation matches total', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: mockGoals });
      mockApi.post.mockResolvedValue({ data: { success: true } });

      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the goals to render
      await waitFor(() => {
        expect(screen.getByTestId('goal-slider-1')).toBeInTheDocument();
      });

      // Set total amount
      const totalAmountInput = screen.getByTestId('total-amount-input');
      fireEvent.change(totalAmountInput, { target: { value: '500' } });

      // Set allocation to match
      const slider = screen.getByTestId('goal-slider-1');
      fireEvent.change(slider, { target: { value: '500' } });

      const submitButton = screen.getByTestId('transfer-button');
      expect(submitButton).not.toBeDisabled();
    });

    test('submits form successfully with valid data', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: mockGoals });
      mockApi.post.mockResolvedValue({ data: { success: true } });
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the goals to render
      await waitFor(() => {
        expect(screen.getByTestId('goal-slider-1')).toBeInTheDocument();
      });

      // Set total amount
      const totalAmountInput = screen.getByTestId('total-amount-input');
      fireEvent.change(totalAmountInput, { target: { value: '500' } });

      // Set allocation to match
      const slider = screen.getByTestId('goal-slider-1');
      fireEvent.change(slider, { target: { value: '500' } });

      // Submit form
      const submitButton = screen.getByTestId('transfer-button');
      fireEvent.click(submitButton);

      // Wait for the form submission to complete
      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/api/bank/transfer-back-batch', {
          totalAmount: 500,
          allocations: [{ savingsGoalId: '1', amount: 500 }]
        });

        expect(mockAlert).toHaveBeenCalledWith('Transfer back initiated');
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });

      mockAlert.mockRestore();
    });

    test('shows error when submission fails', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: mockGoals });
      mockApi.post.mockRejectedValue(new Error('Submission failed'));

      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the goals to render
      await waitFor(() => {
        expect(screen.getByTestId('goal-slider-1')).toBeInTheDocument();
      });

      // Set total amount
      const totalAmountInput = screen.getByTestId('total-amount-input');
      fireEvent.change(totalAmountInput, { target: { value: '500' } });

      // Set allocation to match
      const slider = screen.getByTestId('goal-slider-1');
      fireEvent.change(slider, { target: { value: '500' } });

      // Submit form
      const submitButton = screen.getByTestId('transfer-button');
      fireEvent.click(submitButton);

      // Wait for the error to appear
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to transfer back');
      });
    });
  });

  describe('Allocation Display', () => {
    const mockGoals = [
      {
        _id: '1',
        goalName: 'Vacation Fund',
        currentAmount: 1000,
        product: { title: 'Vacation Fund' }
      }
    ];

    beforeEach(() => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: mockGoals });
    });

    test('displays current allocation sum', async () => {
      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the component to render
      await waitFor(() => {
        expect(screen.getByTestId('allocation-summary')).toHaveTextContent('Allocated: $0 / $0');
      });
    });

    test('updates allocation display when values change', async () => {
      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the goals to render first
      await waitFor(() => {
        expect(screen.getByTestId('goal-slider-1')).toBeInTheDocument();
      });

      // Set total amount
      const totalAmountInput = screen.getByTestId('total-amount-input');
      fireEvent.change(totalAmountInput, { target: { value: '500' } });

      // Set allocation
      const slider = screen.getByTestId('goal-slider-1');
      fireEvent.change(slider, { target: { value: '300' } });

      expect(screen.getByTestId('allocation-summary')).toHaveTextContent('Allocated: $300 / $500');
    });
  });

  describe('Accessibility', () => {
    const mockGoals = [
      {
        _id: '1',
        goalName: 'Vacation Fund',
        currentAmount: 1000,
        product: { title: 'Vacation Fund' }
      }
    ];

    beforeEach(() => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: mockGoals });
    });

    test('has proper form labels', async () => {
      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the component to render
      await waitFor(() => {
        expect(screen.getByTestId('total-amount-label')).toBeInTheDocument();
      });

      expect(screen.getByTestId('total-amount-label')).toBeInTheDocument();
    });

    test('has proper table headers', async () => {
      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the component to render
      await waitFor(() => {
        expect(screen.getByTestId('goal-header')).toBeInTheDocument();
      });

      expect(screen.getByTestId('goal-header')).toBeInTheDocument();
      expect(screen.getByTestId('current-saved-header')).toBeInTheDocument();
      expect(screen.getByTestId('allocate-header')).toBeInTheDocument();
    });

    test('has proper button roles', async () => {
      renderWithProviders(<TransferBack />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } }
        }
      });

      // Wait for the component to render
      await waitFor(() => {
        expect(screen.getByTestId('transfer-button')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('transfer-button');
      expect(submitButton).toBeInTheDocument();
    });
  });
});
