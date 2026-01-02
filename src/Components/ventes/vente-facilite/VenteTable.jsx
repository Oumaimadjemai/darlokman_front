import {
  Box,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  Button,
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
import InfoIcon from "@mui/icons-material/Info";
import PrintIcon from "@mui/icons-material/Print";
import axios from "../../../api/axiosInstance";
import { useState } from "react";
import ConfirmationDialog from "../../Cards/ConfirmationDialog";
import { saveAs } from "file-saver";

export default function VenteTable({ rows, setRows, onDetailsClick }) {
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
      .delete(`/vente/ventes-facilite/${selectedId}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      })
      .then(() => {
        setRows((prev) => prev.filter((row) => row.id !== selectedId));
      })
      .catch((err) => console.error("Erreur de suppression :", err))
      .finally(() => {
        setConfirmationOpen(false);
        setSelectedId(null);
      });
  };

  const downloadFile = async (url, filename) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(url, { responseType: "blob", headers: { Authorization: `Bearer ${token}` } });
      saveAs(response.data, filename);
    } catch (error) {
      console.error("Erreur lors du téléchargement du fichier :", error);
    }
  };

  return (
    <>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 3, backgroundColor: "#fff", mb: 2 }}>
        <Typography variant="h4" sx={{ mb: 2, color: "primary.main", textAlign: "center" }}>
          قائمة المبيعات بالتقسيط
        </Typography>

        <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "primary.main" }}>
              <TableRow >
                <TableCell sx={{color:"white"}}>الرقم</TableCell>
                <TableCell sx={{color:"white"}}>التاريخ</TableCell>
                <TableCell sx={{color:"white"}}>الزبون</TableCell>
                <TableCell sx={{color:"white"}}>القيمة</TableCell>
                <TableCell sx={{color:"white"}}>الأشهر</TableCell>
                <TableCell sx={{color:"white"}}>المبلغ الشهري</TableCell>
                <TableCell sx={{color:"white"}}>البائع</TableCell>
                <TableCell align="center" sx={{color:"white"}}>إجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">لا توجد بيانات</TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.date_formatee}</TableCell>
                    <TableCell>
                      {row.client_detail
                        ? `${row.client_detail.nom_famille_ar} ${row.client_detail.prenom_ar}`
                        : "غير معروف"}
                    </TableCell>
                    <TableCell>{row.montant_total}</TableCell>
                    <TableCell>{row.nombre_mois}</TableCell>
                    <TableCell>{row.montant_mensuel}</TableCell>
                    <TableCell>
                      {row.utilisateur_detail ? row.utilisateur_detail.username : "غير معروف"}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton color="error" onClick={() => handleDelete(row.id)}>
                        <DeleteIcon />
                      </IconButton>
                      <IconButton color="info" onClick={() => onDetailsClick(row)}>
                        <InfoIcon />
                      </IconButton>
                      <IconButton color="primary" onClick={() => { setSelectedVente(row); setPrintDialogOpen(true); }}>
                        <PrintIcon />
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
        <Box sx={{ px: 3, pb: 3 }}>
          <Typography sx={{ mb: 2 }}>
            اختر نوع الطباعة لعملية البيع رقم {selectedVente?.id}
          </Typography>

          <Button
            variant="contained"
            color="primary"
            sx={{ mb: 2 }}
            onClick={() => {
              if (selectedVente) {
                downloadFile(
                  `/vente/ventes-facilite/${selectedVente.id}/acte/word/`,
                  `Acte.docx`
                );
                setPrintDialogOpen(false);
              }
            }}
          >
            عقد البيع بالتقسيط
          </Button>

          <Button
            variant="contained"
            color="primary"
            sx={{ mb: 2 }}
            onClick={() => {
              if (selectedVente) {
                downloadFile(
                  `/vente/ventes-facilite/${selectedVente.id}/bon/word/`,
                  `Bon.docx`
                );
                setPrintDialogOpen(false);
              }
            }}
          >
            وصل البيع
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (selectedVente) {
                downloadFile(
                  `/vente/ventes-facilite/${selectedVente.id}/depot/word/`,
                  `Depot.docx`
                );
                setPrintDialogOpen(false);
              }
            }}
          >
            وصل المخزن
          </Button>

          {/* Liste des montants par mois */}
          {Array.isArray(selectedVente?.montants_par_mois) &&
            selectedVente.montants_par_mois.length > 0 && (
              <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {selectedVente.montants_par_mois.map((montant, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    color="success"
                    onClick={() => {
                      downloadFile(
                        `/vente/ventes-facilite/${selectedVente.id}/ccp/word/?prelevement=${montant}`,
                        `CCP.docx`
                      );
                      setPrintDialogOpen(false);
                    }}
                  >
                    {montant} دج
                  </Button>
                ))}
              </Box>
            )}
        </Box>
      </Dialog>
    </>
  );
}
