import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, 
  Users, 
  Store, 
  Plus, 
  Edit, 
  Trash2, 
  Key,
  Verified,
  X,
  Search,
  UserCircle,
  Lock,
  Shield,
  CheckCircle,
  Save,
  Percent,
  Building2,
  Globe,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import axios from "../../api/axiosInstance";
import ConfirmationDialog from "../Cards/ConfirmationDialog"

// ALL FEATURES for access control
const ALL_FEATURES = {
  home: "الصفحة الرئيسية",
  file: "ملف",
  "add-client": "إضافة زبون",
  "add-product": "إضافة سلعة",
  "add-fourn": "إضافة ممون",
  "get-product": "جرد السلع",
  notes: "الملاحظات",
  print: "طباعة",
  lists: "قوائم",
  "client-list": "قائمة الزبائن",
  "product-list": "قائمة السلع",
  "fournisseur-list": "قائمة الممونين",
  "depense-list": "قائمة المصاريف",
  transfert: "التحويلات",
  codebar: "الملصقات",
  achat: "الشراء",
  "nouveau-achat": "عملية شراء جديدة",
  "achat-list": "عرض عمليات الشراء",
  vente: "البيع",
  "nouveau-vente-cache": "عملية بيع كاش",
  "vente-cache-list": "عمليات البيع كاش",
  "nouveau-vente-facilite": "عملية بيع تقسيط",
  "vente-facilite-list": "عمليات البيع بالتقسيط",
  rapport: "التقارير",
  statistics: "إحصائيات",
  "rapport-vente": "تقرير المبيعات",
  "rapport-produit-vendu": "تقرير السلع المباعة",
  "rapport-depense": "تقرير المدفوعات",
  "depense-client": "مستحقات الزبائن",
  "rapport-poste": "تقرير البريد",
  "produit-comparaison": "مقارنة السلع",
  settings: "إعدادات",
  magasins: "المحلات",
  users: "المستخدمين",
  profil: "الملف الشخصي",
  logout: "تسجيل الخروج",
};

// 🔥 NEW: Magasin access types
const MAGASIN_ACCESS_TYPES = [
  { value: "assigned_only", label: "المحل المخصص فقط", description: "يمكن للمستخدم الوصول فقط إلى المحل المخصص له", icon: Building2 },
  { value: "all_magasins", label: "جميع المحلات", description: "يمكن للمستخدم الوصول إلى جميع المحلات", icon: Globe },
  { value: "selected_magasins", label: "محلات محددة", description: "يمكن للمستخدم الوصول إلى المحلات المحددة فقط", icon: ShieldCheck },
];

export default function SettingsView({ currentUser }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [users, setUsers] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showAddMagasinModal, setShowAddMagasinModal] = useState(false);
  const [showEditMagasinModal, setShowEditMagasinModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMagasin, setSelectedMagasin] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMagasinTerm, setSearchMagasinTerm] = useState("");
  const [salaryLimitActive, setSalaryLimitActive] = useState(false);
  
  // Confirmation dialogs state
  const [deleteUserConfirm, setDeleteUserConfirm] = useState({ open: false, userId: null, username: "" });
  const [deleteMagasinConfirm, setDeleteMagasinConfirm] = useState({ open: false, magasinId: null, magasinName: "" });
  const [deactivateUserConfirm, setDeactivateUserConfirm] = useState({ open: false, user: null });
  
  // Profile state
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  
  // 🔥 UPDATED: Add magasin access fields to newUser state
  const [newUser, setNewUser] = useState({ 
    username: "", 
    role: "vendeur", 
    password: "",
    magasin: "",
    magasin_access_type: "assigned_only",
    magasins_acces: []
  });
  
  // 🔥 UPDATED: Add magasin access fields to editUser state
  const [editUser, setEditUser] = useState({
    id: null,
    username: "",
    role: "",
    magasin: "",
    magasin_access_type: "assigned_only",
    magasins_acces: []
  });
  
  const [newMagasin, setNewMagasin] = useState({
    nom: "",
    adresse: ""
  });
  
  const [editMagasin, setEditMagasin] = useState({
    id: null,
    nom: "",
    adresse: ""
  });
  
  const [changePassword, setChangePassword] = useState({
    userId: null,
    newPassword: ""
  });
  
  const [features, setFeatures] = useState([]);
  const [featureSaved, setFeatureSaved] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get("/auth/users/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.results || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Fetch magasins
  const fetchMagasins = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get("/param/magasins/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMagasins(response.data.results || []);
    } catch (error) {
      console.error("Error fetching magasins:", error);
    }
  };

  const fetchSalaryLimitSetting = async () => {
  try {
    const token = localStorage.getItem("access_token");
    const response = await axios.get("/vente/settings/", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setSalaryLimitActive(response.data.value);
  } catch (error) {
    console.error("Error fetching salary limit setting:", error);
  }
};

// Update the setting in database
const updateSalaryLimitSetting = async (newValue) => {
  try {
    const token = localStorage.getItem("access_token");
    await axios.post("/vente/settings/", 
      { value: newValue },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setSalaryLimitActive(newValue);
    toast.success(newValue ? "✅ تم تفعيل حد 30% من الراتب" : "❌ تم إلغاء حد 30% من الراتب");
  } catch (error) {
    console.error("Error updating salary limit setting:", error);
    toast.error("فشل تحديث الإعداد");
    // Revert the local state
    setSalaryLimitActive(!newValue);
  }
};

// Load the setting when component mounts
useEffect(() => {
  fetchSalaryLimitSetting();
}, []);

// Replace the handleToggleSalaryLimit function
const handleToggleSalaryLimit = () => {
  const newValue = !salaryLimitActive;
  updateSalaryLimitSetting(newValue);
};

  useEffect(() => {
    fetchUsers();
    fetchMagasins();
  }, []);

  // Profile - Change password
  const handleProfilePasswordChange = async (e) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setProfileError("يرجى ملء جميع الحقول.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setProfileError("كلمة المرور الجديدة غير متطابقة.");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        "auth/change-password/",
        {
          old_password: passwordData.oldPassword,
          new_password: passwordData.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileSuccess("تم تغيير كلمة المرور بنجاح.");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (err) {
      if (err.response?.data?.detail) {
        setProfileError(err.response.data.detail);
      } else {
        setProfileError("حدث خطأ أثناء تغيير كلمة المرور.");
      }
      setTimeout(() => setProfileError(""), 3000);
    }
  };

  // 🔥 UPDATED: Add user with magasin access fields
  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      toast.error("⚠️ يرجى ملء جميع الحقول الإلزامية");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const payload = { ...newUser };
      
      if (payload.role === "admin") {
        delete payload.magasin;
        delete payload.magasins_acces;
      }
      
      // Filter out empty values based on access type
      if (payload.magasin_access_type !== "selected_magasins") {
        delete payload.magasins_acces;
      }
      if (payload.magasin_access_type !== "assigned_only") {
        delete payload.magasin;
      }
      
      await axios.post("/auth/register/", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`✅ تم إضافة المستخدم ${newUser.username}`);
      fetchUsers();
      setShowAddUserModal(false);
      setNewUser({ 
        username: "", 
        role: "vendeur", 
        password: "", 
        magasin: "",
        magasin_access_type: "assigned_only",
        magasins_acces: []
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || "❌ فشل إضافة المستخدم");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 UPDATED: Edit user click handler
  const handleEditUserClick = (user) => {
    setEditUser({
      id: user.id,
      username: user.username,
      role: user.role,
      magasin: user.magasin_detail?.id || "",
      magasin_access_type: user.magasin_access_type || "assigned_only",
      magasins_acces: user.magasins_acces_detail?.map(m => m.id) || []
    });
    setShowEditUserModal(true);
  };

  // 🔥 UPDATED: Edit user save handler
  const handleEditUser = async () => {
    if (!editUser.username) {
      toast.error("⚠️ يرجى إدخال اسم المستخدم");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const payload = {
        username: editUser.username,
        role: editUser.role,
        magasin_access_type: editUser.magasin_access_type,
      };
      
      if (editUser.role !== "admin") {
        if (editUser.magasin_access_type === "assigned_only") {
          payload.magasin = editUser.magasin;
        } else if (editUser.magasin_access_type === "selected_magasins") {
          payload.magasins_acces = editUser.magasins_acces;
        }
      }
      
      await axios.patch(`/auth/users/${editUser.id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`✅ تم تعديل المستخدم ${editUser.username}`);
      fetchUsers();
      setShowEditUserModal(false);
      setEditUser({ 
        id: null, 
        username: "", 
        role: "", 
        magasin: "",
        magasin_access_type: "assigned_only",
        magasins_acces: []
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || "❌ فشل تعديل المستخدم");
    } finally {
      setLoading(false);
    }
  };

  // Delete user with confirmation
  const handleDeleteUser = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(`/auth/users/${deleteUserConfirm.userId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`✅ تم حذف المستخدم ${deleteUserConfirm.username}`);
      fetchUsers();
      setDeleteUserConfirm({ open: false, userId: null, username: "" });
    } catch (error) {
      toast.error("❌ فشل حذف المستخدم");
    }
  };

  // Toggle user status with confirmation
  const handleToggleUserStatus = async (user) => {
    setDeactivateUserConfirm({ open: true, user });
  };

  const executeToggleUserStatus = async () => {
    const { user } = deactivateUserConfirm;
    try {
      const token = localStorage.getItem("access_token");
      const newStatus = !user.bloque;
      await axios.patch(`/auth/users/${user.id}/`, { bloque: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(newStatus ? "✅ تم تفعيل المستخدم" : "⛔ تم تعطيل المستخدم");
      fetchUsers();
    } catch (error) {
      toast.error("❌ فشل تحديث حالة المستخدم");
    } finally {
      setDeactivateUserConfirm({ open: false, user: null });
    }
  };

  // Change password for user
  const handleChangePassword = async () => {
    if (!changePassword.newPassword) {
      toast.error("⚠️ يرجى إدخال كلمة المرور الجديدة");
      return;
    }
    
    try {
      const token = localStorage.getItem("access_token");
      await axios.post("/auth/admin/change-password/", {
        user_id: changePassword.userId,
        new_password: changePassword.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("✅ تم تغيير كلمة المرور بنجاح");
      setShowPasswordModal(false);
      setChangePassword({ userId: null, newPassword: "" });
    } catch (error) {
      toast.error("❌ فشل تغيير كلمة المرور");
    }
  };

  // Feature access
  const fetchFeatures = async (userId) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`/auth/users/${userId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUser(res.data);
      if (res.data.role === "admin") {
        setFeatures(Object.keys(ALL_FEATURES));
      } else {
        setFeatures(Array.isArray(res.data.features) ? res.data.features : []);
      }
      setFeatureSaved(false);
    } catch (error) {
      console.error("Error fetching features:", error);
    }
  };

  const handleFeatureToggle = (feature) => {
    setFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const handleSaveFeatures = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.patch(`/auth/users/${selectedUser.id}/`, {
        features: features,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeatureSaved(true);
      toast.success("✅ تم حفظ المهام بنجاح");
      setTimeout(() => {
        setShowFeatureModal(false);
        setFeatureSaved(false);
      }, 500);
    } catch (error) {
      toast.error("❌ فشل حفظ المهام");
    }
  };

  // Add magasin
  const handleAddMagasin = async () => {
    if (!newMagasin.nom) {
      toast.error("⚠️ يرجى إدخال اسم المحل");
      return;
    }
    
    try {
      const token = localStorage.getItem("access_token");
      await axios.post("/param/magasins/", newMagasin, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("✅ تم إضافة المحل بنجاح");
      fetchMagasins();
      setShowAddMagasinModal(false);
      setNewMagasin({ nom: "", adresse: "" });
    } catch (error) {
      toast.error("❌ فشل إضافة المحل");
    }
  };

  // Edit magasin
  const handleEditMagasin = async () => {
    if (!editMagasin.nom) {
      toast.error("⚠️ يرجى إدخال اسم المحل");
      return;
    }
    
    try {
      const token = localStorage.getItem("access_token");
      await axios.patch(`/param/magasins/${editMagasin.id}/`, {
        nom: editMagasin.nom,
        adresse: editMagasin.adresse
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("✅ تم تعديل المحل بنجاح");
      fetchMagasins();
      setShowEditMagasinModal(false);
      setEditMagasin({ id: null, nom: "", adresse: "" });
    } catch (error) {
      toast.error("❌ فشل تعديل المحل");
    }
  };

  // Delete magasin with confirmation
  const handleDeleteMagasin = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(`/param/magasins/${deleteMagasinConfirm.magasinId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`✅ تم حذف المحل ${deleteMagasinConfirm.magasinName}`);
      fetchMagasins();
      setDeleteMagasinConfirm({ open: false, magasinId: null, magasinName: "" });
    } catch (error) {
      toast.error("❌ فشل حذف المحل");
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredMagasins = magasins.filter(magasin =>
    magasin.nom.toLowerCase().includes(searchMagasinTerm.toLowerCase())
  );

  const roleColors = {
    admin: "bg-gradient-to-r from-red-500 to-red-600",
    vendeur: "bg-gradient-to-r from-blue-500 to-blue-600",
    magasinier: "bg-gradient-to-r from-emerald-500 to-green-600"
  };

  const roleNames = {
    admin: "مدير",
    vendeur: "بائع",
    magasinier: "مخزني"
  };

  // 🔥 NEW: Helper function to get access type label
  const getMagasinAccessTypeLabel = (type) => {
    const found = MAGASIN_ACCESS_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={deleteUserConfirm.open}
        onClose={() => setDeleteUserConfirm({ open: false, userId: null, username: "" })}
        onConfirm={handleDeleteUser}
        text={`هل أنت متأكد من حذف المستخدم "${deleteUserConfirm.username}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        title="حذف المستخدم"
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
      />

      <ConfirmationDialog
        open={deactivateUserConfirm.open}
        onClose={() => setDeactivateUserConfirm({ open: false, user: null })}
        onConfirm={executeToggleUserStatus}
        text={`هل أنت متأكد من ${deactivateUserConfirm.user?.bloque ? "تفعيل" : "تعطيل"} المستخدم "${deactivateUserConfirm.user?.username}"؟`}
        title={deactivateUserConfirm.user?.bloque ? "تفعيل المستخدم" : "تعطيل المستخدم"}
        confirmText={deactivateUserConfirm.user?.bloque ? "تفعيل" : "تعطيل"}
        cancelText="إلغاء"
        type={deactivateUserConfirm.user?.bloque ? "info" : "warning"}
      />

      <ConfirmationDialog
        open={deleteMagasinConfirm.open}
        onClose={() => setDeleteMagasinConfirm({ open: false, magasinId: null, magasinName: "" })}
        onConfirm={handleDeleteMagasin}
        text={`هل أنت متأكد من حذف المحل "${deleteMagasinConfirm.magasinName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        title="حذف المحل"
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl text-white">الإعدادات</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
              activeTab === "profile"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <UserCircle className="w-5 h-5" />
            الملف الشخصي
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
              activeTab === "users"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Users className="w-5 h-5" />
            إدارة المستخدمين
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("magasins")}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
              activeTab === "magasins"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Store className="w-5 h-5" />
            إدارة المحلات
          </motion.button>
        </div>
      </motion.div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <>
          {/* Salary Limit Setting Card */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Percent className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold">حد 30% من الراتب</h3>
                  <p className="text-slate-400 text-sm">تفعيل هذا الخيار يمنع إتمام عمليات البيع بالتقسيط التي تتجاوز 30% من دخل الزبون</p>
                </div>
              </div>
              <button
                onClick={handleToggleSalaryLimit}
                className={`relative w-14 h-7 rounded-full transition-all ${
                  salaryLimitActive ? "bg-gradient-to-r from-blue-500 to-blue-600" : "bg-slate-600"
                }`}
              >
                <motion.div
                  animate={{ x: salaryLimitActive ? 28 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                />
              </button>
            </div>
            <div className="mt-4 text-sm text-slate-400">
              {salaryLimitActive ? (
                <span className="text-emerald-400">✓ تم تفعيل حد 30% من الراتب</span>
              ) : (
                <span className="text-amber-400">⚠ حد 30% من الراتب غير مفعل</span>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-8 max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl text-white">الملف الشخصي</h2>
            </div>
            
            <div className="h-px bg-slate-700 my-4" />
            
            <h3 className="text-lg text-blue-400 mb-4">تغيير كلمة المرور</h3>
            
            {profileSuccess && (
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3 mb-4 text-emerald-400 text-sm">
                {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
                {profileError}
              </div>
            )}
            
            <form onSubmit={handleProfilePasswordChange} className="space-y-4">
              <div>
                <label className="text-blue-300 block mb-2 text-sm">كلمة المرور الحالية</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  className="w-full bg-slate-700/50 text-white border border-blue-500/30 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-blue-300 block mb-2 text-sm">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full bg-slate-700/50 text-white border border-blue-500/30 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-blue-300 block mb-2 text-sm">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full bg-slate-700/50 text-white border border-blue-500/30 rounded-lg px-4 py-2 outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg hover:shadow-blue-500/50 transition-all"
              >
                حفظ التغييرات
              </button>
            </form>
          </div>
        </>
      )}

      {/* Users Management Tab */}
      {activeTab === "users" && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
              <input
                type="text"
                placeholder="البحث عن مستخدم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مستخدم جديد</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
              <h2 className="text-white text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                قائمة المستخدمين
                {filteredUsers.length > 0 && (
                  <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                    {filteredUsers.length} مستخدم
                  </span>
                )}
              </h2>
            </div>
            
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800">
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <th className="px-4 py-3 text-right">#</th>
                    <th className="px-4 py-3 text-right">اسم المستخدم</th>
                    <th className="px-4 py-3 text-right">الدور</th>
                    <th className="px-4 py-3 text-right">المحل</th>
                    <th className="px-4 py-3 text-right">نوع الوصول</th>
                    <th className="px-4 py-3 text-right">الحالة</th>
                    <th className="px-4 py-3 text-center">الإجراءات</th>
                   </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-400">لا توجد بيانات</td></tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr key={user.id} className={`border-b border-slate-700/50 hover:bg-blue-500/10 ${index % 2 === 0 ? "bg-slate-800/30" : "bg-slate-900/30"}`}>
                        <td className="px-4 py-3 text-blue-300">{user.id}</td>
                        <td className="px-4 py-3 text-white font-medium">{user.username}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs text-white ${roleColors[user.role] || "bg-slate-600"}`}>
                            {roleNames[user.role] || user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {user.magasin_detail?.nom || "لا يوجد"}
                          {user.magasin_access_type === "selected_magasins" && user.magasins_acces_detail?.length > 0 && (
                            <div className="text-xs text-slate-400 mt-1">
                              {user.magasins_acces_detail.length} محلات
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {getMagasinAccessTypeLabel(user.magasin_access_type)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`px-3 py-1 rounded-full text-xs ${user.bloque ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}
                          >
                            {user.bloque ? "معطل" : "نشط"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEditUserClick(user)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400"
                              title="تعديل المستخدم"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setChangePassword({ userId: user.id, newPassword: "" });
                                setShowPasswordModal(true);
                              }}
                              className="p-2 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-amber-400"
                              title="تغيير كلمة المرور"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                fetchFeatures(user.id);
                                setShowFeatureModal(true);
                              }}
                              className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400"
                              title="إدارة المهام"
                            >
                              <Verified className="w-4 h-4" />
                            </button>
                            {user.username !== currentUser && (
                              <button
                                onClick={() => setDeleteUserConfirm({ open: true, userId: user.id, username: user.username })}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Magasins Management Tab */}
      {activeTab === "magasins" && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
              <input
                type="text"
                placeholder="البحث عن محل..."
                value={searchMagasinTerm}
                onChange={(e) => setSearchMagasinTerm(e.target.value)}
                className="w-full bg-slate-700/50 text-white border border-amber-500/30 rounded-lg px-10 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={() => setShowAddMagasinModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة محل جديد</span>
            </button>
          </div>

          {/* Magasins Table */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
              <h2 className="text-white text-lg flex items-center gap-2">
                <Store className="w-5 h-5" />
                قائمة المحلات
                {filteredMagasins.length > 0 && (
                  <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                    {filteredMagasins.length} محل
                  </span>
                )}
              </h2>
            </div>
            
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800">
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <th className="px-4 py-3 text-right">#</th>
                    <th className="px-4 py-3 text-right">اسم المحل</th>
                    <th className="px-4 py-3 text-right">العنوان</th>
                    <th className="px-4 py-3 text-center">الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                  {filteredMagasins.length === 0 ? (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-400">لا توجد بيانات</td></tr>
                  ) : (
                    filteredMagasins.map((magasin, index) => (
                      <tr key={magasin.id} className={`border-b border-slate-700/50 hover:bg-blue-500/10 ${index % 2 === 0 ? "bg-slate-800/30" : "bg-slate-900/30"}`}>
                        <td className="px-4 py-3 text-blue-300">{magasin.id}</td>
                        <td className="px-4 py-3 text-white font-medium">{magasin.nom}</td>
                        <td className="px-4 py-3 text-slate-300">{magasin.adresse || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => {
                                setSelectedMagasin(magasin);
                                setEditMagasin({ id: magasin.id, nom: magasin.nom, adresse: magasin.adresse || "" });
                                setShowEditMagasinModal(true);
                              }}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteMagasinConfirm({ open: true, magasinId: magasin.id, magasinName: magasin.nom })}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 🔥 NEW: Add User Modal with Magasin Access Selection */}
      <AnimatePresence>
        {showAddUserModal && (
          <Modal onClose={() => setShowAddUserModal(false)}>
            <h3 className="text-2xl text-white mb-6">إضافة مستخدم جديد</h3>
            <div className="space-y-4">
              <div>
                <label className="text-blue-300 block mb-2">اسم المستخدم *</label>
                <input type="text" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full bg-slate-700/50 text-white border border-blue-500/30 rounded-lg px-4 py-2 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-blue-300 block mb-2">كلمة المرور *</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-slate-700/50 text-white border border-blue-500/30 rounded-lg px-4 py-2 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-blue-300 block mb-2">الدور</label>
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-slate-700/50 text-white border border-blue-500/30 rounded-lg px-4 py-2 outline-none focus:border-blue-500">
                  <option value="admin">مدير</option>
                  <option value="vendeur">بائع</option>
                  <option value="magasinier">مخزني</option>
                </select>
              </div>
              
              {/* 🔥 NEW: Magasin Access Type Selection for non-admin users */}
              {newUser.role !== "admin" && (
                <>
                  <div>
                    <label className="text-blue-300 block mb-2">نوع الوصول للمحلات</label>
                    <div className="space-y-2">
                      {MAGASIN_ACCESS_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <label key={type.value} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition">
                            <input
                              type="radio"
                              name="magasin_access_type"
                              value={type.value}
                              checked={newUser.magasin_access_type === type.value}
                              onChange={(e) => setNewUser({ ...newUser, magasin_access_type: e.target.value, magasins_acces: [] })}
                              className="mt-1 w-4 h-4 text-blue-500 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-blue-400" />
                                <span className="text-white font-medium">{type.label}</span>
                              </div>
                              <p className="text-slate-400 text-sm mt-1">{type.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Assigned Magasin Selection */}
                  {newUser.magasin_access_type === "assigned_only" && (
                    <div>
                      <label className="text-blue-300 block mb-2">المحل المخصص *</label>
                      <select value={newUser.magasin} onChange={(e) => setNewUser({ ...newUser, magasin: e.target.value })}
                        className="w-full bg-slate-700/50 text-white border border-blue-500/30 rounded-lg px-4 py-2 outline-none focus:border-blue-500">
                        <option value="">اختر المحل</option>
                        {magasins.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                      </select>
                    </div>
                  )}
                  
                  {/* Multiple Magasins Selection */}
                  {newUser.magasin_access_type === "selected_magasins" && (
                    <div>
                      <label className="text-blue-300 block mb-2">المحلات المحددة *</label>
                      <div className="border border-blue-500/30 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                        {magasins.map(m => (
                          <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              value={m.id}
                              checked={newUser.magasins_acces.includes(m.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewUser({ ...newUser, magasins_acces: [...newUser.magasins_acces, m.id] });
                                } else {
                                  setNewUser({ ...newUser, magasins_acces: newUser.magasins_acces.filter(id => id !== m.id) });
                                }
                              }}
                              className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                            />
                            <span className="text-white text-sm">{m.nom}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">اختر المحلات التي يمكن للمستخدم الوصول إليها</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleAddUser} disabled={loading} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg hover:shadow-blue-500/50 transition disabled:opacity-50">
                {loading ? "جاري الإضافة..." : "إضافة"}
              </button>
              <button onClick={() => setShowAddUserModal(false)} className="flex-1 bg-slate-700 text-white py-2 rounded-lg">إلغاء</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* 🔥 NEW: Edit User Modal with Magasin Access Selection */}
      <AnimatePresence>
        {showEditUserModal && (
          <Modal onClose={() => setShowEditUserModal(false)}>
            <h3 className="text-2xl text-white mb-6">تعديل المستخدم</h3>
            <div className="space-y-4">
              <div>
                <label className="text-blue-300 block mb-2">اسم المستخدم *</label>
                <input type="text" value={editUser.username} onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                  className="w-full bg-slate-700/50 text-white border border-blue-500/30 rounded-lg px-4 py-2 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-blue-300 block mb-2">الدور</label>
                <select value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  className="w-full bg-slate-700/50 text-white border border-blue-500/30 rounded-lg px-4 py-2 outline-none focus:border-blue-500">
                  <option value="admin">مدير</option>
                  <option value="vendeur">بائع</option>
                  <option value="magasinier">مخزني</option>
                </select>
              </div>
              
              {/* 🔥 NEW: Magasin Access Type Selection for non-admin users */}
              {editUser.role !== "admin" && (
                <>
                  <div>
                    <label className="text-blue-300 block mb-2">نوع الوصول للمحلات</label>
                    <div className="space-y-2">
                      {MAGASIN_ACCESS_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <label key={type.value} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition">
                            <input
                              type="radio"
                              name="edit_magasin_access_type"
                              value={type.value}
                              checked={editUser.magasin_access_type === type.value}
                              onChange={(e) => setEditUser({ ...editUser, magasin_access_type: e.target.value, magasins_acces: [] })}
                              className="mt-1 w-4 h-4 text-blue-500 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-blue-400" />
                                <span className="text-white font-medium">{type.label}</span>
                              </div>
                              <p className="text-slate-400 text-sm mt-1">{type.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Assigned Magasin Selection */}
                  {editUser.magasin_access_type === "assigned_only" && (
                    <div>
                      <label className="text-blue-300 block mb-2">المحل المخصص *</label>
                      <select value={editUser.magasin} onChange={(e) => setEditUser({ ...editUser, magasin: e.target.value })}
                        className="w-full bg-slate-700/50 text-white border border-blue-500/30 rounded-lg px-4 py-2 outline-none focus:border-blue-500">
                        <option value="">اختر المحل</option>
                        {magasins.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                      </select>
                    </div>
                  )}
                  
                  {/* Multiple Magasins Selection */}
                  {editUser.magasin_access_type === "selected_magasins" && (
                    <div>
                      <label className="text-blue-300 block mb-2">المحلات المحددة *</label>
                      <div className="border border-blue-500/30 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                        {magasins.map(m => (
                          <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              value={m.id}
                              checked={editUser.magasins_acces.includes(m.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditUser({ ...editUser, magasins_acces: [...editUser.magasins_acces, m.id] });
                                } else {
                                  setEditUser({ ...editUser, magasins_acces: editUser.magasins_acces.filter(id => id !== m.id) });
                                }
                              }}
                              className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                            />
                            <span className="text-white text-sm">{m.nom}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">اختر المحلات التي يمكن للمستخدم الوصول إليها</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleEditUser} disabled={loading} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg hover:shadow-blue-500/50 transition disabled:opacity-50">
                {loading ? "جاري التحديث..." : "تحديث"}
              </button>
              <button onClick={() => setShowEditUserModal(false)} className="flex-1 bg-slate-700 text-white py-2 rounded-lg">إلغاء</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Add Magasin Modal */}
      <AnimatePresence>
        {showAddMagasinModal && (
          <Modal onClose={() => setShowAddMagasinModal(false)}>
            <h3 className="text-2xl text-white mb-6">إضافة محل جديد</h3>
            <div className="space-y-4">
              <div>
                <label className="text-blue-300 block mb-2">اسم المحل *</label>
                <input type="text" value={newMagasin.nom} onChange={(e) => setNewMagasin({ ...newMagasin, nom: e.target.value })}
                  className="w-full bg-slate-700/50 text-white border border-blue-500/30 rounded-lg px-4 py-2 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-blue-300 block mb-2">العنوان</label>
                <input type="text" value={newMagasin.adresse} onChange={(e) => setNewMagasin({ ...newMagasin, adresse: e.target.value })}
                  className="w-full bg-slate-700/50 text-white border border-blue-500/30 rounded-lg px-4 py-2 outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleAddMagasin} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg">إضافة</button>
              <button onClick={() => setShowAddMagasinModal(false)} className="flex-1 bg-slate-700 text-white py-2 rounded-lg">إلغاء</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit Magasin Modal */}
      <AnimatePresence>
        {showEditMagasinModal && (
          <Modal onClose={() => setShowEditMagasinModal(false)}>
            <h3 className="text-2xl text-white mb-6">تعديل المحل</h3>
            <div className="space-y-4">
              <div>
                <label className="text-blue-300 block mb-2">اسم المحل *</label>
                <input type="text" value={editMagasin.nom} onChange={(e) => setEditMagasin({ ...editMagasin, nom: e.target.value })}
                  className="w-full bg-slate-700/50 text-white border border-blue-500/30 rounded-lg px-4 py-2 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-blue-300 block mb-2">العنوان</label>
                <input type="text" value={editMagasin.adresse} onChange={(e) => setEditMagasin({ ...editMagasin, adresse: e.target.value })}
                  className="w-full bg-slate-700/50 text-white border border-blue-500/30 rounded-lg px-4 py-2 outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleEditMagasin} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg">تحديث</button>
              <button onClick={() => setShowEditMagasinModal(false)} className="flex-1 bg-slate-700 text-white py-2 rounded-lg">إلغاء</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <Modal onClose={() => setShowPasswordModal(false)}>
            <h3 className="text-2xl text-white mb-6">تغيير كلمة المرور</h3>
            <div className="space-y-4">
              <div>
                <label className="text-blue-300 block mb-2">المستخدم</label>
                <p className="text-white">{selectedUser?.username}</p>
              </div>
              <div>
                <label className="text-blue-300 block mb-2">كلمة المرور الجديدة</label>
                <input type="password" value={changePassword.newPassword} onChange={(e) => setChangePassword({ ...changePassword, newPassword: e.target.value })}
                  className="w-full bg-slate-700/50 text-white border border-blue-500/30 rounded-lg px-4 py-2 outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleChangePassword} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg">تغيير</button>
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 bg-slate-700 text-white py-2 rounded-lg">إلغاء</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Feature Access Modal */}
      <AnimatePresence>
        {showFeatureModal && selectedUser && (
          <Modal onClose={() => setShowFeatureModal(false)}>
            <h3 className="text-2xl text-white mb-4">تخصيص المهام لـ {selectedUser.username}</h3>
            {!featureSaved ? (
              <>
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto mb-6">
                  {Object.entries(ALL_FEATURES).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={features.includes(key)}
                        onChange={() => handleFeatureToggle(key)}
                        disabled={selectedUser.role === "admin"}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveFeatures}
                    disabled={selectedUser.role === "admin"}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg hover:shadow-blue-500/50 transition disabled:opacity-50"
                  >
                    حفظ التغييرات
                  </button>
                  <button onClick={() => setShowFeatureModal(false)} className="flex-1 bg-slate-700 text-white py-2 rounded-lg">إلغاء</button>
                </div>
              </>
            ) : (
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                <p className="text-emerald-400">تم حفظ المهام بنجاح</p>
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// Modal Component
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 rounded-xl w-[600px] max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-blue-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        {children}
      </motion.div>
    </div>
  );
}