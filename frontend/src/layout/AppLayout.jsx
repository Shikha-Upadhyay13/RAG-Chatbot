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

  // Apply theme + accent color to CSS variables globally
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
    <div style={{ ...styles.root, background: isDark ? "#141414" : "#f8fafc", color: isDark ? "#e6edf3" : "#1e293b" }}>
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* FLOATING SIDEBAR HANDLE */}
      {!sidebarOpen && (
        <div
          style={styles.sidebarHandle}
          onClick={toggleSidebar}
        >
          ❯
        </div>
      )}

      {/* PROFILE ICON — top right */}
      <div style={styles.profileCorner}>
        <ProfileMenu />
      </div>

      {/* MAIN CHAT */}
      <div
        style={{
          ...styles.main,
          marginLeft: sidebarOpen ? 260 : 0,
          marginRight: 0,
          background: isDark ? "#141414" : "#f8fafc",
        }}
      >
        <div
          style={{
            ...styles.chatShell,
            pointerEvents: "auto",
            zIndex: 1,
          }}
        >
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
    background: "#141414",
    color: "#e6edf3",
    overflow: "hidden",
    position: "relative",
  },

  main: {
    flex: 1,
    height: "100%",
    background: "#141414",
    transition: "margin 0.25s ease",
    position: "relative",
    zIndex: 1,
  },

  chatShell: {
    position: "relative",
    height: "100%",
  },

  profileCorner: {
    position: "fixed",
    top: 16,
    right: 20,
    zIndex: 50,
  },

  sidebarHandle: {
    position: "fixed",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
    background: "#020617",
    border: "1px solid #1f2937",
    borderLeft: "none",
    padding: "10px 8px",
    cursor: "pointer",
    borderRadius: "0 6px 6px 0",
    zIndex: 30,
    color: "#67e8f9",
  },

  /* ⬇️ kept intentionally (future feature / no deletion) */
  sourcesPanel: {
    position: "fixed",
    right: 0,
    top: 0,
    width: 360,
    height: "100vh",
    background: "#020617",
    borderLeft: "1px solid #1f2937",
    transition: "transform 0.25s ease",
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
  },

  sourcesHeader: {
    padding: "14px 18px",
    fontSize: 14,
    fontWeight: 600,
    borderBottom: "1px solid #1f2937",
    color: "#67e8f9",
  },

  sourcesBody: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 18px",
  },
};
