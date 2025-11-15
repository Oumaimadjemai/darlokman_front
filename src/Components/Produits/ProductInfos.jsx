import { Box, Card, Container, Typography } from "@mui/material";
import { TextField } from "@mui/material";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { useState, useEffect } from "react";
import axios from "../../api/axiosInstance";

export default function ProductInfos({ ProductInfo, setProductInfo }) {
  const [magasins, setMagasins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMagasins = async () => {
      try {
        const access_token = localStorage.getItem("access_token");
        const response = await axios.get("/param/magasins/", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });
        setMagasins(response.data.results);
      } catch (error) {
        console.error("Error fetching magasins:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMagasins();
  }, []);

  const calculatePrices = (prix_achat, taux) => {
    const prix = prix_achat * (1 + taux / 100);
    return prix// ✅ multiple de 100
  };

// const handlePriceOrRateChange = (e) => {
//   const { name, value } = e.target;

//   setProductInfo((prev) => {
//     const updatedInfo = { ...prev };

//     // Convert safely to number or 0
//     const inputValue = parseFloat(value);
//     const isEmpty = value === "" || isNaN(inputValue);
//     const safeValue = isEmpty ? 0 : inputValue;

//     updatedInfo[name] = safeValue;

//     const prixAchat = parseFloat(updatedInfo.prix_achat) || 0;

//     // 🟢 Case 1: prix_achat changed → recalc all prix_vente_*
//     if (name === "prix_achat") {
//       const tauxFields = ["cache", "3", "5", "6", "8", "9", "10", "12", "15"];
//       tauxFields.forEach((key) => {
//         const taux = parseFloat(updatedInfo[`taux_benefice_${key}`]) || 0;
//         updatedInfo[`prix_vente_${key}`] = prixAchat > 0
//           ? calculatePrices(prixAchat, taux)
//           : 0;
//       });
//     }

//     // 🟢 Case 2: taux_benefice_* changed → recalc prix_vente_*
//     else if (name.startsWith("taux_benefice_")) {
//       const key = name.replace("taux_benefice_", "");
//       updatedInfo[`prix_vente_${key}`] = prixAchat > 0
//         ? calculatePrices(prixAchat, safeValue)
//         : 0;
//     }

//     // 🟢 Case 3: prix_vente_* changed → recalc taux_benefice_*
//     else if (name.startsWith("prix_vente_")) {
//       const key = name.replace("prix_vente_", "");
//       if (prixAchat > 0 && !isEmpty) {
//         const taux = ((safeValue - prixAchat) / prixAchat) * 100;
//         updatedInfo[`taux_benefice_${key}`] = taux < 0 ? 0 : taux.toFixed(2);
//       } else {
//         updatedInfo[`taux_benefice_${key}`] = 0;
//       }
//     }

//     return updatedInfo;
//   });
// };

const handlePriceOrRateChange = (e) => {
  const { name, value } = e.target;

  setProductInfo((prev) => {
    const updatedInfo = { ...prev };

    // Convert input to integer
    const inputValue = parseInt(value.replace(/\D/g, ""), 10); // remove any non-digit characters
    const safeValue = isNaN(inputValue) ? 0 : inputValue;

    updatedInfo[name] = safeValue;

    const prixAchat = parseInt(updatedInfo.prix_achat, 10) || 0;

    // Case 1: prix_achat changed → recalc all prix_vente_*
    if (name === "prix_achat") {
      const tauxFields = ["cache", "3", "5", "6", "8", "9", "10", "12", "15"];
      tauxFields.forEach((key) => {
        const taux = parseInt(updatedInfo[`taux_benefice_${key}`], 10) || 0;
        updatedInfo[`prix_vente_${key}`] = prixAchat > 0
          ? Math.round(prixAchat * (1 + taux / 100))
          : 0;
      });
    }

    // Case 2: taux_benefice_* changed → recalc prix_vente_*
    else if (name.startsWith("taux_benefice_")) {
      const key = name.replace("taux_benefice_", "");
      updatedInfo[`prix_vente_${key}`] = prixAchat > 0
        ? Math.round(prixAchat * safeValue / 100 + prixAchat)
        : 0;
    }

    // Case 3: prix_vente_* changed → recalc taux_benefice_*
    else if (name.startsWith("prix_vente_")) {
      const key = name.replace("prix_vente_", "");
      if (prixAchat > 0 && safeValue > 0) {
        const taux = ((safeValue - prixAchat) / prixAchat) * 100;
        updatedInfo[`taux_benefice_${key}`] = Math.round(taux);
      } else {
        updatedInfo[`taux_benefice_${key}`] = 0;
      }
    }

    return updatedInfo;
  });
};

  return (
    <>
      <Container maxWidth="sm" sx={{ p: 4 }}>
        <Box sx={{ minWidth: 275 }}>
          <Card>
            <Typography
              variant="h4"
              sx={{
                textAlign: "center",
                mt: 2,
                mb: 2,
                color: "primary.main",
              }}
            >
              معلومات السلعة
            </Typography>
            <TextField
              label="المرجع"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "95%" }}
              value={ProductInfo.reference}
              onChange={(e) =>
                setProductInfo((prev) => ({
                  ...prev,
                  reference: e.target.value,
                }))
              }
            />
            <br />
            <TextField
              label="إسم المنتوج"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "95%" }}
              value={ProductInfo.nom}
              onChange={(e) =>
                setProductInfo((prev) => ({
                  ...prev,
                  nom: e.target.value,
                }))
              }
            />
            <br />
            <TextField
              label="العائلة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "95%" }}
              value={ProductInfo.famille}
              onChange={(e) =>
                setProductInfo((prev) => ({
                  ...prev,
                  famille: e.target.value,
                }))
              }
            />
            <br />
            <FormControl
              size="small"
              className="Input-field"
              sx={{ width: "95%" }}
            >
              <InputLabel id="demo-simple-select-label">المحل</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                label="Age"
                value={ProductInfo.magasin}
                onChange={(e) =>
                  setProductInfo((prev) => ({
                    ...prev,
                    magasin: e.target.value,
                  }))
                }
                disabled={loading}
              >
                {loading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  magasins.map((magasin) => (
                    <MenuItem key={magasin.id} value={magasin.id}>
                      {magasin.nom}{" "}
                      {/* Assuming the API returns objects with 'id' and 'nom' */}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <br />
            <TextField
              label="العلامة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "95%" }}
              value={ProductInfo.marque}
              onChange={(e) =>
                setProductInfo((prev) => ({
                  ...prev,
                  marque: e.target.value,
                }))
              }
            />
            <hr />
            <TextField
              label="سعر الشراء"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "95%" }}
              name="prix_achat"
              value={ProductInfo.prix_achat || ""}
              onChange={handlePriceOrRateChange}
            />
            <br />
            <TextField
              label="سعر البيع كاش"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
               name="prix_vente_cache"
              value={ProductInfo.prix_vente_cache || ""}
              onChange={handlePriceOrRateChange}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_cache"
              value={ProductInfo.taux_benefice_cache || ""}
              onChange={handlePriceOrRateChange}
            />
            <br />
            <TextField
              label="سعر البيع 3"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              name="prix_vente_3"  
              sx={{ width: "79%" }}
              value={ProductInfo.prix_vente_3 || ""}
              onChange={handlePriceOrRateChange}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_3"
              value={ProductInfo.taux_benefice_3 || ""}
              onChange={handlePriceOrRateChange}
            />
            <br />
            <TextField
              label="سعر البيع 5"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
              name="prix_vente_5"  
              value={ProductInfo.prix_vente_5 || ""}
              onChange={handlePriceOrRateChange}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_5"
              value={ProductInfo.taux_benefice_5 || ""}
             onChange={handlePriceOrRateChange}
            />
            <br />
            <TextField
              label="سعر البيع 6"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
              name="prix_vente_6"  
              value={ProductInfo.prix_vente_6 || ""}
              onChange={handlePriceOrRateChange}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_6"
              value={ProductInfo.taux_benefice_6 || ""}
              onChange={handlePriceOrRateChange}
            />
            <br />
            <TextField
              label="سعر البيع 8"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
              name="prix_vente_8"  
              value={ProductInfo.prix_vente_8 || ""}
              onChange={handlePriceOrRateChange}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_8"
              value={ProductInfo.taux_benefice_8 || ""}
              onChange={handlePriceOrRateChange}
            />
            <br />
            <TextField
              label="سعر البيع 9"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
              name="prix_vente_9"  
              value={ProductInfo.prix_vente_9 || ""}
              onChange={handlePriceOrRateChange}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_9"
              value={ProductInfo.taux_benefice_9 || ""}
              onChange={handlePriceOrRateChange}
            />
            <br />
            <TextField
              label="سعر البيع 10"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
              name="prix_vente_10"  
              value={ProductInfo.prix_vente_10 || ""}
              onChange={handlePriceOrRateChange}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_10"
              value={ProductInfo.taux_benefice_10 || ""}
              onChange={handlePriceOrRateChange}
            />
            <TextField
              label="سعر البيع 12"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
              name="prix_vente_12"  
              value={ProductInfo.prix_vente_12 || ""}
              onChange={handlePriceOrRateChange}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_12"
              value={ProductInfo.taux_benefice_12 || ""}
              onChange={handlePriceOrRateChange}
            />
            <br />
            <TextField
              label="سعر البيع 15"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
              name="prix_vente_15"  
              value={ProductInfo.prix_vente_15 || ""}
             onChange={handlePriceOrRateChange}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_15"
              value={ProductInfo.taux_benefice_15 || ""}
              onChange={handlePriceOrRateChange}
            />
            <br />
          </Card>
        </Box>
      </Container>
    </>
  );
}
