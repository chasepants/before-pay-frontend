import React from 'react';
import logo from '../assets/beforepay-logo.png'; // Adjust path as needed
import './LoadingAnimation.css'; // Separate CSS file for animations

const LoadingAnimation = () => {
  return (
    <div className="loading-container">
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
      <img src={logo} alt="Beforepay Logo" className="logo" />
    </div>
  );
};

export default LoadingAnimation;