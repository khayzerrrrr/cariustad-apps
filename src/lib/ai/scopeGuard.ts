/**
 * Scope Guard — memastikan agent hanya menjawab dalam konteks CariUstadz.
 *
 * Empat hasil:
 *  - in_scope          → boleh dijawab (cari ustadz, booking, kajian, profil, dll)
 *  - dalil_request     → permintaan dalil/makna ayat → Mode Ustadz Hafizh
 *                        (jawab dengan kutipan terverifikasi, TANPA fatwa)
 *  - religious_ruling  → fatwa/hukum syariat sensitif → tidak dijawab, dialihkan ke ustadz
 *  - off_topic         → di luar domain → ditolak dengan sopan + contoh yang bisa ditanyakan
 *
 * Deterministik dan murah — jalan sebelum LLM, jadi LLM tidak pernah menerima
 * pertanyaan yang memang di luar wewenangnya.
 */

export type ScopeVerdict = "in_scope" | "dalil_request" | "religious_ruling" | "off_topic";

export interface ScopeResult {
  verdict: ScopeVerdict;
  matched: string[];
  reply?: string;
}

/* ---------- Permintaan dalil → Mode Ustadz Hafizh ---------- */
const DALIL_REQUEST = [
  "apa dalil",
  "dalilnya",
  "dalil tentang",
  "ayat tentang",
  "ayat mengenai",
  "ayat al-quran tentang",
  "kata al-quran",
  "al-quran tentang",
  "hadis tentang",
  "hadits tentang",
  "hadis mengenai",
  "hadis apa",
  "keutamaan",
  "pahala",
  "makna ayat",
  "arti ayat",
  "maknanya ayat",
  "apa makna",
  "cara berdoa",
  "doa untuk",
];

/* ---------- Pertanyaan hukum syariat ---------- */
const RELIGIOUS_RULING = [
  "fatwa",
  "hukum islam",
  "hukumnya",
  "hukum ",
  "bolehkah",
  "boleh gak",
  "boleh tidak",
  "halalkah",
  "haramkah",
  "apakah haram",
  "apakah halal",
  "bid'ah",
  "bidah",
  "menurut islam",
  "menurut syariat",
  "mazhab",
  "ijma ulama",
  "qiyas",
  "dosa gak",
  "berdosa",
  "sah tidak",
  "sah gak",
  "batalkah",
  "batal gak",
  "apakah boleh",
  "boleh atau tidak",
  "apa hukum",
  "bagaimana hukum",
  "hukumnya apa",
];

/* ---------- Istilah ibadah: dipakai bila disertai kata tanya ---------- */
const IBADAH_TERMS = [
  "sholat",
  "shalat",
  "salat",
  "puasa",
  "zakat",
  "wudhu",
  "wudu",
  "tayamum",
  "haji",
  "umrah",
  "nikah",
  "talak",
  "waris",
  "warisan",
  "jenazah",
  "dzikir",
  "sedekah",
  "riba",
  "aurat",
  "mahram",
  "qurban",
  "aqiqah",
];

const QUESTION_MARKERS = [
  "apakah",
  "boleh",
  "bagaimana",
  "hukum",
  "sah",
  "batal",
  "dosa",
  "wajib",
  "sunnah",
  "haram",
  "halal",
  "?"
];

/* ---------- Kata kerja yang menandakan permintaan ke CariUstadz ---------- */
const STRONG_TASK = [
  "cari",
  "carikan",
  "rekomendasi",
  "rekomendasikan",
  "booking",
  "pesan",
  "undang",
  "jadwal",
  "biaya",
  "tarif",
  "honor",
  "profil",
  "rating",
  "ulasan",
  "tampilkan",
  "daftar ustadz",
];

/* ---------- Domain di luar CariUstadz ---------- */
const OFF_TOPIC = [
  // pemrograman
  "coding",
  "kode program",
  "javascript",
  "typescript",
  "python",
  "react",
  "html",
  "css",
  "database",
  "compile",
  "debug",
  // politik & kenegaraan
  "politik",
  "presiden",
  "pemilu",
  "partai",
  "capres",
  "menteri",
  // medis
  "diagnosa",
  "resep dokter",
  "obat apa",
  "penyakit",
  "gejala",
  "kanker",
  "operasi",
  // keuangan & trading
  "saham",
  "crypto",
  "bitcoin",
  "trading",
  "forex",
  "reksadana",
  // tugas sekolah
  "soal matematika",
  "rumus fisika",
  "pr sekolah",
  "kerjakan tugas",
  "essay bahasa inggris",
  // hiburan
  "film terbaru",
  "lagu",
  "game online",
  "sepak bola",
  "artis",
  "drakor",
  // lain-lain
  "resep masakan",
  "cara install",
  "harga hp",
  "review laptop",
];

/* ---------- Penanda bahwa pesan memang soal CariUstadz ---------- */
const IN_SCOPE_HINTS = [
  "ustadz",
  "ustadzh",
  "ustadzah",
  "kajian",
  "pengajian",
  "ceramah",
  "tabligh",
  "booking",
  "pesan",
  "undang",
  "jadwal",
  "slot",
  "biaya",
  "fee",
  "honor",
  "tarif",
  "masjid",
  "musholla",
  "pesantren",
  "kota",
  "lokasi",
  "daerah",
  "spesialis",
  "bidang",
  "fiqih",
  "tafsir",
  "hadith",
  "hadis",
  "aqidah",
  "tasawuf",
  "muamalah",
  "siroh",
  "tahfiz",
  "tahsin",
  "parenting",
  "cari",
  "rekomendasi",
  "profil",
  "rating",
  "ulasan",
  "review",
  "konsultasi",
  "asisten",
  "kamu siapa",
  "bisa apa",
  "halo",
  "hai",
  "assalam",
  "salam",
  "terima kasih",
  "makasih",
  "setuju",
  "batal",
  "lanjut",
  "ya",
];

function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/\s+/g, " ").trim()} `;
}

/**
 * Cocokkan kata utuh, bukan potongan.
 * Tanpa ini "pernikahan" ikut terdeteksi sebagai "nikah" (pertanyaan fatwa),
 * padahal pengguna cuma ingin mengundang ustadz ke acara pernikahan.
 */
function hasWord(msg: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i").test(msg);
}

/** Sedang mencari orangnya, bukan meminta fatwa. */
const FINDING_VERBS = [
  "mana",
  "siapa",
  "cari",
  "carikan",
  "ada",
  "rekomendasi",
  "cocok",
  "bagus",
  "terbaik",
  "ahli",
  "butuh",
  "undang",
  "tersedia",
];

function isFindingUstadz(msg: string): boolean {
  const mentionsUstadz = hasWord(msg, "ustadz") || hasWord(msg, "ustadzah");
  if (!mentionsUstadz) return false;
  return FINDING_VERBS.some((v) => hasWord(msg, v));
}

/** Cek apakah pesan masuk domain CariUstadz. */
export function checkScope(message: string): ScopeResult {
  const msg = normalize(message);

  // 0. Permintaan yang jelas ke CariUstadz menang atas kata sensitif.
  //    Contoh: "cari ustadz untuk konsultasi hukum waris" tetap in-scope.
  const taskHits = STRONG_TASK.filter((k) => msg.includes(k));
  if (taskHits.length > 0 || isFindingUstadz(msg)) {
    return { verdict: "in_scope", matched: taskHits };
  }

  // 1. Permintaan dalil → Mode Ustadz Hafizh (kutipan terverifikasi, tanpa fatwa)
  //     Contoh: "apa dalil tentang sabar", "hadis tentang sedekah"
  const dalilHits = DALIL_REQUEST.filter((k) => msg.includes(k));
  if (dalilHits.length > 0) {
    return { verdict: "dalil_request", matched: dalilHits };
  }

  // 2. Hukum syariat lebih spesifik daripada off-topic
  const religiousHits = RELIGIOUS_RULING.filter((k) => msg.includes(k));
  if (religiousHits.length > 0) {
    return {
      verdict: "religious_ruling",
      matched: religiousHits,
      reply:
        "Untuk pertanyaan hukum atau fatwa, saya tidak berwenang menjawab — itu ranah ulama, bukan AI.\n\n" +
        "Yang bisa saya lakukan: mencarikan ustadz yang ahli di bidang yang Anda tanyakan, lengkap dengan profil dan jadwalnya. " +
        "Mau saya carikan ustadz spesialis Fiqih atau Aqidah?",
    };
  }

  // 1b. Istilah ibadah + kata tanya = permintaan fatwa terselubung
  //     Contoh: "apakah boleh sholat sambil duduk"
  const ibadahHits = IBADAH_TERMS.filter((k) => hasWord(msg, k));
  const askHits = QUESTION_MARKERS.filter((k) => msg.includes(k));
  if (ibadahHits.length > 0 && askHits.length > 0) {
    return {
      verdict: "religious_ruling",
      matched: [...ibadahHits, ...askHits],
      reply:
        "Untuk pertanyaan hukum ibadah seperti itu, saya tidak berwenang menjawab — itu ranah ulama, bukan AI.\n\n" +
        "Yang bisa saya lakukan: mencarikan ustadz yang ahli di bidang Fiqih, lengkap dengan profil, rating, dan jadwalnya. " +
        "Mau saya carikan sekarang?",
    };
  }

  const inScopeHits = IN_SCOPE_HINTS.filter((k) => msg.includes(k));
  const offTopicHits = OFF_TOPIC.filter((k) => msg.includes(k));

  // 2. Ada penanda CariUstadz → tetap in-scope (misal "jadwal kajian di kota Bandung")
  if (inScopeHits.length > 0) {
    return { verdict: "in_scope", matched: inScopeHits };
  }

  // 3. Ada penanda off-topic dan tidak ada penanda in-scope
  if (offTopicHits.length > 0) {
    return {
      verdict: "off_topic",
      matched: offTopicHits,
      reply:
        "Maaf, itu di luar jangkauan saya. Saya khusus membantu urusan ustadz di CariUstadz — bukan pertanyaan umum.\n\n" +
        "Yang bisa saya bantu:\n" +
        "• Cari ustadz berdasarkan bidang, kota, atau nama\n" +
        "• Tampilkan profil, rating, biaya, dan jadwal\n" +
        "• Proses booking kajian dengan persetujuan Anda\n" +
        "• Info kajian mendatang\n\n" +
        "Silakan tanyakan salah satu di atas.",
    };
  }

  // 4. Tidak ada penanda apa pun → anggap in-scope, biar pencarian yang menentukan
  return { verdict: "in_scope", matched: [] };
}

/* ---------- Validasi jawaban LLM ---------- */

/**
 * Nomor telepon/WhatsApp hanya boleh muncul setelah booking dikonfirmasi.
 * Fungsi ini menyensor nomor yang bocor lebih awal.
 */
export function redactContactBeforeApproval(text: string, bookingConfirmed: boolean): string {
  if (bookingConfirmed) return text;
  // 08xx-xxxx-xxxx / +62 8xx / 62 8xx
  return text.replace(
    /(\+?62|0)\s?8[\d\s\-().]{7,14}\d/g,
    "[nomor disembunyikan sampai booking dikonfirmasi]"
  );
}

/**
 * Kata yang sering muncul setelah "ustadz" tapi BUKAN nama orang.
 * Contoh: "ustadz Fiqih di Jakarta", "ustadz untuk acara", "ustadz yang ada".
 * Tanpa ini, penyaring halusinasi menuduh jawaban yang sebenarnya benar.
 */
const NON_NAME_WORDS = new Set(
  [
    // bidang keahlian
    "fiqih", "fikih", "tafsir", "aqidah", "akidah", "tasawuf", "akhlak",
    "muamalah", "tahsin", "tahfidz", "tahfiz", "parenting", "ceramah",
    "tausiyah", "nikah", "keluarga", "wanita", "islami", "syariah",
    "ekonomi", "qur'an", "quran", "hadis", "hadith", "siroh",
    // kota
    "jakarta", "bandung", "bogor", "depok", "tangerang", "bekasi",
    "surabaya", "yogyakarta", "semarang", "makassar", "selatan", "timur",
    "barat", "utara", "pusat",
    // kata umum
    "yang", "untuk", "dengan", "dari", "kami", "kita", "anda", "saya",
    "ini", "itu", "tersebut", "dan", "atau", "di", "ke", "pada", "adalah",
    "bisa", "dapat", "akan", "sudah", "tidak", "belum", "juga", "sangat",
    "paling", "sesuai", "bidang", "kota", "acara", "kajian", "profil",
    "rating", "biaya", "tarif", "jadwal", "tersedia",
  ].map((w) => w.toLowerCase())
);

/**
 * Deteksi nama ustadz yang tidak ada di database (halusinasi).
 * Mengembalikan daftar nama yang mencurigakan.
 */
export function detectUnknownUstadzNames(
  text: string,
  knownNames: string[]
): string[] {
  const found: string[] = [];
  const regex = /(?:ustadz|ustadzah|ust\.)\s+([A-Z][a-zA-Z'’]+(?:\s+[A-Z][a-zA-Z'’]+){0,3})/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const name = m[1].trim();
    const first = name.toLowerCase().split(" ")[0];

    // Bukan nama orang — lewati
    if (NON_NAME_WORDS.has(first)) continue;

    const isKnown = knownNames.some((n) =>
      n.toLowerCase().includes(first)
    );
    if (!isKnown) found.push(name);
  }
  return found;
}
