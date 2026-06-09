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