from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId

from app.core.database import (
    users_col, login_history_col, user_settings_col,
    sessions_col, messages_col,
)
from app.core.auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserSettingsUpdate(BaseModel):
    custom_instructions: Optional[str] = None
    email_notifications: Optional[bool] = None
    display_name: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/signup")
def signup(body: SignupRequest):
    email = body.email.strip().lower()
    password = body.password.strip()

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    if users_col.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = {
        "email": email,
        "password_hash": hash_password(password),
        "created_at": datetime.utcnow(),
        "plan": "free",
    }
    result = users_col.insert_one(user)
    user_id = str(result.inserted_id)

    login_history_col.insert_one({
        "user_id": user_id,
        "email": email,
        "action": "signup",
        "timestamp": datetime.utcnow(),
    })

    # Initialize default settings
    user_settings_col.insert_one({
        "user_id": user_id,
        "custom_instructions": "",
        "email_notifications": True,
        "display_name": "",
        "updated_at": datetime.utcnow(),
    })

    token = create_token(user_id, email)

    return {
        "token": token,
        "user_id": user_id,
        "email": email,
    }


@router.post("/login")
def login(body: LoginRequest):
    email = body.email.strip().lower()
    password = body.password.strip()

    user = users_col.find_one({"email": email})
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])

    login_history_col.insert_one({
        "user_id": user_id,
        "email": email,
        "action": "login",
        "timestamp": datetime.utcnow(),
    })

    token = create_token(user_id, email)

    return {
        "token": token,
        "user_id": user_id,
        "email": email,
    }


@router.get("/me")
def get_me(user_id: str = Query(...)):
    """Return user profile with stats."""
    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    session_count = sessions_col.count_documents({"user_id": user_id})
    message_count = messages_col.count_documents({
        "session_id": {"$in": [
            s["_id"] for s in sessions_col.find({"user_id": user_id}, {"_id": 1})
        ]}
    })

    return {
        "email": user["email"],
        "plan": user.get("plan", "free"),
        "created_at": user["created_at"].isoformat(),
        "session_count": session_count,
        "message_count": message_count,
    }


@router.get("/login-history")
def get_login_history(user_id: str = Query(...), limit: int = Query(20)):
    """Return recent login history for a user."""
    cursor = login_history_col.find(
        {"user_id": user_id},
        {"_id": 0, "action": 1, "timestamp": 1, "email": 1},
    ).sort("timestamp", -1).limit(limit)

    history = []
    for doc in cursor:
        doc["timestamp"] = doc["timestamp"].isoformat()
        history.append(doc)

    return history


@router.get("/settings")
def get_settings(user_id: str = Query(...)):
    """Get user settings."""
    settings = user_settings_col.find_one(
        {"user_id": user_id},
        {"_id": 0, "user_id": 0},
    )
    if not settings:
        return {
            "custom_instructions": "",
            "email_notifications": True,
            "display_name": "",
        }
    settings.pop("updated_at", None)
    return settings


@router.patch("/settings")
def update_settings(user_id: str = Query(...), body: UserSettingsUpdate = ...):
    """Update user settings."""
    update = {"updated_at": datetime.utcnow()}

    if body.custom_instructions is not None:
        update["custom_instructions"] = body.custom_instructions
    if body.email_notifications is not None:
        update["email_notifications"] = body.email_notifications
    if body.display_name is not None:
        update["display_name"] = body.display_name

    user_settings_col.update_one(
        {"user_id": user_id},
        {"$set": update},
        upsert=True,
    )

    return {"status": "ok"}


@router.post("/change-password")
def change_password(user_id: str = Query(...), body: PasswordChangeRequest = ...):
    """Change user password."""
    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(body.current_password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password_hash": hash_password(body.new_password)}},
    )

    return {"status": "ok"}
