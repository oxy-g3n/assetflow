# AssetFlow — Data Model Lifecycle Platform

AssetFlow is a workflow-driven platform for designing, reviewing, and governing **data models** across their full lifecycle: **Conceptual → Logical → Physical**. Teams create workflows made up of ordered stages, assign engineers and reviewers to each stage, and collaboratively build entity–relationship models on an interactive canvas — with optional **AI assistance** that edits the diagram from natural-language instructions.

> **New here?** Jump straight to [**SETUP.md**](./SETUP.md) for step-by-step install and run instructions.

---

## Table of contents

1. [What the project does](#what-the-project-does)
2. [Key features](#key-features)
3. [Tech stack](#tech-stack)
4. [High-level architecture](#high-level-architecture)
5. [Repository layout](#repository-layout)
6. [Backend (`server/`)](#backend-server)
7. [Frontend (`client/`)](#frontend-client)
8. [Data model / database](#data-model--database)
9. [Authentication & authorization](#authentication--authorization)
10. [AI model editor](#ai-model-editor)
11. [API reference (summary)](#api-reference-summary)
12. [Configuration & environment variables](#configuration--environment-variables)
13. [Security notes](#security-notes)
14. [Project status](#project-status)

---

## What the project does

An organization models its data assets through a governed process. AssetFlow turns that process into software:

- **Workflows** describe a modeling initiative (e.g. *"Q1 Retail Data Model"*). Each workflow contains ordered **stages**, and each stage contains **substages**, **assignments** (engineers/reviewers/AI agents), templates, libraries, and field mappings.
- **Data models** are attached to workflows and hold three graph payloads — **conceptual**, **logical**, and **physical** — each a set of nodes (entities) and edges (relationships) rendered on a ReactFlow canvas.
- **Roles** (superadmin, admin, engineer, reviewer, viewer) plus **per-stage assignments** and **regions** determine who can view, edit, review, or manage each artifact.
- An **AI model-editor** can take the current diagram plus a plain-English instruction (*"Add an Invoice entity related to Order"*) and return an updated node/edge graph.

The editing canvas supports **debounced autosave**, **remote-change polling**, and **soft conflict detection** so multiple people can work without silently clobbering each other's changes.

---

## Key features

- Role-based and region-aware access control (JWT auth).
- Workflow builder with stages, substages, assignees, reviewers, and AI-agent assignments.
- Three-layer data modeling (conceptual / logical / physical) on an interactive diagram canvas.
- AI-assisted diagram editing via Azure OpenAI.
- Autosave (1.2s debounce), 5s remote polling, and conflict warnings.
- Alembic-managed PostgreSQL schema with a full migration history.
- Interactive API docs via FastAPI's built-in Swagger UI (`/docs`).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, Material UI v7, ReactFlow 11, React Router 7 |
| Backend | Python, FastAPI, SQLAlchemy 2 (async / asyncpg), Pydantic v2 |
| Database | PostgreSQL, Alembic migrations |
| Auth | JWT (python-jose), bcrypt password hashing (passlib) |
| AI | Azure OpenAI (`gpt-4.1`) + TOON serialization; Azure Cognitive Speech (optional dictation) |

---

## High-level architecture

```mermaid
graph TB
  FE["React Frontend (Vite + MUI + ReactFlow)"]
  API["FastAPI Application (/api/v1)"]
  DB[("PostgreSQL")]
  AIO["Azure OpenAI (gpt-4.1)"]
  INS["Instruction YAML prompts"]

  FE -->|"Bearer JWT + JSON"| API
  API -->|"Async ORM (SQLAlchemy)"| DB
  API -->|"Model-edit requests"| AIO
  API -->|"Load agent prompts"| INS
```

The frontend talks to the backend exclusively over `/api/v1` with a `Bearer` JWT. The backend persists everything to PostgreSQL through async SQLAlchemy, and delegates AI diagram edits to Azure OpenAI using prompt templates stored as YAML.

---

## Repository layout

This workspace contains the **active application** plus **in-progress rewrites** kept side by side.

```
data_model_lifecycle/
├── server/            # ACTIVE backend — FastAPI + SQLAlchemy + PostgreSQL + Alembic
├── client/            # ACTIVE frontend — React + Vite + Material UI + ReactFlow
├── server2/           # Backend rewrite (in progress) — layered services/repositories, refresh tokens
├── frontend_v1/       # Frontend rewrite (in progress) — TypeScript + shadcn/ui + Tailwind
├── README.md          # This file
└── SETUP.md           # Install & run guide
```

> **Canonical stack:** `server/` + `client/` form the running application and are what the rest of this document describes. `server2/` and `frontend_v1/` are experimental rewrites and are not required to run AssetFlow.

---

## Backend (`server/`)

```
server/
├── app/
│   ├── main.py            # FastAPI app + CORS + router registration
│   ├── schemas.py         # Pydantic request/response contracts
│   ├── core/
│   │   ├── config.py      # Settings (env-driven)
│   │   └── security.py    # JWT creation + bcrypt hashing
│   ├── db/session.py      # Async + sync SQLAlchemy engines/sessions
│   ├── api/               # Routers: auth, users, regions, workflows,
│   │   │                  #          data_models, agents, ai, deps
│   └── models/            # ORM entities (user, region, workflow, stage,
│                          #   substage, template, library, field_mapping,
│                          #   workflow_assignment, data_model, agent,
│                          #   agent_conversation)
├── alembic/               # Migration environment + versions/
├── instructions/          # AI prompt templates (dm_cm_instruction.yaml, dm_lm_instruction.yaml)
├── AgentRunner.py         # AI orchestration prototype (Azure OpenAI client)
├── model_editor.py        # Thin wrapper used by the AI router
├── speech.py              # Optional microphone dictation (Azure Speech)
├── requirements.txt
└── (seed / maintenance scripts: seed_admin_users.py, create_engineer.py,
     add_region.py, clear_workflows.py, backfill_creator_name.py, verify_*.py, ...)
```

**Entry point.** `app/main.py` creates the FastAPI app, enables CORS, and mounts routers under `/api/v1`. Run it with `python -m app.main` (serves on `http://localhost:8000`, Swagger at `/docs`).

**Routers** (`app/api/`):

| Router | Prefix | Responsibility |
|---|---|---|
| `auth.py` | `/api/v1/auth` | Signup, login (issues JWT) |
| `regions.py` | `/api/v1/regions` | Public region list |
| `users.py` | `/api/v1` | List users, change role (superadmin) |
| `workflows.py` | `/api/v1` | Workflow + stage/substage/assignment CRUD, access control |
| `data_models.py` | `/api/v1` | Conceptual/logical/physical payload CRUD |
| `agents.py` | `/api/v1` | AI agent records |
| `ai.py` | `/api/v1` | AI model-editor endpoints |

**Persistence.** `app/db/session.py` builds an async engine (asyncpg) plus a sync engine (used by some scripts). Access is via the `get_db` dependency. Schema changes are managed through Alembic (`alembic upgrade head`).

---

## Frontend (`client/`)

```
client/
├── index.html
├── vite.config.js
├── src/
│   ├── main.jsx / App.jsx           # Bootstrap + routing
│   ├── context/AuthContext.jsx      # Token/session lifecycle (localStorage)
│   ├── pages/
│   │   ├── DataTemplates.jsx        # Central modeling workspace (autosave/polling/conflict)
│   │   ├── dataModelApi.js          # Data-model + AI API client
│   │   ├── SignIn.jsx, Dashboard.jsx, DataLibraries.jsx, ReviewScreen.jsx, Layout.jsx
│   ├── workflow/                    # Workflow canvas, setup, list, permissions, teams, nodes
│   │   └── workflowApi.js           # Workflow/agent/user API client + role helpers
│   ├── components/                  # Sidebar, Header, DashboardContent, StatCard, ...
│   ├── templates/                   # Template list / fill / create
│   ├── theme/theme.js               # MUI theme
│   └── constants/regions.js
└── package.json
```

The frontend reads its API base URL from `VITE_API_BASE_URL` (default `http://localhost:8000`). `AuthContext` stores the JWT and attaches it as a `Bearer` header via the API client helpers. `DataTemplates.jsx` is the heart of the app — it maintains the three graph states, drives autosave and polling, and renders the ReactFlow canvas.

**Autosave & conflict behavior:**

- Changes are serialized and compared against the last-saved snapshot; a save fires **1200 ms** after the last edit.
- A **5000 ms** poll fetches the remote model and compares `updated_at`.
- If the remote changed while you have unsaved edits, the UI warns instead of overwriting (soft conflict detection; last-write-wins at the API level).

---

## Data model / database

```mermaid
erDiagram
  REGIONS ||--o{ USERS : "region_id"
  REGIONS ||--o{ DATA_MODELS : "region_id"
  USERS ||--o{ WORKFLOWS : "createdBy"
  USERS ||--o{ DATA_MODELS : "created_by"
  USERS ||--o{ WORKFLOW_ASSIGNMENTS : "user_id"
  WORKFLOWS ||--o{ STAGES : "workflow_id"
  STAGES ||--o{ SUBSTAGES : "stage_id"
  STAGES ||--o{ TEMPLATES : "stage_id"
  STAGES ||--o{ LIBRARIES : "stage_id"
  STAGES ||--o{ FIELD_MAPPINGS : "stage_id"
  STAGES ||--o{ WORKFLOW_ASSIGNMENTS : "stage_id"
  AGENTS ||--o{ WORKFLOW_ASSIGNMENTS : "agent_id"
  AGENTS ||--o{ AGENT_CONVERSATIONS : "agent_id"
  WORKFLOWS ||--o{ DATA_MODELS : "workflow_id (nullable)"
```

Core entities (in `server/app/models/`):

- **Region** — logical/geographic partition; users and data models belong to a region.
- **User** — email, hashed password, role, `region_id`.
- **Workflow** — top-level initiative; owns ordered **Stages**.
- **Stage** — a phase of the workflow; owns **Substages**, **Templates**, **Libraries**, **FieldMappings**, and **WorkflowAssignments**.
- **Substage** — a checklist step within a stage.
- **WorkflowAssignment** — links a **user** or an **agent** to a stage with a role (`assignee` / `reviewer`).
- **DataModel** — belongs to a region and (optionally) a workflow; stores `conceptual_payload`, `logical_payload`, `physical_payload` as JSON graphs.
- **Agent** / **AgentConversation** — AI agent records and persisted AI turns with token/usage telemetry.

The schema is created and evolved through Alembic migrations in `server/alembic/versions/`.

---

## Authentication & authorization

- **Login** (`POST /api/v1/auth/login`) verifies the user, checks the bcrypt password, and confirms the requested `region_id` matches the user's region, then returns a signed JWT plus profile fields.
- **JWT** claims include `sub` (email), `role`, `region_id`, and `exp`. The token is validated on every protected request via the `get_current_user` dependency.
- **RBAC** is enforced in the backend with predicates such as `can_access_workflow`, `can_manage_workflow`, `can_edit_stage`, `can_review_stage`, `can_access_data_model`, and `can_manage_data_model`. The frontend mirrors these with helpers (`isWorkflowManager`, `isWorkflowDeveloper`, `isWorkflowReviewer`) for UI gating.

| Action | superadmin | admin | workflow creator | assigned engineer | assigned reviewer |
|---|:---:|:---:|:---:|:---:|:---:|
| View workflow | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update workflow metadata | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit stage content | ✅ | ✅ | ✅ | ✅ (own stage) | ❌ |
| Review stage | ✅ | ✅ | ✅ | ❌ | ✅ (own stage) |
| Transfer owner / change user role | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## AI model editor

The AI feature lets a user edit the diagram with natural language.

```mermaid
sequenceDiagram
  participant FE as Frontend
  participant AI as ai.py router
  participant MR as model_editor.py
  participant AR as AgentRunner
  participant AOAI as Azure OpenAI

  FE->>AI: POST /api/v1/ai/conceptual-model {prompt, current_model}
  AI->>MR: generate_model_update(current_model, prompt, agent_type)
  MR->>AR: run the agent
  AR->>AOAI: responses.create(model, instructions, input)
  AOAI-->>AR: raw output (TOON-encoded nodes/edges + summary)
  AR-->>AI: parsed { nodes, edges } + summary
  AI-->>FE: ModelEditorResponse (merged into the canvas)
```

- Prompt templates live in `server/instructions/*.yaml` (`dm_cm_instruction.yaml` for conceptual modeling, `dm_lm_instruction.yaml` for logical).
- The runner talks to Azure OpenAI using credentials supplied **via environment variables** (`AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`). No keys are stored in source.
- `AgentRunner.py` in `server/` is a standalone prototype; the AI subsystem is functional in intent but is one of the less mature areas of the codebase (see [Project status](#project-status)).

---

## API reference (summary)

Base URL: `http://localhost:8000/api/v1` — full interactive docs at `http://localhost:8000/docs`.

| Method | Path | Description |
|---|---|---|
| POST | `/auth/signup` | Create a user |
| POST | `/auth/login` | Authenticate, receive JWT |
| GET | `/regions/` | List regions (public) |
| GET | `/users/` | List users (optional `?role=`) |
| PATCH | `/users/{id}/role` | Change a user's role (superadmin) |
| GET/POST | `/workflows/` | List / create workflows |
| GET/PUT/DELETE | `/workflows/{id}` | Read / replace / delete a workflow |
| PATCH | `/workflows/{id}/transfer-owner` | Transfer ownership (superadmin) |
| POST/GET | `/workflows/{id}/stages` | Stage management |
| POST | `/workflows/stages/{id}/assignments` | Sync stage assignees |
| GET/POST | `/data-models/` | List (optional `?workflow_id=`) / create |
| GET/PUT/DELETE | `/data-models/{id}` | Read / update / delete a model |
| GET/POST | `/agents/` | List / create AI agents |
| POST | `/ai/model-editor` | Edit a diagram with a chosen agent |
| POST | `/ai/conceptual-model` | Edit a diagram with the default conceptual agent |

---

## Configuration & environment variables

Nothing sensitive is committed. Each service reads secrets from a local `.env` (ignored by git). Copy the provided `.env.example` files and fill in real values.

**Backend (`server/.env`):**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Async PostgreSQL URL (`postgresql+asyncpg://user:pass@host:5432/assetflow`) |
| `SECRET_KEY` | JWT signing secret (use a long random string) |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI resource endpoint |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key |
| `AZURE_OPENAI_DEPLOYMENT` | Model deployment name (default `gpt-4.1`) |
| `SPEECH_KEY` / `SPEECH_ENDPOINT` | Azure Cognitive Speech (optional dictation) |
| `SHARED_ADMIN_PASSWORD` | Password used by the admin seed script |

**Frontend (`client/.env.local`):**

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL (default `http://localhost:8000`) |

See [SETUP.md](./SETUP.md) for exact steps.

---

## Security notes

- **Secrets** are supplied only via environment variables; `.env` files and key/cert files are git-ignored.
- **Passwords** are hashed with bcrypt (via passlib). Plaintext passwords are never stored.
- **JWT** is used for stateless auth; the default access-token lifetime is long (30 days) and should be shortened for production.
- **CORS** is currently permissive (`allow_origins=["*"]`) for local development — restrict it before deploying.
- There is currently **no rate limiting**; add it before exposing the API publicly.

---

## Project status

**Solid / implemented:**
- JWT auth, role checks, and region gating.
- Workflow CRUD with the full nested stage/substage/assignment hierarchy.
- Data-model lifecycle persistence (conceptual/logical/physical).
- Frontend autosave, polling, and conflict notices.

**In progress / partial:**
- The AI model-editor is functional in intent but is the least mature module; the standalone `AgentRunner.py` prototype does not yet fully match the richer orchestration the router assumes.
- Some UI sections (advanced workflow config, cloud provisioning) are placeholders.
- `server2/` and `frontend_v1/` are alternative rewrites and are not part of the running app.

For installation and how to run everything locally, continue to [**SETUP.md**](./SETUP.md).
