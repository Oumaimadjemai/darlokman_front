// App.js
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Add useLocation
import AppRoutes from "./routes/AppRoutes";
import SplashScreen from "./Components/Login/SplashScreen";
import axios from "./api/axiosInstance";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const navigate = useNavigate();
  const location = useLocation(); // Get current location

  // Check authentication first, then decide about splash screen
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");

    // If user is already logged in
    if (token && role) {
      setIsLoggedIn(true);
      setUserRole(role);
      setShowSplash(false);
      
      // DON'T auto-redirect if trying to access /newBoard
      const currentPath = window.location.pathname;
      const isPublicRoute = currentPath === '/newBoard';
      
      // Only redirect to dashboard if not on a public route
      if (!isPublicRoute && currentPath === '/') {
        if (role === "admin") navigate("/admin", { replace: true });
        else if (role === "vendeur") navigate("/vendeur", { replace: true });
        else if (role === "magasinier") navigate("/magasinier", { replace: true });
      }
      
      return;
    }

    // Not logged in, show splash screen for 2 seconds then go to login
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  // Add this log to see what's happening
  useEffect(() => {
    console.log('App.js - current path:', window.location.pathname);
    console.log('App.js - isLoggedIn:', isLoggedIn);
    console.log('App.js - userRole:', userRole);
  }, [isLoggedIn, userRole, location]);

  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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
      // Clear all storage
      localStorage.clear();

      setIsLoggedIn(false);
      setUserRole(null);

      navigate("/login", { replace: true });
    }
  };

  // Show splash screen only for non-authenticated users
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Show offline message
  if (!isOnline) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh", 
        flexDirection: "column", 
        textAlign: "center",
        background: "linear-gradient(to bottom right, #0b1b3a, #111827)",
        color: "white"
      }}>
        <h1 className="text-4xl mb-4">😢 Oops!</h1>
        <p className="text-xl mb-2">No Internet connection.</p>
        <small className="text-gray-400">Check your network and try again.</small>
      </div>
    );
  }

  return <AppRoutes 
    isLoggedIn={isLoggedIn} 
    userRole={userRole} 
    handleLogout={handleLogout} 
  />;
}

export default App;