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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden overflow-hidden border-r border-slate-800 bg-slate-950 lg:flex lg:flex-col lg:justify-between p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,1),_transparent_40%)]" />
          <div className="relative">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-500 text-white">
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
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center justify-center bg-slate-100 px-4 py-12 dark:bg-slate-950">
          <button
            type="button"
            onClick={toggleTheme}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-sky-300">
                <Shield className="h-4 w-4" />
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">OOMS Admin</p>
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sign in</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Use the registered admin mobile number. A one-time code will be sent.
            </p>

            {!otpSent ? (
              <form onSubmit={sendOtp} className="mt-8">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mobile number
                </label>
                <div className="relative mb-6">
                  <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-md bg-slate-900 py-2.5 font-semibold text-white hover:bg-slate-800"
                  disabled={loading}
                >
                  {loading ? "Sending OTP…" : "Request OTP"}
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyLogin} className="mt-8">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  One-time code
                </label>
                <div className="relative mb-2">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    className="w-full rounded-md border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-center font-mono text-xl tracking-[0.4em] text-slate-800 outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    autoFocus
                  />
                </div>
                <p className="mb-6 text-center text-xs text-slate-500">
                  Sent to +91 {normalizeMobile(mobile)}
                </p>
                <Button
                  type="submit"
                  className="w-full rounded-md bg-slate-900 py-2.5 font-semibold text-white hover:bg-slate-800"
                  disabled={loading}
                >
                  {loading ? "Verifying…" : "Verify and continue"}
                </Button>
                <button
                  type="button"
                  className="mt-3 w-full text-sm font-medium text-sky-700 hover:underline disabled:opacity-50"
                  onClick={sendOtp}
                  disabled={loading}
                >
                  Resend OTP
                </button>
                <button
                  type="button"
                  className="mt-2 w-full text-sm text-slate-500 hover:text-slate-700"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                  }}
                >
                  Change mobile number
                </button>
              </form>
            )}

            <div className="mt-8 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
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
