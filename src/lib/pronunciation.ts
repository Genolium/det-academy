/**
 * Word pronunciation.
 *
 * Prefers a real human recording from the free Dictionary API (Wiktionary
 * media) and falls back to the browser speech synthesiser. Results are cached
 * in memory, so repeated taps do not hit the network.
 */
import { sound } from '@/lib/sound';

const audioCache = new Map<string, string | null>();
const inFlight = new Map<string, Promise<string | null>>();

async function lookupAudio(word: string): Promise<string | null> {
  const key = word.trim().toLowerCase();
  if (!key) return null;
  if (audioCache.has(key)) return audioCache.get(key) ?? null;
  if (inFlight.has(key)) return inFlight.get(key)!;

  const request = (async () => {
    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`
      );
      if (!response.ok) return null;
      const data = await response.json();
      const phonetics = Array.isArray(data?.[0]?.phonetics) ? data[0].phonetics : [];
      const withAudio = phonetics.find(
        (item: { audio?: string }) => typeof item?.audio === 'string' && item.audio.length > 0
      );
      return withAudio?.audio ? String(withAudio.audio) : null;
    } catch {
      return null;
    }
  })();

  inFlight.set(key, request);
  const result = await request;
  inFlight.delete(key);
  audioCache.set(key, result);
  return result;
}

let currentAudio: HTMLAudioElement | null = null;

/**
 * Plays the pronunciation of a single word. Returns when playback starts (not
 * when it ends), so the UI can stop its loading state immediately.
 */
export async function playPronunciation(word: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const url = await lookupAudio(word);
  if (url) {
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
      const audio = new Audio(url);
      audio.preload = 'auto';
      currentAudio = audio;
      await audio.play();
      return;
    } catch {
      // Autoplay or network failure: fall through to speech synthesis.
    }
  }

  sound.speakEnglish(word);
}
