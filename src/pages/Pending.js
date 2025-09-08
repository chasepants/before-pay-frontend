import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import 'bootstrap/dist/css/bootstrap.min.css';

const Pending = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Redirecting to /home after 10 seconds');
      navigate('/home');
    }, 10000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="container">
      <Navbar user={user} />
      <div className="row">
        <div className="col-sm-6 mt-5 offset-sm-3 p-5 rounded-5 text-center">
          <h1>PENDING APPROVAL</h1>
          <h5>Your application is being reviewed by Unit. You can add savings goals, but transfers are disabled until approved.</h5>
          <p>Check back later or contact support if needed.</p>
        </div>
      </div>
    </div>
  );
};

export default Pending;