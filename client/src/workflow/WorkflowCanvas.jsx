import {
  Box,
  Button,
  Chip,
  Typography,
  Drawer,
  useMediaQuery,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  TextField,
  Checkbox,
  Avatar,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ForumIcon from "@mui/icons-material/Forum";
import ShareIcon from "@mui/icons-material/Share";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SettingsIcon from "@mui/icons-material/Settings";
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { initialNodes as rawInitialNodes } from "./nodes";
import { initialEdges } from "./edges";
import WorkflowSidebar from "./WorkflowSidebar";
import { useAuth } from "../context/AuthContext";
import CustomNode from "./CustomNode";
import TeamsPanel from "./TeamsPanel";
import { fetchAssignableUsers, isWorkflowManager, isWorkflowViewer, serializeWorkflowPayload, updateWorkflow, transferWorkflowOwner } from "./workflowApi";
import WorkflowPermissions from "./WorkflowPermissions";
import SecurityIcon from "@mui/icons-material/Security";

const nodeTypes = {
  custom: CustomNode,
};

export default function WorkflowCanvas({ workflowMeta, onBack, isEdit = false, workflowId = null, initialLoadedNodes = null, onSaved }) {
  const { userRole, token, userData } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const primaryColor = theme.palette.primary.main;
  const canManage = isWorkflowManager(userRole);
  const viewerMode = isWorkflowViewer(userRole, workflowMeta, Number(userData?.id));
  
  const navigate = useNavigate();
  
  // Inject navigation callback and icons callbacks into nodes
  const initialNodes = useMemo(() => {
    const backendStages = initialLoadedNodes || workflowMeta?.stages;
    // If we have loaded nodes from backend, use them instead of rawInitialNodes
    const nodesToUse = backendStages && backendStages.length > 0 
        ? backendStages.map(s => {
            const assignedUserIds = s.assignments?.filter(a => a.role === 'assignee' && a.user_id).map(a => a.user_id) || [];
            const reviewerIds = s.assignments?.filter(a => a.role === 'reviewer' && a.user_id).map(a => a.user_id) || [];
            const agentIds = s.assignments?.filter(a => a.agent_id).map(a => a.agent_id) || [];
            const hasAssignees = assignedUserIds.length > 0;
            // Update the Assigned substage to reflect if anyone is actually assigned
            const substages = s.substages?.map(sub =>
              sub.title === "Assigned"
                ? { ...sub, status: hasAssignees ? "completed" : "pending", subtitle: hasAssignees ? "COMPLETED" : "PENDING" }
                : sub
            );
            return {
                id: String(s.id),
                type: 'custom',
                position: s.stage_index === 0 ? { x: 50, y: 150 } : { x: 450, y: 195 },
                data: {
                    ...s,
                    stage: s.stage_index + 1,
                    assignedUserIds,
                    reviewerIds,
                    agentIds,
                    methodology: s.methodology || null,
                    substages,
                }
            };
        })
        : rawInitialNodes;

    return nodesToUse.map(node => ({
        ...node,
        data: {
            ...node.data,
            assignedUserIds: node.data.assignedUserIds || [], 
            onTemplateClick: () => navigate("/templates/fill"),
            onHeaderIconClick: node.data.label === "Stage 2" ? () => navigate("/workflow/review") : null,
            onSubstageClick: (subId) => {
              if (subId === "fill-template") navigate("/templates/fill");
              if (subId === "review-template") navigate("/workflow/review");
            },
            onSettingsClick: () => {
                setActiveNode(node);
                setConfigMode("reassign");
                setDrawerOpen(true);
            }
        }
    }));
  }, [navigate, initialLoadedNodes, workflowMeta?.stages]);

  const [nodes, setNodes] = useState(initialNodes);
  const [activeNode, setActiveNode] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [configMode, setConfigMode] = useState("global"); // "global" or "reassign"
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [isTeamsOpen, setIsTeamsOpen] = useState(false);
  const [engineers, setEngineers] = useState([
    { id: 101, name: "Arjun Mehta", email: "arjun@assetflow.com", role: "engineer" },
    { id: 102, name: "Sita Rao", email: "sita@assetflow.com", role: "engineer" },
    { id: 103, name: "John Doe", email: "john@assetflow.com", role: "engineer" }
  ]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharedViewers, setSharedViewers] = useState([]);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [permissionsSaving, setPermissionsSaving] = useState(false);

  useEffect(() => {
    const loadAssignableUsers = async () => {
      try {
        const data = await fetchAssignableUsers(token);
        setEngineers(data.filter((user) => user.role !== "viewer"));
      } catch (error) {
        console.error("Error fetching assignable users:", error);
      }
    };

    if (token) {
      loadAssignableUsers();
    }
  }, [token]);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const { fetchAgents } = await import("./workflowApi");
        const data = await fetchAgents(token);
        setAvailableAgents(data);
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    };
    if (token) loadAgents();
  }, [token]);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  useEffect(() => {
    setSharedViewers(
      engineers.filter((user) => (workflowMeta?.shared_viewer_ids || []).includes(user.id))
    );
  }, [engineers, workflowMeta?.shared_viewer_ids]);


  // Status-aware Logic: Update nodes and open modal based on workflow status
  useEffect(() => {
    if (workflowMeta?.status) {
      const currentStatus = workflowMeta.status; // e.g., "In Progress", "Review", "Completed", "Failed"
      const isReviewOrCompleted = currentStatus === "Review" || currentStatus === "Completed";
      
      setNodes((nds) => nds.map(node => {
        if (node.data.stage === 1) {
          const s1Status = currentStatus === "Failed" ? "failed" : (isReviewOrCompleted ? "completed" : "pending");
          return {
            ...node,
            data: {
              ...node.data,
              isActive: !isReviewOrCompleted && currentStatus !== "Failed",
              status: s1Status,
              statusText: isReviewOrCompleted ? "COMPLETED" : (currentStatus === "Failed" ? "FAILED" : (currentStatus === "draft" ? "DRAFT" : "IN PROGRESS")),
              substages: node.data.substages?.map((sub, idx) => {
                if (currentStatus === "Failed") {
                  if (idx < 2) return { ...sub, status: "completed", subtitle: "COMPLETED" };
                  if (idx === 2) return { ...sub, status: "failed", subtitle: "REQUIREMENTS FAILED" };
                  return { ...sub, status: "pending", subtitle: "PENDING" };
                }
                return { 
                  ...sub, 
                  status: isReviewOrCompleted ? "completed" : sub.status, 
                  subtitle: isReviewOrCompleted ? "COMPLETED" : sub.subtitle
                };
              })
            }
          };
        }
        if (node.data.stage === 2) {
          let s2Status = "pending";
          if (currentStatus === "Completed") s2Status = "completed";
          else if (currentStatus === "Review") s2Status = "pending"; // Stage 2 is start of pending when in review
          
          return {
            ...node,
            data: {
              ...node.data,
              isActive: currentStatus === "Review",
              disabled: !isReviewOrCompleted,
              status: s2Status,
              statusText: currentStatus === "Completed" ? "COMPLETED" : "PENDING",
              substages: node.data.substages?.map((sub, idx) => {
                if (currentStatus === "Completed") return { ...sub, status: "completed", subtitle: "COMPLETED" };
                if (currentStatus === "Review") {
                  if (idx === 0) return { ...sub, status: "completed", subtitle: "COMPLETED" };
                  if (idx === 1) return { ...sub, status: "processing", subtitle: "REVIEWING..." };
                }
                return sub;
              })
            }
          };
        }
        return node;
      }));

      if (currentStatus === "Review") {
        navigate("/workflow/review");
      }
    }
  }, [workflowMeta, setNodes]);

  // Mock data for Review (10 columns, 30 rows)
  const reviewData = useMemo(() => {
    const companies = ["Acme Corp", "Globex Inc", "Soylent Corp", "Initech", "Umbrella Corp", "Vandelay Ind", "Hooli", "Stark Ind", "Wayne Ent", "Wonka Ind"];
    const cities = ["New York", "London", "Tokyo", "Berlin", "Paris", "Mumbai", "Sydney", "Toronto", "Dubai", "Singapore"];
    const products = ["Widget A", "Gadget B", "Tool C", "System D", "Module E"];
    
    return Array.from({ length: 30 }, (_, i) => ({
      id: `REF-${1000 + i}`,
      name: companies[i % companies.length],
      email: `contact@${companies[i % companies.length].toLowerCase().replace(/\s/g, "")}.com`,
      order_no: `ORD-${5000 + i}`,
      date: `2026-02-${String((i % 28) + 1).padStart(2, "0")}`,
      amount: String(1000 + (i * 250)),
      product: products[i % products.length],
      qty: String((i % 10) + 1),
      city: cities[i % cities.length],
      status: i % 3 === 0 ? "Verified" : "Pending",
      priority: i % 4 === 0 ? "High" : "Medium"
    }));
  }, []);

  const enableNextStage = (stage) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.data.stage === stage + 1
          ? { ...n, data: { ...n.data, disabled: false } }
          : n
       )
    );
  };

  const handleNodeClick = (_, node) => {
    if (!node.data.disabled && canManage && !viewerMode) {
        setActiveNode(node);
        setDrawerOpen(true);
    }
  };

  const handleAssignMember = (nodeId, userId, isChecked) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const currentIds = node.data.assignedUserIds || [];
          const newIds = isChecked
            ? [...currentIds, userId]
            : currentIds.filter((id) => id !== userId);
          
          const hasAssignees = newIds.length > 0;

          const updatedSubstages = node.data.substages?.map((sub, idx, arr) => {
            // "Assigned" substage → green when assigned, grey when not
            if (sub.title === "Assigned") {
              return {
                ...sub,
                status: hasAssignees ? "completed" : "pending",
                subtitle: hasAssignees ? "COMPLETED" : "PENDING",
              };
            }
            // The substage immediately after "Assigned" → spinning when assigned, pending when not
            const assignedIdx = arr.findIndex(s => s.title === "Assigned");
            if (idx === assignedIdx + 1) {
              return {
                ...sub,
                status: hasAssignees ? "processing" : "pending",
                subtitle: hasAssignees ? "PROCESSING..." : sub.subtitle,
              };
            }
            return sub;
          });

          return {
            ...node,
            data: {
              ...node.data,
              assignedUserIds: newIds,
              substages: updatedSubstages,
            },
          };
        }
        return node;
      })
    );
  };

  const handleAssignReviewer = (nodeId, userId, isChecked) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const currentIds = node.data.reviewerIds || [];
          const newIds = isChecked
            ? [...currentIds, userId]
            : currentIds.filter((id) => id !== userId);
          
          return {
            ...node,
            data: {
              ...node.data,
              reviewerIds: newIds,
            },
          };
        }
        return node;
      })
    );
  };

  const handleAssignAgent = (nodeId, agentId, isChecked) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const currentIds = node.data.agentIds || [];
          const newIds = isChecked
            ? [...currentIds, agentId]
            : currentIds.filter((id) => id !== agentId);
          
          return {
            ...node,
            data: {
              ...node.data,
              agentIds: newIds,
            },
          };
        }
        return node;
      })
    );
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setActiveNode(null);
  };

  const persistWorkflow = async (status) => {
    if (!workflowId && !workflowMeta?.id) {
      return;
    }

    try {
      const savedWorkflow = await updateWorkflow(
        workflowId || workflowMeta.id,
        serializeWorkflowPayload({
          meta: {
            ...workflowMeta,
            shared_viewer_ids: sharedViewers.map((user) => user.id),
            shared_viewer_names: sharedViewers.map((user) => user.name).filter(Boolean),
          },
          nodes,
          status,
        }),
        token
      );
      onSaved?.(savedWorkflow);
      onBack();
    } catch (error) {
      console.error("Error saving workflow:", error);
      alert(error.message || "Failed to save workflow.");
    }
  };

  const handleSaveConfig = async ({ activeStage: stageNumber }) => {
    const nextNodes = [...nodes];

    const savedWorkflow = await updateWorkflow(
      workflowId || workflowMeta.id,
      serializeWorkflowPayload({
        meta: {
          ...workflowMeta,
          shared_viewer_ids: sharedViewers.map((user) => user.id),
          shared_viewer_names: sharedViewers.map((user) => user.name).filter(Boolean),
        },
        nodes: nextNodes,
        status: workflowMeta?.status || "Draft",
      }),
      token
    );

    onSaved?.(savedWorkflow);
  };

  const handleSaveSharedViewers = async () => {
    const savedWorkflow = await updateWorkflow(
      workflowId || workflowMeta.id,
      serializeWorkflowPayload({
        meta: {
          ...workflowMeta,
          shared_viewer_ids: sharedViewers.map((user) => user.id),
          shared_viewer_names: sharedViewers.map((user) => user.name).filter(Boolean),
        },
        nodes,
        status: workflowMeta?.status || "Draft",
      }),
      token
    );

    onSaved?.(savedWorkflow);
    setShareDialogOpen(false);
  };

  // Save permissions changes — rebuilds node assignments from the permissions dialog
  const handleSavePermissions = async (changes) => {
    setPermissionsSaving(true);
    try {
      // Build updated nodes with new developer/reviewer lists per stage
      const updatedNodes = nodes.map((node) => {
        const stageChange = changes.stages.find((s) => s.stageIndex === node.data.stage - 1);
        if (!stageChange) return node;
        return {
          ...node,
          data: {
            ...node.data,
            assignedUserIds: stageChange.developers,
            reviewerIds: stageChange.reviewers,
          },
        };
      });
      setNodes(updatedNodes);

      const savedWorkflow = await updateWorkflow(
        workflowId || workflowMeta.id,
        serializeWorkflowPayload({
          meta: {
            ...workflowMeta,
            shared_viewer_ids: sharedViewers.map((u) => u.id),
          },
          nodes: updatedNodes,
          status: workflowMeta?.status || "Draft",
        }),
        token
      );
      onSaved?.(savedWorkflow);
      setPermissionsOpen(false);
    } catch (err) {
      console.error("Failed to save permissions:", err);
      alert(`Failed to save permissions: ${err.message}`);
    } finally {
      setPermissionsSaving(false);
    }
  };

  // Custom edge style using theme color
  const straightEdgeOptions = useMemo(() => ({
    type: "straight",
    style: { stroke: primaryColor, strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: primaryColor,
    },
  }), [primaryColor]);

  // Convert edges to straight type with theme color
  const straightEdges = useMemo(() => initialEdges.map(edge => ({
    ...edge,
    type: "straight",
    style: { stroke: primaryColor, strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: primaryColor,
    },
  })), [primaryColor]);

  return (
    <ReactFlowProvider>
      <Box height="calc(100vh - 65px)" display="flex" flexDirection="column">
        
        {/* Workflow Header */}
        <Box 
            minHeight={60} 
            borderBottom="1px solid #E5E7EB" 
            bgcolor="#F9FAFB" 
            display="flex" 
            flexDirection={isMobile ? "column" : "row"}
            alignItems={isMobile ? "stretch" : "center"} 
            px={isMobile ? 2 : 3}
            py={isMobile ? 1.5 : 0}
            justifyContent="space-between"
            zIndex={100}
            position="relative"
            gap={isMobile ? 1.5 : 2}
        >
            <Box display="flex" alignItems="center" gap={isMobile ? 1 : 2} flexWrap="wrap">
                <Button 
                    startIcon={<ArrowBackIcon />} 
                    onClick={onBack}
                    color="inherit"
                    size={isMobile ? "small" : "medium"}
                    sx={{ textTransform: "none", color: "text.secondary", minWidth: 'auto' }}
                >
                    {isMobile ? "" : "Back"}
                </Button>
                <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={700}>
                    {isEdit && <span style={{ color: primaryColor, marginRight: '8px' }}>EDIT:</span>}
                    {workflowMeta?.name || "Untitled Workflow"}
                </Typography>
                {workflowMeta?.template && workflowMeta.template !== "none" && (
                    <Chip 
                        label={isMobile ? workflowMeta.template : `Template: ${workflowMeta.template}`} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                        sx={{ fontWeight: 600, fontSize: isMobile ? '0.6rem' : '0.75rem' }}
                    />
                )}
            </Box>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            {viewerMode && (
                <Chip
                    icon={<VisibilityIcon />}
                    label="Viewer Access"
                    size="small"
                    color="warning"
                    variant="outlined"
                />
            )}
            {canManage && !viewerMode && (
                <Box display="flex" gap={1}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        size="small"
                        fullWidth={isMobile}
                        startIcon={<SettingsIcon />}
                        sx={{ fontWeight: 700, textTransform: 'none' }}
                        onClick={() => {
                            setConfigMode("global");
                            setDrawerOpen(true);
                        }}
                    >
                        Settings
                    </Button>
                    <Button
                        variant="outlined"
                        color="inherit"
                        size="small"
                        fullWidth={isMobile}
                        startIcon={<ShareIcon />}
                        sx={{ fontWeight: 700, textTransform: 'none' }}
                        onClick={() => setShareDialogOpen(true)}
                    >
                        Share
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        fullWidth={isMobile}
                        startIcon={<SecurityIcon />}
                        sx={{
                          fontWeight: 700, textTransform: 'none',
                          borderColor: '#6366F1', color: '#6366F1',
                          '&:hover': { bgcolor: '#EEF2FF', borderColor: '#6366F1' }
                        }}
                        onClick={() => setPermissionsOpen(true)}
                    >
                        Permissions
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        fullWidth={isMobile}
                        sx={{ fontWeight: 700, textTransform: 'none' }}
                        onClick={() => persistWorkflow("Draft")}
                    >
                        Save Draft
                    </Button>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        size="small" 
                        fullWidth={isMobile} 
                        sx={{ fontWeight: 700, textTransform: 'none', boxShadow: 'none' }}
                        onClick={() => persistWorkflow("In Progress")}
                    >
                        Publish
                    </Button>
                </Box>
            )}
            </Box>
        </Box>

        {/* Full Screen Canvas */}
        <Box flexGrow={1} position="relative">
            {Array.isArray(workflowMeta?.tags) && workflowMeta.tags.length > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  zIndex: 20,
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                  gap: 1,
                  maxWidth: isMobile ? "calc(100% - 32px)" : 360,
                  pointerEvents: "none",
                }}
              >
                {workflowMeta.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: "rgba(255,255,255,0.92)",
                      border: "1px solid #CBD5E1",
                      boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                    }}
                  />
                ))}
              </Box>
            )}

            <ReactFlow
              nodeTypes={nodeTypes}
              nodes={nodes}
              edges={straightEdges}
              defaultEdgeOptions={straightEdgeOptions}
              fitView
              onPaneClick={() => {
                setActiveNode(null);
                setDrawerOpen(false);
              }}
              onNodeClick={handleNodeClick}
              style={{ background: "#F9FAFB" }}
            >
              <Background color="#E5E7EB" gap={20} />
              <Controls />

            </ReactFlow>

            {/* Floating Teams Chat Window */}
            {isTeamsOpen && (
              <Box 
                sx={{ 
                  position: "absolute", 
                  bottom: 90, 
                  right: 24, 
                  width: 400, 
                  height: 500, 
                  zIndex: 2000,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                  borderRadius: "12px",
                  overflow: "hidden"
                }}
              >
                <TeamsPanel onClose={() => setIsTeamsOpen(false)} />
              </Box>
            )}

            {/* Teams FAB */}
            <Fab 
              color="primary" 
              onClick={() => setIsTeamsOpen(!isTeamsOpen)}
              sx={{ 
                position: "absolute", 
                bottom: 24, 
                right: 24, 
                zIndex: 1000,
                bgcolor: "#6264A7",
                "&:hover": { bgcolor: "#4B4D8F" }
              }}
            >
              <ForumIcon />
            </Fab>
        </Box>

        {/* Sliding Drawer Panel */}
        <Drawer
          anchor={isMobile ? "bottom" : "right"}
          open={drawerOpen}
          onClose={handleCloseDrawer}
          PaperProps={{
            sx: { 
                width: isMobile ? "100%" : 400, 
                height: isMobile ? "85vh" : "100%",
                boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
                borderRadius: isMobile ? "20px 20px 0 0" : 0
            }
          }}
        >
          <WorkflowSidebar
            node={nodes.find(n => n.id === activeNode?.id)}
            workflowMeta={workflowMeta}
            onClose={handleCloseDrawer}
            configMode={configMode}
            onAssignMember={(userId, isChecked) => handleAssignMember(activeNode.id, userId, isChecked)}
            onAssignReviewer={(userId, isChecked) => handleAssignReviewer(activeNode.id, userId, isChecked)}
            onAssignAgent={(agentId, isChecked) => handleAssignAgent(activeNode.id, agentId, isChecked)}
            onStageChange={(stageNum) => {
                const targetNode = nodes.find(n => n.data.stage === stageNum);
                if (targetNode) setActiveNode(targetNode);
            }}
            availableAssignees={engineers}
            availableAgents={availableAgents}
            onSaveConfig={handleSaveConfig}
            onAgentCreated={(newAgent) => setAvailableAgents(prev => [...prev, newAgent])}
            userRole={userRole}
            workflowOwner={engineers.find(u => u.id === workflowMeta?.createdBy) || null}
            onChangeOwner={async (newOwner) => {
              if (!newOwner) return;
              try {
                await transferWorkflowOwner(workflowMeta?.id, newOwner.id, token);
                // Optimistically update local engineer list display — full reload would require page refresh
                console.info("Ownership transferred to", newOwner.name);
              } catch (err) {
                console.error("Failed to transfer ownership:", err.message);
                alert(`Failed to transfer ownership: ${err.message}`);
              }
            }}
          />
        </Drawer>

        <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Share Workflow</DialogTitle>
          <DialogContent>
            <Autocomplete
              multiple
              fullWidth
              options={engineers.filter((user) => user.id !== workflowMeta?.createdBy)}
              value={sharedViewers}
              disableCloseOnSelect
              onChange={(_, value) => setSharedViewers(value)}
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
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareDialogOpen(false)} color="inherit">Cancel</Button>
            <Button onClick={handleSaveSharedViewers} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>

        <WorkflowPermissions
          open={permissionsOpen}
          onClose={() => setPermissionsOpen(false)}
          workflow={workflowMeta}
          availableUsers={engineers}
          userRole={userRole}
          saving={permissionsSaving}
          onSave={handleSavePermissions}
          onTransferOwner={async (newOwnerId) => {
            await transferWorkflowOwner(workflowMeta?.id, newOwnerId, token);
          }}
        />

      </Box>
    </ReactFlowProvider>
  );
}
