/**
 * Server-side speech synthesis.
 *
 * When NEXT_PUBLIC_TTS_PROVIDER=server the app asks the backend for an audio
 * file. The backend synthesises it once and keeps it forever, so repeated
 * plays are instant and free. Any failure falls back to the browser voice.
 */
const SERVER_TTS = process.env.NEXT_PUBLIC_TTS_PROVIDER === 'server';

export function isServerTTSEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return SERVER_TTS;
}

export async function playServerTTS(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || !SERVER_TTS || !text.trim()) return false;
  try {
    const response = await fetch(`/api/v1/tts?text=${encodeURIComponent(text)}`, {
      // The audio is content-addressed and immutable: the browser may keep it.
      cache: 'force-cache',
    });
    if (!response.ok) return false;
    const blob = await response.blob();
    if (blob.size === 0) return false;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true });
    audio.addEventListener('error', () => URL.revokeObjectURL(url), { once: true });
    await audio.play();
    return true;
  } catch {
    return false;
  }
}
