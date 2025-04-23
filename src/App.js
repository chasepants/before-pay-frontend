import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import Home from './pages/Home';
import SetupSavings from './pages/SetupSavings';
import ViewSavings from './pages/ViewSavings';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3001/api/auth/current_user', { withCredentials: true })
      .then(res => {
        console.log(res);
        console.log(res.data);
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/home"
          element={user ? <Home /> : <Navigate to="/" replace />}
        />
        <Route
          path="/setup-savings/:wishlistItemId"
          element={user ? <SetupSavings /> : <Navigate to="/" replace />}
        />
        <Route
          path="/view-savings/:wishlistItemId"
          element={user ? <ViewSavings /> : <Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;