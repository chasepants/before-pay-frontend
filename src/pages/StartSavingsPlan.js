import React, { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useNavigate, useLocation } from 'react-router';
import api from '../api';
import Navbar from '../components/Navbar';
import LoadingAnimation from '../components/LoadingAnimation';
import 'bootstrap/dist/css/bootstrap.min.css';

const StartSavingsPlan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse query parameters from location.search
  const urlParams = new URLSearchParams(location.search);
  const token = urlParams.get('token');
  const checkoutId = urlParams.get('checkout');
  console.log('Location:', location);
  console.log('Search:', location.search);
  console.log('Token:', token, 'CheckoutId:', checkoutId);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plaidToken, setPlaidToken] = useState(null);
  const [plaidPublicToken, setPlaidPublicToken] = useState(null);
  const [linkedAccount, setLinkedAccount] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('Invalid link. Please use the link from your email.');
      setIsValidating(false);
      return;
    }

    // Validate token and get checkout data
    const validateToken = async () => {
      try {
        const response = await api.get(`/api/validate-email-token/${token}`);
        if (response.data.success) {
          setEmail(response.data.email);
          setCheckoutData(response.data.checkout);
        } else {
          setError('Invalid or expired link. Please request a new one.');
        }
      } catch (err) {
        setError('Invalid or expired link. Please request a new one.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const { open, ready } = usePlaidLink({
    token: plaidToken,
    onSuccess: async (public_token, metadata) => {
      if (metadata.accounts && metadata.accounts.length > 0) {
        const account = metadata.accounts[0];
        
        try {
          // Exchange public token for access token
          const exchangeResponse = await api.post('/api/savings-goal/connect-plaid', {
            emailToken: token, // Use token as emailToken for abandoned cart flow
            publicToken: public_token,
            accountId: account.id
          });
          
          if (exchangeResponse.data.success) {
            setPlaidPublicToken(exchangeResponse.data.accessToken);
            setLinkedAccount({
              id: account.id,
              name: account.name || 'Linked Account',
              mask: account.mask || '****'
            });
          } else {
            setError(exchangeResponse.data.error || 'Failed to exchange Plaid token');
          }
        } catch (err) {
          setError('Failed to exchange Plaid token: ' + (err.response?.data?.error || err.message));
        }
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

  // Auto-open Plaid Link when token is ready
  useEffect(() => {
    if (plaidToken && ready) {
      open();
    }
  }, [plaidToken, ready, open]);

  const calculateTotal = () => {
    if (!checkoutData?.lineItems) return 0;
    return checkoutData.lineItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  const handleCreateSavingsPlan = async () => {
    if (!linkedAccount || !plaidPublicToken) {
      setError('Please link a bank account first');
      return;
    }

    if (!password) {
      setError('Please enter a password to secure your account');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const firebaseResponse = await api.post('/api/auth/register', {
        email: email,
        password: password,
        firstName: 'Guest',
        lastName: 'User',
        userType: 'guest' 
      });
      console.log('Firebase response:', firebaseResponse);

      console.log('Creating savings goal...');
        const response = await api.post('/api/savings-goal/create-guest-goal', {
          emailToken: token, 
          goalName: `Save for ${checkoutData?.lineItems?.[0]?.title || 'this purchase'}`,
          description: `Automatic savings for your purchase`,
          targetAmount: calculateTotal(),
          product: {
            title: checkoutData?.lineItems?.[0]?.title || 'Purchase',
            price: calculateTotal().toString(),
            quantity: checkoutData?.lineItems?.reduce((total, item) => total + item.quantity, 0) || 1,
            productType: 'product',
            shopifyProductId: checkoutData?.lineItems?.[0]?.productId,
            shopifyVariantId: checkoutData?.lineItems?.[0]?.variantId,
            shopDomain: checkoutData?.shopDomain
          }
        });

      console.log(response);

      if (response.data.success) {
        alert('Savings plan created successfully! You can now log in with your email and password to manage your savings.');
        navigate('/login');
      }
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.error || 'Failed to create savings plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkBankAccount = async () => {
    try {
      // Create Plaid link token using emailToken
      const plaidResponse = await api.post('/api/savings-goal/plaid/create-link-token', {
        emailToken: token // Use token as emailToken for abandoned cart flow
      });
      setPlaidToken(plaidResponse.data.linkToken);
    } catch (err) {
      setError('Failed to initialize bank account linking: ' + (err.response?.data?.error || err.message));
    }
  };

  if (isValidating) {
    return <LoadingAnimation />;
  }

  if (error && !checkoutData) {
    return (
      <div style={{ padding: '16px' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button
          onClick={() => navigate('/')}
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

  if (!checkoutData) {
    return <LoadingAnimation />;
  }

  return (
    <div>
      <Navbar />
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                <h3 className="mb-0">Start Your Savings Plan</h3>
                <p className="text-muted">Save for your purchase over time with automatic payments</p>
              </div>
              <div className="card-body">
                
                {/* Savings Plan Explanation */}
                <div className="alert alert-info mb-4">
                  <h5><i className="bi bi-info-circle"></i> How StashPay Works</h5>
                  <p className="mb-2">Instead of paying for your purchase all at once, StashPay helps you save up over time with automatic monthly payments.</p>
                  <ul className="mb-0">
                    <li><strong>Flexible Schedule:</strong> Pay over 4 months with automatic monthly payments</li>
                    <li><strong>Secure:</strong> Your money is held safely until you're ready to purchase</li>
                    <li><strong>Manageable:</strong> Break large purchases into smaller, budget-friendly payments</li>
                  </ul>
                </div>

                {/* Checkout Items Display */}
                <div className="mb-4">
                  <h5>Items in Your Cart:</h5>
                  <div className="list-group">
                    {checkoutData.lineItems.map((item, index) => (
                      <div key={index} className="list-group-item">
                        <div className="d-flex justify-content-between">
                          <div>
                            <h6 className="mb-1">{item.title}</h6>
                            <small className="text-muted">Quantity: {item.quantity}</small>
                          </div>
                          <div className="text-end">
                            <strong>${(parseFloat(item.price) * item.quantity).toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-light rounded">
                    <div className="d-flex justify-content-between">
                      <strong>Total Amount:</strong>
                      <strong>${calculateTotal().toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* Link Bank Account Section */}
                <div className="mb-4">
                  <h5>Link Your Bank Account</h5>
                  {!linkedAccount ? (
                    <div>
                      <p>Connect your bank account to set up automatic savings.</p>
                      <button
                        onClick={handleLinkBankAccount}
                        disabled={isLoading}
                        className="btn btn-primary"
                      >
                        <i className="bi bi-lock"></i> Link Bank Account
                      </button>
                    </div>
                  ) : (
                    <div className="alert alert-success">
                      <i className="bi bi-check-circle"></i> {linkedAccount.name} (****{linkedAccount.mask})
                    </div>
                  )}
                </div>

                {/* Password Section */}
                <div className="mb-4">
                  <h5>Create Your Account</h5>
                  <p className="text-muted">This is how you will log back in to track your progress</p>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={email}
                      disabled
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a secure password"
                      required
                    />
                  </div>
                </div>

                {/* Savings Plan Details */}
                <div className="mb-4">
                  <h5>Your Savings Plan</h5>
                  <div className="alert alert-success">
                    <p><strong>Payment Schedule:</strong> Monthly payments over 4 months</p>
                    <p><strong>Amount per Payment:</strong> ${(calculateTotal() / 4).toFixed(2)}</p>
                    <p><strong>First Payment:</strong> Tomorrow</p>
                  </div>
                </div>

                <button 
                  onClick={handleCreateSavingsPlan} 
                  className="btn btn-success btn-lg w-100" 
                  disabled={isLoading || !linkedAccount || !password}
                >
                  {isLoading ? 'Creating Savings Plan...' : 'Create Savings Plan'}
                </button>

                {error && (
                  <div className="alert alert-danger mt-3">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartSavingsPlan;