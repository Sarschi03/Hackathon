// @ts-nocheck
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";

const SESSION_STORAGE_KEY = "firstline-session-token";

const AppSessionContext = createContext(null);

function createSessionToken() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function AppSessionProvider(props) {
  const { children } = props;
  const [sessionToken, setSessionToken] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const bootstrap = useMutation(api.session.bootstrap);
  const viewer = useQuery(
    api.session.getViewer,
    sessionToken ? { sessionToken } : "skip",
  );

  useEffect(() => {
    let active = true;

    async function ensureSession() {
      const stored = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      const nextToken = stored ?? createSessionToken();
      if (!stored) {
        await AsyncStorage.setItem(SESSION_STORAGE_KEY, nextToken);
      }
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
