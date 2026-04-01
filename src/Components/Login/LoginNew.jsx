import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, User, Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import logoImage from "figma:asset/f61ed8761c4e4daba2710cc06d86c1f09a6835fb.png";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [particles] = useState(
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }))
  );

  const handleLogin = (e) => {
    e.preventDefault();

    const users = {
      admin: { password: "admin123", role: "مدير" },
      imi: { password: "imi123", role: "موظف" },
      user: { password: "user123", role: "مستخدم" },
    };

    const user = users[username];

    if (user && user.password === password) {
      toast.success(`مرحبا ${username}!`);
      onLogin(username, user.role);
    } else {
      toast.error("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

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
              src={logoImage}
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

            {/* Username */}
            <div>
              <label className="text-amber-300 block mb-2">اسم المستخدم</label>
              <div className="relative">
                <User className="absolute right-3 top-3 text-amber-400 w-5 h-5" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-12 py-3"
                  placeholder="أدخل اسم المستخدم"
                  required
                />
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
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-amber-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              تسجيل الدخول
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}