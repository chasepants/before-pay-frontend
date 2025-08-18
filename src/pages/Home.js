import api from '../api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import Placeholder from 'react-bootstrap/Placeholder';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const { goals: savingsGoals } = useSelector((state) => state.savings);
  const [customerToken, setCustomerToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) navigate('/');

    const fetchCustomerToken = async () => {
      try {
        const response = await api.get('/api/auth/customer-token');
        console.log('Customer token:', response.data.token);
        setCustomerToken(response.data.token);
      } catch (err) {
        console.error('Customer token fetch failed:', err.response?.data || err.message);
        setError('Failed to load account information: ' + (err.response?.data?.error || err.message));
      }
    };

    fetchCustomerToken();
  }, [navigate, user]);

  useEffect(() => {
    if (customerToken) {
      const accountElement = document.querySelector('unit-elements-account');
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
        accountElement.addEventListener('unitAccountChanged', async (e) => {
          const eventData = await e.detail;
          console.log('Account changed:', eventData.data.id);
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
            <h2 className="text-dark fw-bold">Welcome, {user?.firstName || 'User'}</h2>
            {savingsGoals.length === 0 && <p className="text-muted">Manage your savings with Beforepay.</p>}
          </div>
        </div>

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
            {
              customerToken ? <unit-elements-account
                customer-token={customerToken}
                theme=""
                hide-actions-menu-button="false"
                hide-selection-menu-button="false"
                menu-items="details,statements,bankVerification"
                hide-account-cta-banner="true"
              ></unit-elements-account> : <Placeholder  />
            }
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
          <div className="col-md-4">
            {
              customerToken ? <unit-elements-activity
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