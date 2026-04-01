"use client";

import { useCallback, useEffect, useState } from "react";

export type AdminSession = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    adminProfile?: {
      id: string;
      userId: string;
      title?: string | null;
      isSuperAdmin?: boolean;
    } | null;
  };
};

const storageKey = "bitehub_admin_session";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (currentPath.startsWith("/login")) {
    return;
  }

  window.location.replace("/login");
}

function isAuthExpiryMessage(message?: string | null) {
  const normalized = String(message ?? "").toLowerCase();
  return (
    normalized.includes("session is invalid") ||
    normalized.includes("session has expired") ||
    normalized.includes("please sign in again") ||
    normalized.includes("token expired") ||
    normalized.includes("invalid token") ||
    normalized.includes("jwt expired") ||
    normalized.includes("unauthorized")
  );
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function saveAdminSession(session: AdminSession) {
  window.localStorage.setItem(storageKey, JSON.stringify(session));
}

export function clearAdminSession() {
  window.localStorage.removeItem(storageKey);
}

async function refreshAdminSession(session: AdminSession) {
  const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Session refresh failed.");
  }

  const payload = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
  };

  const nextSession: AdminSession = {
    ...session,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken
  };

  saveAdminSession(nextSession);
  return nextSession;
}

export async function adminRequest<T>(path: string, init: RequestInit = {}) {
  let session = getAdminSession();

  if (!session?.accessToken) {
    clearAdminSession();
    redirectToLogin();
    throw new Error("Please sign in as an admin to continue.");
  }

  const send = async (accessToken: string) =>
    fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(init.headers ?? {})
      },
      cache: "no-store"
    });

  let response = await send(session.accessToken);

  if ((response.status === 401 || response.status === 403) && session.refreshToken) {
    try {
      session = await refreshAdminSession(session);
      response = await send(session.accessToken);
    } catch {
      clearAdminSession();
      redirectToLogin();
      throw new Error("Your session has expired. Please sign in again.");
    }
  }

  if (!response.ok) {
    const fallbackMessage = "Unable to load data right now.";
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    const message = payload?.message ?? fallbackMessage;

    if (response.status === 401 || response.status === 403 || isAuthExpiryMessage(message)) {
      clearAdminSession();
      redirectToLogin();
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export function useAdminSessionState() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(getAdminSession());
    setReady(true);
  }, []);

  return { session, ready, setSession };
}

export function useAdminData<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loader();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
