import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const SetupPayout = () => {
  const { wishlistItemId } = useParams();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!wishlistItemId) {
      setError('Invalid wishlist item ID');
      return;
    }
    const fetchClientSecret = async () => {
      try {
        console.log('Fetching Financial Connections session for wishlistItemId:', wishlistItemId);
        const res = await axios.post(
          'https://before-pay-backend.vercel.app/api/bank/setup-payout',
          { wishlistItemId },
          { withCredentials: true }
        );
        console.log('Financial Connections response:', res.data);
        if (res.data.client_secret) {
          setClientSecret(res.data.client_secret);
        } else {
          setError('Failed to retrieve payout setup session');
        }
      } catch (err) {
        console.error('Setup payout failed:', err.response?.data || err.message);
        setError(err.response?.data?.error || 'Failed to initialize payout setup. Please ensure you are logged in.');
      }
    };
    fetchClientSecret();
  }, [wishlistItemId]);

  const handleSetupPayout = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log('Initiating Financial Connections session with client_secret:', clientSecret);
      const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
      const { error } = await stripe.collectFinancialConnectionsAccounts({ clientSecret });
      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }
      console.log('Financial Connections session completed for wishlistItemId:', wishlistItemId);
      alert('Payout account setup successfully!');
      navigate('/home');
    } catch (err) {
      const errorMsg = err.message || 'Failed to complete payout setup';
      setError(errorMsg);
      console.error('Payout setup error:', err);
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

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Setup Payout Account</h1>
      <p style={{ marginBottom: '16px' }}>
        Link your bank account to receive your savings payouts. This will securely connect your account for transfers.
      </p>
      <button
        onClick={handleSetupPayout}
        disabled={isLoading || !clientSecret}
        style={{
          backgroundColor: '#4285f4',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          border: 'none',
          cursor: isLoading || !clientSecret ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? 'Processing...' : 'Link Payout Account'}
      </button>
    </div>
  );
};

export default SetupPayout;