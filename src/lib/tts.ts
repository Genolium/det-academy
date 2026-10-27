/**
 * Server-side speech synthesis.
 *
 * When NEXT_PUBLIC_TTS_PROVIDER=server the app asks the backend for an audio
 * file. The backend synthesises it once and keeps it forever, so repeated
 * plays are instant and free. Any failure falls back to the browser voice.
 */
const SERVER_TTS = process.env.NEXT_PUBLIC_TTS_PROVIDER === 'server';

let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let playbackGeneration = 0;

export function isServerTTSEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return SERVER_TTS;
}

function releaseCurrent(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
}

/** Stops any speech started through the server voice. */
export function stopServerTTS(): void {
  playbackGeneration += 1;
  releaseCurrent();
}

/**
 * Plays synthesised speech and resolves when playback finishes.
 *
 * `rate` mirrors the Web Speech API: 0.9 is a slightly deliberate dictation
 * pace. The audio is time-stretched without changing pitch on modern browsers.
 */
export async function playServerTTS(text: string, rate: number = 0.92): Promise<boolean> {
  if (typeof window === 'undefined' || !SERVER_TTS || !text.trim()) return false;

  const generation = ++playbackGeneration;
  releaseCurrent();

  try {
    const response = await fetch(`/api/v1/tts?text=${encodeURIComponent(text)}`, {
      // The audio is content-addressed and immutable: the browser may keep it.
      cache: 'force-cache',
    });
    if (!response.ok) return false;
    const blob = await response.blob();
    if (blob.size === 0) return false;
    if (generation !== playbackGeneration) return true;

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    const tempo = Math.min(1.2, Math.max(0.6, rate));
    audio.playbackRate = tempo;
    audio.defaultPlaybackRate = tempo;
    // Keep the voice natural when slowing down for dictation.
    audio.preservesPitch = true;

    currentAudio = audio;
    currentUrl = url;

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (played: boolean) => {
        if (settled) return;
        settled = true;
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        if (currentAudio === audio) releaseCurrent();
        resolve(played);
      };
      const onEnded = () => finish(true);
      const onError = () => finish(false);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);

      void audio.play().catch(() => finish(false));
      // A newer utterance replaced this one: treat it as handled so the caller
      // does not start a browser fallback on top of the new playback.
      if (generation !== playbackGeneration) finish(true);
    });
  } catch {
    return false;
  }
}
