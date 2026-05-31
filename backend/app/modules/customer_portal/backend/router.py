from fastapi import APIRouter

router = APIRouter()


@router.get("/handover-template")
def handover_template() -> dict[str, object]:
    return {
        "title": "D-Ticket account handover",
        "sections": [
            "Mailbox login",
            "TicketPlus+ login guide",
            "Cancellation deadline",
            "Privacy and account use rules",
        ],
    }
