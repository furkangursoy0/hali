import { useCallback, useEffect, useMemo, useState } from 'react';
import { DAILY_RENDER_LIMIT } from '../constants/env';
import { getUsageLimitClient, LIMIT_REACHED_CODE, UsageSnapshot } from '../services/usage-limit-client';
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
  const { user, isLoggedIn, consumeCurrentUserCredit } = useAuth();
  const [snapshot, setSnapshot] = useState<UsageSnapshot>(initialSnapshot);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLimit, setUserLimit] = useState<number>(DAILY_RENDER_LIMIT);

  const refresh = useCallback(async () => {
    if (isLoggedIn && user) {
      const limit = Math.max(userLimit, user.credit);
      setSnapshot({
        limit,
        used: Math.max(limit - user.credit, 0),
        remaining: user.credit,
        resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      setLoading(false);
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
  }, [isLoggedIn, user, userLimit]);

  const consumeOne = useCallback(async () => {
    if (isLoggedIn && user) {
      const consumed = consumeCurrentUserCredit(1);
      if (!consumed.ok) {
        const latest = {
          limit: userLimit,
          used: Math.max(userLimit - user.credit, 0),
          remaining: user.credit,
          resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        setSnapshot(latest);
        return { allowed: false, snapshot: latest };
      }

      const next = {
        limit: userLimit,
        used: Math.max(userLimit - consumed.remaining, 0),
        remaining: consumed.remaining,
        resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      setSnapshot(next);
      return { allowed: true, snapshot: next };
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
  }, [isLoggedIn, user, userLimit, consumeCurrentUserCredit]);

  useEffect(() => {
    if (isLoggedIn && user) {
      setUserLimit((prev) => {
        if (prev === DAILY_RENDER_LIMIT || user.credit > prev) {
          return user.credit;
        }
        return prev;
      });
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
