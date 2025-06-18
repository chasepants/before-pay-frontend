import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Navbar from '../components/Navbar';

const ViewSavings = () => {
  const { wishlistItemId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const { items: wishlist } = useSelector((state) => state.wishlist);
  const [wishlistItem, setWishlistItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const item = wishlist.find((item) => item._id === wishlistItemId);
    if (!item) {
      setError('Wishlist item not found');
      setIsLoading(false);
      return;
    }
    console.log('Found wishlist item:', item);
    setWishlistItem(item);

    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const txRes = await axios.get(
          `http://localhost:3001/api/bank/transaction-history/${wishlistItemId}`,
          { withCredentials: true }
        );
        console.log('Transaction history response:', txRes.data);
        setTransactions(txRes.data.transactions);
      } catch (err) {
        console.error('Fetch error:', err.response?.data || err.message);
        setError(
          err.response?.status === 404
            ? 'Transaction history not found'
            : err.response?.data?.error || 'Failed to load savings data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [wishlistItemId, wishlist, user, navigate]);

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
    <>
      <Navbar user={user} />
      <div className='container mt-3'>
        <div className='row'>
          <div className='col-sm-3 offset-sm-1'>
            <img src={wishlistItem.thumbnail || 'https://via.placeholder.com/200'} alt="Savings Item image" className="card-img-top" />
          </div>
          <div className='col-sm-7 mt-3'>
            <h1 className='mt-3'>{wishlistItem.title}</h1>
            <div className='d-flex justify-content-between'>
              <div className="progress w-75 pt-4" role="progressbar" aria-label="Savings Progress" aria-valuenow={progressPercentage} aria-valuemin="0" aria-valuemax="100">
                <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
              </div>
              <div>
                <h5 className="card-text">
                  <b>
                    <span style={{ color: "#d4d8de" }}>${wishlistItem.savings_progress}</span>/
                    <span style={{ color: "#7ed957" }}>${wishlistItem.savings_goal}</span> 
                  </b>
                </h5>
              </div>
            </div>
            <div className='d-flex justify-content-between'>
              <div className="card-text" style={{ color: "#d4d8de" }}>
                <b>
                  <div className="product-source"><img className="product-source-icon" src={wishlistItem.sourceIcon} /> {wishlistItem.source}</div>
                </b>
              </div>
              {wishlistItem.savings_progress > 0 && (
                <button
                  type='button'
                  className='btn btn-link'
                  onClick={handlePayout}
                  disabled={isLoading}
                >
                  TRANSFER BACK
                </button>
              )}
            </div>
            {wishlistItem.rating && (
              <p>
                {wishlistItem.rating} <i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-half"></i> ({wishlistItem.reviews} reviews)
              </p>
            )}
          </div>
        </div>
        <div className='row'>
          <div className='col-sm-10 offset-sm-1'>
            <h1>Your Savings Plan</h1>
            <h4 className='text-muted'>{wishlistItem.bankName} - {wishlistItem.bankAccountName} - ${wishlistItem.savingsAmount} every {wishlistItem.savingsFrequency} <i className="bi bi-pencil-square"></i></h4>
            {transactions.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Date</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Amount</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Status</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        {new Date(tx.date * 1000).toLocaleDateString()}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>${tx.amount}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{tx.status}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{tx.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No transactions found.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewSavings;