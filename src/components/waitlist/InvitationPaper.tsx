import type { ReactNode } from "react";
import styles from "./Waitlist.module.css";

type Props = {
  brandName: string;
  titleId: string;
  children: ReactNode;
};

export default function InvitationPaper({ brandName, titleId, children }: Props) {
  return (
    <article
              className={styles.card}
              data-waitlist-card
            >
              <div className={styles.letter}>
                <p className={styles.eyebrow}>
                  A note for the curious
                </p>

                <h1
                  id={titleId}
                  className={styles.title}
                >
                  Good things
                  <br />
                  are worth
                  <br />
                  <em className={styles.underlined}>
                    the wait.
                  </em>
                </h1>

                <p className={styles.description}>
                  We’re making something thoughtful.
                  Leave your address and be there for the beginning.
                </p>

                <div className={styles.signature}>
                  <span>Yours,</span>
                  <span className={styles.signatureName}>
                    {brandName}
                  </span>
                </div>
              </div>

              <div className={styles.signup}>
                <div className={styles.signupIntro}>
                  <h2>An invitation, just for you.</h2>
                  <p>Join the waitlist for early access.</p>
                </div>

{children}
              </div>
    </article>
  );
}
