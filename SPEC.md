# NEXUS AI - RAG Chatbot: Full Project Overview

## Project Identity
- **Internal codename**: DRAG / echo_ai (database)
- **User-facing brand**: NEXUS AI - Intelligent Document Assistant
- **Deployed URL**: https://drag-eosin.vercel.app

---

## Tech Stack

### Backend (Python 3.11)
| Category | Technology |
|----------|-----------|
| Web Framework | FastAPI + Uvicorn |
| LLM Provider | Groq (llama-3.1-8b-instant) |
| Embeddings | Google Gemini (gemini-embedding-001, 768-dim) |
| Vector Store | FAISS (IndexFlatL2, per-document) |
| Keyword Retrieval | rank-bm25 (BM25Okapi) |
| Database | MongoDB (pymongo[srv]) |
| Auth | JWT (PyJWT, HS256, 72h expiry) + bcrypt |
| File Parsing | pypdf, python-docx, openpyxl |
| Config | python-dotenv |

### Frontend (JavaScript)
| Category | Technology |
|----------|-----------|
| Framework | React 19.2 |
| Routing | React Router DOM 7.13 |
| State | Zustand 5.0 |
| Build | Vite 7.2 |
| Styling | Inline CSS (no Tailwind/CSS modules) |

---

## Directory Structure

```
RAG-Chatbot-main/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app + router registration
│   │   ├── agents/
│   │   │   ├── chat_executor.py       # Core agentic RAG execution pipeline
│   │   │   └── planner_agent.py       # LLM-based action planning
│   │   ├── api/
│   │   │   ├── health.py              # GET /health
│   │   │   ├── ingest.py              # POST /ingest/file
│   │   │   ├── query_stream.py        # POST /rag/query/stream (SSE)
│   │   │   └── documents.py           # GET /documents
│   │   ├── core/
│   │   │   ├── auth.py                # JWT + bcrypt utilities
│   │   │   ├── config.py              # All config constants
│   │   │   ├── database.py            # MongoDB collections + indexes
│   │   │   ├── llms.py                # Unified LLM interface (Groq)
│   │   │   └── session_manager.py     # Session + message persistence
│   │   ├── llm/
│   │   │   └── groq.py                # Groq API wrapper
│   │   ├── memory/
│   │   │   ├── session_memory.py      # Per-session in-memory cache
│   │   │   └── summary_memory.py      # Conversation summary (JSON file)
│   │   ├── prompts/
│   │   │   ├── rag_prompt.txt
│   │   │   ├── rag_qa_prompt.txt
│   │   │   └── rag_summary_prompt.txt
│   │   ├── registry/
│   │   │   └── document_registry.py   # JSON-based doc metadata
│   │   ├── routes/
│   │   │   ├── auth.py                # /auth/* endpoints
│   │   │   ├── chat.py                # /chat/message (non-streaming)
│   │   │   ├── chat_stream.py         # /chat/stream (SSE)
│   │   │   └── sessions.py            # /sessions/* CRUD
│   │   ├── schemas/
│   │   │   ├── hitl.py                # Human-in-the-loop models
│   │   │   ├── rag.py                 # QueryRequest/Response
│   │   │   └── session.py             # ChatRequest, SessionCreate, etc.
│   │   ├── services/
│   │   │   ├── chunker.py             # 500-char chunks, 100 overlap
│   │   │   ├── embeddings.py          # Gemini embedding (768-dim)
│   │   │   ├── file_loader.py         # PDF, DOCX, DOC, XLSX, XLS
│   │   │   ├── generator.py           # Answer generation + citations
│   │   │   ├── reranker.py            # Context reranking
│   │   │   └── retriever.py           # Hybrid semantic + BM25
│   │   ├── tools/
│   │   │   └── tool_registry.py       # Extensible tool actions
│   │   ├── utils/
│   │   │   └── context_trimmer.py     # Max 6000 char context
│   │   └── vectorstore/
│   │       ├── faiss_store.py         # FAISS IndexFlatL2 wrapper
│   │       └── store_manager.py       # Multi-doc store management
│   ├── vectorstores/                  # Persisted FAISS indexes
│   ├── requirements.txt
│   └── runtime.txt                    # Python 3.11
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx                   # React entry
│   │   ├── App.jsx                    # Routes: / → Login, /chat → AppLayout
│   │   ├── layout/
│   │   │   └── AppLayout.jsx          # Sidebar + TopBar + ChatArea + Settings
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx          # Signup/Login form
│   │   │   └── RagChat.jsx            # Chat page wrapper
│   │   ├── chat/
│   │   │   ├── ChatContainer.jsx      # Session orchestration + empty state
│   │   │   ├── MessageInput.jsx       # Text input + send
│   │   │   ├── MessageList.jsx        # Message rendering
│   │   │   └── MessageRow.jsx         # Single message component
│   │   ├── components/
│   │   │   ├── FileIngest.jsx         # File upload (PDF/DOCX/XLSX)
│   │   │   ├── Message.jsx            # Message with citations
│   │   │   ├── SourceCitations.jsx    # Citation display
│   │   │   ├── ProfileMenu.jsx        # Avatar dropdown
│   │   │   ├── SettingsPanel.jsx      # Full settings modal
│   │   │   ├── ChatBox.jsx            # Standalone RAG chat
│   │   │   ├── BackgroundGrid.jsx     # Login page animation
│   │   │   └── BlinkingCursor.jsx     # Typing indicator
│   │   ├── sidebar/
│   │   │   ├── Sidebar.jsx            # Chat history + docs + modes
│   │   │   └── ChatHistoryItem.jsx    # Session list item
│   │   ├── store/
│   │   │   └── chatStore.js           # Zustand: auth, sessions, messages, theme
│   │   ├── services/
│   │   │   └── chatApi.js             # All API calls
│   │   ├── hooks/
│   │   │   ├── useRagStream.js        # SSE streaming hook
│   │   │   └── useVoiceInput.js       # Web Speech API
│   │   └── config/
│   │       └── api.js                 # API_BASE config
│   ├── index.html
│   ├── vite.config.js                 # Dev proxy to backend:8000
│   └── package.json
│
├── commands/                          # CLI/skill commands
├── SPEC.md                            # This file
└── README.md
```

---

## All API Endpoints

| # | Method | Path | Purpose | Streaming |
|---|--------|------|---------|-----------|
| 1 | GET | `/health` | Health check | No |
| 2 | POST | `/ingest/file` | Upload & index document | No |
| 3 | GET | `/documents` | List uploaded documents | No |
| 4 | POST | `/rag/query/stream` | RAG query with sources | SSE |
| 5 | POST | `/auth/signup` | Register user | No |
| 6 | POST | `/auth/login` | Login user | No |
| 7 | GET | `/auth/me?user_id=` | Profile + stats | No |
| 8 | GET | `/auth/login-history?user_id=` | Login history | No |
| 9 | GET | `/auth/settings?user_id=` | User settings | No |
| 10 | PATCH | `/auth/settings?user_id=` | Update settings | No |
| 11 | POST | `/auth/change-password?user_id=` | Change password | No |
| 12 | POST | `/sessions/new?user_id=` | Create session | No |
| 13 | GET | `/sessions?user_id=` | List sessions | No |
| 14 | GET | `/sessions/{id}` | Get session | No |
| 15 | GET | `/sessions/{id}/messages` | Load chat history | No |
| 16 | PATCH | `/sessions/{id}/title` | Rename session | No |
| 17 | DELETE | `/sessions/{id}` | Delete session | No |
| 18 | POST | `/chat/stream` | Agentic chat | SSE |

---

## Features

### Authentication & Users
- Email/password signup & login
- JWT tokens (72h expiry, HS256)
- bcrypt password hashing
- Login history tracking (signup + login events)
- User settings persistence (custom instructions, display name)
- Password change with verification
- Plan field per user (free/pro)

### Document Ingestion
- **Supported formats**: PDF (page-aware), DOCX, DOC, XLSX/XLS (sheet-aware)
- Text extraction with page/sheet metadata
- Character-based chunking (500 chars, 100 overlap)
- Batch embedding via Google Gemini (768-dim, batches of 100)
- Per-document FAISS vector stores
- Document registry (JSON)

### RAG Pipeline
- **Hybrid retrieval**: Semantic (FAISS L2) + BM25 keyword scoring
- **Adaptive weighting**: Conceptual queries (40% semantic / 60% BM25) vs Factual (80% / 20%)
- **Reranking**: Post-retrieval context reranking
- **Context trimming**: Max 6000 chars to stay within LLM limits
- **Inline citations**: [S1], [S2] mapped to source documents
- **Multi-document**: Cross-document retrieval & comparison mode

### Agentic Architecture
- **Planner Agent**: LLM decides action sequence (chat, retrieve, rerank, generate, tool:*)
- **Chat Executor**: Orchestrates the full pipeline per request
- **Tool Registry**: Extensible (web_search, calculator placeholders)
- **Fallback**: Silent retry with default plan if planning fails

### Chat & Sessions
- Session creation with auto-title from first message
- Full message persistence to MongoDB (user + assistant)
- Session history loading when switching sessions
- Pin, archive, rename, delete sessions
- Real-time token streaming via SSE

### UI/UX
- Dark/Light theme toggle (localStorage-persisted)
- 10 preset accent colors + custom color picker
- Collapsible sidebar with session search
- Empty state with 4 suggestion chips
- Glassmorphism login page with animated orbs
- Profile dropdown with plan badge
- Voice input (Web Speech API)
- Blinking cursor typing indicator

### Settings Panel (Functional)
- **Personalization**: Custom instructions saved to MongoDB
- **Login History**: Real login/signup events from backend
- **Workspace**: Profile stats (sessions, messages, join date)
- **Subscription**: Current plan display
- **Security**: Change password
- **Profile Settings**: Display name + email
- **Appearance**: Theme + accent color

---

## Database Schema (MongoDB: `echo_ai`)

| Collection | Key Fields | Indexes |
|------------|-----------|---------|
| `users` | email, password_hash, created_at, plan | email (unique) |
| `sessions` | _id (uuid), user_id, title, created_at, updated_at | user_id, created_at |
| `messages` | session_id, role, content, created_at | session_id, created_at |
| `login_history` | user_id, email, action, timestamp | user_id |
| `user_settings` | user_id, custom_instructions, display_name, email_notifications | user_id (unique) |

### File System Storage
- `backend/vectorstores/{doc_name}/` — `index.faiss` + `meta.pkl` per document
- `backend/registry/documents.json` — Document metadata registry
- `backend/memory/summary.json` — Global conversation summary

---

## Environment Variables

```
# LLM
GROQ_API_KEY, GROQ_MODEL (default: llama-3.1-8b-instant)
GEMINI_API_KEY, EMBEDDING_MODEL_NAME (default: models/gemini-embedding-001)
LLM_TEMPERATURE (default: 0.2), LLM_MAX_TOKENS, LLM_TIMEOUT (default: 60)

# Database
MONGODB_URI (default: mongodb://localhost:27017)
MONGODB_DB_NAME (default: echo_ai)

# Auth
JWT_SECRET

# Storage
VECTORSTORE_BASE_DIR (default: ./vectorstores)

# Frontend
VITE_API_BASE_URL (production API URL, empty for dev proxy)
```

---

## Deployment
- **Frontend**: Vercel (static build from `frontend/dist/`)
- **Backend**: Any server running `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **Database**: MongoDB Atlas (cloud) or local MongoDB
- **Dev proxy**: Vite proxies `/auth`, `/sessions`, `/chat`, `/rag`, `/ingest`, `/documents`, `/health` to `localhost:8000`
