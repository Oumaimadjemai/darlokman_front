import { useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
  Edit,
  Trash2,
  Lock,
  Filter,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "../../api/axiosInstance";
import ConfirmationDialog from "../Cards/ConfirmationDialog";
import AddClientDialog from "./AddClientDialog";
import ClientDetailDialog from "./ClientDetailDialog";

// Status color mapping for table display
const statusColors = {
  non_classifie: { bg: "bg-slate-500/20", text: "text-slate-400", label: "غير مصنف", value: "non_classifie" },
  sous_suivi: { bg: "bg-blue-500/20", text: "text-blue-400", label: "قيد المتابعة", value: "sous_suivi" },
  recuperation: { bg: "bg-orange-500/20", text: "text-orange-400", label: "قيد الإسترجاع", value: "recuperation" },
  investigation: { bg: "bg-purple-500/20", text: "text-purple-400", label: "قيد التحقيق", value: "investigation" },
  suspendu: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "موقوف مؤقتا", value: "suspendu" },
  perdu: { bg: "bg-red-500/20", text: "text-red-400", label: "معدوم", value: "perdu" },
  cash_only: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "تسديد نقدا", value: "cash_only" },
  banque_bloquee: { bg: "bg-gray-500/20", text: "text-gray-400", label: "مغلق من البنك", value: "banque_bloquee" },
};

export function ClientsTable() {
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [totalClients, setTotalClients] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    blocked: "",
  });

  const headers = {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  };

  // ✅ money formatter
  const formatMoney = (num) => {
    const number = Number(num || 0);
    return isNaN(number) ? "0" : number.toLocaleString("fr-DZ");
  };

  // ✅ Get status color and label
  const getStatusDisplay = (statut) => {
    const status = statusColors[statut] || statusColors.non_classifie;
    return {
      bg: status.bg,
      text: status.text,
      label: status.label
    };
  };

  // ✅ FETCH CLIENTS (without detailed stats - just basic info)
  const fetchClients = async () => {
    setLoading(true);
    try {
      let url = "auth/clients/";
      const params = new URLSearchParams();
      
      if (searchTerm) params.append("search", searchTerm);
      if (filters.status) params.append("statut", filters.status);
      if (filters.blocked !== "") params.append("bloque", filters.blocked);

      if (params.toString()) url += `?${params.toString()}`;

      const res = await axios.get(url, { headers });
      const clients = res.data.results;
      setTotalClients(res.data.count);
      
      // Only set basic client info without detailed stats
      setRows(clients.sort((a, b) => b.id - a.id));
    } catch (err) {
      console.error(err);
      toast.error("خطأ في تحميل العملاء");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [searchTerm, filters]);

  // ✅ DELETE
  const handleDelete = (id) => {
    setSelectedId(id);
    setConfirmationOpen(true);
  };

  const confirmDelete = () => {
    axios
      .delete(`/auth/clients/${selectedId}/`, { headers })
      .then(() => {
        toast.success("تم الحذف بنجاح");
        fetchClients();
      })
      .finally(() => {
        setConfirmationOpen(false);
        setSelectedId(null);
      });
  };

  // ✅ Refresh after dialog close
  const handleDialogClose = () => {
    setOpenDialog(false);
    setClientToEdit(null);
    fetchClients();
  };

  const handleDetailDialogClose = () => {
    setOpenDetailDialog(false);
    setSelectedClient(null);
    fetchClients();
  };

  // ✅ Filter handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: "", blocked: "" });
    setSearchTerm("");
  };

  // Get row background color based on blocked status
  const getRowBackground = (client, index) => {
    if (client.bloque) {
      return "bg-red-900/30 border-l-4 border-l-red-500";
    }
    return index % 2 === 0 ? "bg-slate-800/30" : "bg-slate-900/30";
  };

  // Status options for filter
  const statusOptions = [
    { value: "", label: "الكل" },
    ...Object.values(statusColors).map(status => ({
      value: status.value,
      label: status.label
    }))
  ];

  const blockedOptions = [
    { value: "", label: "الكل" },
    { value: "true", label: "محظور" },
    { value: "false", label: "نشط" },
  ];

  return (
    <>
      <div className="space-y-4">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            
            {/* CLIENT COUNT */}
            <div className="min-w-[160px] max-w-[240px] bg-gradient-to-r from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <div className="text-xs text-blue-300">الزبائن:</div>
                <div className="text-lg text-white">{totalClients}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="bg-green-500 px-4 py-2 rounded text-white">EXCEL</button>
            <button
              onClick={() => {
                setClientToEdit(null);
                setOpenDialog(true);
              }}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              + زبون جديد
            </button>
            <button className="bg-gray-600 px-4 py-2 rounded text-white">وصل</button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
            <input
              type="text"
              placeholder="البحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 text-white border border-amber-500/30 rounded-lg px-10 py-2"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              showFilters || filters.status || filters.blocked
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
                <label className="block text-sm text-slate-400 mb-1">التصنيف</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">الحالة</label>
                <select
                  name="blocked"
                  value={filters.blocked}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                >
                  {blockedOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {(filters.status || filters.blocked) && (
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

        {/* TABLE */}
        <div className="bg-slate-900 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
            <h2 className="text-white text-lg">قائمة العملاء</h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-700 text-white">
                    {[
                      "الرقم","الاسم","اللقب","العنوان","الهاتف","الحساب",
                      "التصنيف","الحالة","إجراءات",
                    ].map((h) => (
                      <th key={h} className="px-4 py-3 text-right">{h}</th>
                    ))}
                     </tr>
                </thead>

                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                        لا توجد بيانات
                      </td>
                    </tr>
                  ) : (
                    rows.map((client, index) => {
                      const statusDisplay = getStatusDisplay(client.statut);
                      return (
                        <motion.tr
                          key={client.id}
                          onDoubleClick={() => {
                            setSelectedClient(client);
                            setOpenDetailDialog(true);
                          }}
                          className={`border-b transition-all cursor-pointer ${getRowBackground(client, index)}`}
                        >
                          <td className="px-4 py-3 text-blue-300">{client.id}</td>
                          <td className="px-4 py-3 text-white">{client.prenom_ar}</td>
                          <td className="px-4 py-3 text-white">{client.nom_famille_ar}</td>
                          <td className="px-4 py-3 text-slate-300">{client.adresse || "--"}</td>
                          <td className="px-4 py-3 text-green-300">{client.telephone || "--"}</td>
                          <td className="px-4 py-3 text-yellow-300">{client.ccp || "--"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusDisplay.bg} ${statusDisplay.text}`}>
                              {statusDisplay.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {client.bloque ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                                <Lock className="w-3 h-3" />
                                محظور
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">
                                نشط
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setClientToEdit(client);
                                  setOpenDialog(true);
                                }}
                                className="p-2 bg-blue-500/20 rounded hover:bg-blue-500/40 transition"
                              >
                                <Edit className="w-4 h-4 text-blue-400" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(client.id);
                                }}
                                className="p-2 bg-red-500/20 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={confirmDelete}
        text="هل أنت متأكد من حذف هذا الزبون؟"
      />

      <ClientDetailDialog
        open={openDetailDialog}
        onClose={handleDetailDialogClose}
        client={selectedClient}
      />
      
      <AddClientDialog
        open={openDialog}
        onClose={handleDialogClose}
        onSuccess={fetchClients}
        clientToEdit={clientToEdit}
      />
    </>
  );
}