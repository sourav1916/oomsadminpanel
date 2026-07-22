import { createContext, useContext, useState, useEffect } from "react";
import apiCall from "../utils/apiCall";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      setUser(JSON.parse(userData));
    } else if (token && username) {
      // Fallback to create userData from username if user object doesn't exist
      const userData = { username };
      setUser(userData);
    }

    setLoading(false);
  }, []);

  const sendOtp = async (mobile, countryCode = "+91") => {
    const normalizedMobile = String(mobile || "").replace(/\D/g, "").slice(-10);
    const response = await apiCall("/auth/login/send-otp", "POST", {
      country_code: countryCode,
      mobile: normalizedMobile,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to send OTP");
    }

    return data;
  };

  const login = async (mobile, otp, countryCode = "+91") => {
    const normalizedMobile = String(mobile || "").replace(/\D/g, "").slice(-10);
    const response = await apiCall("/auth/login", "POST", {
      country_code: countryCode,
      mobile: normalizedMobile,
      otp,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Login failed");
    }

    const userData = {
      mobile: normalizedMobile,
      username: data.username || normalizedMobile,
    };

    localStorage.setItem("token", data.token);
    localStorage.setItem("username", userData.username);
    localStorage.setItem("user", JSON.stringify(userData));

    setUser(userData);

    return data;
  };

  const logout = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      // No token, just clean up locally
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("user");
      setUser(null);
      return;
    }

    try {
      const response = await apiCall("/auth/logout", "POST");

      if (!response.ok) {
        console.error("Logout API call failed with status:", response.status);
        // Continue with local cleanup even if API call fails
      }

      // Clear local storage and state
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("user");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear local data even if API call fails
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("user");
      setUser(null);
      
      // Optionally re-throw if you want to handle the error in the component
      // throw new Error("Failed to logout. Please try again.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sendOtp,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
