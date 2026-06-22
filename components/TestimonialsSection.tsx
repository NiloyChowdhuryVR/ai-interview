import styles from './TestimonialsSection.module.css';

export default function TestimonialsSection() {
  const testimonials = [
    { quote: "The system design scenarios were brutally realistic. It pointed out a database partitioning flaw I hadn't considered. Landed my Meta offer a week later.", author: "Sarah J.", role: "Senior Engineer at Meta" },
    { quote: "I used to freeze up on behavioral questions. The instant voice feedback trained me to structure my STAR responses perfectly.", author: "David L.", role: "Product Manager" },
    { quote: "It feels like you're talking to a real interviewer. The ultra-low latency voice makes it immersive and incredibly effective.", author: "Priya M.", role: "Software Engineer" }
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Success Stories</h2>
        </div>
        <div className={styles.grid}>
          {testimonials.map((t, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.stars}>★★★★★</div>
              <p className={styles.quote}>"{t.quote}"</p>
              <div className={styles.authorBox}>
                <div className={styles.avatar}>{t.author.charAt(0)}</div>
                <div>
                  <div className={styles.author}>{t.author}</div>
                  <div className={styles.role}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
