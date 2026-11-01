"use client";

/**
 * Avatar Foto — wajah asli (PNG hasil ekstraksi foto) yang mulutnya
 * bergerak mengikuti TTS, gaya "photo puppet":
 *
 *  - Wajah statis dari `public/avatar/photo-face.png` (oval, tepi lembut)
 *  - Mulut dianimasikan dengan overlay SVG di atas area mulut foto;
 *    posisi & lebarnya diambil dari landmark YuNet
 *    (`public/avatar/photo-face-meta.json`, dibuat oleh
 *    `scripts/prepare-photo-avatar.py`)
 *  - Kedip mata memakai kelopak warna kulit (disampling dari foto)
 *  - Sinkronisasi identik dengan Avatar2D: `onSpeakBoundary(charIndex)`
 *    untuk koreksi posisi + maju mandiri antar-boundary (13 cps)
 *
 * Timeline viseme & smoothing diambil dari `lib/avatar/visemes` —
 * satu sumber kebenaran untuk avatar kartun maupun foto.
 */

import { useEffect, useRef } from "react";
import {
  buildVisemeTimeline,
  frameAt,
  MOUTH_REST,
  type VisemeFrame,
} from "@/lib/avatar/visemes";
import type { AvatarState } from "@/lib/avatar/stateMachine";
import photoMeta from "../../../public/avatar/photo-face-meta.json";

interface AvatarPhotoProps {
  state: AvatarState;
  speakingText?: string;
  /** Indeks karakter dari onSpeakBoundary. -1 bila belum ada. */
  charIndex?: number;
}

/** Karakter per detik — konsisten dengan Avatar2D. */
const CPS = 13;

const SKIN = String(photoMeta.skinColor ?? "#a6785b");
const CAVITY = "rgba(46, 12, 10, 0.88)";
const TEETH = "#f7f3ee";

/* Posisi ternormalisasi (0..1 relatif terhadap gambar) */
const MCX = photoMeta.mouthCenter.x; // pusat mulut
const MCY = photoMeta.mouthCenter.y;
const MW = photoMeta.mouthWidthNorm; // lebar mulut / lebar gambar
const EYE_R = photoMeta.eyeR;
const EYE_L = photoMeta.eyeL;
const EYE_SIZE = photoMeta.eyeSizeNorm;
/* tinggi kontainer = lebar × (h/w); tinggi % elemen absolut dihitung
   terhadap tinggi kontainer, jadi perlu konversi */
const H_RATIO = photoMeta.image.w / photoMeta.image.h;
const LID_W = EYE_SIZE * 5.6 * 100;
const LID_H = EYE_SIZE * 4.6 * H_RATIO * 100;

export default function AvatarPhoto({
  state,
  speakingText = "",
  charIndex = -1,
}: AvatarPhotoProps) {
  const head = useRef<HTMLDivElement>(null);
  const cavity = useRef<SVGEllipseElement>(null);
  const teeth = useRef<SVGPathElement>(null);
  const lipLine = useRef<SVGEllipseElement>(null);
  const lidR = useRef<HTMLDivElement>(null);
  const lidL = useRef<HTMLDivElement>(null);

  const speaking = state === "speaking" || state === "greeting";

  /* --- state yang dibaca loop tanpa memicu render ulang --- */
  const timeline = useRef<VisemeFrame[]>(buildVisemeTimeline(speakingText));
  const pos = useRef(0);
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
    let nextBlink = performance.now() + 1600 + Math.random() * 2600;
    let blinkStart = -1;

    const loop = (now: number) => {
      const dt = lastTick.current
        ? Math.min((now - lastTick.current) / 1000, 0.1)
        : 0;
      lastTick.current = now;

      /* ---------- target bentuk mulut ---------- */
      let target: VisemeFrame = MOUTH_REST;
      if (speakingRef.current && timeline.current.length > 0) {
        pos.current += dt * CPS;
        const maxPos = timeline.current.length - 1;
        if (pos.current > maxPos) pos.current = maxPos;
        target = frameAt(timeline.current, pos.current, 1);
      } else {
        pos.current = 0;
      }

      /* ---------- haluskan ---------- */
      const k = speakingRef.current ? 0.42 : 0.16;
      cur.current = {
        jaw: cur.current.jaw + (target.jaw - cur.current.jaw) * k,
        width: cur.current.width + (target.width - cur.current.width) * k,
        round: cur.current.round + (target.round - cur.current.round) * k,
      };

      /* ---------- terapkan ke overlay mulut (viewBox 100×60) ---------- */
      const { jaw, width, round } = cur.current;
      const rx = 30 * (0.72 + width * 0.38 - round * 0.34);
      const ry = 1.2 + jaw * 17;
      const cy = 30 - 1.5 + ry * 0.5; // rahang turun: mulut melebar ke bawah

      cavity.current?.setAttribute("rx", rx.toFixed(2));
      cavity.current?.setAttribute("ry", ry.toFixed(2));
      cavity.current?.setAttribute("cy", cy.toFixed(2));
      cavity.current?.setAttribute(
        "opacity",
        (jaw > 0.14 ? Math.min(1, (jaw - 0.14) * 6) : 0).toFixed(2)
      );

      /* gigi atas saat mulut cukup terbuka */
      const showTeeth = jaw > 0.34;
      teeth.current?.setAttribute("opacity", showTeeth ? "0.94" : "0");
      if (showTeeth) {
        const tx0 = 50 - rx * 0.8;
        const tx1 = 50 + rx * 0.8;
        const ty = cy - ry * 0.92;
        teeth.current?.setAttribute(
          "d",
          `M ${tx0.toFixed(2)} ${ty.toFixed(2)}
           Q 50 ${(ty + 3.4).toFixed(2)} ${tx1.toFixed(2)} ${ty.toFixed(2)}
           L ${tx1.toFixed(2)} ${(ty + 1.6).toFixed(2)}
           Q 50 ${(ty + 5).toFixed(2)} ${tx0.toFixed(2)} ${(ty + 1.6).toFixed(2)} Z`
        );
      }

      /* garis bibir natap halus saat mulut hampir tertutup */
      lipLine.current?.setAttribute("opacity", (0.5 * Math.max(0, 1 - jaw * 5)).toFixed(2));

      /* ---------- kedip mata (kelopak warna kulit) ---------- */
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
      const lidT = `scaleY(${lid.toFixed(3)})`;
      lidR.current?.style.setProperty("transform", lidT);
      lidL.current?.style.setProperty("transform", lidT);

      /* ---------- arah kepala mengikuti state ---------- */
      const s = stateRef.current;
      const tilt = s === "thinking" ? -2.4 : s === "listening" ? 1.2 : 0;
      const lean = s === "thinking" ? -3 : 0;
      head.current?.style.setProperty(
        "transform",
        `rotate(${tilt}deg) translateX(${lean}px)`
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

      {/* pembungkus animasi napas/bicara (CSS keyframes menganimasi transform,
          jadi transform ref-driven diletakkan di elemen di dalamnya) */}
      <div
        className="relative flex h-[88%] items-center justify-center"
        style={{
          animation:
            state === "speaking"
              ? "avatar-talk 1.6s ease-in-out infinite"
              : "avatar-breathe 4.2s ease-in-out infinite",
        }}
      >
        <div
          ref={head}
          className="relative h-full transition-transform duration-500"
          style={{ aspectRatio: `${photoMeta.image.w} / ${photoMeta.image.h}` }}
          role="img"
          aria-label="Asisten AI CariUstadz"
        >
          {/* wajah foto */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/avatar/photo-face.png"
            alt=""
            draggable={false}
            className="h-full w-full select-none"
            style={{ filter: "drop-shadow(0 12px 22px rgba(6,78,59,0.18))" }}
          />

          {/* kelopak mata (kedip) — warna kulit hasil sampling foto */}
          <div
            ref={lidR}
            className="pointer-events-none absolute rounded-full"
            style={{
              left: `${EYE_R.x * 100}%`,
              top: `${EYE_R.y * 100}%`,
              width: `${LID_W}%`,
              height: `${LID_H}%`,
              background: SKIN,
              transform: "scaleY(0)",
              transformOrigin: "center",
              marginLeft: `-${LID_W / 2}%`,
              marginTop: `-${LID_H / 2}%`,
              filter: "blur(0.6px)",
            }}
          />
          <div
            ref={lidL}
            className="pointer-events-none absolute rounded-full"
            style={{
              left: `${EYE_L.x * 100}%`,
              top: `${EYE_L.y * 100}%`,
              width: `${LID_W}%`,
              height: `${LID_H}%`,
              background: SKIN,
              transform: "scaleY(0)",
              transformOrigin: "center",
              marginLeft: `-${LID_W / 2}%`,
              marginTop: `-${LID_H / 2}%`,
              filter: "blur(0.6px)",
            }}
          />

          {/* overlay mulut — digerakkan loop animasi */}
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${MCX * 100}%`,
              top: `${MCY * 100}%`,
              width: `${MW * 1.45 * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <svg viewBox="0 0 100 60" className="w-full" aria-hidden="true">
              {/* garis bibir halus saat mulut tertutup */}
              <ellipse
                ref={lipLine}
                cx="50"
                cy="29"
                rx="34"
                ry="1.3"
                fill="rgba(90, 40, 28, 0.6)"
              />
              <ellipse
                ref={cavity}
                cx="50"
                cy="30"
                rx="24"
                ry="0"
                fill={CAVITY}
                opacity="0"
              />
              <path ref={teeth} d="" fill={TEETH} opacity="0" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Ekspor untuk kemudahan pengujian */
export { CPS as PHOTO_AVATAR_CPS };
