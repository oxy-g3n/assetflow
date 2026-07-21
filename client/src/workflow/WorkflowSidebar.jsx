import React, { useState, useMemo } from "react";
import { createAgent, fetchAgents } from "./workflowApi";
import SecurityIcon from "@mui/icons-material/Security";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import CodeIcon from "@mui/icons-material/Code";
import RateReviewIcon from "@mui/icons-material/RateReview";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
  Avatar,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Autocomplete,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionIcon from "@mui/icons-material/Description";
import DataObjectIcon from "@mui/icons-material/DataObject";
import RuleIcon from "@mui/icons-material/Rule";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckIcon from "@mui/icons-material/Check";
import SettingsIcon from "@mui/icons-material/Settings";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import MapIcon from "@mui/icons-material/Map";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FormControlLabel from "@mui/material/FormControlLabel";

const SAMPLE_COLUMNS = [
  "Invoice Number",
  "Billing Date",
  "Net Amount",
  "Vendor Name",
  "GST/Tax ID",
  "Currency",
  "Due Date",
  "Purchase Order Ref",
  "Payment Terms",
  "Department",
];

const TEMPLATE_COLUMNS = [
  "Due Date",
  "Department",
];

const MOCK_REGIONS = [
  { id: "na", label: "North America" },
  { id: "eu", label: "Europe" },
  { id: "ap", label: "Asia Pacific" },
  { id: "me", label: "Middle East" },
];

const MOCK_LIBRARIES = [
    { id: "lib-1", label: "Product Catalog", region: "North America" },
    { id: "lib-2", label: "Component List v2", region: "Europe" },
    { id: "lib-3", label: "Master Asset List", region: "Asia Pacific" },
    { id: "lib-4", label: "Standard Catalog", region: "Europe" },
    { id: "upload", label: "+ Add New Collection..." }
];

const MOCK_TEMPLATES = [
    { id: "tpl-1", label: "Standard Invoice" },
    { id: "tpl-2", label: "Purchase Order Form" },
    { id: "tpl-3", label: "Compliance Document" },
    { id: "upload", label: "+ Add New Form..." }
];

const MOCK_DATA_MODELS = [
    { id: "dm-1", label: "Supply Chain Schema", region: "North America" },
    { id: "dm-2", label: "Financial Reporting model", region: "Europe" },
    { id: "dm-3", label: "Inventory Master", region: "Asia Pacific" },
];

export default function WorkflowSidebar({ 
  node, 
  workflowMeta, 
  onClose, 
  configMode = "global", 
  onAssignMember, 
  onAssignReviewer,
  onAssignAgent,
  onStageChange, 
  availableAssignees = [], 
  availableAgents = [],
  onSaveConfig,
  onAgentCreated,
  userRole = "",
  workflowOwner = null,
  onChangeOwner,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [activeStage, setActiveStage] = useState(node?.data?.stage || 1);

  // Sync active stage when node changes
  React.useEffect(() => {
    if (node?.data?.stage) {
      setActiveStage(node.data.stage);
    }
  }, [node]);

  // HOOKS MUST BE AT THE TOP LEVEL
  const [mappings, setMappings] = useState(
    TEMPLATE_COLUMNS.map(col => ({
      templateField: col,
      sourceField: "", // Changed to single string
      isRequired: false
    }))
  );
  const [selectedRegion, setSelectedRegion] = useState("na");
  const [regions, setRegions] = useState(MOCK_REGIONS);
  const [isAddingRegion, setIsAddingRegion] = useState(false);
  const [newRegionName, setNewRegionName] = useState("");
  
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showLibraryUpload, setShowLibraryUpload] = useState(false);
  const [showTemplateUpload, setShowTemplateUpload] = useState(false);
  
  const [libraryName, setLibraryName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [libraryFile, setLibraryFile] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);

  const [selectedDataModel, setSelectedDataModel] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [isAddingField, setIsAddingField] = useState(false);
  const [selectedNewField, setSelectedNewField] = useState(null); // Changed to object for Autocomplete

  const [isReassignEnabled, setIsReassignEnabled] = useState(false);
  const isWorkflowDraft = workflowMeta?.status?.toLowerCase() === "draft" || !workflowMeta?.status;
  const isNodeCompleted = !isWorkflowDraft && node?.data?.status?.toUpperCase() === "COMPLETED";
  const canReassign = configMode === "global" || !isNodeCompleted || isReassignEnabled;
  const isSuperAdmin = userRole === "superadmin";

  // Permissions panel state
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [ownerDraft, setOwnerDraft] = useState(workflowOwner?.id || null);


  const [reviewerSearch, setReviewerSearch] = useState("");
  const [agentSearch, setAgentSearch] = useState("");

  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentType, setNewAgentType] = useState("extractor");




  const selectedAssignees = useMemo(
    () => availableAssignees.filter((user) => (node?.data?.assignedUserIds || []).includes(user.id)),
    [availableAssignees, node?.data?.assignedUserIds]
  );

  const selectedReviewers = useMemo(
    () => availableAssignees.filter((user) => (node?.data?.reviewerIds || []).includes(user.id)),
    [availableAssignees, node?.data?.reviewerIds]
  );

  const assignedAgents = useMemo(
    () => availableAgents.filter((agent) => (node?.data?.agentIds || []).includes(agent.id)),
    [availableAgents, node?.data?.agentIds]
  );

  const handleAssigneeDropdownChange = (_, newSelectedUsers) => {
    const currentIds = new Set(node?.data?.assignedUserIds || []);
    const nextIds = new Set(newSelectedUsers.map((user) => user.id));

    availableAssignees.forEach((user) => {
      const wasSelected = currentIds.has(user.id);
      const isSelected = nextIds.has(user.id);
      if (wasSelected !== isSelected) {
        onAssignMember(user.id, isSelected);
      }
    });
  };

  const handleReviewerDropdownChange = (_, newSelectedUsers) => {
    const currentIds = new Set(node?.data?.reviewerIds || []);
    const nextIds = new Set(newSelectedUsers.map((user) => user.id));

    availableAssignees.forEach((user) => {
      const wasSelected = currentIds.has(user.id);
      const isSelected = nextIds.has(user.id);
      if (wasSelected !== isSelected) {
        onAssignReviewer(user.id, isSelected);
      }
    });
  };

  const handleCreateAgent = async () => {
    try {
        const token = localStorage.getItem("token");
        const newAgent = await createAgent({
            name: newAgentName,
            type: newAgentType,
            config: {}
        }, token);
        
        onAgentCreated?.(newAgent);
        setIsAgentDialogOpen(false);
        setNewAgentName("");
    } catch (error) {
        console.error("Error creating agent:", error);
        alert("Failed to create agent");
    }
  };

  const handleMappingChange = (templateField, field, newValue) => {
    setMappings(prev => prev.map(m => 
      m.templateField === templateField ? { ...m, [field]: newValue } : m
    ));
  };

  const handleAddField = () => {
    if (!selectedNewField) return;
    if (mappings.some(m => m.templateField.toLowerCase() === selectedNewField.toLowerCase())) {
        alert("Field already exists");
        return;
    }
    setMappings(prev => [...prev, {
        templateField: selectedNewField,
        sourceField: "",
        isRequired: false
    }]);
    setSelectedNewField(null);
    setIsAddingField(false);
  };

  const handleDeleteField = (fieldName) => {
    setMappings(prev => prev.filter(m => m.templateField !== fieldName));
  };

  const handleAddRegion = () => {
    if (!newRegionName.trim()) return;
    const newId = newRegionName.toLowerCase().replace(/\s+/g, '-');
    const newRegion = { id: newId, label: newRegionName };
    setRegions(prev => [...prev, newRegion]);
    setSelectedRegion(newId);
    setNewRegionName("");
    setIsAddingRegion(false);
  };

  const handleFileUpload = (event, setter) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      setter(file.name);
    } else {
      alert("Please upload only .csv files");
    }
  };

  const handleSave = async () => {
    try {
      await onSaveConfig?.({
        activeStage,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save stage changes:", error);
      alert(error.message || "Error saving changes.");
    }
  };

  // No guard needed, sidebar will handle state internally

  return (
    <Box
      width="100%"
      height="100%"
      bgcolor="white"
      display="flex"
      flexDirection="column"
    >
      <Box
        p={2.5}
        borderBottom="1px solid #E5E7EB"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bgcolor="#F8FAFC"
      >
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1" fontWeight={800} color="#1E293B">
              {configMode === "global" ? "Stage Configuration" : "Reassign Personnel"}
            </Typography>
            {workflowMeta?.template && (
              <Chip 
                label={workflowMeta.template === 'modelling' ? 'Data Modelling' : workflowMeta.template.toUpperCase()} 
                size="small" 
                sx={{ 
                  height: 18, 
                  fontSize: '0.5rem', 
                  fontWeight: 900, 
                  borderRadius: 1,
                  bgcolor: '#F1F5F9',
                  color: '#64748B',
                  border: '1px solid #E2E8F0'
                }} 
              />
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {configMode === "global" ? "Configure collection, form & rules" : `Assigned team for ${node?.data?.label || "this stage"}`}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ bgcolor: "white", border: "1px solid #E2E8F0" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Stage Selector - Only show in Global mode */}
      {configMode === "global" && (
        <Box px={2.5} py={2} borderBottom="1px solid #F1F5F9">
          <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ mb: 1.5, display: "block", letterSpacing: "0.05em" }}>
              SELECT STAGE TO CONFIGURE
          </Typography>
          <Box 
              sx={{ 
                  display: "flex", 
                  p: 0.5, 
                  bgcolor: "#F1F5F9", 
                  borderRadius: "10px",
                  gap: 0.5
              }}
          >
              <Box
                  onClick={() => onStageChange?.(1)}
                  sx={{
                      flex: 1,
                      py: 1,
                      textAlign: "center",
                      cursor: "pointer",
                      borderRadius: "8px",
                      bgcolor: activeStage === 1 ? "white" : "transparent",
                      color: activeStage === 1 ? "primary.main" : "#64748B",
                      fontWeight: activeStage === 1 ? 800 : 600,
                      fontSize: "0.75rem",
                      transition: "all 0.2s ease",
                      boxShadow: activeStage === 1 ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                  }}
              >
                  Stage 1
              </Box>
              <Box
                  onClick={() => onStageChange?.(2)}
                  sx={{
                      flex: 1,
                      py: 1,
                      textAlign: "center",
                      cursor: "pointer",
                      borderRadius: "8px",
                      bgcolor: activeStage === 2 ? "white" : "transparent",
                      color: activeStage === 2 ? "primary.main" : "#64748B",
                      fontWeight: activeStage === 2 ? 800 : 600,
                      fontSize: "0.75rem",
                      transition: "all 0.2s ease",
                      boxShadow: activeStage === 2 ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                  }}
              >
                  Stage 2
              </Box>
          </Box>
        </Box>
      )}

      <Box flexGrow={1} overflow="auto" p={3}>
        {/* Validation Mode Indicator (Contextual) */}
        <Box mb={4} p={2} bgcolor="#EFF6FF" borderRadius="12px" border="1px solid #DBEAFE">
            <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                <SettingsIcon sx={{ color: "primary.main", fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight={800} color="#1E3A8A">
                    Configuring Stage {activeStage}
                </Typography>
            </Box>
            <Typography variant="caption" color="#1E3A8A" sx={{ opacity: 0.8 }}>
                {activeStage === 1 ? "Managing Library & Validation Rules" : "Managing Template Review"}
            </Typography>
        </Box>

        {/* SETUP SECTION - Stage 1 (Data Modelling Selection) */}
        {activeStage === 1 && (
            <Box mb={4} display="flex" flexDirection="column" gap={3}>


                <Box>
                    <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.05em' }}>
                        DATA MODELLING
                    </Typography>
                    <Autocomplete
                        fullWidth
                        size="small"
                        options={MOCK_DATA_MODELS}
                        value={selectedDataModel}
                        getOptionLabel={(option) => `${option.label} (${option.region || 'Global'})`}
                        onChange={(e, newValue) => {
                            setSelectedDataModel(newValue);
                            // Auto-select corresponding library/template if applicable
                            if (newValue) {
                                const matchedLib = MOCK_LIBRARIES.find(l => l.label.includes(newValue.label.split(' ')[0]));
                                if (matchedLib) setSelectedLibrary(matchedLib);
                            }
                        }}
                        renderInput={(params) => <TextField {...params} label="Select Data Model" variant="outlined" />}
                        renderOption={(props, option) => (
                            <Box component="li" {...props} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 1 }}>
                                <Typography variant="body2" fontWeight={600}>
                                    {option.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Region: {option.region || 'Global'}
                                </Typography>
                            </Box>
                        )}
                        sx={{ mb: 2 }}
                    />
                </Box>

                {/* CREATE DATA STAGE SECTION - Appears when model is selected */}
                {selectedDataModel && (
                  <Box sx={{ border: "2px solid #3B82F620", p: 2, borderRadius: "12px", bgcolor: "#3B82F605" }}>
                     <Typography variant="caption" fontWeight={900} color="primary" sx={{ mb: 2, display: "block", letterSpacing: "0.08em" }}>
                        CREATE DATA STAGE
                    </Typography>

                    <Stack spacing={3}>
                      {/* Integrated Library Select */}
                      <Box>
                          <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ mb: 1, display: "block" }}>Library</Typography>
                          <Autocomplete
                              fullWidth
                              size="small"
                              options={MOCK_LIBRARIES}
                              value={selectedLibrary}
                              getOptionLabel={(option) => 
                                  option.id === 'upload' ? option.label : `${option.label} (${option.region || 'Global'})`
                              }
                              onChange={(e, newValue) => {
                                  setSelectedLibrary(newValue);
                                  if (newValue?.id === 'upload') {
                                      setShowLibraryUpload(true);
                                      setLibraryName("");
                                  } else {
                                      setShowLibraryUpload(false);
                                      if (newValue) setLibraryName(newValue.label);
                                  }
                              }}
                              renderInput={(params) => <TextField {...params} label="Library Source" variant="outlined" />}
                          />
                          {showLibraryUpload && (
                              <Box mt={2} display="flex" flexDirection="column" gap={2} sx={{ p: 2, bgcolor: "white", borderRadius: 2, border: "1px dashed #E2E8F0" }}>
                                  <TextField
                                      select
                                      label="Region"
                                      size="small"
                                      value={isAddingRegion ? "add-new" : selectedRegion}
                                      onChange={(e) => {
                                          if (e.target.value === "add-new") setIsAddingRegion(true);
                                          else { setSelectedRegion(e.target.value); setIsAddingRegion(false); }
                                      }}
                                  >
                                      {regions.map(r => <MenuItem key={r.id} value={r.id}>{r.label}</MenuItem>)}
                                      <Divider />
                                      <MenuItem value="add-new" sx={{ color: 'primary.main', fontWeight: 600 }}>+ Add New Region</MenuItem>
                                  </TextField>
                                  <TextField label="Library Name" size="small" fullWidth value={libraryName} onChange={(e) => setLibraryName(e.target.value)} />
                                  <Button component="label" variant="contained" size="small" startIcon={<CloudUploadIcon />} sx={{ textTransform: 'none' }}>
                                      {libraryFile || "Upload CSV"}
                                      <input type="file" hidden accept=".csv" onChange={(e) => handleFileUpload(e, setLibraryFile)} />
                                  </Button>
                              </Box>
                          )}
                      </Box>

                      {/* Integrated Template Select */}
                      <Box>
                          <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ mb: 1, display: "block" }}>Template</Typography>
                          <Autocomplete
                              fullWidth
                              size="small"
                              options={MOCK_TEMPLATES}
                              value={selectedTemplate}
                              onChange={(e, newValue) => {
                                  setSelectedTemplate(newValue);
                                  if (newValue?.id === 'upload') {
                                      setShowTemplateUpload(true);
                                      setTemplateName("");
                                  } else {
                                      setShowTemplateUpload(false);
                                      if (newValue) setTemplateName(newValue.label);
                                  }
                              }}
                              renderInput={(params) => <TextField {...params} label="Form Template" variant="outlined" />}
                          />
                          {showTemplateUpload && (
                              <Box mt={2} display="flex" flexDirection="column" gap={2} sx={{ p: 2, bgcolor: "white", borderRadius: 2, border: "1px dashed #E2E8F0" }}>
                                  <TextField label="Template Name" size="small" fullWidth value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                                  <Button component="label" variant="contained" size="small" startIcon={<CloudUploadIcon />} sx={{ textTransform: 'none' }}>
                                      {templateFile || "Upload CSV"}
                                      <input type="file" hidden accept=".csv" onChange={(e) => handleFileUpload(e, setTemplateFile)} />
                                  </Button>
                              </Box>
                          )}
                      </Box>
                    </Stack>
                  </Box>
                )}
            </Box>
        )}

        <Box mb={4}>
          <Box
            sx={{
              border: "1px solid #E2E8F0",
              borderRadius: "14px",
              overflow: "hidden",
              bgcolor: "#FFFFFF",
              boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.4,
                bgcolor: "#F8FAFC",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: "0.68rem", color: "#475569", letterSpacing: "0.08em" }}>
                  STAGE ASSIGNMENTS
                </Typography>
                <Typography sx={{ fontSize: "0.68rem", color: "#64748B", mt: 0.3 }}>
                  Define the owner, reviewers, and AI support assigned to this workflow stage.
                </Typography>
              </Box>
              {isNodeCompleted && (
                <Button
                  size="small"
                  variant={isReassignEnabled ? "contained" : "outlined"}
                  onClick={() => setIsReassignEnabled(!isReassignEnabled)}
                  sx={{
                    fontSize: "0.65rem",
                    px: 1.4,
                    py: 0.4,
                    minWidth: "auto",
                    textTransform: "none",
                    borderRadius: "999px",
                    fontWeight: 700,
                    boxShadow: isReassignEnabled ? "0 6px 18px rgba(37,99,235,0.18)" : "none",
                  }}
                >
                  {isReassignEnabled ? "Done Reassigning" : "Reassign Team"}
                </Button>
              )}
            </Box>

            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ p: 1.6, borderRadius: "12px", bgcolor: "#F8FBFF", border: "1px solid #DBEAFE" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1 }}>
                  <Box sx={{ width: 26, height: 26, borderRadius: "8px", bgcolor: "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284C7" }}>
                    <CodeIcon sx={{ fontSize: 14 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: "0.66rem", color: "#475569", letterSpacing: "0.08em" }}>
                      STAGE OWNERS
                    </Typography>
                    <Typography sx={{ fontSize: "0.66rem", color: "#64748B" }}>
                      People accountable for delivering work in this stage.
                    </Typography>
                  </Box>
                </Box>
                <Autocomplete
                multiple
                fullWidth
                size="small"
                options={availableAssignees}
                value={selectedAssignees}
                disableCloseOnSelect
                onChange={handleAssigneeDropdownChange}
                disabled={!canReassign}
                getOptionLabel={(option) => option.name || option.email || `User ${option.id}`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option, { selected }) => (
                    <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Checkbox size="small" checked={selected} sx={{ p: 0.5 }} />
                        <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: "primary.main" }}>
                            {option.avatar || (option.name ? option.name[0] : "?")}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Typography fontSize="0.82rem" fontWeight={600}>{option.name}</Typography>
                              {option.role && (
                                <Chip
                                  size="small"
                                  label={option.role === "developer" ? "Owner" : option.role === "admin" || option.role === "superadmin" ? "Admin" : option.role}
                                  sx={{ height: 18, fontSize: "0.58rem", fontWeight: 800, bgcolor: "#E0F2FE", color: "#0369A1", border: "1px solid #BAE6FD", "& .MuiChip-label": { px: 0.9 } }}
                                />
                              )}
                            </Box>
                            <Typography fontSize="0.68rem" color="text.secondary">{option.email || "No email"}</Typography>
                        </Box>
                    </Box>
                )}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <Chip
                            {...getTagProps({ index })}
                            key={option.id}
                            size="small"
                            label={option.name}
                            avatar={<Avatar sx={{ bgcolor: "primary.main", fontSize: "8px !important" }}>{option.name?.[0] || "?"}</Avatar>}
                            sx={{ fontWeight: 600 }}
                        />
                    ))
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Select owners"
                        placeholder="Choose workflow owners"
                        helperText="Owners are responsible for executing work on this stage."
                        FormHelperTextProps={{ sx: { fontSize: "0.62rem" } }}
                    />
                )}
                />
              </Box>

              <Box sx={{ p: 1.6, borderRadius: "12px", bgcolor: "#FFFBEB", border: "1px solid #FDE68A" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1 }}>
                  <Box sx={{ width: 26, height: 26, borderRadius: "8px", bgcolor: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", color: "#D97706" }}>
                    <RateReviewIcon sx={{ fontSize: 14 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: "0.66rem", color: "#475569", letterSpacing: "0.08em" }}>
                      REVIEWERS
                    </Typography>
                    <Typography sx={{ fontSize: "0.66rem", color: "#64748B" }}>
                      People authorized to validate and approve this stage.
                    </Typography>
                  </Box>
                </Box>
                <Autocomplete
                multiple
                fullWidth
                size="small"
                options={availableAssignees}
                value={selectedReviewers}
                disableCloseOnSelect
                onChange={handleReviewerDropdownChange}
                disabled={!canReassign}
                getOptionLabel={(option) => option.name || option.email || `User ${option.id}`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option, { selected }) => (
                    <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Checkbox size="small" checked={selected} sx={{ p: 0.5 }} />
                        <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: "warning.main" }}>
                            {option.avatar || (option.name ? option.name[0] : "?")}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Typography fontSize="0.82rem" fontWeight={600}>{option.name}</Typography>
                              {option.role && (
                                <Chip
                                  size="small"
                                  label={option.role === "reviewer" ? "Reviewer" : option.role === "admin" || option.role === "superadmin" ? "Admin" : option.role}
                                  sx={{ height: 18, fontSize: "0.58rem", fontWeight: 800, bgcolor: "#FEF3C7", color: "#B45309", border: "1px solid #FCD34D", "& .MuiChip-label": { px: 0.9 } }}
                                />
                              )}
                            </Box>
                            <Typography fontSize="0.68rem" color="text.secondary">{option.email || "No email"}</Typography>
                        </Box>
                    </Box>
                )}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <Chip
                            {...getTagProps({ index })}
                            key={option.id}
                            size="small"
                            label={option.name}
                            avatar={<Avatar sx={{ bgcolor: "warning.main", fontSize: "8px !important" }}>{option.name?.[0] || "?"}</Avatar>}
                            sx={{ fontWeight: 600 }}
                        />
                    ))
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Select reviewers"
                        placeholder="Choose reviewers"
                        helperText="Only assigned reviewers can access the review substage."
                        FormHelperTextProps={{ sx: { fontSize: "0.62rem" } }}
                    />
                )}
                />
              </Box>

              <Box sx={{ p: 1.6, borderRadius: "12px", bgcolor: "#FAF5FF", border: "1px solid #E9D5FF" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <Box sx={{ width: 26, height: 26, borderRadius: "8px", bgcolor: "#F3E8FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#7C3AED" }}>
                        <SmartToyIcon sx={{ fontSize: 14 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: "0.66rem", color: "#475569", letterSpacing: "0.08em" }}>
                            AI AGENTS
                        </Typography>
                        <Typography sx={{ fontSize: "0.66rem", color: "#64748B" }}>
                          Optional AI collaborators that support execution for this stage.
                        </Typography>
                      </Box>
                    </Box>
                    <Button 
                        size="small" 
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={() => setIsAgentDialogOpen(true)}
                        sx={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "none", borderRadius: "999px" }}
                    >
                        Add Agent
                    </Button>
                </Box>
                <Autocomplete
                multiple
                fullWidth
                size="small"
                options={availableAgents}
                value={assignedAgents}
                disableCloseOnSelect
                onChange={(_, newValue) => {
                    const currentIds = new Set(node?.data?.agentIds || []);
                    const nextIds = new Set(newValue.map(a => a.id));
                    availableAgents.forEach(agent => {
                        const wasSelected = currentIds.has(agent.id);
                        const isSelected = nextIds.has(agent.id);
                        if (wasSelected !== isSelected) {
                            onAssignAgent(agent.id, isSelected);
                        }
                    });
                }}
                disabled={!canReassign}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option, { selected }) => (
                    <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Checkbox size="small" checked={selected} sx={{ p: 0.5 }} />
                        <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: "secondary.main" }}>
                            <SmartToyIcon sx={{ fontSize: 14 }} />
                        </Avatar>
                        <Box>
                            <Typography fontSize="0.82rem" fontWeight={600}>{option.name}</Typography>
                            <Typography fontSize="0.68rem" color="text.secondary">{option.type.toUpperCase()}</Typography>
                        </Box>
                    </Box>
                )}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <Chip
                            {...getTagProps({ index })}
                            key={option.id}
                            size="small"
                            label={option.name}
                            icon={<SmartToyIcon sx={{ fontSize: '12px !important' }} />}
                            sx={{ fontWeight: 600 }}
                        />
                    ))
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Assign AI Agents"
                        placeholder="Choose agents"
                    />
                )}
                />
              </Box>
            </Box>
          </Box>
        </Box>
        <Dialog open={isAgentDialogOpen} onClose={() => setIsAgentDialogOpen(false)} fullWidth maxWidth="xs">
            <DialogTitle sx={{ fontWeight: 800 }}>Create New AI Agent</DialogTitle>
            <DialogContent>
                <Box display="flex" flexDirection="column" gap={3} mt={1}>
                    <TextField 
                        label="Agent Name" 
                        fullWidth 
                        size="small" 
                        value={newAgentName} 
                        onChange={(e) => setNewAgentName(e.target.value)}
                        placeholder="e.g. Data Extractor Bot"
                    />
                    <TextField
                        select
                        fullWidth
                        size="small"
                        label="Agent Type"
                        value={newAgentType}
                        onChange={(e) => setNewAgentType(e.target.value)}
                    >
                        <MenuItem value="extractor">Extractor Agent</MenuItem>
                        <MenuItem value="validator">Validator Agent</MenuItem>
                        <MenuItem value="generator">Generator Agent</MenuItem>
                        <MenuItem value="reviewer">Reviewer Agent</MenuItem>
                    </TextField>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
                <Button onClick={() => setIsAgentDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
                <Button onClick={handleCreateAgent} variant="contained" disabled={!newAgentName} sx={{ fontWeight: 600 }}>Create Agent</Button>
            </DialogActions>
        </Dialog>

        <Divider sx={{ mb: 3 }} />

        {/* MAPPING SECTION - Only Stage 1 */}
        {activeStage === 1 && (
            <Box mb={4}>
                <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.05em', mb: 1.5 }}>
                    REVIEW SUBMISSION
                </Typography>
                <Paper variant="outlined" sx={{ 
                    p: 2, borderRadius: "12px", 
                    bgcolor: isNodeCompleted ? '#ECFDF5' : '#F8FAFC', 
                    border: isNodeCompleted ? '1px solid #10B98130' : '1px solid #E2E8F0',
                    boxShadow: isNodeCompleted ? '0 2px 8px rgba(16,185,129,0.05)' : 'none'
                }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{ 
                            width: 36, height: 36, borderRadius: "10px", 
                            bgcolor: isNodeCompleted ? '#10B98120' : '#F1F5F9',
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: isNodeCompleted ? '#10B981' : '#94A3B8',
                            border: isNodeCompleted ? '1.5px solid #10B98130' : '1.5px solid #E2E8F0'
                        }}>
                            {isNodeCompleted ? <CheckCircleIcon sx={{ fontSize: 20 }} /> : <AutoAwesomeIcon sx={{ fontSize: 18 }} />}
                        </Box>
                        <Box>
                            <Typography variant="caption" fontWeight={900} sx={{ color: isNodeCompleted ? '#065F46' : '#334155', display: "block", letterSpacing: "0.02em" }}>
                                {isNodeCompleted ? "REVIEW SUBMITTED" : "DRAFT MODE"}
                            </Typography>
                            <Typography variant="caption" fontWeight={600} sx={{ color: isNodeCompleted ? '#059669' : '#64748B', fontSize: '0.65rem' }}>
                                {isNodeCompleted ? "Review Submit" : "Pending final modeling"}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        )}

        {/* MAPPING SECTION - Only Stage 1 */}
        {activeStage === 1 && (
            <Box mb={4}>
                <Typography variant="subtitle2" fontWeight={800} gutterBottom sx={{ fontSize: '0.65rem', color: '#64748B', letterSpacing: '0.05em', mb: 2 }}>
                    FIELD MAPPING & RULES
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                    {mappings.map((row) => (
                        <Paper key={row.templateField} variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F9FAFB' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="caption" fontWeight={800} color="primary.main">{row.templateField}</Typography>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={row.isRequired} onChange={(e) => handleMappingChange(row.templateField, 'isRequired', e.target.checked)} sx={{ p: 0.5 }} />}
                                        label={<Typography variant="caption" fontWeight={600}>Required</Typography>}
                                        sx={{ mr: 0 }}
                                    />
                                    <IconButton 
                                        size="small" 
                                        onClick={() => handleDeleteField(row.templateField)}
                                        sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.50' } }}
                                    >
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ fontSize: '10px' }}>Map to Library Column</InputLabel>
                                <Select
                                    value={row.sourceField || ""}
                                    label="Map to Library Column"
                                    onChange={(e) => handleMappingChange(row.templateField, 'sourceField', e.target.value)}
                                    sx={{ bgcolor: 'white', fontSize: '10px' }}
                                >
                                    <MenuItem value="" sx={{ fontSize: '10px' }}><em>None</em></MenuItem>
                                    {SAMPLE_COLUMNS.map((col) => (
                                        <MenuItem key={col} value={col} sx={{ fontSize: '10px' }}>{col}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Paper>
                    ))}
                </Box>

                {/* ADD FIELD COMPONENT */}
                <Box mt={2} display="flex" flexDirection="column" gap={1}>
                    {isAddingField ? (
                        <Box display="flex" gap={1} alignItems="center" sx={{ bgcolor: 'white', p: 1, borderRadius: 2, border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <Autocomplete
                                fullWidth
                                size="small"
                                options={SAMPLE_COLUMNS}
                                value={selectedNewField}
                                onChange={(e, v) => setSelectedNewField(v)}
                                renderInput={(params) => <TextField {...params} placeholder="Pick Template Field..." autoFocus />}
                                sx={{ "& .MuiInputBase-root": { fontSize: '10px' } }}
                            />
                            <IconButton size="small" color="primary" onClick={handleAddField} disabled={!selectedNewField}>
                                <CheckIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => setIsAddingField(false)}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    ) : (
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<AddCircleOutlineIcon />}
                            onClick={() => setIsAddingField(true)}
                            sx={{ 
                                py: 1.5, 
                                borderStyle: 'dashed', 
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                color: 'primary.main',
                                '&:hover': { borderStyle: 'solid', bgcolor: 'primary.50' }
                            }}
                        >
                            Add New Column
                        </Button>
                    )}
                </Box>
            </Box>
        )}
      </Box>


      {/* ── PERMISSIONS SETTINGS SECTION ── */}
      <Box
        sx={{
          mx: 2, mb: 2,
          border: "1px solid #E2E8F0",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        {/* Header / toggle */}
        <Box
          onClick={() => setPermissionsOpen(p => !p)}
          sx={{
            display: "flex", alignItems: "center", gap: 1,
            px: 2, py: 1.2,
            bgcolor: "#F8FAFF",
            cursor: "pointer",
            userSelect: "none",
            "&:hover": { bgcolor: "#EEF2FF" },
          }}
        >
          <SecurityIcon sx={{ fontSize: 16, color: "#6366F1" }} />
          <Typography fontWeight={800} fontSize="0.75rem" color="#1E293B" flex={1}>
            Permissions
          </Typography>
          {permissionsOpen ? <ExpandLess sx={{ fontSize: 16, color: "#94A3B8" }} /> : <ExpandMore sx={{ fontSize: 16, color: "#94A3B8" }} />}
        </Box>

        <Collapse in={permissionsOpen}>
          <Box sx={{ p: 2, bgcolor: "white", display: "flex", flexDirection: "column", gap: 2 }}>

            {/* ── Owner ── */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 0.8 }}>
                <AdminPanelSettingsIcon sx={{ fontSize: 13, color: "#6366F1" }} />
                <Typography fontSize="0.65rem" fontWeight={800} color="#64748B" letterSpacing="0.05em">
                  WORKFLOW OWNER
                </Typography>
              </Box>
              {isSuperAdmin ? (
                <Autocomplete
                  size="small"
                  fullWidth
                  options={availableAssignees}
                  value={availableAssignees.find(u => u.id === ownerDraft) || workflowOwner || null}
                  getOptionLabel={(o) => o.name || o.email || `User ${o.id}`}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  onChange={(_, newVal) => {
                    setOwnerDraft(newVal?.id || null);
                    onChangeOwner?.(newVal);
                  }}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar sx={{ width: 22, height: 22, fontSize: 9, bgcolor: "#6366F1" }}>
                        {option.name?.[0] || "?"}
                      </Avatar>
                      <Box>
                        <Typography fontSize="0.8rem" fontWeight={600}>{option.name}</Typography>
                        <Typography fontSize="0.65rem" color="text.secondary">{option.email}</Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select owner…"
                      helperText="Owner has full admin access to this workflow"
                      FormHelperTextProps={{ sx: { fontSize: "0.6rem" } }}
                    />
                  )}
                />
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.2, py: 0.8, bgcolor: "#F8FAFF", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: "#6366F1" }}>
                    {(workflowOwner?.name || workflowMeta?.created_by_name || "?")?.[0]}
                  </Avatar>
                  <Box>
                    <Typography fontSize="0.78rem" fontWeight={700}>
                      {workflowOwner?.name || workflowMeta?.created_by_name || "—"}
                    </Typography>
                    <Typography fontSize="0.62rem" color="text.secondary">{workflowOwner?.email || ""}</Typography>
                  </Box>
                  <Chip size="small" label="Owner" sx={{ ml: "auto", height: 18, fontSize: "0.55rem", fontWeight: 800, bgcolor: "#EEF2FF", color: "#6366F1", "& .MuiChip-label": { px: 0.8 } }} />
                </Box>
              )}
            </Box>

            {/* ── Role Legend ── */}
            <Box>
              <Typography fontSize="0.65rem" fontWeight={800} color="#64748B" letterSpacing="0.05em" mb={1}>
                ROLE DEFINITIONS
              </Typography>
              {[
                { icon: <AdminPanelSettingsIcon sx={{ fontSize: 13 }} />, color: "#6366F1", bg: "#EEF2FF", label: "Owner / Admin", desc: "Full workflow management" },
                { icon: <CodeIcon sx={{ fontSize: 13 }} />, color: "#0EA5E9", bg: "#E0F2FE", label: "Stage Owner", desc: "Assigned to execute work for a workflow stage" },
                { icon: <RateReviewIcon sx={{ fontSize: 13 }} />, color: "#F59E0B", bg: "#FEF3C7", label: "Reviewer", desc: "Assigned to review & approve a stage" },
                { icon: <VisibilityOutlinedIcon sx={{ fontSize: 13 }} />, color: "#64748B", bg: "#F1F5F9", label: "Viewer", desc: "Read-only access to the workflow" },
              ].map(({ icon, color, bg, label, desc }) => (
                <Box
                  key={label}
                  sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.7, borderBottom: "1px solid #F1F5F9" }}
                >
                  <Box sx={{ width: 24, height: 24, borderRadius: "6px", bgcolor: bg, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
                    {icon}
                  </Box>
                  <Box flex={1}>
                    <Typography fontSize="0.72rem" fontWeight={700} color="#1E293B">{label}</Typography>
                    <Typography fontSize="0.62rem" color="text.secondary">{desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {!isSuperAdmin && (
              <Typography fontSize="0.6rem" color="text.disabled" sx={{ fontStyle: "italic" }}>
                Only a Superadmin can change the workflow owner or role assignments.
              </Typography>
            )}
          </Box>
        </Collapse>
      </Box>

      <Box p={2} borderTop="1px solid #E5E7EB" display="flex" flexDirection="column" gap={1}>
        <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSave}
        >
            Save Changes
        </Button>
      </Box>
    </Box>
  );
}
