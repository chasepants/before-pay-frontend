// Email Authentication Component
import { useState } from 'react';
import { Button, Form, Alert, Modal } from 'react-bootstrap';
import { registerWithEmailAndPassword, signInWithEmail, resetPassword } from '../firebase/authService';

const EmailAuth = ({ mode = 'login', onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user starts typing
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return false;
    }

    if (mode === 'register') {
      if (!formData.firstName || !formData.lastName) {
        setError('First name and last name are required');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      let result;
      if (mode === 'register') {
        result = await registerWithEmailAndPassword(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName
        );
      } else {
        result = await signInWithEmail(formData.email, formData.password);
      }
      
      onSuccess(result);
    } catch (error) {
      let errorMessage = 'An error occurred. Please try again.';
      console.log(error.code);
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Invalid email address or password.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address or password';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Invalid email address or password';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email address or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = 'Invalid email address or password';
      }
      
      setError(errorMessage);
      onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await resetPassword(resetEmail);
      setError('');
      alert('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error) {
      let errorMessage = 'Failed to send password reset email';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form onSubmit={handleSubmit}>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {mode === 'register' && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter your first name"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter your last name"
                required
              />
            </Form.Group>
          </>
        )}

        <Form.Group className="mb-3">
          <Form.Label>Email Address</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            required
          />
        </Form.Group>

        {mode === 'register' && (
          <Form.Group className="mb-3">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              required
            />
          </Form.Group>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-100 py-3"
          disabled={isLoading}
          style={{ 
            backgroundColor: '#116530',
            borderColor: '#116530',
            fontWeight: '500'
          }}
        >
          {isLoading ? (
            <div className="d-flex align-items-center justify-content-center">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              {mode === 'register' ? 'Creating Account...' : 'Signing In...'}
            </div>
          ) : (
            mode === 'register' ? 'Create Account' : 'Sign In'
          )}
        </Button>
      </Form>

      {mode === 'login' && (
        <div className="text-center mt-3">
          <Button
            variant="link"
            className="text-decoration-none p-0"
            onClick={() => setShowForgotPassword(true)}
            style={{ color: '#116530' }}
          >
            <small>Forgot your password?</small>
          </Button>
        </div>
      )}

      {/* Forgot Password Modal */}
      <Modal show={showForgotPassword} onHide={() => setShowForgotPassword(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email address"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowForgotPassword(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleForgotPassword}
            disabled={isLoading}
            style={{ backgroundColor: '#116530', borderColor: '#116530' }}
          >
            {isLoading ? 'Sending...' : 'Send Reset Email'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EmailAuth;
