import api from '../api';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from '../components/Navbar';
import Placeholder from 'react-bootstrap/Placeholder';
import { setSavingsGoals } from '../store/savingsSlice';
import { Link } from 'react-router';
import { Box, Typography, Paper, Button } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SavingsGoalsTable from '../components/SavingsGoalsTable';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const { goals: savingsGoals, savingsGoalsLoading } = useSelector((state) => state.savings);
  const [customerToken, setCustomerToken] = useState(null);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const [unitComponentsLoaded, setUnitComponentsLoaded] = useState(false);

  const unitComponentsRendered = useRef(false);

  useEffect(() => {
    if (user?.status === "approved" && customerToken && !unitComponentsRendered.current) {
      setUnitComponentsLoaded(true);
      unitComponentsRendered.current = true;
    }
  }, [user?.status, customerToken]);

  const fetchCustomerToken = async () => {
    try {
      const response = await api.get('/api/users/customer-token');
      console.log('Customer token:', response.data.token);
      setCustomerToken(response.data.token);
    } catch (err) {
      console.error('Customer token fetch failed:', err.response?.data || err.message);
      // Only redirect on 401 (unauthorized), not on 400 (no Unit application)
      // Guest users don't have Unit applications, so 400 is expected
      if (err.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/');
      }
      // Silently handle 400 errors for guest users or users without Unit applications
    }
  };

  useEffect(() => {
    // Only fetch customer token for approved StashPay users (not guest users)
    // Guest users don't have Unit applications and don't need customer tokens
    if (user && user.status === 'approved' && user.userType !== 'guest') {
      fetchCustomerToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    return () => {
      if (accountElement) {
        accountElement.removeEventListener('unitOnLoad', handleAccountLoad);
      }
      if (activityElement) {
        activityElement.removeEventListener('unitOnLoad', handleActivityLoad);
      }
    };
  }, [customerToken]);

  const handleCreateSavingsGoal = () => {
    if (user?.userType === 'guest') {
      alert('Guest users cannot create new savings goals. You can only manage goals created from abandoned carts.');
      return;
    }
    if (user?.status !== 'approved') {
      alert('You must be approved to create savings goals.');
      return;
    }
    navigate('/create-savings-goal');
  };

  const handleViewSavings = (goalId) => {
    console.log(user);
    "guest" === user.userType ? navigate(`/view-order/${goalId}`) : navigate(`/view-savings/${goalId}`);
  };

  const togglePause = async (goal) => {
    console.log(`Pausing ${goal}`)
    try {
      await api.patch(`/api/savings-goal/${goal._id}/pause`, { isPaused: !goal.isPaused });
      const refreshed = await api.get('/api/savings-goal');
      dispatch(setSavingsGoals(refreshed.data));
    } catch (e) {
      console.error('Toggle pause failed:', e);
      // Show error message to user if backend returns an error
      if (e.response?.data?.error) {
        alert(e.response.data.error);
      } else {
        alert('Failed to update savings goal. Please try again.');
      }
    }
  };

  // Check if a Shopify goal is completed (has orderId)
  const isGoalCompleted = (goal) => {
    if (goal.__t !== 'ShopifySavingsGoal') return false;
    // checkoutCartId might be an ObjectId string (not populated) or an object (populated)
    // Only check orderId if checkoutCartId is an object (populated) and has a non-empty orderId
    if (!goal.checkoutCartId || typeof goal.checkoutCartId === 'string') {
      // It's not populated or is just an ObjectId string
      return false;
    }
    // checkoutCartId is a populated object, check for orderId
    const orderId = goal.checkoutCartId.orderId;
    return !!orderId && typeof orderId === 'string' && 
      orderId.trim().length > 0 && 
      goal.currentAmount === goal.targetAmount;
  };

  const formatNextRunDate = (dateString) => {
    if (!dateString) return 'Not set';
    
    const date = new Date(dateString);
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const dateUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    
    if (dateUTC.getTime() === todayUTC.getTime()) {
      return 'Today';
    }
    
    const tomorrow = new Date(todayUTC);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    if (dateUTC.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };


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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" component="h2">
                {user?.firstName ? `Welcome, ${user.firstName}!` : 'Welcome!'}
              </Typography>
              {user?.userType !== 'guest' && (
                <Button
                  variant="contained"
                  startIcon={<AddCircleIcon />}
                  onClick={handleCreateSavingsGoal}
                  sx={{
                    backgroundColor: '#116530',
                    '&:hover': {
                      backgroundColor: '#0d4f26',
                    },
                  }}
                >
                  Add New Goal
                </Button>
              )}
            </Box>
          </div>
        </div>

        <Box sx={{ mb: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom data-testid="savings-goals-header">
              Savings Goals
            </Typography>
            <SavingsGoalsTable
              goals={savingsGoals}
              loading={savingsGoalsLoading}
              userType={user?.userType || 'savings-account'}
              onViewGoal={handleViewSavings}
              onTogglePause={togglePause}
            />
          </Paper>
        </Box>

        {user?.userType === 'savings-account' && (
          <div className="row mb-4">
            <div className="col-12 col-md-6 col-lg-4 mb-3">
              {user?.status === "approved" && customerToken ? (
                <div data-testid="account-details-section">
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
                <div className="text-center py-4" data-testid="account-details-placeholder">
                  <Placeholder animation="glow">
                    <Placeholder xs={12} style={{ height: '200px' }} />
                  </Placeholder>
                </div>
              )}
            </div>
            <div className="col-12 col-md-6 col-lg-4 mb-3">
              {user?.status === "approved" && customerToken ? (
                <div data-testid="account-activity-section">
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
                <div className="text-center py-4" data-testid="account-activity-placeholder">
                  <Placeholder animation="glow">
                    <Placeholder xs={12} style={{ height: '200px' }} />
                  </Placeholder>
                </div>
              )}
            </div>
            
            <div className="col-12 col-md-6 col-lg-4 mb-3">
              {user?.status === "approved" && customerToken ? (
                <div data-testid="transfer-back-section">
                  <h6 className="bg-secondary text-white p-2 rounded mb-2">Transfer Back</h6>
                  <div className="text-center py-4">
                    <p className="text-muted mb-3">Need to withdraw funds from your savings?</p>
                    <Link to="/transfer-back" className="btn btn-outline-primary" data-testid="transfer-back-link">
                      <i className="bi bi-arrow-left-circle me-2"></i>
                      Transfer Back
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4" data-testid="transfer-back-placeholder">
                  <Placeholder animation="glow">
                    <Placeholder xs={12} style={{ height: '200px' }} />
                  </Placeholder>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;