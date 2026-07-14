import { Settings, User, Key, Shield, Eye, EyeOff, Smartphone } from "lucide-react";
import { useUserStore } from "../../stores/useUserStore";
import * as bip39 from "bip39";
import { useState } from "react";
import { useNavigate } from "react-router";
import { HostPairingUI } from "../auth/components/pairing/HostPairingUI";

export function UserSettings() {
  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const navigate = useNavigate();

  const mnemonic = user?.mnemonic || (user?.seedHex ? bip39.entropyToMnemonic(user.seedHex) : "");

  const handleSignOut = async () => {
    try {
      await window.api.profile.clear();
      await window.api.identity.clearConfig();
      clearUser();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  if (isPairing) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-background p-4 overflow-y-auto">
        <div className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col items-center max-w-lg w-full gap-6">
          <div className="bg-primary/10 p-4 rounded-full">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Add a Device</h2>
          <div className="w-full">
            <HostPairingUI 
              onCancel={() => setIsPairing(false)} 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-background p-4 overflow-y-auto">
      <div className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col items-center max-w-2xl w-full gap-6">
        <div className="bg-primary/10 p-4 rounded-full">
          <Settings className="w-8 h-8 text-primary" />
        </div>
        
        <h2 className="text-2xl font-semibold text-foreground">User Profile</h2>
        
        <div className="w-full flex flex-col gap-4">
          <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl border border-border">
            <User className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="font-medium text-foreground truncate">{user?.name || "Guest"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl border border-border">
            <Key className="w-5 h-5 text-muted-foreground shrink-0" />
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-sm text-muted-foreground">Public Key</span>
              <span className="font-mono text-xs text-foreground truncate">{user?.publicKeyHex || "N/A"}</span>
            </div>
          </div>

          {mnemonic && (
            <div className="flex flex-col gap-3 p-4 bg-secondary/50 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">Recovery Phrase</span>
                </div>
                <button
                  onClick={() => setShowMnemonic(!showMnemonic)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                  {showMnemonic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {showMnemonic ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                  {mnemonic.split(" ").map((word, i) => (
                    <div key={i} className="flex items-center gap-2 bg-background p-2 rounded border border-border">
                      <span className="text-xs text-muted-foreground select-none w-4">{i + 1}.</span>
                      <span className="font-medium text-sm text-foreground select-all">{word}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm font-medium text-muted-foreground mt-2 flex items-center justify-center py-4 bg-background rounded border border-border border-dashed">
                  Click the eye icon to reveal your 24-word recovery phrase
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={() => setIsPairing(true)}
            className="w-full py-3 px-4 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-medium rounded-xl transition-all cursor-pointer border border-primary/20 mt-4"
          >
            Add a New Device
          </button>
          
          <button 
            onClick={handleSignOut}
            className="w-full py-3 px-4 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground font-medium rounded-xl transition-all cursor-pointer border border-destructive/20 mt-2"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
