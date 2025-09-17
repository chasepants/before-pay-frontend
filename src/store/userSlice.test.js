import userSlice, { setUser, setUserLoading, setUserError, clearUser } from './userSlice';

describe('userSlice', () => {
  const initialState = {
    user: null,
    loading: true,
    error: null
  };

  it('should return the initial state', () => {
    expect(userSlice(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setUser', () => {
    it('should set user and set loading to false and clear error', () => {
      const user = { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
      
      const actual = userSlice(initialState, setUser(user));
      
      expect(actual.user).toEqual(user);
      expect(actual.loading).toBe(false);
      expect(actual.error).toBe(null);
    });

    it('should handle null user', () => {
      const actual = userSlice(initialState, setUser(null));
      
      expect(actual.user).toBe(null);
      expect(actual.loading).toBe(false);
      expect(actual.error).toBe(null);
    });

    it('should clear error when setting user', () => {
      const stateWithError = { ...initialState, error: 'Previous error' };
      const user = { _id: '1', firstName: 'John' };
      
      const actual = userSlice(stateWithError, setUser(user));
      
      expect(actual.user).toEqual(user);
      expect(actual.error).toBe(null);
    });
  });

  describe('setUserLoading', () => {
    it('should set loading to true and clear error', () => {
      const actual = userSlice(initialState, setUserLoading());
      
      expect(actual.loading).toBe(true);
      expect(actual.error).toBe(null);
    });

    it('should clear error when setting loading', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      
      const actual = userSlice(stateWithError, setUserLoading());
      
      expect(actual.loading).toBe(true);
      expect(actual.error).toBe(null);
    });
  });

  describe('setUserError', () => {
    it('should set error and clear user and set loading to false', () => {
      const errorMessage = 'Authentication failed';
      const stateWithUser = { ...initialState, user: { _id: '1', name: 'John' } };
      
      const actual = userSlice(stateWithUser, setUserError(errorMessage));
      
      expect(actual.error).toBe(errorMessage);
      expect(actual.user).toBe(null);
      expect(actual.loading).toBe(false);
    });

    it('should handle null error', () => {
      const stateWithError = { ...initialState, error: 'Previous error' };
      
      const actual = userSlice(stateWithError, setUserError(null));
      
      expect(actual.error).toBe(null);
      expect(actual.user).toBe(null);
      expect(actual.loading).toBe(false);
    });
  });

  describe('clearUser', () => {
    it('should clear user, set loading to false, and clear error', () => {
      const stateWithUser = {
        ...initialState,
        user: { _id: '1', firstName: 'John' },
        loading: true,
        error: 'Some error'
      };
      
      const actual = userSlice(stateWithUser, clearUser());
      
      expect(actual.user).toBe(null);
      expect(actual.loading).toBe(false);
      expect(actual.error).toBe(null);
    });

    it('should work with initial state', () => {
      const actual = userSlice(initialState, clearUser());
      
      expect(actual.user).toBe(null);
      expect(actual.loading).toBe(false);
      expect(actual.error).toBe(null);
    });
  });

  describe('combined actions', () => {
    it('should handle login flow', () => {
      let state = initialState;
      
      // Start loading
      state = userSlice(state, setUserLoading());
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
      
      // Set user on successful login
      const user = { _id: '1', firstName: 'John', email: 'john@example.com' };
      state = userSlice(state, setUser(user));
      expect(state.user).toEqual(user);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle login error flow', () => {
      let state = initialState;
      
      // Start loading
      state = userSlice(state, setUserLoading());
      expect(state.loading).toBe(true);
      
      // Set error on failed login
      state = userSlice(state, setUserError('Invalid credentials'));
      expect(state.user).toBe(null);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    it('should handle logout flow', () => {
      const stateWithUser = {
        ...initialState,
        user: { _id: '1', firstName: 'John' },
        loading: false,
        error: null
      };
      
      const actual = userSlice(stateWithUser, clearUser());
      
      expect(actual.user).toBe(null);
      expect(actual.loading).toBe(false);
      expect(actual.error).toBe(null);
    });

    it('should handle error recovery flow', () => {
      let state = initialState;
      
      // Set error
      state = userSlice(state, setUserError('Network error'));
      expect(state.error).toBe('Network error');
      expect(state.user).toBe(null);
      
      // Retry loading
      state = userSlice(state, setUserLoading());
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
      
      // Success
      const user = { _id: '1', firstName: 'John' };
      state = userSlice(state, setUser(user));
      expect(state.user).toEqual(user);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });
  });
});
