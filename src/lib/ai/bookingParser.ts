/**
 * Booking Parser — Parse natural language booking requests into structured fields
 * Implements Agent Flow Step 1: Parse & Ekstrak
 */

import { ALL_CITIES } from "@/lib/types";

export interface ParsedBookingRequest {
  eventType?: string;
  day?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  city?: string;
  location?: string;
  audienceSize?: number;
  budget?: number;
  genderPreference?: "ustadz" | "ustadzah" | "any";
  specialization?: string;
  ustadzName?: string;
  rawMessage: string;
  completeness: "complete" | "partial" | "minimal";
  missingFields: string[];
}

const DAYS = [
  { names: ["senin", "monday", "mon"], value: "Senin" },
  { names: ["selasa", "tuesday", "tue"], value: "Selasa" },
  { names: ["rabu", "wednesday", "wed"], value: "Rabu" },
  { names: ["kamis", "thursday", "thu"], value: "Kamis" },
  { names: ["jumat", "friday", "fri"], value: "Jumat" },
  { names: ["sabtu", "saturday", "sat"], value: "Sabtu" },
  { names: ["ahad", "minggu", "sunday", "sun"], value: "Ahad" },
];

const EVENT_TYPES = [
  "kajian",
  "ceramah",
  "pengajian",
  "tabligh",
  "nikah",
  "aqiqah",
  "seminar",
  "workshop",
  "mentoring",
  "halal bihalal",
];

const TIME_PATTERN = /(\d{1,2})[:.\-](\d{2})?\s*(?:wib|jam)?|jam\s+(\d{1,2})(?:[:.\-](\d{2}))?/i;

export function parseBookingRequest(message: string): ParsedBookingRequest {
  const msg = message.toLowerCase().trim();
  const missingFields: string[] = [];

  // Extract day
  let day: string | undefined;
  for (const d of DAYS) {
    if (d.names.some((n) => msg.includes(n))) {
      day = d.value;
      break;
    }
  }

  // Extract time
  let startTime: string | undefined;
  let endTime: string | undefined;
  const timeMatch = msg.match(TIME_PATTERN);
  if (timeMatch) {
    const hour = timeMatch[1] || timeMatch[3];
    const minute = timeMatch[2] || timeMatch[4] || "00";
    startTime = `${hour.padStart(2, "0")}:${minute}`;

    // Look for end time pattern "19:00-21:00" or "sampai 21"
    const rangeMatch = msg.match(/(\d{1,2})[:.\-](\d{2})?\s*(?:-|sampai|until)\s*(\d{1,2})[:.\-]?(\d{2})?/i);
    if (rangeMatch) {
      const endHour = rangeMatch[3];
      const endMin = rangeMatch[4] || "00";
      endTime = `${endHour.padStart(2, "0")}:${endMin}`;
    } else {
      // Default 2 hour duration
      const endH = (parseInt(hour) + 2) % 24;
      endTime = `${endH.toString().padStart(2, "0")}:${minute}`;
    }
  }

  // Extract event type
  let eventType: string | undefined;
  for (const et of EVENT_TYPES) {
    if (msg.includes(et)) {
      eventType = et.charAt(0).toUpperCase() + et.slice(1);
      break;
    }
  }

  // Extract city — dari seluruh kota yang terdaftar di regions.ts
  // (cari kunci terpanjang dulu agar "tangerang selatan" menang atas
  // "tangerang").
  let city: string | undefined;
  const cityKeywords = [...ALL_CITIES]
    .map((c) => ({
      full: c,
      short: c.replace(/\s*\(.*\)$/, "").toLowerCase(),
    }))
    .sort((a, b) => b.short.length - a.short.length);
  for (const { full, short } of cityKeywords) {
    if (msg.includes(short)) {
      city = full;
      break;
    }
  }

  // Extract audience size
  let audienceSize: number | undefined;
  const audienceMatch = msg.match(/(\d+)\s*(?:orang|peserta|jamaah|audience)/i);
  if (audienceMatch) {
    audienceSize = parseInt(audienceMatch[1]);
  }

  // Extract budget
  let budget: number | undefined;
  const budgetMatch = msg.match(/(?:rp\.?\s*|rp\s*)(\d+(?:\.\d{3})*)/i);
  if (budgetMatch) {
    budget = parseInt(budgetMatch[1].replace(/\./g, ""));
  }

  // Gender preference
  let genderPreference: "ustadz" | "ustadzah" | "any" = "any";
  if (msg.includes("ustadzah") || msg.includes("perempuan") || msg.includes("muslimah") || msg.includes("wanita")) {
    genderPreference = "ustadzah";
  } else if (msg.includes("ustadz ") || msg.includes("ustadz pria") || msg.includes("laki-laki")) {
    genderPreference = "ustadz";
  }

  // Extract location (masjid/kantor name)
  let location: string | undefined;
  const locMatch = msg.match(/(?:di|di\s+(?:masjid|kantor|gedung))\s+([a-z][a-z\s]+?)(?:,|\.|\sdengan|\sjam|\suntuk|\spada|$)/i);
  if (locMatch) {
    location = locMatch[1].trim();
    // Rapikan kapitalisasi: "bandung" -> "Bandung"
    const canonicalCity = ALL_CITIES.find(
      (c) => c.replace(/\s*\(.*\)$/, "").toLowerCase() === location!.toLowerCase()
    );
    location = canonicalCity
      ? canonicalCity
      : location
          .split(" ")
          .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
          .join(" ");
  }

  // Extract specialization
  const specializations = [
    "fiqih", "aqidah", "tafsir", "hadith", "tasawuf",
    "muamalah", "siroh", "tahfiz", "khutbah", "parenting",
  ];
  let specialization: string | undefined;
  for (const s of specializations) {
    if (msg.includes(s)) {
      specialization = s.charAt(0).toUpperCase() + s.slice(1);
      break;
    }
  }

  // Determine completeness
  if (!eventType) missingFields.push("jenis acara");
  if (!day && !msg.includes("tanggal") && !msg.includes("bulan")) missingFields.push("hari/tanggal");
  if (!startTime) missingFields.push("waktu");
  if (!city && !location) missingFields.push("lokasi");

  let completeness: "complete" | "partial" | "minimal";
  if (missingFields.length === 0) completeness = "complete";
  else if (missingFields.length <= 2) completeness = "partial";
  else completeness = "minimal";

  return {
    eventType,
    day,
    startTime,
    endTime,
    city,
    location,
    audienceSize,
    budget,
    genderPreference,
    specialization,
    rawMessage: message,
    completeness,
    missingFields,
  };
}

/** Format parsed request into a readable plan for user confirmation */
export function formatBookingPlan(parsed: ParsedBookingRequest, ustadzName?: string): string {
  const lines: string[] = [];

  lines.push("📋 RENCANA BOOKING");
  lines.push("━━━━━━━━━━━━━━━━━━━━━");
  if (ustadzName) lines.push(`Ustadz: ${ustadzName}`);
  if (parsed.eventType) lines.push(`Jenis Acara: ${parsed.eventType}`);
  if (parsed.day) lines.push(`Hari: ${parsed.day}`);
  if (parsed.startTime) lines.push(`Waktu: ${parsed.startTime}${parsed.endTime ? ` - ${parsed.endTime}` : " WIB"}`);
  if (parsed.location) lines.push(`Lokasi: ${parsed.location}`);
  if (parsed.city) lines.push(`Kota: ${parsed.city}`);
  if (parsed.audienceSize) lines.push(`Audience: ${parsed.audienceSize} orang`);
  if (parsed.specialization) lines.push(`Spesialisasi: ${parsed.specialization}`);
  if (parsed.genderPreference !== "any") lines.push(`Preferensi: ${parsed.genderPreference}`);
  lines.push("━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");
  lines.push("Apakah Anda menyetujui rencana booking ini?");
  lines.push("Ketik 'setuju' untuk konfirmasi atau 'batal' untuk membatalkan.");

  return lines.join("\n");
}
