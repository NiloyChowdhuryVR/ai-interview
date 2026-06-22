import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#050505" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              <path d="M2 12h20"/>
            </svg>
            <span>AetherMind</span>
          </div>
          <p className={styles.tagline}>
            Next-generation AI mock interviews to build smart careers.
          </p>
        </div>
        
        <div className={styles.links}>
          <div className={styles.column}>
            <h4>Product</h4>
            <Link href="/services">Features</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/solutions">Solutions</Link>
          </div>
          <div className={styles.column}>
            <h4>Company</h4>
            <Link href="/about">About Us</Link>
            <Link href="#">Careers</Link>
            <Link href="#">Contact</Link>
          </div>
          <div className={styles.column}>
            <h4>Legal</h4>
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms of Service</Link>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>&copy; {new Date().getFullYear()} AetherMind. All rights reserved.</p>
      </div>
    </footer>
  );
}
