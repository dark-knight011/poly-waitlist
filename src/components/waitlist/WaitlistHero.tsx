import styles from "./WaitlistHero.module.css";

export default function WaitlistHero({ eyebrow }: { eyebrow?: string }) {
  return (
    <header className={styles.hero}>
      <div className={styles.ornament} aria-hidden="true">
        <span />
        <svg viewBox="0 0 64 64">
          <path d="M32 3 L37 22 L53 11 L43 28 L62 32 L43 37 L53 53 L37 43 L32 62 L27 43 L11 53 L22 37 L3 32 L22 28 L11 11 L27 22 Z" />
        </svg>
        <span />
      </div>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h1 className={styles.title}>
        Something worth <em>opening.</em>
      </h1>
    </header>
  );
}
