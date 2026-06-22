'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    return pathname === path ? styles.navLinkActive : styles.navLink;
  };

  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <header className={styles.header}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff5500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              <path d="M2 12h20"/>
            </svg>
            <div>AetherMind</div>
          </div>
        </Link>

        <nav className={styles.nav}>
          <Link href="/" className={getLinkClass('/')}>Home</Link>
          <Link href="/about" className={getLinkClass('/about')}>About</Link>
          <Link href="/services" className={getLinkClass('/services')}>Services</Link>
          <Link href="/pricing" className={getLinkClass('/pricing')}>Pricing</Link>
          <Link href="/solutions" className={getLinkClass('/solutions')}>Solutions</Link>
        </nav>

        <button className={styles.loginBtn} onClick={() => setShowModal(true)}>Login/Register</button>
      </header>

      {/* Coming Soon Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#111116', border: '1px solid #333', borderRadius: '12px',
            padding: '40px', maxWidth: '400px', textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(255,85,0,0.1)'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff5500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '10px' }}>Coming Soon</h2>
            <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '25px' }}>
              The authentication system is currently under development. This feature will be implemented in the next major update!
            </p>
            <button 
              onClick={() => setShowModal(false)}
              style={{
                background: '#ff5500', color: '#000', border: 'none', borderRadius: '6px',
                padding: '10px 24px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase',
                letterSpacing: '1px', fontSize: '0.85rem'
              }}
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
}
