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
        setMagasins(response.data);
      } catch (error) {
        console.error("Error fetching magasins:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMagasins();
  }, []);

  // const calculatePrices = (prix_achat, taux) => {
  //   const prix = prix_achat * (1 + taux / 100);
  //   return Math.round(prix / 100) * 100; // ✅ multiple de 100
  // };
const calculatePrices = (prix_achat, taux) => {
  const prix = prix_achat * (1 + taux / 100);
  const reste = prix % 1000;

  if (reste < 500) {
    // Descendre au millier inférieur
    return Math.floor(prix / 1000) * 1000;
  } else {
    // Arrondir au millier le plus proche
    return Math.round(prix / 1000) * 1000;
  }
};

  const handleBenefitRateChange = (e) => {
    const { name, value } = e.target;

    // Don't parse to float immediately - keep as string until stored in state
    setProductInfo((prev) => {
      const updatedInfo = {
        ...prev,
        [name]: value, // Store as string first
      };

      // Convert to numbers for calculation
      const prixAchatNum = parseFloat(prev.prix_achat) || 0;
      const currentValueNum = parseFloat(value) || 0;

      if (name === "prix_achat" || name.startsWith("taux_benefice")) {
        // Recalculate all prices when purchase price changes
        if (name === "prix_achat") {
          updatedInfo.prix_vente_cache = calculatePrices(
            currentValueNum,
            parseFloat(prev.taux_benefice_cache) || 0
          );
          updatedInfo.prix_vente_3 = calculatePrices(
            currentValueNum,
            parseFloat(prev.taux_benefice_3) || 0
          );
          updatedInfo.prix_vente_5 = calculatePrices(
            currentValueNum,
            parseFloat(prev.taux_benefice_5) || 0
          );
          updatedInfo.prix_vente_8 = calculatePrices(
            currentValueNum,
            parseFloat(prev.taux_benefice_8) || 0
          );
          updatedInfo.prix_vente_10 = calculatePrices(
            currentValueNum,
            parseFloat(prev.taux_benefice_10) || 0
          );
          updatedInfo.prix_vente_6 = calculatePrices(
            currentValueNum,
            parseFloat(prev.taux_benefice_6) || 0
          );
          updatedInfo.prix_vente_9 = calculatePrices(
            currentValueNum,
            parseFloat(prev.taux_benefice_9) || 0
          );
          updatedInfo.prix_vente_12 = calculatePrices(
            currentValueNum,
            parseFloat(prev.taux_benefice_12) || 0
          );
          updatedInfo.prix_vente_15 = calculatePrices(
            currentValueNum,
            parseFloat(prev.taux_benefice_15) || 0
          );
        }
        // Recalculate specific price when its rate changes
        else if (name === "taux_benefice_cache") {
          updatedInfo.prix_vente_cache = calculatePrices(
            prixAchatNum,
            currentValueNum
          );
        } else if (name === "taux_benefice_3") {
          updatedInfo.prix_vente_3 = calculatePrices(
            prixAchatNum,
            currentValueNum
          );
        } else if (name === "taux_benefice_5") {
          updatedInfo.prix_vente_5 = calculatePrices(
            prixAchatNum,
            currentValueNum
          );
        } else if (name === "taux_benefice_8") {
          updatedInfo.prix_vente_8 = calculatePrices(
            prixAchatNum,
            currentValueNum
          );
        } else if (name === "taux_benefice_10") {
          updatedInfo.prix_vente_10 = calculatePrices(
            prixAchatNum,
            currentValueNum
          );
        } else if (name === "taux_benefice_6") {
          updatedInfo.prix_vente_6 = calculatePrices(
            prixAchatNum,
            currentValueNum
          );
        } else if (name === "taux_benefice_9") {
          updatedInfo.prix_vente_9 = calculatePrices(
            prixAchatNum,
            currentValueNum
          );
        } else if (name === "taux_benefice_12") {
          updatedInfo.prix_vente_12 = calculatePrices(
            prixAchatNum,
            currentValueNum
          );
        } else if (name === "taux_benefice_15") {
          updatedInfo.prix_vente_15 = calculatePrices(
            prixAchatNum,
            currentValueNum
          );
        }
      }

      return updatedInfo;
    });
  };

  return (
    <>
      <Container maxWidth="md" sx={{ p: 4 }}>
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
              value={ProductInfo.prix_achat}
              onChange={handleBenefitRateChange}
            />
            <br />
            <TextField
              label="سعر البيع كاش"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
              value={ProductInfo.prix_vente_cache || ""}
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_cache"
              value={ProductInfo.taux_benefice_cache || ""}
              onChange={handleBenefitRateChange}
            />
            <br />
            <TextField
              label="سعر البيع 3"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
              value={ProductInfo.prix_vente_3 || ""}
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_3"
              value={ProductInfo.taux_benefice_3 || ""}
              onChange={handleBenefitRateChange}
            />
            <br />
            <TextField
              label="سعر البيع 5"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
              value={ProductInfo.prix_vente_5 || ""}
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_5"
              value={ProductInfo.taux_benefice_5 || ""}
              onChange={handleBenefitRateChange}
            />
            <br />
            <TextField
              label="سعر البيع 6"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
              value={ProductInfo.prix_vente_6 || ""}
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_6"
              value={ProductInfo.taux_benefice_6 || ""}
              onChange={handleBenefitRateChange}
            />
            <br />
            <TextField
              label="سعر البيع 8"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
              value={ProductInfo.prix_vente_8 || ""}
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_8"
              value={ProductInfo.taux_benefice_8 || ""}
              onChange={handleBenefitRateChange}
            />
            <br />
            <TextField
              label="سعر البيع 9"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
              value={ProductInfo.prix_vente_9 || ""}
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_9"
              value={ProductInfo.taux_benefice_9 || ""}
              onChange={handleBenefitRateChange}
            />
            <br />
            <TextField
              label="سعر البيع 10"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
              value={ProductInfo.prix_vente_10 || ""}
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_10"
              value={ProductInfo.taux_benefice_10 || ""}
              onChange={handleBenefitRateChange}
            />
            <TextField
              label="سعر البيع 12"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
              value={ProductInfo.prix_vente_12 || ""}
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_12"
              value={ProductInfo.taux_benefice_12 || ""}
              onChange={handleBenefitRateChange}
            />
            <br />
            <TextField
              label="سعر البيع 15"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "79%" }}
              value={ProductInfo.prix_vente_15 || ""}
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="الفائدة"
              id="outlined-size-small"
              size="small"
              className="Input-field"
              sx={{ width: "11.5%" }}
              name="taux_benefice_15"
              value={ProductInfo.taux_benefice_15 || ""}
              onChange={handleBenefitRateChange}
            />
            <br />
          </Card>
        </Box>
      </Container>
    </>
  );
}
