// frontend/src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import savingsReducer from './savingsSlice'; // Updated import name

export const store = configureStore({
  reducer: {
    user: userReducer,
    savings: savingsReducer, // Updated key to match reducer name
  },
});