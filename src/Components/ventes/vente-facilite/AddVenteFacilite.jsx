import Grid from "@mui/material/GridLegacy";
import Side from "./Side";
import Buttom from "./Buttom";
import { useState, useEffect } from "react";
import axios from "../../../api/axiosInstance";
import FeedbackCard from "../../Cards/FeedbackCard";
import VenteInfos from "./VenteInfos";

export default function AddVenteFacilite({
  isEditMode = false,
  initialData = null,
}) {
  const [rows, setRows] = useState([]);
  const [mois, setMois] = useState(3); // LIFTED UP
  const [formData, setFormData] = useState({
    client: "",
    lignes: [],
    nombre_mois: 3,
    date_debut: null,
    date_fin: null,
    montant_total: 0,
    montant_verse: 0,
    montant_restant: 0,
    montant_mensuel: 0,
    montants_par_mois: [],
  });
  const [feedback, setFeedback] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  // Initialize form if in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        client: initialData.client_detail?.id || "",
        lignes: initialData.ligne || [],
        nombre_mois: initialData.nombre_mois || "",
        date_debut: initialData.date_debut || null,
        date_fin: initialData.date_fin || null,
        montant_total: initialData.montant_total || 0,
        montant_verse: initialData.montant_verse || 0,
        montant_restant: initialData.montant_restant || 0,
        montant_mensuel: initialData.montant_mensuel || 0,
        montants_par_mois: initialData.montants_par_mois || [],
      });

      const initialRows = (initialData.ligne || []).map((item, index) => ({
        id: index + 1,
        produitId: item.produit_detail?.id,
        reference: item.produit_detail?.reference || "",
        nom: item.produit_detail?.nom || "",
        quantite: item.quantite,
        magasin: item.magasin_detail?.id || item.magasin || "",
        magasin_nom: item.magasin_detail?.nom || "",
        total: parseFloat(item.prix_unitaire || 0) * item.quantite,
      }));
      setRows(initialRows);
    }
  }, [isEditMode, initialData]);

  // Update lignes when rows change
  useEffect(() => {
    const lignes = rows.map((row) => ({
      produit: row.produitId,
      quantite: row.quantite,
    }));
    setFormData((prev) => ({ ...prev, lignes }));
  }, [rows]);

  const handleAddProduct = ({
    produit,
    quantite,
    magasin,
    magasin_nom,
    prix_vente_facilite,
  }) => {
    if (!produit) return;

    const qty = parseFloat(quantite) || 0;
    const prix = parseFloat(prix_vente_facilite) || getProductPrice(produit);

    const newRow = {
      id: rows.length + 1,
      produitId: produit.id,
      reference: produit.reference || "",
      nom: produit.nom || "",
      prix_vente_facilite: prix,
      quantite: qty,
      magasin: magasin || produit.magasin_detail?.id || "",
      magasin_nom: magasin_nom || produit.magasin_detail?.nom || "",
      total: prix * qty,
    };

    setRows((prev) => [...prev, newRow]);
  };

  // Compute product price based on nombre_mois
  const getProductPrice = (produit) => {
    const mois = formData.nombre_mois;
    if (!produit) return 0;
    switch (mois) {
      case 3:
        return parseFloat(produit.prix_vente_3 || 0);
      case 5:
        return parseFloat(produit.prix_vente_5 || 0);
      case 8:
        return parseFloat(produit.prix_vente_8 || 0);
      case 10:
        return parseFloat(produit.prix_vente_10 || 0);
      default:
        return 0;
    }
  };

  const handleclientChange = (value) => {
    setFormData((prev) => ({ ...prev, client: value }));
  };

  //   const handleSubmit = async ({ nombre_mois, date_debut }) => {
  //     try {
  //       const token = localStorage.getItem("access_token");

  //       const lignesCorrigees = formData.lignes.map((ligne) => ({
  //         produit: parseInt(ligne.produit),
  //         quantite: parseFloat(ligne.quantite),
  //       }));

  //       const payload = {
  //         client: parseInt(formData.client),
  //         nombre_mois: parseInt(nombre_mois),
  //         date_debut,
  //         lignes: lignesCorrigees,
  //       };

  //       console.log("Payload being sent:", payload);
  // const handleSubmit = async (dataFromSide) => {
  //   try {
  //     const token = localStorage.getItem("access_token");

  //     const lignesCorrigees = formData.lignes.map((ligne) => ({
  //       produit: parseInt(ligne.produit),
  //       quantite: parseFloat(ligne.quantite),
  //     }));

  //     const payload = {
  //       client: parseInt(dataFromSide.client),
  //       date_debut: dataFromSide.date_debut,
  //       date_fin: dataFromSide.date_fin,
  //       nombre_mois: parseInt(dataFromSide.nombre_mois),
  //       montant_total: parseFloat(dataFromSide.montant_total),
  //       montant_verse: parseFloat(dataFromSide.montant_verse || 0),
  //       montant_restant: parseFloat(dataFromSide.montant_restant || 0),
  //       montant_mensuel: parseFloat(dataFromSide.montant_mensuel || 0),
  //       montants_par_mois: dataFromSide.montants_par_mois || [],
  //       lignes: lignesCorrigees,
  //     };

  //     console.log("Payload being sent:", payload);

  //     if (isEditMode && initialData) {
  //       await axios.put(`/vente/ventes-facilite/${initialData.id}/`, payload, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });
  //       setFeedback({
  //         open: true,
  //         severity: "success",
  //         message: "✅ Vente modifiée avec succès",
  //       });
  //     } else {
  //       await axios.post("vente/ventes-facilite/", payload, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });
  //       setFeedback({
  //         open: true,
  //         severity: "success",
  //         message: "✅ Vente enregistrée avec succès",
  //       });
  //       setRows([]);
  //       setFormData({
  //         client: "",
  //         lignes: [],
  //         nombre_mois: "",
  //         date_debut: null,
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Full error object:", error);
  //     let message = "❌ Une erreur est survenue lors de la soumission";
  //     if (error.response) message = error.response.data.message || message;
  //     else if (error.request) message = "Pas de réponse du serveur";
  //     setFeedback({ open: true, severity: "error", message });
  //   }
  // };
  const handleSubmit = async (dataFromSide) => {
    try {
      const token = localStorage.getItem("access_token");

      const lignesCorrigees = formData.lignes.map((ligne) => ({
        produit: parseInt(ligne.produit),
        quantite: parseFloat(ligne.quantite),
      }));

      // ✅ Use data from Side.jsx directly
      const payload = {
        ...dataFromSide,
        lignes: lignesCorrigees,
      };

      console.log("Payload being sent:", payload);

      if (isEditMode && initialData) {
        await axios.put(`/vente/ventes-facilite/${initialData.id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFeedback({
          open: true,
          severity: "success",
          message: "✅ Vente modifiée avec succès",
        });
      } else {
        await axios.post("vente/ventes-facilite/", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFeedback({
          open: true,
          severity: "success",
          message: "✅ Vente enregistrée avec succès",
        });
        setRows([]);
        setFormData({
          client: "",
          lignes: [],
          nombre_mois: "",
          date_debut: null,
        });
      }
    } catch (error) {
      console.error("Full error object:", error);
      let message = "❌ Une erreur est survenue lors de la soumission";
      if (error.response) message = error.response.data.message || message;
      else if (error.request) message = "Pas de réponse du serveur";
      setFeedback({ open: true, severity: "error", message });
    }
  };

  return (
    <>
      <Grid container sx={{ height: "100vh" }}>
        <Grid item xs={3} sx={{ borderRight: "1px solid #ddd", p: 1 }}>
          <Side
            rows={rows}
            clientId={formData.client}
            onclientChange={handleclientChange}
            onSubmit={(data) => {
              setFormData((prev) => ({
                ...prev,
                nombre_mois: data.nombre_mois,
                date_debut: data.date_debut,
              }));
              handleSubmit(data);
            }}
            isEditMode={isEditMode}
            mois={mois}
            onMoisChange={(newMois) => {
              setMois(newMois);
              setFormData((prev) => ({ ...prev, nombre_mois: newMois }));
            }}
          />
        </Grid>

        <Grid item xs={9} sx={{ p: 2 }}>
          <VenteInfos
            onAddProduct={handleAddProduct}
            nombreMois={mois} // use lifted state
          />
          <Buttom rows={rows} setRows={setRows} />
        </Grid>
      </Grid>

      {feedback.open && (
        <FeedbackCard
          message={feedback.message}
          severity={feedback.severity}
          onClose={() => setFeedback({ ...feedback, open: false })}
        />
      )}
    </>
  );
}
