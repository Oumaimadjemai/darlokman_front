
import Grid from "@mui/material/GridLegacy";
import Side from "./Side";
import AchatInfos from "./AchatInfos";
import Buttom from "./Buttom";
import { useState, useEffect } from "react";
import axios from "../../api/axiosInstance";
import FeedbackCard from "../Cards/FeedbackCard";
import { useParams } from "react-router-dom";

export default function AddAchat({ isEditMode = false, initialData = null }) {
  const [rows, setRows] = useState([]);
  const [formData, setFormData] = useState({
    fournisseur: "",
    somme_payee: 0,
    somme_restante: "",
    achats: [],
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
        fournisseur: initialData.fournisseur_detail?.id || "",
        somme_payee: initialData.somme_payee || "",
        somme_restante: initialData.somme_restante || "",
        achats: initialData.achats || [],
      });

      const initialRows = (initialData.achats || []).map((item, index) => ({
        id: index + 1,
        produitId: item.produit_detail?.id,
        reference: item.produit_detail?.reference || "",
        nom: item.produit_detail?.nom || "",
        prix_achat: parseFloat(item.prix_achat),
        quantite: item.quantite,
        magasin: item.magasin_detail?.id || item.magasin || "",
        magasin_nom: item.magasin_detail?.nom || "",
        total: parseFloat(item.prix_achat) * item.quantite,
      }));
      setRows(initialRows);
    }
  }, [isEditMode, initialData]);

  // Remove the duplicate initialRows declaration outside useEffect

  // Update achats when rows change
  useEffect(() => {
    const achats = rows.map((row) => ({
      produit: row.produitId,
      quantite: row.quantite,
      prix_achat: row.prix_achat,
      magasin: row.magasin,
    }));
    setFormData((prev) => ({ ...prev, achats }));
  }, [rows]);

  // Update somme_restante automatically
  useEffect(() => {
    const total = rows.reduce(
      (acc, curr) => acc + curr.prix_achat * curr.quantite,
      0
    );
    const restante = total - (parseFloat(formData.somme_payee) || 0);
    setFormData((prev) => ({
      ...prev,
      somme_restante: restante >= 0 ? restante : 0,
    }));
  }, [formData.somme_payee, rows]);


  const handleAddProduct = ({
    produit,
    quantite,
    prixAchat,
    magasin,
    magasin_nom,
  }) => {
    const newRow = {
      id: rows.length + 1,
      produitId: produit.id,
      reference: produit.reference || "",
      nom: produit.nom || "",
      prix_achat: parseFloat(prixAchat),
      quantite: parseFloat(quantite),
      magasin: parseInt(magasin),
      magasin_nom: magasin_nom || "", // Add this line
      total: parseFloat(prixAchat) * parseFloat(quantite),
    };

    setRows((prev) => [...prev, newRow]);
  };

  const handleFournisseurChange = (value) => {
    setFormData((prev) => ({ ...prev, fournisseur: value }));
  };

  const handleSommePayeeChange = (value) => {
    setFormData((prev) => ({ ...prev, somme_payee: value }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const achatsCorriges = formData.achats.map((achat) => ({
        ...achat,
        produit: parseInt(achat.produit),
        magasin: parseInt(achat.magasin),
      }));

      const payload = {
        fournisseur: parseInt(formData.fournisseur),
        somme_payee: parseFloat(formData.somme_payee),
        achats: achatsCorriges,
      };

      // Add console.log to debug the payload
      console.log("Payload being sent:", payload);

      if (isEditMode && initialData) {
        const response = await axios.put(
          `/achat/par-group/${initialData.id}/`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Update response:", response.data);
        setFeedback({
          open: true,
          severity: "success",
          message: "✅ Achat modifié avec succès",
        });
      } else {
        try {
          const token = localStorage.getItem("access_token");

          const achatsCorriges = formData.achats.map((achat) => ({
            ...achat,
            produit: parseInt(achat.produit),
            magasin: parseInt(achat.magasin), // 👈 bien forcer l'entier ici aussi
          }));

          const payload = {
            fournisseur: parseInt(formData.fournisseur),
            somme_payee: parseFloat(formData.somme_payee),
            achats: achatsCorriges,
          };

          await axios.post("/achat/par-group/", payload, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          setFeedback({
            open: true,
            severity: "success",
            message: "✅ Achat enregistré avec succès",
          });
          setRows([]);
          setFormData({
            fournisseur: "",
            somme_payee: "",
            somme_restante: "",
            achats: [],
          });
        } catch (error) {
          let message = "❌ Une erreur est survenue.";
          console.error("❌ Erreur Axios:", error);
          setFeedback({
            open: true,
            severity: "error",
            message,
          });
        }
      }
    } catch (error) {
      console.error("Full error object:", error);
      let message = "❌ Une erreur est survenue lors de la mise à jour";

      // Add more specific error messages
      if (error.response) {
        console.error("Error response data:", error.response.data);
        message = error.response.data.message || message;
      } else if (error.request) {
        console.error("Error request:", error.request);
        message = "Pas de réponse du serveur";
      }

      setFeedback({
        open: true,
        severity: "error",
        message,
      });
    }
  };

  return (
    <>
      <Grid container sx={{ height: "100vh" }}>
        <Grid item xs={3} sx={{ borderRight: "1px solid #ddd", p: 1 }}>
          <Side
            rows={rows}
            fournisseurId={formData.fournisseur}
            onFournisseurChange={handleFournisseurChange}
            sommePayee={formData.somme_payee}
            onSommePayeeChange={handleSommePayeeChange}
            sommeRestante={formData.somme_restante}
            onSubmit={handleSubmit}
            isEditMode={isEditMode}
          />
        </Grid>

        <Grid item xs={9} sx={{ p: 2 }}>
          <AchatInfos onAddProduct={handleAddProduct} />
          <Buttom rows={rows} setRows={setRows} />
        </Grid>
      </Grid>
      {feedback.open && (
        <FeedbackCard
          message={feedback.message}
          severity={feedback.severity}
          onClose={() => {
            setFeedback({ ...feedback, open: false });
          }}
        />
      )}
    </>
  );
}
