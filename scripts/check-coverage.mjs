/**
 * Uji cakupan nasional chatbot CariUstadz.
 * Menjawab pertanyaan: apakah agent bisa menangani permintaan dari
 * seluruh Indonesia — kota kecil, provinsi, kelompok pulau, dan ustadzah?
 *
 * Jalankan terhadap production:
 *   BASE_URL=https://cariustad-apps.vercel.app node scripts/check-coverage.mjs
 */

const BASE = process.env.BASE_URL || "http://localhost:3000";

/** [pesan, pemeriksa: (reply) => string | null — null berarti lulus] */
const CASES = [
  [
    "cari ustadz fiqih di Medan",
    (r) => (r.toLowerCase().includes("medan") ? null : "tidak menyebut Medan"),
  ],
  [
    "berapa biaya ustadz di Banjarmasin",
    (r) =>
      r.toLowerCase().includes("banjarmasin") || /rp/i.test(r)
        ? null
        : "tidak menjawab Banjarmasin/tarif",
  ],
  [
    "cari ustadzah tafsir di Makassar",
    (r) =>
      r.toLowerCase().includes("ustadzah") || r.toLowerCase().includes("makassar")
        ? null
        : "tidak menjawab Makassar/ustadzah",
  ],
  [
    "cari ustadz di sumatera",
    (r) => (listHasCity(r) ? null : "tidak menampilkan kota manapun"),
  ],
  [
    "cari ustadz fiqih di papua",
    (r) => (r.toLowerCase().includes("papua") ? null : "tidak menyebut Papua"),
  ],
  [
    "ada ustadz di Sorong tidak?",
    (r) =>
      r.toLowerCase().includes("sorong") || r.toLowerCase().includes("belum")
        ? null
        : "tidak menyebut Sorong",
  ],
  [
    "berapa jumlah ustadz di platform ini",
    (r) =>
      /3\d\d|4\d\d/.test(r.replace(/\./g, "")) && r.toLowerCase().includes("provinsi")
        ? null
        : "tidak menyebut total & provinsi",
  ],
  [
    "jaringan cariustadz menjangkau mana saja?",
    (r) =>
      r.toLowerCase().includes("provinsi") && r.toLowerCase().includes("papua")
        ? null
        : "tidak menyebut jangkauan provinsi",
  ],
  [
    "cari ustadzah parenting di Jayapura",
    (r) =>
      r.toLowerCase().includes("jayapura") || r.toLowerCase().includes("belum")
        ? null
        : "tidak menjawab Jayapura",
  ],
  [
    "kajian mendatang di Makassar",
    (r) =>
      r.toLowerCase().includes("makassar") || r.toLowerCase().includes("belum")
        ? null
        : "tidak menjawab kajian Makassar",
  ],
  [
    "cari ustadz di sulawesi selatan",
    (r) => (r.toLowerCase().includes("sulawesi selatan") ? null : "tidak menyebut Sulawesi Selatan"),
  ],
  [
    "saya mau booking ustadz untuk kajian, Sabtu jam 19:00, di Medan, 80 orang",
    (r) =>
      (r.toLowerCase().includes("rencana booking") ||
        // format baru: rekomendasi general + hyperlink halaman booking
        (r.toLowerCase().includes("rekomendasikan") &&
          r.includes("/booking?ustadz="))) &&
      r.toLowerCase().includes("medan")
        ? null
        : "rekomendasi booking Medan (general + hyperlink) tidak muncul",
  ],
];

function listHasCity(reply) {
  const kota = [
    "medan", "padang", "pekanbaru", "palembang", "batam", "bandar lampung",
    "jambi", "bengkulu", "pangkalpinang", "banda aceh",
  ];
  return kota.some((k) => reply.toLowerCase().includes(k));
}

let failed = 0;

async function ask(message) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

console.log(`Target: ${BASE}\n=== Uji cakupan nasional chatbot ===\n`);

for (const [message, check] of CASES) {
  try {
    const data = await ask(message);
    const problem = check(data.reply || "");
    const ok = problem === null;
    if (!ok) failed++;
    console.log(
      `${(ok ? "LULUS" : "GAGAL").padEnd(6)} "${message.slice(0, 56)}"`
    );
    if (!ok) {
      console.log(`       masalah: ${problem}`);
      console.log(`       balasan: ${(data.reply || "(kosong)").slice(0, 220)}`);
    }
  } catch (e) {
    failed++;
    console.log(`GAGAL  "${message}" — error: ${e.message}`);
  }
}

console.log(`\n${CASES.length} skenario. ${failed === 0 ? "SEMUA LULUS" : `${failed} GAGAL`}`);
process.exit(failed === 0 ? 0 : 1);
