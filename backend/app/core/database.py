import os
from pymongo import MongoClient

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "echo_ai")

client = MongoClient(MONGODB_URI)
db = client[MONGODB_DB_NAME]

# Collections
users_col = db["users"]
sessions_col = db["sessions"]
messages_col = db["messages"]
login_history_col = db["login_history"]

# Indexes (run once on import)
users_col.create_index("email", unique=True)
sessions_col.create_index("user_id")
sessions_col.create_index("created_at")
messages_col.create_index("session_id")
messages_col.create_index("created_at")
login_history_col.create_index("user_id")
