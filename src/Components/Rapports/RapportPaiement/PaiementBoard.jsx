import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Upload, 
  Lock, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  XCircle,
  Filter,
  Calendar,
  Download
} from "lucide-react";
import axios from "../../../api/axiosInstance";
import dayjs from "dayjs";

export default function PaymentDashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("الكل");
  const [rows, setRows] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedYear, setSelectedYear] = useState("الكل");
  const currentMonthIndex = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIndex);

  const lockedStatus = ["suspendu", "perdu", "banque_bloquee"];

  const arabicMonths = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const mapStatusToArabic = (apiStatus) => {
    switch (apiStatus) {
      case "paid":
        return "مدفوع";
      case "pending":
        return "قيد الانتظار";
      case "unpaid":
        return "غير مدفوع";
      default:
        return apiStatus;
    }
  };

  const mapArabicToStatus = (arabicStatus) => {
    switch (arabicStatus) {
      case "مدفوع":
        return "paid";
      case "قيد الانتظار":
        return "pending";
      case "غير مدفوع":
        return "unpaid";
      default:
        return "";
    }
  };

  const fileInputRef = useRef(null);

  const handleFileUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await axios.post("/vente/vente/import-paiements-txt/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessages([{ type: "success", text: "✅ تم تحميل الملف بنجاح" }]);
      fetchData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessages([]), 3000);
    } catch (err) {
      setMessages([
        {
          type: "error",
          text: err.response?.data?.detail || err.response?.data || err.message || "❌ خطأ في تحميل الملف",
        },
      ]);
    } finally {
      setLoading(false);
      event.target.value = null;
    }
  };

  const isClientLocked = (clientStatus) => lockedStatus.includes(clientStatus);

  // Fetch data from the new endpoint
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      
      if (selectedYear !== "الكل") params.year = selectedYear;
      if (selectedMonth !== "الكل") params.month = selectedMonth;
      if (status !== "الكل") params.status = mapArabicToStatus(status);

      const response = await axios.get("/vente/dashboard-paiements/", { params });
      
      const transformedData = response.data.map((item) => {
        const paymentDate = new Date(item.date).toLocaleDateString("fr-FR");
        
        return {
          name: item.name,
          account: item.account,
          date: paymentDate,
          year: item.year,
          month_index: item.month_index,
          amount: item.amount,
          status: mapStatusToArabic(item.status),
          clientStatus: item.clientStatus,
          montant_mois: item.amount.toString(),
        };
      });
      
      // Group by name, month_index, and year
      const groupedData = transformedData.reduce((acc, item) => {
        const key = `${item.name}_${item.month_index}_${item.year}`;
        if (!acc[key]) {
          acc[key] = {
            ...item,
            paymentDates: [item.date],
            totalAmount: item.amount,
            statuses: [item.status]
          };
        } else {
          acc[key].paymentDates.push(item.date);
          acc[key].totalAmount += item.amount;
          acc[key].statuses.push(item.status);
        }
        return acc;
      }, {});
      
      const finalRows = Object.values(groupedData).map((group) => {
        let finalStatus = "مدفوع";
        if (group.statuses.includes("قيد الانتظار")) finalStatus = "قيد الانتظار";
        if (group.statuses.includes("غير مدفوع")) finalStatus = "غير مدفوع";
        
        return {
          ...group,
          date: group.paymentDates.join(" , "),
          amount: group.totalAmount,
          status: finalStatus,
          paymentDates: undefined,
          totalAmount: undefined,
          statuses: undefined
        };
      });
      
      setRows(finalRows);
    } catch (err) {
      setMessages([
        {
          type: "error",
          text: err.response?.data?.detail || err.message || "❌ خطأ في تحميل البيانات",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth, status]);

  const filteredRows = rows.filter((row) =>
    row.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = filteredRows.reduce((acc, row) => acc + row.amount, 0);

  const statusTotals = {
    مدفوع: { count: 0, amount: 0, icon: CheckCircle, color: "emerald" },
    "قيد الانتظار": { count: 0, amount: 0, icon: Clock, color: "amber" },
    "غير مدفوع": { count: 0, amount: 0, icon: XCircle, color: "red" },
  };

  filteredRows.forEach((row) => {
    const st = row.status;
    if (statusTotals[st]) {
      statusTotals[st].count += 1;
      statusTotals[st].amount += row.amount;
    }
  });

  const getStatusColor = (st) => {
    if (st === "مدفوع") return "text-emerald-400 bg-emerald-500/20";
    if (st === "قيد الانتظار") return "text-amber-400 bg-amber-500/20";
    return "text-red-400 bg-red-500/20";
  };

  // Extract unique years from data
  const uniqueYears = [
    "الكل",
    ...Array.from(new Set(rows.map((row) => row.year).filter(Boolean))),
  ];

  const allMonths = ["الكل", ...Array.from({ length: 12 }, (_, i) => i)];

  const statusOptions = [
    { value: "الكل", label: "الكل" },
    { value: "مدفوع", label: "مدفوع" },
    { value: "قيد الانتظار", label: "قيد الانتظار" },
    { value: "غير مدفوع", label: "غير مدفوع" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl text-white">لوحة تحكم المدفوعات</h1>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              showFilters || selectedYear !== "الكل" || selectedMonth !== "الكل" || status !== "الكل"
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>فلترة</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFileUploadClick}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all text-sm disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>تحميل ملف البريد</span>
          </motion.button>
          <input
            type="file"
            accept=".txt"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <span className="text-slate-400">إجمالي المدفوعات:</span>
            <span className="text-3xl font-bold text-white">{totalAmount} </span>
          </div>
          <div className="flex gap-3">
            {Object.entries(statusTotals).map(([label, data]) => {
              const Icon = data.icon;
              return (
                <div key={label} className="text-center">
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-${data.color}-500/20 text-${data.color}-400`}>
                    <Icon className="w-3 h-3" />
                    <span>{label}</span>
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    {data.count} عملية
                  </div>
                  <div className="text-white font-semibold">
                    {data.amount} 
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
        <input
          type="text"
          placeholder="البحث عن عميل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-3 text-sm outline-none focus:border-amber-500 placeholder-slate-400"
        />
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/50 rounded-lg p-4 border border-amber-500/30"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">الحالة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">السنة</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                {uniqueYears.map((y, idx) => (
                  <option key={idx} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">الشهر</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                {allMonths.map((m, idx) => (
                  <option key={idx} value={m}>
                    {m === "الكل" ? "الكل" : arabicMonths[m]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(selectedYear !== "الكل" || selectedMonth !== "الكل" || status !== "الكل") && (
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setSelectedYear("الكل");
                  setSelectedMonth("الكل");
                  setStatus("الكل");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
              >
                <XCircle className="w-4 h-4" />
                <span>مسح الفلتر</span>
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg ${
                msg.type === "success" 
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" 
                  : "bg-red-500/20 border border-red-500/30 text-red-400"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3">
          <h2 className="text-white text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            قائمة المدفوعات
            {filteredRows.length > 0 && (
              <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                {filteredRows.length} عملية
              </span>
            )}
          </h2>
        </div>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800">
              <tr className="bg-gradient-to-r from-pink-600 to-pink-700 text-white">
                <th className="px-4 py-3 text-right">الاسم و اللقب</th>
                <th className="px-4 py-3 text-right">رقم الحساب</th>
                <th className="px-4 py-3 text-right">التاريخ</th>
                <th className="px-4 py-3 text-right">المبلغ</th>
                <th className="px-4 py-3 text-right">القسط الشهري</th>
                <th className="px-4 py-3 text-center">موقوف</th>
                <th className="px-4 py-3 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      جاري التحميل...
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    <DollarSign className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={`border-b border-slate-700/50 transition-all hover:bg-purple-500/10 ${
                      index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'
                    }`}
                  >
                    <td className="px-4 py-3 text-white font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-blue-300 font-mono">{row.account}</td>
                    <td className="px-4 py-3 text-slate-300">{row.date}</td>
                    <td className="px-4 py-3 text-emerald-400 font-bold">{row.amount} </td>
                    <td className="px-4 py-3 text-amber-300">{row.montant_mois} </td>
                    <td className="px-4 py-3 text-center">
                      {isClientLocked(row.clientStatus) && (
                        <Lock className="w-5 h-5 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredRows.length > 0 && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-t border-slate-700">
            <div className="flex justify-between items-center text-sm flex-wrap gap-2">
              <div className="text-slate-400">
                عرض {filteredRows.length} عملية
              </div>
              <div className="flex gap-4 flex-wrap">
                <div className="text-emerald-400">
                  الإجمالي: <span className="font-bold text-white">{totalAmount} </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}