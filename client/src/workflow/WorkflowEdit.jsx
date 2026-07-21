import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import WorkflowCanvas from "./WorkflowCanvas";
import { useAuth } from "../context/AuthContext";
import { fetchWorkflowById } from "./workflowApi";

export default function WorkflowEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workflow, setWorkflow] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        const data = await fetchWorkflowById(id, token);
        setWorkflow(data);
      } catch (err) {
        console.error("Error fetching workflow:", err);
        setError(err.message || "An error occurred while fetching the workflow");
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchWorkflow();
    }
  }, [id, token]);

  const handleBack = () => {
    navigate("/workflow");
  };

  const workflowMeta = useMemo(() => {
    if (!workflow) return null;
    return {
      id: workflow.id,
      name: workflow.name,
      template: workflow.type,
      completionDate: workflow.completionDate,
      status: workflow.status,
      stages: workflow.stages,
    };
  }, [workflow]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} textAlign="center">
        <Typography color="error" variant="h6">{error}</Typography>
        <Typography onClick={handleBack} sx={{ cursor: "pointer", color: "primary.main", mt: 2 }}>
          Back to Workflow List
        </Typography>
      </Box>
    );
  }

  return (
    <WorkflowCanvas 
      workflowMeta={workflowMeta} 
      isEdit
      workflowId={workflow.id}
      initialLoadedNodes={workflow.stages}
      onSaved={setWorkflow}
      onBack={handleBack} 
    />
  );
}
