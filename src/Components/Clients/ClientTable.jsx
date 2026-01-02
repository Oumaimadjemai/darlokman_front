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
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import axios from "../../api/axiosInstance";
import ConfirmationDialog from "../Cards/ConfirmationDialog";
import ClientDetail from "./ClientDetail";

export default function ClientTable({
  rows = [],
  setRows,
  onEditClick,
  onSelectClient,
}) {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [selectedClient, setSelectedClient] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);

  const handleDelete = (id) => {
    setSelectedId(id);
    setConfirmationOpen(true);
  };

  const confirmDelete = () => {
    axios
      .delete(`/auth/clients/${selectedId}/`, {
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

  return (
    <>
      <Paper sx={{ p: 3, borderRadius: 3, mb: 2 }}>
  <Typography
    variant="h4"
    sx={{ mb: 2, color: "primary.main", textAlign: "center" }}
  >
    قائمة العملاء
  </Typography>

  {/* TableContainer sans maxHeight pour afficher tout le contenu */}
  <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: "#f9f9f9" }}>
    <Table size="small">
      <TableHead sx={{bgcolor:"primary.main"}}>
        <TableRow>
          <TableCell sx={{color:"white"}}>الرقم</TableCell>
          <TableCell sx={{color:"white"}}>الإسم</TableCell>
          <TableCell sx={{color:"white"}}>اللقب</TableCell>
          <TableCell sx={{color:"white"}}>العنوان</TableCell>
          <TableCell sx={{color:"white"}}>الهاتف</TableCell>
          <TableCell sx={{color:"white"}}>الحساب</TableCell>
          <TableCell sx={{color:"white"}}>بداية التقسيط</TableCell>
          <TableCell sx={{color:"white"}}>نهاية التقسيط</TableCell>
          <TableCell sx={{color:"white"}}>آخر تسديد</TableCell>
          <TableCell sx={{color:"white"}}>الدين الإجمالي</TableCell>
          <TableCell sx={{color:"white"}}>الدين الساري</TableCell>
          <TableCell sx={{color:"white"}}>دفعات إضافية</TableCell>
          <TableCell align="center" sx={{color:"white"}}>إجراءات</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={13} align="center">
              لا توجد بيانات
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow
              key={row.id}
              hover
              sx={{ cursor: "pointer" }}
              onClick={() => onSelectClient(row)}
              onDoubleClick={() => {
                setSelectedClient(row);
                setOpenDetailDialog(true);
              }}
            >
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.prenom_ar}</TableCell>
              <TableCell>{row.nom_famille_ar}</TableCell>
              <TableCell>{row.adresse}</TableCell>
              <TableCell>{row.telephone}</TableCell>
              <TableCell>{row.ccp}</TableCell>
              <TableCell>{row.date_debut}</TableCell>
              <TableCell>{row.date_fin}</TableCell>
              <TableCell>{row.last_payment_date}</TableCell>
              <TableCell>{row.dette_totale_client}</TableCell>
              <TableCell>{row.dette_actuelle_client}</TableCell>
              <TableCell>{row.montant_verse}</TableCell>
              <TableCell align="center">
                <IconButton
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick(row);
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(row.id);
                  }}
                >
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


      {/* Confirmation */}
      <ConfirmationDialog
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={confirmDelete}
        text="هل أنت متأكد من حذف هذا الزبون؟"
      />

      {/* Detail Dialog */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between" }}
        >
          تفاصيل العميل
          <IconButton onClick={() => setOpenDetailDialog(false)} color="error">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {selectedClient && <ClientDetail client={selectedClient} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
