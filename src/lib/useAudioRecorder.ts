import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  durationSec: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  volumeLevel: number; // 0..100 for live sound meter
  hasPermission: boolean | null;
  error: string | null;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<Blob | null>;
  restoreAudio: (blob: Blob) => void;
  cancelRecording: () => void;
  resetAudio: () => void;
}

function getBestMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'audio/webm';
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ];
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return '';
}

export function useAudioRecorder(): AudioRecorderState {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const resolveStopRef = useRef<((blob: Blob | null) => void) | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);

  // Clean up all streams and audio contexts
  const cleanupTracksAndAudio = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    setVolumeLevel(0);
  }, []);

  const startVolumeAnalysis = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Scale to 0..100
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setVolumeLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch {
      // AudioContext failure gracefully falls back to level 0
    }
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Запись аудио не поддерживается в данном браузере.');
      return false;
    }

    try {
      cleanupTracksAndAudio();
      audioChunksRef.current = [];
      audioBlobRef.current = null;
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setHasPermission(true);

      const mimeType = getBestMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualMime = mimeType || mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: actualMime });
        audioBlobRef.current = blob;
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        if (resolveStopRef.current) {
          resolveStopRef.current(blob);
          resolveStopRef.current = null;
        }
        cleanupTracksAndAudio();
      };

      mediaRecorder.start(250); // Emit data chunk every 250ms
      setIsRecording(true);
      setIsPaused(false);
      setDurationSec(0);

      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        setDurationSec(elapsed);
      }, 500);

      startVolumeAnalysis(stream);
      return true;
    } catch (err: unknown) {
      setHasPermission(false);
      const msg = err instanceof Error ? err.message : 'Не удалось получить доступ к микрофону';
      setError(msg);
      cleanupTracksAndAudio();
      return false;
    }
  }, [cleanupTracksAndAudio, startVolumeAnalysis]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(audioBlobRef.current);
        return;
      }

      // Never leave the learner on a dead button if the recorder never emits
      // onstop (background tab, dead track, browser bug).
      const timeout = setTimeout(() => {
        if (resolveStopRef.current) {
          resolveStopRef.current(audioBlobRef.current);
          resolveStopRef.current = null;
        }
      }, 5_000);

      resolveStopRef.current = (blob) => {
        clearTimeout(timeout);
        resolve(blob);
      };
      setIsRecording(false);
      setIsPaused(false);

      try {
        mediaRecorderRef.current.stop();
      } catch {
        clearTimeout(timeout);
        resolve(null);
      }
    });
  }, [audioBlob]);

  const restoreAudio = useCallback((blob: Blob) => {
    audioBlobRef.current = blob;
    setAudioBlob(blob);
    setAudioUrl((current) => {
      if (current) {
        try {
          URL.revokeObjectURL(current);
        } catch {}
      }
      return URL.createObjectURL(blob);
    });
  }, []);

  const cancelRecording = useCallback(() => {
    setIsRecording(false);
    setIsPaused(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    cleanupTracksAndAudio();
    audioChunksRef.current = [];
    audioBlobRef.current = null;
    setAudioBlob(null);
    setAudioUrl(null);
    setDurationSec(0);
  }, [cleanupTracksAndAudio]);

  const resetAudio = useCallback(() => {
    if (audioUrl) {
      try {
        URL.revokeObjectURL(audioUrl);
      } catch {}
    }
    audioBlobRef.current = null;
    setAudioBlob(null);
    setAudioUrl(null);
    setDurationSec(0);
    setError(null);
  }, [audioUrl]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      cleanupTracksAndAudio();
      if (audioUrl) {
        try {
          URL.revokeObjectURL(audioUrl);
        } catch {}
      }
    };
  }, [cleanupTracksAndAudio, audioUrl]);

  // A stable object identity is required: consumers put these callbacks in
  // effect dependency arrays, and a fresh object on every render would restart
  // their timers on each state update.
  return useMemo(
    () => ({
      isRecording,
      isPaused,
      durationSec,
      audioBlob,
      audioUrl,
      volumeLevel,
      hasPermission,
      error,
      startRecording,
      stopRecording,
      restoreAudio,
      cancelRecording,
      resetAudio,
    }),
    [
      isRecording,
      isPaused,
      durationSec,
      audioBlob,
      audioUrl,
      volumeLevel,
      hasPermission,
      error,
      startRecording,
      stopRecording,
      restoreAudio,
      cancelRecording,
      resetAudio,
    ]
  );
}
