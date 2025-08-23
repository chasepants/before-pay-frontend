// frontend/src/store/savingsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const savingsSlice = createSlice({
  name: 'savings',
  initialState: { goals: [], loading: false, error: null },
  reducers: {
    setSavingsGoals: (state, action) => { state.goals = action.payload; },
    setSavingsGoalsLoading: (state, action) => { state.loading = action.payload; },
    setSavingsGoalsError: (state, action) => { state.error = action.payload; },
    addSavingsGoal: (state, action) => { state.goals.push(action.payload); },
    removeSavingsGoal: (state, action) => {
      state.goals = state.goals.filter(goal => goal._id !== action.payload);
    }
  }
});

// Export actions
export const { setSavingsGoals, setSavingsGoalsLoading, setSavingsGoalsError, addSavingsGoal, removeSavingsGoal } = savingsSlice.actions;

// Export reducer as default
export default savingsSlice.reducer;