import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  X, 
  User, 
  CreditCard, 
  TrendingUp,
  DollarSign,
  FileSpreadsheet,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import axios from "../../../api/axiosInstance";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function PosteBoard() {
  const [rows, setRows] = useState([]);
  const [totaux, setTotaux] = useState({
    total_ventes: 0,
    total_montant_total: 0,
    total_montant_verse: 0,
    total_montant_restant: 0,
  });
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    periode: "",
    users: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const debounceTimer = useRef(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPageUrl, setPrevPageUrl] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);

  const periodeOptions = [
    { value: "", label: "الكل" },
    { value: "today", label: "اليوم" },
    { value: "yesterday", label: "الأمس" },
    { value: "this_week", label: "هذا الأسبوع" },
    { value: "this_month", label: "هذا الشهر" },
    { value: "last_month", label: "الشهر الماضي" },
    { value: "this_year", label: "هذا العام" },
  ];

  const fetchVente = useCallback(async (url = null) => {
    setLoading(true);
    setError(null);
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      };
      
      const apiUrl = url || "/vente/ventes-facilite/";
      const params = {
        ...filters,
        search: searchTerm || undefined,
        page: currentPage,
        page_size: itemsPerPage,
      };
      
      console.log("Fetching with params:", params);
      
      const response = await axios.get(apiUrl, { headers, params });
      console.log("Response:", response.data);
      
      // Get pagination info
      setNextPageUrl(response.data.next);
      setPrevPageUrl(response.data.previous);
      setTotalItems(response.data.count || 0);
      setTotalPages(Math.ceil((response.data.count || 0) / itemsPerPage));
      
      // Get ventes from the response
      let ventesList = [];
      if (response.data.results && response.data.results.ventes) {
        ventesList = response.data.results.ventes;
      } else if (response.data.ventes) {
        ventesList = response.data.ventes;
      } else if (Array.isArray(response.data)) {
        ventesList = response.data;
      }
      
      setTotaux({
        total_ventes: response.data.total_ventes || 0,
        total_montant_total: response.data.total_montant_total || 0,
        total_montant_verse: response.data.total_montant_verse || 0,
        total_montant_restant: response.data.total_montant_restant || 0,
      });
      
      // Fetch details for each sale to get montants_par_mois
      setLoadingDetails(true);
      const ventesWithDetails = await Promise.all(
        ventesList.map(async (vente) => {
          try {
            const detailRes = await axios.get(`/vente/ventes-facilite/${vente.id}/`, { headers });
            return {
              ...vente,
              montants_par_mois: detailRes.data.montants_par_mois || [],
              date_debut: detailRes.data.date_debut,
              date_fin: detailRes.data.date_fin,
              client_detail: detailRes.data.client_detail || vente.client_detail,
            };
          } catch (err) {
            console.error(`Error fetching details for sale ${vente.id}:`, err);
            return vente;
          }
        })
      );
      
      setRows(ventesWithDetails);
      setLoadingDetails(false);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("خطأ في تحميل البيانات");
      setLoadingDetails(false);
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm, currentPage, itemsPerPage]);

  // Fetch when filters or search term change (with debounce)
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when filters change
      fetchVente();
    }, 500);
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [fetchVente]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("/auth/users/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        setUsers(res.data.results || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  const exportToExcel = useCallback(() => {
    const dataToExport = [];
    rows.forEach((row) => {
      if (row.montants_par_mois?.length) {
        row.montants_par_mois.forEach((montant, index) => {
          // Calculate payment date based on start date and month index
          let paymentDate = "";
          let paymentMonth = "";
          if (row.date_debut) {
            const startDate = new Date(row.date_debut);
            const paymentDateObj = new Date(startDate);
            paymentDateObj.setMonth(startDate.getMonth() + index);
            paymentDate = paymentDateObj.toLocaleDateString('ar-DZ');
            paymentMonth = paymentDateObj.toLocaleString('ar-DZ', { month: 'long' });
          }
          
          dataToExport.push({
            "الاسم و اللقب": `${row.client_detail?.nom_famille_fr || row.client_name || ""} ${row.client_detail?.prenom_fr || ""}`.trim(),
            "رقم الحساب": `${row.client_detail?.ccp || ""}/${row.client_detail?.cle || ""}`,
            "الدفعة": index + 1,
            "القسط الشهري": montant,
            "الشهر": paymentMonth,
            "تاريخ الدفع المتوقع": paymentDate,
            "تاريخ البداية": row.date_debut || "-",
            "تاريخ النهاية": row.date_fin || "-",
          });
        });
      }
    });

    if (dataToExport.length === 0) {
      alert("لا توجد بيانات للتصدير");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "تقرير المدفوعات");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), "report_payments.xlsx");
  }, [rows]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ periode: "", users: "" });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    if (nextPageUrl) {
      setCurrentPage(currentPage + 1);
      fetchVente(nextPageUrl);
    }
  };

  const handlePrevPage = () => {
    if (prevPageUrl) {
      setCurrentPage(currentPage - 1);
      fetchVente(prevPageUrl);
    }
  };

  // Memoize expanded rows to avoid recalculation on every render
  const expandedRows = useMemo(() => {
    const result = [];
    rows.forEach((row) => {
      if (row.montants_par_mois?.length) {
        row.montants_par_mois.forEach((montant, idx) => {
          // Calculate payment date
          let paymentDate = "";
          let paymentMonth = "";
          let paymentYear = "";
          
          if (row.date_debut) {
            const startDate = new Date(row.date_debut);
            const paymentDateObj = new Date(startDate);
            paymentDateObj.setMonth(startDate.getMonth() + idx);
            paymentDate = paymentDateObj.toLocaleDateString('ar-DZ');
            paymentMonth = paymentDateObj.toLocaleString('ar-DZ', { month: 'long' });
            paymentYear = paymentDateObj.getFullYear();
          }
          
          result.push({
            id: `${row.id}_${idx}`,
            name: `${row.client_detail?.nom_famille_fr || row.client_name || ""} ${row.client_detail?.prenom_fr || ""}`.trim() || "غير معروف",
            account: `${row.client_detail?.ccp || ""}/${row.client_detail?.cle || ""}`,
            montant: montant,
            date_debut: row.date_debut || "-",
            date_fin: row.date_fin || "-",
            payment_date: paymentDate,
            payment_month: paymentMonth,
            payment_year: paymentYear,
            month_index: idx + 1,
          });
        });
      }
    });
    return result;
  }, [rows]);

  const totalAmount = useMemo(() => {
    return expandedRows.reduce((sum, row) => sum + row.montant, 0);
  }, [expandedRows]);

  const userOptions = useMemo(() => [
    { value: "", label: "الكل" },
    ...users.map(u => ({ value: u.id, label: u.username }))
  ], [users]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-green-400" />
          <h1 className="text-2xl text-white">تقرير المدفوعات البريدية</h1>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              showFilters || filters.periode || filters.users
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>فلترة</span>
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={CreditCard} label="المبيعات" value={totaux.total_ventes} color="green" />
        <StatCard icon={DollarSign} label="المبلغ الإجمالي" value={totaux.total_montant_total} color="emerald" isCurrency />
        <StatCard icon={DollarSign} label="المدفوع" value={totaux.total_montant_verse} color="amber" isCurrency />
        <StatCard icon={DollarSign} label="المتبقي" value={totaux.total_montant_restant} color="red" isCurrency />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
        <input
          type="text"
          placeholder="البحث عن عميل بالاسم أو رقم الحساب..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500 placeholder-slate-400"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm("")} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
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
            </div>
            {(filters.periode || filters.users) && (
              <div className="flex justify-end mt-4">
                <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition">
                  <X className="w-4 h-4" /> <span>مسح الفلتر</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Button */}
      <div className="flex justify-end">
        <button 
          onClick={exportToExcel} 
          disabled={loading || loadingDetails || expandedRows.length === 0}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-emerald-500/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet className="w-4 h-4" /> 
          <span>تصدير Excel</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-green-500/20 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3">
          <h2 className="text-white text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            قائمة المدفوعات البريدية
            {expandedRows.length > 0 && (
              <span className="text-sm bg-white/20 px-2 py-1 rounded-full">{expandedRows.length} دفعة</span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loadingDetails ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <span className="mr-3 text-white">جاري تحميل تفاصيل الدفعات...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : expandedRows.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CreditCard className="w-12 h-12 mx-auto mb-2 text-slate-500" />
            <p>لا توجد بيانات</p>
            {searchTerm && <p className="text-sm mt-2">نتيجة بحث: "{searchTerm}"</p>}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-800">
                <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                  <th className="px-4 py-3 text-right">#</th>
                  <th className="px-4 py-3 text-right">الاسم و اللقب</th>
                  <th className="px-4 py-3 text-right">رقم الحساب</th>
                  <th className="px-4 py-3 text-right">الدفعة</th>
                  <th className="px-4 py-3 text-right">القسط الشهري</th>
                  <th className="px-4 py-3 text-right">الشهر</th>
                  <th className="px-4 py-3 text-right">تاريخ الدفع المتوقع</th>
                  <th className="px-4 py-3 text-right">تاريخ البداية</th>
                  <th className="px-4 py-3 text-right">تاريخ النهاية</th>
                    </tr>
              </thead>
              <tbody>
                {expandedRows.map((row, index) => (
                  <tr key={row.id} className={`border-b border-slate-700/50 hover:bg-green-500/10 ${index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'}`}>
                    <td className="px-4 py-3 text-green-300">{index + 1}</td>
                    <td className="px-4 py-3 text-white font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-blue-300 font-mono">{row.account}</td>
                    <td className="px-4 py-3 text-purple-300">{row.month_index}</td>
                    <td className="px-4 py-3 text-emerald-400 font-bold">{Number(row.montant)} دج</td>
                    <td className="px-4 py-3 text-amber-300">{row.payment_month}</td>
                    <td className="px-4 py-3 text-cyan-300">{row.payment_date}</td>
                    <td className="px-4 py-3 text-slate-300">{row.date_debut}</td>
                    <td className="px-4 py-3 text-slate-300">{row.date_fin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalItems > 0 && !loading && !loadingDetails && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-t border-slate-700">
            <div className="flex justify-between items-center text-sm flex-wrap gap-2">
              <div className="text-slate-400">
                عرض {expandedRows.length} من {totalItems} عملية بيع
              </div>
              <div className="text-emerald-400">
                إجمالي المبلغ: <span className="font-bold text-white">{Number(totalAmount)} دج</span>
              </div>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-3">
                <button
                  onClick={handlePrevPage}
                  disabled={!prevPageUrl}
                  className="px-4 py-2 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition flex items-center gap-2"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>
                <span className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg">
                  صفحة {currentPage} من {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={!nextPageUrl}
                  className="px-4 py-2 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition flex items-center gap-2"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color, isCurrency }) {
  const colors = {
    green: "border-green-500/30 bg-green-500/20 text-green-400",
    emerald: "border-emerald-500/30 bg-emerald-500/20 text-emerald-400",
    amber: "border-amber-500/30 bg-amber-500/20 text-amber-400",
    red: "border-red-500/30 bg-red-500/20 text-red-400",
  };
  
  const formattedValue = isCurrency 
    ? `${Number(value)} دج`
    : Number(value);
  
  return (
    <div className={`border rounded-lg px-3 py-2 ${colors[color]}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <div className="text-xs opacity-75">{label}</div>
      </div>
      <div className="text-lg font-bold mt-1">
        {formattedValue}
      </div>
    </div>
  );
}