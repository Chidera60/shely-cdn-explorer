import fs from 'fs';
import path from 'path';

/**
 * High-Performance Disk & Memory Cache Store for Shelby CDN Explorer Assets
 * Guarantees CDN link accessibility via /api/cdn/[...blobPath] and /api/blob
 */

export interface StoredBlob {
  blobName: string;
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  createdAt: number;
}

export const CACHE_DIR = path.join(process.cwd(), '.shelby_cache');
const memoryBlobStore = new Map<string, StoredBlob>();

/**
 * Safely resolves a blob path within CACHE_DIR, returning null if traversal is attempted.
 */
export function getSafeCachePath(blobPath: string): string | null {
  const normalized = path.normalize(blobPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const resolved = path.resolve(CACHE_DIR, normalized);
  if (!resolved.startsWith(CACHE_DIR + path.sep) && resolved !== CACHE_DIR) {
    return null;
  }
  return resolved;
}

/**
 * Determine MIME type based on file extension
 */
export function getMimeTypeFromExt(filenameOrPath: string): string {
  const ext = path.extname(filenameOrPath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.webm') return 'video/webm';
  if (ext === '.pdf') return 'application/pdf';
  return 'application/octet-stream';
}

/**
 * Save blob data to both disk cache (.shelby_cache) and in-memory store
 */
export function storeBlobData(blobName: string, buffer: Buffer, mimeType?: string, fileName?: string) {
  const cleanBlobName = blobName.replace(/^\/+/, '');
  const detectedMime = mimeType || getMimeTypeFromExt(cleanBlobName);
  const baseName = fileName || path.basename(cleanBlobName);

  // 1. Update in-memory store
  memoryBlobStore.set(cleanBlobName.toLowerCase(), {
    blobName: cleanBlobName,
    buffer,
    mimeType: detectedMime,
    fileName: baseName,
    createdAt: Date.now(),
  });

  // 2. Persist to disk cache safely
  try {
    const filePath = getSafeCachePath(cleanBlobName);
    if (filePath) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, buffer);
    }
  } catch (err) {
    console.error(`[Shelby Cache] Failed to write blob '${cleanBlobName}' to disk:`, err);
  }
}

/**
 * Retrieve blob data from in-memory cache or disk cache
 */
export function getStoredBlobData(blobName: string): StoredBlob | undefined {
  const cleanBlobName = blobName.replace(/^\/+/, '');
  const key = cleanBlobName.toLowerCase();

  // Check in-memory store
  if (memoryBlobStore.has(key)) {
    return memoryBlobStore.get(key);
  }

  // Check disk cache
  try {
    const filePath = getSafeCachePath(cleanBlobName);
    if (filePath && fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const mimeType = getMimeTypeFromExt(cleanBlobName);
      const stored: StoredBlob = {
        blobName: cleanBlobName,
        buffer,
        mimeType,
        fileName: path.basename(cleanBlobName),
        createdAt: fs.statSync(filePath).mtimeMs,
      };
      memoryBlobStore.set(key, stored);
      return stored;
    }
  } catch (err) {
    console.error(`[Shelby Cache] Failed to read blob '${cleanBlobName}' from disk:`, err);
  }

  return undefined;
}
