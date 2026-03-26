import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useChatStore } from "./store/chatStore";
import AppLayout from "./layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import "./App.css";

function ProtectedRoute({ children }) {
  const isAuthenticated = useChatStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

function PublicRoute({ children }) {
  const isAuthenticated = useChatStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/chat" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
