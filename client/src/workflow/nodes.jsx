export const initialNodes = [
  {
    id: "1",
    type: "custom",
    position: { x: 50, y: 150 },
    data: { 
      label: "Stage 1", 
      stage: 1, 
      sequence: "01",
      isActive: true,
      disabled: false,
      status: "pending",
      assignees: 2,
      validation: true,
      description: "Template",
      statusText: "DRAFT",
      substages: [
        { id: "1.1", title: "Assigned", subtitle: "PENDING", status: "pending", type: "manual" },
        { id: "fill-template", title: "Fill Template Agent", subtitle: "PROCESSING...", status: "processing", type: "ai" },
        { id: "1.3", title: "Template Validation", subtitle: "PENDING", status: "pending", type: "automated" }
      ]
    },
  },
  {
    id: "2",
    type: "custom",
    position: { x: 450, y: 195 },
    data: { 
      label: "Stage 2", 
      stage: 2,
      sequence: "02",
      isActive: false,
      disabled: true,
      status: "pending",
      assignees: 1,
      validation: false,
      description: "Template Review",
      statusText: "PENDING",
      substages: [
        { id: "2.1", title: "Assigned", subtitle: "WAITING", status: "pending", type: "manual" },
        { id: "review-template", title: "Verify & Approve", subtitle: "WAITING", status: "pending", type: "logic" }
      ]
    },
  },
];
