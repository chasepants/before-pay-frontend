// frontend/src/pages/ViewSavingsGoals.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { removeSavingsGoal } from '../store/savingsSlice';

const ViewSavingsGoals = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { goals: savingsGoals } = useSelector((state) => state.savings);

  useEffect(() => {
    if (!user) navigate('/');
  }, [navigate, user]);

  const handleDelete = async (goalId) => {
    try {
      await axios.delete(`http://localhost:3001/api/savings-goal/${goalId}`, { withCredentials: true });
      dispatch(removeSavingsGoal(goalId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleViewSavings = (goalId) => {
    navigate(`/view-savings/${goalId}`);
  };

  return (
    <>
      <Navbar user={user} />
      <div className='container mt-5'>
        <div className='row'>
          <h1 className='text-center fw-bold fs-4'>Savings Goals</h1>
        </div>
        <div className='row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 m-4'>
          {savingsGoals.map((goal) => (
            <div className='col' key={goal._id}>
              <div className='card'>
                <img src={goal.thumbnail || 'https://via.placeholder.com/200'} className='card-img-top' alt={goal.goalName || goal.title} />
                <div className='card-body'>
                  <h5 className='card-title' onClick={() => handleViewSavings(goal._id)} style={{ cursor: 'pointer' }}>
                    {goal.goalName || goal.title}
                  </h5>
                  <p className='card-text'>Saved: ${goal.currentAmount}</p>
                  <p className='card-text'>Goal: ${goal.targetAmount}</p>
                  {user && user.status === 'approved' && (
                    <button className='btn btn-danger' onClick={() => handleDelete(goal._id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ViewSavingsGoals;