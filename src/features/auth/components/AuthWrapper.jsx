import { Navigate, Outlet } from 'react-router';
import { useUserStore } from '../../../stores/useUserStore';

export const AuthWrapper = () => {
  const user = useUserStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
