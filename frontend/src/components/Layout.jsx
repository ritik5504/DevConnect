import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

const Layout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Sidebar - Desktop Only */}
      {!isMobile && (
        <div
          style={{
            position: "sticky",
            top: 0,
            left: 0,
            zIndex: 100,
            height: "100vh",
          }}
        >
          <Sidebar />
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Navbar isMobile={isMobile} />
        <main
          style={{
            flex: 1,
            padding: isMobile ? "12px 12px 80px 12px" : "24px",
            maxWidth: 1000,
            width: "100%",
            margin: "0 auto",
          }}
        >
          {children}
        </main>
      </div>

      {/* Bottom Nav - Mobile Only */}
      {isMobile && <BottomNav />}
    </div>
  );
};

export default Layout;