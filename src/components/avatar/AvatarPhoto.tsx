"use client";

/**
 * Avatar Foto v2 — "PNG-tuber berlapis".
 *
 * Cara kerja (semua layer dari foto asli, bukan tempelan):
 *  1. `photo-face.png`     — kepala utuh (lapisan dasar)
 *  2. Rongga mulut SVG     — di belakang rahang, hanya terlihat saat mulut terbuka
 *  3. `photo-face-jaw.png` — potongan rahang bawah (dari garis mulut ke dagu,
 *     tepi atas di-feather). Saat bicara lapisan ini TURUN beberapa piksel —
 *     mulut foto sendiri yang terbuka, bukan gambar yang ditempel.
 *  4. Kelopak mata — warna kulit hasil sampling foto, untuk kedip alami.
 *
 * Posisi semua layer dihitung dari landmark YuNet
 * (`photo-face-meta.json`, dibuat `scripts/prepare-photo-avatar.py`).
 *
 * Sinkronisasi bicara identik dengan Avatar2D: `onSpeakBoundary(charIndex)`
 * + maju mandiri 13 cps, viseme dari `lib/avatar/visemes`.
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
const CAVITY = "rgba(44, 12, 10, 0.92)";
const TEETH = "#f5f0ea";

/* Posisi ternormalisasi (0..1 relatif gambar) */
const MCX = photoMeta.mouthCenter.x;
const MCY = photoMeta.mouthCenter.y;
const MW = photoMeta.mouthWidthNorm;
const EYE_R = photoMeta.eyeR;
const EYE_L = photoMeta.eyeL;
const EYE_SIZE = photoMeta.eyeSizeNorm;

const JAW = photoMeta.jawSlice;
const JAW_H_RATIO = photoMeta.image.w / photoMeta.image.h; // lebar/tinggi
/* tinggi elemen absolut = % dari TINGGI kontainer → perlu konversi rasio */
const LID_W = EYE_SIZE * 5.6 * 100;
const LID_H = EYE_SIZE * 4.6 * JAW_H_RATIO * 100;
/* Turunan rahang sebagai % tinggi lapisan rahang sendiri (untuk translateY) */
const JAW_SLICE_H = 1 - JAW.topY; // tinggi potongan (norm tinggi gambar)
const JAW_DROP_PCT = (JAW.maxDrop / JAW_SLICE_H) * 100;
/* Geometri rongga mulut dalam unit viewBox (svg 100×60, lebar overlay = MW*1.35) */
const CAV_UNIT =
  (JAW.maxDrop * (1 / JAW_H_RATIO) * 100 * 0.85) / (MW * 1.35);

export default function AvatarPhoto({
  state,
  speakingText = "",
  charIndex = -1,
}: AvatarPhotoProps) {
  const head = useRef<HTMLDivElement>(null);
  const jaw = useRef<HTMLImageElement>(null);
  const cavity = useRef<SVGEllipseElement>(null);
  const teeth = useRef<SVGPathElement>(null);
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

      /* ---------- haluskan (lebih lembut dari v1) ---------- */
      const k = speakingRef.current ? 0.34 : 0.12;
      cur.current = {
        jaw: cur.current.jaw + (target.jaw - cur.current.jaw) * k,
        width: cur.current.width + (target.width - cur.current.width) * k,
        round: cur.current.round + (target.round - cur.current.round) * k,
      };
      const { jaw: jawV, width } = cur.current;

      /* ---------- lapisan rahang turun + regang sedikit ---------- */
      const dropPct = (jawV * JAW_DROP_PCT).toFixed(2);
      const stretch = (1 + jawV * 0.012).toFixed(4);
      jaw.current?.style.setProperty(
        "transform",
        `translateY(${dropPct}%) scaleY(${stretch})`
      );

      /* ---------- rongga mulut di belakang rahang ---------- */
      const ry = (1.5 + jawV * CAV_UNIT * 1.15).toFixed(2);
      const rx = (26 * (0.8 + width * 0.3)).toFixed(2);
      const cy = (30 + jawV * CAV_UNIT * 0.55).toFixed(2);
      cavity.current?.setAttribute("rx", rx);
      cavity.current?.setAttribute("ry", ry);
      cavity.current?.setAttribute("cy", cy);
      cavity.current?.setAttribute(
        "opacity",
        (jawV > 0.1 ? Math.min(1, (jawV - 0.1) * 5) : 0).toFixed(2)
      );

      /* ---------- gigi atas menempel di garis potong ---------- */
      const showTeeth = jawV > 0.28;
      teeth.current?.setAttribute("opacity", showTeeth ? "0.95" : "0");
      if (showTeeth) {
        const tr = 26 * (0.8 + width * 0.3) * 0.82;
        const ty = 30 - jawV * CAV_UNIT * 0.55;
        teeth.current?.setAttribute(
          "d",
          `M ${(50 - tr).toFixed(2)} ${(ty + 1).toFixed(2)}
           Q 50 ${(ty + 4).toFixed(2)} ${(50 + tr).toFixed(2)} ${(ty + 1).toFixed(2)}
           L ${(50 + tr).toFixed(2)} ${(ty + 2.6).toFixed(2)}
           Q 50 ${(ty + 5.6).toFixed(2)} ${(50 - tr).toFixed(2)} ${(ty + 2.6).toFixed(2)} Z`
        );
      }

      /* ---------- kedip mata (kelopak warna kulit foto) ---------- */
      if (blinkStart < 0 && now > nextBlink) blinkStart = now;
      let lid = 0;
      if (blinkStart >= 0) {
        const p = (now - blinkStart) / 170; // sedikit lebih lambat = lebih alami
        if (p >= 1) {
          blinkStart = -1;
          nextBlink = now + 2200 + Math.random() * 3400;
          lid = 0;
        } else {
          // kurva ease-in-out agar kedip tidak linier/kaku
          lid = p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p);
        }
      }
      const lidT = `scaleY(${lid.toFixed(3)})`;
      lidR.current?.style.setProperty("transform", lidT);
      lidL.current?.style.setProperty("transform", lidT);

      /* ---------- kepala: ayunan halus kontinu + arah per state ---------- */
      const s = stateRef.current;
      const tilt = s === "thinking" ? -2.4 : s === "listening" ? 1.1 : 0;
      const lean = s === "thinking" ? -3 : 0;
      const sway = Math.sin(now / 2400) * 0.45; // derajat — napas kepala
      const bob = Math.sin(now / 1900) * 1.1; // piksel — naik-turun halus
      head.current?.style.setProperty(
        "transform",
        `translateY(${bob.toFixed(2)}px) rotate(${(tilt + sway).toFixed(2)}deg) translateX(${lean}px)`
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

      <div
        ref={head}
        className="relative h-[88%]"
        style={{
          aspectRatio: `${photoMeta.image.w} / ${photoMeta.image.h}`,
          willChange: "transform",
        }}
        role="img"
        aria-label="Asisten AI CariUstadz"
      >
        {/* 1. kepala utuh */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/avatar/photo-face.png"
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full select-none"
          style={{ filter: "drop-shadow(0 12px 22px rgba(6,78,59,0.18))" }}
        />

        {/* 2. rongga mulut — di belakang rahang, terlihat saat terbuka */}
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${MCX * 100}%`,
            top: `${MCY * 100}%`,
            width: `${MW * 1.35 * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <svg viewBox="0 0 100 60" className="w-full" aria-hidden="true">
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

        {/* 3. lapisan rahang — turun saat bicara; saat diam presisi di tempat */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={jaw}
          src={JAW.file}
          alt=""
          draggable={false}
          className="pointer-events-none absolute left-0 w-full select-none"
          style={{
            top: `${JAW.topY * 100}%`,
            height: `${JAW_SLICE_H * 100}%`,
            transform: "translateY(0%)",
            transformOrigin: "50% 0%",
            willChange: "transform",
          }}
        />

        {/* 4. kelopak mata (kedip) */}
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
            filter: "blur(0.7px)",
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
            filter: "blur(0.7px)",
          }}
        />
      </div>
    </div>
  );
}

/* Ekspor untuk kemudahan pengujian */
export { CPS as PHOTO_AVATAR_CPS, JAW_DROP_PCT, CAV_UNIT };
