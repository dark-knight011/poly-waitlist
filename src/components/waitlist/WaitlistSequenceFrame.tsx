"use client";

import Image from "next/image";
import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import InvitationPaper from "./InvitationPaper";
import PaperFlipCard from "./PaperFlipCard";
import ReceivingEnvelope from "./ReceivingEnvelope";
import WaitlistShell from "./WaitlistShell";
import { getSequenceGeometry, type SequenceGeometry } from "./sequenceGeometry";
import { createSequenceTimeline, finishSequence, resetSequence, type SequenceElements } from "./sequenceMotion";
import shared from "./Waitlist.module.css";
import final from "./WaitlistFinalFrame.module.css";
import styles from "./WaitlistSequenceFrame.module.css";

type Phase = "initial" | "playing" | "paused" | "complete";
const SIDES = ["left", "right"] as const;
const LAYERS = ["rear", "front"] as const;
type HandKey = `${typeof SIDES[number]}-${typeof LAYERS[number]}`;

export default function WaitlistSequenceFrame({ brandName = "Your Brand" }: { brandName?: string }) {
  const id = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const rearRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const openFlapRef = useRef<SVGSVGElement>(null);
  const closedFlapRef = useRef<SVGSVGElement>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);
  const finalTargetRef = useRef<HTMLDivElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const handsRef = useRef<Partial<Record<HandKey, HTMLDivElement>>>({});
  const geometryRef = useRef<SequenceGeometry | null>(null);
  const timelineRef = useRef<ReturnType<typeof createSequenceTimeline> | null>(null);
  const phaseRef = useRef<Phase>("initial");
  const reducedMotionRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("initial");
  const [ready, setReady] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [loaded, setLoaded] = useState<Partial<Record<HandKey, boolean>>>({});
  const [failed, setFailed] = useState({ left: false, right: false });

  const elements = useCallback((): SequenceElements | null => {
    const h = handsRef.current;
    if (!paperRef.current || !rotorRef.current || !rearRef.current || !frontRef.current ||
      !openFlapRef.current || !closedFlapRef.current || !confirmationRef.current ||
      !h["left-rear"] || !h["left-front"] || !h["right-rear"] || !h["right-front"]) return null;
    return {
      paper: paperRef.current, rotor: rotorRef.current,
      leftHands: [h["left-rear"], h["left-front"]],
      rightHands: [h["right-rear"], h["right-front"]],
      receivers: [rearRef.current, frontRef.current],
      openFlap: openFlapRef.current, closedFlap: closedFlapRef.current,
      confirmation: confirmationRef.current,
    };
  }, []);

  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const settle = useCallback((next: "initial" | "complete") => {
    const e = elements();
    const g = geometryRef.current;
    if (!e || !g) return;
    timelineRef.current?.kill();
    timelineRef.current = null;
    resetSequence(e, g);
    if (next === "complete") finishSequence(e, g);
    changePhase(next);
  }, [elements, changePhase]);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const stage = stageRef.current;
    const anchor = anchorRef.current;
    const paper = paperRef.current;
    const target = finalTargetRef.current;
    if (!frame || !stage || !anchor || !paper || !target) return;
    let active = true;
    let raf = 0;
    let lastMeasurement = "";
    const desktop = window.matchMedia("(min-width: 901px)");
    const fit = window.matchMedia("(min-width: 901px) and (min-height: 600px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function measure() {
      if (!active || !frame || !stage || !anchor || !paper || !target) return;
      const e = elements();
      if (!e || !paper.offsetWidth || !paper.offsetHeight) return;
      anchor.style.height = `${paper.offsetHeight}px`;
      const computedStage = getComputedStyle(stage);
      const availableHeight = stage.clientHeight - parseFloat(computedStage.paddingTop) - parseFloat(computedStage.paddingBottom);
      const scale = fit.matches ? Math.min(1, availableHeight / paper.offsetHeight) : 1;
      if (scale <= 0) return;
      // The anchor uses exactly the original stage's flow, width and padding.
      const anchorRect = anchor.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const bottomBorder = parseFloat(getComputedStyle(frame).borderBottomWidth) || 0;
      const initial = {
        x: anchorRect.left - stageRect.left + (paper.offsetWidth * (1 - scale)) / 2,
        y: anchorRect.top - stageRect.top + (paper.offsetHeight * (1 - scale)) / 2,
        width: paper.offsetWidth * scale, height: paper.offsetHeight * scale,
      };
      // Remove only hand-size overrides before reading the original CSS clamps.
      [...e.leftHands, ...e.rightHands].forEach((node) => {
        node.style.removeProperty("--left-hand-width");
        node.style.removeProperty("--right-hand-width");
      });
      const leftImage = e.leftHands[0].querySelector("img")!;
      const rightImage = e.rightHands[0].querySelector("img")!;
      const measurement = {
        stageWidth: stage.clientWidth,
        visibleHeight: frame.getBoundingClientRect().bottom - bottomBorder - stageRect.top,
        cardWidth: paper.offsetWidth, cardHeight: paper.offsetHeight,
        initial,
        finalEnvelope: { x: targetRect.left - stageRect.left, y: targetRect.top - stageRect.top, width: targetRect.width, height: targetRect.height },
        preferredLeftWidth: parseFloat(getComputedStyle(leftImage).width),
        preferredRightWidth: parseFloat(getComputedStyle(rightImage).width),
      };
      const key = JSON.stringify(measurement);
      const g = getSequenceGeometry(measurement);
      // Restore sizes even if only a duplicate ResizeObserver callback ran.
      [...e.leftHands, ...e.rightHands].forEach((node) => {
        node.style.setProperty("--left-hand-width", `${g.leftWidth}px`);
        node.style.setProperty("--right-hand-width", `${g.rightWidth}px`);
      });
      if (key === lastMeasurement) return;
      lastMeasurement = key;
      geometryRef.current = g;
      settle(phaseRef.current === "initial" ? "initial" : "complete");
      setReady(true);
    }
    function schedule() {
      cancelAnimationFrame(raf);
      if (active) raf = requestAnimationFrame(measure);
    }
    function updateMotion() {
      reducedMotionRef.current = motion.matches;
      if (motion.matches && phaseRef.current !== "initial") settle("complete");
    }
    updateMotion();
    measure();
    const observer = new ResizeObserver(schedule);
    [frame, stage, paper, target, confirmationRef.current!].forEach((node) => observer.observe(node));
    window.addEventListener("resize", schedule);
    desktop.addEventListener("change", schedule);
    fit.addEventListener("change", schedule);
    motion.addEventListener("change", updateMotion);
    void document.fonts.ready.then(schedule);
    return () => {
      active = false;
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      desktop.removeEventListener("change", schedule);
      fit.removeEventListener("change", schedule);
      motion.removeEventListener("change", updateMotion);
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
  }, [elements, settle]);

  function play() {
    const e = elements();
    const g = geometryRef.current;
    if (!e || !g) return;
    if (e.paper.contains(document.activeElement)) playButtonRef.current?.focus();
    settle("initial");
    if (reducedMotionRef.current) {
      settle("complete");
      return;
    }
    changePhase("playing");
    const timeline = createSequenceTimeline(e, g, () => {
      if (timelineRef.current !== timeline) return;
      timelineRef.current = null;
      changePhase("complete");
    });
    timelineRef.current = timeline;
    timeline.play(0);
  }

  function togglePause() {
    const timeline = timelineRef.current;
    if (!timeline) return;
    if (phaseRef.current === "paused") {
      timeline.resume();
      changePhase("playing");
    } else {
      timeline.pause();
      changePhase("paused");
    }
  }

  const initial = phase === "initial";
  return (
    <WaitlistShell brandName={brandName} frameRef={frameRef}>
      <section ref={stageRef} className={`${shared.stage} ${styles.scene}`} data-ready={ready} aria-label="Invitation handoff preview">
        <div ref={anchorRef} className={`${shared.composition} ${styles.initialAnchor}`} aria-hidden="true" />

        {LAYERS.flatMap((layer) => SIDES.map((side) => {
          const key: HandKey = `${side}-${layer}`;
          const handReady = Boolean(loaded[`${side}-rear`] && loaded[`${side}-front`] && !failed[side]);
          return (
            <div key={key} ref={(node) => { if (node) handsRef.current[key] = node; else delete handsRef.current[key]; }}
              className={`${shared.composition} ${styles.sideLayer} ${layer === "rear" ? styles.rearSide : styles.frontSide}`} aria-hidden="true">
              <Image src={`/${side}-hand-layers/${side}-hand-${layer}.png`} alt="" width={1536} height={1024} unoptimized loading="eager" draggable={false}
                className={`${shared.hand} ${shared[side]} ${shared[layer]}`} data-ready={handReady}
                onLoad={() => setLoaded((old) => ({ ...old, [key]: true }))}
                onError={() => setFailed((old) => ({ ...old, [side]: true }))} />
            </div>
          );
        }))}

        <div ref={rearRef} className={`${styles.receiverLayer} ${styles.receiverRear}`} aria-hidden="true">
          <ReceivingEnvelope open layer="rear" flapRefs={{ open: openFlapRef }} />
        </div>

        <div ref={paperRef} className={`${shared.composition} ${styles.paper}`} aria-hidden={!initial} inert={!initial}>
          <PaperFlipCard brandName={brandName} rotorRef={rotorRef}>
            <InvitationPaper brandName={brandName} titleId={`${id}-paper`}>
              <div className={shared.form}>
                <span className={shared.label}>Email address</span>
                <div className={`${shared.input} ${styles.previewInput}`}>you@example.com</div>
                <button type="button" className={shared.submit} disabled={!ready || !initial} onClick={play}>
                  <span>Join the waitlist</span><span aria-hidden="true">→</span>
                </button>
                <p className={shared.helper}>Preview only. Your email won’t be saved.</p>
                <div className={shared.feedback} />
              </div>
            </InvitationPaper>
          </PaperFlipCard>
        </div>

        <div ref={frontRef} className={`${styles.receiverLayer} ${styles.receiverFront}`} aria-hidden="true">
          <ReceivingEnvelope open layer="front" flapRefs={{ closed: closedFlapRef }} />
        </div>

        <div className={`${shared.stage} ${final.scene} ${styles.finalLayout}`} data-scene="final" aria-hidden={phase !== "complete"}>
          <div ref={confirmationRef} className={final.confirmation}>
            <h1 className={`${shared.title} ${final.title}`}>You’re on the list.</h1>
            <p className={`${shared.description} ${final.description}`}>A little patience. Something good is on its way.</p>
            <span className={`${shared.underlined} ${final.accent}`} aria-hidden="true" />
          </div>
          <div className={final.artwork} aria-hidden="true">
            <div ref={finalTargetRef} className={`${final.receiverPosition} ${styles.receiverTarget}`} />
          </div>
        </div>
      </section>

      <div className={styles.controls} aria-label="Animation preview controls">
        {controlsVisible ? <>
          <span className={styles.previewNote}>Preview · no signup</span>
          <button ref={playButtonRef} type="button" disabled={!ready} onClick={play}>{initial ? "Play" : "Replay"}</button>
          <button type="button" disabled={phase !== "playing" && phase !== "paused"} onClick={togglePause}>{phase === "paused" ? "Resume" : "Pause"}</button>
          <button type="button" disabled={!ready} onClick={() => settle("initial")}>Reset</button>
          <button type="button" disabled={!ready} onClick={() => settle("complete")}>Final</button>
          <button type="button" onClick={() => setControlsVisible(false)}>Hide controls</button>
        </> : <button ref={playButtonRef} type="button" onClick={() => setControlsVisible(true)}>Show controls</button>}
      </div>
      <p className={styles.announcement} role="status">
        {phase === "complete" ? "Preview complete. You’re on the list. No signup was submitted." : phase === "paused" ? "Animation paused." : phase === "playing" ? "Preview animation playing." : "Preview ready."}
      </p>
    </WaitlistShell>
  );
}
