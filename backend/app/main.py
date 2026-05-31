from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import Base, engine
from app.core.modules_loader import discover_module_configs, register_module_routers

# Import module models so SQLAlchemy can create tables during local development.
# In production, replace create_all with Alembic migrations.
from app.modules.example.backend import models as example_models  # noqa: F401
from app.modules.orders.backend import models as orders_models  # noqa: F401

settings = get_settings()
module_configs = discover_module_configs()

app = FastAPI(title="D-Ticket Mail Portal API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    # Development convenience. Use Alembic migrations before production.
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "env": settings.app_env}


@app.get("/api/modules")
def list_modules() -> list[dict]:
    return [config.public_dict() for config in module_configs]


register_module_routers(app, module_configs)
