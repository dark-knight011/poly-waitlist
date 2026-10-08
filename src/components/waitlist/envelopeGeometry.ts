/** Shared drawing coordinates. Geometry and artwork must change together. */
export const ENVELOPE = {
  width: 640,
  height: 510,
  left: 20,
  right: 620,
  mouth: 180,
  bottom: 490,
  radius: 18,
  foldJoin: 330,
  pocketPeak: 315,
  inset: 20,
  openTip: 23,
  closedTip: 337,
} as const;

const e = ENVELOPE;
export const ENVELOPE_PATHS = {
  body: `M${e.left + e.radius} ${e.mouth} H${e.right - e.radius} Q${e.right} ${e.mouth} ${e.right} ${e.mouth + e.radius} V${e.bottom - e.radius} Q${e.right} ${e.bottom} ${e.right - e.radius} ${e.bottom} H${e.left + e.radius} Q${e.left} ${e.bottom} ${e.left} ${e.bottom - e.radius} V${e.mouth + e.radius} Q${e.left} ${e.mouth} ${e.left + e.radius} ${e.mouth} Z`,
  openFlap: `M${e.left} ${e.mouth} L320 ${e.openTip} L${e.right} ${e.mouth} Z`,
  closedFlap: `M${e.left} ${e.mouth} H${e.right} L320 ${e.closedTip} Z`,
  leftFold: `M${e.left} ${e.mouth} L320 ${e.foldJoin} L${e.left} ${e.bottom} Z`,
  rightFold: `M${e.right} ${e.mouth} L320 ${e.foldJoin} L${e.right} ${e.bottom} Z`,
  topSeam: `M${e.left} ${e.mouth} L320 ${e.foldJoin} L${e.right} ${e.mouth}`,
  bottomSeam: `M${e.left} ${e.bottom} L320 ${e.pocketPeak} L${e.right} ${e.bottom}`,
  bottomFold: `M${e.left} ${e.bottom} L320 ${e.pocketPeak} L${e.right} ${e.bottom} Z`,
} as const;
