import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/beforepay-logo.png';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css'; // Ensure Bootstrap CSS is imported

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/home');
  };

  const handleLogout = () => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/auth/logout`, { withCredentials: true })
      .then(() => {
        localStorage.removeItem('user');
        navigate('/');
        window.location.reload();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <nav
      className="navbar navbar-expand-lg navbar-light d-flex justify-content-between"
      style={{
        backgroundColor: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        padding: '10px 20px'
      }}
    >
      <a className="navbar-brand" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="Beforepay Logo" style={{ width: '150px' }} />
      </a>

      {user ? (
        <div className="mx-4">
          <ul className="navbar-nav">
            <li className="nav-item">
              <a
                className="nav-link"
                href="/complete-profile"
                onClick={(e) => { e.preventDefault(); navigate('/profile'); }}
                aria-label="Go to profile"
              >
                Profile
              </a>
            </li>
            <li className="nav-item">
              <button
                className="btn btn-secondary mx-3"
                onClick={handleLogout}
                aria-label="Logout"
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </nav>
  );
};

export default Navbar;