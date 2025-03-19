import axios from 'axios';
import { jwtDecode } from "jwt-decode";

import {performLogout} from './logout'


const axiosInstance = axios.create({
  baseURL: 'https://hikeapi.issipeteta.net/api/',
  headers: {
    'Content-Type': 'application/json',
  },
}); 

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp < currentTime) {
        performLogout();
        return Promise.reject(new Error('Token expired'));
      }

      config.headers.Authorization = `Bearer ${token}`;

    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  });

export default axiosInstance;