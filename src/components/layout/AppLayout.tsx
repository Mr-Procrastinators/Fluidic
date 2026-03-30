import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const pageTitles: Record<string, string> = {
  "/": "Dashboard — Pipeline Overview",
  "/analytics": "Analytics — Historical Data",
  "/alerts": "Alerts & Fault Management",
  "/map": "Live Pipeline Map",
  "/control": "Control Panel",
  "/ai": "AI Insights — ML Diagnostics",
};

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const path = window.location.pathname;
  const title = pageTitles[path] || "FLUIDIC SCADA";

  return (
    <div className="flex h-screen" style={{ backgroundColor: "#f1f5f9" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
