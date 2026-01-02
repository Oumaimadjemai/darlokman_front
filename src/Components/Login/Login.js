import Grid from "@mui/material/Grid";
import LoginPage from "./LoginPage";
import Container from "@mui/material/Container";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";

export default function Login() {
  return (
    <Box
      sx={{
        minHeight: "100vh", // full viewport height
        display: "flex",
        justifyContent: "center", // horizontal center
        alignItems: "center",     // vertical center
        bgcolor: "#f5f5f5",      // optional background color
      }}
    >
      
        <LoginPage />
     
    </Box>
  );
}
