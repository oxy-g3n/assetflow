import { useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkflowSetup from "./WorkflowSetup";
import WorkflowCanvas from "./WorkflowCanvas";
import { useAuth } from "../context/AuthContext";
import { createWorkflow, serializeWorkflowPayload, updateWorkflow } from "./workflowApi";
import { ensureDataModelForWorkflow } from "../pages/dataModelApi";

export default function WorkflowCreate({ onBack, initialData, onSaved }) {
  const [meta, setMeta] = useState(initialData || null);
  const [workflowId, setWorkflowId] = useState(initialData?.id || null);
  const navigate = useNavigate();
  const { token } = useAuth();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleMetaSubmit = async (data) => {
    try {
      const payload = serializeWorkflowPayload({
        meta: { ...data, status: "Draft" },
        status: "Draft",
      });
      const savedWorkflow = initialData?.id
        ? await updateWorkflow(initialData.id, payload, token)
        : await createWorkflow(payload, token);

      setWorkflowId(savedWorkflow.id);
      setMeta(savedWorkflow);
      onSaved?.(savedWorkflow);

      if (data.template === "modelling") {
        const dataModel = await ensureDataModelForWorkflow(
          {
            workflowId: savedWorkflow.id,
            name: savedWorkflow.name,
            methodology: data.methodology || "ER Diagram",
          },
          token,
        );

        navigate(`/data/create/${dataModel.id}`, {
          state: {
            modelId: dataModel.id,
            modelName: savedWorkflow.name,
            workflowId: savedWorkflow.id,
            workflow: savedWorkflow,
          },
        });
      } else {
        navigate(`/workflow/edit/${savedWorkflow.id}`);
      }
    } catch (error) {
      console.error("Error creating workflow:", error);
      alert(error.message || "An error occurred. Please try again.");
    }
  };

  if (!meta) {
    return <WorkflowSetup onSubmit={handleMetaSubmit} onBack={handleBack} />;
  }

  return (
    <WorkflowCanvas
      workflowMeta={meta}
      workflowId={workflowId}
      onBack={handleBack}
      onSaved={(savedWorkflow) => {
        setMeta(savedWorkflow);
        setWorkflowId(savedWorkflow.id);
        onSaved?.(savedWorkflow);
      }}
    />
  );
}
