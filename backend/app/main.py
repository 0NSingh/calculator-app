from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .auth import auth_router
from .user import user_router
from .calculator import cal_router
from .health import health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    from db.config.database import engine, Base
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Calculator API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, tags=["health"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(cal_router, prefix="/api/v1", tags=["calculator"])
app.include_router(user_router, prefix="/api/v1/user", tags=["user"])
