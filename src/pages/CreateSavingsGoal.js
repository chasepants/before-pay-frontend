// frontend/src/pages/CreateSavingsGoal.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import mockSerpResults from '../mock_serp.js';
import { addSavingsGoal } from '../store/savingsSlice';
import 'bootstrap/dist/css/bootstrap.min.css'; // Ensure Bootstrap is included

const CreateSavingsGoal = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { goals: savingsGoals } = useSelector((state) => state.savings); // Added to access savingsGoals
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    goalName: '',
    description: '',
    amount: '',
    productLink: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) navigate('/');
  }, [navigate, user]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!formData.goalName || !formData.amount) {
      setError('Goal name and amount are required');
      return;
    }
    try {
      const newGoal = {
        userId: user._id,
        goalName: formData.goalName,
        description: formData.description || '',
        targetAmount: parseFloat(formData.amount),
        product_link: formData.productLink || ''
      };
      const res = await axios.post('https://before-pay-backend.vercel.app/api/savings-goal', newGoal, { withCredentials: true });
      dispatch(addSavingsGoal(res.data));
      setFormData({ goalName: '', description: '', amount: '', productLink: '' });
      setError('');
      navigate('/view-savings-goals'); // Redirect to view goals
    } catch (err) {
      setError('Failed to create savings goal: ' + err.message);
    }
  };

  const handleSearch = async () => {
    try {
      setProducts(mockSerpResults); // Mocked for now
    } catch (err) {
      console.error('Mock search failed:', err);
    }
  };

  const addToSavings = async (product) => {
    if (user.status !== 'approved') {
      navigate('/pending');
      return;
    }
    if (savingsGoals.some(goal => goal.product_id === product.product_id)) { // Now defined
      alert('Goal already in savings list');
      return;
    }
    try {
      const res = await axios.post('https://before-pay-backend.vercel.app/api/savings-goal', { userId: user._id, ...product, targetAmount: product.extracted_price }, { withCredentials: true });
      dispatch(addSavingsGoal(res.data));
    } catch (err) {
      console.error('Add to savings failed:', err);
    }
  };

  return (
    <>
      <Navbar user={user} />
      <div className='container mt-5'>
        <div className='row'>
          <h1 className='text-center fw-bold fs-4'>Create Savings Goal</h1>
        </div>
        <div className='row mt-3'>
          <div className='col-sm-6 offset-sm-3'>
            <h4>Manual Entry</h4>
            <form onSubmit={handleManualSubmit} className='mb-4'>
              <input
                className='form-control form-control-lg mt-2'
                type='text'
                name='goalName'
                value={formData.goalName}
                onChange={(e) => setFormData({ ...formData, goalName: e.target.value })}
                placeholder='Savings Goal Name'
                aria-label='Savings Goal Name'
              />
              <input
                className='form-control form-control-lg mt-2'
                type='text'
                name='description'
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder='Description (Optional)'
                aria-label='Description'
              />
              <input
                className='form-control form-control-lg mt-2'
                type='number'
                name='amount'
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder='Target Amount'
                aria-label='Target Amount'
              />
              <input
                className='form-control form-control-lg mt-2'
                type='text'
                name='productLink'
                value={formData.productLink}
                onChange={(e) => setFormData({ ...formData, productLink: e.target.value })}
                placeholder='Product Link (Optional)'
                aria-label='Product Link'
              />
              <button type='submit' className='btn btn-primary w-50 mt-3'>
                Create Goal
              </button>
              {error && <p className='text-danger mt-2'>{error}</p>}
            </form>
            <hr className='my-4' />
            <h4 className='text-center'>OR</h4>
            <hr className='my-4' />
            <h4>Create from a Google Shopping Product</h4>
            <div className="input-group mb-3">
              <input
                className='form-control'
                onChange={(e) => setSearch(e.target.value)}
                value={search}
                type="text"
                placeholder="Search for products..."
                aria-label="Search for Products"
                aria-describedby="button-addon2"
              />
              <button
                className='btn btn-primary'
                onClick={handleSearch}
                type="button"
                id="button-addon2"
              >
                Search
              </button>
            </div>
            <div className='row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 m-4'>
              {products.map((p, i) => {
                const isInSavings = savingsGoals.some(goal => goal.product_id === p.product_id);
                return (
                  <div className='col' key={i}>
                    <ProductCard
                      name={p.title}
                      price={p.price}
                      oldPrice={p.old_price}
                      url={p.product_link}
                      imageUrl={p.thumbnail}
                      source={p.source}
                      sourceIcon={p.source_icon}
                      rating={p.rating}
                      reviews={p.reviews}
                      badge={p.badge}
                      tag={p.tag}
                      delivery={p.delivery}
                      onButtonClick={() => user ? addToSavings(p) : navigate('/signup')}
                      isInSavings={isInSavings}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateSavingsGoal;