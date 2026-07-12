import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { Button } from '@/components/Button';

export const SignUpNameStep = () => {
  const { name, setName, setSignupStep, setError } = useAuthStore();

  const handleContinue = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError("");
    setSignupStep(2);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-2">Display Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Satoshi"
          className="w-full bg-input/50 text-foreground border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          autoFocus
        />
      </div>

      <Button
        type="button"
        variant="primary"
        fullWidth
        className="mt-4"
        onClick={handleContinue}
      >
        <span>Continue</span>
      </Button>
    </div>
  );
};
