import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chatStore";
import "./LoginPage.css";

const AI_IMAGE =
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const login = useChatStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
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

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      // Dummy sign-up: save to localStorage
      const users = JSON.parse(localStorage.getItem("echo_users") || "{}");
      if (users[email]) {
        setError("An account with this email already exists.");
        return;
      }
      users[email] = { password };
      localStorage.setItem("echo_users", JSON.stringify(users));
    } else {
      // Dummy login: check localStorage
      const users = JSON.parse(localStorage.getItem("echo_users") || "{}");
      if (!users[email] || users[email].password !== password) {
        setError("Invalid email or password.");
        return;
      }
    }

    login(email);
    navigate("/chat");
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
                />
              </div>
            )}

            <button type="submit" className="login-btn">
              {isSignUp ? "Sign Up" : "Log In"}
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
