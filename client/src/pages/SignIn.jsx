import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../context/AuthContext";
import MenuItem from "@mui/material/MenuItem";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export default function SignIn() {
  const navigate = useNavigate();
  const { login, regions } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          region_id: selectedRegion,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Authentication failed");
      }

      const data = await response.json();
      login(data.role, data.region_id, data.access_token, {
        id: data.id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        region_id: data.region_id
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "#F5F7FA",
      }}
    >
      {/* Left Panel - Branding */}
      <Box
        sx={(theme) => ({
          flex: 1,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`,
          position: "relative",
          overflow: "hidden",
          p: 6,
        })}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.1)",
            top: -100,
            right: -100,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.08)",
            bottom: -50,
            left: -50,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: "50%",
            bgcolor: "rgba(255, 255, 255, 0.15)",
            top: "40%",
            left: "20%",
            filter: "blur(60px)",
          }}
        />

        {/* Content */}
        <Box sx={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 400 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: "#FFFFFF",
              mb: 2,
              letterSpacing: "-0.02em",
            }}
          >
            AssetFlow
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 500,
              color: "rgba(255,255,255,0.9)",
              mb: 3,
            }}
          >
            Streamline Your Workflow
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.7,
            }}
          >
            Manage templates, automate workflows, and boost your team's productivity with our comprehensive platform.
          </Typography>
        </Box>
      </Box>

      {/* Right Panel - Form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: { xs: 3, sm: 6 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 440,
            p: { xs: 4, sm: 5 },
            borderRadius: 3,
            border: "1px solid #E5E7EB",
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={700} color="text.primary" mb={1}>
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to continue to your dashboard
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              sx={{ mb: 2.5 }}
              required
            />

            <TextField
              select
              fullWidth
              label="Region"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              sx={{ mb: 2.5 }}
              required
            >
              <MenuItem value="" disabled>Select your region</MenuItem>
              {regions.map((r) => (
                <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              sx={{ mb: 2 }}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ border: "none" }}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Remember Me & Forgot Password */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{ color: "#9CA3AF" }}
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Remember me
                  </Typography>
                }
              />
              <Link
                href="#"
                underline="hover"
                sx={{
                  fontSize: "0.875rem",
                  color: "primary.main",
                  fontWeight: 500,
                }}
              >
                Forgot password?
              </Link>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                py: 1.5,
                fontWeight: 600,
                fontSize: "1rem",
              }}
            >
              Sign In
            </Button>
          </Box>

          {/* Sign Up Link - Commented out for now */}
          {/* 
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{" "}
              <Link
                href="#"
                underline="hover"
                sx={{ fontWeight: 600, color: "primary.main" }}
              >
                Create account
              </Link>
            </Typography>
          </Box>
          */}
        </Paper>

        {/* Footer */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 4 }}>
          © 2026 AssetFlow. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
