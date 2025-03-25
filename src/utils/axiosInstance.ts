import axios from "axios";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { performLogout } from "./logout";

const BASE_URL = "https://hikeapi.issipeteta.net/api/v1.0/";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Allow cookies to be sent/received
});

interface DecodedToken extends JwtPayload {
  exp?: number; // 'exp' property is optional for safety
}

// Request Interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      performLogout(); // Logout immediately if no token is found
      throw new Error("Session expired. Please log in again.");
    }

    // Add the existing token to the Authorization header
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error) => {
    if (error.response?.status === 403 && error.config && !error.config.__isRetry) {
      error.config.__isRetry = true; // Mark the request as retried

      try {
        // Attempt to refresh the token
        const refreshResponse = await axiosInstance.post(`${BASE_URL}auth/refresh`);
        const newToken = refreshResponse.data.token;

        // Store the new token and update the Authorization header
        sessionStorage.setItem("accessToken", newToken);
        error.config.headers.Authorization = `Bearer ${newToken}`;

        // Retry the original request with the new token
        return axiosInstance(error.config);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);

        // Perform logout if the refresh token is invalid or expired
        performLogout();
        throw new Error("Session expired. Please log in again.");
      }
    }

    // Reject the promise for other errors
    return Promise.reject(error);
  }
);

export default axiosInstance;
