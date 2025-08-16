import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import axios from "../../api/axiosInstance";
import { useState } from "react";
import ConfirmationDialog from "../Cards/ConfirmationDialog";
import ProduitDetail from "./ProduitDEtail";
import CloseIcon from "@mui/icons-material/Close";
export default function ProduitTable({ rows, setRows, onEditClick }) {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedProduit, setSelectedPRoduit] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const handleDelete = (id) => {
    setSelectedId(id);
    setConfirmationOpen(true);
  };

  const confirmDelete = () => {
    axios
      .delete(`/prod/produits/${selectedId}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      })
      .then(() => {
        setRows((prev) => prev.filter((row) => row.id !== selectedId));
      })
      .catch((err) => {
        console.error("Erreur de suppression :", err);
      })
      .finally(() => {
        setConfirmationOpen(false);
        setSelectedId(null);
      });
  };
  const columns = [
    { field: "id", headerName: "الرقم", minWidth: 50 },
    {
      field: "reference",
      headerName: "المرجع",
      minWidth: 120,
    },
    {
      field: "nom",
      headerName: "الإسم",
      minWidth: 120,
    },
    {
      field: "famille",
      headerName: "العائلة",
      minWidth: 100,
    },
    {
      field: "taux_benefice_cache",
      headerName: "ن.ف",
      minWidth: 80,
    },
    {
      field: "moyenne_pourcentage_facilite",
      headerName: "ن.ف.ت",
      minWidth: 80,
    },
    {
      field: "prix_achat",
      headerName: "سعر الشراء",
      minWidth: 100,
    },
    {
      field: "prix_vente_cache",
      headerName: "سعر البيع كاش",
      minWidth: 100,
    },
    {
      field: "prix_vente_3",
      headerName: "سعر 3",
      minWidth: 80,
    },
    {
      field: "prix_vente_5",
      headerName: "سعر 5",
      minWidth: 80,
    },
    {
      field: "prix_vente_6",
      headerName: "سعر 6",
      minWidth: 80,
    },
    {
      field: "prix_vente_8",
      headerName: "سعر 8",
      minWidth: 80,
    },
    {
      field: "prix_vente_9",
      headerName: "سعر 9",
      minWidth: 80,
    },
    {
      field: "prix_vente_10",
      headerName: "سعر 10",
      minWidth: 80,
    },
    {
      field: "prix_vente_12",
      headerName: "سعر 12",
      minWidth: 80,
    },
    {
      field: "prix_vente_15",
      headerName: "سعر 15",
      minWidth: 80,
    },
    {
      field: "quantite",
      headerName: "الكمية",
      minWidth: 60,
    },
    {
      field: "edit",
      headerName: "تعديل",
      width: 50,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          onClick={(e) => {
            e.stopPropagation(); // 🛑 Stop row click
            onEditClick(params.row);
          }}
          color="primary"
        >
          <EditIcon />
        </IconButton>
      ),
    },
    {
      field: "delete",
      headerName: "حذف",
      width: 50,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          onClick={(e) => {
            e.stopPropagation(); // 🛑 Stop row click
            handleDelete(params.row.id);
          }}
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];
  return (
    <>
      <Paper
        elevation={3}
        sx={{ p: 3, borderRadius: 3, backgroundColor: "#fff" }}
      >
        <Typography
          variant="h4"
          sx={{ mb: 2, color: "primary.main", textAlign: "center" }}
        >
          قائمة السلع
        </Typography>

        <Box sx={{ height: 300, width: "100%", overflowY: "auto" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            hideFooter
            getRowId={(row) => row.id} // 🔐 Important for correct ID handling
            onRowClick={(params) => {
              setSelectedPRoduit(params.row); // Save the clicked row
              setOpenDetailDialog(true); // Open the dialog
            }} // 🔐 Important for correct ID handling
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "primary.main",
                fontWeight: "bold",
                color: "black",
                textAlign: "center",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#f5f5f5",
              },
              border: "none",

              fontFamily: 'Arial, "Noto Kufi Arabic", sans-serif',
              cursor: "pointer",
            }}
          />
        </Box>
      </Paper>
      <ConfirmationDialog
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={confirmDelete}
        text="هل أنت متأكد من حذف هذا المنتج؟"
      />
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
          تفاصيل المنتج
          <IconButton onClick={() => setOpenDetailDialog(false)} color="error">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {selectedProduit && <ProduitDetail produit={selectedProduit} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
