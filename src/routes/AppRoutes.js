import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import Login from "../Components/Login/Login";
import AdminDashboard from "../Components/Admin/AdminDashboard";
import AddVenteFacilite from "../Components/ventes/vente-facilite/AddVenteFacilite";
import AdminLayout from "../Components/Layouts/AdminLayout";
import { Dashboard } from "../Components/Admin/Dashboard";
import { ClientsTable } from "../Components/Clients/ClientsTable";
import { ProductsList } from "../Components/Produits/ProductsList";
import { SuppliersList } from "../Components/Fournisseurs/SuppliersList";
import { ExpensesList } from "../Components/Depenses/ExpensesList";
import { TransfersList } from "../Components/transferts/TransfersList";
import { BarcodesList } from "../Components/Codebarres/BarcodesList";
import { PurchaseView } from "../Components/Achats/PurchaseView";
import { PurchasesList } from "../Components/Achats/PurchasesList";
import { CashSalesView } from "../Components/ventes/vente-cache/CashSalesView";
import { CashSalesList } from "../Components/ventes/vente-cache/CashSalesList";
import { InstallmentSalesView } from "../Components/ventes/vente-facilite/InstallmentSalesView";
import { InstallmentSalesList } from "../Components/ventes/vente-facilite/InstallmentSalesList";
import { Rapportvente } from "../Components/Rapports/RapportVente/SalesReport";
import SalesReport from "../Components/Rapports/RapportProduitVendu/ProduitVenduBoard";
import PaymentDashboard from "../Components/Rapports/RapportPaiement/PaiementBoard";
import MatrixTable from "../Components/Rapports/EcheanceClient/MatrixTable";
import PaymentReport from "../Components/Rapports/RapportPoste/PosteBoard";
import InventoryQuantities from "../Components/Rapports/ComparaisonProduits/ComparaisonBoard";
import SettingsView from "../Components/Admin/SettingsView";
import InventaireStock from "../Components/Produits/InventaireStock";
import NoteBoard from "../Components/Notes/NoteBoard";

export default function AppRoutes({ isLoggedIn, userRole, handleLogout }) {
  return (
    <Routes>
      {/* Main Layout with all routes under /New */}
      <Route path="/New" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<ClientsTable/>}/>
        <Route path="products" element={<ProductsList/>}/>
        <Route path="fournisseurs" element={<SuppliersList/>}/>
        <Route path="depenses" element={<ExpensesList/>}/>
        <Route path="transfert" element={<TransfersList/>}/>
        <Route path="barcode" element={<BarcodesList/>}/>
        <Route path="addachat" element={<PurchaseView/>}/>
        <Route path="achatlist" element={<PurchasesList/>}/>
        <Route path="cashsales" element={<CashSalesView/>}/>
        <Route path="sales" element={<CashSalesList/>}/>
        <Route path="Facilitevente" element={<InstallmentSalesView/>}/>
        <Route path="facilitelist" element={<InstallmentSalesList/>}/>
        <Route path="SalesReport" element={<Rapportvente/>}/>
        <Route path="Produitvendu" element={<SalesReport/>}/>
        <Route path="paiements" element={<PaymentDashboard/>}/>
        <Route path="echeance" element={<MatrixTable/>}/>
        <Route path="poste" element={<PaymentReport/>}/>
        <Route path="comparaison" element={<InventoryQuantities/>}/>
        <Route path="settings" element={<SettingsView/>}/>
        <Route path="inventory" element={<InventaireStock/>}/>
        <Route path="note" element={<NoteBoard/>}/>
      </Route>

      {/* Default route - redirect to /New/dashboard if logged in */}
      <Route
        path="/"
        element={
          isLoggedIn ? (
            <Navigate to="/New/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Login route */}
      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to="/New/dashboard" replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Role-based dashboard routes - redirect to /New/dashboard */}
      <Route
        path="/admin"
        element={
          isLoggedIn ? (
            <Navigate to="/New/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/vendeur"
        element={
          isLoggedIn ? (
            <Navigate to="/New/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/magasinier"
        element={
          isLoggedIn ? (
            <Navigate to="/New/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Legacy route - redirect to /New/dashboard */}
      <Route
        path="/vente-facilite"
        element={
          isLoggedIn ? (
            <Navigate to="/New/Facilitevente" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch all - redirect based on auth status */}
      <Route
        path="*"
        element={
          isLoggedIn ? (
            <Navigate to="/New/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}