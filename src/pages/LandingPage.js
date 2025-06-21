// frontend/src/pages/LandingPage.js
import { useNavigate } from 'react-router-dom';
import logo from '../assets/beforepay-logo.png'; // Adjust the path to where the logo is stored

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    window.location.href = 'http://localhost:3001/api/auth/google'; // Redirect to Google OAuth
  };

  const handleLearnMore = () => {
    navigate('/learn-more');
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
          width: '600px',
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
      <div>
        <button
          onClick={handleGetStarted}
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
            marginRight: '10px',
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#f09f6d')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#ff914d')}
        >
          GET STARTED
        </button>
        <button
          onClick={handleLearnMore}
          style={{
            backgroundColor: '#e0e0e0',
            color: '#333',
            padding: '12px 24px',
            borderRadius: '4px',
            border: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#c0c0c0')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#e0e0e0')}
        >
          LEARN MORE
        </button>
      </div>
    </div>
  );
};

export default LandingPage;