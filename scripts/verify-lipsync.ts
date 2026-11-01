/**
 * Verifikasi lip-sync avatar 2D tanpa browser.
 *
 * Meniru persis loop requestAnimationFrame di Avatar2D.tsx lalu memastikan
 * geometri mulut benar-benar berubah saat "berbicara" dan diam saat idle.
 *
 * Jalankan: node --experimental-strip-types scripts/verify-lipsync.ts
 */
import {
  buildVisemeTimeline,
  frameAt,
  MOUTH_REST,
  type VisemeFrame,
} from "../src/lib/avatar/visemes.ts";

const CPS = 13;

/** Geometri yang sama persis dengan Avatar2D.tsx */
function mouthGeometry(f: VisemeFrame) {
  const rx = 11 + f.width * 9 - f.round * 5;
  const ry = 1.4 + f.jaw * 10.5;
  return {
    rx,
    ry,
    innerRx: rx * 0.66,
    innerRy: Math.max(0, (ry - 1.6) * 0.78),
    teeth: f.jaw > 0.34,
    cavity: f.jaw > 0.16,
  };
}

/** Simulasi loop rAF selama `seconds` detik pada 60fps */
function simulate(text: string, speaking: boolean, seconds = 3) {
  const timeline = buildVisemeTimeline(text, CPS);
  let pos = 0;
  let cur: VisemeFrame = { ...MOUTH_REST };
  const samples: ReturnType<typeof mouthGeometry>[] = [];
  const fps = 60;
  const dt = 1 / fps;

  for (let i = 0; i < seconds * fps; i++) {
    let target: VisemeFrame;
    if (speaking && timeline.length > 0) {
      pos += dt * CPS;
      const maxPos = timeline.length - 1;
      if (pos > maxPos) pos = maxPos;
      target = frameAt(timeline, pos, 1);
    } else {
      target = MOUTH_REST;
      pos = 0;
    }
    const k = speaking ? 0.42 : 0.16;
    cur = {
      jaw: cur.jaw + (target.jaw - cur.jaw) * k,
      width: cur.width + (target.width - cur.width) * k,
      round: cur.round + (target.round - cur.round) * k,
    };
    samples.push(mouthGeometry(cur));
  }
  return samples;
}

function stats(nums: number[]) {
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return { min, max, range: max - min };
}

const SENTENCE =
  "Assalamualaikum, saya Ken. Saya bisa bantu cari ustadz sesuai kebutuhan Anda.";

let failures = 0;
function check(label: string, ok: boolean, detail: string) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} — ${detail}`);
  if (!ok) failures++;
}

console.log("=== Uji lip-sync Avatar2D ===\n");
console.log(`Kalimat uji: "${SENTENCE}"\n`);

// 1. Berbicara → rahang membuka & menutup
const talk = simulate(SENTENCE, true, 3);
const talkRy = stats(talk.map((s) => s.ry));
check(
  "rahang bergerak saat berbicara",
  talkRy.range > 4,
  `ry ${talkRy.min.toFixed(2)}..${talkRy.max.toFixed(2)} (rentang ${talkRy.range.toFixed(2)}px)`
);

// 2. Berbicara → lebar mulut berubah (vokal i/e vs o/u)
const talkRx = stats(talk.map((s) => s.rx));
check(
  "lebar mulut berubah saat berbicara",
  talkRx.range > 1.5,
  `rx ${talkRx.min.toFixed(2)}..${talkRx.max.toFixed(2)} (rentang ${talkRx.range.toFixed(2)}px)`
);

// 3. Rongga mulut & gigi ikut menyala
const cavityOn = talk.filter((s) => s.cavity).length / talk.length;
const teethOn = talk.filter((s) => s.teeth).length / talk.length;
check(
  "rongga mulut muncul",
  cavityOn > 0.2,
  `${(cavityOn * 100).toFixed(0)}% frame rongga terlihat`
);
check(
  "gigi muncul pada vokal terbuka",
  teethOn > 0.05 && teethOn < 0.95,
  `${(teethOn * 100).toFixed(0)}% frame gigi terlihat`
);

// 4. Idle → mulut hampir diam
const idle = simulate(SENTENCE, false, 2);
const idleRy = stats(idle.map((s) => s.ry));
check(
  "mulut tenang saat idle",
  idleRy.range < 0.6,
  `ry ${idleRy.min.toFixed(2)}..${idleRy.max.toFixed(2)} (rentang ${idleRy.range.toFixed(2)}px)`
);

// 5. Boundary charIndex mengoreksi posisi
//    Indeks 0 = 'A' (vokal a), indeks 11 = 'i' pada "Assalamualaikum"
const timeline = buildVisemeTimeline(SENTENCE, CPS);
const atA = frameAt(timeline, 0, 1);
const atI = frameAt(timeline, 11, 1);
check(
  "frameAt mengikuti posisi karakter",
  JSON.stringify(atA) !== JSON.stringify(atI),
  `vokal a=${JSON.stringify(atA)} vs i=${JSON.stringify(atI)}`
);

// 6. Timeline menutup semua karakter kalimat
check(
  "panjang timeline = panjang kalimat",
  timeline.length === SENTENCE.length,
  `${timeline.length} frame untuk ${SENTENCE.length} karakter`
);

// 7. Tidak pernah menghasilkan NaN
const hasNaN = talk.some((s) =>
  [s.rx, s.ry, s.innerRx, s.innerRy].some((v) => !Number.isFinite(v))
);
check("tidak ada NaN", !hasNaN, hasNaN ? "ditemukan NaN" : "semua nilai finite");

console.log(
  `\n${failures === 0 ? "SEMUA LULUS" : `${failures} GAGAL`} — ${
    failures === 0 ? "lip-sync terverifikasi" : "periksa kembali"
  }`
);
process.exit(failures === 0 ? 0 : 1);
