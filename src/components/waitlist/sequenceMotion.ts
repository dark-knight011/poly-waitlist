import { gsap } from "gsap";
import type { SequenceGeometry } from "./sequenceGeometry";

export type SequenceElements = {
  paper: HTMLDivElement;
  rotor: HTMLDivElement;
  leftHands: HTMLDivElement[];
  rightHands: HTMLDivElement[];
  receivers: HTMLDivElement[];
  openFlap: SVGSVGElement;
  closedFlap: SVGSVGElement;
  confirmation: HTMLDivElement;
};

// The approved flip was played at 0.4x. These durations bake that speed in.
export const SEQUENCE_TIMING = {
  clear: 0.28,
  lift: 0.45,
  flipOffset: 0.40,
  flip: 2.00,
  shrinkOffset: 0.45,
  shrink: 2.55,
  receiveOffset: 1.20,
  receive: 2.00,
  insert: 3.68,
  insertionDuration: 0.95,
  close: 4.70,
  foldHalf: 0.36,
  present: 5.48,
  finish: 6.08,
} as const;

export function resetSequence(e: SequenceElements, g: SequenceGeometry) {
  gsap.set(e.paper, { x: g.initialX, y: g.initialY, scale: g.initialScale, autoAlpha: 1 });
  gsap.set(e.rotor, { rotationY: 0 });
  gsap.set([...e.leftHands, ...e.rightHands], {
    x: g.initialX, y: g.initialY, scale: g.initialScale,
    height: g.cardHeight, autoAlpha: 1,
    "--left-hand-width": `${g.leftWidth}px`, "--right-hand-width": `${g.rightWidth}px`,
  });
  gsap.set(e.receivers, {
    left: g.envelopeLeft, top: g.envelopeTop, width: g.envelopeWidth,
    y: g.receiverHiddenY, autoAlpha: 1,
  });
  gsap.set(e.openFlap, { scaleY: 1, transformOrigin: "50% 0%" });
  gsap.set(e.closedFlap, { scaleY: 0, transformOrigin: "50% 0%" });
  gsap.set(e.confirmation, { autoAlpha: 0, y: 8 });
}

export function finishSequence(e: SequenceElements, g: SequenceGeometry) {
  gsap.set(e.paper, { autoAlpha: 0 });
  gsap.set(e.leftHands, { x: g.initialX + g.leftExit, autoAlpha: 0 });
  gsap.set(e.rightHands, { x: g.initialX + g.rightExit, autoAlpha: 0 });
  gsap.set(e.receivers, { left: g.finalX, top: g.finalY, width: g.finalWidth, y: 0, autoAlpha: 1 });
  gsap.set(e.openFlap, { scaleY: 0 });
  gsap.set(e.closedFlap, { scaleY: 1 });
  gsap.set(e.confirmation, { autoAlpha: 1, y: 0 });
}

export function createSequenceTimeline(e: SequenceElements, g: SequenceGeometry, onComplete: () => void) {
  const t = SEQUENCE_TIMING;
  const timeline = gsap.timeline({ paused: true, onComplete });
  timeline.addLabel("release", 0)
    .to(e.leftHands, { x: g.initialX + g.leftClear, duration: t.clear, ease: "power2.out" }, 0)
    .to(e.rightHands, { x: g.initialX + g.rightClear, duration: t.clear, ease: "power2.out" }, 0)
    .to(e.leftHands, { x: g.initialX + g.leftExit, duration: 1.05, ease: "power2.inOut" }, t.clear)
    .to(e.rightHands, { x: g.initialX + g.rightExit, duration: 1.05, ease: "power2.inOut" }, t.clear)
    .addLabel("flip", t.clear)
    .to(e.paper, { y: g.initialY - Math.min(20, Math.max(0, g.initialY - 6)), duration: t.lift, ease: "power2.out" }, t.clear)
    .to(e.rotor, { rotationY: 180, duration: t.flip, ease: "power2.inOut" }, t.clear + t.flipOffset)
    .to(e.paper, { x: g.paperLeft, y: g.paperAboveTop, scale: g.paperScale, duration: t.shrink, ease: "power2.inOut" }, t.clear + t.shrinkOffset)
    .to(e.receivers, { y: 0, duration: t.receive, ease: "power3.out" }, t.clear + t.receiveOffset)
    .addLabel("insert", t.insert)
    .to(e.paper, { y: g.paperSeatedTop, duration: t.insertionDuration, ease: "power2.inOut" }, t.insert)
    .addLabel("close", t.close)
    // Both faces meet edge-on at zero height; their layer switch has no jump.
    .to(e.openFlap, { scaleY: 0, duration: t.foldHalf, ease: "sine.in" }, t.close)
    .to(e.closedFlap, { scaleY: 1, duration: t.foldHalf, ease: "sine.out" }, t.close + t.foldHalf)
    // Only hide paper after the opaque closed flap covers it completely.
    .set(e.paper, { autoAlpha: 0 }, t.close + t.foldHalf * 2)
    .addLabel("present", t.present)
    .to(e.receivers, { left: g.finalX, top: g.finalY, width: g.finalWidth, duration: 0.6, ease: "power2.inOut" }, t.present)
    .to(e.confirmation, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, t.present + 0.1);
  return timeline;
}
