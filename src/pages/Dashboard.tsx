import { useScadaData, usePipelineData, useAlerts } from "@/hooks/useFirebaseData";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { RadialGauge } from "@/components/shared/RadialGauge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect, useRef } from "react";

export default function Dashboard() {
  const scada = useScadaData();
  const pipeline = usePipelineData();
  const alerts = useAlerts();
  const [flowHistory, setFlowHistory] = useState<{ time: string; inlet: number; outlet: number }[]>([]);
  const countRef = useRef(0);

  useEffect(() => {
    const now = new Date().toLocaleTimeString("en-US", { hour12: false, minute: "2-digit", second: "2-digit" });
    setFlowHistory((prev) => {
      const next = [...prev, { time: now, inlet: scada.flow1, outlet: scada.flow2 }];
      return next.slice(-20);
    });
    countRef.current++;
  }, [scada.flow1, scada.flow2]);

  const leakDetected = Math.abs(scada.flow1 - scada.flow2) > 5;
  const criticalAlerts = alerts.filter((a) => a.severity === "critical" || a.severity === "high").length;

  return (
    <div className="space-y-4">
      {/* Top strip */}
      <div className="flex gap-3 flex-wrap">
        <div className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${leakDetected ? "bg-red-100 text-red-700 border border-red-300" : "bg-emerald-100 text-emerald-700 border border-emerald-300"}`}>
          Leak Detection: {leakDetected ? "⚠ LEAK DETECTED" : "✓ NO LEAK"}
        </div>
        <div className="px-4 py-2 rounded-lg bg-red-100 text-red-700 border border-red-300 text-[10px] font-black uppercase">
          Active Alerts: {criticalAlerts}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left 8 cols */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Water Quality */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <SectionHeader title="Water Quality Metrics" />
            <div className="p-4 flex justify-around flex-wrap gap-4">
              <RadialGauge value={pipeline.tds} max={1000} label="TDS" unit="ppm" color="#4f46e5" />
              <RadialGauge value={pipeline.turbidity} max={100} label="Turbidity" unit="NTU" color="#d97706" />
              <RadialGauge value={pipeline.ph} max={14} label="pH" unit="pH" color="#16a34a" />
            </div>
          </div>

          {/* Flow & Storage */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <SectionHeader title="Flow & Storage" />
            <div className="p-4 flex justify-around flex-wrap gap-4">
              <RadialGauge value={scada.flow1} max={100} label="Inlet Flow" unit="L/min" color="#2563eb" />
              <RadialGauge value={scada.flow2} max={100} label="Outlet Flow" unit="L/min" color="#06b6d4" />
              <RadialGauge value={scada.level} max={100} label="Storage Level" unit="%" color="#f97316" />
            </div>
          </div>

          {/* Live Flow Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <SectionHeader title="Live Flow Comparison">
              <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </SectionHeader>
            <div className="p-4" style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flowHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="inlet" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} name="Inlet" />
                  <Area type="monotone" dataKey="outlet" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} name="Outlet" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right 4 cols */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Pump Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <SectionHeader title="Pump Status" />
            <div className="p-6 text-center">
              <div className={`text-3xl font-black ${scada.pump === 1 ? "text-emerald-500" : "text-red-500"}`}>
                {scada.pump === 1 ? "RUNNING" : "STOPPED"}
              </div>
              <div className="mt-2 text-[10px] font-bold uppercase text-slate-400">
                Mode: {scada.mode || "AUTO"}
              </div>
            </div>
          </div>

          {/* System Notifications */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <SectionHeader title="System Notifications" />
            <div className="p-3 max-h-80 overflow-y-auto space-y-2">
              {alerts.length === 0 && <p className="text-slate-400 text-sm p-2">No alerts</p>}
              {alerts.slice(-10).reverse().map((alert, i) => {
                const isCritical = alert.severity === "critical" || alert.severity === "high";
                const isResolved = alert.status === "resolved";
                const bg = isResolved ? "bg-emerald-50 border-emerald-300 text-emerald-700" : isCritical ? "bg-red-50 border-red-300 text-red-700" : "bg-amber-50 border-amber-300 text-amber-700";
                return (
                  <div key={i} className={`px-3 py-2 rounded-lg border text-[11px] ${bg}`}>
                    <div className="font-bold">{alert.type}</div>
                    <div className="opacity-70">{alert.timestamp}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
