from fastapi import APIRouter, HTTPException, Query
from app.core.session_manager import session_manager
from app.schemas.session import (
    SessionCreateResponse,
    SessionSummary,
    SessionTitleUpdate,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/new", response_model=SessionCreateResponse)
def create_session(user_id: str = Query(None)):
    session = session_manager.create_session(user_id=user_id)
    return {
        "id": session["id"],
        "title": session["title"],
        "created_at": session["created_at"],
    }


@router.get("", response_model=list[SessionSummary])
def list_sessions(user_id: str = Query(None)):
    return session_manager.list_sessions(user_id=user_id)


@router.patch("/{session_id}/title")
def update_session_title(session_id: str, body: SessionTitleUpdate):
    session = session_manager.update_title(session_id, body.title)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"id": session["id"], "title": session["title"]}


@router.delete("/{session_id}")
def delete_session(session_id: str):
    deleted = session_manager.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"ok": True}


@router.get("/{session_id}")
def get_session(session_id: str):
    session = session_manager.get_session(session_id)

    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    return session


@router.get("/{session_id}/messages")
def get_session_messages(session_id: str):
    """Get all messages for a session (for loading chat history)."""
    session = session_manager.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = session_manager.get_session_messages(session_id)

    # Convert datetime to ISO string for JSON serialization
    for msg in messages:
        if "created_at" in msg:
            msg["timestamp"] = msg.pop("created_at").isoformat()

    return messages
