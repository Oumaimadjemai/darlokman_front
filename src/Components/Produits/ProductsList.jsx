import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Search, Plus, FileSpreadsheet, Edit, Trash2, Package, Filter, X, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from '../../api/axiosInstance';
import ConfirmationDialog from '../Cards/ConfirmationDialog';
import AddProduitDialog from './AddProduitDialog';
import ProductDetailDialog from './ProductDetailDialog';

export function ProductsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    magasin: '',
    famille: '',
  });
  
  const [magasinsOptions, setMagasinsOptions] = useState([]);
  const [famillesOptions, setFamillesOptions] = useState([]);
  const [totaux, setTotaux] = useState({
    total_quantite: 0,
    total_valeur: 0,
    total_capital: 0,
    total_quantite_all_products: 0,
    count: 0
  });
  const [selectedMagasinFilter, setSelectedMagasinFilter] = useState(null);
  const [userMagasinsAccess, setUserMagasinsAccess] = useState([]);
  
  const initialLoadDone = useRef(false);
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);
  const hasInitialized = useRef(false);
  
  const userRole = localStorage.getItem("role");
  const userMagasin = localStorage.getItem("magasin_id");
  
  console.log('🔵 Component mounted. userRole:', userRole, 'userMagasin:', userMagasin);
  
  const headers = useMemo(() => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  }), []);

  // Fetch current user's magasin access
  const fetchUserMagasinAccess = useCallback(async () => {
    if (userRole !== "admin") {
      // For non-admin users, fetch their access type and allowed magasins
      try {
        const token = localStorage.getItem("access_token");
        const userId = localStorage.getItem("user_id");
        
        if (userId) {
          const response = await axios.get(`/auth/users/${userId}/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const userData = response.data;
          const accessType = userData.magasin_access_type;
          
          console.log('📋 User access type:', accessType);
          console.log('📋 User magasin_access_type:', userData.magasin_access_type);
          
          if (accessType === "all_magasins") {
            // User has access to all magasins - fetch all
            const magasinsRes = await axios.get("param/magasins/", { headers });
            const allMagasins = magasinsRes.data.results || [];
            setUserMagasinsAccess(allMagasins.map(m => ({ id: m.id, nom: m.nom })));
            console.log('✅ User has access to ALL magasins');
          } else if (accessType === "selected_magasins") {
            // User has access to specific magasins
            const allowedMagasins = userData.magasins_acces_detail || [];
            setUserMagasinsAccess(allowedMagasins);
            console.log('✅ User has access to selected magasins:', allowedMagasins.length);
          } else {
            // assigned_only - user only has access to their assigned magasin
            if (userMagasin) {
              setUserMagasinsAccess([{ id: parseInt(userMagasin), nom: "Magasin assigné" }]);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching user magasin access:", err);
        // Fallback to just assigned magasin
        if (userMagasin) {
          setUserMagasinsAccess([{ id: parseInt(userMagasin), nom: "Magasin assigné" }]);
        }
      }
    }
  }, [userRole, userMagasin, headers]);

  // Fetch products with filters
  const fetchProducts = useCallback(async (search = '', appliedFilters = { magasin: '', famille: '' }) => {
    console.log('🟢 fetchProducts called with:', { search, appliedFilters });
    
    // Prevent multiple simultaneous fetches
    if (fetchInProgress.current) {
      console.log('⚠️ fetchProducts: Already in progress, skipping');
      return;
    }
    
    fetchInProgress.current = true;
    setLoading(true);
    
    const params = new URLSearchParams();

    if (search) params.append("search", search);

    // Filter by magasin based on role and access
    if (userRole !== "admin") {
      // For non-admin users, determine which magasin(s) to filter by
      const magasinFilter = appliedFilters.magasin;
      
      // Get user's access type
      let userAccessType = "assigned_only";
      try {
        const userId = localStorage.getItem("user_id");
        if (userId) {
          const response = await axios.get(`/auth/users/${userId}/`, { headers });
          userAccessType = response.data.magasin_access_type;
        }
      } catch (err) {
        console.error("Error getting user access type:", err);
      }
      
      if (userAccessType === "all_magasins") {
        // User can see all magasins, apply filter if selected
        if (magasinFilter) {
          params.append("magasin", magasinFilter);
          console.log('📦 All magasins access, applying magasin filter:', magasinFilter);
        }
      } else if (userAccessType === "selected_magasins") {
        // User can see multiple magasins
        if (magasinFilter) {
          params.append("magasin", magasinFilter);
          console.log('📦 Selected magasins access, applying magasin filter:', magasinFilter);
        }
      } else {
        // assigned_only - only their assigned magasin
        params.append("magasin", userMagasin);
        console.log('📦 Assigned only access, using assigned magasin:', userMagasin);
      }
    } else if (appliedFilters.magasin) {
      params.append("magasin", appliedFilters.magasin);
      console.log('📦 Admin user, adding magasin filter:', appliedFilters.magasin);
    }

    if (appliedFilters.famille) params.append("famille", appliedFilters.famille);

    const url = `prod/produits/?${params.toString()}`;
    console.log('🌐 API Request URL:', url);

    try {
      const response = await axios.get(url, { headers });
      console.log('✅ API Response received:', response.status);
      
      let productsData = response.data.results || [];
      console.log('📦 Products data count:', productsData.length);
      
      let backendTotaux = response.data.totaux;
      
      // If magasin filter is applied, calculate quantity for that specific magasin
      if ((appliedFilters.magasin && (userRole === "admin" || userRole !== "admin")) || 
          (userRole !== "admin" && userMagasinsAccess.length > 1 && appliedFilters.magasin)) {
        console.log('🔍 Applying magasin filter for quantity calculation');
        productsData = productsData.map(product => {
          let magasinQuantity = 0;
          
          // Get quantity from magasins array
          if (product.magasins && Array.isArray(product.magasins)) {
            const magasinEntry = product.magasins.find(mag => mag.id == appliedFilters.magasin);
            if (magasinEntry) {
              magasinQuantity = magasinEntry.codes_barres?.length || 0;
            }
          }
          
          return {
            ...product,
            filtered_quantity: magasinQuantity,
          };
        });
      }
      
      // Calculate totals
      let totalQuantity = 0;
      let totalValue = 0;
      let totalCapital = 0;
      
      if ((appliedFilters.magasin && (userRole === "admin" || userRole !== "admin")) ||
          (userRole !== "admin" && userMagasinsAccess.length > 1 && appliedFilters.magasin)) {
        // Calculate from filtered quantities
        totalQuantity = productsData.reduce((sum, p) => sum + (p.filtered_quantity || 0), 0);
        totalValue = productsData.reduce((sum, p) => {
          const price = p.prix_vente_cache || 0;
          const qty = p.filtered_quantity || 0;
          return sum + (price * qty);
        }, 0);
        totalCapital = productsData.reduce((sum, p) => {
          const price = p.prix_vente_3 || 0;
          const qty = p.filtered_quantity || 0;
          return sum + (price * qty);
        }, 0);
        console.log('📊 Filtered totals:', { totalQuantity, totalValue, totalCapital });
      } else if (backendTotaux) {
        totalQuantity = backendTotaux.total_quantite || 0;
        totalValue = backendTotaux.total_valeur || 0;
        totalCapital = backendTotaux.total_capital || 0;
        console.log('📊 Backend totals:', { totalQuantity, totalValue, totalCapital });
      } else {
        totalQuantity = productsData.reduce((sum, p) => sum + (p.quantite_totale || 0), 0);
        totalValue = productsData.reduce((sum, p) => {
          const price = p.prix_vente_cache || 0;
          const qty = p.quantite_totale || 0;
          return sum + (price * qty);
        }, 0);
        totalCapital = productsData.reduce((sum, p) => {
          const price = p.prix_vente_3 || 0;
          const qty = p.quantite_totale || 0;
          return sum + (price * qty);
        }, 0);
        console.log('📊 Calculated totals:', { totalQuantity, totalValue, totalCapital });
      }
      
      // Calculate total quantity for ALL products (without filters)
      let totalQuantityAll = totalQuantity;
      try {
        console.log('🌐 Fetching all products for total quantity...');
        const allProductsResponse = await axios.get(`prod/produits/`, { headers });
        const allProductsData = allProductsResponse.data.results || [];
        totalQuantityAll = allProductsData.reduce((sum, p) => {
          let productQty = 0;
          if (p.magasins && Array.isArray(p.magasins)) {
            productQty = p.magasins.reduce((magSum, mag) => magSum + (mag.codes_barres?.length || 0), 0);
          }
          return sum + productQty;
        }, 0);
        console.log('📊 All products total quantity:', totalQuantityAll);
      } catch (err) {
        console.error('❌ Error fetching all products:', err);
      }
      
      setTotaux({
        total_quantite: totalQuantity,
        total_valeur: totalValue,
        total_capital: totalCapital,
        total_quantite_all_products: totalQuantityAll,
        count: response.data.count || productsData.length,
      });
      
      setProducts(productsData);
      console.log('✅ Products set to state. Count:', productsData.length);
      
      setInitialLoading(false);
      
    } catch (err) {
      console.error("❌ Erreur lors du chargement des produits :", err);
      toast.error("خطأ في تحميل المنتجات");
      setProducts([]);
      setTotaux({
        total_quantite: 0,
        total_valeur: 0,
        total_capital: 0,
        total_quantite_all_products: 0,
        count: 0
      });
      setInitialLoading(false);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
      console.log('🏁 fetchProducts completed. loading set to false');
    }
  }, [userRole, userMagasin, headers, userMagasinsAccess]);

  // Update selected magasin filter display when magasinsOptions changes
  useEffect(() => {
    if (filters.magasin && magasinsOptions.length > 0) {
      const selectedMag = magasinsOptions.find(m => m.value == filters.magasin);
      setSelectedMagasinFilter(selectedMag);
    }
  }, [filters.magasin, magasinsOptions]);

  // Check if user should see the filter button
  const shouldShowFilter = useCallback(() => {
    if (userRole === "admin") return true;
    
    // For non-admin users, check their access type
    const userAccessType = localStorage.getItem("magasin_access_type");
    return userAccessType === "all_magasins" || 
           userAccessType === "selected_magasins" || 
           userMagasinsAccess.length > 1;
  }, [userRole, userMagasinsAccess]);

  // Fetch magasins and familles - only once
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    console.log('🟡 Initialization useEffect running');
    
    const initializeData = async () => {
      try {
        // First, get user's magasin access
        await fetchUserMagasinAccess();
        
        // Fetch magasins based on user's access
        if (userRole === "admin") {
          console.log('🌐 Fetching all magasins...');
          const magasinsRes = await axios.get("param/magasins/", { headers });
          const dataArray = Array.isArray(magasinsRes.data.results) ? magasinsRes.data.results : [];
          const options = dataArray.map((magasin) => ({
            value: magasin.id,
            label: magasin.nom,
          }));
          setMagasinsOptions([{ value: "", label: "الكل" }, ...options]);
          console.log('✅ Magasins loaded:', options.length);
        } else {
          // For non-admin users, fetch only accessible magasins
          console.log('🌐 Fetching accessible magasins for non-admin user...');
          
          let accessibleMagasins = [];
          
          // Get user's access type and allowed magasins
          const userId = localStorage.getItem("user_id");
          if (userId) {
            const userResponse = await axios.get(`/auth/users/${userId}/`, { headers });
            const userData = userResponse.data;
            const accessType = userData.magasin_access_type;
            
            // Store access type in localStorage for easy access
            localStorage.setItem("magasin_access_type", accessType);
            
            if (accessType === "all_magasins") {
              // Fetch all magasins
              const magasinsRes = await axios.get("param/magasins/", { headers });
              accessibleMagasins = magasinsRes.data.results || [];
              console.log('✅ User has access to ALL magasins');
            } else if (accessType === "selected_magasins") {
              // Get only allowed magasins
              accessibleMagasins = userData.magasins_acces_detail || [];
              console.log('✅ User has access to selected magasins:', accessibleMagasins.length);
            } else {
              // assigned_only - only their assigned magasin
              if (userMagasin) {
                const magasinsRes = await axios.get(`param/magasins/${userMagasin}/`, { headers });
                if (magasinsRes.data) {
                  accessibleMagasins = [magasinsRes.data];
                }
              }
              console.log('✅ User has access to assigned magasin only');
            }
          }
          
          const options = accessibleMagasins.map((magasin) => ({
            value: magasin.id,
            label: magasin.nom,
          }));
          
          // Only show filter options if user has access to multiple magasins
          if (accessibleMagasins.length > 1) {
            setMagasinsOptions([{ value: "", label: "الكل" }, ...options]);
          } else {
            setMagasinsOptions([]);
            // Auto-select the only magasin they have access to
            if (accessibleMagasins.length === 1) {
              setFilters(prev => ({ ...prev, magasin: accessibleMagasins[0].id.toString() }));
            }
          }
          console.log('✅ Magasins options loaded:', options.length);
        }

        // Fetch familles
        console.log('🌐 Fetching familles...');
        const famillesRes = await axios.get("prod/produits/familles/", { headers });
        const familles = Array.isArray(famillesRes.data.familles) ? famillesRes.data.familles : [];
        const famillesOptionsData = familles.map((fam) => ({
          value: fam.famille,
          label: fam.famille,
        }));
        setFamillesOptions([{ value: "", label: "الكل" }, ...famillesOptionsData]);
        console.log('✅ Familles loaded:', famillesOptionsData.length);
        
        // After fetching options, load products once
        console.log('🟢 Starting initial products fetch...');
        await fetchProducts('', { magasin: '', famille: '' });
        console.log('✅ Initial products fetch completed');
        
      } catch (err) {
        console.error("❌ Erreur lors du chargement des données:", err);
        setInitialLoading(false);
      }
    };

    initializeData();
    
    return () => {
      console.log('🔴 Component unmounting');
      isMounted.current = false;
    };
  }, []); // Empty dependency array - runs only once

  // Debounced search - only when searchTerm or filters change
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      return;
    }
    
    console.log('🔍 Search/filters changed:', { searchTerm, filters });
    const timeoutId = setTimeout(() => {
      fetchProducts(searchTerm, filters);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters, fetchProducts]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ magasin: '', famille: '' });
    setSearchTerm('');
    setSelectedMagasinFilter(null);
  };

  const handleDelete = (id) => {
    setSelectedId(id);
    setOpenConfirmationDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/prod/produits/${selectedId}/`, { headers });
      toast.success("تم حذف المنتج بنجاح");
      await fetchProducts(searchTerm, filters);
    } catch (err) {
      console.error(err);
      toast.error("فشل حذف المنتج");
    } finally {
      setOpenConfirmationDialog(false);
      setSelectedId(null);
    }
  };

  const handleExport = () => {
    axios
      .get("prod/produits/export-excel/", {
        headers,
        responseType: "blob",
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "produits.xlsx");
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        toast.success("تم تصدير المنتجات بنجاح");
      })
      .catch((err) => {
        console.error("Erreur export Excel :", err);
        toast.error("فشل تصدير المنتجات");
      });
  };

  const handleOpenAddDialog = () => {
    setSelectedProduct(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (product) => {
    setSelectedProduct(product);
    setOpenDialog(true);
  };

  const handleRowClick = (product) => {
    setSelectedProductForDetail(product);
    setOpenDetailDialog(true);
  };

  // Get the correct quantity based on filters
  const getProductQuantity = (product) => {
    if (filters.magasin && (userRole === "admin" || userRole !== "admin")) {
      return product.filtered_quantity || 0;
    }
    return product.quantite_totale || 0;
  };

  // Calculate statistics based on displayed products
  const totalProducts = products.length;
  const totalValue = totaux?.total_valeur || 0;
  const totalQuantity = totaux?.total_quantite || 0;
  const totalQuantityAll = totaux?.total_quantite_all_products || 0;
  const totalCount = totaux?.count || totalProducts;
  
  const lowStockCount = products.filter(p => {
    const quantity = getProductQuantity(p);
    return quantity <= 5 && quantity > 0;
  }).length;
  
  const outOfStockCount = products.filter(p => {
    const quantity = getProductQuantity(p);
    return quantity === 0;
  }).length;

  const getStatusColor = (quantite) => {
    if (quantite <= 0) return 'bg-red-500/20 text-red-400';
    if (quantite <= 5) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-emerald-500/20 text-emerald-400';
  };

  const getStatusText = (quantite) => {
    if (quantite <= 0) return 'نفذ';
    if (quantite <= 5) return 'منخفض';
    return 'متوفر';
  };

  const formatPrice = (price) => {
    return price ? Math.round(price): '0';
  };

  console.log('🎨 Rendering component. initialLoading:', initialLoading, 'products.length:', products.length, 'loading:', loading);

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              <div className="text-xs text-purple-300">المنتجات:</div>
              <div className="text-lg text-white">{totalCount}</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="text-xs text-blue-300">القيمة الإجمالية:</div>
              <div className="text-lg text-white">{formatPrice(totalValue)} دج</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-500/20 to-green-600/20 border border-emerald-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="text-xs text-emerald-300">إجمالي الكمية:</div>
              <div className="text-lg text-emerald-400">{totalQuantity}</div>
            </div>
          </div>
         
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-600/20 border border-yellow-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="text-xs text-yellow-300">مخزون منخفض:</div>
              <div className="text-lg text-yellow-400">{lowStockCount}</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-red-500/20 to-rose-600/20 border border-red-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="text-xs text-red-300">نفذ من المخزون:</div>
              <div className="text-lg text-red-400">{outOfStockCount}</div>
            </div>
          </div>
          {filters.magasin && selectedMagasinFilter && (
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <div className="text-xs text-cyan-300">المخزن المحدد:</div>
                <div className="text-lg text-cyan-400">{selectedMagasinFilter.label}</div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {userRole === "admin" && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-emerald-500/50 transition-all text-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>EXCEL</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenAddDialog}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>منتج جديد</span>
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
          <input
            type="text"
            placeholder="البحث عن منتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500 placeholder-slate-400"
          />
        </div>
        {/* Only show filter button for users who have access to multiple magasins or are admin */}
        {shouldShowFilter() && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              showFilters || filters.magasin || filters.famille
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>فلترة</span>
          </motion.button>
        )}
      </div>

      {/* Filter Panel - Only show if there are filter options */}
      {showFilters && shouldShowFilter() && magasinsOptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/50 rounded-lg p-4 border border-amber-500/30"
        >
          <div className="flex gap-4 flex-wrap">
            {magasinsOptions.length > 0 && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm text-slate-400 mb-1">المخزن</label>
                <select
                  name="magasin"
                  value={filters.magasin}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                >
                  {magasinsOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {filters.magasin && (
                  <p className="text-xs text-cyan-400 mt-1">
                    * سيتم عرض الكميات الخاصة بهذا المخزن فقط
                  </p>
                )}
              </div>
            )}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-slate-400 mb-1">الفئة</label>
              <select
                name="famille"
                value={filters.famille}
                onChange={handleFilterChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                {famillesOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            {(filters.magasin || filters.famille) && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                >
                  <X className="w-4 h-4" />
                  <span>مسح الفلتر</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Products Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
          <h2 className="text-white text-lg flex items-center gap-2">
            <Package className="w-5 h-5" />
            قائمة المنتجات
            {filters.magasin && selectedMagasinFilter && (
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                (الكميات الخاصة بمخزن {selectedMagasinFilter.label})
              </span>
            )}
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-2 text-slate-500" />
            لا توجد منتجات
            <div className="text-xs mt-2 text-slate-500">
              {searchTerm ? `نتيجة بحث: "${searchTerm}"` : ''}
              {filters.magasin ? ` | مخزن: ${selectedMagasinFilter?.label || filters.magasin}` : ''}
              {filters.famille ? ` | فئة: ${filters.famille}` : ''}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <th className="px-4 py-3 text-right">الرقم</th>
                  <th className="px-4 py-3 text-right">المرجع</th>
                  <th className="px-4 py-3 text-right">اسم المنتج</th>
                  <th className="px-4 py-3 text-right">الفئة</th>
                  {userRole === "admin" && (
                    <>
                      <th className="px-4 py-3 text-right">ن.ف</th>
                      <th className="px-4 py-3 text-right">ن.ف.ت</th>
                      <th className="px-4 py-3 text-right">سعر الشراء</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-right">سعر كاش</th>
                  <th className="px-4 py-3 text-right">سعر 3</th>
                  <th className="px-4 py-3 text-right">سعر 5</th>
                  <th className="px-4 py-3 text-right">سعر 6</th>
                  <th className="px-4 py-3 text-right">سعر 8</th>
                  <th className="px-4 py-3 text-right">سعر 9</th>
                  <th className="px-4 py-3 text-right">سعر 10</th>
                  <th className="px-4 py-3 text-right">سعر 12</th>
                  <th className="px-4 py-3 text-right">سعر 15</th>
                  <th className="px-4 py-3 text-right">الكمية</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => {
                  const displayQuantity = getProductQuantity(product);
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleRowClick(product)}
                      className={`border-b border-slate-700/50 transition-all cursor-pointer hover:bg-purple-500/10 ${
                        index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-purple-300">{product.id}</td>
                      <td className="px-4 py-3 text-blue-300 font-mono text-xs">{product.reference || '—'}</td>
                      <td className="px-4 py-3 text-white font-medium">{product.nom}</td>
                      <td className="px-4 py-3 text-slate-300">{product.famille || '—'}</td>
                      
                      {userRole === "admin" && (
                        <>
                          <td className="px-4 py-3 text-emerald-300">{product.taux_benefice_cache || '-'}</td>
                          <td className="px-4 py-3 text-amber-300">{product.moyenne_pourcentage_facilite || '-'}</td>
                          <td className="px-4 py-3 text-cyan-300">{formatPrice(product.prix_achat)} دج</td>
                        </>
                      )}
                      
                      <td className="px-4 py-3 text-emerald-300">{formatPrice(product.prix_vente_cache)} دج</td>
                      <td className="px-4 py-3 text-amber-300">{formatPrice(product.prix_vente_3)} دج</td>
                      <td className="px-4 py-3 text-amber-300">{formatPrice(product.prix_vente_5)} دج</td>
                      <td className="px-4 py-3 text-amber-300">{formatPrice(product.prix_vente_6)} دج</td>
                      <td className="px-4 py-3 text-amber-300">{formatPrice(product.prix_vente_8)} دج</td>
                      <td className="px-4 py-3 text-amber-300">{formatPrice(product.prix_vente_9)} دج</td>
                      <td className="px-4 py-3 text-amber-300">{formatPrice(product.prix_vente_10)} دج</td>
                      <td className="px-4 py-3 text-amber-300">{formatPrice(product.prix_vente_12)} d</td>
                      <td className="px-4 py-3 text-amber-300">{formatPrice(product.prix_vente_15)}</td>
                      
                      <td className="px-4 py-3">
                        <div>
                          <span className={`font-bold ${
                            displayQuantity === 0 ? 'text-red-400' : 
                            displayQuantity <= 5 ? 'text-yellow-400' : 'text-white'
                          }`}>
                            {displayQuantity}
                          </span>
                          {filters.magasin && displayQuantity !== product.quantite_totale && (
                            <span className="text-xs text-slate-500 block">
                              (الإجمالي: {product.quantite_totale || 0})
                            </span>
                          )}
                        </div>
                       </td>
                      
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(displayQuantity)}`}>
                          {getStatusText(displayQuantity)}
                        </span>
                       </td>
                      
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          {userRole === "admin" && (
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleOpenEditDialog(product)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(product.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                       </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        {products.length > 0 && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-t border-slate-700">
            <div className="flex justify-between items-center text-sm flex-wrap gap-2">
              <div className="text-slate-400">
                عرض {products.length} من {totalCount} منتج
              </div>
              <div className="flex gap-4 flex-wrap">
                <div className="text-emerald-400">
                  إجمالي قيمة المخزون: <span className="font-bold">{formatPrice(totalValue)} دج</span>
                </div>
                <div className="text-cyan-400">
                  إجمالي الكمية: <span className="font-bold">{totalQuantity}</span>
                </div>
                <div className="text-yellow-400">
                  منتجات تحتاج تموين: <span className="font-bold">{lowStockCount}</span>
                </div>
                <div className="text-red-400">
                  منتجات نفذت: <span className="font-bold">{outOfStockCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Single Dialog for Add/Edit */}
      <AddProduitDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          fetchProducts(searchTerm, filters);
        }}
        productToEdit={selectedProduct}
      />

      <ConfirmationDialog
        open={openConfirmationDialog}
        onClose={() => setOpenConfirmationDialog(false)}
        onConfirm={confirmDelete}
        text="هل أنت متأكد من حذف هذا المنتج؟"
      />
      
      <ProductDetailDialog
        open={openDetailDialog}
        onClose={() => {
          setOpenDetailDialog(false);
          setSelectedProductForDetail(null);
        }}
        product={selectedProductForDetail}
        selectedMagasinId={filters.magasin}
      />
    </div>
  );
}