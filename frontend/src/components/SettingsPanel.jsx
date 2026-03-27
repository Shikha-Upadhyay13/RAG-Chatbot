import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chatStore";
import {
  fetchUserProfile,
  fetchLoginHistory,
  fetchUserSettings,
  updateUserSettings,
  changePassword,
} from "../services/chatApi";

const ACCENT_COLORS = [
  { name: "Teal", value: "#2dd4bf" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Indigo", value: "#6366f1" },
];

const SECTIONS = [
  { key: "nexus", label: "My Nexus" },
  { key: "account", label: "Account" },
  { key: "appearance", label: "Appearance" },
];

export default function SettingsPanel() {
  const settingsOpen = useChatStore((s) => s.settingsOpen);
  const closeSettings = useChatStore((s) => s.closeSettings);
  const userEmail = useChatStore((s) => s.userEmail);
  const theme = useChatStore((s) => s.theme);
  const accentColor = useChatStore((s) => s.accentColor);
  const setTheme = useChatStore((s) => s.setTheme);
  const setAccentColor = useChatStore((s) => s.setAccentColor);
  const logout = useChatStore((s) => s.logout);
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("nexus");
  const [hoveredItem, setHoveredItem] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!settingsOpen) return;
    function handleKey(e) {
      if (e.key === "Escape") closeSettings();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [settingsOpen, closeSettings]);

  if (!settingsOpen) return null;

  const displayName = userEmail
    ? userEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "User";

  const isDark = theme === "dark";

  const bg = isDark ? "#0f1520" : "#ffffff";
  const text = isDark ? "#e5e7eb" : "#1e293b";
  const textSecondary = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#1f2937" : "#e2e8f0";
  const hoverBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const bgSecondary = isDark ? "#141c28" : "#f8fafc";

  return (
    <div style={{ ...s.overlay, background: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)" }} onClick={closeSettings}>
      <div
        ref={panelRef}
        style={{ ...s.panel, background: bg, border: `1px solid ${border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div style={{ ...s.header, borderBottom: `1px solid ${border}` }}>
          <h2 style={{ ...s.headerTitle, color: text }}>Settings</h2>
          <button onClick={closeSettings} style={{ ...s.closeBtn, color: textSecondary }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={s.body}>
          {/* LEFT NAV */}
          <div style={{ ...s.nav, borderRight: `1px solid ${border}` }}>
            {SECTIONS.map((sec) => (
              <div
                key={sec.key}
                onClick={() => setActiveSection(sec.key)}
                style={{
                  ...s.navItem,
                  color: activeSection === sec.key ? accentColor : textSecondary,
                  background: activeSection === sec.key
                    ? (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)")
                    : "transparent",
                  fontWeight: activeSection === sec.key ? 600 : 400,
                }}
              >
                {sec.label}
              </div>
            ))}
          </div>

          {/* RIGHT CONTENT */}
          <div style={s.content}>
            {activeSection === "nexus" && (
              <NexusSection
                text={text} textSecondary={textSecondary} border={border}
                hoverBg={hoverBg} hoveredItem={hoveredItem} setHoveredItem={setHoveredItem}
                accentColor={accentColor} bgSecondary={bgSecondary} isDark={isDark}
              />
            )}

            {activeSection === "account" && (
              <AccountSection
                text={text} textSecondary={textSecondary} border={border}
                hoverBg={hoverBg} hoveredItem={hoveredItem} setHoveredItem={setHoveredItem}
                accentColor={accentColor} bgSecondary={bgSecondary}
                userEmail={userEmail} displayName={displayName}
                logout={logout} navigate={navigate} closeSettings={closeSettings}
                isDark={isDark}
              />
            )}

            {activeSection === "appearance" && (
              <AppearanceSection
                text={text} textSecondary={textSecondary} border={border}
                bgSecondary={bgSecondary} accentColor={accentColor}
                theme={theme} setTheme={setTheme} setAccentColor={setAccentColor}
                isDark={isDark}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MY NEXUS SECTION — Personalization & Login History
   ============================================================ */
function NexusSection({ text, textSecondary, border, hoverBg, hoveredItem, setHoveredItem, accentColor, bgSecondary, isDark }) {
  const [activePanel, setActivePanel] = useState(null);
  const [customInstructions, setCustomInstructions] = useState("");
  const [savedInstructions, setSavedInstructions] = useState("");
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    if (activePanel === "personalization") {
      setLoading(true);
      fetchUserSettings()
        .then((data) => {
          setCustomInstructions(data.custom_instructions || "");
          setSavedInstructions(data.custom_instructions || "");
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    if (activePanel === "memories") {
      setLoading(true);
      fetchLoginHistory(20)
        .then(setLoginHistory)
        .catch(() => setLoginHistory([]))
        .finally(() => setLoading(false));
    }
  }, [activePanel]);

  async function saveInstructions() {
    setSaveStatus("Saving...");
    try {
      await updateUserSettings({ custom_instructions: customInstructions });
      setSavedInstructions(customInstructions);
      setSaveStatus("Saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch {
      setSaveStatus("Failed to save");
    }
  }

  if (activePanel === "personalization") {
    return (
      <div>
        <button onClick={() => setActivePanel(null)} style={{ ...s.backBtn, color: accentColor }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </button>
        <h3 style={{ ...s.sectionTitle, color: text }}>Personalization</h3>
        <p style={{ ...s.sectionDesc, color: textSecondary }}>
          Tell Nexus AI how you'd like it to respond. These instructions will be included in every conversation.
        </p>
        {loading ? (
          <div style={{ color: textSecondary, marginTop: 16, fontSize: 13 }}>Loading...</div>
        ) : (
          <div style={{ marginTop: 16 }}>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g., 'Always respond concisely. I'm a software developer working with Python and React. Prefer code examples over explanations.'"
              style={{
                width: "100%", minHeight: 140, padding: 12, borderRadius: 10,
                background: bgSecondary, border: `1px solid ${border}`, color: text,
                fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <button
                onClick={saveInstructions}
                disabled={customInstructions === savedInstructions}
                style={{
                  padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600,
                  background: customInstructions === savedInstructions ? (isDark ? "#1f2937" : "#e2e8f0") : accentColor,
                  color: customInstructions === savedInstructions ? textSecondary : "#000",
                  cursor: customInstructions === savedInstructions ? "default" : "pointer",
                }}
              >
                Save Instructions
              </button>
              {saveStatus && <span style={{ fontSize: 12, color: saveStatus === "Saved" ? "#22c55e" : "#f43f5e" }}>{saveStatus}</span>}
            </div>
            <div style={{ fontSize: 11, color: textSecondary, marginTop: 10 }}>
              {customInstructions.length} / 1500 characters
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activePanel === "memories") {
    return (
      <div>
        <button onClick={() => setActivePanel(null)} style={{ ...s.backBtn, color: accentColor }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </button>
        <h3 style={{ ...s.sectionTitle, color: text }}>Login History</h3>
        <p style={{ ...s.sectionDesc, color: textSecondary }}>
          Your recent account activity
        </p>
        {loading ? (
          <div style={{ color: textSecondary, marginTop: 16, fontSize: 13 }}>Loading...</div>
        ) : loginHistory.length === 0 ? (
          <div style={{ color: textSecondary, marginTop: 16, fontSize: 13 }}>No login history found.</div>
        ) : (
          <div style={{ marginTop: 16 }}>
            {loginHistory.map((entry, i) => {
              const date = new Date(entry.timestamp);
              const isSignup = entry.action === "signup";
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 8, marginBottom: 6,
                  background: bgSecondary, border: `1px solid ${border}`,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: isSignup ? "#22c55e" : accentColor,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: text, fontWeight: 500 }}>
                      {isSignup ? "Account Created" : "Logged In"}
                    </div>
                    <div style={{ fontSize: 11, color: textSecondary }}>
                      {entry.email}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: textSecondary, textAlign: "right" }}>
                    <div>{date.toLocaleDateString()}</div>
                    <div>{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const items = [
    {
      key: "personalization",
      label: "Personalization",
      desc: "Customize how Nexus responds to you",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      action: () => setActivePanel("personalization"),
    },
    {
      key: "memories",
      label: "Login History",
      desc: "View your recent account activity",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      action: () => setActivePanel("memories"),
    },
  ];

  return (
    <div>
      <h3 style={{ ...s.sectionTitle, color: text }}>My Nexus</h3>
      <p style={{ ...s.sectionDesc, color: textSecondary }}>
        Personalize your Nexus AI experience
      </p>

      <div style={{ marginTop: 16 }}>
        {items.map((item) => (
          <div
            key={item.key}
            onClick={item.action}
            onMouseEnter={() => setHoveredItem(item.key)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              ...s.settingCard,
              background: hoveredItem === item.key ? hoverBg : bgSecondary,
              border: `1px solid ${border}`,
            }}
          >
            <div style={{ ...s.cardIcon, color: accentColor }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: text }}>{item.label}</div>
              <div style={{ fontSize: 12, color: textSecondary, marginTop: 2 }}>{item.desc}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   ACCOUNT SECTION — Profile, Password, Plan
   ============================================================ */
function AccountSection({ text, textSecondary, border, hoverBg, hoveredItem, setHoveredItem, accentColor, bgSecondary, userEmail, displayName, logout, navigate, closeSettings, isDark }) {
  const [activePanel, setActivePanel] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Password change state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwStatus, setPwStatus] = useState("");

  // Display name state
  const [editName, setEditName] = useState("");
  const [nameStatus, setNameStatus] = useState("");

  useEffect(() => {
    if (activePanel === "workspace") {
      setLoading(true);
      fetchUserProfile()
        .then(setProfile)
        .catch(() => setProfile(null))
        .finally(() => setLoading(false));
    }
    if (activePanel === "email") {
      fetchUserSettings()
        .then((data) => setEditName(data.display_name || ""))
        .catch(() => {});
    }
  }, [activePanel]);

  async function handleChangePassword() {
    if (newPw !== confirmPw) {
      setPwStatus("Passwords don't match");
      return;
    }
    if (newPw.length < 6) {
      setPwStatus("Password must be at least 6 characters");
      return;
    }
    setPwStatus("Changing...");
    try {
      await changePassword(currentPw, newPw);
      setPwStatus("Password changed successfully");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      setPwStatus(err.message || "Failed to change password");
    }
  }

  async function handleSaveName() {
    setNameStatus("Saving...");
    try {
      await updateUserSettings({ display_name: editName });
      setNameStatus("Saved");
      setTimeout(() => setNameStatus(""), 2000);
    } catch {
      setNameStatus("Failed to save");
    }
  }

  // Workspace / Profile panel
  if (activePanel === "workspace") {
    return (
      <div>
        <button onClick={() => setActivePanel(null)} style={{ ...s.backBtn, color: accentColor }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </button>
        <h3 style={{ ...s.sectionTitle, color: text }}>Workspace</h3>
        {loading ? (
          <div style={{ color: textSecondary, marginTop: 16, fontSize: 13 }}>Loading...</div>
        ) : profile ? (
          <div style={{ marginTop: 16 }}>
            {[
              { label: "Email", value: profile.email },
              { label: "Plan", value: (profile.plan || "free").charAt(0).toUpperCase() + (profile.plan || "free").slice(1) },
              { label: "Member Since", value: new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
              { label: "Total Sessions", value: profile.session_count },
              { label: "Total Messages", value: profile.message_count },
            ].map((row) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 14px", borderRadius: 8, marginBottom: 6,
                background: bgSecondary, border: `1px solid ${border}`,
              }}>
                <span style={{ fontSize: 13, color: textSecondary }}>{row.label}</span>
                <span style={{ fontSize: 13, color: text, fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: textSecondary, marginTop: 16, fontSize: 13 }}>Failed to load profile.</div>
        )}
      </div>
    );
  }

  // Subscription / Plan panel
  if (activePanel === "subscription") {
    return (
      <div>
        <button onClick={() => setActivePanel(null)} style={{ ...s.backBtn, color: accentColor }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </button>
        <h3 style={{ ...s.sectionTitle, color: text }}>Subscription</h3>
        <div style={{
          marginTop: 16, padding: 20, borderRadius: 12,
          background: bgSecondary, border: `1px solid ${border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: text }}>Free Plan</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
              background: accentColor, color: "#000", textTransform: "uppercase",
            }}>Current</span>
          </div>
          <div style={{ fontSize: 13, color: textSecondary, lineHeight: 1.6 }}>
            You're on the free plan with access to all core features including document upload, RAG-powered Q&A, and conversation history.
          </div>
        </div>
      </div>
    );
  }

  // Security / Change Password panel
  if (activePanel === "security") {
    return (
      <div>
        <button onClick={() => setActivePanel(null)} style={{ ...s.backBtn, color: accentColor }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </button>
        <h3 style={{ ...s.sectionTitle, color: text }}>Change Password</h3>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Current Password", value: currentPw, set: setCurrentPw },
            { label: "New Password", value: newPw, set: setNewPw },
            { label: "Confirm New Password", value: confirmPw, set: setConfirmPw },
          ].map((field) => (
            <div key={field.label}>
              <label style={{ fontSize: 12, color: textSecondary, marginBottom: 4, display: "block" }}>{field.label}</label>
              <input
                type="password"
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  background: bgSecondary, border: `1px solid ${border}`, color: text,
                  fontSize: 13, outline: "none",
                }}
              />
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
            <button
              onClick={handleChangePassword}
              disabled={!currentPw || !newPw || !confirmPw}
              style={{
                padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600,
                background: (!currentPw || !newPw || !confirmPw) ? (isDark ? "#1f2937" : "#e2e8f0") : accentColor,
                color: (!currentPw || !newPw || !confirmPw) ? textSecondary : "#000",
                cursor: (!currentPw || !newPw || !confirmPw) ? "default" : "pointer",
              }}
            >
              Change Password
            </button>
            {pwStatus && (
              <span style={{ fontSize: 12, color: pwStatus.includes("success") ? "#22c55e" : "#f43f5e" }}>{pwStatus}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Email / Display Name panel
  if (activePanel === "email") {
    return (
      <div>
        <button onClick={() => setActivePanel(null)} style={{ ...s.backBtn, color: accentColor }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </button>
        <h3 style={{ ...s.sectionTitle, color: text }}>Profile Settings</h3>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: textSecondary, marginBottom: 4, display: "block" }}>Email Address</label>
            <div style={{
              padding: "10px 12px", borderRadius: 8,
              background: bgSecondary, border: `1px solid ${border}`, color: textSecondary,
              fontSize: 13,
            }}>
              {userEmail}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: textSecondary, marginBottom: 4, display: "block" }}>Display Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter your display name"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                background: bgSecondary, border: `1px solid ${border}`, color: text,
                fontSize: 13, outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleSaveName}
              style={{
                padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600,
                background: accentColor, color: "#000", cursor: "pointer",
              }}
            >
              Save
            </button>
            {nameStatus && <span style={{ fontSize: 12, color: nameStatus === "Saved" ? "#22c55e" : "#f43f5e" }}>{nameStatus}</span>}
          </div>
        </div>
      </div>
    );
  }

  const items = [
    {
      key: "workspace",
      label: "Workspace",
      desc: "View your profile and usage stats",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>,
      action: () => setActivePanel("workspace"),
    },
    {
      key: "subscription",
      label: "Subscription",
      desc: "View your current plan",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
      action: () => setActivePanel("subscription"),
    },
    {
      key: "security",
      label: "Security",
      desc: "Change your password",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
      action: () => setActivePanel("security"),
    },
    {
      key: "email",
      label: "Profile Settings",
      desc: "Manage your display name and email",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
      action: () => setActivePanel("email"),
    },
  ];

  return (
    <div>
      {/* Profile card */}
      <div style={{ ...s.profileCard, border: `1px solid ${border}`, background: bgSecondary }}>
        <div style={{ ...s.profileAvatar, background: `linear-gradient(135deg, ${accentColor}, #2979ff)` }}>
          {displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: text }}>{displayName}</div>
          <div style={{ fontSize: 12, color: textSecondary }}>{userEmail}</div>
        </div>
      </div>

      <h3 style={{ ...s.sectionTitle, color: text, marginTop: 24 }}>Account</h3>

      <div style={{ marginTop: 12 }}>
        {items.map((item) => (
          <div
            key={item.key}
            onClick={item.action}
            onMouseEnter={() => setHoveredItem(item.key)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              ...s.settingCard,
              background: hoveredItem === item.key ? hoverBg : bgSecondary,
              border: `1px solid ${border}`,
            }}
          >
            <div style={{ ...s.cardIcon, color: accentColor }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: text }}>{item.label}</div>
              <div style={{ fontSize: 12, color: textSecondary, marginTop: 2 }}>{item.desc}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={() => { closeSettings(); logout(); navigate("/"); }}
        style={s.logoutBtn}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Log Out
      </button>
    </div>
  );
}

/* ============================================================
   APPEARANCE SECTION
   ============================================================ */
function AppearanceSection({ text, textSecondary, border, bgSecondary, accentColor, theme, setTheme, setAccentColor, isDark }) {
  return (
    <div>
      <h3 style={{ ...s.sectionTitle, color: text }}>Appearance</h3>
      <p style={{ ...s.sectionDesc, color: textSecondary }}>
        Customize how Nexus looks for you
      </p>

      {/* THEME SELECTOR */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 10 }}>Theme</div>
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { key: "dark", label: "Dark", bg: "#0f1520", fg: "#e5e7eb" },
            { key: "light", label: "Light", bg: "#ffffff", fg: "#1e293b" },
          ].map((t) => (
            <div
              key={t.key}
              onClick={() => setTheme(t.key)}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                border: `2px solid ${theme === t.key ? accentColor : border}`,
                background: t.bg,
                cursor: "pointer",
                textAlign: "center",
                transition: "border-color 0.2s",
              }}
            >
              <div style={{
                width: "100%", height: 60, borderRadius: 8, marginBottom: 10,
                background: t.key === "dark"
                  ? "linear-gradient(135deg, #141c28, #0f1520)"
                  : "linear-gradient(135deg, #f8fafc, #e2e8f0)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{
                  width: "60%", height: 6, borderRadius: 3,
                  background: t.key === "dark" ? "#2dd4bf" : "#3b82f6",
                  opacity: 0.6,
                }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: t.fg }}>{t.label}</div>
              {theme === t.key && (
                <div style={{ fontSize: 11, color: accentColor, marginTop: 4 }}>Active</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ACCENT COLOR */}
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 10 }}>Accent Color</div>
        <p style={{ fontSize: 12, color: textSecondary, marginBottom: 14 }}>
          Changes the color of buttons, links, and highlights across the app
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {ACCENT_COLORS.map((c) => (
            <div
              key={c.value}
              onClick={() => setAccentColor(c.value)}
              title={c.name}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: c.value,
                cursor: "pointer",
                border: accentColor === c.value
                  ? `3px solid ${isDark ? "#fff" : "#000"}`
                  : "3px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border-color 0.15s, transform 0.15s",
                transform: accentColor === c.value ? "scale(1.1)" : "scale(1)",
              }}
            >
              {accentColor === c.value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          ))}
        </div>

        {/* Custom color */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
          <label style={{ fontSize: 12, color: textSecondary }}>Custom:</label>
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            style={{ width: 36, height: 36, border: "none", cursor: "pointer", borderRadius: 8, padding: 0, background: "transparent" }}
          />
          <span style={{ fontSize: 12, color: textSecondary, fontFamily: "monospace" }}>{accentColor}</span>
        </div>
      </div>

      {/* PREVIEW */}
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 10 }}>Preview</div>
        <div style={{
          padding: 16, borderRadius: 12,
          border: `1px solid ${border}`, background: bgSecondary,
        }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ padding: "8px 16px", borderRadius: 8, background: accentColor, color: "#000", fontSize: 13, fontWeight: 600 }}>
              Primary Button
            </div>
            <div style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${accentColor}`, color: accentColor, fontSize: 13, fontWeight: 500 }}>
              Secondary
            </div>
          </div>
          <div style={{ fontSize: 13, color: text }}>
            This is how your <span style={{ color: accentColor, fontWeight: 600 }}>accent color</span> will look across the app.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   STYLES
   ============================================================ */
const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    width: 720,
    maxWidth: "92vw",
    height: "80vh",
    maxHeight: 640,
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  nav: {
    width: 180,
    flexShrink: 0,
    padding: "12px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  navItem: {
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  content: {
    flex: 1,
    padding: "20px 28px",
    overflowY: "auto",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  },
  sectionDesc: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 0,
  },
  settingCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 16px",
    borderRadius: 10,
    marginBottom: 8,
    cursor: "pointer",
    transition: "background 0.15s",
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: "rgba(255,255,255,0.04)",
  },
  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 12,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    color: "#001412",
    fontSize: 16,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    marginTop: 20,
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid rgba(239, 68, 68, 0.3)",
    background: "rgba(239, 68, 68, 0.08)",
    color: "#fca5a5",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    justifyContent: "center",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    padding: 0,
    marginBottom: 16,
  },
};
