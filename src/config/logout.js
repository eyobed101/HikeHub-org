// authService.js
import store from "../store/store";

import { logout } from "../store/authSlice";

export const performLogout = () => {
  store.dispatch(logout()); 
  localStorage.removeItem('accessToken');
  // localStorage.removeItem('username');
  // localStorage.removeItem('station');
};
