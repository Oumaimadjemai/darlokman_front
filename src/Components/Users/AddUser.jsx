import {
  Box,
  Card,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

import { TextField } from "@mui/material";
import Button from "@mui/material/Button";
import { useState } from "react";
import axios from "../../api/axiosInstance";
import FeedbackCard from "../Cards/FeedbackCard";
import { useEffect } from "react";

export default function AddUser({ setOpenAddUSerDialog, fetchUser }) {
  const [UserInfos, setUserInfos] = useState({
    username: "",
    password: "",
    role: "admin",
    magasin: "", 
  });
  const [magasins, setMagasins] = useState([]);

  const [feedback, setFeedback] = useState({
    open: false,
    severity: "success", // or "error"
    message: "",
  });
  useEffect(() => {
  const fetchMagasins = async () => {
    try {
      const res = await axios.get("param/magasins/");
      setMagasins(res.data.results || res.data);
    } catch (error) {
      console.error("Erreur chargement magasins", error);
    }
  };

  fetchMagasins();
}, []);

  const handleAddClick = async () => {
  try {
    const access_token = localStorage.getItem("access_token");

    const payload = { ...UserInfos };

    // 🔐 si admin → ne pas envoyer magasin
    if (payload.role === "admin") {
      delete payload.magasin;
    }

    const response = await axios.post("auth/register/", payload, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    setFeedback({
      open: true,
      severity: "success",
      message: "✅ User enregistré avec succès",
    });

    fetchUser();
  } catch (error) {
    console.error("ajout failed", error);
    setFeedback({
      open: true,
      severity: "error",
      message:
        error.response?.data?.detail ||
        "❌ Une erreur est survenue.",
    });
  }
};


  return (
    <>
      <Container maxWidth="sm" sx={{ mb: 4 }}>
        <Box sx={{ minWidth: 275 }}>
          <Card
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h4"
              sx={{
                textAlign: "center",
                mt: 2,
                mb: 2,
                color: "primary.main",
              }}
            >
              معلومات المستخدم
            </Typography>
            <FormControl
              size="small"
              sx={{ width: "95%", mb: "10px", height: "55px" }}
            >
              <InputLabel id="demo-simple-select-label">الصلاحية</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                sx={{ height: "100%" }}
                value={UserInfos.role}
                onChange={(e) => {
                  setUserInfos({ ...UserInfos, role: e.target.value });
                }}
              >
                <MenuItem value={"admin"}>أدمين</MenuItem>
                <MenuItem value={"vendeur"}>بائع</MenuItem>
                 <MenuItem value={"magasinier"}>مخزني</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="إسم المستخدم"
              sx={{ width: "95%", mb: "10px" }}
              value={UserInfos.username}
              onChange={(e) => {
                setUserInfos({ ...UserInfos, username: e.target.value });
              }}
            />
            {UserInfos.role !== "admin" && (
  <FormControl
    size="small"
    sx={{ width: "95%", mb: "10px", height: "55px" }}
  >
    <InputLabel id="magasin-select-label">المحل</InputLabel>
    <Select
      labelId="magasin-select-label"
      value={UserInfos.magasin}
      label="المحل"
      sx={{ height: "100%" }}
      onChange={(e) =>
        setUserInfos({ ...UserInfos, magasin: e.target.value })
      }
    >
      {magasins.map((magasin) => (
        <MenuItem key={magasin.id} value={magasin.id}>
          {magasin.nom}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
)}


            <TextField
              label="كلمة السر"
              sx={{ width: "95%", mb: "10px" }}
              value={UserInfos.password}
              onChange={(e) => {
                setUserInfos({ ...UserInfos, password: e.target.value });
              }}
            />
            <Button
              variant="contained"
              sx={{ width: "150px", height: "50px", mb: 4, mt: 2 }}
              onClick={handleAddClick}
            >
              إضافة مستخدم
            </Button>
          </Card>
        </Box>
      </Container>
      {feedback.open && (
        <FeedbackCard
          message={feedback.message}
          severity={feedback.severity}
          onClose={() => {
            setFeedback({ ...feedback, open: false });
            if (feedback.severity === "success") {
              setOpenAddUSerDialog(false);
            }
          }}
        />
      )}
    </>
  );
}
