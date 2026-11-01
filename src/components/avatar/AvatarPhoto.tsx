"use client";

/**
 * Avatar Foto — STATIS.
 *
 * Permintaan Reza: foto ditampilkan apa adanya, tanpa gerakan apa pun
 * (tanpa jaw-drop, tanpa kedip, tanpa ayunan kepala). Indikasi bicara/
 * mendengarkan sudah di Handel oleh chip status & VoiceControls di luar
 * komponen ini, jadi foto cukup diam.
 */

import type { AvatarState } from "@/lib/avatar/stateMachine";

interface AvatarPhotoProps {
  state: AvatarState;
  speakingText?: string;
  /** Indeks karakter dari onSpeakBoundary. Tidak dipakai (statis). */
  charIndex?: number;
}

export default function AvatarPhoto({
  speakingText: _speakingText,
  charIndex: _charIndex,
}: AvatarPhotoProps) {
  void _speakingText;
  void _charIndex;

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* glow lembut di belakang kepala (statis) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(16,185,129,0.16) 0%, rgba(20,184,166,0.06) 42%, transparent 68%)",
        }}
      />

      {/* foto wajah — apa adanya, tanpa overlay & tanpa animasi */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/avatar/photo-face.png"
        alt="Asisten AI CariUstadz"
        draggable={false}
        className="h-[88%] select-none object-contain"
        style={{
          aspectRatio: "640 / 853",
          filter: "drop-shadow(0 12px 22px rgba(6,78,59,0.18))",
        }}
      />
    </div>
  );
}
