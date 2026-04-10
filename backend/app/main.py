from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .auth import auth_router
from .user import user_router
from .calculator import cal_router
from .health import health_router
from db.config.database import engine, Base

# Create database tables

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Calculator API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, tags=["health"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(cal_router, prefix="/api/v1", tags=["calculator"])
app.include_router(user_router, prefix="/api/v1/user", tags=["user"])
