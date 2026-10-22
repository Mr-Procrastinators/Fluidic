import { useState, useEffect } from "react";
import { database, ref, onValue } from "@/lib/firebase";
import { normalizeGAVMDResult, type GAVMDResult } from "@/lib/gavmd";

export interface ScadaData {
  flow1: number;
  flow2: number;
  level: number;
  pump: number;
  mode: string;
  pressure: number;
  valve?: number;
}

export interface PipelineData {
  tds: number;
  turbidity: number;
  ph: number;
}

export interface AlertItem {
  id?: string;
  timestamp: string;
  type: string;
  severity: string;
  status: string;
}

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const isScadaPayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return false;
  const source = payload as Record<string, unknown>;
  return ["flow1", "flow2", "level", "pressure", "pump", "mode", "valve"].some((key) => key in source);
};

const isPipelinePayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return false;
  const source = payload as Record<string, unknown>;
  return ["tds", "turbidity", "ph"].some((key) => key in source);
};

const normalizeScada = (payload: any): ScadaData => {
  const source = payload && typeof payload === "object" ? payload : {};

  return {
    flow1: toNumber(source.flow1 ?? source.inletFlow, 0),
    flow2: toNumber(source.flow2 ?? source.outletFlow, 0),
    level: toNumber(source.level, 0),
    pump: toNumber(source.pump, 0),
    mode: typeof source.mode === "string" ? source.mode : "AUTO",
    pressure: toNumber(source.pressure, 0),
    valve: toNumber(source.valve, 0),
  };
};

const normalizePipeline = (payload: any): PipelineData => {
  const source = payload && typeof payload === "object" ? payload : {};

  return {
    tds: toNumber(source.tds, 0),
    turbidity: toNumber(source.turbidity, 0),
    ph: toNumber(source.ph, 0),
  };
};

export function useScadaData() {
  const defaultData: ScadaData = {
    flow1: 0,
    flow2: 0,
    level: 0,
    pump: 0,
    mode: "AUTO",
    pressure: 0,
    valve: 0,
  };

  const [data, setData] = useState<ScadaData>(defaultData);

  useEffect(() => {
    try {
      const branches = ["SCADA_DATA", "scada_data", "scada"];
      const unsubscribers = branches.map((branch) => {
        const dbRef = ref(database, branch);

        return onValue(
          dbRef,
          (snapshot) => {
            if (!snapshot.exists()) return;

            const firebaseData = snapshot.val();
            if (!isScadaPayload(firebaseData)) return;

            const nextData = normalizeScada(firebaseData);
            setData({ ...defaultData, ...nextData });
          },
          (error) => {
            console.error(`Firebase ${branch} error:`, error);
          }
        );
      });

      return () => {
        unsubscribers.forEach((unsub) => unsub());
      };
    } catch (error) {
      console.error("useScadaData setup error:", error);
      setData(defaultData);
      return undefined;
    }
  }, []);

  return data;
}

export function useGAVMDResult() {
  const [result, setResult] = useState<GAVMDResult | null>(null);

  useEffect(() => {
    const resultsByPath = new Map<string, GAVMDResult>();
    const paths = ["results", "gavmd_result"];
    const unsubscribers = paths.map((path) =>
      onValue(
        ref(database, path),
        (snapshot) => {
          if (!snapshot.exists()) {
            resultsByPath.delete(path);
          } else {
            const nextResult = normalizeGAVMDResult(snapshot.val());
            if (nextResult) resultsByPath.set(path, nextResult);
          }

          const latest = [...resultsByPath.entries()].sort(
            ([pathA, resultA], [pathB, resultB]) =>
              resultB.timestamp - resultA.timestamp ||
              (pathA === "results" ? -1 : pathB === "results" ? 1 : 0)
          )[0]?.[1] ?? null;
          setResult(latest);
        },
        (error) => {
          console.error(`Firebase ${path} error:`, error);
        }
      )
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  return result;
}

export function usePipelineData() {
  const defaultData: PipelineData = { tds: 0, turbidity: 0, ph: 0 };
  const [data, setData] = useState<PipelineData>(defaultData);

  useEffect(() => {
    try {
      const branches = ["pipeline", "water_quality", "pipeline_data"];
      const unsubscribers = branches.map((branch) => {
        const dbRef = ref(database, branch);

        return onValue(
          dbRef,
          (snapshot) => {
            if (!snapshot.exists()) return;

            const firebaseData = snapshot.val();
            if (!isPipelinePayload(firebaseData)) return;

            const nextData = normalizePipeline(firebaseData);
            setData({ ...defaultData, ...nextData });
          },
          (error) => {
            console.error(`Firebase ${branch} error:`, error);
          }
        );
      });

      return () => {
        unsubscribers.forEach((unsub) => unsub());
      };
    } catch (error) {
      console.error("usePipelineData setup error:", error);
      setData(defaultData);
      return undefined;
    }
  }, []);

  return data;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    const branches = ["alerts", "faults"];
    const unsubscribers = branches.map((branch) => {
      const dbRef = ref(database, branch);

      return onValue(dbRef, (snapshot) => {
        if (!snapshot.exists()) return;

        const val = snapshot.val();
        const arr = Array.isArray(val) ? val : Object.values(val ?? {});
        setAlerts(arr as AlertItem[]);
      });
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  return alerts;
}
