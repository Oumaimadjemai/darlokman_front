import Grid from "@mui/material/Grid";
import ProductInfos from "./ProductInfos";
import CodeBar from "./CodeBar";
import DragDrop from "../Clients/dragDrop";
import { useState } from "react";
import Button from "@mui/material/Button";
import axios from "../../api/axiosInstance";
import FeedbackCard from "../Cards/FeedbackCard";

export default function AddProduit({ setOpenAddProductDialog, fetchProduit }) {
  const [feedback, setFeedback] = useState({
    open: false,
    severity: "success", // or "error"
    message: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [ProductInfo, setProductInfo] = useState({
    nom: "",
    reference: "",
    famille: "",
    magasin: "",
    marque: "",
    codes_barres: [],
    prix_achat: 0,
    prix_vente_cache: 0,
    prix_vente_3: 0,
    prix_vente_5: 0,
    prix_vente_8: 0,
    prix_vente_10: 0,
    prix_vente_6: 0,
    prix_vente_9: 0,
    prix_vente_12: 0,
    prix_vente_15: 0,
    taux_benefice_3: 0,
    taux_benefice_5: 0,
    taux_benefice_8: 0,
    taux_benefice_10: 0,
    taux_benefice_6: 0,
    taux_benefice_9: 0,
    taux_benefice_12: 0,
    taux_benefice_15: 0,
    taux_benefice_cache: 0,
  });

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      const access_token = localStorage.getItem("access_token");

      // Prepare the data
      const payload = {
        ...ProductInfo,
        // Convert numeric fields
        prix_achat: Number(ProductInfo.prix_achat),
        taux_benefice_3: Number(ProductInfo.taux_benefice_3),
        taux_benefice_5: Number(ProductInfo.taux_benefice_5),
        taux_benefice_8: Number(ProductInfo.taux_benefice_8),
        taux_benefice_10: Number(ProductInfo.taux_benefice_10),
        taux_benefice_6: Number(ProductInfo.taux_benefice_6),
        taux_benefice_9: Number(ProductInfo.taux_benefice_9),
        taux_benefice_12: Number(ProductInfo.taux_benefice_12),
        taux_benefice_15: Number(ProductInfo.taux_benefice_15),
        taux_benefice_cache: Number(ProductInfo.taux_benefice_cache),
      };

      // Append all fields
      Object.entries(payload).forEach(([key, value]) => {
        if (key === "codes_barres") {
          // Convert the array to JSON string for the JSONField
          formData.append(key, JSON.stringify(value));
        } else if (key !== "image") {
          formData.append(key, value);
        }
      });

      // Append images
      uploadedFiles.forEach((file) => formData.append("image", file));

      // Debug: log what's being sent
      console.log("FormData contents:", [...formData.entries()]);

      const response = await axios.post("prod/produits/", formData, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Show success feedback
      setFeedback({
        open: true,
        severity: "success",
        message: "✅ Produit enregistré avec succès",
      });

      console.log("Success:", response.data); // Close the dialog after successful submission
      if (typeof fetchProduit === "function") {
        fetchProduit();
      } else {
        console.warn("⚠ fetchProduit is not a function", fetchProduit);
      }
    } catch (err) {
      console.error("Erreur:", err);
      let message = "❌ Une erreur est survenue.";

      if (err.response?.data) {
        // Handle different error response formats
        if (typeof err.response.data === "object") {
          message = Object.entries(err.response.data)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return `${key}: ${value.join(", ")}`;
              }
              return `${key}: ${value}`;
            })
            .join(" | ");
        } else {
          message = err.response.data.toString();
        }
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
      <Grid container>
        <Grid size={7}>
          <ProductInfos
            ProductInfo={ProductInfo}
            setProductInfo={setProductInfo}
          />
        </Grid>
        <Grid
          size={5}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mt:4
          }}
        >
          <CodeBar ProductInfo={ProductInfo} setProductInfo={setProductInfo} />
          <DragDrop files={uploadedFiles} setFiles={setUploadedFiles} />
          <Button
            variant="contained"
            sx={{ width: "90%", height: "50px", mb: "20px" ,mt:2}}
            onClick={handleSubmit}
          >
            حفظ المعلومات
          </Button>
          <Button
            variant="contained"
            sx={{ width: "90%", height: "50px", bgcolor: "green" }}
          >
            إضافة سلعة
          </Button>
        </Grid>
      </Grid>
      {feedback.open && (
        <FeedbackCard
          message={feedback.message}
          severity={feedback.severity}
          onClose={() => {
            setFeedback({ ...feedback, open: false });
            if (feedback.severity === "success") {
              setOpenAddProductDialog(false);
            }
          }}
        />
      )}
    </>
  );
}
