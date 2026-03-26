from datetime import datetime
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, HTTPException

from app.core.database import users_col, login_history_col
from app.core.auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/signup")
def signup(body: SignupRequest):
    email = body.email.strip().lower()
    password = body.password.strip()

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Check if user already exists
    if users_col.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    # Create user
    user = {
        "email": email,
        "password_hash": hash_password(password),
        "created_at": datetime.utcnow(),
        "plan": "free",
    }
    result = users_col.insert_one(user)
    user_id = str(result.inserted_id)

    # Log signup
    login_history_col.insert_one({
        "user_id": user_id,
        "email": email,
        "action": "signup",
        "timestamp": datetime.utcnow(),
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

    # Log login
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
def get_me():
    """Public endpoint — actual auth check done via frontend token."""
    # This would use get_current_user dependency in production
    return {"status": "ok"}
