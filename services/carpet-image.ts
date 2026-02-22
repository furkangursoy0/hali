const DEFAULT_CARPET_CDN_BASE = 'https://cdn.jsdelivr.net/gh/furkangursoy0/hali@main/assets';

const rawBase = (process.env.EXPO_PUBLIC_CARPET_CDN_BASE || DEFAULT_CARPET_CDN_BASE).trim();
const CARPET_CDN_BASE = rawBase.replace(/\/+$/, '');
const rawThumbBase = (process.env.EXPO_PUBLIC_CARPET_THUMB_CDN_BASE || '').trim();
const CARPET_THUMB_CDN_BASE = rawThumbBase.replace(/\/+$/, '');

function encodePath(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function getCarpetFullUrl(imagePath: string): string {
  const normalizedPath = imagePath.replace(/^\/+/, '');
  const encodedPath = encodePath(normalizedPath);
  return `${CARPET_CDN_BASE}/${encodedPath}`;
}

function buildThumbPathFromImagePath(imagePath: string): string {
  const normalizedPath = imagePath.replace(/^\/+/, '');
  const withThumbPrefix = normalizedPath.replace(/^carpets\//, 'carpets-thumbs/');
  return withThumbPrefix.replace(/\.(png|jpe?g|webp)$/i, '.webp');
}

export function getCarpetThumbnailUrl(
  imagePath: string,
  thumbPath?: string,
  width = 420,
  quality = 64
): string {
  const resolvedThumbPath = (thumbPath || '').trim() || buildThumbPathFromImagePath(imagePath);
  if (CARPET_THUMB_CDN_BASE) {
    const encodedThumbPath = encodePath(resolvedThumbPath);
    return `${CARPET_THUMB_CDN_BASE}/${encodedThumbPath}`;
  }

  const fullUrl = getCarpetFullUrl(imagePath);
  return `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&w=${width}&q=${quality}&output=webp`;
}
