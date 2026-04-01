import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  Save,
  Truck,
  User,
  MapPin,
  Phone,
  DollarSign,
  Edit,
} from "lucide-react";
import axios from "../../api/axiosInstance";

export default function AddFournisseurDialog({ open, onClose, onSuccess, supplierToEdit = null }) {
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nom: "",
    adresse: "",
    telephone: "",
    wilaya: "16",
    dettes_initiales: 0,
  });

  // Wilaya options
  const wilayasOptions = [
    { value: "01", label: "Adrar / أدرار" },
    { value: "02", label: "Chlef / الشلف" },
    { value: "03", label: "Laghouat / الأغواط" },
    { value: "04", label: "Oum El Bouaghi / أم البواقي" },
    { value: "05", label: "Batna / باتنة" },
    { value: "06", label: "Béjaïa / بجاية" },
    { value: "07", label: "Biskra / بسكرة" },
    { value: "08", label: "Béchar / بشار" },
    { value: "09", label: "Blida / البليدة" },
    { value: "10", label: "Bouira / البويرة" },
    { value: "11", label: "Tamanrasset / تمنراست" },
    { value: "12", label: "Tébessa / تبسة" },
    { value: "13", label: "Tlemcen / تلمسان" },
    { value: "14", label: "Tiaret / تيارت" },
    { value: "15", label: "Tizi Ouzou / تيزي وزو" },
    { value: "16", label: "Alger / الجزائر" },
    { value: "17", label: "Djelfa / الجلفة" },
    { value: "18", label: "Jijel / جيجل" },
    { value: "19", label: "Sétif / سطيف" },
    { value: "20", label: "Saïda / سعيدة" },
    { value: "21", label: "Skikda / سكيكدة" },
    { value: "22", label: "Sidi Bel Abbès / سيدي بلعباس" },
    { value: "23", label: "Annaba / عنابة" },
    { value: "24", label: "Guelma / قالمة" },
    { value: "25", label: "Constantine / قسنطينة" },
    { value: "26", label: "Médéa / المدية" },
    { value: "27", label: "Mostaganem / مستغانم" },
    { value: "28", label: "M'Sila / المسيلة" },
    { value: "29", label: "Mascara / معسكر" },
    { value: "30", label: "Ouargla / ورقلة" },
    { value: "31", label: "Oran / وهران" },
    { value: "32", label: "El Bayadh / البيض" },
    { value: "33", label: "Illizi / اليزي" },
    { value: "34", label: "Bordj Bou Arreridj / برج بوعريريج" },
    { value: "35", label: "Boumerdès / بومرداس" },
    { value: "36", label: "El Tarf / الطارف" },
    { value: "37", label: "Tindouf / تندوف" },
    { value: "38", label: "Tissemsilt / تسمسيلت" },
    { value: "39", label: "El Oued / الوادي" },
    { value: "40", label: "Khenchela / خنشلة" },
    { value: "41", label: "Souk Ahras / سوق أهراس" },
    { value: "42", label: "Tipaza / تيبازة" },
    { value: "43", label: "Mila / ميلة" },
    { value: "44", label: "Aïn Defla / عين الدفلى" },
    { value: "45", label: "Naâma / النعامة" },
    { value: "46", label: "Aïn Témouchent / عين تموشنت" },
    { value: "47", label: "Ghardaïa / غرداية" },
    { value: "48", label: "Relizane / غليزان" },
    { value: "49", label: "Timimoun / تيميمون" },
    { value: "50", label: "Bordj Badji Mokhtar / برج باجي مختار" },
    { value: "51", label: "Ouled Djellal / أولاد جلال" },
    { value: "52", label: "Béni Abbès / بني عباس" },
    { value: "53", label: "In Salah / عين صالح" },
    { value: "54", label: "In Guezzam / عين قزام" },
    { value: "55", label: "Touggourt / تقرت" },
    { value: "56", label: "Djanet / جانت" },
    { value: "57", label: "El M'Ghair / المغير" },
    { value: "58", label: "El Menia / المنيعة" },
  ];

  // Initialize edit mode
  useEffect(() => {
    if (supplierToEdit) {
      setIsEditMode(true);
      setFormData({
        nom: supplierToEdit.nom || "",
        adresse: supplierToEdit.adresse || "",
        telephone: supplierToEdit.telephone || "",
        wilaya: supplierToEdit.wilaya || "16",
        dettes_initiales: parseFloat(supplierToEdit.dettes_initiales) || 0,
      });
    } else {
      setIsEditMode(false);
      resetForm();
    }
  }, [supplierToEdit, open]);

  const handleSubmit = async () => {
    if (!formData.nom || !formData.telephone) {
      toast.warning("⚠️ يرجى ملء الحقول الإلزامية: الإسم، الهاتف");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      
      if (isEditMode && supplierToEdit?.id) {
        // Update existing supplier
        await axios.patch(`/auth/fournisseurs/${supplierToEdit.id}/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("✅ تم تحديث الممون بنجاح");
      } else {
        // Create new supplier
        await axios.post("/auth/fournisseurs/", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("✅ تم إضافة الممون بنجاح");
      }
      
      if (onSuccess) onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error:", error);
      let message = isEditMode ? "❌ حدث خطأ أثناء تحديث الممون" : "❌ حدث خطأ أثناء إضافة الممون";
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
      nom: "",
      adresse: "",
      telephone: "",
      wilaya: "16",
      dettes_initiales: 0,
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
            className="bg-slate-800 rounded-xl w-[550px] max-h-[90vh] overflow-hidden shadow-2xl border border-pink-500/30"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                {isEditMode ? (
                  <Edit className="w-5 h-5 text-white" />
                ) : (
                  <Truck className="w-5 h-5 text-white" />
                )}
                <h2 className="text-white text-xl font-bold">
                  {isEditMode ? "تعديل ممون" : "إضافة ممون جديد"}
                </h2>
                {isEditMode && supplierToEdit && (
                  <span className="bg-white/20 text-white text-sm px-2 py-1 rounded-lg mr-2">
                    #{supplierToEdit.id}
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
              <div className="space-y-4">
                {/* Nom */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    اسم الممون <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, nom: e.target.value }))
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-pink-500 focus:outline-none"
                      placeholder="أدخل اسم الممون"
                    />
                  </div>
                </div>

                {/* Adresse */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    العنوان
                  </label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.adresse}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, adresse: e.target.value }))
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-pink-500 focus:outline-none"
                      placeholder="أدخل العنوان"
                    />
                  </div>
                </div>

                {/* Telephone */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, telephone: e.target.value }))
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-pink-500 focus:outline-none"
                      placeholder="أدخل رقم الهاتف"
                    />
                  </div>
                </div>

                {/* Wilaya */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    الولاية
                  </label>
                  <select
                    value={formData.wilaya}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, wilaya: e.target.value }))
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                  >
                    {wilayasOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dettes initiales */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    الدين الإبتدائي
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.dettes_initiales || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setFormData((prev) => ({
                          ...prev,
                          dettes_initiales: value === "" ? 0 : parseFloat(value),
                        }));
                      }}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-pink-500 focus:outline-none"
                      placeholder="الدين الإبتدائي"
                    />
                  </div>
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
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isEditMode ? "جاري التحديث..." : "جاري الحفظ..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditMode ? "تحديث الممون" : "حفظ الممون"}
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