'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseAudioVisualizerReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  startVisualizer: () => Promise<void>;
  stopVisualizer: () => void;
  isActive: boolean;
}

export function useAudioVisualizer(): UseAudioVisualizerReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isActive, setIsActive] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const render = () => {
      animationRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const barCount = 60;
      const barWidth = (width / barCount) * 0.7;
      const gap = (width / barCount) * 0.3;
      const centerY = height / 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex] / 255;
        const barHeight = Math.max(value * centerY * 0.9, 2);

        const hue = 220 + (i / barCount) * 60;
        const lightness = 50 + value * 20;
        ctx.fillStyle = `hsla(${hue}, 80%, ${lightness}%, ${0.6 + value * 0.4})`;

        const x = i * (barWidth + gap) + gap / 2;
        
        // Draw mirrored bars
        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight, barWidth, barHeight, 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.roundRect(x, centerY, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    render();
  }, []);

  const startVisualizer = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsActive(true);
      draw();
    } catch (error) {
      console.error('Failed to start audio visualizer:', error);
    }
  }, [draw]);

  const stopVisualizer = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopVisualizer();
    };
  }, [stopVisualizer]);

  return {
    canvasRef,
    startVisualizer,
    stopVisualizer,
    isActive,
  };
}
