import axios from "axios";
import Cookies from "js-cookie";

// Use Vite env variable if available, otherwise fall back to localhost.
// This lets you point the frontend at any backend (local or deployed)
// that is connected to Supabase PostgreSQL.
const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8800/api/";

const axiosInstance = axios.create({
  baseURL,
});

// Add a request interceptor to include the token in every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("authToken");

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
