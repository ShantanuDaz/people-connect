import { useState, useEffect } from "react";
import ProfileSetup from "./features/identity/components/ProfileSetup";
import ImportProfile from "./features/identity/components/ImportProfile";
import ConnectionLayout from "./features/chat/components/ConnectionLayout";
import AppLayout from "./features/app";
import useUserStore from "./store/useUserStore";

export default function App() {
  const profile = useUserStore((state) => state.profile);
  const setProfile = useUserStore((state) => state.setProfile);
  const [view, setView] = useState("loading"); // 'loading', 'setup', 'import', 'chat'

  useEffect(() => {
    const init = async () => {
      try {
        const storedProfile = await window.store.getProfile();
        if (storedProfile && storedProfile.seedHex && storedProfile.name) {
          setProfile(storedProfile);
          await window.connection.start({
            seedHex: storedProfile.seedHex,
            name: storedProfile.name,
          });
          setView("chat");
        } else {
          setView("setup");
        }
      } catch (err) {
        console.error("Failed to load profile", err);
        setView("setup");
      }
    };

    // Slight delay to avoid flash of loading text
    setTimeout(init, 100);
  }, []);

  const handleProfileComplete = async (newProfile) => {
    setProfile(newProfile);
    await window.connection.start({
      seedHex: newProfile.seedHex,
      name: newProfile.name,
    });
    setView("chat");
  };

  const handleLogout = async () => {
    await window.store.setProfile(null);
    setProfile(null);
    setView("setup");
    // A full reload might be needed to kill the worker properly,
    // but since we prevented spawning worker twice, we can just reload the window
    window.location.reload();
  };

  if (view === "loading") {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="animate-pulse">Loading Identity...</div>
      </div>
    );
  }

  if (view === "setup") {
    return (
      <ProfileSetup
        onComplete={handleProfileComplete}
        onNavigateImport={() => setView("import")}
      />
    );
  }

  if (view === "import") {
    return (
      <ImportProfile
        onComplete={handleProfileComplete}
        onNavigateSetup={() => setView("setup")}
      />
    );
  }

  return <AppLayout />;
}
