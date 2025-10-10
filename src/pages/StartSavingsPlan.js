import React, { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useNavigate } from 'react-router';
import api from '../api';
import Navbar from '../components/Navbar';
import LoadingAnimation from '../components/LoadingAnimation';
import 'bootstrap/dist/css/bootstrap.min.css';

const StartSavingsPlan = () => {
  const navigate = useNavigate();
  const checkoutId = new URLSearchParams(window.location.search).get('checkout');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plaidToken, setPlaidToken] = useState(null);
  const [plaidPublicToken, setPlaidPublicToken] = useState(null);
  const [plaidAccountId, setPlaidAccountId] = useState(null);
  const [linkedAccount, setLinkedAccount] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: Verify, 3: Plaid, 4: Complete

  useEffect(() => {
    if (!checkoutId) {
      setError('No checkout ID provided');
      return;
    }

    // Fetch checkout data from backend
    const fetchCheckoutData = async () => {
      try {
        const response = await api.get(`/api/checkout-cart/${checkoutId}`);
        setCheckoutData(response.data);
      } catch (err) {
        setError('Failed to load checkout data');
      }
    };

    fetchCheckoutData();
  }, [checkoutId]);

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
        setStep(4); // Move to completion step
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

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!guestEmail) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/api/savings-goal/send-verification', {
        email: guestEmail,
        checkoutId: checkoutId
      });
      setShowVerification(true);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/api/savings-goal/verify-code', {
        email: guestEmail,
        verificationCode: verificationCode
      });
      
      // Store the guest token for later use
      if (response.data.guestToken) {
        localStorage.setItem('guestToken', response.data.guestToken);
      }
      
      setIsEmailVerified(true);
      setStep(3);
      
      // Initialize Plaid Link
      const plaidResponse = await api.post('/api/savings-goal/connect-plaid', {
        email: guestEmail,
        verificationCode: verificationCode
      });
      setPlaidToken(plaidResponse.data.linkToken);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSavingsPlan = async () => {
    if (!linkedAccount || !plaidPublicToken) {
      setError('Please link a bank account first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/api/savings-goal/create-guest-goal', {
        guestToken: localStorage.getItem('guestToken'), // This should be set during verification
        goalName: `Save for ${checkoutData?.lineItems?.[0]?.title || 'this purchase'}`,
        description: `Automatic savings for your purchase`,
        targetAmount: checkoutData?.totalPrice || 0,
        product: {
          title: checkoutData?.lineItems?.[0]?.title || 'Purchase',
          price: checkoutData?.totalPrice?.toString() || '0',
          quantity: checkoutData?.lineItems?.reduce((total, item) => total + item.quantity, 0) || 1,
          productType: 'product',
          shopifyProductId: checkoutData?.lineItems?.[0]?.productId,
          shopifyVariantId: checkoutData?.lineItems?.[0]?.variantId,
          shopDomain: checkoutData?.shopDomain
        },
        plaidToken: plaidPublicToken
      });

      if (response.data.success) {
        alert('Savings plan created successfully! You can manage it by logging in with your email.');
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create savings plan');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!checkoutData?.lineItems) return 0;
    return checkoutData.lineItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  if (error && step === 1) {
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
                
                {/* Step 1: Email Input */}
                {step === 1 && (
                  <div>
                    <h5>Step 1: Create Your Account</h5>
                    <p>Enter your email to create a guest account for managing your savings plan.</p>
                    <form onSubmit={handleEmailSubmit}>
                      <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Verification Code'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Step 2: Email Verification */}
                {step === 2 && (
                  <div>
                    <h5>Step 2: Verify Your Email</h5>
                    <p>We sent a verification code to <strong>{guestEmail}</strong></p>
                    <form onSubmit={handleVerificationSubmit}>
                      <div className="mb-3">
                        <label htmlFor="verificationCode" className="form-label">Verification Code</label>
                        <input
                          type="text"
                          className="form-control"
                          id="verificationCode"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Verify Code'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Step 3: Plaid Link */}
                {step === 3 && (
                  <div>
                    <h5>Step 3: Link Your Bank Account</h5>
                    <p>Connect your bank account to set up automatic savings.</p>
                    {!plaidToken && <LoadingAnimation />}
                    {plaidToken && (
                      <button
                        onClick={() => open()}
                        disabled={!ready || isLoading}
                        className="btn btn-primary"
                      >
                        <i className="bi bi-lock"></i> Link Bank Account
                      </button>
                    )}
                  </div>
                )}

                {/* Step 4: Review and Complete */}
                {step === 4 && (
                  <div>
                    <h5>Step 4: Review Your Savings Plan</h5>
                    
                    {/* Checkout Items Display */}
                    <div className="mb-4">
                      <h6>Items in Your Cart:</h6>
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

                    {/* Linked Account Display */}
                    {linkedAccount && (
                      <div className="mb-4">
                        <h6>Linked Bank Account:</h6>
                        <div className="alert alert-info">
                          <i className="bi bi-check-circle"></i> {linkedAccount.name} (****{linkedAccount.mask})
                        </div>
                      </div>
                    )}

                    {/* Savings Plan Details */}
                    <div className="mb-4">
                      <h6>Savings Plan Details:</h6>
                      <div className="alert alert-success">
                        <p><strong>Payment Schedule:</strong> Monthly payments over 4 months</p>
                        <p><strong>Amount per Payment:</strong> ${(calculateTotal() / 4).toFixed(2)}</p>
                        <p><strong>First Payment:</strong> Tomorrow</p>
                      </div>
                    </div>

                    <button 
                      onClick={handleCreateSavingsPlan} 
                      className="btn btn-success btn-lg w-100" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating Savings Plan...' : 'Create Savings Plan'}
                    </button>
                  </div>
                )}

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
