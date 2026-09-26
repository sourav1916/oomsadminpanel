import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Smartphone, KeyRound, Sun, Moon } from "lucide-react";
import Button from "../components/common/Button";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { toast } from "react-toastify";

const COUNTRY_CODE = "+91";

const Login = () => {
  const navigate = useNavigate();
  const { sendOtp: sendOtpRequest, login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const normalizeMobile = (value) => String(value || "").replace(/\D/g, "").slice(-10);

  const sendOtp = async (e) => {
    e?.preventDefault?.();

    const normalizedMobile = normalizeMobile(mobile);
    if (!/^\d{10}$/.test(normalizedMobile)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      setLoading(true);
      const data = await sendOtpRequest(normalizedMobile, COUNTRY_CODE);
      toast.success(data.message || "OTP sent to your mobile number");
      setOtpSent(true);
    } catch (error) {
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyLogin = async (e) => {
    e.preventDefault();

    const normalizedMobile = normalizeMobile(mobile);
    if (!/^\d{10}$/.test(normalizedMobile)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      const data = await login(normalizedMobile, otp, COUNTRY_CODE);
      toast.success(data.message || "Login successful");
      navigate("/");
    } catch (error) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-admin-bg">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden overflow-hidden border-r border-slate-800 bg-slate-950 lg:flex lg:flex-col lg:justify-between p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.16),_transparent_42%)]" />
          <div className="relative">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">OOMS Admin</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Control panel</p>
              </div>
            </div>
            <h1 className="mt-16 max-w-md text-4xl font-semibold leading-tight text-white">
              Platform administration for OOMS tenants.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              Manage users, branches, the service catalog, and company mail from a dedicated operator console.
            </p>
          </div>
          <ul className="relative space-y-3 text-sm text-slate-400">
            {[
              "OTP-secured operator access",
              "Directory of users and branches",
              "Service catalog and SMTP controls",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-center bg-admin-bg px-4 py-12">
          <button
            type="button"
            onClick={toggleTheme}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-admin-muted transition-colors hover:bg-admin-raised hover:text-admin-text"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div className="admin-panel w-full max-w-md p-8">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white">
                <Shield className="h-4 w-4" />
              </div>
              <p className="text-lg font-semibold text-admin-text">OOMS Admin</p>
            </div>

            <h2 className="text-xl font-bold text-admin-text">Sign in</h2>
            <p className="mt-1 text-sm text-admin-text-sub">
              Use the registered admin mobile number. A one-time code will be sent.
            </p>

            {!otpSent ? (
              <form onSubmit={sendOtp} className="mt-8">
                <label className="admin-label">
                  Mobile number
                </label>
                <div className="relative mb-6">
                  <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    className="admin-input pl-10"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-lg bg-teal-600 py-2.5 font-semibold text-white hover:bg-teal-700"
                  disabled={loading}
                >
                  {loading ? "Sending OTP…" : "Request OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyLogin} className="mt-8">
                <label className="admin-label">
                  One-time code
                </label>
                <div className="relative mb-2">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    className="admin-input pl-10 text-center font-mono text-xl tracking-[0.4em]"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    autoFocus
                  />
                </div>
                <p className="mb-6 text-center text-xs text-admin-muted">
                  Sent to +91 {normalizeMobile(mobile)}
                </p>
                <Button
                  type="submit"
                  className="w-full rounded-lg bg-teal-600 py-2.5 font-semibold text-white hover:bg-teal-700"
                  disabled={loading}
                >
                  {loading ? "Verifying…" : "Verify and continue"}
                </Button>
                <button
                  type="button"
                  className="mt-3 w-full text-sm font-medium text-admin-accent-text hover:underline disabled:opacity-50"
                  onClick={sendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </button>
                <button
                  type="button"
                  className="mt-2 w-full text-sm text-admin-muted hover:text-admin-text-sub"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                  }}
                >
                  Change mobile number
                </button>
              </form>
            )}

            <div className="mt-8 flex items-center gap-2 border-t border-admin-border pt-4 text-xs text-admin-muted">
              <Lock className="h-3.5 w-3.5" />
              Restricted to authorized platform operators.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
