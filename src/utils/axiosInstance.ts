import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { performLogout } from "./logout";
import { message } from 'antd';

// Use proxy path in development to avoid CORS issues
const BASE_URL = "/api/v1.0/";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

interface DecodedToken extends JwtPayload {
  exp?: number;
}

// Track refresh state to prevent concurrent refreshes
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

// Function to process queued requests after token refresh
const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Function to check token expiration (with 5 minute buffer)
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (!decoded.exp) return true;
    // Refresh if token expires in less than 5 minutes
    const expirationTime = decoded.exp * 1000;
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    return expirationTime - Date.now() < bufferTime;
  } catch {
    return true;
  }
};

// Function to refresh token
const refreshAccessToken = async (): Promise<string> => {
  if (isRefreshing) {
    // If already refreshing, wait for it to complete
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(() => {
      const token = sessionStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found");
      }
      return token;
    });
  }

  isRefreshing = true;
  try {
    const refreshResponse = await axios.get(`${BASE_URL}auth/refresh`, {
      withCredentials: true
    });
    
    if (!refreshResponse.data?.token) {
      throw new Error("No token received in refresh response");
    }
    
    const newToken = refreshResponse.data.token;
    sessionStorage.setItem("accessToken", newToken);
    
    // Process queued requests
    processQueue(null, newToken);
    
    return newToken;
  } catch (error) {
    // Process queued requests with error
    processQueue(error, null);
    
    if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      performLogout();
      throw new Error("Session expired. Please log in again.");
    }
    throw error;
  } finally {
    isRefreshing = false;
  }
};

// Request Interceptor
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // List of endpoints that don't require authentication
    const publicEndpoints = ['auth/login', 'auth/register', 'auth/refresh', 'auth/signup', 'auth/signin', 'auth/send-otp', 'auth/verify-otp'];
    
    // Check if this is a public endpoint
    const isPublicEndpoint = config.url && publicEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    // Skip token check for public endpoints
    if (isPublicEndpoint) {
      return config;
    }

    const token = sessionStorage.getItem("accessToken");
    
    if (!token) {
      performLogout();
      throw new Error("No access token found. Please log in.");
    }

    // Check if token is expired or about to expire (with 5 minute buffer)
    if (isTokenExpired(token)) {
      try {
        const newToken = await refreshAccessToken();
        if (config.headers) {
          config.headers.Authorization = `Bearer ${newToken}`;
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Session expired. Please log in again.") {
          message.error(error.message);
        }
        throw error;
      }
    } else {
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor with automatic token refresh on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't retry refresh endpoint
    if (originalRequest?.url?.includes('auth/refresh')) {
      performLogout();
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const newToken = await refreshAccessToken();
        
        // Update the authorization header with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        
        // Retry the original request with the new token
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        performLogout();
        message.error("Your session has expired. Please log in again.");
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response) {
      switch (error.response.status) {
        case 403:
          message.error('You do not have permission to access this resource.');
          break;
        case 404:
          // Don't show error for 404, let the component handle it
          break;
        case 500:
          message.error('Server error occurred. Please try again later.');
          break;
        default:
          // Only show error message if it's not a 401 (already handled above)
          if (error.response.status !== 401) {
            message.error(error.response.data?.message || 'An error occurred');
          }
      }
    } else if (error.request) {
      message.error('Network error. Please check your connection.');
    } else {
      message.error('Request error: ' + (error.message || 'Unknown error'));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;