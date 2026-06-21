'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, Mic, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home', icon: Brain },
    { href: '/interview', label: 'Interview', icon: Mic },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(3, 7, 18, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(99,102,241,0.1)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-3 flex items-center justify-center shadow-lg shadow-accent/20 group-hover:shadow-accent/40 transition-all duration-300 group-hover:scale-105">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text hidden sm:block">InterviewAI</span>
        </Link>

        {/* Nav Links */}
        <div
          className="flex items-center gap-1 px-1.5 py-1.5 rounded-2xl"
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(99,102,241,0.12)',
          }}
        >
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300"
                style={{
                  color: isActive ? '#ffffff' : '#94a3b8',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget.style.color = '#e2e8f0');
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget.style.color = '#94a3b8');
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </span>
              </Link>
            );
          })}
        </div>

        {/* Spacer for balance */}
        <div className="w-[120px] hidden sm:block" />
      </div>
    </motion.nav>
  );
}
