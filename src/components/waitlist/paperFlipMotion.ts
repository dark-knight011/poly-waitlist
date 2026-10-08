import { gsap } from "gsap";
import { getHandoffGeometry, RECEIVER, type HandoffMeasurements } from "./handoffGeometry";

export function getPaperFlipGeometry(measurements: HandoffMeasurements & { boardHeight: number }) {
  const handoff = getHandoffGeometry(measurements);
  const { stageWidth, boardHeight, cardWidth, cardHeight, visibleHeight } = measurements;
  if (!Number.isFinite(boardHeight) || boardHeight <= 0) {
    throw new Error("The flip board must have a positive height.");
  }
  const padding = Math.min(24, boardHeight * 0.08, stageWidth * 0.04);
  const startScale = Math.min(
    1,
    (stageWidth - padding * 2) / cardWidth,
    (boardHeight - padding * 2) / cardHeight,
  );
  return {
    ...handoff,
    startScale,
    startX: (stageWidth - cardWidth * startScale) / 2,
    startY: (boardHeight - cardHeight * startScale) / 2,
    // Even the raised flap begins below the outer frame's bottom edge.
    receiverHiddenY: visibleHeight - handoff.envelopeTop + RECEIVER.flapRise * handoff.receiverScale + 20,
  };
}

export type PaperFlipGeometry = ReturnType<typeof getPaperFlipGeometry>;

/** One controller owns translation, scale, rotation and both receiver layers. */
export function createPaperFlipTimeline({
  paper,
  rotor,
  receiverLayers,
  geometry: g,
  onComplete,
}: {
  paper: HTMLElement;
  rotor: HTMLElement;
  receiverLayers: HTMLElement[];
  geometry: PaperFlipGeometry;
  onComplete: () => void;
}) {
  const lift = Math.min(20, Math.max(0, g.startY - 6));
  const timeline = gsap.timeline({ paused: true, onComplete });
  timeline
    .to(paper, { y: g.startY - lift, duration: 0.18, ease: "power2.out" }, 0)
    .to(rotor, { rotationY: 180, duration: 0.8, ease: "power2.inOut" }, 0.16)
    .to(paper, {
      x: g.paperLeft,
      y: g.paperAboveTop,
      scale: g.paperScale,
      duration: 1.02,
      ease: "power2.inOut",
    }, 0.18)
    .to(receiverLayers, { y: 0, duration: 0.8, ease: "power3.out" }, 0.48);
  return timeline;
}
