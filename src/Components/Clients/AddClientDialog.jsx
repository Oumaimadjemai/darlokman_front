import { useState, useRef, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  Upload,
  Trash2,
  FileText,
  Save,
  User,
  CreditCard,
  FileCheck,
  Edit,
  Plus,
  Calendar,
} from "lucide-react";
import axios from "../../api/axiosInstance";

// Helper to calculate CLE from CCP
const calculateCle = (ccp) => {
  if (!ccp || isNaN(ccp)) return "";
  let z = (parseInt(ccp) * 100) % 97;
  if (z > 12) z -= 12;
  z = 97 - z;
  return z < 10 ? "0" + z : "" + z;
};

export default function AddClientDialog({ open, onClose, onSuccess, clientToEdit = null }) {
  const fileInputRef = useRef();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [userInfos, setUserInfos] = useState({
    assurance_militaire: "",
    date_expedition: null,
    nom_famille_ar: "",
    prenom_ar: "",
    nom_famille_fr: "",
    prenom_fr: "",
    nom_pere: "",
    nom_mere: "",
    numero_national: "",
    date_naissance: null,
    lieu_naissance: "",
    adresse: "",
    telephones: [""],
    profession: "",
    jour: "",
    revenu: "",
    type_piece_identite: "بطاقة التعريف الوطنية ",
    numero_piece_identite: "",
    date_emission_piece: null,
    lieu_emission_piece: "",
    ccp: "",
    cle: "",
    code: "",
    dette_initiale: 0,
    note: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);

  // Fonctions pour gérer les téléphones
  const addTelephoneField = () => {
    setUserInfos(prev => ({
      ...prev,
      telephones: [...prev.telephones, ""]
    }));
  };

  const removeTelephoneField = (index) => {
    if (userInfos.telephones.length === 1) {
      setUserInfos(prev => {
        const newTelephones = [...prev.telephones];
        newTelephones[index] = "";
        return { ...prev, telephones: newTelephones };
      });
      return;
    }
    
    setUserInfos(prev => ({
      ...prev,
      telephones: prev.telephones.filter((_, i) => i !== index)
    }));
  };

  const updateTelephone = (index, value) => {
    setUserInfos(prev => {
      const newTelephones = [...prev.telephones];
      newTelephones[index] = value;
      return { ...prev, telephones: newTelephones };
    });
  };

  // Initialize form with edit data
  useEffect(() => {
    if (clientToEdit) {
      setIsEditMode(true);
      setUserInfos({
        assurance_militaire: clientToEdit.assurance_militaire || "",
        date_expedition: clientToEdit.date_expedition ? new Date(clientToEdit.date_expedition) : null,
        nom_famille_ar: clientToEdit.nom_famille_ar || "",
        prenom_ar: clientToEdit.prenom_ar || "",
        nom_famille_fr: clientToEdit.nom_famille_fr || "",
        prenom_fr: clientToEdit.prenom_fr || "",
        nom_pere: clientToEdit.nom_pere || "",
        nom_mere: clientToEdit.nom_mere || "",
        numero_national: clientToEdit.numero_national || "",
        date_naissance: clientToEdit.date_naissance ? new Date(clientToEdit.date_naissance) : null,
        lieu_naissance: clientToEdit.lieu_naissance || "",
        adresse: clientToEdit.adresse || "",
        telephones: clientToEdit.telephones && clientToEdit.telephones.length > 0 
          ? clientToEdit.telephones 
          : [""],
        profession: clientToEdit.profession || "",
        jour: clientToEdit.jour || "",
        revenu: clientToEdit.revenu || "",
        type_piece_identite: clientToEdit.type_piece_identite || "بطاقة التعريف الوطنية ",
        numero_piece_identite: clientToEdit.numero_piece_identite || "",
        date_emission_piece: clientToEdit.date_emission_piece ? new Date(clientToEdit.date_emission_piece) : null,
        lieu_emission_piece: clientToEdit.lieu_emission_piece || "",
        ccp: clientToEdit.ccp || "",
        cle: clientToEdit.cle || "",
        code: clientToEdit.code || "",
        dette_initiale: clientToEdit.dette_initiale || 0,
        note: clientToEdit.note || "",
      });
      
      if (clientToEdit.fichiers) {
        setExistingFiles(clientToEdit.fichiers.map(file => ({
          id: file.id,
          name: file.name || `ملف ${file.id}`,
          url: file.url || "",
          type: file.url?.toLowerCase().endsWith(".pdf") ? "pdf" : "image",
        })));
      }
    } else {
      setIsEditMode(false);
      resetForm();
    }
  }, [clientToEdit, open]);

  // Handle CCP change with auto CLE calculation
  const handleCCPChange = (e) => {
    const newCcp = e.target.value.replace(/\D/g, "");
    setUserInfos((prev) => ({
      ...prev,
      ccp: newCcp,
      cle: calculateCle(newCcp),
    }));
  };

  // File handling
  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList);
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleFileClick = () => fileInputRef.current.click();

  const removeNewFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (fileId) => {
    setFilesToDelete((prev) => [...prev, fileId]);
    setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Validation
  const validateUserInfos = () => {
    const requiredFields = [
      "nom_famille_ar",
      "prenom_ar",
      "nom_famille_fr",
      "prenom_fr",
      "numero_national",
      "date_naissance",
      "lieu_naissance",
      "adresse",
      "type_piece_identite",
      "numero_piece_identite",
      "date_emission_piece",
      "lieu_emission_piece",
      "ccp",
      "cle",
    ];

    const missingFields = requiredFields.filter(
      (field) => !userInfos[field] || userInfos[field].toString().trim() === ""
    );

    if (missingFields.length > 0) {
      toast.warning("⚠️ يرجى ملء جميع الحقول الإلزامية قبل الحفظ.");
      return false;
    }

    return true;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateUserInfos()) return;

    setLoading(true);

    const cleanedTelephones = userInfos.telephones.filter(phone => phone && phone.trim() !== "");

    const formattedData = {
      ...userInfos,
      telephones: cleanedTelephones,
      date_naissance: userInfos.date_naissance
        ? format(userInfos.date_naissance, "yyyy-MM-dd")
        : "",
      date_emission_piece: userInfos.date_emission_piece
        ? format(userInfos.date_emission_piece, "yyyy-MM-dd")
        : "",
      date_expedition: userInfos.date_expedition
        ? format(userInfos.date_expedition, "yyyy-MM-dd")
        : "",
      revenu: userInfos.revenu || "0.00",
      dette_initiale: userInfos.dette_initiale || "0.00",
    };

    delete formattedData.telephone;

    const formData = new FormData();
    Object.entries(formattedData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        if (key === "telephones") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });

    uploadedFiles.forEach((file) => {
      formData.append("fichiers_upload", file);
    });

    filesToDelete.forEach((fileId) => {
      formData.append("fichiers_delete", fileId);
    });

    try {
      if (isEditMode && clientToEdit?.id) {
        await axios.patch(`/auth/clients/${clientToEdit.id}/`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        toast.success("✅ تم تحديث العميل بنجاح");
      } else {
        await axios.post("/auth/clients/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        toast.success("✅ تم إضافة العميل بنجاح");
      }
      
      if (typeof onSuccess === "function") {
        onSuccess();
      }
      onClose();
      resetForm();
    } catch (err) {
      console.error("❌ Erreur:", err.response?.data || err.message);
      toast.error(
        err.response?.data?.message ||
          JSON.stringify(err.response?.data) ||
          "Erreur inconnue"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUserInfos({
      assurance_militaire: "",
      date_expedition: null,
      nom_famille_ar: "",
      prenom_ar: "",
      nom_famille_fr: "",
      prenom_fr: "",
      nom_pere: "",
      nom_mere: "",
      numero_national: "",
      date_naissance: null,
      lieu_naissance: "",
      adresse: "",
      telephones: [""],
      profession: "",
      jour: "",
      revenu: "",
      type_piece_identite: "بطاقة التعريف الوطنية ",
      numero_piece_identite: "",
      date_emission_piece: null,
      lieu_emission_piece: "",
      ccp: "",
      cle: "",
      code: "",
      dette_initiale: 0,
      note: "",
    });
    setUploadedFiles([]);
    setExistingFiles([]);
    setFilesToDelete([]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 rounded-xl w-[1100px] max-h-[90vh] overflow-hidden shadow-2xl border border-amber-500/30"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isEditMode ? (
              <Edit className="w-5 h-5 text-white" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
            <h2 className="text-white text-xl font-bold">
              {isEditMode ? "تعديل عميل" : "إضافة عميل جديد"}
            </h2>
            {isEditMode && clientToEdit && (
              <span className="bg-white/20 text-white text-sm px-2 py-1 rounded-lg mr-2">
                #{clientToEdit.id}
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

        {/* Tabs */}
        <div className="flex border-b border-slate-700 bg-slate-900/50 px-4">
          {[
            { id: "personal", label: "المعلومات الشخصية", icon: User },
            { id: "account", label: "معلومات الحساب", icon: CreditCard },
            { id: "documents", label: "الوثائق", icon: FileCheck },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 transition-all ${
                activeTab === tab.id
                  ? "border-b-2 border-amber-500 text-amber-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-130px)] p-6">
          {/* Personal Info Tab */}
          {activeTab === "personal" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    رقم الضمان للعسكر
                  </label>
                  <input
                    type="text"
                    value={userInfos.assurance_militaire}
                    onChange={(e) =>
                      setUserInfos((prev) => ({
                        ...prev,
                        assurance_militaire: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    تاريخ إنتهاء الصلاحية
                  </label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="date"
                      value={
                        userInfos.date_expedition
                          ? format(userInfos.date_expedition, "yyyy-MM-dd")
                          : ""
                      }
                      onChange={(e) =>
                        setUserInfos((prev) => ({
                          ...prev,
                          date_expedition: e.target.value
                            ? new Date(e.target.value)
                            : null,
                        }))
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 pr-10 text-white focus:border-amber-500 focus:outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    اللقب (عربي) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userInfos.nom_famille_ar}
                    onChange={(e) =>
                      setUserInfos((prev) => ({
                        ...prev,
                        nom_famille_ar: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Nom (Français) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userInfos.nom_famille_fr}
                    onChange={(e) =>
                      setUserInfos((prev) => ({
                        ...prev,
                        nom_famille_fr: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    الإسم (عربي) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userInfos.prenom_ar}
                    onChange={(e) =>
                      setUserInfos((prev) => ({
                        ...prev,
                        prenom_ar: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Prénom (Français) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userInfos.prenom_fr}
                    onChange={(e) =>
                      setUserInfos((prev) => ({
                        ...prev,
                        prenom_fr: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  إسم الأب
                </label>
                <input
                  type="text"
                  value={userInfos.nom_pere}
                  onChange={(e) =>
                    setUserInfos((prev) => ({
                      ...prev,
                      nom_pere: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  إسم و لقب الأم
                </label>
                <input
                  type="text"
                  value={userInfos.nom_mere}
                  onChange={(e) =>
                    setUserInfos((prev) => ({
                      ...prev,
                      nom_mere: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  رقم التعريف الوطني <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userInfos.numero_national}
                  onChange={(e) =>
                    setUserInfos((prev) => ({
                      ...prev,
                      numero_national: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    تاريخ الإزدياد <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="date"
                      value={
                        userInfos.date_naissance
                          ? format(userInfos.date_naissance, "yyyy-MM-dd")
                          : ""
                      }
                      onChange={(e) =>
                        setUserInfos((prev) => ({
                          ...prev,
                          date_naissance: e.target.value
                            ? new Date(e.target.value)
                            : null,
                        }))
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 pr-10 text-white focus:border-amber-500 focus:outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    مكان الإزدياد <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userInfos.lieu_naissance}
                    onChange={(e) =>
                      setUserInfos((prev) => ({
                        ...prev,
                        lieu_naissance: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  العنوان <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userInfos.adresse}
                  onChange={(e) =>
                    setUserInfos((prev) => ({
                      ...prev,
                      adresse: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* SECTION TÉLÉPHONES */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  أرقام الهاتف
                </label>
                {userInfos.telephones.map((phone, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => updateTelephone(index, e.target.value)}
                      placeholder={`رقم الهاتف ${index + 1}`}
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeTelephoneField(index)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTelephoneField}
                  className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  إضافة رقم هاتف آخر
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    المهنة
                  </label>
                  <input
                    type="text"
                    value={userInfos.profession}
                    onChange={(e) =>
                      setUserInfos((prev) => ({
                        ...prev,
                        profession: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    الدخل
                  </label>
                  <input
                    type="number"
                    value={userInfos.revenu}
                    onChange={(e) =>
                      setUserInfos((prev) => ({
                        ...prev,
                        revenu: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  اليوم
                </label>
                <select
                  value={userInfos.jour || ""}
                  onChange={(e) =>
                    setUserInfos((prev) => ({
                      ...prev,
                      jour: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">اختر اليوم</option>
                  {[...Array(30)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    وثيقة التعريف <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={userInfos.type_piece_identite}
                    onChange={(e) =>
                      setUserInfos((prev) => ({
                        ...prev,
                        type_piece_identite: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="بطاقة التعريف الوطنية">بطاقة التعريف</option>
                    <option value="جواز السفر">جواز السفر</option>
                    <option value="رخصة السياقة">رخصة السياقة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    الرقم <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userInfos.numero_piece_identite}
                    onChange={(e) =>
                      setUserInfos((prev) => ({
                        ...prev,
                        numero_piece_identite: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    تاريخ الإصدار <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="date"
                      value={
                        userInfos.date_emission_piece
                          ? format(userInfos.date_emission_piece, "yyyy-MM-dd")
                          : ""
                      }
                      onChange={(e) =>
                        setUserInfos((prev) => ({
                          ...prev,
                          date_emission_piece: e.target.value
                            ? new Date(e.target.value)
                            : null,
                        }))
                      }
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 pr-10 text-white focus:border-amber-500 focus:outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  مكان الإصدار <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userInfos.lieu_emission_piece}
                  onChange={(e) =>
                    setUserInfos((prev) => ({
                      ...prev,
                      lieu_emission_piece: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Account Info Tab */}
          {activeTab === "account" && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                <h3 className="text-amber-400 font-semibold mb-2">
                  معلومات الحساب البريدي
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">
                    رقم الحساب <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userInfos.ccp}
                    onChange={handleCCPChange}
                    placeholder="أدخل رقم الحساب"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    المفتاح <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userInfos.cle}
                    onChange={(e) =>
                      setUserInfos((prev) => ({
                        ...prev,
                        cle: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  الرمز السري
                </label>
                <input
                  type="text"
                  value={userInfos.code}
                  onChange={(e) =>
                    setUserInfos((prev) => ({
                      ...prev,
                      code: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  ديون إبتدائية
                </label>
                <input
                  type="number"
                  value={userInfos.dette_initiale}
                  onChange={(e) =>
                    setUserInfos((prev) => ({
                      ...prev,
                      dette_initiale: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  ملاحظات
                </label>
                <textarea
                  rows={4}
                  value={userInfos.note}
                  onChange={(e) =>
                    setUserInfos((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div>
              {existingFiles.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-slate-300 font-semibold mb-3">
                    الملفات الحالية ({existingFiles.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {existingFiles.map((file) => {
                      const isImage = file.type === "image";
                      return (
                        <div key={file.id} className="relative group">
                          <div className="bg-slate-700 rounded-lg overflow-hidden border border-slate-600">
                            {isImage ? (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-32 object-cover"
                              />
                            ) : (
                              <div className="w-full h-32 flex items-center justify-center bg-slate-600">
                                <FileText className="w-12 h-12 text-slate-400" />
                              </div>
                            )}
                            <div className="p-2">
                              <p className="text-xs text-slate-400 truncate">
                                {file.name}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeExistingFile(file.id)}
                            className="absolute top-2 right-2 p-1 bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div
                onClick={handleFileClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-amber-500/50 rounded-xl p-8 text-center cursor-pointer hover:border-amber-500 transition bg-slate-800/50"
              >
                <Upload className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <p className="text-slate-300">🖱 اسحب الملفات أو انقر لاختيارها</p>
                <p className="text-slate-500 text-sm mt-1">
                  الصور، PDF، DOC - يدعم الملفات المتعددة
                </p>
                <input
                  type="file"
                  multiple
                  hidden
                  ref={fileInputRef}
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-slate-300 font-semibold mb-3">
                    الملفات الجديدة ({uploadedFiles.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {uploadedFiles.map((file, index) => {
                      const isImage = file.type.startsWith("image/");
                      const fileURL = URL.createObjectURL(file);
                      return (
                        <div key={index} className="relative group">
                          <div className="bg-slate-700 rounded-lg overflow-hidden border border-slate-600">
                            {isImage ? (
                              <img
                                src={fileURL}
                                alt={file.name}
                                className="w-full h-32 object-cover"
                              />
                            ) : (
                              <div className="w-full h-32 flex items-center justify-center bg-slate-600">
                                <FileText className="w-12 h-12 text-slate-400" />
                              </div>
                            )}
                            <div className="p-2">
                              <p className="text-xs text-slate-400 truncate">
                                {file.name}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeNewFile(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
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
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white rounded-lg transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEditMode ? "جاري التحديث..." : "جاري الحفظ..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? "تحديث المعلومات" : "حفظ المعلومات"}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}