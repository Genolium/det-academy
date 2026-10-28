/**
 * A random, browser-local identifier used only as one extra dimension for
 * abuse limits. It is not a fingerprint: it lives in localStorage, can be
 * cleared, and the server hashes it before storing. The IP and user quotas
 * remain the primary controls.
 */
const STORAGE_KEY = 'det_device_id_v1';

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && /^[A-Za-z0-9._:-]{1,128}$/.test(stored)) return stored;
    const created = randomId();
    localStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    return null;
  }
}
