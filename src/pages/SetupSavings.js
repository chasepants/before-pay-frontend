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
  const { savingsGoalId } = useParams(); // Renamed from wishlistItemId
  const { user } = useSelector((state) => state.user);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plaidToken, setPlaidToken] = useState(null);
  const [plaidPublicToken, setPlaidPublicToken] = useState(null);
  const [plaidAccountId, setPlaidAccountId] = useState(null);
  const [linkedAccount, setLinkedAccount] = useState(null);
  const [existingAccounts, setExistingAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('week');
  const [startDate, setStartDate] = useState('');
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
        const response = await axios.get('http://localhost:3001/api/auth/profile-status', { withCredentials: true });
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
        const response = await axios.post('http://localhost:3001/api/bank/plaid-link-token', {}, { withCredentials: true });
        setPlaidToken(response.data.link_token);
      } catch (err) {
        setError('Failed to initialize bank account linking');
      }
    };
    fetchPlaidToken();

    const fetchExistingAccounts = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/bank/funding-sources/${user.dwollaCustomerId}`, { withCredentials: true });
        setExistingAccounts(response.data.fundingSources || []);
      } catch (err) {
        console.error('Failed to fetch existing funding sources:', err);
      }
    };
    fetchExistingAccounts();
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
        setSelectedAccount(account.id);
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
    if (!selectedAccount || user.status !== 'approved') {
      setError('Please select or link a bank account and wait for approval');
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
          savingsGoalId,
          plaidAccessToken: plaidPublicToken || null,
          plaidAccountId: selectedAccount,
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

  const handleChangeAccount = () => {
    setPlaidPublicToken(null);
    setPlaidAccountId(null);
    setLinkedAccount(null);
    setSelectedAccount(null);
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
            {(!linkedAccount && existingAccounts.length > 0) && (
              <select
                value={selectedAccount || ''}
                onChange={e => setSelectedAccount(e.target.value)}
                className="form-select mt-2"
              >
                <option value="">Select an existing account</option>
                {existingAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} (****{account.mask})
                  </option>
                ))}
              </select>
            )}
            {!linkedAccount && (
              <div className='d-flex flex-row align-items-center justify-space-between'>
                <button
                  onClick={() => open()}
                  disabled={!ready || isLoading}
                  className="btn btn-secondary mt-4"
                >
                  <i className="bi bi-lock"></i>&nbsp;Link a New Bank Account
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
                        Beforepay utilizes Plaid, a third-party service, to securely facilitate bank account linking. We do not store, access, or process your bank account details. Plaid provides a tokenized representation of your account, which is securely transmitted to our payment processor, Unit, for transaction processing. For more information on how your data is handled, please review Plaid's <a href="https://plaid.com/legal/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                      </p>
                    </div>
                  )}
                </h3>
              </div>
            )}
            <button onClick={handleSubmit} className="btn btn-primary w-50 mt-5" disabled={isLoading || user.status !== 'approved'}>
              {isLoading ? 'Processing...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupSavings;