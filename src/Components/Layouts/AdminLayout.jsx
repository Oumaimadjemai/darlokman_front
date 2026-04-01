import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";

import { Toaster, toast } from "sonner";
import Navbar from "../Menus/Navbar";
import NewSidebar from "../Menus/NewSideBar";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(3);

  const [currentUser, setCurrentUser] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    setCurrentUser(username || "زائر");
    setUserRole(role || "ضيف");
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser("زائر");
    setUserRole("ضيف");
    toast.success("تم تسجيل الخروج");
  };

  const handleNotificationsClick = () => {
    setNotifications(0);
    toast.info("لا توجد إشعارات جديدة");
  };

  return (
    <div
      className={`h-screen flex flex-col ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-amber-50 via-white to-orange-50"
      }`}
      dir="rtl"
    >
      <Toaster position="top-center" richColors />

      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        userRole={userRole}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      
      />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <NewSidebar isOpen={isSidebarOpen} onLogout={handleLogout} />

        {/* Outlet */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}