import { createTheme } from "@mui/material/styles";

export const theme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: "#2356A7", // company blue
        light: "#4A7BC4",
        dark: "#1A4080",
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: "#111827", // dark for secondary buttons
      },
      background: {
        default: "#F5F7FA", // page background
        paper: "#FFFFFF", // cards, tables
      },
      text: {
        primary: "#111827",
        secondary: "#6B7280",
      },
      divider: "#E5E7EB",
      success: {
        main: "#22C55E",
      },
      error: {
        main: "#EF4444",
      },
    },

    shape: {
      borderRadius: 10,
    },

    typography: {
      fontFamily: "Inter, sans-serif",
      fontSize: 13, // Global reduction
      h1: { fontSize: "2rem", fontWeight: 600 },
      h2: { fontSize: "1.75rem", fontWeight: 600 },
      h3: { fontSize: "1.5rem", fontWeight: 600 },
      h4: { fontSize: "1.25rem", fontWeight: 600 },
      h5: { fontSize: "1.1rem", fontWeight: 600 },
      h6: { fontSize: "1rem", fontWeight: 600 },
      body1: { fontSize: "0.875rem" },
      body2: { fontSize: "0.8rem" },
      button: {
        textTransform: "none",
        fontWeight: 500,
        fontSize: "0.8rem",
      },
      caption: {
        fontSize: "0.7rem",
      },
    },

    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: "1px solid #E5E7EB",
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: "8px 14px",
          },
          // containedPrimary and outlined use theme.palette.primary automatically
        },
      },

      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: "#F9FAFB",
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          head: {
            color: "#6B7280",
            fontWeight: 500,
            borderBottom: "1px solid #E5E7EB",
          },
          body: {
            borderBottom: "1px solid #E5E7EB",
          },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            border: "1px solid #E5E7EB",
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: "#FFFFFF",
          },
        },
      },
    },
  });
