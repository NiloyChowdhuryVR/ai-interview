'use client';

import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function SolutionsPage() {
  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title}>Tailored for your success</h1>
        <p className={styles.description}>
          Whether you are a student looking for your first internship, or an enterprise scaling your interview operations, we have a solution for you.
        </p>
        
        <div className={styles.stack}>
          <div className={styles.block}>
            <div className={styles.blockText}>
              <h3>For Students & Grads</h3>
              <p>Break into tech with confidence. Practice common data structures, algorithms, and behavioral questions tailored for junior roles. Get instant feedback on where to improve before your actual interviews.</p>
            </div>
            <div className={styles.blockImage}>
              <div className={styles.mockup}>Student Dashboard</div>
            </div>
          </div>
          
          <div className={`${styles.block} ${styles.blockReverse}`}>
            <div className={styles.blockText}>
              <h3>For Experienced Pros</h3>
              <p>Preparing for Staff or Senior roles? Our AI conducts advanced System Design interviews, asking deep follow-up questions about scalability, tradeoffs, and database partitioning.</p>
            </div>
            <div className={styles.blockImage}>
              <div className={styles.mockup}>Architecture Review</div>
            </div>
          </div>
          
          <div className={styles.block}>
            <div className={styles.blockText}>
              <h3>For Universities & Enterprises</h3>
              <p>Scale your mock interview capabilities. Track student or candidate progress across thousands of interviews with our enterprise analytics dashboard. Identify weak points in cohorts instantly.</p>
            </div>
            <div className={styles.blockImage}>
              <div className={styles.mockup}>Enterprise Analytics</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
