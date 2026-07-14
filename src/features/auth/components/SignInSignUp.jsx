import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router";
import { useUserStore } from "@/stores/useUserStore";
import { useAuthStore } from "@/features/auth/stores/useAuthStore";
import * as bip39 from "bip39";
import { Shield } from "lucide-react";
import { Button } from "@/components/Button";

import { SignUpNameStep } from "./signupin/SignUpNameStep";
import { SignUpPhraseStep } from "./signupin/SignUpPhraseStep";
import { SignInForm } from "./signupin/SignInForm";
import { ClientPairingUI } from "./pairing/ClientPairingUI";

export const SignInSignUp = () => {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const navigate = useNavigate();

  const {
    mode,
    signupStep,
    name,
    mnemonic,
    error,
    setError,
    setMode,
    initializeSignup,
  } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    // Check if worker auto-booted via Local Config
    const bootCheck = async () => {
      try {
        const status = await window.api.identity.getStatus();
        if (status.success && !status.isLoggedOut) {
          // Worker successfully loaded keys and started Autobase!
          const profile = await window.api.profile.get();
          if (profile) {
            setUser({ 
              ...profile, 
              accountId: status.config.bootstrapKeyHex,
              publicKeyHex: status.config.bootstrapKeyHex,
              seedHex: status.config.mnemonicSeedHex 
            });
            navigate("/", { replace: true });
          }
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    bootCheck();
  }, [setUser, navigate]);

  useEffect(() => {
    initializeSignup();
  }, [initializeSignup]);

  if (user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="animate-pulse text-xl font-bold">Loading...</div>
      </div>
    );
  }

  const handleFinalSubmit = async (e) => {
    if (e) e.preventDefault();
    if (submitLoading) return;
    
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    const cleanMnemonic = mnemonic.trim().toLowerCase();

    if (!cleanMnemonic) {
      setError("Recovery phrase is required");
      return;
    }

    const words = cleanMnemonic.split(/\s+/);
    if (words.length !== 24) {
      setError(`Recovery phrase must be exactly 24 words (you entered ${words.length}).`);
      return;
    }

    if (!bip39.validateMnemonic(cleanMnemonic)) {
      setError("Invalid recovery phrase. Please check for typos.");
      return;
    }

    setSubmitLoading(true);

    try {
      // Convert mnemonic to seed hex
      const seedHex = bip39.mnemonicToEntropy(cleanMnemonic);

      let accountId;
      if (mode === "signup") {
        // 1. Create Identity Account in Worker Corestore
        const createRes = await window.api.identity.createAccount(seedHex, name);
        if (createRes.error) throw new Error(createRes.error);
        accountId = createRes.accountId;

        // 2. Start the Autobase Runtime
        const runtimeRes = await window.api.identity.startRuntime(accountId, createRes.deviceKey);
        if (runtimeRes.error || runtimeRes.isLoggedOut) throw new Error("Failed to start Identity Runtime: " + (runtimeRes.error || "Device is logged out."));
      } else {
        const recoveryRes = await window.api.identity.processRecovery(seedHex);
        if (recoveryRes.error) throw new Error(recoveryRes.error);
        accountId = recoveryRes.accountId;
      }

      // 3. Save profile data to the Public P2P ledger
      const profile = await window.api.profile.save(name, name); 
      if (profile && !profile.error) {
        setUser({ 
          ...profile, 
          accountId,
          publicKeyHex: accountId,
          seedHex 
        });
        navigate("/", { replace: true });
      } else if (profile?.error) {
        setError(profile.error);
      }
    } catch (err) {
      setError(err.message || "Failed to save profile");
      console.log(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePairSuccess = async (message) => {
    try {
      setLoading(true);
      
      if (message && message.bootstrapKeyHex && message.deviceKeyHex) {
        const runtimeRes = await window.api.identity.startRuntime(message.bootstrapKeyHex, message.deviceKeyHex);
        if (runtimeRes.error) throw new Error(runtimeRes.error);
        
        // Join global swarm so we can sync the OP_ADD_WRITER
        await window.api.network.joinSwarm();
        // Wait for sync
        await new Promise(r => setTimeout(r, 1500));
      } else {
        setError(`Missing keys in message: ${JSON.stringify(message)}`);
        setLoading(false);
        return;
      }

      const status = await window.api.identity.getStatus();
      if (status.success && !status.isLoggedOut) {
        const profile = await window.api.profile.get();
        if (profile && profile.name) {
          useUserStore.getState().setUser({ 
            ...profile, 
            accountId: status.config.bootstrapKeyHex,
            publicKeyHex: status.config.bootstrapKeyHex,
            seedHex: status.config.mnemonicSeedHex 
          });
          useAuthStore.getState().login();
          navigate("/home", { replace: true });
        } else {
          // If profile fetch fails, assume missing profile but logged in
          useAuthStore.getState().login();
          navigate("/profile/edit", { replace: true });
        }
      } else {
        setError(`Identity status not logged in after pairing. Debug: ${JSON.stringify(status.debug)}`);
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to load profile after pairing", err);
      setError(`Failed to boot after pairing: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div
        className={`p-6 sm:p-10 bg-card text-card-foreground rounded-2xl shadow-xl border border-border w-full transition-all duration-500 ease-in-out ${
          mode === "signup" && signupStep === 2 ? "max-w-2xl" : "max-w-md"
        }`}
      >
        <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-6 flex items-center justify-center">
          <Shield className="h-8 w-8 text-primary" />
        </div>

        <h2 className="text-3xl font-extrabold mb-2 text-center text-primary">
          People Connect
        </h2>
        <p className="text-muted-foreground mb-8 text-sm text-center">
          {mode === "signup"
            ? "Create your decentralized profile."
            : "Import your existing profile."}
        </p>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm font-semibold p-3 rounded-lg mb-6 border border-destructive/20 text-center">
            {error}
          </div>
        )}

        {mode === "signup" && signupStep === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <SignUpNameStep />
          </form>
        )}

        {mode === "signup" && signupStep === 2 && (
          <form onSubmit={handleFinalSubmit}>
            <SignUpPhraseStep onSubmit={handleFinalSubmit} loading={submitLoading} />
          </form>
        )}

        {mode === "signin" && (
          <form onSubmit={handleFinalSubmit}>
            <SignInForm onSubmit={handleFinalSubmit} loading={submitLoading} />
          </form>
        )}

        {mode === "pair" && (
          <ClientPairingUI 
            onPairSuccess={handlePairSuccess}
            onCancel={() => setMode("signup")}
          />
        )}

        {mode !== "pair" && (
          <div className="mt-8 flex flex-col gap-2 text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            >
              {mode === "signup"
                ? "Already have an account? Recover via Seed."
                : "Don't have an account? Create one."}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-xs"
              onClick={() => setMode("pair")}
            >
              Link an existing device via Link
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

