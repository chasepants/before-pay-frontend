const Login = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f0f0' }}>
    <a
      href={`${process.env.REACT_APP_API_URL}/api/auth/google`}
      style={{ backgroundColor: '#db4437', color: 'white', padding: '12px 24px', borderRadius: '4px', textDecoration: 'none' }}
    >
      Login with Google
    </a>
  </div>
);

export default Login;