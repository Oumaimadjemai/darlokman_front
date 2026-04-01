import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  text = "هل أنت متأكد من المتابعة؟",
  title = "تأكيد العملية",
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  type = "warning", // warning, danger, info
}) {
  if (!open) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          iconBg: "bg-red-500/20",
          iconColor: "text-red-500",
          confirmBg: "bg-red-500 hover:bg-red-600",
          borderColor: "border-red-500/30",
        };
      case "info":
        return {
          iconBg: "bg-blue-500/20",
          iconColor: "text-blue-500",
          confirmBg: "bg-blue-500 hover:bg-blue-600",
          borderColor: "border-blue-500/30",
        };
      case "warning":
      default:
        return {
          iconBg: "bg-amber-500/20",
          iconColor: "text-amber-500",
          confirmBg: "bg-amber-500 hover:bg-amber-600",
          borderColor: "border-amber-500/30",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-slate-800 rounded-xl w-[400px] max-w-[90vw] shadow-2xl border ${styles.borderColor}`}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-700">
              <div className={`p-2 rounded-lg ${styles.iconBg}`}>
                <AlertTriangle className={`w-5 h-5 ${styles.iconColor}`} />
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-white text-lg font-semibold mb-2 text-center">
                {title}
              </h3>
              <p className="text-slate-300 text-center leading-relaxed">
                {text}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 border-t border-slate-700">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-medium"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 px-4 py-2 ${styles.confirmBg} text-white rounded-lg transition font-medium`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}