from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class Token(BaseModel):
    id: int
    access_token: str
    token_type: str
    role: str
    region_id: int
    email: str
    name: Optional[str] = None
    avatar: Optional[str] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    region_id: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    region_id: int

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    region_id: int
    avatar: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str] = None
    role: str
    region_id: int
    avatar: Optional[str] = None

    class Config:
        from_attributes = True

from datetime import date, datetime
from typing import List

class RegionResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

# --- Workflow Schemas ---

class WorkflowBase(BaseModel):
    name: str
    type: Optional[str] = None
    status: Optional[str] = "draft"
    completionDate: Optional[date] = None
    shared_viewer_ids: List[int] = Field(default_factory=list)
    shared_viewer_names: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)

class WorkflowCreate(WorkflowBase):
    createdBy: Optional[int] = None
    stages: Optional[List['StageCreate']] = []

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    completionDate: Optional[date] = None

class WorkflowResponse(WorkflowBase):
    id: int
    createdBy: Optional[int] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    creator: Optional[UserResponse] = None
    assignee_names: List[str] = Field(default_factory=list)
    stages: List['StageResponse'] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True

# --- Stage Schemas ---

class StageBase(BaseModel):
    label: str
    stage_index: Optional[int] = 0
    sequence: Optional[str] = None
    status: Optional[str] = "pending"
    statusText: Optional[str] = None
    description: Optional[str] = None
    methodology: Optional[str] = None
    isActive: Optional[bool] = True
    disabled: Optional[bool] = False
    assignee_count: Optional[int] = 0
    validation_enabled: Optional[bool] = False

class StageCreate(StageBase):
    workflow_id: Optional[int] = None
    substages: Optional[List['SubstageCreate']] = []
    assignments: Optional[List[int]] = []
    reviewers: Optional[List[int]] = []
    agent_assignments: Optional[List[int]] = [] # IDs of agents to assign as 'assignee'

class StageUpdate(BaseModel):
    label: Optional[str] = None
    stage_index: Optional[int] = None
    status: Optional[str] = None
    description: Optional[str] = None
    isActive: Optional[bool] = None

class StageResponse(StageBase):
    id: int
    workflow_id: int
    created_at: datetime
    updated_at: datetime
    assignments: List['WorkflowAssignmentResponse'] = []
    substages: List['SubstageResponse'] = []

    class Config:
        from_attributes = True

# --- Substage Schemas ---

class SubstageBase(BaseModel):
    title: str
    subtitle: Optional[str] = None
    status: Optional[str] = "pending"
    type: Optional[str] = None

class SubstageCreate(SubstageBase):
    stage_id: Optional[int] = None

class SubstageResponse(SubstageBase):
    id: int
    stage_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Asset Schemas (Template & Library) ---

class TemplateBase(BaseModel):
    label: str
    file_path: Optional[str] = None

class TemplateCreate(TemplateBase):
    stage_id: Optional[int] = None

class TemplateResponse(TemplateBase):
    id: int
    stage_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LibraryBase(BaseModel):
    label: str
    file_path: Optional[str] = None
    region_id: Optional[int] = None

class LibraryCreate(LibraryBase):
    stage_id: Optional[int] = None

class LibraryResponse(LibraryBase):
    id: int
    stage_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DataModelPayload(BaseModel):
    nodes: list = Field(default_factory=list)
    edges: list = Field(default_factory=list)


class DataModelBase(BaseModel):
    name: str
    status: Optional[str] = "draft"
    methodology: Optional[str] = None
    region_id: Optional[int] = None
    workflow_id: Optional[int] = None
    conceptual_payload: DataModelPayload = Field(default_factory=DataModelPayload)
    logical_payload: DataModelPayload = Field(default_factory=DataModelPayload)
    physical_payload: DataModelPayload = Field(default_factory=DataModelPayload)


class DataModelCreate(DataModelBase):
    pass


class DataModelUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    methodology: Optional[str] = None
    region_id: Optional[int] = None
    workflow_id: Optional[int] = None
    conceptual_payload: Optional[DataModelPayload] = None
    logical_payload: Optional[DataModelPayload] = None
    physical_payload: Optional[DataModelPayload] = None


class DataModelResponse(DataModelBase):
    id: int
    created_by: int
    updated_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    creator: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class ModelEditorRequest(BaseModel):
    current_model: DataModelPayload = Field(default_factory=DataModelPayload)
    prompt: str
    agent_type: str = "conceptual"


class ModelEditorResponse(BaseModel):
    model: DataModelPayload
    raw_output: str
    archive_output: list = Field(default_factory=list)
    summary: Optional[str] = None
    relevance_flag: Optional[int] = None
    agent_type: str


class ConceptualAgentRequest(ModelEditorRequest):
    pass


class ConceptualAgentResponse(ModelEditorResponse):
    pass

# --- Agent Schemas ---

class AgentBase(BaseModel):
    name: str
    type: str
    config: Optional[dict] = None

class AgentCreate(AgentBase):
    pass

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    config: Optional[dict] = None

class AgentResponse(AgentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Field Mapping & Assignment Schemas ---

class FieldMappingBase(BaseModel):
    template_field: str
    library_field: Optional[str] = None
    is_required: Optional[bool] = False

class FieldMappingCreate(FieldMappingBase):
    stage_id: int

class FieldMappingResponse(FieldMappingBase):
    id: int
    stage_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TransferOwnerRequest(BaseModel):
    new_owner_id: int

class UserUpdateRole(BaseModel):
    role: str

class WorkflowAssignmentBase(BaseModel):
    user_id: Optional[int] = None
    agent_id: Optional[int] = None
    stage_id: int
    role: Optional[str] = "assignee"

class WorkflowAssignmentCreate(BaseModel):
    user_id: Optional[int] = None
    agent_id: Optional[int] = None
    role: Optional[str] = "assignee"

class StageAssignmentsUpdate(BaseModel):
    user_ids: List[int]

class WorkflowAssignmentResponse(WorkflowAssignmentBase):
    id: int
    created_at: datetime
    user: Optional[UserResponse] = None
    agent: Optional[AgentResponse] = None

    class Config:
        from_attributes = True
# Handle forward references
WorkflowCreate.model_rebuild()
WorkflowResponse.model_rebuild()
StageCreate.model_rebuild()
StageResponse.model_rebuild()
