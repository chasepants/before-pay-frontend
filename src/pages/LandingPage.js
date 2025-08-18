import { useNavigate } from 'react-router-dom';
import logo from '../assets/beforepay-logo.png';
import Image from 'react-bootstrap/Image';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  };

  const handleLearnMore = () => {
    navigate('/learn-more');
  };

  return (
    <Container className='mx-3' fluid style={{ height: "100vh" }}>
      <Row className="justify-content-md-center m-5" md="auto">
        <Col>
          <Image src={logo} alt="Beforepay Logo" fluid />
        </Col>
      </Row>
      <Row className="justify-content-md-center m-5" md="auto">
        <Col>
          <h2>
            SAVE FOR PURCHASES LIKE A GROWNUP
          </h2>
        </Col>
      </Row>
      <Row className="justify-content-md-center m-5" md="auto">
        <Col>
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
        </Col>
        <Col>
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
        </Col>
      </Row>
    </Container>
  );
};

export default LandingPage;