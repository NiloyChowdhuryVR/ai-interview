'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import styles from './BackgroundEffects.module.css';

gsap.registerPlugin(useGSAP);

export default function BackgroundEffects() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Animate the main top-left glow (breathing effect)
    gsap.to(`.${styles.glow}`, {
      scale: 1.1,
      opacity: 0.8,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Floating animation for background flares
    const flares = gsap.utils.toArray(`.${styles.flare}`);
    flares.forEach((flare: any) => {
      gsap.set(flare, { 
        x: () => Math.random() * window.innerWidth - window.innerWidth / 2, 
        y: () => Math.random() * window.innerHeight - window.innerHeight / 2 
      });
      gsap.to(flare, {
        x: () => "+=" + (Math.random() * 300 - 150),
        y: () => "+=" + (Math.random() * 300 - 150),
        opacity: () => 0.2 + Math.random() * 0.8,
        scale: () => 0.5 + Math.random() * 1,
        duration: () => 4 + Math.random() * 5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    });

    // Interactive Custom Cursor
    const cursorX = gsap.quickTo(`.${styles.cursor}`, "x", { duration: 0.1, ease: "power2.out" });
    const cursorY = gsap.quickTo(`.${styles.cursor}`, "y", { duration: 0.1, ease: "power2.out" });
    const trails = document.querySelectorAll(`.${styles.cursorTrail}`);

    const onMouseMove = (e: MouseEvent) => {
      cursorX(e.clientX);
      cursorY(e.clientY);
      
      // Trail effect (fused flareline)
      trails.forEach((trail: any, i: number) => {
        gsap.to(trail, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.1 + (i * 0.02),
          ease: "power2.out",
          overwrite: "auto"
        });
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    
    // Cursor hover effects
    const clickables = document.querySelectorAll('a, button, input, textarea, select');
    const onEnter = () => gsap.to(`.${styles.cursor}`, { scale: 1.5, duration: 0.3 });
    const onLeave = () => gsap.to(`.${styles.cursor}`, { scale: 1, duration: 0.3 });

    clickables.forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      clickables.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  }, { scope: containerRef });

  return (
    <div ref={containerRef} style={{ pointerEvents: 'none' }}>
      
      {/* Background Layer (Glows & Flares) */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9998 }}>
        <div className={styles.glow} />
        {[...Array(30)].map((_, i) => (
          <div 
            key={`flare-${i}`} 
            className={styles.flare}  
            ref={el => {
              if (el) {
                gsap.set(el, {
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`
                });
                gsap.to(el, {
                  y: `-=${Math.random() * 30 + 20}`,
                  x: `+=${Math.random() * 20 - 10}`,
                  opacity: Math.random() * 0.5 + 0.3,
                  duration: Math.random() * 3 + 2,
                  repeat: -1,
                  yoyo: true,
                  ease: "sine.inOut"
                });
              }
            }}
          />
        ))}
      </div>

      {/* Foreground Layer (Cursor) */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 999999 }}>
        <div className={styles.cursor} />
        {[...Array(20)].map((_, i) => <div key={`trail-${i}`} className={styles.cursorTrail} />)}
      </div>

    </div>
  );
}
