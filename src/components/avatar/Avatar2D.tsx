"use client";

/**
 * Avatar 2D — karakter SVG yang mulutnya bergerak mengikuti TTS.
 *
 * Sinkronisasi memakai dua sumber sekaligus:
 *  1. `onSpeakBoundary(charIndex)` dari SpeechSynthesis — memberi posisi kata
 *     yang benar-benar sedang diucapkan. Dipakai untuk mengoreksi posisi.
 *  2. Antar-boundary, posisi dimajukan dengan kecepatan karakter per detik
 *     supaya mulut tidak membeku menunggu kata berikutnya.
 *
 * Bentuk mulut diambil dari timeline viseme (`lib/avatar/visemes`), lalu
 * dihaluskan per frame agar tidak bergetar.
 */

import { useEffect, useRef } from "react";
import {
  buildVisemeTimeline,
  frameAt,
  MOUTH_REST,
  MOUTH_CLOSED,
  type VisemeFrame,
} from "@/lib/avatar/visemes";
import type { AvatarState } from "@/lib/avatar/stateMachine";

interface Avatar2DProps {
  state: AvatarState;
  speakingText?: string;
  /** Indeks karakter dari onSpeakBoundary. -1 bila belum ada. */
  charIndex?: number;
}

/** Karakter per detik. SpeechSynthesis id-ID pada rate 1.0 mendekati 13. */
const CPS = 13;

const SKIN = "#e8b189";
const SKIN_SHADE = "#d59a71";
const SKIN_LINE = "#b87b52";
const PECI = "#0e3b33";
const PECI_BAND = "#155e52";
const ROBE = "#ffffff";
const ROBE_LINE = "#dbe7e3";
const LIP = "#b25b45";
const LIP_DARK = "#7d3527";
const CAVITY = "#4a1712";
const EYE_WHITE = "#fdfcfb";
const IRIS = "#4a2f22";

const EYE_L = { x: 136, y: 168 };
const EYE_R = { x: 184, y: 168 };
const EYE_RX = 12.5;
const EYE_RY = 13.5;
const MOUTH_Y = 213;

export default function Avatar2D({
  state,
  speakingText = "",
  charIndex = -1,
}: Avatar2DProps) {
  const mouthOuter = useRef<SVGEllipseElement>(null);
  const mouthInner = useRef<SVGEllipseElement>(null);
  const teeth = useRef<SVGPathElement>(null);
  const lidL = useRef<SVGEllipseElement>(null);
  const lidR = useRef<SVGEllipseElement>(null);
  const irisL = useRef<SVGGElement>(null);
  const irisR = useRef<SVGGElement>(null);
  const browL = useRef<SVGPathElement>(null);
  const browR = useRef<SVGPathElement>(null);

  const speaking = state === "speaking" || state === "greeting";

  /* --- state yang dibaca loop tanpa memicu render ulang --- */
  const timeline = useRef<VisemeFrame[]>(buildVisemeTimeline(speakingText));
  const pos = useRef(0); // posisi float di timeline
  const cur = useRef<VisemeFrame>({ ...MOUTH_REST });
  const speakingRef = useRef(speaking);
  const stateRef = useRef<AvatarState>(state);
  const lastTick = useRef(0);

  /* Teks berubah → timeline baru, mulai dari awal */
  useEffect(() => {
    timeline.current = buildVisemeTimeline(speakingText);
    pos.current = 0;
  }, [speakingText]);

  /* Mulai bicara → reset posisi */
  useEffect(() => {
    speakingRef.current = speaking;
    stateRef.current = state;
    if (speaking) pos.current = 0;
  }, [speaking, state]);

  /* Boundary dari TTS → koreksi posisi ke kata yang sedang diucapkan */
  useEffect(() => {
    if (charIndex >= 0) pos.current = charIndex;
  }, [charIndex]);

  /* Loop animasi */
  useEffect(() => {
    let raf = 0;
    let nextBlink = performance.now() + 1800 + Math.random() * 2500;
    let blinkStart = -1;

    const loop = (now: number) => {
      const dt = lastTick.current ? Math.min((now - lastTick.current) / 1000, 0.1) : 0;
      lastTick.current = now;

      /* ---------- target bentuk mulut ---------- */
      let target: VisemeFrame = MOUTH_REST;

      if (speakingRef.current && timeline.current.length > 0) {
        pos.current += dt * CPS;
        // Jaga agar tidak melewati akhir timeline
        const maxPos = timeline.current.length - 1;
        if (pos.current > maxPos) pos.current = maxPos;
        target = frameAt(timeline.current, pos.current, 1);
      } else {
        target = MOUTH_REST;
        pos.current = 0;
      }

      /* ---------- haluskan ---------- */
      const k = speakingRef.current ? 0.42 : 0.16;
      cur.current = {
        jaw: cur.current.jaw + (target.jaw - cur.current.jaw) * k,
        width: cur.current.width + (target.width - cur.current.width) * k,
        round: cur.current.round + (target.round - cur.current.round) * k,
      };

      /* ---------- terapkan ke SVG ---------- */
      const { jaw, width, round } = cur.current;
      const rx = 11 + width * 9 - round * 5;
      const ry = 1.4 + jaw * 10.5;

      mouthOuter.current?.setAttribute("rx", rx.toFixed(2));
      mouthOuter.current?.setAttribute("ry", ry.toFixed(2));

      const innerRx = rx * 0.66;
      const innerRy = Math.max(0, (ry - 1.6) * 0.78);
      mouthInner.current?.setAttribute("rx", innerRx.toFixed(2));
      mouthInner.current?.setAttribute("ry", innerRy.toFixed(2));
      mouthInner.current?.setAttribute(
        "opacity",
        jaw > 0.16 ? "1" : "0"
      );

      // Gigi atas hanya terlihat saat mulut cukup terbuka
      const showTeeth = jaw > 0.34;
      teeth.current?.setAttribute("opacity", showTeeth ? "0.92" : "0");
      if (showTeeth) {
        teeth.current?.setAttribute(
          "d",
          `M ${160 - innerRx * 0.82} ${MOUTH_Y - ry + 1.2}
           Q 160 ${MOUTH_Y - ry + 3.6} ${160 + innerRx * 0.82} ${MOUTH_Y - ry + 1.2}
           L ${160 + innerRx * 0.82} ${MOUTH_Y - ry + 2.6}
           Q 160 ${MOUTH_Y - ry + 5} ${160 - innerRx * 0.82} ${MOUTH_Y - ry + 2.6} Z`
        );
      }

      /* ---------- kedip mata ---------- */
      if (blinkStart < 0 && now > nextBlink) blinkStart = now;
      let lid = 0;
      if (blinkStart >= 0) {
        const p = (now - blinkStart) / 150;
        if (p >= 1) {
          blinkStart = -1;
          nextBlink = now + 2200 + Math.random() * 3200;
          lid = 0;
        } else {
          lid = p < 0.5 ? p * 2 : (1 - p) * 2;
        }
      }
      lidL.current?.setAttribute("ry", (lid * (EYE_RY + 1)).toFixed(2));
      lidR.current?.setAttribute("ry", (lid * (EYE_RY + 1)).toFixed(2));

      /* ---------- arah pandangan ---------- */
      const s = stateRef.current;
      const lookX = s === "thinking" ? -2.6 : s === "listening" ? 0.6 : 0;
      const lookY = s === "thinking" ? -2.4 : 0;
      const shift = `translate(${lookX} ${lookY})`;
      irisL.current?.setAttribute("transform", shift);
      irisR.current?.setAttribute("transform", shift);

      /* ---------- alis ---------- */
      const browLift = s === "listening" ? -2.2 : s === "thinking" ? -1.2 : 0;
      const browTilt = s === "thinking" ? 1.6 : 0;
      browL.current?.setAttribute(
        "transform",
        `translate(0 ${browLift}) rotate(${browTilt} 136 148)`
      );
      browR.current?.setAttribute(
        "transform",
        `translate(0 ${browLift}) rotate(${-browTilt} 184 148)`
      );

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* glow lembut di belakang kepala */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(16,185,129,0.16) 0%, rgba(20,184,166,0.06) 42%, transparent 68%)",
        }}
      />

      {/* cincin denyut saat mendengarkan */}
      {state === "listening" && (
        <span
          className="pointer-events-none absolute left-1/2 top-[42%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-rose-400/40"
          style={{ animation: "avatar-ring 1.8s ease-out infinite" }}
        />
      )}

      <svg
        viewBox="0 0 320 320"
        className="relative h-full w-full"
        style={{
          animation:
            state === "speaking"
              ? "avatar-talk 1.6s ease-in-out infinite"
              : "avatar-breathe 4.2s ease-in-out infinite",
        }}
        role="img"
        aria-label="Asisten AI CariUstadz"
      >
        <defs>
          <linearGradient id="robeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#eef6f3" />
          </linearGradient>
          <linearGradient id="peciGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PECI_BAND} />
            <stop offset="100%" stopColor={PECI} />
          </linearGradient>
          <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e89b7d" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#e89b7d" stopOpacity="0" />
          </radialGradient>
          <clipPath id="mouthClip">
            <ellipse cx="160" cy={MOUTH_Y} rx="17" ry="14" />
          </clipPath>
        </defs>

        {/* ---------- bahu & baju koko ---------- */}
        <path
          d="M 36 320 C 42 272 88 250 128 246 L 192 246 C 232 250 278 272 284 320 Z"
          fill="url(#robeGrad)"
          stroke={ROBE_LINE}
          strokeWidth="1.5"
        />
        {/* kerah tegak */}
        <path
          d="M 128 246 L 146 266 L 160 256 L 174 266 L 192 246"
          fill="none"
          stroke={ROBE_LINE}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* kancing */}
        <circle cx="160" cy="288" r="2.4" fill="#cbd5d1" />

        {/* ---------- leher ---------- */}
        <path
          d="M 141 226 L 141 252 Q 160 262 179 252 L 179 226 Z"
          fill={SKIN_SHADE}
        />

        {/* ---------- telinga ---------- */}
        <ellipse
          cx="100"
          cy="174"
          rx="9"
          ry="12.5"
          fill={SKIN}
          stroke={SKIN_SHADE}
          strokeWidth="1.2"
        />
        <ellipse
          cx="220"
          cy="174"
          rx="9"
          ry="12.5"
          fill={SKIN}
          stroke={SKIN_SHADE}
          strokeWidth="1.2"
        />

        {/* ---------- kepala ---------- */}
        <path
          d="M 160 94
             C 197 94 219 122 219 167
             C 219 209 197 246 160 246
             C 123 246 101 209 101 167
             C 101 122 123 94 160 94 Z"
          fill={SKIN}
        />
        {/* pipi */}
        <ellipse cx="124" cy="196" rx="16" ry="11" fill="url(#cheek)" />
        <ellipse cx="196" cy="196" rx="16" ry="11" fill="url(#cheek)" />

        {/* ---------- peci ---------- */}
        <path
          d="M 105 108
             C 105 84 130 72 160 72
             C 190 72 215 84 215 108
             L 213 116
             C 213 124 189 130 160 130
             C 131 130 107 124 107 116 Z"
          fill="url(#peciGrad)"
        />
        <path
          d="M 107 116 C 107 124 131 130 160 130 C 189 130 213 124 213 116"
          fill="none"
          stroke="#0a2c26"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* kilau peci */}
        <path
          d="M 121 102 C 123 86 137 78 152 76"
          fill="none"
          stroke="#2d7f6f"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.55"
        />
        {/* pin emas */}
        <circle cx="160" cy="86" r="3.2" fill="#d9a441" />
        <circle cx="160" cy="86" r="1.4" fill="#f6d27a" />

        {/* ---------- alis ---------- */}
        <path
          ref={browL}
          d="M 124 148 Q 136 141 148 146"
          fill="none"
          stroke="#3d2a1f"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          ref={browR}
          d="M 172 146 Q 184 141 196 148"
          fill="none"
          stroke="#3d2a1f"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* ---------- mata ---------- */}
        <g>
          <ellipse cx={EYE_L.x} cy={EYE_L.y} rx={EYE_RX} ry={EYE_RY} fill={EYE_WHITE} />
          <g ref={irisL}>
            <circle cx={EYE_L.x} cy={EYE_L.y} r="6.6" fill={IRIS} />
            <circle cx={EYE_L.x} cy={EYE_L.y} r="3" fill="#1b120c" />
            <circle cx={EYE_L.x - 2.2} cy={EYE_L.y - 2.6} r="2" fill="#ffffff" opacity="0.9" />
          </g>
          <ellipse
            ref={lidL}
            cx={EYE_L.x}
            cy={EYE_L.y}
            rx={EYE_RX + 0.6}
            ry="0"
            fill={SKIN}
          />
        </g>
        <g>
          <ellipse cx={EYE_R.x} cy={EYE_R.y} rx={EYE_RX} ry={EYE_RY} fill={EYE_WHITE} />
          <g ref={irisR}>
            <circle cx={EYE_R.x} cy={EYE_R.y} r="6.6" fill={IRIS} />
            <circle cx={EYE_R.x} cy={EYE_R.y} r="3" fill="#1b120c" />
            <circle cx={EYE_R.x - 2.2} cy={EYE_R.y - 2.6} r="2" fill="#ffffff" opacity="0.9" />
          </g>
          <ellipse
            ref={lidR}
            cx={EYE_R.x}
            cy={EYE_R.y}
            rx={EYE_RX + 0.6}
            ry="0"
            fill={SKIN}
          />
        </g>

        {/* ---------- hidung ---------- */}
        <path
          d="M 160 174 C 160 184 157 191 152 194"
          fill="none"
          stroke={SKIN_LINE}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* ---------- mulut (digerakkan loop animasi) ---------- */}
        <g>
          <ellipse
            ref={mouthOuter}
            cx="160"
            cy={MOUTH_Y}
            rx="12"
            ry="1.6"
            fill={LIP}
          />
          <g clipPath="url(#mouthClip)">
            <ellipse
              ref={mouthInner}
              cx="160"
              cy={MOUTH_Y}
              rx="8"
              ry="0"
              fill={CAVITY}
              opacity="0"
            />
            <path ref={teeth} d="" fill="#fdfcfb" opacity="0" />
            {/* lidah */}
            <ellipse
              cx="160"
              cy={MOUTH_Y + 7}
              rx="7"
              ry="2.6"
              fill={LIP_DARK}
              opacity="0.5"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

/* Ekspor untuk kemudahan pengujian */
export { MOUTH_CLOSED };
