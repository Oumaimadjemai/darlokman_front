import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Barcode, Printer, Trash2, Package, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "../../api/axiosInstance";
import JsBarcode from "jsbarcode";

export function BarcodesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [magasins, setMagasins] = useState([]);
  const [selectedMagasinId, setSelectedMagasinId] = useState(null);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [selectedBarcode, setSelectedBarcode] = useState(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  
  // Pagination states
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalBarcodesCount, setTotalBarcodesCount] = useState(0);
  
  const fetchInProgress = useRef(false);
  const currentFiltersRef = useRef({ search: '', magasinId: null });
  const loadingTriggerRef = useRef(null);

  // Fetch magasins
  useEffect(() => {
    const fetchMagasins = async () => {
      try {
        const access_token = localStorage.getItem("access_token");
        const response = await axios.get("/param/magasins/", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const magasinsList = response.data.results || [];
        setMagasins(magasinsList);
        if (magasinsList.length > 0) {
          setSelectedMagasinId(magasinsList[0].id);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des magasins :", error);
      }
    };
    fetchMagasins();
  }, []);

  // Fetch products with pagination
  const fetchProduits = useCallback(async (search = '', magasinId = null, isReset = true) => {
    if (fetchInProgress.current) return;
    
    fetchInProgress.current = true;
    
    if (isReset) {
      setLoading(true);
      setProduits([]);
      setNextPageUrl(null);
      setHasMore(true);
      setTotalBarcodesCount(0);
    } else {
      setLoadingMore(true);
    }
    
    currentFiltersRef.current = { search, magasinId };
    
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (magasinId) params.append("magasin", magasinId);
    params.append("page_size", "50");

    const url = `prod/produits/?${params.toString()}`;

    try {
      const access_token = localStorage.getItem("access_token");
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      
      if (currentFiltersRef.current.search !== search || 
          currentFiltersRef.current.magasinId !== magasinId) {
        return;
      }
      
      let productsData = response.data.results || [];
      const nextUrl = response.data.next;
      
      // Filter products that have barcodes for this magasin
      if (magasinId) {
        productsData = productsData.map(product => {
          let magasinQuantity = 0;
          let magasinCodes = [];
          
          if (product.magasins && Array.isArray(product.magasins)) {
            const magasinEntry = product.magasins.find(mag => mag.id == magasinId);
            if (magasinEntry) {
              magasinCodes = magasinEntry.codes_barres || [];
              magasinQuantity = magasinCodes.length;
            }
          }
          
          return {
            ...product,
            displayQuantity: magasinQuantity,
            displayCodes: magasinCodes,
            magasinName: magasins.find(m => m.id == magasinId)?.nom || ''
          };
        });
      }
      
      // Only show products with barcodes for the selected magasin
      productsData = productsData.filter(p => p.displayQuantity > 0);
      
      if (isReset) {
        setProduits(productsData);
      } else {
        setProduits(prev => [...prev, ...productsData]);
      }
      
      setNextPageUrl(nextUrl);
      setHasMore(!!nextUrl);
      setTotalCount(response.data.count || 0);
      
      // Calculate total barcodes for this magasin
      const totalBarcodes = productsData.reduce((sum, p) => sum + (p.displayQuantity || 0), 0);
      setTotalBarcodesCount(prev => isReset ? totalBarcodes : prev + totalBarcodes);
      
      setLoading(false);
      setLoadingMore(false);
      
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
      toast.error("خطأ في تحميل المنتجات");
      setLoading(false);
      setLoadingMore(false);
    } finally {
      fetchInProgress.current = false;
    }
  }, [magasins]);

  // Load more products
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || fetchInProgress.current || !nextPageUrl) return;
    
    setLoadingMore(true);
    fetchInProgress.current = true;
    
    try {
      const access_token = localStorage.getItem("access_token");
      const response = await axios.get(nextPageUrl, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      
      let productsData = response.data.results || [];
      const nextUrl = response.data.next;
      
      if (selectedMagasinId) {
        productsData = productsData.map(product => {
          let magasinQuantity = 0;
          let magasinCodes = [];
          
          if (product.magasins && Array.isArray(product.magasins)) {
            const magasinEntry = product.magasins.find(mag => mag.id == selectedMagasinId);
            if (magasinEntry) {
              magasinCodes = magasinEntry.codes_barres || [];
              magasinQuantity = magasinCodes.length;
            }
          }
          
          return {
            ...product,
            displayQuantity: magasinQuantity,
            displayCodes: magasinCodes,
            magasinName: magasins.find(m => m.id == selectedMagasinId)?.nom || ''
          };
        });
      }
      
      productsData = productsData.filter(p => p.displayQuantity > 0);
      
      setProduits(prev => [...prev, ...productsData]);
      setNextPageUrl(nextUrl);
      setHasMore(!!nextUrl);
      
      const addedBarcodes = productsData.reduce((sum, p) => sum + (p.displayQuantity || 0), 0);
      setTotalBarcodesCount(prev => prev + addedBarcodes);
      
    } catch (error) {
      console.error("Error loading more products:", error);
      toast.error("خطأ في تحميل المزيد من المنتجات");
    } finally {
      setLoadingMore(false);
      fetchInProgress.current = false;
    }
  }, [nextPageUrl, hasMore, loadingMore, selectedMagasinId, magasins]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const currentTrigger = loadingTriggerRef.current;
    if (!currentTrigger || !hasMore || loadingMore || fetchInProgress.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !fetchInProgress.current) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    
    observer.observe(currentTrigger);
    
    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
    };
  }, [hasMore, loadingMore, loadMore]);

  // Fetch products when magasin or search changes
  useEffect(() => {
    if (selectedMagasinId) {
      const timeoutId = setTimeout(() => {
        fetchProduits(searchTerm, selectedMagasinId, true);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, selectedMagasinId, fetchProduits]);

  const handleBarcodeClick = (produit, codebarre, magasinNom) => {
    setSelectedProduit(produit);
    setSelectedBarcode(codebarre);
    setShowPrintDialog(true);
  };

  const totalProducts = produits.length;
  const totalBarcodes = totalBarcodesCount;

  return (
    <div className="space-y-4 pb-8">
      {/* Header with Stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap px-4">
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

      {/* Search */}
      <div className="flex gap-2 px-4">
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
      </div>

      {/* Magasin Tabs */}
      {magasins.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-thin scrollbar-thumb-purple-500/30">
          {magasins.map((mag) => (
            <button
              key={mag.id}
              onClick={() => setSelectedMagasinId(mag.id)}
              className={`px-6 py-2 rounded-lg transition-all whitespace-nowrap ${
                selectedMagasinId === mag.id
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4 inline ml-2" />
              {mag.nom}
            </button>
          ))}
        </div>
      )}

      {/* Products List */}
      {loading && produits.length === 0 ? (
        <div className="flex justify-center items-center py-32">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 mr-3">جاري تحميل المنتجات...</span>
        </div>
      ) : produits.length > 0 ? (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl overflow-hidden shadow-lg mx-4">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
            <h2 className="text-white text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {magasins.find(m => m.id === selectedMagasinId)?.nom || 'المنتجات'}
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                {produits.length} منتج | {totalBarcodes} باركود
              </span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <th className="px-4 py-3 text-right whitespace-nowrap">الرقم</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">المرجع</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">اسم المنتج</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">الكمية</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">الباركودات</th>
                 </tr>
              </thead>
              <tbody>
                {produits.map((produit, index) => {
                  const displayCodes = produit.displayCodes || [];
                  
                  return (
                    <motion.tr
                      key={`${produit.id}-${index}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(index * 0.01, 0.5) }}
                      className={`border-b border-slate-700/50 transition-all ${
                        index % 2 === 0 ? "bg-slate-800/30" : "bg-slate-900/30"
                      }`}
                    >
                      <td className="px-4 py-3 text-purple-300 whitespace-nowrap">{produit.id}</td>
                      <td className="px-4 py-3 text-blue-300 font-mono whitespace-nowrap">
                        {produit.reference || "—"}
                      </td>
                      <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                        {produit.nom}
                      </td>
                      <td className="px-4 py-3 text-amber-300 whitespace-nowrap">
                        {displayCodes.length}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {displayCodes.length > 0 ? (
                            displayCodes.map((cb, i) => (
                              <button
                                key={i}
                                onClick={() => handleBarcodeClick(produit, cb, produit.magasinName)}
                                className="px-3 py-1.5 rounded text-xs font-mono transition-all bg-slate-700/50 text-slate-300 hover:bg-purple-500/30 hover:text-purple-300 cursor-pointer"
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

          {/* Loading trigger for infinite scroll */}
          <div ref={loadingTriggerRef} className="h-4 w-full"></div>
          
          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex justify-center items-center py-4 bg-slate-800/50">
              <div className="w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-400 mr-2">جاري تحميل المزيد...</span>
            </div>
          )}
          
          {/* End of products message */}
          {!hasMore && produits.length > 0 && (
            <div className="text-center py-4 text-slate-500 text-sm">
              تم تحميل جميع المنتجات ({produits.length} منتج)
            </div>
          )}
        </div>
      ) : !loading && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-12 text-center mx-4">
          <Barcode className="w-16 h-16 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">لا توجد منتجات تحتوي على باركودات في هذا المخزن</p>
        </div>
      )}

      {/* Footer with Summary */}
      {produits.length > 0 && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 rounded-lg border border-amber-500/30 mx-4">
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
      {showPrintDialog && selectedProduit && selectedBarcode && (
        <BarcodePrintDialog
          selectedProduit={selectedProduit}
          selectedBarcode={selectedBarcode}
          onClose={() => {
            setShowPrintDialog(false);
            setSelectedProduit(null);
            setSelectedBarcode(null);
          }}
          refreshProduits={() => fetchProduits(searchTerm, selectedMagasinId, true)}
        />
      )}
    </div>
  );
}

// Barcode Print Dialog Component
function BarcodePrintDialog({ selectedProduit, selectedBarcode, onClose, refreshProduits }) {
  const [svgMarkup, setSvgMarkup] = useState("");

  useEffect(() => {
    if (selectedProduit && selectedBarcode) {
      const svg = document.createElement("svg");
      const code = selectedBarcode?.toString() || "0000000000000";

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
  }, [selectedProduit, selectedBarcode]);

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
      const codebarre = selectedBarcode;
      const magasinNom = produit.magasinName;
      
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
      
      const updatedMagasinCodes = targetMagasin.codes_barres.filter(cb => cb !== codebarre);
      const updatedMagasins = [...produit.magasins];
      updatedMagasins[magasinIndex] = {
        ...targetMagasin,
        codes_barres: updatedMagasinCodes
      };
      
      const updatedGlobalCodes = (produit.codes_barres || []).filter(cb => cb !== codebarre);
      
      const updateData = {
        magasins: updatedMagasins,
        codes_barres: updatedGlobalCodes
      };
      
      await axios.patch(
        `/prod/produits/${produit.id}/`,
        updateData,
        { headers: { Authorization: `Bearer ${access_token}` } }
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
        className="bg-slate-800 rounded-xl w-[400px] overflow-hidden shadow-2xl border border-purple-500/30"
      >
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-3 flex justify-between items-center">
          <h3 className="text-white font-semibold">الباركود</h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Product Info */}
          <div className="mb-4 text-center">
            <h4 className="text-white font-medium mb-1">{selectedProduit.nom}</h4>
            <p className="text-slate-400 text-sm">المرجع: {selectedProduit.reference || '—'}</p>
          </div>
          
          {/* Barcode Image */}
          <div className="flex flex-col items-center mb-6">
            <div
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
              className="bg-white p-4 rounded-lg"
            />
            <p className="text-slate-400 text-xs mt-2 font-mono">{selectedBarcode}</p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
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