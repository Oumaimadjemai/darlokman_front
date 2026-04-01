import {
  Home,
  FolderOpen,
  List,
  ShoppingCart,
  Tag,
  FileText,
  Settings,
  Download,
  ChevronDown,
  ChevronLeft,
  BarChart3,
  Users,
  Store,
  UserCog,
  Receipt,
  Package,
  Truck,
  CreditCard
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import AddClientDialog from "../Clients/AddClientDialog";
import AddFournisseurDialog from "../Fournisseurs/AddFournisseurDialog";
import AddProduitDialog from "../Produits/AddProduitDialog";

export default function NewSidebar({ isOpen, onLogout }) {
  const [expandedMenus, setExpandedMenus] = useState([]);
  const [openAddClientDialog, setOpenAddClientDialog] = useState(false);
  const [openAddProductDialog, setOpenAddProductDialog] = useState(false);
  const [openAddSupplierDialog, setOpenAddSupplierDialog] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userFeatures, setUserFeatures] = useState([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user role and features from localStorage on mount
  useEffect(() => {
    const role = localStorage.getItem("role");
    const features = JSON.parse(localStorage.getItem("features") || "[]");
    
    setUserRole(role);
    setUserFeatures(features);
    
    console.log("User role from localStorage:", role);
    console.log("User features from localStorage:", features);
  }, []);
  
  // Define all menu items with their feature IDs
  const allMenuItems = [
    {
      id: 'home',
      label: 'الصفحة الرئيسية',
      icon: Home,
      path: '/New/dashboard',
      gradient: 'from-amber-500 to-yellow-600',
      hoverColor: 'amber',
      textColor: 'text-amber-400'
    },
    {
      id: 'file',
      label: 'ملف',
      icon: FolderOpen,
      gradient: 'from-emerald-500 to-emerald-600',
      hoverColor: 'emerald',
      textColor: 'text-emerald-500',
      subItems: [
        { id: 'add-client', label: 'إضافة زبون', action: 'openAddClientDialog' },
        { id: 'add-product', label: "إضافة سلعة", action: 'openAddProductDialog' },
        { id: 'add-fourn', label: "إضافة ممون", action: 'openAddSupplierDialog' },
        { id: 'get-product', label: "جرد السلع", path: '/New/inventory' },
        { id: 'notes', label: "الملاحظات", path: '/New/note' },
        { id: 'print', label: "طباعة" },
      ],
    },
    {
      id: 'lists',
      label: "قوائم",
      icon: List,
      gradient: 'from-blue-500 to-blue-600',
      hoverColor: 'blue',
      textColor: 'text-blue-500',
      subItems: [
        { id: 'client-list', label: 'قائمة الزبائن', path: '/New/clients' },
        { id: 'product-list', label: "قائمة السلع", path: '/New/products' },
        { id: 'fournisseur-list', label: "قائمة الممونين", path: '/New/fournisseurs' },
        { id: 'depense-list', label: "قائمة المصاريف", path: '/New/depenses' },
        { id: 'transfert', label: "التحويلات", path: '/New/transfert' },
        { id: 'codebar', label: "الملصقات", path: '/New/barcode' },
      ],
    },
    {
      id: 'achat',
      label: "الشراء",
      icon: ShoppingCart,
      gradient: 'from-pink-500 to-pink-600',
      hoverColor: 'pink',
      textColor: 'text-pink-500',
      subItems: [
        { id: 'nouveau-achat', label: "عملية شراء جديدة", path: '/New/addachat' },
        { id: 'achat-list', label: "عرض عمليات الشراء", path: '/New/achatlist' },
      ],
    },
    {
      id: 'vente',
      label: "البيع",
      icon: Tag,
      gradient: 'from-red-500 to-red-600',
      hoverColor: 'red',
      textColor: 'text-red-500',
      subItems: [
        { id: 'nouveau-vente-cache', label: "عملية بيع كاش", path: '/New/cashsales' },
        { id: 'vente-cache-list', label: "عمليات البيع كاش", path: '/New/sales' },
        { id: 'nouveau-vente-facilite', label: "عملية بيع تقسيط", path: '/New/Facilitevente' },
        { id: 'vente-facilite-list', label: "عمليات البيع بالتقسيط", path: '/New/facilitelist' },
      ],
    },
    {
      id: 'rapport',
      label: "تقارير",
      icon: BarChart3,
      gradient: 'from-purple-500 to-purple-600',
      hoverColor: 'purple',
      textColor: 'text-purple-500',
      subItems: [
        { id: 'statistics', label: "إحصائيات", path: '/New/statistics' },
        { id: 'rapport-vente', label: "تقرير المبيعات", path: '/New/SalesReport' },
        { id: 'rapport-produit-vendu', label: "تقرير السلع المباعة", path: "/New/Produitvendu" },
        { id: 'rapport-depense', label: "تقرير المدفوعات", path: '/New/paiements' },
        { id: 'depense-client', label: "مستحقات الزبائن", path: '/New/echeance' },
        { id: 'rapport-poste', label: "تقرير البريد", path: '/New/poste' },
        { id: 'produit-comparaison', label: "مقارنة السلع", path: '/New/comparaison' },
      ],
    },
    {
      id: 'settings',
      label: 'إعدادات',
      icon: Settings,
      gradient: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-500',
      hoverColor: 'amber',
      subItems: [
        { id: 'magasins', label: "المحلات", path: '/New/settings' },
        { id: 'users', label: "المستخدمين", path: '/New/settings' },
        { id: 'profil', label: "الملف الشخصي", path: '/New/settings' },
      ],
    }
  ];

  // Check if user has access to a specific feature
  const hasFeature = (featureId) => {
    // Admin has access to everything
    if (userRole === 'admin') return true;
    
    // Check if feature exists in user's features array
    if (userFeatures && Array.isArray(userFeatures)) {
      return userFeatures.includes(featureId);
    }
    
    return false;
  };

  // Filter menu items based on user features
  const filterMenuItems = () => {
    const filteredItems = [];
    
    for (const item of allMenuItems) {
      // Check if main item is accessible
      if (!hasFeature(item.id)) {
        continue;
      }
      
      // If item has subItems, filter them
      if (item.subItems) {
        const filteredSubItems = item.subItems.filter(subItem => 
          hasFeature(subItem.id)
        );
        
        // Only include parent if it has accessible subItems
        if (filteredSubItems.length > 0) {
          filteredItems.push({
            ...item,
            subItems: filteredSubItems
          });
        }
      } else {
        // Item without subItems
        filteredItems.push(item);
      }
    }
    
    return filteredItems;
  };

  // Filter menu items when role or features change
  useEffect(() => {
    if (userRole) {
      const filtered = filterMenuItems();
      setFilteredMenuItems(filtered);
      console.log("Filtered menu items:", filtered);
    }
  }, [userRole, userFeatures]);

  const toggleMenu = (id) => {
    setExpandedMenus((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Handle logout separately
 // In NewSidebar.jsx - Update the handleLogout function

const handleLogout = () => {
  console.log("Logging out...");
  // Clear localStorage first
  localStorage.clear();
  sessionStorage.clear(); // Clear session storage if any
  
  // Call parent onLogout to update auth state
  if (onLogout && typeof onLogout === 'function') {
    onLogout();
  }
  
  // Use window.location to force a full page reload and navigation
  window.location.href = '/login';
};

  const handleClick = (item, subItem) => {
    // Check if this is a logout action
    if (item.id === "logout") {
      handleLogout();
      return;
    }

    // Check if subItem has an action
    if (subItem?.action === 'openAddClientDialog') {
      setOpenAddClientDialog(true);
      return;
    }
    if (subItem?.action === 'openAddProductDialog') {
      setOpenAddProductDialog(true);
      return;
    }
    if (subItem?.action === 'openAddSupplierDialog') {
      setOpenAddSupplierDialog(true);
      return;
    }

    // Check if subItem has a path
    if (subItem?.path) {
      navigate(subItem.path);
      return;
    }

    // Check if item has a path
    if (item.path) {
      navigate(item.path);
      return;
    }

    // Toggle submenu if it has subItems
    if (item.subItems) toggleMenu(item.id);
  };

  // Logout item
  const logoutItem = {
    id: 'logout',
    label: 'تسجيل الخروج',
    icon: Download,
    gradient: 'from-red-500 to-red-600',
    textColor: 'text-red-500',
    hoverColor: 'red',
  };

  // Get role name in Arabic
  const getRoleName = (role) => {
    switch(role) {
      case 'admin': return 'مدير';
      case 'vendeur': return 'بائع';
      case 'magasinier': return 'مخزني';
      case 'comptable': return 'محاسب';
      case 'caissier': return 'صراف';
      default: return role;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="h-full flex flex-col bg-gradient-to-b from-[#0f172a] via-[#0b1a33] to-[#0a1628] text-white w-50">
        {/* User Role Badge */}
        {userRole && (
          <div className="px-4 py-2 border-b border-slate-800/50 mb-2">
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg px-3 py-2 text-center">
              <span className="text-xs text-purple-300">الدور: </span>
              <span className="text-sm text-white font-medium">
                {getRoleName(userRole)}
              </span>
              {userFeatures.length > 0 && (
                <div className="text-xs text-slate-400 mt-1">
                  {userFeatures.length} صلاحية
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sidebar-scroll">
          <nav className="space-y-1">
            {filteredMenuItems.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <p className="text-sm">لا توجد صلاحيات متاحة</p>
                {userFeatures.length > 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    الصلاحيات المتاحة: {userFeatures.join(', ')}
                  </p>
                )}
              </div>
            ) : (
              filteredMenuItems.map((item) => (
                <div key={item.id}>
                  <NavButton
                    icon={item.icon}
                    label={item.label}
                    active={location.pathname === item.path}
                    isParentActive={item.subItems?.some(sub => 
                      sub.path ? location.pathname === sub.path : false
                    )}
                    onClick={() => handleClick(item)}
                    gradient={item.gradient}
                    textColor={item.textColor}
                    hasSubItems={!!item.subItems}
                    isExpanded={expandedMenus.includes(item.id)}
                  />

                  {/* Sub Items */}
                  {item.subItems && expandedMenus.includes(item.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mr-6 mt-1 space-y-1 overflow-hidden"
                    >
                      {item.subItems.map((subItem) => (
                        <motion.button
                          key={subItem.id}
                          onClick={() => handleClick(item, subItem)}
                          whileHover={{ scale: 1.02, x: -3 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                            subItem.path && location.pathname === subItem.path
                              ? `bg-gradient-to-r ${item.gradient} text-white`
                              : `text-slate-400 hover:text-white hover:bg-white/5`
                          }`}
                        >
                          <ChevronLeft className="w-3 h-3" />
                          <span>{subItem.label}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </div>
              ))
            )}
          </nav>
        </div>
        
        {/* Logout button - fixed at bottom */}
        <div className="p-4 border-t border-slate-800/50">
          <NavButton
            icon={logoutItem.icon}
            label={logoutItem.label}
            active={false}
            isParentActive={false}
            onClick={() => handleLogout()} // Direct call to handleLogout
            gradient={logoutItem.gradient}
            textColor={logoutItem.textColor}
            hasSubItems={false}
            isExpanded={false}
          />
        </div>
      </div>

      {/* Add Client Dialog */}
      <AddClientDialog
        open={openAddClientDialog}
        onClose={() => setOpenAddClientDialog(false)}
        onSuccess={() => {
          console.log("Client added successfully");
        }}
      />
      <AddProduitDialog
        open={openAddProductDialog}
        onClose={() => setOpenAddProductDialog(false)}
        onSuccess={() => {
          console.log("Product added successfully");
        }}
      />
      <AddFournisseurDialog
        open={openAddSupplierDialog}
        onClose={() => setOpenAddSupplierDialog(false)}
        onSuccess={() => {
          console.log("Supplier added successfully");
        }}
      />
    </>
  );
}

function NavButton({
  icon: Icon,
  label,
  active,
  isParentActive,
  onClick,
  gradient,
  textColor,
  hasSubItems,
  isExpanded,
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, x: -5 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active
          ? `bg-gradient-to-r ${gradient} text-white shadow-[0_0_25px_rgba(255,180,0,0.4)]`
          : isParentActive
          ? `text-white`
          : `${textColor} hover:bg-white/5`
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="flex-1 text-right font-medium">{label}</span>
      {hasSubItems && (
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={`w-4 h-4 ${textColor}`} />
        </motion.div>
      )}
      {active && !hasSubItems && (
        <div className="w-2 h-2 bg-white rounded-full" />
      )}
    </motion.button>
  );
}