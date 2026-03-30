import { useScadaData, usePipelineData } from "@/hooks/useFirebaseData";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useState, useEffect } from "react";

export default function Analytics() {
  const scada = useScadaData();
  const pipeline = usePipelineData();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const now = new Date().toLocaleTimeString("en-US", { hour12: false, minute: "2-digit", second: "2-digit" });
    setHistory((prev) => {
      const next = [...prev, {
        time: now,
        flow1: scada.flow1, flow2: scada.flow2, pressure: scada.pressure,
        tds: pipeline.tds, turbidity: pipeline.turbidity, ph: pipeline.ph,
      }];
      return next.slice(-30);
    });
  }, [scada.flow1, scada.pressure, pipeline.tds]);

  const f1 = Number(scada.flow1) || 0;
  const pr = Number(scada.pressure) || 0;
  const td = Number(pipeline.tds) || 0;
  const ph = Number(pipeline.ph) || 0;

  const stats = [
    { label: "Avg Flow Rate", value: `${f1.toFixed(1)} L/min`, color: "text-blue-600" },
    { label: "Avg Pressure", value: `${pr.toFixed(1)} bar`, color: "text-emerald-600" },
    { label: "Avg TDS", value: `${td.toFixed(0)} ppm`, color: "text-indigo-600" },
    { label: "Avg pH", value: `${ph.toFixed(1)}`, color: "text-green-600" },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <div className="text-[10px] font-bold uppercase text-slate-400">{s.label}</div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Flow Rate Trend */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <SectionHeader title="Flow Rate Trend" />
        <div className="p-4" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="flow1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} name="Inlet" />
              <Area type="monotone" dataKey="flow2" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} name="Outlet" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pressure Trend */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <SectionHeader title="Pressure Trend" />
        <div className="p-4" style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="pressure" stroke="#10b981" strokeWidth={2} dot={false} name="Pressure" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Water Quality Trend */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <SectionHeader title="Water Quality Metrics" />
        <div className="p-4" style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="tds" stroke="#4f46e5" strokeWidth={2} dot={false} name="TDS" />
              <Line type="monotone" dataKey="turbidity" stroke="#d97706" strokeWidth={2} dot={false} name="Turbidity" />
              <Line type="monotone" dataKey="ph" stroke="#16a34a" strokeWidth={2} dot={false} name="pH" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
