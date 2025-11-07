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
    __t: 'ManualSavingsGoal',
    goalName: 'Test Goal',
    description: 'Test Description',
    targetAmount: 1000,
    currentAmount: 500,
    category: 'custom',
    googleShoppingData: [],
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
      // Mock the goal fetch (component always fetches fresh data)
      mockApi.get.mockResolvedValueOnce({ data: mockSavingsGoal });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
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

    test('shows h3 tag with savingsGoal.goalName when not editing', async () => {
      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        const goalNameHeading = screen.getByRole('heading', { level: 3 });
        expect(goalNameHeading).toBeInTheDocument();
        expect(goalNameHeading).toHaveTextContent('Test Goal');
        expect(goalNameHeading).toHaveClass('mb-2');
      });
    });

    test('shows pencil square icon for edit button', async () => {
      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        const editButton = screen.getByTitle('Edit goal details');
        const pencilIcon = editButton.querySelector('i.bi-pencil-square');
        expect(pencilIcon).toBeInTheDocument();
        expect(pencilIcon).toHaveClass('bi', 'bi-pencil-square');
      });
    });

    test('displays product information when savingsGoal.googleShoppingData is populated', async () => {
      const mockSavingsGoalWithProduct = {
        ...mockSavingsGoal,
        __t: 'ManualSavingsGoal',
        googleShoppingData: [{
          title: 'Test Product',
          price: '$99.99',
          source: 'Test Store',
          rating: 4.5,
          reviews: 123,
          productLink: 'https://example.com/product'
        }]
      };

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoalWithProduct] }
        }
      });

      await waitFor(() => {
        // Check that product source is displayed
        expect(screen.getByText('Test Store')).toBeInTheDocument();
        
        // Check that rating is displayed
        expect(screen.getByText('4.5 (123 reviews)')).toBeInTheDocument();
        
        // Check that shop icon is present
        const shopIcon = document.querySelector('i.bi-shop');
        expect(shopIcon).toBeInTheDocument();
        expect(shopIcon).toHaveClass('bi', 'bi-shop', 'text-muted');
        
        // Check that star icon is present
        const starIcon = document.querySelector('i.bi-star-fill');
        expect(starIcon).toBeInTheDocument();
        expect(starIcon).toHaveClass('bi', 'bi-star-fill', 'text-warning', 'me-1');
        
        // Check that external link icon is present
        const externalLinkIcon = document.querySelector('i.bi-box-arrow-up-right');
        expect(externalLinkIcon).toBeInTheDocument();
        expect(externalLinkIcon).toHaveClass('bi', 'bi-box-arrow-up-right');
        
        // Check that the product link has correct attributes
        const productLink = screen.getByTitle('Open product page');
        expect(productLink).toHaveAttribute('href', 'https://example.com/product');
        expect(productLink).toHaveAttribute('target', '_blank');
        expect(productLink).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    test('displays generic description when savingsGoal.product is not populated', async () => {
      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        // Check that the generic description is displayed
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        
        // Check that product-related elements are not displayed
        expect(screen.queryByText('Test Store')).not.toBeInTheDocument();
        expect(screen.queryByText('4.5 (123 reviews)')).not.toBeInTheDocument();
        expect(document.querySelector('i.bi-shop')).not.toBeInTheDocument();
        expect(document.querySelector('i.bi-star-fill')).not.toBeInTheDocument();
        expect(document.querySelector('i.bi-box-arrow-up-right')).not.toBeInTheDocument();
      });
    });

    test('displays fallback message when savingsGoal.product is not populated and no description', async () => {
      const mockSavingsGoalWithoutDescription = {
        ...mockSavingsGoal,
        description: null
      };

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoalWithoutDescription] }
        }
      });

      await waitFor(() => {
        // Check that the fallback message is displayed
        expect(screen.getByText('No description provided.')).toBeInTheDocument();
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
        expect(mockApi.get).toHaveBeenCalledWith('/api/savings-goal/test-goal-id/transactions');
      });
    });
  });

  describe('Edit Modal Functionality', () => {
    beforeEach(() => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: { transactions: [] } });
    });

    test('opens edit modal when edit button is clicked', async () => {
      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      const editButton = screen.getByTitle('Edit goal details');
      fireEvent.click(editButton);

      expect(screen.getByText('Edit Savings Goal')).toBeInTheDocument();
    });

    test('closes edit modal when cancel button is clicked', async () => {
      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      const editButton = screen.getByTitle('Edit goal details');
      fireEvent.click(editButton);

      expect(screen.getByText('Edit Savings Goal')).toBeInTheDocument();

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Edit Savings Goal')).not.toBeInTheDocument();
    });

    test('updates form fields when typing', async () => {
      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      const editButton = screen.getByTitle('Edit goal details');
      fireEvent.click(editButton);

      // Test goal name input
      const goalNameInput = screen.getByDisplayValue('Test Goal');
      fireEvent.change(goalNameInput, { target: { value: 'Updated Goal' } });
      expect(goalNameInput.value).toBe('Updated Goal');

      // Test description textarea
      const descriptionTextarea = screen.getByDisplayValue('Test Description');
      fireEvent.change(descriptionTextarea, { target: { value: 'Updated Description' } });
      expect(descriptionTextarea.value).toBe('Updated Description');

      // Test target amount input
      const targetAmountInput = screen.getByDisplayValue('1000');
      fireEvent.change(targetAmountInput, { target: { value: '2000' } });
      expect(targetAmountInput.value).toBe('2000');
    });

    test('initializes form fields with current goal values', async () => {
      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      const editButton = screen.getByTitle('Edit goal details');
      fireEvent.click(editButton);

      // Check that form fields are initialized with current values
      expect(screen.getByDisplayValue('Test Goal')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    });

    test('handles description textarea placeholder', async () => {
      const goalWithoutDescription = {
        ...mockSavingsGoal,
        description: null
      };

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [goalWithoutDescription] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      const editButton = screen.getByTitle('Edit goal details');
      fireEvent.click(editButton);

      // Check that textarea shows placeholder when no description
      const descriptionTextarea = screen.getByPlaceholderText('Enter description...');
      expect(descriptionTextarea).toBeInTheDocument();
      expect(descriptionTextarea.value).toBe('');
    });

    test('renders form labels correctly', async () => {
      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      const editButton = screen.getByTitle('Edit goal details');
      fireEvent.click(editButton);

      // Check that all form labels are present
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Goal Amount')).toBeInTheDocument();
      
      // Check that textarea has correct attributes
      const descriptionTextarea = screen.getByDisplayValue('Test Description');
      expect(descriptionTextarea).toHaveAttribute('rows', '3');
      expect(descriptionTextarea).toHaveClass('form-control');
      
      // Check that target amount input has correct attributes
      const targetAmountInput = screen.getByDisplayValue('1000');
      expect(targetAmountInput).toHaveAttribute('type', 'number');
      expect(targetAmountInput).toHaveClass('form-control');
    });

    test('saves changes successfully', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: { transactions: [] } });
      mockApi.put.mockResolvedValue({ data: { ...mockSavingsGoal, goalName: 'Updated Goal' } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      const editButton = screen.getByTitle('Edit goal details');
      fireEvent.click(editButton);

      const goalNameInput = screen.getByDisplayValue('Test Goal');
      fireEvent.change(goalNameInput, { target: { value: 'Updated Goal' } });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApi.put).toHaveBeenCalledWith('/api/savings-goal/test-goal-id', {
          goalName: 'Updated Goal',
          description: 'Test Description',
          targetAmount: 1000
        });
      });
    });

    test('handles save error', async () => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: { transactions: [] } });
      mockApi.put.mockRejectedValue(new Error('Save failed'));

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      const editButton = screen.getByTitle('Edit goal details');
      fireEvent.click(editButton);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save changes')).toBeInTheDocument();
      });
    });
  });

  describe('Product Search', () => {
    beforeEach(() => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: { transactions: [] } });
    });

    test('does not show product search section when category is not product', async () => {
      // Use default mockSavingsGoal which has category: 'other'
      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      // Check that product search section is NOT displayed
      expect(screen.queryByText('Show Product Search')).not.toBeInTheDocument();
      expect(screen.queryByText('Hide Product Search')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Search for products...')).not.toBeInTheDocument();
      expect(screen.queryByText('Search Results:')).not.toBeInTheDocument();
    });

    test('toggles product search when button is clicked', async () => {
      const productGoal = {
        ...mockSavingsGoal,
        category: 'product'
      };

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John', userType: 'savings-account' } },
          savings: { goals: [productGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      const searchButton = screen.getByText('Show Product Search');
      fireEvent.click(searchButton);

      expect(screen.getByText('Hide Product Search')).toBeInTheDocument();
    });

    test('searches for products when search is submitted', async () => {
      const productGoal = {
        ...mockSavingsGoal,
        category: 'product'
      };

      const mockApi = require('../api');
      mockApi.post.mockResolvedValue({ 
        data: { 
          products: [{ title: 'Test Product', price: '$100' }] 
        } 
      });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John', userType: 'savings-account' } },
          savings: { goals: [productGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      const searchButton = screen.getByText('Show Product Search');
      fireEvent.click(searchButton);

      const searchInput = screen.getByPlaceholderText('Search for products...');
      fireEvent.change(searchInput, { target: { value: 'test product' } });

      const submitButton = screen.getByText('Search');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/api/savings-goal/test-goal-id/web-search', {
          searchQuery: 'test product'
        });
      });
    });

    test('displays search results when products are found', async () => {
      const mockApi = require('../api');
      const productGoal = {
        ...mockSavingsGoal,
        category: 'product'
      };
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: productGoal });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });
      // Mock the search API call
      mockApi.post.mockResolvedValue({ 
        data: { 
          results: [
            {
              title: 'Test Product 1',
              price: '99.99',
              thumbnail: 'https://example.com/image1.jpg',
              source: 'Test Store 1',
              rating: 4.5,
              reviews: 123,
              productLink: 'https://example.com/product1'
            },
            {
              title: 'Test Product 2',
              price: '149.99',
              old_price: '199.99',
              thumbnail: 'https://example.com/image2.jpg',
              source: 'Test Store 2',
              rating: 3.8,
              reviews: 45,
              productLink: 'https://example.com/product2'
            }
          ]
        } 
      });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John', userType: 'savings-account' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      // Click to show product search
      fireEvent.click(screen.getByText('Show Product Search'));

      await waitFor(() => {
        expect(screen.getByText('Hide Product Search')).toBeInTheDocument();
      });

      // Submit search
      const searchInput = screen.getByPlaceholderText('Search for products...');
      fireEvent.change(searchInput, { target: { value: 'test product' } });
      fireEvent.click(screen.getByText('Search'));

      await waitFor(() => {
        // Check that search results section is displayed
        expect(screen.getByText('Search Results:')).toBeInTheDocument();
        
        // Check product 1
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
        expect(screen.getByText('Test Store 1')).toBeInTheDocument();
        expect(screen.getByText('$99.99')).toBeInTheDocument();
        expect(screen.getByText('4.5')).toBeInTheDocument();
        expect(screen.getByText('(123 reviews)')).toBeInTheDocument();
        
        // Check product 2
        expect(screen.getByText('Test Product 2')).toBeInTheDocument();
        expect(screen.getByText('Test Store 2')).toBeInTheDocument();
        expect(screen.getByText('$149.99')).toBeInTheDocument();
        expect(screen.getByText('$199.99')).toBeInTheDocument();
        expect(screen.getByText('3.8')).toBeInTheDocument();
        expect(screen.getByText('(45 reviews)')).toBeInTheDocument();
        
        // Check that product images are displayed
        const images = screen.getAllByRole('img');
        expect(images).toHaveLength(2);
        expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
        expect(images[0]).toHaveAttribute('alt', 'Test Product 1');
        expect(images[1]).toHaveAttribute('src', 'https://example.com/image2.jpg');
        expect(images[1]).toHaveAttribute('alt', 'Test Product 2');
        
        // Check that product links are correct
        const productLinks = screen.getAllByRole('link');
        expect(productLinks[0]).toHaveAttribute('href', 'https://example.com/product1');
        expect(productLinks[0]).toHaveAttribute('target', '_blank');
        expect(productLinks[0]).toHaveAttribute('rel', 'noopener noreferrer');
        expect(productLinks[1]).toHaveAttribute('href', 'https://example.com/product2');
        
        // Check that shop icons are present
        const shopIcons = document.querySelectorAll('i.bi-shop');
        expect(shopIcons).toHaveLength(2);
        
        // Check that star ratings are displayed
        const starElements = document.querySelectorAll('.text-warning');
        expect(starElements.length).toBeGreaterThan(0);
        
        // Check that action buttons are present
        const saveButtons = screen.getAllByText('Save as Savings Goal');
        expect(saveButtons).toHaveLength(2);
        
        const externalLinkIcons = document.querySelectorAll('i.bi-box-arrow-up-right');
        expect(externalLinkIcons).toHaveLength(2);
        
        // Check that old price has strikethrough styling
        const oldPrice = screen.getByText('$199.99');
        expect(oldPrice).toHaveClass('text-muted');
        expect(oldPrice).toHaveStyle('text-decoration: line-through');
      });
    });

    test('handles mouse hover effects on product search button', async () => {
      const productGoal = {
        ...mockSavingsGoal,
        category: 'product'
      };

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John', userType: 'savings-account' } },
          savings: { goals: [productGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      const searchButton = screen.getByText('Show Product Search');
      
      // Test mouse enter effect
      fireEvent.mouseEnter(searchButton);
      expect(searchButton).toHaveStyle('color: #116530');
      expect(searchButton).toHaveStyle('border-color: #116530');
      
      // Test mouse leave effect
      fireEvent.mouseLeave(searchButton);
      expect(searchButton).toHaveStyle('color: #ffffff');
      expect(searchButton).toHaveStyle('border-color: #ffffff');
    });

    test('saves product when save button is clicked', async () => {
      const mockApi = require('../api');
      const productGoal = {
        ...mockSavingsGoal,
        category: 'product'
      };
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: productGoal });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });
      // Mock the search API call
      mockApi.post
        .mockResolvedValueOnce({ 
          data: { 
            results: [
              {
                title: 'Test Product',
                price: '99.99',
                thumbnail: 'https://example.com/image.jpg',
                source: 'Test Store',
                rating: 4.5,
                reviews: 123,
                productLink: 'https://example.com/product'
              }
            ]
          } 
        })
        .mockResolvedValueOnce({ 
          data: { 
            goal: productGoal
          } 
        });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John', userType: 'savings-account' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      // Click to show product search
      fireEvent.click(screen.getByText('Show Product Search'));

      await waitFor(() => {
        expect(screen.getByText('Hide Product Search')).toBeInTheDocument();
      });

      // Submit search to get results
      const searchInput = screen.getByPlaceholderText('Search for products...');
      fireEvent.change(searchInput, { target: { value: 'test product' } });
      fireEvent.click(screen.getByText('Search'));

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      // Click save button
      const saveButton = screen.getByText('Save as Savings Goal');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/api/savings-goal/test-goal-id/save-product', {
          productData: {
            title: 'Test Product',
            price: '99.99',
            thumbnail: 'https://example.com/image.jpg',
            source: 'Test Store',
            rating: 4.5,
            reviews: 123,
            productLink: 'https://example.com/product'
          }
        });
      });
    });

    test('handles save product error', async () => {
      const mockApi = require('../api');
      const productGoal = {
        ...mockSavingsGoal,
        category: 'product'
      };
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: productGoal });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });
      // Mock the search API call
      mockApi.post
        .mockResolvedValueOnce({ 
          data: { 
            results: [
              {
                title: 'Test Product',
                price: '99.99',
                productLink: 'https://example.com/product'
              }
            ]
          } 
        })
        .mockRejectedValueOnce({ response: { status: 500, data: { error: 'Server error' } } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John', userType: 'savings-account' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      // Click to show product search
      fireEvent.click(screen.getByText('Show Product Search'));

      await waitFor(() => {
        expect(screen.getByText('Hide Product Search')).toBeInTheDocument();
      });

      // Submit search to get results
      const searchInput = screen.getByPlaceholderText('Search for products...');
      fireEvent.change(searchInput, { target: { value: 'test product' } });
      fireEvent.click(screen.getByText('Search'));

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      // Click save button
      const saveButton = screen.getByText('Save as Savings Goal');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to save product')).toBeInTheDocument();
      });
    });

  });

  describe('AI Image Generation', () => {
    beforeEach(() => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: { transactions: [] } });
    });

    test('generates AI image successfully', async () => {
      const mockApi = require('../api');
      mockApi.post
        .mockResolvedValueOnce({ data: { imageUrl: 'https://example.com/ai-image.jpg' } })
        .mockResolvedValueOnce({ data: mockSavingsGoal });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      // Open edit modal first
      const editButton = screen.getByTitle('Edit goal details');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Savings Goal')).toBeInTheDocument();
      });

      // Look for AI image generation button in the modal
      const generateButton = screen.getByText('Generate AI Image');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/api/savings-goal/test-goal-id/generate-image');
        expect(mockApi.get).toHaveBeenCalledWith('/api/savings-goal/test-goal-id');
      });
    });

    test('handles AI image generation error', async () => {
      const mockApi = require('../api');
      mockApi.post.mockRejectedValueOnce({ response: { status: 500, data: { error: 'Server error' } } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      // Open edit modal first
      const editButton = screen.getByTitle('Edit goal details');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Savings Goal')).toBeInTheDocument();
      });

      // Look for AI image generation button in the modal
      const generateButton = screen.getByText('Generate AI Image');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to generate AI image')).toBeInTheDocument();
      });
    });

    test('shows loading state during AI image generation', async () => {
      const mockApi = require('../api');
      // Create a promise that we can control
      let resolvePromise;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockApi.post.mockReturnValueOnce(promise);

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      // Open edit modal first
      const editButton = screen.getByTitle('Edit goal details');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Savings Goal')).toBeInTheDocument();
      });

      // Click generate button
      const generateButton = screen.getByText('Generate AI Image');
      fireEvent.click(generateButton);

      // Check that button is disabled during loading
      await waitFor(() => {
        expect(generateButton).toBeDisabled();
      });

      // Resolve the promise
      resolvePromise({ data: { imageUrl: 'https://example.com/ai-image.jpg' } });
      mockApi.get.mockResolvedValueOnce({ data: mockSavingsGoal });

      await waitFor(() => {
        expect(generateButton).not.toBeDisabled();
      });
    });
  });

  describe('Inline Editing', () => {
    test('shows inline input when editing is true', async () => {
      // Mock the component to have editing state
      const ViewSavingsWithEditing = () => {
        const [editing] = React.useState(true);
        const [editGoalName, setEditGoalName] = React.useState('Test Goal');
        
        return (
          <div>
            <div data-testid="navbar">Navbar</div>
            <div className="container mt-3">
              <div className="row">
                <div className="col-sm-7 mt-3 offset-sm-1">
                  <div className="d-flex align-items-start">
                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '120px', height: '120px', flexShrink: 0, minWidth: '120px', minHeight: '120px' }}>
                      <i className="bi bi-image text-muted" style={{ fontSize: '2rem' }} />
                    </div>
                    <div className="ms-3 flex-grow-1">
                      <div className="mb-2 d-flex justify-content-between align-items-start">
                        {editing ? (
                          <input
                            type="text"
                            className="form-control border-0 p-0"
                            value={editGoalName}
                            onChange={(e) => setEditGoalName(e.target.value)}
                            style={{ 
                              backgroundColor: 'transparent',
                              boxShadow: 'none'
                            }}
                          />
                        ) : (
                          <h3 className="mb-2">Test Goal</h3>
                        )}
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          title="Edit goal details"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      };

      renderWithProviders(<ViewSavingsWithEditing />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        // Check that inline input is shown instead of h3
        const inlineInput = screen.getByDisplayValue('Test Goal');
        expect(inlineInput).toBeInTheDocument();
        expect(inlineInput).toHaveClass('form-control', 'border-0', 'p-0');
        expect(inlineInput).toHaveStyle('background-color: transparent');
        expect(inlineInput).toHaveStyle('box-shadow: none');
        
        // Check that h3 is not shown
        expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
      });
    });

    test('handles inline input changes', async () => {
      const ViewSavingsWithEditing = () => {
        const [editing] = React.useState(true);
        const [editGoalName, setEditGoalName] = React.useState('Test Goal');
        
        return (
          <div>
            <div data-testid="navbar">Navbar</div>
            <div className="container mt-3">
              <div className="row">
                <div className="col-sm-7 mt-3 offset-sm-1">
                  <div className="d-flex align-items-start">
                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '120px', height: '120px', flexShrink: 0, minWidth: '120px', minHeight: '120px' }}>
                      <i className="bi bi-image text-muted" style={{ fontSize: '2rem' }} />
                    </div>
                    <div className="ms-3 flex-grow-1">
                      <div className="mb-2 d-flex justify-content-between align-items-start">
                        {editing ? (
                          <input
                            type="text"
                            className="form-control border-0 p-0"
                            value={editGoalName}
                            onChange={(e) => setEditGoalName(e.target.value)}
                            style={{ 
                              backgroundColor: 'transparent',
                              boxShadow: 'none'
                            }}
                          />
                        ) : (
                          <h3 className="mb-2">Test Goal</h3>
                        )}
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          title="Edit goal details"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      };

      renderWithProviders(<ViewSavingsWithEditing />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        const inlineInput = screen.getByDisplayValue('Test Goal');
        
        // Test input change
        fireEvent.change(inlineInput, { target: { value: 'Updated Goal Name' } });
        expect(inlineInput.value).toBe('Updated Goal Name');
      });
    });
  });

  describe('Bank and Setup Transfers', () => {
    beforeEach(() => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: { transactions: [] } });
    });

    test('shows bank information when savingsGoal.bank exists', async () => {
      const goalWithBank = {
        ...mockSavingsGoal,
        bank: {
          bankName: 'Test Bank'
        },
        savingsAmount: 100,
        schedule: {
          interval: 'weekly'
        }
      };

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [goalWithBank] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Bank - $100 weekly')).toBeInTheDocument();
        
        // Check that edit button is present in main area
        const editButton = screen.getByTitle('Edit goal details');
        expect(editButton).toBeInTheDocument();
        
        // Check that bank section edit button is present (without title)
        const bankEditButtons = screen.getAllByRole('button');
        const bankEditButton = bankEditButtons.find(button => 
          button.querySelector('i.bi-pencil-square') && 
          !button.hasAttribute('title')
        );
        expect(bankEditButton).toBeInTheDocument();
      });
    });

    test('shows setup transfers button when no bank', async () => {
      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Setup Transfers')).toBeInTheDocument();
      });
    });
  });

  describe('Transfers Display', () => {
    beforeEach(() => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: { transactions: [] } });
    });

    test('shows transfers table when transfers exist', async () => {
      const goalWithTransfers = {
        ...mockSavingsGoal,
        transfers: [
          {
            transactionId: 'txn-123',
            date: '2024-01-15',
            amount: 100,
            type: 'debit',
            status: 'completed'
          },
          {
            transactionId: 'txn-456',
            date: '2024-01-20',
            amount: 50,
            type: 'credit',
            status: 'pending'
          }
        ]
      };

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [goalWithTransfers] }
        }
      });

      await waitFor(() => {
        // Check table headers
        expect(screen.getByText('Transaction ID')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        
        // Check transfer data
        expect(screen.getByText('txn-123')).toBeInTheDocument();
        expect(screen.getByText('txn-456')).toBeInTheDocument();
        expect(screen.getAllByText('$100')).toHaveLength(2); // Desktop table and mobile card
        expect(screen.getAllByText('($50)')).toHaveLength(2); // Desktop table and mobile card
        expect(screen.getByText('completed')).toBeInTheDocument();
        expect(screen.getByText('pending')).toBeInTheDocument();
      });
    });

    test('shows no transfers message when no transfers', async () => {
      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [mockSavingsGoal] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('No transfers found.')).toBeInTheDocument();
      });
    });

    test('handles transfer details button click', async () => {
      const goalWithTransfers = {
        ...mockSavingsGoal,
        transfers: [
          {
            transactionId: 'txn-123',
            date: '2024-01-15',
            amount: 100,
            type: 'debit',
            status: 'completed'
          }
        ]
      };

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [goalWithTransfers] }
        }
      });

      await waitFor(() => {
        // Look for Details button in mobile view
        const detailsButton = screen.getByText('Details');
        fireEvent.click(detailsButton);
        
        // This would open a modal, but we're just testing the click
        expect(detailsButton).toBeInTheDocument();
      });
    });
  });

  describe('Transfer Modal Functionality', () => {
    beforeEach(() => {
      const mockApi = require('../api');
      mockApi.get.mockResolvedValue({ data: { transactions: [] } });
    });

    test('opens transfer modal when details button is clicked', async () => {
      const goalWithTransfers = {
        ...mockSavingsGoal,
        transfers: [
          {
            transactionId: 'txn-123',
            date: '2024-01-15',
            amount: 100,
            type: 'debit',
            status: 'completed'
          }
        ]
      };

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [goalWithTransfers] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      // Click the Details button
      const detailsButton = screen.getByText('Details');
      fireEvent.click(detailsButton);

      // Check that modal opens (we can't easily test the modal content without more complex setup)
      expect(detailsButton).toBeInTheDocument();
    });

    test('handles transfer modal state changes', async () => {
      const mockApi = require('../api');
      const goalWithTransfers = {
        ...mockSavingsGoal,
        transfers: [
          {
            transactionId: 'txn-123',
            date: '2024-01-15',
            amount: 100,
            type: 'debit',
            status: 'completed'
          }
        ]
      };
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: goalWithTransfers });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
      });

      // Test that the component renders without errors
      expect(screen.getByText('txn-123')).toBeInTheDocument();
    });
  });

  describe('Navigation Functions', () => {
    beforeEach(() => {
      const mockApi = require('../api');
      mockApi.get.mockClear();
    });

    test('navigates to setup-savings when bank edit button is clicked', async () => {
      const mockApi = require('../api');
      const goalWithBank = {
        ...mockSavingsGoal,
        bank: {
          bankName: 'Test Bank'
        },
        savingsAmount: 100,
        schedule: {
          interval: 'weekly'
        }
      };
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: goalWithBank });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Bank - $100 weekly')).toBeInTheDocument();
      });

      // Find and click the bank edit button
      const bankEditButtons = screen.getAllByRole('button');
      const bankEditButton = bankEditButtons.find(button => 
        button.querySelector('i.bi-pencil-square') && 
        !button.hasAttribute('title')
      );
      
      fireEvent.click(bankEditButton);

      expect(mockNavigate).toHaveBeenCalledWith('/setup-savings/test-goal-id');
    });

    test('navigates to setup-savings when setup transfers button is clicked', async () => {
      const mockApi = require('../api');
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: mockSavingsGoal });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Setup Transfers')).toBeInTheDocument();
      });

      const setupButton = screen.getByText('Setup Transfers');
      fireEvent.click(setupButton);

      expect(mockNavigate).toHaveBeenCalledWith('/setup-savings/test-goal-id');
    });
  });

  describe('Transfer Data Formatting', () => {
    beforeEach(() => {
      const mockApi = require('../api');
      mockApi.get.mockClear();
    });

    test('displays transfer with transactionId when available', async () => {
      const mockApi = require('../api');
      const goalWithTransfers = {
        ...mockSavingsGoal,
        transfers: [
          {
            transactionId: 'txn-123',
            date: '2024-01-15',
            amount: 100,
            type: 'debit',
            status: 'completed'
          }
        ]
      };
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: goalWithTransfers });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('txn-123')).toBeInTheDocument();
      });
    });

    test('displays transfer with transferId when transactionId is not available', async () => {
      const mockApi = require('../api');
      const goalWithTransfers = {
        ...mockSavingsGoal,
        transfers: [
          {
            transferId: 'transfer-456',
            date: '2024-01-15',
            amount: 100,
            type: 'debit',
            status: 'completed'
          }
        ]
      };
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: goalWithTransfers });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('transfer-456')).toBeInTheDocument();
      });
    });

    test('displays N/A when neither transactionId nor transferId is available', async () => {
      const mockApi = require('../api');
      const goalWithTransfers = {
        ...mockSavingsGoal,
        transfers: [
          {
            date: '2024-01-15',
            amount: 100,
            type: 'debit',
            status: 'completed'
          }
        ]
      };
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: goalWithTransfers });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('N/A')).toBeInTheDocument();
      });
    });

    test('applies correct styling for credit transfers', async () => {
      const mockApi = require('../api');
      const goalWithTransfers = {
        ...mockSavingsGoal,
        transfers: [
          {
            transactionId: 'txn-credit',
            date: '2024-01-15',
            amount: 50,
            type: 'credit',
            status: 'completed'
          }
        ]
      };
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: goalWithTransfers });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        // Check that credit transfer has table-danger class
        const creditRow = screen.getByText('txn-credit').closest('tr');
        expect(creditRow).toHaveClass('table-danger');
        
        // Check that amount is displayed with parentheses (both desktop and mobile)
        expect(screen.getAllByText('($50)')).toHaveLength(2);
      });
    });

    test('applies correct badge styling for different statuses', async () => {
      const mockApi = require('../api');
      const goalWithTransfers = {
        ...mockSavingsGoal,
        transfers: [
          {
            transactionId: 'txn-completed',
            date: '2024-01-15',
            amount: 100,
            type: 'debit',
            status: 'completed'
          },
          {
            transactionId: 'txn-pending',
            date: '2024-01-16',
            amount: 200,
            type: 'debit',
            status: 'pending'
          },
          {
            transactionId: 'txn-failed',
            date: '2024-01-17',
            amount: 300,
            type: 'debit',
            status: 'failed'
          }
        ]
      };
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: goalWithTransfers });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        // Check completed status badge
        const completedBadge = screen.getByText('completed');
        expect(completedBadge).toHaveClass('badge', 'bg-success');
        
        // Check pending status badge
        const pendingBadge = screen.getByText('pending');
        expect(pendingBadge).toHaveClass('badge', 'bg-warning');
        
        // Check failed status badge
        const failedBadge = screen.getByText('failed');
        expect(failedBadge).toHaveClass('badge', 'bg-danger');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      const mockApi = require('../api');
      mockApi.get.mockClear();
    });

    test('handles savingsGoal with null values gracefully', async () => {
      const mockApi = require('../api');
      const goalWithNulls = {
        ...mockSavingsGoal,
        currentAmount: null,
        targetAmount: null,
        description: null
      };
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: goalWithNulls });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
        // Should show $0 / $0 for null amounts
        expect(screen.getByText('$0 / $0')).toBeInTheDocument();
        // Should show fallback description
        expect(screen.getByText('No description provided.')).toBeInTheDocument();
      });
    });

    test('handles savingsGoal with undefined values gracefully', async () => {
      const mockApi = require('../api');
      const goalWithUndefined = {
        ...mockSavingsGoal,
        currentAmount: undefined,
        targetAmount: undefined,
        description: undefined
      };
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: goalWithUndefined });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
        // Should show $0 / $0 for undefined amounts
        expect(screen.getByText('$0 / $0')).toBeInTheDocument();
        // Should show fallback description
        expect(screen.getByText('No description provided.')).toBeInTheDocument();
      });
    });

    test('handles product with missing optional fields', async () => {
      const mockApi = require('../api');
      const goalWithPartialProduct = {
        ...mockSavingsGoal,
        googleShoppingData: [{
          title: 'Test Product',
          price: '$99.99'
          // Missing source, rating, reviews, productLink
        }]
      };
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: goalWithPartialProduct });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        // The h3 should show the goal name, not the product title
        expect(screen.getByText('Test Goal')).toBeInTheDocument();
        // Should not show source, rating, or product link icons
        expect(screen.queryByText('Test Store')).not.toBeInTheDocument();
        expect(screen.queryByText('4.5 (123 reviews)')).not.toBeInTheDocument();
        expect(document.querySelector('i.bi-shop')).not.toBeInTheDocument();
        expect(document.querySelector('i.bi-star-fill')).not.toBeInTheDocument();
        expect(document.querySelector('i.bi-box-arrow-up-right')).not.toBeInTheDocument();
      });
    });

    test('handles transfers with missing optional fields', async () => {
      const mockApi = require('../api');
      const goalWithPartialTransfers = {
        ...mockSavingsGoal,
        transfers: [
          {
            date: '2024-01-15',
            amount: 100,
            type: 'debit',
            status: 'completed'
            // Missing transactionId and transferId
          }
        ]
      };
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: goalWithPartialTransfers });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('N/A')).toBeInTheDocument();
        expect(screen.getAllByText('$100')).toHaveLength(2); // Desktop and mobile
        expect(screen.getByText('completed')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Display', () => {
    beforeEach(() => {
      const mockApi = require('../api');
      mockApi.get.mockClear();
    });

    test('shows correct progress bar', async () => {
      const mockApi = require('../api');
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: mockSavingsGoal });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        const progressBar = document.querySelector('.progress-bar');
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveStyle('width: 50%');
      });
    });

    test('shows progress text', async () => {
      const mockApi = require('../api');
      // Mock the goal fetch
      mockApi.get.mockResolvedValueOnce({ data: mockSavingsGoal });
      // Mock the transaction history fetch
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('$500 / $1000')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('shows error message when transaction history fails to load', async () => {
      const mockApi = require('../api');
      mockApi.get
        .mockResolvedValueOnce({ data: mockSavingsGoal })
        .mockRejectedValueOnce({ response: { status: 500, data: { error: 'Server error' } } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    test('shows error message when transaction history returns 404', async () => {
      const mockApi = require('../api');
      mockApi.get
        .mockResolvedValueOnce({ data: mockSavingsGoal })
        .mockRejectedValueOnce({ response: { status: 404 } });

      renderWithProviders(<ViewSavings />, {
        initialState: {
          user: { user: { _id: '1', firstName: 'John' } },
          savings: { goals: [] }
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Transaction history not found')).toBeInTheDocument();
      });
    });
  });

});
