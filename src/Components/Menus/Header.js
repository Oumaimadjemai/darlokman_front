import { Box, Typography, Avatar, Stack } from "@mui/material";

export default function Header() {
  const userName = localStorage.getItem("username"); // You can replace this with props or context

  return (
    <Box sx={{  bgcolor: "transparent",display:"flex",justifyContent:"end" ,mr:3}}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="body1">
          مرحبا, <strong>{userName}</strong>
        </Typography>
      </Stack>
    </Box>
  );
}
