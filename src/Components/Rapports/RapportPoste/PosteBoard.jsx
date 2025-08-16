import { useEffect, useState } from "react";
import {
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Stack,
  InputAdornment,
} from "@mui/material";

import FilterPanel from "../../Clients/FilterPanel";
import SearchIcon from "@mui/icons-material/Search";
import axios from "../../../api/axiosInstance";
import ExtraCard from "./ExtraCard";

// const rows = [
//   {
//     name: "ABID ELHADJ",
//     account: "419342",
//     monthly: 4700,
//     start: "2025-08-17",
//     end: "2026-05-17",
//   },
//   {
//     name: "BOUGUEMDIA MEBARKA",
//     account: "15060145",
//     monthly: 3570,
//     start: "2025-08-17",
//     end: "2026-05-17",
//   },
//   {
//     name: "CHELIHI BARKAHOUM",
//     account: "10146670",
//     monthly: 4030,
//     start: "2025-08-17",
//     end: "2026-05-17",
//   },
// ];

export default function PaymentReport() {
  const [rows, setRows] = useState([]);
  const [totaux, setTotaux] = useState({
    total_ventes: 0,
    total_montant_total: 0,
    total_montant_verse: 0,
    total_montant_restant: 0,
  });
  const [users, setusers] = useState([""]);
  const [filters, setFilters] = useState({
    periode: "",
    users: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const fetchVente = (search = searchTerm, appliedFilters = filters) => {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      "content-Type": "application/json",
    };
    const params = {
      ...appliedFilters,
      search: search || "",
    };
    axios
      .get("/vente/ventes-facilite/", { headers, params })
      .then((response) => {
        setRows(response.data.ventes || []);
        setTotaux({
          total_ventes: response.data.total_ventes || 0,
          total_montant_total: response.data.total_montant_total || 0,
          total_montant_verse: response.data.total_montant_verse || 0,
          total_montant_restant: response.data.total_montant_restant || 0,
        });
      })
      .catch((err) =>
        console.error("Erreur lors du chargement des totaux :", err)
      );
  };
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("/auth/users/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        setusers(res.data);
      } catch (err) {
        console.error("Erreur lors du chargement des client", err);
      }
    };

    fetchUsers();
  }, []);
  useEffect(() => {
    fetchVente();
  }, [searchTerm, filters]);
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchVente(searchTerm); // ✅ fetch when typing stops
    }, 500); // 0.5s delay

    return () => clearTimeout(delayDebounce); // cleanup
  }, [searchTerm, filters]);
  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 2, mt: 2 }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={2}>
          <TextField
            variant="outlined"
            placeholder="ابحث عن زبون..."
            sx={{ width: "300px" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // auto updates search
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />

          {/* Ajout des Pickers de date personnalisée */}

          <FilterPanel
            filters={[
              {
                name: "periode",
                label: "الفترة",
                options: [
                  { value: "", label: "الكل" },
                  { value: "yesterday", label: "الامس" },
                  { value: "today", label: "اليوم" },
                  { value: "this_week", label: "هذا الأسبوع" },
                  { value: "this_month", label: "هذا الشهر" },
                  { value: "last_month", label: "الشهر الماضي" },
                  { value: "this_year", label: "هذا العام" },
                ],
              },
              {
                name: "users",
                label: "البائع",
                options: [
                  { value: "", label: "الكل" },
                  ...users.map((u) => ({
                    value: u.id,
                    label: u.username,
                  })),
                ],
              },
            ]}
            values={filters}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                [e.target.name]: e.target.value,
              }))
            }
          />
        </Stack>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" sx={{ width: "150px", height: "55px" }}>
            تحميل ملف البريد
          </Button>
          <Button
            variant="contained"
            color="success"
            sx={{ width: "150px", height: "55px" }}
          >
            Excel
          </Button>
        </Stack>
      </Stack>
      <ExtraCard data={totaux} />

      {/* TABLE */}
      <Paper sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#ccc" }}>
            <TableRow>
              <TableCell>الاسم و اللقب</TableCell>
              <TableCell>رقم الحساب</TableCell>
              <TableCell>القسط الشهري</TableCell>
              <TableCell>بداية الدفع</TableCell>
              <TableCell>نهاية الدفع</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                <TableCell>
                  {row.client_detail.nom_famille_fr +
                    " " +
                    row.client_detail.prenom_fr}
                </TableCell>
                <TableCell>
                  {row.client_detail.ccp + "/" + row.client_detail.cle}
                </TableCell>
                <TableCell
                  sx={{
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    maxWidth: 200,
                  }}
                >
                  {row.montants_par_mois?.join(", ")}
                </TableCell>

                <TableCell>{row.date_debut}</TableCell>
                <TableCell>{row.date_fin}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
