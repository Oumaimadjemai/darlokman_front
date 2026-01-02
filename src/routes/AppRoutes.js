import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../Components/Login/Login";
import AdminDashboard from "../Components/Admin/AdminDashboard";
import AddVenteFacilite from "../Components/ventes/vente-facilite/AddVenteFacilite";

export default function AppRoutes({ isLoggedIn, userRole,handleLogout }) {
  return (
    <Routes>
      {/* Default route */}
      <Route
        path="/"
        element={
          <Navigate to={isLoggedIn ? `/${userRole}` : "/login"} replace />
        }
      />

      {/* Login route */}
      <Route
        path="/login"
        element={
          isLoggedIn ? (
            userRole === "admin" ? (
              <Navigate to="/admin" replace />
            ) : userRole === "vendeur" ? (
              <Navigate to="/vendeur" replace />
            ) : userRole === "magasinier" ? (
              <Navigate to="/magasinier" replace />
            ) : (
              <Login />
            )
          ) : (
            <Login />
          )
        }
      />

      {/* Admin */}
     <Route
        path="/admin"
        element={
          isLoggedIn && userRole === "admin" ? (
            <AdminDashboard handleLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Vendeur */}
      <Route
        path="/vendeur"
        element={
          isLoggedIn && userRole === "vendeur" ? (
            <AdminDashboard handleLogout={handleLogout}/>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Magasinier */}
      <Route
        path="/magasinier"
        element={
          isLoggedIn && userRole === "magasinier" ? (
            <AdminDashboard handleLogout={handleLogout}/>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Other pages */}
      <Route
        path="/vente-facilite"
        element={
          isLoggedIn ? <AddVenteFacilite /> : <Navigate to="/login" replace />
        }
      />

      {/* Catch all unknown routes */}
      <Route
        path="*"
        element={
          <Navigate to={isLoggedIn ? `/${userRole}` : "/login"} replace />
        }
      />
    </Routes>
  );
}
