import json
from importlib import import_module
from pathlib import Path

from fastapi import FastAPI

from app.core.ui_schemas import ModuleConfig


MODULES_DIR = Path(__file__).resolve().parents[1] / "modules"


def discover_modules(modules_dir: Path = MODULES_DIR) -> list[ModuleConfig]:
    modules: list[ModuleConfig] = []
    for config_path in sorted(modules_dir.glob("*/module.config.json")):
        with config_path.open("r", encoding="utf-8") as config_file:
            modules.append(ModuleConfig(**json.load(config_file)))
    return sorted(modules, key=lambda module: module.nav_position)


def include_module_routers(app: FastAPI) -> list[ModuleConfig]:
    modules = discover_modules()
    for module in modules:
        if not module.enabled:
            continue

        module_path, router_name = module.backend_router.rsplit(".", 1)
        router_module = import_module(module_path)
        router = getattr(router_module, router_name)
        app.include_router(router, prefix=f"/api/{module.id}", tags=[module.title])

    return modules
