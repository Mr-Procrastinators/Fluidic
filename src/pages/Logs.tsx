import { useEffect, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { database, ref, onValue } from "@/lib/firebase";
import { normalizeGAVMDResult, type GAVMDResult } from "@/lib/gavmd";

interface LogEntry {
  id: string;
  result: GAVMDResult;
  createdAt: Date;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [latestResult, setLatestResult] = useState<GAVMDResult | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const paths = ["results", "gavmd_result"];
    const unsubscribers = paths.map((path) => {
      const dbRef = ref(database, path);
      return onValue(dbRef, (snapshot) => {
        if (!snapshot.exists()) return;

        const result = normalizeGAVMDResult(snapshot.val());
        if (!result) return;

        setLatestResult((previous) =>
          !previous || result.timestamp >= previous.timestamp ? result : previous
        );

        const newLog: LogEntry = {
          id: `${result.timestamp}-${result.status}-${result.flow}-${result.pressure_pa ?? ""}`,
          result,
          createdAt: new Date(result.timestamp * 1000),
        };

        setLogs((prev) => [newLog, ...prev.filter((log) => log.id !== newLog.id)].slice(0, 100));
      }, (error) => {
        console.error(`Firebase ${path} error:`, error);
      });
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const exportPdfForm = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText("Fluidic Leak Detection Report", {
      x: 50,
      y: 790,
      size: 22,
      font: bold,
      color: rgb(0.1, 0.2, 0.35),
    });

    const statusText = latestResult?.status === "LEAK" ? "LEAK DETECTED" : "NORMAL";
    const statusColor = latestResult?.status === "LEAK" ? rgb(0.8, 0.1, 0.2) : rgb(0.12, 0.55, 0.3);

    page.drawText("Status:", {
      x: 50,
      y: 740,
      size: 14,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(statusText, {
      x: 140,
      y: 740,
      size: 16,
      font: bold,
      color: statusColor,
    });

    page.drawText(`Flow: ${latestResult ? latestResult.flow.toFixed(2) : "0.00"} L/min`, {
      x: 50,
      y: 700,
      size: 14,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Distance: ${latestResult ? latestResult.location_m.toFixed(1) : "0.0"} meters`, {
      x: 50,
      y: 670,
      size: 14,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    const pressureBar = latestResult?.pressure_pa == null
      ? "Not available"
      : `${(latestResult.pressure_pa / 100000).toFixed(5)} bar`;
    page.drawText(`Calculated pressure: ${pressureBar}`, {
      x: 50,
      y: 610,
      size: 14,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Coordinates: ${latestResult ? latestResult.latitude.toFixed(4) : "0.0000"}°, ${latestResult ? latestResult.longitude.toFixed(4) : "0.0000"}°`, {
      x: 50,
      y: 580,
      size: 14,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    const timestamp = latestResult ? new Date(latestResult.timestamp * 1000).toLocaleString() : new Date().toLocaleString();
    page.drawText(`Timestamp: ${timestamp}`, {
      x: 50,
      y: 550,
      size: 12,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    const statusField = pdfDoc.createTextField("statusField");
    statusField.setText(statusText);
    statusField.setPosition(230, 735, 0);
    statusField.setSize(200, 20);

    const flowField = pdfDoc.createTextField("flowField");
    flowField.setText(latestResult ? `${latestResult.flow.toFixed(2)} L/min` : "0.00 L/min");
    flowField.setPosition(230, 695, 0);
    flowField.setSize(200, 20);

    const distanceField = pdfDoc.createTextField("distanceField");
    distanceField.setText(latestResult ? `${latestResult.location_m.toFixed(1)} meters` : "0.0 meters");
    distanceField.setPosition(230, 655, 0);
    distanceField.setSize(200, 20);

    const timestampField = pdfDoc.createTextField("timestampField");
    timestampField.setText(timestamp);
    timestampField.setPosition(230, 555, 0);
    timestampField.setSize(250, 20);

    const faultField = pdfDoc.createCheckBox("faultField");
    if (latestResult?.status === "LEAK") faultField.check();
    faultField.setPosition(50, 520, 0);
    faultField.setSize(15, 15);

    page.drawText("Fault detected", {
      x: 75,
      y: 521,
      size: 12,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fluidic-leak-report.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusStyles = (status: string) => {
    if (status === "LEAK") {
      return "bg-red-100 border-red-300 text-red-700";
    }
    return "bg-emerald-100 border-emerald-300 text-emerald-700";
  };

  const getStatusIcon = (status: string) => {
    return status === "LEAK" ? "🚨" : "✓";
  };

  const isResultFresh = !!latestResult && Math.abs(now / 1000 - latestResult.timestamp) < 60;

  return (
    <div className="w-full">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={exportPdfForm}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-slate-700"
          >
            Export PDF Form
          </button>
        </div>

        {latestResult && isResultFresh ? (
          <div className={`rounded-3xl shadow-xl border p-8 lg:p-12 text-center transition-all ${getStatusStyles(latestResult.status)}`}>
            <div className="text-7xl mb-4">{getStatusIcon(latestResult.status)}</div>
            <div className="uppercase tracking-[0.3em] text-[10px] font-bold mb-3">Current System Status</div>
            <div className="text-3xl lg:text-4xl font-black mb-2">
              {latestResult.status === "LEAK" ? "⚠️ LEAK DETECTED" : "✓ System Normal"}
            </div>
            {latestResult.status === "LEAK" && (
              <div className="text-lg font-bold mt-4">
                Location: {latestResult.location_m.toFixed(2)} m | Lat: {latestResult.latitude.toFixed(4)}°, Lon: {latestResult.longitude.toFixed(4)}°
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

        {latestResult && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
              <div className="text-sm font-bold text-slate-400 uppercase">Calculated Pressure</div>
              <div className="text-xl font-black mt-1 text-emerald-600">
                {latestResult.pressure_pa == null ? "N/A" : (latestResult.pressure_pa / 100000).toFixed(5)}
              </div>
              <div className="text-[9px] text-slate-400">bar</div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 text-center">
              <div className="text-sm font-bold text-slate-400 uppercase">Monitoring</div>
              <div className={`text-lg font-black mt-1 ${isResultFresh ? "text-emerald-600" : "text-slate-400"}`}>
                {isResultFresh ? "🟢 LIVE" : "⚪ IDLE"}
              </div>
            </div>
          </div>
        )}

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
                    <th className="text-left p-3 font-bold text-slate-600 text-[10px]">Pressure (bar)</th>
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
                      <td className="p-3 font-bold text-emerald-600 text-[10px]">
                        {log.result.pressure_pa == null ? "N/A" : (log.result.pressure_pa / 100000).toFixed(5)}
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
