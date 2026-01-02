import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import axios from "../../api/axiosInstance";
import { useState } from "react";
import ConfirmationDialog from "../Cards/ConfirmationDialog";
import ProduitDetail from "./ProduitDEtail";

export default function ProduitTable({ rows, setRows, onEditClick }) {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);

  const role = localStorage.getItem("role");

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
      .finally(() => {
        setConfirmationOpen(false);
        setSelectedId(null);
      });
  };

  /* 🔢 Format prices */
  const formattedRows = (rows || []).map((row) => {
    const priceFields = [
      "prix_achat",
      "prix_vente_cache",
      "prix_vente_3",
      "prix_vente_5",
      "prix_vente_6",
      "prix_vente_8",
      "prix_vente_9",
      "prix_vente_10",
      "prix_vente_12",
      "prix_vente_15",
    ];

    const newRow = { ...row };
    priceFields.forEach((f) => {
      if (newRow[f] !== null && newRow[f] !== undefined) {
        newRow[f] = Math.round(newRow[f]);
      }
    });

    if (newRow.moyenne_pourcentage_facilite != null) {
      newRow.moyenne_pourcentage_facilite =
        Math.round(newRow.moyenne_pourcentage_facilite * 100) / 100;
    }

    return newRow;
  });

  return (
    <>
      <Paper
  elevation={3}
  sx={{
    p: 3,
    borderRadius: 3,
    backgroundColor: "#fff",
  }}
>
  <Typography
    variant="h4"
    sx={{ mb: 2, color: "primary.main", textAlign: "center" }}
  >
    قائمة السلع
  </Typography>

  {/* ✅ بدون height / overflow */}
  <TableContainer component={Paper} elevation={0}>
    <Table>
      <TableHead sx={{bgcolor:"primary.main"}}>
        <TableRow>
          <TableCell align="center" sx={{color:"white"}}>الرقم</TableCell>
          <TableCell align="center" sx={{color:"white"}}>المرجع</TableCell>
          <TableCell align="center" sx={{color:"white"}}>الإسم</TableCell>
          <TableCell align="center" sx={{color:"white"}}>العائلة</TableCell>

          {role === "admin" && (
            <>
              <TableCell align="center" sx={{color:"white"}}>ن.ف</TableCell>
              <TableCell align="center" sx={{color:"white"}}>ن.ف.ت</TableCell>
              <TableCell align="center" sx={{color:"white"}}>سعر الشراء</TableCell>
            </>
          )}

          <TableCell align="center" sx={{color:"white"}}>سعر كاش</TableCell>
          <TableCell align="center" sx={{color:"white"}}>سعر 3</TableCell>
          <TableCell align="center" sx={{color:"white"}}>سعر 5</TableCell>
          <TableCell align="center" sx={{color:"white"}}>سعر 6</TableCell>
          <TableCell align="center" sx={{color:"white"}}>سعر 8</TableCell>
          <TableCell align="center" sx={{color:"white"}}>سعر 9</TableCell>
          <TableCell align="center" sx={{color:"white"}}>سعر 10</TableCell>
          <TableCell align="center" sx={{color:"white"}}>سعر 12</TableCell>
          <TableCell align="center" sx={{color:"white"}}>سعر 15</TableCell>
          <TableCell align="center" sx={{color:"white"}}>الكمية</TableCell>

          {role === "admin" && (
            <TableCell align="center" sx={{color:"white"}}>تعديل</TableCell>
          )}
          <TableCell align="center" sx={{color:"white"}}>حذف</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {formattedRows.map((row) => (
          <TableRow
            key={row.id}
            hover
            sx={{ cursor: "pointer" }}
            onClick={() => {
              setSelectedProduit(row);
              setOpenDetailDialog(true);
            }}
          >
            <TableCell align="center">{row.id}</TableCell>
            <TableCell align="center">{row.reference}</TableCell>
            <TableCell align="center">{row.nom}</TableCell>
            <TableCell align="center">{row.famille}</TableCell>

            {role === "admin" && (
              <>
                <TableCell align="center">
                  {row.taux_benefice_cache}
                </TableCell>
                <TableCell align="center">
                  {row.moyenne_pourcentage_facilite}
                </TableCell>
                <TableCell align="center">{row.prix_achat}</TableCell>
              </>
            )}

            <TableCell align="center">{row.prix_vente_cache}</TableCell>
            <TableCell align="center">{row.prix_vente_3}</TableCell>
            <TableCell align="center">{row.prix_vente_5}</TableCell>
            <TableCell align="center">{row.prix_vente_6}</TableCell>
            <TableCell align="center">{row.prix_vente_8}</TableCell>
            <TableCell align="center">{row.prix_vente_9}</TableCell>
            <TableCell align="center">{row.prix_vente_10}</TableCell>
            <TableCell align="center">{row.prix_vente_12}</TableCell>
            <TableCell align="center">{row.prix_vente_15}</TableCell>
            <TableCell align="center">{row.quantite}</TableCell>

            {role === "admin" && (
              <TableCell
                align="center"
                onClick={(e) => e.stopPropagation()}
              >
                <IconButton
                  color="primary"
                  onClick={() => onEditClick(row)}
                >
                  <EditIcon />
                </IconButton>
              </TableCell>
            )}

            <TableCell
              align="center"
              onClick={(e) => e.stopPropagation()}
            >
              <IconButton
                color="error"
                onClick={() => handleDelete(row.id)}
              >
                <DeleteIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
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
          {selectedProduit && (
            <ProduitDetail produit={selectedProduit} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
