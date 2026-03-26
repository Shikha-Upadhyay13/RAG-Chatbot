import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chatStore";

export default function ProfileMenu() {
  const userEmail = useChatStore((s) => s.userEmail);
  const logout = useChatStore((s) => s.logout);
  const openSettings = useChatStore((s) => s.openSettings);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const menuRef = useRef(null);

  // Derive initials & display name from email
  const displayName = userEmail
    ? userEmail.split("@")[0].replace(/[._]/g, " ")
    : "User";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const domain = userEmail ? userEmail.split("@")[1] : "";

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleLogout() {
    setOpen(false);
    logout();
    navigate("/");
  }

  const menuItems = [
    {
      key: "profile",
      label: "My Echo",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M20 21a8 8 0 1 0-16 0" />
        </svg>
      ),
      action: () => { setOpen(false); openSettings(); },
    },
    {
      key: "settings",
      label: "Settings",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      action: () => { setOpen(false); openSettings(); },
    },
    { key: "divider" },
    {
      key: "logout",
      label: "Log Out",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      ),
      action: handleLogout,
      color: "#ef4444",
    },
  ];

  return (
    <div ref={menuRef} style={styles.wrapper}>
      {/* AVATAR BUTTON */}
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          ...styles.avatar,
          ...(open ? styles.avatarActive : {}),
        }}
      >
        {initials}
      </div>

      {/* DROPDOWN */}
      {open && (
        <div style={styles.dropdown}>
          {/* USER INFO HEADER */}
          <div style={styles.userHeader}>
            <div style={styles.avatarLarge}>{initials}</div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>
                {displayName.replace(/\b\w/g, (c) => c.toUpperCase())}
              </div>
              <div style={styles.userEmailText}>{userEmail}</div>
            </div>
          </div>

          <div style={styles.divider} />

          {/* PLAN / USAGE */}
          <div style={styles.planRow}>
            <span style={styles.planLabel}>Plan</span>
            <span style={styles.planBadge}>Pro</span>
          </div>

          <div style={styles.divider} />

          {/* MENU ITEMS */}
          {menuItems.map((item) => {
            if (item.key === "divider") {
              return <div key={item.key} style={styles.divider} />;
            }
            return (
              <div
                key={item.key}
                onClick={item.action}
                onMouseEnter={() => setHoveredItem(item.key)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  ...styles.menuItem,
                  color: item.color || "#e5e7eb",
                  background:
                    hoveredItem === item.key
                      ? item.key === "logout"
                        ? "rgba(239, 68, 68, 0.1)"
                        : "rgba(255,255,255,0.05)"
                      : "transparent",
                }}
              >
                <span style={styles.menuIcon}>{item.icon}</span>
                {item.label}
              </div>
            );
          })}

          <div style={styles.divider} />

          {/* FOOTER */}
          <div style={styles.footer}>
            ECHO AI &middot; {domain || "echo.ai"}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: "relative",
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #00e5c9, #2979ff)",
    color: "#001412",
    fontSize: 13,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    userSelect: "none",
    transition: "box-shadow 0.2s ease, transform 0.15s ease",
    boxShadow: "0 0 0 2px transparent",
  },

  avatarActive: {
    boxShadow: "0 0 0 2px #2979ff",
    transform: "scale(1.05)",
  },

  avatarLarge: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #00e5c9, #2979ff)",
    color: "#001412",
    fontSize: 15,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    width: 280,
    background: "#0f1520",
    border: "1px solid #1f2937",
    borderRadius: 12,
    boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
    zIndex: 100,
    overflow: "hidden",
  },

  userHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 16px 12px",
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
  },

  userName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#f1f5f9",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  userEmailText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  planRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
  },

  planLabel: {
    fontSize: 13,
    color: "#94a3b8",
  },

  planBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: "#00e5c9",
    background: "rgba(0, 229, 201, 0.1)",
    border: "1px solid rgba(0, 229, 201, 0.2)",
    padding: "2px 10px",
    borderRadius: 999,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  divider: {
    height: 1,
    background: "#1f2937",
    margin: "0",
  },

  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    fontSize: 13,
    cursor: "pointer",
    transition: "background 0.12s ease",
  },

  menuIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    flexShrink: 0,
  },

  footer: {
    padding: "10px 16px",
    fontSize: 11,
    color: "#475569",
    textAlign: "center",
  },
};
