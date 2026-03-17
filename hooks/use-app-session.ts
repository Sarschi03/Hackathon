import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";

const DEVICE_SESSION_STORAGE_KEY = "lifeline-device-session-token";
const AUTH_SESSION_STORAGE_KEY = "lifeline-auth-session-token";
const SESSION_POOL_STORAGE_KEY = "lifeline-session-token-pool";
const LEGACY_DEVICE_SESSION_STORAGE_KEY = "firstline-device-session-token";
const LEGACY_AUTH_SESSION_STORAGE_KEY = "firstline-auth-session-token";
const LEGACY_SESSION_POOL_STORAGE_KEY = "firstline-session-token-pool";

type SessionContextValue = {
  sessionToken: string | null;
  isReady: boolean;
  viewer: any;
  currentRole: "citizen" | "responder" | null;
  isAuthenticated: boolean;
};

const AppSessionContext = createContext<SessionContextValue | null>(null);

function createSessionToken(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

async function appendSessionToPool(sessionToken: string) {
  const stored =
    (await AsyncStorage.getItem(SESSION_POOL_STORAGE_KEY)) ??
    (await AsyncStorage.getItem(LEGACY_SESSION_POOL_STORAGE_KEY));
  const pool = stored ? (JSON.parse(stored) as string[]) : [];
  const nextPool = [sessionToken, ...pool.filter((token) => token !== sessionToken)].slice(0, 5);
  await AsyncStorage.setItem(SESSION_POOL_STORAGE_KEY, JSON.stringify(nextPool));
}

async function resolveSessionToken() {
  const [authToken, deviceToken, poolRaw, legacyAuthToken, legacyDeviceToken, legacyPoolRaw] = await Promise.all([
    AsyncStorage.getItem(AUTH_SESSION_STORAGE_KEY),
    AsyncStorage.getItem(DEVICE_SESSION_STORAGE_KEY),
    AsyncStorage.getItem(SESSION_POOL_STORAGE_KEY),
    AsyncStorage.getItem(LEGACY_AUTH_SESSION_STORAGE_KEY),
    AsyncStorage.getItem(LEGACY_DEVICE_SESSION_STORAGE_KEY),
    AsyncStorage.getItem(LEGACY_SESSION_POOL_STORAGE_KEY),
  ]);

  const poolSource = poolRaw ?? legacyPoolRaw;
  const pool = poolSource ? (JSON.parse(poolSource) as string[]) : [];
  const nextToken =
    authToken ??
    legacyAuthToken ??
    deviceToken ??
    legacyDeviceToken ??
    pool[0] ??
    createSessionToken("session");

  await AsyncStorage.setItem(DEVICE_SESSION_STORAGE_KEY, nextToken);
  await appendSessionToPool(nextToken);
  return nextToken;
}

export function AppSessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const initializedRef = useRef(false);
  const bootstrap = useMutation(api.session.bootstrap);
  const viewer = useQuery(
    api.session.getViewer,
    sessionToken ? { sessionToken } : "skip",
  );

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    let active = true;

    async function ensureSession() {
      const nextToken = await resolveSessionToken();
      if (!active) {
        return;
      }
      setSessionToken(nextToken);
      await bootstrap({ sessionToken: nextToken });
      if (active) {
        setIsReady(true);
      }
    }

    void ensureSession();

    return () => {
      active = false;
    };
  }, [bootstrap]);

  useEffect(() => {
    if (!sessionToken || viewer === undefined) {
      return;
    }
    const stableSessionToken = sessionToken;

    async function persistAuthenticatedSession() {
      await AsyncStorage.setItem(DEVICE_SESSION_STORAGE_KEY, stableSessionToken);
      await appendSessionToPool(stableSessionToken);
      if (viewer?.isAuthenticated) {
        await AsyncStorage.setItem(AUTH_SESSION_STORAGE_KEY, stableSessionToken);
      }
    }

    void persistAuthenticatedSession();
  }, [sessionToken, viewer]);

  const value = useMemo(
    () => ({
      sessionToken,
      isReady,
      viewer,
      currentRole: viewer?.currentRole ?? null,
      isAuthenticated: Boolean(viewer?.isAuthenticated),
    }),
    [isReady, sessionToken, viewer],
  );

  return React.createElement(AppSessionContext.Provider, { value }, children);
}

export function useAppSession() {
  const context = useContext(AppSessionContext);
  if (!context) {
    throw new Error("useAppSession must be used inside AppSessionProvider.");
  }
  return context;
}
