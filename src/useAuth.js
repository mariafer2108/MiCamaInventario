import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const user = localStorage.getItem('currentUser');
        if (user) {
          const userData = JSON.parse(user);
          setCurrentUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        localStorage.removeItem('currentUser');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    currentUser,
    isLoading,
    login,
    logout
  };
};