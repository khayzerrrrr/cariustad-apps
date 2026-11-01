/**
 * Cek logika TTS voice engine (lokal, tanpa browser):
 *  - sanitizeForSpeech membersihkan simbol tanpa merusak isi jawaban
 *  - hint suara laki-laki tidak bertabrakan dengan hint perempuan
 *    (regresi bug lama: "female" ikut cocok dengan "male")
 *
 * Jalankan: npx tsx scripts/check-voice.ts
 */
import {
  sanitizeForSpeech,
  MALE_VOICE_HINTS,
  FEMALE_VOICE_HINTS,
} from "../src/lib/avatar/voiceEngine";

let fails = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "GAGAL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) fails++;
};

/* --- sanitizeForSpeech --- */
const s1 = sanitizeForSpeech("Berikut pilihannya:\n• Ustadz Ahmad — Fiqih\n• Ustadz Budi | Tasawuf");
check("bullets dibuang", !s1.includes("•"), s1.slice(0, 60));
check("em-dash jadi koma (jeda natural)", s1.includes(", ") && !s1.includes("—"));
check("pemisah | jadi koma", !s1.includes("|"));
check("markdown dibersihkan", sanitizeForSpeech("**tebal** #judul") === "tebal judul");
check("spasi berlebih dirapatkan", sanitizeForSpeech("a   b\n\nc") === "a b c");
check("teks biasa tidak berubah", sanitizeForSpeech("Assalamu'alaikum, ada yang bisa saya bantu?") === "Assalamu'alaikum, ada yang bisa saya bantu?");
check("angka & rupiah utuh", sanitizeForSpeech("biaya Rp 2.500.000 untuk 50 orang").includes("Rp 2.500.000"));
check("string kosong aman", sanitizeForSpeech("") === "");

/* --- hint suara: hindari regresi bug "female".includes("male") --- */
/* pakai hint APA ADUNYA (tanpa trim) — spasi di " male" adalah proteksi */
const collisions = FEMALE_VOICE_HINTS.filter((f) =>
  MALE_VOICE_HINTS.some((m) => m.includes(f) || f.includes(m))
);
check("tidak ada hint laki-laki yang cocok dengan hint perempuan", collisions.length === 0, `bentrok: ${collisions.join(", ") || "tidak ada"}`);
check("hint laki-laki menyertakan suara Ardi (Edge id-ID)", MALE_VOICE_HINTS.includes("ardi"));
check("hint perempuan menyertakan Damayanti & Gadis", FEMALE_VOICE_HINTS.includes("damayanti") && FEMALE_VOICE_HINTS.includes("gadis"));
check('"female" TIDAK cocok dengan hint laki-laki apa pun', !MALE_VOICE_HINTS.some((h) => "microsoft female voice".includes(h)));

console.log(fails === 0 ? "\nSEMUA LULUS — logika TTS siap" : `\n${fails} cek gagal`);
process.exit(fails === 0 ? 0 : 1);
