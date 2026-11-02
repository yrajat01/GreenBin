import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user details from MongoDB using stored token
  const refreshProfile = async () => {
    try {
      const profile = await authService.getMe();
      setUser(profile);
      return profile;
    } catch (err) {
      console.warn('Profile refresh failed or session expired:', err.message);
      logout();
      return null;
    }
  };

  // Sign in (local MongoDB with Firebase fallback)
  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const payload = { email, password };
      if (role) payload.role = role;
      const res = await authService.login(payload);
      localStorage.setItem('auth_token', res.token);
      setUser(res.user);
      setLoading(false);
      return res.user;
    } catch (err) {
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

  // Sign up (Citizen self-registration)
  const signup = async (name, email, password, role = 'citizen', zone = 'Zone-A') => {
    setLoading(true);
    try {
      const res = await authService.signup({ name, email, password, role, zone });
      localStorage.setItem('auth_token', res.token);
      setUser(res.user);
      setLoading(false);
      return res.user;
    } catch (err) {
      if (auth) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('auth_token', token);
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

    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener('auth:expired', handleAuthExpired);

    const token = localStorage.getItem('auth_token');
    if (token && token.startsWith('mock-')) {
      // Purge invalid/legacy mock tokens
      localStorage.removeItem('auth_token');
      setUser(null);
      setLoading(false);
    } else if (token && token.startsWith('local-')) {
      refreshProfile().finally(() => setLoading(false));
    } else if (auth) {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const idToken = await firebaseUser.getIdToken();
            localStorage.setItem('auth_token', idToken);
            await refreshProfile();
          } catch (err) {
            console.error('Error synchronizing Firebase user:', err);
            logout();
          }
        } else {
          const currentToken = localStorage.getItem('auth_token');
          if (!currentToken || !currentToken.startsWith('local-')) {
            setUser(null);
          }
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => {
      unsubscribe();
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        loginReal: login, // Backward-compatibility alias
        signupReal: signup, // Backward-compatibility alias
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
