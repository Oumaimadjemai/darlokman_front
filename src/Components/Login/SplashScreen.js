import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function SplashScreen({ onComplete }) {
  // Add window check for SSR compatibility
  const stars = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
    y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
  }));

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* 🌌 Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b1b3a] via-[#0f2747] to-[#111827]" />

      {/* golden glow right side */}
      <div className="absolute right-[-200px] top-1/2 w-[500px] h-[500px] bg-yellow-500/20 blur-[120px] rounded-full" />

      {/* blue glow left side */}
      <div className="absolute left-[-200px] top-1/3 w-[500px] h-[500px] bg-blue-500/30 blur-[120px] rounded-full" />

      {/* ⭐ floating background stars */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute text-yellow-400/40"
          initial={{
            x: star.x,
            y: star.y,
            scale: 0,
          }}
          animate={{
            y: [null, "-20px", "20px"],
            scale: [0.5, 1, 0.5],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles size={12} />
        </motion.div>
      ))}

      {/* 🎯 CENTER CONTENT */}
      <div className="relative z-10 flex flex-col items-center">
        {/* glowing aura */}
        <motion.div
          className="absolute w-40 h-40 bg-amber-500/20 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* 🏷️ LOGO */}
        <motion.img
          src="assets/images/logo.png"
          className="w-28 h-28 rounded-full z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 120 }}
        />

        {/* ✨ orbiting stars */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="absolute text-yellow-300"
            style={{
              rotate: i * 60,
            }}
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="absolute w-2 h-2 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50" />
          </motion.div>
        ))}

        {/* 📝 TITLE */}
        <motion.h1
          className="mt-10 text-3xl font-bold text-amber-400"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          نظام إدارة الأعمال
        </motion.h1>

        <p className="text-gray-400 mt-2">إدارة شاملة لأعمالك</p>

        {/* ⬇️ LOADER */}
        <div className="w-64 h-2 bg-white/10 rounded-full mt-8 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-500"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2 }}
            onAnimationComplete={onComplete}
          />
        </div>

        <p className="text-amber-400 text-sm mt-3 animate-pulse">
          جاري التحميل...
        </p>
      </div>
    </div>
  );
}