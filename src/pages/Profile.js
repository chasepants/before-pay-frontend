// frontend/src/pages/Profile.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import LoadingAnimation from '../components/LoadingAnimation';
import axios from 'axios';


/**
 * TODO: when status of applicaiton changes to awaiting documents, display a document upload section
 * TODO: send request to new backend route (that needs to be created as well) called update profile which should update the profile in UnitFinance with the documents
 * TODO: Update the webhook to listen to applicaiton status changes
 */
const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useSelector((state) => state.user); // Added loading state

  const [address, setAddress] = useState({ line1: '', city: '', state: '', postalCode: '' });
  const [ssnLast4, setSsnLast4] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [sourceOfIncome, setSourceOfIncome] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [occupation, setOccupation] = useState('');
  const [status, setStatus] = useState('pending'); // Display application status
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userLoading) return; // Wait for user data to load
    if (!user) {
      navigate('/');
      return;
    }

    // Pre-populate with user data from Redux store
    setAddress(user.address || { line1: '', city: '', state: '', postalCode: '' });
    setSsnLast4(user.ssnLast4 || '');
    setDateOfBirth(user.dateOfBirth ? user.dateOfBirth : '');
    setSourceOfIncome(user.sourceOfIncome || '');
    setAnnualIncome(user.annualIncome || '');
    setOccupation(user.occupation || '');
    setStatus(user.status || 'pending');
    setProfileLoaded(true);
  }, [user, userLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:3001/api/auth/profile-update',
        { address, ssnLast4, dateOfBirth, sourceOfIncome, annualIncome, occupation },
        { withCredentials: true }
      );
      // Optionally refresh user data
      const userRes = await axios.get('http://localhost:3001/api/auth/current_user', { withCredentials: true });
      navigate('/home');
    } catch (err) {
      setError('Failed to update profile information');
    }
  };

  if (!profileLoaded || userLoading) {
    return <LoadingAnimation />;
  }

  return (
    <div>
      <Navbar user={user} />
      <div className='container my-5'>
        <div className='row'>
          <div className="border border-black col-sm-6 mt-5 offset-sm-3 p-5 rounded-5">
            <div className='text-center mb-3'>
              <h1>Profile</h1>
              <p>Application Status: <strong>{status}</strong></p>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <label htmlFor="address" className="form-label mt-4"><h4>Address</h4></label>
            <input
              className="form-control form-control-lg"
              placeholder="Street Address (i.e. 123 Main St)"
              aria-label="Address"
              type="text"
              value={address.line1}
              onChange={(e) => setAddress({ ...address, line1: e.target.value })}
            />
            <input
              className="form-control form-control-lg mt-3"
              placeholder="City"
              aria-label="City"
              type="text"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
            />
            <input
              className="form-control form-control-lg mt-3"
              placeholder="State"
              aria-label="State"
              type="text"
              value={address.state}
              onChange={(e) => setAddress({ ...address, state: e.target.value })}
            />
            <input
              className="form-control form-control-lg mt-3"
              placeholder="Postal Code"
              aria-label="Postal Code"
              type="text"
              value={address.postalCode}
              onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
            />
            <label htmlFor="birthdate" className="form-label mt-4"><h4>Birthdate</h4></label>
            <input
              className="form-control form-control-lg"
              aria-label="Birth Date"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
            <label htmlFor="ssn" className="form-label mt-4"><h4>SSN Last 4</h4></label>
            <input
              className="form-control form-control-lg"
              placeholder="1234"
              aria-label="SSN Last 4"
              type="text"
              value={ssnLast4}
              onChange={(e) => setSsnLast4(e.target.value)}
              maxLength={4}
            />
            <label htmlFor="sourceOfIncome" className="form-label mt-4"><h4>Source of Income</h4></label>
            <select
              className="form-control form-control-lg"
              name="sourceOfIncome"
              value={sourceOfIncome}
              onChange={(e) => setSourceOfIncome(e.target.value)}
              aria-label="Source of Income"
            >
              <option value="">Select Source of Income</option>
              <option value="EmploymentOrPayrollIncome">Employment/Payroll Income</option>
              <option value="SelfEmploymentIncome">Self-Employment Income</option>
              <option value="InvestmentIncome">Investment Income</option>
            </select>
            <label htmlFor="annualIncome" className="form-label mt-4"><h4>Annual Income</h4></label>
            <select
              className="form-control form-control-lg"
              name="annualIncome"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
              aria-label="Annual Income"
            >
              <option value="">Select Annual Income</option>
              <option value="UpTo10k">Less than $10,000</option>
              <option value="Between10kAnd25k">$10,000 than $25,000</option>
              <option value="Between25kAnd50k">$25,000 and $50,000</option>
              <option value="Between50kAnd100k">$50,000 and $100,000</option>
              <option value="Between100kAnd250k">$100,000 and $250,000</option>
              <option value="Over250k">$250,000+</option>
            </select>
            <label htmlFor="occupation" className="form-label mt-4"><h4>Occupation</h4></label>
            <input
              className="form-control form-control-lg"
              placeholder="Occupation"
              aria-label="Occupation"
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
            />
            <button onClick={handleSubmit} className="btn btn-primary w-50 mt-5" type="submit">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;