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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchSavingsGoal = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/savings-goal/${savingsGoalId}`, { withCredentials: true });
        setSavingsGoal(res.data);
      } catch (err) {
        setError('Savings goal not found');
      }
    };

    let goal = savingsGoals.find((goal) => goal._id === savingsGoalId);
    console.log(goal);

    if (!goal) {
      fetchSavingsGoal();
    } else {
      setSavingsGoal(goal);
    }
  }, [savingsGoalId, savingsGoals, user, navigate]);

  useEffect(() => {
    if (savingsGoal) {
      const fetchTransactions = async () => {
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

      fetchTransactions();
    }
  }, [savingsGoal, savingsGoalId]);

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
  const headerClasses = savingsGoal.product.thumbnail ? 'col-sm-7 mt-3' : 'col-sm-7 mt-3 offset-sm-1';

  return (
    <>
      <Navbar user={user} />
      <div className='container mt-3'>
        <div className='row'>
          {
            savingsGoal.product.thumbnail && (
              <div className='col-sm-3 offset-sm-1'>
                <img src={savingsGoal.product.thumbnail || 'https://via.placeholder.com/200'} alt="Savings Goal image" className="card-img-top" />
              </div>
            )
          }
          <div className={headerClasses}>
            <h1 className='mt-3'>{savingsGoal.goalName || savingsGoal.product.title}</h1>
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
                  <div className="product-source"><img className="product-source-icon" src={savingsGoal.product.sourceIcon} /> {savingsGoal.product.source}</div>
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
            {savingsGoal.product.rating && (
              <p>
                {savingsGoal.product.rating} <i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-half"></i> ({savingsGoal.product.reviews} reviews)
              </p>
            )}
          </div>
        </div>
        {
          savingsGoal.bank.bankName && (
            <div className='row'>
              <div className='col-sm-4 offset-sm-1'>
                  <h4 className='text-muted'>
                    {savingsGoal.bank.bankName} - ${savingsGoal.savingsAmount}
                    &nbsp;{savingsGoal.schedule.interval}&nbsp; 
                    <i onClick={() => navigate(`/setup-savings/${savingsGoalId}`)} className="bi bi-pencil-square"></i>
                  </h4>
              </div> 
            </div>
          )
        }
        {
          !savingsGoal.bank.bankName && (
            <div className='row my-3'>
              <div className='col-sm-4 offset-sm-1'>
                <button className='btn btn-primary' onClick={() => navigate(`/setup-savings/${savingsGoalId}`)}>
                  Setup Transfers
                </button>
              </div> 
            </div>
          )
        }
        <div className='row mt-3'>
          <div className='col-sm-10 offset-sm-1'>
            {/* <h1>Your Savings Plan</h1> */}
            <div className="card-header bg-dark text-white">
              <h4 className="mb-0 p-2">Transfers</h4>
            </div>
            {transactions.length > 0 ? (
              <table className='table table-stripped'>
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