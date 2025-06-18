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
import Accounts from './pages/Accounts';
import { setUser, setUserLoading, setUserError } from './store/userSlice';
import { setWishlist, setWishlistLoading, setWishlistError } from './store/wishlistSlice';

const App = () => {
  const dispatch = useDispatch();
  const { user, loading: userLoading } = useSelector((state) => state.user);
  const { loading: wishlistLoading } = useSelector((state) => state.wishlist);
  const [error, setError] = useState(null);

  // Fetch user on mount
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
          // Handle unauthorized case
          dispatch(setUser(null));
        } else {
          setError('Failed to load user data. Please try again.');
        }
      }
    };

    fetchUser();
  }, [dispatch]);

  // Fetch wishlist when user is available
  useEffect(() => {
    if (user) {
      const fetchWishlist = async () => {
        dispatch(setWishlistLoading());
        try {
          const wishlistRes = await axios.get('http://localhost:3001/api/wishlist', { withCredentials: true });
          dispatch(setWishlist(wishlistRes.data));
        } catch (err) {
          console.error('Wishlist fetch failed:', err);
          dispatch(setWishlistError(err.message));
          if (err.response?.status === 401) {
            // Handle unauthorized case
            dispatch(setUser(null));
          } else {
            setError('Failed to load wishlist data. Please try again.');
          }
        }
      };

      fetchWishlist();
    }
  }, [user, dispatch]);

  if (userLoading || (user && wishlistLoading)) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '16px' }}>
        <p style={{ color: 'red' }}>{error}</p>
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
        <Route path="/setup-savings/:wishlistItemId" element={user ? <SetupSavings /> : <Navigate to="/" />} />
        <Route path="/setup-payout/:wishlistItemId" element={user ?  <SetupPayout /> : <Navigate to="/" />} />
        <Route path="/view-savings/:wishlistItemId" element={user ?  <ViewSavings /> : <Navigate to="/" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
        <Route path="/accounts" element={user ? <Accounts /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;