# AssetFlow — Setup Guide

This guide walks you through running AssetFlow locally: the **backend** (`server/`), the **frontend** (`client/`), the **PostgreSQL** database, and the required **environment variables**.

For an overview of what the project is and how it works, see [README.md](./README.md).

---

## 1. Prerequisites

Install these first:

| Tool | Version | Notes |
|---|---|---|
| Python | 3.11+ | Backend runtime |
| Node.js | 18+ (20+ recommended) | Frontend runtime (includes npm) |
| PostgreSQL | 14+ | Database |
| Git | any recent | Version control |

Optional (only for AI / dictation features):

- An **Azure OpenAI** resource with a `gpt-4.1` deployment.
- An **Azure Cognitive Speech** resource (only if you want microphone dictation).

> The canonical app is `server/` + `client/`. `server2/` and `frontend_v1/` are experimental rewrites and are **not** needed to run AssetFlow.

---

## 2. Get the code

```bash
git clone <your-repo-url> assetflow
cd assetflow
```

---

## 3. Database setup (PostgreSQL)

Create a database and a user. Using `psql`:

```sql
CREATE DATABASE assetflow;
CREATE USER assetflow_user WITH PASSWORD 'choose-a-strong-password';
GRANT ALL PRIVILEGES ON DATABASE assetflow TO assetflow_user;
```

Note the connection details — you'll put them in `DATABASE_URL` next. The backend uses the **async** driver, so the URL must start with `postgresql+asyncpg://`.

---

## 4. Backend setup (`server/`)

### 4.1 Create a virtual environment & install dependencies

**Windows (PowerShell):**

```powershell
cd server
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**macOS / Linux:**

```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4.2 Configure environment variables

Copy the example file and fill in real values:

```bash
cp .env.example .env          # Windows PowerShell: copy .env.example .env
```

Edit `server/.env`:

```env
DATABASE_URL=postgresql+asyncpg://assetflow_user:choose-a-strong-password@localhost:5432/assetflow
SECRET_KEY=<long-random-string>

# Optional — required only for the AI model editor
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/openai/v1/
AZURE_OPENAI_API_KEY=<your-azure-openai-key>
AZURE_OPENAI_DEPLOYMENT=gpt-4.1

# Optional — required only for microphone dictation
SPEECH_KEY=<your-azure-speech-key>
SPEECH_ENDPOINT=https://<your-region>.api.cognitive.microsoft.com/

# Optional — used by the admin seed script
SHARED_ADMIN_PASSWORD=<choose-a-strong-password>
```

Generate a strong `SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

> The `.env` file is git-ignored and must **never** be committed.

### 4.3 Apply database migrations

```bash
alembic upgrade head
```

This creates all tables from the migration history in `alembic/versions/`.

### 4.4 (Optional) Seed starter data

Create the default admin accounts and a region:

```bash
python seed_admin_users.py
```

This creates `superadmin@assetflow.com` and `admin@assetflow.com` using the `SHARED_ADMIN_PASSWORD` from your `.env` (falls back to `admin123` if unset — change it for anything beyond local testing).

### 4.5 Run the API

```bash
python -m app.main
```

- API root: `http://localhost:8000/`
- Interactive docs (Swagger UI): `http://localhost:8000/docs`

---

## 5. Frontend setup (`client/`)

Open a **second terminal** (leave the backend running).

### 5.1 Install dependencies

```bash
cd client
npm install
```

### 5.2 Configure the API URL

Create `client/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

(This is the default, so it's only strictly required if your backend runs elsewhere. The file is git-ignored.)

### 5.3 Run the dev server

```bash
npm run dev
```

Vite prints a local URL (typically `http://localhost:5173`). Open it in your browser.

To build for production:

```bash
npm run build
npm run preview   # serve the production build locally
```

---

## 6. Verify everything is connected

1. Open the frontend URL — the **Sign In** page should load the region list from `GET /api/v1/regions/`.
2. Sign in with a seeded account (e.g. `admin@assetflow.com`) and the matching region.
3. The workflow list loads from `GET /api/v1/workflows/`.
4. Open the modeling workspace — a data model is fetched or created.
5. Edit the canvas: autosave fires (`PUT /api/v1/data-models/{id}`) about 1.2s after you stop.
6. (If Azure OpenAI is configured) trigger an AI edit — it calls `/api/v1/ai/conceptual-model` and merges the result into the canvas.

---

## 7. Common commands

| Task | Command (from `server/`) |
|---|---|
| Activate venv (Windows) | `venv\Scripts\Activate.ps1` |
| Activate venv (macOS/Linux) | `source venv/bin/activate` |
| Run API | `python -m app.main` |
| Create a new migration | `alembic revision --autogenerate -m "message"` |
| Apply migrations | `alembic upgrade head` |
| Roll back one migration | `alembic downgrade -1` |

| Task | Command (from `client/`) |
|---|---|
| Install deps | `npm install` |
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Lint | `npm run lint` |

---

## 8. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `alembic upgrade head` fails to connect | Check `DATABASE_URL`, that PostgreSQL is running, and the DB/user exist. |
| `InvalidRequestError` about the driver | Ensure `DATABASE_URL` starts with `postgresql+asyncpg://`. |
| Login fails with region mismatch | The selected region must match the user's `region_id`. Reseed or pick the right region. |
| Frontend can't reach API / CORS errors | Confirm the backend is on `http://localhost:8000` and `VITE_API_BASE_URL` matches. |
| AI edit returns a 500 | Set `AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_API_KEY` / `AZURE_OPENAI_DEPLOYMENT` in `server/.env`. |
| `bcrypt` / hashing errors on install | The pinned `bcrypt<4.0.0` is required by the current passlib; reinstall from `requirements.txt`. |

---

## 9. Security reminders

- Never commit `.env` files or API keys — they are git-ignored by design.
- Use a strong, unique `SECRET_KEY` and database password.
- Restrict CORS and shorten the JWT lifetime before deploying to production.
- If any credential was ever committed or shared, **rotate it** at the provider.
