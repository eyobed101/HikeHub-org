import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id?: string;
  role?: 'Superadmin' | 'EventOrganizer' | 'Hiker';
  exp?: number;
}

/**
 * Get user role from JWT token stored in sessionStorage
 */
export const getUserRole = (): 'Superadmin' | 'EventOrganizer' | 'Hiker' | null => {
  try {
    const token = sessionStorage.getItem('accessToken');
    if (!token) return null;

    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.role || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Get user ID from JWT token
 */
export const getUserId = (): string | null => {
  try {
    const token = sessionStorage.getItem('accessToken');
    if (!token) return null;

    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.id || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if user is Superadmin
 */
export const isSuperadmin = (): boolean => {
  return getUserRole() === 'Superadmin';
};

/**
 * Check if user is EventOrganizer
 */
export const isEventOrganizer = (): boolean => {
  return getUserRole() === 'EventOrganizer';
};

/**
 * Check if user is Hiker
 */
export const isHiker = (): boolean => {
  return getUserRole() === 'Hiker';
};


