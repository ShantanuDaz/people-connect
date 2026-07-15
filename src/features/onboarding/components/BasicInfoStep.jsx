import { useOnboardingStore } from "../stores/useOnboardingStore";
import { Button } from "@/components/Button";
import { User, Calendar, Users } from "lucide-react";

export const BasicInfoStep = () => {
  const { name, setName, age, setAge, gender, setGender, setStep, setError } =
    useOnboardingStore();

  const handleNext = () => {
    if (!name.trim()) {
      setError("We need a name to call you!");
      setTimeout(() => setError(""), 2000);
      return;
    }
    if (!age || parseInt(age) <= 0) {
      setError("Please let us know your age");
      setTimeout(() => setError(""), 2000);
      return;
    }
    setError("");
    setStep(2);
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4 w-full">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="What should people call you?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-muted-foreground"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="number"
              placeholder="Age (e.g. 25)"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-muted-foreground"
            />
          </div>

          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all appearance-none text-foreground"
            >
              <option value="" disabled>Pronouns / Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-Binary">Non-Binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={handleNext} className="w-full sm:w-auto px-8">
          Continue
        </Button>
      </div>
    </div>
  );
};
