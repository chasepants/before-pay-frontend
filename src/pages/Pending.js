import { useSelector } from 'react-redux';
import Navbar from '../components/Navbar';

const Pending = () => {
  const { user } = useSelector((state) => state.user);

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