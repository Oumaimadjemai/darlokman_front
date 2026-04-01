import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Barcode, 
  Store, 
  Package, 
  CheckCircle, 
  Scan, 
  RefreshCw,
  AlertCircle,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Play,
  Save,
  List,
  Eye,
  X,
  Search,
  Trash2
} from "lucide-react";
import axios from "../../api/axiosInstance";
import { toast } from "sonner";
import ConfirmationDialog from "../Cards/ConfirmationDialog";

export default function InventaireStock() {
  const [magasins, setMagasins] = useState([]);
  const [selectedMagasin, setSelectedMagasin] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [inventoryLines, setInventoryLines] = useState([]);
  const [scannedProducts, setScannedProducts] = useState({});
  const [confirmedProducts, setConfirmedProducts] = useState({});
  const [loading, setLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({
    title: "",
    text: "",
    type: "warning",
    onConfirm: null
  });
  const inputRef = useRef(null);

  // Fetch stores
  useEffect(() => {
    const fetchMagasins = async () => {
      try {
        const res = await axios.get("/param/magasins/");
        setMagasins(res.data.results || []);
      } catch (err) {
        console.error("Error fetching magasins:", err);
        toast.error("فشل تحميل قائمة المحلات");
      }
    };
    fetchMagasins();
  }, []);

  // Fetch products for selected magasin
  useEffect(() => {
    if (selectedMagasin) {
      fetchProducts();
    }
  }, [selectedMagasin]);

  // Fetch products from the selected magasin
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get("/prod/produits/", {
        headers: { Authorization: `Bearer ${token}` },
        params: { magasin: selectedMagasin.id, page_size: 1000 }
      });
      
      const productsData = response.data.results || [];
      
      // Process products to show quantity in selected magasin
      const processedProducts = productsData.map(product => {
        let magasinQuantity = 0;
        let magasinBarcodes = [];
        if (product.magasins && Array.isArray(product.magasins)) {
          const magEntry = product.magasins.find(mag => mag.id == selectedMagasin.id);
          if (magEntry) {
            magasinQuantity = magEntry.codes_barres?.length || 0;
            magasinBarcodes = magEntry.codes_barres || [];
          }
        }
        return {
          id: product.id,
          nom: product.nom,
          reference: product.reference,
          quantite_theorique: magasinQuantity,
          quantite_comptee: 0,
          ecart: 0,
          est_verifie: false,
          codes_barres: magasinBarcodes
        };
      });
      
      setProducts(processedProducts);
      setInventoryLines(processedProducts);
      
      // Initialize scanned products object
      const scanned = {};
      processedProducts.forEach(p => {
        scanned[p.id] = [];
      });
      setScannedProducts(scanned);
      
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("فشل تحميل المنتجات");
    } finally {
      setLoading(false);
    }
  };

  // Start new inventory session
  const startInventorySession = () => {
    if (!selectedMagasin) {
      toast.error("الرجاء اختيار المحل أولاً");
      return;
    }
    
    setConfirmationConfig({
      title: "بدء جرد جديد",
      text: "هل أنت متأكد من بدء جرد جديد للمخزون؟",
      type: "info",
      onConfirm: () => {
        setCurrentSession({
          id: Date.now(),
          magasin: selectedMagasin,
          date_debut: new Date().toISOString(),
          date_fin: null
        });
        toast.success("تم بدء جرد المخزون بنجاح");
        
        // Reset inventory data
        setInventoryLines(products);
        setConfirmedProducts({});
        setScannedProducts({});
        
        // Focus on barcode input
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
        
        setShowConfirmation(false);
      }
    });
    setShowConfirmation(true);
  };

  // Handle barcode scan
  const handleBarcodeScan = async (e) => {
    if (e.key === "Enter" && barcodeInput) {
      const code = barcodeInput.trim();
      
      if (!currentSession) {
        toast.warning("يرجى بدء جلسة جرد أولاً");
        setBarcodeInput("");
        return;
      }
      
      if (!selectedMagasin) {
        toast.warning("يرجى اختيار المحل أولاً");
        setBarcodeInput("");
        return;
      }
      
      setLoading(true);
      
      try {
        // Find product by barcode
        const product = products.find(p => 
          p.codes_barres && p.codes_barres.includes(code)
        );
        
        if (!product) {
          toast.error("الباركود غير مسجل في النظام");
          setBarcodeInput("");
          setLoading(false);
          return;
        }
        
        // Update scanned products
        setScannedProducts(prev => {
          const newScanned = { ...prev };
          if (!newScanned[product.id]) {
            newScanned[product.id] = [];
          }
          newScanned[product.id] = [...newScanned[product.id], code];
          return newScanned;
        });
        
        // Update inventory lines
        setInventoryLines(prev => {
          const newLines = [...prev];
          const index = newLines.findIndex(l => l.id === product.id);
          if (index !== -1) {
            const newCount = newLines[index].quantite_comptee + 1;
            newLines[index].quantite_comptee = newCount;
            newLines[index].ecart = newCount - newLines[index].quantite_theorique;
          }
          return newLines;
        });
        
        toast.success(`تم تسجيل: ${product.nom}`);
        setBarcodeInput("");
        
      } catch (err) {
        console.error("Error scanning barcode:", err);
        toast.error("فشل معالجة الباركود");
      } finally {
        setLoading(false);
      }
    }
  };

  // Confirm product count
  const handleConfirmProduct = (productId) => {
    setConfirmedProducts(prev => ({ ...prev, [productId]: true }));
    
    setInventoryLines(prev => {
      const newLines = [...prev];
      const index = newLines.findIndex(l => l.id === productId);
      if (index !== -1) {
        newLines[index].est_verifie = true;
      }
      return newLines;
    });
    
    toast.success("تم تأكيد المنتج");
  };

  // Confirm all products
  const handleConfirmAll = () => {
    const unconfirmedCount = inventoryLines.filter(p => !p.est_verifie).length;
    
    setConfirmationConfig({
      title: "تأكيد جميع المنتجات",
      text: `هل أنت متأكد من تأكيد ${unconfirmedCount} منتج؟`,
      type: "warning",
      onConfirm: () => {
        const allProductIds = inventoryLines.map(p => p.id);
        const newConfirmed = {};
        allProductIds.forEach(id => {
          newConfirmed[id] = true;
        });
        setConfirmedProducts(newConfirmed);
        
        setInventoryLines(prev => {
          return prev.map(p => ({ ...p, est_verifie: true }));
        });
        
        toast.success(`تم تأكيد جميع المنتجات (${inventoryLines.length})`);
        setShowConfirmation(false);
      }
    });
    setShowConfirmation(true);
  };

  // Finish inventory session
  const handleFinishInventory = () => {
    const unconfirmed = inventoryLines.filter(p => !p.est_verifie);
    if (unconfirmed.length > 0) {
      toast.warning(`يرجى تأكيد ${unconfirmed.length} منتج قبل إنهاء الجرد`);
      return;
    }
    
    setConfirmationConfig({
      title: "إنهاء جرد المخزون",
      text: "هل أنت متأكد من إنهاء جرد المخزون؟ لا يمكن التراجع عن هذا الإجراء.",
      type: "danger",
      onConfirm: () => {
        setCurrentSession(null);
        setConfirmedProducts({});
        setScannedProducts({});
        setBarcodeInput("");
        toast.success("تم إنهاء جرد المخزون بنجاح");
        setShowConfirmation(false);
      }
    });
    setShowConfirmation(true);
  };

  // Reset current session
  const handleReset = () => {
    setConfirmationConfig({
      title: "إلغاء الجرد الحالي",
      text: "سيتم إلغاء الجرد الحالي وفقدان جميع البيانات المسجلة. هل أنت متأكد؟",
      type: "danger",
      onConfirm: () => {
        setCurrentSession(null);
        setConfirmedProducts({});
        setScannedProducts({});
        setInventoryLines(products);
        setBarcodeInput("");
        toast.info("تم إلغاء الجرد");
        setShowConfirmation(false);
      }
    });
    setShowConfirmation(true);
  };

  // Filter products by search term
  const filteredProducts = inventoryLines.filter(product =>
    product.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.reference && product.reference.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate statistics
  const totalProducts = inventoryLines.length;
  const confirmedCount = inventoryLines.filter(p => p.est_verifie).length;
  const unconfirmedCount = totalProducts - confirmedCount;
  const totalTheoretical = inventoryLines.reduce((sum, p) => sum + p.quantite_theorique, 0);
  const totalCounted = inventoryLines.reduce((sum, p) => sum + p.quantite_comptee, 0);
  const totalEcart = totalCounted - totalTheoretical;
  const completionRate = totalProducts > 0 ? (confirmedCount / totalProducts) * 100 : 0;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl text-white">جرد المخزون</h1>
            {currentSession && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                جلسة نشطة
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {!currentSession && (
              <button
                onClick={startInventorySession}
                disabled={!selectedMagasin || loading}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                <span>بدء الجرد</span>
              </button>
            )}
            {currentSession && (
              <>
                <button
                  onClick={handleFinishInventory}
                  disabled={loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>إنهاء الجرد</span>
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>إلغاء الجرد</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Store Selection */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg text-white">اختر المحل</h2>
          </div>
          <select
            value={selectedMagasin?.id || ""}
            onChange={(e) => {
              const mag = magasins.find(m => m.id === parseInt(e.target.value));
              setSelectedMagasin(mag || null);
            }}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            disabled={currentSession !== null}
          >
            <option value="">اختر المحل</option>
            {magasins.map((magasin) => (
              <option key={magasin.id} value={magasin.id}>
                {magasin.nom}
              </option>
            ))}
          </select>
          {selectedMagasin && (
            <p className="text-sm text-cyan-400 mt-2">
              المحل المحدد: {selectedMagasin.nom}
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              <div className="text-xs text-blue-300">إجمالي المنتجات</div>
            </div>
            <div className="text-2xl font-bold text-white mt-2">{totalProducts}</div>
          </div>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div className="text-xs text-emerald-300">المؤكدة</div>
            </div>
            <div className="text-2xl font-bold text-white mt-2">{confirmedCount}</div>
          </div>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <div className="text-xs text-amber-300">نسبة التقدم</div>
            </div>
            <div className="text-2xl font-bold text-white mt-2">{completionRate.toFixed(1)}%</div>
            <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500" 
                style={{ width: `${completionRate}%` }} 
              />
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <div className="text-xs text-purple-300">الفارق الكلي</div>
            </div>
            <div className={`text-2xl font-bold mt-2 ${totalEcart > 0 ? 'text-emerald-400' : totalEcart < 0 ? 'text-red-400' : 'text-white'}`}>
              {totalEcart > 0 ? `+${totalEcart}` : totalEcart}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT SIDE - Scanner */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Barcode className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg text-white">مسح الباركودات</h2>
            </div>

            {/* Barcode Input - Scanner ready */}
            <div className="relative mb-4">
              <Barcode className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
              <input
                ref={inputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyPress={handleBarcodeScan}
                placeholder={currentSession ? "امسح الباركود أو أدخله يدوياً..." : "ابدأ جلسة الجرد أولاً..."}
                className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-3 text-sm outline-none focus:border-amber-500 placeholder-slate-400"
                disabled={!currentSession || loading}
                autoFocus={currentSession}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-amber-400">
                <Scan className="w-4 h-4" />
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
              <input
                type="text"
                placeholder="البحث عن منتج..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500 placeholder-slate-400"
              />
            </div>

            {/* Action Buttons */}
            {currentSession && confirmedCount < totalProducts && (
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmAll}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 inline ml-2" />
                  تأكيد الكل ({totalProducts - confirmedCount})
                </button>
              </div>
            )}

            {/* Instructions */}
            {!currentSession && selectedMagasin && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm text-center">
                  اضغط على "بدء الجرد" لبدء جلسة جرد جديدة
                </p>
              </div>
            )}
            {currentSession && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-amber-300 text-sm text-center flex items-center justify-center gap-2">
                  <Scan className="w-4 h-4" />
                  قم بمسح الباركودات باستخدام قارئ الباركود
                </p>
              </div>
            )}
          </div>

          {/* RIGHT SIDE - Product List */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg text-white">قائمة المنتجات</h2>
              </div>
              <span className="text-slate-400 text-sm">{filteredProducts.length} منتج</span>
            </div>

            <div className="bg-slate-800/50 rounded-lg border border-slate-700 max-h-[500px] overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">لا توجد منتجات</p>
                  {searchTerm && <p className="text-xs mt-1">نتيجة بحث: "{searchTerm}"</p>}
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="p-4 hover:bg-slate-700/30 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-white font-medium">{product.nom}</div>
                          <div className="text-xs text-slate-400 mt-1">
                            <span>المرجع: {product.reference || '-'}</span>
                            <span className="mx-2">•</span>
                            <span>متوقع: {product.quantite_theorique}</span>
                            <span className="mx-2">•</span>
                            <span>مقروء: {product.quantite_comptee}</span>
                            {product.ecart !== 0 && (
                              <>
                                <span className="mx-2">•</span>
                                <span className={product.ecart > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                  فرق: {product.ecart > 0 ? `+${product.ecart}` : product.ecart}
                                </span>
                              </>
                            )}
                          </div>
                          {product.codes_barres && product.codes_barres.length > 0 && (
                            <div className="text-xs text-slate-500 mt-1 font-mono">
                              {product.codes_barres.slice(0, 2).map((code, idx) => (
                                <span key={idx} className="inline-block bg-slate-700 px-1 rounded mr-1">
                                  {code}
                                </span>
                              ))}
                              {product.codes_barres.length > 2 && (
                                <span>+{product.codes_barres.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                        {!product.est_verifie && currentSession && (
                          <button
                            onClick={() => handleConfirmProduct(product.id)}
                            disabled={loading}
                            className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition disabled:opacity-50"
                          >
                            تأكيد
                          </button>
                        )}
                        {product.est_verifie && (
                          <div className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs">مؤكد</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Loading Indicator */}
            {loading && (
              <div className="mt-4 flex justify-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmationConfig.onConfirm || (() => setShowConfirmation(false))}
        text={confirmationConfig.text}
        title={confirmationConfig.title}
        confirmText="تأكيد"
        cancelText="إلغاء"
        type={confirmationConfig.type}
      />
    </>
  );
}