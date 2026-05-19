import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { CallProvider } from "./context/CallContext";
import ErrorBoundary from "./components/ErrorBoundary";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <CallProvider>
          <Toaster position="top-right" />
          <App />
        </CallProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);