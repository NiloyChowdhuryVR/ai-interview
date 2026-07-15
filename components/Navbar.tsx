'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();

  const getLinkClass = (path: string) => {
    return pathname === path ? styles.navLinkActive : styles.navLink;
  };

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
          
          {isSignedIn && (
            <Link href="/profile" className={getLinkClass('/profile')}>Dashboard</Link>
          )}

          <Link href="/services" className={getLinkClass('/services')}>Services</Link>
          <Link href="/pricing" className={getLinkClass('/pricing')}>Pricing</Link>
          <Link href="/solutions" className={getLinkClass('/solutions')}>Solutions</Link>
        </nav>

        <div>
          {isLoaded && !isSignedIn && (
            <SignInButton mode="modal">
              <button className={styles.loginBtn}>Login/Register</button>
            </SignInButton>
          )}
          {isLoaded && isSignedIn && (
            <UserButton appearance={{ elements: { userButtonAvatarBox: { width: 36, height: 36 } } }} />
          )}
        </div>
      </header>
    </>
  );
}
