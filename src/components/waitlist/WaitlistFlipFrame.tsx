"use client";

import { gsap } from "gsap";
import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import InvitationPaper from "./InvitationPaper";
import PaperFlipCard from "./PaperFlipCard";
import ReceivingEnvelope from "./ReceivingEnvelope";
import WaitlistShell from "./WaitlistShell";
import { createPaperFlipTimeline, getPaperFlipGeometry, type PaperFlipGeometry } from "./paperFlipMotion";
import shared from "./Waitlist.module.css";
import handoff from "./WaitlistHandoffFrame.module.css";
import styles from "./WaitlistFlipFrame.module.css";

type Pose = "initial" | "playing" | "above" | "halfway" | "seated" | "closed";
const POSES = ["above", "halfway", "seated", "closed"] as const;

export default function WaitlistFlipFrame({ brandName = "Your Brand" }: { brandName?: string }) {
  const id = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const rearRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const geometryRef = useRef<PaperFlipGeometry | null>(null);
  const timelineRef = useRef<ReturnType<typeof createPaperFlipTimeline> | null>(null);
  const poseRef = useRef<Pose>("initial");
  const reducedMotionRef = useRef(false);
  const [pose, setPose] = useState<Pose>("initial");
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);

  const showPose = useCallback((next: Exclude<Pose, "playing">) => {
    const g = geometryRef.current;
    const paper = paperRef.current;
    const rotor = rotorRef.current;
    const rear = rearRef.current;
    const front = frontRef.current;
    if (!g || !paper || !rotor || !rear || !front) return;
    timelineRef.current?.kill();
    timelineRef.current = null;
    const initial = next === "initial";
    const progress = next === "halfway" ? 0.5 : next === "seated" || next === "closed" ? 1 : 0;
    gsap.set([rear, front], {
      left: g.envelopeLeft, top: g.envelopeTop, width: g.envelopeWidth,
      y: initial ? g.receiverHiddenY : 0,
    });
    gsap.set(paper, {
      x: initial ? g.startX : g.paperLeft,
      y: initial ? g.startY : g.paperAboveTop + (g.paperSeatedTop - g.paperAboveTop) * progress,
      scale: initial ? g.startScale : g.paperScale,
    });
    gsap.set(rotor, { rotationY: initial ? 0 : 180 });
    poseRef.current = next;
    setPose(next);
  }, []);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const board = boardRef.current;
    const paper = paperRef.current;
    if (!frame || !board || !paper) return;
    let active = true;
    let raf = 0;
    function measure() {
      if (!active || !frame || !board || !paper) return;
      const bottomBorder = parseFloat(getComputedStyle(frame).borderBottomWidth) || 0;
      const visibleHeight = frame.getBoundingClientRect().bottom - bottomBorder - board.getBoundingClientRect().top;
      if (Math.min(board.clientWidth, board.clientHeight, visibleHeight, paper.offsetWidth, paper.offsetHeight) <= 0) return;
      geometryRef.current = getPaperFlipGeometry({
        stageWidth: board.clientWidth, boardHeight: board.clientHeight, visibleHeight,
        // These dimensions are unaffected by the animated transforms.
        cardWidth: paper.offsetWidth, cardHeight: paper.offsetHeight,
      });
      showPose(poseRef.current === "playing" ? "above" : poseRef.current);
      setReady(true);
    }
    function schedule() {
      cancelAnimationFrame(raf);
      if (active) raf = requestAnimationFrame(measure);
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    function updateMotion() {
      reducedMotionRef.current = media.matches;
      if (media.matches && poseRef.current === "playing") showPose("above");
    }
    updateMotion();
    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(frame);
    observer.observe(board);
    observer.observe(paper);
    window.addEventListener("resize", schedule);
    media.addEventListener("change", updateMotion);
    void document.fonts.ready.then(schedule);
    return () => {
      active = false;
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", updateMotion);
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
  }, [showPose]);

  function play() {
    const geometry = geometryRef.current;
    const paper = paperRef.current;
    const rotor = rotorRef.current;
    const rear = rearRef.current;
    const front = frontRef.current;
    if (!geometry || !paper || !rotor || !rear || !front) return;
    showPose("initial");
    if (reducedMotionRef.current) {
      showPose("above");
      return;
    }
    poseRef.current = "playing";
    setPose("playing");
    const timeline = createPaperFlipTimeline({
      paper, rotor, receiverLayers: [rear, front], geometry,
      onComplete: () => {
        if (timelineRef.current !== timeline) return;
        timelineRef.current = null;
        poseRef.current = "above";
        setPose("above");
      },
    });
    timelineRef.current = timeline;
    timeline.timeScale(slow ? 0.4 : 1).play(0);
  }

  const visibility = ready ? "visible" : "hidden";
  return (
    <WaitlistShell brandName={brandName} frameRef={frameRef}>
      <section className={`${shared.stage} ${handoff.scene} ${styles.scene}`} data-scene="handoff" aria-labelledby={`${id}-heading`}>
        <div className={handoff.toolbar}>
          <h1 id={`${id}-heading`} className={handoff.previewLabel}>Paper flip preview</h1>
          <div className={handoff.poseButtons} role="group" aria-label="Play the paper flip">
            <button type="button" disabled={!ready} onClick={play}>{pose === "initial" ? "Play flip" : "Replay flip"}</button>
            <button type="button" disabled={!ready} onClick={() => showPose("initial")}>Reset</button>
          </div>
          <div className={handoff.poseButtons} role="group" aria-label="Inspect the reversed paper">
            {POSES.map((item) => (
              <button key={item} type="button" disabled={!ready} aria-pressed={pose === item} onClick={() => showPose(item)}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
          <label className={styles.slowMotion}>
            <input type="checkbox" checked={slow} onChange={(event) => {
              setSlow(event.target.checked);
              timelineRef.current?.timeScale(event.target.checked ? 0.4 : 1);
            }} />
            Slow motion
          </label>
          <p className={handoff.note}>Preview only · no signup is submitted</p>
        </div>
        <p className={styles.announcement} role="status">
          {pose === "playing" ? "Turning the invitation over." : pose === "initial" ? "Invitation ready." : `Reverse of the paper: ${pose}.`}
        </p>
        <div ref={boardRef} className={handoff.board} aria-hidden="true">
          <div ref={rearRef} className={`${handoff.receiverLayer} ${handoff.receiverRear}`} style={{ visibility }}>
            <ReceivingEnvelope open={pose !== "closed"} layer="rear" />
          </div>
          <div ref={paperRef} className={`${shared.composition} ${handoff.paper} ${styles.paper}`} style={{ visibility, transformOrigin: "0 0" }} inert>
            <PaperFlipCard brandName={brandName} rotorRef={rotorRef}>
              <InvitationPaper brandName={brandName} titleId={`${id}-paper-title`}>
                <div className={shared.form}>
                  <span className={shared.label}>Email address</span>
                  <div className={`${shared.input} ${handoff.previewInput}`}>you@example.com</div>
                  <div className={shared.submit}><span>Join the waitlist</span><span>→</span></div>
                  <p className={shared.helper}>One invitation. No noise.</p>
                  <div className={shared.feedback} />
                </div>
              </InvitationPaper>
            </PaperFlipCard>
          </div>
          <div ref={frontRef} className={`${handoff.receiverLayer} ${handoff.receiverFront}`} style={{ visibility }}>
            <ReceivingEnvelope open={pose !== "closed"} layer="front" />
          </div>
        </div>
      </section>
    </WaitlistShell>
  );
}
