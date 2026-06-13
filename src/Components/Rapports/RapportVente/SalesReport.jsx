import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Calendar, 
  Filter, 
  X, 
  User, 
  Percent, 
  Award,
  Eye,
  Package,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import axios from '../../../api/axiosInstance';
import dayjs from 'dayjs';

const formatTelephones = (telephones) => {
  if (!Array.isArray(telephones)) return "--";

  const validTelephones = telephones.filter((phone) => phone && phone.trim() !== "");
  return validTelephones.length > 0 ? validTelephones.join(" / ") : "--";
};

export function Rapportvente() {
  const [filters, setFilters] = useState({
    periode: "this_month",
    date_from: null,
    date_to: null,
    users: "",
  });

  const [totaux, setTotaux] = useState({
    total_montant_total: 0,
    total_montant_verse: 0,
    total_montant: 0,
    total_ventes: 0,
    nombre_de_ventes: 0,
    total_montant_depense: 0,
    pourcentage_benefice_total: 0,
    benefice_total: 0,
  });

  const [users, setUsers] = useState([]);
  const [userPayments, setUserPayments] = useState([]);
  const [userCashPayments, setUserCashPayments] = useState([]);
  const [topProduits, setTopProduits] = useState([]);
  const [topProduitsCash, setTopProduitsCash] = useState([]);
  const [topClientsFacilite, setTopClientsFacilite] = useState([]);
  const [topClientsCash, setTopClientsCash] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);

  // Loading states
  const [loading, setLoading] = useState({
    totals: true,
    users: true,
    products: true,
    clients: true,
  });

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

  // Helper to build params
  const buildParams = (appliedFilters) => {
    let fromDate = appliedFilters.date_from;
    let toDate = appliedFilters.date_to;
    if (fromDate && toDate && dayjs(fromDate).isAfter(dayjs(toDate))) {
      [fromDate, toDate] = [toDate, fromDate];
    }

    const params = {};
    if (appliedFilters.periode) params.periode = appliedFilters.periode;
    if (appliedFilters.users) params.user = appliedFilters.users;
    if (fromDate) params.date_from = dayjs(fromDate).format("YYYY-MM-DD");
    if (toDate) params.date_to = dayjs(toDate).format("YYYY-MM-DD");
    
    return params;
  };

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("/auth/users/", { headers });
        setUsers(res.data.results || []);
      } catch (err) {
        console.error("Erreur lors du chargement des users", err);
      } finally {
        setLoading(prev => ({ ...prev, users: false }));
      }
    };
    fetchUsers();
  }, []);

  // Fetch all report data in one API call
  const fetchReportData = async () => {
    const params = buildParams(filters);
    setLoading(prev => ({ ...prev, totals: true, products: true, clients: true }));
    
    try {
      const response = await axios.get("/stats/sales-report/", { headers, params });
      const data = response.data;
      
      // Update totals
      setTotaux(data.totals);
      
      // Update user performance
      setUserPayments(data.user_installment_performance || []);
      setUserCashPayments(data.user_cash_performance || []);
      
      // Update top products
      setTopProduits(data.top_products_installment || []);
      setTopProduitsCash(data.top_products_cash || []);
      
      // Update top clients
      setTopClientsFacilite(data.top_clients_installment || []);
      setTopClientsCash(data.top_clients_cash || []);
      
    } catch (error) {
      console.error("Error loading report:", error);
      toast.error("خطأ في تحميل التقرير");
    } finally {
      setLoading(prev => ({ ...prev, totals: false, products: false, clients: false }));
    }
  };

  // Load all data when filters change
  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      periode: "this_month",
      users: "",
      date_from: null,
      date_to: null,
    });
  };

  const handleClientClick = async (clientId) => {
    setDialogType('client');
    setDialogOpen(true);
    setLoadingItem(true);
    try {
      const response = await axios.get(`/stats/client/${clientId}/`, { headers });
      setSelectedItem(response.data);
    } catch (err) {
      console.error("Error loading client:", err);
      toast.error("فشل تحميل بيانات العميل");
    } finally {
      setLoadingItem(false);
    }
  };

  const handleProductClick = async (productId) => {
    setDialogType('product');
    setDialogOpen(true);
    setLoadingItem(true);
    try {
      const response = await axios.get(`/stats/product/${productId}/`, { headers });
      setSelectedItem(response.data);
    } catch (err) {
      console.error("Error loading product:", err);
      toast.error("فشل تحميل بيانات المنتج");
    } finally {
      setLoadingItem(false);
    }
  };

  const userOptions = [
    { value: "", label: "الكل" },
    ...users.map(u => ({ value: u.id, label: u.username }))
  ];

  const formatMoney = (num) => {
    if (num === undefined || num === null) return "0";
    return Number(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl text-white">تقرير المبيعات</h1>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              showFilters || filters.periode !== "this_month" || filters.users || filters.date_from || filters.date_to
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>فلترة</span>
          </motion.button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
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
                <label className="block text-sm text-slate-400 mb-1">البائع</label>
                <select
                  name="users"
                  value={filters.users}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                >
                  {userOptions.map(option => (
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
                    value={filters.date_from || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
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
                    value={filters.date_to || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            {(filters.periode !== "this_month" || filters.users || filters.date_from || filters.date_to) && (
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
      </AnimatePresence>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <ShoppingCart className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">{formatMoney(totaux.total_ventes + totaux.nombre_de_ventes)}</span>
          </div>
          <p className="text-slate-400 mt-2">إجمالي المبيعات</p>
        </div>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <DollarSign className="w-8 h-8 text-emerald-400" />
            <span className="text-2xl font-bold text-white">{formatMoney(totaux.total_montant_total + totaux.total_montant)}</span>
          </div>
          <p className="text-slate-400 mt-2">إجمالي المبيعات (دج)</p>
        </div>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <Percent className="w-8 h-8 text-amber-400" />
            <span className="text-2xl font-bold text-white">{totaux.pourcentage_benefice_total}%</span>
          </div>
          <p className="text-slate-400 mt-2">نسبة الفائدة</p>
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(totaux.pourcentage_benefice_total, 100)}%` }} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <DollarSign className="w-8 h-8 text-red-400" />
            <span className="text-2xl font-bold text-white">{formatMoney(totaux.total_montant_depense)}</span>
          </div>
          <p className="text-slate-400 mt-2">إجمالي المصاريف (دج)</p>
        </div>
      </div>

      {/* Installment vs Cash Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">المبيعات بالتقسيط</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-slate-400 text-sm">عدد المبيعات</p><p className="text-white text-xl">{formatMoney(totaux.total_ventes)}</p></div>
            <div><p className="text-slate-400 text-sm">إجمالي المبلغ</p><p className="text-emerald-400 text-xl">{formatMoney(totaux.total_montant_total)} دج</p></div>
            <div><p className="text-slate-400 text-sm">المدفوع</p><p className="text-amber-400 text-xl">{formatMoney(totaux.total_montant_verse)} دج</p></div>
            <div><p className="text-slate-400 text-sm">الفائدة</p><p className="text-purple-400 text-xl">{formatMoney(totaux.benefice_total)} دج</p></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-semibold">المبيعات كاش</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-slate-400 text-sm">عدد المبيعات</p><p className="text-white text-xl">{formatMoney(totaux.nombre_de_ventes)}</p></div>
            <div><p className="text-slate-400 text-sm">إجمالي المبلغ</p><p className="text-emerald-400 text-xl">{formatMoney(totaux.total_montant)} دج</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Performance - Installment */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
            <h2 className="text-white text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              أداء المستخدمين (تقسيط)
            </h2>
          </div>
          <div className="p-4 max-h-[300px] overflow-y-auto">
            {loading.totals ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800">
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-2 text-right">المستخدم</th>
                    <th className="px-4 py-2 text-right">المبيعات</th>
                    <th className="px-4 py-2 text-right">الفائدة</th>
                    <th className="px-4 py-2 text-right">نسبة الفائدة</th>
                   </tr>
                </thead>
                <tbody>
                  {userPayments.filter(u => u.total_montant_total > 0).map((u, i) => (
                    <tr key={i} className="border-b border-slate-700/50 hover:bg-purple-500/10">
                      <td className="px-4 py-2 text-white">{u.username}</td>
                      <td className="px-4 py-2 text-emerald-300">{formatMoney(u.total_montant_total)}</td>
                      <td className="px-4 py-2 text-amber-300">{formatMoney(u.benefice_total)}</td>
                      <td className="px-4 py-2 text-purple-300">{u.pourcentage_benefice_total}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* User Performance - Cash */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
            <h2 className="text-white text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              أداء المستخدمين (كاش)
            </h2>
          </div>
          <div className="p-4 max-h-[300px] overflow-y-auto">
            {loading.totals ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800">
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-2 text-right">المستخدم</th>
                    <th className="px-4 py-2 text-right">المبيعات</th>
                    <th className="px-4 py-2 text-right">عدد المبيعات</th>
                  </tr>
                </thead>
                <tbody>
                  {userCashPayments.filter(u => u.total_montant > 0).map((u, i) => (
                    <tr key={i} className="border-b border-slate-700/50 hover:bg-purple-500/10">
                      <td className="px-4 py-2 text-white">{u.username}</td>
                      <td className="px-4 py-2 text-emerald-300">{formatMoney(u.total_montant)}</td>
                      <td className="px-4 py-2 text-blue-300">{u.nombre_de_ventes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Products - Installment */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
            <h2 className="text-white text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              أفضل المنتجات (تقسيط)
            </h2>
          </div>
          <div className="p-4 max-h-[300px] overflow-y-auto">
            {loading.products ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800">
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-2 text-right">المنتج</th>
                    <th className="px-4 py-2 text-right">الكمية</th>
                    <th className="px-4 py-2 text-right">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {topProduits.slice(0, 10).map((p, i) => (
                    <tr key={i} className="border-b border-slate-700/50 hover:bg-purple-500/10 cursor-pointer" onClick={() => handleProductClick(p.id)}>
                      <td className="px-4 py-2 text-purple-300 hover:underline">{p.produit}</td>
                      <td className="px-4 py-2 text-blue-300">{p.quantite_vendue_produit}</td>
                      <td className="px-4 py-2 text-emerald-300">{formatMoney(p.montant_total_produit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Products - Cash */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
            <h2 className="text-white text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              أفضل المنتجات (كاش)
            </h2>
          </div>
          <div className="p-4 max-h-[300px] overflow-y-auto">
            {loading.products ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800">
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-2 text-right">المنتج</th>
                    <th className="px-4 py-2 text-right">الكمية</th>
                    <th className="px-4 py-2 text-right">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {topProduitsCash.slice(0, 10).map((p, i) => (
                    <tr key={i} className="border-b border-slate-700/50 hover:bg-purple-500/10 cursor-pointer" onClick={() => handleProductClick(p.id)}>
                      <td className="px-4 py-2 text-purple-300 hover:underline">{p.produit}</td>
                      <td className="px-4 py-2 text-blue-300">{p.quantite_vendue_produit}</td>
                      <td className="px-4 py-2 text-emerald-300">{formatMoney(p.montant_total_produit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Best Clients - Installment */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
            <h2 className="text-white text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              أفضل الزبائن (تقسيط)
            </h2>
          </div>
          <div className="p-4 max-h-[300px] overflow-y-auto">
            {loading.clients ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800">
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-2 text-right">الزبون</th>
                    <th className="px-4 py-2 text-right">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {topClientsFacilite.slice(0, 10).map((c, i) => (
                    <tr key={i} className="border-b border-slate-700/50 hover:bg-purple-500/10 cursor-pointer" onClick={() => handleClientClick(c.id)}>
                      <td className="px-4 py-2 text-purple-300 hover:underline">{c.client}</td>
                      <td className="px-4 py-2 text-emerald-300">{formatMoney(c.total_montant_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Best Clients - Cash */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
            <h2 className="text-white text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              أفضل الزبائن (كاش)
            </h2>
          </div>
          <div className="p-4 max-h-[300px] overflow-y-auto">
            {loading.clients ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800">
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-2 text-right">الزبون</th>
                    <th className="px-4 py-2 text-right">المبلغ</th>
                    <th className="px-4 py-2 text-right">عدد المبيعات</th>
                  </tr>
                </thead>
                <tbody>
                  {topClientsCash.slice(0, 10).map((c, i) => (
                    <tr key={i} className="border-b border-slate-700/50 hover:bg-purple-500/10 cursor-pointer" onClick={() => handleClientClick(c.id)}>
                      <td className="px-4 py-2 text-purple-300 hover:underline">{c.client}</td>
                      <td className="px-4 py-2 text-emerald-300">{formatMoney(c.total_montant)}</td>
                      <td className="px-4 py-2 text-blue-300">{c.nombre_de_ventes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <AnimatePresence>
        {dialogOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-xl w-[900px] max-h-[90vh] overflow-hidden shadow-2xl border border-purple-500/30"
            >
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex justify-between items-center">
                <h2 className="text-white text-xl font-bold">
                  {dialogType === 'client' ? 'تفاصيل العميل' : 'تفاصيل المنتج'}
                </h2>
                <button onClick={() => setDialogOpen(false)} className="text-white hover:bg-white/20 rounded-lg p-1 transition">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-130px)] p-6">
                {loadingItem ? (
                  <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : dialogType === 'client' ? (
                  <ClientDetailDialog client={selectedItem} />
                ) : (
                  <ProductDetailDialog product={selectedItem} />
                )}
              </div>
              <div className="border-t border-slate-700 px-6 py-4 flex justify-end">
                <button onClick={() => setDialogOpen(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition">إغلاق</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Client Detail Dialog Component
function ClientDetailDialog({ client }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    { id: 0, label: "المعلومات الشخصية" },
    { id: 1, label: "المبيعات بالتقسيط" },
    { id: 2, label: "المبيعات كاش" },
  ];

  const formatMoney = (num) => {
    if (num === undefined || num === null) return "0";
    return Number(num);
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 transition-all ${activeTab === tab.id ? 'border-b-2 border-purple-500 text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-slate-400">الاسم:</span> <span className="text-white">{client.nom_famille_ar} {client.prenom_ar}</span></div>
          <div><span className="text-slate-400">رقم الحساب:</span> <span className="text-white">{client.ccp}/{client.cle}</span></div>
          <div><span className="text-slate-400">الهاتف:</span> <span className="text-white">{formatTelephones(client.telephones)}</span></div>
          <div><span className="text-slate-400">العنوان:</span> <span className="text-white">{client.adresse}</span></div>
          <div><span className="text-slate-400">الدين الإجمالي (تقسيط):</span> <span className="text-red-400">{formatMoney(client.total_facilite)} دج</span></div>
          <div><span className="text-slate-400">المدفوع (تقسيط):</span> <span className="text-emerald-400">{formatMoney(client.paye_facilite)} دج</span></div>
          <div><span className="text-slate-400">المتبقي (تقسيط):</span> <span className="text-amber-400">{formatMoney(client.reste_facilite)} دج</span></div>
          <div><span className="text-slate-400">إجمالي المشتريات كاش:</span> <span className="text-emerald-400">{formatMoney(client.total_cash)} دج</span></div>
        </div>
      )}

      {activeTab === 1 && client.ventes_facilite?.length > 0 && (
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800">
              <tr className="bg-slate-700/50">
                <th className="px-4 py-2 text-right">#</th>
                <th className="px-4 py-2 text-right">التاريخ</th>
                <th className="px-4 py-2 text-right">المبلغ</th>
                <th className="px-4 py-2 text-right">عدد الأشهر</th>
                <th className="px-4 py-2 text-right">المبلغ الشهري</th>
              </tr>
            </thead>
            <tbody>
              {client.ventes_facilite.map((vente, i) => (
                <tr key={vente.id} className="border-b border-slate-700">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">{new Date(vente.date_creation).toLocaleDateString('ar-DZ')}</td>
                  <td className="px-4 py-2 text-emerald-300">{formatMoney(vente.montant_total)} دج</td>
                  <td className="px-4 py-2 text-blue-300">{vente.nombre_mois} أشهر</td>
                  <td className="px-4 py-2 text-amber-300">{formatMoney(vente.montant_mensuel)} دج</td>
                 </tr>
              ))}
            </tbody>
           </table>
        </div>
      )}

      {activeTab === 2 && client.ventes_cash?.length > 0 && (
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800">
              <tr className="bg-slate-700/50">
                <th className="px-4 py-2 text-right">#</th>
                <th className="px-4 py-2 text-right">التاريخ</th>
                <th className="px-4 py-2 text-right">المبلغ</th>
               </tr>
            </thead>
            <tbody>
              {client.ventes_cash.map((vente, i) => (
                <tr key={vente.id} className="border-b border-slate-700">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">{new Date(vente.date_vente).toLocaleDateString('ar-DZ')}</td>
                  <td className="px-4 py-2 text-emerald-300">{formatMoney(vente.montant_total)} دج</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Product Detail Dialog Component
function ProductDetailDialog({ product }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    { id: 0, label: "معلومات المنتج" },
    { id: 1, label: "المبيعات بالتقسيط" },
    { id: 2, label: "المبيعات كاش" },
  ];

  const formatMoney = (num) => {
    if (num === undefined || num === null) return "0";
    return Number(num);
  };

  return (
    <div>
      <div className="flex border-b border-slate-700 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 transition-all ${activeTab === tab.id ? 'border-b-2 border-purple-500 text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-slate-400">الاسم:</span> <span className="text-white">{product.nom}</span></div>
          <div><span className="text-slate-400">المرجع:</span> <span className="text-white">{product.reference}</span></div>
          <div><span className="text-slate-400">العائلة:</span> <span className="text-white">{product.famille}</span></div>
          <div><span className="text-slate-400">العلامة:</span> <span className="text-white">{product.marque}</span></div>
          <div><span className="text-slate-400">المخزون الحالي:</span> <span className="text-blue-300">{product.quantite}</span></div>
          <div><span className="text-slate-400">سعر الشراء:</span> <span className="text-amber-300">{formatMoney(product.prix_achat)} دج</span></div>
          <div><span className="text-slate-400">سعر البيع كاش:</span> <span className="text-emerald-300">{formatMoney(product.prix_vente_cache)} دج</span></div>
          <div><span className="text-slate-400">إجمالي مبيعات (تقسيط):</span> <span className="text-purple-300">{formatMoney(product.total_facilite)} دج</span></div>
          <div><span className="text-slate-400">إجمالي مبيعات (كاش):</span> <span className="text-emerald-300">{formatMoney(product.total_cash)} دج</span></div>
        </div>
      )}

      {activeTab === 1 && product.ventes_facilite?.length > 0 && (
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800">
              <tr className="bg-slate-700/50">
                <th className="px-4 py-2 text-right">#</th>
                <th className="px-4 py-2 text-right">التاريخ</th>
                <th className="px-4 py-2 text-right">الكمية</th>
                <th className="px-4 py-2 text-right">المبلغ</th>
               </tr>
            </thead>
            <tbody>
              {product.ventes_facilite.map((vente, i) => (
                <tr key={vente.id} className="border-b border-slate-700">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">{vente.date_formatee}</td>
                  <td className="px-4 py-2 text-blue-300">{vente.quantite}</td>
                  <td className="px-4 py-2 text-emerald-300">{formatMoney(vente.montant_total)} دج</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 2 && product.ventes_cash?.length > 0 && (
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800">
              <tr className="bg-slate-700/50">
                <th className="px-4 py-2 text-right">#</th>
                <th className="px-4 py-2 text-right">التاريخ</th>
                <th className="px-4 py-2 text-right">الكمية</th>
                <th className="px-4 py-2 text-right">المبلغ</th>
               </tr>
            </thead>
            <tbody>
              {product.ventes_cash.map((vente, i) => (
                <tr key={vente.id} className="border-b border-slate-700">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">{vente.date_formatee}</td>
                  <td className="px-4 py-2 text-blue-300">{vente.quantite}</td>
                  <td className="px-4 py-2 text-emerald-300">{formatMoney(vente.montant_total)} دج</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
