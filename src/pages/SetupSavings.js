// frontend/src/pages/SetupSavings.js
import React, { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import LoadingAnimation from '../components/LoadingAnimation';

const SetupSavings = () => {
  const navigate = useNavigate();
  const { savingsGoalId } = useParams();
  const { user } = useSelector((state) => state.user);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plaidToken, setPlaidToken] = useState(null);
  const [plaidPublicToken, setPlaidPublicToken] = useState(null);
  const [plaidAccountId, setPlaidAccountId] = useState(null);
  const [linkedAccount, setLinkedAccount] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [startTime, setStartTime] = useState('');
  const [interval, setInterval] = useState('Weekly');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (!savingsGoalId) {
      setError('Invalid savings goal ID');
      return;
    }

    const checkProfile = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}api/auth/profile-status`, { withCredentials: true });
        if (!response.data.completed) {
          navigate('/complete-profile');
        }
      } catch (err) {
        setError('Failed to check profile status');
      }
    };
    checkProfile();

    const fetchPlaidToken = async () => {
      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}api/bank/plaid-link-token`, {}, { withCredentials: true });
        setPlaidToken(response.data.link_token);
      } catch (err) {
        setError('Failed to initialize bank account linking');
      }
    };
    fetchPlaidToken();
  }, [user, savingsGoalId, navigate]);

  const { open, ready } = usePlaidLink({
    token: plaidToken,
    onSuccess: (public_token, metadata) => {
      if (metadata.accounts && metadata.accounts.length > 0) {
        const account = metadata.accounts[0];
        setPlaidPublicToken(public_token);
        setPlaidAccountId(account.id);
        setLinkedAccount({
          id: account.id,
          name: account.name || 'Linked Account',
          mask: account.mask || '****'
        });
        setSelectedAccount(account.id); // Auto-select the newly linked account
      } else {
        setError('No account selected. Please try linking your bank account again.');
      }
    },
    onExit: (err, metadata) => {
      if (err) {
        setError('Failed to link bank account: ' + err.message);
      }
    }
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedAccount || !amount || !interval || !startTime || !interval) {
      setError('Please fill all required fields: account, amount, interval, and start date');
      return;
    }
    if (user.status !== 'approved') {
      setError('Account not approved yet');
      return;
    }

    const schedule = {
      startTime,
      interval
    };

    setIsLoading(true);
    setError('');

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}api/bank/setup-savings`,
        {
          savingsGoalId,
          plaidAccessToken: plaidPublicToken || null, // Only send if newly linked
          plaidAccountId: selectedAccount,
          amount,
          schedule
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

  const handleChangeAccount = () => {
    setPlaidPublicToken(null);
    setPlaidAccountId(null);
    setLinkedAccount(null);
    setSelectedAccount(null); // Reset to allow relinking
  };

  const handleInfoHover = (isHovering) => {
    setShowTooltip(isHovering);
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
    console.log("loading bank account linking...");
    return <LoadingAnimation />;
  }

  return (
    <div>
      <Navbar user={user} />
      <div className="container mt-5">
        <div className='row'></div>
        <div className="row">
          <div className="col-sm-6 mt-5 p-5">
            <h5>Create A Savings Plan</h5>
            <label htmlFor="amount" className="form-label mt-3">How much do you want to save?</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-control form-control-lg"
              type="text"
              placeholder="$50"
              aria-label="Savings Amount"
            />
            <label htmlFor="startTime" className="form-label mt-3">Start Date</label>
            <input
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="form-control form-control-lg"
              type="date"
              aria-label="Start Date"
            />
            <label htmlFor="interval" className="form-label mt-3">Interval</label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="form-control form-control-lg"
              aria-label="Interval"
            >
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
            <label htmlFor="account" className="form-label mt-4">Select or link a bank account</label>
            {linkedAccount && (
              <div>
                <p>Linked Account: {linkedAccount.name} (****{linkedAccount.mask})</p>
                <button
                  onClick={handleChangeAccount}
                  className="btn btn-secondary mt-2"
                >
                  Change Account
                </button>
              </div>
            )}
            {!linkedAccount && (
              <div className='d-flex flex-row align-items-center justify-space-between'>
                <button
                  onClick={() => open()}
                  disabled={!ready || isLoading}
                  className="btn btn-secondary mt-4"
                >
                  <i className="bi bi-lock"></i> Link a Bank Account
                </button>
                <h3
                  className='mt-2 mx-3'
                  onMouseEnter={() => handleInfoHover(true)}
                  onMouseLeave={() => handleInfoHover(false)}
                >
                  <i className="bi bi-info-circle"></i>
                  {showTooltip && (
                    <div
                      style={{
                        position: 'absolute',
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        padding: '10px',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        zIndex: 1000,
                        width: '50%',
                        maxHeight: '50%',
                        overflowY: 'auto',
                        marginLeft: '-200px',
                        marginTop: '10px',
                        whiteSpace: 'normal',
                      }}
                    >
                      <p>
                        Beforepay utilizes Plaid, a third-party service, to securely facilitate bank account linking. We do not store, access, or process your bank account details. Plaid provides a tokenized representation of your account, which is securely transmitted to our payment processor, Dwolla, for transaction processing. For more information on how your data is handled, please review Plaid's <a href="https://plaid.com/legal/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                      </p>
                    </div>
                  )}
                </h3>
              </div>
            )}
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