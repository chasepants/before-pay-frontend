import api from '../api';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from '../components/Navbar';
import Placeholder from 'react-bootstrap/Placeholder';
import { setSavingsGoals } from '../store/savingsSlice';
import { Link } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const { goals: savingsGoals, savingsGoalsLoading } = useSelector((state) => state.savings);
  const [customerToken, setCustomerToken] = useState(null);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  // Add loading state for Unit components
  const [unitComponentsLoaded, setUnitComponentsLoaded] = useState(false);

  // Add a ref to track if Unit components have been rendered
  const unitComponentsRendered = useRef(false);

  // Single useEffect to handle Unit component loading
  useEffect(() => {
    if (user?.status === "approved" && customerToken && !unitComponentsRendered.current) {
      setUnitComponentsLoaded(true);
      unitComponentsRendered.current = true;
    }
  }, [user?.status, customerToken]);

  // Move fetchCustomerToken outside useEffect so it can be called from event listeners
  const fetchCustomerToken = async () => {
    try {
      const response = await api.get('/api/auth/customer-token');
      console.log('Customer token:', response.data.token);
      setCustomerToken(response.data.token);
    } catch (err) {
      console.error('Customer token fetch failed:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/');
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchCustomerToken();
    }
  }, [user]);

  // Remove the duplicate useEffect and fix event listeners
  useEffect(() => {
    if (!customerToken) return;
    
    // Only add event listeners once
    const accountElement = document.querySelector('unit-elements-account');
    const activityElement = document.querySelector('unit-elements-activity');
    
    const handleAccountLoad = (e) => {
      console.log('Account component loaded:', e.detail);
      if (e.detail.errors) {
        console.error('Account component error:', e.detail.errors);
        if (e.detail.errors[0]?.status === '401') {
          setError('Customer token expired, please re-authenticate');
          setCustomerToken(null);
        }
      }
    };
    
    const handleActivityLoad = (e) => {
      console.log('Activity component loaded:', e.detail);
      if (e.detail.errors) {
        console.error('Activity component error:', e.detail.errors);
      }
    };
    
    if (accountElement) {
      accountElement.addEventListener('unitOnLoad', handleAccountLoad);
    }
    
    if (activityElement) {
      activityElement.addEventListener('unitOnLoad', handleActivityLoad);
    }
    
    // Cleanup function to remove event listeners
    return () => {
      if (accountElement) {
        accountElement.removeEventListener('unitOnLoad', handleAccountLoad);
      }
      if (activityElement) {
        activityElement.removeEventListener('unitOnLoad', handleActivityLoad);
      }
    };
  }, [customerToken]); // Only depend on customerToken

  const handleCreateSavingsGoal = () => {
    if (user?.status !== 'approved') {
      alert('You must be approved to create savings goals.');
      return;
    }
    navigate('/create-savings-goal');
  };

  const handleViewSavings = (goalId) => {
    navigate(`/view-savings/${goalId}`);
  };

  const togglePause = async (goal) => {
    console.log(`Pausing ${goal}`)
    try {
      await api.patch(`/api/savings-goal/${goal._id}/pause`, { isPaused: !goal.isPaused });
      const refreshed = await api.get('/api/savings-goal');
      dispatch(setSavingsGoals(refreshed.data));
    } catch (e) {
      console.error('Toggle pause failed:', e);
    }
  };

  const getNextRunDate = (schedule) => {
    let today = new Date();
    const todaysDate = today.getDate();
    if ("Monthly" == schedule.interval && schedule.dayOfMonth >= todaysDate) {
      return today.toDateString();
    }

    if ("Monthly" == schedule.interval && schedule.dayOfMonth < todaysDate) {
      today.setMonth(today.getMonth() + 1);
      today.setDate(schedule.dayOfMonth);
      return today.toDateString();
    }

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todaysIndex = today.getDay();

    if ("Weekly" == schedule.interval && days.indexOf(schedule.dayOfWeek)  === todaysIndex) {
      return "Today";
    }

    return `On ${schedule.dayOfWeek}`;
  }

  // Add event listeners to Unit components to prevent re-rendering
  const handleUnitComponentLoad = useCallback((event) => {
    console.log(`${event.target.tagName} component loaded:`, event.detail);
  }, []);

  if (error) {
    return (
      <div className="container mt-3">
        <Navbar user={user} />
        <div className="row">
          <div className="col text-center">
            <p className="text-danger">{error}</p>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar user={user} />
      <div className="container mt-3">
        <div className="row mb-3">
          <div className="col-12">
            <div className="d-grid gap-2 d-md-flex justify-content-between">
              <h2 className="text-dark fw-bold mb-1">
                {user?.firstName ? `Welcome, ${user.firstName}!` : 'Welcome!'}
              </h2>
              <button 
                className="btn btn-primary" 
                onClick={handleCreateSavingsGoal}
              >
                <i className="bi bi-plus-circle me-1"></i>
                Add New Goal
              </button>
            </div>
          </div>
        </div>

        {/* Savings Goals Section */}
        {!savingsGoalsLoading ? (
          <div className="row mb-4">
            <div className="col-12">
              {/* Desktop Header and Table */}
              <div className="d-none d-md-block">
                <div className="border-0 shadow-sm">
                  <div className="card-header bg-dark text-white">
                    <h4 className="mb-0 p-2">Savings Goals</h4>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
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
                              <td className="align-middle">{goal.goalName || goal.product?.title}</td>
                              <td className="align-middle">${goal.currentAmount || 0}</td>
                              <td className="align-middle">${goal.targetAmount || 0}</td>
                              <td className="align-middle">
                                {goal.isPaused ? (
                                  <span className="text-muted fw-bold">PAUSED</span>
                                ) : (
                                  goal.schedule ? getNextRunDate(goal.schedule) : 'Not set'
                                )}
                              </td>
                              <td className="align-middle">
                                {goal.bank ? (
                                  `${goal.bank.bankName || 'Unit'} (****${goal.bank.bankLastFour})`
                                ) : (
                                  <span className="text-muted">Not set</span>
                                )}
                              </td>
                              <td className="align-middle">
                                <div className="btn-group" role="group">
                                  <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => handleViewSavings(goal._id)}
                                  >
                                    View
                                  </button>
                                  <button
                                    className={`btn btn-sm ${goal.isPaused ? 'btn-success' : 'btn-warning'}`}
                                    onClick={() => togglePause(goal)}
                                    title={goal.isPaused ? 'Resume goal' : 'Pause goal'}
                                  >
                                    {goal.isPaused ? (
                                      <i className="bi bi-play-circle-fill"></i>
                                    ) : (
                                      <i className="bi bi-pause-circle-fill"></i>
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Cards Only */}
              <div className="d-md-none">
                {savingsGoals.length > 0 ? (
                  savingsGoals.map((goal, index) => (
                    <div key={goal._id} className="border rounded p-3 mb-3 bg-white">
                      {/* Goal Header */}
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0 fw-bold text-truncate" style={{ maxWidth: '60%' }}>
                          {goal.goalName || goal.product?.title}
                        </h6>
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleViewSavings(goal._id)}
                          >
                            View
                          </button>
                          <button
                            className={`btn btn-sm ${goal.isPaused ? 'btn-success' : 'btn-warning'}`}
                            onClick={() => togglePause(goal)}
                            title={goal.isPaused ? 'Resume goal' : 'Pause goal'}
                          >
                            {goal.isPaused ? (
                              <i className="bi bi-play-circle-fill"></i>
                            ) : (
                              <i className="bi bi-pause-circle-fill"></i>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className="text-muted">Progress</small>
                          <small className="text-muted">
                            ${goal.currentAmount || 0} / ${goal.targetAmount || 0}
                          </small>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div 
                            className="progress-bar" 
                            style={{ 
                              width: `${Math.min((goal.currentAmount || 0) / (goal.targetAmount || 1) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Goal Details */}
                      <div className="row text-center">
                        <div className="col-4">
                          <small className="text-muted d-block">Saved</small>
                          <strong className="text-success">${goal.currentAmount || 0}</strong>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block">Goal</small>
                          <strong>${goal.targetAmount || 0}</strong>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block">Next Run</small>
                          <strong className={goal.isPaused ? 'text-muted' : 'text-primary'}>
                            {goal.isPaused ? (
                              <span className="fw-bold">PAUSED</span>
                            ) : (
                              goal.schedule ? getNextRunDate(goal.schedule) : 'Not set'
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <i className="bi bi-piggy-bank text-muted" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <p className="text-muted mb-3">No savings goals yet. Start saving today!</p>
                    <button className="btn btn-primary btn-lg" onClick={handleCreateSavingsGoal}>
                      <i className="bi bi-plus-circle me-2"></i>
                      Create Your First Goal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Placeholder animation="glow">
              <Placeholder xs={12} style={{ height: '200px' }} />
            </Placeholder>
          </div>
        )}

        {/* Unit Elements - Responsive Grid */}
        <div className="row mb-4">
        <div className="col-12 col-md-6 col-lg-4 mb-3">
            {user?.status === "approved" && customerToken ? (
              <div>
                <h6 className="bg-primary text-white p-2 rounded mb-2">Account Details</h6>
                {unitComponentsLoaded && (
                  <div key="account-wrapper">
                    <unit-elements-account
                      customer-token={customerToken}
                      theme=""
                      hide-actions-menu-button="false"
                      hide-selection-menu-button="false"
                      menu-items="details,statements,bankVerification"
                      hide-account-cta-banner="true"
                    ></unit-elements-account>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Placeholder animation="glow">
                  <Placeholder xs={12} style={{ height: '200px' }} />
                </Placeholder>
              </div>
            )}
          </div>
          <div className="col-12 col-md-6 col-lg-4 mb-3">
            {user?.status === "approved" && customerToken ? (
              <div>
                <h6 className="bg-info text-white p-2 rounded mb-2">Account Activity</h6>
                {unitComponentsLoaded && (
                  <div key="activity-wrapper">
                    <unit-elements-activity
                      customer-token={customerToken}
                      account-id={user?.unitAccountId}
                      theme=""
                      hide-actions-menu-button="false"
                      hide-selection-menu-button="false"
                      hide-title="true"
                      hide-filter-button="true"
                      transactions-per-page="5"
                      pagination-type="pagination"
                      menu-items="details,statements,bankVerification"
                      hide-account-cta-banner="true"
                    ></unit-elements-activity>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Placeholder animation="glow">
                  <Placeholder xs={12} style={{ height: '200px' }} />
                </Placeholder>
              </div>
            )}
          </div>
          
          <div className="col-12 col-md-6 col-lg-4 mb-3">
            {user?.status === "approved" && customerToken ? (
              <div>
                <h6 className="bg-secondary text-white p-2 rounded mb-2">Transfer Back</h6>
                <div className="text-center py-4">
                  <p className="text-muted mb-3">Need to withdraw funds from your savings?</p>
                  <Link to="/transfer-back" className="btn btn-outline-primary">
                    <i className="bi bi-arrow-left-circle me-2"></i>
                    Transfer Back
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Placeholder animation="glow">
                  <Placeholder xs={12} style={{ height: '200px' }} />
                </Placeholder>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;