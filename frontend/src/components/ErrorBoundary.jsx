import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", color: "red", background: "#fee", minHeight: "100vh" }}>
          <h2>Something went wrong in the UI.</h2>
          <details style={{ whiteSpace: "pre-wrap", marginTop: "20px", background: "#fff", padding: "20px", borderRadius: "8px" }}>
            <summary style={{ fontWeight: "bold", cursor: "pointer" }}>Error Details (Click to expand)</summary>
            <p><strong>{this.state.error && this.state.error.toString()}</strong></p>
            <p>{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: "20px", padding: "10px 20px", background: "red", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
