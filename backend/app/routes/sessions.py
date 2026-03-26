from fastapi import APIRouter, HTTPException
from app.core.session_manager import session_manager
from app.schemas.session import (
    SessionCreateResponse,
    SessionSummary,
    SessionTitleUpdate,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/new", response_model=SessionCreateResponse)
def create_session():
    session = session_manager.create_session()
    return {
        "id": session["id"],
        "title": session["title"],
        "created_at": session["created_at"],
    }


@router.get("", response_model=list[SessionSummary])
def list_sessions():
    return session_manager.list_sessions()


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