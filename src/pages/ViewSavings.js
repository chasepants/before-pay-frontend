import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ProgressBar } from 'react-bootstrap'; // Add this import
import api from '../api';
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
        const res = await api.get(`/api/savings-goal/${savingsGoalId}`);
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
          const txRes = await api.get(`/api/bank/transaction-history/${savingsGoalId}`);
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
      const res = await api.post(
        `/api/bank/payout`,
        { savingsGoalId }
      );
      alert('Savings transferred successfully!');

      const refreshed = await api.get(`/api/savings-goal/${savingsGoalId}`);
      setSavingsGoal(refreshed.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to transfer savings');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate progress with different states
  const calculateProgress = () => {
    // Add safety check for null savingsGoal
    if (!savingsGoal || !savingsGoal.transfers) {
      return {
        completedAmount: 0,
        pendingAmount: 0,
        totalAmount: savingsGoal?.targetAmount || 0,
        completedPercentage: 0,
        pendingPercentage: 0
      };
    }

    const completedTransfers = savingsGoal.transfers.filter(t => t.status === 'completed');
    const pendingTransfers = savingsGoal.transfers.filter(t => t.status === 'pending');
    
    const completedAmount = completedTransfers.reduce((sum, t) => sum + t.amount, 0);
    const pendingAmount = pendingTransfers.reduce((sum, t) => sum + t.amount, 0);
    
    const completedPercentage = (completedAmount / savingsGoal.targetAmount) * 100;
    const pendingPercentage = (pendingAmount / savingsGoal.targetAmount) * 100;
    
    return {
      completedAmount,
      pendingAmount,
      totalAmount: savingsGoal.targetAmount,
      completedPercentage: Math.min(completedPercentage, 100),
      pendingPercentage: Math.min(pendingPercentage, 100 - completedPercentage)
    };
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

  // Only calculate progress after we know savingsGoal exists
  const progress = calculateProgress();

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
              <div className="w-75 pt-4">
                <ProgressBar>
                  {/* Completed payments in green */}
                  {progress.completedPercentage > 0 && (
                    <ProgressBar 
                      striped 
                      variant="success" 
                      now={progress.completedPercentage} 
                      key={1}
                      title={`$${progress.completedAmount} completed`}
                    />
                  )}
                  {/* Pending payments in yellow */}
                  {progress.pendingPercentage > 0 && (
                    <ProgressBar 
                      variant="warning" 
                      now={progress.pendingPercentage} 
                      key={2}
                      title={`$${progress.pendingAmount} pending`}
                    />
                  )}
                </ProgressBar>
              </div>
            </div>
            
            {/* Progress breakdown */}
            <div className="mt-2">
              <small className="text-muted">
                <span className="text-success">●</span> ${progress.completedAmount} completed
                {progress.pendingAmount > 0 && (
                  <>
                    <span className="text-warning ms-3">●</span> ${progress.pendingAmount} pending
                  </>
                )}
              </small>
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
          savingsGoal.bank && (
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
          !savingsGoal.bank && (
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
            {savingsGoal.transfers && savingsGoal.transfers.length > 0 ? (
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
                  {savingsGoal.transfers.map((transfer, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        {new Date(transfer.date).toLocaleDateString()}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>${transfer.amount}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        <span className={`badge ${
                          transfer.status === 'completed' ? 'bg-success' : 
                          transfer.status === 'pending' ? 'bg-warning' : 
                          'bg-danger'
                        }`}>
                          {transfer.status}
                        </span>
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{transfer.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No transfers found.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewSavings;