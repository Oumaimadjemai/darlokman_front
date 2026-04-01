import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  Save,
  Package,
  DollarSign,
  Upload,
  Trash2,
  Edit,
  Barcode,
  Building2,
} from "lucide-react";
import axios from "../../api/axiosInstance";

export default function AddProduitDialog({ open, onClose, onSuccess, productToEdit = null }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [magasins, setMagasins] = useState([]);
  const [familles, setFamilles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMagasin, setSelectedMagasin] = useState("");
  const [quantiteInitiale, setQuantiteInitiale] = useState(0);
  const [initialBarcodes, setInitialBarcodes] = useState([]);

  // Product state
  const [productInfo, setProductInfo] = useState({
    nom: "",
    reference: "",
    famille: "",
    marque: "",
    prix_achat: 0,
    prix_vente_cache: 0,
    prix_vente_3: 0,
    prix_vente_5: 0,
    prix_vente_6: 0,
    prix_vente_8: 0,
    prix_vente_9: 0,
    prix_vente_10: 0,
    prix_vente_12: 0,
    prix_vente_15: 0,
    taux_benefice_cache: 0,
    taux_benefice_3: 0,
    taux_benefice_5: 0,
    taux_benefice_6: 0,
    taux_benefice_8: 0,
    taux_benefice_9: 0,
    taux_benefice_10: 0,
    taux_benefice_12: 0,
    taux_benefice_15: 0,
  });

  // Fetch magasins and familles
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const access_token = localStorage.getItem("access_token");
          const headers = { Authorization: `Bearer ${access_token}` };

          // Fetch magasins
          const magasinRes = await axios.get("/param/magasins/", { headers });
          setMagasins(magasinRes.data.results || []);

          // Fetch familles
          const familleRes = await axios.get("/prod/produits/familles/", { headers });
          const famillesList = familleRes.data.familles || [];
          setFamilles(famillesList.map(f => f.famille));
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      fetchData();
    }
  }, [open]);

  // Initialize edit mode
  useEffect(() => {
    if (productToEdit) {
      setIsEditMode(true);
      
      setProductInfo({
        nom: productToEdit.nom || "",
        reference: productToEdit.reference || "",
        famille: productToEdit.famille || "",
        marque: productToEdit.marque || "",
        prix_achat: parseFloat(productToEdit.prix_achat) || 0,
        prix_vente_cache: parseFloat(productToEdit.prix_vente_cache) || 0,
        prix_vente_3: parseFloat(productToEdit.prix_vente_3) || 0,
        prix_vente_5: parseFloat(productToEdit.prix_vente_5) || 0,
        prix_vente_6: parseFloat(productToEdit.prix_vente_6) || 0,
        prix_vente_8: parseFloat(productToEdit.prix_vente_8) || 0,
        prix_vente_9: parseFloat(productToEdit.prix_vente_9) || 0,
        prix_vente_10: parseFloat(productToEdit.prix_vente_10) || 0,
        prix_vente_12: parseFloat(productToEdit.prix_vente_12) || 0,
        prix_vente_15: parseFloat(productToEdit.prix_vente_15) || 0,
        taux_benefice_cache: parseFloat(productToEdit.taux_benefice_cache) || 0,
        taux_benefice_3: parseFloat(productToEdit.taux_benefice_3) || 0,
        taux_benefice_5: parseFloat(productToEdit.taux_benefice_5) || 0,
        taux_benefice_6: parseFloat(productToEdit.taux_benefice_6) || 0,
        taux_benefice_8: parseFloat(productToEdit.taux_benefice_8) || 0,
        taux_benefice_9: parseFloat(productToEdit.taux_benefice_9) || 0,
        taux_benefice_10: parseFloat(productToEdit.taux_benefice_10) || 0,
        taux_benefice_12: parseFloat(productToEdit.taux_benefice_12) || 0,
        taux_benefice_15: parseFloat(productToEdit.taux_benefice_15) || 0,
      });
      
      // Store initial barcodes for display only (read-only)
      if (productToEdit.codes_barres && Array.isArray(productToEdit.codes_barres)) {
        setInitialBarcodes(productToEdit.codes_barres);
      }
      
      // Set existing images
      if (productToEdit.image) {
        setExistingFiles([{
          id: "main_image",
          url: productToEdit.image,
          name: "صورة المنتج"
        }]);
      }
    } else {
      setIsEditMode(false);
      resetForm();
    }
  }, [productToEdit, open]);

  // Price calculation functions
  const calculatePrice = (prixAchat, taux) => {
    if (!prixAchat || prixAchat <= 0) return 0;
    return Math.round(prixAchat * (1 + taux / 100));
  };

  const calculateTaux = (prixAchat, prixVente) => {
    if (!prixAchat || prixAchat <= 0 || !prixVente || prixVente <= 0) return 0;
    return Math.round(((prixVente - prixAchat) / prixAchat) * 100);
  };

  const handlePriceOrRateChange = (e) => {
    const { name, value } = e.target;
    const rawValue = value.replace(/\D/g, "");
    const numValue = rawValue === "" ? 0 : parseFloat(rawValue);

    setProductInfo((prev) => {
      const updated = { ...prev, [name]: numValue };
      const prixAchat = updated.prix_achat || 0;

      if (name === "prix_achat") {
        const fields = ["cache", "3", "5", "6", "8", "9", "10", "12", "15"];
        fields.forEach((key) => {
          const taux = updated[`taux_benefice_${key}`] || 0;
          updated[`prix_vente_${key}`] = calculatePrice(prixAchat, taux);
        });
      } else if (name.startsWith("taux_benefice_")) {
        const key = name.replace("taux_benefice_", "");
        updated[`prix_vente_${key}`] = calculatePrice(prixAchat, numValue);
      } else if (name.startsWith("prix_vente_")) {
        const key = name.replace("prix_vente_", "");
        updated[`taux_benefice_${key}`] = calculateTaux(prixAchat, numValue);
      }

      return updated;
    });
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

  const removeNewFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (fileId) => {
    setFilesToDelete((prev) => [...prev, fileId]);
    setExistingFiles((prev) => prev.filter(f => f.id !== fileId));
  };

  // Submit
  const handleSubmit = async () => {
    if (!productInfo.nom || !productInfo.reference) {
      toast.warning("⚠️ يرجى ملء الحقول الإلزامية: الإسم، المرجع");
      return;
    }

    if (!productInfo.famille) {
      toast.warning("⚠️ يرجى اختيار عائلة للمنتج");
      return;
    }

    if (!isEditMode && !selectedMagasin) {
      toast.warning("⚠️ يرجى اختيار المخزن الرئيسي");
      return;
    }

    setLoading(true);

    try {
      const access_token = localStorage.getItem("access_token");
      const formData = new FormData();

      // Prepare payload - DO NOT include barcodes (they are read-only)
      const payload = {
        nom: productInfo.nom,
        reference: productInfo.reference,
        famille: productInfo.famille,
        marque: productInfo.marque,
        prix_achat: Number(productInfo.prix_achat) || 0,
        prix_vente_cache: Number(productInfo.prix_vente_cache) || 0,
        prix_vente_3: Number(productInfo.prix_vente_3) || 0,
        prix_vente_5: Number(productInfo.prix_vente_5) || 0,
        prix_vente_6: Number(productInfo.prix_vente_6) || 0,
        prix_vente_8: Number(productInfo.prix_vente_8) || 0,
        prix_vente_9: Number(productInfo.prix_vente_9) || 0,
        prix_vente_10: Number(productInfo.prix_vente_10) || 0,
        prix_vente_12: Number(productInfo.prix_vente_12) || 0,
        prix_vente_15: Number(productInfo.prix_vente_15) || 0,
        taux_benefice_cache: Number(productInfo.taux_benefice_cache) || 0,
        taux_benefice_3: Number(productInfo.taux_benefice_3) || 0,
        taux_benefice_5: Number(productInfo.taux_benefice_5) || 0,
        taux_benefice_6: Number(productInfo.taux_benefice_6) || 0,
        taux_benefice_8: Number(productInfo.taux_benefice_8) || 0,
        taux_benefice_9: Number(productInfo.taux_benefice_9) || 0,
        taux_benefice_10: Number(productInfo.taux_benefice_10) || 0,
        taux_benefice_12: Number(productInfo.taux_benefice_12) || 0,
        taux_benefice_15: Number(productInfo.taux_benefice_15) || 0,
      };

      // For new product, add magasin_principal and quantite
      if (!isEditMode) {
        payload.magasin_principal = parseInt(selectedMagasin);
        payload.quantite = quantiteInitiale;
      }
      // For edit mode, DO NOT include barcodes - they are read-only and should not be modified

      // Add all payload fields to FormData
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      // Add new images
      uploadedFiles.forEach((file) => formData.append("image", file));

      // Add files to delete
      filesToDelete.forEach((fileId) => {
        formData.append("delete_images", fileId);
      });

      if (isEditMode && productToEdit?.id) {
        await axios.patch(`/prod/produits/${productToEdit.id}/`, formData, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("✅ تم تحديث المنتج بنجاح");
      } else {
        await axios.post("prod/produits/", formData, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("✅ تم إضافة المنتج بنجاح");
      }

      if (onSuccess) onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      console.error("Error:", err);
      let message = "❌ حدث خطأ أثناء " + (isEditMode ? "تحديث" : "إضافة") + " المنتج";
      if (err.response?.data) {
        if (typeof err.response.data === "object") {
          const errors = Object.entries(err.response.data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join(" | ");
          message = errors;
        } else {
          message = err.response.data.toString();
        }
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProductInfo({
      nom: "",
      reference: "",
      famille: "",
      marque: "",
      prix_achat: 0,
      prix_vente_cache: 0,
      prix_vente_3: 0,
      prix_vente_5: 0,
      prix_vente_6: 0,
      prix_vente_8: 0,
      prix_vente_9: 0,
      prix_vente_10: 0,
      prix_vente_12: 0,
      prix_vente_15: 0,
      taux_benefice_cache: 0,
      taux_benefice_3: 0,
      taux_benefice_5: 0,
      taux_benefice_6: 0,
      taux_benefice_8: 0,
      taux_benefice_9: 0,
      taux_benefice_10: 0,
      taux_benefice_12: 0,
      taux_benefice_15: 0,
    });
    setInitialBarcodes([]);
    setUploadedFiles([]);
    setExistingFiles([]);
    setFilesToDelete([]);
    setSelectedMagasin("");
    setQuantiteInitiale(0);
  };

  if (!open) return null;

  const tabs = [
    { id: "basic", label: "معلومات السلعة", icon: Package },
    { id: "pricing", label: "التسعير", icon: DollarSign },
    { id: "barcodes", label: "الباركودات", icon: Barcode },
    { id: "images", label: "الصور", icon: Upload },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 rounded-xl w-[1000px] max-h-[90vh] overflow-hidden shadow-2xl border border-purple-500/30"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                {isEditMode ? (
                  <Edit className="w-5 h-5 text-white" />
                ) : (
                  <Package className="w-5 h-5 text-white" />
                )}
                <h2 className="text-white text-xl font-bold">
                  {isEditMode ? "تعديل منتج" : "إضافة منتج جديد"}
                </h2>
                {isEditMode && productToEdit && (
                  <span className="bg-white/20 text-white text-sm px-2 py-1 rounded-lg mr-2">
                    #{productToEdit.id}
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
            <div className="flex border-b border-slate-700 bg-slate-900/50 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-b-2 border-purple-500 text-purple-400"
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
              {/* Basic Info Tab */}
              {activeTab === "basic" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">
                        المرجع <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={productInfo.reference}
                        onChange={(e) =>
                          setProductInfo((prev) => ({ ...prev, reference: e.target.value }))
                        }
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="RF-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">
                        اسم المنتج <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={productInfo.nom}
                        onChange={(e) =>
                          setProductInfo((prev) => ({ ...prev, nom: e.target.value }))
                        }
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="اسم المنتج"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">
                        العائلة <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={productInfo.famille}
                        onChange={(e) =>
                          setProductInfo((prev) => ({ ...prev, famille: e.target.value }))
                        }
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      >
                        <option value="">اختر العائلة</option>
                        {familles.map((famille) => (
                          <option key={famille} value={famille}>
                            {famille}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">
                        العلامة التجارية
                      </label>
                      <input
                        type="text"
                        value={productInfo.marque}
                        onChange={(e) =>
                          setProductInfo((prev) => ({ ...prev, marque: e.target.value }))
                        }
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="العلامة"
                      />
                    </div>
                  </div>

                  {/* Only show magasin selection for new product */}
                  {!isEditMode && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">
                        المخزن الرئيسي <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <select
                          value={selectedMagasin}
                          onChange={(e) => setSelectedMagasin(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option value="">اختر المخزن الرئيسي</option>
                          {magasins.map((mag) => (
                            <option key={mag.id} value={mag.id}>
                              {mag.nom}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Initial quantity for new product */}
                  {!isEditMode && selectedMagasin && (
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">
                        الكمية الإبتدائية
                      </label>
                      <input
                        type="number"
                        value={quantiteInitiale}
                        onChange={(e) => setQuantiteInitiale(parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="الكمية"
                      />
                    </div>
                  )}

                  {/* Show magasin info for edit mode */}
                  {isEditMode && productToEdit?.magasin_principal_detail && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-slate-400">المخزن الرئيسي:</span>
                        <span className="text-white">{productToEdit.magasin_principal_detail?.nom}</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mt-4">
                    <h3 className="text-purple-400 font-semibold mb-2">سعر الشراء</h3>
                    <div>
                      <input
                        type="text"
                        name="prix_achat"
                        value={productInfo.prix_achat || ""}
                        onChange={handlePriceOrRateChange}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="سعر الشراء"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Tab */}
              {activeTab === "pricing" && (
                <div className="space-y-4">
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
                    <h3 className="text-purple-400 font-semibold mb-2">أسعار البيع والفائدة</h3>
                    <p className="text-slate-400 text-sm">أدخل سعر البيع أو نسبة الفائدة وسيتم حساب الآخر تلقائياً</p>
                  </div>

                  {[
                    { key: "cache", label: "كاش" },
                    { key: "3", label: "3 أشهر" },
                    { key: "5", label: "5 أشهر" },
                    { key: "6", label: "6 أشهر" },
                    { key: "8", label: "8 أشهر" },
                    { key: "9", label: "9 أشهر" },
                    { key: "10", label: "10 أشهر" },
                    { key: "12", label: "12 شهر" },
                    { key: "15", label: "15 شهر" },
                  ].map((item) => (
                    <div key={item.key} className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">
                          سعر البيع {item.label}
                        </label>
                        <input
                          type="text"
                          name={`prix_vente_${item.key}`}
                          value={productInfo[`prix_vente_${item.key}`] || ""}
                          onChange={handlePriceOrRateChange}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                          placeholder="سعر البيع"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">
                          الفائدة {item.label} (%)
                        </label>
                        <input
                          type="text"
                          name={`taux_benefice_${item.key}`}
                          value={productInfo[`taux_benefice_${item.key}`] || ""}
                          onChange={handlePriceOrRateChange}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                          placeholder="%"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Barcodes Tab - READ ONLY */}
              {activeTab === "barcodes" && (
                <div className="space-y-4">
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <h3 className="text-purple-400 font-semibold mb-3">قائمة الباركودات</h3>
                    {isEditMode ? (
                      <>
                        <p className="text-amber-400 text-sm mb-4 flex items-center gap-2">
                          <Barcode className="w-4 h-4" />
                          ⚠️ الباركودات للقراءة فقط ولا يمكن تعديلها
                        </p>
                        {initialBarcodes.length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {initialBarcodes.map((code, index) => (
                              <div key={index} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                                <code className="text-sm text-amber-400 font-mono">{code}</code>
                                <span className="text-xs text-slate-500">باركود {index + 1}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 text-center py-4">
                            لا توجد باركودات لهذا المنتج
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-slate-400 text-sm mb-4">
                          💡 سيتم إنشاء الباركودات تلقائياً عند إضافة الكمية في المخزن
                        </p>
                        <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                          <Barcode className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                          <p className="text-slate-400 text-sm">
                            سيتم إنشاء الباركودات بعد إضافة المنتج وتحديد الكمية
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Images Tab */}
              {activeTab === "images" && (
                <div>
                  {/* Existing Images */}
                  {existingFiles.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-slate-300 font-semibold mb-3">
                        الصور الحالية ({existingFiles.length})
                      </h3>
                      <div className="grid grid-cols-4 gap-4">
                        {existingFiles.map((file) => (
                          <div key={file.id} className="relative group">
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-24 object-cover rounded-lg border border-slate-600"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/150?text=No+Image";
                              }}
                            />
                            <button
                              onClick={() => removeExistingFile(file.id)}
                              className="absolute top-1 right-1 p-1 bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition"
                            >
                              <Trash2 className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload New Images */}
                  <div
                    onClick={() => document.getElementById("file-input").click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-purple-500/50 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition bg-slate-800/50"
                  >
                    <Upload className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                    <p className="text-slate-300">🖱 اسحب الصور أو انقر لاختيارها</p>
                    <p className="text-slate-500 text-sm mt-1">
                      JPG, PNG, GIF - يدعم الملفات المتعددة
                    </p>
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      accept="image/*"
                      hidden
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </div>

                  {/* New Images */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-slate-300 font-semibold mb-3">
                        الصور الجديدة ({uploadedFiles.length})
                      </h3>
                      <div className="grid grid-cols-4 gap-4">
                        {uploadedFiles.map((file, index) => {
                          const fileURL = URL.createObjectURL(file);
                          return (
                            <div key={index} className="relative group">
                              <img
                                src={fileURL}
                                alt={file.name}
                                className="w-full h-24 object-cover rounded-lg border border-slate-600"
                              />
                              <button
                                onClick={() => removeNewFile(index)}
                                className="absolute top-1 right-1 p-1 bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition"
                              >
                                <Trash2 className="w-3 h-3 text-white" />
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
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditMode ? "تحديث المنتج" : "حفظ المنتج"}
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