from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Jipange AI Backend",
    description="AI-powered productivity platform backend",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Import routers
from routers import ai, integrations, tasks, calendar

app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["Integrations"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["Calendar"])

@app.get("/")
async def root():
    return {"message": "Jipange AI Backend is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "jipange-backend"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
