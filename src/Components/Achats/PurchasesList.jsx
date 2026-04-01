import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, Eye, Trash2, DollarSign, Calendar, Filter, X, Plus, Edit, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from '../../api/axiosInstance';
import ConfirmationDialog from '../Cards/ConfirmationDialog';
import PurchaseDetailDialog from './PurchasesDetailDialog';


export function PurchasesList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [totaux, setTotaux] = useState({
    nombre_achats: 0,
    somme_totale: 0,
    somme_payee: 0,
    somme_restante: 0,
  });
  const [pagination, setPagination] = useState({
    next: null,
    previous: null,
    currentPage: 1,
    totalPages: 1,
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    periode: '',
    fournisseur: '',
    date_from: null,
    date_to: null,
  });
  
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  };

  // Add cache busting parameter to requests
  const addCacheBuster = (params = {}) => {
    return {
      ...params,
      _t: Date.now(),
    };
  };

  // Fetch suppliers for filter
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get("/auth/fournisseurs/", { 
          headers,
          params: addCacheBuster()
        });
        setSuppliers(response.data.results || []);
      } catch (error) {
        console.error("Erreur lors du chargement des fournisseurs:", error);
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch purchases with filters
  const fetchPurchases = useCallback(async (page = 1, forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    }
    setLoading(true);
    
    const params = addCacheBuster({
      page: page,
      page_size: 20,
    });
    
    if (searchTerm) params.search = searchTerm;
    if (filters.periode) params.periode = filters.periode;
    if (filters.fournisseur) params.fournisseur = filters.fournisseur;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;

    try {
      const response = await axios.get(`/achat/par-group/`, { headers, params });
      const data = response.data;
      
      console.log('API Response Structure:', data); // Debug log
      
      // Handle different response structures
      let purchasesArray = [];
      let totalCount = 0;
      let totals = {
        nombre_achats: 0,
        somme_totale: 0,
        somme_payee: 0,
        somme_restante: 0,
      };
      
      // Case 1: Response has results.achats_groupes (nested structure)
      if (data && data.results && data.results.achats_groupes) {
        purchasesArray = data.results.achats_groupes || [];
        totalCount = data.results.nombre_achats || 0;
        totals = {
          nombre_achats: data.results.nombre_achats || 0,
          somme_totale: data.results.somme_totale || 0,
          somme_payee: data.results.somme_payee || 0,
          somme_restante: data.results.somme_restante || 0,
        };
      }
      // Case 2: Response has results array directly
      else if (data && data.results && Array.isArray(data.results)) {
        purchasesArray = data.results;
        totalCount = data.count || 0;
      }
      // Case 3: Response is direct array
      else if (Array.isArray(data)) {
        purchasesArray = data;
        totalCount = data.length;
      }
      // Case 4: Response has achats_groupes directly
      else if (data && data.achats_groupes) {
        purchasesArray = data.achats_groupes;
        totalCount = data.nombre_achats || 0;
        totals = {
          nombre_achats: data.nombre_achats || 0,
          somme_totale: data.somme_totale || 0,
          somme_payee: data.somme_payee || 0,
          somme_restante: data.somme_restante || 0,
        };
      }
      
      setPurchases(purchasesArray);
      setTotaux({
        nombre_achats: totals.nombre_achats || totalCount,
        somme_totale: totals.somme_totale || 0,
        somme_payee: totals.somme_payee || 0,
        somme_restante: totals.somme_restante || 0,
      });
      
      setPagination({
        next: data.next || null,
        previous: data.previous || null,
        currentPage: page,
        totalPages: Math.ceil((totalCount || 0) / 20),
      });
      
    } catch (err) {
      console.error("Erreur lors du chargement des achats :", err);
      toast.error("خطأ في تحميل عمليات الشراء");
      setPurchases([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, filters]);

  // Initial load
  useEffect(() => {
    fetchPurchases(1);
  }, []);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPurchases(1);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, filters, fetchPurchases]);

  // Listen for navigation state changes (when returning from edit/add)
  useEffect(() => {
    if (location.state?.refreshData) {
      console.log('Refreshing data after return from purchase view');
      // Force refresh with cache busting
      fetchPurchases(pagination.currentPage, true);
      // Clear the state to prevent repeated refreshes
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, fetchPurchases, pagination.currentPage, navigate]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      periode: '',
      fournisseur: '',
      date_from: null,
      date_to: null,
    });
    setSearchTerm('');
  };

  const handleDelete = (id) => {
    setSelectedId(id);
    setOpenConfirmationDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/achat/par-group/${selectedId}/`, { headers });
      toast.success("تم حذف عملية الشراء بنجاح");
      // Force refresh with cache busting
      await fetchPurchases(pagination.currentPage, true);
    } catch (err) {
      console.error(err);
      toast.error("فشل حذف عملية الشراء");
    } finally {
      setOpenConfirmationDialog(false);
      setSelectedId(null);
    }
  };

  const handleViewDetails = (purchase) => {
    setSelectedPurchase(purchase);
    setOpenDetailDialog(true);
  };

  const handleEdit = (purchase) => {
    navigate('/New/addachat', { 
      state: { 
        isEditMode: true, 
        initialData: purchase,
        returnTo: location.pathname,
        refreshOnReturn: true
      } 
    });
  };

  const handleAddNew = () => {
    navigate('/New/addachat', { 
      state: { 
        isEditMode: false,
        returnTo: location.pathname,
        refreshOnReturn: true
      } 
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchPurchases(newPage);
    }
  };

  const handleManualRefresh = () => {
    fetchPurchases(pagination.currentPage, true);
    toast.info("جاري تحديث البيانات...");
  };

  const totalAmount = parseFloat(totaux.somme_totale) || 0;
  const totalPaid = parseFloat(totaux.somme_payee) || 0;
  const totalRemaining = parseFloat(totaux.somme_restante) || 0;

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

  // Supplier options for filter
  const supplierOptions = [
    { value: "", label: "الكل" },
    ...suppliers.map(s => ({ value: s.id, label: s.nom }))
  ];

  return (
    <div className="space-y-4">
      {/* Header with Stats and Refresh Button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-cyan-400" />
              <div className="text-xs text-cyan-300">عمليات الشراء:</div>
              <div className="text-lg text-white">{totaux.nombre_achats}</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-500/20 to-green-600/20 border border-emerald-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <div className="text-xs text-emerald-300">المبلغ الإجمالي:</div>
              <div className="text-lg text-white">{totalAmount.toFixed(2)} دج</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border border-amber-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="text-xs text-amber-300">المدفوع:</div>
              <div className="text-lg text-amber-400">{totalPaid.toFixed(2)} دج</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-red-500/20 to-rose-600/20 border border-red-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="text-xs text-red-300">المتبقي:</div>
              <div className="text-lg text-red-400">{totalRemaining.toFixed(2)} دج</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleManualRefresh}
            disabled={refreshing}
            className={`flex items-center gap-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-slate-500/50 transition-all text-sm ${
              refreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'جاري التحديث...' : 'تحديث'}</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-cyan-500/50 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>عملية شراء جديدة</span>
          </motion.button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
          <input
            type="text"
            placeholder="البحث عن عملية شراء..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500 placeholder-slate-400"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            showFilters || filters.fournisseur || filters.periode || filters.date_from || filters.date_to
              ? 'bg-amber-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <label className="block text-sm text-slate-400 mb-1">المورد</label>
              <select
                name="fournisseur"
                value={filters.fournisseur}
                onChange={handleFilterChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                {supplierOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">من تاريخ</label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="date"
                  name="date_from"
                  value={filters.date_from || ''}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">إلى تاريخ</label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="date"
                  name="date_to"
                  value={filters.date_to || ''}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
          {(filters.fournisseur || filters.periode || filters.date_from || filters.date_to) && (
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

      {/* Purchases Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3">
          <h2 className="text-white text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            قائمة عمليات الشراء ({purchases.length})
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white">
                  <th className="px-4 py-3 text-right">#</th>
                  <th className="px-4 py-3 text-right">التاريخ</th>
                  <th className="px-4 py-3 text-right">المورد</th>
                  <th className="px-4 py-3 text-right">المبلغ الإجمالي</th>
                  <th className="px-4 py-3 text-right">المدفوع</th>
                  <th className="px-4 py-3 text-right">المتبقي</th>
                  <th className="px-4 py-3 text-right">المستخدم</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {purchases && purchases.length > 0 ? (
                  purchases.map((purchase, index) => {
                    const total = parseFloat(purchase.total) || 0;
                    const paid = parseFloat(purchase.somme_payee) || 0;
                    const remaining = parseFloat(purchase.somme_restante) || 0;
                    const status = remaining === 0 ? 'مدفوع بالكامل' : remaining > 0 ? 'مدفوع جزئياً' : 'غير مدفوع';
                    const statusColor = 
                      status === 'مدفوع بالكامل' ? 'bg-emerald-500/20 text-emerald-400' :
                      status === 'مدفوع جزئياً' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400';
                    
                    return (
                      <motion.tr
                        key={purchase.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
                        className={`border-b border-slate-700/50 transition-all cursor-pointer ${
                          index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'
                        }`}
                        onClick={() => handleViewDetails(purchase)}
                      >
                        <td className="px-4 py-3 text-cyan-300">{purchase.id}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {purchase.date_formatee || new Date(purchase.date).toLocaleDateString('ar-DZ')}
                        </td>
                        <td className="px-4 py-3 text-white font-medium">
                          {purchase.fournisseur_detail?.nom || purchase.fournisseur_nom || 'غير معروف'}
                        </td>
                        <td className="px-4 py-3 text-emerald-300 font-medium">{total.toFixed(2)} دج</td>
                        <td className="px-4 py-3 text-amber-300">{paid.toFixed(2)} دج</td>
                        <td className="px-4 py-3 text-red-300">{remaining.toFixed(2)} دج</td>
                        <td className="px-4 py-3 text-purple-300">
                          {purchase.utilisateur_detail?.username || purchase.utilisateur_username || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEdit(purchase)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleViewDetails(purchase)}
                              className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg text-cyan-400"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(purchase.id)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-slate-400">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                      لا توجد عمليات شراء
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        {purchases && purchases.length > 0 && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-t border-slate-700">
            <div className="flex justify-between items-center text-sm flex-wrap gap-2">
              <div className="text-slate-400">
                عرض {purchases.length} من {totaux.nombre_achats} عملية شراء
              </div>
              <div className="flex gap-4 flex-wrap">
                <div className="text-emerald-400">
                  الإجمالي: <span className="font-bold">{totalAmount.toFixed(2)} دج</span>
                </div>
                <div className="text-amber-400">
                  المدفوع: <span className="font-bold">{totalPaid.toFixed(2)} دج</span>
                </div>
                <div className="text-red-400">
                  المتبقي: <span className="font-bold">{totalRemaining.toFixed(2)} دج</span>
                </div>
              </div>
            </div>
            
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-3">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.previous}
                  className="px-3 py-1 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition"
                >
                  السابق
                </button>
                <span className="px-3 py-1 bg-cyan-500/20 rounded-lg">
                  صفحة {pagination.currentPage} من {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.next}
                  className="px-3 py-1 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition"
                >
                  التالي
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <PurchaseDetailDialog
        open={openDetailDialog}
        onClose={() => {
          setOpenDetailDialog(false);
          setSelectedPurchase(null);
        }}
        purchase={selectedPurchase}
      />

      <ConfirmationDialog
        open={openConfirmationDialog}
        onClose={() => setOpenConfirmationDialog(false)}
        onConfirm={confirmDelete}
        text="هل أنت متأكد من حذف عملية الشراء هذه؟"
      />
    </div>
  );
}