import { useEffect, useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import SplashScreen from "./Components/Login/SplashScreen";


function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Simulate loading or do authentication check
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // 2 seconds splash

    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      {showSplash ? <SplashScreen /> : <AppRoutes />}
    </div>
  );
}

export default App;
