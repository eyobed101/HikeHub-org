import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Log on provider initialization
  useEffect(() => {
    console.log('AuthProvider initialized. isAuthenticated:', isAuthenticated);
  }, []);

  const login = () => {
    console.log('Login called');
    setIsAuthenticated(true);
  };

  const logout = () => {
    console.log('Logout called');
    setIsAuthenticated(false);
  };

  console.log('AuthProvider rendering with isAuthenticated:', isAuthenticated);
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
  
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  console.log('useAuth accessed with isAuthenticated:', context.isAuthenticated);
  return context;
};
