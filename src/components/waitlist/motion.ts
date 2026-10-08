import { ENVELOPE } from "./envelopeGeometry";

export const MOTION = {
  handoff: { duration: 0.16, ease: "power3.out" },
  lift: { duration: 0.48, ease: "power2.inOut" },
  enter: { duration: 0.4, ease: "power3.out" },
  insert: { duration: 0.56, ease: "power2.inOut" },
  halfFold: { duration: 0.15, ease: "power2.inOut" },
  seal: { duration: 0.16, ease: "power3.out" },
  settle: { duration: 0.24, ease: "power2.inOut" },
  labels: {
    accepted: 0,
    lift: 0.08,
    envelopeIn: 0.32,
    insert: 0.74,
    fold: 1.32,
    seal: 1.64,
    settle: 1.76,
    outcome: 1.8,
  },
} as const;

export type Box = { left: number; top: number; width: number; height: number };
export type Pose = { x: number; y: number; scale: number };
const center = (r: Box) => ({
  x: r.left + r.width / 2,
  y: r.top + r.height / 2,
});

/** Input rectangles are untransformed, in the same viewport coordinate space. */
export function calculateWaitlistGeometry({
  card,
  letter,
  envelope,
  stage,
  compact,
}: {
  card: Box;
  letter: Box;
  envelope: Box;
  stage: Box;
  compact: boolean;
}) {
  for (const rect of [card, letter, envelope, stage]) {
    if (
      !Object.values(rect).every(Number.isFinite) ||
      rect.width <= 0 ||
      rect.height <= 0
    ) {
      throw new Error("Cannot animate an unmeasurable scene.");
    }
  }
  const unit = envelope.width / ENVELOPE.width;
  const inset = ENVELOPE.inset * unit;
  const pocket = {
    left: envelope.left + ENVELOPE.left * unit + inset,
    top: envelope.top + ENVELOPE.mouth * unit + inset,
    width: (ENVELOPE.right - ENVELOPE.left) * unit - 2 * inset,
    height: (ENVELOPE.bottom - ENVELOPE.mouth) * unit - 2 * inset,
  };
  const lc = center(letter);
  const cc = center(card);
  const scale = Math.min(
    1,
    pocket.width / letter.width,
    pocket.height / letter.height,
  );
  const initialScale = Math.min(
    card.width / letter.width,
    card.height / letter.height,
    (stage.width - 16) / letter.width,
  );
  const start: Pose = { x: cc.x - lc.x, y: cc.y - lc.y, scale: initialScale };
  const inserted: Pose = {
    x: pocket.left + pocket.width / 2 - lc.x,
    y: pocket.top + (letter.height * scale) / 2 - lc.y,
    scale,
  };
  const hoverScale = Math.min(initialScale, scale * 1.05);
  const mouth = envelope.top + ENVELOPE.mouth * unit;
  const hoverCenterY = Math.min(
    cc.y - (compact ? 28 : 48),
    mouth - 12 - (letter.height * hoverScale) / 2,
  );
  const hover: Pose = {
    x: inserted.x,
    y: hoverCenterY - lc.y,
    scale: hoverScale,
  };
  if (hoverCenterY - (letter.height * hoverScale) / 2 < stage.top + 8) {
    throw new Error("The scene has insufficient room for a safe lift.");
  }
  return { start, hover, inserted, pocket };
}
