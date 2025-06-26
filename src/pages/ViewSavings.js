// frontend/src/pages/ViewSavings.js
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Navbar from '../components/Navbar';
import LoadingAnimation from '../components/LoadingAnimation';

const ViewSavings = () => {
  const { savingsGoalId } = useParams(); // Renamed from wishlistItemId
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const { goals: savingsGoals } = useSelector((state) => state.savings); // Renamed from wishlist
  const [savingsGoal, setSavingsGoal] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    const goal = savingsGoals.find((goal) => goal._id === savingsGoalId);

    if (!goal) {
      setError('Savings goal not found');
      setIsLoading(false);
      return;
    }

    setSavingsGoal(goal);

    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const txRes = await axios.get(
          `http://localhost:3001/api/bank/transaction-history/${savingsGoalId}`,
          { withCredentials: true }
        );
        setTransactions(txRes.data.transactions);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? 'Transaction history not found'
            : err.response?.data?.error || 'Failed to load savings data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    // fetchTransactions();
  }, [savingsGoalId, savingsGoals, user, navigate]);

  const handlePayout = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.post(
        'http://localhost:3001/api/bank/payout',
        { savingsGoalId }, // Renamed from wishlistItemId
        { withCredentials: true }
      );
      alert('Savings transferred successfully!');

      const refreshed = await axios.get(`http://localhost:3001/api/savings-goal/${savingsGoalId}`, { withCredentials: true });
      setSavingsGoal(refreshed.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to transfer savings');
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

  if (isLoading || !savingsGoal) {
    return <LoadingAnimation />;
  }

  const progressPercentage = Math.min((savingsGoal.currentAmount / savingsGoal.targetAmount) * 100, 100);

  return (
    <>
      <Navbar user={user} />
      <div className='container mt-3'>
        <div className='row'>
          <div className='col-sm-3 offset-sm-1'>
            <img src={savingsGoal.thumbnail || 'https://via.placeholder.com/200'} alt="Savings Goal image" className="card-img-top" />
          </div>
          <div className='col-sm-7 mt-3'>
            <h1 className='mt-3'>{savingsGoal.goalName || savingsGoal.title}</h1>
            <div className='d-flex justify-content-between'>
              <div className="progress w-75 pt-4" role="progressbar" aria-label="Savings Progress" aria-valuenow={progressPercentage} aria-valuemin="0" aria-valuemax="100">
                <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
              </div>
              <div>
                <h5 className="card-text">
                  <b>
                    <span style={{ color: "#d4d8de" }}>${savingsGoal.currentAmount}</span>/
                    <span style={{ color: "#7ed957" }}>${savingsGoal.targetAmount}</span> 
                  </b>
                </h5>
              </div>
            </div>
            <div className='d-flex justify-content-between'>
              <div className="card-text" style={{ color: "#d4d8de" }}>
                <b>
                  <div className="product-source"><img className="product-source-icon" src={savingsGoal.sourceIcon} /> {savingsGoal.source}</div>
                </b>
              </div>
              {user.status === 'approved' && savingsGoal.currentAmount > 0 && (
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
            {savingsGoal.rating && (
              <p>
                {savingsGoal.rating} <i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-half"></i> ({savingsGoal.reviews} reviews)
              </p>
            )}
          </div>
        </div>
        <div className='row'>
          <div className='col-sm-10 offset-sm-1'>
            <h1>Your Savings Plan</h1>
            <h4 className='text-muted'>
              {savingsGoal.bankName} - {savingsGoal.bankAccountName} - ${savingsGoal.savingsAmount}
              every {savingsGoal.savingsFrequency} 
              <i onClick={() => navigate(`/setup-savings/${savingsGoalId}`)} className="bi bi-pencil-square"></i>
            </h4>
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
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>${tx.amount < 0 ? tx.amount * -1 : tx.amount}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{tx.status}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{tx.amount < 0 ? "credit" : tx.type}</td>
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