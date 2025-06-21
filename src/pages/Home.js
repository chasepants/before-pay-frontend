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
    navigate('/create-savings-goal');
  };

  const handleViewSavings = (goalId) => {
    navigate(`/view-savings/${goalId}`);
  };

  return (
    <>
      <Navbar user={user} />
      <div className='container mt-5'>
        <h1 className='text-center fw-bold fs-4'>Dashboard</h1>
        <div className='row mt-4'>
          {/* Application Card (Pending Status) */}
          {user && user.status === 'pending' && (
            <div className='col-md-4 mb-4'>
              <div className='card h-100'>
                <div className='card-header'>Application</div>
                <div className='card-body'>
                  <p className='card-text'>Status: <strong>{user.status}</strong></p>
                  <p className='card-text'>Full Name: {`${user.firstName || ''} ${user.lastName || ''}`.trim()}</p>
                  <p className='card-text'>Occupation: {user.occupation || 'Not specified'}</p>
                  <p className='card-text'>SSN Last 4: {user.ssnLast4 || 'Not provided'}</p>
                  <p className='card-text'>Birthdate: {user.dateOfBirth ? user.dateOfBirth : 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Savings Goals Card */}
          <div className='col-md-4 mb-4'>
            <div className='card h-100'>
              <div className='card-header'>Savings Goals</div>
              <div className='card-body'>
                {savingsGoals.length === 0 ? (
                  <div>
                    <p className='card-text'>No savings goals yet.</p>
                    <button className='btn btn-primary' onClick={handleCreateSavingsGoal}>
                      Create Savings Goal
                    </button>
                  </div>
                ) : (
                  savingsGoals.map((goal) => (
                    <div key={goal._id} onClick={() => handleViewSavings(goal._id)} style={{ cursor: 'pointer' }}>
                      <p className='card-text'>{goal.goalName || goal.title}: ${goal.currentAmount} / ${goal.targetAmount}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Savings Account Card */}
          <div className='col-md-4 mb-4'>
            <div className={`card h-100 ${user && user.status === 'pending' ? 'bg-secondary bg-opacity-50' : ''}`}>
              <div className='card-header'>Savings Account</div>
              <div className='card-body'>
                <p className='card-text'>
                  {user && user.status === 'pending'
                    ? 'Account activation pending approval'
                    : 'Account active - View details'}
                </p>
                {user && user.status === 'approved' && (
                  <button className='btn btn-primary' onClick={() => navigate('/accounts')}>
                    View Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;