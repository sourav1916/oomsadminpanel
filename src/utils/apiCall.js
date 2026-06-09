// src/utils/apiCall.js
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

// Global error handler for API calls
export const handleApiError = (error, customMessage = null) => {
  let errorMessage = customMessage;

  if (!errorMessage) {
    if (error.code === 'ECONNABORTED') {
      errorMessage = "Request timeout. Please try again.";
    } else if (!error.response) {
      errorMessage = "Unable to connect to server. Please check your internet connection.";
    } else if (error.response?.status === 400) {
      errorMessage = error.response?.data?.message || "Bad request. Please check your input.";
    } else if (error.response?.status === 401) {
      errorMessage = error.response?.data?.message || "Session expired. Please login again.";
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } else if (error.response?.status === 403) {
      errorMessage = error.response?.data?.message || "You don't have permission to perform this action.";
    } else if (error.response?.status === 404) {
      errorMessage = error.response?.data?.message || "Resource not found.";
    } else if (error.response?.status === 409) {
      errorMessage = error.response?.data?.message || "Conflict with existing data.";
    } else if (error.response?.status === 422) {
      errorMessage = error.response?.data?.message || "Validation failed. Please check your input.";
    } else if (error.response?.status === 429) {
      errorMessage = "Too many requests. Please try again later.";
    } else if (error.response?.status === 500) {
      errorMessage = error.response?.data?.message || "Server error. Please try again later.";
    } else {
      errorMessage = error?.response?.data?.message || error?.message || "Something went wrong";
    }
  }

  toast.error(errorMessage);
  return errorMessage;
};

export default API;