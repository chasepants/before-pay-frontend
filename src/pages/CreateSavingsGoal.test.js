import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CreateSavingsGoal from './CreateSavingsGoal';
import userSlice from '../store/userSlice';
import savingsSlice from '../store/savingsSlice';

// Mock the API
jest.mock('../api', () => ({
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

// Mock the ProductCard component
jest.mock('../components/ProductCard', () => {
  return function MockProductCard({ name, price, onButtonClick, isInSavings }) {
    return (
      <div data-testid={`product-card-${name}`}>
        <h4>{name}</h4>
        <p>{price}</p>
        <button 
          onClick={onButtonClick}
          data-testid={`add-to-savings-${name}`}
        >
          {isInSavings ? 'Added ✓' : 'ADD TO SAVINGS'}
        </button>
      </div>
    );
  };
});

// Mock the mock_serp.js file
jest.mock('../mock_serp.js', () => [
  {
    product_id: '1',
    title: 'Test Product 1',
    price: '$100.00',
    extracted_price: 100,
    product_link: 'https://example.com/product1',
    thumbnail: 'https://example.com/image1.jpg',
    source: 'Test Store',
    source_icon: 'https://example.com/icon1.png',
    rating: 4.5,
    reviews: 100,
    badge: 'Best Seller',
    tag: 'Electronics',
    delivery: 'Free Shipping'
  },
  {
    product_id: '2',
    title: 'Test Product 2',
    price: '$200.00',
    extracted_price: 200,
    product_link: 'https://example.com/product2',
    thumbnail: 'https://example.com/image2.jpg',
    source: 'Another Store',
    source_icon: 'https://example.com/icon2.png',
    rating: 4.0,
    reviews: 50,
    badge: 'Sale',
    tag: 'Clothing',
    delivery: '2-day shipping'
  }
]);

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

describe('CreateSavingsGoal', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Navigation and Authentication', () => {
    test('redirects to home when user is not logged in', () => {
      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: null },
          savings: { goals: [] }
        }
      });

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('renders when user is logged in', () => {
      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John', status: 'approved' } },
          savings: { goals: [] }
        }
      });

      expect(screen.getByText('Create Savings Goal')).toBeInTheDocument();
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });
  });

  describe('Manual Entry Form', () => {
    const mockUser = { _id: '1', firstName: 'John', status: 'approved' };

    test('renders manual entry form fields', () => {
      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      expect(screen.getByLabelText('Savings Goal Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Target Amount')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
      expect(screen.getByLabelText('Product Link')).toBeInTheDocument();
      expect(screen.getByText('Create Goal')).toBeInTheDocument();
    });

    test('updates form fields when user types', () => {
      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      const goalNameInput = screen.getByLabelText('Savings Goal Name');
      const descriptionInput = screen.getByLabelText('Description');
      const amountInput = screen.getByLabelText('Target Amount');

      fireEvent.change(goalNameInput, { target: { value: 'Test Goal' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
      fireEvent.change(amountInput, { target: { value: '1000' } });

      expect(goalNameInput.value).toBe('Test Goal');
      expect(descriptionInput.value).toBe('Test Description');
      expect(amountInput.value).toBe('1000');
    });

    test('updates category when user selects option', () => {
      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      const categorySelect = screen.getByLabelText('Category');
      fireEvent.change(categorySelect, { target: { value: 'product' } });

      expect(categorySelect.value).toBe('product');
    });

    test('shows error when required fields are missing', async () => {
      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      const submitButton = screen.getByText('Create Goal');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Goal name, description, amount, and category are required')).toBeInTheDocument();
      });
    });

    test('submits form successfully with valid data', async () => {
      const mockApi = require('../api');
      const mockResponse = { data: { _id: 'new-goal-id' } };
      mockApi.post.mockResolvedValue(mockResponse);

      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      // Fill out the form
      fireEvent.change(screen.getByLabelText('Savings Goal Name'), { target: { value: 'Test Goal' } });
      fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test Description' } });
      fireEvent.change(screen.getByLabelText('Target Amount'), { target: { value: '1000' } });
      fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'product' } });

      const submitButton = screen.getByText('Create Goal');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/api/savings-goal', {
          userId: '1',
          goalName: 'Test Goal',
          description: 'Test Description',
          targetAmount: 1000,
          category: 'product',
          product_link: ''
        });
        expect(mockNavigate).toHaveBeenCalledWith('/setup-savings/new-goal-id');
      });
    });

    test('shows error when API call fails', async () => {
      const mockApi = require('../api');
      mockApi.post.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      // Fill out the form
      fireEvent.change(screen.getByLabelText('Savings Goal Name'), { target: { value: 'Test Goal' } });
      fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test Description' } });
      fireEvent.change(screen.getByLabelText('Target Amount'), { target: { value: '1000' } });
      fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'product' } });

      const submitButton = screen.getByText('Create Goal');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create savings goal: API Error')).toBeInTheDocument();
      });
    });

    test('resets form after successful submission', async () => {
      const mockApi = require('../api');
      const mockResponse = { data: { _id: 'new-goal-id' } };
      mockApi.post.mockResolvedValue(mockResponse);

      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      // Fill out the form
      fireEvent.change(screen.getByLabelText('Savings Goal Name'), { target: { value: 'Test Goal' } });
      fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test Description' } });
      fireEvent.change(screen.getByLabelText('Target Amount'), { target: { value: '1000' } });
      fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'product' } });

      const submitButton = screen.getByText('Create Goal');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Savings Goal Name').value).toBe('');
        expect(screen.getByLabelText('Description').value).toBe('');
        expect(screen.getByLabelText('Target Amount').value).toBe('');
        expect(screen.getByLabelText('Category').value).toBe('');
      });
    });
  });

  describe('Product Search', () => {
    const mockUser = { _id: '1', firstName: 'John', status: 'approved' };

    test('renders search input and button', () => {
      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      expect(screen.getByLabelText('Search for Products')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    test('updates search input when user types', () => {
      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      const searchInput = screen.getByLabelText('Search for Products');
      fireEvent.change(searchInput, { target: { value: 'laptop' } });

      expect(searchInput.value).toBe('laptop');
    });

    test('displays products after search', () => {
      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      expect(screen.getByTestId('product-card-Test Product 1')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-Test Product 2')).toBeInTheDocument();
    });

    test('shows product details correctly', () => {
      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      expect(screen.getByText('$200.00')).toBeInTheDocument();
    });
  });

  describe('Add to Savings', () => {
    const mockUser = { _id: '1', firstName: 'John', status: 'approved' };

    test('adds product to savings when user clicks button', async () => {
      const mockApi = require('../api');
      const mockResponse = { data: { _id: 'new-goal-id' } };
      mockApi.post.mockResolvedValue(mockResponse);

      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      // Search for products first
      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      // Click add to savings button
      const addButton = screen.getByTestId('add-to-savings-Test Product 1');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/api/savings-goal', {
          userId: '1',
          product_id: '1',
          title: 'Test Product 1',
          price: '$100.00',
          extracted_price: 100,
          product_link: 'https://example.com/product1',
          thumbnail: 'https://example.com/image1.jpg',
          source: 'Test Store',
          source_icon: 'https://example.com/icon1.png',
          rating: 4.5,
          reviews: 100,
          badge: 'Best Seller',
          tag: 'Electronics',
          delivery: 'Free Shipping',
          targetAmount: 100
        });
        expect(mockNavigate).toHaveBeenCalledWith('/setup-savings/new-goal-id');
      });
    });

    test('redirects to pending when user is not approved', () => {
      const unapprovedUser = { _id: '1', firstName: 'John', status: 'pending' };

      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: unapprovedUser },
          savings: { goals: [] }
        }
      });

      // Search for products first
      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      // Click add to savings button
      const addButton = screen.getByTestId('add-to-savings-Test Product 1');
      fireEvent.click(addButton);

      expect(mockNavigate).toHaveBeenCalledWith('/pending');
    });

    test('shows alert when product is already in savings', () => {
      const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      const existingGoal = {
        _id: 'existing-goal',
        product_id: '1',
        goalName: 'Test Product 1'
      };

      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [existingGoal] }
        }
      });

      // Search for products first
      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      // Click add to savings button
      const addButton = screen.getByTestId('add-to-savings-Test Product 1');
      fireEvent.click(addButton);

      expect(mockAlert).toHaveBeenCalledWith('Goal already in savings list');
      mockAlert.mockRestore();
    });

    test('shows "Added ✓" for products already in savings', () => {
      const existingGoal = {
        _id: 'existing-goal',
        product_id: '1',
        goalName: 'Test Product 1'
      };

      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [existingGoal] }
        }
      });

      // Search for products first
      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      expect(screen.getByText('Added ✓')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    const mockUser = { _id: '1', firstName: 'John', status: 'approved' };

    test('validates required fields', async () => {
      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      const submitButton = screen.getByText('Create Goal');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Goal name, description, amount, and category are required')).toBeInTheDocument();
      });
    });

    test('validates individual required fields', async () => {
      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      // Test missing goal name
      fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test Description' } });
      fireEvent.change(screen.getByLabelText('Target Amount'), { target: { value: '1000' } });
      fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'product' } });

      const submitButton = screen.getByText('Create Goal');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Goal name, description, amount, and category are required')).toBeInTheDocument();
      });
    });
  });

  describe('UI Elements', () => {
    const mockUser = { _id: '1', firstName: 'John', status: 'approved' };

    test('renders all section headers', () => {
      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      expect(screen.getByText('Create Savings Goal')).toBeInTheDocument();
      expect(screen.getByText('Manual Entry')).toBeInTheDocument();
      expect(screen.getByText('Create from a Google Shopping Product')).toBeInTheDocument();
    });

    test('renders category options', () => {
      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      const categorySelect = screen.getByLabelText('Category');
      expect(categorySelect).toBeInTheDocument();
      
      // Check that all category options are present
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Product')).toBeInTheDocument();
      expect(screen.getByText('Trip')).toBeInTheDocument();
      expect(screen.getByText('Donation')).toBeInTheDocument();
      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();
    });

    test('renders dividers between sections', () => {
      renderWithProviders(<CreateSavingsGoal />, {
        initialState: {
          user: { user: mockUser },
          savings: { goals: [] }
        }
      });

      // Check for horizontal rules
      const dividers = screen.getAllByRole('separator');
      expect(dividers.length).toBeGreaterThan(0);
    });
  });
});
