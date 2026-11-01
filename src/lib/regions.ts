/**
 * Data wilayah Indonesia — 38 provinsi, kota-kota dengan koordinat nyata.
 *
 * Dipakai untuk: filter direktori, pencarian chatbot (nama kota, provinsi,
 * dan kelompok pulau), koordinat ustadz, serta perhitungan jarak & kiblat.
 *
 * Koordinat adalah pusat kota (akurat untuk demo); ustadz mendapat offset
 * kecil dari koordinat kota di data.ts.
 */

export interface CityInfo {
  city: string;
  province: string;
  /** Kelompok pulau besar untuk jawaban ringkas chatbot */
  island:
    | "Sumatera"
    | "Jawa"
    | "Bali & Nusa Tenggara"
    | "Kalimantan"
    | "Sulawesi"
    | "Maluku"
    | "Papua";
  lat: number;
  lng: number;
}

export const CITY_INFO: CityInfo[] = [
  // === Sumatera ===
  { city: "Banda Aceh", province: "Aceh", island: "Sumatera", lat: 5.5483, lng: 95.3238 },
  { city: "Lhokseumawe", province: "Aceh", island: "Sumatera", lat: 5.1801, lng: 97.0476 },
  { city: "Medan", province: "Sumatera Utara", island: "Sumatera", lat: 3.5952, lng: 98.6722 },
  { city: "Padang", province: "Sumatera Barat", island: "Sumatera", lat: -0.9471, lng: 100.4172 },
  { city: "Bukittinggi", province: "Sumatera Barat", island: "Sumatera", lat: -0.3046, lng: 100.3692 },
  { city: "Pekanbaru", province: "Riau", island: "Sumatera", lat: 0.5071, lng: 101.4478 },
  { city: "Batam", province: "Kepulauan Riau", island: "Sumatera", lat: 1.1301, lng: 104.0532 },
  { city: "Jambi", province: "Jambi", island: "Sumatera", lat: -1.6101, lng: 103.6131 },
  { city: "Palembang", province: "Sumatera Selatan", island: "Sumatera", lat: -2.9761, lng: 104.7754 },
  { city: "Pangkalpinang", province: "Kepulauan Bangka Belitung", island: "Sumatera", lat: -2.1291, lng: 106.1136 },
  { city: "Bengkulu", province: "Bengkulu", island: "Sumatera", lat: -3.8004, lng: 102.2655 },
  { city: "Bandar Lampung", province: "Lampung", island: "Sumatera", lat: -5.4292, lng: 105.2611 },

  // === Jawa ===
  { city: "Jakarta Selatan", province: "DKI Jakarta", island: "Jawa", lat: -6.2614, lng: 106.8105 },
  { city: "Jakarta Timur", province: "DKI Jakarta", island: "Jawa", lat: -6.225, lng: 106.9 },
  { city: "Tangerang", province: "Banten", island: "Jawa", lat: -6.1783, lng: 106.6319 },
  { city: "Tangerang Selatan", province: "Banten", island: "Jawa", lat: -6.2882, lng: 106.7179 },
  { city: "Serang", province: "Banten", island: "Jawa", lat: -6.1203, lng: 106.1503 },
  { city: "Bandung", province: "Jawa Barat", island: "Jawa", lat: -6.9175, lng: 107.6191 },
  { city: "Bogor", province: "Jawa Barat", island: "Jawa", lat: -6.595, lng: 106.8166 },
  { city: "Depok", province: "Jawa Barat", island: "Jawa", lat: -6.4048, lng: 106.7942 },
  { city: "Bekasi", province: "Jawa Barat", island: "Jawa", lat: -6.2349, lng: 106.9896 },
  { city: "Cirebon", province: "Jawa Barat", island: "Jawa", lat: -6.732, lng: 108.5523 },
  { city: "Semarang", province: "Jawa Tengah", island: "Jawa", lat: -6.9667, lng: 110.4167 },
  { city: "Surakarta", province: "Jawa Tengah", island: "Jawa", lat: -7.5755, lng: 110.8243 },
  { city: "Magelang", province: "Jawa Tengah", island: "Jawa", lat: -7.4797, lng: 110.2177 },
  { city: "Yogyakarta", province: "DI Yogyakarta", island: "Jawa", lat: -7.7956, lng: 110.3695 },
  { city: "Surabaya", province: "Jawa Timur", island: "Jawa", lat: -7.2575, lng: 112.7521 },
  { city: "Malang", province: "Jawa Timur", island: "Jawa", lat: -7.9666, lng: 112.6326 },
  { city: "Kediri", province: "Jawa Timur", island: "Jawa", lat: -7.8169, lng: 112.0114 },

  // === Bali & Nusa Tenggara ===
  { city: "Denpasar", province: "Bali", island: "Bali & Nusa Tenggara", lat: -8.6705, lng: 115.2126 },
  { city: "Mataram", province: "Nusa Tenggara Barat", island: "Bali & Nusa Tenggara", lat: -8.5833, lng: 116.1167 },
  { city: "Bima", province: "Nusa Tenggara Barat", island: "Bali & Nusa Tenggara", lat: -8.4601, lng: 118.7267 },
  { city: "Kupang", province: "Nusa Tenggara Timur", island: "Bali & Nusa Tenggara", lat: -10.1772, lng: 123.5974 },

  // === Kalimantan ===
  { city: "Pontianak", province: "Kalimantan Barat", island: "Kalimantan", lat: -0.0263, lng: 109.3425 },
  { city: "Palangka Raya", province: "Kalimantan Tengah", island: "Kalimantan", lat: -2.2088, lng: 113.9213 },
  { city: "Banjarmasin", province: "Kalimantan Selatan", island: "Kalimantan", lat: -3.3186, lng: 114.5944 },
  { city: "Samarinda", province: "Kalimantan Timur", island: "Kalimantan", lat: -0.5021, lng: 117.1536 },
  { city: "Balikpapan", province: "Kalimantan Timur", island: "Kalimantan", lat: -1.2379, lng: 116.8529 },
  { city: "Tarakan", province: "Kalimantan Utara", island: "Kalimantan", lat: 3.3186, lng: 117.5942 },

  // === Sulawesi ===
  { city: "Makassar", province: "Sulawesi Selatan", island: "Sulawesi", lat: -5.1477, lng: 119.4324 },
  { city: "Parepare", province: "Sulawesi Selatan", island: "Sulawesi", lat: -4.0135, lng: 119.6255 },
  { city: "Palu", province: "Sulawesi Tengah", island: "Sulawesi", lat: -0.9017, lng: 119.8721 },
  { city: "Manado", province: "Sulawesi Utara", island: "Sulawesi", lat: 1.4748, lng: 124.8421 },
  { city: "Gorontalo", province: "Gorontalo", island: "Sulawesi", lat: 0.5435, lng: 123.0567 },
  { city: "Kendari", province: "Sulawesi Tenggara", island: "Sulawesi", lat: -3.9985, lng: 122.5131 },
  { city: "Mamuju", province: "Sulawesi Barat", island: "Sulawesi", lat: -2.6798, lng: 118.8871 },

  // === Maluku ===
  { city: "Ambon", province: "Maluku", island: "Maluku", lat: -3.6954, lng: 128.1814 },
  { city: "Ternate", province: "Maluku Utara", island: "Maluku", lat: 0.7906, lng: 127.3842 },

  // === Papua ===
  { city: "Jayapura", province: "Papua", island: "Papua", lat: -2.5916, lng: 140.669 },
  { city: "Sorong", province: "Papua Barat Daya", island: "Papua", lat: -0.8796, lng: 131.2573 },
  { city: "Manokwari", province: "Papua Barat", island: "Papua", lat: -0.8647, lng: 134.0621 },
  { city: "Timika", province: "Papua Tengah", island: "Papua", lat: -4.0333, lng: 136.8833 },
  { city: "Merauke", province: "Papua Selatan", island: "Papua", lat: -8.4883, lng: 140.3983 },
  { city: "Wamena", province: "Papua Pegunungan", island: "Papua", lat: -3.9486, lng: 138.1074 },
];

/** Daftar provinsi menurut urutan di CITY_INFO */
export const ALL_PROVINCES: string[] = Array.from(
  new Set(CITY_INFO.map((c) => c.province))
);

/** Peta kota -> provinsi */
export const CITY_PROVINCE: Record<string, string> = Object.fromEntries(
  CITY_INFO.map((c) => [c.city, c.province])
);

/** Peta provinsi -> daftar kota */
export const PROVINCE_CITIES: Record<string, string[]> = CITY_INFO.reduce(
  (acc, c) => {
    (acc[c.province] ??= []).push(c.city);
    return acc;
  },
  {} as Record<string, string[]>
);

/** Peta kelompok pulau -> daftar provinsi */
export const ISLAND_PROVINCES: Record<string, string[]> = CITY_INFO.reduce(
  (acc, c) => {
    (acc[c.island] ??= []).includes(c.province) || acc[c.island].push(c.province);
    return acc;
  },
  {} as Record<string, string[]>
);

/**
 * Alias pencarian: kata yang diketik pengguna -> daftar kota.
 * Dipakai chatbot agar "cari ustadz di sumatera" tetap bisa dijawab.
 */
export const REGION_ALIASES: Record<string, string[]> = {
  // kelompok pulau
  sumatera: CITY_INFO.filter((c) => c.island === "Sumatera").map((c) => c.city),
  jawa: CITY_INFO.filter((c) => c.island === "Jawa").map((c) => c.city),
  bali: ["Denpasar", "Mataram", "Bima", "Kupang"],
  "nusa tenggara": ["Mataram", "Bima", "Kupang"],
  kalimantan: CITY_INFO.filter((c) => c.island === "Kalimantan").map((c) => c.city),
  borneo: CITY_INFO.filter((c) => c.island === "Kalimantan").map((c) => c.city),
  sulawesi: CITY_INFO.filter((c) => c.island === "Sulawesi").map((c) => c.city),
  maluku: CITY_INFO.filter((c) => c.island === "Maluku").map((c) => c.city),
  "maluku utara": ["Ternate"],
  papua: CITY_INFO.filter((c) => c.island === "Papua").map((c) => c.city),
  // nama sehari-hari
  jakarta: ["Jakarta Selatan", "Jakarta Timur"],
  jogja: ["Yogyakarta"],
  solo: ["Surakarta"],
  batavia: ["Jakarta Selatan", "Jakarta Timur"],
  // provinsi -> kota (agar "cari ustadz di sulawesi selatan" juga jalan)
  ...Object.fromEntries(
    Object.entries(PROVINCE_CITIES).map(([p, cities]) => [p.toLowerCase(), cities])
  ),
};
