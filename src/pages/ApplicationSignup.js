import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api';
import Navbar from '../components/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';

const ApplicationSignup = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useSelector((state) => state.user);
  const [applicationFormId, setApplicationFormId] = useState(null);
  const [applicationFormToken, setApplicationFormToken] = useState(null);
  const [error, setError] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (userLoading || !user || isFetching) return;
    if (user.unitCustomerId && user.status === 'approved') {
      console.log('User approved, navigating to /home');
      navigate('/home');
      return;
    }

    const fetchApplicationForm = async () => {
      setIsFetching(true);
      try {
        const response = await api.get('/api/auth/create-application-form');
        console.log('Application form response:', response.data);
        setApplicationFormId(response.data.id);
        setApplicationFormToken(response.data.token);
      } catch (err) {
        console.error('Application form fetch failed:', err.response?.data || err.message);
        setError('Failed to load application form: ' + (err.response?.data?.error || err.message));
      } finally {
        setIsFetching(false);
      }
    };

    if (!isFetching) {
      fetchApplicationForm();
    }
  }, [userLoading]);

  useEffect(() => {
    if (applicationFormId && applicationFormToken) {
      const formElement = document.querySelector('unit-elements-application-form');
      if (formElement) {
        formElement.addEventListener('unitOnLoad', (e) => {
          console.log('Application form loaded:', e.detail);
          if (e.detail.errors) {
            console.error('Application form error:', e.detail.errors);
            setError('Failed to initialize application form: ' + (e.detail.errors[0]?.title || 'Unknown error'));
          }
        });
        formElement.addEventListener('unitApplicationFormCompleted', (e) => {
          console.log('Application form completed:', e.detail);
          navigate('/pending');
        });
      }
    }
  }, [applicationFormId, applicationFormToken, navigate]);

  if (userLoading || !user) return null;

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
    <div className="container mb-4">
      <Navbar user={user} />
      {applicationFormId && applicationFormToken ? (
        <unit-elements-application-form
          application-form-id={applicationFormId}
          application-form-token={applicationFormToken}
          style={{ display: 'block', minHeight: '600px', width: '100%' }}
        ></unit-elements-application-form>
      ) : (
        <p>Loading application form...</p>
      )}
    </div>
  );
};

export default ApplicationSignup;