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
      try {
        let token = sessionStorage.getItem("accessToken");
        
        // If there's no token in sessionStorage, attempt to refresh via HttpOnly cookie
        if (!token) {
          try {
            const axios = (await import('axios')).default;
            const response = await axios.get('/api/v1.0/auth/refresh', {
              withCredentials: true,
              timeout: 4000
            });
            if (response.data?.token) {
              token = response.data.token;
              sessionStorage.setItem("accessToken", token);
              if (response.data.role) {
                sessionStorage.setItem("userRole", response.data.role);
              }
            } else {
              await performLogout();
            }
          } catch {
            await performLogout();
          }
        } else {
          // Check if token in sessionStorage is expired or about to expire (< 5 mins)
          try {
            const { jwtDecode } = await import('jwt-decode');
            const decoded = jwtDecode<{ exp?: number }>(token);
            
            if (decoded.exp) {
              const expirationTime = decoded.exp * 1000;
              const bufferTime = 5 * 60 * 1000; // 5 minutes
              
              if (expirationTime - Date.now() < bufferTime) {
                try {
                  const axios = (await import('axios')).default;
                  const response = await axios.get('/api/v1.0/auth/refresh', {
                    withCredentials: true,
                    timeout: 4000
                  });
                  if (response.data?.token) {
                    sessionStorage.setItem("accessToken", response.data.token);
                    if (response.data.role) {
                      sessionStorage.setItem("userRole", response.data.role);
                    }
                  } else {
                    await performLogout();
                  }
                } catch {
                  await performLogout();
                }
              }
            }
          } catch {
            await performLogout();
          }
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
        await performLogout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = () => {
    // Login logic is handled in SignInForm component
  };

  const logout = async () => {
    await performLogout();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        children
      )}
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