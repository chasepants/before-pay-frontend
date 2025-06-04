// frontend/src/pages/LandingPage.js
import { useNavigate } from 'react-router-dom';
import logo from '../assets/beforepay-logo.png'; // Adjust the path to where the logo is stored

const LandingPage = () => {
  const navigate = useNavigate();

  const handleExploreClick = () => {
    navigate('/home');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
      }}
    >
      <img
        src={logo}
        alt="Beforepay Logo"
        style={{
          width: '600px', // Adjust size as needed
          marginBottom: '20px',
        }}
      />
      <h2
        style={{
          fontFamily: 'montserrat',
          fontSize: '24px',
          fontWeight: 'normal',
          color: '#333',
          marginBottom: '30px',
        }}
      >
            SAVE FOR PURCHASES LIKE A GROWNUP
      </h2>
      <button
        onClick={handleExploreClick}
        style={{
          backgroundColor: '#ff914d',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '4px',
          border: 'none',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'background-color 0.3s',
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = '#f09f6d')}
        onMouseOut={(e) => (e.target.style.backgroundColor = '#ff914d')}
      >
        EXPLORE
      </button>
    </div>
  );
};

export default LandingPage;