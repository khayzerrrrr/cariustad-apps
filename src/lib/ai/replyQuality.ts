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

/** Kata fungsi bahasa Inggris — dipakai mengukur apakah jawaban berbahasa Indonesia. */
const ENGLISH_STOPWORDS =
  /\b(the|is|are|that|with|from|this|and|for|not|has|have|was|were|will|would|should|which|there|their|they)\b/gi;

export function looksLikeReasoningLeak(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;

  if (REASONING_PATTERNS.some((re) => re.test(trimmed))) return true;

  // Jawaban panjang yang didominasi kata fungsi Inggris hampir pasti
  // bukan bahasa Indonesia yang kita minta.
  const words = trimmed.split(/\s+/).length;
  if (words > 30) {
    const english = (trimmed.match(ENGLISH_STOPWORDS) || []).length;
    if (english / words > 0.12) return true;
  }

  return false;
}
