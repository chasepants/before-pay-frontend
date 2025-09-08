import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import StayNotified from './StayNotified';

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

// Helper function to render component with router
const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('StayNotified', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    test('renders without crashing', () => {
      renderWithRouter(<StayNotified />);
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByText('Stay Notified of Launch')).toBeInTheDocument();
    });

    test('renders form elements correctly', () => {
      renderWithRouter(<StayNotified />);
      
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Stay Notified' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '← Back to Landing Page' })).toBeInTheDocument();
    });

    test('renders form inputs with correct attributes', () => {
      renderWithRouter(<StayNotified />);
      
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email Address');
      
      expect(firstNameInput).toHaveAttribute('type', 'text');
      expect(firstNameInput).toHaveAttribute('name', 'firstName');
      expect(firstNameInput).toHaveAttribute('required');
      expect(firstNameInput).toHaveAttribute('placeholder', 'Enter your first name');
      
      expect(lastNameInput).toHaveAttribute('type', 'text');
      expect(lastNameInput).toHaveAttribute('name', 'lastName');
      expect(lastNameInput).toHaveAttribute('required');
      expect(lastNameInput).toHaveAttribute('placeholder', 'Enter your last name');
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('name', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('placeholder', 'Enter your email address');
    });
  });

  describe('Form Interaction', () => {
    test('updates form data when user types', () => {
      renderWithRouter(<StayNotified />);
      
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email Address');
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      
      expect(firstNameInput.value).toBe('John');
      expect(lastNameInput.value).toBe('Doe');
      expect(emailInput.value).toBe('john@example.com');
    });

    test('shows loading state when submitting', async () => {
      const mockApi = require('../api');
      mockApi.post.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderWithRouter(<StayNotified />);
      
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Stay Notified' });
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    test('submits form successfully', async () => {
      const mockApi = require('../api');
      mockApi.post.mockResolvedValue({ 
        data: { message: 'Thank you! We\'ll notify you when we launch.' } 
      });
      
      renderWithRouter(<StayNotified />);
      
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Stay Notified' });
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith('/api/launch/notify', {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Thank you! We\'ll notify you when we launch.')).toBeInTheDocument();
        expect(screen.getByText('Redirecting you back to the landing page...')).toBeInTheDocument();
      });
    });

    test('shows success message and redirects after 3 seconds', async () => {
      const mockApi = require('../api');
      mockApi.post.mockResolvedValue({ 
        data: { message: 'Thank you! We\'ll notify you when we launch.' } 
      });
      
      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      
      renderWithRouter(<StayNotified />);
      
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Stay Notified' });
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Thank you! We\'ll notify you when we launch.')).toBeInTheDocument();
      });
      
      // Fast-forward time by 3 seconds
      jest.advanceTimersByTime(3000);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
      
      jest.useRealTimers();
    });

    test('clears form after successful submission', async () => {
      const mockApi = require('../api');
      mockApi.post.mockResolvedValue({ 
        data: { message: 'Thank you! We\'ll notify you when we launch.' } 
      });
      
      renderWithRouter(<StayNotified />);
      
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Stay Notified' });
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Thank you! We\'ll notify you when we launch.')).toBeInTheDocument();
      });
      
      // When success message is shown, the form should be hidden
      expect(screen.queryByLabelText('First Name')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Last Name')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Email Address')).not.toBeInTheDocument();
    });

    test('shows error when submission fails', async () => {
      const mockApi = require('../api');
      mockApi.post.mockRejectedValue({ 
        response: { data: { error: 'Email already registered' } } 
      });
      
      renderWithRouter(<StayNotified />);
      
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Stay Notified' });
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email already registered')).toBeInTheDocument();
      });
    });

    test('shows generic error when no specific error message', async () => {
      const mockApi = require('../api');
      mockApi.post.mockRejectedValue(new Error('Network error'));
      
      renderWithRouter(<StayNotified />);
      
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Stay Notified' });
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to register for notifications')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    test('navigates back to landing page when back button is clicked', () => {
      renderWithRouter(<StayNotified />);
      
      const backButton = screen.getByRole('button', { name: '← Back to Landing Page' });
      fireEvent.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels', () => {
      renderWithRouter(<StayNotified />);
      
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    });

    test('has proper button roles', () => {
      renderWithRouter(<StayNotified />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(screen.getByRole('button', { name: 'Stay Notified' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '← Back to Landing Page' })).toBeInTheDocument();
    });

    test('has proper input structure', () => {
      renderWithRouter(<StayNotified />);
      
      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(3);
      
      // Check that all inputs have proper attributes
      inputs.forEach(input => {
        expect(input).toHaveAttribute('required');
        expect(input).toHaveAttribute('placeholder');
      });
    });
  });

  describe('State Management', () => {
    test('resets error state when form is resubmitted', async () => {
      const mockApi = require('../api');
      mockApi.post
        .mockRejectedValueOnce({ response: { data: { error: 'First error' } } })
        .mockResolvedValueOnce({ data: { message: 'Success!' } });
      
      renderWithRouter(<StayNotified />);
      
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Stay Notified' });
      
      // First submission - should fail
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });
      
      // Second submission - should succeed
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
        expect(screen.getByText('Success!')).toBeInTheDocument();
      });
    });

    test('shows success message and hides form after successful submission', async () => {
      const mockApi = require('../api');
      mockApi.post.mockResolvedValue({ 
        data: { message: 'Thank you! We\'ll notify you when we launch.' } 
      });
      
      renderWithRouter(<StayNotified />);
      
      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Stay Notified' });
      
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Thank you! We\'ll notify you when we launch.')).toBeInTheDocument();
      });
      
      // When success message is shown, form should be hidden
      expect(screen.queryByLabelText('First Name')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Last Name')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Email Address')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Stay Notified' })).not.toBeInTheDocument();
    });
  });
});
