/**
 * Penyaring kualitas jawaban LLM.
 *
 * Sebagian model gratis di OpenRouter adalah model "berpikir" yang
 * menuliskan proses penalarannya ke dalam `content`, bukan ke field
 * terpisah. Hasilnya bukan jawaban untuk pengguna, melainkan catatan
 * internal seperti "The user is asking..." atau "Let me check the catalog".
 *
 * Fungsi ini menolak keluaran semacam itu supaya rantai penyedia bisa
 * lanjut ke model berikutnya, bukan menampilkan sampah ke pengguna.
 */

const REASONING_PATTERNS = [
  /the user is asking/i,
  /the user wants/i,
  /let me (check|see|look|search|think)/i,
  /i need to (check|find|look|search)/i,
  /from the catalog/i,
  /here'?s my (plan|reasoning|thought)/i,
  /^\s*(step|langkah)\s*\d+\s*[:.)]/im,
  /wait,?\s+(but|the|i)/i,
  /^\s*(okay|ok|alright|hmm),?\s+(let me|i)/i,
  /\bno fiqih\b|\bnot jakarta\b|\bhas fiqih\b/i,
];

/**
 * Pola "AI slop" yang membuat jawaban langsung DITOLAK (bukan dibersihkan):
 * jawaban yang lebih banyak bicara soal dirinya sendiri daripada menjawab.
 */
const SLOP_REJECT_PATTERNS = [
  /sebagai (sebuah )?(ai|model bahasa|kecerdasan buatan|asisten ai)\b/i,
  /\bas an ai\b/i,
  /i('m| am) (just )?an ai\b/i,
  /(?:saya|aku) (adalah )?(hanya )?(sebuah )?(ai|model bahasa)[\s.,].*(mempunyai|tidak memiliki|tidak punya) (perasaan|kesadaran)/i,
  /(\Wemoji\W|penjelasan prompt|system prompt saya)/i,
];

/** Pembuka basa-basi yang dibuang dari awal jawaban. */
const SLOP_OPENER_PATTERNS = [
  /^\s*(tentu|baik|siap|wah|oke|ok|alright|sure|certainly|great|good question|pertanyaan (yang )?bagus)[!,.]\s*/i,
];

/** Penutup klise yang dibuang dari akhir jawaban. */
const SLOP_CLOSER_PATTERNS = [
  /\s*(semoga (membantu|bermanfaat))[!.]?\s*$/i,
  /\s*(jika|kalau) ada (pertanyaan|hal) lain[^.]*[!.]?\s*$/i,
  /\s*jangan ragu (untuk )?(menghubungi|bertanya)[^.]*[!.]?\s*$/i,
  /\s*apakah ada (yang )?(bisa|dapat) saya bantu (lagi|lainnya)[^.?]*[!.?]\s*$/i,
  /\s*(feel free to ask|hope this helps)[^.]*[!.]?\s*$/i,
];

/** Kata fungsi bahasa Inggris — dipakai mengukur apakah jawaban berbahasa Indonesia. */
const ENGLISH_STOPWORDS =
  /\b(the|is|are|that|with|from|this|and|for|not|has|have|was|were|will|would|should|which|there|their|they)\b/gi;

export function looksLikeReasoningLeak(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;

  if (REASONING_PATTERNS.some((re) => re.test(trimmed))) return true;

  // Jawaban yang bicara soal diri sendiri ("Saya hanya AI...") bukan jawaban.
  if (SLOP_REJECT_PATTERNS.some((re) => re.test(trimmed))) return true;

  // Jawaban panjang yang didominasi kata fungsi Inggris hampir pasti
  // bukan bahasa Indonesia yang kita minta.
  const words = trimmed.split(/\s+/).length;
  if (words > 30) {
    const english = (trimmed.match(ENGLISH_STOPWORDS) || []).length;
    if (english / words > 0.12) return true;
  }

  return false;
}

/**
 * Bersihkan jawaban LLM dari pembuka basa-basi dan penutup klise TANPA
 * membuang seluruh jawaban. Dipanggil setelah jawaban lolos pemeriksaan
 * penolakan. Idempoten — aman dipanggil dua kali.
 */
export function cleanSlop(text: string): string {
  let out = text.trim();
  for (let i = 0; i < 3; i++) {
    const before = out;
    for (const re of SLOP_OPENER_PATTERNS) out = out.replace(re, "");
    for (const re of SLOP_CLOSER_PATTERNS) out = out.replace(re, "");
    out = out.trim();
    if (out === before) break;
  }
  // Rapikan sisa tanda baca ganda di tepi (mis. ", !" atau "—.")
  out = out.replace(/^\s*[,.;:!-]+\s*/, "").replace(/\s*[,;:]+$/, "");
  return out.trim();
}
