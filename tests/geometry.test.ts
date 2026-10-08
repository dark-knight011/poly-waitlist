import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateWaitlistGeometry,
  type Box,
  type Pose,
} from "../src/components/waitlist/motion";
import { ENVELOPE as e } from "../src/components/waitlist/envelopeGeometry";

const bounds = (r: Box, p: Pose): Box => ({
  left: r.left + r.width / 2 + p.x - (r.width * p.scale) / 2,
  top: r.top + r.height / 2 + p.y - (r.height * p.scale) / 2,
  width: r.width * p.scale,
  height: r.height * p.scale,
});
function contained(inner: Box, outer: Box) {
  const epsilon = 0.01;
  assert.ok(inner.left >= outer.left - epsilon, "left edge stays inside");
  assert.ok(inner.top >= outer.top - epsilon, "top edge stays inside");
  assert.ok(
    inner.left + inner.width <= outer.left + outer.width + epsilon,
    "right edge stays inside",
  );
  assert.ok(
    inner.top + inner.height <= outer.top + outer.height + epsilon,
    "bottom edge stays inside",
  );
}

for (const viewport of [320, 390, 430, 760, 761, 1024, 1366, 1440]) {
  test(`letter and every travel phase fit at ${viewport}px`, () => {
    const compact = viewport <= 760;
    // Conservative content-sized mobile fixtures and the desktop minimum stage.
    const width = compact ? viewport - 50 : Math.min(1102, viewport - 130);
    const stage = { left: 25, top: 200, width, height: compact ? 730 : 520 };
    const cardWidth = Math.min(880, width);
    const card = {
      left: stage.left + (width - cardWidth) / 2,
      top: stage.top + 4,
      width: cardWidth,
      height: compact ? 730 : 430,
    };
    const envelopeWidth = Math.min(
      compact ? 400 : 460,
      width - (compact ? 16 : 24),
    );
    const envelope = {
      left: stage.left + (width - envelopeWidth) / 2,
      top:
        stage.top +
        stage.height -
        (compact ? 24 : 20) -
        (envelopeWidth * 510) / 640,
      width: envelopeWidth,
      height: (envelopeWidth * 510) / 640,
    };
    const letter = { ...envelope, height: envelopeWidth / 1.9 };
    const result = calculateWaitlistGeometry({
      card,
      stage,
      envelope,
      letter,
      compact,
    });
    contained(bounds(letter, result.inserted), result.pocket);
    const mouth = envelope.top + (e.mouth * envelope.width) / e.width;
    const hovering = bounds(letter, result.hover);
    assert.ok(
      hovering.top + hovering.height <= mouth - 11.9,
      "letter clears the mouth before insertion",
    );
    for (const [from, to] of [
      [result.start, result.hover],
      [result.hover, result.inserted],
    ]) {
      for (let step = 0; step <= 20; step++) {
        const t = step / 20;
        const pose = {
          x: from.x + (to.x - from.x) * t,
          y: from.y + (to.y - from.y) * t,
          scale: from.scale + (to.scale - from.scale) * t,
        };
        contained(bounds(letter, pose), stage);
      }
    }
  });
}

test("the original tall mobile card is constrained by pocket height", () => {
  const stage = { left: 0, top: 0, width: 390, height: 800 };
  const card = { left: 12, top: 4, width: 366, height: 470 };
  const envelope = {
    left: 12,
    top: 400,
    width: 366,
    height: (366 * 510) / 640,
  };
  const letter = { left: 12, top: 400, width: 366, height: 470 };
  const g = calculateWaitlistGeometry({
    card,
    letter,
    envelope,
    stage,
    compact: true,
  });
  assert.ok(g.inserted.scale < 0.34);
  contained(bounds(letter, g.inserted), g.pocket);
});

test("open and closed flap tips are reflections about the same hinge", () => {
  assert.equal(e.mouth - e.openTip, e.closedTip - e.mouth);
});

test("unmeasurable geometry fails safely", () => {
  const rect = { left: 0, top: 0, width: 0, height: 0 };
  assert.throws(() =>
    calculateWaitlistGeometry({
      card: rect,
      letter: rect,
      envelope: rect,
      stage: rect,
      compact: false,
    }),
  );
  assert.throws(() =>
    calculateWaitlistGeometry({
      card: { ...rect, width: NaN },
      letter: rect,
      envelope: rect,
      stage: rect,
      compact: false,
    }),
  );
});

test("closed flap overlaps the pocket seams so no letter shows through", () => {
  // A closed flap must reach beyond the side folds' intersection. Otherwise a
  // thin triangular gap exposes the letter even though its rectangle fits.
  assert.ok(e.closedTip > e.foldJoin);
  assert.ok(e.pocketPeak < e.foldJoin);
});
