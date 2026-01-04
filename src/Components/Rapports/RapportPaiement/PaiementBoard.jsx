import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  TableContainer,
  Paper,
  Grid,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import axios from "../../../api/axiosInstance";

export default function PaymentDashboard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("الكل");
  const [rows, setRows] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedYear, setSelectedYear] = useState("الكل");
  const currentMonthIndex = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIndex);

  const lockedStatus = ["suspendu", "perdu", "banque_bloquee"];

  const arabicMonths = [
    "", "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
    "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const mapStatusToArabic = (apiStatus) => {
    switch (apiStatus) {
      case "paid":
        return "مدفوع";
      case "pending":
        return "قيد الانتظار";
      case "unpaid":
        return "غير مدفوع";
      default:
        return apiStatus;
    }
  };

  const mapArabicToStatus = (arabicStatus) => {
    switch (arabicStatus) {
      case "مدفوع":
        return "paid";
      case "قيد الانتظار":
        return "pending";
      case "غير مدفوع":
        return "unpaid";
      default:
        return "";
    }
  };

  const fileInputRef = useRef(null);

  const handleFileUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/vente/vente/import-paiements-txt/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessages([{ type: "success", text: "تم تحميل الملف بنجاح" }]);
      fetchData(); // Refresh data after upload
    } catch (err) {
      setMessages([
        {
          type: "error",
          text: err.response?.data?.detail || err.response?.data || err.message || "Erreur inconnue",
        },
      ]);
    } finally {
      event.target.value = null;
    }
  };

  const isClientLocked = (clientStatus) => lockedStatus.includes(clientStatus);

  // Fetch data from the new endpoint
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      
      if (selectedYear !== "الكل") params.year = selectedYear;
      if (selectedMonth !== "الكل") params.month = selectedMonth;
      if (status !== "الكل") params.status = mapArabicToStatus(status);

      const response = await axios.get("/vente/dashboard-paiements/", { params });
      
      // Transform API data to match frontend format
      const transformedData = response.data.map((item) => {
        // Group payments by client and month
        const paymentDate = new Date(item.date).toLocaleDateString("fr-FR");
        
        return {
          name: item.name,
          account: item.account,
          date: paymentDate,
          year: item.year,
          month_index: item.month_index,
          amount: item.amount,
          status: mapStatusToArabic(item.status),
          clientStatus: item.clientStatus,
          // These fields might not be available from the new endpoint
          pending: 0, // You might need to calculate this differently
          montant_mois: item.amount.toString(), // Default to amount if not available
        };
      });
      
      // Group by name, month_index, and year to combine multiple payments
      const groupedData = transformedData.reduce((acc, item) => {
        const key = `${item.name}_${item.month_index}_${item.year}`;
        if (!acc[key]) {
          acc[key] = {
            ...item,
            paymentDates: [item.date],
            totalAmount: item.amount,
            statuses: [item.status]
          };
        } else {
          acc[key].paymentDates.push(item.date);
          acc[key].totalAmount += item.amount;
          acc[key].statuses.push(item.status);
        }
        return acc;
      }, {});
      
      // Convert grouped object to array and calculate final status
      const finalRows = Object.values(groupedData).map((group) => {
        // Determine overall status (if any payment is pending/unpaid)
        let finalStatus = "مدفوع";
        if (group.statuses.includes("قيد الانتظار")) finalStatus = "قيد الانتظار";
        if (group.statuses.includes("غير مدفوع")) finalStatus = "غير مدفوع";
        
        return {
          ...group,
          date: group.paymentDates.join(" , "),
          amount: group.totalAmount,
          status: finalStatus,
          // Remove temporary fields
          paymentDates: undefined,
          totalAmount: undefined,
          statuses: undefined
        };
      });
      
      setRows(finalRows);
    } catch (err) {
      setMessages([
        {
          type: "error",
          text: err.response?.data?.detail || err.message || "Erreur de chargement",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth, status]);

  const filteredRows = rows.filter((row) =>
    row.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = filteredRows.reduce((acc, row) => acc + row.amount, 0);

  const statusTotals = {
    مدفوع: { count: 0, amount: 0 },
    "قيد الانتظار": { count: 0, amount: 0 },
    "غير مدفوع": { count: 0, amount: 0 },
  };

  filteredRows.forEach((row) => {
    const st = row.status;
    if (statusTotals[st]) {
      statusTotals[st].count += 1;
      statusTotals[st].amount += row.amount;
    }
  });

  const getStatusColor = (st) => {
    if (st === "مدفوع") return "green";
    if (st === "قيد الانتظار") return "orange";
    return "red";
  };

  const getCardColor = (st) => {
    if (st === "مدفوع") return "#4caf50";
    if (st === "قيد الانتظار") return "#ff9800";
    return "#f44336";
  };

  // Extract unique years from data
  const uniqueYears = [
    "الكل",
    ...Array.from(new Set(rows.map((row) => row.year).filter(Boolean))),
  ];

  const allMonths = Array.from({ length: 12 }, (_, i) => i);

  return (
    <Box p={2}>
      <Card>
        <CardContent>
          {/* Upload / Search Controls */}
          <Grid container spacing={2} alignItems="center" mb={2}>
            <Grid item>
              <TextField
                placeholder="بحث"
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>

            <Grid item>
              <FormControl size="small">
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="الكل">الكل</MenuItem>
                  <MenuItem value="مدفوع">مدفوع</MenuItem>
                  <MenuItem value="قيد الانتظار">قيد الانتظار</MenuItem>
                  <MenuItem value="غير مدفوع">غير مدفوع</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item>
              <FormControl size="small">
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {uniqueYears.map((y, idx) => (
                    <MenuItem key={idx} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item>
              <FormControl size="small">
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <MenuItem value="الكل">الكل</MenuItem>
                  {allMonths.map((m) => (
                    <MenuItem key={m} value={m}>
                      {arabicMonths[m + 1]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item>
              <Typography variant="h5">{totalAmount} دج</Typography>
            </Grid>

            <Grid item sx={{ ml: "auto" }}>
              <Button
                variant="contained"
                sx={{ color: "white", ml: 2 }}
                onClick={handleFileUploadClick}
                disabled={loading}
              >
                {loading ? "جار التحميل..." : "تحميل ملف البريد"}
              </Button>
              <input
                type="file"
                accept=".txt"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </Grid>
          </Grid>

          {/* Messages Cards (success/error) */}
          {messages.length > 0 && (
            <Box mb={2}>
              {messages.map((msg, idx) => (
                <Card
                  key={idx}
                  sx={{
                    bgcolor: msg.type === "success" ? "#4caf50" : "#f44336",
                    color: "white",
                    borderRadius: 1,
                    width: "100%",
                  }}
                >
                  <CardContent>
                    <Typography variant="body1" sx={{ textAlign: "center" }}>
                      {msg.text}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Status Totals Cards */}
          <Grid container spacing={2} mt={2}>
            {Object.entries(statusTotals).map(([statusLabel, info]) => (
              <Grid item key={statusLabel}>
                <Card
                  sx={{
                    minWidth: 307,
                    bgcolor: getCardColor(statusLabel),
                    color: "white",
                    borderRadius: 1,
                  }}
                >
                  <CardContent sx={{ py: 1, px: 1 }}>
                    <Typography variant="subtitle1" align="center">
                      {statusLabel}
                    </Typography>
                    <Typography variant="body2" align="center">
                      عدد: {info.count}
                    </Typography>
                    <Typography variant="body2" align="center">
                      المجموع: {info.amount} دج
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Table */}
          <TableContainer
            component={Paper}
            sx={{ maxHeight: 500, overflowY: "auto", mt: 2 }}
          >
            <Table stickyHeader size="medium">
              <TableHead>
                <TableRow>
                  <TableCell>الاسم و اللقب</TableCell>
                  <TableCell>رقم الحساب</TableCell>
                  <TableCell>التاريخ</TableCell>
                  <TableCell>القسط الشهري</TableCell>
                  <TableCell>الأقساط</TableCell>
                  <TableCell>موقوف</TableCell>
                  <TableCell>الحالة</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography>جار التحميل...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography>لا توجد بيانات</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.account}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.amount}</TableCell>
                      <TableCell>{row.montant_mois}</TableCell>
                      <TableCell align="center">
                        {isClientLocked(row.clientStatus) && (
                          <LockIcon sx={{ color: "red" }} />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            bgcolor: getStatusColor(row.status),
                            color: "white",
                            px: 1,
                            py: 0.3,
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                          }}
                        >
                          {row.status}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}