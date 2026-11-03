/**
 * Mode Ustadz Hafizh — expert berbagi dalil Al-Quran & hadis.
 *
 * Peran: pertanyaan "apa dalilnya / apa kata Al-Quran tentang X" TIDAK lagi
 * ditolak mentah, tapi dijawab dengan dalil yang kutipannya WAJIB berasal
 * dari DALIL_DATA (terverifikasi). Pertanyaan hukum syariat yang sensitif
 * (talak, waris, sah/batal, penilaian dosa) TETAP ditolak dan dialihkan ke
 * ustadz — agen tidak pernah berfatwa.
 *
 * Dua jalur:
 *  1. Lokal (deterministik): menyusun jawaban dari DALIL_DATA. Selalu bisa
 *     jalan, tanpa LLM, tanpa biaya.
 *  2. LLM (opsional): system prompt hafizh + baris dalil terverifikasi —
 *     model hanya menulis ulang, tidak boleh menambah kutipan sendiri.
 */

import { DALIL_DATA, DalilEntry, dalilCount, findDalil } from "./dalilKnowledge";
import { detectPromptInjection } from "./promptGuard";

export interface DalilAnswer {
  text: string;
  action: "dalil";
  /** Entri dalil yang dikutip — dikirim ke LLM sebagai sumber terverifikasi */
  sources: DalilEntry[];
  /** Teks baris dalil untuk system prompt LLM */
  sourcesText: string;
  /** Bila tertahan oleh prompt injection */
  blocked?: boolean;
}

/* ---------- Topik yang wajib dialihkan ke ustadz (bukan jawaban AI) ---------- */
export const SENSITIVE_RULING = [
  "talak",
  "cerai",
  "khulu",
  "waris",
  "warisan",
  "faraid",
  "pembagian harta",
  "pusaka",
  "sah tidak",
  "sah gak",
  "batalkah",
  "batal gak",
  "dosa gak",
  "berdosa",
  "murtad",
  "kafir",
  "takfir",
  "judi",
  "asuransi",
  "kredit",
];

/* ---------- Petakan topik → spesialisasi ustadz untuk rujukan ---------- */
const REFERRAL_MAP: Array<[string[], string]> = [
  [["nikah", "pernikahan", "menikah", "talak", "cerai"], "Nikah & Keluarga"],
  [["waris", "warisan", "faraid", "pusaka", "harta"], "Fiqih"],
  [["shalat", "sholat", "salat", "wudhu", "puasa", "zakat", "haji", "thaharah"], "Fiqih"],
  [["tafsir", "ayat", "al-quran", "quran", "surah"], "Tafsir Al-Qur'an"],
  [["hadis", "hadits", "sunnah"], "Tafsir Al-Qur'an"],
  [["aqidah", "akidah", "iman", "tauhid"], "Aqidah"],
  [["akhlak", "adab", "tasawuf"], "Tasawuf & Akhlak"],
  [["anak", "parenting", "mendidik"], "Parenting Islami"],
];

function referralSpec(message: string): string {
  const msg = message.toLowerCase();
  for (const [keys, spec] of REFERRAL_MAP) {
    if (keys.some((k) => msg.includes(k))) return spec;
  }
  return "Fiqih";
}

/* --------------------------- format jawaban --------------------------- */

function formatEntry(d: DalilEntry): string {
  const grade = d.grade ? ` — derajat ${d.grade}` : "";
  return (
    `📖 **${d.citation}**${grade}\n` +
    `“${d.text}”\n\n` +
    `**Maknanya:** ${d.meaning}\n\n` +
    `**Penerapan praktis:** ${d.practice}`
  );
}

const DISCLAMER =
  `—\nSaya asisten AI, bukan ulama. Untuk pemahaman lebih dalam dan keputusan ` +
  `fikih, silakan konsultasi ke ustadz terverifikasi — mau saya carikan?`;

const AVAILABLE_TOPICS_HINT =
  `Beberapa topik yang sudah saya hafal dalilnya: sabar, ujian hidup, niat & ikhlas, ` +
  `ilmu, sedekah, shalat, wudhu, puasa, doa, nikah, berbakti pada orang tua, ` +
  `ketenangan hati, putus asa & taubat, tawakal, tolong-menolong, kejujuran, dan waktu.`;

/**
 * Jawaban lokal (tanpa LLM) untuk pertanyaan dalil.
 * Deterministik: hanya mengutip DALIL_DATA, tidak pernah mengarang sumber.
 */
export function answerDalilLocal(message: string): DalilAnswer {
  const sources = findDalil(message);
  const sourcesText = sources
    .map((d) => `- [${d.citation}${d.grade ? ` (${d.grade})` : ""}] ${d.text}`)
    .join("\n");

  if (sources.length === 0) {
    return {
      action: "dalil",
      sources: [],
      sourcesText: "",
      text:
        `Terima kasih pertanyaannya. Sejujurnya, di basis data dalil saya ` +
        `(sementara ini ${dalilCount()} kutipan terverifikasi) belum ada yang cocok ` +
        `untuk topik itu — dan saya tidak mau menebak atau mengarang sumber.\n\n` +
        `${AVAILABLE_TOPICS_HINT}\n\n` +
        `Untuk topik Anda, langkah terbaik: tanyakan langsung ke ustadz spesialis ` +
        `${referralSpec(message)}. Mau saya carikan ustadz yang cocok?`,
    };
  }

  const body = sources.map(formatEntry).join("\n\n---\n\n");
  return {
    action: "dalil",
    sources,
    sourcesText,
    text: `${body}\n\n${DISCLAMER}`,
  };
}

/** Jalur lengkap: guard injeksi → jawaban dalil lokal. */
export function handleDalilRequest(message: string): DalilAnswer {
  const injection = detectPromptInjection(message);
  if (injection.isInjection) {
    return {
      action: "dalil",
      sources: [],
      sourcesText: "",
      blocked: true,
      text:
        `Maaf, saya tidak bisa mengikuti permintaan itu.\n\n` +
        `Silakan tanyakan dalil atau kebutuhan ustadz dengan kalimat biasa.`,
    };
  }
  return answerDalilLocal(message);
}

/* ------------------------- system prompt LLM ------------------------- */

/**
 * System prompt mode Hafizh. Kutipan terverifikasi disertakan; model dilarang
 * mengutip di luar daftar dan dilarang berfatwa.
 */
export function buildHafizhSystemPrompt(verifiedDalil?: string): string {
  const dalilList =
    verifiedDalil && verifiedDalil.trim().length > 0
      ? verifiedDalil
      : DALIL_DATA.map((d) => `- [${d.citation}${d.grade ? ` (${d.grade})` : ""}] ${d.text}`).join("\n");

  return `Anda adalah bagian dari asisten CariUstadz yang menjawab pertanyaan dalil — penghafal Al-Quran dan hadis. Anda bukan ulama nyata.

TUGAS:
- Menjawab pertanyaan tentang dalil, makna ayat/hadis, dan keutamaan amal.
- Struktur jawaban: (1) kutipan dalil + sumber, (2) makna singkat, (3) penerapan praktis, (4) penutup rendah hati.

ATURAN KUTIPAN (PALING PENTING):
- SATU-SATUNYA sumber kutipan adalah daftar dalil terverifikasi di bawah. DILARANG menyebutkan ayat/hadis apa pun yang tidak ada di daftar itu.
- Jangan pernah mengarang atau menebak nomor ayat atau nomor hadis. Jika topik yang ditanya tidak ada di daftar, katakan jujur belum tersedia, lalu tawarkan ustadz spesialis yang relevan.
- Kutipan hadis sebutkan derajatnya bila ada (shahih/hasan). Jangan mengutip hadis palsu atau dhaif yang populer.

BATAS (WAJIB):
- JANGAN memberi fatwa atau hukum halal-haram. Untuk pertanyaan seperti talak, waris, sah/batalnya ibadah, atau penilaian dosa: hormati pertanyaannya, katakan itu ranah ulama, lalu tawarkan mencarikan ustadz spesialis Fiqih dari CariUstadz.
- Jangan menyebut nama ustadz tertentu — pencarian nama dilakukan mesin pencarian, bukan Anda.
- Selalu tutup dengan pengingat singkat bahwa jawaban ini tidak menggantikan konsultasi ulama.

GAYA:
- Bahasa Indonesia yang hangat, tenang, dan mudah dipahami orang awam — seperti berbicara dengan tetangga.
- Ringkas: satu sampai dua dalil yang paling relevan saja. Jangan tumpuk semua kutipan.
- Langsung ke inti. DILARANG membuka dengan "Tentu!", "Baik,", "Pertanyaan yang bagus!".
- DILARANG menutup dengan "Semoga membantu" atau "Jika ada pertanyaan lain". Penutup cukup pengingat ulama yang diminta di atas.
- Jangan menyebut diri Anda "AI", "model", atau "asisten AI" dalam jawaban.
- Salam hanya bila pengguna menyapa lebih dulu.

=== DALIL TERVERIFIKASI (SATU-SATUNYA SUMBER KUTIPAN) ===
${dalilList}`;
}
