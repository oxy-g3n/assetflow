import { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Tabs,
  Tab,
  Checkbox,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DownloadIcon from "@mui/icons-material/Download";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import LinkIcon from "@mui/icons-material/Link";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TableChartIcon from "@mui/icons-material/TableChart";
import StorageIcon from "@mui/icons-material/Storage";
import ScienceIcon from "@mui/icons-material/Science";
import SmartToyIcon from "@mui/icons-material/SmartToy";

export default function TemplateFill() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // State
  // Multi-stage Search State
  const [querySteps, setQuerySteps] = useState([
    { 
      id: 1, 
      name: "Search Stage 1", 
      source: "customers", // Can be table name or "step_N"
      conditions: [{ column: "", operator: "=", value: "", logic: "AND" }],
      results: [],
      visibleCols: ["customer_id", "first_name", "last_name", "customer_name", "email", "city"],
      selectedRows: []
    }
  ]);
  const [activeStepId, setActiveStepId] = useState(1);
  const [activeTab, setActiveTab] = useState(0); // For library preview 
  const [templateData, setTemplateData] = useState([]);
  const [librarySearch, setLibrarySearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);
  const [resultSearch, setResultSearch] = useState("");
  const [draggedValue, setDraggedValue] = useState(null);

  const activeStep = querySteps.find(s => s.id === activeStepId) || querySteps[0];



  // ============================================
  // LIBRARY DATA (CSV with linked tables)
  // ============================================
  const LIBRARY = {
    customers: {
      name: "Customers",
      headers: ["customer_id", "first_name", "last_name", "customer_name", "email", "phone", "city", "status"],
      data: [
        { customer_id: "C001", first_name: "John", last_name: "Doe", customer_name: "Acme Corp", email: "contact@acme.com", phone: "123-456-7890", city: "Mumbai", status: "Active" },
        { customer_id: "C002", first_name: "Jane", last_name: "Smith", customer_name: "Globex Inc", email: "info@globex.com", phone: "987-654-3210", city: "Delhi", status: "Active" },
        { customer_id: "C003", first_name: "Bruce", last_name: "Wayne", customer_name: "Stark Industries", email: "tony@stark.com", phone: "555-111-2222", city: "Bangalore", status: "Active" },
      ],
    },
    orders: {
      name: "Orders",
      headers: ["order_id", "customer_id", "order_date", "amount", "payment_status", "po_status"],
      data: [
        { order_id: "O001", customer_id: "C001", order_date: "2026-01-15", amount: 15000, payment_status: "Paid", po_status: "Approved" },
        { order_id: "O002", customer_id: "C001", order_date: "2026-01-20", amount: 8500, payment_status: "Pending", po_status: "Draft" },
        { order_id: "O003", customer_id: "C002", order_date: "2026-01-18", amount: 22000, payment_status: "Paid", po_status: "Approved" },
        { order_id: "O004", customer_id: "C003", order_date: "2026-01-22", amount: 45000, payment_status: "Overdue", po_status: "Pending" },
      ],
    },
    products: {
      name: "Products",
      headers: ["product_id", "product_name", "category", "price", "stock", "supplier"],
      data: [
        { product_id: "P001", product_name: "Widget A", category: "Electronics", price: 2500, stock: 150, supplier: "Supplier X" },
        { product_id: "P002", product_name: "Gadget B", category: "Electronics", price: 4500, stock: 75, supplier: "Supplier Y" },
        { product_id: "P003", product_name: "Tool C", category: "Hardware", price: 1200, stock: 200, supplier: "Supplier Z" },
      ],
    },
    order_items: {
      name: "Order Items",
      headers: ["order_id", "product_id", "quantity", "unit_price", "total"],
      data: [
        { order_id: "O001", product_id: "P001", quantity: 3, unit_price: 2500, total: 7500 },
        { order_id: "O001", product_id: "P002", quantity: 2, unit_price: 4500, total: 9000 },
        { order_id: "O002", product_id: "P003", quantity: 5, unit_price: 1200, total: 6000 },
        { order_id: "O003", product_id: "P001", quantity: 4, unit_price: 2500, total: 10000 },
        { order_id: "O004", product_id: "P002", quantity: 10, unit_price: 4500, total: 45000 },
      ],
    },
  };

  // Dynamic Template Columns
  const [templateColumns, setTemplateColumns] = useState([
    { key: "full_name", display: "Full Name" },
    { key: "name", display: "Company Name" },
    { key: "email", display: "Email" },
    { key: "order_no", display: "Order No" },
    { key: "date", display: "Date" },
    { key: "amount", display: "Amount" },
    { key: "product", display: "Product" },
    { key: "qty", display: "Qty" },
  ]);

  const [editingColKey, setEditingColKey] = useState(null);
  const [draggedColKey, setDraggedColKey] = useState(null);

  const libraryKeys = Object.keys(LIBRARY);
  
  // Aggregate all headers from all tables for the multi-select
  const allLibraryHeaders = useMemo(() => {
    const headers = new Set();
    libraryKeys.forEach(key => {
      LIBRARY[key].headers.forEach(h => headers.add(h));
    });
    return Array.from(headers);
  }, [libraryKeys]);

  // Universal Joined Data Helper
  const getUniversalData = useMemo(() => {
    const joined = [];
    const customers = LIBRARY.customers.data;
    const orders = LIBRARY.orders.data;
    const orderItems = LIBRARY.order_items.data;
    const products = LIBRARY.products.data;

    orderItems.forEach(item => {
      const order = orders.find(o => o.order_id === item.order_id) || {};
      const customer = customers.find(c => c.customer_id === order.customer_id) || {};
      const product = products.find(p => p.product_id === item.product_id) || {};
      
      joined.push({
        ...customer,
        ...order,
        ...item,
        ...product
      });
    });
    return joined;
  }, []);

  // Current step's source data
  const getSourceData = (source) => {
    if (source.startsWith("step_")) {
      const stepId = parseInt(source.split("_")[1]);
      const prevStep = querySteps.find(s => s.id === stepId);
      return prevStep ? prevStep.results : [];
    }
    return getUniversalData;
  };

  const getSourceHeaders = (source) => {
    if (source.startsWith("step_")) {
      const stepId = parseInt(source.split("_")[1]);
      const prevStep = querySteps.find(s => s.id === stepId);
      return prevStep && prevStep.results.length > 0 ? Object.keys(prevStep.results[0]) : [];
    }
    return allLibraryHeaders;
  };

  // Helpers for source selection
  const currentLib = LIBRARY[libraryKeys[activeTab]];
  const activeSourceData = getSourceData(activeStep.source);
  const activeSourceHeaders = getSourceHeaders(activeStep.source);

  // Run search for current active stage
  const runQuery = () => {
    const validConditions = activeStep.conditions.filter(c => c.column && c.value);
    if (validConditions.length === 0) {
      alert("Please add at least one filter");
      return;
    }

    const sourceData = getSourceData(activeStep.source);

    // Filter based on conditions
    const filtered = sourceData.filter((row) => {
      let result = null;
      
      for (let i = 0; i < validConditions.length; i++) {
        const cond = validConditions[i];
        const rowVal = String(row[cond.column] || "").toLowerCase();
        const condVal = cond.value.toLowerCase();
        
        let match = false;
        switch (cond.operator) {
          case "=": match = rowVal === condVal; break;
          case "!=": match = rowVal !== condVal; break;
          case "contains": match = rowVal.includes(condVal); break;
          case ">": match = parseFloat(row[cond.column]) > parseFloat(cond.value); break;
          case "<": match = parseFloat(row[cond.column]) < parseFloat(cond.value); break;
          case ">=": match = parseFloat(row[cond.column]) >= parseFloat(cond.value); break;
          case "<=": match = parseFloat(row[cond.column]) <= parseFloat(cond.value); break;
          default: match = rowVal.includes(condVal);
        }

        if (i === 0) {
          result = match;
        } else if (cond.logic === "AND") {
          result = result && match;
        } else {
          result = result || match;
        }
      }
      return result;
    });

    // Update the active stage with results
    setQuerySteps(prev => prev.map(s => {
      if (s.id === activeStepId) {
        // Auto-set visible columns if results changed and none set
        const visibleCols = s.visibleCols.length > 0 ? s.visibleCols : (filtered.length > 0 ? Object.keys(filtered[0]).slice(0, 8) : []);
        return { ...s, results: filtered, visibleCols };
      }
      return s;
    }));
  };

  // Drag and Drop handlers
  const handleCellDragStart = (e, value) => {
    e.dataTransfer.setData("text/plain", value);
    e.dataTransfer.effectAllowed = "copy";
    setDraggedValue(value);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedValue(null);
  };

  const handleColDragStart = (e, colKey, source = "results") => {
    e.dataTransfer.setData("column_key", colKey);
    e.dataTransfer.setData("drag_source", source);
    e.dataTransfer.effectAllowed = "copy";
    setDraggedColKey(colKey);
    setIsDragging(true);
  };

  const handleDrop = (e, rowIndex = null, colKey = null, isHeader = false) => {
    e.preventDefault();
    setIsDragging(false);
    setDraggedColKey(null);
    try {
      const textData = e.dataTransfer.getData("text/plain");
      const sourceColKey = e.dataTransfer.getData("column_key");

      if (isHeader && colKey && sourceColKey) {
        // Drop entire column from results to template header
        const dragSource = e.dataTransfer.getData("drag_source");
        const sourceData = dragSource === "library" ? currentLib.data : activeStep.results;
        setTemplateData(prev => {
          const updated = [...prev];
          // Fill existing rows or create new ones if needed
          const maxRows = Math.max(updated.length, sourceData.length);
          const finalData = [];
          for (let i = 0; i < maxRows; i++) {
            const row = updated[i] || { _id: Date.now() + i };
            const newValue = sourceData[i] ? String(sourceData[i][sourceColKey] || "") : "";
            
            // CONCAT LOGIC: If existing value, append with space
            const existingValue = String(row[colKey] || "");
            const finalValue = existingValue && newValue 
              ? `${existingValue} ${newValue}` 
              : (newValue || existingValue);
              
            finalData.push({ ...row, [colKey]: finalValue });
          }
          return finalData;
        });
        return;
      }

      if (rowIndex !== null && colKey !== null && textData) {
        // Drop into specific cell - also support concatenation
        setTemplateData(prev => {
          const updated = [...prev];
          const existingValue = String(updated[rowIndex][colKey] || "");
          const finalValue = existingValue && textData 
            ? `${existingValue} ${textData}` 
            : (textData || existingValue);
          updated[rowIndex] = { ...updated[rowIndex], [colKey]: finalValue };
          return updated;
        });
      }
    } catch (err) {
      console.error("Drop failed", err);
    }
  };



  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // Insertion handlers
  const addEmptyRow = () => {
    const newRow = { _id: Date.now() };
    templateColumns.forEach(col => newRow[col.key] = "");
    setTemplateData(prev => [...prev, newRow]);
  };

  const addColumn = () => {
    const newKey = `col_${Date.now()}`;
    setTemplateColumns(prev => [...prev, { key: newKey, display: "New Column" }]);
  };

  const deleteColumn = (colKey) => {
    setTemplateColumns(prev => prev.filter(c => c.key !== colKey));
    setTemplateData(prev => prev.map(row => {
      const { [colKey]: removed, ...rest } = row;
      return rest;
    }));
  };

  const renameColumn = (colKey, newDisplay) => {
    setTemplateColumns(prev => prev.map(c => c.key === colKey ? { ...c, display: newDisplay } : c));
    setEditingColKey(null);
  };

  const addSelectedToTemplate = () => {
    const newRows = activeStep.selectedRows.map(idx => {
      const sourceRow = activeStep.results[idx];
      const newRow = { _id: Date.now() + Math.random() };
      templateColumns.forEach(col => {
        newRow[col.key] = sourceRow[col.key] || "";
      });
      return newRow;
    });
    setTemplateData(prev => [...prev, ...newRows]);
    // Clear selection for active step
    setQuerySteps(prev => prev.map(s => s.id === activeStepId ? { ...s, selectedRows: [] } : s));
  };

  const clearTemplate = () => setTemplateData([]);

  // Update a cell in template
  const updateTemplateCell = (rowIndex, colKey, value) => {
    const updated = [...templateData];
    updated[rowIndex] = { ...updated[rowIndex], [colKey]: value };
    setTemplateData(updated);
  };

  // Delete a row from template
  const deleteTemplateRow = (rowIndex) => {
    setTemplateData(templateData.filter((_, i) => i !== rowIndex));
  };

  const handleGenerate = () => {
    console.log("Exporting:", templateData);
    alert(`Generated document with ${templateData.length} rows!`);
  };



  // Styles
  const cellStyle = { 
    fontSize: "0.75rem", 
    borderRight: "1px solid #F1F5F9", 
    py: 0.75, 
    px: 1.5, 
    whiteSpace: "nowrap",
    color: "#334155"
  };
  const headerStyle = { 
    ...cellStyle, 
    fontWeight: 700, 
    bgcolor: "#F8FAFC", 
    fontSize: "0.65rem", 
    textTransform: "uppercase", 
    color: "#64748B",
    borderBottom: "2px solid #E2E8F0",
    letterSpacing: "0.05em",
    verticalAlign: "middle",
    zIndex: 2 // Above content, below AppBar
  };

  const panelHeaderStyle = {
    px: 2, 
    py: 1.25, 
    borderBottom: "1px solid #E2E8F0", 
    bgcolor: "#FFFFFF", 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center"
  };

  return (
    <Box p={isMobile ? 1.5 : 2} sx={{ minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header & Stepper */}
      <Box 
        display="flex" 
        flexDirection={isMobile ? "column" : "row"} 
        justifyContent="space-between" 
        alignItems={isMobile ? "flex-start" : "flex-end"} 
        sx={{ borderBottom: "1px solid #E2E8F0", pb: 2, gap: 2 }}
      >
        <Box>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight={800} sx={{ color: "#1E293B", letterSpacing: "-0.02em" }}>Fill Template Agent</Typography>
          <Typography variant="caption" color="text.secondary">
            Search across your source lists and build your document record-by-record By AI Agent.
          </Typography>
        </Box>
        
      </Box>

      {/* Main Grid: 2x2 or 1x4 */}
      <Box 
        display="grid" 
        gridTemplateColumns={isMobile ? "1fr" : "1fr 1fr"} 
        gridTemplateRows={isMobile ? "auto" : "1fr 1fr"} 
        gap={2} 
        flex={1} 
        minHeight={0}
      >

        {/* TOP LEFT: Library CSV with Tabs */}
        <Paper variant="outlined" sx={{ overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: "8px", border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
          <Box sx={{ ...panelHeaderStyle, flexDirection: "column", alignItems: "stretch", gap: 1.5, py: 1.5 }}>
            <Box display="flex" flexDirection={isMobile ? "column" : "row"} justifyContent="space-between" alignItems={isMobile ? "flex-start" : "center"} gap={isMobile ? 1.5 : 0}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{ bgcolor: "primary.main", p: 0.5, borderRadius: "4px", display: "flex", boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)" }}>
                  <StorageIcon sx={{ fontSize: 16, color: "white" }} />
                </Box>
                <Typography fontSize={14} fontWeight={800} color="#1E293B" sx={{ letterSpacing: "-0.01em" }}>Library</Typography>
              </Box>
              <TextField
                size="small"
                placeholder="Search records..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                sx={{ width: isMobile ? "100%" : 180 }}
                InputProps={{ 
                  sx: { height: 32, fontSize: 12, bgcolor: "#F8FAFC", borderRadius: "6px", "& fieldset": { borderColor: "#E2E8F0" } },
                  startAdornment: <SearchIcon sx={{ fontSize: 16, color: "#94A3B8", mr: 1 }} />
                }}
              />
            </Box>
            
            <Box sx={{ borderTop: "1px solid #F1F5F9", pt: 1 }}>
              <Tabs
                value={activeTab}
                onChange={(e, v) => { setActiveTab(v); setLibrarySearch(""); }}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ 
                  minHeight: 28,
                  "& .MuiTab-root": { 
                    minHeight: 28, 
                    py: 0, 
                    px: 1.5, 
                    fontSize: 11, 
                    fontWeight: 700, 
                    color: "#94A3B8", 
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    transition: "color 0.2s",
                    "&.Mui-selected": { color: "primary.main" } 
                  },
                  "& .MuiTabs-indicator": { height: 2, borderRadius: "2px" }
                }}
              >
                {libraryKeys.map((key) => (
                  <Tab key={key} label={LIBRARY[key].name} />
                ))}
              </Tabs>
            </Box>
          </Box>
          <TableContainer sx={{ maxHeight: isMobile ? 300 : "none", flex: 1, bgcolor: "#FFFFFF", overflowX: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {currentLib.headers.map((h) => (
                    <TableCell 
                      key={h} 
                      sx={{ ...headerStyle, cursor: "grab", "&:active": { cursor: "grabbing" } }}
                      draggable
                      onDragStart={(e) => handleColDragStart(e, h, "library")}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <DragIndicatorIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
                        {h.replace(/_/g, " ")}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const filtered = currentLib.data.filter((row) => 
                    !librarySearch || 
                    currentLib.headers.some(h => 
                      String(row[h]).toLowerCase().includes(librarySearch.toLowerCase())
                    )
                  );
                  
                  if (filtered.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={currentLib.headers.length} align="center" sx={{ py: 8 }}>
                          <Box sx={{ color: "#94A3B8" }}>
                            <SearchIcon sx={{ fontSize: 40, mb: 1.5, opacity: 0.15 }} />
                            <Typography fontSize={13} fontWeight={700} color="#64748B">No matching records</Typography>
                            <Typography fontSize={12}>Try adjusting your search criteria</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  
                  return filtered.map((row, i) => (
                    <TableRow key={i} hover sx={{ "&:hover": { bgcolor: "#F8FAFC" } }}>
                      {currentLib.headers.map((h) => (
                        <TableCell 
                          key={h} 
                          sx={{ 
                            ...cellStyle, 
                            fontWeight: 500,
                            cursor: "grab",
                            "&:active": { cursor: "grabbing" }
                          }}
                          draggable
                          onDragStart={(e) => handleCellDragStart(e, row[h])}
                          onDragEnd={handleDragEnd}
                        >
                          <Box 
                            sx={{ 
                              px: 1, py: 0.5, borderRadius: "4px",
                              "&:hover": { bgcolor: "rgba(0,0,0,0.03)" } 
                            }}
                          >
                            {row[h]}
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* TOP RIGHT: Template CSV */}
        <Paper variant="outlined" sx={{ overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
          <Box sx={{ ...panelHeaderStyle, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: isMobile ? 1.5 : 0 }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ bgcolor: "primary.main", p: 0.5, borderRadius: "4px", display: "flex" }}>
                <TableChartIcon sx={{ fontSize: 16, color: "white" }} />
              </Box>
              <Box>
                <Typography fontSize={14} fontWeight={700} color="#1E293B">Template</Typography>
                <Typography fontSize={10} color="#94A3B8" fontWeight={500}>{templateData.length} active rows</Typography>
              </Box>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button size="small" variant="outlined" color="primary" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={addEmptyRow} sx={{ borderRadius: "4px", textTransform: "none", fontWeight: 700, px: 2, flex: isMobile ? 1 : "initial" }}>Row</Button>
              <Button size="small" variant="contained" color="primary" onClick={handleGenerate} disabled={!templateData.length} sx={{ borderRadius: "4px", textTransform: "none", fontWeight: 700, px: 2, boxShadow: "none", flex: isMobile ? 2 : "initial" }}>
                Build Document
              </Button>
              <IconButton size="small" onClick={clearTemplate} disabled={!templateData.length} sx={{ ml: isMobile ? "auto" : 0 }}>
                <DeleteIcon sx={{ fontSize: 18, color: "error.main" }} />
              </IconButton>
            </Box>
          </Box>
          <TableContainer 
            sx={{ 
              maxHeight: isMobile ? 300 : "none",
              flex: 1, 
              position: "relative",
              transition: "all 0.2s",
              overflowX: "auto"
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...headerStyle, width: 40, textAlign: "center" }}>#</TableCell>
                  {templateColumns.map((col) => (
                    <TableCell 
                      key={col.key} 
                      sx={{ 
                        ...headerStyle, 
                        p: 0,
                        position: "relative",
                        borderBottom: isDragging && draggedColKey ? `3px solid ${theme.palette.primary.main}` : "2px solid #E2E8F0"
                      }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, null, col.key, true)}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.5, py: 1, height: "100%" }}>
                        {editingColKey === col.key ? (
                          <TextField
                            autoFocus
                            size="small"
                            defaultValue={col.display}
                            onBlur={(e) => renameColumn(col.key, e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && renameColumn(col.key, e.target.value)}
                            variant="standard"
                            InputProps={{ disableUnderline: true, sx: { fontSize: "0.65rem", fontWeight: 800, color: "primary.main" } }}
                          />
                        ) : (
                          <Typography 
                            fontSize="0.65rem" 
                            fontWeight={800} 
                            sx={{ cursor: "pointer", flex: 1, letterSpacing: "0.03em" }}
                            onDoubleClick={() => setEditingColKey(col.key)}
                          >
                            {col.display}
                          </Typography>
                        )}
                        <Box sx={{ display: "flex", opacity: 0.3, "&:hover": { opacity: 1 }, transition: "opacity 0.2s" }}>
                          <IconButton size="small" sx={{ p: 0.25 }} onClick={() => setEditingColKey(col.key)}>
                            <EditIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                          <IconButton size="small" sx={{ p: 0.25, color: "error.main" }} onClick={() => deleteColumn(col.key)}>
                            <DeleteIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {templateData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={templateColumns.length + 1} align="center" sx={{ py: 6 }}>
                      <Box sx={{ color: "#94A3B8" }}>
                        <TableChartIcon sx={{ fontSize: 40, mb: 1, opacity: 0.2 }} />
                        <Typography fontSize={13} fontWeight={600}>Your template is empty</Typography>
                        <Typography fontSize={11}>Search for data below or drag records to start building.</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  templateData.map((row, rowIndex) => (
                    <TableRow key={row._id} sx={{ bgcolor: row._id > Date.now() - 5000 ? "rgba(16, 185, 129, 0.05)" : "#FFFFFF", transition: "background 1s", "&:hover": { bgcolor: "#F8FAFC" } }}>
                      <TableCell sx={{ ...cellStyle, width: 40, textAlign: "center", bgcolor: "#FAFAFA", fontWeight: 700, color: "#94A3B8", position: "relative" }}>
                        {rowIndex + 1}
                        <IconButton 
                          size="small" 
                          onClick={() => deleteTemplateRow(rowIndex)} 
                          sx={{ 
                            position: "absolute", 
                            left: 0, 
                            top: "50%", 
                            transform: "translateY(-50%)",
                            opacity: 0,
                            "&:hover": { opacity: 1, color: "error.main" }, 
                            transition: "opacity 0.2s"
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </TableCell>
                      {templateColumns.map((col) => (
                        <TableCell 
                          key={col.key} 
                          sx={{ 
                            ...cellStyle, 
                            p: 0,
                            position: "relative",
                            border: isDragging && !draggedColKey ? `1.5px dashed ${theme.palette.primary.main}` : "1px solid #F1F5F9",
                            bgcolor: isDragging && !draggedColKey ? "rgba(37, 99, 235, 0.05)" : "inherit"
                          }}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, rowIndex, col.key, false)}
                        >
                          <TextField
                            size="small"
                            value={row[col.key] || ""}
                            onChange={(e) => updateTemplateCell(rowIndex, col.key, e.target.value)}
                            variant="standard"
                            fullWidth
                            placeholder="..."
                            InputProps={{ 
                              disableUnderline: true, 
                              sx: { fontSize: "0.75rem", px: 1.5, py: 0.5, fontWeight: 500 } 
                            }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        {/* BOTTOM LEFT: search config */}
        <Paper variant="outlined" sx={{ overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
          <Box sx={{ ...panelHeaderStyle, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: isMobile ? 1.5 : 0 }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ bgcolor: "info.main", p: 0.5, borderRadius: "4px", display: "flex", boxShadow: "0 2px 4px rgba(2, 132, 199, 0.2)" }}>
                <SmartToyIcon sx={{ fontSize: 16, color: "white" }} />
              </Box>
              <Typography fontSize={14} fontWeight={700} color="#1E293B">Search Agent</Typography>
            </Box>
            <Autocomplete
                multiple
                size="small"
                limitTags={isMobile ? 1 : 2}
                disableCloseOnSelect
                options={allLibraryHeaders}
                value={activeStep.visibleCols}
                onChange={(e, newValue) => {
                  setQuerySteps(prev => prev.map(s => 
                    s.id === activeStepId ? { ...s, visibleCols: newValue } : s
                  ));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Select Columns" sx={{ fontSize: 12 }} />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                      sx={{ height: 20, fontSize: 10 }}
                    />
                  ))
                }
                sx={{ 
                  minWidth: isMobile ? "100%" : 300,
                  bgcolor: "#F8FAFC",
                  "& .MuiAutocomplete-input": { fontSize: 12 },
                  "& .MuiInputBase-root": { flexWrap: isMobile ? 'wrap' : 'nowrap', overflow: 'hidden' }
                }}
            />
          </Box>

          <Box sx={{ p: 2, minHeight: isMobile ? 400 : "none", flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 1.5 }}>
            {/* Conditions */}
            {activeStep.conditions.map((cond, idx) => (
              <Box key={idx} display="flex" flexDirection={isMobile ? "column" : "row"} gap={1} alignItems={isMobile ? "stretch" : "center"}>
                <Box sx={{ width: isMobile ? "100%" : 60, display: "flex", justifyContent: isMobile ? "flex-start" : "flex-end" }}>
                  {idx > 0 ? (
                    <Select
                      size="small"
                      value={cond.logic}
                      sx={{ height: 28, fontSize: 10, fontWeight: 800, bgcolor: "#F1F5F9" }}
                      onChange={(e) => {
                        setQuerySteps(prev => prev.map(s => {
                          if (s.id === activeStepId) {
                            const updated = [...s.conditions];
                            updated[idx] = { ...updated[idx], logic: e.target.value };
                            return { ...s, conditions: updated };
                          }
                          return s;
                        }));
                      }}
                    >
                      <MenuItem value="AND" sx={{ fontSize: 10 }}>AND</MenuItem>
                      <MenuItem value="OR" sx={{ fontSize: 10 }}>OR</MenuItem>
                    </Select>
                  ) : (
                    <Typography fontSize={10} fontWeight={800} color="#64748B" sx={{ pr: 1 }}>WHERE</Typography>
                  )}
                </Box>

                <Autocomplete
                  size="small"
                  options={allLibraryHeaders}
                  value={cond.column || null}
                  onChange={(e, newValue) => {
                    setQuerySteps(prev => prev.map(s => {
                      if (s.id === activeStepId) {
                        const updated = [...s.conditions];
                        updated[idx] = { ...updated[idx], column: newValue || "" };
                        return { ...s, conditions: updated };
                      }
                      return s;
                    }));
                  }}
                  renderInput={(params) => <TextField {...params} placeholder="Column..." />}
                  sx={{ flex: 1, bgcolor: "#FFFFFF", "& .MuiInputBase-root": { height: 32, fontSize: 12 } }}
                />

                <Select
                  size="small"
                  value={cond.operator}
                  sx={{ width: isMobile ? "100%" : 80, height: 32, fontSize: 12, bgcolor: "#F8FAFC" }}
                  onChange={(e) => {
                    setQuerySteps(prev => prev.map(s => {
                      if (s.id === activeStepId) {
                        const updated = [...s.conditions];
                        updated[idx] = { ...updated[idx], operator: e.target.value };
                        return { ...s, conditions: updated };
                      }
                      return s;
                    }));
                  }}
                >
                  <MenuItem value="=">=</MenuItem>
                  <MenuItem value="!=">!=</MenuItem>
                  <MenuItem value="contains">contains</MenuItem>
                  <MenuItem value=">">&gt;</MenuItem>
                  <MenuItem value="<">&lt;</MenuItem>
                  <MenuItem value=">=">&gt;=</MenuItem>
                  <MenuItem value="<=">&lt;=</MenuItem>
                </Select>

                <TextField
                  size="small"
                  placeholder="Value..."
                  value={cond.value}
                  onChange={(e) => {
                    setQuerySteps(prev => prev.map(s => {
                      if (s.id === activeStepId) {
                        const updated = [...s.conditions];
                        updated[idx] = { ...updated[idx], value: e.target.value };
                        return { ...s, conditions: updated };
                      }
                      return s;
                    }));
                  }}
                  sx={{ flex: 1 }}
                  InputProps={{ sx: { height: 32, fontSize: 12 } }}
                />

                <IconButton
                  size="small"
                  disabled={activeStep.conditions.length === 1}
                  onClick={() => {
                    setQuerySteps(prev => prev.map(s => {
                      if (s.id === activeStepId) {
                        return { ...s, conditions: s.conditions.filter((_, i) => i !== idx) };
                      }
                      return s;
                    }));
                  }}
                  sx={{ opacity: activeStep.conditions.length === 1 ? 0 : 0.5, "&:hover": { opacity: 1, color: "error.main" } }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            ))}

            {/* Add condition button */}
            <Box display="flex" flexDirection={isMobile ? "column" : "row"} gap={1} mt={1}>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: "4px", flex: isMobile ? 1 : "initial" }}
                onClick={() => {
                  setQuerySteps(prev => prev.map(s => {
                    if (s.id === activeStepId) {
                      return { ...s, conditions: [...s.conditions, { column: "", operator: "=", value: "", logic: "AND" }] };
                    }
                    return s;
                  }));
                }}
              >
                Add Filter
              </Button>
              <Button 
                variant="contained" 
                size="small" 
                color="primary"
                startIcon={<PlayArrowIcon sx={{ fontSize: 16 }} />} 
                onClick={runQuery}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: "4px", boxShadow: "none", flex: isMobile ? 1 : "initial" }}
              >
                Search & Apply
              </Button>
            </Box>

          </Box>
        </Paper>

        {/* BOTTOM RIGHT: Search Results */}
        <Paper variant="outlined" sx={{ overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
          <Box sx={{ ...panelHeaderStyle, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: isMobile ? 1.5 : 0, bgcolor: activeStep.results.length ? "rgba(37, 99, 235, 0.05)" : "#FFFFFF" }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ bgcolor: activeStep.results.length ? "primary.main" : "#CBD5E1", p: 0.5, borderRadius: "4px", display: "flex" }}>
                <FilterListIcon sx={{ fontSize: 16, color: "white" }} />
              </Box>
              <Box>
                <Typography fontSize={14} fontWeight={700} color="#1E293B"> Results</Typography>
                <Typography fontSize={10} color="#94A3B8" fontWeight={500}>
                  {activeStep.results.length ? `Found ${activeStep.results.length} matches` : "Waiting for search..."}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" flexDirection={isMobile ? "column" : "row"} gap={1} width={isMobile ? "100%" : "auto"}>
              {activeStep.results.length > 0 && (
                <>
                  <TextField
                    size="small"
                    placeholder="Refine results..."
                    value={resultSearch}
                    onChange={(e) => setResultSearch(e.target.value)}
                    sx={{ width: isMobile ? "100%" : 140 }}
                    InputProps={{ 
                      sx: { height: 32, fontSize: 11, bgcolor: "#fff", borderRadius: "4px" },
                      startAdornment: <SearchIcon sx={{ fontSize: 14, color: "#94A3B8", mr: 0.5 }} />
                    }}
                  />
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
                    startIcon={<SettingsIcon sx={{ fontSize: 14 }} />}
                    sx={{ borderRadius: "4px", textTransform: "none", fontSize: 11, flex: isMobile ? 1 : "initial" }}
                  >
                    Columns
                  </Button>
                </>
              )}
              {activeStep.selectedRows.length > 0 && (
                <Button 
                  size="small" 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon sx={{ fontSize: 14 }} />} 
                  onClick={addSelectedToTemplate}
                  sx={{ borderRadius: "4px", textTransform: "none", fontWeight: 700, boxShadow: "none", flex: isMobile ? 1 : "initial" }}
                >
                  Use {activeStep.selectedRows.length} Selected
                </Button>
              )}
            </Box>
          </Box>

          {/* Column Toggle Popper */}
          <Dialog open={Boolean(columnMenuAnchor)} onClose={() => setColumnMenuAnchor(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "8px" } }}>
            <DialogTitle sx={{ fontSize: 16, fontWeight: 800, color: "#1E293B" }}>Adjust Visibility</DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <Box display="flex" flexDirection="column" sx={{ maxHeight: 300, overflow: "auto" }}>
                {activeStep.results.length > 0 && Object.keys(activeStep.results[0]).map(key => (
                  <Box 
                    key={key} 
                    sx={{ 
                      px: 2.5, py: 1.5, display: "flex", alignItems: "center", gap: 1, 
                      borderBottom: "1px solid #F1F5F9",
                      transition: "background 0.2s",
                      "&:hover": { bgcolor: "#F8FAFC" }
                    }}
                  >
                    <Checkbox 
                      size="small" 
                      sx={{ p: 0, color: "#CBD5E1", "&.Mui-checked": { color: "primary.main" } }}
                      checked={activeStep.visibleCols.includes(key)} 
                      onChange={() => {
                        setQuerySteps(prev => prev.map(s => {
                          if (s.id === activeStepId) {
                            const next = s.visibleCols.includes(key) ? s.visibleCols.filter(k => k !== key) : [...s.visibleCols, key];
                            return { ...s, visibleCols: next };
                          }
                          return s;
                        }));
                      }}
                    />
                    <Typography fontSize={13} fontWeight={600} color="#334155" sx={{ textTransform: "capitalize" }}>
                      {key.replace(/_/g, ' ')}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: "1px solid #F1F5F9" }}>
              <Button onClick={() => setColumnMenuAnchor(null)} variant="contained" sx={{ textTransform: "none", fontWeight: 700, borderRadius: "4px", boxShadow: "none" }}>Apply Changes</Button>
            </DialogActions>
          </Dialog>

          {!activeStep.results.length ? (
            <Box flex={1} display="flex" alignItems="center" justifyContent="center">
              <Box sx={{ textAlign: "center", color: "#94A3B8" }}>
                <ScienceIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.2 }} />
                <Typography fontSize={14} fontWeight={700} color="#64748B">Start Your Search</Typography>
                <Typography fontSize={12}>Apply your filters and click 'Search & Apply' to find records.</Typography>
              </Box>
            </Box>
          ) : (
            <TableContainer sx={{ flex: 1, maxHeight: isMobile ? 300 : "none", bgcolor: "#FFFFFF", overflowX: "auto" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...headerStyle, width: 44, p: 1 }}>
                      <Checkbox
                        size="small"
                        sx={{ p: 0, color: "#CBD5E1" }}
                        checked={activeStep.selectedRows.length === activeStep.results.length && activeStep.results.length > 0}
                        indeterminate={activeStep.selectedRows.length > 0 && activeStep.selectedRows.length < activeStep.results.length}
                        onChange={() => {
                          const allIdx = activeStep.results.map((_, i) => i);
                          const next = activeStep.selectedRows.length === activeStep.results.length ? [] : allIdx;
                          setQuerySteps(prev => prev.map(s => s.id === activeStepId ? { ...s, selectedRows: next } : s));
                        }}
                      />
                    </TableCell>
                    {activeStep.visibleCols.map((key) => (
                      <TableCell 
                        key={key} 
                        sx={{ ...headerStyle, position: "relative", cursor: "grab", "&:active": { cursor: "grabbing" } }}
                        draggable
                        onDragStart={(e) => handleColDragStart(e, key, "results")}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <DragIndicatorIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
                          {key.replace(/_/g, " ")}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeStep.results
                    .filter(row => 
                      !resultSearch || 
                      Object.values(row).some(val => String(val).toLowerCase().includes(resultSearch.toLowerCase()))
                    )
                    .map((row, i) => (
                    <TableRow
                      key={i}
                      hover
                      onClick={() => {
                        setQuerySteps(prev => prev.map(s => {
                          if (s.id === activeStepId) {
                            const next = s.selectedRows.includes(i) ? s.selectedRows.filter(r => r !== i) : [...s.selectedRows, i];
                            return { ...s, selectedRows: next };
                          }
                          return s;
                        }));
                      }}
                      sx={{ 
                        transition: "all 0.1s",
                        bgcolor: activeStep.selectedRows.includes(i) ? "rgba(37, 99, 235, 0.05)" : "inherit",
                        "&:hover": { bgcolor: activeStep.selectedRows.includes(i) ? "rgba(37, 99, 235, 0.08)" : "#F8FAFC" }
                      }}
                    >
                      <TableCell sx={{ p: 1, width: 44 }}>
                        <Checkbox 
                          size="small" 
                          sx={{ p: 0, color: "#CBD5E1" }}
                          checked={activeStep.selectedRows.includes(i)} 
                          onClick={(e) => e.stopPropagation()} 
                          onChange={() => {
                            setQuerySteps(prev => prev.map(s => {
                              if (s.id === activeStepId) {
                                const next = s.selectedRows.includes(i) ? s.selectedRows.filter(r => r !== i) : [...s.selectedRows, i];
                                return { ...s, selectedRows: next };
                              }
                              return s;
                            }));
                          }} 
                        />
                      </TableCell>
                      {activeStep.visibleCols.map((key) => (
                        <TableCell 
                          key={key} 
                          sx={{ 
                            ...cellStyle, 
                            cursor: "grab",
                            "&:active": { cursor: "grabbing" }
                          }}
                          draggable
                          onDragStart={(e) => handleCellDragStart(e, row[key])}
                          onDragEnd={handleDragEnd}
                        >
                          <Box 
                            sx={{ 
                              px: 1.5, py: 0.5, borderRadius: "4px", 
                              fontWeight: 500,
                              "&:hover": { bgcolor: "rgba(0,0,0,0.03)" } 
                            }}
                          >
                            {row[key] || "-"}
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

    </Box>
  );
}
