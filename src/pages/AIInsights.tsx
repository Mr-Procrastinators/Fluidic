import { useScadaData, usePipelineData } from "@/hooks/useFirebaseData";
import { useState } from "react";

export default function AIInsights() {
  const scada = useScadaData();
  const pipeline = usePipelineData();
  const [prediction, setPrediction] = useState("System Normal — No Faults Detected");
  const [loading, setLoading] = useState(false);

  const runDiagnostic = () => {
    setLoading(true);
    setTimeout(() => {
      const leakRisk = Math.abs(scada.flow1 - scada.flow2) > 5;
      const highTurbidity = pipeline.turbidity > 50;
      const lowPh = pipeline.ph < 6;
      if (leakRisk) setPrediction("⚠ Potential Leak Detected — Flow Mismatch");
      else if (highTurbidity) setPrediction("⚠ High Turbidity — Filtration Check Required");
      else if (lowPh) setPrediction("⚠ Low pH Alert — Chemical Dosing Recommended");
      else setPrediction("✓ System Normal — No Faults Detected");
      setLoading(false);
    }, 2000);
  };

  const sensors = [
    { label: "Flow", value: `${scada.flow1.toFixed(1)} L/min`, color: "text-blue-600" },
    { label: "Turbidity", value: `${pipeline.turbidity} NTU`, color: "text-amber-600" },
    { label: "TDS", value: `${pipeline.tds} ppm`, color: "text-indigo-600" },
    { label: "pH", value: `${pipeline.ph}`, color: "text-green-600" },
    { label: "Level", value: `${scada.level.toFixed(1)}%`, color: "text-orange-500" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero card */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 lg:p-12 text-center">
        <div className="text-7xl mb-4">🤖</div>
        <div className="text-indigo-500 uppercase tracking-[0.3em] text-[10px] font-bold mb-3">
          Current System Prediction
        </div>
        <div className="text-3xl lg:text-4xl font-black mb-2" style={{ textShadow: "0 0 20px rgba(99,102,241,0.3)" }}>
          {prediction}
        </div>
        <p className="text-slate-400 text-sm mb-8">
          AI-powered analysis based on real-time sensor data from the pipeline network.
        </p>
        <button
          onClick={runDiagnostic}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest py-4 px-12 rounded-full shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Run ML Diagnostic"}
        </button>
      </div>

      {/* Sensor grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {sensors.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 text-center">
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[9px] font-bold uppercase text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-slate-400 text-center uppercase">
        Endpoint: Firebase RTDB → pipeline-fault-detecting-syste-default-rtdb
      </p>
    </div>
  );
}
