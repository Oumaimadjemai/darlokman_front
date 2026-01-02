// App.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import SplashScreen from "./Components/Login/SplashScreen";
import axios from "./api/axiosInstance";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = localStorage.getItem("access_token");
      const role = localStorage.getItem("role");

      if (token && role) {
        setIsLoggedIn(true);
        setUserRole(role);

        if (role === "admin") navigate("/admin");
        else if (role === "vendeur") navigate("/vendeur");
        else if (role === "magasinier") navigate("/magasinier");
      }

      setShowSplash(false);
    }, 2000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [navigate]);

  // ✅ Global logout handler
  const handleLogout = async () => {
    const refresh = localStorage.getItem("refresh_token");
    const access = localStorage.getItem("access_token");

    try {
      if (refresh) {
        await axios.post(
          "auth/logout/",
          { refresh },
          { headers: { Authorization: `Bearer ${access}` } }
        );
      }
    } catch (error) {
      console.warn("Erreur de logout côté serveur :", error.response?.data?.detail);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("role");

      setIsLoggedIn(false);
      setUserRole(null);

      navigate("/login");
    }
  };

  if (showSplash) return <SplashScreen />;

  if (!isOnline)
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", textAlign: "center" }}>
        <h1>😢 Oops!</h1>
        <p>No Internet connection.</p>
        <small>Check your network and try again.</small>
      </div>
    );

  return <AppRoutes isLoggedIn={isLoggedIn} userRole={userRole} handleLogout={handleLogout} />;
}

export default App;
