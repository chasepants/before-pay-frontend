import React, { useState, useEffect } from 'react';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key');

const SetupSavings = () => {
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
        console.log('Fetching client secret for wishlistItemId:', wishlistItemId);
        const res = await axios.post(
          'http://localhost:3001/api/bank/setup-intent',
          { wishlistItemId },
          { withCredentials: true }
        );
        console.log('Setup intent response:', res.data);
        if (res.data.client_secret) {
          setClientSecret(res.data.client_secret);
        } else {
          setError('Failed to retrieve client secret');
        }
      } catch (err) {
        console.error('Setup intent failed:', err.response?.data || err.message);
        setError(err.response?.data?.error || 'Failed to initialize setup');
      }
    };
    fetchClientSecret();
  }, [wishlistItemId]);

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

  if (!clientSecret) {
    return <div style={{ padding: '16px' }}><p>Loading savings setup...</p></div>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <SetupSavingsInner
        wishlistItemId={wishlistItemId}
        setError={setError}
        setIsLoading={setIsLoading}
        isLoading={isLoading}
        navigate={navigate}
      />
    </Elements>
  );
};

const SetupSavingsInner = ({ wishlistItemId, setError, setIsLoading, isLoading, navigate }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('week');
  const [startDate, setStartDate] = useState('');

  console.log('SetupSavingsInner rendered with stripe:', !!stripe, 'elements:', !!elements);

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('handleSubmit called with start_date:', startDate);
    if (!stripe || !elements) {
      setError('Stripe not initialized');
      return;
    }
    if (!amount || !frequency || !startDate) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Calling stripe.confirmSetup');
      const result = await stripe.confirmSetup({
        elements,
        redirect: 'if_required'
      });

      console.log('stripe.confirmSetup result:', result);
      if (result.error) {
        setError(result.error.message);
      } else {
        console.log('Sending payment_method_id to /api/bank/transfer:', result.setupIntent.payment_method);
        await axios.post(
          'http://localhost:3001/api/bank/transfer',
          {
            wishlistItemId,
            payment_method_id: result.setupIntent.payment_method,
            amount: parseFloat(amount),
            frequency,
            start_date: startDate
          },
          { withCredentials: true }
        );
        alert('Savings setup successfully!');
        navigate('/home');
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to setup savings';
      setError(errorMsg);
      console.error('Setup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Setup Savings</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Amount to Save ($)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            style={{ border: '1px solid #ccc', padding: '8px', width: '100%', borderRadius: '4px' }}
            required
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            style={{ border: '1px solid #ccc', padding: '8px', width: '100%', borderRadius: '4px' }}
            required
          >
            <option value="week">1 Week</option>
            <option value="biweek">2 Weeks</option>
            <option value="month">1 Month</option>
          </select>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={today} // Prevent past dates
            style={{ border: '1px solid #ccc', padding: '8px', width: '100%', borderRadius: '4px' }}
            required
          />
        </div>
        <PaymentElement />
        <button
          type="submit"
          disabled={!stripe || !elements || isLoading}
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
          {isLoading ? 'Processing...' : 'Setup Savings'}
        </button>
      </form>
    </div>
  );
};

export default SetupSavings;