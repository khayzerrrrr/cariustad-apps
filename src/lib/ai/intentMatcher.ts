import {
  searchUstadz,
  recommendUstadz,
  searchKajian,
  formatUstadzProfile,
  SearchResult,
} from "./tools";
import { ustadzData } from "@/lib/data";
import { ALL_SPECIALIZATIONS, ALL_CITIES, Specialization } from "@/lib/types";
import { REGION_ALIASES, ISLAND_PROVINCES, ALL_PROVINCES } from "@/lib/regions";
import { parseBookingRequest, formatBookingPlan, ParsedBookingRequest } from "./bookingParser";
import { checkCulturalRules, suggestAlternativeTimes, shouldRecommendUstadzah } from "./culturalRules";
import { detectPromptInjection } from "./promptGuard";
import { checkScope } from "./scopeGuard";
import { handleDalilRequest } from "./expertHafizh";
import {
  AgentContext,
  EMPTY_CONTEXT,
  isConfirmation,
  isCancellation,
  clearPendingBooking,
} from "./agentContext";
import { formatRupiah } from "@/lib/storage";

export type IntentAction =
  | "search"
  | "recommend"
  | "kajian"
  | "profile"
  | "guide"
  | "info"
  | "dalil"
  | "booking_plan"
  | "booking_confirmed"
  | "booking_cancelled"
  | "clarify"
  | "blocked"
  | "refused";

export interface PendingBookingPayload {
  ustadzId: string;
  ustadzName: string;
  day: string;
  time: string;
  eventName: string;
  location: string;
  audience: string;
  notes: string;
}

export interface IntentResult {
  text: string;
  action?: IntentAction;
  data?: SearchResult;
  parsedBooking?: ParsedBookingRequest;
  culturalWarnings?: string[];
  auditMeta?: Record<string, unknown>;
  /** Konteks terbaru, dikirim balik ke klien */
  context?: AgentContext;
  /** Diisi hanya saat booking dikonfirmasi */
  booking?: PendingBookingPayload;
}

/* ------------------------- daftar kata kunci ------------------------- */

const GREETINGS = [
  "assalam",
  "salam",
  "halo",
  "hai",
  "hello",
  "selamat pagi",
  "selamat siang",
  "selamat sore",
  "selamat malam",
];

/** Penanda bahwa pesan berisi permintaan nyata, bukan sekadar menyapa. */
const TASK_HINTS = [
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
  "kajian",
  "pengajian",
  "tampilkan",
  "daftar",
  "siapa",
  "berapa",
];

const BOOKING_KEYWORDS = [
  "booking",
  "undang",
  "pesan ustadz",
  "sewa ustadz",
  "cara booking",
  "bagaimana booking",
  "saya mau booking",
  "saya butuh ustadz",
  "saya ingin booking",
  "saya mau undang",
  "tolong carikan ustadz untuk",
];

const RECOMMEND_KEYWORDS = [
  "rekomendasi",
  "rekomendasikan",
  "saran",
  "sarankan",
  "terbaik",
  "top",
  "unggul",
  "favorit",
];

const KAJIAN_KEYWORDS = [
  "kajian",
  "pengajian",
  "tabligh",
  "ceramah",
  "jadwal kajian",
];

const ABOUT_KEYWORDS = [
  "kamu siapa",
  "apa itu cariustadz",
  "kenalan",
  "perkenalan",
  "tentang kamu",
  "kamu apa",
  "asisten apa",
  "bisa apa",
];

const SEARCH_KEYWORDS = ["cari", "temukan", "ada", "tampilkan", "lihat", "mana", "carikan"];

/* Audiens yang memengaruhi pemilihan ustadz / ustadzah */
const AUDIENCE_FEMALE = ["ibu-ibu", "ibu ibu", "muslimah", "wanita", "akhwat", "perempuan"];
const AUDIENCE_YOUTH = ["anak muda", "remaja", "mahasiswa", "gen z", "generasi muda"];

const THANKS_KEYWORDS = ["terima kasih", "makasih", "thanks", "syukron", "jazakallah"];

const DAY_NAMES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];



/* Penyaring lanjutan atas hasil pencarian sebelumnya */
const REFINE_CHEAP = ["lebih murah", "termurah", "paling murah", "hemat", "budget", "murah"];
const REFINE_PRICEY = ["lebih mahal", "termahal", "paling mahal"];
const REFINE_RATING = ["rating tertinggi", "rating paling", "paling bagus", "terbaik", "rating"];
const REFINE_EXPERIENCE = ["paling berpengalaman", "pengalaman terlama", "senior", "paling lama"];

/* ----------------------------- util ----------------------------- */

function normalize(t: string): string {
  return ` ${t.toLowerCase().replace(/\s+/g, " ").trim()} `;
}

/* Alias bidang: pengguna jarang menyebut nama lengkap spesialisasi */
const SPEC_ALIASES: Array<[string, Specialization]> = [
  ["fiqih wanita", "Fiqih Wanita"],
  ["fikih wanita", "Fiqih Wanita"],
  ["tafsir al-qur'an", "Tafsir Al-Qur'an"],
  ["tafsir", "Tafsir Al-Qur'an"],
  ["qur'an", "Tafsir Al-Qur'an"],
  ["quran", "Tafsir Al-Qur'an"],
  ["aqidah", "Aqidah"],
  ["akidah", "Aqidah"],
  ["fikih", "Fiqih"],
  ["fiqih", "Fiqih"],
  ["parenting", "Parenting Islami"],
  ["tasawuf", "Tasawuf & Akhlak"],
  ["akhlak", "Tasawuf & Akhlak"],
  ["tausiyah", "Ceramah & Tausiyah"],
  ["ceramah", "Ceramah & Tausiyah"],
  ["nikah", "Nikah & Keluarga"],
  ["muamalah", "Muamalah & Ekonomi Syariah"],
  ["ekonomi syariah", "Muamalah & Ekonomi Syariah"],
  ["tahsin", "Tahsin & Tahfidz"],
  ["tahfidz", "Tahsin & Tahfidz"],
  ["tahfiz", "Tahsin & Tahfidz"],
  ["waris", "Fiqih"],
  ["faraid", "Fiqih"],
];

/**
 * Alias wilayah: "jakarta", "jogja", "solo", nama provinsi, hingga kelompok
 * pulau ("sumatera", "papua"). Semua dipetakan ke daftar kota konkret
 * sehingga chatbot bisa menjawab pertanyaan lintas wilayah, bukan hanya
 * 11 kota besar.
 */
const CITY_ALIASES: Record<string, string[]> = REGION_ALIASES;

const PRICE_KEYWORDS = ["biaya", "tarif", "harga", "honor", "fee", "berapa"];

function findCities(msg: string): string[] {
  const direct = ALL_CITIES.filter((c) => msg.includes(c.toLowerCase()));
  if (direct.length > 0) return direct;

  // Alias diperiksa dari kunci terpanjang agar "sulawesi selatan" menang
  // atas "sulawesi".
  const keys = Object.keys(CITY_ALIASES).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (msg.includes(key)) return CITY_ALIASES[key];
  }
  return [];
}

/** Label wilayah yang cocok ("Papua", "Sumatera Selatan") — untuk kalimat balasan */
function findRegionLabel(msg: string): string | undefined {
  if (ALL_CITIES.some((c) => msg.includes(c.toLowerCase()))) return undefined;
  const keys = Object.keys(CITY_ALIASES).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (msg.includes(key)) return key;
  }
  return undefined;
}

function findCity(msg: string): string | undefined {
  return findCities(msg)[0];
}

/**
 * "Jakarta Selatan / Jakarta Timur" cukup disebut "Jakarta". Untuk wilayah
 * luas (pulau/provinsi), pakai label wilayahnya, bukan daftar panjang.
 */
function cityLabel(cities: string[], regionLabel?: string): string {
  if (regionLabel) return regionLabel;
  if (
    cities.length === 2 &&
    cities.every((c) => c.toLowerCase().startsWith("jakarta"))
  ) {
    return "Jakarta";
  }
  if (cities.length > 3) {
    return `${cities.length} kota (${cities.slice(0, 3).join(", ")}, dll.)`;
  }
  return cities.join(" / ");
}

function findSpecialization(msg: string): Specialization | undefined {
  // Alias multi-kata diperiksa lebih dulu agar "fiqih wanita" tidak
  // tertangkap sebagai "fiqih" biasa.
  const sorted = [...SPEC_ALIASES].sort((a, b) => b[0].length - a[0].length);
  for (const [alias, spec] of sorted) {
    if (msg.includes(alias)) return spec;
  }
  return undefined;
}

/** "Fiqih" juga mencakup "Fiqih Wanita" agar hasil tidak kosong tanpa alasan. */
function matchesSpec(
  u: { specializations: Specialization[] },
  spec: Specialization
): boolean {
  const needle = spec.toLowerCase();
  return u.specializations.some((s) => s.toLowerCase().includes(needle));
}

function formatList(list: typeof ustadzData, header: string): string {
  return (
    `${header}\n\n` +
    list
      .map(
        (u, i) =>
          `${i + 1}. ${u.title} ${u.name}\n   ${u.specializations.join(", ")} · ${u.city} · Rating ${u.rating} · ${formatRupiah(u.fee)}`
      )
      .join("\n\n")
  );
}

/** Tautan langsung ke halaman undang untuk satu ustadz. */
function bookingLinkLine(u: { id: string; title: string; name: string }): string {
  return `[Undang ${u.title} ${u.name} langsung →](/booking?ustadz=${u.id})`;
}

/** Blok tautan undang untuk beberapa ustadz sekaligus. */
function bookingLinksBlock(list: { id: string; title: string; name: string }[]): string {
  if (list.length === 0) return "";
  return (
    `\n\nUndang langsung dari halaman jadwalnya:\n` +
    list.map((u) => `- ${bookingLinkLine(u)}`).join("\n")
  );
}

/* ---------------------- penyaring lanjutan ---------------------- */

function refinePrevious(message: string, ctx: AgentContext): IntentResult | null {
  if (!ctx.lastUstadzIds || ctx.lastUstadzIds.length === 0) return null;

  const msg = normalize(message);
  const base = ctx.lastUstadzIds
    .map((id) => ustadzData.find((u) => u.id === id))
    .filter(Boolean) as typeof ustadzData;
  if (base.length === 0) return null;

  let list = [...base];
  let label = "";

  if (REFINE_CHEAP.some((k) => msg.includes(k))) {
    list.sort((a, b) => a.fee - b.fee);
    label = "urutkan dari biaya paling ringan";
  } else if (REFINE_PRICEY.some((k) => msg.includes(k))) {
    list.sort((a, b) => b.fee - a.fee);
    label = "urutkan dari biaya tertinggi";
  } else if (REFINE_RATING.some((k) => msg.includes(k))) {
    list.sort((a, b) => b.rating - a.rating);
    label = "urutkan dari rating tertinggi";
  } else if (REFINE_EXPERIENCE.some((k) => msg.includes(k))) {
    list.sort((a, b) => b.experience - a.experience);
    label = "urutkan dari pengalaman terlama";
  } else {
    const city = findCity(msg);
    if (city) {
      const filtered = base.filter((u) => u.city === city);
      if (filtered.length > 0) {
        list = filtered;
        label = `filter untuk kota ${city}`;
      } else {
        return {
          text: `Dari hasil sebelumnya, tidak ada yang berdomisili di ${city}. Mau saya carikan ustadz lain di ${city}?`,
          action: "clarify",
          context: { ...ctx, turn: ctx.turn + 1 },
        };
      }
    } else {
      return null;
    }
  }

  const top = list.slice(0, 5);
  return {
    text:
      formatList(top, `Baik, hasil sebelumnya saya ${label}:`) +
      bookingLinksBlock(top) +
      `\n\nMau saya lanjutkan ke undangan untuk salah satu dari mereka?`,
    action: "search",
    data: { list: top, text: "" },
    context: {
      ...ctx,
      turn: ctx.turn + 1,
      lastUstadzIds: top.map((u) => u.id),
      lastAction: "search",
    },
  };
}

/* --------------------------- proses booking --------------------------- */

function processBookingRequest(message: string, ctx: AgentContext): IntentResult {
  const parsed = parseBookingRequest(message);

  /* Klarifikasi bertahap: gabungkan dengan draf sebelumnya, jadi pengguna
     tidak perlu menyebut semuanya dalam satu kalimat — cukup menjawab
     satu pertanyaan dalam satu giliran. */
  const prev = ctx.pendingBooking;
  if (prev) {
    parsed.eventType = parsed.eventType ?? prev.eventType;
    parsed.city = parsed.city ?? prev.city;
    parsed.day = parsed.day ?? prev.day;
    parsed.startTime = parsed.startTime ?? prev.startTime;
    parsed.endTime = parsed.endTime ?? prev.endTime;
    parsed.audienceSize = parsed.audienceSize ?? prev.audienceSize;
    parsed.specialization = parsed.specialization ?? prev.specialization;
  }

  /* Tanya SATU hal yang paling penting dulu — seperti percakapan manusia.
     Urutan: kota → hari & jam. Jenis acara tidak memblokir — cukup
     ditanyakan santai setelah rencana jadi, atau dibiarkan umum.
     Bila pertanyaan yang sama pernah diajukan dan tetap tak terjawab,
     jangan memaksa: lanjutkan dengan yang ada. */
  const needCity = !parsed.city;
  const needTime = !parsed.day || !parsed.startTime;
  const queue = [
    needCity
      ? {
          field: "city",
          ask:
            `Siap. Sebelum saya carikan — acaranya di kota apa? ` +
            `Kalau belum pasti, sebutkan saja area sekitarnya.`,
        }
      : null,
    needTime
      ? {
          field: "time",
          ask:
            `Kapan rencananya? Sebutkan hari dan jamnya — misalnya "Sabtu jam 20:00". ` +
            `Itu perlu saya cek juga terhadap aturan waktu, misalnya Salat Jumat.`,
        }
      : null,
  ].filter(Boolean) as Array<{ field: string; ask: string }>;

  const askedBefore = ctx.pendingClarify;
  const dodged = askedBefore ? queue.some((q) => q.field === askedBefore) : false;
  const toAsk = queue.find((q) => q.field !== askedBefore);

  if (toAsk && !dodged) {
    return {
      text: toAsk.ask,
      action: "clarify",
      parsedBooking: parsed,
      context: {
        ...ctx,
        turn: ctx.turn + 1,
        lastAction: "clarify",
        pendingBooking: parsed,
        pendingClarify: toAsk.field,
      },
    };
  }

  /* Lanjut dengan yang ada — tandai kekurangannya supaya rencana
     menyebutkannya dengan jujur. */
  if (queue.length > 0) {
    parsed.missingFields = queue.map((q) => q.field);
  }
  const cultural = checkCulturalRules({
    day: parsed.day,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    message,
  });

  if (!cultural.passed) {
    const alternatives = parsed.day ? suggestAlternativeTimes(parsed.day) : [];
    return {
      text:
        `Saya tidak bisa menjadwalkan pada waktu itu.\n\n` +
        cultural.conflicts.map((c) => `• ${c}`).join("\n") +
        (alternatives.length > 0
          ? `\n\nWaktu alternatif:\n${alternatives.map((a) => `• ${a}`).join("\n")}`
          : "") +
        `\n\nSilakan pilih waktu lain atau ganti hari.`,
      action: "clarify",
      parsedBooking: parsed,
      culturalWarnings: cultural.conflicts,
      auditMeta: { culturalConflicts: cultural.conflicts },
      /* Draf booking WAJIB dibawa: tanpa ini, jawaban lanjutan seperti
         "baik di jam 13.30 saja" kehilangan konteks (kota, hari, jumlah
         peserta) dan jatuh ke fallback. lastAction "clarify" agar langkah
         0b tetap menangkap jawaban klarifikasi berikutnya. */
      context: {
        ...ctx,
        turn: ctx.turn + 1,
        lastAction: "clarify",
        pendingBooking: parsed,
        pendingClarify: "time",
      },
    };
  }

  let searchResult: SearchResult | undefined;
  const needsUstadzah = shouldRecommendUstadzah(message);
  const query = parsed.specialization || parsed.city || "";
  if (query) searchResult = searchUstadz(query);
  if (!searchResult || !searchResult.text) {
    searchResult = recommendUstadz(query);
  }

  // Hormati preferensi gender: jangan menawarkan ustadzah saat user minta ustadz
  const isUstadzah = (u: { title: string; name: string }) =>
    u.title.toLowerCase().includes("ustadzah");
  if (searchResult?.list && parsed.genderPreference !== "any") {
    const wantFemale = parsed.genderPreference === "ustadzah";
    const sorted = [...searchResult.list].sort((a, b) => {
      const aMatch = isUstadzah(a) === wantFemale ? 0 : 1;
      const bMatch = isUstadzah(b) === wantFemale ? 0 : 1;
      return aMatch - bMatch;
    });
    searchResult = { ...searchResult, list: sorted };
  }

  /* Rekomendasi booking: kota yang disebut pengguna WAJIB diutamakan —
     jangan menawarkan ustadz kota lain sebagai pilihan utama. Tampilkan
     beberapa pilihan tersedia, masing-masing dengan tautan undangnya. */
  const rawList =
    searchResult?.list ?? (searchResult?.ustadz ? [searchResult.ustadz] : []);
  const ranked = [...rawList].sort((a, b) => {
    if (parsed.city) {
      const ac = Number(a.city === parsed.city);
      const bc = Number(b.city === parsed.city);
      if (ac !== bc) return bc - ac;
    }
    return b.rating - a.rating;
  });
  const topPicks = ranked.slice(0, 3);
  const picked = topPicks[0];
  const ustadzName = picked ? `${picked.title} ${picked.name}` : undefined;

  let text: string;
  if (picked) {
    const exactCityCount = parsed.city
      ? topPicks.filter((u) => u.city === parsed.city).length
      : topPicks.length;
    const intro = parsed.city
      ? exactCityCount > 0
        ? `Untuk ${parsed.eventType?.toLowerCase() ?? "acara Anda"} di ${parsed.city}, ini ${topPicks.length} pilihan teratas yang tersedia:`
        : `Untuk ${parsed.eventType?.toLowerCase() ?? "acara"} di ${parsed.city}, belum ada ustadz yang berbasis di sana — ini ${topPicks.length} yang paling dekat dan tersedia:`
      : `Berikut ${topPicks.length} pilihan teratas yang tersedia:`;

    const optionLines = topPicks.map(
      (u, i) =>
        `${i + 1}. ${u.title} ${u.name} — ${u.specializations[0] ?? "kajian"} · ${u.city} · rating ${u.rating}/5 · ${formatRupiah(u.fee)}\n` +
        `   ${bookingLinkLine(u)}`
    );

    text =
      `${intro}\n\n${optionLines.join("\n\n")}` +
      `\n\nCek jadwal lewat tautannya, atau balas "setuju" untuk melanjutkan dengan pilihan teratas (${ustadzName}).`;
    if (needsUstadzah && !isUstadzah(picked)) {
      text += `\nCatatan: Anda menyebut audience muslimah — saya bisa carikan ustadzah bila lebih sesuai.`;
    }
    const mismatch =
      parsed.genderPreference !== "any" &&
      (parsed.genderPreference === "ustadzah") !== isUstadzah(picked);
    if (mismatch) {
      text +=
        `\nCatatan jujur: di ${parsed.city ?? picked.city} belum ada ${
          parsed.genderPreference === "ustadz" ? "ustadz pria" : "ustadzah"
        } di database kami. Saya tawarkan yang tersedia; bila preferensi ini penting, saya bisa carikan di kota terdekat.`;
    }
  } else {
    text = formatBookingPlan(parsed, ustadzName);
  }
  if (cultural.warnings.length > 0) {
    text += `\n\nCatatan waktu: ${cultural.warnings.join("; ")}`;
  }
  if (cultural.suggestions.length > 0) {
    text += `\n\nCatatan: ${cultural.suggestions.join(", ")}`;
  }

  return {
    text,
    action: "booking_plan",
    data: searchResult,
    parsedBooking: parsed,
    culturalWarnings: cultural.conflicts,
    auditMeta: { parsedFields: parsed, recommendedUstadz: ustadzName },
    context: {
      ...ctx,
      turn: ctx.turn + 1,
      city: parsed.city ?? ctx.city,
      specialization: parsed.specialization ?? ctx.specialization,
      lastUstadzIds: searchResult?.list?.map((u) => u.id) ?? ctx.lastUstadzIds,
      lastAction: "booking_plan",
      pendingBooking: parsed,
      pendingUstadzId: picked?.id,
      pendingUstadzName: ustadzName,
      awaitingConfirmation: Boolean(picked),
    },
  };
}

/* ------------------------------- utama ------------------------------- */

export function matchIntent(message: string, context?: AgentContext): IntentResult {
  const ctx: AgentContext = context ?? EMPTY_CONTEXT;
  const msg = normalize(message);

  /* 0. Instruksi manipulatif */
  const injection = detectPromptInjection(message);
  if (injection.isInjection) {
    return {
      text:
        `Maaf, saya tidak bisa mengikuti permintaan itu.\n\n` +
        `Saya hanya bisa membantu soal pencarian dan undangan ustadz, jadwal kajian, atau bertanya dalil.\n\n` +
        `Ada yang bisa saya bantu?`,
      action: "blocked",
      auditMeta: { injectionPatterns: injection.patterns },
      context: { ...ctx, turn: ctx.turn + 1, lastAction: "injection_blocked" },
    };
  }

  /* 0b. Lanjutan klarifikasi booking — jawaban pendek seperti "di Bandung"
     atau "Sabtu jam 20:00" tidak mengandung kata booking, tetapi harus
     tetap masuk alur booking yang sedang berjalan. Berlaku juga saat agent
     sudah menampilkan rencana (booking_plan) atau baru saja menolak waktu
     (cultural_check): pengguna bisa menjawab dengan jam baru, mis.
     "baik di jam 13.30 saja", dan alur TIDAK boleh putus. Pesan tanpa
     data baru (mis. "setuju") lolos ke langkah konfirmasi di bawah. */
  if (
    (ctx.lastAction === "clarify" ||
      ctx.lastAction === "cultural_check" ||
      ctx.lastAction === "booking_plan") &&
    ctx.pendingBooking
  ) {
    const fresh = parseBookingRequest(message);
    const hasNew = Boolean(
      fresh.city ||
        fresh.day ||
        fresh.startTime ||
        fresh.eventType ||
        fresh.specialization ||
        (fresh.audienceSize && fresh.audienceSize !== ctx.pendingBooking.audienceSize)
    );
    if (hasNew) {
      return processBookingRequest(message, ctx);
    }
  }

  /* 1. Batas domain, jangan menjawab di luar konteks */
  const scope = checkScope(message);
  if (scope.verdict === "dalil_request") {
    /* Mode Ustadz Hafizh — jawab dengan dalil terverifikasi */
    const dalil = handleDalilRequest(message);
    return {
      text: dalil.text,
      action: dalil.blocked ? "blocked" : "dalil",
      auditMeta: {
        scope: scope.verdict,
        sources: dalil.sources.map((s) => s.citation),
      },
      context: {
        ...ctx,
        turn: ctx.turn + 1,
        lastAction: dalil.blocked ? "injection_blocked" : "dalil",
      },
    };
  }
  if (scope.verdict !== "in_scope") {
    return {
      text: scope.reply ?? "Maaf, itu di luar jangkauan saya.",
      action: "refused",
      auditMeta: { scope: scope.verdict, matched: scope.matched },
      context: { ...ctx, turn: ctx.turn + 1, lastAction: "refused" },
    };
  }

  /* 2. Konfirmasi atau pembatalan booking yang tertunda */
  if (ctx.awaitingConfirmation && ctx.pendingBooking && ctx.pendingUstadzId) {
    if (isConfirmation(message)) {
      const b = ctx.pendingBooking;
      const booking: PendingBookingPayload = {
        ustadzId: ctx.pendingUstadzId,
        ustadzName: ctx.pendingUstadzName ?? "Ustadz",
        day: b.day ?? "-",
        time: b.startTime ?? "-",
        eventName: b.eventType ?? "Kajian",
        location: b.location ?? b.city ?? "-",
        audience: b.audienceSize ? `${b.audienceSize} orang` : "-",
        notes: b.rawMessage,
      };
      return {
        text:
          `Undangan dikonfirmasi.\n\n` +
          `Ustadz: ${booking.ustadzName}\n` +
          `Acara: ${booking.eventName}\n` +
          `Hari: ${booking.day}, ${booking.time}\n` +
          `Lokasi: ${booking.location}\n\n` +
          `Permintaan sudah saya catat dan akan diteruskan ke ustadz. ` +
          `Pantau statusnya di halaman [Undang Ustadz](/booking).`,
        action: "booking_confirmed",
        booking,
        auditMeta: { confirmed: true },
        context: {
          ...clearPendingBooking(ctx),
          turn: ctx.turn + 1,
          lastAction: "booking_confirmed",
        },
      };
    }

    if (isCancellation(message)) {
      return {
        text: `Baik, rencana undangan saya batalkan. Tidak ada yang tercatat.\n\nAda yang lain yang bisa saya bantu?`,
        action: "booking_cancelled",
        auditMeta: { cancelled: true },
        context: {
          ...clearPendingBooking(ctx),
          turn: ctx.turn + 1,
          lastAction: "booking_cancelled",
        },
      };
    }
  }

  /* 3. Sapaan — hanya bila tidak ada permintaan nyata di pesan yang sama */
  const hasRealTask = TASK_HINTS.some((k) => msg.includes(k));
  if (
    !hasRealTask &&
    message.trim().length < 60 &&
    GREETINGS.some((g) => msg.includes(` ${g}`))
  ) {
    return {
      text:
        `Wa'alaikumussalam warahmatullah. Saya asisten AI CariUstadz.\n\n` +
        `Saya bisa membantu:\n• Mencari ustadz sesuai bidang, kota, atau nama\n• Menampilkan profil, rating, biaya, dan jadwal\n• Menyusun rencana undangan (butuh persetujuan Anda)\n• Info kajian mendatang\n\n` +
        `Apa yang Anda butuhkan?`,
      action: "info",
      context: { ...ctx, turn: ctx.turn + 1, lastAction: "greeting" },
    };
  }

  /* 4. Tentang asisten */
  if (ABOUT_KEYWORDS.some((k) => msg.includes(k))) {
    return {
      text:
        `Saya asisten AI CariUstadz, bukan ustadz, dan tidak berwenang memberi fatwa.\n\n` +
        `Yang saya jaga:\n` +
        `1. Setiap rekomendasi disertai sumber: rating, jumlah ulasan, pengalaman\n` +
        `2. Nomor kontak ustadz baru dibuka setelah undangan dikonfirmasi\n` +
        `3. Undangan tidak pernah dieksekusi tanpa persetujuan Anda\n` +
        `4. Kalau data tidak ada, saya katakan tidak ada, tidak menebak\n` +
        `5. Semua langkah tercatat di audit log\n\n` +
        `Saya juga memperhatikan waktu salat dan preferensi ustadz atau ustadzah.`,
      action: "info",
      context: { ...ctx, turn: ctx.turn + 1, lastAction: "about" },
    };
  }

  /* 4b. Penjelasan alur booking — bukan permintaan booking */
  if (
    /(cara|bagaimana|gimana|proses|alur|tahapan?)\s+\S*(booking|pesan|memesan|undang|invite)/i.test(
      message
    ) ||
    /(booking|pesan)\s+(itu\s+)?(bagaimana|gimana|cara)/i.test(message)
  ) {
    const howToTail = (() => {
      const lastId = ctx.lastUstadzIds?.[0];
      const last = lastId ? ustadzData.find((u) => u.id === lastId) : undefined;
      if (last) {
        return (
          `\n\nKalau yang tadi saya rekomendasikan sudah pas, undang langsung dari halaman jadwalnya:\n` +
          bookingLinkLine(last)
        );
      }
      return `\n\nBelum ada ustadz yang dipilih? Cari dulu di direktori: [Buka Direktori Ustadz →](/ustadz)`;
    })();

    return {
      text:
        `Alurnya empat langkah, dan langkah terakhir selalu Anda yang putuskan:\n\n` +
        `1. Anda sebutkan kebutuhan: jenis acara, hari, jam, kota, jumlah jamaah\n` +
        `2. Saya cek ketersediaan ustadz dan aturan budaya (misalnya Salat Jumat)\n` +
        `3. Saya susun rencana undangan dan tampilkan sumbernya (rating, pengalaman)\n` +
        `4. Anda menyetujui — baru permintaan diteruskan ke ustadz\n\n` +
        `Tidak ada undangan yang berjalan tanpa persetujuan Anda. ` +
        `Mau saya bantu susun rencananya sekarang?` +
        howToTail,
      action: "info",
      context: { ...ctx, turn: ctx.turn + 1, lastAction: "how_to_book" },
    };
  }

  /* 4c. Pertanyaan privasi dan keamanan data */
  if (
    /(data|privasi|informasi)\s+(saya|aku|pribadi)/i.test(message) ||
    msg.includes("privasi") ||
    msg.includes("aman tidak")
  ) {
    return {
      text:
        `Yang perlu Anda tahu soal data:\n\n` +
        `• Riwayat undangan dan chat disimpan di perangkat Anda sendiri (localStorage), bukan di server kami\n` +
        `• Nomor kontak ustadz baru ditampilkan setelah undangan dikonfirmasi\n` +
        `• Setiap langkah agen tercatat di audit log yang bisa Anda buka\n` +
        `• Saya tidak mengirim data Anda ke pihak ketiga\n\n` +
        `Anda bisa menghapus riwayat kapan saja lewat tombol reset di halaman Asisten.`,
      action: "info",
      context: { ...ctx, turn: ctx.turn + 1, lastAction: "privacy" },
    };
  }

  /* 4d. Batas kemampuan yang perlu diakui terus terang */
  if (
    msg.includes("bahasa inggris") ||
    msg.includes("english") ||
    msg.includes("bahasa asing") ||
    msg.includes("bahasa arab")
  ) {
    return {
      text:
        `Saya belum punya filter bahasa untuk ustadz — data kami belum menyimpan kemampuan berbahasa.\n\n` +
        `Yang bisa saya saring: bidang keahlian, kota, rating, biaya, dan pengalaman. ` +
        `Kalau kemampuan bahasa tertentu penting, sebaiknya ditanyakan langsung ke ustadz saat konsultasi. ` +
        `Mau saya carikan ustadz di bidang yang Anda butuhkan dulu?`,
      action: "info",
      context: { ...ctx, turn: ctx.turn + 1, lastAction: "limit_language" },
    };
  }

  /* 4e. Jumlah ustadz yang terdaftar */
  if (
    /berapa\s+(jumlah|banyak|total)\s+ustadz/i.test(message) ||
    msg.includes("jumlah ustadz") ||
    msg.includes("total ustadz")
  ) {
    return {
      text:
        `Saat ini ada ${ustadzData.length} ustadz & ustadzah terverifikasi di ` +
        `${ALL_CITIES.length} kota, ${ALL_PROVINCES.length} provinsi — dari Aceh sampai Papua. ` +
        `Bidang keahlian tersedia ${ALL_SPECIALIZATIONS.length}.\n\n` +
        `Mau saya tampilkan yang dekat lokasi Anda, atau saring berdasarkan kota dan bidang?`,
      action: "info",
      context: { ...ctx, turn: ctx.turn + 1, lastAction: "count" },
    };
  }

  /* 5. Booking */
  if (BOOKING_KEYWORDS.some((k) => msg.includes(k))) {
    return processBookingRequest(message, ctx);
  }

  /* 5b. Ucapan terima kasih — jangan balas dengan template bantuan */
  if (
    THANKS_KEYWORDS.some((k) => msg.includes(k)) &&
    message.trim().length < 40
  ) {
    return {
      text:
        `Sama-sama. Semoga urusannya dimudahkan.\n\n` +
        `Kalau nanti butuh cari ustadz atau menyusun jadwal kajian, saya siap bantu.`,
      action: "info",
      context: { ...ctx, turn: ctx.turn + 1, lastAction: "thanks" },
    };
  }

  /* 5c. Audiens tertentu (muslimah / anak muda) memengaruhi pilihan ustadz */
  const audienceFemale = AUDIENCE_FEMALE.some((k) => msg.includes(k));
  const audienceYouth = AUDIENCE_YOUTH.some((k) => msg.includes(k));
  if (audienceFemale || audienceYouth) {
    let pool = [...ustadzData];
    const notes: string[] = [];

    if (audienceFemale) {
      const female = pool.filter((u) => u.title.toLowerCase().includes("ustadzah"));
      if (female.length > 0) {
        pool = female;
        notes.push("Untuk audience muslimah, saya utamakan ustadzah.");
      }
    }

    if (audienceYouth) {
      pool.sort(
        (a, b) =>
          Number(b.specializations.includes("Ceramah & Tausiyah")) -
          Number(a.specializations.includes("Ceramah & Tausiyah"))
      );
      notes.push("Untuk audience anak muda, saya utamakan yang kuat di Ceramah & Tausiyah.");
    }

    pool.sort((a, b) => b.rating - a.rating);
    const top = pool.slice(0, 4);

    return {
      text:
        formatList(top, `Berikut ${top.length} ustadz yang paling sesuai:`) +
        bookingLinksBlock(top) +
        `\n\n${notes.join(" ")}\n\nMau saya susun rencana undangan untuk salah satu dari mereka?`,
      action: "recommend",
      data: { list: top, text: "" },
      context: {
        ...ctx,
        turn: ctx.turn + 1,
        lastUstadzIds: top.map((u) => u.id),
        lastAction: "recommend",
      },
    };
  }

  /* 6. Kajian — hanya bila tidak sedang mencari ustadz */
  if (
    KAJIAN_KEYWORDS.some((k) => msg.includes(k)) &&
    !msg.includes("ustadz") &&
    !msg.includes("cocok")
  ) {
    const kajianCity = findCity(msg);
    let result = searchKajian(kajianCity);

    // Kota yang diminta belum ada kajiannya — jangan balas daftar kosong
    if (kajianCity && (result.kajian?.length ?? 0) === 0) {
      const semua = searchKajian();
      const items = semua.text.replace(
        /^Berikut kajian mendatang yang tersedia:\s*/,
        ""
      );
      result = {
        ...semua,
        text:
          `Belum ada kajian terjadwal di ${kajianCity}.\n\n` +
          `Kajian terdekat yang bisa Anda ikuti:\n${items}`,
      };
    }
    return {
      text: result.text,
      action: "kajian",
      data: result,
      context: { ...ctx, turn: ctx.turn + 1, lastAction: "kajian" },
    };
  }

  /* 7. Penyaringan hasil sebelumnya */
  const refined = refinePrevious(message, ctx);
  if (refined) return refined;

  /* 7b. Nama ustadz — didahulukan agar "tarif ustadz Abdul Rahman" tidak
     berubah menjadi daftar umum 12 orang */
  const nameMatch = ustadzData
    .map((u) => {
      const parts = u.name.toLowerCase().split(" ");
      const hits = parts.filter((p) => p.length > 3 && msg.includes(p));
      return { u, score: hits.length };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.u;

  if (nameMatch) {
    const askedDay = DAY_NAMES.find((d) => msg.includes(d.toLowerCase()));
    let text = "";

    if (askedDay) {
      const slot = nameMatch.schedule.find(
        (s) => s.day.toLowerCase() === askedDay.toLowerCase()
      );
      if (!slot) {
        text =
          `${nameMatch.title} ${nameMatch.name} tidak membuka jadwal pada hari ${askedDay}.\n` +
          `Hari yang tersedia: ${nameMatch.schedule.map((s) => s.day).join(", ")}.\n\n`;
      } else {
        const free = slot.slots.filter((s) => !s.booked).map((s) => s.time);
        text =
          (free.length > 0
            ? `Ya, ${nameMatch.title} ${nameMatch.name} tersedia hari ${slot.day}.\nSlot kosong: ${free.join(", ")}.`
            : `Maaf, jadwal ${nameMatch.title} ${nameMatch.name} pada hari ${slot.day} sudah penuh.`) +
          `\n\n`;
      }
    }

    return {
      text: text + formatUstadzProfile(nameMatch),
      action: "profile",
      data: { ustadz: nameMatch, text: "" },
      context: {
        ...ctx,
        turn: ctx.turn + 1,
        lastUstadzIds: [nameMatch.id],
        lastAction: "profile",
      },
    };
  }

  /* 8. Rekomendasi umum (tanpa filter kota/bidang — itu ditangani langkah 9) */
  if (
    RECOMMEND_KEYWORDS.some((k) => msg.includes(k)) &&
    findCities(msg).length === 0 &&
    !findSpecialization(msg)
  ) {
    const result = recommendUstadz(msg);
    return {
      text: result.text,
      action: "recommend",
      data: result,
      context: {
        ...ctx,
        turn: ctx.turn + 1,
        lastUstadzIds: result.list?.map((u) => u.id),
        lastAction: "recommend",
      },
    };
  }

  /* 8b. Pertanyaan cakupan jaringan — diletakkan sebelum pencarian agar
     frasa seperti "jaringan cariustadz menjangkau mana saja" tidak
     tertangkap kata "cari" dalam nama brand */
  const COVERAGE_RE =
    /(menjangkau|jangkauan|cakupan|sebaran|jaringan|mana\s+saja|wilayah\s+mana|daerah\s+mana|area\s+mana)/i;
  if (COVERAGE_RE.test(message)) {
    const female = ustadzData.filter((u) => u.gender === "P").length;
    const groupLines = Object.entries(ISLAND_PROVINCES)
      .map(
        ([island, provs]) =>
          `• ${island}: ${provs.length} provinsi (${provs.slice(0, 4).join(", ")}${
            provs.length > 4 ? ", dll." : ""
          })`
      )
      .join("\n");
    return {
      text:
        `CariUstadz menjangkau seluruh Indonesia: ${ALL_PROVINCES.length} provinsi, ` +
        `${ALL_CITIES.length} kota, ${ustadzData.length} ustadz & ustadzah ` +
        `(di antaranya ${female} ustadzah).\n\nSebaran wilayahnya:\n${groupLines}\n\n` +
        `Sebutkan kota atau provinsi Anda, saya carikan ustadz yang tepat.`,
      action: "info",
      context: { ...ctx, turn: ctx.turn + 1, lastAction: "list_cities" },
    };
  }

  /* 9. Pencarian berdasarkan kota, bidang, atau nama */
  const cities = findCities(msg);
  const spec = findSpecialization(msg);
  const asksPrice = PRICE_KEYWORDS.some((k) => msg.includes(k));
  const asksSearch = SEARCH_KEYWORDS.some((k) => msg.includes(k));
  const regionLabel = findRegionLabel(msg);

  if (asksSearch || asksPrice || cities.length > 0 || spec) {
    let list = [...ustadzData];
    if (spec) list = list.filter((u) => matchesSpec(u, spec));
    if (cities.length > 0) list = list.filter((u) => cities.includes(u.city));

    if (list.length > 0) {
      list.sort((a, b) => b.rating - a.rating);
      const top = list.slice(0, 5);
      const label =
        spec && cities.length > 0
          ? `untuk bidang ${spec} di ${cityLabel(cities, regionLabel)}`
          : spec
          ? `untuk bidang ${spec}`
          : cities.length > 0
          ? `di ${cityLabel(cities, regionLabel)}`
          : "";

      const priceLine = asksPrice
        ? `\n\nBiaya yang tertera adalah tarif per sesi. Yang paling ringan: ${formatRupiah(
            Math.min(...list.map((u) => u.fee))
          )}.`
        : "";

      return {
        text:
          formatList(
            top,
            label
              ? `Saya menemukan ${list.length} ustadz ${label}:`
              : `Saya menemukan ${list.length} ustadz yang sesuai:`
          ) +
          priceLine +
          bookingLinksBlock(top) +
          `\n\nMau saya buatkan rencana undangan untuk salah satu dari mereka?`,
        action: "search",
        data: { list: top, text: "" },
        context: {
          ...ctx,
          turn: ctx.turn + 1,
          city: cities[0] ?? ctx.city,
          specialization: spec ?? ctx.specialization,
          lastUstadzIds: top.map((u) => u.id),
          lastAction: "search",
        },
      };
    }

    // Ada filter tapi hasilnya kosong — jangan bilang "0 ustadz"
    const alternative = spec
      ? ustadzData.filter((u) => matchesSpec(u, spec)).slice(0, 3)
      : ustadzData
          .filter((u) => (cities.length > 0 ? cities.includes(u.city) : true))
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3);

    const reason = [
      spec ? `bidang ${spec}` : null,
      cities.length > 0 ? `di ${cityLabel(cities, regionLabel)}` : null,
    ]
      .filter(Boolean)
      .join(" ");

    if (alternative.length > 0) {
      return {
        text:
          `Belum ada ustadz untuk ${reason}.\n\n` +
          formatList(
            alternative,
            spec
              ? `Alternatifnya, ada ${alternative.length} ustadz ${spec} di kota lain:`
              : `Alternatifnya, ada ${alternative.length} ustadz di ${cityLabel(cities, regionLabel)} dengan bidang lain:`
          ) +
          `\n\nMau saya carikan di kota lain, atau ubah bidangnya?`,
        action: "clarify",
        data: { list: alternative, text: "" },
        context: {
          ...ctx,
          turn: ctx.turn + 1,
          lastUstadzIds: alternative.map((u) => u.id),
          lastAction: "clarify",
        },
      };
    }
  }

  /* 10. Daftar bidang atau kota */
  if (msg.includes("spesialisasi") || msg.includes("bidang") || msg.includes("keahlian")) {
    return {
      text:
        `Bidang keahlian yang tersedia:\n\n` +
        ALL_SPECIALIZATIONS.map((s, i) => `${i + 1}. ${s}`).join("\n") +
        `\n\nMau saya carikan ustadz di bidang tertentu?`,
      action: "info",
      context: { ...ctx, turn: ctx.turn + 1, lastAction: "list_specs" },
    };
  }

  if (msg.includes("kota") || msg.includes("lokasi") || msg.includes("daerah") || msg.includes("area")) {
    const female = ustadzData.filter((u) => u.gender === "P").length;
    const groupLines = Object.entries(ISLAND_PROVINCES)
      .map(
        ([island, provs]) =>
          `• ${island}: ${provs.length} provinsi (${provs.slice(0, 4).join(", ")}${
            provs.length > 4 ? ", dll." : ""
          })`
      )
      .join("\n");
    return {
      text:
        `CariUstadz menjangkau seluruh Indonesia: ${ALL_PROVINCES.length} provinsi, ` +
        `${ALL_CITIES.length} kota, ${ustadzData.length} ustadz & ustadzah ` +
        `(di antaranya ${female} ustadzah).\n\nSebaran wilayahnya:\n${groupLines}\n\n` +
        `Sebutkan kota atau provinsi Anda, saya carikan ustadz yang tepat.`,
      action: "info",
      context: { ...ctx, turn: ctx.turn + 1, lastAction: "list_cities" },
    };
  }

  /* 11b. Permintaan bantuan umum — ditempatkan setelah pencarian agar
     "bisa bantu carikan ustadz" tetap dianggap pencarian */
  if (
    /(tolong|mohon|bisa)\s+bantu/i.test(message) ||
    msg.includes("help") ||
    msg.includes("panduan") ||
    msg.includes("bingung") ||
    msg.includes("mulai dari mana")
  ) {
    return {
      text:
        `Siap, saya bantu arahkan. Paling mudah mulai dari salah satu ini:\n\n` +
        `• "Cari ustadz fiqih di Jakarta" — cari berdasarkan bidang dan kota\n` +
        `• "Rekomendasi ustadz terbaik" — lihat yang ratingnya paling tinggi\n` +
        `• "Berapa tarif ustadz Abdul Rahman?" — tanya biaya dan profil\n` +
        `• "Apakah ustadz Ahmad Zaki tersedia hari Sabtu?" — cek jadwal\n` +
        `• "Undang ustadz untuk kajian, Senin jam 19:00, di Bandung, 50 orang"\n\n` +
        `Ceritakan saja kebutuhan Anda dengan bahasa sehari-hari, saya yang carikan.`,
      action: "info",
      context: { ...ctx, turn: ctx.turn + 1, lastAction: "help" },
    };
  }

  /* 12. Bantuan umum */
  return {
    text:
      `Saya belum menangkap maksudnya. Saya khusus membantu urusan ustadz di CariUstadz.\n\n` +
      `Contoh yang bisa langsung saya kerjakan:\n` +
      `• "Cari ustadz fiqih di Jakarta"\n` +
      `• "Rekomendasi ustadz terbaik"\n` +
      `• "Undang ustadz untuk kajian, Senin jam 19:00, di Bandung, 50 orang"\n` +
      `• "Kajian mendatang"\n` +
      `• "Profil Ustadz Ahmad Zaki"`,
    action: "info",
    context: { ...ctx, turn: ctx.turn + 1, lastAction: "fallback" },
  };
}
