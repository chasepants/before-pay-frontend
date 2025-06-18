import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Navbar from '../components/Navbar';

const Accounts = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fundingSources, setFundingSources] = useState([]); // State for funding sources

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchFundingSources = async () => {
      setIsLoading(true);
      try {
        if (!user.dwollaCustomerId) {
          setError('User not set up with a Dwolla account');
          return;
        }
        const response = await axios.get(
          `http://localhost:3001/api/bank/funding-sources/${user.dwollaCustomerId}`,
          { withCredentials: true }
        );
        setFundingSources(response.data.fundingSources || []);
      } catch (err) {
        console.error('Fetch error:', err.response?.data || err.message);
        setError(
          err.response?.status === 404
            ? 'No funding sources found'
            : err.response?.data?.error || 'Failed to load funding sources'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchFundingSources();
  }, [user, navigate]);

  if (error) {
    return (
      <div style={{ padding: '16px' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button
          onClick={() => navigate('/home')}
          style={{
            backgroundColor: '#4285f4',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <div style={{ padding: '16px' }}><p>Loading funding sources...</p></div>;
  }

  return (
    <>
      <Navbar user={user} />
      <div className='container mt-5'>
        <div className='row'>
          <div className='col-sm-10 offset-sm-1'>
            <h1>Saved Accounts</h1>
            {fundingSources.length > 0 ? (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Account Name</th>
                    <th>Last 4 Digits</th>
                    <th>Bank Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fundingSources.map((source) => (
                    <tr key={source.id}>
                      <td>{source.name || 'Unnamed Account'}</td>
                      <td>****{source.mask}</td>
                      <td>{source.bankName || 'Unknown'}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveAccount(source.id)}
                          disabled={isLoading}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No funding sources found. Please link an account via the Setup Savings page.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // Placeholder for remove functionality (to be implemented)
  const handleRemoveAccount = (fundingSourceId) => {
    setIsLoading(true);
    setError('');
    // TODO: Implement API call to remove funding source from Dwolla and update WishlistItem
    console.log('Remove account:', fundingSourceId);
    setIsLoading(false);
  };
};

export default Accounts;