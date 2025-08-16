import { Button, Stack, TextField, Autocomplete } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "../../../api/axiosInstance";

export default function VenteInfos({ onAddProduct }) {
  const [search, setSearch] = useState("");
  const [produits, setProduits] = useState([]);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [magasin, setMagasin] = useState("");
  const [prixVente, setPrixVente] = useState("");
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
      setPrixVente(value.prix_vente_cache || "");
    } else {
      setMagasin("");
      setPrixVente("");
    }
  };
  const handleAddClick = () => {
    if (selectedProduit && quantite) {
      onAddProduct({
        produit: selectedProduit,
        quantite: parseFloat(quantite) || 0,
        prixVenteCache: parseFloat(prixVente) || 0,
        magasin: selectedProduit.magasin_detail?.id || null,
        magasin_nom: selectedProduit.magasin_detail?.nom || "",
      });

      // Reset
      setSelectedProduit(null);
      setMagasin("");
      setPrixVente("");
      setQuantite("");
      setSearch("");
    } else {
      alert("Veuillez sélectionner un produit et entrer une quantité.");
    }
  };

  return (
    <>
      <Autocomplete
        options={Array.isArray(produits) ? produits : []}
        getOptionLabel={(option) =>
          option.nom && typeof option.quantite !== "undefined"
            ? `${option.nom} (${option.quantite} unités)`
            : ""
        }
        onChange={handleProduitSelect}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText="لا يوجد نتائج"
        renderOption={(props, option) => (
          <li {...props}>
            {option.image && (
              <img
                src={option.image}
                alt={option.nom}
                width="30"
                style={{ marginRight: 10 }}
              />
            )}
            {option.nom} ({option.quantite} unités)
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
          value={prixVente}
          size="small"
          className="Input-field"
          sx={{ width: "33%" }}
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
