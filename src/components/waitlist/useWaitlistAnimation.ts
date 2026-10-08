"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { calculateWaitlistGeometry, MOTION, type Box } from "./motion";
import { ENVELOPE } from "./envelopeGeometry";

gsap.registerPlugin(useGSAP);
export type PlaybackResult = "completed" | "skipped" | "cancelled";

function measure(element: Element): Box {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
}

export function useWaitlistAnimation() {
  const sceneRef = useRef<HTMLElement | null>(null);
  const finishRef = useRef<((result: PlaybackResult) => void) | null>(null);
  const { contextSafe } = useGSAP(
    () => () => finishRef.current?.("cancelled"),
    { scope: sceneRef },
  );

  const playSuccess = (instant = false): Promise<PlaybackResult> =>
    contextSafe((): Promise<PlaybackResult> => {
      finishRef.current?.("cancelled");
      const scene = sceneRef.current;
      if (!scene) return Promise.resolve("skipped");
      const card = scene.querySelector<HTMLElement>("[data-waitlist-card]");
      const stage = scene.querySelector<HTMLElement>("[data-stage]");
      const envelope = scene.querySelector<HTMLElement>("[data-envelope]");
      const letter = scene.querySelector<HTMLElement>(
        "[data-submission-letter]",
      );
      const open = scene.querySelector<SVGGElement>("[data-flap-open]");
      const closed = scene.querySelector<SVGGElement>("[data-flap-closed]");
      const seal = scene.querySelector<SVGGElement>("[data-seal]");
      const surfaces = Array.from(
        scene.querySelectorAll<SVGSVGElement>("[data-envelope-surface]"),
      );
      if (
        !card ||
        !stage ||
        !envelope ||
        !letter ||
        !open ||
        !closed ||
        !seal ||
        surfaces.length !== 4
      ) {
        return Promise.resolve("skipped");
      }
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (instant || reduced.matches) return Promise.resolve("skipped");

      return new Promise<PlaybackResult>((resolve) => {
        let finished = false;
        let timeline: gsap.core.Timeline | undefined;
        let observer: ResizeObserver | undefined;
        const targets = [card, letter, open, closed, seal, ...surfaces];
        const onPreferenceChange = () => {
          if (reduced.matches) finish("skipped");
        };
        const finish = (result: PlaybackResult) => {
          if (finished) return;
          finished = true;
          observer?.disconnect();
          reduced.removeEventListener("change", onPreferenceChange);
          timeline?.kill();
          gsap.set(targets, {
            clearProps: "transform,opacity,visibility,willChange",
          });
          if (finishRef.current === finish) finishRef.current = null;
          resolve(result);
        };
        finishRef.current = finish;
        try {
          // Reset before measurement. The layout slot remains in normal flow throughout.
          gsap.set(targets, {
            clearProps: "transform,opacity,visibility,willChange",
          });
          const stageBox = measure(stage);
          const geometry = calculateWaitlistGeometry({
            card: measure(card),
            letter: measure(letter),
            envelope: measure(envelope),
            stage: stageBox,
            compact: window.matchMedia("(max-width: 760px)").matches,
          });
          gsap.set([card, letter, ...surfaces], {
            willChange: "transform,opacity",
          });
          gsap.set(letter, { ...geometry.start, autoAlpha: 0 });
          gsap.set(surfaces, {
            y: 32,
            scale: 0.985,
            autoAlpha: 0,
            transformOrigin: "50% 50%",
          });
          gsap.set(open, {
            autoAlpha: 1,
            scaleY: 1,
            svgOrigin: `320 ${ENVELOPE.mouth}`,
          });
          gsap.set(closed, {
            autoAlpha: 0,
            scaleY: 0,
            svgOrigin: `320 ${ENVELOPE.mouth}`,
          });
          gsap.set(seal, {
            autoAlpha: 0,
            scale: 0.92,
            svgOrigin: `320 ${ENVELOPE.closedTip}`,
          });

          timeline = gsap.timeline({
            onComplete: () => finish("completed"),
            onInterrupt: () => finish("cancelled"),
          });
          for (const [label, time] of Object.entries(MOTION.labels))
            timeline.addLabel(label, time);
          timeline
            .to(card, { autoAlpha: 0, ...MOTION.handoff }, "accepted")
            .to(letter, { autoAlpha: 1, ...MOTION.handoff }, "accepted")
            .to(letter, { ...geometry.hover, ...MOTION.lift }, "lift")
            .to(
              surfaces,
              { y: 0, scale: 1, autoAlpha: 1, ...MOTION.enter },
              "envelopeIn",
            )
            .to(letter, { ...geometry.inserted, ...MOTION.insert }, "insert")
            // Congruent faces meet edge-on at one hinge; never close through the letter.
            .to(open, { scaleY: 0, ...MOTION.halfFold }, "fold")
            .set(open, { autoAlpha: 0 }, "fold+=0.15")
            .set(closed, { autoAlpha: 1 }, "fold+=0.15")
            .to(closed, { scaleY: 1, ...MOTION.halfFold }, "fold+=0.15")
            .set(letter, { autoAlpha: 0 }, "seal")
            .to(seal, { autoAlpha: 1, scale: 1, ...MOTION.seal }, "seal");
          // Keep final position responsive: no inline pixel offsets survive completion.
          timeline.to(surfaces, { y: -8, ...MOTION.settle }, "settle");

          reduced.addEventListener("change", onPreferenceChange);
          observer = new ResizeObserver(() => {
            const next = measure(stage);
            if (
              Math.abs(next.width - stageBox.width) > 1 ||
              Math.abs(next.height - stageBox.height) > 1
            )
              finish("skipped");
          });
          observer.observe(stage);
        } catch {
          // Presentation cannot invalidate an accepted request.
          finish("skipped");
        }
      });
    })();

  const finishImmediately = () => finishRef.current?.("skipped");
  return { sceneRef, playSuccess, finishImmediately };
}
