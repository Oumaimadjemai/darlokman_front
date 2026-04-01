import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Trash2, Save, Search, Building2, Truck, DollarSign, User, Edit, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import axios from '../../api/axiosInstance';

export function PurchaseView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isEditMode = false, initialData = null } = location.state || {};

  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedMagasin, setSelectedMagasin] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sommePayee, setSommePayee] = useState(0);
  const [sommeRestante, setSommeRestante] = useState(0);
  const [loading, setLoading] = useState(false);
  const [purchaseId, setPurchaseId] = useState(null);
  const [showPriceWarning, setShowPriceWarning] = useState(false);

  // Get user role and magasin from localStorage
  const userRole = localStorage.getItem("role");
  const userMagasinId = localStorage.getItem("magasin_id");

  // Initialize edit mode data
  useEffect(() => {
    if (isEditMode && initialData) {
      setPurchaseId(initialData.id);
      setSelectedSupplier(initialData.fournisseur?.toString() || initialData.fournisseur_detail?.id?.toString() || '');
      setSommePayee(parseFloat(initialData.somme_payee) || 0);
      
      // Transform achats to cart items
      const cartItems = (initialData.achats || []).map((item, index) => ({
        id: Date.now() + index,
        productId: item.produit || item.produit_detail?.id,
        reference: item.produit_detail?.reference || '',
        name: item.produit_detail?.nom || '',
        quantity: item.quantite || 0,
        price: parseFloat(item.prix_achat) || 0,
        magasin: item.magasin || item.magasin_detail?.id,
        magasin_nom: item.magasin_detail?.nom || '',
        total: (parseFloat(item.prix_achat) || 0) * (item.quantite || 0),
      }));
      
      setCart(cartItems);
      
      // Set initial magasin if available
      if (initialData.achats?.[0]?.magasin_detail) {
        setSelectedMagasin(initialData.achats[0].magasin_detail);
      }
    }
  }, [isEditMode, initialData]);

  // Fetch magasins
  useEffect(() => {
    const fetchMagasins = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get("/param/magasins/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data.results || [];
        setMagasins(data);

        // Set selected magasin automatically for non-admin users
        if (userRole !== "admin" && userMagasinId) {
          const userMagasin = data.find((m) => m.id === parseInt(userMagasinId, 10));
          setSelectedMagasin(userMagasin || null);
        }
      } catch (error) {
        console.error("Erreur lors du fetch des magasins:", error);
        toast.error("فشل تحميل المخازن");
      }
    };
    fetchMagasins();
  }, [userRole, userMagasinId]);

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get("/auth/fournisseurs/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuppliers(response.data.results || []);
      } catch (error) {
        console.error("Erreur lors du fetch des fournisseurs:", error);
        toast.error("فشل تحميل الموردين");
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch products with filters
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const params = { 
          search: searchTerm,
          page_size: 50 
        };

        if (userRole !== "admin" && userMagasinId) {
          params.magasin = userMagasinId;
        } else if (selectedMagasin) {
          params.magasin = selectedMagasin.id;
        }

        const response = await axios.get("/prod/produits/", {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
        setProducts(response.data.results || []);
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
  }, [searchTerm, selectedMagasin, userRole, userMagasinId]);

  // Recalculate remaining amount
  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + item.total, 0);
    const restante = total - (parseFloat(sommePayee) || 0);
    setSommeRestante(restante >= 0 ? restante : 0);
  }, [sommePayee, cart]);

  // Check if price changed from original
  useEffect(() => {
    if (selectedProduct && price !== originalPrice) {
      setShowPriceWarning(true);
    } else {
      setShowPriceWarning(false);
    }
  }, [price, originalPrice, selectedProduct]);

  const recalculatePrixVente = (produit, nouveauPrixAchat) => {
    const keys = ["cache", "3", "5", "6", "8", "9", "10", "12", "15"];
    const result = {};

    keys.forEach((key) => {
      const taux = parseFloat(produit[`taux_benefice_${key}`]) || 0;
      const prix = nouveauPrixAchat + (nouveauPrixAchat * taux) / 100;
      result[`prix_vente_${key}`] = parseFloat(prix.toFixed(2));
    });

    return result;
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

    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      const newPrixAchat = parseFloat(price);
      const originalPrix = parseFloat(originalPrice);
      const userChangedPrice = !isNaN(originalPrix) && originalPrix !== newPrixAchat;

      let finalProductId = selectedProduct.id;

      // ONLY update product price if user changed it
      if (userChangedPrice) {
        console.log("Updating product price...");
        
        const recalculatedPrices = recalculatePrixVente(
          selectedProduct,
          newPrixAchat
        );

        try {
          await axios.patch(
            `/prod/produits/${selectedProduct.id}/`,
            {
              prix_achat: newPrixAchat,
              ...recalculatedPrices,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          toast.success("تم تحديث سعر المنتج");
        } catch (error) {
          console.error("Error updating price:", error);
          toast.error("فشل تحديث سعر المنتج");
          setLoading(false);
          return;
        }
      }

      // Add to cart - NO PRODUCT CREATION HERE
      const newItem = {
        id: Date.now(),
        productId: finalProductId,
        reference: selectedProduct.reference || "",
        name: selectedProduct.nom,
        quantity: parseInt(quantity),
        price: newPrixAchat,
        magasin: parseInt(selectedMagasin.id),
        magasin_nom: selectedMagasin.nom,
        total: parseInt(quantity) * newPrixAchat,
      };

      setCart((prev) => [...prev, newItem]);

      // Reset form
      setSelectedProduct(null);
      setQuantity(1);
      setPrice(0);
      setOriginalPrice(0);
      setSearchTerm("");
      setShowPriceWarning(false);

      toast.success("تمت إضافة المنتج للسلة");
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      toast.error("فشل إضافة المنتج");
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
    toast.success('تم حذف المنتج من السلة');
  };

  const completePurchase = async () => {
    if (cart.length === 0) {
      toast.error('الرجاء إضافة منتجات للشراء');
      return;
    }
    if (!selectedSupplier) {
      toast.error('الرجاء اختيار المورد');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      
      // Prepare achats data - matches backend structure
      const achats = cart.map(item => ({
        produit: item.productId,
        quantite: item.quantity,
        prix_achat: item.price,
        magasin: item.magasin,
      }));

      const payload = {
        fournisseur: parseInt(selectedSupplier),
        somme_payee: parseFloat(sommePayee),
        achats: achats,
      };

      console.log('Sending payload to backend:', JSON.stringify(payload, null, 2));
  
  if (isEditMode && purchaseId) {
    // Update existing purchase
    const response = await axios.put(`/achat/par-group/${purchaseId}/`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log('Update response:', response.data);
    toast.success(`تم تحديث عملية الشراء بنجاح`);
  } else {
    // Create new purchase
    const response = await axios.post("/achat/par-group/", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log('Create response:', response.data);
    toast.success(`تمت عملية الشراء بنجاح - المبلغ الإجمالي: ${total.toFixed(2)} دج`);
  }
  
  // Navigate back to purchases list with refresh flag
  // Use replace: false to ensure navigation is added to history
  navigate('/New/achatlist', { 
    state: { refreshData: true },
    replace: false  // Don't replace, add to history
  });

      // Navigate back to purchases list with refresh flag
      navigate('/New/achatlist', { state: { refreshData: true } });
    } catch (error) {
      console.error("Erreur lors de l'achat:", error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        // Show detailed error message
        const errorMessage = error.response.data?.error || 
                            error.response.data?.message || 
                            (isEditMode ? 'فشل تحديث عملية الشراء' : 'فشل إتمام عملية الشراء');
        toast.error(errorMessage);
        
        // Check for specific errors
        if (error.response.data?.achats) {
          toast.error("تأكد من صحة بيانات المنتجات");
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        toast.error("لا يوجد استجابة من الخادم");
      } else {
        console.error('Error setting up request:', error.message);
        toast.error(isEditMode ? 'فشل تحديث عملية الشراء' : 'فشل إتمام عملية الشراء');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/New/achatlist');
  };

  const total = cart.reduce((sum, item) => sum + item.total, 0);

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
          <ShoppingCart className="w-8 h-8 text-cyan-400" />
          <h1 className="text-2xl text-white">
            {isEditMode ? 'تعديل عملية شراء' : 'عملية شراء جديدة'}
          </h1>
          {isEditMode && purchaseId && (
            <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-lg text-sm">
              #{purchaseId}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="text-xs text-cyan-300">المبلغ الإجمالي:</div>
              <div className="text-xl text-white">{total.toFixed(2)} دج</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-500/20 to-green-600/20 border border-emerald-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="text-xs text-emerald-300">المدفوع:</div>
              <div className="text-xl text-white">{parseFloat(sommePayee).toFixed(2)} دج</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border border-amber-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="text-xs text-amber-300">المتبقي:</div>
              <div className="text-xl text-amber-400">{sommeRestante.toFixed(2)} دج</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Product Selection Form */}
        <div className="lg:col-span-1 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4 shadow-lg">
          <h3 className="text-white text-lg mb-4">إضافة منتج</h3>
          
          <div className="space-y-4">
            {/* Product Search */}
            <div>
              <label className="text-cyan-300 block mb-2 text-sm">البحث عن منتج</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="أدخل اسم المنتج..."
                  className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-cyan-500"
                />
              </div>
              {searchTerm.length >= 2 && products.length > 0 && (
                <div className="mt-2 border border-slate-600 rounded-lg max-h-48 overflow-y-auto">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product);
                        setPrice(product.prix_achat || 0);
                        setOriginalPrice(product.prix_achat || 0);
                        setSearchTerm(product.nom);
                      }}
                      className={`w-full text-right p-2 hover:bg-slate-700 transition border-b border-slate-600 last:border-b-0 ${
                        selectedProduct?.id === product.id ? 'bg-cyan-500/20' : ''
                      }`}
                    >
                      <div className="text-white text-sm">{product.nom}</div>
                      <div className="text-xs text-slate-400">المرجع: {product.reference}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Product Info */}
            {selectedProduct && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                <div className="text-white font-medium">{selectedProduct.nom}</div>
                <div className="text-xs text-slate-400 mt-1">المرجع: {selectedProduct.reference}</div>
                <div className="text-xs text-slate-400">المخزون الحالي: {selectedProduct.quantite_totale || 0}</div>
                <div className="text-xs text-amber-300 mt-1">سعر الشراء الحالي: {selectedProduct.prix_achat || 0} دج</div>
              </div>
            )}

            {/* Price Warning */}
            {showPriceWarning && (
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-2 text-xs text-amber-300 text-center">
                ⚠️ سيتم تحديث سعر شراء المنتج إلى {price} دج
              </div>
            )}

            {/* Magasin */}
            <div>
              <label className="text-cyan-300 block mb-2 text-sm">المخزن</label>
              <div className="relative">
                <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <select
                  value={selectedMagasin?.id || ''}
                  onChange={(e) => {
                    const mag = magasins.find(m => m.id === parseInt(e.target.value));
                    setSelectedMagasin(mag || null);
                  }}
                  disabled={userRole !== "admin"}
                  className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-cyan-500 disabled:opacity-50"
                >
                  <option value="">اختر المخزن</option>
                  {magasins.map(mag => (
                    <option key={mag.id} value={mag.id}>{mag.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-cyan-300 block mb-2 text-sm">الكمية</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-4 py-2 text-sm outline-none focus:border-cyan-500"
              />
            </div>

            {/* Price */}
            <div>
              <label className="text-cyan-300 block mb-2 text-sm">سعر الشراء</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-4 py-2 text-sm outline-none focus:border-cyan-500"
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="text-cyan-300 block mb-2 text-sm">المورد</label>
              <div className="relative">
                <Truck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-cyan-500"
                >
                  <option value="">اختر المورد</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Paid Amount */}
            <div>
              <label className="text-cyan-300 block mb-2 text-sm">المبلغ المدفوع</label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="number"
                  value={sommePayee}
                  onChange={(e) => setSommePayee(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={addToCart}
              disabled={loading || !selectedProduct || !selectedMagasin}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-cyan-500/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة للسلة</span>
            </motion.button>
          </div>
        </div>

        {/* Cart Table */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3">
            <h2 className="text-white text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              سلة الشراء ({cart.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-800">
                <tr className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white">
                  <th className="px-4 py-3 text-right">#</th>
                  <th className="px-4 py-3 text-right">المنتج</th>
                  <th className="px-4 py-3 text-right">المرجع</th>
                  <th className="px-4 py-3 text-right">الكمية</th>
                  <th className="px-4 py-3 text-right">السعر</th>
                  <th className="px-4 py-3 text-right">المخزن</th>
                  <th className="px-4 py-3 text-right">المجموع</th>
                  <th className="px-4 py-3 text-right">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                      السلة فارغة - أضف منتجات للشراء
                    </td>
                  </tr>
                ) : (
                  cart.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
                      className={`border-b border-slate-700/50 ${
                        index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-cyan-300">{index + 1}</td>
                      <td className="px-4 py-3 text-white">{item.name}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{item.reference}</td>
                      <td className="px-4 py-3 text-blue-300">{item.quantity}</td>
                      <td className="px-4 py-3 text-amber-300">{item.price.toFixed(2)} دج</td>
                      <td className="px-4 py-3 text-purple-300">{item.magasin_nom}</td>
                      <td className="px-4 py-3 text-emerald-300 font-medium">{item.total.toFixed(2)} دج</td>
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
              <div className="space-y-1">
                <div className="text-white">
                  <span className="text-slate-400">الإجمالي الكلي: </span>
                  <span className="text-2xl font-bold text-emerald-400">{total.toFixed(2)} دج</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">المتبقي: </span>
                  <span className="text-amber-400">{sommeRestante.toFixed(2)} دج</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={completePurchase}
                disabled={loading || !selectedSupplier}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span>{isEditMode ? 'تحديث عملية الشراء' : 'إتمام عملية الشراء'}</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}