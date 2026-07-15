import { Shield } from "lucide-react";
import { Button } from "@/components/Button";
import { useNavigate } from "react-router";

export const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="p-6 sm:p-10 bg-card text-card-foreground rounded-2xl shadow-xl border border-border w-full max-w-md">
        <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-6 flex items-center justify-center">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-3xl font-extrabold mb-2 text-center text-primary">Login</h2>
        <p className="text-muted-foreground mb-8 text-sm text-center">
          This page is under construction. We are focusing on account creation first!
        </p>
        <div className="mt-8 flex flex-col gap-2 text-center">
          <Button type="button" variant="ghost" onClick={() => navigate("/signup")}>
            Back to Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};
