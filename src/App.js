import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import api from './api';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import SetupSavings from './pages/SetupSavings';
import ViewSavings from './pages/ViewSavings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ApplicationSignup from './pages/ApplicationSignup';
import Pending from './pages/Pending';
import CreateSavingsGoal from './pages/CreateSavingsGoal';
import StartSavingsPlan from './pages/StartSavingsPlan';
import Denied from './pages/Denied';
import MerchantDashboard from './pages/MerchantDashboard';
import { setUser, setUserLoading, setUserError } from './store/userSlice';
import { setSavingsGoals, setSavingsGoalsLoading, setSavingsGoalsError } from './store/savingsSlice';
import LoadingAnimation from './components/LoadingAnimation';
import TransferBack from './pages/TransferBack';
import StayNotified from './pages/StayNotified';

const App = () => {
  const dispatch = useDispatch();
  const { user, loading: userLoading } = useSelector((state) => state.user);
  const { loading: savingsGoalsLoading, error: savingsGoalsError } = useSelector((state) => state.savings);
  const [error, setError] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get('token');
    const user = query.get('user');
    
    if (token) {
      console.log('Storing token from URL:', token);
      localStorage.setItem('authToken', token);
      
      // If user data is also provided (SSO from Shopify), process it
      if (user) {
        try {
          const userData = JSON.parse(decodeURIComponent(user));
          console.log('SSO login detected, processing user data:', userData);
          // Store user data in localStorage for potential future use
          localStorage.setItem('ssoUserData', JSON.stringify(userData));
        } catch (err) {
          console.error('Error processing SSO user data:', err);
        }
      }
      
      // Clean up URL parameters after processing
      const url = new URL(window.location);
      url.searchParams.delete('token');
      url.searchParams.delete('user');
      window.history.replaceState({}, '', url);
    }

    const fetchUser = async () => {
      dispatch(setUserLoading());
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('No token found in localStorage');
        dispatch(setUser(null));
        return;
      }
      try {
        console.log('Fetching user from:', `${process.env.REACT_APP_API_URL}/api/auth/current_user`);
        const userRes = await api.get('/api/auth/current_user');
        console.log('Current user response:', userRes.data);
        dispatch(setUser(userRes.data));
      } catch (err) {
        console.error('User fetch failed:', err);
        console.error('Error response:', err.response);
        dispatch(setUserError('Failed to fetch user'));
        dispatch(setUser(null));
      }
    };
    fetchUser();
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      const fetchSavingsGoals = async () => {
        dispatch(setSavingsGoalsLoading(true));
        try {
          const savingsGoalsRes = await api.get('/api/savings-goal');
          dispatch(setSavingsGoals(savingsGoalsRes.data));
        } catch (err) {
          console.error('Savings goals fetch failed:', err);
          dispatch(setSavingsGoalsError(err.message));
          dispatch(setUser(null));
        }
      };
      fetchSavingsGoals();
    }
  }, [user, dispatch]);

  if (userLoading || (user && savingsGoalsLoading)) {
    console.log("Loading user and savings goals");
    return <LoadingAnimation />;
  }

  if (error || savingsGoalsError) {
    return (
      <div style={{ padding: '16px' }}>
        <p style={{ color: 'red' }}>{error || savingsGoalsError}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#4285f4',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const isProduction = process.env.REACT_APP_VERCEL_ENV === 'production';

  return (
    <Router>
      <Routes>
        {isProduction ? (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/stay-notified" element={<StayNotified />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/stay-notified" element={<StayNotified />} />
            <Route path="/home" element={user && user.status === 'approved' && user.userType !== 'merchant' ? <Home /> : (user && user.userType === 'guest' ? <Home /> : (user && user.userType === 'merchant' ? <Navigate to="/dashboard" /> : (user && !user.unitCustomerId ? <Navigate to="/application-signup" /> : <Navigate to="/" />)))} />
            <Route path="/setup-savings/:savingsGoalId" element={user ? <SetupSavings /> : <Navigate to="/" />} />
            <Route path="/view-savings/:savingsGoalId" element={user ? <ViewSavings /> : <Navigate to="/" />} />
            <Route path="/application-signup" element={user && user.userType === 'savings-account' && !user.unitCustomerId ? <ApplicationSignup /> : <Navigate to={user ? '/home' : '/'} />} />
            <Route path="/pending" element={user && user.status === 'pending' && user.userType !== 'merchant' ? <Pending /> : <Navigate to={user ? '/home' : '/'} />} />
            <Route path="/denied" element={user && user.status === 'denied' ? <Denied /> : <Navigate to={user ? '/home' : '/'} />} />
            <Route path="/create-savings-goal" element={user && user.userType === 'savings-account' ? <CreateSavingsGoal /> : <Navigate to="/" />} />
            <Route path="/start-savings-plan" element={<StartSavingsPlan />} />
            <Route path="/transfer-back" element={user ? <TransferBack /> : <Navigate to="/" />} />
            <Route path="/dashboard" element={user && user.userType === 'merchant' ? <MerchantDashboard /> : <Navigate to="/" />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
          </>
        )}
      </Routes>
    </Router>
  );
};

export default App;