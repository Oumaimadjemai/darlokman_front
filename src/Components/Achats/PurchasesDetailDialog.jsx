import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Truck, DollarSign, Calendar, User, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function PurchaseDetailDialog({ open, onClose, purchase }) {
  if (!open || !purchase) return null;

  const total = parseFloat(purchase.total) || parseFloat(purchase.somme_totale) || 0;
  const paid = parseFloat(purchase.somme_payee) || 0;
  const remaining = parseFloat(purchase.somme_restante) || 0;

  // Get the date from multiple possible field names
  const getDate = () => {
    if (purchase.date_formatee) {
      return purchase.date_formatee;
    }
    if (purchase.date_creation) {
      try {
        return format(new Date(purchase.date_creation), 'dd MMMM yyyy', { locale: ar });
      } catch {
        return purchase.date_creation;
      }
    }
    if (purchase.date) {
      try {
        return format(new Date(purchase.date), 'dd MMMM yyyy', { locale: ar });
      } catch {
        return purchase.date;
      }
    }
    return 'غير معروف';
  };

  const dateDisplay = getDate();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 rounded-xl w-[800px] max-h-[90vh] overflow-hidden shadow-2xl border border-cyan-500/30"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-white" />
                <h2 className="text-white text-xl font-bold">
                  تفاصيل عملية الشراء #{purchase.id}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-130px)] p-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                  <Truck className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <div className="text-sm text-slate-400">المورد</div>
                  <div className="text-white font-semibold mt-1">
                    {purchase.fournisseur_detail?.nom || 'غير معروف'}
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                  <Calendar className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <div className="text-sm text-slate-400">التاريخ</div>
                  <div className="text-white font-semibold mt-1">
                    {dateDisplay}
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                  <User className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <div className="text-sm text-slate-400">المستخدم</div>
                  <div className="text-white font-semibold mt-1">
                    {purchase.utilisateur_detail?.username || 'غير معروف'}
                  </div>
                </div>
              </div>

              {/* Financial Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-emerald-500/20 to-green-600/20 border border-emerald-500/30 rounded-lg p-4 text-center">
                  <div className="text-sm text-emerald-300">المبلغ الإجمالي</div>
                  <div className="text-2xl font-bold text-emerald-400">{total} </div>
                </div>
                <div className="bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border border-amber-500/30 rounded-lg p-4 text-center">
                  <div className="text-sm text-amber-300">المبلغ المدفوع</div>
                  <div className="text-2xl font-bold text-amber-400">{paid} </div>
                </div>
                <div className="bg-gradient-to-r from-red-500/20 to-rose-600/20 border border-red-500/30 rounded-lg p-4 text-center">
                  <div className="text-sm text-red-300">المبلغ المتبقي</div>
                  <div className="text-2xl font-bold text-red-400">{remaining} </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-slate-700/30 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-600 to-blue-700 px-4 py-3">
                  <h3 className="text-white flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    المنتجات المشتراة
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-700/50 text-slate-300">
                        <th className="px-4 py-2 text-right">#</th>
                        <th className="px-4 py-2 text-right">المنتج</th>
                        <th className="px-4 py-2 text-right">المرجع</th>
                        <th className="px-4 py-2 text-right">الكمية</th>
                        <th className="px-4 py-2 text-right">سعر الشراء</th>
                        <th className="px-4 py-2 text-right">المجموع</th>
                        <th className="px-4 py-2 text-right">المخزن</th>
                       </tr>
                    </thead>
                    <tbody>
                      {purchase.achats && purchase.achats.length > 0 ? (
                        purchase.achats.map((item, index) => {
                          const prixAchat = parseFloat(item.prix_achat) || 0;
                          const quantite = parseInt(item.quantite) || 0;
                          const totalItem = prixAchat * quantite;
                          
                          return (
                            <tr key={item.id || index} className="border-b border-slate-700">
                              <td className="px-4 py-2 text-cyan-300">{index + 1}</td>
                              <td className="px-4 py-2 text-white">{item.produit_detail?.nom || 'غير معروف'}</td>
                              <td className="px-4 py-2 text-slate-300 font-mono text-xs">{item.produit_detail?.reference || '-'}</td>
                              <td className="px-4 py-2 text-blue-300">{quantite}</td>
                              <td className="px-4 py-2 text-amber-300">{prixAchat} </td>
                              <td className="px-4 py-2 text-emerald-300 font-medium">{totalItem} </td>
                              <td className="px-4 py-2 text-purple-300">{item.magasin_detail?.nom || 'غير معروف'}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                            لا توجد منتجات في هذه العملية
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
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