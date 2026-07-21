import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  InputBase,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import LanguageIcon from "@mui/icons-material/Language";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LogoImage from "../assets/Logo.jpeg";
import { useAuth } from "../context/AuthContext";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useNavigate } from "react-router-dom";

export default function Header({ collapsed, onToggle }) {
  const { userRole, region, regions, userData, logout, updateRegion } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  const getRoleDisplay = () => {
    if (userRole === "superadmin") return "SUPER ADMIN";
    if (userRole === "admin") return "ADMIN";
    return null; // No badge for other users
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="inherit"
      sx={{ zIndex: 10, borderBottom: "1px solid #E2E8F0" }}
    >
      <Toolbar sx={{ justifyContent: "space-between", px: isMobile ? 1 : 2 }}>
        {isMobile && showMobileSearch ? (
          /* MOBILE SEARCH VIEW */
          <Box display="flex" alignItems="center" width="100%" gap={1}>
            <IconButton size="small" onClick={() => setShowMobileSearch(false)}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                bgcolor: (theme) => alpha(theme.palette.common.black, 0.04),
                borderRadius: "8px",
                px: 1.5,
                py: 0.5,
              }}
            >
              <SearchIcon sx={{ color: "text.secondary", mr: 1, fontSize: 18 }} />
              <InputBase
                autoFocus
                placeholder="Search assets..."
                fullWidth
                sx={{ fontSize: 13 }}
              />
            </Box>
          </Box>
        ) : (
          /* STANDARD VIEW */
          <>
            {/* LEFT */}
            <Box display="flex" alignItems="center" gap={isMobile ? 0.5 : 1}>
              <IconButton size="small" onClick={onToggle}>
                <MenuIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>

              <img src={LogoImage} alt="Logo" height={isMobile ? 24 : 32} />

              <Typography fontWeight={700} fontSize={16} sx={{ display: { xs: "none", md: "block" }, letterSpacing: "-0.01em" }}>
                Asset Flow
              </Typography>
            </Box>

            {/* CENTER - GLOBAL SEARCH (Hidden on mobile) */}
            {!isMobile && (
              <Box
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  justifyContent: "center",
                  px: 2,
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    borderRadius: "8px",
                    bgcolor: (theme) => alpha(theme.palette.common.black, 0.04),
                    "&:hover": {
                      bgcolor: (theme) => alpha(theme.palette.common.black, 0.07),
                    },
                    width: "100%",
                    maxWidth: 400,
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 0.5,
                    transition: "all 0.2s ease",
                  }}
                >
                  <SearchIcon sx={{ color: "text.secondary", mr: 1.5, fontSize: 18 }} />
                  <InputBase
                    placeholder="Search assets..."
                    fullWidth
                    sx={{ 
                      fontSize: 13,
                      "& input::placeholder": {
                        opacity: 0.7,
                      }
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* RIGHT */}
            <Box display="flex" alignItems="center" gap={isMobile ? 1 : 2}>
              {/* Mobile Search Toggle */}
              {isMobile && (
                <IconButton size="small" onClick={() => setShowMobileSearch(true)}>
                  <SearchIcon fontSize="small" />
                </IconButton>
              )}

              {/* Region Selector */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1 }}>
                <LanguageIcon sx={{ color: 'text.secondary', fontSize: isMobile ? 16 : 20 }} />
                <Select
                  value={region || ""}
                  onChange={(e) => updateRegion(e.target.value)}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 28,
                    fontSize: 11,
                    fontWeight: 700,
                    minWidth: isMobile ? 60 : 100,
                    bgcolor: (theme) => alpha(theme.palette.common.black, 0.04),
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  }}
                >
                  {regions.map((r) => (
                    <MenuItem key={r.id} value={r.id} sx={{ fontSize: 12, fontWeight: 600 }}>
                      {r.name}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              <Box textAlign="right" display={{ xs: "none", lg: "block" }}>
                <Typography fontSize={11} fontWeight={700} sx={{ lineHeight: 1.2 }}>
                  {userData?.name || "User"}
                </Typography>
                {getRoleDisplay() && (
                  <Typography fontSize={10} color="text.secondary" fontWeight={500}>
                    {getRoleDisplay()}
                  </Typography>
                )}
              </Box>

              <Avatar 
                src={userData?.avatar}
                sx={{ 
                  width: isMobile ? 28 : 32, 
                  height: isMobile ? 28 : 32,
                  fontSize: 14,
                  fontWeight: 700,
                  bgcolor:
                    userRole === "superadmin" ? "#6366F1" :
                    userRole === "admin" ? "primary.main" :
                    "success.main"
                }}
              >
                {!userData?.avatar && (
                  userRole === "superadmin" ? "SA" :
                  userRole === "admin" ? "A" :
                  (userData?.name?.[0]?.toUpperCase() || "U")
                )}
              </Avatar>

              <Tooltip title="Logout">
                <IconButton onClick={handleLogout} sx={{ color: "error.main" }} size="small">
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
