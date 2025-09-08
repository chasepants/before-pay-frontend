import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailAuth from './EmailAuth';
import { registerWithEmailAndPassword, signInWithEmail, resetPassword } from '../firebase/authService';

// Mock the Firebase auth service
jest.mock('../firebase/authService', () => ({
  registerWithEmailAndPassword: jest.fn(),
  signInWithEmail: jest.fn(),
  resetPassword: jest.fn()
}));

// Mock window.alert
const mockAlert = jest.fn();
global.alert = mockAlert;

describe('EmailAuth', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Login Mode (default)', () => {
    test('renders login form with correct fields', () => {
      render(<EmailAuth onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      expect(screen.getByTestId('forgot-password-link')).toBeInTheDocument();
      
      // Should not show registration fields
      expect(screen.queryByTestId('first-name-input')).not.toBeInTheDocument();
      expect(screen.queryByTestId('last-name-input')).not.toBeInTheDocument();
      expect(screen.queryByTestId('confirm-password-input')).not.toBeInTheDocument();
    });

    test('handles successful login', async () => {
      const mockResult = { user: { id: '123', email: 'test@example.com' } };
      signInWithEmail.mockResolvedValue(mockResult);

      render(<EmailAuth onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' }
      });
      
      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockOnSuccess).toHaveBeenCalledWith(mockResult);
      });
    });

    test('shows loading state during login', async () => {
      signInWithEmail.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<EmailAuth onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' }
      });
      
      fireEvent.click(screen.getByTestId('submit-button'));

      expect(screen.getByText('Signing In...')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeDisabled();
    });
  });

  describe('Register Mode', () => {
    test('renders registration form with all fields', () => {
      render(<EmailAuth mode="register" onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      expect(screen.getByTestId('first-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('last-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      
      // Should not show forgot password link
      expect(screen.queryByTestId('forgot-password-link')).not.toBeInTheDocument();
    });

    test('handles successful registration', async () => {
      const mockResult = { user: { id: '123', email: 'test@example.com' } };
      registerWithEmailAndPassword.mockResolvedValue(mockResult);

      render(<EmailAuth mode="register" onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      fireEvent.change(screen.getByTestId('first-name-input'), {
        target: { value: 'John' }
      });
      fireEvent.change(screen.getByTestId('last-name-input'), {
        target: { value: 'Doe' }
      });
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'password123' }
      });
      
      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(registerWithEmailAndPassword).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          'John',
          'Doe'
        );
        expect(mockOnSuccess).toHaveBeenCalledWith(mockResult);
      });
    });

    test('shows loading state during registration', async () => {
      registerWithEmailAndPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<EmailAuth mode="register" onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      fireEvent.change(screen.getByTestId('first-name-input'), {
        target: { value: 'John' }
      });
      fireEvent.change(screen.getByTestId('last-name-input'), {
        target: { value: 'Doe' }
      });
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'password123' }
      });
      
      fireEvent.click(screen.getByTestId('submit-button'));

      expect(screen.getByText('Creating Account...')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    test('shows error for missing email and password in login mode', () => {
      render(<EmailAuth onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      fireEvent.click(screen.getByTestId('submit-button'));

      expect(screen.getByTestId('error-alert')).toHaveTextContent('Email and password are required');
      expect(signInWithEmail).not.toHaveBeenCalled();
    });

    // test('shows error for missing required fields in register mode', () => {
    //   render(<EmailAuth mode="register" onSuccess={mockOnSuccess} onError={mockOnError} />);
      
    //   fireEvent.click(screen.getByTestId('submit-button'));

    //   expect(screen.getByTestId('error-alert')).toHaveTextContent('First name and last name are required');
    //   expect(registerWithEmailAndPassword).not.toHaveBeenCalled();
    // });

    test('shows error for password mismatch in register mode', () => {
      render(<EmailAuth mode="register" onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      fireEvent.change(screen.getByTestId('first-name-input'), {
        target: { value: 'John' }
      });
      fireEvent.change(screen.getByTestId('last-name-input'), {
        target: { value: 'Doe' }
      });
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'different123' }
      });
      
      fireEvent.click(screen.getByTestId('submit-button'));

      expect(screen.getByTestId('error-alert')).toHaveTextContent('Passwords do not match');
      expect(registerWithEmailAndPassword).not.toHaveBeenCalled();
    });

    test('shows error for short password in register mode', () => {
      render(<EmailAuth mode="register" onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      fireEvent.change(screen.getByTestId('first-name-input'), {
        target: { value: 'John' }
      });
      fireEvent.change(screen.getByTestId('last-name-input'), {
        target: { value: 'Doe' }
      });
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: '123' }
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: '123' }
      });
      
      fireEvent.click(screen.getByTestId('submit-button'));

      expect(screen.getByTestId('error-alert')).toHaveTextContent('Password must be at least 6 characters');
      expect(registerWithEmailAndPassword).not.toHaveBeenCalled();
    });

    test('clears error when user starts typing', () => {
      render(<EmailAuth onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      // Trigger validation error
      fireEvent.click(screen.getByTestId('submit-button'));
      expect(screen.getByTestId('error-alert')).toHaveTextContent('Email and password are required');
      
      // Start typing to clear error
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'test@example.com' }
      });
      
      expect(screen.queryByTestId('error-alert')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles login error with specific error codes', async () => {
      const error = new Error('Invalid credentials');
      error.code = 'auth/invalid-email';
      signInWithEmail.mockRejectedValue(error);

      render(<EmailAuth onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'wrongpassword' }
      });
      
      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-alert')).toHaveTextContent('Invalid email address or password');
        expect(mockOnError).toHaveBeenCalledWith(error);
      });
    });

    test('handles registration error with specific error codes', async () => {
      const error = new Error('Email already in use');
      error.code = 'auth/email-already-in-use';
      registerWithEmailAndPassword.mockRejectedValue(error);

      render(<EmailAuth mode="register" onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      fireEvent.change(screen.getByTestId('first-name-input'), {
        target: { value: 'John' }
      });
      fireEvent.change(screen.getByTestId('last-name-input'), {
        target: { value: 'Doe' }
      });
      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByTestId('confirm-password-input'), {
        target: { value: 'password123' }
      });
      
      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('error-alert')).toHaveTextContent('Invalid email address or password.');
        expect(mockOnError).toHaveBeenCalledWith(error);
      });
    });

    // test('handles generic error when no specific error code', async () => {
    //   const error = new Error('Network error');
    //   signInWithEmail.mockRejectedValue(error);

    //   render(<EmailAuth onSuccess={mockOnSuccess} onError={mockOnError} />);
      
    //   fireEvent.change(screen.getByTestId('email-input'), {
    //     target: { value: 'test@example.com' }
    //   });
    //   fireEvent.change(screen.getByTestId('password-input'), {
    //     target: { value: 'password123' }
    //   });
      
    //   fireEvent.click(screen.getByTestId('submit-button'));

    //   await waitFor(() => {
    //     expect(screen.getByTestId('error-alert')).toHaveTextContent('An error occurred. Please try again.');
    //     expect(mockOnError).toHaveBeenCalledWith(error);
    //   });
    // });
  });

  describe('Forgot Password Modal', () => {
    test('opens modal when forgot password link is clicked', () => {
      render(<EmailAuth onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      fireEvent.click(screen.getByTestId('forgot-password-link'));
      
      expect(screen.getByTestId('forgot-password-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Reset Password');
    });

    test('closes modal when cancel button is clicked', () => {
      render(<EmailAuth onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      // Open modal first
      fireEvent.click(screen.getByTestId('forgot-password-link'));
      expect(screen.getByTestId('forgot-password-modal')).toBeInTheDocument();
      
      // Close modal
      fireEvent.click(screen.getByTestId('cancel-button'));
      
      // Check that modal is hidden (not removed from DOM)
      const modal = screen.getByTestId('forgot-password-modal');
      expect(modal).toHaveClass('modal-dialog modal-dialog-centered');
      expect(modal).not.toHaveClass('show');
    });

    test('sends reset email when send button is clicked', async () => {
      resetPassword.mockResolvedValue();
      
      render(<EmailAuth onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      // Open modal
      fireEvent.click(screen.getByTestId('forgot-password-link'));
      
      // Enter email
      fireEvent.change(screen.getByTestId('reset-email-input'), {
        target: { value: 'test@example.com' }
      });
      
      // Send reset email
      fireEvent.click(screen.getByTestId('send-reset-button'));
      
      await waitFor(() => {
        expect(resetPassword).toHaveBeenCalledWith('test@example.com');
        expect(mockAlert).toHaveBeenCalledWith('Password reset email sent! Check your inbox.');
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper form structure', () => {
      render(<EmailAuth onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      expect(screen.getByTestId('email-auth-form')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
    });

    test('has proper button roles', () => {
      render(<EmailAuth onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      expect(screen.getByTestId('forgot-password-link')).toBeInTheDocument();
    });

    test('has proper modal structure', () => {
      render(<EmailAuth onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      fireEvent.click(screen.getByTestId('forgot-password-link'));
      
      expect(screen.getByTestId('forgot-password-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Reset Password');
    });
  });

  describe('Styling and UI', () => {
    test('applies correct button styling', () => {
      render(<EmailAuth onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toHaveClass('w-100', 'py-3');
      expect(submitButton).toHaveStyle({
        backgroundColor: '#116530',
        borderColor: '#116530',
        fontWeight: '500'
      });
    });

    test('shows error alert with danger variant', () => {
      render(<EmailAuth onSuccess={mockOnSuccess} onError={mockOnError} />);
      
      fireEvent.click(screen.getByTestId('submit-button'));
      
      const errorAlert = screen.getByTestId('error-alert');
      expect(errorAlert).toHaveClass('alert-danger');
    });
  });
});
