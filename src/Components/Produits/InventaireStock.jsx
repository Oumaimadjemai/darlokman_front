import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "../../api/axiosInstance";
import { useEffect, useState, useRef } from "react";

export default function InventaireStock() {
  const [magasins, setMagasins] = useState([]);
  const [selectedMagasin, setSelectedMagasin] = useState("");
  const [produits, setProduits] = useState([]);
  const [scannedBarcodes, setScannedBarcodes] = useState([]); // will be displayed
  const [confirmedCount, setConfirmedCount] = useState(0);

  const scanTimeoutRef = useRef(null);
  const scanInputRef = useRef(""); // temp string being built
  const inputRef = useRef(null);

  // Fetch products
  useEffect(() => {
    axios
      .get("/prod/produits/")
      .then((res) => setProduits(res.data.produits))
      .catch((err) => console.error(err));
  }, []);

  // Fetch stores
  useEffect(() => {
    axios
      .get("/param/magasins")
      .then((res) => setMagasins(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Barcode capture
  const handleBarcodeInput = (e) => {
    e.preventDefault();

    // Ignore special keys (Shift, etc.)
    if (e.key.length > 1) {
      return; 
    }

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    scanInputRef.current += e.key;

    scanTimeoutRef.current = setTimeout(() => {
      const fullCode = scanInputRef.current.trim();
      // Always push to scannedBarcodes for testing!
      if (fullCode.length > 0) {
        setScannedBarcodes((prev) => [...prev, fullCode]);
      }
      scanInputRef.current = "";
    }, 50);
  };

  // Ensure the hidden input is always focused
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    focusInput();
    window.addEventListener("click", focusInput);
    return () => window.removeEventListener("click", focusInput);
  }, []);

  // Filter based on selected store (optional logic)
  const filteredProduits = produits.filter(
    (p) => p.magasin_detail?.id === selectedMagasin
  );
  const totalQuantite = filteredProduits.reduce(
    (total, p) => total + p.quantite,
    0
  );
  const readCount = scannedBarcodes.length;
  const unconfirmedCount = totalQuantite - confirmedCount;

  return (
    <Stack direction="row" spacing={2} height="100vh" mt={5} justifyContent="space-between">
      {/* Invisible input for scanning */}
      <input
        ref={inputRef}
        autoFocus
        onKeyDown={handleBarcodeInput}
        style={{ opacity: 0, position: "fixed", top: 0, left: 0 }}
      />

      {/* LEFT */}
      <Stack sx={{ width: "50%" }}>
        <TextField
          multiline
          rows={5}
          value={scannedBarcodes.join("\n")}
          placeholder="Codes scannés"
          sx={{
            "& .MuiInputBase-input": {
              fontFamily: "monospace",
              fontSize: "14px",
              lineHeight: "1.5",
            },
            mb: 2,
          }}
        />

        <Button variant="contained" sx={{ mb: 2 }}>
          تجربة
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={() => setConfirmedCount(readCount)}
        >
          تأكيد
        </Button>
      </Stack>

      {/* RIGHT */}
      <Stack width="50%">
        <FormControl size="small" sx={{ width: "95%" }}>
          <InputLabel id="magasin-select-label">المحل</InputLabel>
          <Select
            labelId="magasin-select-label"
            value={selectedMagasin}
            label="المحل"
            onChange={(e) => setSelectedMagasin(e.target.value)}
          >
            {magasins.length === 0 ? (
              <MenuItem disabled>Chargement...</MenuItem>
            ) : (
              magasins.map((magasin) => (
                <MenuItem key={magasin.id} value={magasin.id}>
                  {magasin.nom}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <Stack direction="row" mt={2}>
          <Box sx={{ width: "90%", p: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="subtitle1">العدد الإجمالي</Typography>
            <Typography variant="h5">{totalQuantite}</Typography>
            <Divider />
            <Typography variant="subtitle1">غير المؤكدة</Typography>
            <Typography variant="h5">{unconfirmedCount}</Typography>
          </Box>

          <Box sx={{ width: "90%", p: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="subtitle1">المقروء</Typography>
            <Typography variant="h5">{readCount}</Typography>
            <Divider />
            <Typography variant="subtitle1">المؤكدة</Typography>
            <Typography variant="h5">{confirmedCount}</Typography>
          </Box>
        </Stack>
      </Stack>
    </Stack>
  );
}
