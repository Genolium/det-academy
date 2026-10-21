import { api } from '@/lib/api';

const STORAGE_PREFIX = 'det_srs_outbox_v1_';

interface QueuedReview {
  cardId: string;
  quality: number;
  queuedAt: number;
}

type Outbox = Record<string, QueuedReview>;

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function readOutbox(userId: string): Outbox {
  if (typeof window === 'undefined' || !userId) return {};
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeOutbox(userId: string, outbox: Outbox): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(outbox));
  } catch {}
}

export function getQueuedSRSReviews(userId: string): number {
  return Object.keys(readOutbox(userId)).length;
}

/**
 * Queues the latest review for a card, then tries to sync. The latest review
 * wins because the local SM-2 state has already been advanced optimistically.
 */
export async function submitOrQueueSRSReview(
  userId: string,
  cardId: string,
  quality: number
): Promise<{ synced: boolean }> {
  if (!userId || !cardId) return { synced: false };
  const outbox = readOutbox(userId);
  outbox[cardId] = { cardId, quality, queuedAt: Date.now() };
  writeOutbox(userId, outbox);
  try {
    await api.reviewSRSCard(cardId, quality);
    delete outbox[cardId];
    writeOutbox(userId, outbox);
    return { synced: true };
  } catch {
    return { synced: false };
  }
}

export async function flushSRSOutbox(userId: string): Promise<number> {
  if (!userId || typeof navigator === 'undefined' || !navigator.onLine) {
    return getQueuedSRSReviews(userId);
  }
  const outbox = readOutbox(userId);
  for (const [cardId, review] of Object.entries(outbox)) {
    try {
      await api.reviewSRSCard(review.cardId, review.quality);
      delete outbox[cardId];
      writeOutbox(userId, outbox);
    } catch {
      // Keep the review for the next reconnect.
    }
  }
  return getQueuedSRSReviews(userId);
}

export function clearSRSOutbox(userId: string): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {}
}
