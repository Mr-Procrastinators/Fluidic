import { useEffect, useState } from "react";
import { database, ref, onValue } from "@/lib/firebase";

interface GAVMDResult {
  status: "LEAK" | "NORMAL";
  location_m: number;
  latitude: number;
  longitude: number;
  flow: number;
  timestamp: number;
}

interface LogEntry {
  id: string;
  result: GAVMDResult;
  createdAt: Date;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [latestResult, setLatestResult] = useState<GAVMDResult | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const resultsRef = ref(database, "results");
    
    const unsubscribe = onValue(resultsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLatestResult(data);
        setIsMonitoring(true);

        // Add to logs with timestamp
        const newLog: LogEntry = {
          id: Date.now().toString(),
          result: data,
          createdAt: new Date(),
        };

        setLogs((prev) => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
      }
    });

    return () => unsubscribe();
  }, []);

  const getStatusStyles = (status: string) => {
    if (status === "LEAK") {
      return "bg-red-100 border-red-300 text-red-700";
    }
    return "bg-emerald-100 border-emerald-300 text-emerald-700";
  };

  const getStatusIcon = (status: string) => {
    return status === "LEAK" ? "🚨" : "✓";
  };

  const isResultFresh = !!latestResult && Math.abs(now/1000 - latestResult.timestamp) < 12;
  const realtimeResult = isResultFresh ? latestResult : null;

  return (
    <div className="w-full">
      <div className="space-y-6">
        {/* Hero card - Latest Result */}
        {latestResult && isResultFresh ? (
          <div
            className={`rounded-3xl shadow-xl border p-8 lg:p-12 text-center transition-all ${getStatusStyles(latestResult.status)}`}
          >
            <div className="text-7xl mb-4">{getStatusIcon(latestResult.status)}</div>
            <div className="uppercase tracking-[0.3em] text-[10px] font-bold mb-3">
              Current System Status
            </div>
            <div className="text-3xl lg:text-4xl font-black mb-2">
              {latestResult.status === "LEAK" ? "⚠️ LEAK DETECTED" : "✓ System Normal"}
            </div>
            {latestResult.status === "LEAK" && (
              <div className="text-lg font-bold mt-4">
                Location: {latestResult.location_m.toFixed(2)} m | LLat: {latestResult.latitude.toFixed(4)}°, Lon: {latestResult.longitude.toFixed(4)}°
              </div>
            )}
            <p className="text-sm opacity-80 mt-4">
              Flow: {latestResult.flow.toFixed(2)} L/min | {new Date(latestResult.timestamp * 1000).toLocaleString()}
            </p>
          </div>
        ) : latestResult && !isResultFresh ? (
          <div className="bg-yellow-100 rounded-3xl shadow-xl border border-yellow-300 p-8 lg:p-12 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <div className="text-xl font-black text-yellow-900">Stale GA-VMD result</div>
            <p className="text-slate-500 text-sm mt-2">
              Sensor data is stale or ESP32 is disconnected. Waiting for a fresh reading...
            </p>
          </div>
        ) : (
          <div className="bg-slate-100 rounded-3xl shadow-xl border border-slate-300 p-8 lg:p-12 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <div className="text-xl font-black text-slate-600">Waiting for GA-VMD Analysis...</div>
            <p className="text-slate-500 text-sm mt-2">
              The GA-VMD algorithm is running and will display results here.
            </p>
          </div>
        )}

        {/* Analysis Metrics */}
        {latestResult && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 text-center">
              <div className="text-sm font-bold text-slate-400 uppercase">Status</div>
              <div className={`text-xl font-black mt-1 ${latestResult.status === "LEAK" ? "text-red-600" : "text-emerald-600"}`}>
                {latestResult.status}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 text-center">
              <div className="text-sm font-bold text-slate-400 uppercase">Flow</div>
              <div className="text-xl font-black mt-1 text-blue-600">
                {latestResult.flow.toFixed(2)}
              </div>
              <div className="text-[9px] text-slate-400">L/min</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 text-center">
              <div className="text-sm font-bold text-slate-400 uppercase">Distance</div>
              <div className="text-xl font-black mt-1 text-indigo-600">
                {latestResult.location_m.toFixed(1)}
              </div>
              <div className="text-[9px] text-slate-400">meters</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 text-center">
              <div className="text-sm font-bold text-slate-400 uppercase">Status</div>
              <div className={`text-lg font-black mt-1 ${isMonitoring ? "text-emerald-600" : "text-slate-400"}`}>
                {isMonitoring ? "🟢 LIVE" : "⚪ IDLE"}
              </div>
            </div>
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest">
            📋 Detection Logs (GA-VMD)
          </div>

          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-bold text-slate-600 text-[10px]">Time</th>
                    <th className="text-left p-3 font-bold text-slate-600 text-[10px]">Status</th>
                    <th className="text-left p-3 font-bold text-slate-600 text-[10px]">Flow (L/min)</th>
                    <th className="text-left p-3 font-bold text-slate-600 text-[10px]">Location (m)</th>
                    <th className="text-left p-3 font-bold text-slate-600 text-[10px]">Coordinates</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className={`border-b transition-colors ${log.result.status === "LEAK" ? "bg-red-50 hover:bg-red-100" : "bg-slate-50 hover:bg-slate-100"}`}
                    >
                      <td className="p-3 font-mono text-[9px] text-slate-600">
                        {log.createdAt.toLocaleTimeString()}
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap ${log.result.status === "LEAK" ? "bg-red-200 text-red-700" : "bg-emerald-200 text-emerald-700"}`}>
                          {log.result.status === "LEAK" ? "🚨 LEAK" : "✓ NORMAL"}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-blue-600 text-[10px]">
                        {log.result.flow.toFixed(2)}
                      </td>
                      <td className="p-3 font-bold text-indigo-600 text-[10px]">
                        {log.result.location_m.toFixed(1)}
                      </td>
                      <td className="p-3 text-[9px] text-slate-600 font-mono">
                        {log.result.latitude.toFixed(4)}°, {log.result.longitude.toFixed(4)}°
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              <p className="text-sm">No logs yet. GA-VMD results will appear here.</p>
            </div>
          )}
        </div>

        <p className="text-[9px] text-slate-400 text-center uppercase">
          GA-VMD Algorithm: Genetic Algorithm + Variational Mode Decomposition for Leak Detection
        </p>
      </div>
    </div>
  );
}

