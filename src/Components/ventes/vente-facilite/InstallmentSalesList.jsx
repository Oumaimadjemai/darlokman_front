import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  Eye,
  Trash2,
  Printer,
  Filter,
  X,
  Calendar,
  User,
  DollarSign,
  Plus,
  CreditCard,
  FileText,
  Building2,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "../../../api/axiosInstance";
import ConfirmationDialog from "../../Cards/ConfirmationDialog";
import { saveAs } from "file-saver";

export function InstallmentSalesList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openPrintDialog, setOpenPrintDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [totaux, setTotaux] = useState({
    total_ventes: 0,
    total_montant_total: 0,
    total_montant_verse: 0,
    total_montant_restant: 0,
  });
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    next: null,
    previous: null,
    currentPage: 1,
    totalPages: 1,
  });
  const [printSaleDetails, setPrintSaleDetails] = useState(null);
  const [loadingPrintDetails, setLoadingPrintDetails] = useState(false);
  const [userAccessibleMagasins, setUserAccessibleMagasins] = useState([]);
  const [userMagasinAccessType, setUserMagasinAccessType] = useState('assigned_only');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null); // For admin user filter

  const [filters, setFilters] = useState({
    periode: "",
    date_from: null,
    date_to: null,
    user: null, // Add user filter
  });

  const initialLoadDone = useRef(false);
  const abortControllerRef = useRef(null);
  const usersFetched = useRef(false);
  const searchDebounceRef = useRef(null);
  const filterDebounceRef = useRef(null);
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);
  const userIdRef = useRef(null);

  const role = localStorage.getItem("role");
  const userMagasinId = localStorage.getItem("magasin_id");
  const currentUsername = localStorage.getItem("username");
  
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  };

  const periodeOptions = [
    { value: "", label: "الكل" },
    { value: "today", label: "اليوم" },
    { value: "yesterday", label: "الأمس" },
    { value: "this_week", label: "هذا الأسبوع" },
    { value: "this_month", label: "هذا الشهر" },
    { value: "last_month", label: "الشهر الماضي" },
    { value: "this_year", label: "هذا العام" },
  ];

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      if (filterDebounceRef.current) {
        clearTimeout(filterDebounceRef.current);
      }
    };
  }, []);

  // Function to fetch current user ID from API if not in localStorage
  const fetchCurrentUserId = useCallback(async () => {
    // First check localStorage
    let userId = localStorage.getItem("user_id");
    if (userId) {
      userIdRef.current = userId;
      setCurrentUserId(userId);
      return userId;
    }
    
    // Try to decode from token
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.user_id || payload.sub || payload.id;
        if (userId) {
          localStorage.setItem("user_id", userId);
          userIdRef.current = userId;
          setCurrentUserId(userId);
          return userId;
        }
      }
    } catch (e) {
      console.error("Failed to decode token", e);
    }
    
    // If still no user_id, try to get from the users list using username
    if (currentUsername) {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get("/auth/users/", {
          headers: { Authorization: `Bearer ${token}` },
          params: { search: currentUsername, page_size: 1 },
          timeout: 10000,
        });
        const usersList = response.data.results || [];
        if (usersList.length > 0 && usersList[0].username === currentUsername) {
          userId = usersList[0].id;
          localStorage.setItem("user_id", userId);
          userIdRef.current = userId;
          setCurrentUserId(userId);
          return userId;
        }
      } catch (err) {
        console.error("Failed to fetch user by username", err);
      }
    }
    
    return null;
  }, [currentUsername]);

  // Fetch user's accessible magasins
  const fetchUserAccessibleMagasins = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const userId = currentUserId || userIdRef.current || await fetchCurrentUserId();
      
      if (!userId && role !== 'admin') {
        console.warn("No user_id found for non-admin user");
        if (userMagasinId) {
          setUserAccessibleMagasins([parseInt(userMagasinId)]);
        }
        return;
      }
      
      // For admin, we might want all magasins or none
      if (role === 'admin') {
        setUserAccessibleMagasins([]);
        return;
      }
      
      const response = await axios.get(`/auth/users/${userId}/`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      
      if (!isMounted.current) return;
      
      const userData = response.data;
      setUserMagasinAccessType(userData.magasin_access_type || 'assigned_only');
      
      let accessibleMagasinIds = [];
      
      if (userData.magasin_access_type === 'all_magasins') {
        const magasinsResponse = await axios.get("/param/magasins/", {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        if (isMounted.current) {
          accessibleMagasinIds = (magasinsResponse.data.results || []).map(m => m.id);
          setUserAccessibleMagasins(accessibleMagasinIds);
        }
      } else if (userData.magasin_access_type === 'selected_magasins') {
        accessibleMagasinIds = (userData.magasins_acces_detail || []).map(m => m.id);
        if (isMounted.current) setUserAccessibleMagasins(accessibleMagasinIds);
      } else if (userData.magasin_access_type === 'assigned_only' && userData.magasin_detail) {
        accessibleMagasinIds = [userData.magasin_detail.id];
        if (isMounted.current) setUserAccessibleMagasins(accessibleMagasinIds);
      }
    } catch (error) {
      console.error("Error fetching user magasin access:", error);
      if (isMounted.current && userMagasinId) {
        setUserAccessibleMagasins([parseInt(userMagasinId)]);
      }
    }
  }, [currentUserId, fetchCurrentUserId, role, userMagasinId]);

  // Fetch users for filter (only once)
  useEffect(() => {
    if (usersFetched.current) return;
    usersFetched.current = true;

    const fetchUsers = async () => {
      try {
        const response = await axios.get("/auth/users/", {
          headers,
          params: { page_size: 500 },
          timeout: 15000,
        });
        if (isMounted.current) {
          const usersList = response.data.results || response.data || [];
          setUsers(usersList);
          setUsersLoaded(true);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
        if (isMounted.current) {
          setUsers([]);
          setUsersLoaded(true);
        }
      }
    };
    fetchUsers();
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!isMounted.current) return;
    
    // For non-admin, need user ID
    if (role !== 'admin' && !currentUserId) return;
    
    setLoadingStats(true);

    const params = {};
    if (filters.periode) params.periode = filters.periode;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    
    // Add user filter based on role
    if (role === 'admin' && selectedUserId) {
      // Admin selected a specific user
      params.user = selectedUserId;
    } else if (role !== 'admin' && currentUserId) {
      // Regular user sees only their own stats
      params.user = currentUserId;
    }

    try {
      const response = await axios.get(`/vente/ventes-facilite/stats/`, {
        headers,
        params,
        timeout: 30000
      });
      if (isMounted.current) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      if (isMounted.current) {
        toast.error("فشل تحميل الإحصائيات");
      }
    } finally {
      if (isMounted.current) {
        setLoadingStats(false);
      }
    }
  }, [filters, currentUserId, role, selectedUserId]);

  // Fetch sales with filters
  const fetchSales = useCallback(
    async (page = 1, forceRefresh = false) => {
      // For non-admin users, need user ID
      if (role !== 'admin') {
        const userId = currentUserId || userIdRef.current;
        if (!userId) {
          console.log("Waiting for user ID...");
          setLoading(false);
          return;
        }
      }

      // Prevent multiple simultaneous fetches
      if (fetchInProgress.current && !forceRefresh) {
        console.log("Fetch already in progress, skipping...");
        return;
      }

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      const newAbortController = new AbortController();
      abortControllerRef.current = newAbortController;
      fetchInProgress.current = true;

      if (forceRefresh) {
        setRefreshing(true);
      }
      setLoading(true);
      setError(null);

      const params = {
        page: page,
        page_size: 50,
      };

      // Add user filter based on role
      if (role === 'admin' && selectedUserId) {
        // Admin selected a specific user
        params.users = selectedUserId; // Using 'users' as per your filter class
        console.log("Admin filtering by user ID:", selectedUserId);
      } else if (role !== 'admin') {
        // Regular user sees only their own sales
        const userId = currentUserId || userIdRef.current;
        if (userId) {
          params.users = userId;
          console.log("Regular user filtering by user ID:", userId);
        }
      } else {
        console.log("Admin user - fetching all sales (no user filter)");
      }

      // Add search term
      if (searchTerm) params.search = searchTerm;
      
      // Add date filters
      if (filters.periode) params.periode = filters.periode;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      
      // Add magasin filter for non-admin users with magasin restrictions
      if (role !== 'admin' && userAccessibleMagasins.length > 0) {
        params.magasins = userAccessibleMagasins.join(',');
      }

      try {
        console.log("Making API request with params:", params);
        const response = await axios.get(`/vente/ventes-facilite/`, {
          headers,
          params,
          signal: newAbortController.signal,
          timeout: 30000,
        });

        if (!isMounted.current) return;

        const responseData = response.data;
        const apiResults = responseData.results;
        
        let salesList = [];
        let totalVentes = 0;
        let totalMontantTotal = 0;
        let totalMontantVerse = 0;
        let totalMontantRestant = 0;
        
        if (apiResults && apiResults.ventes) {
          salesList = apiResults.ventes;
          totalVentes = apiResults.total_ventes || salesList.length;
          totalMontantTotal = parseFloat(apiResults.total_montant_total) || 0;
          totalMontantVerse = parseFloat(apiResults.total_montant_verse) || 0;
          totalMontantRestant = parseFloat(apiResults.total_montant_restant) || 0;
          
          console.log(`Fetched ${salesList.length} sales`);
        } else if (Array.isArray(apiResults)) {
          salesList = apiResults;
          totalVentes = salesList.length;
          totalMontantTotal = salesList.reduce((sum, sale) => sum + (parseFloat(sale.montant_total) || 0), 0);
          totalMontantVerse = salesList.reduce((sum, sale) => sum + (parseFloat(sale.montant_verse) || 0), 0);
          totalMontantRestant = salesList.reduce((sum, sale) => sum + (parseFloat(sale.montant_restant) || 0), 0);
        } else {
          console.warn("Unexpected API response structure:", responseData);
          salesList = [];
        }
        
        setSales(salesList);
        
        setTotaux({
          total_ventes: totalVentes,
          total_montant_total: totalMontantTotal,
          total_montant_verse: totalMontantVerse,
          total_montant_restant: totalMontantRestant,
        });

        const totalPages = Math.ceil((responseData.count || totalVentes) / 50);
        setPagination({
          next: responseData.next,
          previous: responseData.previous,
          currentPage: page,
          totalPages: totalPages > 0 ? totalPages : 1,
        });
        
      } catch (err) {
        // Ignore cancelled requests
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
          console.log("Request cancelled");
          return;
        }
        
        if (!isMounted.current) return;
        
        console.error("Error fetching sales:", err);
        setError("حدث خطأ في تحميل المبيعات");
        toast.error("حدث خطأ في تحميل المبيعات");
      } finally {
        if (isMounted.current && abortControllerRef.current === newAbortController) {
          setLoading(false);
          setRefreshing(false);
          fetchInProgress.current = false;
        }
      }
    },
    [searchTerm, filters, userAccessibleMagasins, role, currentUserId, selectedUserId],
  );

  // Initial load
  useEffect(() => {
    const init = async () => {
      if (initialLoadDone.current) return;
      
      console.log("Initializing InstallmentSalesList...");
      console.log("User role:", role);
      
      if (role !== 'admin') {
        // For non-admin users, fetch user ID first
        const userId = await fetchCurrentUserId();
        console.log("Current user ID:", userId);
        
        if (userId) {
          setCurrentUserId(userId);
          userIdRef.current = userId;
          await fetchUserAccessibleMagasins();
          setIsInitialized(true);
          setTimeout(() => {
            if (isMounted.current) {
              fetchSales(1);
            }
          }, 100);
        } else {
          console.error("Could not determine current user ID");
          setError("لا يمكن تحديد المستخدم الحالي");
          setLoading(false);
        }
      } else {
        // For admin users, no need to fetch user ID
        console.log("Admin user - will fetch all sales");
        setIsInitialized(true);
        await fetchUserAccessibleMagasins();
        setTimeout(() => {
          if (isMounted.current) {
            fetchSales(1);
          }
        }, 100);
      }
      initialLoadDone.current = true;
    };
    
    init();
  }, [fetchCurrentUserId, fetchUserAccessibleMagasins, role]);

  // Fetch sales when dependencies change
  useEffect(() => {
    if (!isInitialized) return;
    
    // For non-admin, need currentUserId
    if (role !== 'admin' && !currentUserId) return;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      fetchSales(1);
      setStats(null);
    }, 500);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchTerm, fetchSales, isInitialized, currentUserId, role, selectedUserId]);

  // Debounced filters
  useEffect(() => {
    if (!isInitialized) return;
    
    // For non-admin, need currentUserId
    if (role !== 'admin' && !currentUserId) return;

    if (filterDebounceRef.current) {
      clearTimeout(filterDebounceRef.current);
    }

    filterDebounceRef.current = setTimeout(() => {
      fetchSales(1);
      setStats(null);
    }, 500);

    return () => {
      if (filterDebounceRef.current) {
        clearTimeout(filterDebounceRef.current);
      }
    };
  }, [filters.periode, filters.date_from, filters.date_to, fetchSales, isInitialized, currentUserId, role, selectedUserId]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserFilterChange = (e) => {
    const userId = e.target.value;
    setSelectedUserId(userId === "" ? null : parseInt(userId));
    // Reset to first page when changing user filter
    fetchSales(1);
  };

  const clearFilters = () => {
    setFilters({
      periode: "",
      date_from: null,
      date_to: null,
      user: null,
    });
    setSelectedUserId(null);
    setSearchTerm("");
    setStats(null);
    fetchSales(1);
  };

  const handleDelete = (id) => {
    setSelectedId(id);
    setOpenConfirmationDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const sale = sales.find((s) => s.id === selectedId);
      const magasinId = sale?.magasin?.id;
      const url = magasinId
        ? `/vente/ventes-facilite/${selectedId}/?magasin_id=${magasinId}`
        : `/vente/ventes-facilite/${selectedId}/`;

      await axios.delete(url, { headers, timeout: 15000 });
      toast.success("تم حذف عملية البيع بنجاح");
      fetchSales(pagination.currentPage, true);
      setStats(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "فشل حذف عملية البيع");
    } finally {
      setOpenConfirmationDialog(false);
      setSelectedId(null);
    }
  };

  const handleViewDetails = async (sale) => {
    try {
      const response = await axios.get(`/vente/ventes-facilite/${sale.id}/`, {
        headers,
        timeout: 15000,
      });
      
      setSelectedSale(response.data);
      setOpenDetailDialog(true);
    } catch (error) {
      console.error("Erreur lors du chargement du détail:", error);
      toast.error("فشل تحميل تفاصيل البيع");
    }
  };

  const downloadFile = async (url, filename) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(url, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });
      saveAs(response.data, filename);
      toast.success("تم تحميل الملف بنجاح");
    } catch (error) {
      console.error("Erreur lors du téléchargement :", error);
      toast.error("فشل تحميل الملف");
    }
  };

  const handlePrint = async (sale) => {
    setLoadingPrintDetails(true);
    setOpenPrintDialog(true);
    
    try {
      const response = await axios.get(`/vente/ventes-facilite/${sale.id}/`, {
        headers,
        timeout: 15000,
      });
      
      setPrintSaleDetails(response.data);
    } catch (error) {
      console.error("Error fetching sale details for print:", error);
      toast.error("فشل تحميل تفاصيل البيع للطباعة");
      setPrintSaleDetails(sale);
    } finally {
      setLoadingPrintDetails(false);
    }
  };

  const handleAddSale = () => {
    navigate("/New/Facilitevente");
  };

  const handleManualRefresh = () => {
    fetchSales(pagination.currentPage, true);
    setStats(null);
    toast.info("جاري تحديث البيانات...");
  };

  const handleToggleStats = () => {
    if (!showStats) {
      fetchStats();
    }
    setShowStats(!showStats);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchSales(newPage);
    }
  };

  const formatMoney = (num) => {
    if (num === undefined || num === null) return "0";
    return Number(num);
  };

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-red-400" />
              <div className="text-xs text-red-300">
                {role === 'admin' && selectedUserId ? 'مبيعات المستخدم:' : role === 'admin' ? 'إجمالي المبيعات:' : 'مبيعاتي:'}
              </div>
              <div className="text-lg text-white">{totaux.total_ventes}</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-500/20 to-green-600/20 border border-emerald-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <div className="text-xs text-emerald-300">المبلغ الإجمالي:</div>
              <div className="text-lg text-white">
                {formatMoney(totaux.total_montant_total)} دج
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border border-amber-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="text-xs text-amber-300">المدفوع:</div>
              <div className="text-lg text-amber-400">
                {formatMoney(totaux.total_montant_verse)} دج
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-red-500/20 to-rose-600/20 border border-red-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="text-xs text-red-300">المتبقي:</div>
              <div className="text-lg text-red-400">
                {formatMoney(totaux.total_montant_restant)} دج
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleStats}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              showStats
                ? "bg-purple-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
            title="إحصائيات الأرباح"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">الأرباح</span>
          </motion.button>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleManualRefresh}
            disabled={refreshing}
            className={`flex items-center gap-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-slate-500/50 transition-all text-sm ${
              refreshing ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="تحديث البيانات"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>{refreshing ? "جاري التحديث..." : "تحديث"}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddSale}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-red-500/50 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>عملية بيع بالتقسيط</span>
          </motion.button>
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-lg p-4"
        >
          {loadingStats ? (
            <div className="flex justify-center items-center py-4">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="mr-2 text-purple-400">
                جاري تحميل الإحصائيات...
              </span>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-slate-400">
                  تكلفة الشراء الإجمالية
                </div>
                <div className="text-lg font-bold text-cyan-400">
                  {formatMoney(stats.cout_achat_total)} دج
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-400">إجمالي الأرباح</div>
                <div className="text-lg font-bold text-emerald-400">
                  {formatMoney(stats.benefice_total)} دج
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-400">نسبة الأرباح</div>
                <div className="text-lg font-bold text-amber-400">
                  {stats.pourcentage_benefice_total}%
                </div>
              </div>
              {stats.quantite_vendue_produit > 0 && (
                <div className="text-center col-span-2 md:col-span-1">
                  <div className="text-sm text-slate-400">المنتج المحدد</div>
                  <div className="text-sm text-purple-400">
                    الكمية: {stats.quantite_vendue_produit} | القيمة:{" "}
                    {formatMoney(stats.montant_total_produit)} دج
                  </div>
                  <div className="text-sm text-emerald-400">
                    الربح: {formatMoney(stats.benefice_produit)} دج (
                    {stats.pourcentage_benefice_produit}%)
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-2">
              لا توجد إحصائيات متاحة
            </div>
          )}
        </motion.div>
      )}

      {/* Search and Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
          <input
            type="text"
            placeholder="البحث عن زبون..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500 placeholder-slate-400"
          />
        </div>
        
        {/* User Filter for Admin */}
        {role === 'admin' && (
          <div className="relative min-w-[200px]">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4 z-10" />
            <select
              value={selectedUserId || ""}
              onChange={handleUserFilterChange}
              className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500"
            >
              <option value="">جميع المستخدمين</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="relative">
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4 z-10" />
          <input
            type="date"
            value={filters.date_from || ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, date_from: e.target.value }))
            }
            className="bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500"
            placeholder="من تاريخ"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4 z-10" />
          <input
            type="date"
            value={filters.date_to || ""}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, date_to: e.target.value }))
            }
            className="bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500"
            placeholder="إلى تاريخ"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            showFilters || filters.periode
              ? "bg-amber-500 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>فلترة</span>
        </motion.button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/50 rounded-lg p-4 border border-amber-500/30"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                الفترة
              </label>
              <select
                name="periode"
                value={filters.periode}
                onChange={handleFilterChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                {periodeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                الفترة المحددة
              </label>
              <p className="text-white text-sm py-2">من تاريخ إلى تاريخ</p>
            </div>
          </div>
          {(filters.periode || filters.date_from || filters.date_to || selectedUserId) && (
            <div className="flex justify-end mt-4">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
              >
                <X className="w-4 h-4" />
                <span>مسح الفلتر</span>
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Sales Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-3">
          <h2 className="text-white text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {role === 'admin' && selectedUserId 
              ? `مبيعات المستخدم ${users.find(u => u.id === selectedUserId)?.username || ''}` 
              : role === 'admin' 
                ? 'مبيعات التقسيط (جميع المستخدمين)' 
                : 'مبيعاتي بالتقسيط'}
          </h2>
          <p className="text-sm text-white/70 mt-1">
            {role === 'admin' && selectedUserId
              ? `عرض مبيعات المستخدم المحدد`
              : role === 'admin' 
                ? 'عرض جميع عمليات البيع بالتقسيط من جميع المستخدمين' 
                : 'عرض المبيعات التي قمت بإجرائها'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">
            <p>{error}</p>
            <button
              onClick={() => fetchSales(pagination.currentPage, true)}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-slate-500" />
            <p>لا توجد مبيعات بالتقسيط {role === 'admin' ? '' : 'قمت بإجرائها'}</p>
            {searchTerm && (
              <p className="text-sm mt-2">نتيجة بحث: "{searchTerm}"</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                  <th className="px-4 py-3 text-right">#</th>
                  <th className="px-4 py-3 text-right">التاريخ</th>
                  <th className="px-4 py-3 text-right">الزبون</th>
                  {role === 'admin' && (
                    <th className="px-4 py-3 text-right">المستخدم</th>
                  )}
                  <th className="px-4 py-3 text-right">المبلغ الإجمالي</th>
                  <th className="px-4 py-3 text-right">عدد الأشهر</th>
                  <th className="px-4 py-3 text-right">المبلغ الشهري</th>
                  <th className="px-4 py-3 text-right">المخزن</th>
                  <th className="px-4 py-3 text-right">الإجراءات</th>
                 </tr>
              </thead>
              <tbody>
                {sales.map((sale, index) => (
                  <motion.tr
                    key={sale.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(index * 0.05, 0.5) }}
                    whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                    className={`border-b border-slate-700/50 transition-all cursor-pointer ${
                      index % 2 === 0 ? "bg-slate-800/30" : "bg-slate-900/30"
                    }`}
                    onDoubleClick={() => handleViewDetails(sale)}
                  >
                    <td className="px-4 py-3 text-red-300">{sale.id}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {sale.date_formatee ||
                        new Date(sale.date_creation).toLocaleDateString(
                          "ar-DZ",
                        )}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {sale.client_name || "غير معروف"}
                    </td>
                    {role === 'admin' && (
                      <td className="px-4 py-3 text-cyan-300">
                        {sale.utilisateur_name || "-"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-emerald-300 font-medium">
                      {formatMoney(sale.montant_total)} دج
                    </td>
                    <td className="px-4 py-3 text-blue-300">
                      {sale.nombre_mois} أشهر
                    </td>
                    <td className="px-4 py-3 text-amber-300">
                      {formatMoney(sale.montant_mensuel)} دج
                    </td>
                    <td className="px-4 py-3 text-cyan-300">
                      {sale.magasin_name || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleViewDetails(sale)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handlePrint(sale)}
                          className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-400"
                          title="طباعة"
                        >
                          <Printer className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(sale.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        {sales.length > 0 && !loading && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-t border-slate-700">
            <div className="flex justify-between items-center text-sm flex-wrap gap-2">
              <div className="text-slate-400">
                عرض {sales.length} من {totaux.total_ventes} عملية بيع
              </div>
              <div className="flex gap-4 flex-wrap">
                <div className="text-emerald-400">
                  الإجمالي:{" "}
                  <span className="font-bold">
                    {formatMoney(totaux.total_montant_total)} دج
                  </span>
                </div>
                <div className="text-amber-400">
                  المدفوع:{" "}
                  <span className="font-bold">
                    {formatMoney(totaux.total_montant_verse)} دج
                  </span>
                </div>
                <div className="text-red-400">
                  المتبقي:{" "}
                  <span className="font-bold">
                    {formatMoney(totaux.total_montant_restant)} دج
                  </span>
                </div>
              </div>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-3">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition"
                >
                  السابق
                </button>
                <span className="px-3 py-1 bg-red-500/20 rounded-lg">
                  صفحة {pagination.currentPage} من {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition"
                >
                  التالي
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      {openDetailDialog && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 rounded-xl w-[900px] max-h-[90vh] overflow-hidden shadow-2xl border border-red-500/30"
          >
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-white" />
                <h2 className="text-white text-xl font-bold">
                  تفاصيل عملية البيع #{selectedSale.id}
                </h2>
              </div>
              <button
                onClick={() => setOpenDetailDialog(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-130px)] p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                  <User className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <div className="text-sm text-slate-400">الزبون</div>
                  <div className="text-white font-semibold mt-1">
                    {selectedSale.client_detail
                      ? `${selectedSale.client_detail.nom_famille_ar || ""} ${selectedSale.client_detail.prenom_ar || ""}`
                      : "غير معروف"}
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                  <Calendar className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <div className="text-sm text-slate-400">التاريخ</div>
                  <div className="text-white font-semibold mt-1">
                    {selectedSale.date_formatee ||
                      new Date(selectedSale.date_creation).toLocaleDateString(
                        "ar-DZ",
                      )}
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                  <DollarSign className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <div className="text-sm text-slate-400">المبلغ الإجمالي</div>
                  <div className="text-xl font-bold text-emerald-400">
                    {formatMoney(selectedSale.montant_total)} دج
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                  <CreditCard className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <div className="text-sm text-slate-400">المبلغ الشهري</div>
                  <div className="text-lg font-bold text-amber-400">
                    {formatMoney(selectedSale.montant_mensuel)} دج
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3">
                  <h3 className="text-white flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    المنتجات المباعة
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-700/50 text-slate-300">
                        <th className="px-4 py-2 text-right">#</th>
                        <th className="px-4 py-2 text-right">المنتج</th>
                        <th className="px-4 py-2 text-right">المرجع</th>
                        <th className="px-4 py-2 text-right">الكمية</th>
                        <th className="px-4 py-2 text-right">السعر</th>
                        <th className="px-4 py-2 text-right">المجموع</th>
                        <th className="px-4 py-2 text-right">المخزن</th>
                        <th className="px-4 py-2 text-right">الباركود</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSale.lignes_detail &&
                      selectedSale.lignes_detail.length > 0 ? (
                        selectedSale.lignes_detail.map((ligne, index) => (
                          <tr
                            key={ligne.id || index}
                            className="border-b border-slate-700"
                          >
                            <td className="px-4 py-2 text-red-300">
                              {index + 1}
                            </td>
                            <td className="px-4 py-2 text-white">
                              {ligne.produit_detail?.nom || "غير معروف"}
                            </td>
                            <td className="px-4 py-2 text-slate-300 font-mono text-xs">
                              {ligne.produit_detail?.reference || "-"}
                            </td>
                            <td className="px-4 py-2 text-blue-300">
                              {ligne.quantite}
                            </td>
                            <td className="px-4 py-2 text-amber-300">
                              {formatMoney(ligne.prix_unitaire)} دج
                            </td>
                            <td className="px-4 py-2 text-emerald-300 font-medium">
                              {formatMoney(ligne.sous_total)} دج
                            </td>
                            <td className="px-4 py-2 text-purple-300">
                              {selectedSale.magasin?.nom || "-"}
                            </td>
                            <td className="px-4 py-2 text-slate-400 text-xs break-all">
                              {ligne.codes_barres_utilises || "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="8"
                            className="px-4 py-8 text-center text-slate-400"
                          >
                            لا توجد تفاصيل
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700 px-6 py-4 flex justify-end">
              <button
                onClick={() => setOpenDetailDialog(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Print Dialog with CCP Buttons */}
      {openPrintDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 rounded-xl w-[450px] overflow-hidden shadow-2xl border border-red-500/30"
          >
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-white text-xl font-bold">طباعة المستندات</h2>
              <button
                onClick={() => {
                  setOpenPrintDialog(false);
                  setPrintSaleDetails(null);
                }}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {loadingPrintDetails ? (
                <div className="flex justify-center items-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="mr-2 text-purple-400">جاري تحميل البيانات...</span>
                </div>
              ) : printSaleDetails ? (
                <>
                  <button
                    onClick={() => {
                      downloadFile(
                        `/vente/ventes-facilite/${printSaleDetails.id}/acte/word/`,
                        `Acte_${printSaleDetails.id}.docx`,
                      );
                      setOpenPrintDialog(false);
                    }}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> عقد البيع بالتقسيط
                  </button>

                  <button
                    onClick={() => {
                      downloadFile(
                        `/vente/ventes-facilite/${printSaleDetails.id}/bon/word/`,
                        `Bon_${printSaleDetails.id}.docx`,
                      );
                      setOpenPrintDialog(false);
                    }}
                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-3 rounded-lg hover:from-emerald-600 hover:to-green-700 transition flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> وصل البيع
                  </button>

                  <button
                    onClick={() => {
                      downloadFile(
                        `/vente/ventes-facilite/${printSaleDetails.id}/depot/word/`,
                        `Depot_${printSaleDetails.id}.docx`,
                      );
                      setOpenPrintDialog(false);
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-3 rounded-lg hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2"
                  >
                    <Building2 className="w-4 h-4" /> وصل المخزن
                  </button>

                  {printSaleDetails.montants_par_mois && printSaleDetails.montants_par_mois.length > 0 ? (
                    <>
                      <div className="border-t border-slate-700 my-2 pt-2">
                        <p className="text-slate-400 text-sm text-center mb-2">وصلات CCP</p>
                      </div>
                      {printSaleDetails.montants_par_mois.map((montant, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            downloadFile(
                              `/vente/ventes-facilite/${printSaleDetails.id}/ccp/word/?prelevement=${montant}`,
                              `CCP_${index + 1}.docx`,
                            );
                            setOpenPrintDialog(false);
                          }}
                          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" /> وصل CCP - الشهر {index + 1} ({formatMoney(montant)} دج)
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-center">
                      <p className="text-yellow-400 text-sm">
                        لا توجد مبالغ شهرية متاحة لوصلات CCP
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        تأكد من أن عملية البيع تحتوي على مبلغ شهري محدد
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-red-400">
                  <p>فشل تحميل تفاصيل البيع</p>
                </div>
              )}

              <button
                onClick={() => {
                  setOpenPrintDialog(false);
                  setPrintSaleDetails(null);
                }}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg hover:bg-slate-600 transition"
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmationDialog
        open={openConfirmationDialog}
        onClose={() => setOpenConfirmationDialog(false)}
        onConfirm={confirmDelete}
        text="هل أنت متأكد من حذف عملية البيع هذه؟"
      />
    </div>
  );
}