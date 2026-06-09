import { useState } from "react";
import { toast } from "react-toastify";
import API from "../utils/apiCall";

const useApi = () => {
  const [loading, setLoading] = useState(false);

  const request = async ({
    method = "GET",
    url,
    data = null,
    params = null,
    showSuccess = false,
    successMessage,
  }) => {
    try {
      setLoading(true);

      const response = await API({
        method,
        url,
        data,
        params,
      });

      if (showSuccess) {
        toast.success(
          successMessage ||
            response?.data?.message ||
            "Operation successful"
        );
      }

      return response.data;
    } catch (error) {
      // Handle different error types
      if (error.code === 'ECONNABORTED') {
        toast.error("Request timeout. Please try again.");
      } else if (!error.response) {
        // Network error or server unreachable
        toast.error("Unable to connect to server. Please check your internet connection.");
        
        // Optional: Redirect to server error page
        // if (window.location.pathname !== '/server-error') {
        //   window.location.href = '/server-error';
        // }
      } else if (error.response?.status === 401) {
        // Unauthorized - token expired
        toast.error(error.response?.data?.message || "Session expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        
        // Redirect to login
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || "You don't have permission to perform this action.");
      } else if (error.response?.status === 404) {
        toast.error(error.response?.data?.message || "Resource not found.");
      } else if (error.response?.status === 500) {
        toast.error(error.response?.data?.message || "Server error. Please try again later.");
      } else {
        // Handle other status codes
        const message = error?.response?.data?.message || error?.message || "Something went wrong";
        toast.error(message);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    request,
  };
};

export default useApi;