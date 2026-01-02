import { useEffect, useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import SplashScreen from "./Components/Login/SplashScreen";
import { useNavigate } from "react-router-dom";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading or do authentication check
    const timer = setTimeout(() => {
      // Check if token exists
      const token = localStorage.getItem("access_token");
      const role = localStorage.getItem("role");
      if (token && role) {
        setIsLoggedIn(true);
        // Redirect to role-specific page
        if (role === "admin") navigate("/admin");
        else if (role === "vendeur") navigate("/vendeur");
        else if (role === "magasinier") navigate("/magasinier");
      }
      setShowSplash(false);
    }, 2000); // 2 seconds splash

    // Listen to online/offline events
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

  if (showSplash) {
    return <SplashScreen />;
  }

  if (!isOnline) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh", 
        flexDirection: "column",
        textAlign: "center"
      }}>
        <h1>😢 Oops!</h1>
        <p>No Internet connection.</p>
        <small>Check your network and try again.</small>
      </div>
    );
  }

  return <AppRoutes />;
}

export default App;
