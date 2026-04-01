import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Trash2, Save, Search, Building2, User, ArrowLeft, CreditCard, AlertCircle, Lock, Barcode, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from "../../../api/axiosInstance";

export function CashSalesView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isEditMode = false, initialData = null } = location.state || {};

  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [accessibleMagasins, setAccessibleMagasins] = useState([]);
  const [userMagasinAccessType, setUserMagasinAccessType] = useState('assigned_only');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedMagasin, setSelectedMagasin] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saleId, setSaleId] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientResults, setShowClientResults] = useState(false);
  const [clientWarning, setClientWarning] = useState(null);
  const [clientBlocked, setClientBlocked] = useState(false);
  const [isManualMagasinSelection, setIsManualMagasinSelection] = useState(false);
  const [availableBarcodes, setAvailableBarcodes] = useState([]);
  const [selectedBarcodes, setSelectedBarcodes] = useState([]);
  const [showBarcodeSelector, setShowBarcodeSelector] = useState(false);
  const [barcodeError, setBarcodeError] = useState(null);

  const userRole = localStorage.getItem("role");
  const userMagasinId = localStorage.getItem("magasin_id");

  // Status mapping for warnings
  const statusWarnings = {
    suspendu: { message: "⚠️ هذا الزبون موقوف مؤقتاً. هل تريد متابعة البيع؟", color: "yellow", allow: true, label: "موقوف", bgClass: "bg-yellow-500/20", borderClass: "border-yellow-500/30", textClass: "text-yellow-400" },
    perdu: { message: "⚠️ هذا الزبون معدوم. لا يمكن البيع له.", color: "red", allow: false, label: "معدوم", bgClass: "bg-red-500/20", borderClass: "border-red-500/30", textClass: "text-red-400" },
    banque_bloquee: { message: "⚠️ حساب هذا الزبون مغلق من البنك. لا يمكن البيع له.", color: "red", allow: false, label: "حساب مغلق", bgClass: "bg-red-500/20", borderClass: "border-red-500/30", textClass: "text-red-400" },
    cash_only: { message: "⚠️ هذا الزبون مسموح له بالدفع نقداً فقط. لا يمكن البيع بالتقسيط.", color: "orange", allow: false, label: "نقدي فقط", bgClass: "bg-orange-500/20", borderClass: "border-orange-500/30", textClass: "text-orange-400" },
  };

  // Initialize edit mode data
  useEffect(() => {
    if (isEditMode && initialData) {
      setSaleId(initialData.id);
      setSelectedClient(initialData.client_detail);
      
      const cartItems = (initialData.lignes_detail || []).map((item, index) => ({
        id: Date.now() + index,
        productId: item.produit,
        reference: item.produit_detail?.reference || '',
        name: item.produit_detail?.nom || '',
        quantity: item.quantite || 0,
        price: parseFloat(item.prix_unitaire) || 0,
        total: parseFloat(item.sous_total) || 0,
        barcodes: item.codes_barres_utilises || [],
      }));
      
      setCart(cartItems);
      
      if (initialData.magasin) {
        setSelectedMagasin(initialData.magasin);
      }
    }
  }, [isEditMode, initialData]);

  // Function to get current user ID from token
  const getCurrentUserId = () => {
    let userId = localStorage.getItem("user_id");
    if (userId) return userId;
    
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.user_id || payload.sub || payload.id;
        if (userId) {
          localStorage.setItem("user_id", userId);
          return userId;
        }
      }
    } catch (e) {
      console.error("Failed to decode token", e);
    }
    
    return null;
  };

  // Fetch user's accessible magasins
  const fetchUserAccessibleMagasins = async () => {
    try {
      const token = localStorage.getItem("access_token");
      let currentUserId = getCurrentUserId();
      
      if (!currentUserId) {
        console.warn("No user_id found, trying to fetch from API...");
        try {
          const username = localStorage.getItem("username");
          if (username) {
            const response = await axios.get("/auth/users/", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const users = response.data.results || [];
            const currentUser = users.find(u => u.username === username);
            if (currentUser) {
              currentUserId = currentUser.id;
              localStorage.setItem("user_id", currentUserId);
            }
          }
        } catch (err) {
          console.error("Failed to fetch users list", err);
        }
      }
      
      if (!currentUserId) {
        console.error("Cannot determine current user ID");
        if (userMagasinId) {
          try {
            const response = await axios.get(`/param/magasins/${userMagasinId}/`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const mag = response.data;
            setMagasins([mag]);
            setAccessibleMagasins([mag]);
            setSelectedMagasin(mag);
          } catch (err) {
            console.error("Fallback failed:", err);
          }
        }
        return;
      }
      
      console.log("Fetching user data for ID:", currentUserId);
      const response = await axios.get(`/auth/users/${currentUserId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = response.data;
      
      console.log("User data for magasin access:", userData);
      console.log("magasin_access_type:", userData.magasin_access_type);
      console.log("magasin_detail:", userData.magasin_detail);
      console.log("magasins_acces_detail:", userData.magasins_acces_detail);
      
      const accessType = userData.magasin_access_type || 'assigned_only';
      setUserMagasinAccessType(accessType);
      
      let accessible = [];
      
      // ADMIN - can access all magasins
      if (userRole === 'admin') {
        const magasinsResponse = await axios.get("/param/magasins/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        accessible = magasinsResponse.data.results || [];
        setMagasins(accessible);
        console.log("Admin - accessible magasins:", accessible);
      } 
      // ALL MAGASINS - user can access all magasins
      else if (accessType === 'all_magasins') {
        const magasinsResponse = await axios.get("/param/magasins/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        accessible = magasinsResponse.data.results || [];
        setMagasins(accessible);
        console.log("All magasins access - accessible magasins:", accessible);
      } 
      // SELECTED MAGASINS - user can access only selected magasins
      else if (accessType === 'selected_magasins') {
        accessible = userData.magasins_acces_detail || [];
        setMagasins(accessible);
        console.log("Selected magasins access - accessible magasins:", accessible);
      } 
      // ASSIGNED ONLY - user can only access their assigned magasin
      else if (accessType === 'assigned_only' && userData.magasin_detail) {
        accessible = [userData.magasin_detail];
        setMagasins(accessible);
        console.log("Assigned only access - accessible magasins:", accessible);
      }
      // Fallback for assigned_only without magasin
      else if (accessType === 'assigned_only' && !userData.magasin_detail) {
        console.warn("User has assigned_only access but no magasin assigned");
        accessible = [];
        setMagasins([]);
      }
      
      setAccessibleMagasins(accessible);
      
      // Set default selected magasin
      if (accessible.length > 0 && !selectedMagasin) {
        setSelectedMagasin(accessible[0]);
        setIsManualMagasinSelection(false);
      } else if (accessible.length === 0) {
        setSelectedMagasin(null);
      }
      
    } catch (error) {
      console.error("Error fetching user magasin access:", error);
      if (userRole === "admin") {
        try {
          const token = localStorage.getItem("access_token");
          const response = await axios.get("/param/magasins/", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = response.data.results || [];
          setMagasins(data);
          setAccessibleMagasins(data);
          if (data.length > 0 && !selectedMagasin) setSelectedMagasin(data[0]);
        } catch (err) {
          console.error("Fallback failed:", err);
        }
      } else if (userMagasinId) {
        try {
          const token = localStorage.getItem("access_token");
          const response = await axios.get(`/param/magasins/${userMagasinId}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const mag = response.data;
          setMagasins([mag]);
          setAccessibleMagasins([mag]);
          setSelectedMagasin(mag);
        } catch (err) {
          console.error("Fallback failed:", err);
        }
      }
    }
  };

  // Fetch magasins and user access on mount
  useEffect(() => {
    fetchUserAccessibleMagasins();
  }, []);

  // Check client eligibility
  const checkClientEligibility = (client) => {
    if (client.bloque) {
      setClientBlocked(true);
      setClientWarning({
        message: "⛔ هذا الزبون محظور. لا يمكن إجراء أي عملية بيع له.",
        color: "red",
        allow: false,
        bgClass: "bg-red-500/20",
        borderClass: "border-red-500/30",
        textClass: "text-red-400"
      });
      return false;
    }

    const statusWarning = statusWarnings[client.statut];
    if (statusWarning) {
      setClientBlocked(!statusWarning.allow);
      setClientWarning(statusWarning);
      return statusWarning.allow;
    }

    setClientBlocked(false);
    setClientWarning(null);
    return true;
  };

  // Handle client selection
  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setClientSearchTerm(`${client.nom_famille_ar} ${client.prenom_ar}`);
    setShowClientResults(false);
    checkClientEligibility(client);
  };

  // Fetch clients with search
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const params = clientSearchTerm ? { search: clientSearchTerm } : {};
        const response = await axios.get("/auth/clients/", {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
        setClients(response.data.results || []);
        setShowClientResults(clientSearchTerm.length >= 2);
      } catch (error) {
        console.error("Erreur lors du fetch des clients:", error);
      }
    };

    const delayDebounce = setTimeout(() => {
      if (clientSearchTerm.length >= 2 || clientSearchTerm === '') {
        fetchClients();
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [clientSearchTerm]);

  // Fetch products with magasin access filter
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const params = { search: searchTerm };

        // If user has access to all magasins OR is admin, don't filter by magasin
        if (userRole === 'admin' || userMagasinAccessType === 'all_magasins') {
          console.log("Fetching all products (admin or all magasins access)");
        } 
        // If a specific magasin is selected, filter by that magasin
        else if (selectedMagasin) {
          params.magasin = selectedMagasin.id;
          console.log("Filtering by selected magasin:", selectedMagasin.id);
        } 
        // If user has limited access and no magasin selected, show products from all accessible magasins
        else if (accessibleMagasins.length > 0) {
          params.magasins = accessibleMagasins.map(m => m.id).join(',');
          console.log("Filtering by accessible magasins:", params.magasins);
        }

        const response = await axios.get("/prod/produits/", {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
        
        let productsData = response.data.results || [];
        console.log("Products fetched:", productsData.length);
        
        if (selectedMagasin) {
          productsData = productsData.map(product => {
            let magasinQuantity = 0;
            let magasinBarcodes = [];
            if (product.magasins && Array.isArray(product.magasins)) {
              const magasinEntry = product.magasins.find(mag => mag.id == selectedMagasin.id);
              if (magasinEntry) {
                magasinQuantity = magasinEntry.codes_barres?.length || 0;
                magasinBarcodes = magasinEntry.codes_barres || [];
              }
            }
            return {
              ...product,
              quantite_display: magasinQuantity,
              quantite_totale: product.quantite_totale,
              magasin_barcodes: magasinBarcodes
            };
          });
        }
        
        setProducts(productsData);
      } catch (error) {
        console.error("Erreur lors du fetch des produits:", error);
      }
    };

    const delayDebounce = setTimeout(() => {
      if (searchTerm.length >= 2 || searchTerm === '') {
        fetchProducts();
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, selectedMagasin, accessibleMagasins, userMagasinAccessType, userRole]);

  // Get quantity in selected magasin
  const getProductQuantity = (product) => {
    if (selectedMagasin && product.magasins) {
      const magEntry = product.magasins.find(m => m.id == selectedMagasin.id);
      return magEntry?.codes_barres?.length || 0;
    }
    return product.quantite_totale || 0;
  };

  // Get barcodes for selected product in selected magasin
  const getProductBarcodes = async (productId) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`/prod/produits/${productId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const product = response.data;
      
      if (selectedMagasin && product.magasins) {
        const magEntry = product.magasins.find(m => m.id == selectedMagasin.id);
        if (magEntry) {
          return magEntry.codes_barres || [];
        }
      }
      return [];
    } catch (error) {
      console.error("Error fetching barcodes:", error);
      return [];
    }
  };

  const handleProductSelect = async (product) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`/prod/produits/${product.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const latestProduct = response.data;
      
      setSelectedProduct(latestProduct);
      setPrice(latestProduct.prix_vente_cache || 0);
      setSearchTerm(latestProduct.nom);
      setBarcodeError(null);
      setSelectedBarcodes([]);
      
      if (selectedMagasin) {
        const barcodes = await getProductBarcodes(product.id);
        setAvailableBarcodes(barcodes);
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      toast.error('فشل تحميل بيانات المنتج');
    }
  };

  const handleMagasinChange = (magasin) => {
    setSelectedMagasin(magasin);
    setIsManualMagasinSelection(true);
    setSelectedProduct(null);
    setSearchTerm('');
    setAvailableBarcodes([]);
    setSelectedBarcodes([]);
    setBarcodeError(null);
  };

  const toggleBarcodeSelection = (barcode) => {
    setSelectedBarcodes(prev => {
      if (prev.includes(barcode)) {
        return prev.filter(b => b !== barcode);
      } else {
        if (prev.length < quantity) {
          return [...prev, barcode];
        } else {
          setBarcodeError(`لا يمكن اختيار أكثر من ${quantity} باركود`);
          return prev;
        }
      }
    });
    setBarcodeError(null);
  };

  const addToCart = async () => {
    if (!selectedProduct) {
      toast.error('الرجاء اختيار منتج');
      return;
    }
    if (!selectedMagasin) {
      toast.error('الرجاء اختيار المخزن');
      return;
    }
    if (quantity <= 0) {
      toast.error('الكمية يجب أن تكون أكبر من 0');
      return;
    }
    if (price <= 0) {
      toast.error('السعر يجب أن يكون أكبر من 0');
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`/prod/produits/${selectedProduct.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const latestProduct = response.data;
      
      let magasinQuantity = getProductQuantity(latestProduct);
      let magasinBarcodes = [];
      
      if (selectedMagasin && latestProduct.magasins) {
        const magEntry = latestProduct.magasins.find(m => m.id == selectedMagasin.id);
        if (magEntry) {
          magasinQuantity = magEntry.codes_barres?.length || 0;
          magasinBarcodes = magEntry.codes_barres || [];
        }
      }
      
      if (magasinQuantity < quantity) {
        toast.error(`الكمية المطلوبة (${quantity}) تتجاوز المخزون المتاح (${magasinQuantity}) في هذا المخزن`);
        return;
      }

      let barcodesToUse = [];
      if (selectedBarcodes.length > 0) {
        if (selectedBarcodes.length !== quantity) {
          setBarcodeError(`الرجاء اختيار ${quantity} باركود (تم اختيار ${selectedBarcodes.length})`);
          toast.error(`الرجاء اختيار ${quantity} باركود بالضبط`);
          return;
        }
        barcodesToUse = selectedBarcodes;
      } else {
        barcodesToUse = magasinBarcodes.slice(0, quantity);
      }

      const existingItem = cart.find(item => item.productId === selectedProduct.id);
      let newQuantity = quantity;
      
      if (existingItem) {
        newQuantity = existingItem.quantity + quantity;
        if (magasinQuantity < newQuantity) {
          toast.error(`الكمية الإجمالية (${newQuantity}) تتجاوز المخزون المتاح (${magasinQuantity})`);
          return;
        }
      }

      const newItem = {
        id: existingItem ? existingItem.id : Date.now(),
        productId: selectedProduct.id,
        reference: selectedProduct.reference || "",
        name: selectedProduct.nom,
        quantity: newQuantity,
        price: parseFloat(price),
        magasin: parseInt(selectedMagasin.id),
        magasin_nom: selectedMagasin.nom,
        total: newQuantity * parseFloat(price),
        barcodes: existingItem ? [...(existingItem.barcodes || []), ...barcodesToUse] : barcodesToUse,
      };

      if (existingItem) {
        setCart(cart.map(item => item.productId === selectedProduct.id ? newItem : item));
        toast.success('تم تحديث كمية المنتج في السلة');
      } else {
        setCart([...cart, newItem]);
        toast.success('تمت إضافة المنتج للسلة');
      }
      
      setSelectedProduct(null);
      setQuantity(1);
      setPrice(0);
      setSearchTerm('');
      setAvailableBarcodes([]);
      setSelectedBarcodes([]);
      setBarcodeError(null);
    } catch (error) {
      console.error("Error checking product stock:", error);
      toast.error('فشل التحقق من المخزون');
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
    toast.success('تم حذف المنتج من السلة');
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      toast.error('الرجاء إضافة منتجات للبيع');
      return;
    }
    if (!selectedClient) {
      toast.error('الرجاء اختيار الزبون');
      return;
    }
    if (!selectedMagasin) {
      toast.error('الرجاء اختيار المخزن');
      return;
    }
    
    if (clientBlocked) {
      toast.error(clientWarning?.message || "لا يمكن إتمام عملية البيع لهذا الزبون");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      
      // Validate stock for all items
      for (const item of cart) {
        const response = await axios.get(`/prod/produits/${item.productId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const product = response.data;
        
        let magasinQuantity = 0;
        if (product.magasins && Array.isArray(product.magasins)) {
          const magasinEntry = product.magasins.find(mag => mag.id == selectedMagasin.id);
          if (magasinEntry) {
            magasinQuantity = magasinEntry.codes_barres?.length || 0;
          }
        }
        
        if (magasinQuantity < item.quantity) {
          toast.error(`المنتج "${item.name}" لا يحتوي على كمية كافية في هذا المخزن`);
          setLoading(false);
          return;
        }
      }

      const lignes = cart.map(item => ({
        produit: item.productId,
        quantite: item.quantity,
        codes_barres: item.barcodes || [],
      }));

      const payload = {
        client: selectedClient.id,
        lignes: lignes,
        magasin_id: selectedMagasin.id,
      };

      console.log("📤 Sending sale payload:", payload);

      if (isEditMode && saleId) {
        await axios.put(`/vente/ventes-cache/${saleId}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success(`تم تحديث عملية البيع بنجاح`);
      } else {
        const response = await axios.post("/vente/ventes-cache/", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("✅ Sale response:", response.data);
        toast.success(`تمت عملية البيع بنجاح - المبلغ الإجمالي: ${total.toFixed(2)} دج`);
      }
      
      navigate('/New/sales');
    } catch (error) {
      console.error("Erreur lors de la vente:", error);
      let errorMessage = "فشل إتمام عملية البيع";
      
      if (error.response?.data) {
        if (Array.isArray(error.response.data)) {
          errorMessage = error.response.data.join(", ");
        } else if (typeof error.response.data === "object") {
          const errors = Object.values(error.response.data).flat();
          errorMessage = errors.join(", ");
        } else {
          errorMessage = error.response.data;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/New/sales');
  };

  const total = cart.reduce((sum, item) => sum + item.total, 0);
  const formatPrice = (price) => price ? Math.round(price) : '0';

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            title="رجوع"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <ShoppingCart className="w-8 h-8 text-indigo-400" />
          <h1 className="text-2xl text-white">
            {isEditMode ? 'تعديل عملية بيع كاش' : 'عملية بيع كاش جديدة'}
          </h1>
          {isEditMode && saleId && (
            <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg text-sm">
              #{saleId}
            </span>
          )}
        </div>
        <div className="bg-gradient-to-r from-indigo-500/20 to-indigo-600/20 border border-indigo-500/30 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            <div className="text-xs text-indigo-300">المبلغ الإجمالي:</div>
            <div className="text-xl text-white">{formatPrice(total)} دج</div>
          </div>
        </div>
      </motion.div>

      {/* Client Warning Card */}
      {clientWarning && (
        <div className={`${clientWarning.bgClass} border ${clientWarning.borderClass} rounded-lg p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {clientBlocked ? (
              <Lock className={`w-5 h-5 ${clientWarning.textClass}`} />
            ) : (
              <AlertCircle className={`w-5 h-5 ${clientWarning.textClass}`} />
            )}
            <p className={clientWarning.textClass}>{clientWarning.message}</p>
          </div>
          {!clientBlocked && clientWarning.allow && (
            <button
              onClick={() => setClientWarning(null)}
              className="px-3 py-1 bg-slate-700 rounded-lg text-sm hover:bg-slate-600 transition"
            >
              متابعة
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Product Selection Form */}
        <div className="lg:col-span-1 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-4 shadow-lg">
          <h3 className="text-white text-lg mb-4">إضافة منتج</h3>
          
          <div className="space-y-4">
            {/* Client Selection */}
            <div>
              <label className="text-indigo-300 block mb-2 text-sm">الزبون</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  placeholder="ابحث عن زبون..."
                  className="w-full bg-slate-700/50 text-white border border-indigo-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              {showClientResults && clients.length > 0 && (
                <div className="mt-2 border border-slate-600 rounded-lg max-h-48 overflow-y-auto">
                  {clients.map((client) => {
                    const isBlocked = client.bloque;
                    const hasStatusWarning = statusWarnings[client.statut];
                    return (
                      <button
                        key={client.id}
                        onClick={() => handleClientSelect(client)}
                        disabled={isBlocked || (hasStatusWarning && !hasStatusWarning.allow)}
                        className={`w-full text-right p-2 hover:bg-slate-700 transition border-b border-slate-600 last:border-b-0 ${
                          selectedClient?.id === client.id ? 'bg-indigo-500/20' : ''
                        } ${(isBlocked || (hasStatusWarning && !hasStatusWarning.allow)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="text-white text-sm">
                          {client.nom_famille_ar} {client.prenom_ar}
                          {isBlocked && <span className="text-red-400 text-xs mr-2">(محظور)</span>}
                          {hasStatusWarning && !hasStatusWarning.allow && (
                            <span className={`text-${hasStatusWarning.color}-400 text-xs mr-2`}>({hasStatusWarning.label})</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">CCP: {client.ccp}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Client Info */}
            {selectedClient && (
              <div className={`rounded-lg p-3 space-y-1 ${clientBlocked ? 'bg-red-500/10 border border-red-500/30' : 'bg-indigo-500/10 border border-indigo-500/30'}`}>
                <div className="text-white font-medium">
                  {selectedClient.nom_famille_ar} {selectedClient.prenom_ar}
                  {selectedClient.bloque && <span className="text-red-400 text-xs mr-2">(محظور)</span>}
                </div>
                <div className="text-sm text-slate-300">CCP: {selectedClient.ccp}/{selectedClient.cle}</div>
                {selectedClient.statut && statusWarnings[selectedClient.statut] && (
                  <div className={`text-sm text-${statusWarnings[selectedClient.statut].color}-400 mt-1`}>
                    الحالة: {statusWarnings[selectedClient.statut].label}
                  </div>
                )}
              </div>
            )}

            {/* Magasin Selection - Shows only accessible magasins */}
            <div>
              <label className="text-indigo-300 block mb-2 text-sm">
                المخزن 
                {isManualMagasinSelection && <span className="text-xs text-yellow-500">(تم التغيير يدوياً)</span>}
                {userMagasinAccessType === 'all_magasins' && (
                  <span className="text-xs text-emerald-500 mr-2">(الوصول الكامل)</span>
                )}
                {userMagasinAccessType === 'selected_magasins' && (
                  <span className="text-xs text-purple-500 mr-2">(محلات محددة)</span>
                )}
                {userMagasinAccessType === 'assigned_only' && (
                  <span className="text-xs text-blue-500 mr-2">(محل واحد)</span>
                )}
              </label>
              <div className="relative">
                <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <select
                  value={selectedMagasin?.id || ''}
                  onChange={(e) => {
                    const mag = accessibleMagasins.find(m => m.id === parseInt(e.target.value));
                    if (mag) handleMagasinChange(mag);
                  }}
                  className="w-full bg-slate-700/50 text-white border border-indigo-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">اختر المخزن</option>
                  {accessibleMagasins.map(mag => (
                    <option key={mag.id} value={mag.id}>{mag.nom}</option>
                  ))}
                </select>
              </div>
              {selectedMagasin && (
                <p className="text-xs text-cyan-400 mt-1">
                  المخزن المحدد: {selectedMagasin.nom}
                </p>
              )}
              {accessibleMagasins.length === 0 && (
                <p className="text-xs text-red-400 mt-1">
                  ⚠️ لا توجد مخازن متاحة لك. يرجى التواصل مع المدير.
                </p>
              )}
              {userMagasinAccessType === 'all_magasins' && accessibleMagasins.length > 0 && (
                <p className="text-xs text-emerald-400 mt-1">
                  ✓ لديك صلاحية الوصول إلى جميع المخازن
                </p>
              )}
            </div>

            {/* Product Search */}
            <div>
              <label className="text-indigo-300 block mb-2 text-sm">البحث عن منتج</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="أدخل اسم المنتج..."
                  className="w-full bg-slate-700/50 text-white border border-indigo-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              {searchTerm.length >= 2 && products.length > 0 && (
                <div className="mt-2 border border-slate-600 rounded-lg max-h-48 overflow-y-auto">
                  {products.map((product) => {
                    const displayQty = selectedMagasin ? getProductQuantity(product) : product.quantite_display;
                    return (
                      <button
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className={`w-full text-right p-2 hover:bg-slate-700 transition border-b border-slate-600 last:border-b-0 ${
                          selectedProduct?.id === product.id ? 'bg-indigo-500/20' : ''
                        }`}
                      >
                        <div className="text-white text-sm">{product.nom}</div>
                        <div className="text-xs text-slate-400">
                          المرجع: {product.reference} | المخزون: {displayQty}
                        </div>
                        {selectedMagasin && (
                          <div className="text-xs text-cyan-400">
                            المخزن: {selectedMagasin.nom}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Product Info */}
            {selectedProduct && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3">
                <div className="text-white font-medium">{selectedProduct.nom}</div>
                <div className="text-xs text-slate-400 mt-1">المرجع: {selectedProduct.reference}</div>
                <div className="text-xs text-slate-400">
                  المخزون في هذا المخزن: {getProductQuantity(selectedProduct)}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="text-indigo-300 block mb-2 text-sm">الكمية</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const newQty = parseInt(e.target.value) || 1;
                  setQuantity(newQty);
                  if (selectedBarcodes.length > newQty) {
                    setSelectedBarcodes(selectedBarcodes.slice(0, newQty));
                  }
                  setBarcodeError(null);
                }}
                min="1"
                max={selectedProduct ? getProductQuantity(selectedProduct) : 999}
                className="w-full bg-slate-700/50 text-white border border-indigo-500/30 rounded-lg px-4 py-2 text-sm outline-none focus:border-indigo-500"
              />
              {selectedProduct && (
                <p className="text-xs text-slate-500 mt-1">
                  المتاح: {getProductQuantity(selectedProduct)} وحدة
                </p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="text-indigo-300 block mb-2 text-sm">سعر البيع</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                min="0"
                step="1"
                className="w-full bg-slate-700/50 text-white border border-indigo-500/30 rounded-lg px-4 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {/* Barcode Selection Button */}
            {selectedProduct && selectedMagasin && getProductQuantity(selectedProduct) > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowBarcodeSelector(!showBarcodeSelector)}
                  className="w-full flex items-center justify-between gap-2 bg-slate-700/50 text-white border border-indigo-500/30 rounded-lg px-4 py-2 text-sm hover:bg-slate-700 transition"
                >
                  <span className="flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-amber-400" />
                    اختيار الباركودات يدوياً
                  </span>
                  {showBarcodeSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {showBarcodeSelector && (
                  <div className="mt-2 border border-indigo-500/30 rounded-lg p-3 bg-slate-800/50">
                    <p className="text-xs text-slate-400 mb-2">
                      اختر {quantity} باركود (تم اختيار {selectedBarcodes.length}/{quantity})
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {availableBarcodes.map((barcode, idx) => (
                        <label key={idx} className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedBarcodes.includes(barcode)}
                            onChange={() => toggleBarcodeSelection(barcode)}
                            disabled={selectedBarcodes.length >= quantity && !selectedBarcodes.includes(barcode)}
                            className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
                          />
                          <span className="text-white text-sm font-mono">{barcode}</span>
                        </label>
                      ))}
                      {availableBarcodes.length === 0 && (
                        <p className="text-slate-400 text-sm text-center py-2">لا توجد باركودات متاحة</p>
                      )}
                    </div>
                    {barcodeError && (
                      <p className="text-red-400 text-xs mt-2">{barcodeError}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={addToCart}
              disabled={loading || !selectedProduct || !selectedMagasin || clientBlocked || accessibleMagasins.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة للسلة</span>
            </motion.button>
          </div>
        </div>

        {/* Cart Table */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3">
            <h2 className="text-white text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              سلة البيع ({cart.length})
            </h2>
            {selectedMagasin && (
              <p className="text-sm text-white/70 mt-1">
                المخزن: {selectedMagasin.nom}
              </p>
            )}
          </div>
          
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-800">
                <tr className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                  <th className="px-4 py-3 text-right">#</th>
                  <th className="px-4 py-3 text-right">المنتج</th>
                  <th className="px-4 py-3 text-right">المرجع</th>
                  <th className="px-4 py-3 text-right">الكمية</th>
                  <th className="px-4 py-3 text-right">السعر</th>
                  <th className="px-4 py-3 text-right">المجموع</th>
                  <th className="px-4 py-3 text-right">الباركودات</th>
                  <th className="px-4 py-3 text-right">إجراء</th>
                    </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                      السلة فارغة - أضف منتجات للبيع
                    </td>
                  </tr>
                ) : (
                  cart.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                      className={`border-b border-slate-700/50 ${
                        index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-indigo-300">{index + 1}</td>
                      <td className="px-4 py-3 text-white">{item.name}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{item.reference}</td>
                      <td className="px-4 py-3 text-blue-300">{item.quantity}</td>
                      <td className="px-4 py-3 text-amber-300">{formatPrice(item.price)} دج</td>
                      <td className="px-4 py-3 text-emerald-300 font-medium">{formatPrice(item.total)} دج</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {item.barcodes?.slice(0, 3).map((code, i) => (
                            <span key={i} className="text-xs text-slate-400 font-mono bg-slate-700 px-1 rounded">
                              {code}
                            </span>
                          ))}
                          {item.barcodes?.length > 3 && (
                            <span className="text-xs text-slate-400">+{item.barcodes.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Total and Complete Button */}
          {cart.length > 0 && (
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-4 border-t border-slate-700 flex justify-between items-center flex-wrap gap-4">
              <div className="text-white">
                <span className="text-slate-400">الإجمالي الكلي: </span>
                <span className="text-2xl font-bold text-emerald-400">{formatPrice(total)} دج</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={completeSale}
                disabled={loading || !selectedClient || !selectedMagasin || clientBlocked || accessibleMagasins.length === 0}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span>{isEditMode ? 'تحديث عملية البيع' : 'إتمام عملية البيع'}</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}