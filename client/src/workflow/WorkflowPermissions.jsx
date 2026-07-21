import React, { useState, useMemo, useEffect } from "react";
import {
  Box, Button, Avatar, Typography, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Autocomplete, TextField, IconButton, Tooltip,
  Tab, Tabs, Stack, CircularProgress, Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SecurityIcon from "@mui/icons-material/Security";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CodeIcon from "@mui/icons-material/Code";
import RateReviewIcon from "@mui/icons-material/RateReview";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

// ─── Role config ────────────────────────────────────────────────────────────
const ROLES = [
  {
    key: "owner",
    label: "Owner / Admin",
    icon: <AdminPanelSettingsIcon sx={{ fontSize: 15 }} />,
    color: "#334155",
    bg: "#E2E8F0",
    desc: "Full workflow governance and access control",
  },
  {
    key: "developer",
    label: "Stage Owner",
    icon: <CodeIcon sx={{ fontSize: 15 }} />,
    color: "#0369A1",
    bg: "#E0F2FE",
    desc: "Responsible for executing and updating assigned stages",
  },
  {
    key: "reviewer",
    label: "Reviewer",
    icon: <RateReviewIcon sx={{ fontSize: 15 }} />,
    color: "#B45309",
    bg: "#FEF3C7",
    desc: "Can review and approve the stages assigned to them",
  },
  {
    key: "viewer",
    label: "Viewer",
    icon: <VisibilityOutlinedIcon sx={{ fontSize: 15 }} />,
    color: "#64748B",
    bg: "#F1F5F9",
    desc: "Read-only access to the whole workflow",
  },
];

function RoleBadge({ roleKey, size = "small" }) {
  const r = ROLES.find((r) => r.key === roleKey) || ROLES[3];
  return (
    <Chip
      size={size}
      icon={<Box sx={{ color: r.color, display: "flex", pl: 0.5 }}>{r.icon}</Box>}
      label={r.label}
      sx={{
        bgcolor: "#E0F2FE",
        color: "#0369A1",
        fontWeight: 800,
        fontSize: "0.6rem",
        height: 22,
        border: "1px solid #BAE6FD",
        "& .MuiChip-icon": { ml: 0.3, color: "#0369A1" },
        "& .MuiChip-label": { px: 0.95 },
      }}
    />
  );
}

function SummaryStat({ label, value, tone = "slate" }) {
  const tones = {
    slate: { bg: "#F8FAFC", border: "#E2E8F0", value: "#0F172A" },
    blue: { bg: "#EFF6FF", border: "#DBEAFE", value: "#2563EB" },
    amber: { bg: "#FFF7ED", border: "#FED7AA", value: "#EA580C" },
  };
  const current = tones[tone] || tones.slate;
  return (
    <Box
      sx={{
        minWidth: 120,
        px: 1.5,
        py: 1.2,
        borderRadius: "14px",
        bgcolor: current.bg,
        border: `1px solid ${current.border}`,
      }}
    >
      <Typography sx={{ fontSize: "0.64rem", fontWeight: 800, color: "#64748B", letterSpacing: "0.08em" }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.3, fontSize: "1rem", fontWeight: 900, color: current.value }}>
        {value}
      </Typography>
    </Box>
  );
}

function UserRow({ user, roleKey, onRemove, isSuperAdmin, isOwner }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.2,
        px: 1.6,
        py: 1.15,
        borderRadius: "14px",
        bgcolor: "white",
        border: "1px solid #E2E8F0",
        boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": { transform: "translateY(-1px)", boxShadow: "0 12px 28px rgba(15,23,42,0.08)" },
      }}
    >
      <Avatar
        sx={{
          width: 32,
          height: 32,
          fontSize: 13,
          fontWeight: 800,
          bgcolor: ROLES.find((r) => r.key === roleKey)?.color || "#64748B",
        }}
      >
        {user?.name?.[0]?.toUpperCase() || "?"}
      </Avatar>
      <Box flex={1} minWidth={0}>
        <Typography fontSize="0.8rem" fontWeight={700} noWrap>
          {user?.name || "Unknown User"}
        </Typography>
        <Typography fontSize="0.65rem" color="text.secondary" noWrap>
          {user?.email || ""}
        </Typography>
      </Box>
      <RoleBadge roleKey={roleKey} />
      {!isOwner && onRemove && (
        <Tooltip title="Remove">
          <IconButton
            size="small"
            onClick={() => onRemove(user.id)}
            sx={{ opacity: 0.4, "&:hover": { opacity: 1, color: "error.main" }, ml: 0.5 }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function WorkflowPermissions({
  open,
  onClose,
  workflow,
  availableUsers = [],
  userRole = "",
  onSave,       // (changes: { ownerId, stages: [{ stageId, developers, reviewers }] }) => void
  onTransferOwner, // (newOwnerId) => Promise<void>
  saving = false,
}) {
  const isSuperAdmin = userRole === "superadmin";
  const isAdmin = isSuperAdmin || userRole === "admin";

  // ── Local state ──
  const [tab, setTab] = useState(0); // 0 = Overview, 1..N = per stage
  const [ownerUser, setOwnerUser] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerError, setOwnerError] = useState("");
  const [ownerSuccess, setOwnerSuccess] = useState(false);

  // Per-stage local assignment state: { [stageId]: { developers: User[], reviewers: User[] } }
  const [stageAssignments, setStageAssignments] = useState({});

  // ── Derive stages from workflow ──
  const stages = useMemo(() => workflow?.stages || [], [workflow]);

  // Initialise state on open
  useEffect(() => {
    if (!open || !workflow) return;

    // Owner
    const currentOwner = availableUsers.find((u) => u.id === workflow.createdBy) || null;
    setOwnerUser(currentOwner);
    setOwnerError("");
    setOwnerSuccess(false);

    // Stage assignments
    const init = {};
    stages.forEach((s) => {
      const assignments = s.assignments || [];
      init[s.id] = {
        developers: availableUsers.filter((u) =>
          assignments.some((a) => a.user_id === u.id && a.role === "assignee")
        ),
        reviewers: availableUsers.filter((u) =>
          assignments.some((a) => a.user_id === u.id && a.role === "reviewer")
        ),
      };
    });
    setStageAssignments(init);
    setTab(0);
  }, [open, workflow, availableUsers, stages]);

  // ── Handlers ──
  const handleTransferOwner = async () => {
    if (!ownerUser) return;
    setOwnerLoading(true);
    setOwnerError("");
    setOwnerSuccess(false);
    try {
      await onTransferOwner?.(ownerUser.id);
      setOwnerSuccess(true);
    } catch (err) {
      setOwnerError(err.message || "Failed to transfer ownership");
    } finally {
      setOwnerLoading(false);
    }
  };

  const addToStage = (stageId, roleKey, user) => {
    setStageAssignments((prev) => {
      const cur = prev[stageId] || { developers: [], reviewers: [] };
      const key = roleKey === "developer" ? "developers" : "reviewers";
      if (cur[key].some((u) => u.id === user.id)) return prev;
      return { ...prev, [stageId]: { ...cur, [key]: [...cur[key], user] } };
    });
  };

  const removeFromStage = (stageId, roleKey, userId) => {
    setStageAssignments((prev) => {
      const cur = prev[stageId] || { developers: [], reviewers: [] };
      const key = roleKey === "developer" ? "developers" : "reviewers";
      return { ...prev, [stageId]: { ...cur, [key]: cur[key].filter((u) => u.id !== userId) } };
    });
  };

  const handleSave = () => {
    const changes = {
      ownerId: ownerUser?.id,
      stages: stages.map((s) => ({
        stageId: s.id,
        stageIndex: s.stage_index,
        developers: (stageAssignments[s.id]?.developers || []).map((u) => u.id),
        reviewers: (stageAssignments[s.id]?.reviewers || []).map((u) => u.id),
      })),
    };
    onSave?.(changes);
  };

  // ── Render ──
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 28px 90px rgba(15,23,42,0.22)",
          bgcolor: "#F8FAFC",
        },
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          px: 3,
          pt: 2.25,
          pb: 1.75,
          background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 42, height: 42, borderRadius: "14px",
            bgcolor: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <SecurityIcon sx={{ color: "white", fontSize: 20 }} />
        </Box>
        <Box flex={1}>
          <Typography fontWeight={900} fontSize="1.05rem" color="white">
            Permissions
          </Typography>
          <Typography fontSize="0.74rem" sx={{ color: "rgba(255,255,255,0.72)" }}>
            {workflow?.name || "Workflow"} • Role management and access control
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "white", opacity: 0.88, border: "1px solid rgba(255,255,255,0.18)", borderRadius: "12px", "&:hover": { opacity: 1, bgcolor: "rgba(255,255,255,0.08)" } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* ── Role Legend ── */}
      <Box
        sx={{
          px: 3, py: 1.5,
          bgcolor: "#FFFFFF",
          borderBottom: "1px solid #E8EAF6",
          display: "flex", gap: 1, flexWrap: "wrap",
        }}
      >
        {ROLES.map((r) => (
          <Tooltip key={r.key} title={r.desc} arrow>
            <Chip
              size="small"
              icon={<Box sx={{ color: r.color, display: "flex", pl: 0.5 }}>{r.icon}</Box>}
              label={r.label}
              sx={{
                bgcolor: "#E0F2FE", color: "#0369A1", fontWeight: 700, fontSize: "0.6rem",
                height: 28, cursor: "default", border: "1px solid #BAE6FD",
                "& .MuiChip-icon": { ml: 0.2, color: "#0369A1" },
                "& .MuiChip-label": { px: 1 },
              }}
            />
          </Tooltip>
        ))}
      </Box>

      <Box
        sx={{
          px: 3,
          py: 1.4,
          bgcolor: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <SummaryStat label="Stages" value={stages.length} />
        <SummaryStat label="Reviewers" value={stages.reduce((sum, s) => sum + ((stageAssignments[s.id]?.reviewers || []).length), 0)} tone="amber" />
        <SummaryStat label="Stage Owners" value={stages.reduce((sum, s) => sum + ((stageAssignments[s.id]?.developers || []).length), 0)} tone="blue" />
      </Box>

      {/* ── Tabs ── */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          px: 2.5,
          bgcolor: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          "& .MuiTabs-indicator": { height: 3, borderRadius: "999px", bgcolor: "#1D4ED8" },
          "& .MuiTab-root": { fontSize: "0.76rem", fontWeight: 700, minWidth: 96, textTransform: "none", py: 1.4, color: "#64748B" },
          "& .Mui-selected": { color: "#0F172A !important" },
        }}
      >
        <Tab label="Owner" />
        {stages.map((s, i) => (
          <Tab key={s.id} label={s.label || `Stage ${s.stage_index + 1}`} />
        ))}
      </Tabs>

      <DialogContent sx={{ p: 0, bgcolor: "#F8FAFC" }}>

        {/* ── TAB 0: Owner ── */}
        {tab === 0 && (
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography fontSize="0.72rem" fontWeight={800} color="#64748B" letterSpacing="0.08em" mb={1.5}>
                WORKFLOW OWNER
              </Typography>
              <Typography fontSize="0.88rem" color="#475569" mb={2.2} lineHeight={1.6}>
                The workflow owner governs access, assignments, and final administrative control across this workflow.
                {!isSuperAdmin && (
                  <Box component="span" sx={{ color: "#B45309", fontWeight: 700, display: "block", mt: 0.75, fontSize: "0.8rem" }}>
                    Only a Superadmin can change the workflow owner.
                  </Box>
                )}
              </Typography>

              {/* Current owner */}
              {ownerUser && (
                <UserRow user={ownerUser} roleKey="owner" isOwner />
              )}

              {/* Transfer (superadmin only) */}
              {isSuperAdmin && (
                <Box mt={2} sx={{ p: 2, borderRadius: "16px", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 10px 24px rgba(15,23,42,0.04)" }}>
                  <Typography fontSize="0.72rem" fontWeight={800} color="#475569" mb={1}>
                    Transfer Ownership
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                    <Autocomplete
                      size="small"
                      fullWidth
                      options={availableUsers.filter((u) => u.id !== ownerUser?.id)}
                      getOptionLabel={(o) => `${o.name || ""} (${o.email || ""})`}
                      isOptionEqualToValue={(o, v) => o.id === v.id}
                      value={ownerUser}
                      onChange={(_, newVal) => {
                        setOwnerUser(newVal);
                        setOwnerSuccess(false);
                        setOwnerError("");
                      }}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 26, height: 26, fontSize: 11, bgcolor: "#6366F1" }}>
                            {option.name?.[0] || "?"}
                          </Avatar>
                          <Box>
                            <Typography fontSize="0.82rem" fontWeight={600}>{option.name}</Typography>
                            <Typography fontSize="0.65rem" color="text.secondary">{option.email}</Typography>
                          </Box>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField {...params} placeholder="Select new owner…" helperText="Transfer administrative ownership to another user." FormHelperTextProps={{ sx: { fontSize: "0.64rem" } }} />
                      )}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleTransferOwner}
                      disabled={!ownerUser || ownerLoading}
                      sx={{
                        whiteSpace: "nowrap",
                        fontWeight: 700,
                        textTransform: "none",
                        minWidth: "unset",
                        px: 1.4,
                        py: 0.9,
                        alignSelf: "flex-start",
                        borderRadius: "10px",
                        bgcolor: "#2563EB",
                        boxShadow: "none",
                        "&:hover": { bgcolor: "#1D4ED8", boxShadow: "none" },
                      }}
                    >
                      {ownerLoading ? <CircularProgress size={14} color="inherit" /> : "Transfer"}
                    </Button>
                  </Box>
                  {ownerError && <Alert severity="error" sx={{ mt: 1, fontSize: "0.7rem", py: 0.3 }}>{ownerError}</Alert>}
                  {ownerSuccess && (
                    <Alert
                      icon={<CheckCircleOutlineIcon fontSize="small" />}
                      severity="success"
                      sx={{ mt: 1, fontSize: "0.7rem", py: 0.3 }}
                    >
                      Ownership transferred successfully.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* ── TAB 1..N: Per Stage ── */}
        {tab > 0 && (() => {
          const stage = stages[tab - 1];
          if (!stage) return null;
          const assignments = stageAssignments[stage.id] || { developers: [], reviewers: [] };

          return (
            <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Stage info */}
              <Box sx={{ p: 1.7, bgcolor: "white", borderRadius: "14px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 1.5, boxShadow: "0 8px 24px rgba(15,23,42,0.04)" }}>
                <Box sx={{ width: 40, height: 40, borderRadius: "12px", bgcolor: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", color: "#1D4ED8", fontWeight: 900, fontSize: "0.85rem" }}>
                  {String(stage.stage_index + 1).padStart(2, "0")}
                </Box>
                <Box>
                  <Typography fontWeight={800} fontSize="0.92rem">{stage.label}</Typography>
                  <Typography fontSize="0.72rem" color="text.secondary">{stage.description || "No description available for this stage."}</Typography>
                </Box>
              </Box>

              {/* Developers */}
              <Box sx={{ p: 2, bgcolor: "white", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 10px 24px rgba(15,23,42,0.04)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1.2 }}>
                  <CodeIcon sx={{ fontSize: 15, color: "#0EA5E9" }} />
                  <Typography fontSize="0.7rem" fontWeight={800} color="#64748B" letterSpacing="0.04em">
                    STAGE OWNERS
                  </Typography>
                  <Chip size="small" label={assignments.developers.length} sx={{ height: 17, fontSize: "0.6rem", fontWeight: 800, ml: 0.5, bgcolor: "#E0F2FE", color: "#0EA5E9" }} />
                </Box>

                <Stack spacing={0.8} mb={1.5}>
                  {assignments.developers.length === 0 && (
                    <Typography fontSize="0.7rem" color="text.disabled" sx={{ textAlign: "center", py: 1.5, fontStyle: "italic" }}>
                      No stage owners assigned yet
                    </Typography>
                  )}
                  {assignments.developers.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      roleKey="developer"
                      onRemove={isAdmin ? (id) => removeFromStage(stage.id, "developer", id) : null}
                    />
                  ))}
                </Stack>

                {isAdmin && (
                  <Autocomplete
                    size="small"
                    fullWidth
                    options={availableUsers.filter((u) => !assignments.developers.some((d) => d.id === u.id))}
                    getOptionLabel={(o) => o.name || o.email || `User ${o.id}`}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    value={null}
                    onChange={(_, newVal) => { if (newVal) addToStage(stage.id, "developer", newVal); }}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 26, height: 26, fontSize: 11, bgcolor: "#0EA5E9" }}>{option.name?.[0] || "?"}</Avatar>
                        <Box>
                          <Typography fontSize="0.82rem" fontWeight={600}>{option.name}</Typography>
                          <Typography fontSize="0.65rem" color="text.secondary">{option.email}</Typography>
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Add a stage owner…"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <PersonAddAlt1Icon sx={{ fontSize: 16, color: "#0EA5E9", ml: 0.5 }} />
                          ),
                        }}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                      />
                    )}
                  />
                )}
              </Box>

              <Divider sx={{ borderColor: "#E2E8F0" }} />

              {/* Reviewers */}
              <Box sx={{ p: 2, bgcolor: "white", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 10px 24px rgba(15,23,42,0.04)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 1.2 }}>
                  <RateReviewIcon sx={{ fontSize: 15, color: "#F59E0B" }} />
                  <Typography fontSize="0.7rem" fontWeight={800} color="#64748B" letterSpacing="0.04em">
                    REVIEWERS
                  </Typography>
                  <Chip size="small" label={assignments.reviewers.length} sx={{ height: 17, fontSize: "0.6rem", fontWeight: 800, ml: 0.5, bgcolor: "#FEF3C7", color: "#F59E0B" }} />
                </Box>

                <Stack spacing={0.8} mb={1.5}>
                  {assignments.reviewers.length === 0 && (
                    <Typography fontSize="0.7rem" color="text.disabled" sx={{ textAlign: "center", py: 1.5, fontStyle: "italic" }}>
                      No reviewers assigned yet
                    </Typography>
                  )}
                  {assignments.reviewers.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      roleKey="reviewer"
                      onRemove={isAdmin ? (id) => removeFromStage(stage.id, "reviewer", id) : null}
                    />
                  ))}
                </Stack>

                {isAdmin && (
                  <Autocomplete
                    size="small"
                    fullWidth
                    options={availableUsers.filter((u) => !assignments.reviewers.some((r) => r.id === u.id))}
                    getOptionLabel={(o) => o.name || o.email || `User ${o.id}`}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    value={null}
                    onChange={(_, newVal) => { if (newVal) addToStage(stage.id, "reviewer", newVal); }}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 26, height: 26, fontSize: 11, bgcolor: "#F59E0B" }}>{option.name?.[0] || "?"}</Avatar>
                        <Box>
                          <Typography fontSize="0.82rem" fontWeight={600}>{option.name}</Typography>
                          <Typography fontSize="0.65rem" color="text.secondary">{option.email}</Typography>
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Add a reviewer…"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <PersonAddAlt1Icon sx={{ fontSize: 16, color: "#F59E0B", ml: 0.5 }} />
                          ),
                        }}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                      />
                    )}
                  />
                )}
              </Box>
            </Box>
          );
        })()}
      </DialogContent>

      {/* ── Footer ── */}
      <DialogActions
        sx={{
          px: 3, py: 2.25,
          bgcolor: "white",
          borderTop: "1px solid #E2E8F0",
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          sx={{ textTransform: "none", fontWeight: 700, color: "text.secondary" }}
        >
          Cancel
        </Button>
        {isAdmin && (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <CheckCircleOutlineIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: "14px",
              px: 3.2,
              py: 1.1,
              background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
              boxShadow: "0 14px 30px rgba(37,99,235,0.28)",
            }}
          >
            Save Permissions
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
