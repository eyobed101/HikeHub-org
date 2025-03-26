// authService.ts
import store from "../store/store";
import { logout } from "../store/authSlice";

export const performLogout = (): void => {
  store.dispatch(logout());
  sessionStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // localStorage.removeItem('station');
};
