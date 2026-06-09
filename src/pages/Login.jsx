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
    } finally {
      setLoading(false);
    }
  };

  const verifyLogin = async (e) => {
    e.preventDefault();

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Admin Login
        </h2>

        {!otpSent ? (
          <form onSubmit={sendOtp}>
            <div className="mb-4">
              <label className="block mb-2">Email</label>

              <input
                type="email"
                className="w-full px-3 py-2 border rounded-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-6">
              <label className="block mb-2">Password</label>

              <input
                type="password"
                className="w-full px-3 py-2 border rounded-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyLogin}>
            <div className="mb-4">
              <label className="block mb-2">OTP</label>

              <input
                type="text"
                maxLength={6}
                className="w-full px-3 py-2 border rounded-lg"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Login"}
            </Button>

            <button
              type="button"
              className="w-full mt-3 text-blue-600"
              onClick={sendOtp}
            >
              Resend OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;