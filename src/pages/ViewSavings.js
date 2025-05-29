import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ViewSavings = () => {
  const { wishlistItemId } = useParams();
  const navigate = useNavigate();
  const [wishlistItem, setWishlistItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch wishlist item details
      console.log('Fetching wishlist item:', wishlistItemId);
      var itemRes = await axios.get(`http://localhost:3001/api/wishlist/${wishlistItemId}`, { withCredentials: true });
      console.log('Wishlist item response:', itemRes.data);
      setWishlistItem(itemRes.data);
    } catch (err) {
      console.error('Fetch error:', err.response?.data || err.message);
      setError(err.response?.status === 404 ? 'Wishlist item not found' : err.response?.data?.error || 'Failed to load savings data');
    }
  
    try {
      // Fetch transaction history
      if (itemRes.data.subscriptionId) {
        console.log('Fetching transaction history for subscription:', itemRes.data.subscriptionId);
        const txRes = await axios.get(`http://localhost:3001/api/bank/subscription-history/${itemRes.data.subscriptionId}`, { withCredentials: true });
        console.log('Transaction history response:', txRes.data);
        setTransactions(txRes.data.transactions);
      }
    } catch (err) {
      console.error('Fetch error:', err.response?.data || err.message);
      setError(err.response?.status === 404 ? 'Subscription not found' : err.response?.data?.error || 'Failed to load savings data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [wishlistItemId]);

const handlePayout = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log('Initiating payout for wishlist item:', wishlistItemId);
      const res = await axios.post(
        'http://localhost:3001/api/bank/payout',
        { wishlistItemId },
        { withCredentials: true }
      );
      console.log('Payout response:', res.data);
      alert('Savings transferred successfully!');
      // Refresh wishlist item
      const refreshed = await axios.get(`http://localhost:3001/api/wishlist/${wishlistItemId}`, { withCredentials: true });
      setWishlistItem(refreshed.data);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to transfer savings';
      setError(errorMsg);
      console.error('Payout error:', err);
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

  if (isLoading || !wishlistItem) {
    return <div style={{ padding: '16px' }}><p>Loading savings details...</p></div>;
  }

  const progressPercentage = Math.min((wishlistItem.savings_progress / wishlistItem.savings_goal) * 100, 100);

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>{wishlistItem.title}</h1>
      <p style={{ marginBottom: '16px' }}>
        Savings Progress: ${wishlistItem.savings_progress} / ${wishlistItem.savings_goal}
      </p>
      <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '4px', marginBottom: '16px' }}>
        <div
          style={{
            width: `${Math.min(progressPercentage, 100)}%`,
            backgroundColor: '#34a853',
            height: '20px',
            borderRadius: '4px'
          }}
        />
      </div>
      {wishlistItem.savings_progress >= wishlistItem.savings_goal && wishlistItem.payoutBankAccountId ? (
        <button
          onClick={handlePayout}
          disabled={isLoading}
          style={{
            backgroundColor: '#34a853',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isLoading ? 'Processing...' : 'Transfer Savings'}
        </button>
      ) : (
        <p style={{ color: 'red', marginBottom: '16px' }}>
          {wishlistItem.savings_progress < wishlistItem.savings_goal
            ? 'Savings goal not yet reached.'
            : 'Please set up your payout account to enable transfers.'}
        </p>
      )}
      {!wishlistItem.payoutBankAccountId && (
        <p style={{ marginBottom: '16px' }}>
          <a
            href={`/setup-payout/${wishlistItemId}`}
            style={{ color: '#4285f4', textDecoration: 'underline' }}
          >
            Set up your payout account
          </a>
          to receive funds.
        </p>
      )}
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Transaction History</h2>
      {transactions.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Date</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Amount</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {new Date(tx.date * 1000).toLocaleDateString()}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>${tx.amount / 100}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{tx.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No transactions found.</p>
      )}
    </div>
  );

};

export default ViewSavings;