import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import StartSavingsPlan from './StartSavingsPlan';
import userSlice from '../store/userSlice';
import savingsSlice from '../store/savingsSlice';

// Mock the API
jest.mock('../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

// Mock useNavigate and useLocation
const mockNavigate = jest.fn();
const mockLocation = {
  search: '?token=test-token&checkout=test-checkout-123'
};

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock usePlaidLink with indirection to avoid hoisting issues
const mockOpen = jest.fn();
let mockPlaidHookImpl;
jest.mock('react-plaid-link', () => ({
  usePlaidLink: (...args) => (mockPlaidHookImpl ? mockPlaidHookImpl(...args) : { open: mockOpen, ready: true })
}));

// Mock the Navbar component
jest.mock('../components/Navbar', () => {
  return function MockNavbar() {
    return <nav data-testid="navbar">Navbar</nav>;
  };
});

// Mock the LoadingAnimation component
jest.mock('../components/LoadingAnimation', () => {
  return function MockLoadingAnimation() {
    return <div data-testid="loading-animation">Loading...</div>;
  };
});

// Mock window.alert
const mockAlert = jest.fn();
global.alert = mockAlert;

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('StartSavingsPlan', () => {
  let store;
  let mockApi;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        user: userSlice,
        savings: savingsSlice,
      },
    });

    mockApi = require('../api');
    mockApi.get.mockClear();
    mockApi.post.mockClear();
    mockNavigate.mockClear();
    mockAlert.mockClear();
    mockOpen.mockClear();
    mockPlaidHookImpl = () => ({ open: mockOpen, ready: true });
  });

  const renderComponent = (initialLocation = mockLocation) => {
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <StartSavingsPlan />
        </MemoryRouter>
      </Provider>
    );
  };

  describe('Token Validation', () => {
    it('should show loading animation while validating token', () => {
      mockApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderComponent();
      
      expect(screen.getByTestId('loading-animation')).toBeInTheDocument();
    });

    it('should show error when no token is provided', async () => {
      mockLocation.search = '?checkout=test-checkout-123';
      const api = require('../api');
      api.get.mockResolvedValueOnce({ data: { success: false } });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Invalid link. Please use the link from your email.')).toBeInTheDocument();
        expect(screen.getByText('Back to Home')).toBeInTheDocument();
      });
      mockLocation.search = '?token=test-token&checkout=test-checkout-123';
    });

    it('should show error when token validation fails', async () => {
      mockApi.get.mockRejectedValue(new Error('Token invalid'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Invalid or expired link. Please request a new one.')).toBeInTheDocument();
      });
    });

    it('should load checkout data when token is valid', async () => {
      const mockCheckoutData = {
        lineItems: [
          { title: 'Test Product', price: '100.00', quantity: 2, productId: '123', variantId: '456' }
        ],
        customerFirstName: 'John',
        customerLastName: 'Doe',
        shopDomain: 'test-shop.myshopify.com'
      };

      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          email: 'test@example.com',
          checkout: mockCheckoutData
        }
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Start Your Savings Plan')).toBeInTheDocument();
        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      });
    });
  });

  describe('Checkout Data Display', () => {
    beforeEach(async () => {
      const mockCheckoutData = {
        lineItems: [
          { title: 'Test Product 1', price: '50.00', quantity: 1, productId: '123', variantId: '456' },
          { title: 'Test Product 2', price: '75.00', quantity: 2, productId: '789', variantId: '012' }
        ],
        customerFirstName: 'John',
        customerLastName: 'Doe',
        shopDomain: 'test-shop.myshopify.com'
      };

      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          email: 'test@example.com',
          checkout: mockCheckoutData
        }
      });
    });

    it('should display checkout items correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Items in Your Cart:')).toBeInTheDocument();
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
        expect(screen.getByText('Test Product 2')).toBeInTheDocument();
        expect(screen.getByText('Quantity: 1')).toBeInTheDocument();
        expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
      });
    });

    it('should calculate and display total amount correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total Amount:')).toBeInTheDocument();
        expect(screen.getByText('$200.00')).toBeInTheDocument(); // (50 * 1) + (75 * 2) = 200
      });
    });

    it('should display savings plan details', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Your Savings Plan')).toBeInTheDocument();
        expect(screen.getByText('Payment Schedule:')).toBeInTheDocument();
        expect(screen.getByText('Monthly payments over 4 months')).toBeInTheDocument();
        expect(screen.getByText('Amount per Payment:')).toBeInTheDocument();
        expect(screen.getAllByText('$50.00').length).toBeGreaterThan(0);
        expect(screen.getByText('First Payment:')).toBeInTheDocument();
        expect(screen.getByText('Tomorrow')).toBeInTheDocument();
      });
    });
  });

  describe('Bank Account Linking', () => {
    beforeEach(async () => {
      const mockCheckoutData = {
        lineItems: [{ title: 'Test Product', price: '100.00', quantity: 1 }],
        customerFirstName: 'John',
        customerLastName: 'Doe'
      };

      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          email: 'test@example.com',
          checkout: mockCheckoutData
        }
      });
    });

    it('should show link bank account button initially', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Link Your Bank Account')).toBeInTheDocument();
        expect(screen.getByText('Link Bank Account')).toBeInTheDocument();
      });
    });

    it('should handle bank account linking success', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: { linkToken: 'plaid-link-token' }
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Link Bank Account')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Link Bank Account'));

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/api/bank/plaid/link-token', {
          emailToken: 'test-token'
        });
      });
    });

    it('should handle bank account linking error', async () => {
      mockApi.post.mockRejectedValue(new Error('Failed to create link token'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Link Bank Account')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Link Bank Account'));

      await waitFor(() => {
        expect(screen.getByText('Failed to initialize bank account linking: Failed to create link token')).toBeInTheDocument();
      });
    });

    it('should show linked account when Plaid success callback is triggered', async () => {
      const mockCheckoutData = {
        lineItems: [{ title: 'Test Product', price: '100.00', quantity: 1 }],
        customerFirstName: 'John',
        customerLastName: 'Doe'
      };

      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          email: 'test@example.com',
          checkout: mockCheckoutData
        }
      });

      mockApi.post.mockResolvedValueOnce({
        data: { linkToken: 'plaid-link-token' }
      });

      mockApi.post.mockResolvedValueOnce({
        data: { 
          success: true, 
          accessToken: 'plaid-access-token' 
        }
      });

      // Set up the mock to capture the onSuccess callback
      let capturedOnSuccess;
      mockPlaidHookImpl = (config) => {
        capturedOnSuccess = config.onSuccess;
        return { open: mockOpen, ready: true };
      };

      renderComponent();

      // Simulate Plaid Link success
      await waitFor(() => {
        expect(screen.getByText('Link Bank Account')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Link Bank Account'));

      // Simulate the Plaid success callback
      await capturedOnSuccess('public-token', {
        accounts: [{ id: 'account-123', name: 'Test Account', mask: '1234', type: 'checking' }],
        institution: { name: 'Test Bank' }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Account (****1234)')).toBeInTheDocument();
      });
    });
  });

  describe('Password Input', () => {
    beforeEach(async () => {
      const mockCheckoutData = {
        lineItems: [{ title: 'Test Product', price: '100.00', quantity: 1 }],
        customerFirstName: 'John',
        customerLastName: 'Doe'
      };

      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          email: 'test@example.com',
          checkout: mockCheckoutData
        }
      });
    });

    it('should have disabled email input', async () => {
      renderComponent();

      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('test@example.com');
        expect(emailInput).toBeDisabled();
      });
    });

    it('should allow password input', async () => {
      renderComponent();

      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText('Enter a secure password');
        expect(passwordInput).toBeInTheDocument();
        expect(passwordInput).not.toBeDisabled();
      });

      fireEvent.change(screen.getByPlaceholderText('Enter a secure password'), {
        target: { value: 'testpassword123' }
      });

      expect(screen.getByDisplayValue('testpassword123')).toBeInTheDocument();
    });
  });

  describe('Savings Plan Creation', () => {
    beforeEach(async () => {
      const mockCheckoutData = {
        lineItems: [
          { title: 'Test Product', price: '100.00', quantity: 1, productId: '123', variantId: '456' }
        ],
        customerFirstName: 'John',
        customerLastName: 'Doe',
        shopDomain: 'test-shop.myshopify.com'
      };

      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          email: 'test@example.com',
          checkout: mockCheckoutData
        }
      });
    });

    it('should disable create button when bank account not linked', async () => {
      renderComponent();

      await waitFor(() => {
        const createButton = screen.getByText('Create Savings Plan');
        expect(createButton).toBeDisabled();
      });
    });

    it('should disable create button when password not entered', async () => {
      // Mock bank account as linked
      mockPlaidHookImpl = () => ({ open: mockOpen, ready: true });

      renderComponent();

      await waitFor(() => {
        const createButton = screen.getByText('Create Savings Plan');
        expect(createButton).toBeDisabled();
      });
    });

    it('should create savings plan successfully', async () => {
      const mockCheckoutData = {
        lineItems: [
          { title: 'Test Product', price: '100.00', quantity: 1, productId: '123', variantId: '456' }
        ],
        customerFirstName: 'John',
        customerLastName: 'Doe',
        shopDomain: 'test-shop.myshopify.com'
      };

      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          email: 'test@example.com',
          checkout: mockCheckoutData
        }
      });

      mockApi.post.mockResolvedValueOnce({
        data: { linkToken: 'plaid-link-token' }
      });

      mockApi.post.mockResolvedValueOnce({
        data: { 
          success: true, 
          accessToken: 'plaid-access-token' 
        }
      });

      mockApi.post.mockResolvedValueOnce({
        data: { success: true }
      });

      mockApi.post.mockResolvedValueOnce({
        data: { success: true }
      });

      // Set up the mock to capture the onSuccess callback
      let capturedOnSuccess;
      mockPlaidHookImpl = (config) => {
        capturedOnSuccess = config.onSuccess;
        return { open: mockOpen, ready: true };
      };

      renderComponent();

      // Link bank account
      await waitFor(() => {
        fireEvent.click(screen.getByText('Link Bank Account'));
      });

      await waitFor(() => {
        capturedOnSuccess('public-token', {
          accounts: [{ id: 'account-123', name: 'Test Account', mask: '1234', type: 'checking' }],
          institution: { name: 'Test Bank' }
        });
      });

      // Enter password
      await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText('Enter a secure password'), {
          target: { value: 'testpassword123' }
        });
      });

      // Create savings plan
      await waitFor(() => {
        const createButton = screen.getByText('Create Savings Plan');
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/api/users', {
          email: 'test@example.com',
          password: 'testpassword123',
          firstName: 'John',
          lastName: 'Doe',
          userType: 'guest'
        });
      });

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/api/savings-goal/guest', {
          emailToken: 'test-token',
          goalName: 'Save for Test Product',
          description: 'Automatic savings for your purchase',
          targetAmount: 100,
          bankDetails: {
            bankName: 'Test Bank',
            bankAccountName: 'Test Account',
            bankLastFour: '1234',
            bankAccountType: 'checking'
          },
          product: {
            title: 'Test Product',
            price: '100',
            quantity: 1,
            productType: 'product',
            shopifyProductId: '123',
            shopifyVariantId: '456',
            shopDomain: 'test-shop.myshopify.com'
          }
        });
      });

      expect(mockAlert).toHaveBeenCalledWith('Savings plan created successfully! You can now log in with your email and password to manage your savings.');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should handle savings plan creation error', async () => {
      const mockCheckoutData = {
        lineItems: [{ title: 'Test Product', price: '100.00', quantity: 1 }],
        customerFirstName: 'John',
        customerLastName: 'Doe'
      };

      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          email: 'test@example.com',
          checkout: mockCheckoutData
        }
      });

      mockApi.post.mockResolvedValueOnce({
        data: { linkToken: 'plaid-link-token' }
      });

      mockApi.post.mockResolvedValueOnce({
        data: { 
          success: true, 
          accessToken: 'plaid-access-token' 
        }
      });

      mockApi.post.mockResolvedValueOnce({
        data: { success: true }
      });

      mockApi.post.mockRejectedValueOnce(new Error('Failed to create savings goal'));

      // Set up the mock to capture the onSuccess callback
      let capturedOnSuccess;
      mockPlaidHookImpl = (config) => {
        capturedOnSuccess = config.onSuccess;
        return { open: mockOpen, ready: true };
      };

      renderComponent();

      // Link bank account
      await waitFor(() => {
        fireEvent.click(screen.getByText('Link Bank Account'));
      });

      await waitFor(() => {
        capturedOnSuccess('public-token', {
          accounts: [{ id: 'account-123', name: 'Test Account', mask: '1234', type: 'checking' }],
          institution: { name: 'Test Bank' }
        });
      });

      // Enter password
      await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText('Enter a secure password'), {
          target: { value: 'testpassword123' }
        });
      });

      // Create savings plan
      await waitFor(() => {
        const createButton = screen.getByText('Create Savings Plan');
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to create savings plan')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error when Plaid exchange fails', async () => {
      const mockCheckoutData = {
        lineItems: [{ title: 'Test Product', price: '100.00', quantity: 1 }],
        customerFirstName: 'John',
        customerLastName: 'Doe'
      };

      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          email: 'test@example.com',
          checkout: mockCheckoutData
        }
      });

      mockApi.post.mockResolvedValueOnce({
        data: { linkToken: 'plaid-link-token' }
      });

      mockApi.post.mockRejectedValueOnce(new Error('Plaid exchange failed'));

      // Set up the mock to capture the onSuccess callback
      let capturedOnSuccess;
      mockPlaidHookImpl = (config) => {
        capturedOnSuccess = config.onSuccess;
        return { open: mockOpen, ready: true };
      };

      renderComponent();

      // Link bank account
      await waitFor(() => {
        fireEvent.click(screen.getByText('Link Bank Account'));
      });

      // Simulate Plaid success but API failure
      await waitFor(() => {
        capturedOnSuccess('public-token', {
          accounts: [{ id: 'account-123', name: 'Test Account', mask: '1234' }],
          institution: { name: 'Test Bank' }
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to exchange Plaid token: Plaid exchange failed')).toBeInTheDocument();
      });
    });

    it('should show error when no account is selected in Plaid', async () => {
      const mockCheckoutData = {
        lineItems: [{ title: 'Test Product', price: '100.00', quantity: 1 }],
        customerFirstName: 'John',
        customerLastName: 'Doe'
      };

      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          email: 'test@example.com',
          checkout: mockCheckoutData
        }
      });

      // Set up the mock to capture the onSuccess callback
      let capturedOnSuccess;
      mockPlaidHookImpl = (config) => {
        capturedOnSuccess = config.onSuccess;
        return { open: mockOpen, ready: true };
      };

      renderComponent();

      // Simulate Plaid success with no accounts
      await waitFor(() => {
        capturedOnSuccess('public-token', {
          accounts: [],
          institution: { name: 'Test Bank' }
        });
      });

      await waitFor(() => {
        expect(screen.getByText('No account selected. Please try linking your bank account again.')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during savings plan creation', async () => {
      const mockCheckoutData = {
        lineItems: [{ title: 'Test Product', price: '100.00', quantity: 1 }],
        customerFirstName: 'John',
        customerLastName: 'Doe'
      };

      mockApi.get.mockResolvedValue({
        data: {
          success: true,
          email: 'test@example.com',
          checkout: mockCheckoutData
        }
      });

      mockApi.post.mockResolvedValueOnce({
        data: { linkToken: 'plaid-link-token' }
      });

      mockApi.post.mockResolvedValueOnce({
        data: { 
          success: true, 
          accessToken: 'plaid-access-token' 
        }
      });

      mockApi.post.mockResolvedValueOnce({
        data: { success: true }
      });

      // Make the final API call hang
      mockApi.post.mockImplementationOnce(() => new Promise(() => {}));

      // Set up the mock to capture the onSuccess callback
      let capturedOnSuccess;
      mockPlaidHookImpl = (config) => {
        capturedOnSuccess = config.onSuccess;
        return { open: mockOpen, ready: true };
      };

      renderComponent();

      // Link bank account
      await waitFor(() => {
        fireEvent.click(screen.getByText('Link Bank Account'));
      });

      await waitFor(() => {
        capturedOnSuccess('public-token', {
          accounts: [{ id: 'account-123', name: 'Test Account', mask: '1234', type: 'checking' }],
          institution: { name: 'Test Bank' }
        });
      });

      // Enter password
      await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText('Enter a secure password'), {
          target: { value: 'testpassword123' }
        });
      });

      // Create savings plan
      await waitFor(() => {
        const createButton = screen.getByText('Create Savings Plan');
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Creating Savings Plan...')).toBeInTheDocument();
        expect(screen.getByText('Creating Savings Plan...')).toBeDisabled();
      });
    });
  });
});
