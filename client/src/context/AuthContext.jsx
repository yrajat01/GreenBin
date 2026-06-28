import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user details from MongoDB using stored token
  const refreshProfile = async () => {
    try {
      const profile = await api.get('/api/users/me');
      setUser(profile);
      return profile;
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      logout();
      return null;
    }
  };

  // Mock login for easy local development and jury review
  const loginMock = async (role) => {
    setLoading(true);
    try {
      const mockToken = `mock-${role}`;
      localStorage.setItem('auth_token', mockToken);
      const profile = await refreshProfile();
      setLoading(false);
      return profile;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  // Real login (local MongoDB first, fallback to Firebase)
  const loginReal = async (email, password) => {
    setLoading(true);
    try {
      // 1. Try local MongoDB login first
      const res = await api.post('/api/users/login', { email, password });
      localStorage.setItem('auth_token', res.token);
      setUser(res.user);
      setLoading(false);
      return res.user;
    } catch (err) {
      // 2. Fallback to Firebase if available
      if (auth) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const token = await userCredential.user.getIdToken();
          localStorage.setItem('auth_token', token);
          const profile = await refreshProfile();
          setLoading(false);
          return profile;
        } catch (firebaseErr) {
          setLoading(false);
          throw firebaseErr;
        }
      } else {
        setLoading(false);
        throw err;
      }
    }
  };

  // Real signup (local MongoDB first, fallback to Firebase)
  const signupReal = async (name, email, password, role = 'citizen', zone = 'Zone-A') => {
    setLoading(true);
    try {
      // 1. Try local MongoDB signup first
      const res = await api.post('/api/users/signup', { name, email, password, role, zone });
      localStorage.setItem('auth_token', res.token);
      setUser(res.user);
      setLoading(false);
      return res.user;
    } catch (err) {
      // 2. Fallback to Firebase if available
      if (auth) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('auth_token', token);
          
          await api.post('/api/reports', { binId: 'GB-001', issueType: 'Other', description: 'User Registered' }).catch(() => ({}));
          const userProfile = await refreshProfile();
          setLoading(false);
          return userProfile;
        } catch (firebaseErr) {
          setLoading(false);
          throw firebaseErr;
        }
      } else {
        setLoading(false);
        throw err;
      }
    }
  };

  // Sign out
  const logout = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Firebase signOut error:', err);
      }
    }
  };

  useEffect(() => {
    let unsubscribe = () => {};
    
    // Check if we are using a mock or local token
    const token = localStorage.getItem('auth_token');
    if (token && (token.startsWith('mock-') || token.startsWith('local-'))) {
      refreshProfile().finally(() => setLoading(false));
    } else if (auth) {
      // Set up Firebase auth listener
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            localStorage.setItem('auth_token', token);
            await refreshProfile();
          } catch (err) {
            console.error('Error synchronizing Firebase user:', err);
            logout();
          }
        } else {
          // If no firebaseUser and no mock/local token, sign out
          const currentToken = localStorage.getItem('auth_token');
          if (!currentToken || (!currentToken.startsWith('mock-') && !currentToken.startsWith('local-'))) {
            setUser(null);
          }
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loginMock,
      loginReal,
      signupReal,
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
