import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldOff } from "lucide-react";

interface MfaSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Stage = "idle" | "awaiting_otp";

export function MfaSettingsDialog({ open, onOpenChange }: MfaSettingsDialogProps) {
  const { admin, refreshMe } = useAuth();
  const [stage, setStage] = useState<Stage>("idle");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setStage("idle");
      setChallengeId(null);
      setOtpCode("");
    }
  }, [open]);

  const mfaEnabled = !!admin?.mfa_enabled;

  const requestEnable = async () => {
    setLoading(true);
    try {
      const res = await adminApi.mfaEnableRequest();
      setChallengeId(res.data.otp_challenge_id);
      setStage("awaiting_otp");
      toast.success("Verification code sent to your email.");
    } catch (error: any) {
      const status = error.response?.status;
      const message =
        status === 409
          ? "MFA is already enabled."
          : error.response?.data?.detail || "Failed to request OTP.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const confirmEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId) return;
    setLoading(true);
    try {
      await adminApi.mfaEnableConfirm(challengeId, otpCode);
      await refreshMe();
      toast.success("Two-factor authentication enabled.");
      onOpenChange(false);
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.detail || "Verification failed.";
      toast.error(message);
      if (status === 429) {
        setStage("idle");
        setChallengeId(null);
        setOtpCode("");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await adminApi.mfaDisable();
      await refreshMe();
      toast.success("Two-factor authentication disabled.");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to disable MFA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mfaEnabled ? (
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            ) : (
              <ShieldOff className="h-5 w-5 text-slate-400" />
            )}
            Two-factor authentication
          </DialogTitle>
          <DialogDescription>
            {mfaEnabled
              ? "MFA is currently enabled. You'll receive an email code on each sign-in."
              : "Add an extra layer of security by requiring an email code on sign-in."}
          </DialogDescription>
        </DialogHeader>

        {mfaEnabled ? (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisable} disabled={loading}>
              {loading ? "Disabling..." : "Disable MFA"}
            </Button>
          </DialogFooter>
        ) : stage === "idle" ? (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={requestEnable} disabled={loading}>
              {loading ? "Sending..." : "Send verification code"}
            </Button>
          </DialogFooter>
        ) : (
          <form onSubmit={confirmEnable} className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              We emailed a 6-digit code to <b>{admin?.email}</b>. Enter it below to turn MFA on.
            </div>
            <div className="space-y-2">
              <Label htmlFor="mfa-otp">Verification code</Label>
              <Input
                id="mfa-otp"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                required
                className="tracking-[0.3em]"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || otpCode.length !== 6}>
                {loading ? "Verifying..." : "Enable MFA"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
