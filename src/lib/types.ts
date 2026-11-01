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

export const ALL_CITIES: string[] = [
  "Jakarta Selatan",
  "Jakarta Timur",
  "Bandung",
  "Bogor",
  "Depok",
  "Tangerang",
  "Bekasi",
  "Surabaya",
  "Yogyakarta",
  "Semarang",
  "Makassar",
];

// Koordinat untuk perhitungan jarak & kiblat (referensi kota)
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Jakarta Selatan": { lat: -6.2614, lng: 106.8105 },
  "Jakarta Timur": { lat: -6.225, lng: 106.9 },
  Bandung: { lat: -6.9175, lng: 107.6191 },
  Bogor: { lat: -6.595, lng: 106.8166 },
  Depok: { lat: -6.4048, lng: 106.7942 },
  Tangerang: { lat: -6.1783, lng: 106.6319 },
  Bekasi: { lat: -6.2349, lng: 106.9896 },
  Surabaya: { lat: -7.2575, lng: 112.7521 },
  Yogyakarta: { lat: -7.7956, lng: 110.3695 },
  Semarang: { lat: -6.9667, lng: 110.4167 },
  Makassar: { lat: -5.1477, lng: 119.4324 },
};

// Koordinat Ka'bah untuk perhitungan arah kiblat
export const KAABA_COORDS = { lat: 21.4225, lng: 39.8262 };
