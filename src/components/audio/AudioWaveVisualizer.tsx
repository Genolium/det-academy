'use client';

import React, { useEffect, useRef } from 'react';

interface AudioWaveVisualizerProps {
  mediaStream?: MediaStream | null;
  audioElement?: HTMLAudioElement | null;
  isRecording?: boolean;
  isPlaying?: boolean;
  height?: number;
  barColor?: string;
  className?: string;
}

export const AudioWaveVisualizer: React.FC<AudioWaveVisualizerProps> = ({
  mediaStream,
  audioElement,
  isRecording = false,
  isPlaying = false,
  height = 80,
  barColor = '#D2F544',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isActive = isRecording || isPlaying;
    let freqArray: Uint8Array<ArrayBuffer> | null = null;

    // Set up AudioContext with microphone stream or audio element
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx && (mediaStream && isRecording || audioElement && isPlaying)) {
        const audioCtx = new AudioCtx();
        audioCtxRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        freqArray = new Uint8Array(analyser.frequencyBinCount);

        if (mediaStream && isRecording) {
          const source = audioCtx.createMediaStreamSource(mediaStream);
          source.connect(analyser);
          sourceRef.current = source;
        } else if (audioElement && isPlaying) {
          try {
            const source = audioCtx.createMediaElementSource(audioElement);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            sourceRef.current = source;
          } catch {
            // Already connected or cross-origin restricted
          }
        }
      }
    } catch (err) {
      console.warn('AudioContext init error:', err);
    }

    let phase = 0;
    const barsCount = 32;

    const render = () => {
      const width = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, width, ch);

      let dataArray: Uint8Array<ArrayBuffer> | null = null;
      if (analyserRef.current && freqArray && (isRecording || isPlaying)) {
        analyserRef.current.getByteFrequencyData(freqArray);
        dataArray = freqArray;
      }

      const barWidth = (width / barsCount) * 0.7;
      const barSpacing = (width / barsCount) * 0.3;

      for (let i = 0; i < barsCount; i++) {
        let value = 0;

        if (dataArray && dataArray.length > 0) {
          const idx = Math.floor((i / barsCount) * dataArray.length);
          value = dataArray[idx] / 255;
        } else if (isActive) {
          // Synthetic organic wave animation
          const sin1 = Math.sin(phase + i * 0.35);
          const sin2 = Math.cos(phase * 0.7 + i * 0.2);
          value = Math.max(0.08, (sin1 + sin2 + 2) / 4);
        } else {
          // Idle low pulse
          value = 0.05 + 0.04 * Math.sin(phase * 0.3 + i * 0.2);
        }

        const barHeight = Math.max(4, value * (ch * 0.85));
        const x = i * (barWidth + barSpacing) + barSpacing / 2;
        const y = (ch - barHeight) / 2;

        // Gradient styling
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isActive) {
          grad.addColorStop(0, barColor);
          grad.addColorStop(1, '#10B981');
        } else {
          grad.addColorStop(0, '#525252');
          grad.addColorStop(1, '#262626');
        }

        ctx.fillStyle = grad;
        // Rounded bar with fallback
        const radius = Math.min(barWidth / 2, 3);
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, barWidth, barHeight, radius);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      phase += isActive ? 0.08 : 0.02;
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch {}
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try { audioCtxRef.current.close(); } catch {}
      }
    };
  }, [mediaStream, audioElement, isRecording, isPlaying, barColor]);

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-neutral-950/70 border border-neutral-800 p-2 ${className}`}>
      <canvas
        ref={canvasRef}
        width={360}
        height={height}
        className="w-full h-full block"
        style={{ height: `${height}px` }}
      />
      {isRecording && (
        <div className="absolute top-2.5 right-3 flex items-center gap-1.5 bg-red-950/80 border border-red-800/80 px-2 py-0.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-400">REC</span>
        </div>
      )}
      {isPlaying && (
        <div className="absolute top-2.5 right-3 flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">PLAY</span>
        </div>
      )}
    </div>
  );
};
