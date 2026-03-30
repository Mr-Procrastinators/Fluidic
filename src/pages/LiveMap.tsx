import { useEffect, useState, useRef } from "react";
import { database, ref, onValue } from "@/lib/firebase";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const LOCATIONS = [
  { id: "SP-01", name: "SP-01 (Rajpur Road)", status: "ONLINE", signal: "Signal Strong", statusColor: "bg-emerald-100 text-emerald-600", lat: 30.3199, lng: 77.9930 },
  { id: "SP-02", name: "SP-02 (Delhi Road)", status: "ONLINE", signal: "Signal Strong", statusColor: "bg-emerald-100 text-emerald-600", lat: 30.3400, lng: 77.9500 },
  { id: "SP-03", name: "SP-03 (Race Course)", status: "ONLINE", signal: "Signal Strong", statusColor: "bg-emerald-100 text-emerald-600", lat: 30.3300, lng: 77.9800 },
  { id: "SP-04", name: "SP-04 (Clement Town)", status: "ONLINE", signal: "Signal Strong", statusColor: "bg-emerald-100 text-emerald-600", lat: 30.3100, lng: 77.9400 },
  { id: "SP-05", name: "SP-05 (Ballupur)", status: "ONLINE", signal: "Signal Strong", statusColor: "bg-emerald-100 text-emerald-600", lat: 30.3500, lng: 77.9700 },
  { id: "SP-06", name: "SP-06 (Prem Nagar)", status: "ONLINE", signal: "Signal Strong", statusColor: "bg-emerald-100 text-emerald-600", lat: 30.3250, lng: 77.9600 },
  { id: "SP-07", name: "SP-07 (Chakrata Rd)", status: "ALERT", signal: "Leakage Probability High", statusColor: "bg-red-100 text-red-600", lat: 30.3050, lng: 77.9350 },
];

export default function LiveMap() {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  useEffect(() => {
    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView([30.3254, 77.9345], 13);
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Add markers for each location
      LOCATIONS.forEach((loc) => {
        const isAlert = loc.status === "ALERT";
        const iconColor = isAlert ? "red" : "green";
        const icon = L.icon({
          iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${iconColor}.png`,
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(mapRef.current!);
        marker.bindPopup(`<b>${loc.name}</b><br/>${loc.signal}`);
        markersRef.current[loc.id] = marker;
      });
    }

    // Update clock
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      };
      const clockEl = document.getElementById("real-time-clock");
      if (clockEl) clockEl.innerText = now.toLocaleString("en-US", options);
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    // Firebase sync
    const unsubscribe = onValue(ref(database, "pipeline"), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const statusEl = document.getElementById("connection-status");
        if (statusEl) {
          statusEl.innerText = "● SYSTEM ONLINE";
          statusEl.className = "text-[10px] font-bold text-emerald-400";
        }

        const nodesEl = document.getElementById("active-nodes");
        if (nodesEl) nodesEl.innerText = "7 Nodes Active";

        const signalEl = document.getElementById("signal-strength");
        if (signalEl) signalEl.innerText = "Excellent";
      }
    });

    return () => {
      clearInterval(clockInterval);
      unsubscribe();
    };
  }, []);

  const handleLocationClick = (loc: typeof LOCATIONS[0]) => {
    setSelectedLocation(loc.id);
    if (mapRef.current) {
      mapRef.current.setView([loc.lat, loc.lng], 16);
      const marker = markersRef.current[loc.id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full min-h-full">
      {/* Top stat cards */}
      <div className="grid grid-cols-12 gap-4 shrink-0">
        <div className="col-span-9 bg-white p-3 rounded-xl border flex gap-8 items-center shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-emerald-500">●</span>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase">Location</p>
              <p className="text-sm font-black">Dehradun, UK</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-500">▲</span>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase">Active Nodes</p>
              <p id="active-nodes" className="text-sm font-black">
                Scanning...
              </p>
            </div>
          </div>
          <a
            href="https://www.google.com/maps/place/Dehradun,+Uttarakhand/@30.32540262561745,77.93473309708197,11z"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto bg-emerald-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition active:scale-95"
          >
            🔄 Open in Maps
          </a>
        </div>
        <div className="col-span-3 bg-slate-800 text-white p-3 rounded-xl flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase">Signal</span>
          <span id="signal-strength" className="text-xs font-mono text-emerald-400">
            Waiting...
          </span>
        </div>
      </div>

      {/* Map and Log */}
      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden min-h-0">
        <div id="map" className="col-span-8 bg-white rounded-xl border shadow-inner relative overflow-hidden" style={{ height: "100%" }} />

        <div className="col-span-4 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest">
            🛰️ Live Tracking Log
          </div>
          <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-2">
            {LOCATIONS.map((loc) => (
              <div
                key={loc.id}
                onClick={() => handleLocationClick(loc)}
                className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${selectedLocation === loc.id ? "ring-2 ring-blue-500 shadow-md" : ""} ${loc.status === "ALERT" ? "bg-red-50 border-red-100 hover:bg-red-100" : "bg-slate-50 hover:bg-slate-100"}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-slate-800">{loc.name}</p>
                    <p className={`text-[9px] font-bold ${loc.status === "ALERT" ? "text-red-600" : "text-emerald-600"}`}>
                      {loc.signal}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap ${loc.statusColor}`}>
                    {loc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}
