import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://gestionstock-production.up.railway.app/", // shared root URL
  timeout: 5000, // optional
  headers: {
    "Authorization":`Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
