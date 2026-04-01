import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  User, 
  CreditCard, 
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import axios from "../../../api/axiosInstance";
import dayjs from "dayjs";
import { toast } from "sonner";

export default function MatrixTable() {
  const months = [
    "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
    "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const currentYear = dayjs().year();
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState({ row: null, col: null, montant: 0 });
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPageUrl, setPrevPageUrl] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (url = null) => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = url || "/vente/ventes-facilite/";
      const res = await axios.get(apiUrl, {
        params: { page_size: itemsPerPage }
      });
      
      console.log("📦 API Response:", res.data);
      
      setNextPageUrl(res.data.next);
      setPrevPageUrl(res.data.previous);
      setTotalItems(res.data.count || 0);
      setTotalPages(Math.ceil((res.data.count || 0) / itemsPerPage));
      
      let ventes = [];
      if (res.data.results && res.data.results.ventes && Array.isArray(res.data.results.ventes)) {
        ventes = res.data.results.ventes;
      } else if (res.data.ventes && Array.isArray(res.data.ventes)) {
        ventes = res.data.ventes;
      } else if (Array.isArray(res.data)) {
        ventes = res.data;
      } else if (res.data.results && Array.isArray(res.data.results)) {
        ventes = res.data.results;
      }
      
      if (ventes.length === 0) {
        setRows([]);
        setFilteredRows([]);
        setLoading(false);
        return;
      }

      let yearsSet = new Set();
      
      // Add current and future years
      for (let y = 2020; y <= 2030; y++) {
        yearsSet.add(y);
      }
      
      const processedRows = await Promise.all(ventes.map(async (vente) => {
        let saleDetails = vente;
        try {
          const detailRes = await axios.get(`/vente/ventes-facilite/${vente.id}/`);
          saleDetails = detailRes.data;
        } catch (err) {
          console.error(`Error fetching details for sale ${vente.id}:`, err);
        }
        
        const clientDetail = saleDetails.client_detail || {};
        const clientName = clientDetail.nom_famille_ar && clientDetail.prenom_ar
          ? `${clientDetail.nom_famille_ar} ${clientDetail.prenom_ar}`
          : clientDetail.nom_famille_fr && clientDetail.prenom_fr
          ? `${clientDetail.nom_famille_fr} ${clientDetail.prenom_fr}`
          : clientDetail.nom || vente.client_name || "عميل غير معروف";
        
        const montantMensuel = Number(saleDetails.montant_mensuel) || 0;
        const nombreMois = Number(saleDetails.nombre_mois) || 0;
        const montantsParMois = saleDetails.montants_par_mois || [];
        
        let startDate = null;
        if (saleDetails.date_debut) {
          startDate = dayjs(saleDetails.date_debut);
        }
        
        // Create arrays for all 12 months of the year
        const values = Array(12).fill(null);
        const moisStatus = Array(12).fill(null);
        const moisYears = Array(12).fill(null);
        
        // Fill payments
        for (let i = 0; i < nombreMois; i++) {
          if (startDate) {
            const paymentDate = startDate.add(i, 'month');
            const monthIndex = paymentDate.month();
            const year = paymentDate.year();
            
            const amount = montantsParMois[i] || montantMensuel;
            
            // Store in the month's position (only the first payment for that month)
            // If multiple payments in same month, we need to handle it
            if (values[monthIndex] === null) {
              values[monthIndex] = amount;
              moisYears[monthIndex] = year;
              yearsSet.add(year);
              
              let status = "pending";
              if (saleDetails.paiements && Array.isArray(saleDetails.paiements)) {
                const payment = saleDetails.paiements.find(p => p.month_index === i);
                if (payment) {
                  status = payment.status;
                }
              }
              moisStatus[monthIndex] = status;
            } else {
              // If multiple payments in same month, add them together
              values[monthIndex] = (values[monthIndex] || 0) + amount;
            }
          }
        }
        
        return {
          vente_id: saleDetails.id,
          name: clientName,
          account: clientDetail.ccp || "غير محدد",
          values,
          mois_status: moisStatus,
          mois_years: moisYears,
          montant_mensuel: montantMensuel,
          nombre_mois: nombreMois,
          date_debut: saleDetails.date_debut
        };
      }));
      
      const allYears = Array.from(yearsSet).sort((a, b) => a - b);
      setAvailableYears(allYears);
      console.log("Available years:", allYears);
      
      setRows(processedRows);
      
    } catch (err) {
      console.error("Error fetching ventes:", err);
      setError(err.response?.data?.message || err.message || "خطأ في تحميل البيانات");
      toast.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Apply filters - FIXED YEAR FILTER LOGIC
  useEffect(() => {
    let filtered = rows.filter((row) => {
      const searchOk =
        searchQuery === "" ||
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.account?.includes(searchQuery);

      const statusOk =
        statusFilter === "all" || row.mois_status.some((s) => s === statusFilter);

      // Check if any payment month belongs to the selected year
      const yearOk = row.mois_years.some((year) => year === yearFilter);

      return searchOk && statusOk && yearOk;
    });
    
    setFilteredRows(filtered);
    console.log(`Filtered rows for year ${yearFilter}:`, filtered.length);
    
  }, [rows, searchQuery, statusFilter, yearFilter]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "paid":
        return "bg-emerald-500/20 text-emerald-400 cursor-pointer hover:bg-emerald-500/30";
      case "pending":
        return "bg-amber-500/20 text-amber-400 cursor-pointer hover:bg-amber-500/30";
      case "unpaid":
        return "bg-red-500/20 text-red-400 cursor-pointer hover:bg-red-500/30";
      default:
        return "bg-slate-700/50 text-slate-400 cursor-not-allowed";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "paid": return "مدفوع";
      case "pending": return "معلق";
      case "unpaid": return "غير مدفوع";
      default: return "";
    }
  };

  const handleCellClick = (rowIndex, colIndex, montant) => {
    const row = filteredRows[rowIndex];
    if (!montant) return;
    
    setSelectedCell({ 
      row: rowIndex, 
      col: colIndex, 
      montant: montant,
      venteId: row.vente_id,
      monthIndex: colIndex
    });
    const currentStatus = row.mois_status[colIndex];
    setSelectedStatus(currentStatus === "paid" ? "paid" : currentStatus === "pending" ? "pending" : "unpaid");
    setDialogOpen(true);
  };

  const handleSaveStatus = async () => {
    const { row: rowIndex, col, montant, venteId, monthIndex } = selectedCell;
    
    if (!venteId) {
      toast.error("لا يمكن تحديث الحالة");
      setDialogOpen(false);
      return;
    }

    try {
      const updatedRows = [...rows];
      const rowToUpdate = updatedRows.find(r => r.vente_id === venteId);
      if (rowToUpdate) {
        rowToUpdate.mois_status[col] = selectedStatus;
        setRows(updatedRows);
      }
      
      const payload = {
        montant: montant,
        month: monthIndex,
        status: selectedStatus,
      };
      
      await axios.post(`/vente/vente/payer/${venteId}/`, payload);
      
      toast.success("تم تحديث حالة الدفع بنجاح");
      const currentUrl = nextPageUrl ? `/vente/ventes-facilite/?page=${currentPage}` : null;
      fetchData(currentUrl);
    } catch (err) {
      console.error("Error saving status:", err);
      toast.error(err.response?.data?.error || "فشل تحديث حالة الدفع");
      fetchData();
    }

    setDialogOpen(false);
  };

  const statusTotals = {
    paid: { count: 0, label: "مدفوع", icon: CheckCircle, color: "emerald" },
    pending: { count: 0, label: "معلق", icon: Clock, color: "amber" },
    unpaid: { count: 0, label: "غير مدفوع", icon: XCircle, color: "red" },
  };

  filteredRows.forEach((row) => {
    row.mois_status.forEach((status, i) => {
      if (status && row.mois_years[i] === yearFilter && statusTotals[status]) {
        statusTotals[status].count++;
      }
    });
  });

  const totalUnpaid = filteredRows.reduce((sum, row) => {
    return sum + row.mois_status.filter((s, i) => 
      s === "unpaid" && row.mois_years[i] === yearFilter
    ).length;
  }, 0);

  const statusOptions = [
    { value: "all", label: "الكل" },
    { value: "paid", label: "مدفوع" },
    { value: "pending", label: "معلق" },
    { value: "unpaid", label: "غير مدفوع" },
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setRows([]);
    fetchData();
  };

  const handleNextPage = () => {
    if (nextPageUrl) {
      setCurrentPage(currentPage + 1);
      fetchData(nextPageUrl);
    }
  };

  const handlePrevPage = () => {
    if (prevPageUrl) {
      setCurrentPage(currentPage - 1);
      fetchData(prevPageUrl);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              <div className="text-xs text-blue-300">العملاء:</div>
              <div className="text-lg text-white">{filteredRows.length}</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-red-500/20 to-rose-600/20 border border-red-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <div className="text-xs text-red-300">المتأخرات:</div>
              <div className="text-lg text-red-400">{totalUnpaid}</div>
            </div>
          </div>
          {Object.entries(statusTotals).map(([key, data]) => (
            <div key={key} className={`bg-gradient-to-r from-${data.color}-500/20 to-${data.color}-600/20 border border-${data.color}-500/30 rounded-lg px-4 py-2`}>
              <div className="flex items-center gap-2">
                <data.icon className={`w-4 h-4 text-${data.color}-400`} />
                <div className={`text-xs text-${data.color}-300`}>{data.label}:</div>
                <div className={`text-lg text-${data.color}-400`}>{data.count}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-all text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm ${
              showFilters || searchQuery || statusFilter !== "all" || yearFilter !== currentYear
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>فلترة</span>
          </motion.button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
        <input
          type="text"
          placeholder="البحث عن عميل..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500 placeholder-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
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
                <label className="block text-sm text-slate-400 mb-1">الحالة</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">السنة</label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(Number(e.target.value))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-amber-500 focus:outline-none"
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {(searchQuery || statusFilter !== "all" || yearFilter !== currentYear) && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setYearFilter(currentYear);
                  }}
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

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="mr-3 text-white">جاري تحميل البيانات...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12 text-red-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
          <p>{error}</p>
          <button
            onClick={() => fetchData()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Matrix Table */}
      {!loading && !error && rows.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
            <h2 className="text-white text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              مصفوفة المدفوعات - السنة {yearFilter}
              {totalItems > 0 && (
                <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                  {totalItems} عملية بيع
                </span>
              )}
            </h2>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <th className="px-4 py-3 text-right min-w-[180px] sticky left-0 bg-blue-600 z-20">الاسم و اللقب</th>
                  <th className="px-4 py-3 text-right min-w-[120px] sticky left-[180px] bg-blue-600 z-20">رقم الحساب</th>
                  {months.map((month) => (
                    <th key={month} className="px-3 py-3 text-center min-w-[85px]">
                      {month}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center min-w-[85px] bg-red-600/50">المتأخرات</th>
                 </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-4 py-8 text-center text-slate-400">
                      <CreditCard className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                      لا توجد بيانات تطابق الفلتر
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, rowIndex) => {
                    const unpaidThisYear = row.mois_status.filter(
                      (s, i) =>
                        s === "unpaid" &&
                        row.mois_years[i] === yearFilter
                    ).length;

                    return (
                      <motion.tr
                        key={row.vente_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: rowIndex * 0.05 }}
                        className={`border-b border-slate-700/50 transition-all hover:bg-blue-500/10 ${
                          rowIndex % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'
                        }`}
                      >
                        <td className="px-4 py-3 text-white font-medium sticky left-0 bg-inherit z-10">
                          {row.name}
                        </td>
                        <td className="px-4 py-3 text-blue-300 font-mono sticky left-[180px] bg-inherit z-10">
                          {row.account}
                        </td>

                        {row.values.map((val, colIndex) => {
                          const cellStatus = row.mois_status[colIndex];
                          const cellYear = row.mois_years[colIndex];
                          const statusStyle = getStatusStyle(cellStatus);

                          if (!val || cellYear !== yearFilter) {
                            return (
                              <td key={colIndex} className="px-3 py-3 text-center text-slate-500">
                                —
                              </td>
                            );
                          }

                          return (
                            <td
                              key={colIndex}
                              className={`px-3 py-3 text-center transition-all hover:scale-105 rounded-lg ${statusStyle}`}
                              onClick={() => cellStatus && handleCellClick(rowIndex, colIndex, val)}
                            >
                              <div className="flex flex-col items-center">
                                <span className="font-bold">{Number(val)}</span>
                                <span className="text-xs opacity-75">{getStatusText(cellStatus)}</span>
                              </div>
                            </td>
                          );
                        })}

                        <td className="px-4 py-3 text-center bg-red-500/10 text-red-400 font-bold">
                          {unpaidThisYear}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalItems > 0 && (
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-t border-slate-700">
              <div className="flex justify-between items-center text-sm flex-wrap gap-2">
                <div className="text-slate-400">
                  عرض {filteredRows.length} من {totalItems} عملية بيع
                </div>
                <div className="flex gap-6">
                  <div className="text-emerald-400">
                    مدفوع: <span className="font-bold text-white">{statusTotals.paid.count}</span>
                  </div>
                  <div className="text-amber-400">
                    معلق: <span className="font-bold text-white">{statusTotals.pending.count}</span>
                  </div>
                  <div className="text-red-400">
                    غير مدفوع: <span className="font-bold text-white">{statusTotals.unpaid.count}</span>
                  </div>
                </div>
              </div>
              
              {/* Pagination Controls */}
              <div className="flex justify-center items-center gap-2 mt-3">
                <button
                  onClick={handlePrevPage}
                  disabled={!prevPageUrl}
                  className="px-4 py-2 bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition flex items-center gap-2"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>
                <span className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg">
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
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && rows.length === 0 && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-12 text-center">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-slate-500" />
          <h3 className="text-xl text-white mb-2">لا توجد مبيعات بالتقسيط</h3>
          <p className="text-slate-400">لم يتم العثور على أي عمليات بيع بالتقسيط</p>
        </div>
      )}

      {/* Status Dialog */}
      <AnimatePresence>
        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-xl w-[450px] overflow-hidden shadow-2xl border border-blue-500/30"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-white text-xl font-bold">تغيير حالة الدفع</h2>
                <p className="text-white/70 text-sm mt-1">
                  المبلغ: {Number(selectedCell.montant)} دج
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setSelectedStatus("paid")}
                    className={`px-4 py-3 rounded-lg transition-all flex flex-col items-center ${
                      selectedStatus === "paid"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    <CheckCircle className="w-6 h-6 mb-1" />
                    <span>مدفوع</span>
                  </button>
                  <button
                    onClick={() => setSelectedStatus("pending")}
                    className={`px-4 py-3 rounded-lg transition-all flex flex-col items-center ${
                      selectedStatus === "pending"
                        ? "bg-amber-500 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    <Clock className="w-6 h-6 mb-1" />
                    <span>معلق</span>
                  </button>
                  <button
                    onClick={() => setSelectedStatus("unpaid")}
                    className={`px-4 py-3 rounded-lg transition-all flex flex-col items-center ${
                      selectedStatus === "unpaid"
                        ? "bg-red-500 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    <XCircle className="w-6 h-6 mb-1" />
                    <span>غير مدفوع</span>
                  </button>
                </div>
              </div>
              <div className="border-t border-slate-700 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setDialogOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveStatus}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition"
                >
                  حفظ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}