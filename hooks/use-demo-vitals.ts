import { useEffect, useMemo, useRef, useState } from "react";

type DemoVitalsOptions = {
  baselineHeartRate?: number | null;
  baselineBloodOxygen?: number | null;
};

export type DemoVitalsState = {
  heartRate: number;
  bloodOxygen: number;
  respiratoryRate: number;
  systolic: number;
  diastolic: number;
  ekgSeed: number;
  statusLabel: string;
  lastUpdatedAt: number;
};

function jitter(value: number, spread: number, min: number, max: number) {
  const delta = Math.round((Math.random() - 0.5) * spread * 2);
  return Math.max(min, Math.min(max, value + delta));
}

export function useDemoVitals(options: DemoVitalsOptions = {}): DemoVitalsState {
  const [tick, setTick] = useState(0);
  const latest = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      latest.current = Date.now();
      setTick((current) => current + 1);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    const baseHeartRate = options.baselineHeartRate ?? 96;
    const baseBloodOxygen = options.baselineBloodOxygen ?? 98;
    const heartRate = jitter(baseHeartRate, 5, 84, 118);
    const bloodOxygen = jitter(baseBloodOxygen, 1, 95, 100);
    const respiratoryRate = jitter(16, 2, 12, 22);
    const systolic = jitter(118, 4, 104, 132);
    const diastolic = jitter(74, 3, 64, 86);

    return {
      heartRate,
      bloodOxygen,
      respiratoryRate,
      systolic,
      diastolic,
      ekgSeed: tick,
      statusLabel: heartRate > 108 ? "Elevated pulse" : "Stable live feed",
      lastUpdatedAt: latest.current,
    };
  }, [options.baselineBloodOxygen, options.baselineHeartRate, tick]);
}
