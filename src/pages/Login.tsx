import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

type OtpStep = { otp_challenge_id: string; email: string } | null;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState<OtpStep>(null);
  const [otpCode, setOtpCode] = useState("");
  const { login, verifyLoginOtp, isAuthenticated } = useAuth();
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
      const result = await login(email, password);
      if (result.kind === "otp_required") {
        setOtpStep({ otp_challenge_id: result.otp_challenge_id, email: result.email });
        toast.success("We sent a verification code to your email.");
      } else {
        toast.success("Welcome back!");
        navigate("/admin");
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || "Login failed. Please check your credentials.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpStep) return;
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await verifyLoginOtp(otpStep.otp_challenge_id, otpCode);
      toast.success("Welcome back!");
      navigate("/admin");
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.detail || "Verification failed.";
      setErrorMessage(message);
      toast.error(message);
      if (status === 429) {
        setOtpStep(null);
        setOtpCode("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cancelOtp = () => {
    setOtpStep(null);
    setOtpCode("");
    setErrorMessage(null);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-4 py-10 text-slate-800">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(16,185,129,0.18), transparent 40%), radial-gradient(circle at 85% 80%, rgba(56,189,248,0.18), transparent 40%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-60"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)",
          backgroundSize: "3rem 3rem",
          maskImage: "radial-gradient(circle at center, black 55%, transparent 100%)",
        }}
      />

      <Card className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_24px_70px_rgba(16,185,129,0.15)] backdrop-blur-xl">
        <CardHeader className="space-y-5 pb-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            VisiChek
          </div>
          <div className="space-y-2">
            <CardTitle className="font-display text-[clamp(2rem,1.7rem+1vw,2.6rem)] font-semibold tracking-tight text-slate-900">
              Welcome back 👋
            </CardTitle>
            <CardDescription className="max-w-sm text-sm leading-6 text-slate-500">
              Sign in to manage editorial content, media assets, and homepage placements from the VisiChek publishing desk.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {otpStep ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                We emailed a 6-digit verification code to <b>{otpStep.email}</b>. It expires in 10 minutes.
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-slate-700">Verification code</Label>
                <div className="group relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-500" />
                  <Input
                    id="otp"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    required
                    className="h-12 rounded-2xl border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-400/60 tracking-[0.3em]"
                  />
                </div>
              </div>
              <Button type="submit" className="h-12 w-full rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600" disabled={isLoading || otpCode.length !== 6}>
                {isLoading ? "Verifying..." : "Verify and sign in"}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </Button>
              <button type="button" onClick={cancelOtp} className="text-xs text-slate-500 hover:text-slate-700">
                Use a different account
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                Email
              </Label>
              <div className="group relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@visichek.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-2xl border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-400/60"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">
                Password
              </Label>
              <div className="group relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-2xl border-slate-200 bg-white pl-10 pr-11 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-400/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-12 w-full rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Need access to the publishing workspace?</span>
            <button type="button" className="font-medium text-emerald-600 transition-colors hover:text-emerald-700">
              Contact support
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
