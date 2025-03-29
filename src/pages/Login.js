import React from 'react';

const Login = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f0f0' }}>
    <a
      href="http://localhost:3001/api/auth/google"
      style={{ backgroundColor: '#db4437', color: 'white', padding: '12px 24px', borderRadius: '4px', textDecoration: 'none' }}
    >
      Login with Google
    </a>
  </div>
);

export default Login;