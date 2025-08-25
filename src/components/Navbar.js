import { useNavigate } from 'react-router-dom';
import logo from '../assets/beforepay-logo.png'; // Update to saveahead-logo.png if rebranding
import api from '../api';
import { Navbar, Container, Nav } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const NavbarComponent = ({ user }) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    console.log('Logo clicked, navigating to /home');
    navigate('/home');
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    api.get('/api/auth/logout')
      .then(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('unitVerifiedCustomerToken');
        console.log('authToken and unitVerifiedCustomerToken removed, navigating to /');
        navigate('/');
        window.location.reload();
      })
      .catch((error) => {
        console.error('Logout error:', error);
      });
  };

  const handleApplicationClick = (e) => {
    e.preventDefault();
    console.log('Application link clicked, user:', user);
    console.log('Navigating to /application-signup');
    try {
      navigate('/application-signup');
      console.log('Navigation attempted to /application-signup');
    } catch (err) {
      console.error('Navigation error:', err);
    }
  };

  const handleToggle = () => {
    console.log('Hamburger menu toggled');
    const navbarNav = document.getElementById('basic-navbar-nav');
    console.log('NavbarNav classList:', navbarNav?.classList.toString());
    console.log('Bootstrap collapse initialized:', typeof window.bootstrap?.Collapse !== 'undefined');
  };

  return (
    <Navbar
      expand="lg"
      data-bs-theme="light"
    >
      <Container fluid>
        <Navbar.Brand onClick={(e) => { e.preventDefault(); handleLogoClick(); }}>
          <img src={logo} alt="App Logo" style={{ width: '150px' }} />
        </Navbar.Brand>
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          onClick={handleToggle}
        />
        {user ? (
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              {!user.unitCustomerId && user.status !== 'approved' ? (
                <Nav.Link onClick={handleApplicationClick}>
                  Application
                </Nav.Link>
              ) : null}
              <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        ) : null}
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;