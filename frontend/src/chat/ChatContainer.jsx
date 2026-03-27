import { useChatStore } from "../store/chatStore";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

const SUGGESTIONS = [
  { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z", text: "Summarize a document" },
  { icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01", text: "Ask a question" },
  { icon: "M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z", text: "Compare documents" },
  { icon: "M13 10V3L4 14h7v7l9-11h-7z", text: "Deep dive analysis" },
];

export default function ChatContainer() {
  const messages = useChatStore((s) => s.messages);
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const theme = useChatStore((s) => s.theme);
  const sendUserMessage = useChatStore((s) => s.sendUserMessage);
  const hasMessages = messages.length > 0;
  const isDark = theme === "dark";

  return (
    <div style={{ ...styles.container, background: isDark ? "#0f0f14" : "#f8fafc" }}>
      <div style={styles.inner}>
        {!hasMessages && (
          <div style={styles.emptyState}>
            <div style={styles.emptyContent}>
              <div style={styles.greeting}>
                <h1 style={{ ...styles.title, color: isDark ? "#e7ebef" : "#1e293b" }}>
                  What can I help with?
                </h1>
                <p style={{ ...styles.subtitle, color: isDark ? "#525a65" : "#94a3b8" }}>
                  Upload documents, ask questions, or explore your data with AI.
                </p>
              </div>

              <MessageInput hasMessages={false} sidebarOpen={sidebarOpen} />

              <div style={styles.suggestions}>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendUserMessage({ question: s.text })}
                    style={{
                      ...styles.chip,
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
                      color: isDark ? "#9aa7b2" : "#64748b",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={s.icon} />
                    </svg>
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {hasMessages && (
          <>
            <div style={styles.messageArea}>
              <MessageList />
            </div>
            <div style={styles.inputDock}>
              <MessageInput hasMessages sidebarOpen={sidebarOpen} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100%",
    overflow: "hidden",
    position: "relative",
  },

  inner: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },

  messageArea: {
    flex: 1,
    overflowY: "auto",
    paddingBottom: 12,
  },

  inputDock: {
    flexShrink: 0,
  },

  emptyState: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 24px",
  },

  emptyContent: {
    width: "100%",
    maxWidth: 640,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 28,
  },

  greeting: {
    textAlign: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: 600,
    margin: 0,
    fontFamily: "var(--font-heading, 'Manrope', sans-serif)",
  },

  subtitle: {
    fontSize: 15,
    maxWidth: 420,
    lineHeight: 1.6,
    margin: "10px 0 0",
  },

  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    maxWidth: 520,
  },

  chip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 16px",
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "var(--font-body, 'Inter', sans-serif)",
    cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s",
    whiteSpace: "nowrap",
  },
};
