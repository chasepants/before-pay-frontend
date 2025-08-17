import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api'; 
import Navbar from '../components/Navbar';

const ApplicationSignup = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    ssn: '',
    firstName: '', // Restored as separate field
    lastName: '',  // Restored as separate field
    dateOfBirth: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US', // Default to US as per Unit docs
    email: '', // Pre-filled from user if available
    phone: '',
    ip: '', // Can be set server-side
    ein: '', // Optional for individuals, but included
    dba: '', // Optional
    soleProprietorship: false, // Optional, default false
    sourceOfIncome: '', // e.g., EmploymentOrPayrollIncome
    annualIncome: '', // e.g., Between50kAnd100k
    occupation: '', // Restricted to predefined values
    numberOfEmployees: '', // Optional
    businessVertical: '', // Optional
    website: '' // Optional
  });
  const [error, setError] = useState('');

  // Predefined occupation values
  const occupations = [
    'ArchitectOrEngineer',
    'BusinessAnalystAccountantOrFinancialAdvisor',
    'CommunityAndSocialServicesWorker',
    'ConstructionMechanicOrMaintenanceWorker',
    'Doctor',
    'Educator',
    'EntertainmentSportsArtsOrMedia',
    'ExecutiveOrManager',
    'FarmerFishermanForester',
    'FoodServiceWorker',
    'GigWorker',
    'HospitalityOfficeOrAdministrativeSupportWorker',
    'HouseholdManager',
    'JanitorHousekeeperLandscaper',
    'Lawyer',
    'ManufacturingOrProductionWorker',
    'MilitaryOrPublicSafety',
    'NurseHealthcareTechnicianOrHealthcareSupport',
    'PersonalCareOrServiceWorker',
    'PilotDriverOperator',
    'SalesRepresentativeBrokerAgent',
    'ScientistOrTechnologist',
    'Student'
  ];

  useEffect(() => {
    if (userLoading) return; // Wait for user loading to complete
    if (!user || user.unitApplicationId) {
      navigate(user && user.status === 'approved' ? '/home' : '/');
    } else {
      // Pre-fill email, firstName, and lastName from user data if available
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      }));
    }
  }, [navigate, user, userLoading]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('User not authenticated');
      return;
    }
    console.log('Submitting application with:', formData); // Debug log
    try {
      const response = await api.post(`/api/auth/application`);
      console.log('Application response:', response.data);
      navigate('/pending');
    } catch (error) {
      console.error('Application submit error:', error.response?.data || error.message);
      setError('Error submitting application: ' + (error.response?.data?.error || error.message));
    }
  };

  if (userLoading || !user) return null; // Prevent render during loading or if unauthenticated

  return (
    <div className="container mb-4">
      <Navbar />
      <div className="row">
        <div className="border border-black col-sm-6 mt-5 offset-sm-3 p-5 rounded-5 text-center">
          <h1>APPLICATION FORM</h1>
          <h5>Complete your application to open a savings account</h5>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <form onSubmit={handleSubmit}>
            <input
              className="form-control form-control-lg mt-3"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First Name"
              aria-label="First Name"
            />
            <input
              className="form-control form-control-lg mt-3"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              aria-label="Last Name"
            />
            <input
              className="form-control form-control-lg mt-3"
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              placeholder="Date of Birth"
              aria-label="Date of Birth"
            />
            <input
              className="form-control form-control-lg mt-3"
              type="text"
              name="ssn"
              value={formData.ssn}
              onChange={handleChange}
              placeholder="SSN"
              aria-label="SSN"
            />
            <input
              className="form-control form-control-lg mt-3"
              type="text"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleChange}
              placeholder="Address Line 1"
              aria-label="Address Line 1"
            />
            <input
              className="form-control form-control-lg mt-3"
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              aria-label="City"
            />
            <input
              className="form-control form-control-lg mt-3"
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="State"
              aria-label="State"
            />
            <input
              className="form-control form-control-lg mt-3"
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              placeholder="Postal Code"
              aria-label="Postal Code"
            />
            <input
              className="form-control form-control-lg mt-3"
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Country"
              aria-label="Country"
              disabled
            />
            <input
              className="form-control form-control-lg mt-3"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              aria-label="Email"
            />
            <input
              className="form-control form-control-lg mt-3"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone"
              aria-label="Phone"
            />
            <select
              className="form-control form-control-lg mt-3"
              name="sourceOfIncome"
              value={formData.sourceOfIncome}
              onChange={handleChange}
              aria-label="Source of Income"
            >
              <option value="">Select Source of Income</option>
              <option value="EmploymentOrPayrollIncome">Employment/Payroll Income</option>
              <option value="SelfEmploymentIncome">Self-Employment Income</option>
              <option value="InvestmentIncome">Investment Income</option>
            </select>
            <select
              className="form-control form-control-lg mt-3"
              name="annualIncome"
              value={formData.annualIncome}
              onChange={handleChange}
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
            <select
              className="form-control form-control-lg mt-3"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              aria-label="Occupation"
            >
              <option value="">Select Occupation</option>
              {occupations.map((occupation) => (
                <option key={occupation} value={occupation}>
                  {occupation.replace(/([A-Z])/g, ' $1').trim()} {/* Add spaces before capitals for readability */}
                </option>
              ))}
            </select>
            <button className="btn btn-primary w-50 mt-5" type="submit">
              Submit Application
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSignup;