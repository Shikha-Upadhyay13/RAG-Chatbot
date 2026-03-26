import { useState, useCallback, useRef, useEffect } from "react";
import { useChatStore } from "../store/chatStore";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { useRagStream } from "../hooks/useRagStream";
import "./MessageInput.css";

const MAX_TEXTAREA_HEIGHT = 140;

export default function MessageInput({ hasMessages, sidebarOpen }) {
  const [text, setText] = useState("");
  const [fileState, setFileState] = useState(null);

  const compareMode = useChatStore((s) => s.compareMode);
  const selectedDocuments = useChatStore((s) => s.selectedDocuments);
  const theme = useChatStore((s) => s.theme);
  const accentColor = useChatStore((s) => s.accentColor);
  const isDark = theme === "dark";

  const useHumanFeedback = true;

  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  const sendUserMessage = useChatStore((s) => s.sendUserMessage);
  const updateLastAssistant = useChatStore((s) => s.updateLastAssistant);
  const stopLoading = useChatStore((s) => s.stopLoading);

  const lastActiveDocument = useChatStore((s) => s.lastActiveDocument);
  const setLastActiveDocument = useChatStore((s) => s.setLastActiveDocument);

  const registerDocument = useChatStore((s) => s.registerDocument);

  const loading = useChatStore((s) => s.loading);
  const rag = useRagStream();

  const {
    supported: voiceSupported,
    listening,
    start: startVoice,
    stop: stopVoice,
  } = useVoiceInput({
    onResult: (spoken) =>
      setText((prev) => (prev ? prev + " " + spoken : spoken)),
  });

  /* ---------------- Auto-grow textarea ---------------- */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height =
      Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT) + "px";
  }, [text]);

  /* ---------------- Send ---------------- */
  const handleSend = useCallback(async () => {
    if (loading || !text.trim()) return;

    const question = text.trim();
    setText("");

    await sendUserMessage({
      question,
      compareMode,
      documentIds: compareMode ? selectedDocuments : null,
      useHumanFeedback,
    });

    await rag.ask({
      question,
      compareMode,
      documentIds: compareMode ? selectedDocuments : null,
      documentId: !compareMode ? lastActiveDocument : null,
      useHumanFeedback,

      onToken: (content) =>
        updateLastAssistant((m) => {
          if (m) m.content = content;
        }),

      /**
       * 🔧 FIXED:
       * onSkip no longer injects "Please upload a document"
       * Backend now ALWAYS responds, so skip means "no stream"
       */
      onSkip: () => {
        updateLastAssistant((m) => {
          if (m && !m.content) {
            m.content =
              "I couldn’t find anything relevant for that question. You can upload a document if you want me to answer based on it.";
          }
        });
        stopLoading();
      },

      onDone: stopLoading,
    });
  }, [
    text,
    loading,
    compareMode,
    selectedDocuments,
    lastActiveDocument,
    sendUserMessage,
    rag,
    updateLastAssistant,
    stopLoading,
  ]);

  /* ---------------- File Upload ---------------- */
  const uploadFile = async (file) => {
    if (!file) return;

    setFileState({ name: file.name, status: "uploading" });

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      "http://127.0.0.1:8000/ingest/file",
      { method: "POST", body: formData }
    );

    const data = await res.json();

    if (data?.document_id) {
      setLastActiveDocument(data.document_id);
      registerDocument(data.document_id);
      setFileState({ name: file.name, status: "done" });
    } else {
      setFileState({ name: file.name, status: "error" });
    }
  };

  return (
    <div
      className="altaric-dock"
      style={{
        position: hasMessages ? "fixed" : "relative",
        bottom: hasMessages ? 20 : "auto",
        left: hasMessages && sidebarOpen ? 260 : 0,
        transition: "left 0.25s ease",
        background: hasMessages
          ? `linear-gradient(180deg, ${isDark ? "rgba(20,20,24,0)" : "rgba(248,250,252,0)"}, ${isDark ? "rgba(20,20,24,0.85)" : "rgba(248,250,252,0.85)"})`
          : "transparent",
      }}
    >
      <div className="altaric-bar">
        <div className="altaric-gradient-border" style={{
          background: `linear-gradient(110deg, ${accentColor}, #2979ff)`,
        }}>
          <div className="altaric-glass" style={{
            background: isDark ? "#0f1720" : "#ffffff",
          }}>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              hidden
              onChange={(e) =>
                uploadFile(e.target.files[0])
              }
            />

            <button
              className="altaric-icon-button"
              onClick={() => fileRef.current.click()}
              disabled={loading}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            <textarea
              ref={textareaRef}
              value={text}
              style={{ color: isDark ? "#e7ebef" : "#1e293b" }}
              placeholder="Ask ECHO AI"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
            />

            {voiceSupported && (
              <button
                className={`altaric-voice-button ${listening ? "listening" : ""}`}
                onClick={listening ? stopVoice : startVoice}
                disabled={loading}
                style={{
                  "--accent": accentColor,
                  background: listening
                    ? `${accentColor}18`
                    : "transparent",
                  borderColor: listening ? accentColor : "transparent",
                }}
              >
                {listening ? (
                  /* Animated waveform icon when listening */
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="9" width="3" height="6" rx="1.5" fill={accentColor}>
                      <animate attributeName="height" values="6;14;6" dur="0.8s" repeatCount="indefinite" />
                      <animate attributeName="y" values="9;5;9" dur="0.8s" repeatCount="indefinite" />
                    </rect>
                    <rect x="7" y="5" width="3" height="14" rx="1.5" fill={accentColor}>
                      <animate attributeName="height" values="14;6;14" dur="0.8s" repeatCount="indefinite" />
                      <animate attributeName="y" values="5;9;5" dur="0.8s" repeatCount="indefinite" />
                    </rect>
                    <rect x="12" y="7" width="3" height="10" rx="1.5" fill={accentColor}>
                      <animate attributeName="height" values="10;16;10" dur="0.7s" repeatCount="indefinite" />
                      <animate attributeName="y" values="7;4;7" dur="0.7s" repeatCount="indefinite" />
                    </rect>
                    <rect x="17" y="8" width="3" height="8" rx="1.5" fill={accentColor}>
                      <animate attributeName="height" values="8;14;8" dur="0.9s" repeatCount="indefinite" />
                      <animate attributeName="y" values="8;5;8" dur="0.9s" repeatCount="indefinite" />
                    </rect>
                  </svg>
                ) : (
                  /* Mic icon when idle */
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#94a3b8" : "#64748b"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="11" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="8" y1="22" x2="16" y2="22" />
                  </svg>
                )}
              </button>
            )}

            <button
              className="altaric-send-button"
              style={{
                background: text.trim()
                  ? `linear-gradient(135deg, ${accentColor}, #2979ff)`
                  : isDark ? "#1e293b" : "#e2e8f0",
              }}
              onClick={handleSend}
              disabled={loading || !text.trim()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? "#001412" : (isDark ? "#475569" : "#94a3b8")} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* FILE STATUS PILL */}
        {fileState && (
          <div className={`altaric-file-pill ${fileState.status}`}>
            {fileState.name}
            {fileState.status === "uploading" && " · uploading"}
            {fileState.status === "done" && " ✓"}
            {fileState.status === "error" && " ⚠"}
          </div>
        )}
      </div>
    </div>
  );
}
