import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardPath } from '../constants/roles';

/**
 * Restricts a route to users with one of the `allowedRoles`.
 * Unauthorised users are redirected to their own dashboard.
 */
export default function RoleBasedRoute({ allowedRoles, children }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    // Redirect to the user's correct dashboard rather than a generic 403
    const dash = getDashboardPath(user.role);
    // Prevent infinite loop if getDashboardPath returns a path that we are currently rendering!
    if (window.location.pathname === dash) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to={dash} replace />;
  }

  return children;
}

