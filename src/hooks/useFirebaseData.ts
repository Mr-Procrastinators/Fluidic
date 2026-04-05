import { useState, useEffect } from "react";
import { database, ref, onValue } from "@/lib/firebase";

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

export function useScadaData() {
  const defaultData: ScadaData = {
    flow1: 0, flow2: 0, level: 0, pump: 0, mode: "AUTO", pressure: 0, valve: 0,
  };
  const [data, setData] = useState<ScadaData>(defaultData);

  useEffect(() => {
    try {
      const dbRef = ref(database, "SCADA_DATA");
      const unsub = onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
          const firebaseData = snapshot.val();
          // Always merge with defaults to ensure no undefined values
          setData({ ...defaultData, ...firebaseData });
        } else {
          setData(defaultData);
        }
      }, (error) => {
        console.error("Firebase SCADA_DATA error:", error);
        setData(defaultData);
      });
      return () => unsub();
    } catch (error) {
      console.error("useScadaData setup error:", error);
      setData(defaultData);
    }
  }, []);

  return data;
}

export function usePipelineData() {
  const defaultData: PipelineData = { tds: 0, turbidity: 0, ph: 0 };
  const [data, setData] = useState<PipelineData>(defaultData);

  useEffect(() => {
    try {
      const dbRef = ref(database, "gavmd_result");
      const unsub = onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
          const firebaseData = snapshot.val();
          // Always merge with defaults to ensure no undefined values
          setData({ ...defaultData, ...firebaseData });
        } else {
          setData(defaultData);
        }
      }, (error) => {
        console.error("Firebase pipeline error:", error);
        setData(defaultData);
      });
      return () => unsub();
    } catch (error) {
      console.error("usePipelineData setup error:", error);
      setData(defaultData);
    }
  }, []);

  return data;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    const dbRef = ref(database, "alerts");
    const unsub = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const arr = Array.isArray(val) ? val : Object.values(val);
        setAlerts(arr as AlertItem[]);
      }
    });
    return () => unsub();
  }, []);

  return alerts;
}
