import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Switch,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { fetchAssignableUsers, updateUserRole } from "../workflow/workflowApi";

export default function GlobalPermissions({ open, onClose, token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAssignableUsers(token);
      setUsers(data);
    } catch (err) {
      setError("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const handleToggleAdmin = async (user, isAdmin) => {
    const newRole = isAdmin ? "admin" : "user";
    try {
      await updateUserRole(user.id, newRole, token);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      setSnackbar({
        open: true,
        message: `${user.name || user.email} is now ${
          isAdmin ? "a Workflow Admin" : "a regular user"
        }`,
      });
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to update user role" });
      console.error(err);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Global Workflow Admins</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Assign users as Workflow Admins. Workflow Admins have full access to create,
            edit, and manage all workflows globally.
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <List>
              {users
                .filter((u) => u.role !== "superadmin")
                .map((user) => (
                  <ListItem key={user.id} divider>
                    <ListItemAvatar>
                      <Avatar src={user.avatar}>
                        {user.name?.[0] || user.email[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.name || user.email}
                      secondary={user.email}
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="caption" fontWeight={600}>
                          Workflow Admin
                        </Typography>
                        <Switch
                          edge="end"
                          checked={user.role === "admin"}
                          onChange={(e) => handleToggleAdmin(user, e.target.checked)}
                          color="primary"
                        />
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} variant="outlined" color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </>
  );
}
