import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useAudioVolume } from '@/hooks/useAudioVolume';

export default function UserVisualizer({ isActive }: { isActive: boolean }) {
  const volume = useAudioVolume(isActive);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let t = 0;
    let animationFrame: number;

    const render = () => {
      t += 0.2 + (volume * 0.3); // Time moves faster when talking
      const amplitude = Math.max(volume * 400, 4); // Peak amplitude up to 400px
      const frequency = 0.015 + volume * 0.02; 
      
      const logicalWidth = 1000; // Match the viewBox width exactly
      const segments = 120;
      const segmentWidth = logicalWidth / segments;
      
      let d = `M 0,0`;
      for (let i = 0; i <= segments; i++) {
        const x = i * segmentWidth;
        const distanceFromCenter = Math.abs(i - segments / 2) / (segments / 2);
        // Exponential falloff for smooth fade out at edges
        const edgeFade = Math.pow(Math.max(0, 1 - distanceFromCenter), 2);
        
        // Add random jitter based on volume
        const jitter = (Math.random() - 0.5) * volume * 20;
        
        const y = Math.sin(x * frequency + t) * amplitude * edgeFade + jitter;
        d += ` L ${x},${y}`;
      }
      
      if (containerRef.current) {
        const paths = containerRef.current.querySelectorAll('path');
        paths.forEach(p => p.setAttribute('d', d));
      }
      
      animationFrame = requestAnimationFrame(render);
    };
    
    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [volume]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        width: '70vw', 
        height: '800px',
        zIndex: 1, 
        opacity: isActive ? 1 : 0.2,
        transition: 'opacity 0.5s',
        pointerEvents: 'none'
      }}
    >
      {/* Deep blurry background glow */}
      <svg width="100%" height="100%" viewBox="0 -400 1000 800" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', filter: 'blur(30px)', opacity: 0.8 }}>
        <path fill="none" stroke="#ff4500" strokeWidth="40" strokeLinecap="round" />
      </svg>
      {/* Medium blur core */}
      <svg width="100%" height="100%" viewBox="0 -400 1000 800" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', filter: 'blur(10px)' }}>
        <path fill="none" stroke="#ffaa00" strokeWidth="15" strokeLinecap="round" />
      </svg>
      {/* Sharp intense center */}
      <svg width="100%" height="100%" viewBox="0 -400 1000 800" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', filter: 'blur(2px)' }}>
        <path fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}
