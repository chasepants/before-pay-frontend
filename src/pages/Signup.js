// frontend/src/pages/Signup.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();

  const handleGoogleAuth = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  };

  return (
    <div className="container">
      <div className="row">
        <div className="border border-black col-sm-6 mt-5 offset-sm-3 p-5 rounded-5 text-center">
          <h1>SIGN UP</h1>
          <h5>Sign in with Google to start saving</h5>
          <button className="btn btn-danger w-50 mt-5" onClick={handleGoogleAuth}>
            Continue with Google
          </button>
          <div className="row">
            <div className="col-sm-6 mt-5 offset-sm-3 text-center">
              <h5>
                Have an account with us?{' '}
                <a href="/login">
                  <span style={{ color: '#116530' }}>Login</span>
                </a>
              </h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;