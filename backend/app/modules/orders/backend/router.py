from fastapi import APIRouter

router = APIRouter()


@router.get("/summary")
def summary() -> dict[str, object]:
    return {
        "module": "orders",
        "status_flow": ["draft", "mailbox_ready", "ticket_ready", "delivered", "archived"],
        "next_steps": [
            "Persist real orders",
            "Add mailbox generation",
            "Generate customer handover text",
        ],
    }
