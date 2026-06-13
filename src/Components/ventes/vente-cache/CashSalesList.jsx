import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Search, Eye, Trash2, Printer, Filter, X, 
  Calendar, User, DollarSign, Plus, RefreshCw, BarChart3,
  Building2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from '../../../api/axiosInstance';
import ConfirmationDialog from '../../Cards/ConfirmationDialog';

export function CashSalesList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
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
  const [magasins, setMagasins] = useState([]);
  const [selectedMagasinId, setSelectedMagasinId] = useState(null);
  const [totaux, setTotaux] = useState({
    total_montant: 0,
    nombre_de_ventes: 0,
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    periode: '',
    date_from: null,
    date_to: null,
  });
  
  const initialLoadDone = useRef(false);
  const abortControllerRef = useRef(null);
  const usersFetched = useRef(false);
  const magasinsFetched = useRef(false);
  const searchDebounceRef = useRef(null);
  const filterDebounceRef = useRef(null);
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);
  const userIdRef = useRef(null);
  
  const role = localStorage.getItem("role");
  const currentUsername = localStorage.getItem("username");
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  };

  // Period options
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
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    };
  }, []);

  // Fetch current user ID
  const fetchCurrentUserId = useCallback(async () => {
    let userId = localStorage.getItem("user_id");
    if (userId) {
      userIdRef.current = userId;
      setCurrentUserId(userId);
      return userId;
    }
    
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

  // Fetch users for filter
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
          setUsers(response.data.results || response.data || []);
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

  // Fetch magasins for filter (admin only)
  useEffect(() => {
    if (magasinsFetched.current) return;
    if (role !== "admin") return;
    magasinsFetched.current = true;

    const fetchMagasins = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get("/param/magasins/", {
          headers: { Authorization: `Bearer ${token}` },
          params: { page_size: 100 },
          timeout: 10000,
        });
        if (isMounted.current) {
          setMagasins(response.data.results || []);
        }
      } catch (error) {
        console.error("Error fetching magasins:", error);
      }
    };
    fetchMagasins();
  }, [role]);

  // Fetch sales with filters
  const fetchSales = useCallback(async (forceRefresh = false) => {
    if (role !== 'admin') {
      const userId = currentUserId || userIdRef.current;
      if (!userId) {
        setLoading(false);
        return;
      }
    }

    if (fetchInProgress.current && !forceRefresh) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();

    const newAbortController = new AbortController();
    abortControllerRef.current = newAbortController;
    fetchInProgress.current = true;

    if (forceRefresh) setRefreshing(true);
    setLoading(true);

    const params = {};
    
    // User filter
    if (role === 'admin') {
      if (selectedUserId) {
        params.users = selectedUserId;
      }
    } else {
      const userId = currentUserId || userIdRef.current;
      if (userId) {
        params.users = userId;
      }
    }
    
    // Magasin filter (admin only via dropdown)
    if (role === 'admin' && selectedMagasinId) {
      params.magasin = selectedMagasinId;
    }
    
    if (searchTerm.trim()) params.search = searchTerm;
    if (filters.periode) params.periode = filters.periode;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;

    console.log("📡 Cash API PARAMS:", params);

    try {
      const response = await axios.get(`/vente/liste/`, {
        headers,
        params,
        signal: newAbortController.signal,
        timeout: 30000,
      });
      
      if (!isMounted.current) return;
      
      const sortedSales = (response.data.ventes || []).sort((a, b) => {
        const dateA = new Date(a.date_vente || a.date_formatee);
        const dateB = new Date(b.date_vente || b.date_formatee);
        return dateB - dateA;
      });
      
      setSales(sortedSales);
      setTotaux({
        total_montant: response.data.total_montant || 0,
        nombre_de_ventes: response.data.nombre_de_ventes || 0,
      });
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
      if (!isMounted.current) return;
      console.error("Erreur lors du chargement des ventes :", err);
      toast.error("خطأ في تحميل المبيعات");
    } finally {
      if (isMounted.current && abortControllerRef.current === newAbortController) {
        setLoading(false);
        setRefreshing(false);
        fetchInProgress.current = false;
      }
    }
  }, [searchTerm, filters, role, currentUserId, selectedUserId, selectedMagasinId]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      if (initialLoadDone.current) return;
      
      if (role !== 'admin') {
        const userId = await fetchCurrentUserId();
        if (userId) {
          setCurrentUserId(userId);
          userIdRef.current = userId;
          setIsInitialized(true);
          setTimeout(() => { if (isMounted.current) fetchSales(); }, 100);
        } else {
          setLoading(false);
        }
      } else {
        setIsInitialized(true);
        setTimeout(() => { if (isMounted.current) fetchSales(); }, 100);
      }
      initialLoadDone.current = true;
    };
    
    init();
  }, [fetchCurrentUserId, role]);

  // Dedicated effect for selectedUserId changes
  useEffect(() => {
    if (!isInitialized) return;
    if (role !== 'admin' && !currentUserId) return;
    fetchSales();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  // Dedicated effect for selectedMagasinId changes
  useEffect(() => {
    if (!isInitialized) return;
    fetchSales();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMagasinId]);

  // Debounced search
  useEffect(() => {
    if (!isInitialized) return;
    if (role !== 'admin' && !currentUserId) return;

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchSales();
    }, 500);

    return () => clearTimeout(searchDebounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, isInitialized, currentUserId, role]);

  // Debounced filters
  useEffect(() => {
    if (!isInitialized) return;
    if (role !== 'admin' && !currentUserId) return;

    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    filterDebounceRef.current = setTimeout(() => {
      fetchSales();
    }, 500);

    return () => clearTimeout(filterDebounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.periode, filters.date_from, filters.date_to, isInitialized, currentUserId, role]);

  // Download file
  const downloadFile = async (url, filename) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      const token = localStorage.getItem("access_token");
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const response = await axios.get(url, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });
      
      clearInterval(progressInterval);
      setDownloadProgress(100);
      
      const blob = response.data;
      
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'Word Document',
              accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
            }]
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          toast.success("تم حفظ الملف بنجاح");
          setOpenPrintDialog(false);
          return;
        } catch (err) {
          if (err.name !== 'AbortError') console.error("File System Access API error:", err);
        }
      }
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("تم تحميل الملف بنجاح");
      setOpenPrintDialog(false);
      
    } catch (error) {
      console.error("Erreur lors du téléchargement :", error);
      toast.error("فشل تحميل الملف");
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(null);
      }, 500);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleUserFilterChange = (e) => {
    const userId = e.target.value;
    setSelectedUserId(userId === "" ? null : parseInt(userId));
  };

  const handleMagasinFilterChange = (e) => {
    const magasinId = e.target.value;
    setSelectedMagasinId(magasinId === "" ? null : parseInt(magasinId));
  };

  const clearFilters = () => {
    setFilters({ periode: '', date_from: null, date_to: null });
    setSelectedUserId(null);
    setSelectedMagasinId(null);
    setSearchTerm('');
  };

  const handleDelete = (id) => {
    setSelectedId(id);
    setOpenConfirmationDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/vente/ventes-cache/${selectedId}/`, { headers, timeout: 15000 });
      toast.success("تم حذف عملية البيع بنجاح");
      fetchSales(true);
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
      const response = await axios.get(`/vente/ventes-cache/${sale.id}/`, { headers, timeout: 15000 });
      setSelectedSale(response.data);
      setOpenDetailDialog(true);
    } catch (error) {
      console.error("Erreur lors du chargement du détail:", error);
      toast.error("فشل تحميل تفاصيل البيع");
    }
  };

  const handlePrint = (sale) => {
    setSelectedSale(sale);
    setOpenPrintDialog(true);
  };

  const handleAddSale = () => {
    navigate('/New/cashsales');
  };

  const handleManualRefresh = () => {
    fetchSales(true);
    toast.info("جاري تحديث البيانات...");
  };

  const totalSales = sales.length;
  const totalAmount = totaux.total_montant;

  const formatMoney = (num) => {
    if (num === undefined || num === null) return "0";
    return Number(num);
  };

  return (
    <div className="space-y-4">
      {/* Download Progress Overlay */}
      {isDownloading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl p-6 w-80 text-center border border-amber-500/30">
            <div className="w-16 h-16 mx-auto mb-4">
              <svg className="animate-spin w-16 h-16 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-white font-medium mb-2">جاري تحميل الملف...</p>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
              <div className="bg-amber-500 h-2 rounded-full transition-all duration-300" style={{ width: `${downloadProgress || 0}%` }} />
            </div>
            <p className="text-slate-400 text-sm mt-2">{downloadProgress || 0}%</p>
          </div>
        </div>
      )}

      {/* Header with Stats and Add Button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-gradient-to-r from-indigo-500/20 to-indigo-600/20 border border-indigo-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-indigo-400" />
              <div className="text-xs text-indigo-300">
                {role === 'admin' && selectedUserId ? 'مبيعات المستخدم:' : role === 'admin' ? 'إجمالي المبيعات:' : 'مبيعاتي:'}
              </div>
              <div className="text-lg text-white">{totaux.nombre_de_ventes}</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-500/20 to-green-600/20 border border-emerald-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <div className="text-xs text-emerald-300">المبلغ الإجمالي:</div>
              <div className="text-lg text-white">{formatMoney(totalAmount)} دج</div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleManualRefresh}
            disabled={refreshing}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              refreshing ? "bg-slate-700 text-slate-300 opacity-50 cursor-not-allowed" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="text-sm">{refreshing ? "جاري التحديث..." : "تحديث"}</span>
          </motion.button>
        </div>

        {/* Add Sale Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddSale}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>عملية بيع كاش</span>
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2 flex-wrap">
        {/* Search */}
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
          <div className="relative min-w-[180px]">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4 z-10" />
            <select
              value={selectedUserId || ""}
              onChange={handleUserFilterChange}
              className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500"
            >
              <option value="">جميع المستخدمين</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Magasin Filter for Admin */}
        {role === 'admin' && (
          <div className="relative min-w-[180px]">
            <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4 z-10" />
            <select
              value={selectedMagasinId || ""}
              onChange={handleMagasinFilterChange}
              className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500"
            >
              <option value="">جميع المخازن</option>
              {magasins.map((mag) => (
                <option key={mag.id} value={mag.id}>{mag.nom}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Date from */}
        <div className="relative">
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4 z-10" />
          <input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
            className="bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500"
          />
        </div>
        
        {/* Date to */}
        <div className="relative">
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4 z-10" />
          <input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
            className="bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500"
          />
        </div>
        
        {/* Filter toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            showFilters || filters.periode ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/50 rounded-lg p-4 border border-amber-500/30"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">الفترة</label>
              <select
                name="periode"
                value={filters.periode}
                onChange={handleFilterChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                {periodeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">الفترة المحددة</label>
              <p className="text-white text-sm py-2">من تاريخ إلى تاريخ</p>
            </div>
          </div>
          {(filters.periode || filters.date_from || filters.date_to || selectedUserId || selectedMagasinId) && (
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
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3">
          <h2 className="text-white text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            {role === 'admin' && selectedUserId 
              ? `مبيعات المستخدم ${users.find(u => u.id === selectedUserId)?.username || ''}` 
              : role === 'admin' 
                ? 'قائمة المبيعات كاش (جميع المستخدمين)' 
                : 'مبيعاتي كاش'}
            {role === 'admin' && selectedMagasinId && (
              <span className="text-sm font-normal opacity-80">
                — {magasins.find(m => m.id === selectedMagasinId)?.nom || ''}
              </span>
            )}
          </h2>
          <p className="text-sm text-white/70 mt-1">
            {role === 'admin' && selectedUserId
              ? `عرض مبيعات المستخدم المحدد`
              : role === 'admin' 
                ? 'عرض جميع عمليات البيع كاش من جميع المستخدمين' 
                : 'عرض المبيعات التي قمت بإجرائها'}
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                  <th className="px-4 py-3 text-right">#</th>
                  <th className="px-4 py-3 text-right">التاريخ</th>
                  <th className="px-4 py-3 text-right">الزبون</th>
                  <th className="px-4 py-3 text-right">المبلغ الإجمالي</th>
                  {role === 'admin' && (
                    <th className="px-4 py-3 text-right">البائع</th>
                  )}
                  <th className="px-4 py-3 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {sales.length > 0 ? (
                  sales.map((sale, index) => (
                    <motion.tr
                      key={sale.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5) }}
                      whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                      className={`border-b border-slate-700/50 transition-all cursor-pointer ${
                        index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'
                      }`}
                      onDoubleClick={() => handleViewDetails(sale)}
                    >
                      <td className="px-4 py-3 text-indigo-300">{sale.id}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {sale.date_formatee || new Date(sale.date_vente).toLocaleDateString('ar-DZ')}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">
                        {sale.client_detail
                          ? `${sale.client_detail.nom_famille_ar || ''} ${sale.client_detail.prenom_ar || ''}`.trim() || 'غير معروف'
                          : 'غير معروف'}
                      </td>
                      <td className="px-4 py-3 text-emerald-300 font-medium">
                        {formatMoney(sale.montant_total)} دج
                      </td>
                      {role === 'admin' && (
                        <td className="px-4 py-3 text-purple-300">
                          {sale.utilisateur_detail?.username || 'غير معروف'}
                        </td>
                      )}
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={role === 'admin' ? 6 : 5} className="px-4 py-8 text-center text-slate-400">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                      <p>لا توجد مبيعات {role === 'admin' ? '' : 'قمت بإجرائها'}</p>
                      {searchTerm && (
                        <p className="text-sm mt-2">نتيجة بحث: "{searchTerm}"</p>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        {sales.length > 0 && !loading && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-t border-slate-700">
            <div className="flex justify-between items-center text-sm flex-wrap gap-2">
              <div className="text-slate-400">
                عرض {sales.length} من {totaux.nombre_de_ventes} عملية بيع
              </div>
              <div className="text-emerald-400">
                الإجمالي: <span className="font-bold">{formatMoney(totalAmount)} دج</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      {openDetailDialog && selectedSale && (
        <DetailDialog
          sale={selectedSale}
          onClose={() => {
            setOpenDetailDialog(false);
            setSelectedSale(null);
          }}
        />
      )}

      {/* Print Dialog */}
      {openPrintDialog && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 rounded-xl w-[400px] overflow-hidden shadow-2xl border border-indigo-500/30"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-white text-xl font-bold">طباعة وصل البيع</h2>
              <button
                onClick={() => setOpenPrintDialog(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-slate-300 text-center mb-2">
                هل تريد طباعة وصل لعملية البيع رقم {selectedSale.id}؟
              </p>
              <button
                onClick={() => {
                  downloadFile(
                    `/vente/ventes-cache/${selectedSale.id}/bon/word/`,
                    `Bon_${selectedSale.id}.docx`
                  );
                }}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-3 rounded-lg hover:from-emerald-600 hover:to-green-700 transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> طباعة وصل البيع
              </button>
              <button
                onClick={() => setOpenPrintDialog(false)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg hover:bg-slate-600 transition"
              >
                إلغاء
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

// Detail Dialog Component
function DetailDialog({ sale, onClose }) {
  const lignes = sale.lignes_detail || [];
  const sortedLignes = [...lignes].sort((a, b) => (a.id || 0) - (b.id || 0));

  const formatMoney = (num) => {
    if (num === undefined || num === null) return "0";
    return Number(num);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 rounded-xl w-[900px] max-h-[90vh] overflow-hidden shadow-2xl border border-indigo-500/30"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-white" />
            <h2 className="text-white text-xl font-bold">
              تفاصيل عملية البيع #{sale.id}
            </h2>
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-700/30 rounded-lg p-4 text-center">
              <User className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <div className="text-sm text-slate-400">الزبون</div>
              <div className="text-white font-semibold mt-1">
                {sale.client_detail
                  ? `${sale.client_detail.nom_famille_ar || ''} ${sale.client_detail.prenom_ar || ''}`.trim() || 'غير معروف'
                  : 'غير معروف'}
              </div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4 text-center">
              <Calendar className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <div className="text-sm text-slate-400">التاريخ</div>
              <div className="text-white font-semibold mt-1">
                {sale.date_formatee || new Date(sale.date_vente).toLocaleDateString('ar-DZ')}
              </div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4 text-center">
              <DollarSign className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <div className="text-sm text-slate-400">المبلغ الإجمالي</div>
              <div className="text-2xl font-bold text-emerald-400">
                {formatMoney(sale.montant_total)} دج
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-slate-700/30 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3">
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
                  {sortedLignes.length > 0 ? (
                    sortedLignes.map((ligne, index) => (
                      <tr key={ligne.id || index} className="border-b border-slate-700">
                        <td className="px-4 py-2 text-indigo-300">{index + 1}</td>
                        <td className="px-4 py-2 text-white">{ligne.produit_nom || 'غير معروف'}</td>
                        <td className="px-4 py-2 text-slate-300 font-mono text-xs">{ligne.produit_reference || '-'}</td>
                        <td className="px-4 py-2 text-blue-300">{ligne.quantite}</td>
                        <td className="px-4 py-2 text-amber-300">{formatMoney(ligne.prix_unitaire)} دج</td>
                        <td className="px-4 py-2 text-emerald-300 font-medium">{formatMoney(ligne.sous_total)} دج</td>
                        <td className="px-4 py-2 text-purple-300">{ligne.magasin_detail?.nom || '-'}</td>
                        <td className="px-4 py-2 text-slate-400 text-xs break-all">
                          {ligne.codes_barres_utilises || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                        لا توجد تفاصيل
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
}