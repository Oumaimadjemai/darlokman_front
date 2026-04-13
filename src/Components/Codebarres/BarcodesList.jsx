import { useState, useEffect } from "react";
import { Search, Barcode, Printer, Trash2, Package, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "../../api/axiosInstance";
import JsBarcode from "jsbarcode";

export function BarcodesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [magasins, setMagasins] = useState([]);
  const [filterValue, setFilterValue] = useState("");
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [printedCodeBarres, setPrintedCodeBarres] = useState([]);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // Fetch magasins
  useEffect(() => {
    const fetchMagasins = async () => {
      try {
        const access_token = localStorage.getItem("access_token");
        const response = await axios.get("/param/magasins/", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        setMagasins(response.data.results || []);
      } catch (error) {
        console.error("Erreur lors du chargement des magasins :", error);
      }
    };
    fetchMagasins();
  }, []);

  // Fetch products
  const fetchProduits = async () => {
    try {
      setLoading(true);
      const access_token = localStorage.getItem("access_token");
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterValue) params.magasin = filterValue;

      const response = await axios.get("/prod/produits/", {
        headers: { Authorization: `Bearer ${access_token}` },
        params,
      });
      setProduits(response.data.results || []);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
      toast.error("خطأ في تحميل المنتجات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProduits();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, filterValue]);

  const handlePrintBarcode = (produit, codebarre, magasinNom) => {
    setSelectedProduit({ ...produit, codebarre, magasinNom });
    setShowPrintDialog(true);
  };

  const handleDeleteBarcode = async (produit, codebarre, magasinNom) => {
    try {
      const access_token = localStorage.getItem("access_token");
      
      // Find the magasin that contains this barcode
      let targetMagasin = null;
      let magasinIndex = -1;
      
      if (produit.magasins && Array.isArray(produit.magasins)) {
        magasinIndex = produit.magasins.findIndex(mag => 
          mag.nom === magasinNom && mag.codes_barres && mag.codes_barres.includes(codebarre)
        );
        if (magasinIndex !== -1) {
          targetMagasin = produit.magasins[magasinIndex];
        }
      }
      
      if (!targetMagasin) {
        toast.error("الباركود غير موجود في هذا المخزن");
        return;
      }
      
      // Remove the barcode from the magasin's codes_barres array
      const updatedMagasinCodes = targetMagasin.codes_barres.filter(cb => cb !== codebarre);
      
      // Update the magasins array
      const updatedMagasins = [...produit.magasins];
      updatedMagasins[magasinIndex] = {
        ...targetMagasin,
        codes_barres: updatedMagasinCodes
      };
      
      // Update the global codes_barres array
      const updatedGlobalCodes = (produit.codes_barres || []).filter(cb => cb !== codebarre);
      
      // Prepare the update payload
      const updateData = {
        magasins: updatedMagasins,
        codes_barres: updatedGlobalCodes
      };
      
      // Send update to backend
      await axios.patch(
        `/prod/produits/${produit.id}/`,
        updateData,
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );
      
      toast.success(`✅ تم حذف الباركود بنجاح`);
      fetchProduits(); // Refresh the list
    } catch (error) {
      console.error("Erreur lors de la suppression du code-barre :", error);
      toast.error("فشل حذف الباركود");
    }
  };

  // Group products by magasin
  const groupProductsByMagasin = () => {
    const groups = {};
    
    produits.forEach((produit) => {
      let hasStock = false;
      
      if (produit.magasins && Array.isArray(produit.magasins)) {
        produit.magasins.forEach(mag => {
          const magQuantity = mag.codes_barres?.length || 0;
          const magNom = mag.nom;
          
          if (magQuantity > 0 && magNom && magNom !== "undefined" && magNom !== "null") {
            hasStock = true;
            
            if (!groups[magNom]) {
              groups[magNom] = {
                nom: magNom,
                id: mag.id,
                produits: []
              };
            }
            
            groups[magNom].produits.push({
              ...produit,
              displayQuantity: magQuantity,
              displayCodes: mag.codes_barres || []
            });
          }
        });
      }
      
      if (!hasStock) {
        const groupName = "بدون مخزن";
        if (!groups[groupName]) {
          groups[groupName] = {
            nom: groupName,
            id: null,
            produits: []
          };
        }
        
        groups[groupName].produits.push({
          ...produit,
          displayQuantity: 0,
          displayCodes: []
        });
      }
    });
    
    let filteredGroups = Object.values(groups);
    
    if (filterValue) {
      const selectedMagasin = magasins.find(m => m.id == filterValue);
      if (selectedMagasin) {
        filteredGroups = filteredGroups.filter(group => group.nom === selectedMagasin.nom);
      }
    }
    
    return filteredGroups
      .filter(group => group.produits.length > 0)
      .sort((a, b) => {
        if (a.nom === "بدون مخزن") return 1;
        if (b.nom === "بدون مخزن") return -1;
        return a.nom.localeCompare(b.nom);
      });
  };

  const groupedMagasins = groupProductsByMagasin();
  const totalProducts = produits.length;
  const totalBarcodes = produits.reduce(
    (sum, p) => sum + (p.codes_barres?.length || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              <div className="text-xs text-blue-300">المنتجات:</div>
              <div className="text-lg text-white">{totalProducts}</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <Barcode className="w-4 h-4 text-purple-400" />
              <div className="text-xs text-purple-300">الباركودات:</div>
              <div className="text-lg text-white">{totalBarcodes}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
          <input
            type="text"
            placeholder="البحث عن منتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500 placeholder-slate-400"
          />
        </div>
        <div className="relative w-64">
          <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-10 py-2 text-white focus:border-amber-500 focus:outline-none appearance-none"
          >
            <option value="">جميع المخازن</option>
            {magasins.map((mag) => (
              <option key={mag.id} value={mag.id}>
                {mag.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products List by Magasin */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : groupedMagasins.length > 0 ? (
        groupedMagasins.map((magasin, index) => (
          <div
            key={`${magasin.nom}-${index}`}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl overflow-hidden shadow-lg"
          >
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
              <h2 className="text-white text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {magasin.nom}
                {magasin.nom !== "بدون مخزن" && (
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">
                    {magasin.produits.length} منتج
                  </span>
                )}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                    <th className="px-4 py-3 text-right">رقم</th>
                    <th className="px-4 py-3 text-right">المرجع</th>
                    <th className="px-4 py-3 text-right">اسم المنتج</th>
                    <th className="px-4 py-3 text-right">الكمية</th>
                    <th className="px-4 py-3 text-right">الباركودات</th>
                    
                   </tr>
                </thead>
                <tbody>
                  {magasin.produits.map((produit, idx) => {
                    const displayQuantity = produit.displayQuantity || 0;
                    const displayCodes = produit.displayCodes || [];
                    
                    return (
                      <motion.tr
                        key={`${produit.id}-${magasin.nom}-${idx}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`border-b border-slate-700/50 transition-all ${
                          idx % 2 === 0 ? "bg-slate-800/30" : "bg-slate-900/30"
                        }`}
                      >
                        <td className="px-4 py-3 text-purple-300">{produit.id}</td>
                        <td className="px-4 py-3 text-blue-300 font-mono">
                          {produit.reference || "—"}
                        </td>
                        <td className="px-4 py-3 text-white font-medium">
                          {produit.nom}
                        </td>
                        <td className="px-4 py-3 text-amber-300">
                          {displayQuantity}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {displayCodes.length > 0 ? (
                              displayCodes.map((cb, i) => (
                                <button
                                  key={i}
                                  onClick={() => handlePrintBarcode(produit, cb, magasin.nom)}
                                  className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                                    printedCodeBarres.includes(cb)
                                      ? "bg-emerald-500/30 text-emerald-300"
                                      : "bg-slate-700 text-slate-300 hover:bg-purple-500/30 hover:text-purple-300"
                                  }`}
                                >
                                  {cb}
                                </button>
                              ))
                            ) : (
                              <span className="text-slate-500 text-xs">لا توجد باركودات</span>
                            )}
                          </div>
                        </td>
                       
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-12 text-center">
          <Barcode className="w-16 h-16 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">لا توجد منتجات للعرض</p>
        </div>
      )}

      {/* Footer with Summary */}
      {groupedMagasins.length > 0 && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 rounded-lg border border-amber-500/30">
          <div className="flex justify-between items-center text-sm">
            <div className="text-slate-400">
              إجمالي المنتجات: <span className="text-white font-bold">{totalProducts}</span>
            </div>
            <div className="text-purple-400">
              إجمالي الباركودات: <span className="text-white font-bold">{totalBarcodes}</span>
            </div>
          </div>
        </div>
      )}

      {/* Print Dialog */}
      {showPrintDialog && selectedProduit && (
        <BarcodePrintDialog
          selectedProduit={selectedProduit}
          onClose={() => {
            setShowPrintDialog(false);
            setSelectedProduit(null);
          }}
          refreshProduits={fetchProduits}
        />
      )}
    </div>
  );
}

// Barcode Print Dialog Component
function BarcodePrintDialog({ selectedProduit, onClose, refreshProduits }) {
  const [svgMarkup, setSvgMarkup] = useState("");

  useEffect(() => {
    if (selectedProduit) {
      const svg = document.createElement("svg");
      const code = selectedProduit.codebarre?.toString() || "0000000000000";

      JsBarcode(svg, code, {
        format: "EAN13",
        lineColor: "#000",
        width: 2,
        height: 60,
        displayValue: false,
        margin: 0,
      });

      const finalMarkup = `
        <div class="ticket">
          <div class="title">Dar Lokman</div>
          <div class="name">${selectedProduit.nom}</div>
          <div>${svg.outerHTML}</div>
          <div class="code">${code}</div>
        </div>
      `;

      setSvgMarkup(finalMarkup);
    }
  }, [selectedProduit]);

  const handleWebPrint = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const printContent = `
      <html>
        <head>
          <style>
            @page {
              size: 40mm 20mm landscape;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              width: 40mm;
              height: 20mm;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .ticket {
              width: 38mm;
              height: 18mm;
              text-align: center;
              font-family: Arial, sans-serif;
              overflow: hidden;
            }
            .title {
              font-weight: bold;
              font-size: 8px;
              line-height: 1;
            }
            .name {
              font-size: 7px;
              line-height: 1;
            }
            svg {
              width: 36mm;
              height: 8mm;
            }
            .code {
              font-size: 8px;
              letter-spacing: 1px;
            }
          </style>
        </head>
        <body>${svgMarkup}</body>
      </html>
    `;

    iframe.contentDocument.write(printContent);
    iframe.contentDocument.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  };

  const handleDeleteBarcode = async () => {
    try {
      const access_token = localStorage.getItem("access_token");
      const produit = selectedProduit;
      const codebarre = selectedProduit.codebarre;
      const magasinNom = selectedProduit.magasinNom;
      
      // Find the magasin that contains this barcode
      let targetMagasin = null;
      let magasinIndex = -1;
      
      if (produit.magasins && Array.isArray(produit.magasins)) {
        magasinIndex = produit.magasins.findIndex(mag => 
          mag.nom === magasinNom && mag.codes_barres && mag.codes_barres.includes(codebarre)
        );
        if (magasinIndex !== -1) {
          targetMagasin = produit.magasins[magasinIndex];
        }
      }
      
      if (!targetMagasin) {
        toast.error("الباركود غير موجود في هذا المخزن");
        return;
      }
      
      // Remove the barcode from the magasin's codes_barres array
      const updatedMagasinCodes = targetMagasin.codes_barres.filter(cb => cb !== codebarre);
      
      // Update the magasins array
      const updatedMagasins = [...produit.magasins];
      updatedMagasins[magasinIndex] = {
        ...targetMagasin,
        codes_barres: updatedMagasinCodes
      };
      
      // Update the global codes_barres array
      const updatedGlobalCodes = (produit.codes_barres || []).filter(cb => cb !== codebarre);
      
      // Prepare the update payload
      const updateData = {
        magasins: updatedMagasins,
        codes_barres: updatedGlobalCodes
      };
      
      // Send update to backend
      await axios.patch(
        `/prod/produits/${produit.id}/`,
        updateData,
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );
      
      toast.success("✅ تم حذف الباركود بنجاح");
      if (refreshProduits) refreshProduits();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      toast.error("فشل حذف الباركود");
    }
  };

  if (!selectedProduit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 rounded-xl w-[350px] overflow-hidden shadow-2xl border border-purple-500/30"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-3 flex justify-between items-center">
          <h3 className="text-white font-semibold">طباعة الباركود</h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          <div
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
            className="mb-4 bg-white p-3 rounded-lg"
          />
          <div className="flex gap-3 w-full">
            <button
              onClick={handleWebPrint}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              طباعة
            </button>
            <button
              onClick={handleDeleteBarcode}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              حذف
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}