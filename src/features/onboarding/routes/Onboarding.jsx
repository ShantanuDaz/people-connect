import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useOnboardingStore } from "../stores/useOnboardingStore";
import { Shield, ArrowRight } from "lucide-react";

import { BasicInfoStep } from "../components/BasicInfoStep";
import { ProfilePicStep } from "../components/ProfilePicStep";
import { CryptoSeedStep } from "../components/CryptoSeedStep";

export const Onboarding = () => {
  const {
    step,
    error,
  } = useOnboardingStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div
        className={`p-6 sm:p-10 bg-card text-card-foreground rounded-2xl shadow-xl border border-border w-full transition-all duration-500 ease-in-out ${
          step === 3 ? "max-w-2xl" : "max-w-md"
        }`}
      >
        <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-6 flex items-center justify-center">
          <Shield className="h-8 w-8 text-primary" />
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-2 rounded-full transition-all duration-500 ${
                step >= s ? "bg-primary w-8" : "bg-primary/20 w-4"
              }`}
            />
          ))}
        </div>

        <h2 className="text-3xl font-extrabold mb-2 text-center text-primary">
          {step === 1 && "Let's set up your profile"}
          {step === 2 && "Express yourself"}
          {step === 3 && "Claim your identity"}
        </h2>
        <p className="text-muted-foreground mb-8 text-sm text-center">
          Step {step} of 3
        </p>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm font-semibold p-3 rounded-lg mb-6 border border-destructive/20 text-center animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {step === 1 && <BasicInfoStep />}
        {step === 2 && <ProfilePicStep />}
        {step === 3 && <CryptoSeedStep />}
        
        {step !== 3 && (
          <div className="mt-8 flex justify-center text-center">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              onClick={() => navigate("/login")}
            >
              Already have an account? Login <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
