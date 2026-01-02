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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "../../api/axiosInstance";
import { useState } from "react";
import ConfirmationDialog from "../Cards/ConfirmationDialog";

export default function MagasinTable({ rows, setRows, onEditClick }) {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const handleDelete = (id) => {
    setSelectedId(id);
    setConfirmationOpen(true);
  };

  const confirmDelete = () => {
    axios
      .delete(`/param/magasins/${selectedId}/`, {
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
        sx={{ p: 3, borderRadius: 3, backgroundColor: "#fff" }}
      >
        <Typography
          variant="h4"
          sx={{ mb: 2, color: "primary.main", textAlign: "center" }}
        >
          قائمة المحلات
        </Typography>

        <TableContainer sx={{ maxHeight: 300 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell align="center">الرقم</TableCell>
                <TableCell align="center">إسم المحل</TableCell>
                <TableCell align="center">العنوان</TableCell>
                <TableCell align="center">تعديل</TableCell>
                <TableCell align="center">حذف</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {(rows || []).map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ "&:hover": { backgroundColor: "#f5f5f5" } }}
                >
                  <TableCell align="center">{row.id}</TableCell>
                  <TableCell align="center">{row.nom}</TableCell>
                  <TableCell align="center">{row.adresse}</TableCell>

                  <TableCell align="center">
                    <IconButton
                      onClick={() => onEditClick(row)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>

                  <TableCell align="center">
                    <IconButton
                      onClick={() => handleDelete(row.id)}
                      color="error"
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
        text="هل أنت متأكد من حذف هذا المحل؟"
      />
    </>
  );
}
