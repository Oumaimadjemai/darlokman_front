import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  Save,
  DollarSign,
  Tag,
  CreditCard,
  FileText,
  Calendar,
} from "lucide-react";
import axios from "../../api/axiosInstance";

export default function AddDepenseDialog({ open, onClose, onSuccess, expenseToEdit = null }) {
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type_depense: "",
    mode_paiement: "",
    libelle: "",
    montant: "",
    date: new Date().toISOString().split('T')[0],
  });

  // Type de dépense options
  const typeDepenseOptions = [
    { value: "", label: "اختر النوع" },
    { value: "الكراء", label: "الكراء" },
    { value: "الفواتير", label: "الفواتير" },
    { value: "أجور العمال", label: "أجور العمال" },
    { value: "سلع تالفة", label: "سلع تالفة" },
    { value: "ديون", label: "ديون" },
    { value: "ديون خاصة", label: "ديون خاصة" },
    { value: "مصاريف أخرى", label: "مصاريف أخرى" },
    { value: "مساهمين", label: "مساهمين" },
  ];

  // Mode de paiement options
  const modePaiementOptions = [
    { value: "", label: "اختر طريقة الدفع" },
    { value: "espece", label: "نقدي" },
    { value: "ccp", label: "CCP" },
    { value: "cheque", label: "شيك" },
  ];

  // Initialize edit mode
  useEffect(() => {
    if (expenseToEdit) {
      setIsEditMode(true);
      setFormData({
        type_depense: expenseToEdit.type_depense || "",
        mode_paiement: expenseToEdit.mode_paiement || "",
        libelle: expenseToEdit.libelle || "",
        montant: expenseToEdit.montant || "",
        date: expenseToEdit.date || new Date().toISOString().split('T')[0],
      });
    } else {
      setIsEditMode(false);
      resetForm();
    }
  }, [expenseToEdit, open]);

  const handleSubmit = async () => {
    if (!formData.type_depense || !formData.mode_paiement || !formData.libelle || !formData.montant) {
      toast.warning("⚠️ يرجى ملء جميع الحقول الإلزامية");
      return;
    }

    if (parseFloat(formData.montant) <= 0) {
      toast.warning("⚠️ يجب أن يكون المبلغ أكبر من 0");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const payload = {
        type_depense: formData.type_depense,
        mode_paiement: formData.mode_paiement,
        libelle: formData.libelle,
        montant: parseFloat(formData.montant),
        date: formData.date,
      };

      if (isEditMode && expenseToEdit?.id) {
        // Update existing expense
        await axios.patch(`/depense/depenses/${expenseToEdit.id}/`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("✅ تم تحديث المصروف بنجاح");
      } else {
        // Create new expense
        await axios.post("/depense/depenses/", payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("✅ تم إضافة المصروف بنجاح");
      }

      if (onSuccess) onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error:", error);
      let message = isEditMode ? "❌ حدث خطأ أثناء تحديث المصروف" : "❌ حدث خطأ أثناء إضافة المصروف";
      if (error.response?.data) {
        if (typeof error.response.data === "object") {
          const errors = Object.entries(error.response.data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join(" | ");
          message = errors;
        } else {
          message = error.response.data.toString();
        }
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type_depense: "",
      mode_paiement: "",
      libelle: "",
      montant: "",
      date: new Date().toISOString().split('T')[0],
    });
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 rounded-xl w-[550px] max-h-[90vh] overflow-hidden shadow-2xl border border-red-500/30"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-white" />
                <h2 className="text-white text-xl font-bold">
                  {isEditMode ? "تعديل مصروف" : "إضافة مصروف جديد"}
                </h2>
                {isEditMode && expenseToEdit && (
                  <span className="bg-white/20 text-white text-sm px-2 py-1 rounded-lg mr-2">
                    #{expenseToEdit.id}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-130px)] p-6">
              <div className="space-y-5">
                {/* Date */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    التاريخ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, date: e.target.value }))
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Type de dépense */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    نوع المصروف <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <select
                      value={formData.type_depense}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, type_depense: e.target.value }))
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-red-500 focus:outline-none appearance-none"
                    >
                      {typeDepenseOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mode de paiement */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    طريقة الدفع <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <select
                      value={formData.mode_paiement}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, mode_paiement: e.target.value }))
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-red-500 focus:outline-none appearance-none"
                    >
                      {modePaiementOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Libellé / Description */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    الوصف <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute right-3 top-3 text-slate-500 w-4 h-4" />
                    <textarea
                      value={formData.libelle}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, libelle: e.target.value }))
                      }
                      rows={3}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-red-500 focus:outline-none resize-none"
                      placeholder="وصف المصروف..."
                    />
                  </div>
                </div>

                {/* Montant */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    المبلغ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.montant}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setFormData((prev) => ({ ...prev, montant: value }));
                      }}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-red-500 focus:outline-none"
                      placeholder="المبلغ بالدينار"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">أدخل المبلغ بالأرقام فقط</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-700 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                disabled={loading}
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isEditMode ? "جاري التحديث..." : "جاري الحفظ..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditMode ? "تحديث المصروف" : "حفظ المصروف"}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}