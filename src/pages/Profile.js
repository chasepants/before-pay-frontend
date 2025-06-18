import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Navbar from '../components/Navbar';

import axios from 'axios';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  const [completed, setCompleted] = useState(false);
  const [address, setAddress] = useState({ line1: '', city: '', state: '', postal_code: '' });
  const [ssnLast4, setSsnLast4] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    const checkProfile = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/auth/profile-status', { withCredentials: true });
        setCompleted(response.data.completed);

        if (response.data.completed) {
          setAddress(user.address);
          setDateOfBirth(user.dateOfBirth);
          setSsnLast4(user.ssnLast4);
        }
      } catch (err) {
        console.error('Profile check failed:', err);
      }
    };
    checkProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        'http://localhost:3001/api/auth/complete-profile',
        { address, ssnLast4, dateOfBirth },
        { withCredentials: true }
      );
      navigate('/home');
    } catch (err) {
      setError('Failed to save profile information');
    }
  };

  return (
    <div>
      <Navbar user={user} />
      <div className='container mt-5'>
        <div className='row'>
          <div className="border border-black col-sm-6 mt-5 offset-sm-3 p-5 rounded-5 text-center">
            {completed && 
              <>
                <h1>Update Your Profile</h1>
              </>
            }
            {!completed && 
              <>
                <h1>Complete Your Profile</h1>
                <p>We need your address and the last 4 digits of your SSN to set up your savings account.</p>
              </>
            }
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <input
              className="form-control form-control-lg mt-3"
              placeholder="Address"
              aria-label="Address"
              type="text"
              value={address.line1}
              onChange={(e) => setAddress({ ...address, line1: e.target.value })}
              required
            />
            <input
              className="form-control form-control-lg mt-3"
              placeholder="City"
              aria-label="City"
              type="text"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              required
            />
            <input
              className="form-control form-control-lg mt-3"
              placeholder="State"
              aria-label="State"
              type="text"
              value={address.state}
              onChange={(e) => setAddress({ ...address, state: e.target.value })}
              required
            />
            <input
              className="form-control form-control-lg mt-3"
              placeholder="Postal Code"
              aria-label="Postal Code"
              type="text"
              value={address.postal_code}
              onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
              required
            />
            <input
              className="form-control form-control-lg mt-3"
              aria-label="Birth Date"
              type="text"
              placeholder='YYYY-MM-DD'
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
            <input
              className="form-control form-control-lg mt-3"
              placeholder="SSN Last 4"
              aria-label="SSN Last 4"
              type="text"
              value={ssnLast4}
              onChange={(e) => setSsnLast4(e.target.value)}
              required
              maxLength={4}
            />
            <button onSubmit={handleSubmit} className="btn btn-primary w-50 mt-5" type="submit">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;