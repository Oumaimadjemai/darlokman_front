import {
  Autocomplete,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useState, useEffect } from "react";
import axios from "../../../api/axiosInstance";
export default function Side({
  rows,
  clientId,
  onclientChange,
  onSubmit,
  isEditMode,
}) {
  const [clientList, setClientList] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const totalAmount = rows.reduce((acc, row) => acc + row.total, 0);
    setTotal(totalAmount);
  }, [rows]);

  useEffect(() => {
    axios
      .get("/auth/clients/")
      .then((res) => setClientList(res.data.results))
      .catch((err) =>
        console.error("Erreur lors du chargement des clients:", err)
      );
  }, []);

  return (
    <>
    <Typography variant="h5" color="primary" sx={{textAlign:"center"}}>عملية بيع كاش</Typography>
      <Autocomplete
        options={clientList}
        getOptionLabel={(option) =>
          `${option.nom_famille_ar || ""} ${option.prenom_ar || ""}`
        }
        value={clientList.find((c) => c.id === clientId) || null}
        onChange={(event, newValue) => {
          onclientChange(newValue ? newValue.id : ""); // ou null si tu préfères
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="الزبون"
            size="small"
            sx={{ width: "90%", mt: 2, mb: 2 }}
          />
        )}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />

      <Divider sx={{ mt: 2, mb: 2 }} />
      <Typography variant="h3" textAlign="center" sx={{ mt: 2 }}>
        المجموع
      </Typography>
      <Typography variant="h4" textAlign="center" sx={{ mb: 2 }}>
        {total.toFixed(2)} دج
      </Typography>
      <Divider sx={{ mt: 2, mb: 2 }} />
      <Button
        variant="contained"
        onClick={onSubmit}
        fullWidth
        sx={{ height: "45px", mt: 2, width: "90%", ml: 1 }}
      >
        {isEditMode ? "تعديل" : "حفظ"}
      </Button>
    </>
  );
}
