import styles from './FeaturesSection.module.css';

export default function FeaturesSection() {
  const features = [
    { icon: '🎙️', title: 'Ultra-low Latency Voice', desc: 'Converse naturally with our AI without awkward pauses or delays. It feels just like talking to a real human engineer.' },
    { icon: '🧠', title: 'Deep Contextual Memory', desc: 'The AI remembers your resume, past answers, and project details throughout the entire interview to ask deep follow-up questions.' },
    { icon: '🎯', title: 'Targeted Questioning', desc: 'Receive dynamically generated technical and behavioral questions perfectly tailored to your specific role and seniority level.' },
    { icon: '📊', title: 'Actionable Analytics', desc: 'After every session, receive a detailed breakdown of your pacing, confidence, technical accuracy, and areas for improvement.' }
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Why Top Engineers Choose Us</h2>
          <p>Everything you need to master the art of the technical interview.</p>
        </div>
        <div className={styles.grid}>
          {features.map((f, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.icon}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
