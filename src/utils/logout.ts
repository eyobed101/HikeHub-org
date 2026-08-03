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

  // Clear local auth state immediately to ensure UI is updated right away
  store.dispatch(logout());
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('userRole');
  sessionStorage.removeItem('organizerStatus');
  localStorage.removeItem('refreshToken');

  try {
    // Use axios directly with a short timeout to prevent network hangs
    await axios.post('/api/v1.0/auth/logout', {}, {
      withCredentials: true,
      timeout: 3000
    });
  } catch (error) {
    // Even if logout fails or times out, local cleanup is already done
    console.error('Logout request notice:', error);
  } finally {
    // Reset flags after a short delay to allow navigation
    setTimeout(() => {
      resetRefreshFailed();
    }, 1000);
  }
};
