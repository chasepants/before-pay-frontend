import { useNavigate } from 'react-router-dom';
import logo from '../assets/beforepay-logo.png';
import api from '../api';
import 'bootstrap/dist/css/bootstrap.min.css';

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

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
        console.log('authToken removed, navigating to /');
        navigate('/');
        window.location.reload();
      })
      .catch((error) => {
        console.error('Logout error:', error);
      });
  };

  return (
    <Navbar expand="lg" bg="white" data-bs-theme="light" >
      <Container>
        <Navbar.Brand onClick={(e) => { e.preventDefault(); handleLogoClick(); }} >
          <img src={logo} alt="Beforepay Logo" style={{ width: '150px' }} />
        </Navbar.Brand>
        {
          user ? (
            <>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                  <Nav className="me-auto">
                    <Nav.Link onClick={(e) => { e.preventDefault(); navigate('/profile'); }}>Profile</Nav.Link>
                    <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                  </Nav>
              </Navbar.Collapse>
            </>
          ) : <></>
        }
      </Container>
    </Navbar>
  );
}

export default NavbarComponent;
