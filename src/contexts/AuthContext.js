import { createContext, useContext, useState, useEffect } from "react";
import API from "../utils/apiCall";

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
    const userData = localStorage.getItem("user");

    if (token && userData) {
      setUser(JSON.parse(userData));
    }

    setLoading(false);
  }, []);

  const sendOtp = async (email, password) => {
    const response = await API.post("/auth/login/send-otp", {
      email,
      password,
    });

    return response.data;
  };

  const login = async (email, password, otp) => {
    const response = await API.post("/auth/login", {
      email,
      password,
      otp,
    });

    const data = response.data;

    if (!data.success) {
      throw new Error(data.message || "Login failed");
    }

    const userData = {
      email,
      username: data.username,
    };

    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    localStorage.setItem("user", JSON.stringify(userData));

    setUser(userData);

    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("user");

    setUser(null);
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