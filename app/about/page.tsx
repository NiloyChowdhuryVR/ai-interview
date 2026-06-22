'use client';

import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title}>About AetherMind</h1>
        <p className={styles.description}>
          We are building the future of career progression. Powered by next-generation AI models, AetherMind provides realistic, real-time mock interviews to prepare you for the toughest technical and behavioral rounds.
        </p>
        
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>Our Mission</h3>
            <p>To democratize access to elite interview preparation and help candidates land their dream jobs with absolute confidence.</p>
          </div>
          <div className={styles.card}>
            <h3>The Technology</h3>
            <p>Powered by ultra-low-latency voice AI and deep contextual analysis to simulate real human interviewers with zero lag.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
