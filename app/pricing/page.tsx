'use client';

import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function PricingPage() {
  const plans = [
    { name: 'Starter', price: 'Free', features: ['3 Mock Interviews/mo', 'Basic Analytics', 'Community Support'], isPro: false },
    { name: 'Pro', price: '₹1999/mo', features: ['Unlimited Mock Interviews', 'Advanced Analytics', 'System Design Scenarios', 'Priority Feedback'], isPro: true },
    { name: 'Enterprise', price: 'Contact Us', features: ['Custom Scenarios', 'API Access', 'Dedicated Account Manager', 'White-labeling'], isPro: false }
  ];

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title}>Simple, transparent pricing</h1>
        <p className={styles.description}>
          Choose the plan that fits your career goals. No hidden fees.
        </p>
        
        <div className={styles.grid}>
          {plans.map((p, i) => (
            <div key={i} className={`${styles.card} ${p.isPro ? styles.cardPro : ''}`}>
              {p.isPro && <div className={styles.badge}>Most Popular</div>}
              <h3>{p.name}</h3>
              <div className={styles.price}>{p.price}</div>
              <ul className={styles.features}>
                {p.features.map((f, j) => (
                  <li key={j}>
                    <span className={styles.check}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className={`${styles.btn} ${p.isPro ? styles.btnPro : ''}`}>
                {p.name === 'Enterprise' ? 'Contact Us' : 'BUY NOW'}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
