import { createContext, useState, useEffect } from 'react';
import API from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser({ ...(storedUser ? JSON.parse(storedUser) : {}) });
    }
    setLoading(false);
  }, []);

  const login = (token, userInfo) => {
    if (userInfo) localStorage.setItem('user', JSON.stringify(userInfo));
    setUser({ ...userInfo });
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed', error);
    }
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};