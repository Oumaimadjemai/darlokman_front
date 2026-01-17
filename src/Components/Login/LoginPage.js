import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

import { useNavigate } from "react-router-dom";
import axios from "../../api/axiosInstance";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [users, setUsers] = useState([]);
  const [errorInput, setErrorInput] = useState("");

  const navigate = useNavigate();

  // 🔹 Fetch users
 useEffect(() => {
  const fetchUsers = async () => {
    try {
      const response = await axios.get("auth/users/");
      // The actual array is in response.data.results
      setUsers(Array.isArray(response.data.results) ? response.data.results : []);
    } catch (error) {
      console.error("Failed to load users", error);
      setErrorInput("Failed to load users");
      setUsers([]);
    }
  };

  fetchUsers();
}, []);


  // 🔹 Login
  const handleLogin = async () => {
    try {
      const response = await axios.post("auth/token/", {
        username,
        password,
      });

      const { access, refresh, user } = response.data;

      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("username", user.username);
      localStorage.setItem("role", user.role);
      localStorage.setItem("features", JSON.stringify(user.features));
      localStorage.setItem("magasin_id",user.magasin);

      setPassword("");

      if (user.role === "admin") navigate("/admin");
      else if (user.role === "vendeur") navigate("/vendeur");
      else if (user.role === "magasinier") navigate("/magasinier");

    } catch (error) {
      console.error("Login failed", error);
      setErrorInput("Login failed: check username or password");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ marginTop: "0" }}>
      <Card sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography variant="h3" sx={{ mb: 3, color: "primary.main" }}>
          تسجيل الدخول
        </Typography>

        {/* Username Select */}
        <FormControl sx={{ width: "100%", mb: 2 }}>
          <InputLabel id="username-label">المستخدم</InputLabel>
          <Select
  labelId="username-label"
  value={username}
  label="المستخدم"
  onChange={(e) => setUsername(e.target.value)}
>
  <MenuItem value="" disabled>
    اختر اسم المستخدم
  </MenuItem>

  {users.map((user) => (
    <MenuItem key={user.id} value={user.username}>
      {user.username}
    </MenuItem>
  ))}
</Select>

        </FormControl>

        {/* Password */}
        <TextField
          fullWidth
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          sx={{ mb: 2 }}
        />

        {/* Error */}
        {errorInput && (
          <Typography color="error" sx={{ mb: 2 }}>
            {errorInput}
          </Typography>
        )}

        {/* Button */}
        <Button
          fullWidth
          variant="contained"
          sx={{ fontSize: "18px" }}
          onClick={handleLogin}
          disabled={!username || !password}
        >
          دخول
        </Button>
      </Card>
    </Container>
  );
}
