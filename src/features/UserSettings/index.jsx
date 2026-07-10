import { User, KeyRound, Shield, LogOut, Trash2, MessageSquareX, Link } from "lucide-react";
import { useState, useEffect } from "react";
import useUserStore from "../../store/useUserStore";
import SettingsCard from "./components/SettingsCard";

const UserSettings = () => {
  const profile = useUserStore((state) => state.profile);
  const setProfile = useUserStore((state) => state.setProfile);
  const [myPublicKeyHex, setMyPublicKeyHex] = useState("");

  useEffect(() => {
    if (window.connection) {
      window.connection.getPublicKey().then(key => {
        setMyPublicKeyHex(key);
      });
    }
  }, []);

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center bg-background text-text">
        <div className="animate-pulse">Loading Profile...</div>
      </div>
    );
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newProfile = { ...profile, avatar: reader.result };
        await window.store.setProfile(newProfile);
        setProfile(newProfile);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    if (
      window.confirm(
        "Are you sure you want to log out? Make sure you have saved your recovery phrase!",
      )
    ) {
      await window.store.setProfile(null);
      setProfile(null);
      window.location.reload();
    }
  };

  const handleResetProfile = async () => {
    if (
      window.confirm(
        "Are you sure you want to completely reset your profile? This will erase all local data including your identity and message history. This cannot be undone! Make sure you have saved your recovery phrase if you plan to restore your profile later.",
      )
    ) {
      await window.store.resetProfile();
      setProfile(null);
      window.location.reload();
    }
  };

  const handleClearChats = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear all your chats? This will erase all your messages and connections, but KEEP your identity and profile. The app will restart after this.",
      )
    ) {
      await window.store.clearChatData();
      window.location.reload();
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto pb-6">
      <div className="flex items-center gap-4 border-b border-secondary/30 p-4">
        <div
          className="relative group cursor-pointer shrink-0"
          onClick={() =>
            document.getElementById("settings-avatar-upload")?.click()
          }
        >
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/50"
            />
          ) : (
            <div className="p-4 bg-primary/10 rounded-full text-primary w-16 h-16 flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-white font-medium">Edit</span>
          </div>
          <input
            id="settings-avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text">User Settings</h1>
          <p className="text-secondary text-sm mt-1">
            Manage your identity and recovery information
          </p>
        </div>
      </div>

      {/* Profile Name */}
      <SettingsCard icon={User} title="Display Name">
        <p className="font-medium text-lg text-text">{profile.name}</p>
      </SettingsCard>

      {/* Public Key (Peer Link) */}
      <SettingsCard
        icon={Link}
        title="Public Key (Peer Link)"
        iconColor="text-emerald-500"
        hoverColor="hover:border-emerald-500/50"
        copyText={myPublicKeyHex ? `peer:${myPublicKeyHex}` : ""}
      >
        <div className="font-mono text-sm break-all text-secondary">
          {myPublicKeyHex ? `peer:${myPublicKeyHex}` : "Loading..."}
        </div>
      </SettingsCard>

      {/* Seed Hex */}
      <SettingsCard
        icon={KeyRound}
        title="Identity Key (Seed Hex)"
        iconColor="text-accent"
        hoverColor="hover:border-accent/50"
        copyText={profile?.seedHex}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-3 p-3 bg-accent/10 border border-accent/20 rounded-md text-accent text-xs">
            <span>⚠️</span>
            <p><strong>PRIVATE KEY:</strong> Do not share this with anyone! This is your secret identity seed. Share your Public Key instead.</p>
          </div>
          <div className="font-mono text-sm break-all text-secondary">
            {profile.seedHex}
          </div>
        </div>
      </SettingsCard>

      {/* Mnemonic Phrase */}
      <SettingsCard
        icon={Shield}
        title="Recovery Phrase"
        iconColor="text-accent"
        hoverColor="hover:border-accent/50"
        copyText={profile?.mnemonic}
        isSecret={true}
      >
        <div className="font-mono text-sm leading-loose text-secondary">
          {profile.mnemonic}
        </div>
      </SettingsCard>

      {/* Logout Button */}
      <div className="mt-4 pt-4 border-t border-secondary/30 flex flex-col gap-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/10 text-text hover:bg-secondary/20 transition-colors w-full justify-center font-medium border border-secondary/20 hover:border-secondary/40"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
        
        <button
          onClick={handleClearChats}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors w-full justify-center font-medium border border-amber-500/20 hover:border-amber-500/40"
        >
          <MessageSquareX className="w-5 h-5" />
          Clear Chats & Connections (Keep Profile)
        </button>

        <button
          onClick={handleResetProfile}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors w-full justify-center font-medium border border-red-500/20 hover:border-red-500/40"
        >
          <Trash2 className="w-5 h-5" />
          Factory Reset (Erase Everything)
        </button>
      </div>
    </div>
  );
};

export default UserSettings;
