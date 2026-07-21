import {
  Box,
  Button,
  Chip,
  Paper,
  MenuItem,
  TextField,
  Typography,
  Autocomplete,
  Stack,
  InputAdornment,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useState } from "react";
import dayjs from "dayjs";

const TEMPLATE_OPTIONS = [
  { label: "Data Modelling", value: "modelling", disabled: false },
  { label: "Tag Management", value: "tag", disabled: false },
  { label: "Data Management", value: "data", disabled: false },
  { label: "Document Management", value: "tag", disabled: false },
  { label: "Requirement Management", value: "req", disabled: true, comingSoon: true },
  { label: "Change Management", value: "change", disabled: true, comingSoon: true }
];

const METHODOLOGY_OPTIONS = [
  { label: "Relational Model", value: "Relational Model", disabled: false },
  { label: "Dimensional Model", value: "Dimensional Model", disabled: false },
  { label: "Agent Memory Model (Coming Soon)", value: "Agent Memory Model", disabled: true },
  { label: "Graph Model (Coming Soon)", value: "Graph Model", disabled: true },
  { label: "Data Vault (Coming Soon)", value: "Data Vault", disabled: true },
  { label: "Others", value: "Others", disabled: false }
];

export default function WorkflowSetup({ onSubmit, onBack }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [name, setName] = useState("");
  const [template, setTemplate] = useState(TEMPLATE_OPTIONS[0]);
  const [methodology, setMethodology] = useState("ER Diagram");
  const [completionDate, setCompletionDate] = useState(dayjs().add(5, 'day'));
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          height="100%"
          display="flex"
          alignItems={isMobile ? "flex-start" : "center"}
          justifyContent="center"
          bgcolor="#f8fafc"
          p={isMobile ? 2 : 0}
        >
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 3 : 5,
              width: "100%",
              maxWidth: 500,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              mt: isMobile ? 4 : 0
            }}
          >
            <Tooltip title="Return to the workflow list without creating a new workflow." arrow>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={onBack}
                sx={{ mb: 2, color: "text.secondary", textTransform: "none" }}
              >
                Back to List
              </Button>
            </Tooltip>

            <Typography variant="h5" fontWeight={700} mb={1}>
              Create Workflow
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
              Give your workflow a name and choose a starting point.
            </Typography>

            <Tooltip title="Name the workflow so your team can identify it later in the workflow list and review screens." arrow>
              <TextField
                label="Workflow Name"
                placeholder="e.g. New User Onboarding"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ mb: 3 }}
                required
              />
            </Tooltip>

            <Autocomplete
                options={TEMPLATE_OPTIONS}
                getOptionLabel={(option) => option.label}
                getOptionDisabled={(option) => option.disabled}
                value={template}
                onChange={(event, newValue) => {
                  setTemplate(newValue);
                }}
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    {...props}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      alignItems: 'center'
                    }}
                  >
                    <span>{option.label}</span>
                    {option.comingSoon && (
                      <span style={{ 
                        fontStyle: 'italic', 
                        color: '#9ca3af',
                        fontSize: '0.875rem'
                      }}>
                        (Coming Soon)
                      </span>
                    )}
                  </Box>
                )}
                renderInput={(params) => <TextField {...params} label="Workflow Type" />}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                sx={{ mb: 3, display: 'none' }}
            />
{template?.value === "modelling" && (
  <Tooltip title="Choose the modeling methodology that will shape Stage 1, including the conceptual, logical, and physical design flow." arrow>
    <TextField
      select
      fullWidth
      label="Relationships"
      value={methodology}
      onChange={(e) => setMethodology(e.target.value)}
      sx={{ mb: 3 }}
    >
      {METHODOLOGY_OPTIONS.map((option) => (
        <MenuItem
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          sx={{
            opacity: option.disabled ? 0.5 : 1,
            fontStyle: option.disabled ? "italic" : "normal"
          }}
        >
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  </Tooltip>
)}

            {/* Tags Field */}
            <Box sx={{ mb: 3 }}>
              <Tooltip title="Add searchable tags to group, filter, and organize workflows later." arrow>
                <TextField
                  label="Tags"
                  placeholder="Type a tag and press Enter"
                  fullWidth
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      e.preventDefault();
                      const newTag = tagInput.trim().toLowerCase();
                      if (!tags.includes(newTag)) {
                        setTags([...tags, newTag]);
                      }
                      setTagInput("");
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocalOfferIcon fontSize="small" sx={{ color: "action.active" }} />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Press Enter to add tags"
                />
              </Tooltip>
              {tags.length > 0 && (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} mt={1}>
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      onDelete={() => setTags(tags.filter((t) => t !== tag))}
                      sx={{ borderRadius: 1, fontWeight: 600, fontSize: "0.7rem" }}
                    />
                  ))}
                </Stack>
              )}
            </Box>

            <Tooltip title="Create the workflow and open the next working area. Data modelling workflows go directly into the modeling canvas." arrow>
              <span>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={!name}
                  onClick={() => onSubmit({ 
                    name, 
                    template: template?.value || "none", 
                    methodology: template?.value === "modelling" ? methodology : null,
                    completionDate: completionDate ? completionDate.format("YYYY-MM-DD") : "",
                    tags,
                  })}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "1rem",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)"
                  }}
                >
                  Create Workflow
                </Button>
              </span>
            </Tooltip>
          </Paper>
        </Box>
    </LocalizationProvider>
  );
}
