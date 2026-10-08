export const RECEIVER = {
  width: 1360,
  height: 600,
  flapRise: 432,
  cropY: 1060,
  sleeveEndY: 1360,
  cardMaxWidth: 1200,
  cardMaxHeight: 528,
  cardGap: 36,
  bottomInset: 24,
} as const;

export type HandoffMeasurements = {
  stageWidth: number;
  /** Distance from the board's top to the OUTER frame's bottom clip edge. */
  visibleHeight: number;
  cardWidth: number;
  cardHeight: number;
};

export function getHandoffGeometry({
  stageWidth,
  visibleHeight,
  cardWidth,
  cardHeight,
}: HandoffMeasurements) {
  const values = [stageWidth, visibleHeight, cardWidth, cardHeight];
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error("Handoff measurements must be positive finite numbers.");
  }

  // Fit BOTH dimensions of the actual responsive invitation.
  const paperScaleInEnvelope = Math.min(
    RECEIVER.cardMaxWidth / cardWidth,
    RECEIVER.cardMaxHeight / cardHeight,
  );
  const paperWidth = cardWidth * paperScaleInEnvelope;
  const paperHeight = cardHeight * paperScaleInEnvelope;
  const topExtent = Math.max(
    paperHeight + RECEIVER.cardGap,
    RECEIVER.flapRise,
  );
  const inset = Math.min(16, stageWidth * 0.04, visibleHeight * 0.04);
  const receiverScale = Math.min(
    580 / RECEIVER.width,
    (stageWidth - inset * 2) / RECEIVER.width,
    (visibleHeight - inset) / (topExtent + RECEIVER.cropY),
  );

  const envelopeWidth = RECEIVER.width * receiverScale;
  const envelopeLeft = (stageWidth - envelopeWidth) / 2;
  // The sleeve continues below the frame edge, including on tall phones.
  const envelopeTop = visibleHeight - RECEIVER.cropY * receiverScale;
  const paperLeft = envelopeLeft + ((RECEIVER.width - paperWidth) / 2) * receiverScale;

  return {
    envelopeLeft,
    envelopeTop,
    envelopeWidth,
    receiverScale,
    paperLeft,
    paperScale: paperScaleInEnvelope * receiverScale,
    paperWidth: paperWidth * receiverScale,
    paperHeight: paperHeight * receiverScale,
    paperAboveTop: envelopeTop - (paperHeight + RECEIVER.cardGap) * receiverScale,
    paperSeatedTop: envelopeTop + (RECEIVER.height - RECEIVER.bottomInset - paperHeight) * receiverScale,
  };
}

export type HandoffGeometry = ReturnType<typeof getHandoffGeometry>;
