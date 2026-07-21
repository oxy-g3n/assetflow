  import {
    Box,
    Button,
    Chip,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    InputAdornment,
    Avatar,
    IconButton,
    TextField,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
  } from "@mui/material";
  import UploadFileIcon from "@mui/icons-material/UploadFile";
  import CloudUploadIcon from "@mui/icons-material/CloudUpload";
  import SearchIcon from "@mui/icons-material/Search";
  import MoreVertIcon from "@mui/icons-material/MoreVert";
  import PostAddIcon from "@mui/icons-material/PostAdd";
  import { useMemo, useState, useRef } from "react";
  import Autocomplete from "@mui/material/Autocomplete";
  
  export default function TemplateList() {
    // 👉 pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [search, setSearch] = useState("");
    const [tabValue, setTabValue] = useState("templates");
    
    // Upload Modal State
    const [openUploadModal, setOpenUploadModal] = useState(false);
    const [uploadName, setUploadName] = useState("");
    const [pendingFile, setPendingFile] = useState(null);
    const [pendingType, setPendingType] = useState(null); // "Template" or "Library"
    const [uploadRegion, setUploadRegion] = useState(null);
  
    // Mock data with Type distinction
    const [templates, setTemplates] = useState([
      { id: "t-1", name: "Email Sequence", type: "Template", fileType: "CSV", category: "Marketing", region: "North America", updatedAt: "2025-12-01", author: "Sarah Connor", avatar: "SC" },
      { id: "l-1", name: "Employee Data", type: "Library", fileType: "CSV", category: "HR", region: "Europe", updatedAt: "2026-01-10", author: "HR Dept", avatar: "HR" },
      { id: "t-2", name: "WhatsApp Campaign", type: "Template", fileType: "JSON", category: "Marketing", region: "Global", updatedAt: "2025-11-15", author: "John Doe", avatar: "JD" },
      { id: "l-2", name: "Product Catalog", type: "Library", fileType: "CSV", category: "Inventory", region: "Asia Pacific", updatedAt: "2026-01-12", author: "Ops Team", avatar: "OT" },
      { id: "t-3", name: "Data Onboarding", type: "Template", fileType: "XML", category: "Operations", region: "North America", updatedAt: "2026-01-05", author: "Operations Team", avatar: "OT" },
    ]);
  
    const filteredTemplates = useMemo(() => {
        return templates.filter(t => {
            const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
            // const matchesTab = tabValue === "all" ? true : t.type === (tabValue === "templates" ? "Template" : "Library");
            const matchesTab = t.type === (tabValue === "templates" ? "Template" : "Library");
            return matchesSearch && matchesTab;
        });
    }, [search, templates, tabValue]);
  
    const paginatedTemplates = useMemo(() => {
      const start = page * rowsPerPage;
      return filteredTemplates.slice(start, start + rowsPerPage);
    }, [filteredTemplates, page, rowsPerPage]);

    const regions = useMemo(() => {
        const unique = Array.from(new Set(templates.map(t => t.region).filter(Boolean)));
        return unique.length ? unique : ["North America", "Europe", "Asia Pacific", "Global"];
    }, [templates]);
  
    // Handlers for file uploads
    const handleOpenUploadModal = (type) => {
        setPendingType(type);
        setUploadName("");
        setPendingFile(null);
        setOpenUploadModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPendingFile(file);
        }
    };
    
    const handleConfirmUpload = () => {
        if (pendingFile && uploadName && uploadRegion) {
             const newItem = {
                id: `${pendingType === "Template" ? "t" : "l"}-${Date.now()}`,
                name: uploadName,
                type: pendingType,
                fileType: pendingFile.name.split('.').pop().toUpperCase(),
                category: "Uncategorized",
                region: uploadRegion,
                updatedAt: new Date().toISOString().split('T')[0],
                author: "You",
                avatar: "ME"
            };
            setTemplates([newItem, ...templates]);
            handleCloseModal();
        }
    };

    const handleCloseModal = () => {
        setOpenUploadModal(false);
        setPendingFile(null);
        setPendingType(null);
        setUploadName("");
        setUploadRegion(null);
    };
  
    return (
      <Box p={4}>
         {/* Upload Name Dialog */}
         <Dialog open={openUploadModal} onClose={handleCloseModal} maxWidth="xs" fullWidth>
            <DialogTitle>Upload {pendingType}</DialogTitle>
            <DialogContent>
                <Box pt={1} display="flex" flexDirection="column" gap={2}>
                    <TextField 
                        autoFocus
                        label="Name"
                        fullWidth
                        variant="outlined"
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                    />

                    {pendingType === 'Library' && (
                        <Autocomplete
                            freeSolo
                            options={regions}
                            value={uploadRegion}
                            onChange={(event, newValue) => setUploadRegion(newValue)}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="Region" 
                                    placeholder="Select or type to add new region"
                                    onChange={(e) => setUploadRegion(e.target.value)}
                                />
                            )}
                            fullWidth
                        />
                    )}
                    
                    <Box
                        component="label"
                        sx={{
                            border: "2px dashed #E5E7EB",
                            borderRadius: 2,
                            p: 3,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            bgcolor: "#F9FAFB",
                            "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" }
                        }}
                    >
                        <CloudUploadIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
                         <Typography variant="body2" fontWeight={600} color="text.primary">
                            {pendingFile ? pendingFile.name : "Click to upload"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                             {pendingFile ? `${(pendingFile.size / 1024).toFixed(2)} KB` : "Only .CSV files are supported"}
                        </Typography>
                        <input
                            type="file"
                            hidden
                            accept=".csv"
                            onChange={handleFileChange}
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseModal}>Cancel</Button>
                <Button 
                    onClick={handleConfirmUpload} 
                    variant="contained" 
                    disabled={!uploadName.trim() || !pendingFile || (pendingType === 'Library' && !uploadRegion)}
                >
                    Upload
                </Button>
            </DialogActions>
        </Dialog>

        {/* Top Tabs */}
        <Box borderBottom={1} borderColor="divider" mb={2}>
            <Tabs 
                value={tabValue} 
                onChange={(e, v) => { setTabValue(v); setPage(0); }} 
                aria-label="template-library-tabs"
            >
                <Tab label="Templates" value="templates" sx={{ textTransform: "none", fontWeight: 600, fontSize: "1rem" }} />
                <Tab label="Libraries" value="libraries" sx={{ textTransform: "none", fontWeight: 600, fontSize: "1rem" }} />
            </Tabs>
        </Box>

        {/* Header & Controls */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            {/* Left: Title or Description (Small) */}
             <Typography variant="h6" fontWeight={700} color="text.primary">
              {tabValue === 'templates' ? 'Templates' : 'Libraries'}
            </Typography>

            {/* Right: Search + Action */}
            <Box display="flex" gap={2} alignItems="center">
                 <TextField
                    placeholder="Search..."
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
                    sx={{ width: 250, bgcolor: "white" }}
                />

                {tabValue === 'libraries' && (
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    sx={{ 
                        textTransform: "none", 
                        fontWeight: 600,
                        borderColor: "#E5E7EB",
                        color: "text.primary",
                        "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" }
                    }}
                    onClick={() => handleOpenUploadModal("Library")}
                  >
                    Upload Library
                  </Button>
                )}
                {tabValue === 'templates' && (
                  <Button
                    variant="contained"
                    startIcon={<UploadFileIcon />}
                    sx={{ 
                        textTransform: "none", 
                        fontWeight: 600,
                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)"
                    }}
                    onClick={() => handleOpenUploadModal("Template")}
                  >
                    Upload Template
                  </Button>
                )}
            </Box>
        </Box>
  
        {/* Table */}
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
              "Name",
              "Extension",
              "Category",
              tabValue === 'libraries' ? "Region" : "",
              "Created By",
              "Last Modified",
              ""
            ].map((h) => (
              <TableCell
                key={h}
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  fontSize: "0.75rem",
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
          {paginatedTemplates.map((template) => {
            return (
            <TableRow
              key={template.id}
              hover
              sx={{
                cursor: "pointer",
                "&:hover": { bgcolor: "#F9FAFB" },
              }}
            >
              {/* Name */}
              <TableCell>
                <Typography fontWeight={600} variant="body2">
                  {template.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontFamily="monospace"
                  >
                  {template.id}
                </Typography>
              </TableCell>

              {/* File Type */}
              <TableCell>
                 <Chip 
                    label={template.fileType} 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                        height: 20,
                        fontSize: "0.7rem",
                        borderRadius: 0.5, 
                        fontWeight: 600, 
                        borderColor: "#E5E7EB",
                        color: "text.secondary"
                    }}
                />
              </TableCell>
  
              <TableCell>
                 <Chip 
                    label={template.category} 
                    size="small" 
                    variant="outlined" 
                    sx={{ borderRadius: 1, fontWeight: 500, bgcolor: "#F3F4F6", border: "1px solid #E5E7EB" }}
                />
              </TableCell>

              {/* Region (Only for Libraries) */}
              <TableCell>
                 {tabValue === 'libraries' && (
                    <Chip 
                        label={template.region || "Global"} 
                        size="small" 
                        variant="outlined" 
                        sx={{ 
                            borderRadius: 1, 
                            fontWeight: 600, 
                            bgcolor: "#F0F7FF", 
                            border: "1px solid #D1E4FF",
                            color: "#1A4080",
                            fontSize: "0.7rem",
                            height: 22
                        }}
                    />
                 )}
              </TableCell>
  
               {/* Created By */}
               <TableCell>
                 <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar 
                        sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "primary.light", color: "primary.main", fontWeight: 600 }}
                    >
                        {template.avatar}
                    </Avatar>
                    <Typography variant="body2">
                        {template.author}
                    </Typography>
                 </Box>
              </TableCell>
  
              {/* Last Modified */}
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                    {template.updatedAt}
                </Typography>
              </TableCell>
  
              {/* Actions */}
              <TableCell align="right">
                <IconButton size="small">
                    <MoreVertIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
            );
          })}
  
          {!paginatedTemplates.length && (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                <Typography color="text.secondary">
                  No templates match your search.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  
    {/* Pagination */}
    <TablePagination
      component="div"
      count={filteredTemplates.length}
      page={page}
      onPageChange={(_, newPage) => setPage(newPage)}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={(e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
      rowsPerPageOptions={[5, 10, 25]}
      sx={{ borderTop: "1px solid #E5E7EB" }}
    />
  </Paper>
  
      </Box>
    );
  }
