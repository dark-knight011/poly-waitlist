"use client";

import Image from "next/image";
import { useState, type Ref } from "react";
import styles from "./ReceivingEnvelope.module.css";

type Props = {
  open?: boolean;
  layer?: "all" | "rear" | "front";
  /** Optional motion handles. Static previews retain their existing behavior. */
  flapRefs?: { open?: Ref<SVGSVGElement>; closed?: Ref<SVGSVGElement> };
};

export default function ReceivingEnvelope({ open = false, layer = "all", flapRefs }: Props) {
  const showRear = layer !== "front";
  const showFront = layer !== "rear";
  const [loaded, setLoaded] = useState({ rear: false, front: false });
  const [failed, setFailed] = useState(false);
  const handReady = loaded.rear && loaded.front && !failed;

  return (
    <div
      className={styles.receiver}
      data-hand-ready={handReady}
      aria-hidden="true"
    >
      <Image
        src="/receiving-hand-layers/receiving-hand-rear.png"
        alt=""
        width={1024}
        height={1536}
        unoptimized
        loading="eager"
        draggable={false}
        className={`${styles.hand} ${styles.rearHand}`}
        style={showRear ? undefined : { display: "none" }}
        onLoad={() => setLoaded((previous) => ({ ...previous, rear: true }))}
        onError={() => setFailed(true)}
      />

      {showRear && (open || flapRefs?.open) && (
        <svg
          ref={flapRefs?.open}
          className={`${styles.envelopeLayer} ${styles.openFlap}`}
          viewBox="0 0 1360 600"
          width="1360"
          height="600"
          focusable="false"
        >
          <path
            d="M3 3 L654 -414 Q680 -432 706 -414 L1357 3 Z"
            fill="var(--paper-highlight)"
            stroke="var(--paper-border)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      )}

      <svg
        style={showRear ? undefined : { display: "none" }}
        className={`${styles.envelopeLayer} ${styles.envelopeBack}`}
        viewBox="0 0 1360 600"
        width="1360"
        height="600"
        focusable="false"
      >
        <rect
          x="3"
          y="3"
          width="1354"
          height="594"
          rx="7"
          fill="var(--paper)"
          stroke="var(--paper-border)"
          strokeWidth="3"
        />
      </svg>

      <svg
        className={`${styles.envelopeLayer} ${styles.envelopePocket}`}
        style={showFront ? undefined : { display: "none" }}
        viewBox="0 0 1360 600"
        width="1360"
        height="600"
        focusable="false"
      >
        <path
          d="M3 3 L680 292 L1357 3 V590 Q1357 597 1350 597 H10 Q3 597 3 590 Z"
          fill="var(--paper)"
          stroke="var(--paper-border)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M7 592 L450 320 M1353 592 L910 320"
          fill="none"
          stroke="var(--fold-color)"
          strokeWidth="2"
        />
        <path
          d="M12 585 H1348"
          fill="none"
          stroke="var(--paper-highlight)"
          strokeWidth="3"
        />
      </svg>

      <svg
        ref={flapRefs?.closed}
        className={`${styles.envelopeLayer} ${styles.envelopeFlap}`}
        style={showFront && (!open || flapRefs?.closed) ? undefined : { display: "none" }}
        viewBox="0 0 1360 600"
        width="1360"
        height="600"
        focusable="false"
      >
        <path
          d="M3 3 H1357 L706 414 Q680 432 654 414 Z"
          transform="translate(0 7)"
          fill="var(--ink)"
          opacity="0.09"
        />
        <path
          d="M3 3 H1357 L706 414 Q680 432 654 414 Z"
          fill="var(--paper-highlight)"
          stroke="var(--paper-border)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M14 9 H1346"
          fill="none"
          stroke="var(--paper-highlight)"
          strokeWidth="3"
        />
      </svg>

      <Image
        src="/receiving-hand-layers/receiving-hand-front.png"
        alt=""
        width={1024}
        height={1536}
        unoptimized
        loading="eager"
        draggable={false}
        className={`${styles.hand} ${styles.frontHand}`}
        style={showFront ? undefined : { display: "none" }}
        onLoad={() => setLoaded((previous) => ({ ...previous, front: true }))}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
