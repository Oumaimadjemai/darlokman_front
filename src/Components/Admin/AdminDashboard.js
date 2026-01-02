import AddClient from "../Clients/AddClient";
import Sidebar from "../Menus/SideBar";
import Grid from "@mui/material/GridLegacy";
import {
  Box,
  Dialog,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import AddProduit from "../Produits/AddProduit";
import MagasinBoard from "../Magasins/magasinBoard";
import UserBoard from "../Users/UserBoard";

import NotesBoard from "../Notes/NotesBoard";
import ClientBoard from "../Clients/ClientBoard";
import ProduitBoard from "../Produits/ProduitBoard";
import FournisseurBoard from "../Fournisseurs/FournisseurBoard";
import AddFournisseur from "../Fournisseurs/AddFournisseur";
import DepenseBoard from "../Depenses/DepenseBoard";
import TransfertBoard from "../transferts/TransfertBoard";
import AddAchat from "../Achats/AddAchat";
import AchatBoard from "../Achats/AchatBoard";
import CodebarresBoard from "../Codebarres/CodebarresBoard";
import InventaireStock from "../Produits/InventaireStock";
import AddVente from "../ventes/vente-cache/AddVente";
import VenteBoard from "../ventes/vente-cache/VenteBoard";
import Header from "../Menus/Header";
import AddVenteFacilite from "../ventes/vente-facilite/AddVenteFacilite";
import VenteBoardFacilite from "../ventes/vente-facilite/VenteBoard";
import Dashboard from "../Rapports/RapportVente/RapportVenteBoard";
import PaymentDashboard from "../Rapports/RapportPaiement/PaiementBoard";
import MatrixTable from "../Rapports/EcheanceClient/MatrixTable";
import PaymentReport from "../Rapports/RapportPoste/PosteBoard";
import InventoryQuantities from "../Rapports/ComparaisonProduits/ComparaisonBoard";
import SalesReport from "../Rapports/RapportProduitVendu/ProduitVenduBoard";
import DashboardHome from "./Home";
import Profile from "./Profile";
import DashboardHomeVendeur from "../vendeur/Home";
export default function AdminDashboard({handleLogout}) {
  const [openAddClientDialog, setOpenAddClientDialog] = useState(false);
  const [openAddProductDialog, setOpenAddProductDialog] = useState(false);
  const [openAddFournisseurDialog, setOpenAddFournisseurtDialog] =
    useState(false);

  // Change activeComponent to handle both string and object

  const [features, setFeatures] = useState([]);
  const [role, setRole] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState({
    name: role === "vendeur" || role === "magasinier" ? "home" : "home",
  });
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  useEffect(() => {
    const storedId = localStorage.getItem("selectedSidebarId");
    if (storedId) {
      setActiveComponent({ name: storedId });
    }
    const storedFeatures = JSON.parse(localStorage.getItem("features")) || [];
    setFeatures(storedFeatures);

    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
  }, []);

  const handleAction = (actionId) => {
    if (role !== "admin" && !features.includes(actionId)) {
      alert("🚫 ليس لديك صلاحية للوصول إلى هذه الميزة");
      return;
    }
    localStorage.setItem("selectedSidebarId", actionId);
    switch (actionId) {
      case "add-client":
        setOpenAddClientDialog(true);
        break;
      case "add-product":
        setOpenAddProductDialog(true);
        break;
      case "add-fourn":
        setOpenAddFournisseurtDialog(true);
        break;
      case "magasins":
      case "settings":
      case "users":
      case "notes":
      case "client-list":
      case "lists":
      case "product-list":
      case "fournisseur-list":
      case "depense-list":
      case "transfert":
      case "nouveau-achat":
      case "achat":
      case "achat-list":
      case "home":
      case "codebar":
      case "get-product":
      case "vente":
      case "nouveau-vente-cache":
      case "vente-cache-list":
      case "nouveau-vente-facilite":
      case "vente-facilite-list":
      case "rapport":
      case "rapport-vente":
      case "rapport-depense":
      case "depense-client":
      case "rapport-poste":
      case "produit-comparaison":
      case "rapport-produit-vendu":
      case "profil":
        setActiveComponent({ name: actionId });
        break;
      default:
        setActiveComponent({ name: "home" });
        break;
    }
  };

  // Component switching logic
  const renderComponent = () => {
    if (role === "vendeur" || role === "magasinier") {
      switch (activeComponent.name) {
        case "home":
          return <DashboardHomeVendeur />;
        case "settings":
        case "magasins":
          return <MagasinBoard />;
        case "users":
          return <UserBoard />;
        case "notes":
          return <NotesBoard />;
        case "lists":
        case "client-list":
          return <ClientBoard setActiveComponent={setActiveComponent} />;
        case "product-list":
          return <ProduitBoard />;
        case "fournisseur-list":
          return <FournisseurBoard />;
        case "depense-list":
          return <DepenseBoard />;
        case "transfert":
          return <TransfertBoard />;
        case "achat":
        case "nouveau-achat":
          return <AddAchat isEditMode={false} />;
        case "edit-achat":
          return <AddAchat {...activeComponent.props} />;

        case "achat-list":
          return <AchatBoard setActiveComponent={setActiveComponent} />;
        case "codebar":
          return <CodebarresBoard />;
        case "get-product":
          return <InventaireStock />;

        case "vente":
        case "nouveau-vente-cache":
          return <AddVente isEditMode={false} />;
        case "vente-cache-list":
          return <VenteBoard setActiveComponent={setActiveComponent} />;
        case "nouveau-vente-facilite":
          return <AddVenteFacilite isEditMode={false} {...activeComponent.props} />;
        case "vente-facilite-list":
          return <VenteBoardFacilite setActiveComponent={setActiveComponent} />;
        case "rapport":
        case "rapport-vente":
          return <Dashboard />;
        case "rapport-depense":
          return <PaymentDashboard />;
        case "depense-client":
          return <MatrixTable />;
        case "rapport-poste":
          return <PaymentReport />;
        case "produit-comparaison":
          return <InventoryQuantities />;
        case "rapport-produit-vendu":
          return <SalesReport />;
        case "profil":
          return <Profile />;
        default:
          return null;
      }
    }
    switch (activeComponent.name) {
      case "home":
        return <DashboardHome />;
      case "settings":
      case "magasins":
        return <MagasinBoard />;
      case "users":
        return <UserBoard />;
      case "notes":
        return <NotesBoard />;
      case "lists":
      case "client-list":
        return <ClientBoard setActiveComponent={setActiveComponent} />;
      case "product-list":
        return <ProduitBoard />;
      case "fournisseur-list":
        return <FournisseurBoard />;
      case "depense-list":
        return <DepenseBoard />;
      case "transfert":
        return <TransfertBoard />;
      case "achat":
      case "nouveau-achat":
        return <AddAchat isEditMode={false} />;
      case "edit-achat":
        return <AddAchat {...activeComponent.props} />;

      case "achat-list":
        return <AchatBoard setActiveComponent={setActiveComponent} />;
      case "codebar":
        return <CodebarresBoard />;
      case "get-product":
        return <InventaireStock />;
      case "nouveau-vente-cache":
      case "vente":
        return <AddVente isEditMode={false} />;
      case "vente-cache-list":
        return <VenteBoard setActiveComponent={setActiveComponent} />;
      case "nouveau-vente-facilite":
        return (
          <AddVenteFacilite isEditMode={false} {...activeComponent.props} />
        );

      case "vente-facilite-list":
        return <VenteBoardFacilite setActiveComponent={setActiveComponent} />;
      case "rapport-vente":
      case "rapport":
        return <Dashboard />;
      case "rapport-depense":
        return <PaymentDashboard />;
      case "depense-client":
        return <MatrixTable />;
      case "rapport-poste":
        return <PaymentReport />;
      case "produit-comparaison":
        return <InventoryQuantities />;
      case "rapport-produit-vendu":
        return <SalesReport />;
      case "profil":
        return <Profile />;
      default:
        return null;
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", height: "100vh" }}>
        <Sidebar
          open={sidebarOpen}
          onAction={handleAction}
          selectedId={activeComponent.name}
          onClose={() => setSidebarOpen(false)}
           handleLogout={handleLogout}
          
        />

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            width: "100%",
            height: "100%",
          }}
        >
          <Header>
            <IconButton onClick={toggleSidebar} sx={{ color: "primary.main" }}>
              <MenuIcon />
            </IconButton>
          </Header>

          {/* Content */}
          <Box
            sx={{
              p: 1,
              overflowY: "auto",
              overflowX: "hidden",
              height: "100%",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {renderComponent()}
          </Box>
        </Box>
      </Box>

      <Dialog
        open={openAddClientDialog}
        onClose={() => setOpenAddClientDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row-reverse", // 🡐 Title on the right, icon on the left
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <IconButton
              aria-label="close"
              onClick={() => setOpenAddClientDialog(false)}
              sx={{
                color: (theme) => theme.palette.error.main, // optional red color
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography
              variant="h5"
              component="div"
              sx={{ ml: "10px" }}
              color="primary"
            >
              إضافة زبون
            </Typography>
          </Box>
        </DialogTitle>

        {/* The form content */}
        <AddClient setOpenAddClientDialog={setOpenAddClientDialog} />
      </Dialog>
      <Dialog
        open={openAddProductDialog}
        onClose={() => setOpenAddProductDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row-reverse", // 🡐 Title on the right, icon on the left
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <IconButton
              aria-label="close"
              onClick={() => setOpenAddProductDialog(false)}
              sx={{
                color: (theme) => theme.palette.error.main, // optional red color
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography
              variant="h5"
              component="div"
              sx={{ ml: "10px" }}
              color="primary"
            >
              إضافة سلعة
            </Typography>
          </Box>
        </DialogTitle>

        {/* The form content */}
        <AddProduit setOpenAddProductDialog={setOpenAddProductDialog} />
      </Dialog>
      <Dialog
        open={openAddFournisseurDialog}
        onClose={() => setOpenAddFournisseurtDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row-reverse", // 🡐 Title on the right, icon on the left
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <IconButton
              aria-label="close"
              onClick={() => setOpenAddFournisseurtDialog(false)}
              sx={{
                color: (theme) => theme.palette.error.main, // optional red color
              }}
            >
              <CloseIcon />
            </IconButton>
            <Typography
              variant="h5"
              component="div"
              sx={{ ml: "10px" }}
              color="primary"
            >
              إضافة ممون
            </Typography>
          </Box>
        </DialogTitle>

        {/* The form content */}
        <AddFournisseur
          setOpenAddFournisseurtDialog={setOpenAddFournisseurtDialog}
        />
      </Dialog>
    </>
  );
}
