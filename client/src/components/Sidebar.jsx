import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Tooltip,
  Toolbar,
  Paper,
  Popper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import SecurityIcon from "@mui/icons-material/Security";
import GlobalPermissions from "./GlobalPermissions";
import DashboardIcon from "@mui/icons-material/Dashboard";
import WorkIcon from "@mui/icons-material/Work";
import DescriptionIcon from "@mui/icons-material/Description";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

// Global Sidebar constants (Re-defining to fix ReferenceError)
const DRAWER_WIDTH = 240;
const MINI_WIDTH = 80;

export default function Sidebar({ collapsed, onToggle }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const { userRole, token } = useAuth();
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [globalPermissionsOpen, setGlobalPermissionsOpen] = useState(false);

  const isAdmin = userRole === "admin" || userRole === "superadmin";
  const isSuperadmin = userRole === "superadmin";
  // All authenticated users can access workflow — developer/reviewer access is controlled at the workflow level
  const isEngineer = true;

  useEffect(() => {
    if (!collapsed) {
      setAnchorEl(null);
    }
  }, [collapsed]);

  const handleWorkflowClick = (event) => {
    if (collapsed && !isMobile) {
      setAnchorEl(anchorEl ? null : event.currentTarget);
    } else {
      setWorkflowOpen((p) => !p);
    }
  };

  const handleNavItemClick = () => {
    if (isMobile) onToggle();
  };

  const popperOpen = Boolean(anchorEl);

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? !collapsed : true}
      onClose={isMobile ? onToggle : undefined}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: isMobile ? 0 : (collapsed ? MINI_WIDTH : DRAWER_WIDTH),
        flexShrink: 0,
        zIndex: 1,
        "& .MuiDrawer-paper": {
          width: isMobile ? DRAWER_WIDTH : (collapsed ? MINI_WIDTH : DRAWER_WIDTH),
          boxSizing: "border-box",
          backgroundColor: "#F8FAFC",
          borderRight: "1px solid #E5E7EB",
          transition: "width 0.25s ease",
          zIndex: (theme) => theme.zIndex.appBar + 1,
        },
      }}

    >
      <Toolbar />

      <List sx={{ px: 1 }}>
        {/* Dashboard */}
        <ListItemButton
          component={Link}
          to="/dashboard"
          selected={location.pathname === "/dashboard"}
          onClick={handleNavItemClick}
          sx={navItemStyles(collapsed && !isMobile)}
        >
          <Tooltip title="Dashboard" placement="right" disableHoverListener={!collapsed}>
            <ListItemIcon sx={iconStyles}>
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
          </Tooltip>
         {collapsed ? (
  <Typography fontSize={11} fontWeight={500}>
    Dashboard
  </Typography>
) : (
  <ListItemText primary="Dashboard" />
)}

        </ListItemButton>

        {/* Workflow Section (Unified) */}
        {(isAdmin || isEngineer) && (
          <>
            <ListItemButton onClick={handleWorkflowClick} sx={navItemStyles(collapsed && !isMobile)}>
              <Tooltip title="Workflow" placement="right" disableHoverListener={!collapsed}>
                <ListItemIcon sx={iconStyles}>
                  <WorkIcon fontSize="small" />
                </ListItemIcon>
              </Tooltip>
             {collapsed ? (
                <Typography fontSize={11} fontWeight={500}>
                    Workflow
                </Typography>
              ) : (
                <ListItemText primary="Workflow" />
              )}

              {!collapsed && (workflowOpen ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>

            {/* EXPANDED MODE */}
            {!collapsed || isMobile ? (
              <Collapse in={workflowOpen}>
                <List dense>
                  <SubItem to="/workflow" label="All Workflows" onClick={handleNavItemClick} />
                  {isAdmin && (
                    <SubItem to="/workflow/create" label="Create Workflow" onClick={handleNavItemClick} />
                  )}
                </List>
              </Collapse>
            ) : null}
          </>
        )}

         {/* Templates (Unified) */}
         {/* {(isAdmin || isEngineer) && (
           <ListItemButton
            component={Link}
            to="/templates"
            selected={location.pathname === "/templates"}
            sx={navItemStyles(collapsed)}
          >
            <Tooltip title="Templates" placement="right" disableHoverListener={!collapsed}>
              <ListItemIcon sx={iconStyles}>
                <ArticleIcon fontSize="small" />
              </ListItemIcon>
            </Tooltip>
           {collapsed ? (
              <Typography fontSize={11} fontWeight={500}>
                  Templates
              </Typography>
            ) : (
              <ListItemText primary="Templates" />
            )}
          </ListItemButton>
         )} */}

         {/* Fill Template */}
         {/* <ListItemButton
          component={Link}
          to="/templates/fill"
          selected={location.pathname === "/templates/fill"}
          sx={navItemStyles(collapsed)}
        >
          <Tooltip title="Fill Template" placement="right" disableHoverListener={!collapsed}>
            <ListItemIcon sx={iconStyles}>
              <PostAddIcon fontSize="small" />
            </ListItemIcon>
          </Tooltip>
         {collapsed ? (
  <Typography fontSize={11} fontWeight={500} lineHeight={1.2} align="center">
      Fill Template
  </Typography>
) : (
  <ListItemText primary="Fill Template" />
)}

        </ListItemButton> */}

        {/* COLLAPSED MODE POPOVER */}
        {(isAdmin || isEngineer) && !isMobile && (
          <Popper
            open={popperOpen}
            anchorEl={anchorEl}
            placement="right-start"
            modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
            sx={{ zIndex: 1300 }}
          >
            <Paper sx={popperStyles}>
              <SubItem icon={<DescriptionIcon />} to="/workflow" label="All Workflows" fontSize="12px" />
              {isAdmin && <SubItem icon={<DescriptionIcon />} to="/workflow/create" label="Create Workflow" fontSize="12px" />}
            </Paper>
          </Popper>
        )}

        {isSuperadmin && (
          <ListItemButton
            onClick={() => setGlobalPermissionsOpen(true)}
            sx={navItemStyles(collapsed && !isMobile)}
          >
            <Tooltip title="Global Permissions" placement="right" disableHoverListener={!collapsed}>
              <ListItemIcon sx={iconStyles}>
                <SecurityIcon fontSize="small" />
              </ListItemIcon>
            </Tooltip>
            {collapsed ? (
              <Typography fontSize={11} fontWeight={500} align="center">
                Global Perms
              </Typography>
            ) : (
              <ListItemText primary="Global Permissions" />
            )}
          </ListItemButton>
        )}
      </List>

      <GlobalPermissions
        open={globalPermissionsOpen}
        onClose={() => setGlobalPermissionsOpen(false)}
        token={token}
      />
    </Drawer>
  );
}
function SubItem({ to, label, icon, fontSize, onClick }) {
  return (
    <ListItemButton component={Link} to={to} sx={subItemStyles} onClick={onClick}>
      {icon && <ListItemIcon sx={{ minWidth: 32 }}>{icon}</ListItemIcon>}
      <ListItemText
        primary={label}
        primaryTypographyProps={{ fontSize }}
      />
    </ListItemButton>
  );
}

const navItemStyles = (collapsed) => ({
  height: collapsed ? 72 : 44,
  borderRadius: 1,
  mb: 0.75,
  px: 1,
  display: "flex",
  flexDirection: collapsed ? "column" : "row",
  alignItems: "center",
  justifyContent: "center",
  gap: collapsed ? 0.5 : 1,

  "&.Mui-selected": {
    backgroundColor: "action.selected",
    "& .MuiListItemIcon-root": {
      color: "primary.main",
    },
    "& .MuiListItemText-primary, & .MuiTypography-root": {
      color: "primary.main",
      fontWeight: 600,
    },
  },

  "&:hover": {
    backgroundColor: "action.hover",
  },
});

const iconStyles = {
  minWidth: "auto",
  color: "text.secondary", // gray by default, primary when selected (set in navItemStyles)
};

const subItemStyles = {
  px: 1.5,
  py: 0.5,
  borderRadius: 1,
  "&:hover": { backgroundColor: "action.hover" },
};

const popperStyles = {
  p: 1,
  borderRadius: 2,
  boxShadow:
    "0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -2px rgba(0,0,0,0.05)",
  minWidth: 180,
  
};
