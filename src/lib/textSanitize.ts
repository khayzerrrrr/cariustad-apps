/**
 * Bersihkan teks tampilan agar enak dibacakan TTS:
 * simbol markdown/poin/emoji-era dibuang, pemisah diganti jeda wajar.
 * Disengaja konservatif supaya indeks karakter TTS tetap dekat dengan
 * teks tampilan yang dipakai sinkronisasi bibir avatar.
 *
 * Modul netral (tanpa "use client") agar bisa dipakai route server /api/tts.
 */
export function sanitizeForSpeech(text: string): string {
  return (text || "")
    .replace(/[*_#`>]/g, "")
    .replace(/[•·▪◦←→]+/g, " ")
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s*\|\s*/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
