import { useCallback, useEffect, useMemo, useState } from 'react';
import { DAILY_RENDER_LIMIT } from '../constants/env';
import {
  backendUsageLimitClient,
  getUsageLimitClient,
  LIMIT_REACHED_CODE,
  UsageSnapshot,
} from '../services/usage-limit-client';
import { useAuth } from '../contexts/AuthContext';

const limitClient = getUsageLimitClient();

function initialSnapshot(): UsageSnapshot {
  return {
    limit: DAILY_RENDER_LIMIT,
    used: 0,
    remaining: DAILY_RENDER_LIMIT,
    resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function useUsageLimit() {
  const { user, isLoggedIn, syncCurrentUserCredit } = useAuth();
  const [snapshot, setSnapshot] = useState<UsageSnapshot>(initialSnapshot);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLimit, setUserLimit] = useState<number>(DAILY_RENDER_LIMIT);

  const refresh = useCallback(async () => {
    if (isLoggedIn && user) {
      try {
        setLoading(true);
        setError(null);
        const next = await backendUsageLimitClient.getUsage();
        setSnapshot(next);
        syncCurrentUserCredit(next.remaining);
      } catch (err: any) {
        setError(err?.message || 'Limit bilgisi alinamadi');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const next = await limitClient.getUsage();
      setSnapshot(next);
    } catch (err: any) {
      setError(err?.message || 'Limit bilgisi alinamadi');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, user, syncCurrentUserCredit]);

  const consumeOne = useCallback(async () => {
    if (isLoggedIn && user) {
      try {
        const next = await backendUsageLimitClient.consumeRender();
        setSnapshot(next);
        syncCurrentUserCredit(next.remaining);
        return { allowed: true, snapshot: next };
      } catch (err: any) {
        if (err?.code === LIMIT_REACHED_CODE || err?.response?.status === 429) {
          const latest = await backendUsageLimitClient.getUsage();
          setSnapshot(latest);
          syncCurrentUserCredit(latest.remaining);
          return { allowed: false, snapshot: latest };
        }
        throw err;
      }
    }

    try {
      const next = await limitClient.consumeRender();
      setSnapshot(next);
      return { allowed: true, snapshot: next };
    } catch (err: any) {
      if (err?.code === LIMIT_REACHED_CODE) {
        const latest = await limitClient.getUsage();
        setSnapshot(latest);
        return { allowed: false, snapshot: latest };
      }
      throw err;
    }
  }, [isLoggedIn, user, syncCurrentUserCredit]);

  useEffect(() => {
    if (isLoggedIn && user) {
      setUserLimit((prev) => (user.credit > prev ? user.credit : prev));
    } else {
      setUserLimit(DAILY_RENDER_LIMIT);
    }
  }, [isLoggedIn, user?.id, user?.credit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(() => ({
    ...snapshot,
    loading,
    error,
    isLimitReached: snapshot.remaining <= 0,
    refresh,
    consumeOne,
  }), [snapshot, loading, error, refresh, consumeOne]);
}
