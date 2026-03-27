import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chatStore";
import { API_BASE } from "../config/api";
import "./LoginPage.css";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isSignUp = mode === "signup";

  function validate() {
    if (!email.trim() || !password.trim()) return "Please fill in all fields.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Please enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (isSignUp && password !== confirmPassword) return "Passwords do not match.";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignUp ? "/auth/signup" : "/auth/login";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!res.ok) {
        let message = "Something went wrong.";
        try {
          const body = await res.json();
          message = body.detail || message;
        } catch {
          // response wasn't JSON
        }
        setError(message);
        return;
      }

      const data = await res.json();

      localStorage.setItem("nexus_token", data.token);
      localStorage.setItem("nexus_auth_email", data.email);
      localStorage.setItem("nexus_user_id", data.user_id);

      useChatStore.setState({
        isAuthenticated: true,
        userEmail: data.email,
        userId: data.user_id,
        authToken: data.token,
      });

      navigate("/chat");
    } catch (err) {
      console.error("Auth error:", err);
      setError("Cannot connect to server. Please check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb--1" />
        <div className="login-bg-orb login-bg-orb--2" />
        <div className="login-bg-orb login-bg-orb--3" />
      </div>

      {/* Glass card */}
      <div className="login-card">
        {/* Logo / Brand */}
        <div className="login-brand-section">
          <div className="login-logo">
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#logo-grad)" />
              <path d="M14 24h6l4-8 4 16 4-8h6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="login-brand-name">NEXUS AI</h1>
          <p className="login-brand-tagline">Intelligent Document Assistant</p>
        </div>

        {/* Divider */}
        <div className="login-divider" />

        {/* Form header */}
        <h2 className="login-heading">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h2>
        <p className="login-subheading">
          {isSignUp
            ? "Start exploring your documents with AI"
            : "Sign in to continue where you left off"}
        </p>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          <div className="login-field">
            <label className="login-label">Email address</label>
            <div className="login-input-wrap">
              <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                type="email"
                className="login-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <div className="login-input-wrap">
              <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="password"
                className="login-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                disabled={loading}
              />
            </div>
          </div>

          {isSignUp && (
            <div className="login-field">
              <label className="login-label">Confirm password</label>
              <div className="login-input-wrap">
                <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <input
                  type="password"
                  className="login-input"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="login-btn-loading">
                <span className="login-spinner" />
                Please wait...
              </span>
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="login-toggle">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <button
            className="login-toggle-link"
            onClick={() => {
              setMode(isSignUp ? "login" : "signup");
              setError("");
              setConfirmPassword("");
            }}
          >
            {isSignUp ? "Sign in" : "Create one"}
          </button>
        </div>

        {/* Footer */}
        <div className="login-footer">
          Powered by Nexus AI &middot; Agentic RAG
        </div>
      </div>
    </div>
  );
}
