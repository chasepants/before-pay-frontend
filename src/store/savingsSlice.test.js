import savingsSlice, { 
  setSavingsGoals, 
  setSavingsGoalsLoading, 
  setSavingsGoalsError, 
  addSavingsGoal, 
  removeSavingsGoal 
} from './savingsSlice';

describe('savingsSlice', () => {
  const initialState = {
    goals: [],
    loading: false,
    error: null
  };

  it('should return the initial state', () => {
    expect(savingsSlice(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setSavingsGoals', () => {
    it('should set goals and set loading to false', () => {
      const goals = [
        { _id: '1', goalName: 'Test Goal 1', targetAmount: 1000 },
        { _id: '2', goalName: 'Test Goal 2', targetAmount: 2000 }
      ];
      
      const actual = savingsSlice(initialState, setSavingsGoals(goals));
      
      expect(actual.goals).toEqual(goals);
      expect(actual.loading).toBe(false);
      expect(actual.error).toBe(null);
    });

    it('should handle empty goals array', () => {
      const actual = savingsSlice(initialState, setSavingsGoals([]));
      
      expect(actual.goals).toEqual([]);
      expect(actual.loading).toBe(false);
    });
  });

  describe('setSavingsGoalsLoading', () => {
    it('should set loading to true when no payload provided', () => {
      const actual = savingsSlice(initialState, setSavingsGoalsLoading());
      
      expect(actual.loading).toBe(true);
    });

    it('should set loading to provided value', () => {
      const actual = savingsSlice(initialState, setSavingsGoalsLoading(false));
      
      expect(actual.loading).toBe(false);
    });

    it('should set loading to true when undefined payload', () => {
      const actual = savingsSlice(initialState, setSavingsGoalsLoading(undefined));
      
      expect(actual.loading).toBe(true);
    });
  });

  describe('setSavingsGoalsError', () => {
    it('should set error message', () => {
      const errorMessage = 'Failed to fetch goals';
      const actual = savingsSlice(initialState, setSavingsGoalsError(errorMessage));
      
      expect(actual.error).toBe(errorMessage);
    });

    it('should set error to null', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      const actual = savingsSlice(stateWithError, setSavingsGoalsError(null));
      
      expect(actual.error).toBe(null);
    });
  });

  describe('addSavingsGoal', () => {
    it('should add a new goal to the goals array', () => {
      const newGoal = { _id: '3', goalName: 'New Goal', targetAmount: 1500 };
      const stateWithGoals = {
        ...initialState,
        goals: [
          { _id: '1', goalName: 'Existing Goal', targetAmount: 1000 }
        ]
      };
      
      const actual = savingsSlice(stateWithGoals, addSavingsGoal(newGoal));
      
      expect(actual.goals).toHaveLength(2);
      expect(actual.goals[1]).toEqual(newGoal);
    });

    it('should add goal to empty goals array', () => {
      const newGoal = { _id: '1', goalName: 'First Goal', targetAmount: 1000 };
      
      const actual = savingsSlice(initialState, addSavingsGoal(newGoal));
      
      expect(actual.goals).toHaveLength(1);
      expect(actual.goals[0]).toEqual(newGoal);
    });
  });

  describe('removeSavingsGoal', () => {
    it('should remove goal with matching ID', () => {
      const stateWithGoals = {
        ...initialState,
        goals: [
          { _id: '1', goalName: 'Goal 1', targetAmount: 1000 },
          { _id: '2', goalName: 'Goal 2', targetAmount: 2000 },
          { _id: '3', goalName: 'Goal 3', targetAmount: 3000 }
        ]
      };
      
      const actual = savingsSlice(stateWithGoals, removeSavingsGoal('2'));
      
      expect(actual.goals).toHaveLength(2);
      expect(actual.goals.find(goal => goal._id === '2')).toBeUndefined();
      expect(actual.goals.find(goal => goal._id === '1')).toBeDefined();
      expect(actual.goals.find(goal => goal._id === '3')).toBeDefined();
    });

    it('should not remove anything if ID does not match', () => {
      const stateWithGoals = {
        ...initialState,
        goals: [
          { _id: '1', goalName: 'Goal 1', targetAmount: 1000 },
          { _id: '2', goalName: 'Goal 2', targetAmount: 2000 }
        ]
      };
      
      const actual = savingsSlice(stateWithGoals, removeSavingsGoal('999'));
      
      expect(actual.goals).toHaveLength(2);
      expect(actual.goals).toEqual(stateWithGoals.goals);
    });

    it('should handle empty goals array', () => {
      const actual = savingsSlice(initialState, removeSavingsGoal('1'));
      
      expect(actual.goals).toHaveLength(0);
    });
  });

  describe('combined actions', () => {
    it('should handle multiple actions in sequence', () => {
      let state = initialState;
      
      // Set loading
      state = savingsSlice(state, setSavingsGoalsLoading(true));
      expect(state.loading).toBe(true);
      
      // Set goals
      const goals = [{ _id: '1', goalName: 'Goal 1', targetAmount: 1000 }];
      state = savingsSlice(state, setSavingsGoals(goals));
      expect(state.goals).toEqual(goals);
      expect(state.loading).toBe(false);
      
      // Add another goal
      const newGoal = { _id: '2', goalName: 'Goal 2', targetAmount: 2000 };
      state = savingsSlice(state, addSavingsGoal(newGoal));
      expect(state.goals).toHaveLength(2);
      
      // Remove first goal
      state = savingsSlice(state, removeSavingsGoal('1'));
      expect(state.goals).toHaveLength(1);
      expect(state.goals[0]._id).toBe('2');
      
      // Set error
      state = savingsSlice(state, setSavingsGoalsError('Something went wrong'));
      expect(state.error).toBe('Something went wrong');
    });
  });
});
