import type { ReactNode, Ref } from "react";
import shared from "./Waitlist.module.css";
import styles from "./PaperFlipCard.module.css";

type Props = {
  children: ReactNode;
  brandName: string;
  rotorRef: Ref<HTMLDivElement>;
};

/** Front content determines the dimensions; the reverse fills that same paper. */
export default function PaperFlipCard({ children, brandName, rotorRef }: Props) {
  return (
    <div ref={rotorRef} className={styles.rotor}>
      <div className={styles.front}>{children}</div>
      <div className={`${shared.card} ${styles.back}`}>
        <p className={`${shared.signatureName} ${styles.message}`}>For you</p>
        <span className={`${shared.underlined} ${styles.flourish}`} />
        <p className={`${shared.signatureName} ${styles.signature}`}>{brandName}</p>
      </div>
    </div>
  );
}
