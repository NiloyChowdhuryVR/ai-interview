'use client';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base background */}
      <div className="absolute inset-0 bg-background" />

      {/* Gradient mesh */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.12), transparent)',
        }}
      />

      {/* Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.08) 1px, transparent 0)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top gradient fade */}
      <div
        className="absolute top-0 left-0 right-0 h-[400px]"
        style={{
          background: 'linear-gradient(180deg, rgba(99,102,241,0.06) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
