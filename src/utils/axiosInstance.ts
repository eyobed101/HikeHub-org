import axios from 'axios';
import { jwtDecode, JwtPayload } from "jwt-decode";
import { performLogout } from './logout';

const BASE_URL = 'https://hikeapi.issipeteta.net/api/v1.0/';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Allow cookies to be sent/received
});

interface DecodedToken extends JwtPayload {
  exp?: number; // Ensure 'exp' property is optional for safety
}

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      performLogout();  // Logout immediately if no token is found
      throw new Error('Session expired. Please log in again.');
    }
    if (token) {
      const decodedToken: DecodedToken = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp && decodedToken.exp < currentTime) {
        try {
          const refreshResponse = await axiosInstance.post('/auth/refresh');
          const newToken = refreshResponse.data.token;
          sessionStorage.setItem('accessToken', newToken);
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          performLogout();
          throw new Error('Session expired. Please log in again.');
        }
      } else {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && error.config && !error.config.__isRetry) {
      error.config.__isRetry = true;
      try {
        const refreshResponse = await axiosInstance.post('/auth/refresh');
        const newToken = refreshResponse.data.token;

        sessionStorage.setItem('accessToken', newToken);
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(error.config);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        performLogout();
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
