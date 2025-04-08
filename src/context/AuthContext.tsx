import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { performLogout } from '../utils/logout';

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
  // const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false); // Added loading state
  interface RootState {
    auth: {
      isAuthenticated: boolean;
    };
  }

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated); // Adjust the selector based on your auth state


  

  const login = () => {
    // Perform login logic
  };

  const logout = () => {
    performLogout();
  };

  console.log('AuthProvider rendering with isAuthenticated:', isAuthenticated);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {!loading && children} {/* Prevents UI flickering */}
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