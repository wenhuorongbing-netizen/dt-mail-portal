import importlib
import json
from pathlib import Path
from typing import Iterable

from fastapi import FastAPI

from app.core.ui_schemas import ModuleConfig


MODULES_PATH = Path(__file__).resolve().parents[1] / "modules"


def discover_module_configs(modules_path: Path = MODULES_PATH) -> list[ModuleConfig]:
    """Scan app/modules/*/module.config.json and return enabled configs.

    This is the backend half of the addon system. A module becomes visible to the
    platform when it places a valid module.config.json file inside its module
    folder. The core does not need to know the module's business logic.
    """
    configs: list[ModuleConfig] = []
    if not modules_path.exists():
        return configs

    for config_path in sorted(modules_path.glob("*/module.config.json")):
        raw = json.loads(config_path.read_text(encoding="utf-8"))
        config = ModuleConfig(**raw)
        if config.enabled:
            configs.append(config)

    return sorted(configs, key=lambda cfg: cfg.nav_position)


def import_from_string(path: str):
    """Import an attribute using 'python.module.path:attribute' notation."""
    if ":" not in path:
        raise ValueError(f"Invalid import path: {path}. Expected 'module.path:attribute'.")
    module_path, attribute = path.split(":", 1)
    module = importlib.import_module(module_path)
    return getattr(module, attribute)


def register_module_routers(app: FastAPI, configs: Iterable[ModuleConfig]) -> None:
    """Register each module's FastAPI router under /api/<module_id>."""
    for config in configs:
        if not config.backend_router:
            continue
        router = import_from_string(config.backend_router)
        app.include_router(router, prefix=f"/api/{config.id}", tags=[config.title])
