import type { ReactNode, Ref } from "react";
import styles from "./Waitlist.module.css";

type Props = {
  children: ReactNode;
  brandName?: string;
  frameRef?: Ref<HTMLDivElement>;
};

export default function WaitlistShell({
  children,
  brandName = "Your Brand",
  frameRef,
}: Props) {
  return (
    <main className={styles.page}>
      <div ref={frameRef} className={styles.frame}>
        <header className={styles.header}>
          <span className={styles.brand}>{brandName}</span>
          <span className={styles.edition}>
            An invitation to what’s next
          </span>
        </header>

        {children}

        <footer className={styles.footer}>
          <span>Made with intention.</span>
          <span>Something worth opening.</span>
        </footer>
      </div>
    </main>
  );
}
