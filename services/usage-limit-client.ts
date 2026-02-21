import axios from 'axios';
import { API_BASE_URL, DAILY_RENDER_LIMIT, USE_BACKEND_LIMIT } from '../constants/env';

export interface UsageSnapshot {
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
}

export interface UsageLimitClient {
  getUsage: () => Promise<UsageSnapshot>;
  consumeRender: () => Promise<UsageSnapshot>;
}

export const LIMIT_REACHED_CODE = 'LIMIT_REACHED';

export class LimitReachedError extends Error {
  code = LIMIT_REACHED_CODE;

  constructor() {
    super('Usage limit reached');
  }
}

let mockUsedCount = 0;

function normalizeSnapshot(input: any): UsageSnapshot {
  const limit = Number(input?.limit ?? DAILY_RENDER_LIMIT);
  const used = Number(input?.used ?? 0);
  const remainingFromApi = Number(input?.remaining);
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : DAILY_RENDER_LIMIT;
  const safeUsed = Number.isFinite(used) && used >= 0 ? Math.floor(used) : 0;
  const safeRemaining = Number.isFinite(remainingFromApi)
    ? Math.max(Math.floor(remainingFromApi), 0)
    : Math.max(safeLimit - safeUsed, 0);

  return {
    limit: safeLimit,
    used: Math.min(safeUsed, safeLimit),
    remaining: safeRemaining,
    resetAt: input?.resetAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

function toMockSnapshot(): UsageSnapshot {
  return normalizeSnapshot({
    limit: DAILY_RENDER_LIMIT,
    used: mockUsedCount,
  });
}

export const mockUsageLimitClient: UsageLimitClient = {
  async getUsage() {
    return toMockSnapshot();
  },
  async consumeRender() {
    if (mockUsedCount >= DAILY_RENDER_LIMIT) {
      throw new LimitReachedError();
    }
    mockUsedCount += 1;
    return toMockSnapshot();
  },
};

export const backendUsageLimitClient: UsageLimitClient = {
  async getUsage() {
    const response = await axios.get(`${API_BASE_URL}/api/usage`);
    return normalizeSnapshot(response.data);
  },
  async consumeRender() {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/usage/consume`, {
        type: 'render',
        amount: 1,
      });
      return normalizeSnapshot(response.data);
    } catch (error: any) {
      const status = error?.response?.status;
      const code = error?.response?.data?.code;
      if (status === 429 || code === LIMIT_REACHED_CODE) {
        throw new LimitReachedError();
      }
      throw error;
    }
  },
};

export function getUsageLimitClient() {
  return USE_BACKEND_LIMIT ? backendUsageLimitClient : mockUsageLimitClient;
}
