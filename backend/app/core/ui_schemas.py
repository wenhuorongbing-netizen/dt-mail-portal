from typing import Literal

from pydantic import BaseModel, Field


ModuleLayout = Literal["list", "calendar", "chat", "form", "custom"]


class ModuleConfig(BaseModel):
    id: str
    title: str
    route: str
    icon: str = "Boxes"
    layout: ModuleLayout = "list"
    nav_position: int = 100
    backend_router: str
    permissions: list[str] = Field(default_factory=list)
    description: str = ""
    enabled: bool = True
