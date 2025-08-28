import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../assets/beforepay-logo.png';

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  };

  const handleAuthProvider = (provider) => {
    if (provider === 'google') {
      handleGoogleLogin();
    } else {
      // Show coming soon message for other providers
      alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} authentication is coming soon!`);
    }
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
                  <h2 className="fw-bold mb-2" style={{ color: '#116530 !important' }}>Welcome Back</h2>
                  <p className="mb-0" style={{ color: '#116530 !important' }}>Sign in to continue saving towards your goals</p>
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

                  {/* Apple - Coming Soon */}
                  <Button
                    variant="outline-primary"
                    size="lg"
                    className="d-flex align-items-center justify-content-center gap-3 py-3"
                    onClick={() => handleAuthProvider('apple')}
                  >
                    <i className="bi bi-apple fs-5"></i>
                    Continue with Apple
                    <span className="badge bg-secondary ms-auto">Soon</span>
                  </Button>

                  {/* Microsoft - Coming Soon */}
                  <Button
                    variant="outline-primary"
                    size="lg"
                    className="d-flex align-items-center justify-content-center gap-3 py-3"
                    onClick={() => handleAuthProvider('microsoft')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#f25022" d="M1 1h10v10H1z"/>
                      <path fill="#7fba00" d="M13 1h10v10H13z"/>
                      <path fill="#00a4ef" d="M1 13h10v10H1z"/>
                      <path fill="#ffb900" d="M13 13h10v10H13z"/>
                    </svg>
                    Continue with Microsoft
                    <span className="badge bg-secondary ms-auto">Soon</span>
                  </Button>
                </div>

                {/* Divider */}
                <div className="text-center mb-4">
                  <span style={{ color: '#116530 !important' }}>or</span>
                </div>

                {/* Email Login - Disabled */}
                <div className="text-center">
                  <Button
                    variant="link"
                    className="text-decoration-none"
                    disabled
                    style={{ 
                      pointerEvents: 'none',
                      color: '#116530 !important'
                    }}
                  >
                    <i className="bi bi-envelope me-2"></i>
                    Sign in with email (Coming Soon)
                  </Button>
                </div>

                {/* Forgot Password */}
                <div className="text-center mt-3">
                  <Button
                    variant="link"
                    className="text-decoration-none p-0"
                    style={{ color: '#116530 !important' }}
                  >
                    <small>Forgot your password?</small>
                  </Button>
                </div>

                {/* Terms and Privacy */}
                <div className="text-center mt-4">
                  <small style={{ color: '#116530 !important' }}>
                    By signing in, you agree to our{' '}
                    <a href="#" className="text-decoration-none" style={{ color: '#116530 !important' }}>Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-decoration-none" style={{ color: '#116530 !important' }}>Privacy Policy</a>
                  </small>
                </div>

                {/* Signup Link */}
                <div className="text-center mt-4 pt-3 border-top">
                  <span style={{ color: '#116530 !important' }}>Don't have an account? </span>
                  <Button
                    variant="link"
                    className="text-decoration-none p-0"
                    onClick={() => navigate('/signup')}
                    style={{ color: '#116530 !important' }}
                  >
                    Sign up
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;