import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import API from "../utils/apiCall";
import { toast } from "react-toastify";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/login/send-otp", {
        email,
        password,
      });

      toast.success(res.data.message || "OTP sent successfully");
      setOtpSent(true);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyLogin = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/login", {
        email,
        password,
        otp,
      });

      const data = res.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);

      toast.success(data.message || "Login successful");

      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-6xl w-full mx-4">
        <div className="grid md:grid-cols-2 gap-0 bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Left Section - Welcome */}

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12 text-white min-h-[600px] flex flex-col">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
                <span className="text-xl font-bold">OomsAdmin</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Welcome to OomsAdmin
              </h1>
              
              <p className="text-blue-100 text-base md:text-lg mb-8">
                Streamline your admin management with our secure, modern platform. 
                Experience the future of admin panel control.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {[
                "🔒 End-to-end encryption",
                "📡 Real-time updates",
                "🔄 Multi-device sync",
                "✨ Intuitive interface",
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-blue-50">
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8 border-t border-white/20">
              <p className="text-sm text-blue-200 flex items-center gap-2">
                <span>🔒</span> 256-bit encrypted connection
              </p>
            </div>
          </div>

          {/* Right Section - Login Form */}
          <div className="p-8 md:p-12 min-h-[600px] flex flex-col">
            {/* Icon at the top of form */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Admin Login
              </h2>
              <p className="text-gray-600 text-sm">
                Access your admin account securely
              </p>
            </div>

            {!otpSent ? (
              <form onSubmit={sendOtp} className="flex-1">
                <div className="mb-4">
                  <input
                    type="email"
                    placeholder="Email address"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-6">
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending OTP...
                    </div>
                  ) : (
                    "Request OTP"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyLogin} className="flex-1">
                <div className="mb-6">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    "Verify & Login"
                  )}
                </Button>

                <button
                  type="button"
                  className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  onClick={sendOtp}
                >
                  Resend OTP
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => toast.info("Contact admin to create account")}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Contact Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;