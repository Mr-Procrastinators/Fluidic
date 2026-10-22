export interface GAVMDResult {
  status: "LEAK" | "NORMAL";
  location_m: number;
  latitude: number;
  longitude: number;
  flow: number;
  pressure_pa: number | null;
  timestamp: number;
}

export const normalizeGAVMDResult = (payload: unknown): GAVMDResult | null => {
  if (!payload || typeof payload !== "object") return null;

  const source = payload as Record<string, unknown>;
  const status = typeof source.status === "string" ? source.status.toUpperCase() : "";
  if (status !== "LEAK" && status !== "NORMAL") return null;

  const toFiniteNumber = (value: unknown, fallback: number) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };

  const pressure = Number(source.pressure_pa);

  return {
    status,
    location_m: toFiniteNumber(source.location_m, 0),
    latitude: toFiniteNumber(source.latitude, 0),
    longitude: toFiniteNumber(source.longitude, 0),
    flow: toFiniteNumber(source.flow, 0),
    pressure_pa: Number.isFinite(pressure) ? pressure : null,
    timestamp: toFiniteNumber(source.timestamp, Date.now() / 1000),
  };
};
