import { useState, useEffect } from 'react';
import { Search, Plus, FileSpreadsheet, Edit, Trash2, Truck, Filter, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from '../../api/axiosInstance';
import ConfirmationDialog from '../Cards/ConfirmationDialog';
import AddFournisseurDialog from './AddFournisseurDialog';

export function SuppliersList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [openExcelDialog, setOpenExcelDialog] = useState(false);
  const [importFile, setImportFile] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    wilaya: '',
  });
  
  const [totaux, setTotaux] = useState(null);
  
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    "Content-Type": "application/json",
  };

  // Wilaya options
  const wilayasOptions = [
    { value: "", label: "الكل" },
    { value: "01", label: "Adrar / أدرار" },
    { value: "02", label: "Chlef / الشلف" },
    { value: "03", label: "Laghouat / الأغواط" },
    { value: "04", label: "Oum El Bouaghi / أم البواقي" },
    { value: "05", label: "Batna / باتنة" },
    { value: "06", label: "Béjaïa / بجاية" },
    { value: "07", label: "Biskra / بسكرة" },
    { value: "08", label: "Béchar / بشار" },
    { value: "09", label: "Blida / البليدة" },
    { value: "10", label: "Bouira / البويرة" },
    { value: "11", label: "Tamanrasset / تمنراست" },
    { value: "12", label: "Tébessa / تبسة" },
    { value: "13", label: "Tlemcen / تلمسان" },
    { value: "14", label: "Tiaret / تيارت" },
    { value: "15", label: "Tizi Ouzou / تيزي وزو" },
    { value: "16", label: "Alger / الجزائر" },
    { value: "17", label: "Djelfa / الجلفة" },
    { value: "18", label: "Jijel / جيجل" },
    { value: "19", label: "Sétif / سطيف" },
    { value: "20", label: "Saïda / سعيدة" },
    { value: "21", label: "Skikda / سكيكدة" },
    { value: "22", label: "Sidi Bel Abbès / سيدي بلعباس" },
    { value: "23", label: "Annaba / عنابة" },
    { value: "24", label: "Guelma / قالمة" },
    { value: "25", label: "Constantine / قسنطينة" },
    { value: "26", label: "Médéa / المدية" },
    { value: "27", label: "Mostaganem / مستغانم" },
    { value: "28", label: "M'Sila / المسيلة" },
    { value: "29", label: "Mascara / معسكر" },
    { value: "30", label: "Ouargla / ورقلة" },
    { value: "31", label: "Oran / وهران" },
    { value: "32", label: "El Bayadh / البيض" },
    { value: "33", label: "Illizi / اليزي" },
    { value: "34", label: "Bordj Bou Arreridj / برج بوعريريج" },
    { value: "35", label: "Boumerdès / بومرداس" },
    { value: "36", label: "El Tarf / الطارف" },
    { value: "37", label: "Tindouf / تندوف" },
    { value: "38", label: "Tissemsilt / تسمسيلت" },
    { value: "39", label: "El Oued / الوادي" },
    { value: "40", label: "Khenchela / خنشلة" },
    { value: "41", label: "Souk Ahras / سوق أهراس" },
    { value: "42", label: "Tipaza / تيبازة" },
    { value: "43", label: "Mila / ميلة" },
    { value: "44", label: "Aïn Defla / عين الدفلى" },
    { value: "45", label: "Naâma / النعامة" },
    { value: "46", label: "Aïn Témouchent / عين تموشنت" },
    { value: "47", label: "Ghardaïa / غرداية" },
    { value: "48", label: "Relizane / غليزان" },
    { value: "49", label: "Timimoun / تيميمون" },
    { value: "50", label: "Bordj Badji Mokhtar / برج باجي مختار" },
    { value: "51", label: "Ouled Djellal / أولاد جلال" },
    { value: "52", label: "Béni Abbès / بني عباس" },
    { value: "53", label: "In Salah / عين صالح" },
    { value: "54", label: "In Guezzam / عين قزام" },
    { value: "55", label: "Touggourt / تقرت" },
    { value: "56", label: "Djanet / جانت" },
    { value: "57", label: "El M'Ghair / المغير" },
    { value: "58", label: "El Menia / المنيعة" },
  ];

  // Fetch suppliers with filters
  const fetchSuppliers = async (search = searchTerm, appliedFilters = filters) => {
    setLoading(true);
    const params = new URLSearchParams();

    if (search) params.append("search", search);
    if (appliedFilters.wilaya) params.append("wilaya", appliedFilters.wilaya);

    try {
      const response = await axios.get(`auth/fournisseurs/?${params.toString()}`, { headers });
      setSuppliers(response.data.results || []);
      setTotaux(response.data.totaux);
    } catch (err) {
      console.error("Erreur lors du chargement des fournisseurs :", err);
      toast.error("خطأ في تحميل الممونين");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchSuppliers(searchTerm, filters);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ wilaya: '' });
    setSearchTerm('');
  };

  const handleDelete = (id) => {
    setSelectedId(id);
    setOpenConfirmationDialog(true);
  };

  const confirmDelete = () => {
    axios
      .delete(`/auth/fournisseurs/${selectedId}/`, { headers })
      .then(() => {
        setSuppliers(prev => prev.filter(s => s.id !== selectedId));
        toast.success("تم حذف الممون بنجاح");
      })
      .catch((err) => {
        console.error(err);
        toast.error("فشل حذف الممون");
      })
      .finally(() => {
        setOpenConfirmationDialog(false);
        setSelectedId(null);
      });
  };

  const handleOpenAddDialog = () => {
    setSelectedSupplier(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (supplier) => {
    setSelectedSupplier(supplier);
    setOpenDialog(true);
  };

  const handleExport = async () => {
    try {
      const response = await axios.get("/auth/fournisseurs/export/", {
        responseType: "blob",
        headers,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "fournisseurs.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("تم تصدير الممونين بنجاح");
    } catch (error) {
      console.error("Erreur d'exportation :", error);
      toast.error("فشل تصدير الممونين");
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.warning("⚠️ يرجى اختيار ملف Excel");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      await axios.post("/auth/fournisseurs/import/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      toast.success("تم استيراد الممونين بنجاح");
      setOpenExcelDialog(false);
      setImportFile(null);
      fetchSuppliers();
    } catch (error) {
      console.error("Erreur d'importation :", error);
      toast.error("فشل استيراد الممونين");
    }
  };

  const totalSuppliers = suppliers.length;
  const totalDettes = suppliers.reduce((sum, s) => sum + (parseFloat(s.dettes_initiales) || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-gradient-to-r from-pink-500/20 to-rose-600/20 border border-pink-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-pink-400" />
              <div className="text-xs text-pink-300">الممونين:</div>
              <div className="text-lg text-white">{totalSuppliers}</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="text-xs text-blue-300">إجمالي الديون:</div>
              <div className="text-lg text-white">{totalDettes} </div>
            </div>
          </div>
          {totaux && (
            <div className="bg-gradient-to-r from-emerald-500/20 to-green-600/20 border border-emerald-500/30 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="text-xs text-emerald-300">إجمالي المدفوعات:</div>
                <div className="text-lg text-emerald-400">{totaux.total_paye|| 0} </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenAddDialog}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-pink-500/50 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>ممون جديد</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpenExcelDialog(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-amber-500/50 transition-all text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>استيراد/تصدير</span>
          </motion.button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
          <input
            type="text"
            placeholder="البحث عن ممون..."
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
            showFilters || filters.wilaya
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
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-1">الولاية</label>
              <select
                name="wilaya"
                value={filters.wilaya}
                onChange={handleFilterChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                {wilayasOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            {filters.wilaya && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                >
                  <X className="w-4 h-4" />
                  <span>مسح الفلتر</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Suppliers Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 px-4 py-3">
          <h2 className="text-white text-lg flex items-center gap-2">
            <Truck className="w-5 h-5" />
            قائمة الممونين
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-pink-600 to-pink-700 text-white">
                  <th className="px-4 py-3 text-right">الرقم</th>
                  <th className="px-4 py-3 text-right">الإسم</th>
                  <th className="px-4 py-3 text-right">العنوان</th>
                  <th className="px-4 py-3 text-right">الهاتف</th>
                  <th className="px-4 py-3 text-right">الولاية</th>
                  <th className="px-4 py-3 text-right">الديون الإبتدائية</th>
                  <th className="px-4 py-3 text-right">المدفوعات</th>
                  <th className="px-4 py-3 text-right">الإجراءات</th>
                 </tr>
              </thead>
              <tbody>
                {suppliers.length > 0 ? (
                  suppliers.map((supplier, index) => (
                    <motion.tr
                      key={supplier.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border-b border-slate-700/50 transition-all hover:bg-pink-500/10 ${
                        index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-pink-300">{supplier.id}</td>
                      <td className="px-4 py-3 text-white font-medium">{supplier.nom}</td>
                      <td className="px-4 py-3 text-slate-300">{supplier.adresse || '-'}</td>
                      <td className="px-4 py-3 text-emerald-300">{supplier.telephone || '-'}</td>
                      <td className="px-4 py-3 text-purple-300">{supplier.wilaya_display || supplier.wilaya || '-'}</td>
                      <td className="px-4 py-3 text-amber-300">{parseFloat(supplier.dettes_initiales || 0)} </td>
                      <td className="px-4 py-3 text-emerald-300">{parseFloat(supplier.total_paye || 0)} </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleOpenEditDialog(supplier)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(supplier.id)}
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
                      لا توجد ممونين
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        {suppliers.length > 0 && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 border-t border-slate-700">
            <div className="flex justify-between items-center text-sm">
              <div className="text-slate-400">
                عرض {suppliers.length} من {totalSuppliers} ممون
              </div>
              <div className="flex gap-6">
                <div className="text-pink-400">
                  إجمالي الديون: <span className="font-bold">{totalDettes} </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Single Dialog for Add/Edit */}
      <AddFournisseurDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setSelectedSupplier(null);
        }}
        onSuccess={fetchSuppliers}
        supplierToEdit={selectedSupplier}
      />

      {/* Excel Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-all" style={{ display: openExcelDialog ? 'flex' : 'none' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-800 rounded-xl w-[400px] overflow-hidden shadow-2xl border border-amber-500/30"
        >
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 flex justify-between items-center">
            <h2 className="text-white text-xl font-bold">استيراد/تصدير Excel</h2>
            <button
              onClick={() => setOpenExcelDialog(false)}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <button
              onClick={handleExport}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-green-700 transition"
            >
              تصدير Excel
            </button>
            
            <div className="border-t border-slate-700 my-2"></div>
            
            <label className="block text-sm text-slate-400 mb-2">اختر ملف Excel للاستيراد</label>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
            />
            
            <button
              onClick={handleImport}
              disabled={!importFile}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              استيراد Excel
            </button>
          </div>
        </motion.div>
      </div>

      <ConfirmationDialog
        open={openConfirmationDialog}
        onClose={() => setOpenConfirmationDialog(false)}
        onConfirm={confirmDelete}
        text="هل أنت متأكد من حذف هذا الممون؟"
      />
    </div>
  );
}