import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext({});

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5176';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('nv_token'));

  // Configure axios to always use the token
  useEffect(() => {
    if (token) {
      localStorage.setItem('nv_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      validateToken(token);
    } else {
      localStorage.removeItem('nv_token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  }, [token]);

  const validateToken = async (t) => {
    try {
      // In a real app, you'd have a /me or /validate endpoint
      // For now, if we have a profile in the response, we are good.
      // But we need to load the user profile to set state.
      // We'll use the health check or similar if we don't have a /me yet.
      // Actually, let's just use the profile stored in localStorage if any, or fetch it.
      const savedProfile = localStorage.getItem('nv_profile');
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        setProfile(p);
        setUser({ id: p.id, email: p.email });
      } else {
         // Fallback signout if state is inconsistent
         logout();
      }
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password });
      const { token: newToken, profile: newProfile } = res.data;
      
      localStorage.setItem('nv_profile', JSON.stringify(newProfile));
      setToken(newToken);
      setProfile(newProfile);
      setUser({ id: newProfile.id, email: newProfile.email });
      
      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.error || err.message };
    }
  };

  const signUp = async (email, password, fullName, role = 'citizen', metadata = {}) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/register`, { 
        email, 
        password, 
        fullName, 
        role,
        ...metadata 
      });
      const { token: newToken, profile: newProfile } = res.data;

      localStorage.setItem('nv_profile', JSON.stringify(newProfile));
      setToken(newToken);
      setProfile(newProfile);
      setUser({ id: newProfile.id, email: newProfile.email });

      return { data: res.data, error: null };
    } catch (err) {
      return { data: null, error: err.response?.data?.error || err.message };
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('nv_profile');
    localStorage.removeItem('nv_token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut: logout,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
