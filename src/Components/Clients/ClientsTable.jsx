import { useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
  Edit,
  Trash2,
  Lock,
  Filter,
  X,
  FileCheck,
  FileSpreadsheet,
  Download,
  Upload,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
  const [excelDialogOpen, setExcelDialogOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [importingExcel, setImportingExcel] = useState(false);
  
  const [filters, setFilters] = useState({
    status: "",
    blocked: "",
    recuperer_fichiers: "", // NEW: Add filter for recuperer_fichiers
  });

  const headers = {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  };

  const formatMoney = (num) => {
    const number = Number(num || 0);
    return isNaN(number) ? "0" : number;
  };

  const getStatusDisplay = (statut) => {
    const status = statusColors[statut] || statusColors.non_classifie;
    return {
      bg: status.bg,
      text: status.text,
      label: status.label
    };
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      let url = "auth/clients/";
      const params = new URLSearchParams();
      
      if (searchTerm) params.append("search", searchTerm);
      if (filters.status) params.append("statut", filters.status);
      if (filters.blocked !== "") params.append("bloque", filters.blocked);
      if (filters.recuperer_fichiers !== "") params.append("recuperer_fichiers", filters.recuperer_fichiers);

      if (params.toString()) url += `?${params.toString()}`;

      const res = await axios.get(url, { headers });
      const clients = res.data.results;
      setTotalClients(res.data.count);
      
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

  const handleSaleReceipt = (client) => {
    navigate('/New/Facilitevente', { 
      state: { 
        fromClientBoard: true, 
        clientId: client.id,
        isEditMode: false,
        initialData: null
      } 
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: "", blocked: "", recuperer_fichiers: "" });
    setSearchTerm("");
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const response = await axios.get("auth/clients/export-excel/", {
        headers,
        responseType: "blob",
      });
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "clients.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Excel export downloaded");
    } catch (err) {
      console.error("Client Excel export failed:", err);
      toast.error("Unable to export clients to Excel");
    } finally {
      setExportingExcel(false);
    }
  };

  const handleImportExcel = async () => {
    if (!excelFile) return;

    setImportingExcel(true);
    try {
      const formData = new FormData();
      formData.append("file", excelFile);
      await axios.post("auth/clients/import-excel/", formData, {
        headers: { Authorization: headers.Authorization },
      });
      toast.success("Clients imported successfully");
      setExcelFile(null);
      setExcelDialogOpen(false);
      await fetchClients();
    } catch (err) {
      console.error("Client Excel import failed:", err);
      const message = err.response?.data?.detail || "Unable to import the Excel file";
      toast.error(message);
    } finally {
      setImportingExcel(false);
    }
  };

  const getRowBackground = (client, index) => {
    if (client.bloque) {
      return "bg-red-900/30 border-l-4 border-l-red-500";
    }
    return index % 2 === 0 ? "bg-slate-800/30" : "bg-slate-900/30";
  };

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

  // NEW: Options for recuperer_fichiers filter
  const recupererFichiersOptions = [
    { value: "", label: "الكل" },
    { value: "true", label: "مسترد الملفات" },
    { value: "false", label: "لم يسترد الملفات" },
  ];

  return (
    <>
      <div className="space-y-4">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="min-w-[160px] max-w-[240px] bg-gradient-to-r from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <div className="text-xs text-blue-300">الزبائن:</div>
                <div className="text-lg text-white">{totalClients}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setExcelDialogOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FileSpreadsheet className="w-4 h-4" />
              EXCEL
            </button>
            <button
              onClick={() => {
                setClientToEdit(null);
                setOpenDialog(true);
              }}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              + زبون جديد
            </button>
            <button 
              className={`px-4 py-2 rounded text-white transition-all duration-200 ${
                selectedClient 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl cursor-pointer' 
                  : 'bg-gray-500 cursor-not-allowed opacity-50'
              }`}
              onClick={() => {
                if (selectedClient) {
                  handleSaleReceipt(selectedClient);
                } else {
                  toast.warning("الرجاء اختيار زبون أولاً");
                }
              }}
              disabled={!selectedClient}
            >
              وصل البيع
            </button>
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
              showFilters || filters.status || filters.blocked || filters.recuperer_fichiers
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {/* NEW: Recuperer fichiers filter */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <FileCheck className="w-4 h-4 text-green-400" />
                    استرجاع الملفات
                  </span>
                </label>
                <select
                  name="recuperer_fichiers"
                  value={filters.recuperer_fichiers}
                  onChange={handleFilterChange}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                >
                  {recupererFichiersOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {(filters.status || filters.blocked || filters.recuperer_fichiers) && (
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
                      <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                        لا توجد بيانات
                      </td>
                    </tr>
                  ) : (
                    rows.map((client, index) => {
                      const statusDisplay = getStatusDisplay(client.statut);
                      const isSelected = selectedClient?.id === client.id;
                      
                      return (
                        <motion.tr
                          key={client.id}
                          onDoubleClick={() => {
                            setSelectedClient(client);
                            setOpenDetailDialog(true);
                          }}
                          onClick={() => {
                            setSelectedClient(client);
                          }}
                          className={`border-b transition-all cursor-pointer ${getRowBackground(client, index)} ${
                            isSelected ? 'bg-blue-500/20 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-blue-300">{client.id}</td>
                          <td className="px-4 py-3 text-white">{client.prenom_ar || client.prenom_fr || "--"}</td>
                          <td className="px-4 py-3 text-white">{client.nom_famille_ar || client.nom_famille_fr || "--"}</td>
                          <td className="px-4 py-3 text-slate-300">{client.adresse || "--"}</td>
                          
                          {/* Telephones array */}
                          <td className="px-4 py-3">
                            {client.telephones && client.telephones.length > 0 ? (
                              <div className="space-y-1">
                                {client.telephones.map((phone, idx) => (
                                  <div key={idx} className="text-green-300 text-xs">
                                    {phone}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500 text-xs">--</span>
                            )}
                          </td>
                          
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
                                className="p-2 bg-red-500/20 rounded hover:bg-red-500/40 transition"
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

      {excelDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold text-white">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                Excel
              </div>
              <button
                onClick={() => {
                  setExcelDialogOpen(false);
                  setExcelFile(null);
                }}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close Excel dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={handleExportExcel}
              disabled={exportingExcel || importingExcel}
              className="mb-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exportingExcel ? "Exporting..." : "Export clients"}
            </button>

            <div className="border-t border-slate-700 pt-5">
              <label className="mb-2 block text-sm text-slate-300">Import clients from Excel</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(event) => setExcelFile(event.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-slate-100 hover:file:bg-slate-600"
              />
              {excelFile && <p className="mt-2 truncate text-xs text-emerald-400">{excelFile.name}</p>}
              <button
                onClick={handleImportExcel}
                disabled={!excelFile || importingExcel || exportingExcel}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {importingExcel ? "Importing..." : "Import clients"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
