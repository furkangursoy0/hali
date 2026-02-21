export type AppEnv = 'development' | 'staging' | 'production';

function resolveAppEnv(value: string | undefined): AppEnv {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'production' || normalized === 'staging' || normalized === 'development') {
    return normalized;
  }
  return 'development';
}

export const APP_ENV: AppEnv = resolveAppEnv(process.env.EXPO_PUBLIC_APP_ENV);

const DEFAULT_API_BASE_URL_BY_ENV: Record<AppEnv, string> = {
  development: 'http://localhost:8787',
  staging: 'https://staging-api.haliai.com',
  production: 'https://api.haliai.com',
};

const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
export const API_BASE_URL = (rawApiBaseUrl || DEFAULT_API_BASE_URL_BY_ENV[APP_ENV]).replace(/\/$/, '');

const rawDailyRenderLimit = Number(process.env.EXPO_PUBLIC_DAILY_RENDER_LIMIT || 20);
export const DAILY_RENDER_LIMIT = Number.isFinite(rawDailyRenderLimit) && rawDailyRenderLimit > 0
  ? Math.floor(rawDailyRenderLimit)
  : 20;

export const IS_PRODUCTION = APP_ENV === 'production';

export const USE_BACKEND_LIMIT = String(process.env.EXPO_PUBLIC_USE_BACKEND_LIMIT || 'false').toLowerCase() === 'true';

export type StorageMode = 'mock' | 'cloudinary-unsigned';

function resolveStorageMode(value: string | undefined): StorageMode {
  const normalized = (value || '').trim().toLowerCase();
  if (normalized === 'cloudinary-unsigned' || normalized === 'mock') {
    return normalized;
  }
  return 'mock';
}

export const STORAGE_MODE: StorageMode = resolveStorageMode(process.env.EXPO_PUBLIC_STORAGE_MODE);
export const CLOUDINARY_CLOUD_NAME = (process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '').trim();
export const CLOUDINARY_UPLOAD_PRESET = (process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '').trim();
