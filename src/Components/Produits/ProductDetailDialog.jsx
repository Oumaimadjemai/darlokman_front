import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, ShoppingBag, CreditCard, BarChart3, Eye } from "lucide-react";
import axios from "../../api/axiosInstance";

export default function ProductDetailDialog({ open, onClose, product }) {
  const [activeTab, setActiveTab] = useState(0);
  const [achats, setAchats] = useState([]);
  const [ventesCash, setVentesCash] = useState([]);
  const [ventesFacilite, setVentesFacilite] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totaux, setTotaux] = useState(null);

  const role = localStorage.getItem("role");
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  };

  const tabs = [
    { id: 0, label: "الكمية", icon: Package },
    { id: 1, label: "المشتريات", icon: ShoppingBag },
    { id: 2, label: "المبيعات بالتقسيط", icon: CreditCard },
    { id: 3, label: "المبيعات كاش", icon: BarChart3 },
  ];

  // Fetch purchases (achats)
  useEffect(() => {
    if (open && product?.id && role === "admin") {
      const fetchAchats = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`/achat/par-group/?produit=${product.id}`, { headers });
          
          // Handle the nested response structure
          const result = response.data.results || response.data;
          let achatsData = result.achats_groupes || [];
          
          // Store totals
          setTotaux({
            nombre_achats: result.nombre_achats || 0,
            somme_totale: result.somme_totale || 0,
            somme_payee: result.somme_payee || 0,
            somme_restante: result.somme_restante || 0,
          });

          // Process each purchase to show only the lines for this product
          achatsData = achatsData.map((achat) => {
            // Filter lines for this specific product
            const productLines = (achat.achats || []).filter(
              (ligne) => ligne.produit === product.id
            );
            
            return {
              ...achat,
              productLines: productLines,
            };
          }).filter((achat) => achat.productLines.length > 0);

          // Sort by date (most recent first)
          achatsData.sort((a, b) => {
            const [dayA, monthA, yearA] = (a.date_formatee || "01/01/1900").split("/").map(Number);
            const [dayB, monthB, yearB] = (b.date_formatee || "01/01/1900").split("/").map(Number);
            const dateA = new Date(yearA, monthA - 1, dayA);
            const dateB = new Date(yearB, monthB - 1, dayB);
            return dateB - dateA;
          });

          setAchats(achatsData);
        } catch (err) {
          console.error("Error fetching achats:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchAchats();
    }
  }, [open, product, role]);

  // Fetch cash sales (ventes cash)
  useEffect(() => {
    if (open && product?.id && role === "admin") {
      const fetchVentesCash = async () => {
        try {
          const response = await axios.get(`/vente/liste/?produit=${product.id}`, { headers });
          let ventesData = response.data.ventes || [];

          ventesData = ventesData
            .map((vente) => ({
              ...vente,
              lignes_detail: (vente.lignes_detail || []).filter(
                (ligne) => ligne.produit === product.id
              ),
            }))
            .filter((vente) => vente.lignes_detail.length > 0);

          ventesData.sort((a, b) => {
            const dateA = new Date(a.date_vente || a.date_formatee);
            const dateB = new Date(b.date_vente || b.date_formatee);
            return dateB - dateA;
          });

          setVentesCash(ventesData);
        } catch (err) {
          console.error("Error fetching ventes cash:", err);
        }
      };
      fetchVentesCash();
    }
  }, [open, product, role]);

  // Fetch installment sales (ventes facilite)
  useEffect(() => {
    if (open && product?.id && role === "admin") {
      const fetchVentesFacilite = async () => {
        try {
          const response = await axios.get(`/vente/ventes-facilite/?produit=${product.id}`, { headers });
          let ventesData = response.data.ventes || [];

          ventesData = ventesData
            .map((vente) => ({
              ...vente,
              lignes_detail: (vente.lignes_detail || []).filter(
                (ligne) => ligne.produit === product.id
              ),
            }))
            .filter((vente) => vente.lignes_detail.length > 0);

          ventesData.sort((a, b) => {
            const [dayA, monthA, yearA] = (a.date_formatee || "01/01/1900").split("/").map(Number);
            const [dayB, monthB, yearB] = (b.date_formatee || "01/01/1900").split("/").map(Number);
            const dateA = new Date(yearA, monthA - 1, dayA);
            const dateB = new Date(yearB, monthB - 1, dayB);
            return dateB - dateA;
          });

          setVentesFacilite(ventesData);
        } catch (err) {
          console.error("Error fetching ventes facilite:", err);
        }
      };
      fetchVentesFacilite();
    }
  }, [open, product, role]);

  if (!open || !product) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side: Product Info */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <h3 className="text-indigo-400 font-semibold mb-4">معلومات المنتج</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">الاسم:</span>
                  <span className="text-white font-medium">{product.nom || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">المرجع:</span>
                  <span className="text-white">{product.reference || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">العائلة:</span>
                  <span className="text-white">{product.famille || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الكمية الإجمالية:</span>
                  <span className={`font-bold ${product.quantite_totale <= 5 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                    {product.quantite_totale || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">المخزن الرئيسي:</span>
                  <span className="text-white">{product.magasin_principal_detail?.nom || "-"}</span>
                </div>
                {product.magasins && product.magasins.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400">مخازن إضافية:</span>
                    <div className="space-y-1">
                      {product.magasins.map((mag, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-slate-400">{mag.nom}:</span>
                          <span className="text-white">{mag.quantite_totale} وحدة</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">العلامة التجارية:</span>
                  <span className="text-white">{product.marque || "-"}</span>
                </div>
              </div>
            </div>

            {/* Right side: Image */}
            <div className="bg-slate-700/30 rounded-lg p-4 flex items-center justify-center">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.nom}
                  className="max-w-full max-h-64 object-contain rounded-lg"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <Package className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p>لا توجد صورة متاحة</p>
                </div>
              )}
            </div>
          </div>
        );

      case 1:
        // Purchases tab - admin only
        if (role !== "admin") {
          return (
            <div className="text-center py-12 text-slate-400">
              <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>⚠️ ليس لديك صلاحية لعرض المشتريات</p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            {/* Summary Cards */}
            {totaux && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-lg p-3 text-center">
                  <div className="text-sm text-cyan-300">عدد المشتريات</div>
                  <div className="text-xl font-bold text-cyan-400">{totaux.nombre_achats || 0}</div>
                </div>
                <div className="bg-gradient-to-r from-emerald-500/20 to-green-600/20 border border-emerald-500/30 rounded-lg p-3 text-center">
                  <div className="text-sm text-emerald-300">المبلغ الإجمالي</div>
                  <div className="text-xl font-bold text-emerald-400">{parseFloat(totaux.somme_totale || 0)} د.ج</div>
                </div>
                <div className="bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border border-amber-500/30 rounded-lg p-3 text-center">
                  <div className="text-sm text-amber-300">المبلغ المدفوع</div>
                  <div className="text-xl font-bold text-amber-400">{parseFloat(totaux.somme_payee || 0)} د.ج</div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : achats.length > 0 ? (
              achats.map((achat) => {
                // Calculate total for this purchase (only for this product)
                const purchaseTotal = achat.productLines.reduce((sum, ligne) => {
                  const prixAchat = parseFloat(ligne.prix_achat) || 0;
                  const quantite = parseInt(ligne.quantite) || 0;
                  return sum + (prixAchat * quantite);
                }, 0);

                return (
                  <div key={achat.id} className="bg-slate-700/30 rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 p-3 border-b border-cyan-500/30">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="space-y-1">
                          <div className="text-sm text-slate-400">
                            <span className="text-cyan-400">تاريخ الشراء:</span> {achat.date_formatee || "--"}
                          </div>
                          <div className="text-sm text-slate-400">
                            <span className="text-cyan-400">الممون:</span> {achat.fournisseur_detail?.nom || "--"}
                          </div>
                        </div>
                        <div className="text-lg font-bold text-cyan-400">
                          الإجمالي: {purchaseTotal} د.ج
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-700/50 text-slate-300">
                            <th className="px-4 py-2 text-right">#</th>
                            <th className="px-4 py-2 text-right">سعر الشراء</th>
                            <th className="px-4 py-2 text-right">الكمية</th>
                            <th className="px-4 py-2 text-right">المخزن</th>
                            <th className="px-4 py-2 text-right">المجموع</th>
                           </tr>
                        </thead>
                        <tbody>
                          {achat.productLines.map((ligne, idx) => {
                            const prixAchat = parseFloat(ligne.prix_achat) || 0;
                            const quantite = parseInt(ligne.quantite) || 0;
                            const totalItem = prixAchat * quantite;
                            
                            return (
                              <tr key={ligne.id || idx} className="border-b border-slate-700">
                                <td className="px-4 py-2 text-cyan-300">{idx + 1}</td>
                                <td className="px-4 py-2 text-amber-300">{prixAchat} د.ج</td>
                                <td className="px-4 py-2 text-blue-300">{quantite}</td>
                                <td className="px-4 py-2 text-purple-300">{ligne.magasin_detail?.nom || "-"}</td>
                                <td className="px-4 py-2 text-emerald-300">{totalItem} د.ج</td>
                               </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد مشتريات لهذا المنتج</p>
              </div>
            )}
          </div>
        );

      case 2:
        // Installment sales tab - admin only
        if (role !== "admin") {
          return (
            <div className="text-center py-12 text-slate-400">
              <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>⚠️ ليس لديك صلاحية لعرض المبيعات</p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            {ventesFacilite.length > 0 ? (
              ventesFacilite.map((vente) => {
                const filteredLignes = vente.lignes_detail?.filter(
                  (ligne) => ligne.produit === product.id
                ) || [];
                const totalFiltered = filteredLignes.reduce(
                  (sum, ligne) => sum + (parseFloat(ligne.prix_unitaire || 0) * (parseInt(ligne.quantite_totale) || 0)),
                  0
                );

                if (filteredLignes.length === 0) return null;

                return (
                  <div key={vente.id} className="bg-slate-700/30 rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500/20 to-yellow-600/20 p-3 border-b border-amber-500/30">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="space-y-1">
                          <div className="text-sm text-slate-400">
                            <span className="text-amber-400">تاريخ البيع:</span> {vente.date_formatee || "--"}
                          </div>
                          <div className="text-sm text-slate-400">
                            <span className="text-amber-400">رقم البيع:</span> {vente.id}
                          </div>
                        </div>
                        <div className="text-lg font-bold text-amber-400">
                          الإجمالي: {totalFiltered} د.ج
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-700/50 text-slate-300">
                            <th className="px-4 py-2 text-right">#</th>
                            <th className="px-4 py-2 text-right">الزبون</th>
                            <th className="px-4 py-2 text-right">السعر</th>
                            <th className="px-4 py-2 text-right">الكمية</th>
                            <th className="px-4 py-2 text-right">المجموع</th>
                           </tr>
                        </thead>
                        <tbody>
                          {filteredLignes.map((ligne, idx) => (
                            <tr key={ligne.id || idx} className="border-b border-slate-700">
                              <td className="px-4 py-2 text-amber-300">{idx + 1}</td>
                              <td
                                className="px-4 py-2 text-blue-400 cursor-pointer hover:underline"
                                onClick={() => setSelectedClient(vente.client_detail)}
                              >
                                {vente.client_detail
                                  ? `${vente.client_detail.nom_famille_ar || ""} ${vente.client_detail.prenom_ar || ""}`
                                  : "-"}
                               </td>
                              <td className="px-4 py-2 text-emerald-300">{parseFloat(ligne.prix_unitaire || 0)} د.ج</td>
                              <td className="px-4 py-2 text-purple-300">{ligne.quantite_totale || 0}</td>
                              <td className="px-4 py-2 text-cyan-300">{parseFloat(ligne.sous_total || 0)} د.ج</td>
                             </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400">
                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد مبيعات بالتقسيط لهذا المنتج</p>
              </div>
            )}
          </div>
        );

      case 3:
        // Cash sales tab - admin only
        if (role !== "admin") {
          return (
            <div className="text-center py-12 text-slate-400">
              <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>⚠️ ليس لديك صلاحية لعرض المبيعات</p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            {ventesCash.length > 0 ? (
              ventesCash.map((vente) => (
                <div key={vente.id} className="bg-slate-700/30 rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500/20 to-green-600/20 p-3 border-b border-emerald-500/30">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="space-y-1">
                        <div className="text-sm text-slate-400">
                          <span className="text-emerald-400">تاريخ البيع:</span> {vente.date_formatee || "--"}
                        </div>
                        <div className="text-sm text-slate-400">
                          <span className="text-emerald-400">رقم البيع:</span> {vente.id}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-emerald-400">
                        الإجمالي: {vente.lignes_detail
                          .reduce((sum, ligne) => sum + parseFloat(ligne.sous_total || 0), 0)
                          } د.ج
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-700/50 text-slate-300">
                          <th className="px-4 py-2 text-right">#</th>
                          <th className="px-4 py-2 text-right">الزبون</th>
                          <th className="px-4 py-2 text-right">السعر</th>
                          <th className="px-4 py-2 text-right">الكمية</th>
                          <th className="px-4 py-2 text-right">المجموع</th>
                         </tr>
                      </thead>
                      <tbody>
                        {vente.lignes_detail.map((ligne, idx) => (
                          <tr key={ligne.id || idx} className="border-b border-slate-700">
                            <td className="px-4 py-2 text-emerald-300">{idx + 1}</td>
                            <td
                              className="px-4 py-2 text-blue-400 cursor-pointer hover:underline"
                              onClick={() => setSelectedClient(vente.client_detail)}
                            >
                              {vente.client_detail
                                ? `${vente.client_detail.nom_famille_ar || ""} ${vente.client_detail.prenom_ar || ""}`
                                : "-"}
                             </td>
                            <td className="px-4 py-2 text-amber-300">{parseFloat(ligne.prix_unitaire || 0)} د.ج</td>
                            <td className="px-4 py-2 text-purple-300">{ligne.quantite_totale || 0}</td>
                            <td className="px-4 py-2 text-cyan-300">{parseFloat(ligne.sous_total || 0)} د.ج</td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد مبيعات كاش لهذا المنتج</p>
              </div>
            )}
          </div>
        );

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
            className="bg-slate-800 rounded-xl w-[1000px] max-h-[90vh] overflow-hidden shadow-2xl border border-purple-500/30"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-white" />
                <h2 className="text-white text-xl font-bold">
                  تفاصيل المنتج #{product.id}
                </h2>
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
                      ? "border-b-2 border-purple-500 text-purple-400"
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

            {/* Footer */}
            <div className="border-t border-slate-700 px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}