import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../Components/Login/Login";
import AdminDashboard from "../Components/Admin/AdminDashboard";
import AddVenteFacilite from "../Components/ventes/vente-facilite/AddVenteFacilite";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<Navigate to="/login" replace />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/vendeur" element={<AdminDashboard />} />
     <Route path="/magasinier" element={<AdminDashboard/>}/>
     <Route path="/vente-facilite" element={<AddVenteFacilite/>}/>
    </Routes>
  );
}
