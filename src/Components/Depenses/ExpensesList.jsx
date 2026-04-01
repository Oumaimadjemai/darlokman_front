import { useState, useEffect } from 'react';
import { Search, Plus, FileSpreadsheet, Edit, Trash2, DollarSign, Filter, X, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from '../../api/axiosInstance';
import ConfirmationDialog from '../Cards/ConfirmationDialog';
import AddDepenseDialog from './AddDepenseDialog';
// import AddDepenseDialog from './AddDepenseDialog';
// import EditDepenseDialog from './EditDepenseDialog';

export function ExpensesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
 const [openDialog, setOpenDialog] = useState(false);
const [selectedExpense, setSelectedExpense] = useState(null);
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    type_depense: '',
    mode_paiement: '',
    periode: 'this_month',
    date_from: null,
    date_to: null,
  });
  
  const [totaux, setTotaux] = useState({ total_montant: 0, total_depenses: 0 });
  
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  };

  // Type de dépense options
  const typeDepenseOptions = [
    { value: "", label: "الكل" },
    { value: "الكراء", label: "الكراء" },
    { value: "الفواتير", label: "الفواتير" },
    { value: "أجور العمال", label: "أجور العمال" },
    { value: "سلع تالفة", label: "سلع تالفة" },
    { value: "ديون", label: "ديون" },
    { value: "ديون خاصة", label: "ديون خاصة" },
    { value: "مصاريف أخرى", label: "مصاريف أخرى" },
    { value: "مساهمين", label: "مساهمين" },
  ];

  // Mode de paiement options
  const modePaiementOptions = [
    { value: "", label: "الكل" },
    { value: "espece", label: "نقدي" },
    { value: "ccp", label: "CCP" },
    { value: "cheque", label: "شيك" },
  ];

  // Periode options
  const periodeOptions = [
    { value: "", label: "الكل" },
    { value: "today", label: "اليوم" },
    { value: "yesterday", label: "الأمس" },
    { value: "this_week", label: "هذا الأسبوع" },
    { value: "this_month", label: "هذا الشهر" },
    { value: "last_month", label: "الشهر الماضي" },
    { value: "this_year", label: "هذا العام" },
  ];

  // Fetch expenses with filters
  const fetchExpenses = async () => {
    setLoading(true);
    const params = {
      search: searchTerm || undefined,
      ...filters,
    };
    
    // Remove empty values
    Object.keys(params).forEach(key => {
      if (params[key] === "" || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    try {
      const response = await axios.get(`depense/depenses/`, { headers, params });
      setExpenses(response.data.rows || []);
      setTotaux(response.data.totaux_globaux || { total_montant: 0, total_depenses: 0 });
    } catch (err) {
      console.error("Erreur lors du chargement des dépenses :", err);
      toast.error("خطأ في تحميل المصاريف");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchExpenses();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    // Clear custom dates when selecting a preset period
    if (name === 'periode' && value !== 'custom') {
      setFilters(prev => ({ ...prev, date_from: null, date_to: null }));
      setShowDatePicker(false);
    }
  };

  const handleDateRangeChange = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: value, periode: 'custom' }));
    setShowDatePicker(true);
  };

  const clearFilters = () => {
    setFilters({
      type_depense: '',
      mode_paiement: '',
      periode: 'this_month',
      date_from: null,
      date_to: null,
    });
    setSearchTerm('');
    setShowDatePicker(false);
  };

  const handleDelete = (id) => {
    setSelectedId(id);
    setOpenConfirmationDialog(true);
  };

  const confirmDelete = () => {
    axios
      .delete(`/depense/depenses/${selectedId}/`, { headers })
      .then(() => {
        setExpenses(prev => prev.filter(e => e.id !== selectedId));
        toast.success("تم حذف المصروف بنجاح");
      })
      .catch((err) => {
        console.error(err);
        toast.error("فشل حذف المصروف");
      })
      .finally(() => {
        setOpenConfirmationDialog(false);
        setSelectedId(null);
      });
  };

 const handleOpenAddDialog = () => {
  setSelectedExpense(null);
  setOpenDialog(true);
};

const handleOpenEditDialog = (expense) => {
  setSelectedExpense(expense);
  setOpenDialog(true);
};

  const totalExpenses = expenses.length;
  const totalAmount = totaux.total_montant || expenses.reduce((sum, e) => sum + (parseFloat(e.montant) || 0), 0);
  const totalCount = totaux.total_depenses || totalExpenses;

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-gradient-to-r from-red-500/20 to-rose-600/20 border border-red-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-red-400" />
              <div className="text-xs text-red-300">المصاريف:</div>
              <div className="text-lg text-white">{totalCount}</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500/20 to-amber-600/20 border border-orange-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="text-xs text-orange-300">المبلغ الكلي:</div>
              <div className="text-lg text-white">{totalAmount} د.ج</div>
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
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-red-500/50 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>مصروف جديد</span>
          </motion.button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
          <input
            type="text"
            placeholder="البحث عن مصروف..."
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
            showFilters || filters.type_depense || filters.mode_paiement || filters.periode !== 'this_month'
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
          className="bg-slate-800/50 rounded-lg p-4 border border-amber-500/30 space-y-4"
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
              <label className="block text-sm text-slate-400 mb-1">نوع المصروف</label>
              <select
                name="type_depense"
                value={filters.type_depense}
                onChange={handleFilterChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                {typeDepenseOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">طريقة الدفع</label>
              <select
                name="mode_paiement"
                value={filters.mode_paiement}
                onChange={handleFilterChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                {modePaiementOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">من تاريخ</label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleDateRangeChange('date_from', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleDateRangeChange('date_to', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {(filters.type_depense || filters.mode_paiement || filters.periode !== 'this_month' || filters.date_from || filters.date_to) && (
            <div className="flex justify-end">
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

      {/* Expenses Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-3">
          <h2 className="text-white text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            قائمة المصاريف
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                  <th className="px-4 py-3 text-right">الرقم</th>
                  <th className="px-4 py-3 text-right">التاريخ</th>
                  <th className="px-4 py-3 text-right">طريقة الدفع</th>
                  <th className="px-4 py-3 text-right">النوع</th>
                  <th className="px-4 py-3 text-right">الوصف</th>
                  <th className="px-4 py-3 text-right">المبلغ</th>
                  <th className="px-4 py-3 text-right">المستخدم</th>
                  <th className="px-4 py-3 text-right">الإجراءات</th>
                 </tr>
              </thead>
              <tbody>
                {expenses.length > 0 ? (
                  expenses.map((expense, index) => (
                    <motion.tr
                      key={expense.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border-b border-slate-700/50 transition-all hover:bg-red-500/10 ${
                        index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-red-300">{expense.id}</td>
                      <td className="px-4 py-3 text-slate-300">{expense.date}</td>
                      <td className="px-4 py-3 text-blue-300">{expense.mode_paiement}</td>
                      <td className="px-4 py-3 text-purple-300">{expense.type_depense}</td>
                      <td className="px-4 py-3 text-white">{expense.libelle}</td>
                      <td className="px-4 py-3 text-red-400 font-medium">{parseFloat(expense.montant)} د.ج</td>
                      <td className="px-4 py-3 text-amber-300">{expense.utilisateur?.username || 'غير معروف'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleOpenEditDialog(expense)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(expense.id)}
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
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                      لا توجد مصاريف
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        {expenses.length > 0 && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-t border-slate-700">
            <div className="flex justify-between items-center text-sm">
              <div className="text-slate-400">
                عرض {expenses.length} من {totalCount} مصروف
              </div>
              <div className="flex gap-6">
                <div className="text-red-400">
                  إجمالي المبلغ: <span className="font-bold">{totalAmount} د.ج</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
    <AddDepenseDialog
  open={openDialog}
  onClose={() => {
    setOpenDialog(false);
    setSelectedExpense(null);
  }}
  onSuccess={fetchExpenses}
  expenseToEdit={selectedExpense}
/>

      <ConfirmationDialog
        open={openConfirmationDialog}
        onClose={() => setOpenConfirmationDialog(false)}
        onConfirm={confirmDelete}
        text="هل أنت متأكد من حذف هذا المصروف؟"
      />
    </div>
  );
}