import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Extract the request interceptor function for testing
export const addAuthHeader = (config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Added Authorization header:', config.headers.Authorization);
  } else {
    console.log('No token found in localStorage for request:', config.url);
  }
  return config;
};

// Extract the error handler function for testing
export const handleRequestError = (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
};

api.interceptors.request.use(
  addAuthHeader,
  handleRequestError
);

export default api;