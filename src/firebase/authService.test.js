import {
  registerWithEmailAndPassword,
  signInWithEmail,
  signOutUser,
  resetPassword,
  sendVerificationEmail,
  onAuthStateChange,
  getCurrentUser
} from './authService';

// Mock Firebase auth module
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendEmailVerification: jest.fn(),
  onAuthStateChanged: jest.fn()
}));

// Mock Firebase config
jest.mock('./config', () => ({
  auth: {
    currentUser: null
  }
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Firebase AuthService', () => {
  let mockAuth;
  let mockCreateUserWithEmailAndPassword;
  let mockSignInWithEmailAndPassword;
  let mockSignOut;
  let mockSendPasswordResetEmail;
  let mockSendEmailVerification;
  let mockOnAuthStateChanged;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked functions
    const firebaseAuth = require('firebase/auth');
    mockCreateUserWithEmailAndPassword = firebaseAuth.createUserWithEmailAndPassword;
    mockSignInWithEmailAndPassword = firebaseAuth.signInWithEmailAndPassword;
    mockSignOut = firebaseAuth.signOut;
    mockSendPasswordResetEmail = firebaseAuth.sendPasswordResetEmail;
    mockSendEmailVerification = firebaseAuth.sendEmailVerification;
    mockOnAuthStateChanged = firebaseAuth.onAuthStateChanged;
    
    // Get the mocked auth object
    const { auth } = require('./config');
    mockAuth = auth;
    mockAuth.currentUser = null;
    
    process.env.REACT_APP_API_URL = 'http://localhost:3001';
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('registerWithEmailAndPassword', () => {
    const mockGetIdToken = jest.fn();
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      emailVerified: false,
      getIdToken: mockGetIdToken
    };

    const mockUserCredential = {
      user: mockUser
    };

    test('successfully registers a new user', async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      mockSendEmailVerification.mockResolvedValue();
      mockGetIdToken.mockResolvedValue('mock-id-token');
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          user: { _id: '123', email: 'test@example.com' },
          token: 'backend-token'
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await registerWithEmailAndPassword(
        'test@example.com',
        'password123',
        'John',
        'Doe'
      );

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'test@example.com',
        'password123'
      );
      expect(mockSendEmailVerification).toHaveBeenCalledWith(mockUser);
      expect(mockGetIdToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/verify-firebase-token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken: 'mock-id-token',
            firstName: 'John',
            lastName: 'Doe',
            emailVerified: false
          }),
        }
      );
      expect(result).toEqual({
        user: { _id: '123', email: 'test@example.com' },
        token: 'backend-token',
        emailVerificationSent: true,
        emailVerified: false
      });
    });

    test('handles Firebase registration error', async () => {
      const firebaseError = new Error('Firebase registration failed');
      mockCreateUserWithEmailAndPassword.mockRejectedValue(firebaseError);

      await expect(registerWithEmailAndPassword(
        'test@example.com',
        'password123',
        'John',
        'Doe'
      )).rejects.toThrow('Firebase registration failed');

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('handles backend registration error', async () => {
      const mockGetIdToken = jest.fn();
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        emailVerified: false,
        getIdToken: mockGetIdToken
      };
      const mockUserCredential = { user: mockUser };
      
      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      mockSendEmailVerification.mockResolvedValue();
      mockGetIdToken.mockResolvedValue('mock-id-token');
      
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'Backend registration failed'
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      await expect(registerWithEmailAndPassword(
        'test@example.com',
        'password123',
        'John',
        'Doe'
      )).rejects.toThrow('Backend registration failed');
    });

    test('handles backend error without error message', async () => {
      const mockGetIdToken = jest.fn();
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        emailVerified: false,
        getIdToken: mockGetIdToken
      };
      const mockUserCredential = { user: mockUser };
      
      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      mockSendEmailVerification.mockResolvedValue();
      mockGetIdToken.mockResolvedValue('mock-id-token');
      
      const mockResponse = {
        ok: false,
        json: jest.fn().mockRejectedValue(new Error('JSON parse error'))
      };
      global.fetch.mockResolvedValue(mockResponse);

      await expect(registerWithEmailAndPassword(
        'test@example.com',
        'password123',
        'John',
        'Doe'
      )).rejects.toThrow('Failed to register user in backend');
    });
  });

  describe('signInWithEmail', () => {
    test('successfully signs in a user', async () => {
      const mockGetIdToken = jest.fn();
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        getIdToken: mockGetIdToken
      };
      const mockUserCredential = { user: mockUser };
      
      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      mockGetIdToken.mockResolvedValue('mock-id-token');
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          user: { _id: '123', email: 'test@example.com' },
          token: 'backend-token'
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        'test@example.com',
        'password123'
      );
      expect(mockGetIdToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/verify-firebase-token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken: 'mock-id-token' }),
        }
      );
      expect(result).toEqual({
        user: { _id: '123', email: 'test@example.com' },
        token: 'backend-token'
      });
    });

    test('handles Firebase sign in error', async () => {
      const firebaseError = new Error('Invalid credentials');
      mockSignInWithEmailAndPassword.mockRejectedValue(firebaseError);

      await expect(signInWithEmail('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('handles backend verification error', async () => {
      const mockGetIdToken = jest.fn();
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        getIdToken: mockGetIdToken
      };
      const mockUserCredential = { user: mockUser };
      
      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      mockGetIdToken.mockResolvedValue('mock-id-token');
      
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'Invalid token'
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      await expect(signInWithEmail('test@example.com', 'password123'))
        .rejects.toThrow('Invalid token');
    });
  });

  describe('signOutUser', () => {
    test('successfully signs out user', async () => {
      mockSignOut.mockResolvedValue();

      await signOutUser();

      expect(mockSignOut).toHaveBeenCalledWith(mockAuth);
    });

    test('handles sign out error', async () => {
      const signOutError = new Error('Sign out failed');
      mockSignOut.mockRejectedValue(signOutError);

      await expect(signOutUser()).rejects.toThrow('Sign out failed');
    });
  });

  describe('resetPassword', () => {
    test('successfully sends password reset email', async () => {
      mockSendPasswordResetEmail.mockResolvedValue();

      await resetPassword('test@example.com');

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(mockAuth, 'test@example.com');
    });

    test('handles password reset error', async () => {
      const resetError = new Error('User not found');
      mockSendPasswordResetEmail.mockRejectedValue(resetError);

      await expect(resetPassword('nonexistent@example.com'))
        .rejects.toThrow('User not found');
    });
  });

  describe('sendVerificationEmail', () => {
    test('successfully sends verification email when user is logged in', async () => {
      const mockUser = { uid: 'test-uid' };
      mockAuth.currentUser = mockUser;
      mockSendEmailVerification.mockResolvedValue();

      await sendVerificationEmail();

      expect(mockSendEmailVerification).toHaveBeenCalledWith(mockUser);
    });

    test('does nothing when no user is logged in', async () => {
      mockAuth.currentUser = null;

      await sendVerificationEmail();

      expect(mockSendEmailVerification).not.toHaveBeenCalled();
    });

    test('handles verification email error', async () => {
      const mockUser = { uid: 'test-uid' };
      mockAuth.currentUser = mockUser;
      const verificationError = new Error('Verification email failed');
      mockSendEmailVerification.mockRejectedValue(verificationError);

      await expect(sendVerificationEmail()).rejects.toThrow('Verification email failed');
    });
  });

  describe('onAuthStateChange', () => {
    test('sets up auth state listener', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);

      const result = onAuthStateChange(mockCallback);

      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(mockAuth, mockCallback);
      expect(result).toBe(mockUnsubscribe);
    });
  });

  describe('getCurrentUser', () => {
    test('returns current user when logged in', () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      mockAuth.currentUser = mockUser;

      const result = getCurrentUser();

      expect(result).toBe(mockUser);
    });

    test('returns null when no user is logged in', () => {
      mockAuth.currentUser = null;

      const result = getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('Environment Variables', () => {
    test('uses correct API URL from environment', async () => {
      process.env.REACT_APP_API_URL = 'https://api.example.com';
      
      const mockGetIdToken = jest.fn();
      mockCreateUserWithEmailAndPassword.mockResolvedValue({
        user: { uid: 'test-uid', emailVerified: false, getIdToken: mockGetIdToken }
      });
      mockSendEmailVerification.mockResolvedValue();
      mockGetIdToken.mockResolvedValue('mock-id-token');
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ user: {}, token: 'test-token' })
      };
      global.fetch.mockResolvedValue(mockResponse);

      await registerWithEmailAndPassword('test@example.com', 'password', 'John', 'Doe');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/auth/verify-firebase-token',
        expect.any(Object)
      );
    });
  });
});
