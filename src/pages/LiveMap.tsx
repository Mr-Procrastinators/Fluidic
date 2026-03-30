import { useScadaData, usePipelineData } from "@/hooks/useFirebaseData";
import { useState } from "react";

const nodes = [
  { id: "N1", name: "Inlet Sensor", x: 10, y: 40, type: "inlet" },
  { id: "N2", name: "Pump Station P1", x: 30, y: 40, type: "pump" },
  { id: "N3", name: "Junction A", x: 50, y: 25, type: "junction" },
  { id: "N4", name: "Treatment Plant", x: 50, y: 55, type: "treatment" },
  { id: "N5", name: "Storage Tank", x: 70, y: 40, type: "storage" },
  { id: "N6", name: "Outlet Sensor", x: 90, y: 40, type: "outlet" },
];

const pipes = [
  { from: "N1", to: "N2" }, { from: "N2", to: "N3" }, { from: "N2", to: "N4" },
  { from: "N3", to: "N5" }, { from: "N4", to: "N5" }, { from: "N5", to: "N6" },
];

export default function LiveMap() {
  const scada = useScadaData();
  const pipeline = usePipelineData();
  const [selected, setSelected] = useState<string | null>(null);

  const getNodeColor = (id: string) => {
    if (id === "N2" && scada.pump === 0) return "#ef4444";
    if (scada.level < 20 && id === "N5") return "#f59e0b";
    return "#22c55e";
  };

  const selectedNode = nodes.find((n) => n.id === selected);

  const getSensorData = (id: string) => {
    switch (id) {
      case "N1": return [{ label: "Inlet Flow", value: `${scada.flow1.toFixed(1)} L/min` }];
      case "N2": return [{ label: "Pump", value: scada.pump ? "RUNNING" : "STOPPED" }, { label: "Pressure", value: `${scada.pressure.toFixed(1)} bar` }];
      case "N3": return [{ label: "TDS", value: `${pipeline.tds} ppm` }, { label: "pH", value: `${pipeline.ph}` }];
      case "N4": return [{ label: "Turbidity", value: `${pipeline.turbidity} NTU` }, { label: "TDS", value: `${pipeline.tds} ppm` }];
      case "N5": return [{ label: "Level", value: `${scada.level.toFixed(1)}%` }];
      case "N6": return [{ label: "Outlet Flow", value: `${scada.flow2.toFixed(1)} L/min` }];
      default: return [];
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-3.5 py-2 text-white uppercase text-[0.7rem] font-bold tracking-[0.05em]" style={{ backgroundColor: "#1a2c42" }}>
          Pipeline Network Schematic
        </div>
        <div className="p-4">
          <svg viewBox="0 0 100 70" className="w-full h-auto" style={{ minHeight: 350 }}>
            <rect width="100" height="70" fill="#f8fafc" rx="2" />
            {pipes.map((p, i) => {
              const from = nodes.find((n) => n.id === p.from)!;
              const to = nodes.find((n) => n.id === p.to)!;
              return <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="1,0.5" />;
            })}
            {nodes.map((node) => (
              <g key={node.id} onClick={() => setSelected(node.id)} className="cursor-pointer">
                <circle cx={node.x} cy={node.y} r="3" fill={getNodeColor(node.id)} stroke="white" strokeWidth="0.5" />
                {selected === node.id && <circle cx={node.x} cy={node.y} r="4.5" fill="none" stroke={getNodeColor(node.id)} strokeWidth="0.3" opacity="0.5" />}
                <text x={node.x} y={node.y - 5} textAnchor="middle" fill="#475569" fontSize="2.2" fontWeight="bold">{node.name}</text>
                <text x={node.x} y={node.y + 6} textAnchor="middle" fill="#94a3b8" fontSize="1.8">{node.id}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-3.5 py-2 text-white uppercase text-[0.7rem] font-bold tracking-[0.05em]" style={{ backgroundColor: "#1a2c42" }}>
          Node Details
        </div>
        <div className="p-4">
          {!selectedNode ? (
            <p className="text-slate-400 text-sm">Click a node on the map to view details</p>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getNodeColor(selectedNode.id) }} />
                <div>
                  <div className="font-bold text-sm">{selectedNode.name}</div>
                  <div className="text-[10px] text-slate-400 uppercase">{selectedNode.id} — {selectedNode.type}</div>
                </div>
              </div>
              <div className="space-y-3">
                {getSensorData(selectedNode.id).map((s, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">{s.label}</span>
                    <span className="text-sm font-black">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
