/**
 * Web Audio API synthesizer for mechanical keyboard clicks and sounds.
 * Ensures zero external audio asset dependencies!
 */
class SoundEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Realistic mechanical keyboard click
  playKeyClick() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Random subtle pitch variation for mechanical feel
      const freq = 400 + Math.random() * 250;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio playback fails silently if blocked by browser policy
    }
  }

  // Error buzz sound
  playErrorBuzz() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // ignore
    }
  }

  // High chime for success or stage transition
  playSuccessChime() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.08, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch {
      // ignore
    }
  }

  // Text-to-speech for Listen and Type, Interactive Listening and words.
  // Only English voices are used: falling back to an arbitrary system voice
  // (for example a Russian one) produces the "funny" pronunciation users
  // reported on dictations and vocabulary.
  speakEnglish(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }

    const synth = window.speechSynthesis;

    const rankVoice = (voice: SpeechSynthesisVoice): number => {
      const name = voice.name.toLowerCase();
      if (!voice.lang.toLowerCase().startsWith('en')) return -1;
      if (/google us english/.test(name)) return 100;
      if (/microsoft.*(aria|jenny|guy|sophia).*online/.test(name)) return 95;
      if (/samantha/.test(name)) return 90;
      if (/microsoft.*(aria|jenny|guy)/.test(name)) return 85;
      if (/google uk english female/.test(name)) return 80;
      if (/karen|daniel|moira/.test(name)) return 75;
      if (/natural|neural/.test(name)) return 70;
      if (voice.lang.toLowerCase().startsWith('en-us')) return 60;
      if (voice.lang.toLowerCase().startsWith('en-gb')) return 50;
      return 30;
    };

    const pickVoice = (): SpeechSynthesisVoice | null => {
      const voices = synth.getVoices();
      if (!voices || voices.length === 0) return null;
      let best: SpeechSynthesisVoice | null = null;
      let bestRank = -1;
      for (const voice of voices) {
        const rank = rankVoice(voice);
        if (rank > bestRank) {
          bestRank = rank;
          best = voice;
        }
      }
      return bestRank > 0 ? best : null;
    };

    const speak = (attempt: number) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.92; // Slightly deliberate, natural pace for DET prompts
      utterance.pitch = 1.0;

      const voice = pickVoice();
      if (voice) {
        utterance.voice = voice;
        // Keep the utterance language aligned with the selected voice.
        if (voice.lang) utterance.lang = voice.lang;
      }

      if (!voice && attempt === 0) {
        // Chrome populates the voice list asynchronously. Wait once, then
        // speak with whatever English voice is available.
        let settled = false;
        const handler = () => {
          if (settled) return;
          settled = true;
          synth.onvoiceschanged = null;
          speak(1);
        };
        synth.onvoiceschanged = handler;
        window.setTimeout(handler, 600);
        return;
      }

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      synth.cancel();
      synth.speak(utterance);
    };

    speak(0);
  }

  // Convenient semantic aliases
  correct() {
    this.playSuccessChime();
  }

  incorrect() {
    this.playErrorBuzz();
  }

  start() {
    this.playKeyClick();
  }

  complete() {
    this.playSuccessChime();
  }
}

export const sound = new SoundEngine();
