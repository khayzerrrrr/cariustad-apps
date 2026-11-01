export type Specialization =
  | "Tafsir Al-Qur'an"
  | "Fiqih"
  | "Aqidah"
  | "Ceramah & Tausiyah"
  | "Nikah & Keluarga"
  | "Parenting Islami"
  | "Muamalah & Ekonomi Syariah"
  | "Tahsin & Tahfidz"
  | "Fiqih Wanita"
  | "Tasawuf & Akhlak";

export type EventType =
  | "Kajian Rutin"
  | "Tabligh Akbar"
  | "Ceramah Keluarga / Arisan"
  | "Wirid Ibu-ibu"
  | "Khutbah Jumat"
  | "Ceramah 7 Bulanan"
  | "Pengajian Anak"
  | "Kajian Korporat"
  | "Konseling"
  | "Tahsin / Tahfidz";

export interface ScheduleSlot {
  time: string; // "08:00 - 10:00"
  booked: boolean;
}

export interface DaySchedule {
  day: string; // "Senin"
  slots: ScheduleSlot[];
}

export interface UstadzContact {
  phone: string;
  whatsapp: string;
}

export interface Ustadz {
  id: string;
  name: string;
  title: string; // "Ustadz", "Ustadzah", "KH."
  credentials: string; // "Lc.", "M.Pd", "S.Ag"
  specializations: Specialization[];
  eventTypes: EventType[];
  city: string;
  province: string;
  area: string;
  bio: string;
  rating: number;
  reviewCount: number;
  experience: number; // years
  fee: number; // Rp
  almaMater: string;
  contact: UstadzContact;
  lat: number;
  lng: number;
  available: boolean;
  verified: boolean;
  gender: "L" | "P";
  avatarGradient: string; // tailwind gradient classes
  schedule: DaySchedule[];
}

export interface Review {
  id: string;
  ustadzId: string;
  authorName: string;
  rating: number; // 1-5
  comment: string;
  date: string; // ISO date
  event: string; // "Kajian rutin", "Ceramah 7 bulanan", etc.
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ustadz";
  text: string;
  time: string;
}

export interface Conversation {
  ustadzId: string;
  messages: ChatMessage[];
}

export interface EventLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface Booking {
  id: string;
  ustadzId: string;
  ustadzName: string;
  day: string;
  time: string;
  eventName: string;
  location: string;
  eventLocation?: EventLocation;
  audience: string;
  notes: string;
  status: "pending" | "confirmed" | "completed";
  createdAt: string;
}

export interface Kajian {
  id: string;
  title: string;
  ustadzId: string;
  date: string; // ISO date
  time: string;
  location: string;
  city: string;
  topic: Specialization;
  eventType: EventType;
  price: "Gratis" | "Berbayar";
  fee?: number;
  description: string;
}

export interface Hadith {
  id: number;
  source: string; // "Shahih Bukhari No. 1"
  narrator: string; // "Umar bin Khattab radhiyallahu'anhu"
  arabic?: string;
  translation: string;
  grade: string; // "Shahih"
}

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
}

export const ALL_SPECIALIZATIONS: Specialization[] = [
  "Tafsir Al-Qur'an",
  "Fiqih",
  "Aqidah",
  "Ceramah & Tausiyah",
  "Nikah & Keluarga",
  "Parenting Islami",
  "Muamalah & Ekonomi Syariah",
  "Tahsin & Tahfidz",
  "Fiqih Wanita",
  "Tasawuf & Akhlak",
];

export const ALL_EVENT_TYPES: EventType[] = [
  "Kajian Rutin",
  "Tabligh Akbar",
  "Ceramah Keluarga / Arisan",
  "Wirid Ibu-ibu",
  "Khutbah Jumat",
  "Ceramah 7 Bulanan",
  "Pengajian Anak",
  "Kajian Korporat",
  "Konseling",
  "Tahsin / Tahfidz",
];

import { CITY_INFO, ALL_PROVINCES } from "./regions";

export { ALL_PROVINCES };

// Daftar kota & koordinat diturunkan dari data wilayah (src/lib/regions.ts)
export const ALL_CITIES: string[] = CITY_INFO.map((c) => c.city);

// Koordinat untuk perhitungan jarak & kiblat (referensi kota)
export const CITY_COORDS: Record<string, { lat: number; lng: number }> =
  Object.fromEntries(CITY_INFO.map((c) => [c.city, { lat: c.lat, lng: c.lng }]));

// Koordinat Ka'bah untuk perhitungan arah kiblat
export const KAABA_COORDS = { lat: 21.4225, lng: 39.8262 };
