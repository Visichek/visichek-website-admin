import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || "/admin";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/admin");
    } catch (error: any) {
      const message = error.response?.data?.detail || "Login failed. Please check your credentials.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] px-4 py-10 text-zinc-100">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 18% 18%, rgba(22,163,74,0.18), transparent 24%), radial-gradient(circle at 82% 80%, rgba(21,128,61,0.14), transparent 28%), #09090b",
        }}
      />
      <div
        className="absolute inset-0 opacity-70"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
          maskImage: "radial-gradient(circle at center, black 52%, transparent 100%)",
        }}
      />

      <Card className="relative z-10 w-full max-w-md rounded-[2rem] border border-zinc-800 bg-zinc-950/70 shadow-[0_32px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <CardHeader className="space-y-5 pb-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            VisiChek
          </div>
          <div className="space-y-2">
            <CardTitle className="font-display text-[clamp(2rem,1.7rem+1vw,2.6rem)] font-semibold tracking-tight text-white">
              Blog Administration
            </CardTitle>
            <CardDescription className="max-w-sm text-sm leading-6 text-zinc-400">
              Sign in to manage editorial content, media assets, and homepage placements from the VisiChek publishing desk.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {errorMessage && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">
                Email
              </Label>
              <div className="group relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-emerald-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@visichek.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-2xl border-zinc-800 bg-zinc-900/70 pl-10 text-zinc-50 placeholder:text-zinc-500 focus-visible:ring-emerald-500/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">
                Password
              </Label>
              <div className="group relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-emerald-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-2xl border-zinc-800 bg-zinc-900/70 pl-10 pr-11 text-zinc-50 placeholder:text-zinc-500 focus-visible:ring-emerald-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-12 w-full rounded-2xl bg-emerald-500 text-zinc-950 hover:bg-emerald-400" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Need access to the publishing workspace?</span>
            <button type="button" className="font-medium text-emerald-300 transition-colors hover:text-emerald-200">
              Contact support
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
