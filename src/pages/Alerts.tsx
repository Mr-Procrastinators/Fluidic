import { useAlerts } from "@/hooks/useFirebaseData";
import { SectionHeader } from "@/components/shared/SectionHeader";

export default function Alerts() {
  const alerts = useAlerts();
  const criticalCount = alerts.filter((a) => a.severity === "critical" || a.severity === "high").length;
  const resolvedCount = alerts.filter((a) => a.status === "resolved").length;

  const handleExport = () => {
    const content = alerts.map((a, i) => `${i + 1}. [${a.severity}] ${a.type} - ${a.timestamp} - ${a.status}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alert_report.txt";
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="text-[10px] font-bold uppercase text-slate-400">Critical Faults</div>
          <div className="text-3xl font-black text-red-600">{criticalCount}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="text-[10px] font-bold uppercase text-slate-400">System Status</div>
          <div className="text-2xl font-black text-emerald-500">OPERATIONAL</div>
        </div>
        <div className="rounded-2xl shadow-sm border border-slate-700 p-5" style={{ backgroundColor: "#1e293b" }}>
          <div className="text-[10px] font-bold uppercase text-slate-400">Network Sync</div>
          <div className="text-2xl font-black text-blue-400">SYNCED</div>
          <div className="text-[9px] text-slate-500 mt-1">{resolvedCount} resolved</div>
        </div>
      </div>

      {/* Fault table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <SectionHeader title="Fault Log">
          <button onClick={handleExport} className="bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-lg hover:bg-red-700 transition-colors">
            Export PDF Report
          </button>
        </SectionHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#1a2c42" }}>
                <th className="text-left px-4 py-3 text-slate-400 text-[10px] font-bold uppercase">ID</th>
                <th className="text-left px-4 py-3 text-slate-400 text-[10px] font-bold uppercase">Timestamp</th>
                <th className="text-left px-4 py-3 text-slate-400 text-[10px] font-bold uppercase">Fault Type</th>
                <th className="text-left px-4 py-3 text-slate-400 text-[10px] font-bold uppercase">Severity</th>
                <th className="text-left px-4 py-3 text-slate-400 text-[10px] font-bold uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">No alerts recorded</td></tr>
              )}
              {alerts.map((alert, i) => {
                const isCritical = alert.severity === "critical" || alert.severity === "high";
                const isResolved = alert.status === "resolved";
                return (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-[11px]">FLT-{String(i + 1).padStart(3, "0")}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">{alert.timestamp}</td>
                    <td className="px-4 py-3 text-[11px] font-semibold">{alert.type}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${isCritical ? "bg-red-100 text-red-700 border border-red-300" : isResolved ? "bg-emerald-100 text-emerald-700 border border-emerald-300" : "bg-amber-100 text-amber-700 border border-amber-300"}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black uppercase ${isResolved ? "text-emerald-600" : "text-red-600"}`}>
                        {alert.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
