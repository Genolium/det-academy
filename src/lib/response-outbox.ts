import { api, ApiError } from '@/lib/api';
import { getAuthCacheUserId } from '@/lib/auth-session';

const STORAGE_KEY = 'det_response_outbox_v1';
const LEGACY_STORAGE_KEY = STORAGE_KEY;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function scopedStorageKey(): string {
  const userId = getAuthCacheUserId();
  return `${STORAGE_KEY}:${userId || 'guest'}`;
}

export interface QueuedResponse {
  sessionId: string;
  questionId: string;
  queuedAt: number;
  payload: {
    questionId: string;
    userResponse: unknown;
    rawScore: number;
    timeSpentSec: number;
  };
}

type Outbox = Record<string, QueuedResponse>;

const keyFor = (sessionId: string, questionId: string) => `${sessionId}:${questionId}`;

function readOutbox(): Outbox {
  if (typeof window === 'undefined') return {};
  try {
    const key = scopedStorageKey();
    let raw = localStorage.getItem(key);
    if (!raw) {
      // One-time migration from the pre-user-scoped queue.
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const now = Date.now();
    const fresh: Outbox = {};
    for (const [itemKey, item] of Object.entries(parsed as Outbox)) {
      if (item && now - item.queuedAt <= TTL_MS) fresh[itemKey] = item;
    }
    return fresh;
  } catch {
    return {};
  }
}

function writeOutbox(outbox: Outbox): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(scopedStorageKey(), JSON.stringify(outbox));
  } catch {}
}

export function enqueueResponse(
  sessionId: string,
  payload: QueuedResponse['payload']
): void {
  if (!sessionId || !payload.questionId) return;
  const outbox = readOutbox();
  outbox[keyFor(sessionId, payload.questionId)] = {
    sessionId,
    questionId: payload.questionId,
    queuedAt: Date.now(),
    payload,
  };
  writeOutbox(outbox);
}

export function removeQueuedResponse(sessionId: string, questionId: string): void {
  const outbox = readOutbox();
  delete outbox[keyFor(sessionId, questionId)];
  writeOutbox(outbox);
}

/**
 * Queues the answer synchronously, then tries to send it. A failed request is
 * kept in localStorage and retried by `flushResponseOutbox`.
 */
export async function submitOrQueueResponse(
  sessionId: string,
  payload: QueuedResponse['payload']
): Promise<{ synced: boolean }> {
  if (!sessionId) return { synced: false };
  enqueueResponse(sessionId, payload);
  try {
    await api.submitQuestionResponse(sessionId, payload);
    removeQueuedResponse(sessionId, payload.questionId);
    return { synced: true };
  } catch (err) {
    if (isPermanentRejection(err)) {
      removeQueuedResponse(sessionId, payload.questionId);
    }
    return { synced: false };
  }
}

function isPermanentRejection(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  if (err.status >= 500 || err.status === 0) return false;
  if (err.status === 401 || err.status === 408 || err.status === 429) return false;
  // A bare 400 may still be a transient proxy/server response. Only drop it
  // when the server supplied a machine-readable rejection code.
  if (err.status === 400 && !err.code) return false;
  return err.status >= 400 && err.status < 500;
}

export function getQueuedCount(sessionId: string): number {
  const outbox = readOutbox();
  return Object.values(outbox).filter((item) => item.sessionId === sessionId).length;
}

/**
 * Sends every queued answer for the attempt. The server upserts by
 * (session_id, question_id), so replaying an answer is safe.
 */
export async function flushResponseOutbox(sessionId: string): Promise<number> {
  if (!sessionId) return 0;
  const outbox = readOutbox();
  const items = Object.values(outbox).filter((item) => item.sessionId === sessionId);
  for (const item of items) {
    try {
      await api.submitQuestionResponse(sessionId, item.payload);
      removeQueuedResponse(sessionId, item.questionId);
    } catch (err) {
      if (isPermanentRejection(err)) {
        removeQueuedResponse(sessionId, item.questionId);
      }
      // Otherwise keep it for the next retry.
    }
  }
  return getQueuedCount(sessionId);
}

export function clearResponseOutbox(sessionId: string): void {
  const outbox = readOutbox();
  for (const key of Object.keys(outbox)) {
    if (outbox[key].sessionId === sessionId) {
      delete outbox[key];
    }
  }
  writeOutbox(outbox);
}

/** Remove the current user's queued answers, e.g. on logout. */
export function clearAllResponseOutbox(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(scopedStorageKey());
  } catch {}
}
