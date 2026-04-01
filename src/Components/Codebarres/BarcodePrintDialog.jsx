

import { useEffect, useState } from "react";
import { Dialog, Box, Button, Stack } from "@mui/material";
import JsBarcode from "jsbarcode";
import axios from "../../api/axiosInstance"

export default function BarcodePrintDialog({ selectedProduit, onClose, refreshProduits }) {
  const [svgMarkup, setSvgMarkup] = useState("");

  useEffect(() => {
    if (selectedProduit) {
      const svg = document.createElement("svg");
      const code = selectedProduit.codebarre?.toString() || "0000000000000";

      JsBarcode(svg, code, {
        format: "EAN13",
        lineColor: "#000",
        width: 2,
        height: 60,
        displayValue: false, // Masquer le code sous le code-barres
        margin: 0,
      });

      const finalMarkup = `
  <div class="ticket">
    <div class="title">Dar Lokman</div>
    <div class="name">${selectedProduit.nom}</div>
    <div>${svg.outerHTML}</div>
    <div class="code">${code}</div>
  </div>
`;

      setSvgMarkup(finalMarkup);
    }
  }, [selectedProduit]);

  // ✅ Impression sur ticket
 // ✅ Impression sur ticket (20x40 mm)
const handleWebPrint = () => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
const printContent = `
<html>
  <head>
    <style>
      @page {
        size: 40mm 20mm landscape; /* 👈 Add landscape */
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        width: 40mm;
        height: 20mm;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .ticket {
        width: 38mm;
        height: 18mm;
        text-align: center;
        font-family: Arial, sans-serif;
        overflow: hidden;
      }
      .title {
        font-weight: bold;
        font-size: 8px;
        line-height: 1;
      }
      .name {
        font-size: 7px;
        line-height: 1;
      }
      svg {
        width: 36mm;
        height: 8mm;
      }
      .code {
        font-size: 8px;
        letter-spacing: 1px;
      }
    </style>
  </head>
  <body>${svgMarkup}</body>
</html>
`;


  iframe.contentDocument.write(printContent);
  iframe.contentDocument.close();
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 300);
};


  // ✅ Suppression du code-barre
  const handleDeleteBarcode = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const produit = selectedProduit;

      // Supprimer le code-barre sélectionné
      const updatedCodes =
        (produit.codes_barres || []).filter(
          (cb) => cb !== produit.codebarre
        ) || [];

      // Mettre à jour la quantité
      const updatedQuantite = Math.max(0, (produit.quantite || 0) - 1);

      // PATCH vers backend
      await axios.patch(
        `/prod/produits/${produit.id}/`,
        {
          codes_barres: updatedCodes,
          quantite: updatedQuantite,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 🔁 Actualiser la liste dans le tableau
      if (refreshProduits) await refreshProduits();

      // Fermer le dialogue
      onClose();
    } catch (error) {
      console.error("Erreur lors de la suppression du code-barre :", error);
      alert("Une erreur est survenue lors de la suppression du code-barre.");
    }
  };

  if (!selectedProduit) return null;

  return (
    <Dialog open={!!selectedProduit} onClose={onClose}>
      <Box sx={{ p: 2, width: 230 }}>
        <Box dangerouslySetInnerHTML={{ __html: svgMarkup }} sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" fullWidth onClick={handleWebPrint}>
            Imprimer
          </Button>
          <Button
            variant="contained"
            fullWidth
            color="error"
            onClick={handleDeleteBarcode}
          >
            Supprimer
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}

