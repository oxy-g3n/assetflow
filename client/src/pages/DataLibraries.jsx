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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { createDataModel, deleteDataModel, fetchDataModels } from "./dataModelApi";

export default function DataList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { token, region } = useAuth();
  const [tabValue, setTabValue] = useState("All");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [createOpen, setCreateOpen] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { setPage(0); }, [tabValue]);

  useEffect(() => {
    const loadDataModels = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await fetchDataModels(token);
        setRecords(data);
      } catch (error) {
        setSnackbar({ open: true, message: error.message || "Failed to load data models.", severity: "error" });
      } finally {
        setLoading(false);
      }
    };

    loadDataModels();
  }, [token]);

  const statuses = ["All", "Active", "Draft", "Archived"];

  const stats = [
    { label: "Total Data", value: records.length },
    { label: "Active", value: records.filter(r => r.status === "Active").length, color: "success.main" },
    { label: "Draft", value: records.filter(r => r.status === "Draft").length, color: "warning.main" },
    { label: "Archived", value: records.filter(r => r.status === "Archived").length, color: "text.secondary" },
  ];

  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchTab = tabValue === "All" || r.status === tabValue;
      const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [records, tabValue, search]);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const handleDelete = (record) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleCreateModel = async () => {
    if (!token || !newModelName.trim()) return;
    try {
      setCreating(true);
      const record = await createDataModel({
        name: newModelName.trim(),
        status: "draft",
        region_id: region ? Number(region) : null,
        methodology: "ER Diagram",
        conceptual_payload: { nodes: [], edges: [] },
        logical_payload: { nodes: [], edges: [] },
        physical_payload: { nodes: [], edges: [] },
      }, token);
      setRecords(prev => [record, ...prev]);
      setCreateOpen(false);
      navigate(`/data/create/${record.id}`, { state: { modelId: record.id, modelName: record.name } });
    } catch (error) {
      setSnackbar({ open: true, message: error.message || "Failed to create data model.", severity: "error" });
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!recordToDelete || !token) return;
    try {
      await deleteDataModel(recordToDelete.id, token);
      setRecords(prev => prev.filter(r => r.id !== recordToDelete.id));
      setSnackbar({ open: true, message: "Data record deleted successfully!", severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: error.message || "Failed to delete data model.", severity: "error" });
    } finally {
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  const statusColor = (status) => ({
    Active: "success",
    Draft: "warning",
    Archived: "default",
  }[status] || "default");

  return (
    <Box p={isMobile ? 2 : 4} sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}>

      {/* Stats Cards */}
      <Box sx={{ mx: isMobile ? -2 : 0, px: isMobile ? 2 : 0, overflowX: "auto", mb: 4, pb: 1, "&::-webkit-scrollbar": { height: 4 } }}>
        <Stack direction="row" spacing={2} sx={{ minWidth: isMobile ? "max-content" : "auto" }}>
          {stats.map(s => (
            <Card key={s.label} sx={{ flex: 1, minWidth: isMobile ? 160 : "auto", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", borderRadius: 3 }}>
              <CardContent sx={{ p: isMobile ? 2 : 3, "&:last-child": { pb: isMobile ? 2 : 3 } }}>
                <Typography color="text.secondary" sx={{ fontSize: isMobile ? 10 : 12 }} fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
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

      {/* Tabs */}
      <Box borderBottom={1} borderColor="divider" mb={2}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons="auto"
        >
          {statuses.map(t => (
            <Tab key={t} label={t} value={t} sx={{ textTransform: "none", fontWeight: 600, fontSize: "1rem" }} />
          ))}
        </Tabs>
      </Box>

      {/* Header & Controls */}
      <Box display="flex" flexDirection={isMobile ? "column" : "row"} justifyContent="space-between" alignItems={isMobile ? "stretch" : "center"} gap={2} mb={3}>
        <Typography variant={isMobile ? "h6" : "h5"} fontWeight={700} color="text.primary">
          {tabValue} Data
        </Typography>
        <Box display="flex" flexDirection={isMobile ? "column" : "row"} gap={2} alignItems={isMobile ? "stretch" : "center"}>
          <TextField
            placeholder="Search data..."
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ width: isMobile ? "100%" : 250, bgcolor: "white" }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            fullWidth={isMobile}
            sx={{ textTransform: "none", fontWeight: 600, boxShadow: "0 4px 12px rgba(37,99,235,0.2)", whiteSpace: "nowrap" }}
            onClick={() => { setNewModelName(""); setCreateOpen(true); }}
          >
            Create Data
          </Button>
        </Box>
      </Box>

      {/* Table */}
      {isMobile ? (
        <Box>
          {loading && (
            <Box py={4} textAlign="center">
              <Typography color="text.secondary">Loading data models...</Typography>
            </Box>
          )}
          {paginated.map(r => (
            <MobileDataCard
              key={r.id}
              record={r}
              onOpen={() => navigate(`/data/create/${r.id}`, { state: { modelId: r.id } })}
              onDelete={() => handleDelete(r)}
            />
          ))}
          {!paginated.length && !loading && (
            <Box py={8} textAlign="center">
              <Typography color="text.secondary">No data records match your search.</Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Paper elevation={0} sx={{ border: "1px solid #E5E7EB", borderRadius: 3, overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "#F9FAFB" }}>
                <TableRow>
                  {["Name", "Status", "Created By", "Created At", "Actions"].map(h => (
                    <TableCell key={h} sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", py: 2 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">Loading data models...</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {paginated.map(r => (
                  <TableRow
                    key={r.id}
                    hover
                    onClick={() => navigate(`/data/create/${r.id}`, { state: { modelId: r.id } })}
                    sx={{ cursor: "pointer", "&:hover": { bgcolor: "#F9FAFB" } }}
                  >
                    <TableCell>
                      <Typography fontWeight={600} variant="body2">{r.name}</Typography>
                      <Typography variant="caption" color="text.secondary" fontFamily="monospace">{r.id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.status}
                        size="small"
                        color={statusColor(r.status)}
                        sx={{ borderRadius: 1, fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 24, height: 24, fontSize: "0.75rem", bgcolor: "primary.light" }}>
                          {r.createdBy?.[0] || "U"}
                        </Avatar>
                        <Typography variant="body2">{r.createdBy}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{r.createdAt}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton size="small" sx={{ color: "primary.main" }} onClick={e => { e.stopPropagation(); navigate(`/data/create/${r.id}`, { state: { modelId: r.id } }); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ color: "error.main" }} onClick={e => { e.stopPropagation(); handleDelete(r); }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {!paginated.length && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary">No data records match your search.</Typography>
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
        count={filtered.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 25]}
        sx={{ borderTop: "1px solid #E5E7EB", mt: isMobile ? 2 : 0 }}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>"{recordToDelete?.name}"</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" sx={{ textTransform: "none", fontWeight: 600 }}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" sx={{ textTransform: "none", fontWeight: 600, boxShadow: "none" }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%", borderRadius: 2, fontWeight: 600 }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ── Create Data Model modal ── */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.15rem" }}>Create Data Model</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: "0.875rem" }}>
            Give your data model a name to get started.
          </DialogContentText>
          <TextField
            autoFocus
            label="Model Name"
            placeholder="e.g. E-Commerce Schema"
            fullWidth
            value={newModelName}
            onChange={e => setNewModelName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && newModelName.trim()) {
                e.preventDefault();
                handleCreateModel();
              }
            }}
            sx={{ mt: 0.5 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit" sx={{ textTransform: "none", fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!newModelName.trim() || creating}
            onClick={handleCreateModel}
            sx={{ textTransform: "none", fontWeight: 600, boxShadow: "0 4px 12px rgba(37,99,235,0.2)" }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function MobileDataCard({ record, onOpen, onDelete }) {
  const colors = { Active: "#10B981", Draft: "#F59E0B", Archived: "#64748B" };
  const color = colors[record.status] || "#64748B";
  return (
    <Card onClick={onOpen} sx={{ borderRadius: 4, border: "1px solid #E2E8F0", boxShadow: "0 4px 15px rgba(0,0,0,0.04)", mb: 2, position: "relative", overflow: "hidden", cursor: "pointer", "&::before": { content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: color } }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#1E293B", mb: 0.5 }}>{record.name}</Typography>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "#94A3B8" }}>
              <AccessTimeIcon sx={{ fontSize: 12 }} />
              <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>{record.createdAt}</Typography>
            </Stack>
          </Box>
          <Chip label={record.status} size="small" sx={{ borderRadius: 1.5, fontWeight: 800, fontSize: "0.65rem", textTransform: "uppercase", bgcolor: `${color}15`, color, border: `1px solid ${color}30` }} />
        </Box>
        <Divider sx={{ mb: 2, borderStyle: "dashed", borderColor: "#E2E8F0" }} />
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <PersonOutlineIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>{record.createdBy}</Typography>
          </Stack>
          <IconButton size="small" onClick={e => { e.stopPropagation(); onDelete(); }} sx={{ bgcolor: "#FEF2F2", color: "#EF4444", borderRadius: 2, p: 1, "&:hover": { bgcolor: "#FEE2E2" } }}>
            <DeleteIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}
