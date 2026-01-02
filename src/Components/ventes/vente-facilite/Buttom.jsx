import React from "react";
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

export default function Buttom({ rows, setRows }) {
  // ✅ Delete row locally (UI only)
  const handleDelete = (id) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  return (
    <TableContainer
      component={Paper}
      sx={{ width: "100%", mt: 1, height: "350px" ,bgcolor:"white",height:"550px"}}
    >
      <Table aria-label="receipt table">
        <TableHead>
          <TableRow sx={{ backgroundColor: "#6c757d" }}>
            <TableCell align="right">
              <Typography fontWeight="bold">الرقم</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography fontWeight="bold">المرجع</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography fontWeight="bold">الإسم</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography fontWeight="bold">السعر</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography fontWeight="bold">الكمية</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography fontWeight="bold">المحل</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography fontWeight="bold">المجموع</Typography>
            </TableCell>
            <TableCell align="center">
              <Typography fontWeight="bold">حذف</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody sx={{bgcolor:"black"}}>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell align="right" sx={{color:"white"}} >{row.id}</TableCell>
              <TableCell align="right" sx={{color:"white"}} >{row.reference}</TableCell>
              <TableCell align="right" sx={{color:"white"}}  >{row.nom}</TableCell>
              <TableCell align="right" sx={{color:"white"}} >{Number(row.prix_vente_facilite).toFixed(0)}</TableCell>

              <TableCell align="right" sx={{color:"white"}} >{row.quantite}</TableCell>
              <TableCell align="right" sx={{color:"white"}} >{row.magasin_nom || row.magasin}</TableCell>
             <TableCell align="right" sx={{color:"white"}} >{Number(row.total).toFixed(0)}</TableCell>

              <TableCell align="center">
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
  );
}
