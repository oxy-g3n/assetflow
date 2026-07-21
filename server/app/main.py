from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import ai, auth, data_models, regions, workflows, users, agents
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    openapi_url="/api/v1/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(regions.router, prefix="/api/v1/regions", tags=["regions"])
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(workflows.router, prefix="/api/v1", tags=["workflows"])
app.include_router(data_models.router, prefix="/api/v1", tags=["data-models"])
app.include_router(agents.router, prefix="/api/v1", tags=["agents"])
app.include_router(ai.router, prefix="/api/v1", tags=["ai"])

@app.get("/")
async def root():
    return {"message": "Welcome to AssetFlow API", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
