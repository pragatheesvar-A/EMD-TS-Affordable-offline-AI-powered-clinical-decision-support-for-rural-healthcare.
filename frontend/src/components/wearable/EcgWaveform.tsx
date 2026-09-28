import React, { useEffect, useRef } from 'react';
import { createEcgState, nextEcgSample, type EcgGeneratorState } from '../../lib/ecgSimulator';

interface EcgWaveformProps {
  running: boolean;
  bpm: number;
  abnormal: boolean;
  height?: number;
  lineColor?: string;
  resetSignal?: number;
}

const SAMPLE_RATE = 120; // samples per second (visual, not physiological-grade)

export function EcgWaveform({
  running,
  bpm,
  abnormal,
  height = 160,
  lineColor = '#16a34a',
  resetSignal = 0,
}: EcgWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bufferRef = useRef<number[]>([]);
  const stateRef = useRef<EcgGeneratorState>(createEcgState());
  const rafRef = useRef<number | undefined>(undefined);
  const lastTsRef = useRef<number | undefined>(undefined);

  // reset buffer when resetSignal changes
  useEffect(() => {
    bufferRef.current = [];
    stateRef.current = createEcgState();
  }, [resetSignal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw(ts: number) {
      if (!canvas || !ctx) return;
      const width = canvas.width;
      const h = canvas.height;

      if (running) {
        const last = lastTsRef.current ?? ts;
        let dt = (ts - last) / 1000;
        dt = Math.min(dt, 0.1);
        lastTsRef.current = ts;

        const samplesToAdd = Math.max(1, Math.round(dt * SAMPLE_RATE));
        const stepDt = 1 / SAMPLE_RATE;
        for (let i = 0; i < samplesToAdd; i++) {
          const v = nextEcgSample(stateRef.current, stepDt, bpm, abnormal);
          bufferRef.current.push(v);
        }
        const maxPoints = Math.ceil((width / dpr) * 1.2);
        if (bufferRef.current.length > maxPoints) {
          bufferRef.current.splice(0, bufferRef.current.length - maxPoints);
        }
      } else {
        lastTsRef.current = ts;
      }

      // background grid
      ctx.clearRect(0, 0, width, h);
      ctx.fillStyle = '#fbfdff';
      ctx.fillRect(0, 0, width, h);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
      ctx.lineWidth = 1;
      const gridSize = 20 * dpr;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // waveform
      const buf = bufferRef.current;
      if (buf.length > 1) {
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2 * dpr;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const midY = h / 2;
        const amp = h * 0.35;
        const stepX = width / Math.max(1, buf.length - 1);
        buf.forEach((v, i) => {
          const x = i * stepX;
          const y = midY - v * amp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, bpm, abnormal, lineColor]);

  return <canvas ref={canvasRef} style={{ width: '100%', height }} className="rounded-xl" />;
}
