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
  Box,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import PrintIcon from "@mui/icons-material/Print";
import axios from "../../../api/axiosInstance";
import { useState } from "react";
import ConfirmationDialog from "../../Cards/ConfirmationDialog";
import { saveAs } from "file-saver";

export default function VenteTable({ rows = [], setRows, onDetailsClick }) {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedVente, setSelectedVente] = useState(null);

  const handleDelete = (id) => {
    setSelectedId(id);
    setConfirmationOpen(true);
  };

  const confirmDelete = () => {
    axios
      .delete(`/vente/ventes-cache/${selectedId}/`, {
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

  const downloadFile = async (url, filename) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(url, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });
      saveAs(response.data, filename);
    } catch (error) {
      console.error("Erreur lors du téléchargement :", error);
    }
  };

  return (
    <>
      <Paper sx={{ p: 3, borderRadius: 3, backgroundColor: "#fff", mb: 2 }}>
        <Typography
          variant="h4"
          sx={{ mb: 2, color: "primary.main", textAlign: "center" }}
        >
          قائمة المبيعات
        </Typography>

        <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: "#f9f9f9" }}>
          <Table size="small">
            <TableHead sx={{bgcolor:"primary.main"}}>
              <TableRow>
                <TableCell sx={{color:"white"}}>الرقم</TableCell>
                <TableCell sx={{color:"white"}}>التاريخ</TableCell>
                <TableCell sx={{color:"white"}}>الزبون</TableCell>
                <TableCell sx={{color:"white"}}>القيمة</TableCell>
                <TableCell sx={{color:"white"}}>البائع</TableCell>
                <TableCell sx={{color:"white"}}>تفاصيل</TableCell>
                <TableCell sx={{color:"white"}}>طباعة</TableCell>
                <TableCell sx={{color:"white"}}>حذف</TableCell>
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
                  <TableRow key={row.id} hover sx={{ cursor: "pointer" }}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.date_formatee}</TableCell>
                    <TableCell>
                      {row.client_detail
                        ? `${row.client_detail.nom_famille_ar} ${row.client_detail.prenom_ar}`
                        : "غير معروف"}
                    </TableCell>
                    <TableCell>{row.montant_total}</TableCell>
                    <TableCell>
                      {row.utilisateur_detail?.username || "غير معروف"}
                    </TableCell>
                    <TableCell>
                      <IconButton color="info" onClick={() => onDetailsClick(row)}>
                        <InfoIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => {
                          setSelectedVente(row);
                          setPrintDialogOpen(true);
                        }}
                      >
                        <PrintIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell>
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

      <Dialog open={printDialogOpen} onClose={() => setPrintDialogOpen(false)}>
        <DialogTitle>خيارات الطباعة</DialogTitle>
        <Box sx={{ px: 3, pb: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography sx={{ mb: 2 }}>
            اختر نوع الطباعة لعملية البيع رقم {selectedVente?.id}
          </Typography>

          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (selectedVente) {
                downloadFile(
                  `/vente/ventes-cache/${selectedVente.id}/bon/word/`,
                  `Bon.docx`
                );
                setPrintDialogOpen(false);
              }
            }}
            sx={{ mb: 2 }}
          >
            وصل البيع
          </Button>
        </Box>
      </Dialog>
    </>
  );
}
