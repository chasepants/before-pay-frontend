import { useNavigate } from 'react-router-dom';
import logo from '../assets/beforepay-logo.png';
import usingPlatformImage from '../assets/using_platform.png';
import envelopesImage from '../assets/envelope.png';
import bankImage from '../assets/bank.png';
import bargraphImage from '../assets/bargraph.png';
import brightImage from '../assets/bright.png';
import calculatorImage from '../assets/calculator.png';
import creditcardImage from '../assets/creditcard.png';
import dollarImage from '../assets/dollar.png';
import highfiveImage from '../assets/highfive.png';
import orangearrowImage from '../assets/orangearrow.png';
import piechartImage from '../assets/piechart.png';
import subtractionImage from '../assets/subtraction.png';
import three_dollarsImage from '../assets/three_dollars.png';
import thumbsupImage from '../assets/thumbsup.png';
import whitelineImage from '../assets/whiteline.png';
import { Container, Row, Col, Image, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
const LandingPage = () => {
const navigate = useNavigate();
const brandName = 'BeforePay';
const handleGetStarted = () => {
console.log('Get Started clicked, redirecting to Google OAuth');
window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  };
const handleLearnMore = () => {
console.log('Learn More clicked, scrolling to learn-more section');
document.getElementById('learn-more').scrollIntoView({ behavior: 'smooth' });
  };
return (
<div style={{ overflowY: 'auto', height: '100vh' }}>
{/* Hero Section */}
<Container
fluid
className="d-flex flex-column justify-content-center align-items-center text-center"
style={{
height: '100vh',
backgroundColor: '#ffffff',
padding: '20px',
        }}
>
<Row className="w-100">
<Col>
<Image
src={logo}
alt={`${brandName} Logo`}
style={{
maxWidth: '300px',
width: '50%',
marginBottom: '30px',
              }}
/>
</Col>
</Row>
<Row className="w-100 mb-3">
<Col>
<h5>SAVE FOR PURCHASES LIKE A GROWNUP</h5>
</Col>
</Row>
<Row className="w-50 justify-content-center">
<Col xs={12} sm={6} md={4} className="mb-3">
<Button
onClick={() => navigate(
  process.env.REACT_APP_VERCEL_ENV === 'production' ? '/stay-notified' : '/signup'
)}
style={{
backgroundColor: '#ffbd59',
color: 'white',
padding: '12px 24px',
borderRadius: '4px',
border: 'none',
fontSize: 'clamp(14px, 4vw, 16px)',
fontWeight: 'bold',
cursor: 'pointer',
transition: 'background-color 0.3s',
width: '100%',
maxWidth: '200px',
              }}
onMouseOver={(e) => (e.target.style.backgroundColor = '#f09f6d')}
onMouseOut={(e) => (e.target.style.backgroundColor = '#ffbd59')}
>
              GET STARTED
</Button>
</Col>
<Col xs={12} sm={6} md={4} className="mb-3">
<Button
onClick={handleLearnMore}
style={{
backgroundColor: '#e0e0e0',
color: '#333',
padding: '12px 24px',
borderRadius: '4px',
border: 'none',
fontSize: 'clamp(14px, 4vw, 16px)',
fontWeight: 'bold',
cursor: 'pointer',
transition: 'background-color 0.3s',
width: '100%',
maxWidth: '200px',
              }}
onMouseOver={(e) => (e.target.style.backgroundColor = '#c0c0c0')}
onMouseOut={(e) => (e.target.style.backgroundColor = '#e0e0e0')}
>
              LEARN MORE
</Button>
</Col>
</Row>
</Container>
{/* Learn More Section */}
<Container
fluid
id="learn-more"
className="d-flex flex-column justify-content-center align-items-center text-center"
style={{
height: '100vh',
backgroundColor: '#ffbd59',
color: 'white',
padding: '20px',
position: 'relative',
        }}
>
<Row className="w-100">
<Col>
<h3
style={{
fontSize: 'clamp(1.2rem, 4vw, 2rem)',
fontWeight: 'bold',
marginBottom: '20px',
              }}
>
{brandName} is a savings platform that rewards incremental savings for targeted purchases
</h3>
</Col>
</Row>
<Image
src={usingPlatformImage}
alt="Savings Illustration"
style={{
position: 'absolute',
bottom: '20px',
right: '20px',
maxWidth: '200px',
width: '30%',
          }}
/>
</Container>
{/* Piggy Bank Section */}
<Container
fluid
className="d-flex flex-column justify-content-center align-items-center text-center"
style={{
height: '100vh',
backgroundColor: '#ffffff',
padding: '20px',
position: 'relative',
        }}
>
<Image
src={three_dollarsImage}
alt="Envelopes Illustration"
style={{
position: 'absolute',
top: '10%',
left: '15%',
maxWidth: '200px',
width: '30%',
          }}
/>
<Row className="w-100">
<Col>
<h3
style={{
fontSize: 'clamp(1.2rem, 4vw, 2rem)',
fontWeight: 'bold',
marginBottom: '20px',
              }}
>
Think of a piggy bank for a specific purchase or the savings envelope method but for the modern age
</h3>
</Col>
</Row>
<Image
src={envelopesImage}
alt="Envelopes Illustration"
style={{
position: 'absolute',
bottom: '15%',
right: '15%',
maxWidth: '200px',
width: '30%',
          }}
/>
<Image
src={orangearrowImage}
alt="Arrow Illustration"
style={{
position: 'absolute',
bottom: '10%',
left: '15%',
maxWidth: '25%',
width: '15%',
          }}
/>
</Container>
{/* FDIC Insured Section */}
<Container
fluid
className="d-flex flex-column justify-content-center align-items-center text-center"
style={{
height: '100vh',
backgroundColor: '#ffbd59',
color: 'white',
padding: '20px',
position: 'relative',
        }}
>
<Row className="w-100">
<Col>
<h3
style={{
fontSize: 'clamp(1.2rem, 4vw, 2rem)',
fontWeight: 'bold',
marginBottom: '20px',
              }}
>
              When you open an account with {brandName} you open an FDIC insured savings account
</h3>
</Col>
</Row>
<Image
src={highfiveImage}
alt="Highfive Illustration"
style={{
position: 'absolute',
bottom: '20%',
left: '20%',
maxWidth: '200px',
width: '30%',
          }}
/>
<Image
src={bankImage}
alt="FDIC Illustration"
style={{
position: 'absolute',
bottom: '15%',
right: '15%',
maxWidth: '150px',
width: '30%',
          }}
/>
</Container>
{/* Debit Card Section */}
<Container
fluid
className="d-flex flex-column justify-content-center align-items-center text-center"
style={{
height: '100vh',
backgroundColor: '#ffffff',
padding: '20px',
position: 'relative',
        }}
>
<Row className="w-100">
<Col>
<h3
style={{
fontSize: 'clamp(1.2rem, 4vw, 2rem)',
fontWeight: 'bold',
marginBottom: '20px',
              }}
>
              This account comes with a debit card and a competitive savings rate
</h3>
</Col>
</Row>
<Image
src={creditcardImage}
alt="Debit Card Illustration"
style={{
position: 'absolute',
bottom: '20%',
left: '20%',
maxWidth: '200px',
width: '30%',
          }}
/>
<Image
src={bargraphImage}
alt="FDIC Illustration"
style={{
position: 'absolute',
bottom: '15%',
right: '15%',
maxWidth: '150px',
width: '30%',
          }}
/>
</Container>
{/* Savings Goals Section */}
<Container
fluid
className="d-flex flex-column justify-content-center align-items-center text-center"
style={{
height: '100vh',
backgroundColor: '#ffbd59',
color: 'white',
padding: '20px',
position: 'relative',
        }}
>
<Image
src={piechartImage}
alt="Piechart Illustration"
style={{
position: 'absolute',
top: '10%',
left: '15%',
maxWidth: '15%',
width: '10%',
          }}
/>
<Row className="w-100">
<Col>
<h3
style={{
fontSize: 'clamp(1.2rem, 4vw, 2rem)',
fontWeight: 'bold',
marginBottom: '20px',
              }}
>
              Your account allows you to create saving goals, connect an external funding source and schedule savings transfers
</h3>
</Col>
</Row>
<Image
src={whitelineImage}
alt="FDIC Illustration"
style={{
position: 'absolute',
// zIndex: -1,
top: '15%',
right: '30%',
maxWidth: '15%',
width: '10%',
          }}
/>
<Image
src={bankImage}
alt="FDIC Illustration"
style={{
position: 'absolute',
bottom: '15%',
right: '15%',
maxWidth: '15%',
width: '10%',
          }}
/>
</Container>
{/* Deduction Section */}
<Container
fluid
className="d-flex flex-column justify-content-center align-items-center text-center"
style={{
height: '100vh',
backgroundColor: '#ffffff',
padding: '20px',
position: 'relative',
        }}
>
<Image
src={creditcardImage}
alt="Credit Card Illustration"
style={{
position: 'absolute',
top: '10%',
left: '15%',
maxWidth: '15%',
width: '10%',
          }}
/>
<Row className="w-100">
<Col>
<h3
style={{
fontSize: 'clamp(1.2rem, 4vw, 2rem)',
fontWeight: 'bold',
marginBottom: '20px',
              }}
>
              If you need to use the money from your savings account, we will deduct the amount spent from all your savings goals
</h3>
</Col>
</Row>
<Image
src={subtractionImage}
alt="FDIC Illustration"
style={{
position: 'absolute',
bottom: '15%',
right: '15%',
maxWidth: '15%',
width: '10%',
          }}
/>
</Container>
{/* Allocation Section */}
<Container
fluid
className="d-flex flex-column justify-content-center align-items-center text-center"
style={{
height: '100vh',
backgroundColor: '#ffbd59',
color: 'white',
padding: '20px',
position: 'relative',
        }}
>
<Image
src={brightImage}
alt="Credit Card Illustration"
style={{
position: 'absolute',
top: '10%',
left: '15%',
maxWidth: '15%',
width: '10%',
          }}
/>
<Row className="w-100">
<Col>
<h3
style={{
fontSize: 'clamp(1.2rem, 4vw, 2rem)',
fontWeight: 'bold',
marginBottom: '20px',
              }}
>
              When you sign in next, we’ll help you adjust the allocations so that you can control what your savings priorities are
</h3>
</Col>
</Row>
<Image
src={calculatorImage}
alt="Calculator Illustration"
style={{
position: 'absolute',
bottom: '20px',
right: '20px',
maxWidth: '200px',
width: '30%',
          }}
/>
</Container>
{/* Final Section */}
<Container
fluid
className="d-flex flex-column justify-content-center align-items-center text-center"
style={{
height: '100vh',
backgroundColor: '#ffffff',
padding: '20px',
position: 'relative',
        }}
>
<Row className="w-100">
<Col>
<h3
style={{
fontSize: 'clamp(1.2rem, 4vw, 2rem)',
fontWeight: 'bold',
marginBottom: '20px',
              }}
>
              So that’s it! A new savings account that will help you save before buying something instead of paying for it later, which we all know is not helping our financial health
</h3>
</Col>
</Row>
<Image
src={thumbsupImage}
alt="Final Illustration"
style={{
position: 'absolute',
bottom: '15%',
right: '15%',
maxWidth: '25%',
width: '15%',
          }}
/>
</Container>
{/* Footer Section */}
<Container
fluid
className="d-flex flex-column justify-content-center align-items-center text-center"
style={{
backgroundColor: '#000000',
color: 'white',
padding: '20px',
minHeight: '100px',
        }}
>
<Row className="w-100">
<Col>
<p style={{ fontSize: 'clamp(12px, 3vw, 14px)', margin: '0' }}>
              &copy; {new Date().getFullYear()} {brandName}. All rights reserved.
</p>
</Col>
</Row>
</Container>
</div>
  );
};
export default LandingPage;