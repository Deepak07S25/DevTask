import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token) {
      setUser({ token, ...(storedUser ? JSON.parse(storedUser) : {}) });
    }
    setLoading(false);
  }, []);

  const login = (token, userInfo) => {
    localStorage.setItem('token', token);
    if (userInfo) localStorage.setItem('user', JSON.stringify(userInfo));
    setUser({ token, ...userInfo });
  };

  const logout = () => {
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