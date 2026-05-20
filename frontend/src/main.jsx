import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { CallProvider } from "./context/CallContext";
import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from "./components/ErrorBoundary";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "placeholder"}>
        <AuthProvider>
          <CallProvider>
            <Toaster position="top-right" />
            <App />
          </CallProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>
);