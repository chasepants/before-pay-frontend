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
  const [linkedAccount, setLinkedAccount] = useState(null); // Store linked account details
  const [existingCounterparties, setExistingCounterparties] = useState([]); // Store existing counterparties
  const [selectedAccount, setSelectedAccount] = useState(null); // Track selected account (new or existing)
  const [amount, setAmount] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [interval, setInterval] = useState('Weekly'); // Default to Weekly
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Monday'); // Default to Monday
  const [totalNumberOfPayments, setTotalNumberOfPayments] = useState('');
  const [showTooltip, setShowTooltip] = useState(false); // State for tooltip visibility

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

    const fetchExistingCounterparties = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/bank/counterparties/${user._id}`, { withCredentials: true });
        setExistingCounterparties(response.data.counterparties || []);
        if (response.data.counterparties.length > 0 && !selectedAccount) {
          setSelectedAccount(response.data.counterparties[0].id); // Auto-select first if none chosen
        }
      } catch (err) {
        console.error('Failed to fetch existing counterparties:', err);
      }
    };
    fetchExistingCounterparties();
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
    if (!selectedAccount || !amount || !interval || !startTime || (interval === 'Monthly' && !dayOfMonth) || (interval === 'Weekly' && !dayOfWeek)) {
      setError('Please fill all required fields: account, amount, interval, start date, and day (of month or week).');
      return;
    }
    if (user.status !== 'approved') {
      setError('Account not approved yet');
      return;
    }

    const schedule = {
      startTime,
      endTime: endTime || undefined,
      interval,
      ...(interval === 'Monthly' && { dayOfMonth: parseInt(dayOfMonth) }),
      ...(interval === 'Weekly' && { dayOfWeek }),
      totalNumberOfPayments: totalNumberOfPayments ? parseInt(totalNumberOfPayments) : undefined
    };

    setIsLoading(true);
    setError('');

    try {
      await axios.post(
        'http://localhost:3001/api/bank/setup-savings',
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
            <label htmlFor="endTime" className="form-label mt-3">End Date (Optional)</label>
            <input
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="form-control form-control-lg"
              type="date"
              aria-label="End Date"
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
            {interval === 'Monthly' && (
              <div>
                <label htmlFor="dayOfMonth" className="form-label mt-3">Day of Month (1-28 or -5 to -1)</label>
                <input
                  value={dayOfMonth}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if ((value >= 1 && value <= 28) || (value >= -5 && value <= -1)) {
                      setDayOfMonth(e.target.value);
                    }
                  }}
                  className="form-control form-control-lg"
                  type="number"
                  placeholder="e.g., 15 or -1"
                  aria-label="Day of Month"
                />
              </div>
            )}
            {interval === 'Weekly' && (
              <div>
                <label htmlFor="dayOfWeek" className="form-label mt-3">Day of Week</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="form-control form-control-lg"
                  aria-label="Day of Week"
                >
                  <option value="Sunday">Sunday</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
              </div>
            )}
            <label htmlFor="totalNumberOfPayments" className="form-label mt-3">Total Payments (Optional)</label>
            <input
              value={totalNumberOfPayments}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value > 0 || e.target.value === '') setTotalNumberOfPayments(e.target.value);
              }}
              className="form-control form-control-lg"
              type="number"
              placeholder="e.g., 12"
              aria-label="Total Number of Payments"
            />
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
            {existingCounterparties.length > 0 && !linkedAccount && (
              <select
                value={selectedAccount || ''}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="form-select mt-2"
              >
                <option value="">Select an existing account</option>
                {existingCounterparties.map((counterparty) => (
                  <option key={counterparty.id} value={counterparty.id}>
                    {counterparty.name} (****{counterparty.mask})
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
                  <i className="bi bi-lock"></i> Link a New Bank Account
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