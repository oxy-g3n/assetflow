import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TableViewIcon from "@mui/icons-material/TableView";
import SaveIcon from "@mui/icons-material/Save";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useState, useMemo } from "react";

// Mock Data for Libraries
const LIBRARIES = {
  Contacts: {
    headers: ["First Name", "Last Name", "Email", "Phone", "Company", "Job Title", "City", "Country"],
    data: [
      { "First Name": "John", "Last Name": "Doe", "Email": "john@example.com", "Phone": "+1-555-0101", "Company": "Acme Corp", "Job Title": "Manager", "City": "New York", "Country": "USA" },
      { "First Name": "Jane", "Last Name": "Smith", "Email": "jane@test.com", "Phone": "+1-555-0102", "Company": "Globex", "Job Title": "Director", "City": "London", "Country": "UK" },
      { "First Name": "Alice", "Last Name": "Johnson", "Email": "alice@tech.io", "Phone": "+1-555-0103", "Company": "Soylent", "Job Title": "Engineer", "City": "San Francisco", "Country": "USA" },
    ]
  },
  Products: {
    headers: ["SKU", "Product Name", "Price", "Stock", "Category", "Description", "Supplier"],
    data: [
      { "SKU": "PRD-001", "Product Name": "Wireless Mouse", "Price": "$29.99", "Stock": "150", "Category": "Electronics", "Description": "Ergonomic mouse", "Supplier": "TechSupplies" },
      { "SKU": "PRD-002", "Product Name": "Keyboard", "Price": "$59.99", "Stock": "85", "Category": "Electronics", "Description": "Mechanical keyboard", "Supplier": "TechSupplies" },
      { "SKU": "PRD-003", "Product Name": "Monitor", "Price": "$199.99", "Stock": "40", "Category": "Electronics", "Description": "27-inch 4K", "Supplier": "ScreenCorp" },
    ]
  },
  Orders: {
    headers: ["Order ID", "Customer ID", "Date", "Total", "Status", "Payment Method", "Shipping Address"],
    data: [
      { "Order ID": "ORD-1001", "Customer ID": "CUST-501", "Date": "2026-01-20", "Total": "$120.00", "Status": "Shipped", "Payment Method": "Credit Card", "Shipping Address": "123 Main St" },
      { "Order ID": "ORD-1002", "Customer ID": "CUST-502", "Date": "2026-01-21", "Total": "$45.50", "Status": "Processing", "Payment Method": "PayPal", "Shipping Address": "456 Oak Ln" },
      { "Order ID": "ORD-1003", "Customer ID": "CUST-503", "Date": "2026-01-22", "Total": "$89.99", "Status": "Delivered", "Payment Method": "Credit Card", "Shipping Address": "789 Pine Rd" },
    ]
  }
};

export default function TemplateCreate({ onSubmit, onBack }) {
  const [name, setName] = useState("");
  const [selectedLibrary, setSelectedLibrary] = useState("");
  const [selectedHeaders, setSelectedHeaders] = useState([]);
  const [draggedHeader, setDraggedHeader] = useState(null);

  const handleLibraryChange = (e) => {
    const lib = e.target.value;
    setSelectedLibrary(lib);
    // Automatically select first 3 headers as default
    if (lib && LIBRARIES[lib]) {
      setSelectedHeaders(LIBRARIES[lib].headers.slice(0, 3));
    } else {
      setSelectedHeaders([]);
    }
  };

  const toggleHeader = (header) => {
    setSelectedHeaders((prev) =>
      prev.includes(header)
        ? prev.filter((h) => h !== header)
        : [...prev, header]
    );
  };

  // Drag and Drop Logic
  const handleDragStart = (e, header) => {
    setDraggedHeader(header);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetHeader) => {
    e.preventDefault();
    if (!draggedHeader || draggedHeader === targetHeader) return;

    const newHeaders = [...selectedHeaders];
    const draggedIndex = newHeaders.indexOf(draggedHeader);
    const targetIndex = newHeaders.indexOf(targetHeader);

    // Remove dragged item
    newHeaders.splice(draggedIndex, 1);
    // Insert at new position
    newHeaders.splice(targetIndex, 0, draggedHeader);

    setSelectedHeaders(newHeaders);
    setDraggedHeader(null);
  };

  const previewData = useMemo(() => {
    if (!selectedLibrary) return [];
    return LIBRARIES[selectedLibrary].data.map(row => {
      // Filter row keys and map to selected headers in order
      const newRow = {};
      selectedHeaders.forEach(header => {
        newRow[header] = row[header];
      });
      return newRow;
    });
  }, [selectedLibrary, selectedHeaders]);

  const handleSubmit = () => {
    console.log("Creating template:", { name, library: selectedLibrary, headers: selectedHeaders });
    onSubmit({ name, library: selectedLibrary, headers: selectedHeaders });
  };

  return (
    <Box height="100%" display="flex" flexDirection="column" bgcolor="#F8FAFC">
      {/* Top Bar */}
      <Box 
        p={2} 
        bgcolor="white" 
        borderBottom="1px solid #E5E7EB" 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={onBack} color="inherit">
            Back
          </Button>
          <Typography variant="h6" fontWeight={700}>
            Create Template
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
            <TextField 
                placeholder="Template Name" 
                size="small" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ width: 250 }}
            />
            <Button 
                variant="contained" 
                startIcon={<SaveIcon />}
                disabled={!name || !selectedLibrary || selectedHeaders.length === 0}
                onClick={handleSubmit}
                sx={{ textTransform: "none", fontWeight: 600 }}
            >
                Save Template
            </Button>
        </Box>
      </Box>

      {/* Main Content Areas */}
      <Box display="flex" flexGrow={1} overflow="hidden">
        
        {/* LEFT PANEL: CONFIGURATION */}
        <Box 
            width={400} 
            borderRight="1px solid #E5E7EB" 
            bgcolor="white" 
            p={3} 
            display="flex" 
            flexDirection="column"
            overflow="auto"
        >
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
                1. Select Library
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 4 }}>
                <InputLabel>Choose Library</InputLabel>
                <Select
                    value={selectedLibrary}
                    label="Choose Library"
                    onChange={handleLibraryChange}
                >
                    {Object.keys(LIBRARIES).map((lib) => (
                        <MenuItem key={lib} value={lib}>{lib}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Divider sx={{ mb: 4 }} />

            <Typography variant="subtitle1" fontWeight={600} mb={2}>
                2. Select Headers
            </Typography>
            
            {!selectedLibrary ? (
                <Typography variant="body2" color="text.secondary">
                    Please select a library first to see available headers.
                </Typography>
            ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                     <Typography variant="body2" color="text.secondary" mb={1}>
                        Select columns to include. (Reorder adjacent to preview)
                    </Typography>
                    {LIBRARIES[selectedLibrary].headers.map((header) => (
                        <FormControlLabel
                            key={header}
                            control={
                                <Checkbox 
                                    checked={selectedHeaders.includes(header)} 
                                    onChange={() => toggleHeader(header)}
                                    size="small"
                                />
                            }
                            label={
                                <Typography variant="body2" sx={{ 
                                    fontWeight: selectedHeaders.includes(header) ? 600 : 400 
                                }}>
                                    {header}
                                </Typography>
                            }
                        />
                    ))}
                </Box>
            )}
        </Box>

        {/* RIGHT PANEL: LIVE PREVIEW */}
        <Box flexGrow={1} p={4} overflow="auto" bgcolor="#F1F5F9">
            <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TableViewIcon color="action" />
                <Typography variant="h6" fontWeight={600} color="text.secondary">
                    Live CSV Preview
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2, bgcolor: "#E2E8F0", px: 1, borderRadius: 1 }}>
                    Drag columns to reorder
                </Typography>
            </Box>

            <Paper 
                elevation={3} 
                sx={{ 
                    overflow: "hidden", 
                    borderRadius: 1,
                    border: "1px solid #CBD5E1"
                }}
            >
                <TableContainer>
                    <Table size="small" sx={{ 
                        "& .MuiTableCell-root": { 
                            borderRight: "1px solid #E5E7EB", 
                            borderBottom: "1px solid #E5E7EB",
                            px: 1,
                            py: 0.5,
                            fontFamily: "Menlo, Monaco, Consolas, 'Courier New', monospace",
                            fontSize: "0.85rem"
                        },
                        "& .MuiTableCell-head": {
                             
                        }
                    }}>
                        <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                            <TableRow>
                                {selectedHeaders.length === 0 ? (
                                    <TableCell sx={{ textAlign: "center", py: 4, color: "text.secondary", borderRight: "none" }}>
                                        No columns selected
                                    </TableCell>
                                ) : (
                                    selectedHeaders.map((h) => (
                                        <TableCell 
                                            key={h} 
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, h)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, h)}
                                            sx={{ 
                                                fontWeight: 700, 
                                                whiteSpace: "nowrap",
                                                bgcolor: "#E2E8F0",
                                                color: "#334155",
                                                cursor: "grab",
                                                "&:active": { cursor: "grabbing" },
                                                "&:hover": { bgcolor: "#CBD5E1" }
                                            }}
                                        >
                                            <Box display="flex" alignItems="center" gap={0.5}>
                                                <DragIndicatorIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
                                                {h}
                                            </Box>
                                        </TableCell>
                                    ))
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody sx={{ bgcolor: "white" }}>
                             {selectedHeaders.length === 0 ? (
                                <TableRow>
                                    <TableCell sx={{ height: 100, borderRight: "none" }}></TableCell>
                                </TableRow>
                             ) : (
                                 previewData.map((row, i) => (
                                    <TableRow key={i}>
                                        {selectedHeaders.map((h) => (
                                            <TableCell key={`${i}-${h}`} sx={{ whiteSpace: "nowrap" }}>
                                                {row[h]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                             )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {selectedLibrary && (
                    <Box p={1} bgcolor="#F8FAFC" borderTop="1px solid #E5E7EB">
                         <Typography variant="caption" color="text.secondary">
                            Row 1-{previewData.length} shown.
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>

      </Box>
    </Box>
  );
}
