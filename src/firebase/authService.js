// Firebase Authentication Service
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from './config';

// Register a new user with email and password
export const registerWithEmailAndPassword = async (email, password, firstName, lastName) => {
  try {
    // Create user in Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Send email verification
    await sendEmailVerification(user);
    
    // For now, create user in backend immediately but mark as unverified
    // In a production app, you might want to require email verification first
    const idToken = await user.getIdToken();
    
    // Register user in your backend with Firebase token (not password)
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify-firebase-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        firstName,
        lastName,
        emailVerified: user.emailVerified
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to register user in backend');
    }

    const data = await response.json();
    
    // Add email verification info to response
    return {
      ...data,
      emailVerificationSent: true,
      emailVerified: user.emailVerified
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email, password) => {
  try {
    // Sign in with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get Firebase ID token
    const idToken = await user.getIdToken();
    
    // Verify token with your backend
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify-firebase-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to verify token with backend');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Send password reset email
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

// Send email verification
export const sendVerificationEmail = async () => {
  try {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  } catch (error) {
    console.error('Email verification error:', error);
    throw error;
  }
};

// Listen to authentication state changes
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};
