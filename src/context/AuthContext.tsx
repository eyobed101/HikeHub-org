import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { performLogout } from '../utils/logout';
import axiosInstance from '../utils/axiosInstance';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [loading, setLoading] = useState(true); // Loading state for initial auth check
  
  interface RootState {
    auth: {
      isAuthenticated: boolean;
    };
  }

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const token = sessionStorage.getItem("accessToken");
      
      if (!token) {
        setLoading(false);
        return;
      }

      // Check if token is expired or about to expire
      try {
        const { jwtDecode } = await import('jwt-decode');
        const decoded = jwtDecode<{ exp?: number }>(token);
        
        if (decoded.exp) {
          const expirationTime = decoded.exp * 1000;
          const bufferTime = 5 * 60 * 1000; // 5 minutes
          
          // Only refresh if token expires soon
          if (expirationTime - Date.now() < bufferTime) {
            try {
              // Use axios directly instead of axiosInstance to avoid interceptors
              // This prevents loops where the interceptor tries to refresh before refresh
              const axios = (await import('axios')).default;
              const response = await axios.get('/api/v1.0/auth/refresh', {
                withCredentials: true
              });
              if (response.data?.token) {
                sessionStorage.setItem("accessToken", response.data.token);
              }
            } catch (error) {
              // Refresh failed, clear token but don't call logout if already logging out
              sessionStorage.removeItem("accessToken");
              // Only call logout if not already in progress (prevent loops)
              try {
                await performLogout();
              } catch (logoutError) {
                // Ignore logout errors to prevent loops
                console.error('Logout error during auth init:', logoutError);
              }
            }
          }
        }
      } catch (error) {
        // Token is invalid, clear it but don't call logout if already logging out
        sessionStorage.removeItem("accessToken");
        // Only call logout if not already in progress (prevent loops)
        try {
          await performLogout();
        } catch (logoutError) {
          // Ignore logout errors to prevent loops
          console.error('Logout error during auth init:', logoutError);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = () => {
    // Login logic is handled in SignInForm component
  };

  const logout = async () => {
    await performLogout();
  };

  console.log('AuthProvider rendering with isAuthenticated:', isAuthenticated);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {!loading && children}
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