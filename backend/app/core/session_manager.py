from uuid import uuid4
from datetime import datetime
from typing import Dict, List, Optional, Literal, Any

from app.core.database import sessions_col, messages_col
from app.memory.session_memory import SessionMemory
from app.memory.summary_memory import (
    load_summary,
    update_summary,
    should_update_summary,
)

Role = Literal["system", "user", "assistant"]


class SessionManager:
    """
    MongoDB-backed Session Manager.
    Sessions and messages are persisted to MongoDB.
    In-memory SessionMemory is used as a cache for the current request.
    """

    def __init__(self):
        self.allowed_roles = {"system", "user", "assistant"}
        # In-memory cache for active session memories (for agent pipeline)
        self._memory_cache: Dict[str, SessionMemory] = {}

    # ==================================================
    # SESSION LIFECYCLE
    # ==================================================

    def create_session(self, user_id: str = None) -> Dict:
        session_id = str(uuid4())
        now = datetime.utcnow()

        session = {
            "id": session_id,
            "title": "New Chat",
            "user_id": user_id,
            "created_at": now,
            "updated_at": now,
        }

        sessions_col.insert_one({**session, "_id": session_id})

        # Cache memory for this session
        self._memory_cache[session_id] = SessionMemory()

        return session

    def get_session(self, session_id: str) -> Optional[Dict]:
        doc = sessions_col.find_one({"_id": session_id})
        if not doc:
            return None
        doc["id"] = doc.pop("_id")
        return doc

    def update_title(self, session_id: str, title: str) -> Optional[Dict]:
        result = sessions_col.find_one_and_update(
            {"_id": session_id},
            {"$set": {"title": title, "updated_at": datetime.utcnow()}},
            return_document=True,
        )
        if not result:
            return None
        result["id"] = result.pop("_id")
        return result

    def delete_session(self, session_id: str) -> bool:
        result = sessions_col.delete_one({"_id": session_id})
        # Also delete all messages for this session
        messages_col.delete_many({"session_id": session_id})
        self._memory_cache.pop(session_id, None)
        return result.deleted_count > 0

    def list_sessions(self, user_id: str = None) -> List[Dict]:
        query = {"user_id": user_id} if user_id else {}
        cursor = sessions_col.find(
            query,
            {"_id": 1, "title": 1, "created_at": 1, "updated_at": 1},
        ).sort("updated_at", -1)

        sessions = []
        for doc in cursor:
            doc["id"] = doc.pop("_id")
            sessions.append(doc)
        return sessions

    # ==================================================
    # MESSAGE HANDLING
    # ==================================================

    def append_message(self, session_id: str, role: Role, content: str) -> None:
        if role not in self.allowed_roles:
            raise ValueError(f"Invalid role: {role}")

        if not content or not content.strip():
            return

        now = datetime.utcnow()

        # Save to MongoDB
        messages_col.insert_one({
            "session_id": session_id,
            "role": role,
            "content": content,
            "created_at": now,
        })

        # Update session timestamp
        sessions_col.update_one(
            {"_id": session_id},
            {"$set": {"updated_at": now}},
        )

        # Update in-memory cache
        memory = self._get_memory(session_id)
        memory.add_message(role, content)

    def get_recent_messages(self, session_id: str, limit: int = 10):
        # Try cache first
        if session_id in self._memory_cache:
            msgs = self._memory_cache[session_id].get_recent_messages(limit)
            if msgs:
                return msgs

        # Fall back to MongoDB
        cursor = messages_col.find(
            {"session_id": session_id},
            {"_id": 0, "role": 1, "content": 1},
        ).sort("created_at", -1).limit(limit)

        msgs = list(cursor)
        msgs.reverse()
        return msgs

    def get_session_messages(self, session_id: str) -> List[Dict]:
        """Get ALL messages for a session (for loading chat history)."""
        cursor = messages_col.find(
            {"session_id": session_id},
            {"_id": 0, "role": 1, "content": 1, "created_at": 1},
        ).sort("created_at", 1)

        return list(cursor)

    # ==================================================
    # DOCUMENT REFERENCES
    # ==================================================

    def add_active_document(self, session_id: str, document_id: str):
        memory = self._get_memory(session_id)
        memory.add_document(document_id)
        sessions_col.update_one(
            {"_id": session_id},
            {"$set": {"updated_at": datetime.utcnow()}},
        )

    def get_active_documents(self, session_id: str) -> List[str]:
        memory = self._get_memory(session_id)
        return memory.get_active_documents()

    # ==================================================
    # MEMORY AGENT HOOK
    # ==================================================

    def maybe_update_summary(
        self,
        session_id: str,
        user_query: str,
        assistant_answer: str,
    ):
        if not should_update_summary(user_query, assistant_answer):
            return

        prev = load_summary()
        update_summary(prev, user_query, assistant_answer)

    # ==================================================
    # OBSERVATIONS
    # ==================================================

    def add_observation(self, session_id: str, step: str, value: Any):
        memory = self._get_memory(session_id)
        memory.add_observation(step, value)
        sessions_col.update_one(
            {"_id": session_id},
            {"$set": {"updated_at": datetime.utcnow()}},
        )

    def get_observations(self, session_id: str):
        memory = self._get_memory(session_id)
        return memory.get_observations()

    # ==================================================
    # RESET
    # ==================================================

    def clear_session(self, session_id: str):
        messages_col.delete_many({"session_id": session_id})
        if session_id in self._memory_cache:
            self._memory_cache[session_id].clear()
        sessions_col.update_one(
            {"_id": session_id},
            {"$set": {"updated_at": datetime.utcnow()}},
        )

    # ==================================================
    # INTERNAL
    # ==================================================

    def _get_memory(self, session_id: str) -> SessionMemory:
        if session_id not in self._memory_cache:
            self._memory_cache[session_id] = SessionMemory()
        return self._memory_cache[session_id]


# ==================================================
# SINGLE GLOBAL INSTANCE
# ==================================================

session_manager = SessionManager()
