// frontend/src/pages/Home.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../components/Navbar';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const { goals: savingsGoals } = useSelector((state) => state.savings);

  useEffect(() => {
    if (!user) navigate('/');
  }, [navigate, user]);

  const handleCreateSavingsGoal = () => {
    if (user.status !== 'approved') {
      alert('You must be approved to create savings goals.');
      return;
    }
    navigate('/create-savings-goal');
  };

  const handleViewSavings = (goalId) => {
    navigate(`/view-savings/${goalId}`);
  };

  // Calculate next transfer date (simplified)
  const getNextTransfer = (goal) => {
    if (!goal.savingsStartDate || !goal.savingsFrequency) return 'Not scheduled';
    const start = new Date(goal.savingsStartDate);
    const now = new Date();
    let intervalMs = 0;
    switch (goal.savingsFrequency) {
      case 'week': intervalMs = 7 * 24 * 60 * 60 * 1000; break;
      case 'biweek': intervalMs = 14 * 24 * 60 * 60 * 1000; break;
      case 'month': intervalMs = 30 * 24 * 60 * 60 * 1000; break;
      default: return 'Not scheduled';
    }
    let next = new Date(start);
    while (next <= now) {
      next = new Date(next.getTime() + intervalMs);
    }
    return next.toLocaleDateString();
  };

  // Simulate current balance (to be replaced with real data later)
  const getCurrentBalance = () => {
    return (user?.status === 'approved' ? 1500.75 : 0).toFixed(2); // Example balance
  };

  return (
    <>
      <Navbar user={user} />
      <div className="container mt-4">
        {/* Subdued Header */}
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="text-dark fw-bold">Welcome, {user?.firstName || 'User'}</h2>
            {savingsGoals.length === 0 && <p className="text-muted">Manage your savings with Beforepay.</p>}
          </div>
        </div>

        {/* Savings Goals Table */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-dark text-white">
                <h4 className="mb-0">Savings Goals</h4>
              </div>
              <div className="card-body p-0">
                {savingsGoals.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted">No savings goals yet. Start saving today!</p>
                    <button className="btn btn-primary" onClick={handleCreateSavingsGoal}>
                      Create Your First Goal
                    </button>
                  </div>
                ) : (
                  <table className="table table-striped">
                    <thead className="bg-light">
                      <tr>
                        <th>Goal Name</th>
                        <th>Saved</th>
                        <th>Goal</th>
                        <th>Next Run</th>
                        <th>Transfer From</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savingsGoals.map((goal) => (
                        <tr key={goal._id}>
                          <td className="align-middle">{goal.goalName || goal.product.title}</td>
                          <td className="align-middle">${goal.currentAmount || 0}</td>
                          <td className="align-middle">${goal.targetAmount || 0}</td>
                          <td className="align-middle">{getNextTransfer(goal)}</td>
                          {
                            goal.bank && (
                              <td className="align-middle">
                                {goal.bank.bankName || 'Unit'} (****{goal.bank.bankLastFour})
                              </td>
                            )
                          }
                          <td className="align-middle">
                            <button
                              className="btn btn-secondary btn-sm me-2"
                              onClick={(e) => {
                                e.preventDefault();
                                handleViewSavings(goal._id);
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {savingsGoals.length > 0 && (
          <div className="row mb-5">
            <div className="col-2 offset-sm-10 flex-end">
              <button className="btn btn-primary" onClick={handleCreateSavingsGoal}>
                Add New Goal
              </button>
            </div>
          </div>
        )}

        <div className="row mb-4 mt-4">
          <div className="col-md-4">
            <div className={`card border-0 shadow-sm ${user && user.status === 'pending' ? 'bg-secondary bg-opacity-10' : 'bg-light'}`}>
              <div className={`card-header ${user && user.status === 'pending' ? 'bg-secondary' : 'bg-dark'} text-white`}>
                Savings Account
              </div>
              <div className="card-body">
                <p className="card-text">
                  {user && user.status === 'pending'
                    ? 'Pending Approval'
                    : `Account: ${user.firstName}'s Savings (****${user.unitAccountId?.slice(-4) || '0000'})`}
                </p>
                <p className="card-text">
                  Balance: <strong>${getCurrentBalance()}</strong>
                </p>
                {user && user.status === 'approved' && (
                  <button className="btn btn-primary" onClick={() => navigate('/accounts')}>
                    View More
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm bg-light">
              <div className="card-header bg-dark text-white">Application Status</div>
              <div className="card-body">
                <p className="card-text">
                  <strong>Status:</strong>{' '}
                  {user?.status === 'awaitingDocuments' ? 'Awaiting Documents' : user?.status}
                  {user?.status === 'awaitingDocuments' && (
                    <span
                      className="ms-2 tooltip-container"
                      onMouseEnter={(e) => (e.currentTarget.querySelector('.tooltip-text').style.display = 'block')}
                      onMouseLeave={(e) => (e.currentTarget.querySelector('.tooltip-text').style.display = 'none')}
                    >
                      <i className="bi bi-info-circle text-muted"></i>
                      <span className="tooltip-text">
                        We need a few documents before we can approve your application. Please navigate to the Profile page by clicking the Profile button in the top right of your screen.
                      </span>
                    </span>
                  )}
                </p>
                <p className="card-text"><strong>Name:</strong> {`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}</p>
                <p className="card-text"><strong>Occupation:</strong> {user?.occupation || 'Not specified'}</p>
                <p className="card-text"><strong>Birthdate:</strong> {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;