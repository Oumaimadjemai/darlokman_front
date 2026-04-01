import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  X, 
  Package, 
  Layers, 
  Hash,
  AlertCircle,
  TrendingUp,
  Building2,
  DollarSign
} from "lucide-react";
import axios from "../../../api/axiosInstance";

export default function InventoryQuantities() {
  const [rows, setRows] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const debounceTimer = useRef(null);

  const [filters, setFilters] = useState({
    search: "",
    reference: "",
    famille: "",
  });

  const [references, setReferences] = useState([]);
  const [familles, setFamilles] = useState([]);

  /** 🔹 Charger la liste des magasins */
  const fetchMagasins = useCallback(async () => {
    try {
      const res = await axios.get("/param/magasins/");
      const magasinsList = res.data.results || [];
      setMagasins(magasinsList);
    } catch (error) {
      console.error("Erreur chargement magasins:", error);
    }
  }, []);

  /** 🔹 Charger la liste des références et familles */
  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await axios.get("/prod/produits/familles/");
      const produits = res.data.familles || [];
      
      const refs = [...new Set(produits.map((p) => p.reference).filter(Boolean))];
      const fams = [...new Set(produits.map((p) => p.famille).filter(Boolean))];
      
      setReferences(refs);
      setFamilles(fams);
    } catch (error) {
      console.error("Erreur chargement références/familles:", error);
    }
  }, []);

  /** 🔹 Charger la comparaison avec filtres */
  const fetchComparison = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.reference) params.reference = filters.reference;
      if (filters.famille) params.famille = filters.famille;

      const res = await axios.get("/prod/comparaison/", { params });
      const data = res.data;
      
      // Handle the new response structure
      let productsData = [];
      if (data.produits) {
        productsData = data.produits;
      } else if (Array.isArray(data)) {
        productsData = data;
      }
      
      setRows(productsData);
      
      // Update magasins if not already set
      if (magasins.length === 0 && productsData.length > 0 && productsData[0].quantites) {
        const magasinsFromData = productsData[0].quantites.map(q => ({
          id: q.magasin_id,
          nom: q.magasin
        }));
        setMagasins(magasinsFromData);
      }
    } catch (error) {
      console.error("Erreur lors du chargement :", error);
      setError("خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [filters, magasins.length]);

  // Charger les options de filtre et magasins au montage
  useEffect(() => {
    fetchMagasins();
    fetchFilterOptions();
  }, [fetchMagasins, fetchFilterOptions]);

  // Debounced fetch when filters change
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      fetchComparison();
    }, 400);
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filters, fetchComparison]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      reference: "",
      famille: "",
    });
  };

  const totalProducts = rows.length;
  const totalQuantity = useMemo(() => {
    return rows.reduce((sum, row) => {
      if (row.quantites) {
        return sum + row.quantites.reduce((s, q) => s + (q.quantite || 0), 0);
      }
      return sum;
    }, 0);
  }, [rows]);

  const getMagasinName = (magasinId) => {
    const magasin = magasins.find(m => m.id === magasinId);
    return magasin ? magasin.nom : "غير معروف";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl text-white">مقارنة المخزون</h1>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              showFilters || filters.search || filters.reference || filters.famille
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            <div className="text-xs text-blue-300">المنتجات:</div>
            <div className="text-lg text-white">{totalProducts}</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <div className="text-xs text-emerald-300">إجمالي الكمية:</div>
            <div className="text-lg text-white">{totalQuantity}</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            <div className="text-xs text-purple-300">المخازن:</div>
            <div className="text-lg text-white">{magasins.length}</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
        <input
          type="text"
          name="search"
          placeholder="البحث عن منتج بالاسم..."
          value={filters.search}
          onChange={handleFilterChange}
          className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500 placeholder-slate-400"
        />
        {filters.search && (
          <button 
            onClick={() => setFilters(prev => ({ ...prev, search: "" }))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">المرجع</label>
              <div className="relative">
                <Hash className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <select
                  name="reference"
                  value={filters.reference}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-amber-500 focus:outline-none appearance-none"
                >
                  <option value="">الكل</option>
                  {references.map((ref, idx) => (
                    <option key={idx} value={ref}>{ref}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">العائلة</label>
              <div className="relative">
                <Layers className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <select
                  name="famille"
                  value={filters.famille}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-amber-500 focus:outline-none appearance-none"
                >
                  <option value="">الكل</option>
                  {familles.map((fam, idx) => (
                    <option key={idx} value={fam}>{fam}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {(filters.search || filters.reference || filters.famille) && (
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

      {/* Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
          <h2 className="text-white text-lg flex items-center gap-2">
            <Package className="w-5 h-5" />
            مقارنة الكميات بين المخازن
            {rows.length > 0 && (
              <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                {rows.length} منتج
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>{error}</p>
            <button 
              onClick={() => fetchComparison()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-2 text-slate-500" />
            <p>لا توجد بيانات</p>
            {(filters.search || filters.reference || filters.famille) && (
              <p className="text-sm mt-2">حاول تعديل معايير البحث</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-800">
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <th className="px-4 py-3 text-right sticky left-0 bg-blue-600 z-10 min-w-[150px]">المرجع</th>
                  <th className="px-4 py-3 text-right sticky left-[150px] bg-blue-600 z-10 min-w-[200px]">الاسم</th>
                  <th className="px-4 py-3 text-right min-w-[150px]">العائلة</th>
                  <th className="px-4 py-3 text-center min-w-[100px]">سعر الشراء</th>
                  <th className="px-4 py-3 text-center min-w-[100px]">سعر البيع</th>
                  {magasins.map((magasin) => (
                    <th key={magasin.id} className="px-4 py-3 text-center min-w-[100px]">
                      {magasin.nom}
                    </th>
                  ))}
                 </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                    className={`border-b border-slate-700/50 transition-all hover:bg-blue-500/10 ${
                      idx % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'
                    }`}
                  >
                    <td className="px-4 py-3 text-blue-300 font-mono sticky left-0 bg-inherit z-10">
                      {row.reference || "-"}
                    </td>
                    <td className="px-4 py-3 text-white font-medium sticky left-[150px] bg-inherit z-10">
                      {row.nom}
                    </td>
                    <td className="px-4 py-3 text-purple-300">
                      {row.famille || "-"}
                    </td>
                    <td className="px-4 py-3 text-amber-300 text-center">
                      {row.prix_achat ? `${row.prix_achat} دج` : "-"}
                    </td>
                    <td className="px-4 py-3 text-emerald-300 text-center">
                      {row.prix_vente_cache ? `${row.prix_vente_cache} دج` : "-"}
                    </td>
                    {row.quantites && row.quantites.map((q, i) => (
                      <td key={i} className="px-4 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                          q.quantite > 0 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {q.quantite}
                        </span>
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        {rows.length > 0 && !loading && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-t border-slate-700">
            <div className="flex justify-between items-center text-sm flex-wrap gap-2">
              <div className="text-slate-400">
                عرض {rows.length} منتج
                {(filters.search || filters.reference || filters.famille) && (
                  <span className="mr-2 text-amber-400">(نتائج الفلترة)</span>
                )}
              </div>
              <div className="flex gap-4">
                <div className="text-emerald-400">
                  إجمالي الكمية: <span className="font-bold text-white">{totalQuantity}</span>
                </div>
                <div className="text-blue-400">
                  إجمالي المنتجات: <span className="font-bold text-white">{totalProducts}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}