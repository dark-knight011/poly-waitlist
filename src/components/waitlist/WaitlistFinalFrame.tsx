import ReceivingEnvelope from "./ReceivingEnvelope";
import WaitlistShell from "./WaitlistShell";
import shared from "./Waitlist.module.css";
import styles from "./WaitlistFinalFrame.module.css";

type Props = { brandName?: string };

export default function WaitlistFinalFrame({
  brandName = "Your Brand",
}: Props) {
  return (
    <WaitlistShell brandName={brandName}>
      <section
        className={`${shared.stage} ${styles.scene}`}
        data-scene="final"
        aria-labelledby="final-frame-title"
      >
        <div className={styles.confirmation}>
          <h1
            id="final-frame-title"
            className={`${shared.title} ${styles.title}`}
          >
            You’re on the list.
          </h1>

          <p className={`${shared.description} ${styles.description}`}>
            A little patience. Something good is on its way.
          </p>

          <span
            className={`${shared.underlined} ${styles.accent}`}
            aria-hidden="true"
          />
        </div>

        <div className={styles.artwork} aria-hidden="true">
          <div className={styles.receiverPosition}>
            <ReceivingEnvelope />
          </div>
        </div>
      </section>
    </WaitlistShell>
  );
}
