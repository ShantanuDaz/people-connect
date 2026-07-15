import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import { useUserStore } from "../../../stores/useUserStore";

export const GuestWrapper = () => {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const bootCheck = async () => {
      // If user is already loaded in store, no need to check, just stop loading.
      if (user) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const response = await window.api.account.get();
        if (response && response.success && response.user && isMounted) {
          setUser(response.user);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    bootCheck();

    return () => {
      isMounted = false;
    };
  }, [user, setUser]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="animate-pulse text-xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  // If we have a user after the check, kick them to the main app
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Otherwise, let them see the auth routes
  return <Outlet />;
};
