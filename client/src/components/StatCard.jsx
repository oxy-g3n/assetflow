import { Card, CardContent, Typography, Box } from "@mui/material";

export default function StatCard({ label, value, icon, color }) {
  return (
    <Card>
      <CardContent sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={700} color={color}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            bgcolor: "action.hover",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
      </CardContent>
    </Card>
  );
}
