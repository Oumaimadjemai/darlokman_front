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
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
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

// ============================================================
// Client Files View Component
// ============================================================
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

// ============================================================
// Vente Detail Facilite Component
// ============================================================
const VenteDetailFacilite = ({ clientId }) => {
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    
    const fetchVentes = async () => {
      try {
        const res = await axios.get(`/vente/ventes-facilite/?client=${clientId}`);
        
        let ventesData = [];
        
        if (res.data && res.data.results) {
          if (res.data.results.ventes && Array.isArray(res.data.results.ventes)) {
            ventesData = res.data.results.ventes;
          } else if (Array.isArray(res.data.results)) {
            ventesData = res.data.results;
          }
        } else if (res.data.ventes && Array.isArray(res.data.ventes)) {
          ventesData = res.data.ventes;
        }
        
        const ventesWithDetails = await Promise.all(
          ventesData.map(async (vente) => {
            try {
              const detailRes = await axios.get(`/vente/ventes-facilite/${vente.id}/`);
              return detailRes.data;
            } catch (err) {
              console.error(`Error fetching details for vente ${vente.id}:`, err);
              return vente;
            }
          })
        );
        
        const sortedVentes = ventesWithDetails.sort((a, b) => {
          const dateA = new Date(a.date_creation || a.date_formatee);
          const dateB = new Date(b.date_creation || b.date_formatee);
          return dateB - dateA;
        });
        
        setVentes(sortedVentes);
      } catch (err) {
        console.error("Error fetching ventes:", err);
        toast.error("فشل تحميل مشتريات العميل");
      } finally {
        setLoading(false);
      }
    };
    
    fetchVentes();
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

  const formatNumber = (num) => {
    if (num === undefined || num === null) return "0";
    return Number(num);
  };

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
                الإجمالي: {formatNumber(vente.montant_total)} د.ج
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
                {vente.lignes_detail && vente.lignes_detail.length > 0 ? (
                  vente.lignes_detail.map((ligne, idx) => (
                    <tr key={ligne.id || idx} className="border-b border-slate-700">
                      <td className="px-4 py-2 text-slate-300">{ligne.produit || idx + 1}</td>
                      <td className="px-4 py-2 text-slate-300">
                        {ligne.produit_detail?.reference || ligne.reference || ""}
                      </td>
                      <td className="px-4 py-2 text-slate-300">
                        {ligne.produit_detail?.nom || ligne.nom || ""}
                      </td>
                      <td className="px-4 py-2 text-slate-300">
                        {formatNumber(ligne.prix_unitaire)}
                      </td>
                      <td className="px-4 py-2 text-slate-300">{ligne.quantite || 0}</td>
                      <td className="px-4 py-2 text-slate-300">
                        {vente.magasin?.nom || ligne.magasin_detail?.nom || "--"}
                      </td>
                      <td className="px-4 py-2 text-slate-300">
                        {formatNumber(ligne.sous_total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-4 text-center text-slate-400">
                      لا توجد تفاصيل للمنتجات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-slate-800/50 flex justify-between items-center">
            <div className="text-sm">
              <span className="text-slate-400">المبلغ المدفوع:</span>{" "}
              <span className="text-green-400">{formatNumber(vente.montant_verse)} د.ج</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-400">المبلغ المتبقي:</span>{" "}
              <span className="text-red-400">{formatNumber(vente.montant_restant)} د.ج</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// Vente Detail Cash Component
// ============================================================
const VenteDetailCash = ({ clientId }) => {
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    
    const fetchVentes = async () => {
      try {
        const res = await axios.get(`/vente/liste/?client=${clientId}`);
        
        let ventesData = [];
        
        if (res.data && res.data.results) {
          if (Array.isArray(res.data.results)) {
            ventesData = res.data.results;
          } else if (res.data.results.ventes && Array.isArray(res.data.results.ventes)) {
            ventesData = res.data.results.ventes;
          }
        } else if (res.data.ventes && Array.isArray(res.data.ventes)) {
          ventesData = res.data.ventes;
        } else if (Array.isArray(res.data)) {
          ventesData = res.data;
        }
        
        const ventesWithDetails = await Promise.all(
          ventesData.map(async (vente) => {
            try {
              const detailRes = await axios.get(`/vente/liste/${vente.id}/`);
              return detailRes.data;
            } catch (err) {
              console.error(`Error fetching details for vente ${vente.id}:`, err);
              return vente;
            }
          })
        );
        
        const sortedVentes = ventesWithDetails.sort((a, b) => {
          const dateA = new Date(a.date_vente || a.date_formatee);
          const dateB = new Date(b.date_vente || b.date_formatee);
          return dateB - dateA;
        });
        
        setVentes(sortedVentes);
      } catch (error) {
        console.error("Error fetching ventes:", error);
        toast.error("فشل تحميل مشتريات العميل");
      } finally {
        setLoading(false);
      }
    };
    
    fetchVentes();
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

  const formatNumber = (num) => {
    if (num === undefined || num === null) return "0";
    return Number(num);
  };

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
                  <span className="text-amber-400">التاريخ:</span> {vente.date_formatee || vente.date_vente}
                </div>
              </div>
              <div className="text-lg font-bold text-amber-400">
                الإجمالي: {formatNumber(vente.montant_total)} د.ج
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
                {vente.lignes_detail && vente.lignes_detail.length > 0 ? (
                  vente.lignes_detail.map((ligne, idx) => (
                    <tr key={ligne.id || idx} className="border-b border-slate-700">
                      <td className="px-4 py-2 text-slate-300">{ligne.produit || idx + 1}</td>
                      <td className="px-4 py-2 text-slate-300">
                        {ligne.produit_detail?.reference || ligne.produit_reference || ""}
                      </td>
                      <td className="px-4 py-2 text-slate-300">
                        {ligne.produit_detail?.nom || ligne.produit_nom || ""}
                      </td>
                      <td className="px-4 py-2 text-slate-300">
                        {formatNumber(ligne.prix_unitaire)}
                      </td>
                      <td className="px-4 py-2 text-slate-300">{ligne.quantite || 0}</td>
                      <td className="px-4 py-2 text-slate-300">
                        {vente.magasin?.nom || ligne.magasin_detail?.nom || "--"}
                      </td>
                      <td className="px-4 py-2 text-slate-300">
                        {formatNumber(ligne.sous_total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-4 text-center text-slate-400">
                      لا توجد تفاصيل للمنتجات
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

const calculateDateFin = (dateDebut, nombreMois) => {
  const months = Number(nombreMois) || 0;
  if (!dateDebut || months <= 0) return null;
  return dayjs(dateDebut).add(months, "month").subtract(1, "month").format("YYYY-MM-DD");
};

// ============================================================
// Client Paiement Info Component
// ============================================================
const ClientPaiementInfo = ({ clientId }) => {
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    total_ventes: 0,
    total_amount: 0,
    total_paid: 0,
    total_restant: 0,
    paid_months: 0,
    pending_months: 0,
    unpaid_months: 0,
    progress_percentage: 0
  });

  useEffect(() => {
    if (!clientId) return;
    
    const fetchPaiements = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/vente/dashboard-paiements/?client=${clientId}`);
        
        console.log("Dashboard Paiements Response:", res.data);
        
        let results = [];
        let stats = {
          total_ventes: 0,
          total_amount: 0,
          total_paid: 0,
          total_restant: 0,
          paid_months: 0,
          pending_months: 0,
          unpaid_months: 0,
          progress_percentage: 0
        };
        
        if (res.data && res.data.results) {
          results = res.data.results;
          stats = res.data.stats || stats;
        } else if (Array.isArray(res.data)) {
          results = res.data;
        }
        
        if (results.length === 0) {
          setVentes([]);
          setOverallStats(stats);
          setLoading(false);
          return;
        }
        
        // Group by vente_id
        const groupedByVente = {};
        results.forEach(item => {
          const key = item.vente_id;
          if (!groupedByVente[key]) {
            groupedByVente[key] = {
              vente_id: key,
              client_name: item.name,
              client_ccp: item.ccp,
              month_payments: [],
              total_paid: 0,
              total_restant: 0,
              paid_months: 0,
              pending_months: 0,
              unpaid_months: 0,
              montant_total: 0,
              montant_mensuel: 0,
              nombre_mois: 0,
              solde_regle: false,
              date_debut: null,
              date_fin: null
            };
          }
          
          const amount = item.amount || 0;
          const status = item.status || 'pending';
          
          groupedByVente[key].month_payments.push({
            month_index: item.month_index,
            year: item.year,
            amount: amount,
            status: status,
            paiement_id: item.paiement_id,
            date: item.date
          });
          
          if (item.date && !groupedByVente[key].date_debut) {
            groupedByVente[key].date_debut = item.date;
          }
        });
        
        // For each vente, fetch additional details
        const ventesArray = await Promise.all(
          Object.values(groupedByVente).map(async (group) => {
            try {
              const venteRes = await axios.get(`/vente/ventes-facilite/${group.vente_id}/`);
              const venteData = venteRes.data;
              
              let totalPaid = 0;
              let totalRestant = 0;
              let paidMonths = 0;
              let pendingMonths = 0;
              let unpaidMonths = 0;
              
              group.month_payments.forEach(p => {
                if (p.status === 'paid') {
                  totalPaid += p.amount;
                  paidMonths++;
                } else if (p.status === 'pending') {
                  totalRestant += p.amount;
                  pendingMonths++;
                } else if (p.status === 'unpaid') {
                  totalRestant += p.amount;
                  unpaidMonths++;
                }
              });
              
              return {
                ...group,
                montant_total: parseFloat(venteData.montant_total) || 0,
                montant_mensuel: parseFloat(venteData.montant_mensuel) || 0,
                nombre_mois: parseInt(venteData.nombre_mois) || 0,
                date_debut: venteData.date_debut || group.date_debut,
                date_fin: venteData.date_fin || null,
                solde_regle: venteData.solde_regle || false,
                total_paid: totalPaid,
                total_restant: totalRestant,
                paid_months: paidMonths,
                pending_months: pendingMonths,
                unpaid_months: unpaidMonths
              };
            } catch (err) {
              console.error(`Error fetching vente ${group.vente_id}:`, err);
              let totalPaid = 0;
              let totalRestant = 0;
              let paidMonths = 0;
              let pendingMonths = 0;
              let unpaidMonths = 0;
              
              group.month_payments.forEach(p => {
                if (p.status === 'paid') {
                  totalPaid += p.amount;
                  paidMonths++;
                } else if (p.status === 'pending') {
                  totalRestant += p.amount;
                  pendingMonths++;
                } else if (p.status === 'unpaid') {
                  totalRestant += p.amount;
                  unpaidMonths++;
                }
              });
              
              return {
                ...group,
                montant_total: totalPaid + totalRestant,
                montant_mensuel: group.month_payments.length > 0 ? group.month_payments[0].amount : 0,
                nombre_mois: group.month_payments.length,
                solde_regle: totalRestant <= 0,
                total_paid: totalPaid,
                total_restant: totalRestant,
                paid_months: paidMonths,
                pending_months: pendingMonths,
                unpaid_months: unpaidMonths
              };
            }
          })
        );
        
        const sortedVentes = ventesArray.sort((a, b) => {
          const dateA = a.date_debut ? new Date(a.date_debut) : 0;
          const dateB = b.date_debut ? new Date(b.date_debut) : 0;
          return dateB - dateA;
        });
        
        setVentes(sortedVentes);
        setOverallStats(stats);
        
      } catch (error) {
        console.error("Error fetching client payment info:", error);
        toast.error("فشل تحميل معلومات الدفع");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaiements();
  }, [clientId]);

  const formatNumber = (num) => {
    if (num === undefined || num === null) return "0";
    return Number(num).toFixed(0);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 mt-2">جاري تحميل معلومات الدفع...</p>
      </div>
    );
  }

  if (ventes.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-500" />
        <p>لا توجد بيانات دفع حالياً</p>
        <p className="text-sm mt-2">لا توجد مشتريات بالتقسيط مسجلة لهذا العميل</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats Summary */}
      <div className="bg-gradient-to-r from-amber-500/10 to-yellow-600/10 border border-amber-500/30 rounded-lg p-4">
        <h3 className="text-amber-400 font-semibold mb-3">📊 ملخص عام</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-slate-400">عدد المشتريات</div>
            <div className="text-xl font-bold text-white">
              {overallStats.total_ventes || ventes.length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-400">إجمالي المشتريات</div>
            <div className="text-xl font-bold text-white">
              {formatNumber(overallStats.total_amount || ventes.reduce((sum, v) => sum + v.montant_total, 0))} د.ج
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-400">إجمالي المدفوع</div>
            <div className="text-xl font-bold text-green-400">
              {formatNumber(overallStats.total_paid || ventes.reduce((sum, v) => sum + v.total_paid, 0))} د.ج
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-400">إجمالي المتبقي</div>
            <div className="text-xl font-bold text-red-400">
              {formatNumber(overallStats.total_restant || ventes.reduce((sum, v) => sum + v.total_restant, 0))} د.ج
            </div>
          </div>
        </div>
        
        {overallStats.total_amount > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-sm text-slate-400 mb-1">
              <span>نسبة الإنجاز الكلية</span>
              <span className="text-amber-400">{overallStats.progress_percentage || 
                Math.round((ventes.reduce((sum, v) => sum + v.total_paid, 0) / ventes.reduce((sum, v) => sum + v.montant_total, 0)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(overallStats.progress_percentage || 
                  Math.round((ventes.reduce((sum, v) => sum + v.total_paid, 0) / ventes.reduce((sum, v) => sum + v.montant_total, 0)) * 100), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0%</span>
              <span>{ventes.reduce((sum, v) => sum + v.paid_months, 0)} / {ventes.reduce((sum, v) => sum + v.nombre_mois, 0)} شهر</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>

      {/* Individual Ventes */}
      {ventes.map((vente) => {
        const progressPercent = vente.montant_total > 0 
          ? (vente.total_paid / vente.montant_total) * 100 
          : 0;
        const isComplete = vente.solde_regle || progressPercent >= 100;
        const totalMonths = vente.paid_months + vente.pending_months + vente.unpaid_months;
        
        return (
          <div key={vente.vente_id} className="bg-slate-700/30 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500/20 to-yellow-600/20 p-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <div className="text-sm text-slate-400">
                    <span className="text-amber-400">البيع رقم:</span> #{vente.vente_id}
                  </div>
                  <div className="text-sm text-slate-400">
                    <span className="text-amber-400">العميل:</span> {vente.client_name}
                  </div>
                  <div className="text-sm text-slate-400">
                    <span className="text-amber-400">CCP:</span> {vente.client_ccp || "--"}
                  </div>
                  <div className="text-sm text-slate-400">
                    <span className="text-amber-400">الفترة:</span>{" "}
                    {vente.date_debut ? dayjs(vente.date_debut).format("DD/MM/YYYY") : "--"} 
                    {vente.date_fin ? ` - ${dayjs(vente.date_fin).format("DD/MM/YYYY")}` : ""}
                  </div>
                  {vente.nombre_mois > 0 && (
                    <div className="text-sm text-slate-400">
                      <span className="text-amber-400">عدد الأشهر:</span> {vente.nombre_mois} شهر
                    </div>
                  )}
                  <div className="flex gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-emerald-400">
                      ✓ مدفوع: {vente.paid_months}
                    </span>
                    <span className="text-xs text-amber-400">
                      ⏳ معلق: {vente.pending_months}
                    </span>
                    <span className="text-xs text-red-400">
                      ✗ غير مدفوع: {vente.unpaid_months}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-slate-400">الدفعة الشهرية</div>
                  <div className="text-lg font-bold text-amber-400">
                    {formatNumber(vente.montant_mensuel)} د.ج
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-slate-400">المبلغ الإجمالي</div>
                  <div className="text-lg font-bold text-white">
                    {formatNumber(vente.montant_total)} د.ج
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-sm text-slate-400">المجموع المدفوع</div>
                  <div className="text-lg font-bold text-green-400">
                    {formatNumber(vente.total_paid)} د.ج
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-slate-400">المبلغ المتبقي</div>
                  <div className="text-lg font-bold text-red-400">
                    {formatNumber(vente.total_restant)} د.ج
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-slate-400">نسبة الإنجاز</div>
                  <div className="text-lg font-bold text-amber-400">
                    {Math.round(progressPercent)}%
                  </div>
                </div>
              </div>
              
              {vente.montant_total > 0 && (
                <div>
                  <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        isComplete 
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                          : 'bg-gradient-to-r from-amber-500 to-yellow-500'
                      }`}
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>0%</span>
                    <span>
                      {vente.paid_months} / {totalMonths || vente.nombre_mois} شهر مدفوع
                    </span>
                    <span>100%</span>
                  </div>
                </div>
              )}

              {isComplete && (
                <div className="mt-4 bg-green-500/20 text-green-400 text-center py-2 rounded-lg text-sm font-medium">
                  ✓ ✅ تم تسديد كامل المبلغ
                </div>
              )}
              
              {!isComplete && vente.total_restant > 0 && (
                <div className="mt-4 bg-amber-500/10 text-amber-400 text-center py-2 rounded-lg text-sm border border-amber-500/20">
                  ⚠️ متبقي {formatNumber(vente.total_restant)} د.ج غير مدفوعة
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// Client Info Tab Component with Payment Summary
// ============================================================
const ClientInfoTab = ({ client, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [paymentStats, setPaymentStats] = useState({
    total_ventes: 0,
    total_amount: 0,
    total_paid: 0,
    total_restant: 0,
    paid_months: 0,
    pending_months: 0,
    unpaid_months: 0,
    progress_percentage: 0,
    ventes: []
  });

  const fetchPaymentStats = async () => {
    if (!client?.id) return;
    setLoading(true);
    try {
      const res = await axios.get(`/vente/dashboard-paiements/?client=${client.id}`);
      
      let stats = {
        total_ventes: 0,
        total_amount: 0,
        total_paid: 0,
        total_restant: 0,
        paid_months: 0,
        pending_months: 0,
        unpaid_months: 0,
        progress_percentage: 0,
        ventes: []
      };
      
      if (res.data && res.data.stats) {
        stats = {
          ...res.data.stats,
          ventes: res.data.results || []
        };
      }
      
      setPaymentStats(stats);
    } catch (error) {
      console.error("Error fetching payment stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (client?.id) {
      fetchPaymentStats();
    }
  }, [client?.id]);

  const formatNumber = (num) => {
    if (num === undefined || num === null) return "0";
    return Number(num).toFixed(0);
  };

  const getStatusColor = (statusValue) => {
    const status = statusColors[statusValue] || statusColors.non_classifie;
    return `${status.bg} ${status.text}`;
  };

  const getStatusLabel = (statusValue) => {
    return statusColors[statusValue]?.label || statusColors.non_classifie.label;
  };

  const formatTelephones = (telephones) => {
    if (!Array.isArray(telephones)) return "--";
    const validTelephones = telephones.filter((phone) => phone && phone.trim() !== "");
    return validTelephones.length > 0 ? validTelephones.join(" / ") : "--";
  };

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
              <span className="text-white">{client.revenu ? `${formatNumber(client.revenu)} د.ج` : "--"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">العنوان:</span>
              <span className="text-white">{client.adresse || "--"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">الهاتف:</span>
              <span className="text-white">{formatTelephones(client.telephones)}</span>
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
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(client.statut || "non_classifie")}`}>
                {getStatusLabel(client.statut || "non_classifie")}
              </span>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-400">حظر الزبون</span>
            <button
              onClick={() => onUpdate('bloque', !client.bloque)}
              className={`px-3 py-1 rounded-lg transition ${
                client.bloque 
                  ? "bg-red-500/20 text-red-400" 
                  : "bg-green-500/20 text-green-400"
              }`}
            >
              {client.bloque ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-slate-400 text-sm">استرجاع الملفات</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recupererFichiers"
                  checked={client.recuperer_fichiers || false}
                  onChange={(e) => onUpdate('recuperer_fichiers', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                />
                <label htmlFor="recupererFichiers" className="text-slate-300 text-sm cursor-pointer">
                  {client.recuperer_fichiers ? "نعم" : "لا"}
                </label>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              تفعيل هذا الخيار لاسترجاع ملفات العميل
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-slate-400 text-sm mb-2">تصنيف الزبون</label>
            <select
              value={client.statut || "non_classifie"}
              onChange={(e) => onUpdate('statut', e.target.value)}
              className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
            >
              {Object.entries(statusColors).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => onUpdate('save')}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-lg px-4 py-2 hover:from-amber-600 hover:to-yellow-700 transition"
          >
            تحديث الحالة
          </button>
        </div>
      </div>

      {/* Right Column - Stats & Payment Summary */}
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-gradient-to-r from-red-500/20 to-rose-600/20 border border-red-500/30 rounded-lg p-4 text-center">
            <div className="text-red-300 text-sm">الدين الحالي</div>
            <div className="text-red-400 text-2xl font-bold">
              {formatNumber(paymentStats.total_restant || 0)} د.ج
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-500/20 to-green-600/20 border border-emerald-500/30 rounded-lg p-4 text-center">
            <div className="text-emerald-300 text-sm">المدفوعات</div>
            <div className="text-emerald-400 text-2xl font-bold">
              {formatNumber(paymentStats.total_paid || 0)} د.ج
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-lg p-4 text-center">
            <div className="text-blue-300 text-sm">المشتريات</div>
            <div className="text-blue-400 text-2xl font-bold">
              {formatNumber(paymentStats.total_amount || 0)} د.ج
            </div>
          </div>
        </div>

        {/* Payment Progress */}
        {paymentStats.total_amount > 0 && (
          <div className="bg-slate-700/30 rounded-lg p-4">
            <h4 className="text-slate-300 text-sm mb-3">نسبة الإنجاز</h4>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>0%</span>
              <span className="text-amber-400">{paymentStats.progress_percentage || 
                Math.round((paymentStats.total_paid / paymentStats.total_amount) * 100)}%
              </span>
              <span>100%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(paymentStats.progress_percentage || 
                  Math.round((paymentStats.total_paid / paymentStats.total_amount) * 100), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0%</span>
              <span>{paymentStats.paid_months || 0} / {(paymentStats.paid_months || 0) + (paymentStats.pending_months || 0) + (paymentStats.unpaid_months || 0)} شهر</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Month Status Summary */}
        {(paymentStats.paid_months > 0 || paymentStats.pending_months > 0 || paymentStats.unpaid_months > 0) && (
          <div className="bg-slate-700/30 rounded-lg p-4">
            <h4 className="text-slate-300 text-sm mb-3">حالة الأشهر</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center bg-emerald-500/10 rounded-lg p-2">
                <div className="text-emerald-400 text-lg font-bold">{paymentStats.paid_months || 0}</div>
                <div className="text-emerald-300 text-xs">مدفوع</div>
              </div>
              <div className="text-center bg-amber-500/10 rounded-lg p-2">
                <div className="text-amber-400 text-lg font-bold">{paymentStats.pending_months || 0}</div>
                <div className="text-amber-300 text-xs">معلق</div>
              </div>
              <div className="text-center bg-red-500/10 rounded-lg p-2">
                <div className="text-red-400 text-lg font-bold">{paymentStats.unpaid_months || 0}</div>
                <div className="text-red-300 text-xs">غير مدفوع</div>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-slate-700/30 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-400">ملاحظات</span>
            {!client.isEditingNote && (
              <button
                onClick={() => onUpdate('editNote', true)}
                className="p-1 hover:bg-slate-600 rounded-lg transition"
              >
                <Edit className="w-4 h-4 text-amber-400" />
              </button>
            )}
          </div>
          {client.isEditingNote ? (
            <div className="space-y-2">
              <textarea
                value={client.note || ""}
                onChange={(e) => onUpdate('note', e.target.value)}
                rows={3}
                className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                placeholder="أضف ملاحظة..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdate('saveNote')}
                  className="flex-1 bg-green-500 text-white rounded-lg px-3 py-1 hover:bg-green-600 transition"
                >
                  <Save className="w-4 h-4 inline ml-1" />
                  حفظ
                </button>
                <button
                  onClick={() => onUpdate('editNote', false)}
                  className="flex-1 bg-slate-600 text-white rounded-lg px-3 py-1 hover:bg-slate-500 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-300">{client.note || "لا توجد ملاحظات"}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
export default function ClientDetailDialog({ open, onClose, client }) {
  const [activeTab, setActiveTab] = useState(0);
  const [bloque, setBloque] = useState(false);
  const [statut, setStatut] = useState("non_classifie");
  const [note, setNote] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [recupererFichiers, setRecupererFichiers] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [actionType, setActionType] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientDetails, setClientDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  // Fetch client details including debt information
  const fetchClientDetails = async () => {
    if (!client?.id) return;
    
    setLoadingDetails(true);
    try {
      const response = await axios.get(`/auth/clients/${client.id}/`);
      
      // Fetch payment stats from dashboard-paiements
      const paymentRes = await axios.get(`/vente/dashboard-paiements/?client=${client.id}`);
      
      let stats = {
        total_ventes: 0,
        total_amount: 0,
        total_paid: 0,
        total_restant: 0,
        paid_months: 0,
        pending_months: 0,
        unpaid_months: 0,
        progress_percentage: 0
      };
      
      if (paymentRes.data && paymentRes.data.stats) {
        stats = paymentRes.data.stats;
      }
      
      setClientDetails({
        ...response.data,
        ...stats
      });
      
      setBloque(response.data.bloque ?? false);
      setStatut(response.data.statut ?? "non_classifie");
      setNote(response.data.note ?? "");
      setRecupererFichiers(response.data.recuperer_fichiers ?? false);
    } catch (error) {
      console.error("Error fetching client details:", error);
      toast.error("فشل تحميل تفاصيل العميل");
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (open && client) {
      fetchClientDetails();
    }
  }, [open, client]);

  const handleOpenConfirm = (type) => {
    setActionType(type);
    setOpenConfirm(true);
  };

  const handleConfirm = async () => {
    if (actionType === "updateClient") {
      await handleUpdateClient();
    }
    setOpenConfirm(false);
  };

  const handleUpdateClient = async () => {
    setLoading(true);
    try {
      await axios.patch(`/auth/clients/${client.id}/`, { 
        bloque, 
        statut,
        recuperer_fichiers: recupererFichiers
      });
      toast.success("✅ تم تحديث حالة الزبون بنجاح");
      await fetchClientDetails();
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
      await fetchClientDetails();
    } catch (error) {
      console.error(error);
      toast.error("❌ فشل تحديث الملاحظة");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = (field, value) => {
    if (field === 'bloque') setBloque(value);
    else if (field === 'statut') setStatut(value);
    else if (field === 'recuperer_fichiers') setRecupererFichiers(value);
    else if (field === 'note') setNote(value);
    else if (field === 'editNote') setIsEditingNote(value);
    else if (field === 'save') handleOpenConfirm("updateClient");
    else if (field === 'saveNote') handleUpdateNote();
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await axios.delete(`/auth/clients/files/${fileId}/`);
      toast.success("✅ تم حذف الملف بنجاح");
      await fetchClientDetails();
    } catch (error) {
      console.error(error);
      toast.error("❌ فشل حذف الملف");
    }
  };

  if (!open || !client) return null;

  const currentClient = clientDetails || client;
  const clientFiles = currentClient.fichiers?.map((file) => ({
    id: file.id,
    type: file.url?.toLowerCase().endsWith(".pdf") ? "pdf" : "image",
    name: file.name || `ملف ${file.id}`,
    url: file.url || "",
  })) || [];

  const renderContent = () => {
    if (loadingDetails && activeTab === 0) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 0:
        return (
          <ClientInfoTab 
            client={{
              ...currentClient,
              bloque,
              statut,
              note,
              isEditingNote,
              recuperer_fichiers: recupererFichiers
            }}
            onUpdate={handleUpdateField}
          />
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
                  {`${currentClient.prenom_ar || ""} ${currentClient.nom_famille_ar || ""}`}
                </h2>
                <p className="text-white/70 text-sm mt-1">
                  رقم العميل: {currentClient.id}
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
            className="bg-slate-800 rounded-xl w-[400px] overflow-hidden shadow-2xl border border-amber-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
              <h2 className="text-white text-xl font-bold">تأكيد العملية</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-8 h-8 text-amber-400" />
                <p className="text-slate-300">
                  هل تريد تحديث حالة الزبون؟
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
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:shadow-amber-500/50 transition"
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