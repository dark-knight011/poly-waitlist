import { getHandoffGeometry, RECEIVER } from "./handoffGeometry";

export type Box = { x: number; y: number; width: number; height: number };
export type SequenceMeasurements = {
  stageWidth: number;
  visibleHeight: number;
  cardWidth: number;
  cardHeight: number;
  initial: Box;
  finalEnvelope: Box;
  preferredLeftWidth: number;
  preferredRightWidth: number;
};

// These are the same canvas anchors used by the approved initial frame.
export const SIDE_HAND = {
  sourceWidth: 1536,
  left: { gripX: 1220, sleeveX: 130 },
  right: { gripX: 500, sleeveX: 1115 },
  bleed: 28,
} as const;

export function getSequenceGeometry(m: SequenceMeasurements) {
  const handoff = getHandoffGeometry(m);
  const { initial, cardWidth, cardHeight, stageWidth, visibleHeight } = m;
  const scale = initial.width / cardWidth;
  if (![scale, initial.height, m.finalEnvelope.width, m.preferredLeftWidth, m.preferredRightWidth]
    .every((n) => Number.isFinite(n) && n > 0)) throw new Error("Invalid sequence measurements.");
  const leftWidth = Math.max(m.preferredLeftWidth,
    (initial.x + SIDE_HAND.bleed) * 1536 / (1220 - 130) / scale);
  const rightWidth = Math.max(m.preferredRightWidth,
    (stageWidth - initial.x - initial.width + SIDE_HAND.bleed) * 1536 / (1115 - 500) / scale);
  const leftPixels = leftWidth * scale;
  const rightPixels = rightWidth * scale;
  const leftCanvasRight = initial.x + leftPixels * (1 - 1220 / 1536);
  const rightCanvasLeft = initial.x + initial.width - rightPixels * 500 / 1536;
  // Move even the transparent canvas fully out: no sleeve edge is exposed.
  const leftExit = -leftCanvasRight - SIDE_HAND.bleed;
  const rightExit = stageWidth - rightCanvasLeft + SIDE_HAND.bleed;
  const finalScale = m.finalEnvelope.width / RECEIVER.width;
  const finalY = Math.max(m.finalEnvelope.y,
    visibleHeight - RECEIVER.sleeveEndY * finalScale + 12);

  return {
    ...handoff,
    initialX: initial.x, initialY: initial.y, initialScale: scale,
    cardWidth, cardHeight, leftWidth, rightWidth,
    leftClear: -(leftPixels * (1 - 1220 / 1536) + 12),
    rightClear: rightPixels * 500 / 1536 + 12,
    leftExit, rightExit,
    receiverHiddenY: visibleHeight - handoff.envelopeTop + RECEIVER.flapRise * handoff.receiverScale + 20,
    finalX: m.finalEnvelope.x, finalY,
    finalWidth: m.finalEnvelope.width,
  };
}

export type SequenceGeometry = ReturnType<typeof getSequenceGeometry>;
