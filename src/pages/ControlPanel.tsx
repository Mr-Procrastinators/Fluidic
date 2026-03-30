import { useScadaData, usePipelineData } from "@/hooks/useFirebaseData";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { database, ref, set } from "@/lib/firebase";

export default function ControlPanel() {
  const scada = useScadaData();
  const pipeline = usePipelineData();

  console.log("ControlPanel mounted/rendered with data:", { scada, pipeline });

  const setPump = (val: number) => {
    try {
      set(ref(database, "SCADA_DATA/pump"), val);
    } catch (e) {
      console.error("Error setting pump:", e);
    }
  };

  const setValve = (val: number) => {
    try {
      set(ref(database, "SCADA_DATA/valve"), val);
    } catch (e) {
      console.error("Error setting valve:", e);
    }
  };

  const setMode = (val: string) => {
    try {
      set(ref(database, "SCADA_DATA/mode"), val);
    } catch (e) {
      console.error("Error setting mode:", e);
    }
  };

  return (
    <div className="space-y-4 min-h-screen">
      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 border-l-4 border-l-blue-500">
          <div className="text-[10px] font-bold uppercase text-slate-400">Flow Rate</div>
          <div className="text-2xl font-black text-blue-600">{scada.flow1.toFixed(1)} <span className="text-sm">L/min</span></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 border-l-4 border-l-emerald-500">
          <div className="text-[10px] font-bold uppercase text-slate-400">Pressure</div>
          <div className="text-2xl font-black text-emerald-600">{scada.pressure.toFixed(1)} <span className="text-sm">bar</span></div>
        </div>
        <div className="rounded-2xl shadow-sm border border-slate-700 p-4" style={{ backgroundColor: "#1e293b" }}>
          <div className="text-[10px] font-bold uppercase text-slate-400">Operating Mode</div>
          <select value={scada.mode || "AUTO"} onChange={(e) => setMode(e.target.value)} className="mt-1 bg-blue-600 text-white font-bold text-sm rounded-lg px-3 py-1.5 border-0 outline-none cursor-pointer">
            <option value="AUTO">AUTO</option>
            <option value="MANUAL">MANUAL</option>
          </select>
        </div>
      </div>

      {/* Pump & Valve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <SectionHeader title="Pump Engine (P1)" />
          <div className="p-6 text-center">
            <div className="text-5xl mb-3">P1</div>
            <div className={`text-2xl font-black mb-1 ${scada.pump === 1 ? "text-emerald-500" : "text-red-500"}`}>{scada.pump === 1 ? "RUNNING" : "STOPPED"}</div>
            {scada.pump === 1 && <div className="w-3 h-3 mx-auto rounded-full bg-emerald-400 animate-ping mb-3" />}
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={() => setPump(1)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase px-6 py-2.5 rounded-lg transition-colors">Start Pump</button>
              <button onClick={() => setPump(0)} className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase px-6 py-2.5 rounded-lg transition-colors">Stop Pump</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <SectionHeader title="Emergency Gate Valve (V1)" />
          <div className="p-6 text-center">
            <div className="text-5xl mb-3">V1</div>
            <div className={`text-2xl font-black mb-4 ${scada.valve === 1 ? "text-blue-500" : "text-slate-500"}`}>{scada.valve === 1 ? "OPEN" : "CLOSED"}</div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setValve(1)} className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase px-6 py-2.5 rounded-lg transition-colors">Open Valve</button>
              <button onClick={() => setValve(0)} className="text-white font-black text-[10px] uppercase px-6 py-2.5 rounded-lg transition-colors" style={{ backgroundColor: "#334155" }}>Shut Valve</button>
            </div>
          </div>
        </div>
      </div>

      {/* Tank & Sensors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <SectionHeader title="Water Tank Level" />
          <div className="p-6 flex items-center justify-center">
            <div className="relative w-32 h-48 rounded-2xl border-2 border-slate-300 overflow-hidden bg-slate-100">
              <div className="absolute bottom-0 left-0 right-0 transition-all duration-1000" style={{ height: `${scada.level}%`, background: "linear-gradient(to top, #2563eb, #60a5fa)" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-white drop-shadow-lg">{scada.level.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <SectionHeader title="Real-Time Sensor Values" />
          <div className="p-4 space-y-3">
            {[
              { label: "Inlet Flow", value: `${scada.flow1.toFixed(1)} L/min`, color: "text-blue-600" },
              { label: "Outlet Flow", value: `${scada.flow2.toFixed(1)} L/min`, color: "text-cyan-500" },
              { label: "Pressure", value: `${scada.pressure.toFixed(1)} bar`, color: "text-emerald-600" },
              { label: "TDS", value: `${pipeline.tds} ppm`, color: "text-indigo-600" },
              { label: "Turbidity", value: `${pipeline.turbidity} NTU`, color: "text-amber-600" },
              { label: "pH", value: `${pipeline.ph}`, color: "text-green-600" },
              { label: "Level", value: `${scada.level.toFixed(1)}%`, color: "text-orange-500" },
            ].map((s) => (
              <div key={s.label} className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold uppercase text-slate-400">{s.label}</span>
                <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
