import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  ArrowRightLeft,
  Package,
  Building2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import axios from "../../api/axiosInstance";

export default function AddTransfertDialog({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [magasins, setMagasins] = useState([]);
  const [selectedMagasinSource, setSelectedMagasinSource] = useState("");
  const [selectedMagasinDest, setSelectedMagasinDest] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [quantiteError, setQuantiteError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState(0);

  // Fetch magasins
  useEffect(() => {
    const fetchMagasins = async () => {
      try {
        const access_token = localStorage.getItem("access_token");
        const response = await axios.get("param/magasins/", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        setMagasins(response.data.results || []);
      } catch (error) {
        console.error("Erreur de récupération des magasins :", error);
      }
    };
    fetchMagasins();
  }, []);

  // Search products with debounce
  useEffect(() => {
    if (inputValue.length < 2) {
      setOptions([]);
      return;
    }

    const fetchProduits = async () => {
      setIsSearching(true);
      try {
        const access_token = localStorage.getItem("access_token");
        const response = await axios.get(`prod/produits/?search=${inputValue}`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        setOptions(response.data.results || []);
      } catch (error) {
        console.error("Erreur de récupération des produits :", error);
        setOptions([]);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchProduits();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [inputValue]);

  // Update available quantity when product or source magasin changes
  useEffect(() => {
    if (!selectedProduit || !selectedMagasinSource) {
      setAvailableQuantity(0);
      return;
    }

    // Find quantity in selected source magasin
    let quantity = 0;
    if (selectedProduit.magasins && Array.isArray(selectedProduit.magasins)) {
      const magasinEntry = selectedProduit.magasins.find(
        mag => mag.id == selectedMagasinSource
      );
      if (magasinEntry) {
        quantity = magasinEntry.codes_barres?.length || 0;
      }
    }
    
    setAvailableQuantity(quantity);
    
    // Reset quantity if it exceeds available
    if (quantite > quantity) {
      setQuantite(quantity || 1);
      if (quantity === 0) {
        setQuantiteError("هذا المخزن لا يحتوي على مخزون");
      } else {
        setQuantiteError("");
      }
    }
  }, [selectedProduit, selectedMagasinSource]);

  // Handle product selection
  const handleSelection = (product) => {
    setSelectedProduit(product);
    setSelectedMagasinSource("");
    setSelectedMagasinDest("");
    setQuantite(1);
    setQuantiteError("");
    setAvailableQuantity(0);
    setInputValue(product.nom);
  };

  // Handle quantity change
  const handleQuantiteChange = (e) => {
    const value = e.target.value;

    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const qty = parseInt(value, 10) || 0;
    setQuantite(qty);
    setQuantiteError("");

    if (selectedProduit && selectedMagasinSource && qty > 0) {
      if (qty > availableQuantity) {
        setQuantiteError(`الكمية لا يجب أن تتجاوز ${availableQuantity}`);
      }
    } else if (qty === 0) {
      setQuantiteError("الكمية يجب أن تكون أكبر من 0");
    }
  };

  // Submit transfer
  const handleSubmit = async () => {
    if (!selectedProduit?.id) {
      toast.warning("⚠️ يرجى اختيار منتج للتحويل");
      return;
    }

    if (!selectedMagasinSource) {
      toast.warning("⚠️ يرجى اختيار المخزن المصدر");
      return;
    }

    if (!selectedMagasinDest) {
      toast.warning("⚠️ يرجى اختيار المخزن الوجهة");
      return;
    }

    if (selectedMagasinSource === selectedMagasinDest) {
      toast.warning("⚠️ لا يمكن التحويل إلى نفس المخزن");
      return;
    }

    if (!quantite || quantite <= 0) {
      toast.warning("⚠️ يرجى إدخال كمية صحيحة");
      return;
    }

    if (quantiteError) {
      toast.warning(`⚠️ ${quantiteError}`);
      return;
    }

    setLoading(true);

    const data = {
      produit: selectedProduit.id,
      magasin_source: parseInt(selectedMagasinSource),
      magasin_destination: parseInt(selectedMagasinDest),
      quantite: parseInt(quantite, 10),
    };

    try {
      const access_token = localStorage.getItem("access_token");
      await axios.post("trans/transferts/", data, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("✅ تم تحويل المنتج بنجاح");
      if (onSuccess) onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Erreur lors de la soumission :", error);
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.response?.data?.quantite ||
                           "❌ حدث خطأ أثناء عملية التحويل";
      
      // Display detailed error if it's about insufficient stock
      if (typeof errorMessage === 'string' && errorMessage.includes('Stock insuffisant')) {
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProduit(null);
    setSelectedMagasinSource("");
    setSelectedMagasinDest("");
    setQuantite(1);
    setQuantiteError("");
    setOptions([]);
    setInputValue("");
    setAvailableQuantity(0);
  };

  // Get magasins that have stock for the selected product (for source selection)
  const getAvailableSourceMagasins = () => {
    if (!selectedProduit || !selectedProduit.magasins) return [];
    
    return selectedProduit.magasins
      .filter(mag => (mag.codes_barres?.length || 0) > 0)
      .map(mag => ({
        id: mag.id,
        nom: mag.nom,
        quantite: mag.codes_barres?.length || 0
      }));
  };

  // Get destination magasins (all except source)
  const getDestinationMagasins = () => {
    if (!selectedMagasinSource) return magasins;
    return magasins.filter(mag => mag.id != selectedMagasinSource);
  };

  const sourceMagasins = getAvailableSourceMagasins();
  const destMagasins = getDestinationMagasins();

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 rounded-xl w-[600px] max-h-[90vh] overflow-hidden shadow-2xl border border-orange-500/30"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-white" />
                <h2 className="text-white text-xl font-bold">تحويل سلعة</h2>
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
                {/* Product Search */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    بحث عن منتج <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Package className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="أدخل اسم المنتج أو الباركود..."
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  
                  {/* Search Results */}
                  {inputValue.length >= 2 && (
                    <div className="mt-2 border border-slate-600 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-3 text-center text-slate-400">
                          <div className="inline-block w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="mr-2">جاري البحث...</span>
                        </div>
                      ) : options.length > 0 ? (
                        options.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleSelection(product)}
                            className={`w-full text-right p-3 hover:bg-slate-700 transition border-b border-slate-600 last:border-b-0 ${
                              selectedProduit?.id === product.id
                                ? "bg-orange-500/20 border-r-2 border-orange-500"
                                : ""
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-white font-medium">{product.nom}</span>
                              <span className="text-slate-400 text-sm">
                                المخزون الكلي: <span className="text-amber-400">{product.quantite_totale || 0}</span>
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              المرجع: {product.reference}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-slate-400">
                          لا توجد نتائج
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Product Info */}
                {selectedProduit && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-orange-400 font-semibold">المنتج المختار</span>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-white font-medium">{selectedProduit.nom}</div>
                    <div className="text-sm text-slate-400 mt-1">
                      المرجع: {selectedProduit.reference}
                    </div>
                  </div>
                )}

                {/* Source Magasin */}
                {selectedProduit && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      المخزن المصدر <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                      <select
                        value={selectedMagasinSource}
                        onChange={(e) => setSelectedMagasinSource(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-orange-500 focus:outline-none appearance-none"
                      >
                        <option value="">اختر المخزن المصدر</option>
                        {sourceMagasins.map((magasin) => (
                          <option key={magasin.id} value={magasin.id}>
                            {magasin.nom} (المخزون: {magasin.quantite})
                          </option>
                        ))}
                      </select>
                    </div>
                    {sourceMagasins.length === 0 && (
                      <p className="text-xs text-yellow-500 mt-1">
                        لا توجد مخازن بها مخزون لهذا المنتج
                      </p>
                    )}
                  </div>
                )}

                {/* Arrow Icon */}
                {selectedMagasinSource && (
                  <div className="flex justify-center">
                    <div className="bg-slate-700 rounded-full p-2">
                      <ArrowRight className="w-5 h-5 text-orange-400" />
                    </div>
                  </div>
                )}

                {/* Destination Magasin */}
                {selectedMagasinSource && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      المخزن الوجهة <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                      <select
                        value={selectedMagasinDest}
                        onChange={(e) => setSelectedMagasinDest(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-orange-500 focus:outline-none appearance-none"
                      >
                        <option value="">اختر المخزن الوجهة</option>
                        {destMagasins.map((magasin) => (
                          <option key={magasin.id} value={magasin.id}>
                            {magasin.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Quantity */}
                {selectedMagasinSource && selectedMagasinDest && (
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">
                      الكمية المراد تحويلها <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <ArrowRightLeft className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                      <input
                        type="text"
                        value={quantite}
                        onChange={handleQuantiteChange}
                        className={`w-full bg-slate-700 border rounded-lg px-10 py-2 text-white focus:outline-none ${
                          quantiteError
                            ? "border-red-500 focus:border-red-500"
                            : "border-slate-600 focus:border-orange-500"
                        }`}
                        placeholder="أدخل الكمية"
                      />
                    </div>
                    {quantiteError && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                        <AlertCircle className="w-3 h-3" />
                        <span>{quantiteError}</span>
                      </div>
                    )}
                    {availableQuantity > 0 && !quantiteError && (
                      <p className="text-xs text-emerald-500 mt-1">
                        المتوفر: {availableQuantity} وحدة
                      </p>
                    )}
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-slate-700/30 rounded-lg p-3 mt-2">
                  <p className="text-xs text-slate-400 text-center">
                    <ArrowRightLeft className="w-3 h-3 inline ml-1" />
                    سيتم نقل المنتج من المخزن المصدر إلى المخزن الوجهة مع تحديث المخزون تلقائياً
                  </p>
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
                disabled={loading || !selectedProduit || !selectedMagasinSource || !selectedMagasinDest || !quantite || quantiteError}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري التحويل...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4" />
                    تحويل
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