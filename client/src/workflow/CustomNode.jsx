import { Handle, Position } from "reactflow";
import SettingsIcon from '@mui/icons-material/Settings';
import { Box, Paper, Typography, Chip, Divider, Avatar, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";
import LockIcon from "@mui/icons-material/Lock";
import RuleIcon from "@mui/icons-material/Rule";
import TableChartIcon from "@mui/icons-material/TableChart";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import BrushIcon from "@mui/icons-material/Brush";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CachedIcon from "@mui/icons-material/Cached";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

export default function CustomNode({ data }) {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const isValid = data.validation;
  const isDisabled = data.disabled;
  const isActive = data.isActive;
  const status = data.status || 'pending'; // 'pending', 'completed', 'failed'

  const getStatusColors = () => {
    switch (status) {
      case 'completed': return {
        border: "#10B981", // Emerald 500
        header: "#F0FDF4", // Emerald 50
        icon: "#10B981",
        chipBg: "#DCFCE7", // Emerald 100
        chipText: "#15803D"  // Emerald 700
      };
      case 'failed': return {
        border: "#EF4444",
        header: "#FEF2F2",
        icon: "#EF4444",
        chipBg: "#FEE2E2",
        chipText: "#B91C1C"
      };
      default: return {
        border: "#CBD5E1",
        header: "#F8FAFC",
        icon: "#94A3B8",
        chipBg: "#F1F5F9",
        chipText: "#475569"
      };
    }
  };

  const colors = getStatusColors();

  const getSubstageIcon = (type) => {
    switch (type) {
      case 'automated': return <AutoFixHighIcon sx={{ fontSize: 16 }} />;
      case 'logic': return <BrushIcon sx={{ fontSize: 16 }} />;
      case 'ai': return <AutoAwesomeIcon sx={{ fontSize: 16 }} />;
      case 'manual': return <PersonIcon sx={{ fontSize: 16 }} />;
      default: return <RuleIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircleIcon sx={{ fontSize: 16, color: "#10B981" }} />;
    if (status === 'failed') return <CancelIcon sx={{ fontSize: 16, color: "#EF4444" }} />;
    if (status === 'processing') return (
      <CachedIcon sx={{ 
        fontSize: 16, 
        color: "primary.main",
        animation: "spin 2s linear infinite",
        "@keyframes spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        }
      }} />
    );
    return <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: "#94A3B8" }} />;
  };

  return (
    <Paper
      elevation={isActive ? 12 : 4}
      sx={{
        width: 320,
        borderRadius: '12px',
        display: "flex",
        flexDirection: "column",
        border: "2px solid",
        borderColor: isActive ? "primary.main" : colors.border,
        bgcolor: "white",
        opacity: isDisabled ? 0.8 : 1,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "visible",
        position: "relative",
        "&:hover": {
          transform: isDisabled ? "none" : "translateY(-4px)",
          boxShadow: 20
        },
      }}
    >
      {/* Sequence Badge */}
      <Box
        sx={{
          position: "absolute",
          top: -14,
          left: -14,
          width: 32,
          height: 32,
          bgcolor: "#334155",
          color: "white",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          fontWeight: 900,
          border: "4px solid white",
          zIndex: 10,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}
      >
        {data.sequence || "00"}
      </Box>

      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ background: "#475569", width: 8, height: 8, left: -4 }} 
      />

      {/* Header */}
      <Box sx={{ p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: colors.header, borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }}>
        <Box display="flex" alignItems="center" gap={2}>
            <Box 
                sx={{ 
                    width: 52, 
                    height: 52, 
                    bgcolor: colors.icon, 
                    borderRadius: "12px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    color: "white",
                    boxShadow: `0 4px 10px ${colors.icon}40`
                }}
            >
                {status === 'completed' ? <CheckCircleIcon sx={{ fontSize: 24 }} /> : status === 'failed' ? <CancelIcon sx={{ fontSize: 24 }} /> : <RadioButtonUncheckedIcon sx={{ fontSize: 24 }} />}
            </Box>
            <Box>
                <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, color: "#1E293B" }}>
                    {data.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {data.description}
                </Typography>
            </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
            {(isActive || status !== 'pending') && (
                <Chip 
                  label={status.toUpperCase() === 'PENDING' ? 'IN PROGRESS' : status.toUpperCase()} 
                  size="small" 
                  sx={{ 
                    height: 24, 
                    fontSize: "10px", 
                    fontWeight: 900, 
                    bgcolor: colors.chipBg, 
                    color: colors.chipText,
                    letterSpacing: "0.05em"
                  }} 
                />
            )}
       
        </Box>
      </Box>

      <Divider sx={{ borderColor: "#F1F5F9" }} />

      {/* Main Content (Substages) */}
      <Box sx={{ px: 3, pt: 2, pb: 1, position: "relative" }}>
        {/* Vertical Stepper Line */}
        <Box 
          sx={{ 
            position: "absolute", 
            top: 40, 
            left: 31, 
            bottom: 40, 
            width: 2, 
            bgcolor: "#E2E8F0",
            zIndex: 1
          }} 
        />

        <Box display="flex" flexDirection="column" gap={2}>
            {data.substages?.map((sub, index) => (
                <Box 
                    key={sub.id} 
                    display="flex" 
                    alignItems="center" 
                    gap={2} 
                    sx={{ position: "relative", zIndex: 2 }}
                >
                    {/* Stepper Dot */}
                    <Box 
                        sx={{ 
                            width: 14, 
                            height: 14, 
                            borderRadius: "50%", 
                            bgcolor: sub.status === 'completed' ? "#10B981" : (sub.status === 'failed' ? "#EF4444" : (sub.status === 'processing' ? "#3B82F640" : "#E2E8F0")),
                            border: sub.status === 'processing' ? "2px solid #3B82F6" : (sub.status === 'failed' ? "2px solid #EF4444" : "2px solid white"),
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                        }} 
                    />
                    
                    {/* Substage Card */}
                    <Box 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (data.onSubstageClick) data.onSubstageClick(sub.id);
                        }}
                        sx={{ 
                            flex: 1, 
                            p: 1.5, 
                            borderRadius: "10px", 
                            bgcolor: "white", 
                            border: "1px solid",
                            borderColor: sub.status === 'processing' ? "#BFDBFE" : (sub.status === 'failed' ? "#FECACA" : "#F1F5F9"),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            boxShadow: sub.status === 'processing' ? "0 4px 12px rgba(59, 130, 246, 0.08)" : (sub.status === 'failed' ? "0 4px 12px rgba(239, 68, 68, 0.08)" : "0 2px 4px rgba(0,0,0,0.02)"),
                            transition: "all 0.2s ease",
                            cursor: data.onSubstageClick ? "pointer" : "default",
                            "&:hover": {
                              borderColor: sub.status !== 'pending' ? (sub.status === 'failed' ? "#EF4444" : "primary.main") : "#F1F5F9",
                              transform: sub.status !== 'pending' ? "scale(1.02)" : "none"
                            }
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Box sx={{ color: sub.status === 'completed' ? "#64748B" : (sub.status === 'processing' ? "#3B82F6" : "#CBD5E1") }}>
                                {getSubstageIcon(sub.type)}
                            </Box>
                            <Box>
                                <Typography variant="caption" fontWeight={800} sx={{ display: "block", color: "#334155", fontSize: "11px" }}>
                                    {sub.title}
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: "9px", color: sub.status === 'processing' ? "#3B82F6" : "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>
                                    {sub.subtitle}
                                </Typography>
                            </Box>
                        </Box>
                        <Box>
                            {getStatusIcon(sub.status)}
                        </Box>
                    </Box>
                </Box>
            ))}
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ px: 3, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', bgcolor: "#F8FAFC" }}>
        <Box display="flex" alignItems="center" gap={1}>
            {/* Removed ASSIGNED and M avatar */}
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
            {/* Settings Icon for Reconfigure/Reassign */}
            <IconButton 
                size="small" 
                onClick={(e) => {
                    e.stopPropagation();
                    if (data.onSettingsClick) data.onSettingsClick();
                }}
                sx={{ 
                    color: "#64748B",
                    "&:hover": { bgcolor: "#E2E8F0", color: "primary.main" }
                }}
            >
                <SettingsIcon sx={{ fontSize: 16 }} />
            </IconButton>
            
            <Box 
                sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                  
                    cursor: "pointer",
                    "&:hover": { opacity: 0.8 }
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    // Default details click logic
                }}
            >
                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "11px" }}>
                    Details
                </Typography>
                <ChevronRightIcon sx={{ fontSize: 16 }} />
            </Box>
        </Box>
      </Box>

      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ background: "#475569", width: 8, height: 8, right: -4 }} 
      />
    </Paper>
  );
}
