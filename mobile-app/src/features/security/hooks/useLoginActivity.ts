import { useCallback, useMemo, useState } from "react";

import {
  getLoginSessions,
  logoutOtherSessions as logoutOtherSessionsApi,
  revokeLoginSession,
} from "../services/security.service";
import type { LoginSession } from "../types/security.types";

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message ||
  error?.response?.data?.error?.message ||
  error?.message ||
  fallback;

export const useLoginActivity = () => {
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mutatingSessionId, setMutatingSessionId] = useState<string | null>(null);
  const [loggingOutOthers, setLoggingOutOthers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await getLoginSessions();
      setSessions(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load sessions."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    setMutatingSessionId(sessionId);
    setError(null);
    try {
      const response = await revokeLoginSession(sessionId);
      if (!response.success) {
        return {
          success: false,
          message: response.message || "Could not revoke session.",
        };
      }
      await refetch(true);
      return {
        success: true,
        message: response.message || "Device logged out successfully.",
      };
    } catch (err) {
      return {
        success: false,
        message: getErrorMessage(err, "Could not revoke session."),
      };
    } finally {
      setMutatingSessionId(null);
    }
  }, [refetch]);

  const logoutOtherSessions = useCallback(async () => {
    setLoggingOutOthers(true);
    setError(null);
    try {
      const response = await logoutOtherSessionsApi();
      if (!response.success) {
        return {
          success: false,
          message: response.message || "Could not log out other devices.",
        };
      }
      await refetch(true);
      return {
        success: true,
        message: response.message || "All other devices have been logged out.",
      };
    } catch (err) {
      return {
        success: false,
        message: getErrorMessage(err, "Could not log out other devices."),
      };
    } finally {
      setLoggingOutOthers(false);
    }
  }, [refetch]);

  const currentSession = useMemo(() => {
    const explicitCurrent = sessions.find((session) => session.current) ?? null;
    if (explicitCurrent) return explicitCurrent;

    // Fallback: if backend cannot resolve the current token but there is only
    // one active session, treat it as current to avoid unsafe self-revoke UI.
    if (sessions.length === 1) {
      return sessions[0] ?? null;
    }

    return null;
  }, [sessions]);

  const otherSessions = useMemo(
    () =>
      sessions.filter((session) =>
        currentSession ? session.id !== currentSession.id : !session.current
      ),
    [currentSession, sessions]
  );

  return {
    sessions,
    currentSession,
    otherSessions,
    loading,
    refreshing,
    mutatingSessionId,
    loggingOutOthers,
    error,
    refetch,
    revokeSession,
    logoutOtherSessions,
  };
};
