import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Sends signed-out users to /login, and users without the right role to their home page.
export default function RequireAuth({ roles, children }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'reporter' ? '/upload' : '/dashboard'} replace />;
  return children;
}
