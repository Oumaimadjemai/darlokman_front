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
  const [scannedBarcodes, setScannedBarcodes] = useState([]);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const scanTimeoutRef = useRef(null);
  const scanInputRef = useRef("");

  console.log("🔹 Component rendered");
  console.log("📊 Current state:", {
    magasinsCount: magasins.length,
    selectedMagasin,
    produitsCount: produits.length,
    scannedBarcodes,
    confirmedCount,
    scanInput: scanInputRef.current
  });

  // ✅ Fetch products
  useEffect(() => {
    console.log("🔄 Starting to fetch products...");
    const fetchProduits = async () => {
      try {
        const response = await axios.get("/prod/produits/");
        console.log("✅ Products fetched successfully:", {
          count: response.data.produits.length,
          sample: response.data.produits.slice(0, 3)
        });
        setProduits(response.data.produits);
      } catch (error) {
        console.error("❌ Error loading products:", error);
      }
    };
    fetchProduits();
  }, []);

  // ✅ Fetch stores
  useEffect(() => {
    console.log("🔄 Starting to fetch stores...");
    const fetchMagasins = async () => {
      try {
        const response = await axios.get("/param/magasins");
        console.log("✅ Stores fetched successfully:", {
          count: response.data.length,
          sample: response.data.slice(0, 3)
        });
        setMagasins(response.data);
      } catch (error) {
        console.error("❌ Error loading stores:", error);
      }
    };
    fetchMagasins();
  }, []);

  // Handle barcode scanning
  const handleBarcodeInput = (e) => {
    console.log("⌨️ Key pressed:", {
      key: e.key,
      code: e.code,
      keyCode: e.keyCode
    });
    
    e.preventDefault();
    
    if (scanTimeoutRef.current) {
      console.log("⏳ Clearing existing timeout");
      clearTimeout(scanTimeoutRef.current);
    }
    
    scanInputRef.current += e.key;
    console.log("📝 Current scan input:", scanInputRef.current);
    
    scanTimeoutRef.current = setTimeout(() => {
      console.log("⏰ Timeout triggered - processing scan input:", scanInputRef.current);
      if (scanInputRef.current.length >= 4) {
        processScannedCode(scanInputRef.current);
      } else {
        console.log("❓ Input too short, ignoring:", scanInputRef.current);
      }
      scanInputRef.current = "";
    }, 50);
  };

  const processScannedCode = (scannedCode) => {
    scannedCode = scannedCode.trim();
    console.log("🔍 Processing scanned code:", scannedCode);

    const allValidBarcodes = produits.flatMap((prod) => [
      prod.codebar_principal,
      ...(prod.codes_barres || []),
    ]);

    console.log("📋 Valid barcodes count:", allValidBarcodes.length);
    
    if (allValidBarcodes.includes(scannedCode)) {
      if (!scannedBarcodes.includes(scannedCode)) {
        console.log("➕ Adding new barcode to scanned list");
        setScannedBarcodes((prev) => {
          const newList = [...prev, scannedCode];
          console.log("📜 New scanned barcodes list:", newList);
          return newList;
        });
      } else {
        console.log("🔄 Barcode already scanned:", scannedCode);
      }
    } else {
      console.warn("⚠️ Invalid barcode scanned:", scannedCode);
      alert(`❌ Code-barres invalide: ${scannedCode}`);
    }
  };

  // Filtered by selected store
  const filteredProduits = produits.filter(
    (produit) => produit.magasin_detail?.id === selectedMagasin
  );

  console.log("🏪 Filtered products for selected store:", {
    storeId: selectedMagasin,
    count: filteredProduits.length
  });

  const totalQuantite = filteredProduits.reduce(
    (total, produit) => total + produit.quantite,
    0
  );

  const readCount = scannedBarcodes.length;
  const unconfirmedCount = totalQuantite - confirmedCount;
  const inputRef = useRef(null);

  console.log("📊 Inventory stats:", {
    totalQuantite,
    readCount,
    confirmedCount,
    unconfirmedCount
  });

  // Focus management
  useEffect(() => {
    console.log("🎯 Setting up focus management");
    const handleFocus = () => {
      console.log("👆 Window click detected - focusing input");
      if (inputRef.current) {
        inputRef.current.focus();
        console.log("✅ Input focused");
      }
    };
    
    handleFocus();
    window.addEventListener("click", handleFocus);
    
    return () => {
      console.log("🧹 Cleaning up focus event listener");
      window.removeEventListener("click", handleFocus);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ mb: 2, mt: 5 }}
      justifyContent="space-between"
      height="100vh"
    >
      {/* Left - Barcode Display */}
      <Stack sx={{ width: "50%" }}>
        <input
          ref={inputRef}
          autoFocus
          onKeyDown={handleBarcodeInput}
          style={{
            position: "absolute",
            opacity: 0,
            height: 1,
            width: 1,
            zIndex: -1,
          }}
        />

        <TextField
          multiline
          rows={5}
          value={scannedBarcodes.join("\n")}
          placeholder="Scannez les codes-barres"
          disabled
          sx={{ 
            "& .MuiInputBase-input": {
              fontFamily: "monospace",
              fontSize: "14px",
              lineHeight: "1.5"
              
            },mb:2
          }}
        />

        <Button variant="contained" sx={{ mb: 2, height: "50px" }}>
          تجربة
        </Button>

        <Button
          variant="contained"
          color="secondary"
          sx={{ height: "50px" }}
          onClick={() => {
            console.log("✅ Confirm button clicked - setting confirmed count to:", readCount);
            setConfirmedCount(readCount);
          }}
        >
          تأكيد
        </Button>
      </Stack>

      {/* Right - Stats & Dropdown */}
      <Stack width="50%">
        <FormControl size="small" sx={{ width: "95%" }}>
          <InputLabel id="magasin-select-label">المحل</InputLabel>
          <Select
            labelId="magasin-select-label"
            id="magasin-select"
            value={selectedMagasin}
            label="المحل"
            onChange={(e) => {
              console.log("🏬 Store selected:", e.target.value);
              setSelectedMagasin(e.target.value);
            }}
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

        <Stack direction="row" sx={{ mt: 2 }}>
          <Box
            sx={{
              width: "90%",
              mb: 2,
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              alignItems: "center",
            }}
          >
            <Typography variant="subtitle1" color="text.secondary">
              العدد الإجمالي
            </Typography>
            <Typography variant="h5" color="secondary">
              {totalQuantite}
            </Typography>
            <Divider />
            <Typography variant="subtitle1" color="text.secondary">
              غير المؤكدة
            </Typography>
            <Typography variant="h5" color="secondary">
              {unconfirmedCount}
            </Typography>
          </Box>

          <Box
            sx={{
              width: "90%",
              mb: 2,
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              alignItems: "center",
            }}
          >
            <Typography variant="subtitle1" color="text.secondary">
              العدد المقروء
            </Typography>
            <Typography variant="h5" color="secondary">
              {readCount}
            </Typography>
            <Divider />
            <Typography variant="subtitle1" color="text.secondary">
              المؤكدة
            </Typography>
            <Typography variant="h5" color="secondary">
              {confirmedCount}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Stack>
  );
}