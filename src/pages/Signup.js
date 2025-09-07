// frontend/src/pages/Signup.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Container, Row, Col, Card, Button, Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../assets/beforepay-logo.png';
import EmailAuth from '../components/EmailAuth';
import { setUser } from '../store/userSlice';

const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);

  // Fix the Google signup to use the backend API endpoint
  const handleGoogleSignup = () => {
    setIsLoading(true);
    // Use the backend API endpoint instead of frontend route
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  };

  const handleAuthProvider = (provider) => {
    if (provider === 'google') {
      handleGoogleSignup();
    } else if (provider === 'email') {
      setShowEmailAuth(true);
    } else {
      // Show coming soon message for other providers
      alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} authentication is coming soon!`);
    }
  };

  const handleEmailAuthSuccess = (result) => {
    // Store token and user data with correct key
    localStorage.setItem('authToken', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    
    // Update Redux store
    dispatch(setUser(result.user));
    
    // Show email verification message if needed
    if (result.emailVerificationSent && !result.emailVerified) {
      alert('Account created successfully! Please check your email and click the verification link to complete your registration.');
    }
    
    // Navigate to home page
    navigate('/home');
  };

  const handleEmailAuthError = (error) => {
    console.error('Email auth error:', error);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center py-5" style={{ backgroundColor: '#f8f9fa' }}>
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={5}>
            <Card className="border-0 shadow-lg">
              <Card.Body className="p-5">
                {/* Logo and Header */}
                <div className="text-center mb-4">
                  <img 
                    src={logo} 
                    alt="Logo" 
                    className="mb-3" 
                    style={{ height: '60px' }}
                  />
                  <h2 className="fw-bold mb-2" style={{ color: '#116530 !important' }}>Create Your Account</h2>
                  <p className="mb-0" style={{ color: '#116530 !important' }}>Start saving towards your goals today</p>
                </div>

                {/* Auth Provider Buttons */}
                <div className="d-grid gap-3 mb-4">
                  {/* Google - Working */}
                  <Button
                    variant="outline-primary"
                    size="lg"
                    className="d-flex align-items-center justify-content-center gap-3 py-3"
                    onClick={() => handleAuthProvider('google')}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    Continue with Google
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="lg"
                    className="d-flex align-items-center justify-content-center gap-3 py-3"
                    onClick={() => handleAuthProvider('apple')}
                    style={{
                      border: '2px solid #dee2e6 !important',
                      backgroundColor: 'white !important',
                      color: '#116530 !important',
                      fontWeight: '500'
                    }}
                  >
                    <i className="bi bi-apple fs-5" style={{ color: '#116530 !important' }}></i>
                    <span style={{ color: '#116530 !important' }}>Continue with Apple</span>
                    <span className="badge bg-secondary ms-auto">Soon</span>
                  </Button>

                  {/* Microsoft - Coming Soon */}
                  <Button
                    variant="outline-primary"
                    size="lg"
                    className="d-flex align-items-center justify-content-center gap-3 py-3"
                    onClick={() => handleAuthProvider('microsoft')}
                    style={{
                      border: '2px solid #dee2e6 !important',
                      backgroundColor: 'white !important',
                      color: '#116530 !important',
                      fontWeight: '500'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#f25022" d="M1 1h10v10H1z"/>
                      <path fill="#7fba00" d="M13 1h10v10H13z"/>
                      <path fill="#00a4ef" d="M1 13h10v10H1z"/>
                      <path fill="#ffb900" d="M13 13h10v10H13z"/>
                    </svg>
                    <span style={{ color: '#116530 !important' }}>Continue with Microsoft</span>
                    <span className="badge bg-secondary ms-auto">Soon</span>
                  </Button>
                </div>

                {/* Divider */}
                <div className="text-center mb-4">
                  <span style={{ color: '#116530 !important' }}>or</span>
                </div>

                {/* Email Signup - Now Available */}
                <div className="text-center">
                  <Button
                    variant="link"
                    className="text-decoration-none"
                    onClick={() => handleAuthProvider('email')}
                    style={{ color: '#116530 !important' }}
                  >
                    <i className="bi bi-envelope me-2"></i>
                    Sign up with email
                  </Button>
                </div>

                {/* Terms and Privacy */}
                <div className="text-center mt-4">
                  <small style={{ color: '#116530 !important' }}>
                    By continuing, you agree to our{' '}
                    <a href="#" className="text-decoration-none" style={{ color: '#116530 !important' }}>Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-decoration-none" style={{ color: '#116530 !important' }}>Privacy Policy</a>
                  </small>
                </div>

                {/* Login Link */}
                <div className="text-center mt-4 pt-3 border-top">
                  <span style={{ color: '#116530 !important' }}>Already have an account? </span>
                  <Button
                    variant="link"
                    className="text-decoration-none p-0"
                    onClick={() => navigate('/login')}
                    style={{ color: '#116530 !important' }}
                  >
                    Sign in
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Email Authentication Modal */}
      <Modal show={showEmailAuth} onHide={() => setShowEmailAuth(false)} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title>Create Account with Email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <EmailAuth 
            mode="register"
            onSuccess={handleEmailAuthSuccess}
            onError={handleEmailAuthError}
          />
        </Modal.Body>
        <Modal.Footer>
          <div className="text-center w-100">
            <small style={{ color: '#116530' }}>
              Already have an account?{' '}
              <Button
                variant="link"
                className="text-decoration-none p-0"
                onClick={() => {
                  setShowEmailAuth(false);
                  navigate('/login');
                }}
                style={{ color: '#116530' }}
              >
                Sign in
              </Button>
            </small>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Signup;