import { Button, Stack, TextField, Autocomplete } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";

export default function AchatInfos({ onAddProduct }) {
  const [search, setSearch] = useState("");
  const [produits, setProduits] = useState([]);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [magasin, setMagasin] = useState("");
  const [prixAchat, setPrixAchat] = useState("");
  const [quantite, setQuantite] = useState(1);

  useEffect(() => {
    axios
      .get("/prod/produits/")
      .then((res) => setProduits(res.data.produits))
      .catch((err) => console.error("Erreur lors du fetch des produits:", err));
  }, []);

const handleProduitSelect = (event, value) => {
  setSelectedProduit(value);
  if (value) {
    setMagasin(value.magasin_detail?.nom || "");
    // remove decimals (e.g., 19880.0 → 19880)
    setPrixAchat(value.prix_achat ? parseInt(value.prix_achat, 10).toString() : "");
  } else {
    setMagasin("");
    setPrixAchat("");
  }
};

 const handleAddClick = () => {
  if (selectedProduit && quantite) {
    onAddProduct({
      produit: selectedProduit,
      quantite,
      prixAchat,
      magasin: selectedProduit.magasin_detail?.id || null,
      magasin_nom: selectedProduit.magasin_detail?.nom || "" // Magasin name
   // 👈 ID du magasin
    });

    // Reset les champs
    setSelectedProduit(null);
    setMagasin("");
    setPrixAchat("");
    setQuantite(1);
    setSearch("");
  } else {
    alert("Veuillez sélectionner un produit et entrer une quantité.");
  }
};


  return (
    <>
      <Autocomplete
       options={Array.isArray(produits) ? produits : []} // sécurité
  getOptionLabel={(option) => option.nom || ""}
value={selectedProduit}
        onChange={handleProduitSelect}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText="لا يوجد نتائج"
        renderOption={(props, option) => (
          <li {...props}>
            {option.image ? (
              <img
                src={option.image}
                alt={option.nom}
                width="30"
                style={{ marginRight: 10 }}
              />
            ) : null}
            {option.nom}
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="بحث"
            size="small"
            className="Input-field"
            sx={{ width: "97.5%" }}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
      />

      <br />

      <Stack direction="row" spacing={2}>
        <TextField
          label="المحل"
          value={magasin}
          size="small"
          className="Input-field"
          sx={{ width: "33%" }}
          disabled
        />
       <TextField
  label="السعر"
  value={prixAchat}
  size="small"
  className="Input-field"
  sx={{ width: "33%" }}
  type="number"
  inputProps={{
    step: "1", // 👈 only integers
    min: "0",  // 👈 prevent negatives if needed
    pattern: "[0-9]*", // 👈 restrict typing to digits
  }}
  onChange={(e) => {
    // Only keep digits (strip commas, dots, letters)
    const val = e.target.value.replace(/[^0-9]/g, "");
    setPrixAchat(val);
  }}
/>

        <TextField
          label="الكمية"
          value={quantite}
          onChange={(e) => setQuantite(e.target.value)}
          size="small"
          className="Input-field"
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
    </>
  );
}
