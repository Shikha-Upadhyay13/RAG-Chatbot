import { useChatStore } from "../store/chatStore";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

const SIDEBAR_WIDTH = 260;

export default function ChatContainer() {
  const messages = useChatStore((s) => s.messages);
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const theme = useChatStore((s) => s.theme);
  const hasMessages = messages.length > 0;
  const isDark = theme === "dark";

  return (
    <div style={{ ...styles.container, background: isDark ? "#141418" : "#f8fafc" }}>
      <div
        style={{
          ...styles.inner,
          width: "100%",
          padding: "0 24px",
        }}
      >
        {!hasMessages && (
          <div style={styles.emptyState}>
            <h1 style={{ ...styles.title, color: isDark ? "#e7ebef" : "#1e293b" }}>
              What can I help you figure out?
            </h1>
            <p style={{ ...styles.subtitle, color: isDark ? "#9ca3af" : "#64748b" }}>
              Ask anything — explanations, comparisons,
              or deep dives.
            </p>
            <MessageInput hasMessages={false} sidebarOpen={sidebarOpen} />
          </div>
        )}

        {hasMessages && (
          <>
            {/* MESSAGE LIST (SCROLLS) */}
            <div style={styles.messageArea}>
              <MessageList />
            </div>

            {/* INPUT DOCK */}
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
    height: "100vh",
    background: "#141418",
    overflow: "hidden",
    position: "relative",
  },

  inner: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    transition:
      "max-width 0.35s ease, margin-left 0.35s ease",
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
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    textAlign: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: 500,
    color: "#e7ebef",
  },

  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    maxWidth: 420,
    lineHeight: 1.6,
  },
};
