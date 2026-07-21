import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Avatar,
  IconButton,
  AvatarGroup,
  useTheme,
  useMediaQuery,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Autocomplete,
  Checkbox,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";
import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import WorkflowCreate from "./WorkflowCreate";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from "@mui/icons-material/Share";
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import GroupsIcon from '@mui/icons-material/Groups';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from "../context/AuthContext";
import { deleteWorkflow, fetchAssignableUsers, fetchWorkflows, isWorkflowManager, serializeWorkflowPayload, updateWorkflow, transferWorkflowOwner } from "./workflowApi";
import WorkflowPermissions from "./WorkflowPermissions";
import { ensureDataModelForWorkflow } from "../pages/dataModelApi";

export default function WorkflowList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { userRole, token, userData } = useAuth();
  const canManage = isWorkflowManager(userRole);
  const [tabValue, setTabValue] = useState("All");
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  
  // 👉 pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [search, setSearch] = useState("");

  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);

  // 👉 Delete Confirmation State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [workflowToShare, setWorkflowToShare] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [sharedUsers, setSharedUsers] = useState([]);

  // 👉 Permissions State
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [workflowToPermission, setWorkflowToPermission] = useState(null);
  const [permissionsSaving, setPermissionsSaving] = useState(false);

  // 👉 Toast Notification State
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const loadWorkflows = async () => {
      setLoading(true);
      try {
        const data = await fetchWorkflows(token);
        setWorkflows(data);
      } catch (error) {
        console.error("Failed to load workflows:", error);
        setSnackbar({ open: true, message: error.message || "Failed to load workflows", severity: "error" });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadWorkflows();
    }
  }, [token]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchAssignableUsers(token);
        setAllUsers(data);
      } catch (error) {
        console.error("Failed to load users:", error);
      }
    };

    if (token && canManage) {
      loadUsers();
    }
  }, [token, canManage]);

  // reset page when tab changes
  useEffect(() => {
    setPage(0);
  }, [tabValue]);

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((w) => {
        const matchesTab = tabValue === "All" ? true : w.status === tabValue;
        const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
    });
  }, [tabValue, search, workflows]);

  const paginatedWorkflows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredWorkflows.slice(start, start + rowsPerPage);
  }, [filteredWorkflows, page, rowsPerPage]);

  const stats = [
    { label: "Total Workflows", value: workflows.length },
    { label: "In Progress", value: workflows.filter(w => w.status === "In Progress").length, color: "success.main" },
    { label: "Review", value: workflows.filter(w => w.status === "Review").length, color: "warning.main" },
    { label: "Failed", value: workflows.filter(w => w.status === "Failed").length, color: "error.main" },
    { label: "Completed", value: workflows.filter(w => w.status === "Completed").length, color: "primary.main" },
  ];

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <Typography color="text.secondary">Loading workflows...</Typography>
      </Box>
    );
  }

  if (selectedWorkflow) {
    return (
        <WorkflowCreate 
            initialData={selectedWorkflow}
            onSaved={(savedWorkflow) => {
              setWorkflows((current) => {
                const existingIndex = current.findIndex((workflow) => workflow.id === savedWorkflow.id);
                if (existingIndex === -1) {
                  return [savedWorkflow, ...current];
                }

                const next = [...current];
                next[existingIndex] = savedWorkflow;
                return next;
              });
            }}
            onBack={() => {
                setSelectedWorkflow(null);
            }} 
        />
    );
  }



  const confirmDelete = async () => {
    if (!workflowToDelete) return;

    try {
      await deleteWorkflow(workflowToDelete.id, token);
      setWorkflows(workflows.filter(wf => wf.id !== workflowToDelete.id));
      setSnackbar({ open: true, message: "Workflow deleted successfully!", severity: "success" });
    } catch (error) {
      console.error("Error deleting workflow:", error);
      setSnackbar({ open: true, message: error.message || "An error occurred while deleting the workflow", severity: "error" });
    } finally {
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    }
  };

  const handleDeleteWorkflow = (workflow) => {
    setWorkflowToDelete(workflow);
    setDeleteDialogOpen(true);
  };

  const openModelingWorkflow = async (workflow) => {
    try {
      const dataModel = await ensureDataModelForWorkflow(
        {
          workflowId: workflow.id,
          name: workflow.name,
          methodology: workflow.methodology || workflow.stages?.find?.((stage) => stage.stage_index === 0)?.methodology || "ER Diagram",
        },
        token,
      );

      navigate(`/data/create/${dataModel.id}`, {
        state: {
          modelId: dataModel.id,
          modelName: workflow.name,
          workflowId: workflow.id,
          workflow,
        },
      });
    } catch (error) {
      console.error("Failed to open modeling workflow:", error);
      setSnackbar({ open: true, message: error.message || "Failed to open data model", severity: "error" });
    }
  };

  const handleOpenShareDialog = (workflow) => {
    setWorkflowToShare(workflow);
    setSharedUsers(
      allUsers.filter((user) => (workflow.shared_viewer_ids || []).includes(user.id))
    );
    setShareDialogOpen(true);
  };

  const handleSaveShare = async () => {
    if (!workflowToShare) return;

    try {
      const savedWorkflow = await updateWorkflow(
        workflowToShare.id,
        serializeWorkflowPayload({
          meta: {
            ...workflowToShare,
            shared_viewer_ids: sharedUsers.map((user) => user.id),
            shared_viewer_names: sharedUsers.map((user) => user.name).filter(Boolean),
          },
          nodes: (workflowToShare.stages || []).map((stage) => ({
            id: String(stage.id),
            data: {
              label: stage.label,
              stage: (stage.stage_index || 0) + 1,
              sequence: stage.sequence,
              status: stage.status,
              statusText: stage.statusText,
              description: stage.description,
              methodology: stage.methodology,
              isActive: stage.isActive,
              disabled: stage.disabled,
              validation_enabled: stage.validation_enabled,
              assignedUserIds: (stage.assignments || []).map((assignment) =>
                typeof assignment === "object" ? assignment.user_id : assignment
              ),
              substages: stage.substages || [],
            },
          })),
          status: workflowToShare.status,
        }),
        token
      );

      setWorkflows((current) =>
        current.map((workflow) => (workflow.id === savedWorkflow.id ? savedWorkflow : workflow))
      );
      setShareDialogOpen(false);
      setWorkflowToShare(null);
      setSnackbar({ open: true, message: "Workflow shared successfully!", severity: "success" });
    } catch (error) {
      console.error("Error sharing workflow:", error);
      setSnackbar({ open: true, message: error.message || "Failed to share workflow", severity: "error" });
    }
  };

  return (
    <Box p={isMobile ? 2 : 4} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
      {/* Stats Cards */}
      <Box 
        sx={{ 
            mx: isMobile ? -2 : 0, 
            px: isMobile ? 2 : 0, 
            overflowX: 'auto', 
            mb: 4, 
            pb: 1, 
            '&::-webkit-scrollbar': { height: 4 } 
        }}
      >
        <Stack direction="row" spacing={2} sx={{ minWidth: isMobile ? 'max-content' : 'auto' }}>
            {stats.map((s) => (
            <Card key={s.label} sx={{ flex: 1, minWidth: isMobile ? 180 : 'auto', boxShadow: "0 2px 10px rgba(0,0,0,0.05)", borderRadius: 3 }}>
                <CardContent sx={{ p: isMobile ? 2 : 3, "&:last-child": { pb: isMobile ? 2 : 3 } }}>
                <Typography color="text.secondary" sx={{ fontSize: isMobile ? 9 : 11 }} fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                    {s.label}
                </Typography>
                <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700} sx={{ color: s.color || "text.primary", mt: 1 }}>
                    {s.value}
                </Typography>
                </CardContent>
            </Card>
            ))}
        </Stack>
      </Box>

      <Box borderBottom={1} borderColor="divider" mb={2}>
            <Tabs 
                value={tabValue} 
                onChange={(e, v) => setTabValue(v)} 
                aria-label="workflow-tabs"
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons="auto"
            >
                {["All", "In Progress", "Review", "Failed", "Completed"].map((t) => (
                    <Tab key={t} label={t} value={t} sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.7rem" }} />
                ))}
            </Tabs>
      </Box>

      {/* Header & Controls */}
      <Box display="flex" flexDirection={isMobile ? "column" : "row"} justifyContent="space-between" alignItems={isMobile ? "stretch" : "center"} gap={2} mb={3} >
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} color="text.primary">
              {tabValue} Workflows
            </Typography>
 
            <Box display="flex" flexDirection={isMobile ? "column" : "row"} gap={2} alignItems={isMobile ? "stretch" : "center"}>
                 <TextField
                    placeholder="Search workflows..."
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: isMobile ? "100%" : 250, bgcolor: "white" }}
                />
 
                {canManage && (
                    <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    fullWidth={isMobile}
                    sx={{ 
                        textTransform: "none", 
                        fontWeight: 600,
                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                        whiteSpace: 'nowrap'
                    }}
                    onClick={() => navigate("/workflow/create")}
                    >
                    Create Workflow
                    </Button>
                )}
            </Box>
      </Box>

      {/* Table / Card Grid */}
      {isMobile ? (
        <Box sx={{ width: '100%' }}>
          {paginatedWorkflows.map((wf) => (
            <Box key={wf.id} sx={{ mb: 2 }}>
              <MobileWorkflowCard 
                wf={wf} 
                userRole={userRole} 
                onEdit={() => {
                  if (wf.type === "modelling") {
                    openModelingWorkflow(wf);
                  } else {
                    navigate(`/workflow/edit/${wf.id}`);
                  }
                }} 
                onShare={() => handleOpenShareDialog(wf)}
                onDelete={() => handleDeleteWorkflow(wf)}
              />
            </Box>
          ))}
          {!paginatedWorkflows.length && (
            <Box py={8} textAlign="center">
              <Typography color="text.secondary">No workflows match your search.</Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Paper
            elevation={0}
            sx={{
                border: "1px solid #E5E7EB",
                borderRadius: 3,
                overflow: "hidden"
            }}
        >
        <TableContainer>
            <Table>
            {/* HEADER */}
            <TableHead sx={{ bgcolor: "#F9FAFB" }}>
                <TableRow>
                {[
                    "Workflow Name",
                    "Type",
                    "Status",
                    "Owner",
                    "Assignees",
                    "Completion Date",
                    "Last Updated",
                    "Actions",
                ].map((h) => (
                    <TableCell
                    key={h}
                    sx={{
                        color: "text.secondary",
                        fontWeight: 600,
                        fontSize: "0.65rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        py: 2
                    }}
                    >
                    {h}
                    </TableCell>
                ))}
                </TableRow>
            </TableHead>
        
            {/* BODY */}
            <TableBody>
                {paginatedWorkflows.map((wf) => (
                <TableRow
                    key={wf.id}
                    hover
                    onClick={() => {
                      if (wf.type === "modelling") {
                        openModelingWorkflow(wf);
                      } else {
                        navigate(`/workflow/edit/${wf.id}`);
                      }
                    }}
                    sx={{
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#F9FAFB" },
                    }}
                    title={wf.name}
                >
                    {/* Name */}
                    <TableCell>
                    <Typography fontWeight={600} variant="body2">
                        {wf.name}
                    </Typography>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        fontFamily="monospace"
                    >
                        {wf.id}
                    </Typography>
                    </TableCell>

                    {/* Type */}
                    <TableCell>
                      <Chip 
                        label={wf.type === 'modelling' ? 'Data Modelling' : wf.type.charAt(0).toUpperCase() + wf.type.slice(1)} 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          borderRadius: 1, 
                          fontWeight: 700, 
                          fontSize: '0.6rem',
                          color: 'text.secondary',
                          borderColor: 'divider',
                          textTransform: 'uppercase'
                        }} 
                      />
                    </TableCell>
        
                    {/* Status */}
                    <TableCell>
                    <Chip 
                            label={wf.status} 
                            size="small" 
                            sx={{ 
                                borderRadius: 1, 
                                fontWeight: 600, 
                                bgcolor: wf.status === "In Progress" ? "success.50" : wf.status === "Completed" ? "primary.50" : wf.status === "Failed" ? "error.50" : "warning.50",
                                color: wf.status === "In Progress" ? "success.main" : wf.status === "Completed" ? "primary.main" : wf.status === "Failed" ? "error.main" : "warning.main",
                                border: "1px solid",
                                borderColor: wf.status === "In Progress" ? "success.200" : wf.status === "Completed" ? "primary.200" : wf.status === "Failed" ? "error.200" : "warning.200"
                            }}
                        />
                    </TableCell>
    
                    {/* Owner */}
                    <TableCell sx={{ minWidth: 140 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 24, height: 24, fontSize: "0.65rem", bgcolor: "primary.light", flexShrink: 0 }}>
                        {wf.creator?.avatar || (wf.creator?.name ? wf.creator.name[0] : "?")}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontSize: "0.75rem" }} noWrap>
                        {wf.creator?.name || "—"}
                        </Typography>
                    </Stack>
                    </TableCell>
        
                    {/* Assignees */}
                    <TableCell>
                        <Typography variant="body2" color="text.primary" fontWeight={700}>
                            {wf.assignee_names?.length > 0 
                                ? wf.assignee_names.length
                                : <span style={{ color: "#9ca3af", fontStyle: "italic", fontWeight: 400 }}>0</span>
                            }
                        </Typography>
                    </TableCell>
    
                    {/* Completion Date */}
                    <TableCell>
                        <Typography variant="body2" color="text.secondary">
                            {wf.completionDate}
                        </Typography>
                    </TableCell>
        
                    {/* Updated At */}
                    <TableCell>
                        <Typography variant="body2" color="text.secondary">
                            {wf.updatedAt}
                        </Typography>
                    </TableCell>
        
                    {/* Actions */}
                    <TableCell>
                    <Box display="flex" gap={1}>
                        <IconButton 
                            size="small" 
                            sx={{ color: "text.secondary" }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (wf.type === "modelling") {
                                  openModelingWorkflow(wf);
                                } else {
                                  navigate(`/workflow/edit/${wf.id}`);
                                }
                            }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                        {canManage && (
                            <IconButton
                                size="small"
                                sx={{ color: "primary.main" }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenShareDialog(wf);
                                }}
                            >
                                <ShareIcon fontSize="small" />
                            </IconButton>
                        )}
                        {canManage && (
                            <IconButton
                                size="small"
                                title="Permissions"
                                sx={{ color: "#6366F1" }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setWorkflowToPermission(wf);
                                    setPermissionsOpen(true);
                                }}
                            >
                                <SecurityIcon fontSize="small" />
                            </IconButton>
                        )}
                        {canManage && (
                            <IconButton 
                                size="small" 
                                sx={{ color: "error.main" }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteWorkflow(wf);
                                }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                    </TableCell>
                </TableRow>
                ))}
        
                {!paginatedWorkflows.length && (
                <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">
                        No workflows match your search.
                    </Typography>
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </TableContainer>
        </Paper>
      )}
 
      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredWorkflows.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
        sx={{ borderTop: "1px solid #E5E7EB", mt: isMobile ? 2 : 0 }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the workflow <strong>"{workflowToDelete?.name}"</strong>? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            color="inherit" 
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained" 
            sx={{ textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Share Workflow</DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple
            fullWidth
            options={allUsers.filter((user) => user.id !== workflowToShare?.createdBy)}
            value={sharedUsers}
            disableCloseOnSelect
            onChange={(_, value) => setSharedUsers(value)}
            getOptionLabel={(option) => option.name || option.email || `User ${option.id}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option, { selected }) => (
              <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Checkbox size="small" checked={selected} sx={{ p: 0.5 }} />
                <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: "primary.main" }}>
                  {option.avatar || option.name?.[0] || "U"}
                </Avatar>
                <Box>
                  <Typography fontSize="0.82rem" fontWeight={600}>{option.name}</Typography>
                  <Typography fontSize="0.68rem" color="text.secondary">Viewer access</Typography>
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select viewers"
                placeholder="Search users"
                margin="normal"
              />
            )}
          />
          <DialogContentText sx={{ mt: 1 }}>
            Selected users will have viewer access only and will not be able to edit this workflow.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShareDialogOpen(false)} color="inherit" sx={{ textTransform: "none", fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={handleSaveShare} variant="contained" sx={{ textTransform: "none", fontWeight: 600 }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permissions Dialog */}
      <WorkflowPermissions
        open={permissionsOpen}
        onClose={() => { setPermissionsOpen(false); setWorkflowToPermission(null); }}
        workflow={workflowToPermission}
        availableUsers={allUsers}
        userRole={userRole}
        saving={permissionsSaving}
        onSave={async (changes) => {
          if (!workflowToPermission) return;
          setPermissionsSaving(true);
          try {
            const updatedNodes = (workflowToPermission.stages || []).map((stage) => {
              const stageChange = changes.stages.find(s => s.stageIndex === stage.stage_index);
              return {
                id: String(stage.id),
                data: {
                  label: stage.label,
                  stage: (stage.stage_index || 0) + 1,
                  sequence: stage.sequence,
                  status: stage.status,
                  statusText: stage.statusText,
                  description: stage.description,
                  methodology: stage.methodology,
                  isActive: stage.isActive,
                  disabled: stage.disabled,
                  validation_enabled: stage.validation_enabled,
                  assignedUserIds: stageChange ? stageChange.developers : (stage.assignments || []).map(a => a.user_id),
                  reviewerIds: stageChange ? stageChange.reviewers : (stage.assignments || []).filter(a => a.role === 'reviewer').map(a => a.user_id),
                  substages: stage.substages || [],
                },
              };
            });
            const saved = await updateWorkflow(
              workflowToPermission.id,
              serializeWorkflowPayload({
                meta: { ...workflowToPermission },
                nodes: updatedNodes,
                status: workflowToPermission.status,
              }),
              token
            );
            setWorkflows(cur => cur.map(wf => wf.id === saved.id ? saved : wf));
            setPermissionsOpen(false);
            setWorkflowToPermission(null);
            setSnackbar({ open: true, message: "Permissions saved!", severity: "success" });
          } catch (err) {
            setSnackbar({ open: true, message: err.message || "Failed to save permissions", severity: "error" });
          } finally {
            setPermissionsSaving(false);
          }
        }}
        onTransferOwner={async (newOwnerId) => {
          if (!workflowToPermission) return;
          await transferWorkflowOwner(workflowToPermission.id, newOwnerId, token);
          // Refresh list
          const data = await fetchWorkflows(token);
          setWorkflows(data);
          setSnackbar({ open: true, message: "Ownership transferred!", severity: "success" });
        }}
      />

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function MobileWorkflowCard({ wf, userRole, onEdit, onShare, onDelete }) {
  const canManage = isWorkflowManager(userRole);
  const statusColors = {
    "In Progress": "#10B981", // Success Green
    "Review": "#F59E0B",      // Warning Orange
    "Failed": "#EF4444",      // Error Red
    "Completed": "#3B82F6",   // Primary Blue
  };

  const statusColor = statusColors[wf.status] || "#64748B";

  return (
    <Card sx={{ 
        borderRadius: 4, 
        border: "1px solid #E2E8F0", 
        boxShadow: "0 4px 15px rgba(0,0,0,0.04)", 
        position: 'relative',
        overflow: 'hidden',
        "&::before": {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            bgcolor: statusColor,
        }
    }}>
      <CardContent sx={{ p: 2.5 }}>
        {/* HEADER AREA */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#1E293B', mb: 0.5, lineHeight: 1.2 }}>
                {wf.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'monospace', fontWeight: 600, bgcolor: '#F1F5F9', px: 0.8, py: 0.2, borderRadius: 1 }}>
                    {wf.id}
                </Typography>
                <Chip 
                  label={wf.type === 'modelling' ? 'Data Modelling' : wf.type.toUpperCase()} 
                  size="small" 
                  sx={{ 
                    height: 18, 
                    fontSize: '0.5rem', 
                    fontWeight: 900, 
                    borderRadius: 1,
                    bgcolor: '#F8FAFC',
                    color: '#64748B',
                    border: '1px solid #E2E8F0'
                  }} 
                />
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: '#94A3B8' }}>
                    <AccessTimeIcon sx={{ fontSize: 10 }} />
                    <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>2m ago</Typography>
                </Stack>
            </Stack>
          </Box>
          <Chip 
            label={wf.status} 
            size="small" 
            sx={{ 
                borderRadius: 1.5, 
                fontWeight: 800, 
                fontSize: '0.55rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                bgcolor: `${statusColor}15`,
                color: statusColor,
                border: `1px solid ${statusColor}30`,
            }}
          />
        </Box>

        {/* INFO GRID */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={6}>
            <Box>
                <Stack direction="row" spacing={0.5} alignItems="center" mb={0.8}>
                    <PersonOutlineIcon sx={{ fontSize: 12, color: '#94A3B8' }} />
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, letterSpacing: '0.02em' }}>CREATED BY</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 22, height: 22, fontSize: '0.55rem', bgcolor: statusColor, fontWeight: 700 }}>
                        {wf.creator?.avatar || (wf.creator?.name ? wf.creator.name[0] : "")}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                        {wf.creator?.name}
                    </Typography>
                </Stack>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box>
                <Stack direction="row" spacing={0.5} alignItems="center" mb={0.8}>
                    <CalendarTodayIcon sx={{ fontSize: 11, color: '#94A3B8' }} />
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, letterSpacing: '0.02em' }}>DEADLINE</Typography>
                </Stack>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem', pl: 0.2 }}>
                    {wf.completionDate}
                </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2, borderStyle: 'dashed', borderColor: '#E2E8F0' }} />

        {/* FOOTER AREA */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center" mb={0.5}>
                <GroupsIcon sx={{ fontSize: 13, color: '#94A3B8' }} />
                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>TEAM</Typography>
            </Stack>
            {wf.assignee_names?.length > 0 ? (
                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.55rem', border: '2px solid white' } }}>
                    {wf.assignee_names.map((name, i) => (
                        <Avatar key={i} sx={{ bgcolor: '#94A3B8' }}>{name[0]}</Avatar>
                    ))}
                </AvatarGroup>
            ) : (
                <Typography variant="caption" sx={{ color: '#CBD5E1', fontStyle: 'italic' }}>No assignees</Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1}>
            <IconButton 
                size="small" 
                onClick={onEdit}
                sx={{ 
                    bgcolor: '#F1F5F9', 
                    color: '#475569',
                    borderRadius: 2,
                    p: 1,
                    '&:hover': { bgcolor: '#E2E8F0' }
                }}
            >
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
            {canManage && (
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onShare();
                    }}
                    sx={{
                        bgcolor: '#EFF6FF',
                        color: '#2563EB',
                        borderRadius: 2,
                        p: 1,
                        '&:hover': { bgcolor: '#DBEAFE' }
                    }}
                >
                    <ShareIcon sx={{ fontSize: 16 }} />
                </IconButton>
            )}
            {canManage && (
                <IconButton 
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    sx={{ 
                        bgcolor: '#FEF2F2', 
                        color: '#EF4444',
                        borderRadius: 2,
                        p: 1,
                        '&:hover': { bgcolor: '#FEE2E2' }
                    }}
                >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
