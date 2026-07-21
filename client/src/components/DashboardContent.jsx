import { Grid } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory2";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import StatCard from "./StatCard";

export default function DashboardContent() {
  return (
    <Grid container spacing={3} p={3}>
      <Grid item xs={12} md={4}>
        <StatCard
          label="Total Assets"
          value="1,284"
          icon={<InventoryIcon />}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <StatCard
          label="Pending Tasks"
          value="12"
          color="error.main"
          icon={<AssignmentLateIcon color="error" />}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <StatCard
          label="Completed Workflows"
          value="89%"
          color="success.main"
          icon={<CheckCircleIcon color="success" />}
        />
      </Grid>
    </Grid>
  );
}
