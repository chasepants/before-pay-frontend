import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState({ line1: '', city: '', state: '', postal_code: '' });
  const [ssnLast4, setSsnLast4] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/auth/profile-status', { withCredentials: true });
        if (response.data.completed) {
          navigate('/home');
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
    <div style={{ padding: '16px' }}>
      <h1>Complete Your Profile</h1>
      <p>We need your address and the last 4 digits of your SSN to set up your savings account.</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Address Line 1</label>
          <input
            type="text"
            value={address.line1}
            onChange={(e) => setAddress({ ...address, line1: e.target.value })}
            required
          />
        </div>
        <div>
          <label>City</label>
          <input
            type="text"
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            required
          />
        </div>
        <div>
          <label>State</label>
          <input
            type="text"
            value={address.state}
            onChange={(e) => setAddress({ ...address, state: e.target.value })}
            required
          />
        </div>
        <div>
          <label>Postal Code</label>
          <input
            type="text"
            value={address.postal_code}
            onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
            required
          />
        </div>
        <div>
          <label>Date of Birth</label>
          <input
            type="text"
            placeholder='YYYY-MM-DD'
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Last 4 Digits of SSN</label>
          <input
            type="text"
            value={ssnLast4}
            onChange={(e) => setSsnLast4(e.target.value)}
            required
            maxLength={4}
          />
        </div>
        <button type="submit">Save</button>
      </form>
    </div>
  );
};

export default CompleteProfile;