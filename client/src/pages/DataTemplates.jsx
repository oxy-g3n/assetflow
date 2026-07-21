import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";

import ReactFlow, {
  Background, Controls, MiniMap, addEdge,
  useNodesState, useEdgesState, Handle, Position, MarkerType,
  BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useStore
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Box, Typography, IconButton, Button, TextField, Select, MenuItem,
  Divider, Tooltip, Paper, Stack, ToggleButton, ToggleButtonGroup,
  Avatar, Chip, CircularProgress, Grid, Card, CardContent, LinearProgress,
  Tabs, Tab, Accordion, AccordionSummary, AccordionDetails, Alert, Snackbar,
  Drawer, Checkbox, FormControlLabel, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Stepper, Step, StepLabel, StepButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import TableChartIcon from "@mui/icons-material/TableChart";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import KeyIcon from "@mui/icons-material/Key";
import CloseIcon from "@mui/icons-material/Close";
import CommentIcon from "@mui/icons-material/Comment";
import SendIcon from "@mui/icons-material/Send";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckIcon from "@mui/icons-material/Check";
import CancelIcon from "@mui/icons-material/Cancel";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DescriptionIcon from "@mui/icons-material/Description";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import CloudIcon from "@mui/icons-material/Cloud";
import DownloadIcon from "@mui/icons-material/Download";
import SettingsIcon from "@mui/icons-material/Settings";
import SearchIcon from "@mui/icons-material/Search";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import PersonIcon from "@mui/icons-material/Person";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import BrushIcon from "@mui/icons-material/Brush";
import RuleIcon from "@mui/icons-material/Rule";
import CachedIcon from "@mui/icons-material/Cached";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LinkIcon from "@mui/icons-material/Link";
import HubIcon from "@mui/icons-material/Hub";
import StorageIcon from "@mui/icons-material/Storage";
import fabricLogo from "../assets/fabric.png";
import gcpLogo from "../assets/gcp.png";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { useAuth } from "../context/AuthContext";
import { fetchAssignableUsers, fetchWorkflowById, isWorkflowViewer, isWorkflowDeveloper, isWorkflowReviewer, updateWorkflow, fetchAgents, createAgent } from "../workflow/workflowApi";
import { createDataModel, fetchDataModelById, fetchDataModels, runConceptualAgent, updateDataModel } from "./dataModelApi";


// ─── Constants ────────────────────────────────────────────────────────────────
const FIELD_TYPES = [
  "VARCHAR", "CHAR", "TEXT", "INT", "BIGINT", "SMALLINT", "DECIMAL", "NUMERIC", "FLOAT", "REAL", "BOOLEAN", 
  "DATE", "TIME", "TIMESTAMP", "TIMESTAMPTZ", "INTERVAL", "UUID", "JSON", "JSONB", "BLOB"
];
const TABLE_TYPES = ["TABLE", "VIEW", "MATERIALIZED VIEW"];
const TABLE_COLORS = ["#1E293B", "#2563EB", "#7C3AED", "#059669", "#DC2626", "#D97706", "#0891B2"];

const INITIAL_STAGES = [
  {
    id: 1, label: "Data Modeling", description: "ER / Dimensional / Data Vault / Master",
    status: "pending",
    icon: <TableChartIcon sx={{ fontSize: 18 }} />,
    substages: [
      { title: "Conceptual", subtitle: "PENDING", status: "pending", type: "manual" },
      { title: "Logical",    subtitle: "PENDING", status: "pending", type: "manual" },
      { title: "Physical",   subtitle: "PENDING", status: "pending", type: "manual" },
      { title: "Review",     subtitle: "PENDING", status: "pending", type: "manual" },
    ],
  },
  {
    id: 2, label: "Benchmarking", description: "Cloud performance & cost analysis",
    status: "pending",
    icon: <CachedIcon sx={{ fontSize: 18 }} />,
    substages: [
      { title: "Performance Dashboard", subtitle: "READY", status: "pending", type: "automated" },
      { title: "Infrastructure Report", subtitle: "AI GEN", status: "pending", type: "ai" },
    ],
  },
  {
    id: 3, label: "Mapping & Documentation", description: "Lineage & auto-generated docs",
    status: "pending",
    icon: <DescriptionIcon sx={{ fontSize: 18 }} />,
    substages: [
      { title: "Interactive Mapping",  subtitle: "WAITING", status: "pending", type: "manual" },
      { title: "Documentation Hub",    subtitle: "WAITING", status: "pending", type: "ai" },
    ],
  },
  {
    id: 4, label: "Cloud Integration", description: "Azure, AWS, GCP & more",
    status: "pending",
    icon: (
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5, p: 0.2 }}>
        <Box component="img" src={gcpLogo} sx={{ width: 14, height: 14, objectFit: "contain" }} />
        <Box component="img" src={fabricLogo} sx={{ width: 14, height: 14, objectFit: "contain" }} />
        <Box component="img" src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg" sx={{ width: 14, height: 14 }} />
        <Box component="img" src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" sx={{ width: 14, height: 14 }} />
      </Box>
    ),
    substages: [
      { title: "Platform Selected",        subtitle: "PENDING", status: "pending", type: "manual" },
      { title: "Credentials Configured",   subtitle: "PENDING", status: "pending", type: "manual" },
      { title: "Deploy Ready",             subtitle: "PENDING", status: "pending", type: "logic" },
    ],
  },
];

// ─── Status dot ───────────────────────────────────────────────────────────────
function StatusDot({ status }) {
  if (status === "completed")
    return <CheckCircleIcon sx={{ fontSize: 11, color: "#10B981" }} />;
  if (status === "processing")
    return (
      <Box sx={{ width: 13, height: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={11} thickness={5} sx={{ color: "#3B82F6" }} />
      </Box>
    );
  return <RadioButtonUncheckedIcon sx={{ fontSize: 11, color: "#CBD5E1" }} />;
}

// ─── Stage Sidebar ────────────────────────────────────────────────────────────
const STAGE_STATUS_COLORS = {
  completed: { border: "#6EE7B7", header: "#F0FDF4", icon: "#10B981", chipBg: "#DCFCE7", chipText: "#15803D" },
  failed:    { border: "#FCA5A5", header: "#FEF2F2", icon: "#EF4444", chipBg: "#FEE2E2", chipText: "#B91C1C" },
  pending:   { border: "#E0E7FF", header: "#F8FAFF", icon: "#818CF8", chipBg: "#EEF2FF", chipText: "#4F46E5" },
};

const STAGE_ACCENT = [
  { icon: "#3B82F6", iconBg: "#EFF6FF", badge: "#3B82F6" },  // blue
  { icon: "#8B5CF6", iconBg: "#F5F3FF", badge: "#8B5CF6" },  // violet
  { icon: "#0EA5E9", iconBg: "#F0F9FF", badge: "#0EA5E9" },  // sky
  { icon: "#10B981", iconBg: "#F0FDF4", badge: "#10B981" },  // emerald
];

function SubstageRow({ sub }) {
  const dotColor = sub.status === "completed" ? "#10B981" : sub.status === "failed" ? "#EF4444" : sub.status === "processing" ? "#3B82F640" : "#E2E8F0";
  const dotBorder = sub.status === "processing" ? "2px solid #3B82F6" : sub.status === "failed" ? "2px solid #EF4444" : "2px solid white";
  const cardBorder = sub.status === "processing" ? "#BFDBFE" : sub.status === "failed" ? "#FECACA" : "#F1F5F9";

  const icon = { manual: <PersonIcon sx={{ fontSize: 11 }} />, ai: <AutoAwesomeIcon sx={{ fontSize: 11 }} />, automated: <AutoFixHighIcon sx={{ fontSize: 11 }} />, logic: <BrushIcon sx={{ fontSize: 11 }} /> }[sub.type] || <RuleIcon sx={{ fontSize: 11 }} />;

  const statusIcon = sub.status === "completed"
    ? <CheckCircleIcon sx={{ fontSize: 11, color: "#10B981" }} />
    : sub.status === "failed"
    ? <CancelIcon sx={{ fontSize: 11, color: "#EF4444" }} />
    : sub.status === "processing"
    ? <CachedIcon sx={{ fontSize: 11, color: "primary.main", animation: "spin 2s linear infinite", "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } } }} />
    : <RadioButtonUncheckedIcon sx={{ fontSize: 10, color: "#94A3B8" }} />;

  return (
    <Box display="flex" alignItems="center" gap={1} sx={{ position: "relative", zIndex: 2 }}>
      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: dotColor, border: dotBorder, flexShrink: 0 }} />
      <Box sx={{ flex: 1, px: 1, py: 0.6, borderRadius: "6px", bgcolor: "white", border: "1px solid", borderColor: cardBorder, display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: sub.status === "processing" ? "0 2px 6px rgba(59,130,246,0.08)" : "0 1px 3px rgba(0,0,0,0.03)" }}>
        <Box display="flex" alignItems="center" gap={0.6}>
          <Box sx={{ color: sub.status === "completed" ? "#64748B" : sub.status === "processing" ? "#3B82F6" : "#CBD5E1" }}>{icon}</Box>
          <Box>
            <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, color: "#334155", display: "block", lineHeight: 1.2 }}>{sub.title}</Typography>
            <Typography sx={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", color: sub.status === "processing" ? "#3B82F6" : "#94A3B8" }}>{sub.subtitle}</Typography>
          </Box>
        </Box>
        {statusIcon}
      </Box>
    </Box>
  );
}

function StageSidebar({ activeStage, setActiveStage, stages }) {
  return (
    <Box sx={{ width: 290, bgcolor: "#F8FAFC", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", overflowY: "auto", p: 2, gap: 2 }}>
      {stages.map((stage, idx) => {
        const isActive = activeStage === stage.id;
        const colors = STAGE_STATUS_COLORS[stage.status] || STAGE_STATUS_COLORS.pending;
        return (
          <Box key={stage.id}>
            {/* Stage Card */}
            <Paper
              elevation={isActive ? 8 : 2}
              onClick={() => setActiveStage(stage.id)}
              sx={{
                borderRadius: "12px", border: "2px solid", position: "relative", overflow: "visible", cursor: "pointer",
                borderColor: isActive ? "primary.main" : colors.border,
                bgcolor: "white",
                transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 8 },
              }}
            >
              {/* Sequence Badge */}
              <Box sx={{ position: "absolute", top: -12, left: -12, width: 28, height: 28, bgcolor: "#334155", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 900, border: "3px solid white", zIndex: 10, boxShadow: "0 3px 8px rgba(0,0,0,0.15)" }}>
                {String(stage.id).padStart(2, "0")}
              </Box>

              {/* Header */}
              <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: isActive ? "#EFF6FF" : colors.header, borderTopLeftRadius: "10px", borderTopRightRadius: "10px" }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ width: 38, height: 38, bgcolor: isActive ? "#3B82F6" : colors.icon, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: `0 3px 8px ${isActive ? "#3B82F640" : colors.icon + "40"}` }}>
                    {stage.status === "completed" ? <CheckCircleIcon sx={{ fontSize: 18 }} /> : stage.status === "failed" ? <CancelIcon sx={{ fontSize: 18 }} /> : stage.icon}
                  </Box>
                  <Box>
                    <Typography fontWeight={800} fontSize="0.82rem" sx={{ color: "#1E293B", lineHeight: 1.2 }}>{stage.label}</Typography>
                    <Typography fontSize="0.7rem" color="text.secondary">{stage.description}</Typography>
                  </Box>
                </Box>
                {(isActive || stage.status !== "pending") && (
                  <Chip label={isActive && stage.status === "pending" ? "IN PROGRESS" : stage.status.toUpperCase()} size="small"
                    sx={{ height: 20, fontSize: "0.58rem", fontWeight: 900, letterSpacing: "0.04em", bgcolor: isActive && stage.status === "pending" ? "#DBEAFE" : colors.chipBg, color: isActive && stage.status === "pending" ? "#1D4ED8" : colors.chipText }} />
                )}
              </Box>

              <Divider sx={{ borderColor: "#F1F5F9" }} />

              {/* Substages */}
              <Box sx={{ px: 2, pt: 1.5, pb: 1, position: "relative" }}>
                {/* Vertical stepper line */}
                <Box sx={{ position: "absolute", top: 28, left: 22, bottom: 20, width: 2, bgcolor: "#E2E8F0", zIndex: 1 }} />
                <Stack spacing={1}>
                  {stage.substages.map((sub, si) => <SubstageRow key={si} sub={sub} />)}
                </Stack>
              </Box>

              {/* Footer */}
              <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px", bgcolor: "#F8FAFC" }}>
                <Box display="flex" alignItems="center" gap={0.3} sx={{ cursor: "pointer", "&:hover": { opacity: 0.7 } }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.6rem" }}>Details</Typography>
                  <ChevronRightIcon sx={{ fontSize: 14 }} />
                </Box>
              </Box>
            </Paper>

            {/* Connector between cards */}
            {idx < stages.length - 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", my: 0.5 }}>
                <Box sx={{ width: 2, height: 16, bgcolor: "#CBD5E1" }} />
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── ERD Entity Node ─────────────────────────────────────────────────────────
function EntityNode({ id, data, selected }) {
  const { onUpdateField, onAddField, onRemoveField } = data;
  const isViewer = Boolean(data.isViewer);
  const connectionStartHandle = useStore(s => s.connectionStartHandle);
  const isConnecting = !!connectionStartHandle;

  const [hovered, setHovered] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(data.label);
  const [editingField, setEditingField] = React.useState(null); // { index, part: 'name' | 'type' }
  const [fieldDraft, setFieldDraft] = React.useState("");

  React.useEffect(() => { setDraft(data.label); }, [data.label]);

  const commit = () => {
    if (isViewer) {
      setEditing(false);
      setDraft(data.label);
      return;
    }
    setEditing(false);
    if (draft.trim() && draft !== data.label) data.onUpdateLabel?.(draft.trim());
  };

  const commitField = () => {
    if (isViewer) {
      setEditingField(null);
      setFieldDraft("");
      return;
    }
    if (editingField) {
      const { index, part } = editingField;
      if (fieldDraft.trim()) onUpdateField(index, part, fieldDraft.trim());
    }
    setEditingField(null);
  };

  return (
    <Box 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{ minWidth: 240, borderRadius: "10px", overflow: "visible", border: selected ? "2px solid #3B82F6" : "1.5px solid #CBD5E1", boxShadow: selected ? "0 0 0 3px rgba(59,130,246,0.15), 0 8px 24px rgba(0,0,0,0.12)" : "0 4px 16px rgba(0,0,0,0.08)", bgcolor: "white", transition: "box-shadow 0.2s", position: 'relative' }}
    >
      {/* Corner Handles */}
      <>
        <Handle type="target" position={Position.Top} id="tl-target" style={{ left: 0, top: 0, background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: isViewer ? 0 : ((selected || hovered || isConnecting) ? 1 : 0.4) }} />
        <Handle type="source" position={Position.Top} id="tl-source" style={{ left: 0, top: 0, background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: isViewer ? 0 : ((selected || hovered || isConnecting) ? 1 : 0.4) }} />
        <Handle type="target" position={Position.Top} id="tr-target" style={{ left: '100%', top: 0, background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: isViewer ? 0 : ((selected || hovered || isConnecting) ? 1 : 0.4) }} />
        <Handle type="source" position={Position.Top} id="tr-source" style={{ left: '100%', top: 0, background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: isViewer ? 0 : ((selected || hovered || isConnecting) ? 1 : 0.4) }} />
        <Handle type="target" position={Position.Bottom} id="bl-target" style={{ left: 0, top: '100%', background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: isViewer ? 0 : ((selected || hovered || isConnecting) ? 1 : 0.4) }} />
        <Handle type="source" position={Position.Bottom} id="bl-source" style={{ left: 0, top: '100%', background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: isViewer ? 0 : ((selected || hovered || isConnecting) ? 1 : 0.4) }} />
        <Handle type="target" position={Position.Bottom} id="br-target" style={{ left: '100%', top: '100%', background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: isViewer ? 0 : ((selected || hovered || isConnecting) ? 1 : 0.4) }} />
        <Handle type="source" position={Position.Bottom} id="br-source" style={{ left: '100%', top: '100%', background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: isViewer ? 0 : ((selected || hovered || isConnecting) ? 1 : 0.4) }} />
      </>

      <Box sx={{ bgcolor: data.color || "#1E293B", px: 2, py: 1.5, position: "relative" }} onDoubleClick={() => { if (!isViewer) setEditing(true); }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.2}>
            <TableChartIcon sx={{ color: "white", fontSize: 16, opacity: 0.9 }} />
            <Box>
              {editing && !isViewer ? (
                <TextField 
                  className="nodrag"
                  autoFocus
                  variant="standard" 
                  size="small" 
                  value={draft} 
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commit}
                  onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(data.label); setEditing(false); } }}
                  sx={{ "& .MuiInput-input": { color: "white", fontWeight: 900, fontSize: "0.75rem", p: 0, letterSpacing: "0.02em" } }}
                  InputProps={{ disableUnderline: true }}
                />
              ) : (
                <Typography sx={{ color: "white", fontWeight: 900, fontSize: "0.75rem", letterSpacing: "0.02em" }}>{data.label}</Typography>
              )}
              <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.55rem", fontWeight: 900, letterSpacing: "0.1em", mt: -0.2 }}>TABLE</Typography>
            </Box>
          </Box>
          {selected && !isViewer && (
            <Select 
              className="nodrag"
              variant="standard" 
              size="small" 
              value={data.tableType || "TABLE"} 
              onChange={(e) => data.onUpdateTableType?.(e.target.value)}
              sx={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.8)", fontWeight: 900, bgcolor: "rgba(255,255,255,0.1)", px: 1, borderRadius: 1 }}
              disableUnderline
            >
              {TABLE_TYPES.map(t => <MenuItem key={t} value={t} sx={{ fontSize: "0.6rem" }}>{t}</MenuItem>)}
            </Select>
          )}
        </Box>
      </Box>

      <Box sx={{ bgcolor: "white", py: 0.5 }}>
        {data.fields?.map((field, i) => (
          <Box key={i} sx={{ px: 2, py: 0.6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, position: "relative" }}>
            {/* Left Handle - Target */}
            <Handle 
              type="target" 
              position={Position.Left} 
              id={`${field.name}-target`} 
              style={{ left: -10, top: "50%", background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: isViewer ? 0 : ((selected || hovered || isConnecting) ? 1 : 0.4), transition: 'opacity 0.2s', zIndex: 10 }} 
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }} onDoubleClick={() => { if (!isViewer) { setEditingField({ index: i, part: 'name' }); setFieldDraft(field.name); } }}>
              {field.isPrimary && <KeyIcon sx={{ fontSize: 11, color: "#FBBF24" }} />}
              {(editingField?.index === i && editingField?.part === 'name') ? (
                <TextField 
                  className="nodrag"
                  autoFocus
                  variant="standard" 
                  size="small" 
                  value={fieldDraft} 
                  onChange={(e) => setFieldDraft(e.target.value)}
                  onBlur={commitField}
                  onKeyDown={(e) => { if (e.key === "Enter") commitField(); if (e.key === "Escape") setEditingField(null); }}
                  sx={{ flex: 1, "& .MuiInput-input": { fontSize: "0.78rem", fontWeight: field.isPrimary ? 800 : 500, p: 0, color: "#334155" } }}
                  InputProps={{ disableUnderline: true }}
                />
              ) : (
                <Typography sx={{ fontSize: "0.78rem", fontWeight: field.isPrimary ? 800 : 500, color: "#334155" }}>{field.name}</Typography>
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {(editingField?.index === i && editingField?.part === 'type' && !isViewer) ? (
                <Select 
                  className="nodrag"
                  autoFocus
                  variant="standard" 
                  size="small" 
                  value={fieldDraft} 
                  onChange={(e) => { onUpdateField(i, "type", e.target.value); setEditingField(null); }}
                  onBlur={() => setEditingField(null)}
                  sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#64748B", bgcolor: "#F1F5F9", px: 0.8, borderRadius: 1 }}
                  disableUnderline
                >
                  {FIELD_TYPES.map(t => <MenuItem key={t} value={t} sx={{ fontSize: "0.65rem" }}>{t}</MenuItem>)}
                </Select>
              ) : (
                <Box 
                  onClick={() => { if (!isViewer) { setEditingField({ index: i, part: 'type' }); setFieldDraft(field.type); } }}
                  sx={{ 
                    fontSize: "0.65rem", fontWeight: 700, color: "#64748B", 
                    bgcolor: "#F1F5F9", px: 0.8, py: 0.2, borderRadius: 1, 
                    cursor: isViewer ? "default" : "pointer", display: "flex", alignItems: "center", gap: 0.2,
                    "&:hover": isViewer ? undefined : { bgcolor: "#E2E8F0" }
                  }}
                >
                  <Typography sx={{ fontSize: "inherit", fontWeight: "inherit" }}>{field.type}</Typography>
                  {!isViewer && <ArrowDropDownIcon sx={{ fontSize: 14, color: "#94A3B8" }} />}
                </Box>
              )}
              {selected && !isViewer && (
                <IconButton size="small" onClick={() => onRemoveField(i)} className="nodrag" sx={{ p: 0.2, color: "#EF4444", opacity: 0.5, "&:hover": { opacity: 1 } }}>
                  <DeleteIcon sx={{ fontSize: 10 }} />
                </IconButton>
              )}
            </Box>

            <Handle 
              type="source" 
              position={Position.Right} 
              id={`${field.name}-source`} 
              style={{ right: -10, top: "50%", background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: isViewer ? 0 : ((selected || hovered || isConnecting) ? 1 : 0.4), transition: 'opacity 0.2s', zIndex: 10 }} 
            />
          </Box>
        ))}
        
        {selected && !isViewer && (
          <Box sx={{ p: 1, display: "flex", justifyContent: "center", borderTop: "1px dashed #E2E8F0" }}>
            <Button 
              className="nodrag"
              size="small" 
              startIcon={<AddIcon sx={{ fontSize: 10 }} />} 
              onClick={() => onAddField()}
              sx={{ fontSize: "0.55rem", textTransform: "none", py: 0 }}
            >
              Add Field
            </Button>
          </Box>
        )}

        {(!data.fields || data.fields.length === 0) && !selected && (
          <Box sx={{ px: 2, py: 1.5, textAlign: "center" }}><Typography sx={{ fontSize: "0.65rem", color: "#CBD5E1", fontStyle: "italic" }}>No fields</Typography></Box>
        )}
      </Box>
    </Box>
  );
}


// ─── Overview Entity Node — inline-editable name, handles for connections ─────────
// Click once to select; double-click to edit the name inline.
function OverviewEntityNode({ data, selected }) {
  const [hovered, setHovered] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(data.label);

  // Keep draft in sync when label changes externally
  React.useEffect(() => { setDraft(data.label); }, [data.label]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== data.label) data.onLabelChange?.(draft.trim());
  };

  return (
    <Box 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        borderRadius: "12px", overflow: "hidden",
        border: selected ? "2.5px solid #3B82F6" : "2px solid rgba(0,0,0,0)",
        boxShadow: selected
          ? "0 0 0 3px rgba(59,130,246,0.2), 0 8px 24px rgba(0,0,0,0.14)"
          : "0 4px 20px rgba(0,0,0,0.12)",
        transition: "all 0.2s", minWidth: 170,
      }}>
      <Handle type="target" position={Position.Top}    id="top-target" style={{ background: "#94A3B8", width: 8, height: 8, top: -4, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="source" position={Position.Top}    id="top-source" style={{ background: "#94A3B8", width: 8, height: 8, top: -4, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ background: "#94A3B8", width: 8, height: 8, bottom: -4, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: "#94A3B8", width: 8, height: 8, bottom: -4, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="target" position={Position.Right}  id="right-target" style={{ background: "#94A3B8", width: 8, height: 8, right: -4, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="source" position={Position.Right}  id="right-source" style={{ background: "#94A3B8", width: 8, height: 8, right: -4, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="target" position={Position.Left}   id="left-target" style={{ background: "#94A3B8", width: 8, height: 8, left: -4, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="source" position={Position.Left}   id="left-source" style={{ background: "#94A3B8", width: 8, height: 8, left: -4, opacity: (selected || hovered) ? 1 : 0 }} />

      {/* Corner Handles */}
      <Handle type="target" position={Position.Top} id="tl-target" style={{ left: 0, top: 0, background: "#94A3B8", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="source" position={Position.Top} id="tl-source" style={{ left: 0, top: 0, background: "#94A3B8", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="target" position={Position.Top} id="tr-target" style={{ left: '100%', top: 0, background: "#94A3B8", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="source" position={Position.Top} id="tr-source" style={{ left: '100%', top: 0, background: "#94A3B8", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="target" position={Position.Bottom} id="bl-target" style={{ left: 0, top: '100%', background: "#94A3B8", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="source" position={Position.Bottom} id="bl-source" style={{ left: 0, top: '100%', background: "#94A3B8", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="target" position={Position.Bottom} id="br-target" style={{ left: '100%', top: '100%', background: "#94A3B8", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="source" position={Position.Bottom} id="br-source" style={{ left: '100%', top: '100%', background: "#94A3B8", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />

      <Box sx={{ bgcolor: data.color || "#1E293B", px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.2, cursor: "default", position: "relative" }}
           onDoubleClick={() => setEditing(true)}>
        <TableChartIcon sx={{ color: "white", fontSize: 16, opacity: 0.85, flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          {editing ? (
            <input
              className="nodrag"
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(data.label); setEditing(false); } }}
              onClick={e => e.stopPropagation()}
              style={{
                background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.6)",
                borderRadius: 4, color: "white", fontWeight: 900, fontSize: "0.75rem",
                padding: "2px 8px", outline: "none", width: "100%", fontFamily: "inherit"
              }}
            />
          ) : (
            <Typography sx={{ color: "white", fontWeight: 900, fontSize: "0.75rem", letterSpacing: "0.02em" }}>{data.label}</Typography>
          )}
          <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.5rem", fontWeight: 900, letterSpacing: "0.1em", mt: -0.2 }}>TABLE</Typography>
        </Box>
        {!editing && (
          <EditIcon
            sx={{ color: "rgba(255,255,255,0.6)", fontSize: 11, opacity: 0, transition: "opacity 0.15s",
                  ".entity-overview-node:hover &": { opacity: 1 } }}
            onClick={e => { e.stopPropagation(); setEditing(true); }}
          />
        )}
      </Box>
    </Box>
  );
}


// ─── Conceptual Node — Lucidchart-style high-level entity ──────────────────
function ConceptualNode({ data, selected }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(data.label);
  const [hovered, setHovered] = React.useState(false);
  const connectionStartHandle = useStore((s) => s.connectionStartHandle);
  const isConnecting = !!connectionStartHandle;

  React.useEffect(() => { setDraft(data.label); }, [data.label]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== data.label) data.onLabelChange?.(draft.trim());
  };

  return (
    <Box 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        minWidth: 160, minHeight: 60,
        bgcolor: "white",
        borderRadius: 1, // 4px curve
        border: selected ? "2px solid #3B82F6" : "1px solid #94A3B8",
        display: "flex", alignItems: "center", justifyContent: "center",
        px: 2, py: 1.5,
        boxShadow: selected ? "0 0 0 4px rgba(59,130,246,0.1), 0 4px 12px rgba(0,0,0,0.1)" : "0 2px 6px rgba(0,0,0,0.06)",
        transition: "all 0.2s ease"
      }}>
      {!data.hideHandles && (
        <>
          <Handle type="target" position={Position.Top} id="top-target" style={{ ...FLOATING_HANDLE_STYLE, left: "50%", top: 0, width: "calc(100% - 18px)", height: 18, transform: "translate(-50%, -50%)" }} />
          <Handle type="source" position={Position.Top} id="top-source" style={{ ...FLOATING_HANDLE_STYLE, left: "50%", top: 0, width: "calc(100% - 18px)", height: 18, transform: "translate(-50%, -50%)" }} />
          <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ ...FLOATING_HANDLE_STYLE, left: "50%", top: "100%", width: "calc(100% - 18px)", height: 18, transform: "translate(-50%, -50%)" }} />
          <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ ...FLOATING_HANDLE_STYLE, left: "50%", top: "100%", width: "calc(100% - 18px)", height: 18, transform: "translate(-50%, -50%)" }} />
          <Handle type="target" position={Position.Right} id="right-target" style={{ ...FLOATING_HANDLE_STYLE, left: "100%", top: "50%", width: 18, height: "calc(100% - 18px)", transform: "translate(-50%, -50%)" }} />
          <Handle type="source" position={Position.Right} id="right-source" style={{ ...FLOATING_HANDLE_STYLE, left: "100%", top: "50%", width: 18, height: "calc(100% - 18px)", transform: "translate(-50%, -50%)" }} />
          <Handle type="target" position={Position.Left} id="left-target" style={{ ...FLOATING_HANDLE_STYLE, left: 0, top: "50%", width: 18, height: "calc(100% - 18px)", transform: "translate(-50%, -50%)" }} />
          <Handle type="source" position={Position.Left} id="left-source" style={{ ...FLOATING_HANDLE_STYLE, left: 0, top: "50%", width: 18, height: "calc(100% - 18px)", transform: "translate(-50%, -50%)" }} />
        </>
      )}

      <Box sx={{ textAlign: "center", cursor: "default", width: "100%" }} onDoubleClick={() => setEditing(true)}>
        {editing ? (
          <input
            className="nodrag"
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === "Enter") commit(); }}
            style={{ width: "100%", border: "none", outline: "none", textAlign: "center", fontWeight: 700, fontSize: "0.75rem", color: "#1E293B" }}
          />
        ) : (
          <Typography fontWeight={700} fontSize="0.85rem" color="#1E293B" sx={{ wordBreak: "break-word" }}>{data.label}</Typography>
        )}
      </Box>
    </Box>
  );
}

// ─── Note Node — Floating comment/note ───────────────────────────────────────
function NoteNode({ data, selected }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(data.label);
  const [hovered, setHovered] = React.useState(false);

  React.useEffect(() => { setDraft(data.label); }, [data.label]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== data.label) data.onNoteChange?.(draft.trim());
  };

  return (
    <Box 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        minWidth: 140, minHeight: 60,
        bgcolor: "#FEF9C3", // Post-it yellow
        borderRadius: 0, // Square corners for notes usually look better if slightly turned
        border: selected ? "2px solid #EAB308" : "1px solid #FDE047",
        p: 1.5,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        transform: "rotate(-1deg)",
        transition: "all 0.2s ease",
        position: 'relative'
      }}>
      <Box sx={{ cursor: "default", height: "100%" }} onDoubleClick={() => setEditing(true)}>
        {editing ? (
          <textarea
            className="nodrag"
            autoFocus
            rows={3}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontStyle: "italic", fontSize: "0.65rem", color: "#854D0E", resize: "none" }}
          />
        ) : (
          <Typography variant="caption" sx={{ fontStyle: "italic", color: "#854D0E", fontWeight: 600, display: "block", textAlign: "left", lineHeight: 1.3, whiteSpace: "pre-wrap" }}>
            {data.label || "Add a comment..."}
          </Typography>
        )}
      </Box>
      <Handle type="target" position={Position.Top}    id="top-target" style={{ background: "#EAB308", opacity: (selected || hovered) ? 1 : 0, transition: "opacity 0.2s" }} />
      <Handle type="source" position={Position.Top}    id="top-source" style={{ background: "#EAB308", opacity: (selected || hovered) ? 1 : 0, transition: "opacity 0.2s" }} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ background: "#EAB308", opacity: (selected || hovered) ? 1 : 0, transition: "opacity 0.2s" }} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: "#EAB308", opacity: (selected || hovered) ? 1 : 0, transition: "opacity 0.2s" }} />
      <Handle type="target" position={Position.Left}   id="left-target" style={{ background: "#EAB308", opacity: (selected || hovered) ? 1 : 0, transition: "opacity 0.2s" }} />
      <Handle type="source" position={Position.Left}   id="left-source" style={{ background: "#EAB308", opacity: (selected || hovered) ? 1 : 0, transition: "opacity 0.2s" }} />
      <Handle type="target" position={Position.Right}  id="right-target" style={{ background: "#EAB308", opacity: (selected || hovered) ? 1 : 0, transition: "opacity 0.2s" }} />
      <Handle type="source" position={Position.Right}  id="right-source" style={{ background: "#EAB308", opacity: (selected || hovered) ? 1 : 0, transition: "opacity 0.2s" }} />

      {/* Corner Handles */}
      <Handle type="target" position={Position.Top} id="tl-target" style={{ left: 0, top: 0, background: "#EAB308", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="source" position={Position.Top} id="tl-source" style={{ left: 0, top: 0, background: "#EAB308", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="target" position={Position.Top} id="tr-target" style={{ left: '100%', top: 0, background: "#EAB308", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="source" position={Position.Top} id="tr-source" style={{ left: '100%', top: 0, background: "#EAB308", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="target" position={Position.Bottom} id="bl-target" style={{ left: 0, top: '100%', background: "#EAB308", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="source" position={Position.Bottom} id="bl-source" style={{ left: 0, top: '100%', background: "#EAB308", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="target" position={Position.Bottom} id="br-target" style={{ left: '100%', top: '100%', background: "#EAB308", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="source" position={Position.Bottom} id="br-source" style={{ left: '100%', top: '100%', background: "#EAB308", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
    </Box>
  );
}


// ─── Text Box Node — Clean borderless text ──────────────────────────────────
function TextBoxNode({ data, selected }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(data.label);
  const [hovered, setHovered] = React.useState(false);

  React.useEffect(() => { setDraft(data.label); }, [data.label]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== data.label) data.onTextChange?.(draft.trim());
  };

  return (
    <Box 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        minWidth: 80,
        p: 1,
        bgcolor: "white",
        borderRadius: 1,
        border: selected ? "2px solid #3B82F6" : "1px solid #94A3B8",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        position: 'relative'
      }}>
      <Box sx={{ cursor: "default" }} onDoubleClick={() => setEditing(true)}>
        {editing ? (
          <textarea
            className="nodrag"
            autoFocus
            rows={1}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "0.75rem", color: "#1E293B", resize: "none", textAlign: "center", fontWeight: 700 }}
          />
        ) : (
          <Typography sx={{ fontSize: "0.75rem", color: "#1E293B", fontWeight: 700, display: "block", textAlign: "center" }}>
            {data.label || "Add text..."}
          </Typography>
        )}
      </Box>
      <Handle type="target" position={Position.Top}    id="top-target" style={{ background: "#3B82F6", opacity: (selected || hovered) ? 1 : 0, transition: "opacity 0.2s" }} />
      <Handle type="source" position={Position.Top}    id="top-source" style={{ background: "#3B82F6", opacity: (selected || hovered) ? 1 : 0, transition: "opacity 0.2s" }} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ background: "#3B82F6", opacity: (selected || hovered) ? 1 : 0, transition: "opacity 0.2s" }} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: "#3B82F6", opacity: (selected || hovered) ? 1 : 0, transition: "opacity 0.2s" }} />
      <Handle type="target" position={Position.Left}   id="left-target" style={{ background: "#3B82F6", opacity: (selected || hovered) ? 1 : 0, transition: "opacity 0.2s" }} />
      <Handle type="source" position={Position.Left}   id="left-source" style={{ background: "#3B82F6", opacity: (selected || hovered) ? 1 : 0, transition: "opacity 0.2s" }} />
      <Handle type="target" position={Position.Right}  id="right-target" style={{ background: "#3B82F6", opacity: (selected || hovered) ? 1 : 0, transition: "opacity 0.2s" }} />
      <Handle type="source" position={Position.Right}  id="right-source" style={{ background: "#3B82F6", opacity: (selected || hovered) ? 1 : 0, transition: "opacity 0.2s" }} />

      {/* Corner Handles */}
      <Handle type="target" position={Position.Top} id="tl-target" style={{ left: 0, top: 0, background: "#3B82F6", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="source" position={Position.Top} id="tl-source" style={{ left: 0, top: 0, background: "#3B82F6", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="target" position={Position.Top} id="tr-target" style={{ left: '100%', top: 0, background: "#3B82F6", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="source" position={Position.Top} id="tr-source" style={{ left: '100%', top: 0, background: "#3B82F6", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="target" position={Position.Bottom} id="bl-target" style={{ left: 0, top: '100%', background: "#3B82F6", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="source" position={Position.Bottom} id="bl-source" style={{ left: 0, top: '100%', background: "#3B82F6", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="target" position={Position.Bottom} id="br-target" style={{ left: '100%', top: '100%', background: "#3B82F6", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
      <Handle type="source" position={Position.Bottom} id="br-source" style={{ left: '100%', top: '100%', background: "#3B82F6", width: 8, height: 8, opacity: (selected || hovered) ? 1 : 0 }} />
    </Box>
  );
}


function SourceNode({ data, selected }) {
  return (
    <Box sx={{ minWidth: 160, bgcolor: "white", border: selected ? "2px solid #3B82F6" : "1.5px solid #E2E8F0", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <Box sx={{ bgcolor: "#F8FAFC", px: 1.5, py: 1, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#3B82F6" }} />
        <Typography variant="caption" fontWeight={800} color="#1E293B">{data.label}</Typography>
      </Box>
      <Box sx={{ p: 1 }}>
        {(data.fields || []).map((f, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", py: 0.5, position: "relative" }}>
            <Typography variant="caption" fontSize="0.68rem" fontWeight={600} color="#64748B">{f.name}</Typography>
            <Handle type="source" position={Position.Right} id={`${f.name}-source`} style={{ right: -12, top: "50%", background: "#3B82F6", width: 6, height: 6 }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function TargetNode({ data, selected }) {
  return (
    <Box sx={{ minWidth: 160, bgcolor: "white", border: selected ? "2px solid #10B981" : "1.5px solid #E2E8F0", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <Box sx={{ bgcolor: "#F0FDF4", px: 1.5, py: 1, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderBottom: "1px solid #DCFCE7", display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10B981" }} />
        <Typography variant="caption" fontWeight={800} color="#1E293B">{data.label}</Typography>
      </Box>
      <Box sx={{ p: 1 }}>
        {(data.fields || []).map((f, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", py: 0.5, position: "relative" }}>
            <Handle type="target" position={Position.Left} id={`${f.name}-target`} style={{ left: -12, top: "50%", background: "#10B981", width: 6, height: 6 }} />
            <Typography variant="caption" fontSize="0.68rem" fontWeight={600} color="#64748B">{f.name}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function ValidationNode({ data }) {
  const status = data.validationStatus || "pending";
  const colors = { pass: "#10B981", warn: "#F59E0B", fail: "#EF4444", pending: "#94A3B8" };
  const color = colors[status];
  
  return (
    <Box sx={{ minWidth: 200, borderRadius: "10px", overflow: "hidden", border: `2px solid ${color}`, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", bgcolor: "white" }}>
      <Box sx={{ bgcolor: data.color || "#1E293B", px: 2, py: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ color: "white", fontWeight: 700, fontSize: "0.7rem" }}>{data.label}</Typography>
        <Chip 
          label={status.toUpperCase()} 
          size="small" 
          sx={{ height: 16, fontSize: "0.55rem", fontWeight: 900, bgcolor: "white", color: color }} 
        />
      </Box>
      <Box sx={{ p: 1.5 }}>
        {data.metrics?.map((m, i) => (
          <Box key={i} display="flex" alignItems="center" gap={1} mb={0.5}>
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: colors[m.status] || color }} />
            <Typography sx={{ fontSize: "0.6rem", color: "#64748B" }}>{m.name}</Typography>
          </Box>
        ))}
        {(!data.metrics || data.metrics.length === 0) && (
          <Typography sx={{ fontSize: "0.6rem", color: "#94A3B8", fontStyle: "italic" }}>No specific issues found</Typography>
        )}
      </Box>
    </Box>
  );
}

// ─── Draw.io Style Nodes ───────────────────────────────────────────────────
function DrawEntityNode({ id, data, selected }) {
  const { label, fields, color, onAddField, onDeleteNode, onUpdateField, onRemoveField } = data;
  const isViewer = Boolean(data.isViewer);
  const connectionStartHandle = useStore(s => s.connectionStartHandle);
  const isConnecting = !!connectionStartHandle;

  const [hovered, setHovered] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(data.label);
  const [editingField, setEditingField] = React.useState(null); // { index, part: 'name' | 'type' }
  const [fieldDraft, setFieldDraft] = React.useState("");

  React.useEffect(() => { setDraft(data.label); }, [data.label]);

  const commit = () => {
    if (isViewer) {
      setEditing(false);
      setDraft(data.label);
      return;
    }
    setEditing(false);
    if (draft.trim() && draft !== data.label) data.onUpdateLabel?.(draft.trim());
  };

  const commitField = () => {
    if (isViewer) {
      setEditingField(null);
      setFieldDraft("");
      return;
    }
    if (editingField) {
      const { index, part } = editingField;
      if (fieldDraft.trim()) onUpdateField(id, index, part, fieldDraft.trim());
    }
    setEditingField(null);
  };

  return (
    <Box 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        minWidth: 180, bgcolor: "white",
        border: selected ? "2px solid #3B82F6" : "1.5px solid #CBD5E1",
        borderRadius: "8px", position: "relative", overflow: "visible",
        boxShadow: selected ? "0 8px 24px rgba(59,130,246,0.15)" : "0 4px 12px rgba(0,0,0,0.05)"
      }}
    >
      {/* Handles */}
      {!data.hideHandles && (
        <>
          {/* Corner Handles */}
          <Handle type="target" position={Position.Top} id="tl-target" style={{ left: 0, top: 0, background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: (selected || hovered || isConnecting) ? 1 : 0.4 }} />
          <Handle type="source" position={Position.Top} id="tl-source" style={{ left: 0, top: 0, background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: (selected || hovered || isConnecting) ? 1 : 0.4 }} />
          <Handle type="target" position={Position.Top} id="tr-target" style={{ left: '100%', top: 0, background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: (selected || hovered || isConnecting) ? 1 : 0.4 }} />
          <Handle type="source" position={Position.Top} id="tr-source" style={{ left: '100%', top: 0, background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: (selected || hovered || isConnecting) ? 1 : 0.4 }} />
          <Handle type="target" position={Position.Bottom} id="bl-target" style={{ left: 0, top: '100%', background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: (selected || hovered || isConnecting) ? 1 : 0.4 }} />
          <Handle type="source" position={Position.Bottom} id="bl-source" style={{ left: 0, top: '100%', background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: (selected || hovered || isConnecting) ? 1 : 0.4 }} />
          <Handle type="target" position={Position.Bottom} id="br-target" style={{ left: '100%', top: '100%', background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: (selected || hovered || isConnecting) ? 1 : 0.4 }} />
          <Handle type="source" position={Position.Bottom} id="br-source" style={{ left: '100%', top: '100%', background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: (selected || hovered || isConnecting) ? 1 : 0.4 }} />
        </>
      )}

      {/* Header */}
      <Box sx={{ 
        bgcolor: color || "#F1F5F9", px: 1.5, py: 1, 
        borderTopLeftRadius: "7px", borderTopRightRadius: "7px",
        display: "flex", alignItems: "center", justifyContent: "space-between" 
      }} onDoubleClick={() => { if (!isViewer) setEditing(true); }}>
        {editing && !isViewer ? (
          <TextField 
            className="nodrag"
            autoFocus
            variant="standard" 
            size="small" 
            value={draft} 
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(data.label); setEditing(false); } }}
            sx={{ "& .MuiInput-input": { color: "white", fontWeight: 800, fontSize: "0.75rem", p: 0 } }}
            InputProps={{ disableUnderline: true }}
          />
        ) : (
          <Typography variant="caption" fontWeight={800} sx={{ color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>{label}</Typography>
        )}
        {!isViewer && (
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddField(id); }} sx={{ width: 18, height: 18, bgcolor: "rgba(255,255,255,0.5)", "&:hover": { bgcolor: "white" } }}>
              <AddIcon sx={{ fontSize: 10 }} />
            </IconButton>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDeleteNode(id); }} sx={{ width: 18, height: 18, bgcolor: "rgba(255,255,255,0.5)", "&:hover": { bgcolor: "#FEE2E2", color: "#EF4444" } }}>
              <CloseIcon sx={{ fontSize: 10 }} />
            </IconButton>
          </Stack>
        )}
      </Box>

      {/* Fields */}
      <Box sx={{ p: 1 }}>
        <Stack spacing={0.5}>
          {(fields || []).map((f, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 0.8, py: 0.2, bgcolor: "#F8FAFC", borderRadius: "4px", border: "1px solid #F1F5F9", position: "relative" }}>
              {/* Left Handle (Target) — unique per node+field */}
              <Handle 
                type="target" 
                position={Position.Left} 
                id={`${id}-${i}-left-target`} 
                style={{ left: -10, top: "50%", background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: isViewer ? 0 : ((selected || hovered || isConnecting) ? 1 : 0.4), transition: 'opacity 0.2s', zIndex: 10 }} 
              />
              <Handle 
                type="source" 
                position={Position.Left} 
                id={`${id}-${i}-left-source`} 
                style={{ left: -10, top: "50%", background: "transparent", width: 10, height: 10, border: "none", zIndex: 11, opacity: 0 }} 
              />

              <TextField
                className="nodrag"
                fullWidth
                variant="standard" 
                value={f.name}
                onChange={(e) => onUpdateField(id, i, "name", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddField(id);
                  }
                }}
                InputProps={{ 
                  disableUnderline: true,
                  sx: { fontSize: "0.6rem", color: "#475569", fontWeight: 700, px: 0 }
                }}
                size="small"
                disabled={isViewer}
              />
              {!isViewer && (
                <IconButton size="small" onClick={() => onRemoveField(id, i)} className="nodrag" sx={{ opacity: 0.4, "&:hover": { opacity: 1, color: "error.main" }, ml: "auto" }}>
                  <DeleteIcon sx={{ fontSize: 11 }} />
                </IconButton>
              )}
              {/* Right Handle (Source + Target) — unique per node+field */}
              <Handle 
                type="source" 
                position={Position.Right} 
                id={`${id}-${i}-right-source`} 
                style={{ right: -10, top: "50%", background: "#3B82F6", width: 10, height: 10, border: "2px solid white", opacity: isViewer ? 0 : ((selected || hovered || isConnecting) ? 1 : 0.4), transition: 'opacity 0.2s', zIndex: 10 }} 
              />
              <Handle 
                type="target" 
                position={Position.Right} 
                id={`${id}-${i}-right-target`} 
                style={{ right: -10, top: "50%", background: "transparent", width: 10, height: 10, border: "none", zIndex: 11, opacity: isViewer ? 0 : 1 }} 
              />
            </Box>
          ))}
          {(!fields || fields.length === 0) && (
            <Typography sx={{ fontSize: "0.55rem", color: "#CBD5E1", fontStyle: "italic", textAlign: "center", py: 0.5 }}>No fields</Typography>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

function DrawBoxNode({ data, selected }) {
  return (
    <Box sx={{
      width: 120, height: 50, bgcolor: data.color || "#F1F5F9",
      border: selected ? "2px solid #3B82F6" : "1.5px solid #64748B",
      display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: "4px", position: "relative"
    }}>
      <Typography variant="caption" fontWeight={700} color="#1E293B">{data.label}</Typography>
      <Handle type="target" position={Position.Top}    id="top-target" style={{ background: "#64748B" }} />
      <Handle type="source" position={Position.Top}    id="top-source" style={{ background: "#64748B" }} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ background: "#64748B" }} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: "#64748B" }} />
      <Handle type="target" position={Position.Left}   id="left-target" style={{ background: "#64748B" }} />
      <Handle type="source" position={Position.Left}   id="left-source" style={{ background: "#64748B" }} />
      <Handle type="target" position={Position.Right}  id="right-target" style={{ background: "#64748B" }} />
      <Handle type="source" position={Position.Right}  id="right-source" style={{ background: "#64748B" }} />

      {/* Corner Handles */}
      <Handle type="target" position={Position.Top} id="tl-target" style={{ left: 0, top: 0, background: "#64748B", width: 8, height: 8 }} />
      <Handle type="source" position={Position.Top} id="tl-source" style={{ left: 0, top: 0, background: "#64748B", width: 8, height: 8 }} />
      <Handle type="target" position={Position.Top} id="tr-target" style={{ left: '100%', top: 0, background: "#64748B", width: 8, height: 8 }} />
      <Handle type="source" position={Position.Top} id="tr-source" style={{ left: '100%', top: 0, background: "#64748B", width: 8, height: 8 }} />
      <Handle type="target" position={Position.Bottom} id="bl-target" style={{ left: 0, top: '100%', background: "#64748B", width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} id="bl-source" style={{ left: 0, top: '100%', background: "#64748B", width: 8, height: 8 }} />
      <Handle type="target" position={Position.Bottom} id="br-target" style={{ left: '100%', top: '100%', background: "#64748B", width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} id="br-source" style={{ left: '100%', top: '100%', background: "#64748B", width: 8, height: 8 }} />
    </Box>
  );
}

function DrawOvalNode({ data, selected }) {
  return (
    <Box sx={{
      width: 120, height: 60, bgcolor: data.color || "#F1F5F9",
      border: selected ? "2px solid #3B82F6" : "1.5px solid #64748B",
      display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: "50%", position: "relative"
    }}>
      <Typography variant="caption" fontWeight={700} color="#1E293B">{data.label}</Typography>
      <Handle type="target" position={Position.Top}    id="top-target" style={{ background: "#64748B" }} />
      <Handle type="source" position={Position.Top}    id="top-source" style={{ background: "#64748B" }} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ background: "#64748B" }} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: "#64748B" }} />
      <Handle type="target" position={Position.Left}   id="left-target" style={{ background: "#64748B" }} />
      <Handle type="source" position={Position.Left}   id="left-source" style={{ background: "#64748B" }} />
      <Handle type="target" position={Position.Right}  id="right-target" style={{ background: "#64748B" }} />
      <Handle type="source" position={Position.Right}  id="right-source" style={{ background: "#64748B" }} />

      {/* Corner Handles */}
      <Handle type="target" position={Position.Top} id="tl-target" style={{ left: '15%', top: '15%', background: "#64748B", width: 8, height: 8 }} />
      <Handle type="source" position={Position.Top} id="tl-source" style={{ left: '15%', top: '15%', background: "#64748B", width: 8, height: 8 }} />
      <Handle type="target" position={Position.Top} id="tr-target" style={{ left: '85%', top: '15%', background: "#64748B", width: 8, height: 8 }} />
      <Handle type="source" position={Position.Top} id="tr-source" style={{ left: '85%', top: '15%', background: "#64748B", width: 8, height: 8 }} />
      <Handle type="target" position={Position.Bottom} id="bl-target" style={{ left: '15%', top: '85%', background: "#64748B", width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} id="bl-source" style={{ left: '15%', top: '85%', background: "#64748B", width: 8, height: 8 }} />
      <Handle type="target" position={Position.Bottom} id="br-target" style={{ left: '85%', top: '85%', background: "#64748B", width: 8, height: 8 }} />
      <Handle type="source" position={Position.Bottom} id="br-source" style={{ left: '85%', top: '85%', background: "#64748B", width: 8, height: 8 }} />
    </Box>
  );
}

function DrawDiamondNode({ data, selected }) {
  return (
    <Box sx={{
      width: 80, height: 80, position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <Box sx={{
        position: "absolute", inset: 0, bgcolor: data.color || "#F1F5F9",
        border: selected ? "2px solid #3B82F6" : "1.5px solid #64748B",
        transform: "rotate(45deg)", borderRadius: "4px"
      }} />
      <Typography variant="caption" fontWeight={700} color="#1E293B" sx={{ position: "relative", zIndex: 1 }}>{data.label}</Typography>
      <Handle type="target" position={Position.Top}    id="top-target" style={{ background: "#64748B", top: -4 }} />
      <Handle type="source" position={Position.Top}    id="top-source" style={{ background: "#64748B", top: -4 }} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ background: "#64748B", bottom: -4 }} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ background: "#64748B", bottom: -4 }} />
      <Handle type="target" position={Position.Left}   id="left-target" style={{ background: "#64748B", left: -4 }} />
      <Handle type="source" position={Position.Left}   id="left-source" style={{ background: "#64748B", left: -4 }} />
      <Handle type="target" position={Position.Right}  id="right-target" style={{ background: "#64748B", right: -4 }} />
      <Handle type="source" position={Position.Right}  id="right-source" style={{ background: "#64748B", right: -4 }} />

      {/* Corner Handles */}
      <Handle type="target" position={Position.Top} id="tl-target" style={{ left: 0, top: 0, background: "#64748B", width: 8, height: 8, transform: "translate(-50%, -50%) rotate(-45deg)" }} />
      <Handle type="source" position={Position.Top} id="tl-source" style={{ left: 0, top: 0, background: "#64748B", width: 8, height: 8, transform: "translate(-50%, -50%) rotate(-45deg)" }} />
      <Handle type="target" position={Position.Top} id="tr-target" style={{ left: '100%', top: 0, background: "#64748B", width: 8, height: 8, transform: "translate(50%, -50%) rotate(-45deg)" }} />
      <Handle type="source" position={Position.Top} id="tr-source" style={{ left: '100%', top: 0, background: "#64748B", width: 8, height: 8, transform: "translate(50%, -50%) rotate(-45deg)" }} />
      <Handle type="target" position={Position.Bottom} id="bl-target" style={{ left: 0, top: '100%', background: "#64748B", width: 8, height: 8, transform: "translate(-50%, 50%) rotate(-45deg)" }} />
      <Handle type="source" position={Position.Bottom} id="bl-source" style={{ left: 0, top: '100%', background: "#64748B", width: 8, height: 8, transform: "translate(-50%, 50%) rotate(-45deg)" }} />
      <Handle type="target" position={Position.Bottom} id="br-target" style={{ left: '100%', top: '100%', background: "#64748B", width: 8, height: 8, transform: "translate(50%, 50%) rotate(-45deg)" }} />
      <Handle type="source" position={Position.Bottom} id="br-source" style={{ left: '100%', top: '100%', background: "#64748B", width: 8, height: 8, transform: "translate(50%, 50%) rotate(-45deg)" }} />
    </Box>
  );
}

function CloudNode({ data }) {
  const isConnected = data.isConnected;
  return (
    <Box sx={{ width: 180, borderRadius: "12px", border: isConnected ? `2px solid ${data.color}` : "1.5px solid #E2E8F0", bgcolor: "white", p: 2, boxShadow: isConnected ? `0 4px 20px ${data.color}25` : "0 2px 10px rgba(0,0,0,0.05)", transition: "all 0.2s" }}>
      <Stack direction="row" spacing={2} alignItems="center" mb={1.5}>
        <Box sx={{ 
          width: 36, height: 36, borderRadius: "8px", 
          bgcolor: "white", 
          display: "flex", alignItems: "center", justifyContent: "center", 
          boxShadow: `0 4px 10px rgba(0,0,0,0.05)`,
          overflow: "hidden",
          border: "1px solid #E2E8F0"
        }}>
          {typeof data.logo === "string" ? (
            <Box component="img" src={data.logo} sx={{ width: "80%", height: "80%", objectFit: "contain" }} />
          ) : (
            data.logo
          )}
        </Box>
        <Typography fontWeight={800} fontSize="0.75rem">{data.name}</Typography>
      </Stack>
      <Typography fontSize="0.65rem" color="text.secondary" mb={1.5}>{data.desc}</Typography>
      <Chip 
        label={isConnected ? "CONNECTED" : "NOT CONFIGURED"} 
        size="small" 
        sx={{ height: 16, fontSize: "0.55rem", fontWeight: 900, bgcolor: isConnected ? "#D1FAE5" : "#F1F5F9", color: isConnected ? "#059669" : "#64748B" }} 
      />
      <Handle type="target" position={Position.Left} style={{ background: data.color, width: 8, height: 8 }} />
    </Box>
  );
}

// ─── Data Modeler Config Sidebar ───
function DataConfigSidebar({ 
  onClose, 
  onConfirm, 
  availableEngineers, 
  assignedUserIds, 
  onAssignMember,
  reviewerIds = [],
  onAssignReviewer,
  agentIds = [],
  availableAgents = [],
  onAssignAgent,
  onAddAgent
}) {
  const selectedAssignees = availableEngineers.filter((user) => assignedUserIds.includes(user.id));
  const selectedReviewers = availableEngineers.filter((user) => reviewerIds.includes(user.id));
  const assignedAgents = availableAgents.filter((agent) => agentIds.includes(agent.id));

  const handleAssigneeDropdownChange = (_, newSelectedUsers) => {
    const currentIds = new Set(assignedUserIds);
    const nextIds = new Set(newSelectedUsers.map((user) => user.id));

    availableEngineers.forEach((user) => {
      const wasSelected = currentIds.has(user.id);
      const isSelected = nextIds.has(user.id);
      if (wasSelected !== isSelected) {
        onAssignMember(user.id, isSelected);
      }
    });
  };

  const handleReviewerDropdownChange = (_, newSelectedUsers) => {
    const currentIds = new Set(reviewerIds);
    const nextIds = new Set(newSelectedUsers.map((user) => user.id));

    availableEngineers.forEach((user) => {
      const wasSelected = currentIds.has(user.id);
      const isSelected = nextIds.has(user.id);
      if (wasSelected !== isSelected) {
        onAssignReviewer(user.id, isSelected);
      }
    });
  };

  return (
    <Box sx={{ width: 400, height: "100%", display: "flex", flexDirection: "column", bgcolor: "#F8FAFC" }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E2E8F0", bgcolor: "white" }}>
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle1" fontWeight={800} color="#1E293B">
              Modeling Config
            </Typography>
            <Chip 
              label="STAGE 01" 
              size="small" 
              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900, borderRadius: 1, bgcolor: '#3B82F610', color: '#3B82F6' }} 
            />
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Assign team members for this modeling stage
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ bgcolor: "#F1F5F9" }}><CloseIcon fontSize="small" /></IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
        <Stack spacing={4}>
          {/* Personnel Section */}
          <Box>
            <Typography variant="caption" fontWeight={900} color="primary" sx={{ display: "block", mb: 2, letterSpacing: "0.08em" }}>
              Assignees
            </Typography>
            <Paper variant="outlined" sx={{ borderRadius: "12px", p: 2, bgcolor: "white", mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: "0.65rem", fontWeight: 500 }}>
                Search and select people to assign to this modeling stage.
              </Typography>
              <Autocomplete
                multiple
                fullWidth
                size="small"
                options={availableEngineers}
                value={selectedAssignees}
                disableCloseOnSelect
                onChange={handleAssigneeDropdownChange}
                getOptionLabel={(option) => option.name || option.email || `User ${option.id}`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props;
                  return (
                  <Box key={key} component="li" {...optionProps} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Checkbox size="small" checked={selected} sx={{ p: 0.5 }} />
                    <Avatar sx={{ width: 24, height: 24, fontSize: "0.68rem", bgcolor: "#3B82F6" }}>
                      {option.avatar || option.name?.charAt(0) || "U"}
                    </Avatar>
                    <Box>
                      <Typography fontSize="0.82rem" fontWeight={600}>{option.name}</Typography>
                      <Typography fontSize="0.68rem" color="text.secondary">{option.email || "No email"}</Typography>
                    </Box>
                  </Box>
                )}}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      size="small"
                      label={option.name}
                      sx={{ fontWeight: 600 }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select assignees"
                    placeholder="Search people"
                  />
                )}
              />
            </Paper>

            <Typography variant="caption" fontWeight={900} color="primary" sx={{ display: "block", mb: 2, letterSpacing: "0.08em" }}>
              Reviewers
            </Typography>
            <Paper variant="outlined" sx={{ borderRadius: "12px", p: 2, bgcolor: "white" }}>
              <Autocomplete
                multiple
                fullWidth
                size="small"
                options={availableEngineers}
                value={selectedReviewers}
                disableCloseOnSelect
                onChange={handleReviewerDropdownChange}
                getOptionLabel={(option) => option.name || option.email || `User ${option.id}`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props;
                  return (
                  <Box key={key} component="li" {...optionProps} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Checkbox size="small" checked={selected} sx={{ p: 0.5 }} />
                    <Avatar sx={{ width: 24, height: 24, fontSize: "0.68rem", bgcolor: "warning.main" }}>
                      {option.avatar || option.name?.charAt(0) || "U"}
                    </Avatar>
                    <Box>
                      <Typography fontSize="0.82rem" fontWeight={600}>{option.name}</Typography>
                      <Typography fontSize="0.68rem" color="text.secondary">{option.email || "No email"}</Typography>
                    </Box>
                  </Box>
                )}}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      size="small"
                      label={option.name}
                      sx={{ fontWeight: 600 }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select reviewers"
                    placeholder="Search people"
                  />
                )}
              />
            </Paper>
          </Box>

          {/* AI Agents Section */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="caption" fontWeight={900} color="primary" sx={{ letterSpacing: "0.08em" }}>
                AI Agents
              </Typography>
              <Button 
                size="small" 
                startIcon={<AddIcon sx={{ fontSize: '14px !important' }} />}
                onClick={onAddAgent}
                sx={{ fontSize: '10px', fontWeight: 800, textTransform: 'none', py: 0.2 }}
              >
                Add Agent
              </Button>
            </Box>
            <Paper variant="outlined" sx={{ borderRadius: "12px", p: 2, bgcolor: "white" }}>
              <Autocomplete
                multiple
                fullWidth
                size="small"
                options={availableAgents}
                value={assignedAgents}
                disableCloseOnSelect
                onChange={(_, newValue) => {
                  const currentIds = new Set(agentIds);
                  const nextIds = new Set(newValue.map(a => a.id));
                  availableAgents.forEach(agent => {
                    const wasSelected = currentIds.has(agent.id);
                    const isSelected = nextIds.has(agent.id);
                    if (wasSelected !== isSelected) {
                      onAssignAgent(agent.id, isSelected);
                    }
                  });
                }}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props;
                  return (
                  <Box key={key} component="li" {...optionProps} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Checkbox size="small" checked={selected} sx={{ p: 0.5 }} />
                    <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: "secondary.main" }}>
                      <SmartToyIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Box>
                      <Typography fontSize="0.82rem" fontWeight={600}>{option.name}</Typography>
                      <Typography fontSize="0.68rem" color="text.secondary">{option.type.toUpperCase()}</Typography>
                    </Box>
                  </Box>
                )}}
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
            </Paper>
          </Box>
        </Stack>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: "1px solid #E2E8F0", bgcolor: "white" }}>
        <Button fullWidth variant="contained" onClick={onConfirm} sx={{ textTransform: "none", fontWeight: 800, py: 1.2, borderRadius: "10px", boxShadow: "none" }}>
          Done
        </Button>
      </Box>
    </Box>
  );
}

// ─── Pipeline Stage Node ───────────────────────────────────────────────────
function PipelineStageNode({ data }) {
  const { stage, idx, onSelectStage, onOpenConfig } = data;
  
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Handle type="target" position={Position.Left} style={{ visibility: "hidden" }} />
      <Paper
        elevation={0}
        onClick={() => onSelectStage(stage.id)}
        sx={{
          width: 250,
          borderRadius: "14px", border: "1.5px solid", position: "relative", overflow: "visible", cursor: "pointer",
          borderColor: "#E0E7FF", bgcolor: "white",
          boxShadow: "0 2px 12px rgba(99,102,241,0.07)",
          transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: "0 16px 36px rgba(99,102,241,0.14)",
            borderColor: `${STAGE_ACCENT[idx]?.badge || "#6366F1"}60`,
          },
        }}
      >
        {/* Sequence Badge */}
        <Box sx={{
          position: "absolute", top: -13, left: -13, width: 28, height: 28,
          bgcolor: STAGE_ACCENT[idx]?.badge || "#6366F1",
          color: "white", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "11px", fontWeight: 900,
          border: "2.5px solid white", zIndex: 10,
          boxShadow: `0 2px 8px ${STAGE_ACCENT[idx]?.badge || "#6366F1"}50`,
        }}>
          {String(stage.id).padStart(2, "0")}
        </Box>

        {/* Header */}
        <Box sx={{ px: 2, py: 1.8, display: "flex", alignItems: "center", gap: 1.5, bgcolor: `${STAGE_ACCENT[idx]?.iconBg || "#F8FAFF"}`, borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
          <Box sx={{ width: 38, height: 38, bgcolor: `${STAGE_ACCENT[idx]?.iconBg || "#EEF2FF"}`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: STAGE_ACCENT[idx]?.icon || "#6366F1", border: `1.5px solid ${STAGE_ACCENT[idx]?.badge || "#6366F1"}20`, flexShrink: 0 }}>
            {stage.icon}
          </Box>
          <Box>
            <Typography fontWeight={800} fontSize="0.85rem" sx={{ color: "#1E293B", lineHeight: 1.2 }}>{stage.label}</Typography>
            <Typography fontSize="0.7rem" color="text.secondary">{stage.description}</Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: "#F1F5F9" }} />

        {/* Substages */}
        <Box sx={{ px: 2, pt: 1.5, pb: 1, position: "relative" }}>
          <Box sx={{ position: "absolute", top: 28, left: 22, bottom: 20, width: 2, bgcolor: "#E2E8F0", zIndex: 1 }} />
          <Stack spacing={1}>
            {stage.substages.map((sub, si) => <SubstageRow key={si} sub={sub} />)}
          </Stack>
        </Box>

        {/* Footer */}
        <Box sx={{ px: 2, py: 0.9, display: "flex", alignItems: "center", justifyContent: "flex-end", bgcolor: "#FAFBFF", borderBottomLeftRadius: "14px", borderBottomRightRadius: "14px", gap: 2 }}>
          {stage.id === 1 && (
            <Box 
              onClick={(e) => { e.stopPropagation(); onOpenConfig(); }}
              display="flex" alignItems="center" gap={0.5} 
              sx={{ color: "#64748B", "&:hover": { color: "primary.main" }, cursor: "pointer" }}
            >
              <SettingsIcon sx={{ fontSize: 11 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.6rem" }}>Configure</Typography>
            </Box>
          )}
          <Box 
            onClick={(e) => { 
              if (stage.id === 1 && !data.isConfigured) return;
              e.stopPropagation(); 
              onSelectStage(stage.id); 
            }}
            display="flex" alignItems="center" gap={0.3} 
            sx={{ 
              color: (stage.id === 1 && !data.isConfigured) ? "#CBD5E1" : (STAGE_ACCENT[idx]?.badge || "primary.main"),
              cursor: (stage.id === 1 && !data.isConfigured) ? "not-allowed" : "pointer",
              opacity: (stage.id === 1 && !data.isConfigured) ? 0.6 : 1
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.6rem" }}>Open</Typography>
            <ChevronRightIcon sx={{ fontSize: 14 }} />
          </Box>
        </Box>
      </Paper>
      <Handle type="source" position={Position.Right} style={{ visibility: "hidden" }} />
    </Box>
  );
}

const nodeTypes = { 
  entity: EntityNode, 
  overviewEntity: OverviewEntityNode,
  validation: ValidationNode, 
  cloud: CloudNode,
  pipelineStage: PipelineStageNode,
  drawBox: DrawBoxNode,
  drawOval: DrawOvalNode,
  drawDiamond: DrawDiamondNode,
  drawEntity: DrawEntityNode,
  conceptualEntity: ConceptualNode,
  note: NoteNode,
  textBox: TextBoxNode,
  sourceNode: SourceNode,
  targetNode: TargetNode,
};

function EditableEdge({
  id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  style = {}, label, markerEnd, data
}) {
  const sourceNode = useStore((store) => (source ? store.nodeInternals.get(source) : null));
  const targetNode = useStore((store) => (target ? store.nodeInternals.get(target) : null));

  // Deterministic offset to separate overlapping lines
  const getOffset = (seed) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const offsets = [-10, -5, 0, 5, 10];
    return offsets[Math.abs(hash) % offsets.length];
  };

  const offset = getOffset(id);
  let edgeSourceX = sourceX;
  let edgeSourceY = sourceY + offset;
  let edgeTargetX = targetX;
  let edgeTargetY = targetY + offset;
  let edgeSourcePosition = sourcePosition;
  let edgeTargetPosition = targetPosition;

  if (data?.stage === 0 && sourceNode && targetNode) {
    const sourceIntersection = getBorderIntersection(sourceNode, targetNode);
    const targetIntersection = getBorderIntersection(targetNode, sourceNode);
    edgeSourceX = sourceIntersection.x;
    edgeSourceY = sourceIntersection.y + offset;
    edgeTargetX = targetIntersection.x;
    edgeTargetY = targetIntersection.y + offset;
    edgeSourcePosition = getFloatingSide(sourceNode, sourceIntersection);
    edgeTargetPosition = getFloatingSide(targetNode, targetIntersection);
  }

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: edgeSourceX,
    sourceY: edgeSourceY,
    sourcePosition: edgeSourcePosition,
    targetX: edgeTargetX,
    targetY: edgeTargetY,
    targetPosition: edgeTargetPosition,
  });

  const isViewer = Boolean(data?.isViewer);
  const isNewEdge = Boolean(data?.isNewEdge);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label || "");

  useEffect(() => { setDraft(label || ""); }, [label]);

  const commit = () => {
    if (isViewer) {
      setEditing(false);
      setDraft(label || "");
      return;
    }
    setEditing(false);
    if (draft.trim() !== (label || "")) {
      data?.onLabelChange?.(id, draft.trim());
    }
  };

  return (
    <>
      {/* Clickable invisible overlay — wide hit area for deleting the edge on click */}
      {!isViewer && (
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={18}
          style={{ cursor: "pointer" }}
          onClick={() => data?.onDeleteEdge?.(id)}
        />
      )}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd || `url(#arrow-${id})`}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: style?.stroke || "#94A3B8",
          cursor: !isViewer ? "pointer" : "default",
        }}
        onClick={!isViewer ? () => data?.onDeleteEdge?.(id) : undefined}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: 1000,
          }}
          className="nodrag nopan"
          onDoubleClick={() => { if (!isViewer) setEditing(true); }}
        >
          {editing && !isViewer ? (
            <>
              <input
                autoFocus
                list={data?.stage === 2 ? `edge-datalist-${id}` : undefined}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") { setDraft(label || ""); setEditing(false); }
                }}
                style={{
                  background: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 900,
                  color: '#1E293B',
                  border: '2px solid #3B82F6',
                  outline: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minWidth: '60px',
                  textAlign: 'center'
                }}
              />
              {data?.stage === 2 && (
                <datalist id={`edge-datalist-${id}`}>
                  <option value="1:1" />
                  <option value="1:N" />
                  <option value="M:N" />
                  <option value="1:0..1" />
                </datalist>
              )}
            </>
          ) : data?.stage === 0 ? (
            /* Conceptual model: always-visible label box with edit + delete */
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                background: 'white',
                padding: '3px 4px 3px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 700,
                color: label ? '#1E293B' : '#94A3B8',
                border: label ? '1.5px solid #CBD5E1' : '1.5px dashed #CBD5E1',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                userSelect: 'none',
              }}
            >
              <span
                style={{ 
                  minWidth: label ? 30 : 20, 
                  height: 20,
                  cursor: 'text', 
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: label ? '10px' : '14px',
                  fontWeight: 900
                }}
                onClick={() => { if (!isViewer) setEditing(true); }}
              >
                {label || '+'}
              </span>
              {!isViewer && (
                <button
                  onClick={(e) => { e.stopPropagation(); data?.onDeleteEdge?.(id); }}
                  title="Remove connection"
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    fontSize: '13px',
                    lineHeight: 1,
                    padding: '0 3px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
                >
                  &times;
                </button>
              )}
            </div>
          ) : (label && data?.stage === 2) ? (
            <div
              style={{
                background: 'white',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: 900,
                color: '#64748B',
                border: '1.5px solid #E2E8F0',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                cursor: 'pointer'
              }}
            >
              {label}
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = {
  relation: EditableEdge,
  smoothstep: EditableEdge,
};

// ─── Stage 1 Completion Modal ───────────────────────────────────────────────


function Stage1CompletionModal({ open, onClose, results, onConfirm }) {
  const hasErrors = results.some(r => r.type === "error");

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: "16px", minWidth: 400 } }}>
      <DialogTitle sx={{ fontWeight: 800, textAlign: "center", pt: 3 }}>
        {hasErrors ? "Validation Issues Found" : "Model Validated Successfully"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {hasErrors ? (
            <Box sx={{ 
              p: 2, borderRadius: "10px", 
              bgcolor: "#FEF2F2",
              border: "1px solid #FCA5A5",
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 1
            }}>
              <WarningAmberIcon sx={{ color: "#EF4444", fontSize: 32 }} />
              <Typography variant="subtitle2" fontWeight={800} color="#991B1B">
                Structural Issues Detected
              </Typography>
              <Typography variant="caption" color="#B91C1C">
                Suggestions have been pinned directly to the entities on your canvas. 
                Please resolve these issues before completing the stage.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ 
              p: 2, borderRadius: "10px", 
              bgcolor: "#F0FDF4",
              border: "1px solid #86EFAC",
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 1
            }}>
              <CheckCircleIcon sx={{ color: "#10B981", fontSize: 32 }} />
              <Typography variant="subtitle2" fontWeight={800} color="#166534">
                Architecture Verified
              </Typography>
              <Typography variant="caption" color="#15803D">
                Your physical model meets all structural requirements. 
                You can now safely finalize Stage 1.
              </Typography>
            </Box>
          )}


        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700 }}>
          {hasErrors ? "Return to Canvas" : "Cancel"}
        </Button>
        <Button 
          disabled={hasErrors} 
          onClick={onConfirm} 
          variant="contained" 
          sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, boxShadow: "none", "&:hover": { boxShadow: "none" } }}
        >
          Confirm & Complete Stage
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const INIT_CONCEPTUAL_NODES_V3 = [];
const INIT_CONCEPTUAL_EDGES_V3 = [];

const INIT_LOGICAL_NODES_V3 = [];
const INIT_LOGICAL_EDGES_V3 = [];

const INIT_PHYSICAL_NODES_V3 = [];
const INIT_PHYSICAL_EDGES_V3 = [];

let idCtr = 3;

const FLOATING_HANDLE_STYLE = {
  background: "transparent",
  border: "none",
  opacity: 1,
  zIndex: 20,
};

const MODEL_STAGE_TOOLTIPS = {
  Conceptual: "High-level business view. Add entities and relationships before moving into detailed schema design.",
  Logical: "Structure the model in more detail. Define entities, attributes, and business relationships without database-specific constraints.",
  Physical: "Database-ready design. Refine field types, relationships, and DBML-ready implementation details.",
  Review: "Final validation step. Inspect the conceptual, logical, and physical models before completing Stage 1.",
};

function getNodeBox(node) {
  const width = node?.measured?.width ?? node?.width ?? 0;
  const height = node?.measured?.height ?? node?.height ?? 0;
  const position = node?.internals?.positionAbsolute ?? node?.positionAbsolute ?? node?.position ?? { x: 0, y: 0 };

  return { x: position.x, y: position.y, width, height };
}

function getNodeCenter(node) {
  const box = getNodeBox(node);
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

function getBorderIntersection(node, targetNode) {
  const box = getNodeBox(node);
  const sourceCenter = getNodeCenter(node);
  const targetCenter = getNodeCenter(targetNode);
  const halfWidth = Math.max(box.width / 2, 1);
  const halfHeight = Math.max(box.height / 2, 1);
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;
  const scale = 1 / Math.max(Math.abs(dx) / halfWidth || 0, Math.abs(dy) / halfHeight || 0, 1);

  return {
    x: sourceCenter.x + dx * scale,
    y: sourceCenter.y + dy * scale,
  };
}

function getFloatingSide(node, point) {
  const box = getNodeBox(node);
  const distances = [
    { side: Position.Left, value: Math.abs(point.x - box.x) },
    { side: Position.Right, value: Math.abs(point.x - (box.x + box.width)) },
    { side: Position.Top, value: Math.abs(point.y - box.y) },
    { side: Position.Bottom, value: Math.abs(point.y - (box.y + box.height)) },
  ];

  distances.sort((a, b) => a.value - b.value);
  return distances[0]?.side || Position.Right;
}

// ─── Custom Step Icon ───
const ModelingStepIcon = (props) => {
  const { active, completed } = props;
  if (completed) return <LockIcon sx={{ fontSize: 16, color: "text.secondary" }} />;
  return <LockOpenIcon sx={{ fontSize: 16, color: active ? "primary.main" : "text.disabled" }} />;
};

// ─── Stage 1: Data Modeling ───────────────────────────────────────────────────
function Stage1({ nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, onConnect, updateEdgeLabel, deleteEdge, selectedNode, setSelectedNode, relationType, setRelationType, addEntity, deleteEntity, updateLabel, updateColor, addField, updateField, removeField, updateTableType, onOpenConfig, modelName, setModelName, methodology, conceptualNodes = [], conceptualEdges = [], logicalNodes = [], logicalEdges = [], physicalNodes = [], physicalEdges = [], activeTab, dbmlOpen, setDbmlOpen, addNote, addText, isTransitioning, isViewer, viewerMode, reviewerOnlyMode, canCompleteStage1, onCompleteStage1 = () => {}, autosaveState, backgroundNotice, lastSavedAt, lastSavedBy, activeWorkspaceLabel, isSavingModel, presenceUsers }) {

  // We wrap edges with the onLabelChange callback for the custom EditableEdge
  const edgesWithCallbacks = useMemo(() => 
    edges.map(edge => ({
      ...edge,
      animated: activeTab === 0 ? false : edge.animated,
      data: {
        ...edge.data,
        onLabelChange: updateEdgeLabel,
        onDeleteEdge: deleteEdge,
        stage: activeTab,
        isViewer
      }
    })),
    [edges, updateEdgeLabel, deleteEdge, activeTab, isViewer]
  );

  // ── Auto-fit logic when the layout changes ──
  const flowInstances = useRef([null, null, null]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const instance = flowInstances.current[activeTab];
      if (instance) instance.fitView({ padding: 0.4, duration: 400 });
    }, 300); // delay to wait for flex transition
    return () => clearTimeout(timer);
  }, [dbmlOpen, activeTab]);

  // ── DBML → canvas parser ──
  // Use a ref so the debounce timer always calls the LATEST version (avoids stale closures).
  const nodesRef = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  const parseAndApplyDBML = useCallback((text) => {
    try {
      const currentNodes = nodesRef.current;  // always fresh
      const tableRegex = /Table\s+(\w+)\s*\{([^}]*)\}/g;
      const refRegex = /Ref:\s*(\w+)\.\w+\s*[<>]\s*(\w+)\.\w+(?:\s*\/\/\s*(.+))?/g;
      const newNodes = [];
      let tMatch; let idx = 0;
      while ((tMatch = tableRegex.exec(text)) !== null) {
        const label = tMatch[1];
        const body  = tMatch[2];
        const existing = currentNodes.find(n => n.data.label === label);
        const fields = body.trim().split("\n")
          .map(l => l.trim()).filter(l => l && !l.startsWith("/"))
          .map(l => {
            const parts = l.match(/^(\S+)\s+(\S+)(.*)$/);
            if (!parts) return null;
            const name = parts[1]; const type = parts[2].replace(/[^A-Za-z0-9]/g, "").toUpperCase();
            const isPrimary = l.includes("[pk]");
            return { name, type: FIELD_TYPES.includes(type) ? type : "VARCHAR", isPrimary };
          }).filter(Boolean);
        newNodes.push({
          id: existing?.id || String(Date.now() + idx),
          type: "entity",
          position: existing?.position || { x: 80 + idx * 320, y: 150 },
          data: { label, color: existing?.data?.color || TABLE_COLORS[idx % TABLE_COLORS.length], fields },
        });
        idx++;
      }
      const newEdges = [];
      let rMatch;
      while ((rMatch = refRegex.exec(text)) !== null) {
        const src = newNodes.find(n => n.data.label === rMatch[1]);
        const tgt = newNodes.find(n => n.data.label === rMatch[2]);
        if (src && tgt) {
          newEdges.push({
            id: `e-${src.id}-${tgt.id}`,
            source: src.id, target: tgt.id, type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, color: "#64748B" },
            style: { stroke: "#64748B", strokeWidth: 2 },
            label: (rMatch[3] || "1:N").trim(),
            labelStyle: { fontSize: 11, fontWeight: 700, fill: "#64748B" },
            labelBgStyle: { fill: "white", fillOpacity: 1 },
            labelBgPadding: [4, 8],
            labelBgBorderRadius: 4,
            radius: 10,
          });
        }
      }
      if (newNodes.length > 0) { setNodes(newNodes); setEdges(newEdges); }
    } catch (err) { console.error("[DBML parse error]", err); /* ignore mid-type parse errors */ }
  }, [setNodes, setEdges]);  // no longer depends on nodes – reads from ref instead

  const { token } = useAuth();
  const [aiMessages, setAiMessages] = useState([
    [{ role: "ai", text: "Hi! I'm the Overview assistant. Ask in chat or by voice and I'll update your conceptual JSON on screen.", format: "text" }],
    [{ role: "ai", text: "Hi! I'm the Visual Diagram assistant. Describe a model and I'll help you sketch it.", format: "text" }],
    [{ role: "ai", text: "Hi! I'm the Advanced assistant. I can help with field types, DBML, and methodology specific questions.", format: "text" }]
  ]);
  const [aiInput, setAiInput] = useState(["", "", ""]);
  const [inputMode, setInputMode] = useState(["text", "text", "text"]);
  const [recording, setRecording] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [validationResults, setValidationResults] = useState([]);
  const aiChangeIdRef = useRef(0);

  const validateStage1 = () => {
    const results = [];
    const physNodes = nodes; 

    // Clear previous validation notes
    const newNotes = [];
    const cleanNodes = physNodes.filter(n => !n.id.startsWith("val_note_"));

    if (cleanNodes.filter(n => n.type === 'entity' || n.type === 'drawEntity').length === 0) {
      results.push({ type: "error", title: "Empty Model", message: "Stage 1 requires at least one entity to be defined." });
    } else {
      cleanNodes.forEach(node => {
        if (node.type !== 'entity' && node.type !== 'drawEntity') return;

        const nodeErrors = [];
        if (!node.data.label || node.data.label.trim().toLowerCase().startsWith("entity_") || node.data.label === "Entity") {
          nodeErrors.push("Missing or generic label.");
        }
        if (!node.data.fields || node.data.fields.length === 0) {
          nodeErrors.push("Must have at least one field.");
        } else {
          const hasPK = node.data.fields.some(f => f.isPrimary);
          if (!hasPK) {
            nodeErrors.push("Missing a primary key.");
          }
        }

        if (nodeErrors.length > 0) {
          const msg = nodeErrors.join(" ");
          results.push({ type: "error", title: `Issue in ${node.data.label}`, message: msg });
          
          // Create a note node near this node
          newNotes.push({
            id: `val_note_${node.id}`,
            type: "note",
            position: { x: node.position.x + 220, y: node.position.y - 10 },
            data: { 
              label: `⚠️ SUGGESTION:\n${nodeErrors.map(e => `• ${e}`).join("\n")}`,
              onNoteChange: (newText) => updateLabel(`val_note_${node.id}`, newText) 
            }
          });
        }
      });
    }

    if (results.length === 0) {
      results.push({ type: "success", title: "Structure Valid", message: "All entities have valid labels, fields, and primary keys." });
    }

    // Refresh nodes with new validation notes
    setNodes([...cleanNodes, ...newNotes]);
    setValidationResults(results);
    setCompletionModalOpen(true);
  };
  const messagesEnd = useRef(null);
  const recognitionRef = useRef(null);

  // ── Generate live DBML text ──
  const generateDBML = (ns, es) => ns.map(n => {
    const fields = (n.data.fields || []).map(f => `  ${f.name} ${f.type}${f.isPrimary ? " [pk]" : ""}`).join("\n");
    return `Table ${n.data.label} {\n${fields || "  // no fields"}\n}`;
  }).join("\n\n") +
    (es.length ? "\n\n" + es.map(e => {
      const src = ns.find(n => n.id === e.source);
      const tgt = ns.find(n => n.id === e.target);
      return src && tgt ? `Ref: ${src.data.label}.id > ${tgt.data.label}.id // ${e.label || "1:N"}` : "";
    }).filter(Boolean).join("\n") : "");

  const [dbmlEdited, setDbmlEdited] = useState("");

  const addDiagramNode = (type) => {
    const id = String(Date.now());
    const label = type === 'drawBox' ? 'Entity' : type === 'drawOval' ? 'Attribute' : 'Relationship';
    const node = { 
      id, 
      type, 
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 }, 
      data: { label, color: "#F1F5F9" } 
    };
    setNodes(nds => [...nds, node]);
    setSelectedNode(node);
  };

  // Sync from canvas whenever nodes/edges change AND the panel was just opened
  const syncFromCanvas = () => setDbmlEdited(generateDBML(nodes, edges));

  // Auto-populate once when the panel opens
  const prevDbmlOpen = useRef(false);
  if (dbmlOpen && !prevDbmlOpen.current) { prevDbmlOpen.current = true; setDbmlEdited(generateDBML(nodes, edges)); }
  if (!dbmlOpen && prevDbmlOpen.current) { prevDbmlOpen.current = false; }

  const downloadDBML = () => {
    const blob = new Blob([dbmlEdited], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "model.dbml"; a.click();
  };
  // Debounced sync: DBML text → canvas
  // Keep a stable ref to parseAndApplyDBML so the timeout callback never goes stale
  const parseRef = useRef(parseAndApplyDBML);
  useEffect(() => { parseRef.current = parseAndApplyDBML; }, [parseAndApplyDBML]);

  const applyTimer = useRef(null);
  const handleDbmlChange = (text) => {
    setDbmlEdited(text);
    clearTimeout(applyTimer.current);
    applyTimer.current = setTimeout(() => parseRef.current(text), 80); // ~instant live preview
  };
  const aiTabIndex = Math.min(activeTab, aiMessages.length - 1);

  const tryParseFlowJson = (text) => {
    const trimmed = text?.trim();
    if (!trimmed) return null;

    const candidates = [trimmed];
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) candidates.push(fencedMatch[1].trim());

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed?.nodes) && Array.isArray(parsed?.edges)) {
          return parsed;
        }
      } catch {
        continue;
      }
    }

    return null;
  };

  const applyConceptualJsonToCanvas = (graph) => {
    const existingNodesById = new Map(
      (nodes || []).map((node) => [String(node.id), node])
    );
    const existingEdgeKeys = new Set(
      (edges || []).map((edge) => `${String(edge.source)}|${String(edge.target)}|${edge.label || ""}`)
    );
    const nextNodes = (graph.nodes || []).map((node, index) => ({
      id: String(node.id || `node_${index + 1}`),
      type: "conceptualEntity",
      position: {
        x: Number.isFinite(Number(node.x))
          ? Number(node.x)
          : (Number.isFinite(Number(node.position?.x))
            ? Number(node.position.x)
            : 120 + (index % 3) * 320),
        y: Number.isFinite(Number(node.y))
          ? Number(node.y)
          : (Number.isFinite(Number(node.position?.y))
            ? Number(node.position.y)
            : 120 + Math.floor(index / 3) * 220),
      },
      data: {
        label: node.entity || node.type || node.label || `Entity_${index + 1}`,
        fields: Array.isArray(node.fields)
          ? node.fields
          : (existingNodesById.get(String(node.id))?.data?.fields || []),
      },
    }));

    const nextEdges = (graph.edges || []).map((edge, index) => {
      const edgeKey = `${String(edge.source)}|${String(edge.target)}|${edge.label || ""}`;
      const isNewEdge = !existingEdgeKeys.has(edgeKey);

      return {
        id: `json-edge-${index}`,
        source: String(edge.source),
        target: String(edge.target),
        label: edge.label || "",
        type: "smoothstep",
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748B" },
        style: {
          stroke: "#64748B",
          strokeWidth: 2,
        },
        radius: 10,
        data: { onLabelChange: updateEdgeLabel, onDeleteEdge: deleteEdge, stage: 0, isViewer, isNewEdge },
      };
    });

    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNode(null);
  };

  const restoreConceptualCanvasSnapshot = (snapshot) => {
    if (!snapshot) return;
    setNodes(snapshot.nodes || []);
    setEdges(snapshot.edges || []);
    setSelectedNode(null);
  };

  const buildConceptualAgentModel = () => {
    const conceptualNodes = (nodes || []).filter(
      (node) => node.type !== "note" && node.type !== "textBox"
    );

    return {
      nodes: conceptualNodes.map((node) => ({
        id: String(node.id),
        entity: node.data?.label || "Entity",
        x: Number(node.position?.x ?? 0),
        y: Number(node.position?.y ?? 0),
      })),
      edges: (edges || []).map((edge) => ({
        source: String(edge.source),
        target: String(edge.target),
        label: edge.label || "",
      })),
    };
  };

  const sendAiChatMessage = async (text, tabIdx = activeTab) => {
    const trimmed = text?.trim() || "";
    if (!trimmed) return;

    if (tabIdx === 0) {
      setAiMessages(prev => {
        const next = [...prev];
        next[tabIdx] = [...next[tabIdx], { role: "user", text: trimmed, format: "text" }];
        return next;
      });
      setAiInput(prev => {
        const next = [...prev];
        next[tabIdx] = "";
        return next;
      });
      setThinking(true);
      try {
        const previousCanvas = JSON.parse(JSON.stringify({ nodes, edges }));
        const response = await runConceptualAgent(trimmed, buildConceptualAgentModel(), token);
        const parsedGraph = response?.model;
        if (parsedGraph) {
          applyConceptualJsonToCanvas(parsedGraph);
        }
        const changeId = `conceptual-change-${Date.now()}-${aiChangeIdRef.current++}`;
        setAiMessages(prev => {
          const next = [...prev];
          next[tabIdx] = [
            ...next[tabIdx],
            {
              id: changeId,
              role: "ai",
              text: response?.summary || response?.raw_output || JSON.stringify(parsedGraph || {}, null, 2),
              summary: response?.summary || "",
              format: "text",
              changeStatus: "accepted",
              previousCanvas,
            },
          ];
          return next;
        });
      } catch (error) {
        setAiMessages(prev => {
          const next = [...prev];
          next[tabIdx] = [
            ...next[tabIdx],
            { role: "ai", text: error.message || "Failed to update the conceptual model.", format: "text" },
          ];
          return next;
        });
      } finally {
        setThinking(false);
      }
      return;
    }

    sendMessage(trimmed, tabIdx);
  };

  const revertConceptualAiChange = (messageId) => {
    const targetMessage = aiMessages[0]?.find((message) => message.id === messageId);
    if (!targetMessage?.previousCanvas) return;

    restoreConceptualCanvasSnapshot(targetMessage.previousCanvas);
    setAiMessages(prev => {
      const next = [...prev];
      next[0] = next[0].map((message) =>
        message.id === messageId
          ? { ...message, changeStatus: "reverted" }
          : message
      );
      return next;
    });
  };

  const sendMessage = (text, tabIdx = activeTab) => {
    if (!text || !text.trim()) return;
    
    setAiMessages(prev => {
      const next = [...prev];
      next[tabIdx] = [...next[tabIdx], { role: "user", text }];
      return next;
    });
    
    setAiInput(prev => {
      const next = [...prev];
      next[tabIdx] = "";
      return next;
    });

    setThinking(true);
    setTimeout(() => {
      const t = text.toLowerCase();
      let reply = "Got it! How else can I help with this view?";
      if (tabIdx === 0) reply = "I can help you review your entities here. For example, I can suggest missing entities for your methodology.";
      if (tabIdx === 1) reply = "You can add entities and fields here visually. Try asking me to describe a schema for you to sketch.";
      if (tabIdx === 2) reply = "This is the technical view. Ask me about specific DBML syntax or data types.";
      
      if (t.includes("kimball")) reply = "Kimball methodology uses dimensional modeling with fact and dimension tables.";
      if (t.includes("vault")) reply = "Data Vault uses Hubs, Links, and Satellites.";

      setAiMessages(prev => {
        const next = [...prev];
        next[tabIdx] = [...next[tabIdx], { role: "ai", text: reply }];
        return next;
      });
      setThinking(false);
    }, 900);
  };

  const toggleVoice = async () => {
    if (recording) {
      recognitionRef.current?.stop?.();
      setRecording(false);
      return;
    }
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error("Speech recognition is not supported in this browser.");
      }
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = async (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || "";
        setRecording(false);
        if (transcript.trim()) {
          await sendAiChatMessage(transcript, activeTab);
        }
      };
      recognition.onerror = () => {
        setRecording(false);
      };
      recognition.onend = () => {
        setRecording(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
      setRecording(true);
    } catch (error) {
      setRecording(false);
      sendMessage(error.message || "(Voice input not supported — please type instead)");
    }
  };

  const handleInputModeChange = (tabIdx, nextMode) => {
    if (!nextMode) return;
    if (nextMode === "text" && recording) {
      mediaRef.current?.stop();
      setRecording(false);
    }
    setAiInput(prev => {
      const next = [...prev];
      if (nextMode === "voice") next[tabIdx] = "";
      return next;
    });
    setInputMode(prev => {
      const next = [...prev];
      next[tabIdx] = nextMode;
      return next;
    });

    if (nextMode === "voice") {
        setTimeout(() => {
            toggleVoice();
        }, 100);
    }
  };


  return (
    <Box sx={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden", minWidth: 0, position: "relative" }}>
      {isTransitioning && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(6px)",
          }}
        >
          <Box
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: "white",
              boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              border: "1px solid #E2E8F0"
            }}
          >
            <AutoAwesomeIcon 
              sx={{ 
                fontSize: 48, 
                color: "primary.main", 
                mb: 2,
                animation: "pulse 1.5s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%": { transform: "scale(1)", opacity: 0.6 },
                  "50%": { transform: "scale(1.15)", opacity: 1 },
                  "100%": { transform: "scale(1)", opacity: 0.6 },
                }
              }} 
            />
            <Typography variant="h6" fontWeight={900} color="primary.main" gutterBottom>
              AI Agent Processing...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 250, mb: 3 }}>
              {activeTab === 0 ? "Synthesizing Logical Schema from Conceptual entities..." : "Generating Physical Data Model & DBML specs..."}
            </Typography>
            <LinearProgress sx={{ width: 180, borderRadius: 1, height: 6 }} />
          </Box>
        </Box>
      )}
      <Box sx={{ px: 2, py: 1, bgcolor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", flexShrink: 0 }}>
        <Chip
          size="small"
          variant={autosaveState === "error" ? "filled" : "outlined"}
          color={autosaveState === "error" ? "error" : autosaveState === "saved" ? "success" : autosaveState === "saving" ? "primary" : "default"}
          icon={autosaveState === "saved" ? <CheckCircleIcon /> : autosaveState === "saving" ? <CachedIcon /> : <AutoFixHighIcon />}
          label={
            autosaveState === "read_only" ? "Read only" :
            autosaveState === "error" ? "Autosave issue" :
            autosaveState === "saving" ? "Autosaving" :
            autosaveState === "pending" ? "Autosave queued" :
            autosaveState === "saved" ? "Saved" :
            "Autosave ready"
          }
          sx={{
            "& .MuiChip-label": { fontWeight: 700 },
            "& .MuiChip-icon": autosaveState === "saving" ? {
              animation: "spin 1.2s linear infinite",
              "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
            } : undefined,
          }}
        />
        <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155" }}>
          {backgroundNotice}
        </Typography>
        <Chip size="small" variant="outlined" label={activeWorkspaceLabel} sx={{ "& .MuiChip-label": { fontWeight: 700 } }} />
        {dbmlOpen && <Chip size="small" variant="outlined" label="DBML editor open" sx={{ "& .MuiChip-label": { fontWeight: 700 } }} />}
        {isSavingModel && <Chip size="small" variant="outlined" color="primary" label="Background sync active" sx={{ "& .MuiChip-label": { fontWeight: 700 } }} />}
        {lastSavedAt && (
          <Typography variant="caption" color="text.secondary">
            Last saved {lastSavedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </Typography>
        )}
        {lastSavedBy && (
          <Typography variant="caption" color="text.secondary">
            by {lastSavedBy}
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={-0.75}>
            {presenceUsers.slice(0, 4).map((user, index) => (
              <Tooltip key={user.id || index} title={user.isCurrentUser ? `${user.name} (you)` : user.name}>
                <Avatar sx={{ width: 28, height: 28, fontSize: "0.72rem", bgcolor: user.isCurrentUser ? "#2563EB" : "#0F172A", border: "2px solid white" }}>
                  {String(user.name || "?").trim().slice(0, 2).toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
          </Stack>
          <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700, whiteSpace: "nowrap" }}>
            {presenceUsers.length ? `${presenceUsers.length} collaborator${presenceUsers.length > 1 ? "s" : ""} on this model` : "No collaborators assigned yet"}
          </Typography>
        </Stack>
      </Box>
      {/* Main Content Area (Tabs Area + AI Panel) */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden", minWidth: 0, minHeight: 0 }}>
        
        <Box sx={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }}>
          
          {/* Tab 1: Conceptual — Connected Draggable Canvas */}
          {activeTab === 0 && (
            <Box sx={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

              {/* ReactFlow canvas — conceptual node types, custom edge labels */}
              <Box sx={{ flex: 1, bgcolor: "#F8FAFC", position: "relative" }}>
                <ReactFlow
                  nodes={nodes.map(n => ({
                    ...n,
                    type: n.type === 'note' ? 'note' : (n.type === 'textBox' ? 'textBox' : 'conceptualEntity'),
                    data: { 
                      ...n.data, 
                      onLabelChange: (newLabel) => updateLabel(n.id, newLabel),
                      onNoteChange: (newText) => updateLabel(n.id, newText),
                      onTextChange: (newText) => updateLabel(n.id, newText),
                      isViewer,
                    }
                  }))}
                  edges={edgesWithCallbacks} 
                  onNodesChange={onNodesChange} 
                  onEdgesChange={onEdgesChange} 
                  onConnect={onConnect}
                  onPaneClick={() => setSelectedNode(null)}
                  onInit={instance => { flowInstances.current[0] = instance; }}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  nodesDraggable={!isViewer}
                  nodesConnectable={!isViewer}
                  connectionMode="loose"
                  deleteKeyCode={isViewer ? null : ["Backspace", "Delete"]}
                  fitView
                  fitViewOptions={{ padding: 0.4, maxZoom: 0.75 }}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background color="#CBD5E1" gap={24} size={1} variant="dots" />
                  <Controls position="bottom-left" />
                  <MiniMap position="bottom-right" nodeColor={n => n.data?.color || "#1E293B"} />
                </ReactFlow>

                {thinking && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(248, 250, 252, 0.78)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        width: 320,
                        maxWidth: "calc(100% - 32px)",
                        px: 3,
                        py: 2.5,
                        borderRadius: 4,
                        border: "1px solid #DBEAFE",
                        bgcolor: "rgba(255,255,255,0.92)",
                        boxShadow: "0 24px 60px rgba(37,99,235,0.12)",
                      }}
                    >
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "14px",
                              background: "linear-gradient(135deg,#2563EB,#7C3AED)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              boxShadow: "0 10px 24px rgba(37,99,235,0.24)",
                            }}
                          >
                            <AutoAwesomeIcon
                              sx={{
                                fontSize: 20,
                                animation: "pulseGlow 1.5s ease-in-out infinite",
                                "@keyframes pulseGlow": {
                                  "0%, 100%": { transform: "scale(0.95)", opacity: 0.8 },
                                  "50%": { transform: "scale(1.08)", opacity: 1 },
                                },
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography fontWeight={900} color="#1D4ED8">
                              Updating Conceptual Model
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                              Applying your latest prompt to the canvas
                            </Typography>
                          </Box>
                        </Stack>

                        <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 0.5, height: 42 }}>
                          {[0, 1, 2, 3, 4, 5].map((bar) => (
                            <Box
                              key={bar}
                              sx={{
                                width: 8,
                                borderRadius: "999px",
                                bgcolor: bar % 2 === 0 ? "#60A5FA" : "#A78BFA",
                                animation: `canvasWave${bar} ${1 + bar * 0.08}s ease-in-out infinite`,
                                "@keyframes canvasWave0": {
                                  "0%, 100%": { height: 12 },
                                  "50%": { height: 34 },
                                },
                                "@keyframes canvasWave1": {
                                  "0%, 100%": { height: 22 },
                                  "50%": { height: 38 },
                                },
                                "@keyframes canvasWave2": {
                                  "0%, 100%": { height: 16 },
                                  "50%": { height: 28 },
                                },
                                "@keyframes canvasWave3": {
                                  "0%, 100%": { height: 10 },
                                  "50%": { height: 36 },
                                },
                                "@keyframes canvasWave4": {
                                  "0%, 100%": { height: 20 },
                                  "50%": { height: 32 },
                                },
                                "@keyframes canvasWave5": {
                                  "0%, 100%": { height: 14 },
                                  "50%": { height: 30 },
                                },
                              }}
                            />
                          ))}
                        </Box>

                        <LinearProgress
                          sx={{
                            height: 8,
                            borderRadius: 999,
                            bgcolor: "#DBEAFE",
                            "& .MuiLinearProgress-bar": {
                              background: "linear-gradient(90deg,#2563EB,#7C3AED)",
                            },
                          }}
                        />
                      </Stack>
                    </Paper>
                  </Box>
                )}

                {nodes.length === 0 && (
                  <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <Stack alignItems="center" spacing={1}>
                      <TableChartIcon sx={{ fontSize: 48, color: "#CBD5E1" }} />
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>No entities yet</Typography>
                      <Typography variant="caption" color="text.secondary">Click "Add Entity" to start</Typography>
                    </Stack>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Tab 2: Logical */}
          {activeTab === 1 && (
            <Box sx={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
              <Box sx={{ flex: 1, bgcolor: "#F8FAFC", position: "relative" }}>
                <ReactFlow 
                  nodes={nodes.map(n => ({ 
                    ...n, 
                    type: "drawEntity", 
                    data: { 
                      ...n.data, 
                      onAddField: addField, 
                      onDeleteNode: deleteEntity, 
                      onUpdateField: updateField, 
                      onRemoveField: removeField,
                      isViewer,
                    } 
                  }))}                   
                   edges={edgesWithCallbacks} 
                   onNodesChange={onNodesChange} 
                   onEdgesChange={onEdgesChange}
                   onConnect={onConnect} 
                   onInit={instance => { flowInstances.current[1] = instance; }}
                   onNodeClick={(_, node) => setSelectedNode(node)} onPaneClick={() => setSelectedNode(null)}
                   nodeTypes={nodeTypes} 
                   edgeTypes={edgeTypes}
                   nodesDraggable={!isViewer}
                   nodesConnectable={!isViewer}
                   connectionMode="loose"
                   deleteKeyCode={isViewer ? null : ["Backspace", "Delete"]}
                   fitView proOptions={{ hideAttribution: true }}
                 >
                  <Background color="#CBD5E1" gap={20} size={1} variant="dots" />
                  <Controls position="bottom-left" />
                  <MiniMap position="bottom-right" nodeColor={n => n.data?.color || "#1E293B"} />
                </ReactFlow>
              </Box>
            </Box>
          )}

          {/* Tab 3: Physical */}
          {activeTab === 2 && (
            <Box sx={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }}>
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
                {/* Visual context info row */}
                <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 0.8, bgcolor: "white", borderBottom: "1px solid #E2E8F0", gap: 2.5, flexShrink: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5 }}>RELATION TYPE</Typography>
                    <ToggleButtonGroup value={relationType} exclusive onChange={(_, v) => v && setRelationType(v)} size="small" sx={{ height: 28 }}>
                      {["1:1", "1:N", "N:M"].map(r => <ToggleButton key={r} value={r} sx={{ fontSize: "0.55rem", fontWeight: 800, px: 1.5, textTransform: "none" }}>{r}</ToggleButton>)}
                    </ToggleButtonGroup>
                  </Stack>
                </Box>


                {/* Canvas */}
                <Box sx={{ flex: 1 }}>
                  <ReactFlow 
                    nodes={nodes.map(n => ({
                      ...n,
                      data: {
                        ...n.data,
                        onUpdateLabel: (val) => updateLabel(n.id, val),
                        onUpdateTableType: (val) => updateTableType(n.id, val),
                        onUpdateField: (idx, key, val) => updateField(n.id, idx, key, val),
                        onAddField: () => addField(n.id),
                        onRemoveField: (idx) => removeField(n.id, idx),
                        isViewer,
                      }
                    }))} 
                    edges={edgesWithCallbacks} 
                    onNodesChange={onNodesChange} 
                    onEdgesChange={onEdgesChange} 
                    onConnect={onConnect}
                    onNodeClick={(_, node) => setSelectedNode(node)} onPaneClick={() => setSelectedNode(null)}
                  nodeTypes={nodeTypes} 
                  edgeTypes={edgeTypes}
                  nodesDraggable={!isViewer}
                  nodesConnectable={!isViewer}
                  deleteKeyCode={isViewer ? null : ["Backspace", "Delete"]}
                  onInit={instance => { flowInstances.current[2] = instance; }}
                  fitView proOptions={{ hideAttribution: true }}>
                    <Background color="#CBD5E1" gap={20} size={1} variant="dots" />
                    <Controls position="bottom-left" style={{ bottom: 24 }} />
                    <MiniMap position="bottom-right" style={{ bottom: 24, right: 16, borderRadius: 8, border: "1px solid #E2E8F0" }} nodeColor={n => n.data?.color || "#1E293B"} />
                  </ReactFlow>
                </Box>
                
                {/* Submit for Review Button */}
                <Box sx={{ p: 2, bgcolor: "white", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "center" }}>
                  <Button 
                    variant="contained" 
                    size="large"
                    onClick={() => setActiveTab(3)}
                    sx={{ 
                      borderRadius: "12px", px: 4, py: 1.2, fontWeight: 900, fontSize: "0.9rem",
                      textTransform: "none", boxShadow: "0 8px 16px rgba(37,99,235,0.2)",
                      background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                      "&:hover": { boxShadow: "0 12px 24px rgba(37,99,235,0.3)" }
                    }}
                  >
                    Submit for Review
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          {/* Tab 4: Review */}
          {activeTab === 3 && (
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", minWidth: 0, minHeight: 0, bgcolor: "#F8FAFC" }}>
              <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", minHeight: "100%", overflow: "auto" }}>
                {!canCompleteStage1 ? (
                  <Paper variant="outlined" sx={{ p: 5, borderRadius: 4, maxWidth: 620, width: "100%", textAlign: "center", bgcolor: "white", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
                    <WarningAmberIcon sx={{ fontSize: 56, color: "warning.main", mb: 2 }} />
                    <Typography variant="h5" fontWeight={900} gutterBottom>
                      Review Stage Locked
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                      First let the Stage 1 substages be completed and submitted for review.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                      Only users with the reviewer role can access this stage and complete Stage 1.
                    </Typography>
                    {!reviewerOnlyMode && (
                      <Button
                        variant="outlined"
                        onClick={() => setActiveTab(2)}
                        sx={{ py: 1.2, px: 3, borderRadius: 3, fontWeight: 800, textTransform: "none" }}
                      >
                        Back to Physical
                      </Button>
                    )}
                  </Paper>
                ) : (
                <Box sx={{ width: "100%", maxWidth: 1800, display: "flex", flexDirection: "column", gap: 3 }}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, bgcolor: "white", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
                    <Typography variant="h5" fontWeight={900} gutterBottom>Stage 1 Review</Typography>
                    <Typography variant="body1" color="text.secondary">
                      Reviewers can inspect the Conceptual, Logical, and Physical diagrams here, send changes back to contributors if needed, or complete Stage 1 when everything looks correct.
                    </Typography>
                  </Paper>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ borderRadius: 4, overflow: "hidden", bgcolor: "white", height: 560 }}>
                        <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid #E2E8F0", bgcolor: "#F8FAFC" }}>
                          <Typography fontWeight={800}>Conceptual Diagram</Typography>
                          <Typography variant="caption" color="text.secondary">High-level review of the conceptual substage.</Typography>
                        </Box>
                        <Box sx={{ height: "calc(100% - 61px)" }}>
                          <ReactFlow
                            nodes={conceptualNodes.map((n) => ({
                              ...n,
                              type: n.type === "note" ? "note" : (n.type === "textBox" ? "textBox" : "conceptualEntity"),
                              data: { ...n.data, isViewer: true },
                            }))}
                            edges={(conceptualEdges || []).map((e) => ({ ...e, data: { ...e.data, isViewer: true, stage: 0 } }))}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            fitView
                            nodesDraggable={false}
                            nodesConnectable={false}
                            elementsSelectable={false}
                            zoomOnScroll={false}
                            panOnScroll
                            proOptions={{ hideAttribution: true }}
                          >
                            <Background color="#CBD5E1" gap={24} size={1} variant="dots" />
                            <Controls position="bottom-left" showInteractive={false} />
                          </ReactFlow>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} xl={6}>
                      <Paper variant="outlined" sx={{ borderRadius: 4, overflow: "hidden", bgcolor: "white", height: 520 }}>
                        <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid #E2E8F0", bgcolor: "#F8FAFC" }}>
                          <Typography fontWeight={800}>Logical Diagram</Typography>
                          <Typography variant="caption" color="text.secondary">Read-only review of the logical substage.</Typography>
                        </Box>
                        <Box sx={{ height: "calc(100% - 61px)" }}>
                          <ReactFlow
                            nodes={logicalNodes.map((n) => ({
                              ...n,
                              type: "drawEntity",
                              data: { ...n.data, isViewer: true },
                            }))}
                            edges={(logicalEdges || []).map((e) => ({ ...e, data: { ...e.data, isViewer: true, stage: 1 } }))}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            fitView
                            nodesDraggable={false}
                            nodesConnectable={false}
                            elementsSelectable={false}
                            zoomOnScroll={false}
                            panOnScroll
                            proOptions={{ hideAttribution: true }}
                          >
                            <Background color="#CBD5E1" gap={20} size={1} variant="dots" />
                            <Controls position="bottom-left" showInteractive={false} />
                          </ReactFlow>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} xl={6}>
                      <Paper variant="outlined" sx={{ borderRadius: 4, overflow: "hidden", bgcolor: "white", height: 520 }}>
                        <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid #E2E8F0", bgcolor: "#F8FAFC" }}>
                          <Typography fontWeight={800}>Physical Diagram</Typography>
                          <Typography variant="caption" color="text.secondary">Read-only review of the physical substage.</Typography>
                        </Box>
                        <Box sx={{ height: "calc(100% - 61px)" }}>
                          <ReactFlow
                            nodes={physicalNodes.map((n) => ({
                              ...n,
                              data: { ...n.data, isViewer: true },
                            }))}
                            edges={(physicalEdges || []).map((e) => ({ ...e, data: { ...e.data, isViewer: true, stage: 2 } }))}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            fitView
                            nodesDraggable={false}
                            nodesConnectable={false}
                            elementsSelectable={false}
                            zoomOnScroll={false}
                            panOnScroll
                            proOptions={{ hideAttribution: true }}
                          >
                            <Background color="#CBD5E1" gap={20} size={1} variant="dots" />
                            <Controls position="bottom-left" showInteractive={false} />
                          </ReactFlow>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, bgcolor: "white", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
                    <Stack spacing={2.5}>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                        <Typography variant="subtitle2" fontWeight={800} color="primary" gutterBottom>REVIEW SUMMARY</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Conceptual entities: {conceptualNodes.length}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Logical entities: {logicalNodes.length}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Physical entities: {physicalNodes.length}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Physical relationships: {physicalEdges.length}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Methodology: {methodology}</Typography>
                      </Box>

                      <Box display="flex" gap={2}>
                        {!reviewerOnlyMode && (
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => setActiveTab(2)}
                            sx={{ py: 1.5, borderRadius: 3, fontWeight: 800, textTransform: "none" }}
                          >
                            Back to Contributors
                          </Button>
                        )}
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={onCompleteStage1}
                          sx={{
                            py: 1.5, borderRadius: 3, fontWeight: 800, textTransform: "none",
                            background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                            boxShadow: "0 8px 16px rgba(37,99,235,0.2)"
                          }}
                        >
                          Complete Stage 1
                        </Button>
                      </Box>
                    </Stack>
                  </Paper>
                </Box>
                )}
              </Box>
            </Box>
          )}

          <Stage1CompletionModal 
            open={completionModalOpen} 
            onClose={() => setCompletionModalOpen(false)} 
            results={validationResults}
            onConfirm={() => {
              setCompletionModalOpen(false);
              onOpenConfig(); // This can be used to set the stage status in parent
              // or better, a direct onCompleteStage1 prop
              if (data?.onCompleteStage1) data.onCompleteStage1();
            }}
          />

          {/* Sidebar: Entity Editor (Shared with DBML toggle logic) */}
          {selectedNode && !dbmlOpen && activeTab === 2 && (
            <Paper elevation={0} sx={{ width: 268, borderLeft: "1px solid #E2E8F0", display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "white" }}>
              <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", borderBottom: "1px solid #F1F5F9" }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: selectedNode.data.color, mr: 1 }} />
                <Typography fontWeight={700} fontSize="0.9rem" flex={1}>{selectedNode.data.label}</Typography>
                <IconButton size="small" onClick={() => setSelectedNode(null)}><CloseIcon fontSize="small" /></IconButton>
              </Box>
              <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>Entity Name</Typography>
                <TextField fullWidth size="small" value={selectedNode.data.label} onChange={e => updateLabel(selectedNode.id, e.target.value)} sx={{ mt: 0.5, mb: 2 }} disabled={isViewer} />

                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>Table Type</Typography>
                <Select fullWidth size="small" value={selectedNode.data.tableType || "TABLE"} onChange={e => updateTableType(selectedNode.id, e.target.value)} sx={{ mt: 0.5, mb: 2, fontSize: "0.7rem" }} disabled={isViewer}>
                  {TABLE_TYPES.map(t => <MenuItem key={t} value={t} sx={{ fontSize: "0.7rem" }}>{t}</MenuItem>)}
                </Select>

                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>Color</Typography>
                <Stack direction="row" spacing={0.75} mt={0.5} mb={2} flexWrap="wrap">
                  {TABLE_COLORS.map(c => <Box key={c} onClick={() => { if (!isViewer) updateColor(selectedNode.id, c); }} sx={{ width: 22, height: 22, borderRadius: "50%", bgcolor: c, cursor: isViewer ? "default" : "pointer", border: selectedNode.data.color === c ? "3px solid #3B82F6" : "2px solid white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />)}
                </Stack>

                <Divider sx={{ mb: 2 }} />
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>Constraints & Options</Typography>
                </Box>
                <Stack spacing={1.5}>
                  {(selectedNode.data.fields || []).map((field, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 1.5, bgcolor: "#FAFAFA", borderRadius: 2 }}>
                      <Typography fontWeight={700} fontSize="0.75rem" color="primary.main" mb={1.5}>
                        {field.name} <Typography component="span" fontSize="0.65rem" color="text.disabled">({field.type})</Typography>
                      </Typography>
                      
                      <Stack spacing={1.5}>
                        <Box>
                          <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
                            <RuleIcon sx={{ fontSize: 11, color: "#64748B" }} />
                            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.62rem", color: "text.secondary" }}>CONSTRAINTS</Typography>
                          </Box>
                          <TextField 
                            fullWidth size="small" placeholder="UNIQUE, DEFAULT val, etc." 
                            value={field.constraints || ""} 
                            onChange={e => updateField(selectedNode.id, idx, "constraints", e.target.value)}
                            sx={{ "& .MuiInputBase-input": { fontSize: "0.72rem" } }}
                            disabled={isViewer}
                          />
                        </Box>

                        <Box>
                          <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
                            <LinkIcon sx={{ fontSize: 11, color: "#64748B" }} />
                            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.62rem", color: "text.secondary" }}>FOREIGN KEY</Typography>
                          </Box>
                          <Select 
                            fullWidth size="small" 
                            value={field.foreignKey || ""} 
                            onChange={e => updateField(selectedNode.id, idx, "foreignKey", e.target.value)}
                            sx={{ fontSize: "0.72rem" }}
                            displayEmpty
                            disabled={isViewer}
                          >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {(nodes || []).filter(n => n.id !== selectedNode.id).map(n => (
                              <MenuItem key={n.id} value={n.id} sx={{ fontSize: "0.72rem" }}>{n.data.label}</MenuItem>
                            ))}
                          </Select>
                        </Box>

                        <FormControlLabel
                          control={
                            <Checkbox 
                              size="small" 
                              checked={field.isNullable !== false} 
                              onChange={e => updateField(selectedNode.id, idx, "isNullable", e.target.checked)} 
                              disabled={isViewer}
                            />
                          }
                          label={
                            <Box display="flex" alignItems="center" gap={0.75}>
                              {field.isNullable !== false ? <LockOpenIcon sx={{ fontSize: 14, color: "#94A3B8" }} /> : <LockIcon sx={{ fontSize: 14, color: "#F59E0B" }} />}
                              <Typography fontSize="0.72rem" fontWeight={600}>Allow Nulls (Nullable)</Typography>
                            </Box>
                          }
                        />
                        
                        {field.isNullable === false && (
                          <Alert icon={false} sx={{ py: 0, px: 1, "& .MuiAlert-message": { fontSize: "0.55rem", fontWeight: 600 } }} severity="success">
                            Optimised: Indexed & Non-nullable
                          </Alert>
                        )}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
              {!isViewer && (
                <Box sx={{ p: 2, borderTop: "1px solid #F1F5F9" }}>
                  <Button fullWidth variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => deleteEntity(selectedNode.id)} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1 }}>Delete Entity</Button>
                </Box>
              )}
            </Paper>
          )}

          {/* Sidebar: DBML Panel */}
          {dbmlOpen && (
            <Paper elevation={0} sx={{ width: 340, borderLeft: "1px solid #1E293B", display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#0F172A" }}>
              <Box sx={{ px: 2, py: 1.2, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid #1E293B", bgcolor: "#1E293B" }}>
                <Box sx={{ display: "flex", gap: 0.7 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#EF4444" }} />
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#F59E0B" }} />
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#10B981" }} />
                </Box>
                <Typography fontWeight={700} fontSize="0.78rem" sx={{ color: "#94A3B8", ml: 1, fontFamily: "monospace", flex: 1 }}>model.dbml</Typography>
                <Tooltip title="Sync from canvas"><IconButton size="small" onClick={syncFromCanvas} sx={{ color: "#64748B", "&:hover": { color: "#38BDF8" } }}><CachedIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                <IconButton size="small" onClick={() => setDbmlOpen(false)} sx={{ color: "#64748B", "&:hover": { color: "#94A3B8" } }}><CloseIcon fontSize="small" /></IconButton>
              </Box>
              <Box sx={{ flex: 1, overflow: "hidden" }}>
                <textarea value={dbmlEdited} onChange={e => handleDbmlChange(e.target.value)} spellCheck={false} style={{ flex: 1, width: "100%", height: "100%", border: "none", outline: "none", resize: "none", background: "transparent", color: "#CBD5E1", fontFamily: "monospace", fontSize: "0.7rem", padding: "16px", caretColor: "#38BDF8" }} />
              </Box>
              <Box sx={{ px: 2, py: 0.8, borderTop: "1px solid #1E293B", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: "0.55rem", color: "#334155" }}>DBML Editor</Typography>
                <Typography sx={{ fontSize: "0.55rem", color: "#334155" }}>{dbmlEdited.split("\n").length} lines</Typography>
              </Box>
            </Paper>
          )}
        </Box>
        
        {/* Shared AI sidebar - permanently docked on the right */}
        {!viewerMode && activeTab !== 3 && (
        <Paper elevation={0} sx={{
          width: 320,
          minWidth: 320,
          overflow: "hidden",
          flexShrink: 0,
          borderLeft: "1px solid #E2E8F0",
          display: "flex", flexDirection: "column",
          bgcolor: "white",
        }}>
            <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid #F1F5F9", bgcolor: "#F8FAFC" }}>
              <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#3B82F6,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AutoAwesomeIcon sx={{ fontSize: 15, color: "white" }} />
              </Box>
              <Typography fontWeight={700} fontSize="0.9rem" flex={1}>AI Agent</Typography>
              <Box
                onClick={() => handleInputModeChange(aiTabIndex, inputMode[aiTabIndex] === "voice" ? "text" : "voice")}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: inputMode[aiTabIndex] === "text" ? "#0F172A" : "#64748B" }}>
                  Text
                </Typography>
                <Box
                  sx={{
                    width: 32,
                    height: 18,
                    borderRadius: "999px",
                    bgcolor: inputMode[aiTabIndex] === "voice" ? "#2563EB" : "#CBD5E1",
                    position: "relative",
                    transition: "background-color 0.2s ease",
                    boxShadow: "inset 0 1px 3px rgba(15,23,42,0.15)",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 2,
                      left: inputMode[aiTabIndex] === "voice" ? 16 : 2,
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      bgcolor: "white",
                      boxShadow: "0 1px 4px rgba(15,23,42,0.22)",
                      transition: "left 0.2s ease",
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: inputMode[aiTabIndex] === "voice" ? "#0F172A" : "#64748B" }}>
                  Voice
                </Typography>
              </Box>
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5 }}>
              <Stack spacing={1.5}>
                {(aiMessages[aiTabIndex] || []).map((m, i) => (
                  <Box key={i} display="flex" justifyContent={m.role === "user" ? "flex-end" : "flex-start"} gap={1}>
                    {m.role === "ai" && <Avatar sx={{ width: 26, height: 26, background: "linear-gradient(135deg,#3B82F6,#8B5CF6)", fontSize: "0.55rem", flexShrink: 0 }}><AutoAwesomeIcon sx={{ fontSize: 14 }} /></Avatar>}
                    <Box sx={{ maxWidth: "82%", px: 1.5, py: 1, borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", bgcolor: m.role === "user" ? "primary.main" : "#F1F5F9", color: m.role === "user" ? "white" : "text.primary" }}>
                      {m.format === "json" ? (
                        <Stack spacing={1}>
                         
                          {m.previousCanvas && (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                size="small"
                                label={m.changeStatus === "reverted" ? "Rejected" : "Accepted"}
                                color={m.changeStatus === "reverted" ? "default" : "success"}
                                variant={m.changeStatus === "reverted" ? "outlined" : "filled"}
                                sx={{ height: 22, "& .MuiChip-label": { fontSize: "0.68rem", fontWeight: 700 } }}
                              />
                              <Button
                                size="small"
                                variant="text"
                                disabled={m.changeStatus === "reverted"}
                                onClick={() => revertConceptualAiChange(m.id)}
                                sx={{ minWidth: "auto", px: 1, py: 0.25, fontSize: "0.68rem", fontWeight: 700, textTransform: "none" }}
                              >
                                Revert
                              </Button>
                            </Stack>
                          )}
                        </Stack>
                      ) : (
                        <Stack spacing={1}>
                          {m.summary ? (
                            <Typography sx={{ fontSize: "0.72rem", lineHeight: 1.5, fontWeight: 400 }}>
                              {m.summary}
                            </Typography>
                          ) : null}
                          {m.previousCanvas ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                size="small"
                                label={m.changeStatus === "reverted" ? "Rejected" : "Accepted"}
                                color={m.changeStatus === "reverted" ? "default" : "success"}
                                variant={m.changeStatus === "reverted" ? "outlined" : "filled"}
                                sx={{ height: 22, "& .MuiChip-label": { fontSize: "0.68rem", fontWeight: 700 } }}
                              />
                              <Button
                                size="small"
                                variant="text"
                                disabled={m.changeStatus === "reverted"}
                                onClick={() => revertConceptualAiChange(m.id)}
                                sx={{ minWidth: "auto", px: 1, py: 0.25, fontSize: "0.68rem", fontWeight: 700, textTransform: "none" }}
                              >
                                Revert
                              </Button>
                            </Stack>
                          ) : null}
                          {!m.summary ? (
                            <Typography sx={{ fontSize: "0.7rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                              {m.text}
                            </Typography>
                          ) : null}
                        </Stack>
                      )}
                    </Box>
                  </Box>
                ))}
                {thinking && (
                  <Box display="flex" gap={1}><Avatar sx={{ width: 26, height: 26, background: "linear-gradient(135deg,#3B82F6,#8B5CF6)" }}><AutoAwesomeIcon sx={{ fontSize: 14 }} /></Avatar><Box sx={{ px: 1.5, py: 1, borderRadius: "12px 12px 12px 2px", bgcolor: "#F1F5F9" }}><CircularProgress size={14} /></Box></Box>
                )}
                <div ref={messagesEnd} />
              </Stack>
            </Box>
            <Box sx={{ p: 1.5, borderTop: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: 1.25 }}>


              {inputMode[aiTabIndex] === "voice" ? (
                <Box
                  sx={{
                    border: "1px solid #DBEAFE",
                    borderRadius: 2,
                    bgcolor: recording ? "#EFF6FF" : "#F8FAFC",
                    px: 1.5,
                    py: 1.25,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.4, height: 28, flex: 1 }}>
                    {[0, 1, 2, 3, 4].map((bar) => (
                      <Box
                        key={bar}
                        sx={{
                          width: 5,
                          borderRadius: "999px",
                          bgcolor: recording ? "#2563EB" : "#BFDBFE",
                          height: recording ? 10 + (bar % 3) * 6 : 8,
                          animation: recording ? `voiceWave${bar} ${0.9 + bar * 0.15}s ease-in-out infinite` : "none",
                          "@keyframes voiceWave0": {
                            "0%, 100%": { transform: "scaleY(0.45)" },
                            "50%": { transform: "scaleY(1.1)" },
                          },
                          "@keyframes voiceWave1": {
                            "0%, 100%": { transform: "scaleY(0.8)" },
                            "50%": { transform: "scaleY(1.35)" },
                          },
                          "@keyframes voiceWave2": {
                            "0%, 100%": { transform: "scaleY(0.55)" },
                            "50%": { transform: "scaleY(1.5)" },
                          },
                          "@keyframes voiceWave3": {
                            "0%, 100%": { transform: "scaleY(0.7)" },
                            "50%": { transform: "scaleY(1.2)" },
                          },
                          "@keyframes voiceWave4": {
                            "0%, 100%": { transform: "scaleY(0.4)" },
                            "50%": { transform: "scaleY(1.25)" },
                          },
                          transformOrigin: "center bottom",
                        }}
                      />
                    ))}
                    <Typography sx={{ ml: 1, fontSize: "0.72rem", color: recording ? "#1D4ED8" : "#64748B", fontWeight: 600 }}>
                      {recording ? "Listening..." : "Tap the mic to start voice input"}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title={recording ? "Stop recording" : "Start recording"}>
                      <IconButton onClick={toggleVoice} sx={{ bgcolor: recording ? "#DBEAFE" : "#EFF6FF", color: recording ? "#1D4ED8" : "primary.main", borderRadius: 1.5, "&:hover": { bgcolor: recording ? "#BFDBFE" : "#DBEAFE" } }}>
                        {recording ? <StopIcon fontSize="small" /> : <MicIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="error" 
                      onClick={() => handleInputModeChange(aiTabIndex, "text")}
                      sx={{ 
                        fontSize: "0.65rem", 
                        textTransform: "none", 
                        fontWeight: 700,
                        borderRadius: 1.5,
                        px: 1.5
                      }}
                    >
                      End Voice
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                  <TextField multiline maxRows={3} fullWidth size="small" placeholder="Describe your data model…" 
                    value={aiInput[aiTabIndex]} 
                    onChange={e => setAiInput(prev => { const next = [...prev]; next[aiTabIndex] = e.target.value; return next; })} 
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAiChatMessage(aiInput[aiTabIndex], aiTabIndex); } }} 
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1, fontSize: "0.82rem" } }} />
                  <IconButton onClick={() => sendAiChatMessage(aiInput[aiTabIndex], aiTabIndex)} disabled={aiTabIndex !== 0 && !aiInput[aiTabIndex]?.trim()} sx={{ bgcolor: "primary.main", color: "white", borderRadius: 1, "&:hover": { bgcolor: "primary.dark" }, "&.Mui-disabled": { bgcolor: "#E2E8F0" } }}>
                    <SendIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
        </Paper>
        )}
       
      </Box>
    </Box>
  );
}

// ─── Stage 2: Validation ──────────────────────────────────────────────────────
function Stage2({ nodes, edges }) {
  const [started, setStarted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedModel, setSelectedModel] = useState("base"); // 'base' | 'optimized'
  const steps = ["Baseline Analysis", "AI Optimization", "Performance Projection"];

  // Benchmarking State (Repurposed for table-level overview)
  const stats = {
    totalTables: (nodes || []).length,
    totalRows: (nodes || []).reduce((acc, n) => acc + (Math.floor(Math.random() * 900000) + 100000), 0),
    avgLatency: "24ms",
    totalEstCost: "$0.042/day"
  };

  const mergingSuggestions = [
    { 
      target: "USER_PROFILE", 
      sources: ["USERS", "USER_SETTINGS"], 
      reason: "High join frequency (92%) and 1:1 relationship detected. Merging reduces query latency by ~15ms.",
      impact: "High" 
    },
    { 
      target: "ORDER_DETAILS_DENORM", 
      sources: ["ORDERS", "LINE_ITEMS"], 
      reason: "Commonly queried together in 85% of analytical workloads. Materializing this view improves throughput.",
      impact: "Medium" 
    }
  ];

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  // Derive Optimized Model for Projection
  const optimizedNodes = useMemo(() => {
    // Mocking an optimized version where USERS + USER_SETTINGS = USER_PROFILE
    // and ORDERS + LINE_ITEMS = ORDER_DETAILS_DENORM
    const filtered = (nodes || []).filter(n => !["USERS", "USER_SETTINGS", "ORDERS", "LINE_ITEMS"].includes(n.data?.label));
    const merged = [
      { id: "opt-1", position: { x: 100, y: 100 }, data: { label: "USER_PROFILE", fields: [{ name: "id" }, { name: "email" }, { name: "pref_id" }, { name: "theme" }] }, type: "default" },
      { id: "opt-2", position: { x: 500, y: 100 }, data: { label: "ORDER_DETAILS_DENORM", fields: [{ name: "id" }, { name: "user_id" }, { name: "prod_id" }, { name: "qty" }, { name: "price" }] }, type: "default" }
    ];
    return [...filtered, ...merged].map((n, i) => ({ ...n, id: `opt-${n.id}-${i}`, position: { x: (i % 3) * 300, y: Math.floor(i / 3) * 250 } }));
  }, [nodes]);

  const optimizedEdges = useMemo(() => {
    return (edges || []).filter(e => {
      const s = (nodes || []).find(n => n.id === e.source)?.data?.label;
      const t = (nodes || []).find(n => n.id === e.target)?.data?.label;
      return !["USERS", "USER_SETTINGS", "ORDERS", "LINE_ITEMS"].includes(s) && !["USERS", "USER_SETTINGS", "ORDERS", "LINE_ITEMS"].includes(t);
    });
  }, [edges, nodes]);

  if (!started) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#FBFCFF", p: 4 }}>
        <Paper sx={{ p: 6, borderRadius: 8, border: "1px solid #E2E8F0", maxWidth: 600, textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.05)" }}>
          <Box sx={{ mb: 4, display: "inline-flex", p: 2, bgcolor: "primary.main", borderRadius: "24px", color: "white" }}>
            <CachedIcon sx={{ fontSize: 40 }} />
          </Box>
          <Typography variant="h4" fontWeight={900} mb={2}>Benchmark Your Model</Typography>
          <Typography variant="body1" color="#64748B" mb={4} lineHeight={1.6}>
            Proceed to analyze your data model's performance. Our AI engine will evaluate join complexity, estimate storage costs, and suggest architectural optimizations to improve latency.
          </Typography>

          <Grid container spacing={2} sx={{ mb: 6 }}>
            {[
              { label: "Entities Found", value: (nodes || []).length, icon: <HubIcon fontSize="small" /> },
              { label: "Rel. Detected", value: (edges || []).length, icon: <LinkIcon fontSize="small" /> }
            ].map((stat, i) => (
              <Grid item xs={6} key={i}>
                <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: 4, border: "1px solid #F1F5F9" }}>
                  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" mb={0.5}>
                    <Box sx={{ color: "primary.main", display: "flex" }}>{stat.icon}</Box>
                    <Typography variant="h6" fontWeight={800}>{stat.value}</Typography>
                  </Stack>
                  <Typography variant="caption" fontWeight={700} color="#64748B">{stat.label.toUpperCase()}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Button 
            variant="contained" 
            size="large" 
            fullWidth
            onClick={() => setStarted(true)}
            sx={{ 
              py: 2, 
              borderRadius: 4, 
              textTransform: "none", 
              fontWeight: 900, 
              fontSize: "1.1rem",
              boxShadow: "0 10px 20px rgba(37, 99, 235, 0.2)"
            }}
          >
            Start Benchmarking
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#F8FAFC" }}>
      {/* Stepper Header */}
      <Box sx={{ p: 3, bgcolor: "white", borderBottom: "1px solid #E2E8F0" }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>
                <Typography variant="caption" fontWeight={700}>{label}</Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Step Content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box sx={{ flex: 1, p: 4, overflowY: "auto" }}>
          <Box sx={{ maxWidth: 1000, mx: "auto" }}>
            
            {activeStep === 0 && (
              <Box>
                <Grid container spacing={3} sx={{ mb: 6 }}>
                  {[
                    { label: "Total Tables", value: stats.totalTables, color: "primary.main" },
                    { label: "Estimated Rows", value: stats.totalRows.toLocaleString(), color: "#059669" },
                    { label: "Avg. Latency", value: stats.avgLatency, color: "#7C3AED" },
                    { label: "Est. Storage Cost", value: stats.totalEstCost, color: "#B45309" }
                  ].map((s, i) => (
                    <Grid item xs={12} md={3} key={i}>
                      <Paper sx={{ p: 2, borderRadius: 3, border: "1px solid #E2E8F0", textAlign: "center" }}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: "block", mb: 0.5 }}>{s.label.toUpperCase()}</Typography>
                        <Typography variant="h5" fontWeight={900} sx={{ color: s.color }}>{s.value}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1" fontWeight={900}>Step 1: Baseline Performance Breakdown</Typography>
                  <Chip label="CURRENT MODEL" size="small" sx={{ fontWeight: 900, fontSize: 10, bgcolor: "#F1F5F9" }} />
                </Stack>
                <Paper sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid #E2E8F0" }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", bgcolor: "#F8FAFC", p: 2, borderBottom: "2px solid #E2E8F0" }}>
                    {["Entity Name", "Est. Rows", "Cols", "Indices", "Latency", "Scan Cost"].map((h, hi) => (
                      <Typography key={hi} variant="caption" fontWeight={900} color="#64748B">{h.toUpperCase()}</Typography>
                    ))}
                  </Box>
                  <Stack divider={<Divider />}>
                    {(nodes || []).map((n, ni) => {
                      const rowCount = Math.floor(Math.random() * 900000) + 100000;
                      const colCount = (n.data?.fields || []).length || 5;
                      const cost = (rowCount / 1000000 * 0.05).toFixed(4);
                      return (
                        <Box key={ni} sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", p: 2, "&:hover": { bgcolor: "#FBFCFF" } }}>
                          <Typography variant="body2" fontWeight={700} color="primary">{n.data?.label || n.id}</Typography>
                          <Typography variant="body2" fontWeight={600} color="#334155">{rowCount.toLocaleString()}</Typography>
                          <Typography variant="body2" color="#64748B">{colCount}</Typography>
                          <Typography variant="body2" color="#64748B">{Math.floor(colCount/3) + 1}</Typography>
                          <Typography variant="body2" fontWeight={700} color="#059669">~{Math.floor(Math.random() * 50) + 10}ms</Typography>
                          <Typography variant="body2" fontWeight={900} color="#B45309">${cost}</Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                <Box sx={{ mb: 4, textAlign: "center" }}>
                  <Typography variant="h5" fontWeight={900}>AI Optimization & Model Choice</Typography>
                  <Typography variant="body2" color="text.secondary">Compare your current physical schema with our AI-optimized proposal and select your preferred model.</Typography>
                </Box>
                
                <Grid container spacing={4}>
                  {/* Side-by-Side Canvases for Choice */}
                  <Grid item xs={12} md={6}>
                    <Paper 
                      sx={{ 
                        p: 0, 
                        borderRadius: 4, 
                        bgcolor: selectedModel === "base" ? "white" : "#F8FAFC", 
                        border: selectedModel === "base" ? "3px solid #3B82F6" : "1px solid #E2E8F0", 
                        height: 500, 
                        position: "relative", 
                        overflow: "hidden",
                        transition: "all 0.2s"
                      }}
                    >
                      <Box sx={{ position: "absolute", top: 12, left: 12, zIndex: 10, bgcolor: "rgba(255,255,255,0.9)", px: 1.5, py: 0.5, borderRadius: 2, border: "1px solid #E2E8F0" }}>
                        <Typography variant="caption" fontWeight={900} color="#64748B">BASE MODEL (CURRENT)</Typography>
                      </Box>
                      <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        fitView
                        zoomOnScroll={false}
                        panOnScroll={false}
                        nodesDraggable={false}
                        elementsSelectable={false}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                      >
                        <Background color="#CBD5E1" gap={20} />
                      </ReactFlow>
                      <Box sx={{ position: "absolute", bottom: 16, left: 16, right: 16, zIndex: 10 }}>
                        <Button 
                          fullWidth 
                          variant={selectedModel === "base" ? "contained" : "outlined"}
                          onClick={() => setSelectedModel("base")}
                          startIcon={selectedModel === "base" ? <CheckCircleIcon /> : null}
                          sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}
                        >
                          {selectedModel === "base" ? "Current Model Selected" : "Select Base Model"}
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper 
                      sx={{ 
                        p: 0, 
                        borderRadius: 4, 
                        bgcolor: selectedModel === "optimized" ? "white" : "#F8FAFC", 
                        border: selectedModel === "optimized" ? "3px solid #10B981" : "1px solid #E2E8F0", 
                        height: 500, 
                        position: "relative", 
                        overflow: "hidden",
                        transition: "all 0.2s"
                      }}
                    >
                      <Box sx={{ position: "absolute", top: 12, left: 12, zIndex: 10, bgcolor: "rgba(255,255,255,0.9)", px: 1.5, py: 0.5, borderRadius: 2, border: "2px solid #10B981" }}>
                        <Typography variant="caption" fontWeight={900} color="#059669">AI OPTIMIZED MODEL</Typography>
                      </Box>
                      <ReactFlow
                        nodes={optimizedNodes}
                        edges={optimizedEdges}
                        fitView
                        zoomOnScroll={false}
                        panOnScroll={false}
                        nodesDraggable={false}
                        elementsSelectable={false}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                      >
                        <Background color="#10B981" variant="dots" gap={20} style={{ opacity: 0.1 }} />
                      </ReactFlow>
                      <Box sx={{ position: "absolute", bottom: 16, left: 16, right: 16, zIndex: 10 }}>
                        <Button 
                          fullWidth 
                          variant={selectedModel === "optimized" ? "contained" : "outlined"}
                          color="success"
                          onClick={() => setSelectedModel("optimized")}
                          startIcon={selectedModel === "optimized" ? <CheckCircleIcon /> : null}
                          sx={{ borderRadius: 2, fontWeight: 900, textTransform: "none" }}
                        >
                          {selectedModel === "optimized" ? "Optimized Model Selected" : "Select Optimized Model"}
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Rationale Cards */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight={900} color="text.secondary" mb={2} px={1}>OPTIMIZATION RATIONALE</Typography>
                    <Stack spacing={2}>
                      {mergingSuggestions.map((s, i) => (
                        <Paper key={i} sx={{ p: 2, borderRadius: 3, border: "1px solid #E2E8F0", bgcolor: "#FBFCFF" }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <AutoAwesomeIcon sx={{ color: "#10B981", fontSize: 18 }} />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              <strong>{s.target}:</strong> {s.reason}
                            </Typography>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            )}

            {activeStep === 2 && (
              <Box>
                <Box sx={{ mb: 4, textAlign: "center" }}>
                  <Typography variant="h5" fontWeight={900}>Performance Projection</Typography>
                  <Typography variant="body2" color="text.secondary">Detailed performance and cost metrics for your <strong>{selectedModel.toUpperCase()}</strong> model.</Typography>
                </Box>
                
                <Grid container spacing={4} justifyContent="center">
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 4, borderRadius: 6, bgcolor: "white", border: `2px solid ${selectedModel === "optimized" ? "#10B981" : "#3B82F6"}` }}>
                      <Box sx={{ textAlign: "center", mb: 4 }}>
                        <Chip 
                          label={selectedModel === "optimized" ? "AI RECOMMENDED" : "CURRENT BASE"} 
                          size="small" 
                          sx={{ bgcolor: selectedModel === "optimized" ? "#10B981" : "#3B82F6", color: "white", fontWeight: 900, mb: 1 }} 
                        />
                        <Typography variant="h6" fontWeight={900} color={selectedModel === "optimized" ? "#059669" : "#1E293B"}>
                          {selectedModel === "optimized" ? "Optimized Projection" : "Baseline Performance"}
                        </Typography>
                      </Box>

                      <Stack spacing={4}>
                        {[
                          { 
                            label: "JOIN COMPLEXITY", 
                            val: selectedModel === "optimized" ? "Low" : "High", 
                            sub: selectedModel === "optimized" ? "3-5 joins per query" : "8-12 joins per query",
                            icon: <HubIcon sx={{ color: selectedModel === "optimized" ? "#10B981" : "#3B82F6" }} />
                          },
                          { 
                            label: "P99 LATENCY", 
                            val: selectedModel === "optimized" ? "82ms" : "145ms", 
                            sub: selectedModel === "optimized" ? "43% faster throughput" : "Standardized baseline",
                            icon: <CachedIcon sx={{ color: selectedModel === "optimized" ? "#10B981" : "#3B82F6" }} />
                          },
                          { 
                            label: "SCAN COST (EST)", 
                            val: selectedModel === "optimized" ? "$0.024/day" : "$0.042/day", 
                            sub: selectedModel === "optimized" ? "Reduced I/O overhead" : "Unoptimized read volume",
                            icon: <StorageIcon sx={{ color: selectedModel === "optimized" ? "#10B981" : "#3B82F6" }} />
                          }
                        ].map((m, i) => (
                          <Box key={i} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2.5, borderRadius: 4, bgcolor: "#F8FAFC" }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              {m.icon}
                              <Box>
                                <Typography variant="caption" fontWeight={900} color="text.secondary">{m.label}</Typography>
                                <Typography variant="h6" fontWeight={800}>{m.val}</Typography>
                              </Box>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>{m.sub}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 6, p: 4, borderRadius: 6, bgcolor: "primary.main", color: "white", textAlign: "center", boxShadow: "0 20px 40px rgba(37, 99, 235, 0.2)" }}>
                  <Typography variant="h5" fontWeight={900} mb={1}>Finalize Model Selection?</Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, mb: 4 }}>
                    You've selected the <strong>{selectedModel.toUpperCase()}</strong> model. This choice will define the physical structure and mapping logic used in Stage 3.
                  </Typography>
                  <Button 
                    variant="contained" 
                    size="large"
                    sx={{ bgcolor: "white", color: "primary.main", fontWeight: 900, px: 6, py: 1.5, borderRadius: 3, "&:hover": { bgcolor: "#F1F5F9" } }}
                  >
                    Confirm & Proceed to Stage 3
                  </Button>
                </Box>
              </Box>
            )}

          </Box>
        </Box>

        {/* Stepper Footer Controls */}
        <Box sx={{ p: 2, bgcolor: "white", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between" }}>
          <Button 
            variant="outlined" 
            disabled={activeStep === 0} 
            onClick={handleBack}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            Back
          </Button>
          <Button 
            variant="contained" 
            disabled={activeStep === steps.length - 1} 
            onClick={handleNext}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            {activeStep === steps.length - 1 ? "Finished" : "Next Step"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Stage 3: Documentation ───────────────────────────────────────────────────
function Stage3({ nodes: sourceNodes, edges: sourceEdges, viewerMode = false }) {
  const [subTab, setSubTab] = useState(0);
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Documentation State
  const [editableDoc, setEditableDoc] = useState("");

  // AI & Doc State
  const [nodeDescriptions, setNodeDescriptions] = useState({});
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([
    { role: "ai", text: "Hi! I'm your Documentation Agent. I can help you write descriptions, explain relationships, or format your export." }
  ]);
  const [thinking, setThinking] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef(null);
  const messagesEnd = useRef(null);

  useEffect(() => {
    if (messagesEnd.current) {
      messagesEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, thinking]);

  useEffect(() => {
    if (viewerMode) {
      setAiOpen(false);
    }
  }, [viewerMode]);

  const getDesc = (node) => nodeDescriptions[node.id] || `The ${node.data.label} entity is a core component of the data model, responsible for persisting structural information related to business operations.`;

  const doc = (sourceNodes || []).map(n => `## ${n.data.label}\n\n**Description:** ${getDesc(n)}\n\n| Field | Type | Constraints |\n|-------|------|-------------|\n${(n.data.fields || []).map(f => `| ${f.name} | ${f.type} | ${f.isPrimary ? "PRIMARY KEY" : "—"} |`).join("\n")}`).join("\n\n---\n\n");
  const relDoc = (sourceEdges || []).map(e => { const s = (sourceNodes || []).find(n => n.id === e.source); const t = (sourceNodes || []).find(n => n.id === e.target); return s && t ? `- **${s.data.label}** → **${t.data.label}** (${e.label || "relates to"})` : ""; }).filter(Boolean).join("\n");

  // Mapping State (Table-based instead of Canvas)
  const [mappings, setMappings] = useState([
    { id: 1, sourceTable: "ORDERS", sourceField: "id", targetTable: "DW_ORDERS_FACT", targetField: "order_key", logic: "Direct" },
    { id: 2, sourceTable: "USERS", sourceField: "name", targetTable: "DW_ORDERS_FACT", targetField: "user_id", logic: "Lookup" },
    { id: 3, sourceTable: "PRODUCTS", sourceField: "sku", targetTable: "DW_PRODUCTS_DIM", targetField: "sku", logic: "Direct" },
  ]);

  // Final Model Visualization Data
  const finalNodes = useMemo(() => {
    const uniqueTargets = [...new Set(mappings.map(m => m.targetTable).filter(Boolean))];
    return uniqueTargets.map((tbl, i) => {
      const fields = mappings.filter(m => m.targetTable === tbl).map(m => ({ name: m.targetField }));
      return {
        id: `tgt-${tbl}`,
        type: "targetNode",
        position: { x: 100 + (i % 3) * 350, y: 100 + Math.floor(i / 3) * 300 },
        data: { label: tbl, fields }
      };
    });
  }, [mappings]);

  const addMappingRow = () => {
    setMappings(prev => [...prev, { id: Date.now(), sourceTable: "", sourceField: "", targetTable: "", targetField: "", logic: "Direct" }]);
  };

  const updateMapping = (id, key, val) => {
    setMappings(prev => prev.map(m => m.id === id ? { ...m, [key]: val } : m));
  };

  const deleteMapping = (id) => {
    setMappings(prev => prev.filter(m => m.id !== id));
  };

  // Sync editableDoc when generated
  useEffect(() => {
    if (generated && !editableDoc) {
      setEditableDoc(`# Data Model Documentation\n\n${doc}\n\n## Relationships\n${relDoc}`);
    }
  }, [generated, doc, relDoc, editableDoc]);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1500);
  };

  const onNodeClick = (_, node) => {
    setSelectedNodeId(node.id);
  };

  const sendMessage = (text) => {
    if (!text?.trim()) return;
    setAiMessages(prev => [...prev, { role: "user", text }]);
    setAiInput("");
    setThinking(true);

    setTimeout(() => {
      let reply = "I've processed your request. What else can I help with?";
      const msg = text.toLowerCase();
      
      // AI logic for table-based mapping
      if (msg.includes("add mapping") || msg.includes("map")) {
        const newMapping = { id: Date.now(), sourceTable: "NEW_SRC", sourceField: "field", targetTable: "NEW_TGT", targetField: "key", logic: "Direct" };
        setMappings(prev => [...prev, newMapping]);
        reply = "I've added a new mapping row for you to configure.";
      } else if (msg.includes("description") || msg.includes("update") || msg.includes("set")) {
        const targetNode = (sourceNodes || []).find(n => msg.includes(n.data.label.toLowerCase()));
        if (targetNode) {
          const descMatch = text.match(/(?:to|as)\s+['"](.+?)['"]/i) || text.match(/(?:to|as)\s+(.+)$/i);
          if (descMatch) {
            const newDesc = descMatch[1];
            setNodeDescriptions(prev => ({ ...prev, [targetNode.id]: newDesc }));
            setEditableDoc(""); // Trigger reload
            reply = `Updated the description for **${targetNode.data.label}** to: "${newDesc}"`;
          }
        }
      } else if (msg.includes("explain")) {
        reply = "Looking at the schema, this entity stores core business data with optimized indexing for the target warehouse.";
      }

      setAiMessages(prev => [...prev, { role: "ai", text: reply }]);
      setThinking(false);
    }, 1000);
  };

  const toggleVoice = async () => {
    if (recording) { mediaRef.current?.stop(); setRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.onstop = () => { 
        stream.getTracks().forEach(t => t.stop()); 
        sendMessage("Summarize the USERS table mapping and set description to 'Primary account records'."); 
      };
      recorder.start(); mediaRef.current = recorder; setRecording(true);
      setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 5000);
    } catch { sendMessage("(Voice input not supported — please type instead)"); }
  };

  const selectedNode = (sourceNodes || []).find(n => n.id === selectedNodeId);

  // Markdown Viewer Helper
  const MdViewer = ({ text }) => {
    if (!text) return null;
    const lines = text.split("\n");
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === "") {
        elements.push(<Box key={`space-${i}`} sx={{ height: 8 }} />);
        i++;
        continue;
      }

      // Headings
      if (line.startsWith("# ")) {
        elements.push(<Typography key={i} variant="h4" fontWeight={900} sx={{ mt: 4, mb: 2, color: "#1E293B" }}>{line.replace("# ", "")}</Typography>);
        i++; continue;
      }
      if (line.startsWith("## ")) {
        elements.push(<Typography key={i} variant="h5" fontWeight={900} sx={{ mt: 3, mb: 1.5, color: "primary.main" }}>{line.replace("## ", "")}</Typography>);
        i++; continue;
      }
      if (line.startsWith("### ")) {
        elements.push(<Typography key={i} variant="h6" fontWeight={800} sx={{ mt: 2, mb: 1, color: "#334155" }}>{line.replace("### ", "")}</Typography>);
        i++; continue;
      }

      // Horizontal Rule
      if (line.trim() === "---") {
        elements.push(<Divider key={i} sx={{ my: 4, opacity: 0.6 }} />);
        i++; continue;
      }

      // Lists
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const listItems = [];
        while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
          listItems.push(lines[i].trim().substring(2));
          i++;
        }
        elements.push(
          <Stack key={`list-${i}`} spacing={1} sx={{ ml: 2, mb: 3 }}>
            {listItems.map((item, li) => (
              <Box key={li} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.main", mt: 1, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: "#475569", lineHeight: 1.6 }}>{item}</Typography>
              </Box>
            ))}
          </Stack>
        );
        continue;
      }

      // Tables
      if (line.startsWith("|") && lines[i+1]?.includes("|---")) {
        const headers = line.split("|").map(h => h.trim()).filter(Boolean);
        i += 2; // skip divider row
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          const cells = lines[i].split("|").map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          if (cells.length > 0) rows.push(cells);
          i++;
        }
        elements.push(
          <Paper key={`table-${i}`} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", my: 3, border: "1px solid #E2E8F0", bgcolor: "white" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${headers.length}, 1fr)`, bgcolor: "#F8FAFC", p: 1.5, borderBottom: "2px solid #E2E8F0" }}>
              {headers.map((h, hi) => <Typography key={hi} variant="caption" fontWeight={900} color="#64748B" textAlign="left" sx={{ letterSpacing: 0.5 }}>{h.toUpperCase()}</Typography>)}
            </Box>
            <Stack divider={<Divider />}>
              {rows.map((row, ri) => (
                <Box key={ri} sx={{ display: "grid", gridTemplateColumns: `repeat(${headers.length}, 1fr)`, p: 1.5, "&:hover": { bgcolor: "#FBFCFF" }, transition: "background 0.2s" }}>
                  {row.map((cell, ci) => <Typography key={ci} variant="body2" sx={{ fontSize: "0.7rem", color: "#334155", fontWeight: ci === 0 ? 600 : 400 }}>{cell}</Typography>)}
                </Box>
              ))}
            </Stack>
          </Paper>
        );
        continue;
      }

      // Paragraphs with Bold support
      let content = line;
      const parts = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIdx = 0;
      let match;
      
      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIdx) parts.push(content.substring(lastIdx, match.index));
        parts.push(<Box component="span" key={match.index} sx={{ fontWeight: 800, color: "#1E293B" }}>{match[1]}</Box>);
        lastIdx = boldRegex.lastIndex;
      }
      if (lastIdx < content.length) parts.push(content.substring(lastIdx));

      elements.push(
        <Typography key={`p-${i}`} variant="body2" sx={{ lineHeight: 1.8, color: "#475569", mb: 1 }}>
          {parts.length > 0 ? parts : content}
        </Typography>
      );
      i++;
    }

    return <Box sx={{ pb: 10 }}>{elements}</Box>;
  };
  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#F8FAFC" }}>
      {/* Sub-navigation */}
      <Box sx={{ px: 3, bgcolor: "white", borderBottom: "1px solid #E2E8F0" }}>
        <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} sx={{ minHeight: 48 }}>
          <Tab 
            icon={<RuleIcon sx={{ fontSize: 16 }} />} 
            iconPosition="start" 
            label="Interactive Mapping" 
            sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.7rem", minHeight: 48 }} 
          />
          <Tab 
            icon={<DescriptionIcon sx={{ fontSize: 16 }} />} 
            iconPosition="start" 
            label="Documentation Hub" 
            sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.7rem", minHeight: 48 }} 
          />
          <Tab 
            icon={<ViewQuiltIcon sx={{ fontSize: 16 }} />} 
            iconPosition="start" 
            label="Final Model" 
            sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.7rem", minHeight: 48 }} 
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {subTab === 0 && (
          <Box sx={{ flex: 1, p: 3, display: "flex", flexDirection: "column", gap: 3, overflow: "hidden" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="h6" fontWeight={800}>Source to Target Mapping</Typography>
                <Typography variant="body2" color="text.secondary">Define rules for moving data from your shop to the warehouse.</Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addMappingRow} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}>Add Mapping</Button>
                {!viewerMode && (
                  <Button variant="contained" startIcon={<AutoFixHighIcon />} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, background: "linear-gradient(135deg,#3B82F6,#8B5CF6)", border: "none" }}>AI Auto-Map</Button>
                )}
              </Stack>
            </Box>
            
            <Paper sx={{ flex: 1, borderRadius: 3, border: "1px solid #E2E8F0", overflow: "auto", bgcolor: "white" }}>
              <Box sx={{ minWidth: 800 }}>
                {/* Header */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 0.4fr 1.2fr 1.2fr 0.4fr", bgcolor: "#F8FAFC", p: 2, borderBottom: "1px solid #E2E8F0", gap: 2 }}>
                  {["SOURCE TABLE", "SOURCE FIELD", "", "TARGET TABLE", "TARGET FIELD", ""].map((h, i) => <Typography key={i} variant="caption" fontWeight={900} color="#64748B">{h}</Typography>)}
                </Box>
                
                {/* Rows */}
                <Stack divider={<Divider />}>
                  {mappings.map((m) => {
                    const selectedSourceNode = (sourceNodes || []).find(n => n.data.label === m.sourceTable);
                    const sourceFields = selectedSourceNode?.data?.fields || [];
                    
                    return (
                      <Box key={m.id} sx={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 0.4fr 1.2fr 1.2fr 0.4fr", p: 2, gap: 2, alignItems: "center", "&:hover": { bgcolor: "#FBFCFF" } }}>
                        {/* Source Table Dropdown */}
                        <Select 
                          size="small" 
                          value={m.sourceTable} 
                          onChange={e => {
                            updateMapping(m.id, "sourceTable", e.target.value);
                            updateMapping(m.id, "sourceField", ""); // Reset field on table change
                          }} 
                          sx={{ fontSize: "0.65rem", fontWeight: 600 }}
                          displayEmpty
                        >
                          <MenuItem value="" disabled>Select Table</MenuItem>
                          {(sourceNodes || []).map(n => (
                            <MenuItem key={n.id} value={n.data.label} sx={{ fontSize: "0.65rem" }}>{n.data.label}</MenuItem>
                          ))}
                        </Select>

                        {/* Source Field Dropdown */}
                        <Select 
                          size="small" 
                          value={m.sourceField} 
                          onChange={e => updateMapping(m.id, "sourceField", e.target.value)} 
                          sx={{ fontSize: "0.65rem" }}
                          disabled={!m.sourceTable}
                          displayEmpty
                        >
                          <MenuItem value="" disabled>Select Field</MenuItem>
                          {sourceFields.map((f, fi) => (
                            <MenuItem key={fi} value={f.name} sx={{ fontSize: "0.65rem" }}>{f.name}</MenuItem>
                          ))}
                        </Select>
                        
                        <ChevronRightIcon sx={{ color: "#CBD5E1" }} />
                        
                        <TextField size="small" placeholder="Target Table" value={m.targetTable} onChange={e => updateMapping(m.id, "targetTable", e.target.value)} sx={{ "& .MuiInputBase-input": { fontSize: "0.65rem", fontWeight: 600 } }} />
                        <TextField size="small" placeholder="Target Field" value={m.targetField} onChange={e => updateMapping(m.id, "targetField", e.target.value)} sx={{ "& .MuiInputBase-input": { fontSize: "0.65rem" } }} />
                        
                        <IconButton size="small" onClick={() => deleteMapping(m.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    );
                  })}

                  {mappings.length === 0 && (
                    <Box sx={{ p: 10, textAlign: "center", color: "text.secondary" }}>
                      <RuleIcon sx={{ fontSize: 48, opacity: 0.2, mb: 2 }} />
                      <Typography variant="body2" fontWeight={600}>No mapping rules defined yet.</Typography>
                      <Button variant="text" size="small" onClick={addMappingRow} sx={{ mt: 1, fontWeight: 700 }}>Click to add your first rule</Button>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Paper>
          </Box>
        )}

        {subTab === 1 && (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
             {!generated ? (
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
                <Paper sx={{ p: 6, borderRadius: 8, border: "1px solid #E2E8F0", maxWidth: 600, textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.05)" }}>
                  <Box sx={{ mb: 4, display: "inline-flex", p: 2, bgcolor: "#EFF6FF", borderRadius: "24px", color: "primary.main" }}>
                    <DescriptionIcon sx={{ fontSize: 40 }} />
                  </Box>
                  <Typography variant="h4" fontWeight={900} mb={2}>Documentation Hub</Typography>
                  <Typography variant="body1" color="#64748B" mb={4} lineHeight={1.6}>
                    Generate comprehensive technical documentation for your data model. This includes entity descriptions, relationship mapping, and field-level metadata.
                  </Typography>
                  <Button 
                    variant="contained" 
                    size="large" 
                    disabled={generating}
                    onClick={generate}
                    startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
                    sx={{ py: 2, px: 6, borderRadius: 4, fontWeight: 900, textTransform: "none" }}
                  >
                    {generating ? "Synthesizing Documentation..." : "Generate Full Documentation"}
                  </Button>
                </Paper>
              </Box>
            ) : (
              <Box sx={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
                
                {/* Left Pane: Editor */}
                <Box sx={{ 
                  width: aiOpen ? "35%" : "45%", 
                  display: "flex", 
                  flexDirection: "column", 
                  borderRight: "1px solid #E2E8F0", 
                  bgcolor: "white",
                  transition: "width 0.3s ease"
                }}>
                  <Box sx={{ p: 2, borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#F8FAFC" }}>
                    <Typography variant="caption" fontWeight={900} color="#64748B" letterSpacing={1}>MARKDOWN SOURCE</Typography>
                    <Chip label="EDITABLE" size="small" sx={{ height: 18, fontSize: "0.55rem", fontWeight: 900, bgcolor: "#DBEAFE", color: "primary.main" }} />
                  </Box>
                  <TextField
                    multiline
                    fullWidth
                    variant="standard"
                    value={editableDoc}
                    onChange={(e) => setEditableDoc(e.target.value)}
                    placeholder="Write documentation here..."
                    sx={{ 
                      flex: 1, 
                      "& .MuiInputBase-root": { 
                        display: "flex",
                        alignItems: "flex-start",
                        p: 2, 
                        fontFamily: "monospace", 
                        fontSize: "0.75rem", 
                        lineHeight: 1.6,
                        height: "100%",
                        overflow: "auto !important" 
                      },
                      "& .MuiInputBase-input": {
                        height: "100% !important",
                        overflow: "auto !important"
                      }
                    }}
                    InputProps={{ disableUnderline: true }}
                  />
                </Box>

                {/* Right Pane: Viewer (Rendered MD) */}
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", bgcolor: "#FBFCFF", overflow: "hidden" }}>
                  <Box sx={{ p: 2, borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "white" }}>
                    <Typography variant="caption" fontWeight={900} color="#64748B" letterSpacing={1}>RENDERED PREVIEW</Typography>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="text" startIcon={<DownloadIcon />} sx={{ fontSize: "0.6rem", fontWeight: 800 }}>Export PDF</Button>
                      {!viewerMode && (
                        <Button 
                          size="small" 
                          variant="text" 
                          startIcon={<AutoAwesomeIcon />} 
                          onClick={() => setAiOpen(!aiOpen)} 
                          sx={{ fontSize: "0.6rem", fontWeight: 800, color: aiOpen ? "primary.main" : "text.secondary" }}
                        >
                          AI Agent
                        </Button>
                      )}
                    </Stack>
                  </Box>
                  <Box sx={{ flex: 1, overflow: "auto", p: 4 }}>
                    <Box sx={{ maxWidth: 800, mx: "auto" }}>
                      <MdViewer text={editableDoc} />
                    </Box>
                  </Box>
                </Box>

                {/* AI Sidebar */}
                {!viewerMode && (
                <Box sx={{ 
                  width: aiOpen ? 300 : 0, 
                  borderLeft: aiOpen ? "1px solid #E2E8F0" : "none", 
                  bgcolor: "white", 
                  overflow: "hidden", 
                  display: "flex", 
                  flexDirection: "column",
                  transition: "width 0.3s ease"
                }}>
                  <Box sx={{ p: 2, borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AutoAwesomeIcon sx={{ fontSize: 16, color: "primary.main" }} />
                      DOC AGENT
                    </Typography>
                    <IconButton size="small" onClick={() => setAiOpen(false)}><CloseIcon fontSize="small" /></IconButton>
                  </Box>
                  
                  <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                    {aiMessages.map((m, i) => (
                      <Box key={i} sx={{ 
                        alignSelf: m.role === "ai" ? "flex-start" : "flex-end",
                        bgcolor: m.role === "ai" ? "#F1F5F9" : "primary.main",
                        color: m.role === "ai" ? "#1E293B" : "white",
                        p: 1.5, borderRadius: 3, maxWidth: "90%", fontSize: "0.7rem",
                        boxShadow: m.role === "ai" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                        lineHeight: 1.5
                      }}>
                        {m.text}
                      </Box>
                    ))}
                    {thinking && <CircularProgress size={20} sx={{ m: 1 }} />}
                    <div ref={messagesEnd} />
                  </Box>

                  <Box sx={{ p: 2, borderTop: "1px solid #E2E8F0" }}>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Ask agent to refine doc..."
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") sendMessage(aiInput); }}
                        sx={{ "& .MuiInputBase-root": { fontSize: "0.7rem", bgcolor: "#F8FAFC" } }}
                      />
                      <IconButton size="small" onClick={() => sendMessage(aiInput)} sx={{ bgcolor: "primary.main", color: "white", "&:hover": { bgcolor: "primary.dark" } }}>
                        <SendIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
                )}
              </Box>
            )}
          </Box>
        )}

        {subTab === 2 && (
          <Box sx={{ flex: 1, p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="h6" fontWeight={800}>Target Data Warehouse Model</Typography>
                <Typography variant="body2" color="text.secondary">Visualizing the final tables and schemas created in your destination warehouse.</Typography>
              </Box>
              <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}>DDL Script</Button>
            </Box>

            <Box sx={{ flex: 1, bgcolor: "white", borderRadius: 4, border: "1px solid #E2E8F0", overflow: "hidden", position: "relative" }}>
               {finalNodes.length === 0 ? (
                 <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
                    <ViewQuiltIcon sx={{ fontSize: 64, color: "#CBD5E1" }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>No Target Tables detected. Define mappings first.</Typography>
                 </Box>
               ) : (
                 <ReactFlow
                    nodes={finalNodes}
                    edges={[]}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    proOptions={{ hideAttribution: true }}
                 >
                    <Background color="#CBD5E1" gap={20} variant="dots" />
                    <Controls />
                 </ReactFlow>
               )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── Stage 4: Cloud Integration ───────────────────────────────────────────────
function Stage4({ nodes: modelNodes, edges: modelEdges, isProvisioning, setIsProvisioning, provisioned, setProvisioned }) {
  const [configured, setConfigured] = useState({ gcp: true, fabric: true }); // Default prominent ones
  
  const handleProvision = () => {
    setIsProvisioning(true);
    setTimeout(() => {
      setIsProvisioning(false);
      setProvisioned(true);
    }, 3000);
  };
  
  const platforms = [
    { id: "gcp", name: "Google BigQuery", color: "#4285F4", logo: gcpLogo, desc: "Serverless data warehouse" },
    { id: "fabric", name: "Microsoft Fabric", color: "#00A4EF", logo: fabricLogo, desc: "All-in-one analytics solution" },
    { id: "azure", name: "Azure", color: "#0078D4", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg", desc: "Microsoft Azure Data Warehouse" },
    { id: "aws", name: "AWS Redshift", color: "#FF9900", logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg", desc: "Amazon cloud data warehouse" },
  ];

  // Define canvas nodes
  const flowNodes = [
    // Central Source Node
    { 
      id: "source-model", 
      type: "entity", 
      position: { x: 50, y: 150 }, 
      data: { label: "Source Data Model", color: "#334155", fields: (modelNodes || []).map(n => ({ name: n?.data?.label || "Unknown", type: "TABLE" })) } 
    },
    // Target Cloud Nodes
    ...platforms?.map((p, idx) => ({
      id: p.id,
      type: "cloud",
      position: { x: 450, y: idx * 160 },
      data: { ...p, isConnected: !!configured[p.id] }
    }))
  ];

  // Define canvas edges (only for configured platforms)
  const flowEdges = platforms
    .filter(p => !!configured[p.id])
    .map(p => ({
      id: `e-source-${p.id}`,
      source: "source-model",
      target: p.id,
      animated: true,
      style: { stroke: p.color, strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: p.color }
    }));

  return (
    <Box sx={{ flex: 1, display: "flex", overflow: "hidden", bgcolor: "#F1F5F9", position: "relative" }}>
      {isProvisioning && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Box
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: "white",
              boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              border: "1px solid #E2E8F0"
            }}
          >
            <CircularProgress sx={{ mb: 3 }} />
            <AutoAwesomeIcon 
              sx={{ 
                fontSize: 32, 
                color: "primary.main", 
                mb: 1,
                animation: "pulse 1s infinite"
              }} 
            />
            <Typography variant="h6" fontWeight={900} color="primary.main" gutterBottom>
              Agent Provisioning Infrastructure...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mb: 3 }}>
              Configuring data warehouses, setting up schema objects, and establishing secure connections for the provisioned model.
            </Typography>
            <LinearProgress variant="indeterminate" sx={{ width: 220, borderRadius: 1, height: 4 }} />
          </Box>
        </Box>
      )}
      <Box sx={{ flex: 1, position: "relative" }}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
        >
          <Background color="#CBD5E1" gap={20} />
          <Controls />
        </ReactFlow>
      </Box>

      {/* Side Panel Controls */}
      <Box sx={{ width: 320, borderLeft: "1px solid #E2E8F0", bgcolor: "white", display: "flex", flexDirection: "column", p: 2 }}>
        <Typography fontWeight={800} mb={1}>Cloud Targets</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>Select and configure destination cloud platforms for your data model.</Typography>
        
        <Stack spacing={1.5} sx={{ overflowY: "auto", flex: 1 }}>
          {platforms.map(p => (
            <Paper key={p.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1, border: configured[p.id] ? `2.5px solid ${p.color}` : "1px solid #E2E8F0", transition: "all 0.2s" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography fontWeight={700} fontSize="0.8rem">{p.name}</Typography>
                {configured[p.id] && <CheckCircleIcon sx={{ color: p.color, fontSize: 16 }} />}
              </Stack>
              <Button 
                fullWidth 
                size="small" 
                variant={configured[p.id] ? "outlined" : "contained"}
                onClick={() => setConfigured(c => ({ ...c, [p.id]: !c[p.id] }))}
                sx={{ 
                  textTransform: "none", 
                  borderRadius: 1.5, 
                  fontWeight: 700, 
                  bgcolor: configured[p.id] ? "transparent" : p.color,
                  color: configured[p.id] ? p.color : "white",
                  borderColor: p.color,
                  "&:hover": { bgcolor: configured[p.id] ? `${p.color}10` : p.color, borderColor: p.color }
                }}
              >
                {configured[p.id] ? "Disconnect" : "Connect"}
              </Button>
            </Paper>
          ))}
        </Stack>
        
        <Button variant="contained" fullWidth 
          disabled={isProvisioning || provisioned}
          onClick={handleProvision}
          startIcon={
            provisioned ? <CheckCircleIcon /> : (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.3, mr: 0.5 }}>
                <Box component="img" src={gcpLogo} sx={{ width: 12, height: 12, objectFit: "contain" }} />
                <Box component="img" src={fabricLogo} sx={{ width: 12, height: 12, objectFit: "contain" }} />
                <Box component="img" src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg" sx={{ width: 12, height: 12 }} />
                <Box component="img" src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" sx={{ width: 12, height: 12 }} />
              </Box>
            )
          } 
          sx={{ 
            mt: 2, py: 1.5, borderRadius: 1.5, fontWeight: 900, fontSize: "0.9rem",
            background: provisioned ? "#10B981" : "linear-gradient(135deg,#3B82F6,#8B5CF6)",
            border: "none",
            "&:hover": { background: provisioned ? "#059669" : "linear-gradient(135deg,#2563EB,#7C3AED)" }
          }}
        >
          {isProvisioning ? "Provisioning..." : (provisioned ? "Infrastructure Provisioned" : "Provision Pipeline")}
        </Button>
      </Box>
    </Box>
  );
}

// ─── Pipeline Overview Canvas ─────────────────────────────────────────────────
// ─── Pipeline Overview ────────────────────────────────────────────────────────
function PipelineOverview({ onSelectStage, onOpenConfig, stages, isStage1Configured }) {
  const initialNodes = stages.map((stage, idx) => ({
    id: `stage-${stage.id}`,
    type: "pipelineStage",
    position: { x: idx * 350, y: 50 },
    data: { stage, idx, onSelectStage, onOpenConfig, isConfigured: stage.id === 1 ? isStage1Configured : true }
  }));

  const initialEdges = stages.slice(0, -1).map((stage, idx) => ({
    id: `edge-${stage.id}-${stages[idx+1].id}`,
    source: `stage-${stage.id}`,
    target: `stage-${stages[idx+1].id}`,
    type: "smoothstep",
    animated: true,
    style: { stroke: "#64748B", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#64748B" },
    radius: 10,
  }));

  return (
    <Box sx={{ flex: 1, position: "relative", bgcolor: "#F8FAFC", height: "100%", width: "100%" }}>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll={false}
        panOnScroll={true}
        preventScrolling={false}
      >
        <Background color="#CBD5E1" gap={24} />
      </ReactFlow>
      
      {/* Overlay Instructions */}
      <Box sx={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", pointerEvents: "none", textAlign: "center", zIndex: 10 }}>
        <Typography variant="h6" fontWeight={700} color="text.secondary" mb={0.5}>
          Data Model Pipeline Overview
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", bgcolor: "white", px: 1.5, py: 0.5, borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          Drag to pan • Click any stage to open
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────
export default function DataCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeModelId } = useParams();
  const { token, userRole, userData, region } = useAuth();
  const workflowId = location.state?.workflowId || location.state?.workflow?.id || null;
  const initialModelId = routeModelId ? Number(routeModelId) : (location.state?.modelId || null);
  const [activeStage, setActiveStage] = useState(null); // null = overview
  const [stages, setStages] = useState(INITIAL_STAGES);
  const [modelName, setModelName] = useState(location.state?.modelName || "New Data Model");
  const [dataModelId, setDataModelId] = useState(initialModelId);
  const [workflowRecord, setWorkflowRecord] = useState(location.state?.workflow || null);
  const viewerMode = isWorkflowViewer(userRole, workflowRecord || location.state?.workflow, Number(userData?.id));

  // Stage-scoped role flags (evaluated against Stage 0 = Data Model Design)
  // Developer = assigned as 'assignee' on this workflow's stage
  // Reviewer  = assigned as 'reviewer' on this workflow's stage
  const isDeveloper = isWorkflowDeveloper(userRole, workflowRecord || location.state?.workflow, Number(userData?.id), 0);
  const isReviewer  = isWorkflowReviewer(userRole, workflowRecord || location.state?.workflow, Number(userData?.id), 0);
  const canAccessReviewSubstage = isReviewer;
  const reviewerOnlyMode = !viewerMode && isReviewer && !isDeveloper;
  const canCompleteStage1 = !viewerMode && isReviewer;
  // isReadOnly: true when the user cannot edit anything in this stage
  // Viewer and pure-Reviewer (no assignee role) are read-only on the canvas
  const isReadOnly  = viewerMode || (!isDeveloper && !isReviewer && !isWorkflowDeveloper(userRole, workflowRecord || location.state?.workflow, Number(userData?.id)));

  // Lifted state for Modeling Stage
  const [activeTab, setActiveTab] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisioned, setProvisioned] = useState(false);
  const [dbmlOpen, setDbmlOpen] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [methodology, setMethodology] = useState("ER Diagram");
  const [relationType, setRelationType] = useState("1:N");

  const handleTabTransition = (index) => {
    if (index === activeTab) return;
    if (reviewerOnlyMode) {
      if (index !== 3) {
        setSnackbar({ open: true, message: "Reviewers can only access the Review stage.", severity: "info" });
        return;
      }
      setActiveTab(3);
      return;
    }
    if (viewerMode) {
      setActiveTab(index);
      return;
    }

    if (index === 3 && !canAccessReviewSubstage) {
      setSnackbar({ open: true, message: "Only assigned reviewers can access the Review substage.", severity: "warning" });
      return;
    }

    // Validation: Prevent switching from Conceptual if no entities
    if (activeTab === 0 && index > 0 && nodesArr[0].length === 0) {
      setSnackbar({ open: true, message: "Please add at least one entity to the Conceptual model before proceeding.", severity: "warning" });
      return;
    }

    // Confirmation popup for Conceptual to Logical/Physical
    if (activeTab === 0 && index > 0) {
      setPendingTabIdx(index);
      setTabConfirmOpen(true);
      return;
    }
    
    // Simulate AI Agent processing for forward transitions
    if (index > activeTab) {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveTab(index);
        setIsTransitioning(false);
      }, 2000);
    } else {
      setActiveTab(index);
    }
  };

  const confirmTabChange = () => {
    const index = pendingTabIdx;
    setTabConfirmOpen(false);
    setPendingTabIdx(null);
    
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(index);
      setIsTransitioning(false);
    }, 2000);
  };

  useEffect(() => {
    if (reviewerOnlyMode && activeTab !== 3) {
      setActiveTab(3);
    }
  }, [reviewerOnlyMode, activeTab]);

  useEffect(() => {
    if (!reviewerOnlyMode && activeTab === 3 && !canAccessReviewSubstage) {
      setActiveTab(2);
      setSnackbar({ open: true, message: "Only assigned reviewers can access the Review substage.", severity: "warning" });
    }
  }, [reviewerOnlyMode, activeTab, canAccessReviewSubstage]);

  const [engineers, setEngineers] = useState([]);
  const [assignedUserIds, setAssignedUserIds] = useState([]);
  const [reviewerIds, setReviewerIds] = useState([]);
  const [agentIds, setAgentIds] = useState([]);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [workflowConfigOpen, setWorkflowConfigOpen] = useState(false);
  const [tabConfirmOpen, setTabConfirmOpen] = useState(false);
  const [pendingTabIdx, setPendingTabIdx] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [isStage1Configured, setIsStage1Configured] = useState(false);
  const [isSavingModel, setIsSavingModel] = useState(false);
  const [autosaveState, setAutosaveState] = useState(viewerMode ? "read_only" : "idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [backgroundNotice, setBackgroundNotice] = useState("Preparing model workspace");
  const [modelReady, setModelReady] = useState(false);
  const [lastSavedBy, setLastSavedBy] = useState("");
  const saveTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const lastSavedSnapshotRef = useRef("");
  const saveInFlightRef = useRef(false);
  const pendingAutosaveRef = useRef(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchAssignableUsers(token);
        setEngineers(data.filter((user) => user.role !== "viewer"));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (token) {
      loadUsers();
    }
  }, [token]);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const data = await fetchAgents(token);
        setAvailableAgents(data);
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    };
    if (!token) return;
    if (viewerMode) {
      setAvailableAgents([]);
      return;
    }
    loadAgents();
  }, [token, viewerMode]);

  const handleAssignReviewer = (userId, isChecked) => {
    setReviewerIds(prev => isChecked ? [...prev, userId] : prev.filter(id => id !== userId));
  };

  const handleAssignAgent = (agentId, isChecked) => {
    setAgentIds(prev => isChecked ? [...prev, agentId] : prev.filter(id => id !== agentId));
  };

  const handleAgentCreated = (newAgent) => {
    setAvailableAgents(prev => [...prev, newAgent]);
    setAgentIds(prev => [...prev, newAgent.id]);
  };

  useEffect(() => {
    const loadWorkflow = async () => {
      try {
        const data = await fetchWorkflowById(workflowId, token);
        setWorkflowRecord(data);
        const stageOne = data.stages?.find((stage) => stage.stage_index === 0);
        if (stageOne) {
          setMethodology(stageOne.methodology || "ER Diagram");
          const assignments = stageOne.assignments || [];
          setAssignedUserIds(assignments.filter(a => a.role === 'assignee' && a.user_id).map(a => a.user_id));
          setReviewerIds(assignments.filter(a => a.role === 'reviewer' && a.user_id).map(a => a.user_id));
          setAgentIds(assignments.filter(a => a.agent_id).map(a => a.agent_id));
          setIsStage1Configured(Boolean(stageOne.methodology || assignments.length));
        }
      } catch (error) {
        console.error("Error fetching workflow:", error);
      }
    };

    if (workflowId && token) {
      loadWorkflow();
    }
  }, [workflowId, token]);

  const handleAssignMember = (userId, isChecked) => {
    if (viewerMode) return;
    setAssignedUserIds(prev => isChecked ? [...prev, userId] : prev.filter(id => id !== userId));
  };

  const handleSaveConfig = async () => {
    if (viewerMode) return;
    if (!workflowId || !workflowRecord) {
      setIsStage1Configured(true);
      setConfigDrawerOpen(false);
      return;
    }

    const updatedStages = (workflowRecord.stages || []).map((stage) =>
      stage.stage_index === 0
        ? {
            label: stage.label,
            stage_index: stage.stage_index,
            sequence: stage.sequence,
            status: stage.status,
            statusText: stage.statusText,
            description: stage.description,
            methodology,
            isActive: stage.isActive,
            disabled: stage.disabled,
            assignee_count: assignedUserIds.length,
            validation_enabled: stage.validation_enabled,
            assignments: assignedUserIds,
            reviewers: reviewerIds,
            agent_assignments: agentIds,
            substages: (stage.substages || []).map((substage, index, collection) => {
              if (substage.title === "Assigned") {
                return {
                  title: substage.title,
                  subtitle: assignedUserIds.length ? "COMPLETED" : "PENDING",
                  status: assignedUserIds.length ? "completed" : "pending",
                  type: substage.type,
                };
              }

              const assignedIndex = collection.findIndex((item) => item.title === "Assigned");
              if (index === assignedIndex + 1) {
                return {
                  title: substage.title,
                  subtitle: assignedUserIds.length ? "PROCESSING..." : substage.subtitle,
                  status: assignedUserIds.length ? "processing" : "pending",
                  type: substage.type,
                };
              }

              return {
                title: substage.title,
                subtitle: substage.subtitle,
                status: substage.status,
                type: substage.type,
              };
            }),
          }
        : {
            label: stage.label,
            stage_index: stage.stage_index,
            sequence: stage.sequence,
            status: stage.status,
            statusText: stage.statusText,
            description: stage.description,
            methodology: stage.methodology || null,
            isActive: stage.isActive,
            disabled: stage.disabled,
            assignee_count: (stage.assignments || []).length,
            validation_enabled: stage.validation_enabled,
            assignments: (stage.assignments || []).map((assignment) =>
              typeof assignment === "object" ? assignment.user_id : assignment
            ),
            reviewers: (stage.reviewers || []).map((assignment) =>
              typeof assignment === "object" ? assignment.user_id : assignment
            ),
            agent_assignments: (stage.agent_assignments || []).map((assignment) =>
              typeof assignment === "object" ? assignment.agent_id : assignment
            ),
            substages: (stage.substages || []).map((substage) => ({
              title: substage.title,
              subtitle: substage.subtitle,
              status: substage.status,
              type: substage.type,
            })),
          }
    );

    try {
      const savedWorkflow = await updateWorkflow(
        workflowId,
        {
          name: workflowRecord.name,
          type: workflowRecord.type,
          status: workflowRecord.status?.toLowerCase?.() || "draft",
          completionDate: workflowRecord.completionDate || null,
          stages: updatedStages,
        },
        token
      );
      setWorkflowRecord(savedWorkflow);
      setIsStage1Configured(true);
      setConfigDrawerOpen(false);
    } catch (error) {
      console.error("Error saving workflow config:", error);
      setSnackbar({ open: true, message: error.message || "Failed to save config.", severity: "error" });
    }
  };

  // ERD state: Independent for each tab
  const [nodes0, setNodes0, onNodesChange0] = useNodesState(INIT_CONCEPTUAL_NODES_V3);
  const [edges0, setEdges0, onEdgesChange0] = useEdgesState(INIT_CONCEPTUAL_EDGES_V3);
  
  const [nodes1, setNodes1, onNodesChange1] = useNodesState(INIT_LOGICAL_NODES_V3);
  const [edges1, setEdges1, onEdgesChange1] = useEdgesState(INIT_LOGICAL_EDGES_V3);

  const [nodes2, setNodes2, onNodesChange2] = useNodesState(INIT_PHYSICAL_NODES_V3);
  const [edges2, setEdges2, onEdgesChange2] = useEdgesState(INIT_PHYSICAL_EDGES_V3);

  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    const loadDataModel = async () => {
      if (!token) return;
      let record = null;

      try {
        setModelReady(false);
        if (initialModelId) {
          record = await fetchDataModelById(initialModelId, token);
        } else if (workflowId) {
          const workflowModels = await fetchDataModels(token, workflowId);
          record = workflowModels[0] || null;
        }

        if (!record) return;

        const conceptual = record.conceptual_payload || { nodes: [], edges: [] };
        const logical = record.logical_payload || { nodes: [], edges: [] };
        const physical = record.physical_payload || { nodes: [], edges: [] };

        setDataModelId(record.id);
        setModelName(record.name || "New Data Model");
        setMethodology(record.methodology || "ER Diagram");
        setNodes0(Array.isArray(conceptual.nodes) && conceptual.nodes.length ? conceptual.nodes : INIT_CONCEPTUAL_NODES_V3);
        setEdges0(Array.isArray(conceptual.edges) ? conceptual.edges : INIT_CONCEPTUAL_EDGES_V3);
        setNodes1(Array.isArray(logical.nodes) && logical.nodes.length ? logical.nodes : INIT_LOGICAL_NODES_V3);
        setEdges1(Array.isArray(logical.edges) ? logical.edges : INIT_LOGICAL_EDGES_V3);
        setNodes2(Array.isArray(physical.nodes) && physical.nodes.length ? physical.nodes : INIT_PHYSICAL_NODES_V3);
        setEdges2(Array.isArray(physical.edges) ? physical.edges : INIT_PHYSICAL_EDGES_V3);
        lastSavedSnapshotRef.current = JSON.stringify({
          name: record.name || "New Data Model",
          status: record.status || "draft",
          methodology: record.methodology || "ER Diagram",
          workflow_id: workflowId,
          region_id: region ? Number(region) : null,
          conceptual_payload: conceptual,
          logical_payload: logical,
          physical_payload: physical,
        });
        setLastSavedAt(record.updated_at ? new Date(record.updated_at) : new Date());
        setLastSavedBy(record.updatedByName || record.updated_by_name || record.createdBy || record.creator?.name || "");
        setAutosaveState(viewerMode ? "read_only" : "saved");
        setBackgroundNotice("All changes synced");
        setModelReady(true);
        return;
      } catch (error) {
        console.error("Error loading data model:", error);
      } finally {
        if (!record) {
          lastSavedSnapshotRef.current = "";
          setAutosaveState(viewerMode ? "read_only" : "idle");
          setBackgroundNotice(viewerMode ? "Viewer mode enabled" : "Autosave ready");
          setLastSavedBy("");
          setModelReady(true);
        }
      }
    };

    loadDataModel();
  }, [initialModelId, workflowId, token, region, viewerMode, setNodes0, setEdges0, setNodes1, setEdges1, setNodes2, setEdges2]);

  // Mappers for active state
  const nodesArr = [nodes0, nodes1, nodes2];
  const setNodesArr = [setNodes0, setNodes1, setNodes2];
  const onNodesChangeArr = [onNodesChange0, onNodesChange1, onNodesChange2];
  const edgesArr = [edges0, edges1, edges2];
  const setEdgesArr = [setEdges0, setEdges1, setEdges2];
  const onEdgesChangeArr = [onEdgesChange0, onEdgesChange1, onEdgesChange2];
  const stage1DataTab = Math.min(activeTab, nodesArr.length - 1);

  const currentNodes = nodesArr[stage1DataTab];
  const setCurrentNodes = setNodesArr[stage1DataTab];
  const currentEdges = edgesArr[stage1DataTab];
  const setCurrentEdges = setEdgesArr[stage1DataTab];
  const onNodesChange = useCallback((changes) => {
    const nextChanges = viewerMode
      ? changes.filter((change) => change.type !== "remove")
      : changes;
    onNodesChangeArr[stage1DataTab](nextChanges);
  }, [stage1DataTab, onNodesChangeArr, viewerMode]);
  const onEdgesChange = useCallback((changes) => {
    const nextChanges = viewerMode
      ? changes.filter((change) => change.type !== "remove")
      : changes;
    onEdgesChangeArr[stage1DataTab](nextChanges);
  }, [stage1DataTab, onEdgesChangeArr, viewerMode]);

  const updateEdgeLabel = useCallback((id, label) => { 
    setEdgesArr[stage1DataTab](eds => eds.map(e => e.id === id ? { ...e, label } : e)); 
  }, [stage1DataTab]);

  const deleteEdge = useCallback((id) => {
    if (viewerMode) return;
    setEdgesArr[stage1DataTab](eds => eds.filter(e => e.id !== id));
  }, [stage1DataTab, viewerMode]);

  const onConnect = useCallback((params) => {
    if (viewerMode) return;
    setCurrentEdges(eds => addEdge({ 
      ...params, 
      type: "smoothstep", 
      markerEnd: { type: MarkerType.ArrowClosed, color: "#64748B" }, 
      style: { stroke: "#64748B", strokeWidth: 2 }, 
      label: (activeTab === 0 || activeTab === 1) ? "" : relationType, 
      labelStyle: { fontSize: 11, fontWeight: 700, fill: "#64748B" }, 
      labelBgStyle: { fill: "white", fillOpacity: 1 }, 
      labelBgPadding: [4, 8], 
      labelBgBorderRadius: 4, 
      radius: 10,
      data: { onLabelChange: updateEdgeLabel, onDeleteEdge: deleteEdge, stage: activeTab, isViewer: viewerMode }
    }, eds));
  }, [setCurrentEdges, relationType, activeTab, updateEdgeLabel, deleteEdge, viewerMode]);

  const addEntity = () => {
    if (viewerMode) return;
    const id = String(Date.now());
    const node = { id, type: stage1DataTab === 0 ? "conceptualEntity" : "entity", position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 }, data: { label: `Entity_${nodesArr[stage1DataTab].length + 1}`, color: TABLE_COLORS[nodesArr[stage1DataTab].length % TABLE_COLORS.length], fields: [{ name: "id", type: "UUID", isPrimary: true }] } };
    setCurrentNodes(nds => [...nds, node]); setSelectedNode(node);
  };

  const addNote = () => {
    if (viewerMode) return;
    const id = `note_${Date.now()}`;
    const node = { 
      id, 
      type: "note", 
      position: { x: 200, y: 200 }, 
      data: { label: "New Comment...", onNoteChange: (newText) => updateLabel(id, newText) } 
    };
    setCurrentNodes(nds => [...nds, node]);
    setSelectedNode(node);
  };

  const addText = () => {
    if (viewerMode) return;
    const id = `text_${Date.now()}`;
    const node = { 
      id, 
      type: "textBox", 
      position: { x: 250, y: 150 }, 
      data: { label: "New Text...", onTextChange: (newText) => updateLabel(id, newText) } 
    };
    setCurrentNodes(nds => [...nds, node]);
    setSelectedNode(node);
  };

  const deleteEntity = (id) => { if (viewerMode) return; setCurrentNodes(nds => nds.filter(n => n.id !== id)); setCurrentEdges(eds => eds.filter(e => e.source !== id && e.target !== id)); setSelectedNode(null); };
  const updateLabel = (id, label) => { if (viewerMode) return; setCurrentNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, label } } : n)); setSelectedNode(s => s && { ...s, data: { ...s.data, label } }); };
  const updateColor = (id, color) => { if (viewerMode) return; setCurrentNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, color } } : n)); setSelectedNode(s => s && { ...s, data: { ...s.data, color } }); };
  const updateTableType = (id, tableType) => { if (viewerMode) return; setCurrentNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, tableType } } : n)); setSelectedNode(s => s && { ...s, data: { ...s.data, tableType } }); };
  const addField = (nodeId) => { if (viewerMode) return; const f = { name: "field", type: "VARCHAR", isPrimary: false, constraints: "", foreignKey: "", isNullable: true }; setCurrentNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, fields: [...(n.data.fields || []), f] } } : n)); setSelectedNode(s => s && s.id === nodeId ? { ...s, data: { ...s.data, fields: [...(s.data.fields || []), f] } } : s); };
  const updateField = (nodeId, idx, key, value) => { if (viewerMode) return; setCurrentNodes(nds => nds.map(n => { if (n.id !== nodeId) return n; return { ...n, data: { ...n.data, fields: n.data.fields.map((f, i) => i === idx ? { ...f, [key]: value } : f) } }; })); setSelectedNode(s => { if (!s || s.id !== nodeId) return s; return { ...s, data: { ...s.data, fields: s.data.fields.map((f, i) => i === idx ? { ...f, [key]: value } : f) } }; }); };
  const removeField = (nodeId, idx) => { if (viewerMode) return; setCurrentNodes(nds => nds.map(n => n.id !== nodeId ? n : { ...n, data: { ...n.data, fields: n.data.fields.filter((_, i) => i !== idx) } })); setSelectedNode(s => s && s.id === nodeId ? { ...s, data: { ...s.data, fields: s.data.fields.filter((_, i) => i !== idx) } } : s); };

  const handleCompleteStage1 = () => {
    if (!canCompleteStage1) {
      setSnackbar({ open: true, message: "Only assigned reviewers can complete Stage 1.", severity: "warning" });
      return;
    }
    setStages(prev => prev.map(s => {
      if (s.id === 1) {
        return { 
          ...s, 
          status: "completed", 
          statusText: "Review Submit",
          substages: s.substages.map(sub => ({ ...sub, status: "completed", subtitle: "DONE" }))
        };
      }
      return s;
    }));
    setActiveStage(null); // Go back to overview to see the progress
  };

  const buildDataModelPayload = useCallback(() => ({
    name: modelName?.trim() || "New Data Model",
    status: stages.find((stage) => stage.id === 1)?.status === "completed" ? "active" : "draft",
    methodology,
    workflow_id: workflowId,
    region_id: region ? Number(region) : null,
    conceptual_payload: { nodes: nodes0, edges: edges0 },
    logical_payload: { nodes: nodes1, edges: edges1 },
    physical_payload: { nodes: nodes2, edges: edges2 },
  }), [modelName, stages, methodology, workflowId, region, nodes0, edges0, nodes1, edges1, nodes2, edges2]);

  const handleSaveDataModel = useCallback(async ({ silent = false } = {}) => {
    if (!token || viewerMode) return;
    const payload = buildDataModelPayload();
    const snapshot = JSON.stringify(payload);
    if (dataModelId && snapshot === lastSavedSnapshotRef.current) return;
    if (saveInFlightRef.current) {
      pendingAutosaveRef.current = true;
      return;
    }

    try {
      saveInFlightRef.current = true;
      setIsSavingModel(true);
      setAutosaveState("saving");
      setBackgroundNotice("Syncing changes in the background");
      const savedRecord = dataModelId
        ? await updateDataModel(dataModelId, payload, token)
        : await createDataModel(payload, token);

      setDataModelId(savedRecord.id);
      setModelName(savedRecord.name);
      lastSavedSnapshotRef.current = snapshot;
      setLastSavedAt(savedRecord.updated_at ? new Date(savedRecord.updated_at) : new Date());
      setLastSavedBy(savedRecord.updatedByName || savedRecord.updated_by_name || userData?.name || userData?.email || "You");
      setAutosaveState("saved");
      setBackgroundNotice("All changes synced");
      if (!location.state?.modelId || location.state?.modelId !== savedRecord.id) {
        navigate(`/data/create/${savedRecord.id}`, {
          replace: true,
          state: {
            ...(location.state || {}),
            modelId: savedRecord.id,
            modelName: savedRecord.name,
            workflowId,
            workflow: workflowRecord,
          },
        });
      }
      if (!silent) {
        setSnackbar({ open: true, message: "Data model saved successfully.", severity: "success" });
      }
    } catch (error) {
      console.error("Error saving data model:", error);
      setAutosaveState("error");
      setBackgroundNotice("Autosave needs attention");
      if (!silent) {
        setSnackbar({ open: true, message: error.message || "Failed to save data model.", severity: "error" });
      }
    } finally {
      setIsSavingModel(false);
      saveInFlightRef.current = false;
      if (pendingAutosaveRef.current) {
        pendingAutosaveRef.current = false;
        setTimeout(() => {
          handleSaveDataModel({ silent: true });
        }, 0);
      }
    }
  }, [token, viewerMode, buildDataModelPayload, dataModelId, navigate, location.state, workflowId, workflowRecord, userData]);

  useEffect(() => {
    if (!token || viewerMode || !modelReady) return;
    const snapshot = JSON.stringify(buildDataModelPayload());
    if (snapshot === lastSavedSnapshotRef.current) return;
    setAutosaveState("pending");
    setBackgroundNotice("Changes detected. Autosave queued");
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      handleSaveDataModel({ silent: true });
    }, 1200);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [token, viewerMode, modelReady, buildDataModelPayload, handleSaveDataModel]);

  useEffect(() => () => clearTimeout(saveTimeoutRef.current), []);

  const applyRemoteDataModel = useCallback((record, notice) => {
    const conceptual = record.conceptual_payload || { nodes: [], edges: [] };
    const logical = record.logical_payload || { nodes: [], edges: [] };
    const physical = record.physical_payload || { nodes: [], edges: [] };
    setDataModelId(record.id);
    setModelName(record.name || "New Data Model");
    setMethodology(record.methodology || "ER Diagram");
    setNodes0(Array.isArray(conceptual.nodes) ? conceptual.nodes : INIT_CONCEPTUAL_NODES_V3);
    setEdges0(Array.isArray(conceptual.edges) ? conceptual.edges : INIT_CONCEPTUAL_EDGES_V3);
    setNodes1(Array.isArray(logical.nodes) ? logical.nodes : INIT_LOGICAL_NODES_V3);
    setEdges1(Array.isArray(logical.edges) ? logical.edges : INIT_LOGICAL_EDGES_V3);
    setNodes2(Array.isArray(physical.nodes) ? physical.nodes : INIT_PHYSICAL_NODES_V3);
    setEdges2(Array.isArray(physical.edges) ? physical.edges : INIT_PHYSICAL_EDGES_V3);
    lastSavedSnapshotRef.current = JSON.stringify({
      name: record.name || "New Data Model",
      status: record.status?.toLowerCase?.() || "draft",
      methodology: record.methodology || "ER Diagram",
      workflow_id: workflowId,
      region_id: region ? Number(region) : null,
      conceptual_payload: conceptual,
      logical_payload: logical,
      physical_payload: physical,
    });
    setLastSavedAt(record.updated_at ? new Date(record.updated_at) : new Date());
    setLastSavedBy(record.updatedByName || record.updated_by_name || record.createdBy || record.creator?.name || "");
    setAutosaveState(viewerMode ? "read_only" : "saved");
    setBackgroundNotice(notice);
  }, [viewerMode, workflowId, region, setNodes0, setEdges0, setNodes1, setEdges1, setNodes2, setEdges2]);

  useEffect(() => {
    if (!token || !dataModelId || !modelReady) return;
    const currentUserName = userData?.name || userData?.email || "Someone";

    const pollRemoteChanges = async () => {
      if (saveInFlightRef.current) return;
      try {
        const remote = await fetchDataModelById(dataModelId, token);
        const remoteUpdatedAt = remote?.updated_at ? new Date(remote.updated_at).getTime() : 0;
        const localUpdatedAt = lastSavedAt ? new Date(lastSavedAt).getTime() : 0;
        if (!remoteUpdatedAt || remoteUpdatedAt <= localUpdatedAt) return;

        const localSnapshot = JSON.stringify(buildDataModelPayload());
        const hasLocalUnsaved = localSnapshot !== lastSavedSnapshotRef.current || autosaveState === "pending" || autosaveState === "saving";
        const remoteActor = remote.updatedByName || remote.updated_by_name || remote.createdBy || "A collaborator";

        if (hasLocalUnsaved) {
          setBackgroundNotice(`${remoteActor} updated this model. Finish syncing your work to refresh.`);
          return;
        }

        if (remoteActor === currentUserName) {
          setLastSavedAt(remote.updated_at ? new Date(remote.updated_at) : new Date());
          setLastSavedBy(remoteActor);
          return;
        }

        applyRemoteDataModel(remote, `${remoteActor} updated this model just now`);
      } catch (error) {
        console.error("Error polling data model updates:", error);
      }
    };

    pollIntervalRef.current = setInterval(pollRemoteChanges, 5000);
    return () => clearInterval(pollIntervalRef.current);
  }, [token, dataModelId, modelReady, lastSavedAt, buildDataModelPayload, autosaveState, applyRemoteDataModel, userData]);

  useEffect(() => () => clearInterval(pollIntervalRef.current), []);

  const assignedCollaborators = useMemo(
    () => engineers.filter((user) => assignedUserIds.includes(user.id)),
    [engineers, assignedUserIds]
  );
  const activeWorkspaceLabel = activeStage === 1
    ? `${["Conceptual", "Logical", "Physical"][stage1DataTab]} canvas active`
    : "Pipeline overview active";
  const presenceUsers = useMemo(() => {
    const currentUserId = Number(userData?.id);
    const currentUser = {
      id: currentUserId || "me",
      name: userData?.full_name || userData?.name || userData?.email || "You",
      email: userData?.email || "",
      isCurrentUser: true,
    };
    const collaborators = assignedCollaborators
      .filter((user) => Number(user.id) !== currentUserId)
      .map((user) => ({
        id: user.id,
        name: user.full_name || user.name || user.email,
        email: user.email || "",
      }));
    return viewerMode ? collaborators : [currentUser, ...collaborators];
  }, [assignedCollaborators, userData, viewerMode]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#F8FAFC", overflow: "hidden" }}>
      {/* Top Bar */}
      <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1, bgcolor: "white", borderBottom: "1px solid #E2E8F0", gap: 2, zIndex: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", flexShrink: 0 }}>
        <Tooltip title={activeStage ? "Back to pipeline" : "Back to Workflow"}>
          <IconButton size="small" onClick={() => activeStage ? setActiveStage(null) : navigate("/workflow")}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {editingName && !viewerMode ? (
          <TextField value={modelName} onChange={e => setModelName(e.target.value)} onBlur={() => setEditingName(false)} onKeyDown={e => e.key === "Enter" && setEditingName(false)} autoFocus size="small" variant="standard" sx={{ "& input": { fontWeight: 700, fontSize: "1rem" } }} />
        ) : (
          <Typography fontWeight={700} fontSize="1rem" sx={{ cursor: viewerMode ? "default" : "pointer", "&:hover": viewerMode ? undefined : { color: "primary.main" }, whiteSpace: "nowrap" }} onClick={() => { if (!viewerMode) setEditingName(true); }}>{modelName}</Typography>
        )}

        {/* Stepper integrated into main Top Bar */}
        {activeStage === 1 && (
          <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <Stepper activeStep={activeTab} nonLinear sx={{ width: "100%", maxWidth: 640 }}>
              {["Conceptual", "Logical", "Physical", "Review"].map((label, index) => (
                <Step key={label} completed={index < activeTab}>
                  <Tooltip title={MODEL_STAGE_TOOLTIPS[label]} arrow>
                    <span>
                      <StepButton onClick={() => handleTabTransition(index)} sx={{ py: 0 }} disabled={isTransitioning}>
                        <StepLabel 
                          StepIconComponent={ModelingStepIcon}
                          sx={{ 
                            "& .MuiStepLabel-label": { fontWeight: 700, fontSize: "0.72rem" },
                          }}
                        >
                          {label}
                        </StepLabel>
                      </StepButton>
                    </span>
                  </Tooltip>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        <Box flex={activeStage === 1 ? 0 : 1} />
        {viewerMode && (
          <Chip size="small" color="warning" variant="outlined" label="Viewer Access" />
        )}

        {/* Unified Controls shifted to corner */}
        {activeStage === 1 && !isReadOnly && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Add a new model entity to the current canvas. Use this to start new business objects or tables." arrow>
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={addEntity}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1, boxShadow: "none", whiteSpace: "nowrap" }}>
                Add Entity
              </Button>
            </Tooltip>

            {activeTab === 0 && (
              <>
                <Tooltip title="Add a sticky note to capture comments, review feedback, or modeling assumptions on the conceptual canvas." arrow>
                  <Button size="small" variant="outlined" startIcon={<CommentIcon />} onClick={addNote}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1, boxShadow: "none", whiteSpace: "nowrap", borderStyle: "dashed" }}>
                    Add Note
                  </Button>
                </Tooltip>
                <Tooltip title="Add a free text label anywhere on the conceptual canvas for annotations or headings." arrow>
                  <Button size="small" variant="outlined" startIcon={<BrushIcon />} onClick={addText}
                    sx={{ display: 'none' }}>
                    Add Text
                  </Button>
                </Tooltip>
              </>
            )}

            {activeTab === 2 && (
              <Tooltip title="Open the DBML editor to inspect or edit the physical model as schema text." arrow>
                <Button size="small" variant={dbmlOpen ? "contained" : "outlined"} 
                  onClick={() => { setDbmlOpen(o => !o); }}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 1, fontFamily: "monospace", minWidth: 70, 
                    background: dbmlOpen ? "linear-gradient(135deg,#1E293B,#334155)" : undefined, border: dbmlOpen ? "none" : undefined }}>
                  DBML
                </Button>
              </Tooltip>
            )}
          </Stack>
        )}

        {/* Global Settings Icon */}
        {!isReadOnly && (
          <Tooltip title="Workflow Settings">
            <IconButton size="small" onClick={() => setWorkflowConfigOpen(true)} sx={{ ml: 1 }}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Body */}
      <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden", minHeight: 0, minWidth: 0 }}>
        {activeStage === null ? (
          /* ── Pipeline Overview ── */
          <PipelineOverview 
            stages={stages} 
            onSelectStage={setActiveStage} 
            onOpenConfig={() => { if (!viewerMode) setConfigDrawerOpen(true); }}
            isStage1Configured={isStage1Configured}
          />
        ) : (
          /* ── Stage Detail View ── */
          <Box sx={{ display: "flex", flex: 1, overflow: "hidden", minWidth: 0 }}>
            <Box sx={{ display: "flex", flex: 1, overflow: "hidden", minWidth: 0 }}>
              {activeStage === 1 && (
              <Stage1 
                nodes={nodesArr[stage1DataTab]} 
                edges={edgesArr[stage1DataTab]} 
                setNodes={setNodesArr[stage1DataTab]} 
                setEdges={setEdgesArr[stage1DataTab]} 
                onNodesChange={onNodesChange} 
                onEdgesChange={onEdgesChange} 
                onConnect={onConnect}
                updateEdgeLabel={updateEdgeLabel}
                deleteEdge={deleteEdge}
                  selectedNode={selectedNode} setSelectedNode={setSelectedNode}
                  relationType={relationType} setRelationType={setRelationType}
                  addEntity={addEntity} deleteEntity={deleteEntity} updateLabel={updateLabel} updateColor={updateColor}
                  addField={addField} updateField={updateField} removeField={removeField}
                  updateTableType={updateTableType}
                  modelName={modelName} setModelName={setModelName}
                  methodology={methodology}
                  conceptualNodes={nodes0}
                  conceptualEdges={edges0}
                  logicalNodes={nodes1}
                  logicalEdges={edges1}
                  physicalNodes={nodes2}
                  physicalEdges={edges2}
                onOpenConfig={() => { if (!viewerMode) setConfigDrawerOpen(true); }}
                  activeTab={activeTab}
                  isTransitioning={isTransitioning}
                  dbmlOpen={dbmlOpen}
                  setDbmlOpen={setDbmlOpen}
                  addNote={addNote}
                  addText={addText}
                  isViewer={isReadOnly}
                  viewerMode={viewerMode}
                  reviewerOnlyMode={reviewerOnlyMode}
                  canCompleteStage1={canCompleteStage1}
                  onCompleteStage1={handleCompleteStage1}
                  autosaveState={autosaveState}
                  backgroundNotice={backgroundNotice}
                  lastSavedAt={lastSavedAt}
                  lastSavedBy={lastSavedBy}
                  activeWorkspaceLabel={activeWorkspaceLabel}
                  isSavingModel={isSavingModel}
                  presenceUsers={presenceUsers}
                />
            )}
            {activeStage === 2 && <Stage2 nodes={nodesArr[stage1DataTab]} edges={edgesArr[stage1DataTab]} />}
            {activeStage === 3 && <Stage3 nodes={nodesArr[stage1DataTab]} edges={edgesArr[stage1DataTab]} viewerMode={viewerMode} />}
            {activeStage === 4 && <Stage4 nodes={nodesArr[stage1DataTab]} edges={edgesArr[stage1DataTab]} isProvisioning={isProvisioning} setIsProvisioning={setIsProvisioning} provisioned={provisioned} setProvisioned={setProvisioned} />}
          </Box>
        </Box>
      )}
    </Box>

      {/* Configuration Drawer */}
      <Drawer
        anchor="right"
        open={configDrawerOpen && !viewerMode}
        onClose={() => setConfigDrawerOpen(false)}
        PaperProps={{ sx: { border: "none", boxShadow: "-8px 0 32px rgba(0,0,0,0.08)" } }}
      >
        <DataConfigSidebar 
          onClose={() => setConfigDrawerOpen(false)}
          onConfirm={handleSaveConfig}
          availableEngineers={engineers}
          assignedUserIds={assignedUserIds}
          onAssignMember={handleAssignMember}
          reviewerIds={reviewerIds}
          onAssignReviewer={handleAssignReviewer}
          agentIds={agentIds}
          availableAgents={availableAgents}
          onAssignAgent={handleAssignAgent}
          onAddAgent={() => setIsAgentDialogOpen(true)}
        />
      </Drawer>

      <Dialog open={isAgentDialogOpen} onClose={() => setIsAgentDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Create New AI Agent</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <TextField 
              label="Agent Name" 
              fullWidth 
              size="small" 
              id="new-agent-name"
              placeholder="e.g. Data Extractor Bot"
            />
            <TextField
              select
              fullWidth
              size="small"
              label="Agent Type"
              defaultValue="extractor"
              id="new-agent-type"
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
          <Button 
            variant="contained" 
            sx={{ fontWeight: 600 }}
            onClick={async () => {
              const name = document.getElementById("new-agent-name").value;
              const type = document.getElementById("new-agent-type").value;
              if (!name) return;
              try {
                const newAgent = await createAgent({ name, type, config: {} }, token);
                handleAgentCreated(newAgent);
                setIsAgentDialogOpen(false);
              } catch (err) {
                console.error("Error creating agent:", err);
              }
            }}
          >
            Create Agent
          </Button>
        </DialogActions>
      </Dialog>

      {/* Workflow Config Drawer - Coming Soon */}
      <Drawer
        anchor="right"
        open={workflowConfigOpen}
        onClose={() => setWorkflowConfigOpen(false)}
        PaperProps={{ sx: { width: 400, p: 3 } }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h6" fontWeight={800}>Workflow config</Typography>
          <IconButton onClick={() => setWorkflowConfigOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "text.secondary", gap: 2 }}>
          <SettingsIcon sx={{ fontSize: 48, opacity: 0.2 }} />
          <Typography variant="h6" fontWeight={700}>Coming soon</Typography>
          <Typography variant="body2" textAlign="center">
            Advanced workflow orchestration and governance settings are currently being developed.
          </Typography>
        </Box>
      </Drawer>

      {/* Tab Change Confirmation Dialog */}
      <Dialog open={tabConfirmOpen} onClose={() => setTabConfirmOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Switch Stages?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to switch from Conceptual to the next stage? 
            Once you move forward, the AI Agent will begin processing your model.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTabConfirmOpen(false)} color="inherit" sx={{ textTransform: "none", fontWeight: 600 }}>Cancel</Button>
          <Button onClick={confirmTabChange} variant="contained" color="primary" sx={{ textTransform: "none", fontWeight: 600, boxShadow: "none" }}>Yes, Switch</Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%", borderRadius: 2, fontWeight: 600 }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
