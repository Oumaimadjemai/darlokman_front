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
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);
  
  // Pagination states
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
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
  const currentFiltersRef = useRef({ search: '', filters: { magasin: '', famille: '' } });
  const loadingTriggerRef = useRef(null);
  
  const userRole = localStorage.getItem("role");
  const userMagasin = localStorage.getItem("magasin_id");
  
  const headers = useMemo(() => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  }), []);

  // Fetch current user's magasin access
  const fetchUserMagasinAccess = useCallback(async () => {
    if (userRole !== "admin") {
      try {
        const token = localStorage.getItem("access_token");
        const userId = localStorage.getItem("user_id");
        
        if (userId) {
          const response = await axios.get(`/auth/users/${userId}/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const userData = response.data;
          const accessType = userData.magasin_access_type;
          
          if (accessType === "all_magasins") {
            const magasinsRes = await axios.get("param/magasins/", { headers });
            const allMagasins = magasinsRes.data.results || [];
            setUserMagasinsAccess(allMagasins.map(m => ({ id: m.id, nom: m.nom })));
          } else if (accessType === "selected_magasins") {
            const allowedMagasins = userData.magasins_acces_detail || [];
            setUserMagasinsAccess(allowedMagasins);
          } else {
            if (userMagasin) {
              setUserMagasinsAccess([{ id: parseInt(userMagasin), nom: "Magasin assigné" }]);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching user magasin access:", err);
        if (userMagasin) {
          setUserMagasinsAccess([{ id: parseInt(userMagasin), nom: "Magasin assigné" }]);
        }
      }
    }
  }, [userRole, userMagasin, headers]);

  // Fetch products with pagination
  const fetchProducts = useCallback(async (search = '', appliedFilters = { magasin: '', famille: '' }, isReset = true) => {
    if (fetchInProgress.current) {
      return;
    }
    
    fetchInProgress.current = true;
    
    if (isReset) {
      setLoading(true);
      setProducts([]);
      setNextPageUrl(null);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    
    currentFiltersRef.current = { search, filters: appliedFilters };
    
    const params = new URLSearchParams();

    if (search) params.append("search", search);

    // Filter by magasin based on role and access
    if (userRole !== "admin") {
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
        if (appliedFilters.magasin) {
          params.append("magasin", appliedFilters.magasin);
        }
      } else if (userAccessType === "selected_magasins") {
        if (appliedFilters.magasin) {
          params.append("magasin", appliedFilters.magasin);
        }
      } else {
        params.append("magasin", userMagasin);
      }
    } else if (appliedFilters.magasin) {
      params.append("magasin", appliedFilters.magasin);
    }

    if (appliedFilters.famille) params.append("famille", appliedFilters.famille);
    
    params.append("page_size", "50");

    const url = `prod/produits/?${params.toString()}`;

    try {
      const response = await axios.get(url, { headers });
      
      if (currentFiltersRef.current.search !== search || 
          JSON.stringify(currentFiltersRef.current.filters) !== JSON.stringify(appliedFilters)) {
        return;
      }
      
      let productsData = response.data.results || [];
      const nextUrl = response.data.next;
      const backendTotaux = response.data.totaux;
      
      // If magasin filter is applied, calculate quantity for that specific magasin
      if (appliedFilters.magasin && (userRole === "admin" || userRole !== "admin")) {
        productsData = productsData.map(product => {
          let magasinQuantity = 0;
          
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
      
      if (isReset) {
        setProducts(productsData);
      } else {
        setProducts(prev => [...prev, ...productsData]);
      }
      
      setNextPageUrl(nextUrl);
      setHasMore(!!nextUrl);
      setTotalCount(response.data.count || 0);
      
      // Use backend totals
      if (backendTotaux) {
        setTotaux({
          total_quantite: backendTotaux.total_quantite || 0,
          total_valeur: backendTotaux.total_valeur || 0,
          total_capital: backendTotaux.total_capital || 0,
          total_quantite_all_products: backendTotaux.total_quantite_all_products || backendTotaux.total_quantite || 0,
          count: response.data.count || productsData.length,
        });
      } else {
        let totalQuantity = 0;
        let totalValue = 0;
        let totalCapital = 0;
        
        if (appliedFilters.magasin) {
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
        }
        
        setTotaux({
          total_quantite: totalQuantity,
          total_valeur: totalValue,
          total_capital: totalCapital,
          total_quantite_all_products: totalQuantity,
          count: response.data.count || productsData.length,
        });
      }
      
      setInitialLoading(false);
      
    } catch (err) {
      console.error("Error loading products:", err);
      if (isReset) {
        toast.error("خطأ في تحميل المنتجات");
        setProducts([]);
        setTotaux({
          total_quantite: 0,
          total_valeur: 0,
          total_capital: 0,
          total_quantite_all_products: 0,
          count: 0
        });
      }
      setInitialLoading(false);
    } finally {
      if (isReset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
      fetchInProgress.current = false;
    }
  }, [userRole, userMagasin, headers]);

  // Load more products
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || fetchInProgress.current || !nextPageUrl) return;
    
    setLoadingMore(true);
    fetchInProgress.current = true;
    
    try {
      const response = await axios.get(nextPageUrl, { headers });
      
      let productsData = response.data.results || [];
      const nextUrl = response.data.next;
      
      if (filters.magasin && (userRole === "admin" || userRole !== "admin")) {
        productsData = productsData.map(product => {
          let magasinQuantity = 0;
          if (product.magasins && Array.isArray(product.magasins)) {
            const magasinEntry = product.magasins.find(mag => mag.id == filters.magasin);
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
      
      setProducts(prev => [...prev, ...productsData]);
      setNextPageUrl(nextUrl);
      setHasMore(!!nextUrl);
      
    } catch (err) {
      console.error("Error loading more products:", err);
      toast.error("خطأ في تحميل المزيد من المنتجات");
    } finally {
      setLoadingMore(false);
      fetchInProgress.current = false;
    }
  }, [nextPageUrl, hasMore, loadingMore, headers, filters.magasin, userRole]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const currentTrigger = loadingTriggerRef.current;
    if (!currentTrigger || !hasMore || loadingMore || fetchInProgress.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !fetchInProgress.current) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    
    observer.observe(currentTrigger);
    
    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
    };
  }, [hasMore, loadingMore, loadMore]);

  // Update selected magasin filter display
  useEffect(() => {
    if (filters.magasin && magasinsOptions.length > 0) {
      const selectedMag = magasinsOptions.find(m => m.value == filters.magasin);
      setSelectedMagasinFilter(selectedMag);
    }
  }, [filters.magasin, magasinsOptions]);

  // Check if user should see the filter button
  const shouldShowFilter = useCallback(() => {
    if (userRole === "admin") return true;
    const userAccessType = localStorage.getItem("magasin_access_type");
    return userAccessType === "all_magasins" || 
           userAccessType === "selected_magasins" || 
           userMagasinsAccess.length > 1;
  }, [userRole, userMagasinsAccess]);

  // Initialize data
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    const initializeData = async () => {
      try {
        await fetchUserMagasinAccess();
        
        if (userRole === "admin") {
          const magasinsRes = await axios.get("param/magasins/", { headers });
          const dataArray = Array.isArray(magasinsRes.data.results) ? magasinsRes.data.results : [];
          const options = dataArray.map((magasin) => ({
            value: magasin.id,
            label: magasin.nom,
          }));
          setMagasinsOptions([{ value: "", label: "الكل" }, ...options]);
        } else {
          let accessibleMagasins = [];
          const userId = localStorage.getItem("user_id");
          if (userId) {
            const userResponse = await axios.get(`/auth/users/${userId}/`, { headers });
            const userData = userResponse.data;
            const accessType = userData.magasin_access_type;
            localStorage.setItem("magasin_access_type", accessType);
            
            if (accessType === "all_magasins") {
              const magasinsRes = await axios.get("param/magasins/", { headers });
              accessibleMagasins = magasinsRes.data.results || [];
            } else if (accessType === "selected_magasins") {
              accessibleMagasins = userData.magasins_acces_detail || [];
            } else {
              if (userMagasin) {
                const magasinsRes = await axios.get(`param/magasins/${userMagasin}/`, { headers });
                if (magasinsRes.data) {
                  accessibleMagasins = [magasinsRes.data];
                }
              }
            }
          }
          
          const options = accessibleMagasins.map((magasin) => ({
            value: magasin.id,
            label: magasin.nom,
          }));
          
          if (accessibleMagasins.length > 1) {
            setMagasinsOptions([{ value: "", label: "الكل" }, ...options]);
          } else {
            setMagasinsOptions([]);
            if (accessibleMagasins.length === 1) {
              setFilters(prev => ({ ...prev, magasin: accessibleMagasins[0].id.toString() }));
            }
          }
        }

        const famillesRes = await axios.get("prod/produits/familles/", { headers });
        const familles = Array.isArray(famillesRes.data.familles) ? famillesRes.data.familles : [];
        const famillesOptionsData = familles.map((fam) => ({
          value: fam.famille,
          label: fam.famille,
        }));
        setFamillesOptions([{ value: "", label: "الكل" }, ...famillesOptionsData]);
        
        await fetchProducts('', { magasin: '', famille: '' }, true);
        
      } catch (err) {
        console.error("Error initializing data:", err);
        setInitialLoading(false);
      }
    };

    initializeData();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Debounced search
  useEffect(() => {
    if (!hasInitialized.current) return;
    
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      return;
    }
    
    const timeoutId = setTimeout(() => {
      fetchProducts(searchTerm, filters, true);
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
      await fetchProducts(searchTerm, filters, true);
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
        console.error("Export error:", err);
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

  const getProductQuantity = (product) => {
    if (filters.magasin) {
      return product.filtered_quantity || 0;
    }
    return product.quantite_totale || 0;
  };

  const totalValue = totaux?.total_valeur || 0;
  const totalQuantity = totaux?.total_quantite || 0;
  
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
    return price ? Math.round(price) : '0';
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header with Stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap top-0 z-20  backdrop-blur-sm py-4 -mt-4 px-4 rounded-lg">
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
              <div className="text-lg text-white">{formatPrice(totalValue)} </div>
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
      <div className="flex gap-2  top-24 z-20 backdrop-blur-sm py-2 px-4 rounded-lg">
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

      {/* Filter Panel */}
      {showFilters && shouldShowFilter() && magasinsOptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/50 rounded-lg p-4 border border-amber-500/30 mx-4"
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
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl overflow-hidden shadow-lg mx-4">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
          <h2 className="text-white text-lg flex items-center gap-2">
            <Package className="w-5 h-5" />
            قائمة المنتجات
            {filters.magasin && selectedMagasinFilter && (
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                (الكميات الخاصة بمخزن {selectedMagasinFilter.label})
              </span>
            )}
            {loading && (
              <span className="text-xs bg-white/20 px-2 py-1 rounded ml-2">
                جاري التحميل...
              </span>
            )}
          </h2>
        </div>
        
        {loading && products.length === 0 ? (
          <div className="flex justify-center items-center py-32">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-400 mr-3">جاري تحميل المنتجات...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-2 text-slate-500" />
            لا توجد منتجات
            <div className="text-xs mt-2 text-slate-500">
              {searchTerm ? `نتيجة بحث: "${searchTerm}"` : ''}
              {filters.magasin ? ` | مخزن: ${selectedMagasinFilter?.label || filters.magasin}` : ''}
              {filters.famille ? ` | فئة: ${filters.famille}` : ''}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                    <th className="px-4 py-3 text-right whitespace-nowrap">الرقم</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">المرجع</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">اسم المنتج</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">الفئة</th>
                    {userRole === "admin" && (
                      <>
                        <th className="px-4 py-3 text-right whitespace-nowrap">ن.ف</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap">ن.ف.ت</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap">سعر الشراء</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-right whitespace-nowrap">سعر كاش</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">سعر 3</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">سعر 5</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">سعر 6</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">سعر 8</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">سعر 9</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">سعر 10</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">سعر 12</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">سعر 15</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">الكمية</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">الحالة</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">الإجراءات</th>
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
                        transition={{ delay: Math.min(index * 0.01, 0.5) }}
                        onClick={() => handleRowClick(product)}
                        className={`border-b border-slate-700/50 transition-all cursor-pointer hover:bg-purple-500/10 ${
                          index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'
                        }`}
                      >
                        <td className="px-4 py-3 text-purple-300 whitespace-nowrap">{product.id}</td>
                        <td className="px-4 py-3 text-blue-300 font-mono text-xs whitespace-nowrap">{product.reference || '—'}</td>
                        <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{product.nom}</td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{product.famille || '—'}</td>
                        
                        {userRole === "admin" && (
                          <>
                            <td className="px-4 py-3 text-emerald-300 whitespace-nowrap">{product.taux_benefice_cache || '-'}</td>
                            <td className="px-4 py-3 text-amber-300 whitespace-nowrap">{product.moyenne_pourcentage_facilite || '-'}</td>
                            <td className="px-4 py-3 text-cyan-300 whitespace-nowrap">{formatPrice(product.prix_achat)} </td>
                          </>
                        )}
                        
                        <td className="px-4 py-3 text-emerald-300 whitespace-nowrap">{formatPrice(product.prix_vente_cache)} </td>
                        <td className="px-4 py-3 text-amber-300 whitespace-nowrap">{formatPrice(product.prix_vente_3)} </td>
                        <td className="px-4 py-3 text-amber-300 whitespace-nowrap">{formatPrice(product.prix_vente_5)} </td>
                        <td className="px-4 py-3 text-amber-300 whitespace-nowrap">{formatPrice(product.prix_vente_6)} </td>
                        <td className="px-4 py-3 text-amber-300 whitespace-nowrap">{formatPrice(product.prix_vente_8)} </td>
                        <td className="px-4 py-3 text-amber-300 whitespace-nowrap">{formatPrice(product.prix_vente_9)} </td>
                        <td className="px-4 py-3 text-amber-300 whitespace-nowrap">{formatPrice(product.prix_vente_10)} </td>
                        <td className="px-4 py-3 text-amber-300 whitespace-nowrap">{formatPrice(product.prix_vente_12)} </td>
                        <td className="px-4 py-3 text-amber-300 whitespace-nowrap">{formatPrice(product.prix_vente_15)}</td>
                        
                        <td className="px-4 py-3 whitespace-nowrap">
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
                        
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(displayQuantity)}`}>
                            {getStatusText(displayQuantity)}
                          </span>
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
            
            {/* Loading trigger for infinite scroll */}
            <div ref={loadingTriggerRef} className="h-4 w-full"></div>
            
            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex justify-center items-center py-4 bg-slate-800/50">
                <div className="w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400 mr-2">جاري تحميل المزيد...</span>
              </div>
            )}
            
            {/* End of products message */}
            {!hasMore && products.length > 0 && (
              <div className="text-center py-4 text-slate-500 text-sm">
                تم تحميل جميع المنتجات ({products.length} من {totalCount})
              </div>
            )}
          </>
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
                  إجمالي قيمة المخزون: <span className="font-bold">{formatPrice(totalValue)} </span>
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

      <AddProduitDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          fetchProducts(searchTerm, filters, true);
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