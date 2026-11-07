/**
 * Trace alur percakapan bug 2026-11-07: booking Rabu 14:00, 300 peserta,
 * lalu "baik di jam 13.30 saja" yang dulu jatuh ke fallback.
 * Jalankan: npx tsx scripts/check-conversation.ts
 */
import { matchIntent } from "../src/lib/ai/intentMatcher";
import { EMPTY_CONTEXT } from "../src/lib/ai/agentContext";

let ctx = EMPTY_CONTEXT;
const turns = [
  "saya ingin booking ustadz yang ada di domisili bandung untuk kajian fiqih hari rabu",
  "rabu jam 14.00 dengan 300 peserta",
  "baik di jam 13.30 saja",
  "setuju",
];

let failed = 0;
for (const m of turns) {
  const r = matchIntent(m, ctx);
  ctx = r.context ?? ctx;
  console.log(`\n=== USER: ${m}`);
  console.log(`[action=${r.action}]`);
  console.log(r.text);

  // invariant: fallback tidak boleh muncul di alur ini
  if (r.text.includes("belum menangkap maksudnya")) {
    failed++;
    console.log(">>> GAGAL: jatuh ke fallback!");
  }
  if (m.includes("13.30") && !r.text.includes("Undang")) {
    failed++;
    console.log(">>> GAGAL: jam 13.30 tidak menghasilkan pilihan ustadz + link undang!");
  }
}

// Uji Salat Jumat tetap diblokir keras
const jumat = matchIntent(
  "booking ustadz untuk khutbah, Jumat jam 12:00, di Bandung, 100 orang",
  EMPTY_CONTEXT
);
console.log(`\n=== UJI SALAT JUMAT [action=${jumat.action}]`);
console.log(jumat.text);
if (!jumat.text.includes("tidak bisa menjadwalkan")) {
  failed++;
  console.log(">>> GAGAL: Salat Jumat tidak diblokir!");
}

// Uji label alternatif hari Rabu tidak menyebut Salat Jumat
const rabuReject = matchIntent(
  "booking ustadz untuk kajian, Rabu jam 11:45, di Jakarta, 50 orang",
  EMPTY_CONTEXT
);
console.log(`\n=== UJI ALTERNATIF RABU [action=${rabuReject.action}]`);
console.log(rabuReject.text);

console.log(`\nSelesai. ${failed} kegagalan.`);
process.exit(failed > 0 ? 1 : 0);
