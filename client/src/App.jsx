import { ThemeProvider, CssBaseline, Box, useMediaQuery, useTheme, Toolbar } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { theme } from "./theme/theme";
import { AuthProvider } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import SignIn from "./pages/SignIn";
import WorkflowCanvas from "./workflow/WorkflowCanvas";
import WorkflowList from "./workflow/WorkflowList";
import WorkflowCreate from "./workflow/WorkflowCreate";
import WorkflowEdit from "./workflow/WorkflowEdit";
import { useAuth } from "./context/AuthContext";
import { isWorkflowManager } from "./workflow/workflowApi";

import TemplateList from "./templates/TemplateList";
import TemplateFill from "./templates/TemplateFill";
import ReviewScreen from "./pages/ReviewScreen";
import DataCreate from "./pages/DataTemplates";
import DataLibraries from "./pages/DataLibraries";

function AppContent() {
  const { userRole } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(window.innerWidth < 600);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  // Pages that occupy full height/width without padding (Canvases)
  const canvasPaths = ["/data/create", "/workflow/create", "/workflow/edit", "/workflow/review", "/templates/fill", "/workflow/"];
  const isCanvas = canvasPaths.some(path => location.pathname.startsWith(path));

  // Pages that don't need layout
  const noLayoutPaths = ["/signin", "/signup"];
  const isNoLayout = noLayoutPaths.includes(location.pathname);

  // Pages that should hide the sidebar but keep the header
  const isNoSidebar = location.pathname.startsWith("/data/create");
  const canManageWorkflows = isWorkflowManager(userRole);

  if (isNoLayout) {
    return (
      <Box height="100vh">
        <Routes>
          <Route path="/signin" element={<SignIn />} />
        </Routes>
      </Box>
    );
  }

  return (
    <Box height="100vh" display="flex" flexDirection="column">
      {/* HEADER */}
      <Header
        collapsed={collapsed}
        onToggle={() => setCollapsed(prev => !prev)}
      />
  
      {/* BODY */}
      <Box display="flex" flexGrow={1} position="relative" sx={{ overflow: "hidden" }}>
        {/* SIDEBAR */}
        {!isNoSidebar && (
          <Sidebar 
            collapsed={collapsed} 
            onToggle={() => setCollapsed(prev => !prev)} 
          />
        )}

        {/* MAIN CONTENT */}
        <Box
          flexGrow={1}
          p={isCanvas || isMobile ? 0 : 2}
          overflow={isCanvas ? "hidden" : "auto"}
          sx={{
            transition: "all 0.25s ease",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workflow" element={<WorkflowList />} />
            {canManageWorkflows && (
              <Route path="/workflow/create" element={<WorkflowCreate />} />
            )}
            {canManageWorkflows && (
                 <Route path="/workflow/edit/:id" element={<WorkflowEdit />} />
            )}
            <Route path="/workflow/:id" element={<Navigate to="/workflow" replace />} />
            <Route path="/templates" element={<TemplateList />} />
            <Route path="/templates/fill" element={<TemplateFill />} />
            <Route path="/workflow/review" element={<ReviewScreen />} />
            <Route path="/data" element={<DataLibraries />} />
            <Route path="/data/create" element={<DataCreate />} />
            <Route path="/data/create/:id" element={<DataCreate />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  const [mode, setMode] = useState("light");
  const muiTheme = useMemo(() => theme(mode), [mode]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
       
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
