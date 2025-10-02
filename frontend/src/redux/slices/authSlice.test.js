import authReducer, {
  login,
  logout,
  setLoading,
  setError,
  forgotPasswordRequest,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  resetPasswordRequest,
  resetPasswordSuccess,
  resetPasswordFailure,
  selectIsAuthenticated,
  selectUser,
  selectLoading,
  selectError
} from './authSlice';

describe('Auth Slice', () => {
  // Initial state tests
  describe('initial state', () => {
    test('should return the initial state', () => {
      const initialState = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        forgotPassword: {
          loading: false,
          success: false,
          error: null
        },
        resetPassword: {
          loading: false,
          success: false,
          error: null
        }
      };
      
      expect(authReducer(undefined, { type: undefined })).toEqual(initialState);
    });
  });

  // Reducer tests
  describe('reducers', () => {
    test('should handle login', () => {
      const initialState = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        forgotPassword: { loading: false, success: false, error: null },
        resetPassword: { loading: false, success: false, error: null }
      };
      
      const user = { id: 1, name: 'Test User', email: 'test@example.com' };
      const action = { type: login.type, payload: user };
      
      const expectedState = {
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
        forgotPassword: { loading: false, success: false, error: null },
        resetPassword: { loading: false, success: false, error: null }
      };
      
      expect(authReducer(initialState, action)).toEqual(expectedState);
    });

    test('should handle logout', () => {
      const initialState = {
        isAuthenticated: true,
        user: { id: 1, name: 'Test User', email: 'test@example.com' },
        loading: false,
        error: null,
        forgotPassword: { loading: false, success: false, error: null },
        resetPassword: { loading: false, success: false, error: null }
      };
      
      const action = { type: logout.type };
      
      const expectedState = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        forgotPassword: { loading: false, success: false, error: null },
        resetPassword: { loading: false, success: false, error: null }
      };
      
      expect(authReducer(initialState, action)).toEqual(expectedState);
    });

    test('should handle setLoading', () => {
      const initialState = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        forgotPassword: { loading: false, success: false, error: null },
        resetPassword: { loading: false, success: false, error: null }
      };
      
      const action = { type: setLoading.type, payload: true };
      
      const expectedState = {
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null,
        forgotPassword: { loading: false, success: false, error: null },
        resetPassword: { loading: false, success: false, error: null }
      };
      
      expect(authReducer(initialState, action)).toEqual(expectedState);
    });

    test('should handle setError', () => {
      const initialState = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        forgotPassword: { loading: false, success: false, error: null },
        resetPassword: { loading: false, success: false, error: null }
      };
      
      const errorMessage = 'Authentication failed';
      const action = { type: setError.type, payload: errorMessage };
      
      const expectedState = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: errorMessage,
        forgotPassword: { loading: false, success: false, error: null },
        resetPassword: { loading: false, success: false, error: null }
      };
      
      expect(authReducer(initialState, action)).toEqual(expectedState);
    });

    test('should handle forgotPasswordRequest', () => {
      const initialState = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        forgotPassword: { loading: false, success: false, error: null },
        resetPassword: { loading: false, success: false, error: null }
      };
      
      const action = { type: forgotPasswordRequest.type };
      
      const expectedState = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        forgotPassword: { loading: true, success: false, error: null },
        resetPassword: { loading: false, success: false, error: null }
      };
      
      expect(authReducer(initialState, action)).toEqual(expectedState);
    });

    test('should handle forgotPasswordSuccess', () => {
      const initialState = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        forgotPassword: { loading: true, success: false, error: null },
        resetPassword: { loading: false, success: false, error: null }
      };
      
      const action = { type: forgotPasswordSuccess.type };
      
      const expectedState = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        forgotPassword: { loading: false, success: true, error: null },
        resetPassword: { loading: false, success: false, error: null }
      };
      
      expect(authReducer(initialState, action)).toEqual(expectedState);
    });

    test('should handle forgotPasswordFailure', () => {
      const initialState = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        forgotPassword: { loading: true, success: false, error: null },
        resetPassword: { loading: false, success: false, error: null }
      };
      
      const errorMessage = 'Email not found';
      const action = { type: forgotPasswordFailure.type, payload: errorMessage };
      
      const expectedState = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
        forgotPassword: { loading: false, success: false, error: errorMessage },
        resetPassword: { loading: false, success: false, error: null }
      };
      
      expect(authReducer(initialState, action)).toEqual(expectedState);
    });
  });

  // Selector tests
  describe('selectors', () => {
    const state = {
      auth: {
        isAuthenticated: true,
        user: { id: 1, name: 'Test User' },
        loading: false,
        error: 'Some error'
      }
    };

    test('selectIsAuthenticated should return isAuthenticated state', () => {
      expect(selectIsAuthenticated(state)).toBe(true);
    });

    test('selectUser should return user state', () => {
      expect(selectUser(state)).toEqual({ id: 1, name: 'Test User' });
    });

    test('selectLoading should return loading state', () => {
      expect(selectLoading(state)).toBe(false);
    });

    test('selectError should return error state', () => {
      expect(selectError(state)).toBe('Some error');
    });
  });
});