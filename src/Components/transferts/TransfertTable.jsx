import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "../../api/axiosInstance";
import { useState } from "react";
import ConfirmationDialog from "../Cards/ConfirmationDialog";

export default function TransfertTable({ rows = [], setRows }) {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const handleDelete = (id) => {
    setSelectedId(id);
    setConfirmationOpen(true);
  };

  const confirmDelete = () => {
    axios
      .delete(`/trans/transferts/${selectedId}/`, {
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

  return (
    <>
      <Paper
        elevation={3}
        sx={{ p: 3, borderRadius: 3, mb: 2, backgroundColor: "#fff" }}
      >
        <Typography
          variant="h4"
          sx={{ mb: 2, color: "primary.main", textAlign: "center" }}
        >
          قائمة التحويلات
        </Typography>

        <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: "#f9f9f9" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>الرقم</TableCell>
                <TableCell>السلعة</TableCell>
                <TableCell>من</TableCell>
                <TableCell>إلى</TableCell>
                <TableCell>الكمية</TableCell>
                <TableCell>كود بار</TableCell>
                <TableCell>اليوم</TableCell>
                <TableCell>الوقت</TableCell>
                <TableCell>المستخدم</TableCell>
                <TableCell align="center">حذف</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    لا توجد بيانات
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover sx={{ cursor: "pointer" }}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.produit_details?.nom || "غير معروف"}</TableCell>
                    <TableCell>{row.magasin_source_details?.nom || "غير معروف"}</TableCell>
                    <TableCell>{row.magasin_destination_details?.nom || "غير معروف"}</TableCell>
                    <TableCell>{row.quantite}</TableCell>
                    <TableCell>{row.codes_barres_transferes}</TableCell>
                    <TableCell>{row.date_formatee}</TableCell>
                    <TableCell>{row.heure_formatee}</TableCell>
                    <TableCell>{row.utilisateur_details?.username || "غير معروف"}</TableCell>
                    <TableCell align="center">
                      <IconButton color="error" onClick={() => handleDelete(row.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <ConfirmationDialog
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={confirmDelete}
        text="هل أنت متأكد من الحذف؟"
      />
    </>
  );
}
