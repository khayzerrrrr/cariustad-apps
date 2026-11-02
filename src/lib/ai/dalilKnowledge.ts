/**
 * Basis data dalil terverifikasi untuk Mode Ustadz Hafizh.
 *
 * SUMBER KEBENARAN TUNGGAL: `dalil-db/dalil.json` di root proyek.
 * Folder itu dirancang mandiri — bisa dijalankan tanpa AI agent lewat
 * `node dalil-db/cari.mjs "kata kunci"` (lihat dalil-db/README.md).
 *
 * ATURAN FUNDAMENTAL: agen HANYA boleh mengutip ayat/hadis yang ada di
 * dataset. Hanya derajat shahih/hasan. Setiap entri punya `verifyUrl`
 * untuk dicek silang ke sunnah.com / quran.com.
 */

import dalilDb from "../../../dalil-db/dalil.json";

export interface DalilEntry {
  id: string;
  /** Topik yang dipakai pencocokan kata kunci (lowercase) */
  topics: string[];
  /** Contoh: "QS Al-Baqarah: 153" atau "HR Bukhari no. 1" */
  citation: string;
  /** Terjemahan yang lazim dipakai */
  text: string;
  /** Derajat hadis; untuk ayat Al-Quran tidak diisi */
  grade?: string;
  /** Penjelasan makna singkat */
  meaning: string;
  /** Penerapan praktis sehari-hari */
  practice: string;
  /** Tautan verifikasi ke sumber online (sunnah.com / quran.com) */
  verifyUrl?: string;
}

export const DALIL_DATA: DalilEntry[] = dalilDb.entries as DalilEntry[];

/* ------------------------- pencarian dalil ------------------------- */

function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/\s+/g, " ").trim()} `;
}

/**
 * Cari dalil yang topiknya cocok dengan pertanyaan.
 * Skor = jumlah kata kunci topik yang muncul; ambil kandidat terbaik,
 * maksimal 3 entri agar jawaban tetap ringkas.
 */
export function findDalil(message: string): DalilEntry[] {
  const msg = normalize(message);
  const scored = DALIL_DATA.map((d) => ({
    entry: d,
    score: d.topics.reduce(
      (acc, t) => (msg.includes(` ${t}`) || msg.includes(`${t} `) ? acc + 1 : acc),
      0
    ),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored.map((x) => x.entry);
}

/** Jumlah dalil di basis data — untuk kalimat transparansi. */
export function dalilCount(): number {
  return DALIL_DATA.length;
}

/** Daftar topik yang tersedia — untuk pesan bantu. */
export function dalilTopics(): string[] {
  const all = DALIL_DATA.flatMap((d) => d.topics);
  return Array.from(new Set(all)).sort().slice(0, 24);
}
