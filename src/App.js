// frontend/src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import SetupSavings from './pages/SetupSavings';
import SetupPayout from './pages/SetupPayout';
import ViewSavings from './pages/ViewSavings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import ApplicationSignup from './pages/ApplicationSignup';
import Pending from './pages/Pending';
import CreateSavingsGoal from './pages/CreateSavingsGoal';
import ViewSavingsGoals from './pages/ViewSavingsGoals'; // New route
import { setUser, setUserLoading, setUserError } from './store/userSlice';
import { setSavingsGoals, setSavingsGoalsLoading, setSavingsGoalsError } from './store/savingsSlice';
import LoadingAnimation from './components/LoadingAnimation';

const App = () => {
  const dispatch = useDispatch();
  const { user, loading: userLoading } = useSelector((state) => state.user);
  const { loading: savingsGoalsLoading, error: savingsGoalsError } = useSelector((state) => state.savings);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      dispatch(setUserLoading());
      try {
        const userRes = await axios.get('http://localhost:3001/api/auth/current_user', { withCredentials: true });
        dispatch(setUser(userRes.data));
      } catch (err) {
        console.error('User fetch failed:', err);
        dispatch(setUserError('Failed to fetch user'));
        if (err.response?.status === 401) {
          dispatch(setUser(null));
        } else {
          setError('Failed to load user data. Please try again.');
        }
      }
    };

    fetchUser();
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      const fetchSavingsGoals = async () => {
        dispatch(setSavingsGoalsLoading());
        try {
          const savingsGoalsRes = await axios.get('http://localhost:3001/api/savings-goal', { withCredentials: true });
          dispatch(setSavingsGoals(savingsGoalsRes.data));
        } catch (err) {
          console.error('Savings goals fetch failed:', err);
          dispatch(setSavingsGoalsError(err.message));
          if (err.response?.status === 401) {
            dispatch(setUser(null));
          } else {
            setError('Failed to load savings goals data. Please try again.');
          }
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

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/setup-savings/:savingsGoalId" element={user ? <SetupSavings /> : <Navigate to="/" />} />
        <Route path="/setup-payout/:savingsGoalId" element={user ? <SetupPayout /> : <Navigate to="/" />} />
        <Route path="/view-savings/:savingsGoalId" element={user ? <ViewSavings /> : <Navigate to="/" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
        <Route path="/application-signup" element={user && !user.unitApplicationId ? <ApplicationSignup /> : <Navigate to={user ? '/home' : '/'} />} />
        <Route path="/pending" element={user && user.status === 'pending' ? <Pending /> : <Navigate to={user ? '/home' : '/'} />} />
        <Route path="/create-savings-goal" element={user ? <CreateSavingsGoal /> : <Navigate to="/" />} />
        <Route path="/view-savings-goals" element={user ? <ViewSavingsGoals /> : <Navigate to="/" />} /> {/* New route */}
      </Routes>
    </Router>
  );
};

export default App;