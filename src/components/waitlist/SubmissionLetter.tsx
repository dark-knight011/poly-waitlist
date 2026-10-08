import styles from "./SubmissionLetter.module.css";

export default function SubmissionLetter({
  brandName,
  email,
  demo,
}: {
  brandName: string;
  email: string;
  demo: boolean;
}) {
  return (
    <div className={styles.letter} data-submission-letter aria-hidden="true">
      <span className={styles.eyebrow}>
        {demo ? "A little preview" : "An invitation, saved"}
      </span>
      <strong className={styles.title}>
        {demo ? "Worth opening." : "You’re on the list."}
      </strong>
      <p className={styles.recipient}>{email}</p>
      <div className={styles.signature}>
        <span>Yours,</span>
        <span>{brandName}</span>
      </div>
      <span className={styles.star}>✳</span>
    </div>
  );
}
