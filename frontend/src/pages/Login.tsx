import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (isRegistering) {
        await register(email, password);
        toast({
          title: "Welcome to AuraHR!",
          description:
            "Your account has been created and you're now logged in.",
        });
      } else {
        await login(email, password);
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
      }
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: isRegistering ? "Registration failed" : "Login failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Demo user credentials for testing
  const demoUsers = [
    { email: "recruiter@example.com", password: "recruiter123", role: "Recruiter" },
    { email: "admin@aurahr.com", password: "admin123", role: "Admin" },
    { email: "manager@example.com", password: "manager123", role: "Manager" },
    { email: "employee@example.com", password: "employee123", role: "Employee" },
  ];

  const quickLogin = async (userIndex: number) => {
    const user = demoUsers[userIndex];
    setEmail(user.email);
    setPassword(user.password);
    clearError();

    try {
      await login(user.email, user.password);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.role}.`,
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>

      {/* Floating elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-slow"></div>
      <div
        className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow"
        style={{ animationDelay: "1s" }}
      ></div>

      <Card
        className="w-full max-w-md glass relative animate-scale-in shadow-glow hover:shadow-2xl transition-all duration-300"
        role="main"
        aria-label="Login form"
      >
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow animate-float">
              <Sparkles className="h-8 w-8 text-white animate-pulse-slow" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold gradient-text animate-fade-in">
            AuraHR
          </CardTitle>
          <CardDescription
            className="animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Welcome to the AI-Powered HRMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 transition-all hover:scale-105 hover:shadow-glow"
              disabled={isLoading}
              aria-label={isRegistering ? "Register" : "Sign in"}
            >
              {isLoading
                ? isRegistering
                  ? "Creating Account..."
                  : "Signing in..."
                : isRegistering
                ? "Create Account"
                : "Sign In"}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => {
                setIsRegistering(!isRegistering);
                clearError();
              }}
              className="text-sm"
            >
              {isRegistering
                ? "Already have an account? Sign in"
                : "Don't have an account? Register"}
            </Button>
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-sm text-center text-muted-foreground">
              Demo Users (Click to sign in):
            </p>
            <div className="grid grid-cols-1 gap-2">
              {demoUsers.map((user, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={isLoading}
                  onClick={() => quickLogin(index)}
                  className="text-xs transition-all hover:scale-105"
                  aria-label={`Quick login as ${user.role}`}
                >
                  {user.role}: {user.email}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
