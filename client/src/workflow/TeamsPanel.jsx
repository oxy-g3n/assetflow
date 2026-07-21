import React, { useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Paper,
  Divider,
  Badge,
  Tooltip
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import videocamIcon from "@mui/icons-material/Videocam";
import PhoneIcon from "@mui/icons-material/Phone";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import GifIcon from "@mui/icons-material/Gif";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import LaunchIcon from "@mui/icons-material/Launch";
import ChatIcon from "@mui/icons-material/Chat";

const TeamsPanel = ({ onClose }) => {
  const [message, setMessage] = useState("");

  const MOCK_MESSAGES = [
    {
      id: 1,
      user: "admin_user",
      avatar: "A",
      time: "2:45 PM",
      text: "Hey, can you check this workflow?",
      isMe: false,
    },
    {
      id: 2,
      user: "admin_user",
      isWorkflowCard: true,
      workflowTitle: "User Onboarding Workflow",
      workflowStatus: "Draft • Sharing enabled",
      isMe: false,
    },
    {
      id: 3,
      user: "Me",
      time: "Just now",
      text: "User is typing...",
      isMe: true,
      isTyping: true
    }
  ];

  const CONTACTS = [
    { id: 1, initial: "A", name: "admin_user", status: "online", color: "#3F51B5" },
    { id: 2, initial: "SM", name: "Sarah Miller", status: "online", color: "#00BFA5" },
    { id: 3, initial: "RK", name: "Robert King", status: "online", color: "#FF9800" },
  ];

  return (
    <Box 
      sx={{ 
        display: "flex", 
        flexDirection: "column", 
        height: "100%", 
        bgcolor: "white",
        overflow: "hidden",
        border: "1px solid #E5E7EB",
        borderRadius: "8px"
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          bgcolor: "#6264A7", 
          color: "white", 
          p: 1.5, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between" 
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <ChatIcon sx={{ fontSize: 20 }} />
          <Typography variant="subtitle2" fontWeight={700}>Teams Chat</Typography>
        </Box>
        <Box display="flex" gap={0.5}>
          <IconButton size="small" sx={{ color: "white" }}><MoreHorizIcon fontSize="small" /></IconButton>
          <IconButton onClick={onClose} size="small" sx={{ color: "white" }}><Typography variant="caption" sx={{ fontWeight: 800 }}>✕</Typography></IconButton>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, display: "flex", overflow: "hidden" }}>
        
        {/* Contacts Sidebar */}
        <Box 
          sx={{ 
            width: 60, 
            borderRight: "1px solid #F1F5F9", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            py: 2, 
            gap: 2,
            bgcolor: "#F8FAFC"
          }}
        >
          {CONTACTS.map((contact) => (
            <Badge 
              key={contact.id}
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              sx={{ 
                "& .MuiBadge-badge": { 
                  backgroundColor: '#44b700', 
                  color: '#44b700',
                  boxShadow: `0 0 0 2px white`,
                } 
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: contact.color, 
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: "pointer",
                  border: contact.id === 1 ? "2px solid #6264A7" : "none"
                }}
              >
                {contact.initial}
              </Avatar>
            </Badge>
          ))}
        </Box>

        {/* Chat Window */}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          
          {/* Chat Title Bar */}
          <Box 
            sx={{ 
              p: 1.5, 
              borderBottom: "1px solid #F1F5F9", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between" 
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Badge variant="dot" sx={{ "& .MuiBadge-badge": { backgroundColor: '#44b700' } }}>
                <Typography variant="body2" fontWeight={700} color="#1E293B">admin_user</Typography>
              </Badge>
            </Box>
            <Box display="flex" gap={1}>
              <IconButton size="small"><videocamIcon fontSize="small" /></IconButton>
              <IconButton size="small"><PhoneIcon fontSize="small" /></IconButton>
            </Box>
          </Box>

          {/* Search Bar */}
          <Box sx={{ px: 1.5, py: 1, bgcolor: "#F8FAFC" }}>
            <TextField 
              fullWidth 
              size="small" 
              placeholder="Search" 
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  </InputAdornment>
                ),
                sx: { 
                  height: 32, 
                  fontSize: "0.8rem", 
                  bgcolor: "white",
                  borderRadius: "4px"
                }
              }}
            />
          </Box>

          {/* Message History */}
          <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            {MOCK_MESSAGES.map((msg) => (
              <Box 
                key={msg.id} 
                sx={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: msg.isMe ? "flex-end" : "flex-start",
                  gap: 0.5
                }}
              >
                {!msg.isMe && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: "#3F51B5", fontSize: "0.7rem", fontWeight: 700 }}>{msg.avatar}</Avatar>
                    <Typography variant="caption" fontWeight={700} color="#1E293B">{msg.user}</Typography>
                    <Typography variant="caption" color="text.secondary">{msg.time}</Typography>
                  </Box>
                )}

                {msg.isWorkflowCard ? (
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 1.5, 
                      maxWidth: "280px", 
                      borderRadius: "8px", 
                      border: "1px solid #E2E8F0",
                      ml: 4
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                      <Box 
                        sx={{ 
                          width: 48, 
                          height: 48, 
                          bgcolor: "#F1F5F9", 
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                         <Box sx={{ width: 24, height: 16, display: "flex", gap: 0.5 }}>
                            <Box sx={{ flex: 1, bgcolor: "#94A3B8", borderRadius: "1px" }} />
                            <Box sx={{ flex: 1, bgcolor: "#CBD5E1", borderRadius: "1px" }} />
                         </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" fontWeight={700} sx={{ display: "block", color: "#1E293B" }}>
                          {msg.workflowTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: '0.65rem' }}>
                          {msg.workflowStatus}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1, color: "primary.main", cursor: "pointer" }}>
                          <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.65rem' }}>View Workflow</Typography>
                          <LaunchIcon sx={{ fontSize: 12 }} />
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                ) : (
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      bgcolor: msg.isMe ? "#F1F5F9" : "white", 
                      borderRadius: "8px", 
                      border: "1px solid #E2E8F0",
                      maxWidth: "85%",
                      ml: msg.isMe ? 0 : 4,
                      position: "relative"
                    }}
                  >
                    <Typography variant="body2" color="#334155" sx={{ fontStyle: msg.isTyping ? "italic" : "normal" }}>
                      {msg.text}
                    </Typography>
                  </Box>
                )}
                
                {msg.isMe && (
                   <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">{msg.time}</Typography>
                      <Avatar sx={{ width: 20, height: 20, bgcolor: "#94A3B8", fontSize: "0.6rem" }}>JD</Avatar>
                   </Box>
                )}
              </Box>
            ))}
          </Box>

          {/* Rich Input Area */}
          <Box sx={{ p: 1.5, borderTop: "1px solid #F1F5F9" }}>
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <Tooltip title="Format"><IconButton size="small"><FormatBoldIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
              <Tooltip title="Attach"><IconButton size="small"><AttachFileIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
              <Tooltip title="Emoji"><IconButton size="small"><InsertEmoticonIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
              <Tooltip title="GIF"><IconButton size="small"><GifIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
            </Box>
            
            <TextField 
              fullWidth 
              multiline
              rows={1}
              placeholder="Reply to admin_user..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              variant="filled"
              InputProps={{
                disableUnderline: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" color="primary"><SendIcon sx={{ fontSize: 20 }} /></IconButton>
                  </InputAdornment>
                ),
                sx: { 
                  borderRadius: "4px", 
                  bgcolor: "#F8FAFC",
                  "&:hover": { bgcolor: "#F1F5F9" }
                }
              }}
            />
          </Box>

        </Box>
      </Box>
    </Box>
  );
};

export default TeamsPanel;
