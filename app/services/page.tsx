'use client';

import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function ServicesPage() {
  const services = [
    { title: 'Technical Mock Interviews', desc: 'Verbal technical deep-dives with an AI evaluating your algorithms, logic, and problem-solving skills in real-time.' },
    { title: 'System Design Sessions', desc: 'Whiteboard-style verbal architecture rounds simulating Meta or Google-level difficulty.' },
    { title: 'Behavioral Coaching', desc: 'STAR-method scenario practice with instant voice feedback on your delivery.' },
    { title: 'Resume Parsing & Analysis', desc: 'Drop your PDF resume and get targeted interview questions specifically tailored to your experience.' }
  ];

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title}>Our Services</h1>
        <p className={styles.description}>
          End-to-end interview preparation covering everything from algorithmic coding to behavioral psychology.
        </p>
        
        <div className={styles.grid}>
          {services.map((s, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.iconWrapper}>
                <div className={styles.iconGlow}></div>
                <span>⚡</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
