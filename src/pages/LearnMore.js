import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const LearnMore = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="row mb-5">
          <div className="col-12 text-center">
            <h1 className="text-dark fw-bold">How BeforePay Works</h1>
            <p className="lead text-muted">Your Path to Smarter Savings</p>
          </div>
        </div>

        <div className="row mb-5">
          <div className="col-12">
            <div className="card border-0 shadow-sm bg-light p-4">
              <div className="card-body">
                <h4 className="text-dark">Welcome to BeforePay</h4>
                <p className="card-text">
                  At BeforePay, we’re dedicated to helping you save effortlessly by creating personalized savings accounts tailored to your goals. Whether you're saving for a dream vacation, a new home, or an emergency fund, our platform makes it simple and secure.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-5">
          <div className="col-md-4 mb-4">
            <div className="card border-0 shadow-sm bg-light p-4 h-100">
              <div className="card-body text-center">
                <i className="bi bi-gear-fill display-4 text-primary mb-3"></i>
                <h5 className="card-title">Set Your Goals</h5>
                <p className="card-text">
                  Start by creating a savings goal with a target amount and schedule. Choose how often and when to save, and we’ll handle the rest with automated transfers from your linked account.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card border-0 shadow-sm bg-light p-4 h-100">
              <div className="card-body text-center">
                <i className="bi bi-bank display-4 text-primary mb-3"></i>
                <h5 className="card-title">Link Your Account</h5>
                <p className="card-text">
                  Securely connect your existing bank account using our trusted linking process. We use advanced encryption to ensure your financial details remain safe.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card border-0 shadow-sm bg-light p-4 h-100">
              <div className="card-body text-center">
                <i className="bi bi-shield-fill-check display-4 text-primary mb-3"></i>
                <h5 className="card-title">FDIC Insured</h5>
                <p className="card-text">
                  Your savings accounts with BeforePay are FDIC insured up to $250,000, providing you with the same protection as traditional banks for complete peace of mind.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-5">
          <div className="col-12">
            <div className="card border-0 shadow-sm bg-light p-4">
              <div className="card-body">
                <h4 className="text-dark">How It Works</h4>
                <ol className="card-text">
                  <li><strong>Create a Goal:</strong> Define your savings target and schedule automated contributions.</li>
                  <li><strong>Link Securely:</strong> Connect your bank account with our encrypted linking tool.</li>
                  <li><strong>Save Automatically:</strong> We transfer funds on your chosen days, tracking your progress.</li>
                  <li><strong>Access Anytime:</strong> Monitor your goals and account details from your dashboard.</li>
                </ol>
                <p className="card-text">
                  BeforePay is designed to make saving easy and secure. Our accounts are backed by FDIC insurance, ensuring your money is protected. Start today and take control of your financial future!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-5">
          <div className="col-12 text-center">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/application-signup')}>
              Get Started
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LearnMore;