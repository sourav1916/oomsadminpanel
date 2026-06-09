import axios from "axios";
import { toast } from "react-toastify";

const API = axios.create({
  baseURL: "https://api.ooms.in/admin",
  timeout: 30000,
});

// Request Interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    if (token) {
      config.headers.token = token;
    }

    if (username) {
      config.headers.username = username;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";

    toast.error(message);

    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default API;