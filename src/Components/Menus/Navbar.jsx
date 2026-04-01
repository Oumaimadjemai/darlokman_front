import { motion  } from "framer-motion";
import { Menu, Bell, User, Moon, Sun } from 'lucide-react';


export default function Navbar({ 
  currentUser, 
  userRole, 
  isDarkMode, 
  onToggleDarkMode, 
  onToggleSidebar, 
}) {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-sm border-b border-amber-500/20 sticky top-0 z-50 shadow-lg shadow-amber-500/10"
    >
      <div className="flex items-center justify-between px-6 py-1">
        
        <motion.div 
          className="flex items-center  "
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.img 
            src="/assets/images/logo.png" 
            alt="Logo" 
            className="h-16 w-16 object-contain"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          />
        </motion.div>

        <div className="flex items-center gap-4">
          <motion.div 
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-yellow-600/20 px-4 py-2 rounded-lg border border-amber-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div 
              className="w-2 h-2 bg-emerald-500 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-white text-sm">مرحبا، {currentUser}</span>
            <span className="text-amber-400 text-xs">({userRole})</span>
          </motion.div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleDarkMode}
            className="p-2 hover:bg-amber-500/20 rounded-lg transition-colors text-amber-400"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>

          <motion.button
            onClick={onToggleSidebar}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-amber-500/20 rounded-lg transition-colors text-amber-400"
          >
            <Menu className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}