import { User, KeyRound, Shield } from "lucide-react";
import useUserStore from "../../store/useUserStore";
import SettingsCard from "./components/SettingsCard";

const UserSettings = () => {
  const profile = useUserStore((state) => state.profile);
  const setProfile = useUserStore((state) => state.setProfile);

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

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto pb-6">
      <div className="flex items-center gap-4 border-b border-secondary/30 p-4">
        <div 
          className="relative group cursor-pointer flex-shrink-0"
          onClick={() => document.getElementById('settings-avatar-upload')?.click()}
        >
          {profile.avatar ? (
            <img src={profile.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-primary/50" />
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

      {/* Seed Hex */}
      <SettingsCard
        icon={KeyRound}
        title="Identity Key (Seed Hex)"
        iconColor="text-accent"
        hoverColor="hover:border-accent/50"
        copyText={profile?.seedHex}
      >
        <div className="font-mono text-sm break-all text-secondary">
          {profile.seedHex}
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
    </div>
  );
};

export default UserSettings;
