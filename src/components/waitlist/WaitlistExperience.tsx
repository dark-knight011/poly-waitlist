"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { normalizeEmail } from "@/lib/waitlist";
import Envelope from "./Envelope";
import SubmissionLetter from "./SubmissionLetter";
import WaitlistCard from "./WaitlistCard";
import WaitlistHero from "./WaitlistHero";
import { useWaitlistAnimation } from "./useWaitlistAnimation";
import styles from "./WaitlistExperience.module.css";

type Status = "idle" | "submitting" | "accepted" | "error";
type Phase = "ready" | "playing" | "settled";
type Props = {
  brandName?: string;
  title?: string;
  eyebrow?: string;
  demo?: boolean;
};

export default function WaitlistExperience({
  brandName = "Your Brand",
  title = "Join the waitlist.",
  eyebrow = "A quieter kind of launch",
  demo = false,
}: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [phase, setPhase] = useState<Phase>("ready");
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const skipRef = useRef<HTMLButtonElement | null>(null);
  const inFlight = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const keyboardSubmit = useRef(false);
  const { sceneRef, playSuccess, finishImmediately } = useWaitlistAnimation();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (
      phase === "settled" &&
      (keyboardSubmit.current ||
        document.activeElement === document.body ||
        document.activeElement === skipRef.current)
    ) {
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [phase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || status === "accepted") return;
    const normalized = normalizeEmail(email);
    if (!normalized) {
      setStatus("error");
      setError("Enter a valid email address.");
      inputRef.current?.focus();
      return;
    }
    inFlight.current = true;
    setStatus("submitting");
    setError("");
    setAnnouncement(demo ? "Preparing the preview…" : "Joining the waitlist…");
    const request = new AbortController();
    controller.current = request;
    const timeout = window.setTimeout(() => request.abort("timeout"), 12000);
    let accepted = false;
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
        signal: request.signal,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.ok !== true || Boolean(data.demo) !== demo) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "We couldn’t confirm your place. Please try again.",
        );
      }
      if (!mounted.current) return;
      accepted = true;
      setStatus("accepted");
      setEmail(normalized);
      setPhase("playing");
      setAnnouncement(
        demo
          ? "Preview ready. No email has been saved."
          : "Your email is saved. You’re on the list.",
      );
      inputRef.current?.blur();
    } catch (cause) {
      if (!mounted.current) return;
      setStatus("error");
      setAnnouncement("");
      setError(
        request.signal.aborted
          ? "We couldn’t confirm the result in time. Please try again."
          : cause instanceof Error
            ? cause.message
            : "Couldn’t connect. Please try again.",
      );
    } finally {
      window.clearTimeout(timeout);
      if (controller.current === request) controller.current = null;
      if (!accepted) inFlight.current = false;
    }
    if (!accepted || !mounted.current) return;
    try {
      await playSuccess(keyboardSubmit.current);
    } catch {
      // Keep the accepted result even if the optional presentation fails.
    } finally {
      if (mounted.current) setPhase("settled");
    }
  }

  return (
    <main className={styles.page}>
      <section ref={sceneRef} className={styles.scene} data-phase={phase}>
        <div className={styles.topline}>
          <span className={styles.brand}>{brandName}</span>
          <span className={styles.edition}>An invitation to what’s next</span>
        </div>
        <WaitlistHero eyebrow={eyebrow} />
        {demo && (
          <aside className={styles.preview}>
            Preview mode. Try the invitation animation; no email will be saved.
          </aside>
        )}
        <div
          className={styles.stage}
          data-stage
          onPointerDownCapture={() => {
            keyboardSubmit.current = false;
          }}
          onKeyDownCapture={(event) => {
            if (event.key === "Enter" || event.key === " ")
              keyboardSubmit.current = true;
          }}
        >
          <WaitlistCard
            brandName={brandName}
            title={title}
            email={email}
            error={error}
            submitting={status === "submitting"}
            accepted={status === "accepted"}
            demo={demo}
            inputRef={inputRef}
            onEmailChange={(value) => {
              setEmail(value);
              if (error) {
                setError("");
                setStatus("idle");
              }
            }}
            onSubmit={handleSubmit}
          />
          <Envelope>
            <SubmissionLetter brandName={brandName} email={email} demo={demo} />
          </Envelope>
          <div className={styles.success} aria-hidden={phase !== "settled"}>
            <span className={styles.successLabel}>
              {demo ? "Just a preview" : "Signed, sealed, saved"}
            </span>
            <h2 ref={headingRef} tabIndex={-1}>
              {demo ? "Worth opening." : "You’re on the list."}
            </h2>
            <p>
              {demo
                ? "That’s the invitation. No email has been saved."
                : "A little patience. Something good is on its way."}
            </p>
          </div>
          {phase === "playing" && (
            <button
              ref={skipRef}
              className={styles.skip}
              type="button"
              onClick={finishImmediately}
            >
              Skip animation
            </button>
          )}
        </div>
        <p
          className={styles.srOnly}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {announcement}
        </p>
        <footer className={styles.footer}>
          <span>Made with intention.</span>
          <span>Good things are worth the wait.</span>
        </footer>
      </section>
    </main>
  );
}
