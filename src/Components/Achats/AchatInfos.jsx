import { Button, Stack, TextField, Autocomplete } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";

export default function AchatInfos({ onAddProduct }) {
  const [search, setSearch] = useState("");
  const [produits, setProduits] = useState([]);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [magasins, setMagasins] = useState([]);
  const [selectedMagasin, setSelectedMagasin] = useState(null);
  const [prixAchat, setPrixAchat] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [originalPrixAchat, setOriginalPrixAchat] = useState(null);

  // 🔹 Get user role and magasin from localStorage
  const userRole = localStorage.getItem("role"); // "admin", "vendeur", "magasinier"
  const userMagasinId = localStorage.getItem("magasin_id"); // for non-admin users

  // 🔹 Fetch magasins
  useEffect(() => {
    axios
      .get("/param/magasins/")
      .then((res) => {
        const data = res.data.results || [];
        setMagasins(data);

        // Set selected magasin automatically for non-admin users
        if (userRole !== "admin" && userMagasinId) {
          const userMagasin = data.find((m) => m.id === parseInt(userMagasinId, 10));
          setSelectedMagasin(userMagasin || null);
        }
      })
      .catch((err) => console.error("Erreur lors du fetch des magasins:", err));
  }, []);

  // 🔹 Fetch produits, filtered automatically for non-admin users
  useEffect(() => {
    const params = { search };

    if (userRole !== "admin" && userMagasinId) {
      params.magasin = userMagasinId; // force filter for non-admin
    } else if (selectedMagasin) {
      params.magasin = selectedMagasin.id; // admin can filter
    }

    axios
      .get("/prod/produits/", { params })
      .then((res) => setProduits(res.data.results || []))
      .catch((err) => console.error("Erreur lors du fetch des produits:", err));
  }, [search, selectedMagasin]);

  // 🔹 When selecting a product
  const handleProduitSelect = (event, value) => {
    setSelectedProduit(value);

    if (value) {
      setSelectedMagasin(value.magasin_detail || selectedMagasin); // use product magasin if available

      const original = value.prix_achat ? parseInt(value.prix_achat, 10) : 0;
      setPrixAchat(original.toString());
      setOriginalPrixAchat(original);
    } else {
      setSelectedMagasin(userRole !== "admin" && userMagasinId ? selectedMagasin : null);
      setPrixAchat("");
      setOriginalPrixAchat(null);
    }
  };

  // 🔹 Add product
  const handleAddClick = () => {
    if (selectedProduit && quantite) {
      onAddProduct({
        produit: selectedProduit,
        quantite,
        prixAchat,
        originalPrixAchat,
        magasin: selectedMagasin.id,
        magasin_nom: selectedMagasin.nom,
      });

      // Reset
      setSelectedProduit(null);
      if (userRole === "admin") setSelectedMagasin(null);
      setPrixAchat("");
      setQuantite(1);
      setSearch("");
    } else {
      alert("Veuillez sélectionner un produit et entrer une quantité.");
    }
  };

  return (
    <div>
      {/* Product search */}
      <Autocomplete
        options={Array.isArray(produits) ? produits : []}
        getOptionLabel={(option) => option.nom || ""}
        value={selectedProduit}
        onChange={handleProduitSelect}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText="لا يوجد نتائج"
        renderOption={(props, option) => (
          <li {...props}>
            {option.image && <img src={option.image} alt={option.nom} width="30" style={{ marginRight: 10 }} />}
            {option.nom}
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="بحث"
            size="small"
            sx={{ width: "97.5%" }}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
      />

      <br />

      {/* Magasin, price, quantity */}
      <Stack direction="row" spacing={2}>
        <Autocomplete
          options={Array.isArray(magasins) ? magasins : []}
          getOptionLabel={(option) => option.nom || ""}
          value={selectedMagasin}
          onChange={(e, value) => setSelectedMagasin(value)}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          noOptionsText="لا يوجد محلات"
          renderInput={(params) => (
            <TextField {...params} label="المحل" size="small" sx={{ width: "92%" }} />
          )}
          sx={{ width: "33%" }}
          disabled={userRole !== "admin"} // 🔹 non-admin cannot change
        />

        <TextField
          label="السعر"
          value={prixAchat}
          size="small"
          sx={{ width: "33%" }}
          type="number"
          inputProps={{ step: "1", min: "0", pattern: "[0-9]*" }}
          onChange={(e) => setPrixAchat(e.target.value.replace(/[^0-9]/g, ""))}
        />

        <TextField
          label="الكمية"
          value={quantite}
          onChange={(e) => setQuantite(e.target.value)}
          size="small"
          sx={{ width: "33%" }}
        />
      </Stack>

      <Button
        variant="contained"
        color="success"
        sx={{ mt: 1.5, width: "93px", ml: 1.5 }}
        onClick={handleAddClick}
      >
        +
      </Button>
    </div>
  );
}
