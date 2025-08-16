import React, { useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  ImageList,
  ImageListItem,
  useTheme,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function DragDrop({ files, setFiles }) {
  // const [files, setFiles] = useState([]);
  const fileInputRef = useRef();
  const theme = useTheme();

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleFileClick = () => fileInputRef.current.click();

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ width: "90%", mx: "auto", mt: 4 }}>
      {/* Upload Box */}
      <Paper
        elevation={3}
        onClick={handleFileClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        sx={{
          border: `2px dashed ${theme.palette.primary.main}`,
          borderRadius: 2,
          padding: 2,
          textAlign: "center",
          bgcolor: theme.palette.primary.light,
          color: theme.palette.primary.contrastText,
          cursor: "pointer",
          "&:hover": {
            bgcolor: theme.palette.primary.main,
            color: "#fff",
          },
        }}
      >
        <Typography variant="body1">
          🖱 اسحب الملفات أو انقر لاختيارها
        </Typography>
        <input
          type="file"
          multiple
          hidden
          ref={fileInputRef}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </Paper>

      {/* Preview List */}
      <Box mt={2}>
        <ImageList cols={2} gap={8}>
          {files.map((file, index) => {
            const isImage = file.type.startsWith("image/");
            const fileURL = URL.createObjectURL(file);
            return (
              <Box key={index} position="relative">
                {isImage ? (
                  // <ImageListItem>
                  //   <img
                  //     src={fileURL}
                  //     alt={file.name}
                  //     style={{
                  //       width: "100%",
                  //       height: "100%",
                  //       borderRadius: "8px",
                  //       objectFit: "cover",
                  //     }}
                  //   />
                  // </ImageListItem>
                  <ImageListItem sx={{ width: 120, height: 120 }}>
                    <img
                      src={fileURL}
                      alt={file.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "8px",
                        objectFit: "contain", // 🔹 Prevents huge stretch
                        backgroundColor: "#f0f0f0", // optional background for transparency
                      }}
                    />
                  </ImageListItem>
                ) : (
                  <Paper
                    sx={{
                      padding: 1,
                      borderRadius: 1,
                      textAlign: "center",
                      fontSize: "12px",
                      bgcolor: theme.palette.grey[100],
                      cursor: "pointer",
                    }}
                    onClick={() => window.open(fileURL, "_blank")}
                  >
                    {file.name}
                  </Paper>
                )}
                <IconButton
                  onClick={() => removeFile(index)}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bgcolor: "rgba(255,255,255,0.8)",
                    color: theme.palette.error.main,
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,1)",
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            );
          })}
        </ImageList>
      </Box>
    </Box>
  );
}
