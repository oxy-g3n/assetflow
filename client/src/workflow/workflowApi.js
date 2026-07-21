import { initialNodes as defaultNodes } from "./nodes";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const API_ROOT = `${API_BASE_URL}/api/v1`;

export function isWorkflowManager(role) {
  return role === "admin" || role === "superadmin";
}

export function isWorkflowContributor(role) {
  return role === "contributor";
}

export function isWorkflowViewer(userRole, workflow, userId) {
  if (!workflow || !userId) return false;
  if (userRole === "viewer") return true;
  return (workflow.shared_viewer_ids || []).includes(userId);
}

/**
 * Returns true if the user can edit the given stage.
 * Admins/superadmins and the workflow creator can edit any stage.
 * All other users can edit a stage only if assigned as 'assignee'.
 */
export function isWorkflowDeveloper(userRole, workflow, userId, stageIndex) {
  if (!workflow || !userId) return false;
  if (userRole === "admin" || userRole === "superadmin") return true;
  if (workflow.createdBy === userId) return true;
  const stages = workflow.stages || [];
  const stage = stageIndex != null ? stages.find(s => s.stage_index === stageIndex) : null;
  const stagesSearched = stage ? [stage] : stages;
  return stagesSearched.some(s =>
    (s.assignments || []).some(a => a.user_id === userId && a.role === "assignee")
  );
}

/**
 * Returns true if the user can review (approve/reject) the given stage.
 * Admins/superadmins and the workflow creator can review any stage.
 * All other users can review a stage only if assigned as 'reviewer'.
 */
export function isWorkflowReviewer(userRole, workflow, userId, stageIndex) {
  if (!workflow || !userId) return false;
  if (userRole === "admin" || userRole === "superadmin") return true;
  if (workflow.createdBy === userId) return true;
  const stages = workflow.stages || [];
  const stage = stageIndex != null ? stages.find(s => s.stage_index === stageIndex) : null;
  const stagesSearched = stage ? [stage] : stages;
  return stagesSearched.some(s =>
    (s.assignments || []).some(a => a.user_id === userId && a.role === "reviewer")
  );
}

export function getAuthHeaders(token, extraHeaders = {}) {
  const headers = { ...extraHeaders };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, options);

  if (!response.ok) {
    let message = "Request failed";
    try {
      const error = await response.json();
      const detail = error.detail;
      if (Array.isArray(detail)) {
        message = detail
          .map((item) => item?.msg || JSON.stringify(item))
          .join("; ");
      } else if (typeof detail === "object" && detail !== null) {
        message = JSON.stringify(detail);
      } else {
        message = detail || error.message || message;
      }
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function normalizeWorkflowStatus(status) {
  const normalized = (status || "draft").toLowerCase();
  const statusMap = {
    draft: "Draft",
    active: "In Progress",
    review: "Review",
    completed: "Completed",
    failed: "Failed",
    archived: "Archived",
  };
  return statusMap[normalized] || status;
}

export function denormalizeWorkflowStatus(status) {
  const normalized = (status || "Draft").toLowerCase();
  const statusMap = {
    draft: "draft",
    "in progress": "active",
    review: "review",
    completed: "completed",
    failed: "failed",
    archived: "archived",
    active: "active",
  };
  return statusMap[normalized] || "draft";
}

export function formatWorkflow(workflow) {
  return {
    ...workflow,
    id: String(workflow.id),
    status: normalizeWorkflowStatus(workflow.status),
    updatedAt: workflow.updated_at ? new Date(workflow.updated_at).toISOString().split("T")[0] : "",
    createdAt: workflow.created_at ? new Date(workflow.created_at).toISOString().split("T")[0] : "",
    creator: workflow.creator
      ? {
          ...workflow.creator,
          avatar: workflow.creator.avatar || (workflow.creator.name ? workflow.creator.name[0] : "U"),
        }
      : workflow.created_by_name
      ? { name: workflow.created_by_name, avatar: workflow.created_by_name[0]?.toUpperCase() || "U" }
      : null,
    stages: (workflow.stages || []).map((stage) => {
      const assignments = stage.assignments || [];
      return {
        ...stage,
        methodology: stage.methodology || null,
        assignments: assignments.filter(a => a.role === 'assignee' && a.user_id),
        reviewers: assignments.filter(a => a.role === 'reviewer' && a.user_id),
        agent_assignments: assignments.filter(a => a.agent_id),
        substages: stage.substages || [],
      };
    }),
    shared_viewer_ids: workflow.shared_viewer_ids || [],
    shared_viewer_names: workflow.shared_viewer_names || [],
    tags: workflow.tags || [],
  };
}

function buildDefaultStages(meta) {
  const template = meta.template || meta.type;
  if (template === "modelling") {
    return [
      {
        label: "Data Model Design",
        stage_index: 0,
        sequence: "01",
        status: "pending",
        statusText: "DRAFT",
        description: "Data model creation",
        methodology: meta.methodology || "ER Diagram",
        isActive: true,
        disabled: false,
        validation_enabled: false,
        assignments: [],
        substages: [
          { title: "Assigned", subtitle: "PENDING", status: "pending", type: "manual" },
          { title: "Create Data Model", subtitle: "PENDING", status: "pending", type: "manual" },
          { title: "Review", subtitle: "PENDING", status: "pending", type: "logic" },
        ],
      },
    ];
  }

  return defaultNodes.map((node, index) => ({
    label: node.data.label,
    stage_index: index,
    sequence: node.data.sequence,
    status: node.data.status,
    statusText: node.data.statusText,
    description: node.data.description,
    methodology: node.data.methodology || null,
    isActive: node.data.isActive,
    disabled: node.data.disabled,
    validation_enabled: Boolean(node.data.validation),
    assignments: node.data.assignedUserIds || [],
    substages: (node.data.substages || []).map((substage) => ({
      title: substage.title,
      subtitle: substage.subtitle,
      status: substage.status,
      type: substage.type,
    })),
  }));
}

export function serializeWorkflowPayload({ meta, nodes, status }) {
  return {
    name: meta.name,
    type: meta.template || meta.type || "general",
    status: denormalizeWorkflowStatus(status || meta.status),
    completionDate: meta.completionDate || null,
    shared_viewer_ids: meta.shared_viewer_ids || [],
    shared_viewer_names: meta.shared_viewer_names || [],
    tags: meta.tags || [],
    stages:
      nodes && nodes.length > 0
        ? nodes
            .sort((a, b) => (a.data.stage || 0) - (b.data.stage || 0))
            .map((node, index) => ({
              label: node.data.label,
              stage_index: index,
              sequence: node.data.sequence || String(index + 1).padStart(2, "0"),
              status: node.data.status || "pending",
              statusText: node.data.statusText || "DRAFT",
              description: node.data.description || null,
              methodology: node.data.methodology || null,
              isActive: Boolean(node.data.isActive),
              disabled: Boolean(node.data.disabled),
              validation_enabled: Boolean(node.data.validation_enabled || node.data.validation),
              assignments: node.data.assignedUserIds || [],
              reviewers: node.data.reviewerIds || [],
              agent_assignments: node.data.agentIds || [],
              substages: (node.data.substages || []).map((substage) => ({
                title: substage.title,
                subtitle: substage.subtitle || null,
                status: substage.status || "pending",
                type: substage.type || null,
              })),
            }))
        : buildDefaultStages(meta),
  };
}

export async function fetchWorkflows(token) {
  const data = await request("/workflows/", {
    headers: getAuthHeaders(token),
  });
  return data.map(formatWorkflow);
}

export async function fetchWorkflowById(id, token) {
  const data = await request(`/workflows/${id}`, {
    headers: getAuthHeaders(token),
  });
  return formatWorkflow(data);
}

export async function createWorkflow(payload, token) {
  const data = await request("/workflows/", {
    method: "POST",
    headers: getAuthHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return formatWorkflow(data);
}

export async function updateWorkflow(id, payload, token) {
  const data = await request(`/workflows/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return formatWorkflow(data);
}

export async function deleteWorkflow(id, token) {
  await request(`/workflows/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}

/**
 * Transfer workflow ownership to a new user.
 * Only callable by Superadmin — the backend enforces this.
 */
export async function transferWorkflowOwner(workflowId, newOwnerId, token) {
  const data = await request(`/workflows/${workflowId}/transfer-owner`, {
    method: "PATCH",
    headers: getAuthHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ new_owner_id: newOwnerId }),
  });
  return formatWorkflow(data);
}

export async function fetchAssignableUsers(token) {
  return request("/users/", {
    headers: getAuthHeaders(token),
  });
}

export async function fetchAgents(token) {
  return request("/agents/", {
    headers: getAuthHeaders(token),
  });
}

export async function createAgent(agentData, token) {
  return request("/agents/", {
    method: "POST",
    headers: getAuthHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(agentData),
  });
}

export async function updateUserRole(userId, role, token) {
  return request(`/users/${userId}/role`, {
    method: "PATCH",
    headers: getAuthHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ role }),
  });
}
