import React, { useEffect, useState } from "react";
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Tooltip,
  Pagination,
  Alert,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import Grid from "@mui/material/GridLegacy";
import { Sparkles, MessageCircle, X, Package, AlertCircle, CheckCircle, TrendingUp, Store, Eye, EyeOff, Shield, Calendar, UserPlus, UserIcon, DollarSign, CreditCard, PackageIcon, TrendingDown, DollarSignIcon, BarChartIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from "../../api/axiosInstance";
import ChatComponent from "../Chat/ChatComponent";
import { toast } from 'sonner';

const COLORS = ["#4F46E5", "#3B82F6", "#93C5FD", "#F59E0B", "#10B981", "#EF4444"];

export function Dashboard() {
  const [users, setUsers] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [filters, setFilters] = useState({
    users: "",
    periode: "this_month",
    year: new Date().getFullYear().toString(),
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  
  // Get user role from localStorage
  const userRole = localStorage.getItem("role");
  const isAdmin = userRole === "admin";

  // Dashboard data states
  const [totalClients, setTotalClients] = useState(0);
  const [newClients, setNewClients] = useState(0);
  const [totalFacilite, setTotalFacilite] = useState(0);
  const [totalCash, setTotalCash] = useState(0);
  const [totalMontantFacilite, setTotalMontantFacilite] = useState(0);
  const [totalMontantCash, setTotalMontantCash] = useState(0);
  const [totalMontantDepense, setTotalMontantDepense] = useState(0);
  const [valeurProduit, setValeurProduit] = useState(0);
  const [Benefit, setBenefit] = useState(0);
  const [productFamilies, setProductFamilies] = useState([]);
  const [barChartData, setBarChartData] = useState([]);
  const [lineChartData, setLineChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Inventory data states
  const [inventories, setInventories] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryTotalPages, setInventoryTotalPages] = useState(1);
  const [magasinsMap, setMagasinsMap] = useState({});
  const [inventoryStats, setInventoryStats] = useState({
    total_sessions: 0,
    total_products_counted: 0,
    total_ecart: 0,
    recent_sessions: 0
  });

  // Circle progress calculations
  const percentage = Benefit || 0;
  const radius = 60;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const offset = circumference * (1 - percentage / 100);

  // Format money function
  const formatMoney = (amountInDA) => {
    if (!isAdmin && !showSensitiveData) return "••••••";
    if (!amountInDA || amountInDA === 0) return "0";

    const centimes = amountInDA * 100;

    if (centimes >= 1_000_000_000) {
      const milliards = centimes / 1_000_000_000;
      return milliards % 1 === 0
        ? milliards + " مليار"
        : milliards.toFixed(1).replace(/\.0$/, "") + " مليار";
    } else if (centimes >= 1_000_000) {
      const millions = centimes / 1_000_000;
      return millions % 1 === 0
        ? millions + " مليون"
        : millions.toFixed(1).replace(/\.0$/, "") + " مليون";
    } else if (centimes >= 1_000) {
      const thousands = centimes / 1_000;
      return thousands % 1 === 0
        ? thousands + " ألف"
        : thousands.toFixed(1).replace(/\.0$/, "") + " ألف";
    } else {
      return Math.round(centimes) + "";
    }
  };

  // Format number for counts (no decimals)
  const formatNumber = (num) => {
    if (!num || num === 0) return "0";
    if (num >= 1_000_000) {
      const millions = num / 1_000_000;
      if (millions % 1 === 0) {
        return millions + " مليون";
      } else {
        return millions.toFixed(1).replace(/\.0$/, '') + " مليون";
      }
    } else if (num >= 1_000) {
      const thousands = num / 1_000;
      if (thousands % 1 === 0) {
        return thousands + " ألف";
      } else {
        return thousands.toFixed(1).replace(/\.0$/, '') + " ألف";
      }
    } else {
      return num.toString();
    }
  };

  // Generate available years (from 2020 to current year + 1)
  const generateAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2020; year <= currentYear + 1; year++) {
      years.push(year.toString());
    }
    return years;
  };

  // Fetch all magasins to create a mapping
  const fetchMagasins = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get("/param/magasins/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const magasins = response.data.results || [];
      const map = {};
      magasins.forEach(magasin => {
        map[magasin.id] = magasin.nom;
      });
      setMagasinsMap(map);
    } catch (error) {
      console.error("Error fetching magasins:", error);
    }
  };

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get("/chat/unread/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // Fetch inventory data
  const fetchInventoryData = async () => {
    setInventoryLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get("/api/inventaire/sessions/", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: inventoryPage, page_size: 5 }
      });
      
      const data = response.data;
      const sessions = data.results || [];
      
      const magasinIds = [...new Set(sessions.map(s => s.magasin).filter(id => id && !magasinsMap[id]))];
      if (magasinIds.length > 0) {
        await fetchMagasins();
      }
      
      const sessionsWithStats = sessions.map(session => ({
        ...session,
        stats: session.stats || {
          total_products_counted: 0,
          total_ecart: 0
        }
      }));
      
      setInventories(sessionsWithStats);
      setInventoryTotalPages(Math.ceil((data.count || 0) / 5));
      
      let totalProductsCounted = 0;
      let totalEcart = 0;
      let recentCount = 0;
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      sessionsWithStats.forEach(session => {
        const sessionDate = new Date(session.date_debut);
        if (sessionDate >= oneWeekAgo) {
          recentCount++;
        }
        totalProductsCounted += session.stats?.total_products_counted || 0;
        totalEcart += Math.abs(session.stats?.total_ecart || 0);
      });
      
      setInventoryStats({
        total_sessions: data.count || 0,
        total_products_counted: totalProductsCounted,
        total_ecart: totalEcart,
        recent_sessions: recentCount
      });
      
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      toast.error("فشل تحميل بيانات الجرد");
    } finally {
      setInventoryLoading(false);
    }
  };

  // Fetch users
  useEffect(() => {
    axios
      .get("auth/users")
      .then((res) => {
        setUsers(res.data.results || []);
      })
      .catch((err) => console.error("Failed to fetch users", err));
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize available years
  useEffect(() => {
    setAvailableYears(generateAvailableYears());
  }, []);

  // Fetch magasins on mount
  useEffect(() => {
    fetchMagasins();
  }, []);

  // Fetch dashboard data when filters change
  useEffect(() => {
    fetchDashboardData(filters);
  }, [filters]);

  // Fetch inventory data on mount and page change
  useEffect(() => {
    fetchInventoryData();
  }, [inventoryPage]);

  const handleUserChange = (event) => {
    setFilters((prev) => ({ ...prev, users: event.target.value || "" }));
  };

  const handlePeriodeChange = (event) => {
    const newPeriode = event.target.value || "this_month";
    // When period changes, keep the current year
    setFilters((prev) => ({ 
      ...prev, 
      periode: newPeriode
    }));
  };

  const handleYearChange = (event) => {
    const newYear = event.target.value || new Date().getFullYear().toString();
    setFilters((prev) => ({ ...prev, year: newYear }));
  };

  const fetchDashboardData = (filters) => {
    setLoading(true);
    
    const params = new URLSearchParams();
    if (filters.users) params.append('user', filters.users);
    if (filters.periode) params.append('periode', filters.periode);
    // UNCOMMENTED: Always send year parameter
    if (filters.year) params.append('year', filters.year);
    
    console.log("Fetching dashboard with params:", params.toString());
    console.log("Period:", filters.periode);
    console.log("Year:", filters.year);
    
    axios
      .get(`/stats/dashboard/?${params.toString()}`, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      .then((res) => {
        const data = res.data;
        
        console.log("Full API Response:", data);
        console.log("Total Clients:", data.total_clients);
        console.log("New Clients:", data.new_clients);
        console.log("Selected Year:", data.selected_year);
        console.log("Date Range:", data.date_range);
        
        setTotalClients(data.total_clients);
        setNewClients(data.new_clients || 0);
        setTotalFacilite(data.total_facilite_sales);
        setTotalMontantFacilite(data.total_facilite_amount);
        setTotalCash(data.total_cash_sales);
        setTotalMontantCash(data.total_cash_amount);
        setValeurProduit(data.total_product_value);
        setTotalMontantDepense(data.total_expenses);
        setBenefit(data.profit_percentage);
        setBarChartData(data.sales_by_user);
        setLineChartData(data.monthly_profits);
        setProductFamilies(data.product_families);
        
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard data", err);
        setLoading(false);
        toast.error("فشل تحميل بيانات لوحة المعلومات");
      });
  };

  const getMagasinName = (magasinId) => {
    if (!magasinId) return '-';
    return magasinsMap[magasinId] || `مخزن ${magasinId}`;
  };

  // Get period label for new clients card
  const getPeriodLabel = () => {
    const periodMap = {
      'today': 'اليوم',
      'yesterday': 'أمس',
      'this_week': 'هذا الأسبوع',
      'this_month': 'هذا الشهر',
      'last_month': 'الشهر الماضي',
      'this_year': 'هذه السنة'
    };
    return periodMap[filters.periode] || filters.periode;
  };

  // Get full period description with year
  const getPeriodDescription = () => {
    const periodLabel = getPeriodLabel();
    if (filters.year) {
      return `خلال ${periodLabel} ${filters.year}`;
    }
    return `خلال ${periodLabel}`;
  };

  // Cards configuration with visibility based on role
  const cards = [
    { 
      title: "الزبائن", 
      value: formatNumber(totalClients), 
      icon: <UserIcon className="w-5 h-5" />, 
      color: "from-amber-500 to-yellow-600", 
      sensitive: false,
      subtitle: "إجمالي الزبائن"
    },
    { 
      title: `زبائن جدد (${getPeriodLabel()})`, 
      value: formatNumber(newClients), 
      icon: <UserPlus className="w-5 h-5" />, 
      color: "from-emerald-500 to-green-600", 
      sensitive: false,
      subtitle: getPeriodDescription()
    },
    { 
      title: "البيع بالتقسيط", 
      value: formatNumber(totalFacilite), 
      icon: <BarChartIcon className="w-5 h-5" />, 
      color: "from-red-500 to-red-600", 
      sensitive: false 
    },
    { 
      title: "قيمة التقسيط", 
      value: formatMoney(totalMontantFacilite), 
      icon: <DollarSignIcon className="w-5 h-5" />, 
      color: "from-rose-500 to-red-600", 
      sensitive: true 
    },
    { 
      title: "البيع نقدا", 
      value: formatNumber(totalCash), 
      icon: <DollarSign className="w-5 h-5" />, 
      color: "from-indigo-500 to-indigo-600", 
      sensitive: false 
    },
    { 
      title: "قيمة النقد", 
      value: formatMoney(totalMontantCash), 
      icon: <CreditCard className="w-5 h-5" />, 
      color: "from-indigo-500 to-indigo-600", 
      sensitive: true 
    },
    { 
      title: "قيمة السلع", 
      value: formatMoney(valeurProduit), 
      icon: <PackageIcon className="w-5 h-5" />, 
      color: "from-green-500 to-green-600", 
      sensitive: true 
    },
    { 
      title: "المصاريف", 
      value: formatMoney(totalMontantDepense), 
      icon: <TrendingDown className="w-5 h-5" />, 
      color: "from-orange-500 to-orange-600", 
      sensitive: true 
    },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 p-4"
      >
        {/* Header with Title, Chat Icon, and Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-6 h-6 text-amber-400" />
            </motion.div>
            <h1 className="text-2xl text-white">لوحة المعلومات</h1>
            {!isAdmin && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-amber-400">عرض محدود</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 items-center">
            {/* Toggle sensitive data visibility (only for non-admin) */}
            {!isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-all"
              >
                {showSensitiveData ? (
                  <>
                    <EyeOff className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-white">إخفاء البيانات المالية</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-white">عرض البيانات المالية</span>
                  </>
                )}
              </motion.button>
            )}

            {/* Chat Icon with Notification Badge */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconButton 
                onClick={() => setChatOpen(true)}
                sx={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  '&:hover': {
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                  }
                }}
              >
                <Badge 
                  badgeContent={unreadCount} 
                  color="error"
                  overlap="circular"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#ef4444',
                      color: 'white',
                      fontSize: '10px',
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '10px',
                    }
                  }}
                >
                  <MessageCircle className="w-5 h-5 text-amber-400" />
                </Badge>
              </IconButton>
            </motion.div>

            {/* Year Filter - Always visible and enabled */}
            <FormControl size="small" sx={{ minWidth: 120, backgroundColor: 'rgba(15, 23, 42, 0.7)', borderRadius: 2 }}>
              <Select 
                value={filters.year || new Date().getFullYear().toString()} 
                onChange={handleYearChange}
                displayEmpty
                sx={{ 
                  color: 'white', 
                  height: '40px',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(245, 158, 11, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(245, 158, 11, 0.5)' },
                }}
                startAdornment={<Calendar className="w-4 h-4 text-amber-400 ml-2" />}
              >
                {availableYears.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* User Filter */}
            <FormControl size="small" sx={{ minWidth: 180, backgroundColor: 'rgba(15, 23, 42, 0.7)', borderRadius: 2 }}>
              <Select 
                value={filters.users || ""} 
                onChange={handleUserChange}
                displayEmpty
                sx={{ 
                  color: 'white', 
                  height: '40px',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(245, 158, 11, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(245, 158, 11, 0.5)' },
                }}
              >
                <MenuItem value="">كل المستخدمين</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Period Filter */}
            <FormControl size="small" sx={{ minWidth: 150, backgroundColor: 'rgba(15, 23, 42, 0.7)', borderRadius: 2 }}>
              <Select 
                value={filters.periode || "this_month"} 
                onChange={handlePeriodeChange}
                sx={{ 
                  color: 'white', 
                  height: '40px',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(245, 158, 11, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(245, 158, 11, 0.5)' },
                }}
              >
                <MenuItem value="today">اليوم</MenuItem>
                <MenuItem value="yesterday">أمس</MenuItem>
                <MenuItem value="this_week">هذا الأسبوع</MenuItem>
                <MenuItem value="this_month">هذا الشهر</MenuItem>
                <MenuItem value="last_month">الشهر السابق</MenuItem>
                <MenuItem value="this_year">هذه السنة</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -3 }}
              className={`bg-gradient-to-br ${card.color} rounded-xl p-3 shadow-lg hover:shadow-xl transition-all ${card.sensitive && !isAdmin && !showSensitiveData ? 'opacity-75' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl">{card.icon}</span>
                <span className="text-xs font-medium text-white/90">{card.title}</span>
              </div>
              <div className="text-xl font-bold text-white truncate">
                {card.sensitive && !isAdmin && !showSensitiveData ? '••••••' : card.value}
              </div>
              {card.subtitle && (
                <div className="text-[10px] text-white/60 mt-0.5 truncate">
                  {card.subtitle}
                </div>
              )}
              {card.sensitive && !isAdmin && !showSensitiveData && (
                <div className="text-xs text-white/50 mt-1">متاح للمدير فقط</div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Inventory Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-purple-400" />
              <div className="text-xs text-purple-300">جلسات الجرد</div>
            </div>
            <div className="text-2xl font-bold text-white mt-2">{formatNumber(inventoryStats.total_sessions)}</div>
          </div>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              <div className="text-xs text-blue-300">المنتجات المجرودة</div>
            </div>
            <div className="text-2xl font-bold text-white mt-2">{formatNumber(inventoryStats.total_products_counted)}</div>
          </div>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <div className="text-xs text-amber-300">الفارق الكلي</div>
            </div>
            <div className={`text-2xl font-bold mt-2 ${inventoryStats.total_ecart > 0 ? 'text-emerald-400' : inventoryStats.total_ecart < 0 ? 'text-red-400' : 'text-white'}`}>
              {inventoryStats.total_ecart > 0 ? `+${formatNumber(inventoryStats.total_ecart)}` : formatNumber(inventoryStats.total_ecart)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-cyan-400" />
              <div className="text-xs text-cyan-300">جلسات الأسبوع</div>
            </div>
            <div className="text-2xl font-bold text-white mt-2">{inventoryStats.recent_sessions}</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Left Column - Percentage and Pie Chart */}
          <Grid item xs={6}>
            <Grid container spacing={3}>
              {/* Percentage Card */}
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-6 flex justify-center items-center"
                  style={{ height: '300px' }}
                >
                  {!isAdmin && !showSensitiveData ? (
                    <div className="text-center">
                      <Shield className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                      <p className="text-amber-400 text-sm">بيانات الفائدة محمية</p>
                      <p className="text-slate-400 text-xs mt-2">متاحة للمدير فقط</p>
                    </div>
                  ) : (
                    <Box sx={{ position: "relative", width: 220, height: 220 }}>
                      <svg width="220" height="220" viewBox="0 0 220 220">
                        <defs>
                          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1E3A8A" />
                            <stop offset="50%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#93C5FD" />
                          </linearGradient>
                        </defs>

                        <circle
                          cx="110"
                          cy="110"
                          r={normalizedRadius + 15}
                          stroke="#334155"
                          strokeWidth={strokeWidth}
                          fill="none"
                        />

                        <circle
                          cx="110"
                          cy="110"
                          r={normalizedRadius + 15}
                          stroke="url(#blueGradient)"
                          strokeWidth={strokeWidth}
                          fill="none"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                          transform="rotate(-90 110 110)"
                        />
                      </svg>

                      <Box
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          textAlign: "center",
                        }}
                      >
                        <div className="text-sm text-amber-300 mb-1">نسبة الفائدة</div>
                        <div className="text-4xl font-bold text-white">{percentage}%</div>
                      </Box>
                    </Box>
                  )}
                </motion.div>
              </Grid>

              {/* Pie Chart */}
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4"
                  style={{ height: '400px' }}
                >
                  <h3 className="text-amber-400 text-lg mb-3 text-center">توزيع قيمة السلع حسب العائلة</h3>
                  {!isAdmin && !showSensitiveData ? (
                    <div className="flex flex-col items-center justify-center h-80">
                      <Shield className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                      <p className="text-amber-400 text-sm text-center">قيمة السلع محمية</p>
                      <p className="text-slate-400 text-xs text-center mt-2">متاحة للمدير فقط</p>
                    </div>
                  ) : productFamilies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-80">
                      <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">لا توجد بيانات</p>
                    </div>
                  ) : (
                    <Box sx={{ height: 320 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={productFamilies}
                            cx="50%"
                            cy="50%"
                            outerRadius={110}
                            innerRadius={50}
                            dataKey="value"
                            nameKey="name"
                            labelLine={false}
                            label={({ name, percent }) => 
                              percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                            }
                          >
                            {productFamilies.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]}
                                stroke="#0f172a"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value) => formatMoney(value)}
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #f59e0b',
                              borderRadius: '8px',
                              color: '#fff',
                              direction: 'rtl'
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ 
                              color: '#fff',
                              direction: 'rtl',
                              fontSize: '12px'
                            }}
                            layout="horizontal"
                            align="center"
                            verticalAlign="bottom"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </motion.div>
              </Grid>
            </Grid>
          </Grid>

          {/* Right Column - Bar Chart and Line Chart */}
          <Grid item xs={6}>
            <Grid container spacing={3}>
              {/* Bar Chart */}
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4"
                  style={{ height: '340px' }}
                >
                  <h3 className="text-amber-400 text-lg mb-2">
                    المبيعات والفائدة بالتقسيط
                    {filters.year && (
                      <span className="text-sm text-slate-400 mr-2">({filters.year})</span>
                    )}
                  </h3>
                  {!isAdmin && !showSensitiveData ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <Shield className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                      <p className="text-amber-400 text-sm text-center">بيانات المبيعات محمية</p>
                      <p className="text-slate-400 text-xs text-center mt-2">متاحة للمدير فقط</p>
                    </div>
                  ) : barChartData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">لا توجد بيانات</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#d97706" tick={{ fontSize: 12 }} />
                        <YAxis 
                          stroke="#d97706"
                          tickFormatter={(val) => formatMoney(val / 100)}
                          tick={{ fontSize: 12 }}
                        />
                        <RechartsTooltip
                          formatter={(value) => formatMoney(value / 100)}
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #f59e0b',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Legend wrapperStyle={{ color: '#fff', fontSize: '12px' }} />
                        <Bar dataKey="المبيعات" fill="#3b82f6" />
                        <Bar dataKey="الفائدة" fill="#06b6d4" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </motion.div>
              </Grid>

              {/* Line Chart */}
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.01 }}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4"
                  style={{ height: '340px' }}
                >
                  <h3 className="text-amber-400 text-lg mb-2 text-right">
                    إجمالي الأرباح الشهرية بالتقسيط
                    {filters.year && (
                      <span className="text-sm text-slate-400 mr-2">({filters.year})</span>
                    )}
                  </h3>
                  {!isAdmin && !showSensitiveData ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <Shield className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                      <p className="text-amber-400 text-sm text-center">بيانات الأرباح محمية</p>
                      <p className="text-slate-400 text-xs text-center mt-2">متاحة للمدير فقط</p>
                    </div>
                  ) : lineChartData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">لا توجد بيانات</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart 
                        data={lineChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#d97706" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          interval={0}
                        />
                        <YAxis 
                          stroke="#d97706"
                          tickFormatter={(val) => formatMoney(val / 100)}
                          tick={{ fontSize: 12 }}
                        />
                        <RechartsTooltip
                          formatter={(value) => formatMoney(value / 100)}
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #f59e0b',
                            borderRadius: '8px',
                            color: '#fff',
                            direction: 'rtl'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ color: '#fff', fontSize: '12px' }}
                          layout="horizontal"
                          verticalAlign="top"
                          align="center"
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          name="الأرباح"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ 
                            fill: '#3b82f6', 
                            r: 6,
                            strokeWidth: 2,
                            stroke: '#fff'
                          }}
                          activeDot={{ 
                            r: 8, 
                            strokeWidth: 2, 
                            stroke: '#fff',
                            fill: '#f59e0b'
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </motion.div>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Inventory Table Section */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-white" />
              <h2 className="text-white text-lg">سجل جرد المخزون</h2>
            </div>
            <Tooltip title="آخر عمليات الجرد">
              <Chip 
                label={`${inventoryStats.recent_sessions} جلسة هذا الأسبوع`} 
                size="small" 
                sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </Tooltip>
          </div>
          
          <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
            <Table sx={{ minWidth: 650 }} aria-label="inventory table">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>المخزن</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>تاريخ البداية</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>تاريخ النهاية</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>المنتجات المجرودة</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الفارق الكلي</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>الحالة</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>بواسطة</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventoryLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={40} sx={{ color: '#9c27b0' }} />
                    </TableCell>
                  </TableRow>
                ) : inventories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#9ca3af' }}>
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      لا توجد عمليات جرد
                    </TableCell>
                  </TableRow>
                ) : (
                  inventories.map((inventory, index) => (
                    <TableRow 
                      key={inventory.id} 
                      sx={{ 
                        '&:hover': { backgroundColor: 'rgba(156, 39, 176, 0.1)' },
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <TableCell sx={{ color: '#c084fc' }}>{(inventoryPage - 1) * 5 + index + 1}</TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-purple-400" />
                          {getMagasinName(inventory.magasin)}
                        </div>
                      </TableCell>
                      <TableCell sx={{ color: '#93c5fd' }}>
                        {new Date(inventory.date_debut).toLocaleDateString('ar-DZ')}
                      </TableCell>
                      <TableCell sx={{ color: '#93c5fd' }}>
                        {inventory.date_fin ? new Date(inventory.date_fin).toLocaleDateString('ar-DZ') : 'قيد التنفيذ'}
                      </TableCell>
                      <TableCell sx={{ color: '#6ee7b7' }}>
                        {inventory.stats?.total_products_counted || 0}
                      </TableCell>
                      <TableCell sx={{ color: inventory.stats?.total_ecart > 0 ? '#6ee7b7' : inventory.stats?.total_ecart < 0 ? '#f87171' : '#d1d5db' }}>
                        {inventory.stats?.total_ecart > 0 ? `+${inventory.stats.total_ecart}` : inventory.stats?.total_ecart || 0}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={inventory.date_fin ? 'مكتمل' : 'قيد التنفيذ'} 
                          size="small"
                          color={inventory.date_fin ? 'success' : 'warning'}
                          sx={{ fontWeight: 'medium' }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#d1d5db' }}>
                        {inventory.compteur_par || inventory.user?.username || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          {inventoryTotalPages > 1 && (
            <div className="flex justify-center py-4 border-t border-slate-700">
              <Pagination 
                count={inventoryTotalPages} 
                page={inventoryPage} 
                onChange={(e, value) => setInventoryPage(value)}
                color="secondary"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: 'white',
                  },
                  '& .Mui-selected': {
                    backgroundColor: '#9c27b0',
                    color: 'white',
                  }
                }}
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Chat Modal - Full Screen */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl"
          >
            <div className="relative h-full flex flex-col">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 flex justify-between items-center">
                <h2 className="text-white text-xl font-semibold flex items-center gap-2">
                  <MessageCircle className="w-6 h-6" />
                  المحادثات
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Chat Component */}
              <div className="flex-1 overflow-hidden">
                <ChatComponent />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}