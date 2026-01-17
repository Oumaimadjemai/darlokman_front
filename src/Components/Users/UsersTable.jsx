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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockResetIcon from "@mui/icons-material/LockReset";
import VerifiedIcon from "@mui/icons-material/Verified";
import axios from "../../api/axiosInstance";
import { useState } from "react";
import ConfirmationDialog from "../Cards/ConfirmationDialog";
import ChangePasswordDialog from "./ChangePasswordDialog"; 
import FeatureAccessBoard from "./FeatureAccessBoard"; 

export default function UsersTable({ rows = [], setRows, onEditClick }) {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [featureBoardOpen, setFeatureBoardOpen] = useState(false);
  const [featureUserId, setFeatureUserId] = useState(null);

  const handleOpenPasswordDialog = (id) => {
    setSelectedUserId(id);
    setChangePasswordOpen(true);
  };

  const handleDelete = (id) => {
    setSelectedId(id);
    setConfirmationOpen(true);
  };

  const confirmDelete = () => {
    axios
      .delete(`/auth/users/${selectedId}/`, {
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
      <Paper sx={{ p: 3, borderRadius: 3, backgroundColor: "#fff" }}>
        <Typography
          variant="h4"
          sx={{ mb: 2, color: "primary.main", textAlign: "center" }}
        >
          قائمة المستخدمين
        </Typography>

        <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: "#f9f9f9" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>الرقم</TableCell>
                <TableCell>إسم المستخدم</TableCell>
                <TableCell>الصلاحية</TableCell>
                <TableCell>المحل</TableCell>
                <TableCell>تعديل</TableCell>
                <TableCell>كلمة السر</TableCell>
                <TableCell>المهام</TableCell>
                <TableCell>حذف</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    لا توجد بيانات
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover sx={{ cursor: "pointer" }}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.username}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>{row.magasin_detail?.nom ||"لا يوجد"}</TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => onEditClick(row)}>
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <IconButton color="warning" onClick={() => handleOpenPasswordDialog(row.id)}>
                        <LockResetIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="success"
                        onClick={() => {
                          setFeatureUserId(row.id);
                          setFeatureBoardOpen(true);
                        }}
                      >
                        <VerifiedIcon />
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

      {/* Dialogs */}
      <ConfirmationDialog
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={confirmDelete}
        text="هل أنت متأكد من حذف هذا المستخدم؟"
      />

      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        userId={selectedUserId}
        fetchUser={() => setRows([...rows])}
      />

      {featureBoardOpen && (
        <Dialog open={featureBoardOpen} onClose={() => setFeatureBoardOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>إدارة المهام</DialogTitle>
          <DialogContent dividers>
            <FeatureAccessBoard userId={featureUserId} onClose={() => setFeatureBoardOpen(false)} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
