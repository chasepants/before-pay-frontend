import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key');

const SetupSavings = () => {
  const navigate = useNavigate();

  const { wishlistItemId } = useParams();
  const { user } = useSelector((state) => state.user);

  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

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
  }, [wishlistItemId, user]);

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
      <Navbar user={user} />
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
    <>
      <div className="container mt-5">
        <div className='row'>
          
        </div>
        <div className="row">
            <div className="col-sm-6 mt-5 p-5">
              <h5>Create A Savings Plan</h5>
              
              <label for="schedule" className="form-label mt-3">How often do you want to save?</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)} class="form-select" aria-label="schedule">
                <option selected>---</option>
                <option value="week">Every week</option>
                <option value="biweek">Every 2 weeks</option>
                <option value="month">Every month</option>
              </select>

              <label for="amount" className="form-label mt-3">How much do you want to save?</label>
              <input value={amount} onChange={e => setAmount(e.target.value)} className="form-control form-control-lg" type="text" placeholder="$50" aria-label="savings Amount"/>
              
              <label for="date" className="form-label mt-3">When do you want to start?</label>
              <input value={startDate} onChange={e => setStartDate(e.target.value)} className="form-control form-control-lg" type="text" placeholder="mm/dd/yyy" aria-label="Start Date"/>
              
              <label for="account" className="form-label mt-4">Securely link a bank account</label>
              <PaymentElement />

              <button onClick={handleSubmit} className="btn btn-primary w-50 mt-5">Create</button>
          </div>
          
        </div>
      </div>
    </>
  );
};

export default SetupSavings;
