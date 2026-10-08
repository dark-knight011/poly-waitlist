import { useId, type FormEvent, type RefObject } from "react";
import styles from "./WaitlistCard.module.css";

type Props = {
  brandName: string;
  title: string;
  email: string;
  error: string;
  submitting: boolean;
  accepted: boolean;
  demo: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function WaitlistCard({
  brandName,
  title,
  email,
  error,
  submitting,
  accepted,
  demo,
  inputRef,
  onEmailChange,
  onSubmit,
}: Props) {
  const id = useId();
  return (
    <div
      className={styles.card}
      data-waitlist-card
      inert={accepted}
      aria-hidden={accepted || undefined}
    >
      <section className={styles.signupPanel} aria-labelledby={`${id}-title`}>
        <header>
          <span className={styles.kicker}>A place on the list</span>
          <h2 id={`${id}-title`} className={styles.title}>
            {title}
          </h2>
          <p className={styles.note}>Be there for the beginning.</p>
        </header>
        <form
          className={styles.form}
          onSubmit={onSubmit}
          noValidate
          aria-busy={submitting}
        >
          <label htmlFor={`${id}-email`} className={styles.label}>
            Your email address
          </label>
          <input
            ref={inputRef}
            id={`${id}-email`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={254}
            placeholder="you@example.com"
            value={email}
            disabled={submitting || accepted}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : `${id}-helper`}
            onChange={(event) => onEmailChange(event.target.value)}
            className={styles.input}
          />
          <button
            type="submit"
            disabled={submitting || accepted}
            className={styles.submit}
          >
            <span>
              {submitting
                ? "Joining…"
                : accepted
                  ? "Joined"
                  : demo
                    ? "Preview the invitation"
                    : "Join the waitlist"}
            </span>
            <span aria-hidden="true">↗</span>
          </button>
          <p id={`${id}-helper`} className={styles.helper}>
            {demo
              ? "Preview only — your email won’t be saved."
              : "One invitation when we’re ready. No noise."}
          </p>
          <p id={`${id}-error`} role="alert" className={styles.error}>
            {error}
          </p>
        </form>
      </section>
      <article className={styles.letter} aria-label="A note from us">
        <div className={styles.letterHead}>
          <span>To,</span>
          <span className={styles.recipient}>{email || "Someone curious"}</span>
          <span className={styles.stamp} aria-hidden="true">
            ✳
          </span>
        </div>
        <div className={styles.letterBody}>
          <p className={styles.lead}>
            Good things take <br />a little intention.
          </p>
          <p className={styles.paragraph}>
            We’re making room for something thoughtful. A little less noise. A
            little more meaning.
          </p>
          <p className={styles.paragraph}>
            Leave your address. You’ll be the first to know when it’s ready.
          </p>
        </div>
        <footer className={styles.letterFooter}>
          <span>
            Yours,<strong>{brandName}</strong>
          </span>
          <span className={styles.privateNote}>A note, just for you</span>
        </footer>
      </article>
    </div>
  );
}
