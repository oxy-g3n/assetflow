import { Box } from "@mui/material";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardContent from "../components/DashboardContent";

export default function Dashboard() {
  return (
    <Box display="flex">
       <DashboardContent />   
    </Box>
  );
}
