import { Button, Stack, TextField, Autocomplete } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "../../../api/axiosInstance";

export default function VenteInfos({ onAddProduct, nombreMois }) {
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
      // choose the price according to nombreMois
      let prix = "";
      if (nombreMois === 3) prix = value.prix_vente_3;
      else if (nombreMois === 5) prix = value.prix_vente_5;
      else if (nombreMois === 8) prix = value.prix_vente_8;
      else if (nombreMois === 10) prix = value.prix_vente_10;
      setPrixVente(prix || "");
    } else {
      setMagasin("");
      setPrixVente("");
    }
  };
  useEffect(() => {
    if (selectedProduit) {
      let prix = 0;
      switch (nombreMois) {
        case 3:
          prix = Number(selectedProduit.prix_vente_3) || 0;
          break;
        case 5:
          prix = Number(selectedProduit.prix_vente_5) || 0;
          break;
        case 6:
          prix = Number(selectedProduit.prix_vente_6) || 0;
          break;
        case 8:
          prix = Number(selectedProduit.prix_vente_8) || 0;
          break;
        case 9:
          prix = Number(selectedProduit.prix_vente_9) || 0;
          break;
        case 10:
          prix = Number(selectedProduit.prix_vente_10) || 0;
          break;
        case 12:
          prix = Number(selectedProduit.prix_vente_12) || 0;
          break;
        case 15:
          prix = Number(selectedProduit.prix_vente_15) || 0;
          break;
        default:
          prix = 0;
      }
      setPrixVente(prix);
    } else {
      setPrixVente("");
    }
  }, [selectedProduit, nombreMois]);

  
  const handleAddClick = () => {
    if (!selectedProduit || !quantite) {
      alert("Veuillez sélectionner un produit et entrer une quantité.");
      return;
    }
    const prix = parseFloat(prixVente) || 0;
    onAddProduct({
      produit: selectedProduit,
      quantite: parseFloat(quantite),
      prix_vente_facilite: prix,
      magasin: selectedProduit.magasin_detail?.id || null,
      magasin_nom: selectedProduit.magasin_detail?.nom || "",
    });

    // Reset fields
    setSelectedProduit(null);
    setMagasin("");
    setPrixVente("");
    setQuantite(1);
    setSearch("");
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
          type="number"
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
