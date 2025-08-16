import { useState, useEffect } from "react";
import { Button, Grid } from "@mui/material";
import axios from "../../api/axiosInstance";
import FeedbackCard from "../Cards/FeedbackCard";
import ProductInfos from "./ProductInfos";
import CodeBar from "./CodeBar";

export default function EditProduit({
  selectedProduit,
  setOpenEditDialog,
  setRows,
}) {
  const [formData, setFormData] = useState({
    nom: "",
    reference: "",
    famille: "",
    magasin: "",
    marque: "",
    codes_barres: [],
    // image: "",
    prix_achat: 0,
    prix_vente_cache: 0,
    prix_vente_3: 0,
    prix_vente_5: 0,
    prix_vente_8: 0,
    prix_vente_10: 0,
    taux_benefice_3: 0,
    taux_benefice_5: 0,
    taux_benefice_8: 0,
    taux_benefice_10: 0,
    taux_benefice_cache: 0,
  });
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    console.log("Selected Client:", selectedProduit);
    if (selectedProduit) {
      setFormData({
        nom: selectedProduit.nom,
        reference: selectedProduit.reference,
        famille: selectedProduit.famille,
        magasin: selectedProduit.magasin_detail?.id || "", // ✅
        marque: selectedProduit.marque,
        codes_barres: selectedProduit.codes_barres || [],
        codes_barres_raw: selectedProduit.codes_barres?.join(", ") || "",
        // image: "",
        prix_achat: parseFloat(selectedProduit.prix_achat),
        prix_vente_cache: parseFloat(selectedProduit.prix_vente_cache),
        prix_vente_3: parseFloat(selectedProduit.prix_vente_3),
        prix_vente_5: parseFloat(selectedProduit.prix_vente_5),
        prix_vente_8: parseFloat(selectedProduit.prix_vente_8),
        prix_vente_10: parseFloat(selectedProduit.prix_vente_10),
        taux_benefice_3: selectedProduit.taux_benefice_3,
        taux_benefice_5: selectedProduit.taux_benefice_5,
        taux_benefice_8: selectedProduit.taux_benefice_8,
        taux_benefice_10: selectedProduit.taux_benefice_10,
        taux_benefice_cache: selectedProduit.taux_benefice_cache,
      });
    }
  }, [selectedProduit]);

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!formData || typeof formData !== "object") {
        console.error("formData invalide :", formData);
        return;
      }

      const { codes_barres_raw, ...dataToSend } = formData;

      // ✅ Convertir les champs numériques en float
      const numericFields = [
        "prix_achat",
        "prix_vente_cache",
        "prix_vente_3",
        "prix_vente_5",
        "prix_vente_8",
        "prix_vente_10",
      ];

      numericFields.forEach((field) => {
        if (dataToSend[field] !== null && dataToSend[field] !== undefined) {
          dataToSend[field] = parseFloat(dataToSend[field]);
        }
      });

      console.log("Payload envoyé :", dataToSend);

      const response = await axios.patch(
        `/prod/produits/${selectedProduit.id}/`,
        dataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setFeedback({
        open: true,
        message: "✅ تم تعديل السلعة بنجاح",
        severity: "success",
      });

      setRows((prev) =>
        prev.map((m) =>
          m.id === selectedProduit.id ? { ...m, ...formData } : m
        )
      );
    } catch (err) {
      console.error("Erreur modification:", err);
      setFeedback({
        open: true,
        message: "❌ فشل في التعديل",
        severity: "error",
      });
    }
  };

  return (
    <>
      <Grid container>
        <Grid size={7}>
          <ProductInfos ProductInfo={formData} setProductInfo={setFormData} />
        </Grid>
        <Grid
          size={5}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <CodeBar ProductInfo={formData} setProductInfo={setFormData} />
          {/* <DragDrop files={uploadedFiles} setFiles={setUploadedFiles} /> */}
          <Button
            variant="contained"
            sx={{ width: "90%", height: "50px" }}
            onClick={handleUpdate}
          >
            تعديل المعلومات
          </Button>
        </Grid>
      </Grid>
      {feedback.open && (
        <FeedbackCard
          message={feedback.message}
          severity={feedback.severity}
          onClose={() => {
            setFeedback({ ...feedback, open: false });
            if (feedback.severity === "success") setOpenEditDialog(false);
          }}
        />
      )}
    </>
  );
}
