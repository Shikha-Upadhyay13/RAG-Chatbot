import { API_BASE } from "../config/api";

/* =========================
   Auth APIs
========================= */

export async function apiSignup(email, password) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Signup failed");
  }
  return data;
}

export async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Login failed");
  }
  return data;
}

/* =========================
   Session APIs (JSON)
========================= */

function getUserId() {
  return localStorage.getItem("nexus_user_id") || "";
}

export async function createSession() {
  const userId = getUserId();
  const url = userId
    ? `${API_BASE}/sessions/new?user_id=${encodeURIComponent(userId)}`
    : `${API_BASE}/sessions/new`;

  const res = await fetch(url, { method: "POST" });

  if (!res.ok) {
    throw new Error("Failed to create session");
  }

  return await res.json();
}

export async function fetchSessions() {
  const userId = getUserId();
  const url = userId
    ? `${API_BASE}/sessions?user_id=${encodeURIComponent(userId)}`
    : `${API_BASE}/sessions`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch sessions");
  }

  return await res.json();
}

export async function updateSessionTitle(sessionId, title) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/title`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    throw new Error("Failed to update session title");
  }

  return await res.json();
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete session");
  }

  return await res.json();
}

export async function fetchSession(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch session");
  }

  return await res.json();
}

export async function fetchSessionMessages(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`);

  if (!res.ok) {
    throw new Error("Failed to fetch session messages");
  }

  return await res.json();
}

/* =========================
   User Profile & Settings APIs
========================= */

export async function fetchUserProfile() {
  const userId = getUserId();
  if (!userId) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/auth/me?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return await res.json();
}

export async function fetchLoginHistory(limit = 20) {
  const userId = getUserId();
  if (!userId) throw new Error("Not logged in");

  const res = await fetch(
    `${API_BASE}/auth/login-history?user_id=${encodeURIComponent(userId)}&limit=${limit}`
  );
  if (!res.ok) throw new Error("Failed to fetch login history");
  return await res.json();
}

export async function fetchUserSettings() {
  const userId = getUserId();
  if (!userId) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/auth/settings?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Failed to fetch settings");
  return await res.json();
}

export async function updateUserSettings(settings) {
  const userId = getUserId();
  if (!userId) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/auth/settings?user_id=${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return await res.json();
}

export async function changePassword(currentPassword, newPassword) {
  const userId = getUserId();
  if (!userId) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/auth/change-password?user_id=${encodeURIComponent(userId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to change password");
  return data;
}

/* =========================
   Documents API
========================= */

export async function fetchDocuments() {
  const res = await fetch(`${API_BASE}/documents`);

  if (!res.ok) {
    throw new Error("Failed to fetch documents");
  }

  return await res.json();
}

/* =========================
   Chat Streaming API (SSE)
========================= */

export async function streamChatMessage(
  sessionId,
  userText,
  onToken,
  onDone
) {
  const controller = new AbortController();

  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      session_id: sessionId,
      user_text: userText,
    }),
    signal: controller.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error("Failed to stream chat response");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";
  let collectedCitations = [];
  let doneCalled = false;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let boundary;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        if (!rawEvent.startsWith("data:")) continue;

        const payload = rawEvent.replace("data:", "").trim();

        if (payload === "[DONE]") {
          doneCalled = true;
          onDone?.(collectedCitations);
          controller.abort();
          return;
        }

        let parsed;
        try {
          parsed = JSON.parse(payload);
        } catch {
          continue;
        }

        if (parsed.type === "token" && typeof parsed.value === "string") {
          onToken(parsed.value);
        }

        if (parsed.type === "citations" && Array.isArray(parsed.value)) {
          collectedCitations = parsed.value;
        }
      }
    }
  } finally {
    if (!doneCalled) {
      onDone?.(collectedCitations);
    }
    reader.releaseLock();
  }
}

/* =========================
   RAG Streaming API (SSE)
========================= */

export async function streamRagQuery(
  payload,
  {
    onToken,
    onCitations,
    onSources,
    onDone,
    onError,
  } = {}
) {
  const controller = new AbortController();

  try {
    const res = await fetch(`${API_BASE}/rag/query/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      const errText = await res.text();
      throw new Error(errText || "Failed to start RAG stream");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let boundary;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        if (!rawEvent.startsWith("data:")) continue;

        const payloadText = rawEvent.replace("data:", "").trim();

        if (payloadText === "[DONE]") {
          onDone?.();
          controller.abort();
          return;
        }

        let parsed;
        try {
          parsed = JSON.parse(payloadText);
        } catch {
          continue;
        }

        if (parsed.type === "token") {
          onToken?.(parsed.value || "");
        }

        if (parsed.type === "citations") {
          onCitations?.(parsed.value || []);
        }

        if (parsed.type === "sources") {
          onSources?.(parsed.value || []);
        }
      }
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("RAG SSE error:", err);
      onError?.(err);
    }
  }
}
