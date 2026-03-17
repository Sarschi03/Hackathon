import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

export type HealthConnectState = {
  /** Latest heart rate in BPM, or null when unavailable */
  heartRate: number | null;
  /** Latest SpO2 percentage, or null when unavailable */
  bloodOxygen: number | null;
  /** Whether Health Connect is available on this device */
  isAvailable: boolean;
  /** True while the first read is in-flight */
  isLoading: boolean;
  /** ISO timestamp of the last successful read */
  lastUpdated: Date | null;
  /** Opens Health Connect permission settings */
  openSettings: () => void;
};

const POLL_INTERVAL_MS = 5_000;

export function useHealthConnect(): HealthConnectState {
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [bloodOxygen, setBloodOxygen] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const permissionsGranted = useRef(false);

  const fetchVitals = useCallback(async () => {
    try {
      // Query the last 24 hours of data
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1_000);
      const timeRangeFilter = {
        operator: 'between' as const,
        startTime: dayAgo.toISOString(),
        endTime: now.toISOString(),
      };

      const [hrResult, spo2Result] = await Promise.allSettled([
        readRecords('HeartRate', { timeRangeFilter, ascendingOrder: false, pageSize: 1 }),
        readRecords('OxygenSaturation', { timeRangeFilter, ascendingOrder: false, pageSize: 1 }),
      ]);

      if (hrResult.status === 'fulfilled') {
        const records = hrResult.value.records;
        if (records.length > 0) {
          // HeartRate record contains samples array; grab the last sample's bpm
          const lastRecord = records[0];
          const samples = (lastRecord as any).samples ?? [];
          if (samples.length > 0) {
            const bpm = samples[samples.length - 1].beatsPerMinute;
            setHeartRate(Math.round(bpm));
          } else {
            // Some implementations store bpm directly
            const bpm = (lastRecord as any).beatsPerMinute;
            if (bpm != null) setHeartRate(Math.round(bpm));
          }
        }
      }

      if (spo2Result.status === 'fulfilled') {
        const records = spo2Result.value.records;
        if (records.length > 0) {
          const pct = (records[0] as any).percentage?.value ?? (records[0] as any).percentage;
          if (pct != null) setBloodOxygen(Math.round(pct));
        }
      }

      setLastUpdated(new Date());
    } catch {
      // Silently swallow — permissions may have been revoked mid-session
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setup = useCallback(async () => {
    try {
      const status = await getSdkStatus();
      if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        setIsAvailable(false);
        setIsLoading(false);
        return;
      }

      setIsAvailable(true);
      await initialize();

      const granted = await requestPermission([
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'OxygenSaturation' },
      ]);

      permissionsGranted.current = granted.length > 0;

      if (permissionsGranted.current) {
        await fetchVitals();
        intervalRef.current = setInterval(() => {
          void fetchVitals();
        }, POLL_INTERVAL_MS);
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsAvailable(false);
      setIsLoading(false);
    }
  }, [fetchVitals]);

  useEffect(() => {
    void setup();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [setup]);

  return {
    heartRate,
    bloodOxygen,
    isAvailable,
    isLoading,
    lastUpdated,
    openSettings: openHealthConnectSettings,
  };
}
