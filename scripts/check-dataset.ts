/**
 * Pemeriksaan kualitas dataset ustadz nasional.
 * Menjalankan invarian yang tidak bisa diperiksa TypeScript:
 * nama unik, koordinat masuk akal, tarif masuk rentang, dsb.
 *
 * Jalankan: npx tsx scripts/check-dataset.ts
 */
import { ustadzData } from "../src/lib/data";
import { CITY_INFO, CITY_PROVINCE, ALL_PROVINCES } from "../src/lib/regions";

let failed = 0;
const check = (label: string, ok: boolean, detail: string) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label} — ${detail}`);
  if (!ok) failed++;
};

const n = ustadzData.length;
const male = ustadzData.filter((u) => u.gender === "L").length;
const female = n - male;
const provinces = new Set(ustadzData.map((u) => u.province));
const cities = new Set(ustadzData.map((u) => u.city));

console.log(`=== Dataset ustadz nasional ===\n`);
console.log(
  `Total ${n} — ustadz ${male}, ustadzah ${female}, ` +
    `${provinces.size} provinsi, ${cities.size} kota\n`
);

check(
  "target 300+ ustadz & 150+ ustadzah",
  male >= 300 && female >= 150,
  `ustadz=${male} (min 300), ustadzah=${female} (min 150)`
);

check(
  "seluruh 38 provinsi terjangkau",
  provinces.size >= 38,
  `${provinces.size} provinsi terisi dari ${ALL_PROVINCES.length} di regions.ts`
);

check(
  "provinsi di data = provinsi di regions",
  new Set(ALL_PROVINCES).size === provinces.size &&
    ALL_PROVINCES.every((p) => provinces.has(p)),
  `provinces.size=${provinces.size}, ALL_PROVINCES=${ALL_PROVINCES.length}`
);

const names = new Set(ustadzData.map((u) => u.name));
check("nama unik", names.size === n, `${names.size} unik dari ${n}`);

const ids = new Set(ustadzData.map((u) => u.id));
check("id unik", ids.size === n, `${ids.size} unik dari ${n}`);

const phones = new Set(ustadzData.map((u) => u.contact.whatsapp));
check("nomor whatsapp unik", phones.size === n, `${phones.size} unik dari ${n}`);

check(
  "kota terdaftar di regions",
  ustadzData.every((u) => CITY_PROVINCE[u.city] === u.province),
  "semua city↔province konsisten dengan regions.ts"
);

const coordsOk = ustadzData.every(
  (u) => u.lat < 8 && u.lat > -12 && u.lng > 94 && u.lng < 142
);
check(
  "koordinat dalam rentang Indonesia",
  coordsOk,
  "lat -12..8, lng 94..142"
);

// setiap kota CITY_INFO harus punya minimal 1 ustadz
const missing = CITY_INFO.filter((c) => !cities.has(c.city));
check(
  "setiap kota di regions terisi profil",
  missing.length === 0,
  missing.length === 0
    ? `${cities.size}/${CITY_INFO.length} kota terisi`
    : `kosong: ${missing.map((c) => c.city).join(", ")}`
);

const fees = ustadzData.map((u) => u.fee);
check(
  "tarif dalam rentang wajar",
  Math.min(...fees) >= 300000 && Math.max(...fees) <= 3000000,
  `Rp${Math.min(...fees).toLocaleString("id-ID")} - Rp${Math.max(...fees).toLocaleString("id-ID")}`
);

const ratingsOk = ustadzData.every((u) => u.rating >= 4 && u.rating <= 5);
check("rating 4.0-5.0", ratingsOk, "semua dalam rentang");

const biosOk = ustadzData.filter((u) => u.bio.length < 80).length;
check("bio bermakna (>=80 karakter)", biosOk === 0, `${biosOk} bio terlalu pendek`);

// distribusi spesialisasi tidak boleh timpang ekstrem
const specCount: Record<string, number> = {};
for (const u of ustadzData)
  for (const s of u.specializations) specCount[s] = (specCount[s] ?? 0) + 1;
const minSpec = Math.min(...Object.values(specCount));
check(
  "tiap spesialisasi tersedia",
  minSpec > 0,
  Object.entries(specCount)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ")
);

// tidak ada nama tokoh nyata yang terkenal (rawan disangka data asli)
const banned = [
  "Yusuf Mansur", "Arifin Ilham", "Felix Siauw", "Hanan Attaki",
  "Adi Hidayat", "Khalid Basalamah", "Abdul Somad", "Bachtiar Nasir",
  "Zainuddin MZ", "Salim Fillah", "Firanda", "Subhan Bawazier",
  "Syafiq Basalamah", "Dasad Latif",
];
const clash = ustadzData.filter((u) =>
  banned.some((b) => `${u.name}`.toLowerCase().includes(b.toLowerCase()))
);
check("tidak menyerupai tokoh nyata", clash.length === 0,
  clash.length === 0 ? "0 kemiripan" : `bentrok: ${clash.map((u) => u.name).join(", ")}`);

console.log(`\n${failed === 0 ? "SEMUA LULUS" : `${failed} GAGAL`}`);
process.exit(failed === 0 ? 0 : 1);
