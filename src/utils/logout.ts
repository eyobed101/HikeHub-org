// authService.ts
import store from "../store/store";
import { logout } from "../store/authSlice";
import { resetRefreshFailed, getIsLoggingOut } from "./axiosInstance";
import axios from "axios";

export const performLogout = async (): Promise<void> => {
  // Prevent multiple simultaneous logout calls
  if (getIsLoggingOut()) {
    return;
  }

  // Set logout flag in axiosInstance
  resetRefreshFailed(true); // This sets isLoggingOut = true

  try {
    // Use axios directly instead of axiosInstance to avoid interceptors
    // This prevents loops where the interceptor tries to refresh/logout
    await axios.post('/api/v1.0/auth/logout', {}, {
      withCredentials: true
    });
  } catch (error) {
    // Even if logout fails, continue with local cleanup
    console.error('Logout error:', error);
  } finally {
    // Clear local storage regardless of backend response
    store.dispatch(logout());
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Reset flags after a short delay to allow navigation
    setTimeout(() => {
      resetRefreshFailed();
    }, 1000);
  }
};
