// frontend/src/pages/SetupSavings.js
import React, { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const SetupSavings = () => {
  const navigate = useNavigate();
  const { wishlistItemId } = useParams();
  const { user } = useSelector((state) => state.user);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plaidToken, setPlaidToken] = useState(null);
  const [plaidAccessToken, setPlaidAccessToken] = useState(null);
  const [plaidAccountId, setPlaidAccountId] = useState(null);
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('week');
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (!wishlistItemId) {
      setError('Invalid wishlist item ID');
      return;
    }

    const checkProfile = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/auth/profile-status', { withCredentials: true });
        if (!response.data.completed) {
          navigate('/complete-profile');
        }
      } catch (err) {
        setError('Failed to check profile status');
      }
    };
    checkProfile();

    // Fetch Plaid Link token from backend
    const fetchPlaidToken = async () => {
      try {
        const response = await axios.post('http://localhost:3001/api/bank/plaid-link-token', {}, { withCredentials: true });
        setPlaidToken(response.data.link_token);
      } catch (err) {
        setError('Failed to initialize bank account linking');
      }
    };
    fetchPlaidToken();
  }, [user, wishlistItemId, navigate]);

  const { open, ready } = usePlaidLink({
    token: plaidToken,
    onSuccess: (public_token, metadata) => {
      // Exchange public token for access token
      setPlaidAccessToken(public_token);
      setPlaidAccountId(metadata.account_id);
      //async save plaid token
      console.log(metadata);
    },
    onExit: (err, metadata) => {
      if (err) {
        setError('Failed to link bank account');
      }
    }
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!plaidAccessToken || !plaidAccountId) {
      setError('Please link a bank account');
      return;
    }
    if (!amount || !frequency || !startDate) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await axios.post(
        'http://localhost:3001/api/bank/setup-savings',
        {
          wishlistItemId,
          plaidAccessToken,
          plaidAccountId,
          amount,
          frequency,
          start_date: startDate
        },
        { withCredentials: true }
      );
      alert('Savings plan set up successfully!');
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set up savings plan');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div style={{ padding: '16px' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button
          onClick={() => navigate('/home')}
          style={{
            backgroundColor: '#4285f4',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!plaidToken) {
    return <div style={{ padding: '16px' }}><p>Loading bank account linking...</p></div>;
  }

  return (
    <div>
      <Navbar user={user} />
      <div className="container mt-5">
        <div className='row'></div>
        <div className="row">
          <div className="col-sm-6 mt-5 p-5">
            <h5>Create A Savings Plan</h5>
            <label htmlFor="schedule" className="form-label mt-3">How often do you want to save?</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value)} className="form-select" aria-label="schedule">
              <option value="">---</option>
              <option value="week">Every week</option>
              <option value="biweek">Every 2 weeks</option>
              <option value="month">Every month</option>
            </select>
            <label htmlFor="amount" className="form-label mt-3">How much do you want to save?</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} className="form-control form-control-lg" type="text" placeholder="$50" aria-label="savings Amount"/>
            <label htmlFor="date" className="form-label mt-3">When do you want to start?</label>
            <input value={startDate} onChange={e => setStartDate(e.target.value)} className="form-control form-control-lg" type="text" placeholder="mm/dd/yyyy" aria-label="Start Date"/>
            <label htmlFor="account" className="form-label mt-4">Securely link a bank account</label>
            <button
              onClick={() => open()}
              disabled={!ready || isLoading}
              className="btn btn-primary mt-2"
            >
              Link Bank Account
            </button>
            <button onClick={handleSubmit} className="btn btn-primary w-50 mt-5" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupSavings;