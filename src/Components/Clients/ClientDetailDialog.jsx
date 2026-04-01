import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  User,
  FileText,
  ShoppingBag,
  CreditCard,
  BarChart3,
  Lock,
  Unlock,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Save,
  AlertCircle,
} from "lucide-react";
import axios from "../../api/axiosInstance";
import dayjs from "dayjs";

// Status color mapping
const statusColors = {
  non_classifie: { bg: "bg-slate-500/20", text: "text-slate-400", label: "غير مصنف" },
  sous_suivi: { bg: "bg-blue-500/20", text: "text-blue-400", label: "قيد المتابعة" },
  recuperation: { bg: "bg-orange-500/20", text: "text-orange-400", label: "قيد الإسترجاع" },
  investigation: { bg: "bg-purple-500/20", text: "text-purple-400", label: "قيد التحقيق" },
  suspendu: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "موقوف مؤقتا" },
  perdu: { bg: "bg-red-500/20", text: "text-red-400", label: "معدوم" },
  cash_only: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "تسديد نقدا" },
  banque_bloquee: { bg: "bg-gray-500/20", text: "text-gray-400", label: "مغلق من البنك" },
};

// Client Files View Component
const ClientFilesView = ({ files, onDeleteFile }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);

  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
  const imageFiles = files?.filter((file) => {
    if (!file?.url) return false;
    const ext = file.url.split(".").pop()?.toLowerCase();
    return imageExtensions.includes(ext);
  }) || [];

  const otherFiles = files?.filter((file) => {
    if (!file?.url) return false;
    const ext = file.url.split(".").pop()?.toLowerCase();
    return !imageExtensions.includes(ext);
  }) || [];

  const handleDownload = async (file) => {
    try {
      const response = await axios.get(file.url, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name || "fichier";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("تم تحميل الملف بنجاح");
    } catch (error) {
      toast.error("فشل تحميل الملف");
    }
  };

  const openImageViewer = (index) => {
    setCurrentImageIndex(index);
    setSelectedImage(imageFiles[index]);
  };

  const handlePrevImage = () => {
    const newIndex = currentImageIndex === 0 ? imageFiles.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(newIndex);
    setSelectedImage(imageFiles[newIndex]);
  };

  const handleNextImage = () => {
    const newIndex = currentImageIndex === imageFiles.length - 1 ? 0 : currentImageIndex + 1;
    setCurrentImageIndex(newIndex);
    setSelectedImage(imageFiles[newIndex]);
  };

  return (
    <div className="space-y-6">
      {/* Other Files Section */}
      {otherFiles.length > 0 && (
        <div>
          <h3 className="text-slate-300 font-semibold mb-3">📄 الملفات الأخرى</h3>
          <div className="space-y-2">
            {otherFiles.map((file, idx) => (
              <div
                key={file.id || idx}
                className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span className="text-slate-300">{file.name || `ملف ${idx + 1}`}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-2 bg-blue-500/20 rounded-lg hover:bg-blue-500/40 transition"
                  >
                    <Download className="w-4 h-4 text-blue-400" />
                  </button>
                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/40 transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images Gallery */}
      {imageFiles.length > 0 && (
        <div>
          <h3 className="text-slate-300 font-semibold mb-3">🖼️ الصور</h3>
          <div className="grid grid-cols-4 gap-3">
            {imageFiles.map((file, idx) => (
              <div
                key={file.id || idx}
                className="relative group cursor-pointer"
                onClick={() => openImageViewer(idx)}
              >
                <img
                  src={file.url}
                  alt={file.name || "Image"}
                  className="w-full h-24 object-cover rounded-lg border border-slate-600"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file.id);
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                className="max-w-full max-h-[90vh] object-contain"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              {imageFiles.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Vente Detail Facilite Component
const VenteDetailFacilite = ({ clientId }) => {
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    axios
      .get(`/vente/ventes-facilite/?client=${clientId}`)
      .then((res) => {
        const ventesData = res.data.ventes || [];
        const sortedVentes = ventesData.sort((a, b) => {
          const dateA = new Date(a.date_vente || a.date_formatee);
          const dateB = new Date(b.date_vente || b.date_formatee);
          return dateB - dateA;
        });
        setVentes(sortedVentes);
      })
      .catch((err) => console.error("Error fetching ventes:", err))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return <div className="text-center py-8 text-slate-400">جاري التحميل...</div>;
  }

  if (ventes.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        لا توجد مشتريات بالتقسيط لهذا العميل
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ventes.map((vente) => (
        <div key={vente.id} className="bg-slate-700/30 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500/20 to-yellow-600/20 p-4 border-b border-amber-500/30">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="space-y-1">
                <div className="text-sm text-slate-400">
                  <span className="text-amber-400">رقم البيع:</span> #{vente.id}
                </div>
                <div className="text-sm text-slate-400">
                  <span className="text-amber-400">التاريخ:</span> {vente.date_formatee || "--"}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-slate-400">
                  <span className="text-amber-400">تاريخ البداية:</span>{" "}
                  {vente.date_debut ? dayjs(vente.date_debut).format("DD/MM/YYYY") : "--"}
                </div>
                <div className="text-sm text-slate-400">
                  <span className="text-amber-400">تاريخ النهاية:</span>{" "}
                  {vente.date_fin ? dayjs(vente.date_fin).format("DD/MM/YYYY") : "--"}
                </div>
              </div>
              <div className="text-lg font-bold text-amber-400">
                الإجمالي: {parseFloat(vente.montant_total || 0)} د.ج
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-600/30 text-slate-300">
                  <th className="px-4 py-2 text-right">الرقم</th>
                  <th className="px-4 py-2 text-right">المرجع</th>
                  <th className="px-4 py-2 text-right">الإسم</th>
                  <th className="px-4 py-2 text-right">السعر</th>
                  <th className="px-4 py-2 text-right">الكمية</th>
                  <th className="px-4 py-2 text-right">المحل</th>
                  <th className="px-4 py-2 text-right">المجموع</th>
                 </tr>
              </thead>
              <tbody>
                {vente.lignes_detail?.map((ligne) => (
                  <tr key={ligne.id} className="border-b border-slate-700">
                    <td className="px-4 py-2 text-slate-300">{ligne.produit}</td>
                    <td className="px-4 py-2 text-slate-300">{ligne.produit_detail?.reference || ""}</td>
                    <td className="px-4 py-2 text-slate-300">{ligne.produit_detail?.nom || ""}</td>
                    <td className="px-4 py-2 text-slate-300">{parseFloat(ligne.prix_unitaire || 0)}</td>
                    <td className="px-4 py-2 text-slate-300">{ligne.quantite || 0}</td>
                    <td className="px-4 py-2 text-slate-300">{ligne.produit_detail?.magasin_detail?.nom || ""}</td>
                    <td className="px-4 py-2 text-slate-300">{parseFloat(ligne.sous_total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

// Vente Detail Cash Component
const VenteDetailCash = ({ clientId }) => {
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    axios
      .get(`vente/liste/?client=${clientId}`)
      .then((res) => {
        const ventesData = res.data.ventes || [];
        const sortedVentes = ventesData.sort((a, b) => {
          const dateA = new Date(a.date_vente || a.date_formatee);
          const dateB = new Date(b.date_vente || b.date_formatee);
          return dateB - dateA;
        });
        setVentes(sortedVentes);
      })
      .catch((err) => console.error("Error fetching ventes:", err))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return <div className="text-center py-8 text-slate-400">جاري التحميل...</div>;
  }

  if (ventes.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        لا توجد مشتريات نقداً لهذا العميل
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ventes.map((vente) => (
        <div key={vente.id} className="bg-slate-700/30 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500/20 to-yellow-600/20 p-4 border-b border-amber-500/30">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <div className="text-sm text-slate-400">
                  <span className="text-amber-400">رقم البيع:</span> #{vente.id}
                </div>
                <div className="text-sm text-slate-400">
                  <span className="text-amber-400">التاريخ:</span> {vente.date_formatee}
                </div>
              </div>
              <div className="text-lg font-bold text-amber-400">
                الإجمالي: {parseFloat(vente.montant_total)} د.ج
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-600/30 text-slate-300">
                  <th className="px-4 py-2 text-right">الرقم</th>
                  <th className="px-4 py-2 text-right">المرجع</th>
                  <th className="px-4 py-2 text-right">الإسم</th>
                  <th className="px-4 py-2 text-right">السعر</th>
                  <th className="px-4 py-2 text-right">الكمية</th>
                  <th className="px-4 py-2 text-right">المحل</th>
                  <th className="px-4 py-2 text-right">المجموع</th>
                 </tr>
              </thead>
              <tbody>
                {vente.lignes_detail?.map((ligne) => (
                  <tr key={ligne.id} className="border-b border-slate-700">
                    <td className="px-4 py-2 text-slate-300">{ligne.produit}</td>
                    <td className="px-4 py-2 text-slate-300">{ligne.produit_reference || ""}</td>
                    <td className="px-4 py-2 text-slate-300">{ligne.produit_nom || ""}</td>
                    <td className="px-4 py-2 text-slate-300">{parseFloat(ligne.prix_unitaire || 0)}</td>
                    <td className="px-4 py-2 text-slate-300">{ligne.quantite || 0}</td>
                    <td className="px-4 py-2 text-slate-300">{ligne.magasin_detail?.nom || ""}</td>
                    <td className="px-4 py-2 text-slate-300">{parseFloat(ligne.sous_total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

// Client Paiement Info Component
const ClientPaiementInfo = ({ clientId }) => {
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    const fetchPaiements = async () => {
      try {
        const res = await axios.get(`/vente/ventes-facilite/?client=${clientId}`);
        const ventesData = res.data.ventes || [];

        const ventesWithPaiements = await Promise.all(
          ventesData.map(async (vente) => {
            try {
              const paiementRes = await axios.get(`/vente/vente/payer/${vente.id}/`);
              const paiementData = Array.isArray(paiementRes.data)
                ? paiementRes.data[0]
                : paiementRes.data;

              return {
                ...paiementData,
                date_debut: vente.date_debut,
                date_fin: vente.date_fin,
                montant_mensuel: Number(vente.montant_mensuel),
                total_verse_effectif: Number(vente.montant_paye_effectif),
                reste_vente: Number(vente.montant_restant),
              };
            } catch (err) {
              console.error(`Error fetching paiements for vente ${vente.id}`, err);
              return null;
            }
          })
        );

        setVentes(ventesWithPaiements.filter(Boolean));
      } catch (error) {
        console.error("Error fetching ventes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPaiements();
  }, [clientId]);

  if (loading) {
    return <div className="text-center py-8 text-slate-400">جاري التحميل...</div>;
  }

  if (ventes.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        لا توجد بيانات دفع حالياً
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ventes.map((vente) => (
        <div key={vente.vente_id} className="bg-slate-700/30 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500/20 to-yellow-600/20 p-4 border-b border-amber-500/30">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <div className="text-sm text-slate-400">
                  <span className="text-amber-400">البيع رقم:</span> #{vente.vente_id}
                </div>
                <div className="text-sm text-slate-400">
                  <span className="text-amber-400">الفترة:</span>{" "}
                  {dayjs(vente.date_debut).format("DD/MM/YYYY")} -{" "}
                  {dayjs(vente.date_fin).format("DD/MM/YYYY")}
                </div>
              </div>
              <div className="text-sm text-amber-400">
                الدفعة الشهرية: {vente.montant_mensuel} د.ج
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-600/30 text-slate-300">
                  <th className="px-4 py-2 text-right">تاريخ الدفع</th>
                  <th className="px-4 py-2 text-right">المبلغ (دج)</th>
                  <th className="px-4 py-2 text-right">الحالة</th>
                 </tr>
              </thead>
              <tbody>
                {vente.paiements?.length > 0 ? (
                  vente.paiements.map((p) => (
                    <tr key={p.id} className="border-b border-slate-700">
                      <td className="px-4 py-2 text-slate-300">
                        {dayjs(p.date_paiement).format("DD/MM/YYYY")}
                      </td>
                      <td className="px-4 py-2 text-slate-300">{p.montant} د.ج</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          p.status === "paid" 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {p.status === "paid" ? "✔ مدفوع" : "⏳ قيد الانتظار"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-slate-400">
                      لا توجد أي دفعات مسجلة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-800/50 flex justify-between items-center">
            <div className="text-sm">
              <span className="text-slate-400">المجموع المدفوع:</span>{" "}
              <span className="text-green-400">{vente.total_verse_effectif} د.ج</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-400">الباقي:</span>{" "}
              <span className="text-red-400">{vente.reste_vente} د.ج</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main Component
export default function ClientDetailDialog({ open, onClose, client }) {
  const [activeTab, setActiveTab] = useState(0);
  const [bloque, setBloque] = useState(false);
  const [statut, setStatut] = useState("non_classifie");
  const [note, setNote] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [deleteFileChecked, setDeleteFileChecked] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [actionType, setActionType] = useState("");
  const [loading, setLoading] = useState(false);

  const statutChoices = [
    { value: "non_classifie", label: "غير مصنف", color: "slate" },
    { value: "sous_suivi", label: "قيد المتابعة", color: "blue" },
    { value: "recuperation", label: "قيد الإسترجاع", color: "orange" },
    { value: "investigation", label: "قيد التحقيق", color: "purple" },
    { value: "suspendu", label: "موقوف مؤقتا", color: "yellow" },
    { value: "perdu", label: "معدوم", color: "red" },
    { value: "cash_only", label: "تسديد نقدا", color: "green" },
    { value: "banque_bloquee", label: "مغلق من البنك", color: "gray" },
  ];

  const tabs = [
    { id: 0, label: "معلومات الزبون", icon: User },
    { id: 1, label: "صورة الملف", icon: FileText },
    { id: 2, label: "المشتريات بالتقسيط", icon: ShoppingBag },
    { id: 3, label: "المشتريات نقدا", icon: CreditCard },
    { id: 4, label: "كشف الحساب", icon: BarChart3 },
  ];

  useEffect(() => {
    if (client) {
      setBloque(client.bloque ?? false);
      setStatut(client.statut ?? "non_classifie");
      setNote(client.note ?? "");
    }
  }, [client]);

  const handleOpenConfirm = (type) => {
    setActionType(type);
    setOpenConfirm(true);
  };

  const handleConfirm = async () => {
    if (actionType === "deleteFiles") {
      for (const file of client.fichiers || []) {
        await handleDeleteFile(file.id);
      }
      setDeleteFileChecked(false);
    }
    if (actionType === "updateClient") {
      await handleUpdateClient();
    }
    setOpenConfirm(false);
  };

  const handleUpdateClient = async () => {
    setLoading(true);
    try {
      await axios.patch(`/auth/clients/${client.id}/`, { bloque, statut });
      toast.success("✅ تم تحديث حالة الزبون بنجاح");
    } catch (error) {
      console.error(error);
      toast.error("❌ فشل تحديث الزبون");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async () => {
    setLoading(true);
    try {
      await axios.patch(`/auth/clients/${client.id}/`, { note });
      toast.success("✅ تم تحديث الملاحظة بنجاح");
      setIsEditingNote(false);
    } catch (error) {
      console.error(error);
      toast.error("❌ فشل تحديث الملاحظة");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await axios.delete(`/auth/clients/files/${fileId}/`);
      toast.success("✅ تم حذف الملف بنجاح");
    } catch (error) {
      console.error(error);
      toast.error("❌ فشل حذف الملف");
    }
  };

  if (!open || !client) return null;

  const clientFiles = client.fichiers?.map((file) => ({
    id: file.id,
    type: file.url?.toLowerCase().endsWith(".pdf") ? "pdf" : "image",
    name: file.name || `ملف ${file.id}`,
    url: file.url || "",
  })) || [];

  const getStatusColor = (statusValue) => {
    const status = statusColors[statusValue] || statusColors.non_classifie;
    return `${status.bg} ${status.text}`;
  };

  const getStatusLabel = (statusValue) => {
    return statusColors[statusValue]?.label || statusColors.non_classifie.label;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Personal Info */}
            <div className="space-y-4">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="text-amber-400 font-semibold mb-4">المعلومات الشخصية</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">الاسم الكامل:</span>
                    <span className="text-white">
                      {`${client.prenom_ar || ""} ${client.nom_famille_ar || ""} / ${client.prenom_fr || ""} ${client.nom_famille_fr || ""}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">رقم الحساب:</span>
                    <span className="text-white">{`${client.ccp || ""} - مفتاح ${client.cle || ""}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الدخل:</span>
                    <span className="text-white">{client.revenu ? `${client.revenu} د.ج` : "--"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">العنوان:</span>
                    <span className="text-white">{client.adresse || "--"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الهاتف:</span>
                    <span className="text-white">{client.telephone || "--"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">رقم الزبون:</span>
                    <span className="text-white">{client.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المهنة:</span>
                    <span className="text-white">{client.profession || "--"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">تاريخ الدخل:</span>
                    <span className="text-white">{client.jour ? `${client.jour} من كل شهر` : "--"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">التصنيف:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(statut)}`}>
                      {getStatusLabel(statut)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Card */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400">حظر الزبون</span>
                  <button
                    onClick={() => setBloque(!bloque)}
                    className={`px-3 py-1 rounded-lg transition ${
                      bloque 
                        ? "bg-red-500/20 text-red-400" 
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {bloque ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-slate-400 text-sm">استرجاع الملف</label>
                    <button
                      onClick={() => {
                        if (client.fichiers?.length > 0) {
                          handleOpenConfirm("deleteFiles");
                        } else {
                          toast.info("لا توجد ملفات لاسترجاعها");
                        }
                      }}
                      disabled={client.fichiers?.length === 0}
                      className="text-red-400 text-sm hover:text-red-300 transition disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-slate-400 text-sm mb-2">تصنيف الزبون</label>
                  <select
                    value={statut}
                    onChange={(e) => setStatut(e.target.value)}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                  >
                    {statutChoices.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleOpenConfirm("updateClient")}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-lg px-4 py-2 hover:from-amber-600 hover:to-yellow-700 transition disabled:opacity-50"
                >
                  {loading ? "جاري التحديث..." : "تحديث الحالة"}
                </button>
              </div>
            </div>

            {/* Right Column - Stats & Notes */}
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-gradient-to-r from-red-500/20 to-rose-600/20 border border-red-500/30 rounded-lg p-4 text-center">
                  <div className="text-red-300 text-sm">الدين الحالي</div>
                  <div className="text-red-400 text-2xl font-bold">
                    {(client.dette_actuelle_client || 0)} د.ج
                  </div>
                </div>
                <div className="bg-gradient-to-r from-emerald-500/20 to-green-600/20 border border-emerald-500/30 rounded-lg p-4 text-center">
                  <div className="text-emerald-300 text-sm">المدفوعات</div>
                  <div className="text-emerald-400 text-2xl font-bold">
                    {(client.montant_paye_effectif || 0)} د.ج
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-lg p-4 text-center">
                  <div className="text-blue-300 text-sm">المشتريات</div>
                  <div className="text-blue-400 text-2xl font-bold">
                    {(client.dette_totale_client || 0)} د.ج
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-400">ملاحظات</span>
                  {!isEditingNote && (
                    <button
                      onClick={() => setIsEditingNote(true)}
                      className="p-1 hover:bg-slate-600 rounded-lg transition"
                    >
                      <Edit className="w-4 h-4 text-amber-400" />
                    </button>
                  )}
                </div>
                {isEditingNote ? (
                  <div className="space-y-2">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                      placeholder="أضف ملاحظة..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateNote}
                        disabled={loading}
                        className="flex-1 bg-green-500 text-white rounded-lg px-3 py-1 hover:bg-green-600 transition disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 inline ml-1" />
                        حفظ
                      </button>
                      <button
                        onClick={() => setIsEditingNote(false)}
                        className="flex-1 bg-slate-600 text-white rounded-lg px-3 py-1 hover:bg-slate-500 transition"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-300">{note || "لا توجد ملاحظات"}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 1:
        return <ClientFilesView files={clientFiles} onDeleteFile={handleDeleteFile} />;

      case 2:
        return <VenteDetailFacilite clientId={client.id} />;

      case 3:
        return <VenteDetailCash clientId={client.id} />;

      case 4:
        return <ClientPaiementInfo clientId={client.id} />;

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 rounded-xl w-[1200px] max-h-[90vh] overflow-hidden shadow-2xl border border-amber-500/30"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-white text-xl font-bold">
                  {`${client.prenom_ar || ""} ${client.nom_famille_ar || ""}`}
                </h2>
                <p className="text-white/70 text-sm mt-1">
                  رقم العميل: {client.id}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700 bg-slate-900/50 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-b-2 border-amber-500 text-amber-400"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-130px)] p-6">
              {renderContent()}
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {openConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setOpenConfirm(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 rounded-xl w-[400px] overflow-hidden shadow-2xl border border-red-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <h2 className="text-white text-xl font-bold">تأكيد العملية</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-slate-300">
                  {actionType === "deleteFiles"
                    ? "هل أنت متأكد من استرجاع جميع الملفات؟"
                    : "هل تريد تحديث حالة الزبون؟"}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setOpenConfirm(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-red-500/50 transition"
                >
                  تأكيد
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}