import { NavLink } from "react-router-dom";
import { LayoutDashboard, BarChart3, AlertTriangle, Map, Settings, Brain, X } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/alerts", label: "Alerts & Faults", icon: AlertTriangle },
  { to: "/map", label: "Live Map", icon: Map },
  { to: "/control", label: "Control Panel", icon: Settings },
  { to: "/ai", label: "AI Insights", icon: Brain },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:static z-50 top-0 left-0 h-full w-60 flex flex-col transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: "#0d1b2a" }}
      >
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💧</span>
            <span className="text-white font-black text-lg tracking-wide">FLUIDIC</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="px-5 text-slate-400 text-[9px] uppercase font-bold tracking-widest mb-4">Smart Pipeline Monitoring</p>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-blue-600 text-white font-semibold" : "text-white/70 hover:bg-slate-800 hover:text-white"}`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 text-slate-500 text-[9px] uppercase">© 2025 FLUIDIC Systems</div>
      </aside>
    </>
  );
}
