// authService.ts
import store from "../store/store";
import { logout } from "../store/authSlice";
import axiosInstance from "./axiosInstance";

export const performLogout = async (): Promise<void> => {
  try {
    // Call backend logout endpoint to clear refresh token cookie
    await axiosInstance.post('auth/logout');
  } catch (error) {
    // Even if logout fails, continue with local cleanup
    console.error('Logout error:', error);
  } finally {
    // Clear local storage regardless of backend response
    store.dispatch(logout());
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};
