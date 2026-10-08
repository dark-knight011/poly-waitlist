import { useId, type ReactNode } from "react";
import { ENVELOPE as e, ENVELOPE_PATHS as path } from "./envelopeGeometry";
import styles from "./Envelope.module.css";

/** The letter shares this stacking context with the envelope's front and rear. */
export default function Envelope({ children }: { children: ReactNode }) {
  const id = useId().replaceAll(":", "");
  const paper = `${id}-paper`;
  const bodyClip = `${id}-body`;
  const viewBox = `0 0 ${e.width} ${e.height}`;

  return (
    <div className={styles.assembly} data-envelope aria-hidden="true">
      <svg
        viewBox={viewBox}
        className={`${styles.layer} ${styles.back}`}
        data-envelope-surface
        data-envelope-rear
      >
        <defs>
          <linearGradient id={paper} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f4e9d8" />
            <stop offset="100%" stopColor="#e6d5be" />
          </linearGradient>
        </defs>
        <path
          d={path.body}
          fill={`url(#${paper})`}
          stroke="#bdab93"
          strokeWidth="1.5"
        />
        <path d="M38 185 H602 L320 342 Z" fill="#d99569" fillOpacity=".32" />
      </svg>

      <svg
        viewBox={viewBox}
        className={`${styles.layer} ${styles.open}`}
        data-envelope-surface
      >
        <g data-flap-open style={{ transformOrigin: `320px ${e.mouth}px` }}>
          <path
            d={path.openFlap}
            fill="#efe1cc"
            stroke="#bdab93"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M43 174 L320 39 L597 174"
            fill="none"
            stroke="#fffaf1"
            strokeOpacity=".65"
            strokeWidth="2"
          />
        </g>
      </svg>

      {children}

      <svg
        viewBox={viewBox}
        className={`${styles.layer} ${styles.front}`}
        data-envelope-surface
      >
        <defs>
          <clipPath id={bodyClip}>
            <path d={path.body} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${bodyClip})`}>
          <path d={path.leftFold} fill="#f5ead9" />
          <path d={path.rightFold} fill="#efe0cc" />
          <path d={path.bottomFold} fill="#f6ebdb" />
          <path
            d={path.bottomSeam}
            fill="none"
            stroke="#c6b69f"
            strokeOpacity=".65"
            strokeWidth="1.5"
          />
          <path
            d={path.topSeam}
            fill="none"
            stroke="#c6b69f"
            strokeOpacity=".55"
            strokeWidth="1.5"
          />
        </g>
        <path d={path.body} fill="none" stroke="#bdab93" strokeWidth="1.5" />
      </svg>

      <svg
        viewBox={viewBox}
        className={`${styles.layer} ${styles.closed}`}
        data-envelope-surface
      >
        <g data-flap-closed style={{ transformOrigin: `320px ${e.mouth}px` }}>
          <path
            d={path.closedFlap}
            fill="#f7ecdc"
            stroke="#bdab93"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M40 187 H600" fill="none" stroke="#fffaf2" strokeWidth="2" />
        </g>
        <g data-seal style={{ transformOrigin: `320px ${e.closedTip}px` }}>
          <circle
            cx="320"
            cy={e.closedTip + 2}
            r="26"
            fill="#6c321f"
            fillOpacity=".15"
          />
          <circle
            cx="320"
            cy={e.closedTip}
            r="25"
            fill="#b95637"
            stroke="#99432a"
            strokeWidth="1.5"
          />
          <circle
            cx="320"
            cy={e.closedTip}
            r="19"
            fill="none"
            stroke="#ebae84"
            strokeOpacity=".6"
          />
          <path
            d={`M320 ${e.closedTip - 11} L323 ${e.closedTip - 3} L332 ${e.closedTip} L323 ${e.closedTip + 3} L320 ${e.closedTip + 11} L317 ${e.closedTip + 3} L308 ${e.closedTip} L317 ${e.closedTip - 3} Z`}
            fill="#f5d0ab"
          />
        </g>
      </svg>
    </div>
  );
}
