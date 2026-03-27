import { memo, useEffect } from "react";
import Sidebar from "../sidebar/Sidebar";
import ChatContainer from "../chat/ChatContainer";
import ProfileMenu from "../components/ProfileMenu";
import SettingsPanel from "../components/SettingsPanel";
import { useChatStore } from "../store/chatStore";

const MemoChatContainer = memo(ChatContainer);

export default function AppLayout() {
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const toggleSidebar = useChatStore((s) => s.toggleSidebar);
  const theme = useChatStore((s) => s.theme);
  const accentColor = useChatStore((s) => s.accentColor);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === "dark";

    root.style.setProperty("--accent-main", accentColor);
    root.style.setProperty("--accent-soft", accentColor + "cc");
    root.style.setProperty("--accent-glow", accentColor + "40");

    root.style.setProperty("--bg-main", isDark ? "#0b0f14" : "#f8fafc");
    root.style.setProperty("--bg-panel", isDark ? "#0f141b" : "#ffffff");
    root.style.setProperty("--bg-panel-soft", isDark ? "#121922" : "#f1f5f9");
    root.style.setProperty("--bg-depth-1", isDark ? "#070a0f" : "#ffffff");
    root.style.setProperty("--bg-depth-2", isDark ? "#0d1219" : "#f8fafc");
    root.style.setProperty("--text-primary", isDark ? "#e7ebef" : "#1e293b");
    root.style.setProperty("--text-secondary", isDark ? "#9aa7b2" : "#64748b");
    root.style.setProperty("--text-muted", isDark ? "#6b7680" : "#94a3b8");
    root.style.setProperty("--border-subtle", isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)");
    root.style.setProperty("--border-accent", accentColor + "59");

    document.body.style.background = isDark ? "#0b0f14" : "#f8fafc";
    document.body.style.color = isDark ? "#e7ebef" : "#1e293b";
  }, [theme, accentColor]);

  const isDark = theme === "dark";

  return (
    <div style={{ ...styles.root, background: isDark ? "#0f0f14" : "#f8fafc", color: isDark ? "#e6edf3" : "#1e293b" }}>
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* MAIN AREA */}
      <div
        style={{
          ...styles.mainWrap,
          marginLeft: sidebarOpen ? 272 : 0,
        }}
      >
        {/* TOP BAR */}
        <div style={{
          ...styles.topBar,
          background: isDark ? "rgba(15,15,20,0.8)" : "rgba(248,250,252,0.85)",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        }}>
          <div style={styles.topBarLeft}>
            {!sidebarOpen && (
              <button onClick={toggleSidebar} style={{
                ...styles.menuBtn,
                color: isDark ? "#94a3b8" : "#64748b",
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="15" y2="12" />
                  <line x1="3" y1="18" x2="18" y2="18" />
                </svg>
              </button>
            )}
            <div style={styles.topBarBrand}>
              <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="10" fill="url(#tb-grad)" />
                <path d="M14 24h6l4-8 4 16 4-8h6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="tb-grad" x1="0" y1="0" x2="48" y2="48">
                    <stop stopColor="#6366f1" />
                    <stop offset="1" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "1.5px", color: isDark ? "#e5e7eb" : "#1e293b" }}>
                NEXUS
              </span>
            </div>
          </div>

          <ProfileMenu />
        </div>

        {/* CHAT AREA */}
        <div style={styles.chatArea}>
          <MemoChatContainer />
        </div>
      </div>

      {/* SETTINGS PANEL */}
      <SettingsPanel />
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    position: "relative",
  },

  mainWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    overflow: "hidden",
  },

  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    flexShrink: 0,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    zIndex: 10,
  },

  topBarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  topBarBrand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },

  chatArea: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
};
