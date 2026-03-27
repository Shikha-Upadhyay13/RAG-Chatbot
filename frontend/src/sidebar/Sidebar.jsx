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
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        background: isDark ? "#0a0a10" : "#f1f5f9",
        borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
      }}
    >
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.brandRow}>
          <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="10" fill="url(#sb-grad)" />
            <path d="M14 24h6l4-8 4 16 4-8h6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="sb-grad" x1="0" y1="0" x2="48" y2="48">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ ...styles.brand, color: isDark ? "#e5e7eb" : "#1e293b" }}>NEXUS</span>
        </div>
        <button
          onClick={toggleSidebar}
          style={{ ...styles.collapseBtn, color: isDark ? "#94a3b8" : "#64748b" }}
          title="Close sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 17l-5-5 5-5" />
            <path d="M18 17l-5-5 5-5" />
          </svg>
        </button>
      </div>

      {/* NEW CHAT */}
      <button
        style={{
          ...styles.newChat,
          background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
          color: isDark ? "#e5e7eb" : "#1e293b",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
        }}
        onClick={startNewSession}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Chat
      </button>

      {/* MODES */}
      <div style={styles.section}>
        <div style={{ ...styles.sectionTitle, color: isDark ? "#525a65" : "#94a3b8" }}>Modes</div>
        <Toggle label="Compare" value={compareMode} onChange={setCompareMode} accentColor={accentColor} isDark={isDark} />
        <Toggle label="HITL" value={hitlMode} onChange={setHitlMode} accentColor={accentColor} isDark={isDark} />
      </div>

      {/* COMPARE DOCUMENTS */}
      {compareMode && (
        <div style={styles.section}>
          <div style={{ ...styles.sectionTitle, color: isDark ? "#525a65" : "#94a3b8" }}>Documents</div>
          {!documents.length && (
            <div style={{ fontSize: 12, opacity: 0.5, color: isDark ? "#64748b" : "#94a3b8" }}>
              No documents uploaded yet
            </div>
          )}
          {documents.map((doc) => (
            <label key={doc.document_id} style={{ ...styles.docItem, color: isDark ? "#e5e7eb" : "#1e293b" }}>
              <input
                type="checkbox"
                checked={selectedDocuments.includes(doc.document_id)}
                onChange={() => toggleDocumentSelection(doc.document_id)}
              />
              {doc.document_id}
            </label>
          ))}
        </div>
      )}

      {/* CHAT HISTORY */}
      <div style={{ ...styles.section, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ ...styles.sectionTitle, color: isDark ? "#525a65" : "#94a3b8" }}>
          Conversations
        </div>

        <div style={{
          ...styles.searchWrap,
          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#525a65" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...styles.searchInput, color: isDark ? "#e5e7eb" : "#1e293b" }}
          />
        </div>

        <div style={styles.sessionList}>
          {filteredSessions.length === 0 && (
            <div style={{ fontSize: 12, opacity: 0.4, padding: "12px 4px", color: isDark ? "#64748b" : "#94a3b8" }}>
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

      {/* USER / LOGOUT */}
      <div style={{ ...styles.logoutSection, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}` }}>
        <div style={{ ...styles.userRow }}>
          <div style={{
            ...styles.userAvatar,
            background: `linear-gradient(135deg, ${accentColor}, #6366f1)`,
          }}>
            {(userEmail || "U")[0].toUpperCase()}
          </div>
          <div style={styles.userInfo}>
            <div style={{ fontSize: 13, fontWeight: 500, color: isDark ? "#e5e7eb" : "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userEmail ? userEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "User"}
            </div>
            <div style={{ fontSize: 11, color: isDark ? "#525a65" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userEmail}
            </div>
          </div>
        </div>
        <button
          style={{
            ...styles.logoutBtn,
            background: isDark ? "rgba(239, 68, 68, 0.06)" : "rgba(239, 68, 68, 0.05)",
            border: `1px solid ${isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.2)"}`,
          }}
          onClick={() => { logout(); navigate("/"); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
        </button>
      </div>
    </div>
  );
}

/* ---------------- TOGGLE ---------------- */
function Toggle({ label, value, onChange, accentColor, isDark }) {
  return (
    <div style={styles.toggleRow}>
      <span style={{ color: isDark ? "#c8cdd3" : "#475569" }}>{label}</span>
      <div
        style={{
          ...styles.toggle,
          background: value
            ? `linear-gradient(135deg, ${accentColor}, #6366f1)`
            : isDark ? "#1e2433" : "#cbd5e1",
        }}
        onClick={() => onChange(!value)}
      >
        <div
          style={{
            ...styles.knob,
            background: value ? "#fff" : (isDark ? "#525a65" : "#94a3b8"),
            transform: value ? "translateX(16px)" : "translateX(0)",
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
    width: 272,
    height: "100vh",
    padding: "16px 14px",
    display: "flex",
    flexDirection: "column",
    zIndex: 20,
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  brand: {
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: "1.5px",
  },

  collapseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },

  newChat: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "11px 14px",
    borderRadius: 10,
    cursor: "pointer",
    marginBottom: 20,
    fontWeight: 500,
    fontSize: 13,
    fontFamily: "var(--font-body, 'Inter', sans-serif)",
    transition: "background 0.15s",
  },

  section: {
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },

  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    fontSize: 13,
  },

  toggle: {
    width: 34,
    height: 18,
    borderRadius: 999,
    padding: 2,
    cursor: "pointer",
    transition: "background 0.2s",
    position: "relative",
  },

  knob: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    transition: "transform 0.2s, background 0.2s",
  },

  docItem: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontSize: 12,
    marginBottom: 6,
    marginLeft: 4,
  },

  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    borderRadius: 8,
    marginBottom: 8,
  },

  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    fontSize: 12,
    fontFamily: "var(--font-body, 'Inter', sans-serif)",
  },

  sessionList: {
    flex: 1,
    overflowY: "auto",
    scrollbarWidth: "thin",
  },

  logoutSection: {
    paddingTop: 14,
    marginTop: 8,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
  },

  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    padding: "8px 0",
    borderRadius: 8,
    color: "#f87171",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 500,
    fontFamily: "var(--font-body, 'Inter', sans-serif)",
    transition: "background 0.15s",
  },
};
