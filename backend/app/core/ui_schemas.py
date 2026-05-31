from typing import Literal
from pydantic import BaseModel, Field

ModuleLayout = Literal["list", "calendar", "chat", "form", "custom"]


class ModuleConfig(BaseModel):
    """Public module metadata shared with the frontend."""

    id: str
    title: str
    route: str
    icon: str = "box"
    layout: ModuleLayout = "list"
    nav_position: int = 100
    backend_router: str | None = None
    description: str | None = None
    enabled: bool = True
    permissions: list[str] = Field(default_factory=list)

    def public_dict(self) -> dict:
        data = self.model_dump()
        # Do not expose Python import paths to browser clients.
        data.pop("backend_router", None)
        return data
