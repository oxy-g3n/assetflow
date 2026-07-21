import { Box, Toolbar } from "@mui/material";
import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(true);

  const handleToggle = () => {
    setCollapsed(prev => !prev);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} />

      <Box sx={{ flexGrow: 1 }}>
        <Header collapsed={collapsed} onToggle={handleToggle} />
        <Toolbar /> {/* Spacer for sticky header */}
        <Box sx={{ p: 2 }}>{children}</Box>
      </Box>
    </Box>
  );
}
