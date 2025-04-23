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
      const itemRes = await axios.get(`http://localhost:3001/api/wishlist/${wishlistItemId}`, { withCredentials: true });
      console.log('Wishlist item response:', itemRes.data);
      setWishlistItem(itemRes.data);

      // Fetch transaction history
      if (itemRes.data.subscriptionId) {
        console.log('Fetching transaction history for subscription:', itemRes.data.subscriptionId);
        const txRes = await axios.get(`http://localhost:3001/api/bank/subscription-history/${itemRes.data.subscriptionId}`, { withCredentials: true });
        console.log('Transaction history response:', txRes.data);
        setTransactions(txRes.data.transactions);
      }
    } catch (err) {
      console.error('Fetch error:', err.response?.data || err.message);
      setError(err.response?.status === 404 ? 'Wishlist item not found' : err.response?.data?.error || 'Failed to load savings data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  if (isLoading || !wishlistItem) {
    return <div style={{ padding: '16px' }}><p>Loading savings details...</p></div>;
  }

  const progressPercentage = Math.min((wishlistItem.savings_progress / wishlistItem.savings_goal) * 100, 100);

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Savings Details</h1>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <img
          src={wishlistItem.thumbnail}
          alt={wishlistItem.title}
          style={{ width: '100px', height: '100px', objectFit: 'cover', marginRight: '16px' }}
        />
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>{wishlistItem.title}</h2>
          <div style={{ marginTop: '8px' }}>
            <p style={{ marginBottom: '4px' }}>Savings Progress: ${wishlistItem.savings_progress} / ${wishlistItem.savings_goal}</p>
            <div style={{ width: '300px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor: '#34a853',
                  height: '20px',
                  transition: 'width 0.3s'
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => alert('Cancel Savings not implemented yet')}
          style={{
            backgroundColor: '#db4437',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            marginRight: '8px'
          }}
        >
          Cancel Savings
        </button>
        <button
          onClick={() => alert('Pause Savings not implemented yet')}
          style={{
            backgroundColor: '#4285f4',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            marginRight: '8px'
          }}
        >
          Pause Savings
        </button>
        <button
          onClick={fetchData}
          style={{
            backgroundColor: '#4285f4',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Refresh Data
        </button>
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Transaction History</h2>
      {transactions.length === 0 ? (
        <p>No transactions yet. Payments will start on the subscription start date.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Date</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Amount</th>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => (
              <tr key={index}>
                <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
                  {new Date(tx.date * 1000).toLocaleDateString()}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>${(tx.amount / 100).toFixed(2)}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>{tx.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewSavings;