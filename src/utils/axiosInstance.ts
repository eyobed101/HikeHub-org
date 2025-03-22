import axios from 'axios';
import { jwtDecode, JwtPayload } from "jwt-decode";
import { performLogout } from './logout';

const BASE_URL = 'https://hikeapi.issipeteta.net/api/v1.0/';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface DecodedToken extends JwtPayload {
  exp?: number; // Ensure 'exp' property is optional for safety
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken'); // Retrieve token from session storage
    if (token) {
      const decodedToken: DecodedToken = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;

      console.log(token)

      if (decodedToken.exp && decodedToken.exp < currentTime) {
        performLogout();
        throw new Error('Token expired');
      }

      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
