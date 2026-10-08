"use client";

import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import InvitationPaper from "./InvitationPaper";
import ReceivingEnvelope from "./ReceivingEnvelope";
import WaitlistShell from "./WaitlistShell";
import { getHandoffGeometry, type HandoffGeometry } from "./handoffGeometry";
import shared from "./Waitlist.module.css";
import styles from "./WaitlistHandoffFrame.module.css";

const POSES = [
  { name: "Above", progress: 0, closed: false },
  { name: "Halfway", progress: 0.5, closed: false },
  { name: "Seated", progress: 1, closed: false },
  { name: "Closed", progress: 1, closed: true },
] as const;

export default function WaitlistHandoffFrame({ brandName = "Your Brand" }: { brandName?: string }) {
  const id = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [poseIndex, setPoseIndex] = useState(0);
  const [geometry, setGeometry] = useState<HandoffGeometry | null>(null);
  const pose = POSES[poseIndex];

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const board = boardRef.current;
    const paper = paperRef.current;
    if (!frame || !board || !paper) return;

    let active = true;
    let raf = 0;
    function measure() {
      if (!active || !frame || !board || !paper) return;
      const frameRect = frame.getBoundingClientRect();
      const boardRect = board.getBoundingClientRect();
      const bottomBorder = parseFloat(getComputedStyle(frame).borderBottomWidth) || 0;
      const visibleHeight = frameRect.bottom - bottomBorder - boardRect.top;
      if (board.clientWidth <= 0 || visibleHeight <= 0 || paper.offsetWidth <= 0 || paper.offsetHeight <= 0) return;

      setGeometry(getHandoffGeometry({
        stageWidth: board.clientWidth,
        visibleHeight,
        // offsetWidth/Height ignore the transform: never measure the scaled card.
        cardWidth: paper.offsetWidth,
        cardHeight: paper.offsetHeight,
      }));
    }
    function schedule() {
      cancelAnimationFrame(raf);
      if (active) raf = requestAnimationFrame(measure);
    }

    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(frame);
    observer.observe(board);
    observer.observe(paper);
    window.addEventListener("resize", schedule);
    void document.fonts.ready.then(schedule);
    return () => {
      active = false;
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const receiverStyle: CSSProperties = {
    left: geometry?.envelopeLeft ?? 0,
    top: geometry?.envelopeTop ?? 0,
    width: geometry?.envelopeWidth ?? 0,
    visibility: geometry ? "visible" : "hidden",
  };
  const paperTop = geometry
    ? geometry.paperAboveTop + (geometry.paperSeatedTop - geometry.paperAboveTop) * pose.progress
    : 0;
  const paperStyle: CSSProperties = {
    transformOrigin: "0 0",
    transform: geometry
      ? `translate(${geometry.paperLeft}px, ${paperTop}px) scale(${geometry.paperScale})`
      : "none",
    visibility: geometry ? "visible" : "hidden",
  };

  return (
    <WaitlistShell brandName={brandName} frameRef={frameRef}>
      <section className={`${shared.stage} ${styles.scene}`} data-scene="handoff" aria-labelledby={`${id}-heading`}>
        <div className={styles.toolbar}>
          <h1 id={`${id}-heading`} className={styles.previewLabel}>Handoff preview</h1>
          <div className={styles.poseButtons} role="group" aria-label="Inspect the card position">
            {POSES.map((item, index) => (
              <button key={item.name} type="button" aria-pressed={poseIndex === index} onClick={() => setPoseIndex(index)}>
                {item.name}
              </button>
            ))}
          </div>
          <p className={styles.note}>Static poses · no signup is submitted</p>
        </div>

        <div ref={boardRef} className={styles.board} aria-hidden="true">
          <div className={`${styles.receiverLayer} ${styles.receiverRear}`} style={receiverStyle}>
            <ReceivingEnvelope open={!pose.closed} layer="rear" />
          </div>

          <div ref={paperRef} className={`${shared.composition} ${styles.paper}`} style={paperStyle} inert>
            <InvitationPaper brandName={brandName} titleId={`${id}-paper-title`}>
              {/* Noninteractive preview fields; the real form stays in the initial scene. */}
              <div className={shared.form}>
                <span className={shared.label}>Email address</span>
                <div className={`${shared.input} ${styles.previewInput}`}>you@example.com</div>
                <div className={shared.submit}>
                  <span>Join the waitlist</span><span>→</span>
                </div>
                <p className={shared.helper}>One invitation. No noise.</p>
                <div className={shared.feedback} />
              </div>
            </InvitationPaper>
          </div>

          <div className={`${styles.receiverLayer} ${styles.receiverFront}`} style={receiverStyle}>
            <ReceivingEnvelope open={!pose.closed} layer="front" />
          </div>
        </div>
      </section>
    </WaitlistShell>
  );
}
