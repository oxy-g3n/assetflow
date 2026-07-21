const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const API_ROOT = `${API_BASE_URL}/api/v1`;

function getAuthHeaders(token, extraHeaders = {}) {
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
      message = error.detail || error.message || message;
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

export function formatDataModel(record) {
  return {
    ...record,
    createdBy: record.creator?.name || "Unknown",
    updatedByName: record.updated_by_name || record.creator?.name || "Unknown",
    createdAt: record.created_at ? new Date(record.created_at).toISOString().split("T")[0] : "",
    updatedAt: record.updated_at ? new Date(record.updated_at).toISOString().split("T")[0] : "",
    status: record.status ? `${record.status.charAt(0).toUpperCase()}${record.status.slice(1)}` : "Draft",
  };
}

export async function fetchDataModels(token, workflowId = null) {
  const suffix = workflowId ? `?workflow_id=${workflowId}` : "";
  const data = await request(`/data-models/${suffix}`, {
    headers: getAuthHeaders(token),
  });
  return data.map(formatDataModel);
}

export async function fetchDataModelById(id, token) {
  const data = await request(`/data-models/${id}`, {
    headers: getAuthHeaders(token),
  });
  return formatDataModel(data);
}

export async function createDataModel(payload, token) {
  const data = await request("/data-models/", {
    method: "POST",
    headers: getAuthHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return formatDataModel(data);
}

export async function ensureDataModelForWorkflow(
  { workflowId, name, methodology = "ER Diagram", regionId = null },
  token,
) {
  const existingModels = await fetchDataModels(token, workflowId);
  if (existingModels.length > 0) {
    return existingModels[0];
  }

  return createDataModel(
    {
      name: name || "New Data Model",
      status: "draft",
      methodology,
      workflow_id: workflowId,
      region_id: regionId,
      conceptual_payload: { nodes: [], edges: [] },
      logical_payload: { nodes: [], edges: [] },
      physical_payload: { nodes: [], edges: [] },
    },
    token,
  );
}

export async function updateDataModel(id, payload, token) {
  const data = await request(`/data-models/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return formatDataModel(data);
}

export async function deleteDataModel(id, token) {
  await request(`/data-models/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}

export async function runConceptualAgent(prompt, currentModel, token) {
  return request("/ai/conceptual-model", {
    method: "POST",
    headers: getAuthHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({
      prompt,
      current_model: currentModel,
    }),
  });
}
