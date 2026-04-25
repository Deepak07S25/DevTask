import { createContext, useState, useEffect } from 'react';
import API from '../api/axios';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const loading = false;

  useEffect(() => {
    // If we need to validate token, we would do it here.
    // For now, loading is false immediately as we trust localStorage.
  }, []);

  const login = (token, userInfo) => {
    if (token) localStorage.setItem('token', token);
    if (userInfo) localStorage.setItem('user', JSON.stringify(userInfo));
    setUser({ ...userInfo });
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed', error);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};