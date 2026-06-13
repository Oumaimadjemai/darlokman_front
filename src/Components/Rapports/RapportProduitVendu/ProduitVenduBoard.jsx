import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, Filter, X, Package, TrendingUp, DollarSign, CreditCard, Eye, Phone } from "lucide-react";
import axios from "../../../api/axiosInstance";
import dayjs from "dayjs";

export default function SalesReport() {
  const [filters, setFilters] = useState({
    periode: "this_month",
    date_from: null,
    date_to: null,
    magasins: "",
  });
  const [magasins, setMagasins] = useState([]);
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

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

  // Build query params
  const buildParams = (appliedFilters, includeSearch = true) => {
    let fromDate = appliedFilters.date_from;
    let toDate = appliedFilters.date_to;

    if (fromDate && toDate && dayjs(fromDate).isAfter(dayjs(toDate))) {
      [fromDate, toDate] = [toDate, fromDate];
    }

    const params = {};
    if (appliedFilters.periode) params.periode = appliedFilters.periode;
    if (appliedFilters.magasins) params.magasin = appliedFilters.magasins;
    if (includeSearch && searchTerm) params.search = searchTerm;
    if (fromDate) params.date_from = dayjs(fromDate).format("YYYY-MM-DD");
    if (toDate) params.date_to = dayjs(toDate).format("YYYY-MM-DD");

    return params;
  };

  // Fetch magasins
  useEffect(() => {
    const fetchMagasins = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await axios.get("/param/magasins/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMagasins(res.data.results || []);
      } catch (err) {
        console.error("Erreur lors du chargement des magasins", err);
      }
    };
    fetchMagasins();
  }, []);

  // Fetch all products for stats
  useEffect(() => {
    async function fetchAllData() {
      try {
        const token = localStorage.getItem("access_token");
        const params = buildParams(filters, false);

        const response = await axios.get("/stats/sales-report/", {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });

        const data = response.data;
        
        // Combine installment and cash products
        const allProducts = [...(data.top_products_installment || []), ...(data.top_products_cash || [])];
        
        // Deduplicate by product id
        const uniqueProducts = {};
        allProducts.forEach(product => {
          if (!uniqueProducts[product.id]) {
            uniqueProducts[product.id] = {
              id: product.id,
              reference: product.reference,
              name: product.produit,
              qFacilite: 0,
              qCash: 0,
              magasin: "",
              quantiteActuelle: 0,
            };
          }
          if (data.top_products_installment.some(p => p.id === product.id)) {
            uniqueProducts[product.id].qFacilite = product.quantite_vendue_produit || 0;
          }
          if (data.top_products_cash.some(p => p.id === product.id)) {
            uniqueProducts[product.id].qCash = product.quantite_vendue_produit || 0;
          }
        });

        // Get all products from API to include those with zero sales
        const allProductsRes = await axios.get("/prod/produits/", {
          headers: { Authorization: `Bearer ${token}` },
          params: { page_size: 1000 },
        });
        
        const allProductsList = allProductsRes.data.results || [];
        
        allProductsList.forEach(product => {
          if (!uniqueProducts[product.id]) {
            uniqueProducts[product.id] = {
              id: product.id,
              reference: product.reference || "",
              name: product.nom,
              qFacilite: 0,
              qCash: 0,
              magasin: product.magasin_principal_detail?.nom || "",
              quantiteActuelle: product.quantite_totale || 0,
            };
          } else {
            uniqueProducts[product.id].magasin = product.magasin_principal_detail?.nom || "";
            uniqueProducts[product.id].quantiteActuelle = product.quantite_totale || 0;
          }
        });

        const formattedRows = Object.values(uniqueProducts).sort((a, b) => b.id - a.id);
        setAllRows(formattedRows);
      } catch (err) {
        console.error("Error fetching all products:", err);
      }
    }

    fetchAllData();
  }, [filters]);

  // Fetch filtered data for display
  useEffect(() => {
    async function fetchFilteredData() {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const params = buildParams(filters, true);

        const response = await axios.get("/stats/sales-report/", {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });

        const data = response.data;
        
        // Get all products that match search
        const productsRes = await axios.get("/prod/produits/", {
          headers: { Authorization: `Bearer ${token}` },
          params: { search: searchTerm || undefined, page_size: 1000 },
        });
        
        const products = productsRes.data.results || [];
        
        // Create lookup maps for sales data
        const installmentMap = {};
        const cashMap = {};
        
        (data.top_products_installment || []).forEach(p => {
          installmentMap[p.id] = p.quantite_vendue_produit || 0;
        });
        
        (data.top_products_cash || []).forEach(p => {
          cashMap[p.id] = p.quantite_vendue_produit || 0;
        });
        
        const formattedRows = products.map(product => ({
          id: product.id,
          reference: product.reference || "",
          name: product.nom,
          qFacilite: installmentMap[product.id] || 0,
          qCash: cashMap[product.id] || 0,
          magasin: product.magasin_principal_detail?.nom || "غير محدد",
          magasinId: product.magasin_principal_detail?.id || null,
          quantiteActuelle: product.quantite_totale || 0,
        })).sort((a, b) => b.id - a.id);
        
        setRows(formattedRows);
      } catch (err) {
        console.error("Error fetching filtered products:", err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    const debounce = setTimeout(fetchFilteredData, 500);
    return () => clearTimeout(debounce);
  }, [filters, searchTerm]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      periode: "this_month",
      date_from: null,
      date_to: null,
      magasins: "",
    });
    setSearchTerm("");
  };

  const handleProductClick = async (productId) => {
    setDialogOpen(true);
    setLoadingProduct(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`/stats/product/${productId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedProduct(response.data);
    } catch (err) {
      console.error("Error loading product details:", err);
    } finally {
      setLoadingProduct(false);
    }
  };

  // Calculate totals from allRows
  const totalQuantity = allRows.reduce((sum, row) => sum + (row.qCash + row.qFacilite), 0);
  const totalCash = allRows.reduce((sum, row) => sum + row.qCash, 0);
  const totalInstallment = allRows.reduce((sum, row) => sum + row.qFacilite, 0);
  const totalCurrentStock = allRows.reduce((sum, row) => sum + (row.quantiteActuelle || 0), 0);
  const filteredCount = rows.length;

  const formatNumber = (num) => {
    if (num === undefined || num === null) return "0";
    return Number(num);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl text-white">تقرير السلع</h1>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              showFilters || filters.periode !== "this_month" || filters.magasins || filters.date_from || filters.date_to || searchTerm
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <TrendingUp className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">{formatNumber(totalQuantity)}</span>
          </div>
          <p className="text-slate-400 mt-2">إجمالي المبيعات</p>
        </div>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <DollarSign className="w-8 h-8 text-emerald-400" />
            <span className="text-2xl font-bold text-white">{formatNumber(totalCash)}</span>
          </div>
          <p className="text-slate-400 mt-2">مبيعات كاش</p>
        </div>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <CreditCard className="w-8 h-8 text-amber-400" />
            <span className="text-2xl font-bold text-white">{formatNumber(totalInstallment)}</span>
          </div>
          <p className="text-slate-400 mt-2">مبيعات تقسيط</p>
        </div>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <Package className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">{formatNumber(totalCurrentStock)}</span>
          </div>
          <p className="text-slate-400 mt-2">المخزون الحالي</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
        <input
          type="text"
          placeholder="البحث عن منتج بالاسم أو المرجع..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-3 text-sm outline-none focus:border-amber-500 placeholder-slate-400"
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
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/50 rounded-lg p-4 border border-amber-500/30"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-sm text-slate-400 mb-1">المحل</label>
              <select
                name="magasins"
                value={filters.magasins}
                onChange={handleFilterChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="">الكل</option>
                {magasins.map(mag => (
                  <option key={mag.id} value={mag.id}>{mag.nom}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
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
          </div>
          {(filters.periode !== "this_month" || filters.magasins || filters.date_from || filters.date_to) && (
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

      {/* Products Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
          <h2 className="text-white text-lg flex items-center gap-2">
            <Package className="w-5 h-5" />
            قائمة المنتجات
            {searchTerm && (
              <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                نتائج البحث: "{searchTerm}" ({filteredCount} منتج)
              </span>
            )}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                <th className="px-4 py-3 text-right">الرقم</th>
                <th className="px-4 py-3 text-right">المرجع</th>
                <th className="px-4 py-3 text-right">الاسم</th>
                <th className="px-4 py-3 text-right">المحل</th>
                <th className="px-4 py-3 text-right">المخزون الحالي</th>
                <th className="px-4 py-3 text-center">المبيعات</th>
                <th className="px-4 py-3 text-center">الإجراءات</th>
               </tr>
              <tr className="bg-slate-700/50">
                <th colSpan="5" className="px-4 py-2"></th>
                <th className="px-4 py-2 text-center">
                  <div className="grid grid-cols-2 gap-0">
                    <div className="border-l border-slate-500 text-emerald-300">كاش</div>
                    <div className="text-amber-300">تقسيط</div>
                  </div>
                </th>
                <th className="px-4 py-2"></th>
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
              ) : rows.length === 0 ? (
                 <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                    <p>لا توجد منتجات تطابق البحث "{searchTerm}"</p>
                  </td>
                 </tr>
              ) : (
                rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={`border-b border-slate-700/50 transition-all hover:bg-purple-500/10 ${
                      index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'
                    }`}
                  >
                    <td className="px-4 py-3 text-purple-300">{row.id}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs">{row.reference}</td>
                    <td className="px-4 py-3 text-white font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-blue-300">{row.magasin}</td>
                    <td className="px-4 py-3 text-emerald-300 font-bold">{formatNumber(row.quantiteActuelle)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="grid grid-cols-2 gap-0">
                        <div className="text-emerald-400 font-medium border-l border-slate-600">{formatNumber(row.qCash)}</div>
                        <div className="text-amber-400 font-medium">{formatNumber(row.qFacilite)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleProductClick(row.id)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-all"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {rows.length > 0 && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-t border-slate-700">
            <div className="flex justify-between items-center text-sm flex-wrap gap-2">
              <div className="text-slate-400">
                عرض {rows.length} من {allRows.length} منتج
              </div>
              <div className="flex gap-4 flex-wrap">
                <div className="text-emerald-400">
                  إجمالي مبيعات كاش: <span className="font-bold text-white">{formatNumber(totalCash)}</span>
                </div>
                <div className="text-amber-400">
                  إجمالي مبيعات تقسيط: <span className="font-bold text-white">{formatNumber(totalInstallment)}</span>
                </div>
                <div className="text-purple-400">
                  إجمالي المبيعات: <span className="font-bold text-white">{formatNumber(totalQuantity)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Detail Dialog */}
      <AnimatePresence>
        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-xl w-[800px] max-h-[90vh] overflow-hidden shadow-2xl border border-purple-500/30"
            >
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex justify-between items-center">
                <h2 className="text-white text-xl font-bold">تفاصيل المنتج</h2>
                <button
                  onClick={() => {
                    setDialogOpen(false);
                    setSelectedProduct(null);
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-1 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(90vh-130px)] p-6">
                {loadingProduct ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : selectedProduct ? (
                  <ProductDetailDialog product={selectedProduct} />
                ) : (
                  <div className="text-center py-12 text-red-400">فشل تحميل تفاصيل المنتج</div>
                )}
              </div>
              <div className="border-t border-slate-700 px-6 py-4 flex justify-end">
                <button
                  onClick={() => {
                    setDialogOpen(false);
                    setSelectedProduct(null);
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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

  const formatNumber = (num) => {
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
          <div><span className="text-slate-400">الاسم:</span> <span className="text-white">{product.nom}</span></div>
          <div><span className="text-slate-400">المرجع:</span> <span className="text-white">{product.reference || "-"}</span></div>
          <div><span className="text-slate-400">العائلة:</span> <span className="text-white">{product.famille || "-"}</span></div>
          <div><span className="text-slate-400">العلامة:</span> <span className="text-white">{product.marque || "-"}</span></div>
          <div><span className="text-slate-400">المخزون الحالي:</span> <span className="text-blue-300">{formatNumber(product.quantite)}</span></div>
          <div><span className="text-slate-400">سعر الشراء:</span> <span className="text-amber-300">{formatMoney(product.prix_achat)} دج</span></div>
          <div><span className="text-slate-400">سعر البيع كاش:</span> <span className="text-emerald-300">{formatMoney(product.prix_vente_cache)} دج</span></div>
          <div><span className="text-slate-400">إجمالي مبيعات (تقسيط):</span> <span className="text-purple-300">{formatMoney(product.total_facilite)} دج</span></div>
          <div><span className="text-slate-400">إجمالي مبيعات (كاش):</span> <span className="text-emerald-300">{formatMoney(product.total_cash)} دج</span></div>
          <div><span className="text-slate-400">الكمية المباعة (تقسيط):</span> <span className="text-amber-300">{formatNumber(product.quantite_facilite)}</span></div>
          <div><span className="text-slate-400">الكمية المباعة (كاش):</span> <span className="text-emerald-300">{formatNumber(product.quantite_cash)}</span></div>
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
                  <td className="px-4 py-2 text-blue-300">{formatNumber(vente.quantite)}</td>
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
                  <td className="px-4 py-2 text-blue-300">{formatNumber(vente.quantite)}</td>
                  <td className="px-4 py-2 text-emerald-300">{formatMoney(vente.montant_total)} دج</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {activeTab === 1 && (!product.ventes_facilite || product.ventes_facilite.length === 0) && (
        <div className="text-center py-8 text-slate-400">
          <p>لا توجد مبيعات بالتقسيط لهذا المنتج</p>
        </div>
      )}
      
      {activeTab === 2 && (!product.ventes_cash || product.ventes_cash.length === 0) && (
        <div className="text-center py-8 text-slate-400">
          <p>لا توجد مبيعات كاش لهذا المنتج</p>
        </div>
      )}
    </div>
  );
}