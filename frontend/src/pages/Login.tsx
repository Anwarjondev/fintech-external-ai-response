import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, isBankAdmin } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/index";
import type { ApiError } from "@/types";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    const next: Record<string, string> = {};

    if (!phone.trim()) next.phone = "Phone required.";
    if (!password) next.password = "Password required.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const user = await login({ phone: phone.trim(), password });
      // Role-based redirect
      if (isBankAdmin(user)) {
        navigate("/bank/dashboard", { replace: true });
      } else {
        navigate("/government/submit", { replace: true });
      }
    } catch (err) {
      setFormError((err as ApiError).message || "Sign in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-100">Sign in</h1>
          <p className="mt-2 text-sm text-subtle">
            Enter your credentials to access the portal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Phone"
            type="tel"
            autoComplete="tel"
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            disabled={submitting}
          />

          <Input
            label="Password"
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            disabled={submitting}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="text-xs text-subtle hover:text-white"
                tabIndex={-1}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            }
          />

          {formError && (
            <div className="rounded-lg bg-[#451a1a]/60 border border-[#652a2a] px-3 py-2 text-sm text-danger">
              {formError}
            </div>
          )}

          <Button type="submit" size="lg" fullWidth loading={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
