import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Lock, User, Eye, EyeOff, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axiosInstance";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState([]);
  const [errorInput, setErrorInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Use ref to prevent multiple fetches
  const hasFetched = useRef(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");
    
    if (token && role) {
      console.log("User already logged in with role:", role);
      // Always navigate to /New/dashboard
      navigate("/New/dashboard", { replace: true });
    }
  }, [navigate]);

  // Fetch users only once
  useEffect(() => {
    const fetchUsers = async () => {
      // Prevent multiple fetches
      if (hasFetched.current) return;
      
      try {
        console.log("Fetching users...");
        const response = await axios.get("auth/users/");
        console.log("Users response:", response.data);
        
        const usersList = response.data.results || [];
        setUsers(usersList);
        console.log("Users loaded:", usersList.length);
        
        // Mark as fetched
        hasFetched.current = true;
      } catch (error) {
        console.error("Failed to load users", error);
        setErrorInput("Failed to load users");
        setUsers([]);
      }
    };
  
    fetchUsers();
  }, []); // Empty dependency array - runs once on mount

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setErrorInput("Please select username and enter password");
      return;
    }

    setIsLoading(true);
    setErrorInput("");

    try {
      console.log("Attempting login with username:", username);
      
      const response = await axios.post("auth/token/", {
        username,
        password,
      });

      console.log("Login response:", response.data);

      const { access, refresh, user } = response.data;

      if (!access || !refresh || !user) {
        throw new Error("Invalid response structure");
      }

      // Clear any existing data first
      localStorage.clear();

      // Set new data
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("username", user.username);
      localStorage.setItem("role", user.role);
      localStorage.setItem("features", JSON.stringify(user.features || []));
      localStorage.setItem("magasin_id", user.magasin || "");
      localStorage.setItem("user_id", user.id);

      console.log("Saved to localStorage:", {
        access: localStorage.getItem("access_token"),
        role: localStorage.getItem("role"),
        username: localStorage.getItem("username")
      });

      // Always navigate to /New/dashboard
      navigate("/New/dashboard", { replace: true });

    } catch (error) {
      console.error("Login failed", error);
      console.error("Error response:", error.response?.data);
      
      setErrorInput(
        error.response?.data?.detail || 
        error.response?.data?.message ||
        "Login failed: check username or password"
      );
      setIsLoading(false);
    }
  };

  const [particles] = useState(
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }))
  );

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden"
      dir="rtl"
    >
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              opacity: 0,
              x: `${particle.x}%`,
              y: `${particle.y}%`,
            }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0],
              y: [`${particle.y}%`, `${particle.y - 50}%`],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeOut",
            }}
            className="absolute w-2 h-2 bg-amber-400 rounded-full blur-sm"
          />
        ))}
      </div>

      {/* Glowing orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-20 right-20 w-96 h-96 bg-amber-500 rounded-full blur-3xl opacity-20"
      />

      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20"
      />

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-slate-900/70 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl p-8">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <motion.img
              src="assets/images/logo.png"
              alt="Logo"
              className="h-24 w-24 object-contain"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl text-white mb-2">تسجيل الدخول</h1>
            <p className="text-slate-400">مرحبا بك في نظام الإدارة</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">

            {/* Username Select */}
            <div>
              <label className="text-amber-300 block mb-2">اسم المستخدم</label>
              <div className="relative">
                <User className="absolute right-3 top-3 text-amber-400 w-5 h-5 pointer-events-none" />
                <select
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-12 py-3 appearance-none"
                  required
                  disabled={isLoading}
                >
                  <option value="" disabled>
                    اختر اسم المستخدم
                  </option>
                  {users.map((user, index) => (
                    <option key={index} value={user.username}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-amber-300 block mb-2">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 text-amber-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-12 py-3"
                  placeholder="أدخل كلمة المرور"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-amber-400"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorInput && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center p-3 rounded-lg">
                {errorInput}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={!username || !password || isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري التحميل...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}