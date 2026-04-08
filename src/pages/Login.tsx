import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import SilkBackground from "@/components/backgrounds/SilkBackground";
import { FluidGlassButton } from "@/components/ui/fluid-glass-button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/admin");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <SilkBackground speed={5} scale={1} color="#7B7481" noiseIntensity={1.5} rotation={0} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.76),transparent_34%),linear-gradient(180deg,rgba(241,245,242,0.24),rgba(243,244,246,0.56))]" />

      <Card className="glass-panel-strong relative z-10 w-full max-w-md rounded-[1.75rem] border-white/70">
        <CardHeader className="space-y-4 pb-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/80 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            VisiChek
          </div>
          <div className="space-y-2">
            <CardTitle className="text-[clamp(1.9rem,1.5rem+1vw,2.5rem)] font-semibold tracking-[-0.03em] text-slate-900">
              VisiChek Admin
            </CardTitle>
            <CardDescription className="max-w-sm text-sm leading-6 text-slate-600">
              Sign in to manage visitor operations content, media assets, and security-facing updates.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@visicheck.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-2xl border-white/70 bg-white/65 backdrop-blur-md placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-2xl border-white/70 bg-white/65 backdrop-blur-md"
              />
            </div>
            <FluidGlassButton type="submit" className="w-full rounded-2xl" size="lg" glow disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </FluidGlassButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
