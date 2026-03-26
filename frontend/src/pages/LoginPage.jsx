import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chatStore";
import { API_BASE } from "../config/api";
import "./LoginPage.css";

const AI_IMAGE =
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignUp ? "/auth/signup" : "/auth/login";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Something went wrong.");
        return;
      }

      // Save auth data
      localStorage.setItem("echo_token", data.token);
      localStorage.setItem("echo_auth_email", data.email);
      localStorage.setItem("echo_user_id", data.user_id);

      // Update store
      useChatStore.setState({
        isAuthenticated: true,
        userEmail: data.email,
        userId: data.user_id,
        authToken: data.token,
      });

      navigate("/chat");
    } catch (err) {
      console.error("Auth error:", err);
      setError(
        "Cannot connect to server. Make sure the backend is running on " +
        API_BASE
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* LEFT — Image */}
      <div className="login-left">
        <img src={AI_IMAGE} alt="AI illustration" className="login-left-img" />
        <div className="login-left-overlay">
          <div className="login-brand">ECHO</div>
          <div className="login-tagline">
            Your intelligent document assistant powered by Agentic RAG
          </div>
        </div>
      </div>

      {/* RIGHT — Form */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <h1 className="login-form-title">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="login-form-subtitle">
            {isSignUp
              ? "Sign up to start chatting with your documents"
              : "Log in to continue your conversations"}
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}

            <div className="login-field">
              <label className="login-label">Email</label>
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

            <div className="login-field">
              <label className="login-label">Password</label>
              <input
                type="password"
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                disabled={loading}
              />
            </div>

            {isSignUp && (
              <div className="login-field">
                <label className="login-label">Confirm Password</label>
                <input
                  type="password"
                  className="login-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading
                ? "Please wait..."
                : isSignUp
                  ? "Sign Up"
                  : "Log In"}
            </button>
          </form>

          <div className="login-toggle">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              className="login-toggle-link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
            >
              {isSignUp ? "Log In" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
