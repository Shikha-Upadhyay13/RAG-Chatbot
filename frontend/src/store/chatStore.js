import { create } from "zustand";
import {
  createSession,
  fetchSessions,
  fetchDocuments,
  updateSessionTitle,
  deleteSession as apiDeleteSession,
} from "../services/chatApi";

// Promise lock to prevent duplicate session creation
let _sessionCreatePromise = null;

export const useChatStore = create((set, get) => ({
  /* =================================================
     AUTH STATE
     ================================================= */
  isAuthenticated: !!localStorage.getItem("echo_auth_email"),
  userEmail: localStorage.getItem("echo_auth_email") || null,

  login: (email) => {
    localStorage.setItem("echo_auth_email", email);
    set({ isAuthenticated: true, userEmail: email });
  },

  logout: () => {
    localStorage.removeItem("echo_auth_email");
    set({ isAuthenticated: false, userEmail: null });
  },

  /* =================================================
     UI STATE
     ================================================= */
  sidebarOpen: true,
  hoveredSessionId: null,
  settingsOpen: false,

  toggleSidebar: () =>
    set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setHoveredSession: (id) =>
    set({ hoveredSessionId: id }),

  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  /* =================================================
     APPEARANCE / THEME
     ================================================= */
  theme: localStorage.getItem("echo_theme") || "dark",
  accentColor: localStorage.getItem("echo_accent") || "#2dd4bf",

  setTheme: (theme) => {
    localStorage.setItem("echo_theme", theme);
    set({ theme });
  },

  setAccentColor: (color) => {
    localStorage.setItem("echo_accent", color);
    set({ accentColor: color });
  },

  /* =================================================
     MODES
     ================================================= */
  compareMode: false,
  hitlMode: false,

  setCompareMode: (v) => set({ compareMode: v }),
  setHitlMode: (v) => set({ hitlMode: v }),

  /* =================================================
     DOCUMENT STATE
     ================================================= */
  documents: [],
  selectedDocuments: [],
  lastActiveDocument: null,

  setLastActiveDocument: (docId) =>
    set({ lastActiveDocument: docId }),

  registerDocument: (docId) =>
    set((state) => ({
      documents: state.documents.includes(docId)
        ? state.documents
        : [...state.documents, docId].sort(),
    })),

  toggleDocumentSelection: (docId) =>
    set((state) => ({
      selectedDocuments: state.selectedDocuments.includes(docId)
        ? state.selectedDocuments.filter((d) => d !== docId)
        : [...state.selectedDocuments, docId],
    })),

  clearSelectedDocuments: () =>
    set({ selectedDocuments: [] }),

  loadDocuments: async () => {
    const res = await fetchDocuments();
    set({ documents: res?.documents || [] });
  },

  /* =================================================
     CHAT / SESSION STATE
     ================================================= */
  sessions: [],
  currentSessionId: null,
  messages: [],
  loading: false,
  error: null,

  /* Prevents ChatHistoryItem crash */
  sessionSummaries: {},

  setSessionSummary: (id, summary) =>
    set((state) => ({
      sessionSummaries: {
        ...state.sessionSummaries,
        [id]: summary,
      },
    })),

  /* =================================================
     SESSION MANAGEMENT
     ================================================= */
  loadSessions: async () => {
    const sessions = await fetchSessions();
    set({ sessions });

    // Load documents alongside sessions (safe, async)
    const docs = await fetchDocuments();
    set({ documents: docs?.documents || [] });
  },

  startNewSession: async () => {
    // If a session creation is already in-flight, return that same promise
    if (_sessionCreatePromise) {
      return _sessionCreatePromise;
    }

    _sessionCreatePromise = (async () => {
      try {
        const session = await createSession();

        set((state) => ({
          sessions: [session, ...state.sessions],
          currentSessionId: session.id,
          messages: [],
          loading: false,
          error: null,
        }));

        return session.id;
      } finally {
        _sessionCreatePromise = null;
      }
    })();

    return _sessionCreatePromise;
  },

  loadSession: async (sessionId) => {
    set({
      currentSessionId: sessionId,
      messages: [],
      loading: false,
      error: null,
    });
  },

  renameSession: async (sessionId, newTitle) => {
    try {
      await updateSessionTitle(sessionId, newTitle);
    } catch (e) {
      console.warn("Failed to rename session:", e);
    }
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, title: newTitle } : s
      ),
    }));
  },

  togglePinSession: (sessionId) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, pinned: !s.pinned } : s
      ),
    }));
  },

  toggleArchiveSession: (sessionId) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, archived: !s.archived } : s
      ),
    }));
  },

  deleteSession: async (sessionId) => {
    try {
      await apiDeleteSession(sessionId);
    } catch (e) {
      console.warn("Failed to delete session:", e);
    }

    set((state) => {
      const sessions = state.sessions.filter((s) => s.id !== sessionId);
      const isCurrent = state.currentSessionId === sessionId;
      return {
        sessions,
        ...(isCurrent
          ? { currentSessionId: null, messages: [] }
          : {}),
      };
    });
  },

  /* =================================================
     MESSAGE FLOW
     ================================================= */
  sendUserMessage: async (input) => {
    const payload =
      typeof input === "string"
        ? { question: input }
        : input;

    if (!payload?.question?.trim()) return;

    // Prevent sending while already loading
    if (get().loading) return;

    const isFirstMessage = get().messages.length === 0;
    let sessionId = get().currentSessionId;

    // If no session exists, create one on-the-fly (only from first message)
    if (!sessionId) {
      sessionId = await get().startNewSession();
    }

    const timestamp = new Date().toISOString();

    const userMsg = {
      role: "user",
      content: payload.question,
      timestamp,
    };

    const assistantMsg = {
      role: "assistant",
      content: "…",
      citations: [],
      meta: payload,
      timestamp,
    };

    set((state) => ({
      messages: [...state.messages, userMsg, assistantMsg],
      loading: true,
      error: null,
    }));

    // Auto-generate title from first user message
    if (isFirstMessage && sessionId) {
      const raw = payload.question.trim();
      const title =
        raw.length <= 50
          ? raw
          : raw.slice(0, 47).replace(/\s+\S*$/, "") + "...";

      // Update title in sidebar immediately (optimistic)
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, title } : s
        ),
      }));

      // Persist to backend (fire-and-forget)
      updateSessionTitle(sessionId, title).catch((e) =>
        console.warn("Failed to persist session title:", e)
      );
    }
  },

  updateLastAssistant: (updater) =>
    set((state) => {
      const msgs = [...state.messages];
      if (!msgs.length) return {};
      updater(msgs[msgs.length - 1]);
      return { messages: msgs };
    }),

  stopLoading: () => set({ loading: false }),

  setError: (err) =>
    set({ error: err, loading: false }),
}));
