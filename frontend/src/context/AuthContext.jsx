import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout as logoutAction, updateUser, initStart, initComplete } from '../store/slices/authSlice';
import api from '../services/api';

export function AuthProvider({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    let isMounted = true;

    const rehydrateSession = async () => {
      const token =
        localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      if (!token) {
        // No token at all — nothing to validate, stay logged out
        dispatch(initComplete());
        return;
      }

      // We have a token; block the UI until we confirm it's valid
      dispatch(initStart());

      try {
        const response = await api.get('/auth/me/');
        if (isMounted) {
          dispatch(updateUser(response.data));
        }
      } catch {
        // Token is invalid / expired and refresh also failed (api.js handles refresh)
        if (isMounted) {
          dispatch(logoutAction());
        }
      } finally {
        if (isMounted) {
          dispatch(initComplete());
        }
      }
    };

    rehydrateSession();

    return () => {
      isMounted = false;
    };
  // Empty dependency array — run once on mount only, not on every navigation
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return children;
}

// useAuth was moved to src/hooks/useAuth.js to satisfy Fast Refresh rules.
