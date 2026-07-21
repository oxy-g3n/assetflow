import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Avatar,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import TableChartIcon from "@mui/icons-material/TableChart";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SendIcon from "@mui/icons-material/Send";
import { useNavigate, useLocation } from "react-router-dom";

export default function ReviewScreen() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchQuery, setSearchQuery] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm your AI assistant. I can help you analyze the template and library data. What would you like to know?" }
  ]);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock data for Review (10 columns, 30 rows) - Reused from WorkflowCanvas
  const rawReviewData = useMemo(() => {
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

  const filteredReviewData = useMemo(() => {
    if (!searchQuery.trim()) return rawReviewData;
    const lowerQuery = searchQuery.toLowerCase();
    return rawReviewData.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(lowerQuery)
      )
    );
  }, [rawReviewData, searchQuery]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const newMsg = { role: "user", content: chatInput };
    setMessages(prev => [...prev, newMsg]);
    setChatInput("");

    // Mock AI Response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `I've analyzed the data for "${chatInput}". Based on the template rules, everything looks consistent for this entry.` 
      }]);
    }, 1000);
  };

  return (
    <Box sx={{ height: "calc(100vh - 65px)", display: "flex", flexDirection: "column", bgcolor: "#F8FAFC" }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        borderBottom: "1px solid #E5E7EB",
        bgcolor: "white"
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(-1)} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ bgcolor: "primary.main", p: 0.75, borderRadius: "6px", display: "flex" }}>
              <TableChartIcon sx={{ color: "white", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#1E293B">Template Review</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>Full data verification & AI assistance</Typography>
            </Box>
          </Box>
        </Box>

        {/* Search Bar */}
        <Box sx={{ flex: 1, maxWidth: 400, mx: 4 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <IconButton size="small" sx={{ mr: 1, p: 0 }}>
                  <SendIcon sx={{ transform: "rotate(-90deg)", fontSize: 18, color: "text.secondary" }} />
                </IconButton>
              ),
              sx: { borderRadius: "10px", bgcolor: "#F1F5F9", "& fieldset": { border: "none" } }
            }}
          />
        </Box>

        <Box display="flex" gap={1.5}>
          <Button variant="outlined" color="inherit" onClick={() => navigate(-1)} sx={{ textTransform: "none", fontWeight: 700 }}>
            Back to Canvas
          </Button>
          <Button variant="contained" color="primary" sx={{ textTransform: "none", fontWeight: 700, boxShadow: "none" }}>
            Approve & Complete
          </Button>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Table Section */}
        <Box sx={{ flex: 1, p: 3, overflow: "auto", display: "flex", flexDirection: "column" }}>
          <Paper sx={{ 
            flex: 1, 
            borderRadius: "12px", 
            overflow: "hidden", 
            display: "flex", 
            flexDirection: "column",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
          }}>
            <TableContainer sx={{ flex: 1 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {rawReviewData.length > 0 && Object.keys(rawReviewData[0]).map(key => (
                      <TableCell key={key} align="center" sx={{ 
                        fontWeight: 700, 
                        color: "#64748B", 
                        textTransform: "uppercase", 
                        fontSize: "0.65rem",
                        letterSpacing: "0.05em",
                        bgcolor: "#F8FAFC",
                        py: 2,
                        whiteSpace: "nowrap"
                      }}>
                        {key.replace(/_/g, ' ')}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReviewData.map((row, i) => (
                    <TableRow key={i} hover>
                      {Object.values(row).map((val, j) => (
                        <TableCell key={j} align="center" sx={{ fontSize: "0.75rem", fontWeight: 500, color: "#334155", py: 2 }}>
                          {j === Object.values(row).length - 2 ? (
                            <Chip 
                              label={val} 
                              size="small" 
                              color={val === "Verified" ? "success" : "warning"} 
                              variant="light"
                              sx={{ fontWeight: 700, fontSize: "0.65rem", height: 20 }}
                            />
                          ) : val}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* Chatbot Sidebar */}
        <Box sx={{ 
          width: 380, 
          bgcolor: "white", 
          borderLeft: "1px solid #E5E7EB",
          display: "flex",
          flexDirection: "column"
        }}>
          <Box sx={{ p: 2, borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
              <SmartToyIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={800}>AI Assistant</Typography>
              <Typography variant="caption" color="success.main" fontWeight={700}>Online • Ready to help</Typography>
            </Box>
          </Box>

          {/* Messages */}
          <Box sx={{ flex: 1, p: 2, overflow: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
            {messages.map((msg, i) => (
              <Box key={i} sx={{ 
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                display: "flex",
                flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start"
              }}>
                <Paper sx={{ 
                  p: 1.5, 
                  borderRadius: msg.role === "user" ? "12px 12px 0 12px" : "12px 12px 12px 0",
                  bgcolor: msg.role === "user" ? "primary.main" : "#F1F5F9",
                  color: msg.role === "user" ? "white" : "#1E293B",
                  boxShadow: "none"
                }}>
                  <Typography variant="body2" sx={{ lineHeight: 1.5 }}>{msg.content}</Typography>
                </Paper>
                <Typography variant="caption" sx={{ mt: 0.5, color: "text.secondary", fontSize: "0.6rem" }}>
                  {msg.role === "user" ? "You" : "AI Assistant"} • Just now
                </Typography>
              </Box>
            ))}
            <div ref={chatEndRef} />
          </Box>

          {/* Chat Input */}
          <Box sx={{ p: 2, borderTop: "1px solid #F1F5F9" }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask about table data..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              InputProps={{
                endAdornment: (
                  <IconButton color="primary" size="small" onClick={handleSendMessage}>
                    <SendIcon fontSize="small" />
                  </IconButton>
                ),
                sx: { borderRadius: "8px", bgcolor: "#F8FAFC" }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block", textAlign: "center" }}>
              Try: "Are there any pending orders?"
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
