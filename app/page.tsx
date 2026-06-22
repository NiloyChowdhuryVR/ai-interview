'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useInterviewStore } from '@/store/interviewStore';
import SetupModal from '@/components/SetupModal';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FeaturesSection from '@/components/FeaturesSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import styles from './page.module.css';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function Home() {
  const { reset: resetStore } = useInterviewStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const ideRef = useRef<HTMLDivElement>(null);
  const blackHoleRadiationRef = useRef<HTMLDivElement>(null);
  const blackHoleRingRef = useRef<HTMLDivElement>(null);
  const blackHoleCenterRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Initialize correct centering for GSAP
    if (blackHoleCenterRef.current && blackHoleRingRef.current && blackHoleRadiationRef.current) {
      gsap.set([blackHoleCenterRef.current, blackHoleRingRef.current, blackHoleRadiationRef.current], {
        xPercent: -50,
        yPercent: -50
      });
    }

    // Animate the main top-left glow (breathing effect)
    gsap.to(`.${styles.glow}`, {
      scale: 1.1,
      opacity: 0.8,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Animate the Black Hole Ring
    gsap.to(`.${styles.blackHoleRing}`, {
      scale: 1.05,
      opacity: 0.8,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Normalize mouse position (-0.5 to 0.5)
    const onMouseMove = (e: MouseEvent) => {
      const xPosNorm = (e.clientX / window.innerWidth - 0.5);
      const yPosNorm = (e.clientY / window.innerHeight - 0.5);

      // Black hole depth & light intensifying animation
      if (blackHoleCenterRef.current) {
        gsap.to(blackHoleCenterRef.current, { x: xPosNorm * 30, y: yPosNorm * 30, duration: 1, ease: "power2.out", overwrite: "auto" });
      }
      if (blackHoleRingRef.current) {
        gsap.to(blackHoleRingRef.current, { x: xPosNorm * 15, y: yPosNorm * 15, duration: 1.5, ease: "power2.out", overwrite: "auto" });
      }
      if (blackHoleRadiationRef.current) {
        gsap.to(blackHoleRadiationRef.current, { x: xPosNorm * -20, y: yPosNorm * -10, duration: 2, ease: "power2.out", overwrite: "auto" });
      }

      // Subtle IDE Parallax
      if (ideRef.current) {
        gsap.to(ideRef.current, {
          x: xPosNorm * 20,
          y: yPosNorm * 20,
          rotationY: xPosNorm * 10 - 5,
          rotationX: -yPosNorm * 10 + 2,
          duration: 0.5,
          ease: "power2.out"
        });
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, { scope: containerRef });

  // Reset store and storage on mount to clear old interviews
  useEffect(() => {
    resetStore();
    sessionStorage.removeItem('interviewSetup');
    sessionStorage.removeItem('interviewFeedback');
  }, [resetStore]);

  return (
    <div className={styles.container} ref={containerRef} style={{ cursor: 'none' }}>

      {/* Header */}
      <Navbar />

      {/* Hero Section */}
      <main className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            AI-Powered Interview Coach
          </div>
          
          <h1 className={styles.title}>
            BUILDING SMART CAREERS, POWERED BY AI.
          </h1>
          
          <p className={styles.description}>
            Boost your confidence with AI-powered mock interviews, real-time voice interaction, and intelligent feedback—so you can focus on what truly matters: landing your dream job.
          </p>
          
          <div className={styles.actions}>
            <button className={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
              Get Started ↗
            </button>
            <Link href="/resume-builder">
              <button className={styles.secondaryBtn}>
                Resume Builder
              </button>
            </Link>
          </div>
        </div>

        {/* IDE Mockup & Black Hole */}
        <div className={styles.heroBottom}>
          <div className={styles.blackHoleRadiation} ref={blackHoleRadiationRef} />
          <div className={styles.blackHoleCenter} ref={blackHoleCenterRef} />
          <div className={styles.blackHoleRing} ref={blackHoleRingRef} />
          
          <div className={styles.ideWrapper} ref={ideRef}>
            <div className={styles.ideBody}>
              <div className={styles.dashboardContainer}>
                {/* Full-width Header Row */}
                <div className={styles.dashHeader}>
                  <div className={styles.dashStatus}>
                    <span className={styles.statusDot}></span> Live System
                  </div>
                </div>

                {/* Content Row (Metrics + Chart) */}
                <div className={styles.dashContent}>
                  <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                      <div className={styles.metricLabel}>Success Rate</div>
                      <div className={styles.metricValue}>87.4%</div>
                      <div className={styles.metricTrendPositive}>↗ +34%</div>
                    </div>
                    <div className={styles.metricCard}>
                      <div className={styles.metricLabel}>Confidence</div>
                      <div className={styles.metricValue}>9.2</div>
                      <div className={styles.metricTrendPositive}>↗ +1.8</div>
                    </div>
                    <div className={styles.metricCard}>
                      <div className={styles.metricLabel}>Processed</div>
                      <div className={styles.metricValue}>12.4k</div>
                      <div className={styles.metricTrendNeutral}>→ Steady</div>
                    </div>
                    <div className={styles.metricCard}>
                      <div className={styles.metricLabel}>Code Quality</div>
                      <div className={styles.metricValue}>A+</div>
                      <div className={styles.metricTrendPositive}>↗ +12%</div>
                    </div>
                    <div className={styles.metricCard}>
                      <div className={styles.metricLabel}>Uptime</div>
                      <div className={styles.metricValue}>99.9%</div>
                      <div className={styles.metricTrendNeutral}>→ Stable</div>
                    </div>
                    <div className={styles.metricCard}>
                      <div className={styles.metricLabel}>Active Users</div>
                      <div className={styles.metricValue}>842</div>
                      <div className={styles.metricTrendPositive}>↗ +5%</div>
                    </div>
                  </div>

                  <div className={styles.chartContainer}>
                    <div className={styles.chartHeader}>
                      <h4>Skill Progression</h4>
                    </div>
                    <div className={styles.chartWrapper}>
                      <svg viewBox="0 0 400 300" className={styles.chartSvg} preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(255, 85, 0, 0.3)" />
                            <stop offset="100%" stopColor="rgba(255, 85, 0, 0)" />
                          </linearGradient>
                        </defs>
                        <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="5,5" />
                        <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="5,5" />
                        
                        <path d="M 0,250 C 100,230 150,280 250,150 C 300,80 350,120 400,40 L 400,300 L 0,300 Z" fill="url(#chartGradient)" />
                        <path d="M 0,250 C 100,230 150,280 250,150 C 300,80 350,120 400,40" fill="none" stroke="#ff5500" strokeWidth="3" strokeLinecap="round" style={{ filter: 'drop-shadow(0px 0px 8px rgba(255, 85, 0, 0.6))' }} />
                        
                        <circle cx="0" cy="250" r="5" fill="#0f0f11" stroke="#ff5500" strokeWidth="2" />
                        <circle cx="250" cy="150" r="5" fill="#0f0f11" stroke="#ff5500" strokeWidth="2" />
                        <circle cx="400" cy="40" r="5" fill="#0f0f11" stroke="#ff5500" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Landing Page Content Sections */}
      <FeaturesSection />
      <TestimonialsSection />

      {/* Pop-up Modal for Setup Flow */}
      <SetupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Inverted Orange Footer */}
      <Footer />
    </div>
  );
}
