import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function AIVisualizer({ isTalking, isDimmed }: { isTalking: boolean, isDimmed?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const aura1Ref = useRef<HTMLDivElement>(null);
  const aura2Ref = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    gsap.to(containerRef.current, {
      rotation: 360,
      duration: 30,
      repeat: -1,
      ease: "none"
    });
    
    gsap.to([aura1Ref.current, aura2Ref.current], {
      scale: 1.05,
      opacity: 0.5,
      duration: 4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
  }, []);

  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.kill();
    }

    if (isDimmed) {
      // Dim state when user is talking
      gsap.to(coreRef.current, { scale: 0.9, opacity: 0.3, duration: 1, ease: "power2.out" });
      gsap.to([aura1Ref.current, aura2Ref.current], { scale: 0.9, opacity: 0.1, duration: 1, ease: "power2.out" });
    } else if (isTalking) {
      animationRef.current = gsap.timeline({ repeat: -1 });
      
      const simulateSyllable = () => {
        const duration = 0.15 + Math.random() * 0.2; // Slower jitter
        const scale = 1.02 + Math.random() * 0.08; // Very little growth
        const glowBlur = 20 + Math.random() * 60; // Random intense glow
        
        animationRef.current?.to(coreRef.current, {
          scale,
          boxShadow: `0 0 ${glowBlur}px ${glowBlur/2}px rgba(255,130,0,0.9), inset 0 0 30px #ff5500`,
          duration,
          ease: "power2.out"
        }).to(coreRef.current, {
          scale: 1,
          boxShadow: '0 0 40px 20px rgba(255,130,0,0.6), inset 0 0 30px #ff5500',
          duration: duration * 1.5,
          ease: "power2.in"
        });

        animationRef.current?.to([aura1Ref.current, aura2Ref.current], {
          filter: `blur(${30 + Math.random() * 40}px)`,
          opacity: 0.7 + Math.random() * 0.3,
          duration,
          ease: "power2.out"
        }, "<").to([aura1Ref.current, aura2Ref.current], {
          filter: 'blur(50px)',
          opacity: 0.4,
          duration: duration * 1.5,
          ease: "power2.in"
        }, ">");
      };

      for(let i=0; i<6; i++) {
        simulateSyllable();
      }
      
    } else {
      gsap.to(coreRef.current, {
        scale: 1,
        opacity: 1,
        boxShadow: '0 0 60px 30px rgba(255,130,0,0.8), inset 0 0 30px #ff5500',
        duration: 1,
        ease: "power2.out"
      });
      gsap.to([aura1Ref.current, aura2Ref.current], {
        scale: 1,
        filter: 'blur(60px)',
        opacity: 0.4,
        duration: 1,
        ease: "power2.out"
      });
    }
  }, [isTalking, isDimmed]);

  return (
    <div 
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    >
      <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div ref={aura1Ref} style={{
          position: 'absolute',
          top: '0', left: '0', right: '0', bottom: '0',
          background: 'radial-gradient(circle, rgba(255,85,0,0.7) 0%, rgba(255,0,0,0) 70%)',
          filter: 'blur(60px)',
          opacity: 0.3,
          borderRadius: '50%',
          transform: 'scale(1.2)'
        }} />
        
        <div ref={aura2Ref} style={{
          position: 'absolute',
          top: '10%', left: '10%', right: '10%', bottom: '10%',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,150,0,0.5) 25%, transparent 50%, rgba(255,85,0,0.5) 75%, transparent 100%)',
          filter: 'blur(40px)',
          opacity: 0.3,
          borderRadius: '50%',
          mixBlendMode: 'screen'
        }} />

        <div ref={coreRef} style={{
          position: 'absolute',
          top: '25%', left: '25%', right: '25%', bottom: '25%',
          background: 'radial-gradient(circle, #ffffff 0%, #ffdfba 40%, #ff8c00 100%)',
          boxShadow: '0 0 60px 30px rgba(255,130,0,0.8), inset 0 0 30px #ff5500',
          borderRadius: '50%'
        }} />
      </div>
    </div>
  );
}
