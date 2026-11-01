/**
 * Viseme engine — memetakan teks ke bentuk mulut untuk lip sync.
 * Dipakai oleh avatar prosedural maupun model GLB (fallback bila morph target tidak ada).
 */

export interface VisemeFrame {
  /** Bukaan rahang 0..1 */
  jaw: number;
  /** Lebar mulut 0..1 (senyum/melebar) */
  width: number;
  /** Kebulatan bibir 0..1 (O/U) */
  round: number;
}

export const MOUTH_CLOSED: VisemeFrame = { jaw: 0.0, width: 0.30, round: 0.12 };
export const MOUTH_REST: VisemeFrame = { jaw: 0.04, width: 0.32, round: 0.12 };

const MAP: Record<string, VisemeFrame> = {
  a: { jaw: 0.92, width: 0.55, round: 0.12 },
  e: { jaw: 0.58, width: 0.80, round: 0.06 },
  i: { jaw: 0.32, width: 0.92, round: 0.0 },
  o: { jaw: 0.72, width: 0.18, round: 0.88 },
  u: { jaw: 0.46, width: 0.12, round: 1.0 },
  m: { jaw: 0.0, width: 0.22, round: 0.25 },
  b: { jaw: 0.0, width: 0.22, round: 0.25 },
  p: { jaw: 0.0, width: 0.22, round: 0.25 },
  f: { jaw: 0.16, width: 0.42, round: 0.10 },
  v: { jaw: 0.16, width: 0.42, round: 0.10 },
  l: { jaw: 0.34, width: 0.48, round: 0.10 },
  t: { jaw: 0.30, width: 0.46, round: 0.10 },
  d: { jaw: 0.30, width: 0.46, round: 0.10 },
  n: { jaw: 0.28, width: 0.46, round: 0.10 },
  s: { jaw: 0.20, width: 0.62, round: 0.02 },
  z: { jaw: 0.20, width: 0.62, round: 0.02 },
  c: { jaw: 0.22, width: 0.60, round: 0.02 },
  k: { jaw: 0.26, width: 0.44, round: 0.12 },
  g: { jaw: 0.26, width: 0.44, round: 0.12 },
  r: { jaw: 0.34, width: 0.52, round: 0.34 },
  h: { jaw: 0.40, width: 0.50, round: 0.16 },
  j: { jaw: 0.22, width: 0.66, round: 0.04 },
  w: { jaw: 0.36, width: 0.14, round: 0.86 },
  y: { jaw: 0.30, width: 0.80, round: 0.02 },
  x: { jaw: 0.22, width: 0.60, round: 0.02 },
  q: { jaw: 0.26, width: 0.44, round: 0.12 },
};

function frameForChar(ch: string): VisemeFrame {
  if (!ch) return MOUTH_CLOSED;
  const lower = ch.toLowerCase();
  if (/[\s.,!?;:()"'\-—…]/.test(lower)) return MOUTH_CLOSED;
  return MAP[lower] ?? MOUTH_REST;
}

/**
 * Bangun timeline viseme dari teks.
 * cps = karakter per detik (tempo bicara).
 */
export function buildVisemeTimeline(text: string, cps = 13): VisemeFrame[] {
  const clean = (text || "").replace(/\s+/g, " ").slice(0, 600);
  if (!clean) return [MOUTH_CLOSED];

  const frames: VisemeFrame[] = [];
  for (const ch of clean) {
    frames.push(frameForChar(ch));
  }
  // Minimal 2 frame supaya tidak error saat modulo
  return frames.length > 1 ? frames : [frames[0] ?? MOUTH_CLOSED, MOUTH_CLOSED];
}

/** Ambil frame pada waktu tertentu (detik) dari timeline */
export function frameAt(timeline: VisemeFrame[], seconds: number, cps = 13): VisemeFrame {
  if (timeline.length === 0) return MOUTH_REST;
  const idx = Math.floor(seconds * cps) % timeline.length;
  return timeline[idx] ?? MOUTH_REST;
}
