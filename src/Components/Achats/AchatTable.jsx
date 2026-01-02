import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import { useState } from "react";
import axios from "../../api/axiosInstance";
import ConfirmationDialog from "../Cards/ConfirmationDialog";

export default function AchatTable({
  rows = [],
  setRows,
  onEditClick,
  onDetailsClick,
}) {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const handleDelete = (id) => {
    setSelectedId(id);
    setConfirmationOpen(true);
  };

  const confirmDelete = () => {
    axios
      .delete(`/achat/par-group/${selectedId}/`, {
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
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography
          variant="h5"
          sx={{ mb: 2, textAlign: "center", color: "primary.main" }}
        >
          قائمة المشتريات
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>الرقم</TableCell>
                <TableCell>التاريخ</TableCell>
                <TableCell>الممون</TableCell>
                <TableCell>القيمة</TableCell>
                <TableCell>المدفوع</TableCell>
                <TableCell>المتبقي</TableCell>
                <TableCell>المستخدم</TableCell>
                <TableCell align="center">إجراءات</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    لا توجد بيانات
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.date_formatee}</TableCell>
                    <TableCell>
                      {row.fournisseur_detail?.nom || "غير معروف"}
                    </TableCell>
                    <TableCell>{row.total}</TableCell>
                    <TableCell>{row.somme_payee}</TableCell>
                    <TableCell>{row.somme_restante}</TableCell>
                    <TableCell>
                      {row.utilisateur_detail?.username || "—"}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => onEditClick(row)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(row.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                      <IconButton
                        color="info"
                        onClick={() => onDetailsClick(row)}
                      >
                        <InfoIcon />
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
