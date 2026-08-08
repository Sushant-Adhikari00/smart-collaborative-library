import axios from "axios";

const defaultApiUrl = import.meta.env.PROD
  ? "https://smart-collaborative-library-1.onrender.com/api/v1"
  : "http://localhost:8080/api/v1";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultApiUrl,
});

api.interceptors.request.use(
  (config) => {
    // Retrieve JWT from either the stored user object or a plain token entry.
    let token = null;
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      token = user?.token;
    } catch (e) {
      // ignore JSON parse errors
    }
    if (!token) {
      token = localStorage.getItem('token');
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired authentication tokens from storage
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");

      if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
