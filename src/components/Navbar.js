import { useNavigate } from 'react-router-dom';
import logo from '../assets/beforepay-logo.png';
import axios from 'axios';

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  
  const handleLogoClick = () => {
    navigate('/home');
  };

  const handleLogout = () => {
    axios.get('http://localhost:3001/api/auth/logout', { withCredentials: true })
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
      style={{
        backgroundColor: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        padding: '10px 20px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <img
        src={logo}
        alt="Beforepay Logo"
        style={{
          width: '150px', // Adjust size as needed
          cursor: 'pointer',
        }}
        onClick={handleLogoClick}
      />
      {
        user && (
          <button
            onClick={handleLogout}
            style={{ backgroundColor: '#db4437', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
          >
            Logout
          </button>
        )
      }
    </nav>
  );
};

export default Navbar;