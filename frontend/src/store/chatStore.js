import { create } from "zustand";
import {
  createSession,
  fetchSessions,
  fetchDocuments,
  fetchSessionMessages,
  updateSessionTitle,
  deleteSession as apiDeleteSession,
  apiSignup,
  apiLogin,
} from "../services/chatApi";

// Promise lock to prevent duplicate session creation
let _sessionCreatePromise = null;

export const useChatStore = create((set, get) => ({
  /* =================================================
     AUTH STATE (now backed by MongoDB)
     ================================================= */
  isAuthenticated: !!localStorage.getItem("echo_token"),
  userEmail: localStorage.getItem("echo_auth_email") || null,
  userId: localStorage.getItem("echo_user_id") || null,
  authToken: localStorage.getItem("echo_token") || null,

  login: async (email, password) => {
    const data = await apiLogin(email, password);
    localStorage.setItem("echo_token", data.token);
    localStorage.setItem("echo_auth_email", data.email);
    localStorage.setItem("echo_user_id", data.user_id);
    set({
      isAuthenticated: true,
      userEmail: data.email,
      userId: data.user_id,
      authToken: data.token,
    });
  },

  signup: async (email, password) => {
    const data = await apiSignup(email, password);
    localStorage.setItem("echo_token", data.token);
    localStorage.setItem("echo_auth_email", data.email);
    localStorage.setItem("echo_user_id", data.user_id);
    set({
      isAuthenticated: true,
      userEmail: data.email,
      userId: data.user_id,
      authToken: data.token,
    });
  },

  logout: () => {
    localStorage.removeItem("echo_token");
    localStorage.removeItem("echo_auth_email");
    localStorage.removeItem("echo_user_id");
    set({
      isAuthenticated: false,
      userEmail: null,
      userId: null,
      authToken: null,
      sessions: [],
      currentSessionId: null,
      messages: [],
    });
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
    try {
      const sessions = await fetchSessions();
      set({ sessions });

      const docs = await fetchDocuments();
      set({ documents: docs?.documents || [] });
    } catch (e) {
      console.warn("Failed to load sessions:", e);
    }
  },

  startNewSession: async () => {
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
      loading: true,
      error: null,
    });

    // Load messages from MongoDB
    try {
      const msgs = await fetchSessionMessages(sessionId);
      const formatted = msgs.map((m) => ({
        role: m.role === "assistant" || m.role === "agent" ? "assistant" : m.role,
        content: m.content,
        timestamp: m.timestamp,
        citations: [],
      }));
      set({ messages: formatted, loading: false });
    } catch (e) {
      console.warn("Failed to load messages:", e);
      set({ messages: [], loading: false });
    }
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

      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, title } : s
        ),
      }));

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
