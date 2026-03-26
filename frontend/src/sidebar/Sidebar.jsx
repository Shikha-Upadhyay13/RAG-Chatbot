import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chatStore";
import ChatHistoryItem from "./ChatHistoryItem";



export default function Sidebar() {
  const {
    sessions,
    currentSessionId,
    loadSessions,
    startNewSession,
    loadSession,
    sidebarOpen,
    toggleSidebar,
    
    compareMode,
    hitlMode,
    setCompareMode,
    setHitlMode,

    documents,
    selectedDocuments,
    toggleDocumentSelection,
    loadDocuments,
    userEmail,
    logout,
    theme,
    accentColor,
  } = useChatStore();

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadSessions();
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only show the current session (even if untitled) + sessions that have a real title
  const visibleSessions = sessions.filter(
    (s) =>
      s.id === currentSessionId ||
      (s.title && s.title !== "New Chat")
  );

  const filteredSessions = searchQuery.trim()
    ? visibleSessions.filter((s) =>
        (s.title || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : visibleSessions;

  const isDark = theme === "dark";

  return (
    <div
      style={{
        ...styles.sidebar,
        transform: sidebarOpen
          ? "translateX(0)"
          : "translateX(-100%)",
        background: isDark ? "#000" : "#f1f5f9",
      }}
    >
      {/* HEADER */}
      <div style={styles.header}>
        <span style={{ ...styles.brand, color: isDark ? "#e5e7eb" : "#1e293b" }}>ECHO</span>
        <button
          onClick={toggleSidebar}
          style={{ ...styles.collapseBtn, color: isDark ? "#94a3b8" : "#64748b" }}
        >
          {sidebarOpen ? "⟨" : "⟩"}
        </button>
      </div>

      {/* NEW CHAT */}
      <button
        style={{ ...styles.newChat, background: `linear-gradient(135deg, ${accentColor}, #2979ff)` }}
        onClick={startNewSession}
      >
        + New Chat
      </button>

      {/* MODES */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Modes</div>

        <Toggle
          label="Compare"
          value={compareMode}
          onChange={setCompareMode}
        />

        <Toggle
          label="HITL"
          value={hitlMode}
          onChange={setHitlMode}
        />
      </div>

      {/* COMPARE DOCUMENTS */}
      {compareMode && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Documents</div>
      
          {!documents.length && (
            <div style={{ fontSize: 12, opacity: 0.5 }}>
              No documents uploaded yet
            </div>
          )}
      
          {documents.map((doc) => (
            <label key={doc.document_id} style={styles.docItem}>
              <input
                type="checkbox"
                checked={selectedDocuments.includes(doc.document_id)}
                onChange={() =>
                  toggleDocumentSelection(doc.document_id)
                }
              />
              {doc.document_id}
            </label>
          ))}
        </div>
      )}

      {/* CHAT HISTORY */}
      <div style={{ ...styles.section, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={styles.sectionTitle}>
          Chat History
        </div>

        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />

        <div style={styles.sessionList}>
          {filteredSessions.length === 0 && (
            <div style={{ fontSize: 12, opacity: 0.4, padding: "8px 4px" }}>
              {searchQuery ? "No matches found" : "No conversations yet"}
            </div>
          )}

          {filteredSessions.map((s) => (
            <ChatHistoryItem
              key={s.id}
              id={s.id}
              title={
                s.title && s.title !== "New Chat"
                  ? s.title
                  : "Untitled Conversation"
              }
              active={s.id === currentSessionId}
              onClick={() => loadSession(s.id)}
            />
          ))}
        </div>
      </div>

      {/* LOGOUT */}
      <div style={styles.logoutSection}>
        <div style={styles.userEmail}>{userEmail}</div>
        <button
          style={styles.logoutBtn}
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

/* ---------------- TOGGLE ---------------- */
function Toggle({ label, value, onChange }) {
  return (
    <div style={styles.toggleRow}>
      <span>{label}</span>

      <div
        style={{
          ...styles.toggle,
          background: value
            ? "linear-gradient(135deg, #00e5ff, #2979ff)"
            : "#334155",
        }}
        onClick={() => onChange(!value)}
      >
        <div
          style={{
            ...styles.knob,
            transform: value
              ? "translateX(18px)"
              : "translateX(0)",
          }}
        />
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  sidebar: {
    position: "fixed",
    left: 0,
    top: 0,
    width: 260,
    height: "100vh",
    background: "#000",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    zIndex: 20,
    transition: "transform 0.25s ease",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  brand: {
    color: "#e5e7eb",
    fontWeight: 600,
    fontSize: 14,
  },

  collapseBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
  },

  newChat: {
    padding: 10,
    borderRadius: 8,
    background:
      "linear-gradient(135deg, #00e5ff, #2979ff)",
    border: "none",
    cursor: "pointer",
    marginBottom: 12,
    fontWeight: 500,
  },

  section: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 6,
    textTransform: "uppercase",
  },

  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    color: "#e5e7eb",
    fontSize: 13,
  },

  toggle: {
    width: 36,
    height: 18,
    borderRadius: 999,
    padding: 2,
    cursor: "pointer",
    transition: "background 0.2s",
  },

  knob: {
    width: 14,
    height: 14,
    background: "#020617",
    borderRadius: "50%",
    transition: "transform 0.2s",
  },

  docItem: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontSize: 12,
    color: "#e5e7eb",
    marginBottom: 6,
    marginLeft: 4,
  },

  emptyDocs: {
    fontSize: 12,
    opacity: 0.5,
    marginLeft: 4,
  },
    docItem: {
    display: "flex",
    gap: 8,
    fontSize: 12,
    marginBottom: 6,
    color: "#e5e7eb",
  },

  searchInput: {
    width: "100%",
    padding: "8px 10px",
    marginBottom: 8,
    borderRadius: 6,
    border: "1px solid #1f2937",
    background: "#0a0f1a",
    color: "#e5e7eb",
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box",
  },

  sessionList: {
    flex: 1,
    overflowY: "auto",
    scrollbarWidth: "thin",
  },

  logoutSection: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: 12,
    marginTop: 8,
  },

  userEmail: {
    fontSize: 11,
    color: "#94a3b8",
    marginBottom: 8,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  logoutBtn: {
    width: "100%",
    padding: "8px 0",
    borderRadius: 8,
    border: "1px solid rgba(239, 68, 68, 0.3)",
    background: "rgba(239, 68, 68, 0.08)",
    color: "#fca5a5",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 500,
    transition: "background 0.2s",
  },
};
