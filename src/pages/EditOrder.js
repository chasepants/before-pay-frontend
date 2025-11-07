import React, { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router';
import api from '../api';
import Navbar from '../components/Navbar';
import LoadingAnimation from '../components/LoadingAnimation';

const EditOrder = () => {
  const navigate = useNavigate();
  const { savingsGoalId } = useParams();
  const { user } = useSelector((state) => state.user);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plaidToken, setPlaidToken] = useState(null);
  const [plaidPublicToken, setPlaidPublicToken] = useState(null);
  const [linkedAccount, setLinkedAccount] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [savingsGoal, setSavingsGoal] = useState(null);
  const [isLoadingGoal, setIsLoadingGoal] = useState(true);
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

    // Fetch the savings goal to verify it's a Shopify order
    const fetchSavingsGoal = async () => {
      try {
        const res = await api.get(`/api/savings-goal/${savingsGoalId}`);
        if (res.data && res.data.__t !== 'ShopifySavingsGoal') {
          setError('This page is only for Shopify installment orders');
          setIsLoadingGoal(false);
          return;
        }
        setSavingsGoal(res.data);
      } catch (err) {
        setError('Failed to load order details');
      }
      setIsLoadingGoal(false);
    };

    fetchSavingsGoal();
  }, [user, savingsGoalId, navigate]);

  useEffect(() => {
    if (!user || !savingsGoalId || isLoadingGoal) {
      return;
    }

    const fetchPlaidToken = async () => {
      try {
        const response = await api.post(`/api/bank/plaid-link-token`);
        if (response.data && response.data.link_token) {
          setPlaidToken(response.data.link_token);
        } else {
          setError('Failed to initialize bank account linking: Invalid response');
        }
      } catch (err) {
        console.error('Error fetching Plaid token:', err);
        setError('Failed to initialize bank account linking: ' + (err.response?.data?.error || err.message || 'Unknown error'));
      }
    };
    fetchPlaidToken();
  }, [user, savingsGoalId, isLoadingGoal]);

  const { open, ready } = usePlaidLink({
    token: plaidToken || null,
    onSuccess: (public_token, metadata) => {
      if (metadata.accounts && metadata.accounts.length > 0) {
        const account = metadata.accounts[0];
        setPlaidPublicToken(public_token);
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
    if (!selectedAccount || !plaidPublicToken) {
      setError('Please connect a bank account');
      return;
    }

    if (!savingsGoal) {
      setError('Savings goal not loaded');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // For logged-in users, use the setup-savings endpoint which handles JWT authentication
      // and exchanges the Plaid public token. It can also update existing savings goals.
      // Include existing goal values to preserve them while updating the bank account.
      const updateData = {
        savingsGoalId,
        plaidAccessToken: plaidPublicToken, // Backend will exchange this public token
        plaidAccountId: selectedAccount
      };

      // Determine amount - required field
      if (savingsGoal.savingsAmount) {
        updateData.amount = savingsGoal.savingsAmount.toString();
      } else if (savingsGoal.checkoutCartId && savingsGoal.checkoutCartId.totalPrice) {
        // Fallback to checkout cart total price if savingsAmount not set (for Shopify installments)
        updateData.amount = savingsGoal.checkoutCartId.totalPrice.toString();
      } else {
        setError('Unable to determine savings amount. Please contact support.');
        setIsLoading(false);
        return;
      }

      // Transform schedule from saved format (startDate) to API format (startTime) - required field
      if (savingsGoal.schedule) {
        const startTime = savingsGoal.schedule.startDate || savingsGoal.schedule.startTime;
        const interval = savingsGoal.schedule.interval;
        
        if (!startTime || !interval) {
          setError('Savings goal schedule is missing required fields. Please contact support.');
          setIsLoading(false);
          return;
        }
        
        updateData.schedule = {
          startTime,
          interval
        };
      } else {
        setError('Savings goal schedule not found. Please contact support.');
        setIsLoading(false);
        return;
      }

      await api.post(`/api/bank/setup-savings`, updateData);
      alert('Bank account updated successfully!');
      navigate(`/view-order/${savingsGoalId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update bank account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeAccount = () => {
    setPlaidPublicToken(null);
    setLinkedAccount(null);
    setSelectedAccount(null);
  };

  const handleInfoHover = (isHovering) => {
    setShowTooltip(isHovering);
  };

  if (error && !isLoadingGoal) {
    return (
      <>
        <Navbar user={user} />
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
      </>
    );
  }

  if (isLoadingGoal || !savingsGoal) {
    return <LoadingAnimation />;
  }

  // If we have an error related to Plaid token initialization, show error but don't wait indefinitely
  if (!plaidToken && !error) {
    return <LoadingAnimation />;
  }

  return (
    <div>
      <Navbar user={user} />
      <div className="container mt-5">
        <div className="row">
          <div className="col-sm-8 offset-sm-2">
            <div className="mb-4">
              <h4>Edit Installment Plan</h4>
              <p className="text-muted">
                Update the bank account for your installment plan. This will be used for all future payments.
              </p>
            </div>

            {/* Current Bank Account Info */}
            {savingsGoal.bank && (
              <div className="card mb-4 border-0 shadow-sm">
                <div className="card-body">
                  <h6 className="card-title mb-3">Current Bank Account</h6>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-bank me-2 text-primary fs-5"></i>
                    <div>
                      <div className="fw-bold">{savingsGoal.bank.bankName}</div>
                      <div className="small text-muted">
                        ••••{savingsGoal.bank.lastFour}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Plaid Link Section */}
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="card-title mb-3">Connect New Bank Account</h6>
                <p className="text-muted small mb-4">
                  Link a new bank account to use for your installment payments.
                </p>

                {linkedAccount ? (
                  <div>
                    <div className="alert alert-info d-flex align-items-center mb-3">
                      <i className="bi bi-check-circle me-2"></i>
                      <div>
                        <strong>Linked Account:</strong> {linkedAccount.name} (****{linkedAccount.mask})
                      </div>
                    </div>
                    <button
                      onClick={handleChangeAccount}
                      className="btn btn-outline-secondary btn-sm mb-3"
                    >
                      Change Account
                    </button>
                  </div>
                ) : (
                  <div className="d-flex flex-row align-items-center justify-content-start mb-3">
                    <button
                      onClick={() => {
                        if (ready && open) {
                          open();
                        } else {
                          setError('Plaid Link is not ready. Please wait a moment and try again.');
                        }
                      }}
                      disabled={!ready || isLoading || !plaidToken}
                      className="btn btn-primary"
                    >
                      <i className="bi bi-lock me-2"></i> Link a Bank Account
                    </button>
                    <div
                      className="ms-3 position-relative"
                      onMouseEnter={() => handleInfoHover(true)}
                      onMouseLeave={() => handleInfoHover(false)}
                      data-testid="info-icon"
                    >
                      <i className="bi bi-info-circle fs-5 text-muted"></i>
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
                            width: '300px',
                            left: '30px',
                            top: '0',
                            whiteSpace: 'normal',
                          }}
                          data-testid="tooltip-content"
                        >
                          <p className="mb-0 small">
                            BeforePay utilizes Plaid, a third-party service, to securely facilitate bank account linking. We do not store, access, or process your bank account details. Plaid provides a tokenized representation of your account, which is securely transmitted to our payment processor for transaction processing. For more information on how your data is handled, please review Plaid's <a href="https://plaid.com/legal/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleSubmit} 
                  className="btn btn-dark w-100 mt-4" 
                  disabled={isLoading || !linkedAccount}
                >
                  {isLoading ? 'Updating...' : 'Update Bank Account'}
                </button>

                <button
                  onClick={() => navigate(`/view-order/${savingsGoalId}`)}
                  className="btn btn-outline-secondary w-100 mt-2"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrder;
