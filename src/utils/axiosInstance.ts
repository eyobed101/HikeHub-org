import axios from "axios";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { performLogout } from "./logout";
import { message } from 'antd';

const BASE_URL = "https://hikeapi.issipeteta.net/api/v1.0/";

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

// Function to check token expiration
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.exp ? decoded.exp * 1000 < Date.now() : true;
  } catch {
    return true;
  }
};

// Function to refresh token
const refreshAccessToken = async (): Promise<string> => {
  if (isRefreshing) {
    throw new Error("Refresh already in progress");
  }

  isRefreshing = true;
  try {
    const refreshResponse = await axios.get(`${BASE_URL}auth/refresh`, {
      withCredentials: true
    });
    
    if (!refreshResponse.data?.token) {
      throw new Error("No token received in refresh response");
    }
    
    return refreshResponse.data.token;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
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
  async (config) => {
    if (config.url?.includes('auth/refresh')) {
      return config;
    }

    const token = sessionStorage.getItem("accessToken");
    
    if (!token) {
      performLogout();
      throw new Error("No access token found. Please log in.");
    }

    // Check if token is expired or about to expire (with 30 second buffer)
    if (isTokenExpired(token)) {
      try {
        const newToken = await refreshAccessToken();
        sessionStorage.setItem("accessToken", newToken);
        config.headers.Authorization = `Bearer ${newToken}`;
      } catch (error) {
        if (error.message === "Session expired. Please log in again.") {
          message.error(error.message);
        }
        throw error;
      }
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (simplified as per your request)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config?.url?.includes('auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response) {
      switch (error.response.status) {
        case 403:
          message.error('You do not have permission to access this resource.');
          break;
        case 500:
          message.error('Server error occurred. Please try again later.');
          break;
        default:
          message.error(error.response.data?.message || 'An error occurred');
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