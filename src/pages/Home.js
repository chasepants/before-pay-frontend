import api from '../api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from '../components/Navbar';
import Placeholder from 'react-bootstrap/Placeholder';
import { setSavingsGoals } from '../store/savingsSlice';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const { goals: savingsGoals } = useSelector((state) => state.savings);
  const [customerToken, setCustomerToken] = useState(null);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

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

  useEffect(() => {
    if (customerToken) {
      const accountElement = document.querySelector('unit-elements-account');
      const activityElement = document.querySelector('unit-elements-activity');
      
      if (accountElement) {
        accountElement.addEventListener('unitOnLoad', (e) => {
          console.log('Account component loaded:', e.detail);
          if (e.detail.errors) {
            console.error('Account component error:', e.detail.errors);
            if (e.detail.errors[0]?.status === '401') {
              setError('Customer token expired, please re-authenticate');
              setCustomerToken(null);
            }
          }
        });
      }
      
      if (activityElement) {
        activityElement.addEventListener('unitOnLoad', (e) => {
          console.log('Activity component loaded:', e.detail);
          if (e.detail.errors) {
            console.error('Activity component error:', e.detail.errors);
          }
        });
      }
    }
  }, [customerToken]);

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

  if (error) {
    return (
      <div className="container mt-5">
        <Navbar user={user} />
        <div className="row">
          <div className="col text-center">
            <p style={{ color: 'red' }}>{error}</p>
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
      <div className="container mt-4">
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="text-dark fw-bold">{user.firstName ? `Welcome, ${user.firstName}` : ''}</h2>
            {savingsGoals.length === 0 && <p className="text-muted">Manage your savings with Stashpay.</p>}
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-12">
            <div className="border-0 shadow-sm">
              <div className="bg-dark text-white">
                <h4 className="mb-0 p-2">Savings Goals</h4>
              </div>
              <div className="p-0">
                {savingsGoals.length > 0 ? (
                  <table className="table table-striped">
                    <thead className="bg-light">
                      <tr>
                        <th>Goal Name</th>
                        <th>Saved</th>
                        <th>Goal</th>
                        <th>Next Run</th>
                        <th>Transfer From</th>
                        <th>Actions</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {savingsGoals.map((goal) => (
                        <tr key={goal._id}>
                          <td className="align-middle">{goal.goalName || goal.product.title}</td>
                          <td className="align-middle">${goal.currentAmount || 0}</td>
                          <td className="align-middle">${goal.targetAmount || 0}</td>
                          <td className="align-middle">
                            {
                              goal.schedule ? getNextRunDate(goal.schedule) : ``
                            }
                          </td>
                          {
                            goal.bank ? (
                              <td className="align-middle">
                                {goal.bank.bankName || 'Unit'} (****{goal.bank.bankLastFour})
                              </td>
                            ) : (
                              <td className="align-middle">
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
                          <td className="align-middle">
                            <button
                              className={`btn btn-sm ${goal.isPaused ? 'btn-success' : 'btn-danger'}`}
                              onClick={(e) => { e.preventDefault(); togglePause(goal); }}
                              title={goal.isPaused ? 'Resume goal' : 'Pause goal'}
                            >
                              {goal.isPaused ? 'Resume' : 'Pause'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-0">
                        <td colSpan="6" className="border-0"></td>
                        <td className="text-center border-0">
                          <div className="d-grid gap-2 d-sm-flex justify-content-sm-end">
                            <button className="btn btn-secondary" onClick={() => navigate('/transfer-back')}>
                              Transfer Back
                            </button>
                            <button className="btn btn-primary" onClick={handleCreateSavingsGoal}>
                              <i className="bi bi-plus-circle me-1"></i>
                              Add New Goal
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted">No savings goals yet. Start saving today!</p>
                    <button className="btn btn-primary" onClick={handleCreateSavingsGoal}>
                      Create Your First Goal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4 mt-4">
          <div className="col-md-4">
            {
              "approved" === user.status && customerToken ? (
                <div className="card border-0 shadow-sm">
                  <div className="card-body p-0">
                    <unit-elements-account
                      customer-token={customerToken}
                      theme=""
                      hide-actions-menu-button="false"
                      hide-selection-menu-button="false"
                      menu-items="details,statements,bankVerification"
                      hide-account-cta-banner="true"
                    ></unit-elements-account>
                  </div>
                </div>
              ) : <Placeholder  />
            }
          </div>
          <div className="col-md-4">
            {
              "approved" === user.status && customerToken ? <unit-elements-activity
                customer-token={customerToken}
                account-id={user.unitAccountId}
                theme=""
                hide-actions-menu-button="false"
                hide-selection-menu-button="false"
                menu-items="details,statements,bankVerification"
                hide-account-cta-banner="true"
              ></unit-elements-activity> : <Placeholder  />
            }
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;