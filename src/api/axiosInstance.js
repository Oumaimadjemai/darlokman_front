// axiosInstance.js
import axios from "axios";
// 
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL|| "https://gestionstock-production.up.railway.app" , 
  // Use HTTPS 
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ensure we're using HTTPS
    if (config.url && config.url.startsWith('http://')) {
      config.url = config.url.replace('http://', 'https://');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle redirects
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;