import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router';
import Denied from './Denied';
import userSlice from '../store/userSlice';
import savingsSlice from '../store/savingsSlice';

// Mock the Navbar component
jest.mock('../components/Navbar', () => {
  return function MockNavbar({ user }) {
    return <div data-testid="navbar">Navbar {user ? `User: ${user.firstName}` : 'No User'}</div>;
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

// Helper function to render component with store
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

describe('Denied', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders without crashing', () => {
      renderWithProviders(<Denied />);
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    test('shows application denied message', () => {
      renderWithProviders(<Denied />);
      expect(screen.getByText('Application Denied')).toBeInTheDocument();
      expect(screen.getByText('Your application was not approved at this time.')).toBeInTheDocument();
    });

    test('shows contact support information', () => {
      renderWithProviders(<Denied />);
      expect(screen.getByText('If you believe this is an error, please contact support.')).toBeInTheDocument();
    });

    test('shows contact support button', () => {
      renderWithProviders(<Denied />);
      const contactButton = screen.getByRole('link', { name: 'Contact Support' });
      expect(contactButton).toBeInTheDocument();
      expect(contactButton).toHaveAttribute('href', 'mailto:support@example.com');
    });
  });

  describe('Layout and Styling', () => {
    test('has proper container structure', () => {
      renderWithProviders(<Denied />);
      // Look for the container class directly
      const container = document.querySelector('.container');
      expect(container).toBeInTheDocument();
    });

    test('has proper card structure', () => {
      renderWithProviders(<Denied />);
      const cardHeader = screen.getByText('Application Denied').closest('.card-header');
      const cardBody = screen.getByText('Your application was not approved at this time.').closest('.card-body');
      
      expect(cardHeader).toBeInTheDocument();
      expect(cardBody).toBeInTheDocument();
    });

    test('has proper Bootstrap classes', () => {
      renderWithProviders(<Denied />);
      const cardHeader = screen.getByText('Application Denied').closest('.card-header');
      expect(cardHeader).toHaveClass('bg-dark', 'text-white');
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', () => {
      renderWithProviders(<Denied />);
      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toHaveTextContent('Application Denied');
    });

    test('contact support link is accessible', () => {
      renderWithProviders(<Denied />);
      const contactLink = screen.getByRole('link', { name: 'Contact Support' });
      expect(contactLink).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    test('displays all required text content', () => {
      renderWithProviders(<Denied />);
      
      expect(screen.getByText('Application Denied')).toBeInTheDocument();
      expect(screen.getByText('Your application was not approved at this time.')).toBeInTheDocument();
      expect(screen.getByText('If you believe this is an error, please contact support.')).toBeInTheDocument();
    });

    test('contact support email is correct', () => {
      renderWithProviders(<Denied />);
      const contactLink = screen.getByRole('link', { name: 'Contact Support' });
      expect(contactLink).toHaveAttribute('href', 'mailto:support@example.com');
    });
  });
});
