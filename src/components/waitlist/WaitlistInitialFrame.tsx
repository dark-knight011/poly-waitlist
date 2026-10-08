"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { normalizeEmail } from "@/lib/waitlist";
import WaitlistShell from "./WaitlistShell";
import InvitationPaper from "./InvitationPaper";
import styles from "./Waitlist.module.css";

type Side = "left" | "right";
type Layer = "rear" | "front";
type Status = "idle" | "submitting" | "accepted" | "error";

type Props = {
  brandName?: string;
  demo?: boolean;
};

const HAND_ASSETS = {
  left: {
    rear: "/left-hand-layers/left-hand-rear.png",
    front: "/left-hand-layers/left-hand-front.png",
  },
  right: {
    rear: "/right-hand-layers/right-hand-rear.png",
    front: "/right-hand-layers/right-hand-front.png",
  },
} as const;

const HAND_LAYERS: readonly Layer[] = ["rear", "front"];

function HandPair({ side }: { side: Side }) {
  const [loaded, setLoaded] = useState({
    rear: false,
    front: false,
  });
  const [failed, setFailed] = useState(false);

  const ready = loaded.rear && loaded.front && !failed;

  return (
    <>
      {HAND_LAYERS.map((layer) => (
        <Image
          key={layer}
          src={HAND_ASSETS[side][layer]}
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          unoptimized
          loading="eager"
          draggable={false}
          className={[
            styles.hand,
            styles[side],
            styles[layer],
          ].join(" ")}
          data-ready={ready}
          data-hand={side}
          data-layer={layer}
          onLoad={() => {
            setLoaded((current) => ({
              ...current,
              [layer]: true,
            }));
          }}
          onError={() => setFailed(true)}
        />
      ))}
    </>
  );
}

export default function WaitlistInitialFrame({
  brandName = "Your Brand",
  demo = false,
}: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);
  const inFlightRef = useRef(false);
  const stageRef = useRef<HTMLElement>(null);
  const compositionRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const submitting = status === "submitting";
  const accepted = status === "accepted";

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
    };
  }, []);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const stage = stageRef.current;
    const composition = compositionRef.current;

    if (!frame || !stage || !composition) return;

    const desktop = window.matchMedia("(min-width: 901px)");
    const fitViewport = window.matchMedia(
        "(min-width: 901px) and (min-height: 600px)",
    );

    /*
    * Coordinates within the original 1536 × 1024 PNG canvases.
    * These correspond to the existing CSS grip anchors.
    *
    * sleeveX refers to the artwork, not the transparent canvas edge.
    */
    const source = {
        width: 1536,
        left: {
        gripX: 1220,
        sleeveX: 130,
        },
        right: {
        gripX: 500,
        sleeveX: 1115,
        },
    };

    // Keep the sleeve termination safely outside the visible frame.
    const bleed = 28;

    let active = true;
    let frameId = 0;

    function updateGeometry() {
        if (!active || !frame || !stage || !composition) return;

        /*
        * Restore the stylesheet's preferred hand sizes before measuring.
        * The calculation below only enlarges them when extra reach is needed.
        */
        composition.style.removeProperty("--left-hand-width");
        composition.style.removeProperty("--right-hand-width");

        if (!desktop.matches) {
        composition.style.setProperty("--scene-scale", "1");
        return;
        }

        let scale = 1;

        if (fitViewport.matches) {
        const stageStyle = window.getComputedStyle(stage);

        const availableHeight =
            stage.clientHeight -
            parseFloat(stageStyle.paddingTop) -
            parseFloat(stageStyle.paddingBottom);

        const naturalHeight = composition.offsetHeight;

        if (availableHeight > 0 && naturalHeight > 0) {
            scale = Math.min(1, availableHeight / naturalHeight);
        }
        }

        composition.style.setProperty("--scene-scale", String(scale));

        const leftImage = composition.querySelector<HTMLImageElement>(
        '[data-hand="left"][data-layer="rear"]',
        );

        const rightImage = composition.querySelector<HTMLImageElement>(
        '[data-hand="right"][data-layer="rear"]',
        );

        if (!leftImage || !rightImage) return;

        // CSS widths are measured before the parent composition's scale.
        const preferredLeftWidth = parseFloat(
        window.getComputedStyle(leftImage).width,
        );

        const preferredRightWidth = parseFloat(
        window.getComputedStyle(rightImage).width,
        );

        // These rectangles include the composition's applied scale.
        const frameRect = frame.getBoundingClientRect();
        const cardRect = composition.getBoundingClientRect();

        const frameLeft = frameRect.left + frame.clientLeft;
        const frameRight = frameLeft + frame.clientWidth;

        const leftReach = Math.max(
        0,
        cardRect.left - frameLeft + bleed,
        );

        const rightReach = Math.max(
        0,
        frameRight - cardRect.right + bleed,
        );

        const leftSourceSpan =
        source.left.gripX - source.left.sleeveX;

        const rightSourceSpan =
        source.right.sleeveX - source.right.gripX;

        /*
        * Convert the required visible reach into a full PNG width.
        * Divide by the parent scale because these widths are local
        * to the composition.
        */
        const requiredLeftWidth =
        (leftReach * source.width) / leftSourceSpan / scale;

        const requiredRightWidth =
        (rightReach * source.width) / rightSourceSpan / scale;

        composition.style.setProperty(
        "--left-hand-width",
        `${Math.max(preferredLeftWidth, requiredLeftWidth)}px`,
        );

        composition.style.setProperty(
        "--right-hand-width",
        `${Math.max(preferredRightWidth, requiredRightWidth)}px`,
        );
    }

    function scheduleUpdate() {
        if (!active) return;

        window.cancelAnimationFrame(frameId);
        frameId = window.requestAnimationFrame(updateGeometry);
    }

    updateGeometry();

    const observer = new ResizeObserver(scheduleUpdate);

    observer.observe(frame);
    observer.observe(stage);
    observer.observe(composition);

    desktop.addEventListener("change", scheduleUpdate);
    fitViewport.addEventListener("change", scheduleUpdate);

    void document.fonts.ready.then(scheduleUpdate);

    return () => {
        active = false;

        observer.disconnect();
        window.cancelAnimationFrame(frameId);

        desktop.removeEventListener("change", scheduleUpdate);
        fitViewport.removeEventListener("change", scheduleUpdate);
    };
    }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlightRef.current || accepted) return;

    const normalized = normalizeEmail(email);

    if (!normalized) {
      setStatus("error");
      setError("Enter a valid email address.");
      inputRef.current?.focus();
      return;
    }

    inFlightRef.current = true;
    setStatus("submitting");
    setError("");

    const controller = new AbortController();
    requestRef.current = controller;

    const timeout = window.setTimeout(() => {
      controller.abort();
    }, 12000);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalized }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);

      if (
        !response.ok ||
        data?.ok !== true ||
        Boolean(data?.demo) !== demo
      ) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "We couldn’t confirm your place. Please try again.",
        );
      }

      if (!mountedRef.current) return;

      setEmail(normalized);
      setStatus("accepted");
    } catch (cause) {
      if (!mountedRef.current) return;

      setStatus("error");
      setError(
        controller.signal.aborted
          ? "We couldn’t confirm the result in time. Please try again."
          : cause instanceof Error
            ? cause.message
            : "Couldn’t connect. Please try again.",
      );
    } finally {
      window.clearTimeout(timeout);

      if (requestRef.current === controller) {
        requestRef.current = null;
      }

      inFlightRef.current = false;
    }
  }

  const announcement = submitting
    ? demo
      ? "Checking the preview…"
      : "Joining the waitlist…"
    : accepted
      ? demo
        ? "Preview complete. No email was saved."
        : "You’re on the list. We’ll be in touch."
      : "";

  return (
    <WaitlistShell brandName={brandName} frameRef={frameRef}>
        <section
          ref={stageRef}
          className={styles.stage}
          aria-labelledby={`${id}-title`}
        >
          <div ref={compositionRef} className={styles.composition}>
            <HandPair side="left" />
            <HandPair side="right" />

            <InvitationPaper brandName={brandName} titleId={`${id}-title`}>
                <form
                  className={styles.form}
                  onSubmit={handleSubmit}
                  noValidate
                  aria-busy={submitting}
                >
                  <label
                    htmlFor={`${id}-email`}
                    className={styles.label}
                  >
                    Email address
                  </label>

                  <input
                    ref={inputRef}
                    id={`${id}-email`}
                    className={styles.input}
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
                    aria-describedby={[
                      `${id}-helper`,
                      error ? `${id}-error` : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onChange={(event) => {
                      setEmail(event.target.value);

                      if (status === "error") {
                        setStatus("idle");
                        setError("");
                      }
                    }}
                  />

                  <button
                    className={styles.submit}
                    type="submit"
                    disabled={submitting || accepted}
                  >
                    <span>
                      {submitting
                        ? "Joining…"
                        : accepted
                          ? demo
                            ? "Preview complete"
                            : "You’re on the list"
                          : "Join the waitlist"}
                    </span>
                    <span aria-hidden="true">
                      {accepted ? "✓" : "→"}
                    </span>
                  </button>

                  <p
                    id={`${id}-helper`}
                    className={styles.helper}
                  >
                    {demo
                      ? "Preview only. Your email won’t be saved."
                      : "One invitation. No noise."}
                  </p>

                  <div className={styles.feedback}>
                    <p
                      id={`${id}-error`}
                      className={styles.error}
                      role="alert"
                    >
                      {error}
                    </p>
                    <p
                      className={styles.status}
                      role="status"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {announcement}
                    </p>
                  </div>
                </form>
            </InvitationPaper>
          </div>
        </section>

    </WaitlistShell>
  );
}
