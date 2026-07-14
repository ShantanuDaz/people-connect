import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useUserStore } from '../../../stores/useUserStore';

export const AuthWrapper = () => {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    // If the user is logged in but missing the secure keys (e.g. older session or hydration gap),
    // fetch them silently from the worker's secure local config.
    if (user && (!user.publicKeyHex || !user.seedHex)) {
      window.api.identity.getStatus().then(status => {
        if (status.success && !status.isLoggedOut) {
          setUser({
            ...user,
            accountId: status.config.bootstrapKeyHex,
            publicKeyHex: status.config.bootstrapKeyHex,
            seedHex: status.config.mnemonicSeedHex
          });
        }
      }).catch(console.error);
    }
  }, [user, setUser]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
