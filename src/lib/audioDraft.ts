const DB_NAME = 'det_audio_drafts';
const STORE = 'drafts';
const DB_VERSION = 1;

interface AudioDraftRecord {
  key: string;
  blob: Blob;
  createdAt: number;
  sessionId: string;
  questionId: string;
  durationSec?: number;
  transcript?: string;
}

export interface AudioDraft {
  blob: Blob;
  durationSec: number;
  transcript: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function draftKey(sessionId: string, questionId: string): string {
  return `${sessionId}:${questionId}`;
}

export async function saveAudioDraft(
  sessionId: string,
  questionId: string,
  blob: Blob,
  metadata: { durationSec?: number; transcript?: string } = {}
): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({
        key: draftKey(sessionId, questionId),
        blob,
        createdAt: Date.now(),
        sessionId,
        questionId,
        durationSec: metadata.durationSec,
        transcript: metadata.transcript,
      } satisfies AudioDraftRecord);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Storage may be unavailable (private mode/quota). Upload still works.
  }
}

export async function loadAudioDraftRecord(
  sessionId: string,
  questionId: string
): Promise<AudioDraft | null> {
  try {
    const db = await openDb();
    const record = await new Promise<AudioDraftRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(draftKey(sessionId, questionId));
      request.onsuccess = () => resolve(request.result as AudioDraftRecord | undefined);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (!record || Date.now() - record.createdAt > 24 * 60 * 60 * 1000) {
      if (record) await deleteAudioDraft(sessionId, questionId);
      return null;
    }
    return {
      blob: record.blob,
      durationSec: record.durationSec || 0,
      transcript: record.transcript || '',
    };
  } catch {
    return null;
  }
}

export async function loadAudioDraft(
  sessionId: string,
  questionId: string
): Promise<Blob | null> {
  return (await loadAudioDraftRecord(sessionId, questionId))?.blob ?? null;
}

export async function deleteAudioDraft(sessionId: string, questionId: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(draftKey(sessionId, questionId));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Nothing to clean up.
  }
}
