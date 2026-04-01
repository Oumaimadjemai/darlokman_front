import { useState, useEffect } from 'react';
import { ArrowRightLeft, Plus, FileSpreadsheet, Edit, Trash2, Filter, X, Search, Calendar, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from '../../api/axiosInstance';
import ConfirmationDialog from '../Cards/ConfirmationDialog';
import AddTransfertDialog from './AddTransfertDialog';

export function TransfersList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [magasins, setMagasins] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    magasin_source: '',
    magasin_destination: '',
    date_exact: null,
  });
  
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  };

  // Fetch magasins
  useEffect(() => {
    axios
      .get("param/magasins/", { headers })
      .then((res) => setMagasins(res.data.results || []))
      .catch((err) => console.error("Erreur chargement magasins", err));
  }, []);

  // Fetch transfers with filters
  const fetchTransfers = async () => {
    setLoading(true);
    const params = {};
    
    if (searchTerm) params.search = searchTerm;
    if (filters.magasin_source) params.magasin_source = filters.magasin_source;
    if (filters.magasin_destination) params.magasin_destination = filters.magasin_destination;
    if (filters.date_exact) params.date = filters.date_exact;

    try {
      const response = await axios.get(`trans/transferts/`, { headers, params });
      setTransfers(response.data.results || []);
    } catch (err) {
      console.error("Erreur lors du chargement des transferts :", err);
      toast.error("خطأ في تحميل التحويلات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTransfers();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      magasin_source: '',
      magasin_destination: '',
      date_exact: null,
    });
    setSearchTerm('');
  };

  const handleDelete = (id) => {
    setSelectedId(id);
    setOpenConfirmationDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/trans/transferts/${selectedId}/`, { headers });
      toast.success("تم حذف التحويل بنجاح");
      fetchTransfers();
    } catch (err) {
      console.error(err);
      toast.error("فشل حذف التحويل");
    } finally {
      setOpenConfirmationDialog(false);
      setSelectedId(null);
    }
  };

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };

  const totalTransfers = transfers.length;
  const totalAmount = transfers.reduce((sum, t) => sum + (parseFloat(t.quantite) || 0), 0);

  // Magasin options for filters
  const magasinOptions = [
    { value: "", label: "الكل" },
    ...magasins.map(m => ({ value: m.id, label: m.nom }))
  ];

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-orange-400" />
              <div className="text-xs text-orange-300">التحويلات:</div>
              <div className="text-lg text-white">{totalTransfers}</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              <div className="text-xs text-blue-300">الكمية الكلية:</div>
              <div className="text-lg text-white">{totalAmount}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toast.info('تصدير Excel قريباً')}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-emerald-500/50 transition-all text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>EXCEL</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenAddDialog}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-orange-500/50 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>تحويل جديد</span>
          </motion.button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
          <input
            type="text"
            placeholder="البحث عن تحويل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500 placeholder-slate-400"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4 z-10" />
          <input
            type="date"
            value={filters.date_exact || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, date_exact: e.target.value }))}
            className="bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            showFilters || filters.magasin_source || filters.magasin_destination
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">المخزن المصدر</label>
              <select
                name="magasin_source"
                value={filters.magasin_source}
                onChange={handleFilterChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                {magasinOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">المخزن الوجهة</label>
              <select
                name="magasin_destination"
                value={filters.magasin_destination}
                onChange={handleFilterChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                {magasinOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          {(filters.magasin_source || filters.magasin_destination || filters.date_exact) && (
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

      {/* Transfers Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3">
          <h2 className="text-white text-lg flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            قائمة التحويلات
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
                  <th className="px-4 py-3 text-right">الرقم</th>
                  <th className="px-4 py-3 text-right">السلعة</th>
                  <th className="px-4 py-3 text-right">من</th>
                  <th className="px-4 py-3 text-right">إلى</th>
                  <th className="px-4 py-3 text-right">الكمية</th>
                  <th className="px-4 py-3 text-right">الباركودات</th>
                  <th className="px-4 py-3 text-right">التاريخ</th>
                  <th className="px-4 py-3 text-right">الوقت</th>
                  <th className="px-4 py-3 text-right">المستخدم</th>
                  <th className="px-4 py-3 text-right">الإجراءات</th>
                  </tr>
              </thead>
              <tbody>
                {transfers.length > 0 ? (
                  transfers.map((transfer, index) => (
                    <motion.tr
                      key={transfer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border-b border-slate-700/50 transition-all hover:bg-orange-500/10 ${
                        index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-orange-300">{transfer.id}</td>
                      <td className="px-4 py-3 text-white font-medium">
                        {transfer.produit_details?.nom || 'غير معروف'}
                      </td>
                      <td className="px-4 py-3 text-blue-300">
                        {transfer.magasin_source_details?.nom || 'غير معروف'}
                      </td>
                      <td className="px-4 py-3 text-emerald-300">
                        {transfer.magasin_destination_details?.nom || 'غير معروف'}
                      </td>
                      <td className="px-4 py-3 text-amber-300 font-medium">
                        {transfer.quantite}
                      </td>
                      <td className="px-4 py-3 text-purple-300 font-mono text-xs">
                        {transfer.codes_barres_transferes?.length > 0 
                          ? `${transfer.codes_barres_transferes.length} باركود` 
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {transfer.date_formatee || transfer.date}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {transfer.heure_formatee || '-'}
                      </td>
                      <td className="px-4 py-3 text-amber-300">
                        {transfer.utilisateur_details?.username || 'غير معروف'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(transfer.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-4 py-8 text-center text-slate-400">
                      لا توجد تحويلات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        {transfers.length > 0 && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-t border-slate-700">
            <div className="flex justify-between items-center text-sm">
              <div className="text-slate-400">
                عرض {transfers.length} من {totalTransfers} تحويل
              </div>
              <div className="flex gap-6">
                <div className="text-orange-400">
                  إجمالي الكمية: <span className="font-bold">{totalAmount}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddTransfertDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onSuccess={fetchTransfers}
      />

      <ConfirmationDialog
        open={openConfirmationDialog}
        onClose={() => setOpenConfirmationDialog(false)}
        onConfirm={confirmDelete}
        text="هل أنت متأكد من حذف هذا التحويل؟"
      />
    </div>
  );
}