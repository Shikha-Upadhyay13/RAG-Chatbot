import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/chatStore";

export default function ChatHistoryItem({ title, active, onClick, id }) {
  const summary = useChatStore((s) => s.sessionSummaries?.[id] || null);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const renameSession = useChatStore((s) => s.renameSession);
  const togglePinSession = useChatStore((s) => s.togglePinSession);
  const toggleArchiveSession = useChatStore((s) => s.toggleArchiveSession);
  const setHovered = useChatStore((s) => s.setHoveredSession);

  const pinned = useChatStore(
    (s) => s.sessions.find((sess) => sess.id === id)?.pinned
  );
  const archived = useChatStore(
    (s) => s.sessions.find((sess) => sess.id === id)?.archived
  );

  const [menu, setMenu] = useState(null); // { x, y }
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const [hoveredItem, setHoveredItem] = useState(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menu) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menu]);

  // Focus rename input
  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  function handleContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();

    // Position menu relative to sidebar (clamp so it doesn't overflow)
    const x = Math.min(e.clientX, 230);
    const y = e.clientY;
    setMenu({ x, y });
  }

  function handleRename() {
    setMenu(null);
    setRenameValue(title);
    setRenaming(true);
  }

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== title) {
      renameSession(id, trimmed);
    }
    setRenaming(false);
  }

  function handlePin() {
    setMenu(null);
    togglePinSession(id);
  }

  function handleArchive() {
    setMenu(null);
    toggleArchiveSession(id);
  }

  function handleDelete() {
    setMenu(null);
    deleteSession(id);
  }

  const menuItems = [
    {
      key: "rename",
      label: "Rename",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      ),
      action: handleRename,
      color: "#e5e7eb",
    },
    {
      key: "pin",
      label: pinned ? "Unpin Chat" : "Pin Chat",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="17" x2="12" y2="22" />
          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
        </svg>
      ),
      action: handlePin,
      color: "#e5e7eb",
    },
    {
      key: "archive",
      label: archived ? "Unarchive" : "Archive",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="5" rx="1" />
          <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
          <path d="M10 12h4" />
        </svg>
      ),
      action: handleArchive,
      color: "#e5e7eb",
    },
    {
      key: "delete",
      label: "Delete",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      ),
      action: handleDelete,
      color: "#ef4444",
    },
  ];

  return (
    <>
      <div
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setHovered(id)}
        onMouseLeave={() => setHovered(null)}
        style={{
          ...styles.item,
          background: active ? "#020617" : "transparent",
        }}
      >
        {active && <div style={styles.activeBar} />}

        {pinned && <span style={styles.pinBadge}>pinned</span>}

        {renaming ? (
          <input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            onClick={(e) => e.stopPropagation()}
            style={styles.renameInput}
          />
        ) : (
          <span style={styles.title}>{title}</span>
        )}

        {summary && <div style={styles.preview}>{summary}</div>}
      </div>

      {/* CONTEXT MENU */}
      {menu && (
        <div
          ref={menuRef}
          style={{
            ...styles.contextMenu,
            top: menu.y,
            left: menu.x,
          }}
        >
          {menuItems.map((item) => (
            <div
              key={item.key}
              onClick={(e) => {
                e.stopPropagation();
                item.action();
              }}
              onMouseEnter={() => setHoveredItem(item.key)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                ...styles.menuItem,
                color: item.color,
                background:
                  hoveredItem === item.key
                    ? item.key === "delete"
                      ? "rgba(239, 68, 68, 0.12)"
                      : "rgba(255,255,255,0.06)"
                    : "transparent",
              }}
            >
              <span style={styles.menuIcon}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const styles = {
  item: {
    position: "relative",
    padding: "10px 10px 10px 14px",
    borderRadius: 6,
    cursor: "pointer",
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    color: "#e5e7eb",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "block",
  },
  preview: {
    marginTop: 6,
    fontSize: 11,
    color: "#9aa7b2",
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    background: "linear-gradient(180deg, #00e5ff, #2979ff)",
    borderRadius: 2,
  },
  pinBadge: {
    fontSize: 9,
    color: "#67e8f9",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 2,
    display: "block",
  },
  renameInput: {
    width: "100%",
    padding: "4px 8px",
    fontSize: 13,
    color: "#e5e7eb",
    background: "#0a0f1a",
    border: "1px solid #2979ff",
    borderRadius: 4,
    outline: "none",
    boxSizing: "border-box",
  },
  contextMenu: {
    position: "fixed",
    zIndex: 100,
    minWidth: 170,
    background: "#0f1520",
    border: "1px solid #1f2937",
    borderRadius: 8,
    padding: "4px 0",
    boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 14px",
    fontSize: 13,
    cursor: "pointer",
    transition: "background 0.12s ease",
  },
  menuIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    flexShrink: 0,
  },
};
