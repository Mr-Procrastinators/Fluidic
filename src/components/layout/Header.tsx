import { useClock } from "@/hooks/useClock";
import { Menu } from "lucide-react";

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const time = useClock();
  const formatted = time.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = time.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  return (
    <header className="h-14 flex items-center justify-between px-4" style={{ backgroundColor: "#0d1b2a" }}>
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-white">
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-white uppercase tracking-widest text-[11px] font-bold">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="text-emerald-400 text-[10px] font-black uppercase">Online</span>
        </div>
        <div className="px-3 py-1.5 rounded-md font-mono text-sm" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#60a5fa", borderWidth: 1 }}>
          {formatted}
        </div>
        <span className="text-slate-400 text-[10px] hidden sm:block">{dateStr}</span>
      </div>
    </header>
  );
}
