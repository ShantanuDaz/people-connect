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

  useEffect(() => {
    // Check if profile exists locally
    const loadProfile = async () => {
      try {
        const profile = await window.api.profile.get();
        if (profile) {
          setUser(profile);
          navigate("/", { replace: true });
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
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

    try {
      // Convert the 24-word mnemonic back into the 256-bit (32-byte) hex string seed
      const seedHex = bip39.mnemonicToEntropy(cleanMnemonic);

      const profile = await window.api.profile.save(seedHex, name, cleanMnemonic);
      if (profile && profile.keyPair) {
        setUser(profile);
        navigate("/", { replace: true });
      } else if (profile?.error) {
        setError(profile.error);
      }
    } catch (err) {
      setError(err.message || "Failed to save profile");
      console.log(err.message);
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
            <SignUpPhraseStep onSubmit={handleFinalSubmit} />
          </form>
        )}

        {mode === "signin" && (
          <form onSubmit={handleFinalSubmit}>
            <SignInForm onSubmit={handleFinalSubmit} />
          </form>
        )}

        <div className="mt-8 text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          >
            {mode === "signup"
              ? "Already have an account? Import it."
              : "Don't have an account? Create one."}
          </Button>
        </div>
      </div>
    </div>
  );
};
