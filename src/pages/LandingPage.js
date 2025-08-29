import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import logo from '../assets/beforepay-logo.png';
import 'bootstrap/dist/css/bootstrap.min.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const isProduction = process.env.REACT_APP_VERCEL_ENV === 'production';

  const handleGetStarted = () => {
    if (isProduction) {
      navigate('/stay-notified');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Coming Soon Banner - Only show in production */}
      {isProduction && (
        <div className="text-center d-flex align-items-center py-2 justify-content-center" 
             style={{ 
               backgroundColor: '#18a558', 
               color: 'white',
               fontSize: '0.875rem'
             }}>
            <div className="d-flex align-items-center justify-content-center">
              <i className="bi bi-clock-history me-2"></i>
              <span className="fw-bold">Coming Soon - Join the Waitlist for Early Access!</span>
            </div>
        </div>
      )}

      {/* Navigation */}
      <Navbar expand="lg" className="navbar-light py-3" style={{ backgroundColor: 'white' }}>
        <Container>
          <Navbar.Brand>
            <img src={logo} alt="Logo" height="40" />
          </Navbar.Brand>
          
          {/* Only show navbar menu in non-production */}
          {!isProduction && (
            <>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="ms-auto">
                  <Button 
                    variant="outline-primary" 
                    className="me-2 mb-2 mb-lg-0 w-100 w-lg-auto"
                    onClick={() => navigate('/login')}
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleGetStarted}
                    className="w-100 w-lg-auto"
                  >
                    Get Started
                  </Button>
                </Nav>
              </Navbar.Collapse>
            </>
          )}
        </Container>
      </Navbar>

      {/* Hero Section */}
      <section>
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-5 mb-lg-0">
              <h1 className="display-4 fw-bold mb-4" style={{ color: '#116530' }}>
                Save Smarter, 
                <br />
                <span style={{ color: '#21b6a8' }}>Achieve Faster</span>
              </h1>
              <p className="lead mb-4" style={{ color: '#6c757d', fontSize: '1.25rem' }}>
                Automate your savings with intelligent transfers that help you reach your financial goals. 
                Whether it's a dream vacation, new gadget, or emergency fund, we make saving effortless.
              </p>
              <div className="d-flex gap-3 mb-4">
                <Button 
                  size="lg" 
                  variant="primary"
                  onClick={handleGetStarted}
                  className="px-4 py-3"
                >
                  {isProduction ? 'Stay Notified' : 'Start Saving Today'}
                </Button>
                {!isProduction && (
                  <Button 
                    size="lg" 
                    variant="outline-primary"
                    className="px-4 py-3"
                  >
                    Learn More
                  </Button>
                )}
              </div>
              {/* Metrics section commented out above */}
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5" style={{ backgroundColor: 'white' }}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold mb-3" style={{ color: '#116530' }}>
                Why Choose Us?
              </h2>
              <p className="lead text-muted">
                We've built the smartest way to save money automatically
              </p>
            </Col>
          </Row>
          <Row className="g-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3">
                    <i className="bi bi-lightning-charge" style={{ fontSize: '2.5rem', color: '#21b6a8' }}></i>
                  </div>
                  <h5 className="fw-bold mb-3" style={{ color: '#116530' }}>Automated Transfers</h5>
                  <p className="text-muted mb-0">
                    Set it once and watch your savings grow automatically. No more forgetting to transfer money.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3">
                    <i className="bi bi-piggy-bank" style={{ fontSize: '2.5rem', color: '#a3ebb1' }}></i>
                  </div>
                  <h5 className="fw-bold mb-3" style={{ color: '#116530' }}>Smart Savings Dashboard</h5>
                  <p className="text-muted mb-0">
                    Track your progress, set goals, and watch your money grow with our intuitive interface.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4 text-center">
                  <div className="mb-3">
                    <i className="bi bi-shield-check" style={{ fontSize: '2.5rem', color: '#18a558' }}></i>
                  </div>
                  <h5 className="fw-bold mb-3" style={{ color: '#116530' }}>Bank-Level Security</h5>
                  <p className="text-muted mb-0">
                    Your money is protected with the same security standards used by major banks.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-5">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h2 className="display-5 fw-bold mb-4" style={{ color: '#116530' }}>
                {isProduction ? 'Be First to Know When We Launch' : 'Ready to Start Your Savings Journey?'}
              </h2>
              <p className="lead mb-4 text-muted">
                {isProduction 
                  ? 'Join our waitlist and get early access to the smartest way to save money automatically.'
                  : 'Join thousands of smart savers who are already achieving their financial goals.'
                }
              </p>
              <Button 
                size="lg" 
                variant="primary"
                onClick={handleGetStarted}
                className="px-5 py-3"
              >
                {isProduction ? 'Stay Notified' : 'Get Started Free'}
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-4" style={{ backgroundColor: '#116530', color: 'white' }}>
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <img src={logo} alt="Logo" height="30" className="mb-2" />
              <p className="mb-0 small">Making saving simple, smart, and automatic.</p>
            </Col>
            <Col md={6} className="text-md-end">
              <small>&copy; 2024 SaveAhead. All rights reserved.</small>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;