import { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

export interface CurrentUser {
  _id: string;
  username: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  profilePicture?: string | null;
  role: string;
  phone_number?: string;
  isGoogleAccount: boolean;
}

/**
 * Fetches the authenticated user's personal info from GET /auth/me.
 * Works for all roles (Hiker, EventOrganizer, Superadmin).
 */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get<{ success: boolean; data: CurrentUser }>('auth/me')
      .then(res => {
        if (res.data.success) setUser(res.data.data);
      })
      .catch(err => console.error('[useCurrentUser]', err))
      .finally(() => setLoading(false));
  }, []);

  const displayName = user
    ? (`${user.firstname ?? ''} ${user.lastname ?? ''}`.trim() || user.username)
    : '';

  const avatarUrl = user?.profilePicture ?? null;

  return { user, loading, displayName, avatarUrl };
}
