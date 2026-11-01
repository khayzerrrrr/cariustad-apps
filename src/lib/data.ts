import {
  Ustadz,
  Review,
  Kajian,
  Hadith,
  Specialization,
  EventType,
} from "./types";
import { CITY_COORDS } from "./types";
import { CITY_PROVINCE } from "./regions";

const defaultSchedule = (variation: number) => {
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const allSlots = [
    "08:00 - 10:00",
    "13:00 - 15:00",
    "16:00 - 18:00",
    "19:00 - 21:00",
  ];
  return days.map((day, di) => ({
    day,
    slots: allSlots.map((time, si) => ({
      time,
      booked: (di + si + variation) % 3 === 0,
    })),
  }));
};

// helper untuk koordinat ustadz dari kota + offset area
const coord = (city: string, dLat: number, dLng: number) => {
  const c = CITY_COORDS[city];
  return { lat: c.lat + dLat, lng: c.lng + dLng };
};

// 12 profil awal (u1-u12) + jaringan nasional yang dibangkitkan di bawah
const baseUstadzRaw: Omit<Ustadz, "province">[] = [
  {
    id: "u1",
    name: "Ahmad Zaki",
    title: "Ustadz",
    credentials: "M.Pd",
    specializations: ["Tafsir Al-Qur'an", "Aqidah"],
    eventTypes: ["Kajian Rutin", "Khutbah Jumat", "Kajian Korporat", "Ceramah 7 Bulanan"],
    city: "Jakarta Selatan",
    area: "Kebayoran Baru",
    bio: "Pengajar Tafsir sejak 2012, lulusan Universitas Al-Azhar Kairo. Aktif mengisi kajian pekanan di masjid-masjid Jakarta. Fokus pada pendalaman makna Al-Qur'an dengan pendekatan kontekstual.",
    rating: 4.9,
    reviewCount: 128,
    experience: 12,
    fee: 1500000,
    almaMater: "Universitas Al-Azhar, Kairo",
    contact: { phone: "0812-3456-7890", whatsapp: "6281234567890" },
    ...coord("Jakarta Selatan", 0.012, -0.008),
    available: true,
    verified: true,
    gender: "L",
    avatarGradient: "from-emerald-500 to-teal-600",
    schedule: defaultSchedule(1),
  },
  {
    id: "u2",
    name: "Fatimah Az-Zahra",
    title: "Ustadzah",
    credentials: "S.Pd.I",
    specializations: ["Fiqih Wanita", "Parenting Islami"],
    eventTypes: ["Wirid Ibu-ibu", "Kajian Rutin", "Konseling", "Pengajian Anak"],
    city: "Bandung",
    area: "Coblong",
    bio: "Konselor keluarga Muslim dan pendiri majelis Taklim Fatimah Az-Zahra. Berpengalaman membimbing muslimah dalam fiqih khusus wanita serta parenting berbasis nilai Islam.",
    rating: 4.8,
    reviewCount: 96,
    experience: 9,
    fee: 1000000,
    almaMater: "UIN Sunan Gunung Djati, Bandung",
    contact: { phone: "0813-2222-3344", whatsapp: "6281322223344" },
    ...coord("Bandung", -0.015, 0.01),
    available: true,
    verified: true,
    gender: "P",
    avatarGradient: "from-rose-500 to-pink-600",
    schedule: defaultSchedule(2),
  },
  {
    id: "u3",
    name: "Abdullah Hakim",
    title: "KH.",
    credentials: "Lc.",
    specializations: ["Aqidah", "Tafsir Al-Qur'an", "Tasawuf & Akhlak"],
    eventTypes: ["Tabligh Akbar", "Khutbah Jumat", "Kajian Rutin"],
    city: "Depok",
    area: "Beji",
    bio: "Pimpinan Pondok Pesantren Al-Hikmah. Lulusan Universitas Islam Madinah. Mengajar aqidah dan tasawuf dengan metodologi yang mudah dipahami kalangan muda maupun dewasa.",
    rating: 5.0,
    reviewCount: 203,
    experience: 20,
    fee: 2500000,
    almaMater: "Universitas Islam Madinah",
    contact: { phone: "0811-9999-0001", whatsapp: "6281199990001" },
    ...coord("Depok", 0.02, -0.012),
    available: true,
    verified: true,
    gender: "L",
    avatarGradient: "from-teal-600 to-cyan-700",
    schedule: defaultSchedule(3),
  },
  {
    id: "u4",
    name: "Muhammad Ridwan",
    title: "Ustadz",
    credentials: "S.Ag",
    specializations: ["Ceramah & Tausiyah", "Tasawuf & Akhlak"],
    eventTypes: ["Ceramah Keluarga / Arisan", "Ceramah 7 Bulanan", "Kajian Korporat", "Tabligh Akbar"],
    city: "Bekasi",
    area: "Bekasi Barat",
    bio: "Da'i aktif yang sering mengisi pengajian rutin dan acara keagamaan korporat. Gaya ceramahnya interaktif dan relevan dengan kehidupan modern.",
    rating: 4.7,
    reviewCount: 74,
    experience: 7,
    fee: 1200000,
    almaMater: "UIN Syarif Hidayatullah, Jakarta",
    contact: { phone: "0856-7777-8888", whatsapp: "6285677778888" },
    ...coord("Bekasi", -0.01, 0.015),
    available: true,
    verified: true,
    gender: "L",
    avatarGradient: "from-indigo-500 to-blue-600",
    schedule: defaultSchedule(4),
  },
  {
    id: "u5",
    name: "Khadijah Nur",
    title: "Ustadzah",
    credentials: "M.A",
    specializations: ["Nikah & Keluarga", "Fiqih Wanita", "Parenting Islami"],
    eventTypes: ["Konseling", "Wirid Ibu-ibu", "Ceramah Keluarga / Arisan"],
    city: "Jakarta Timur",
    area: "Jatinegara",
    bio: "Konselor pra-nikah bersertifikat. Membantu pasangan muslim mempersiapkan rumah tangga sakinah melalui kajian fiqih keluarga dan cinta Islami.",
    rating: 4.9,
    reviewCount: 151,
    experience: 11,
    fee: 1800000,
    almaMater: "UIN Syarif Hidayatullah, Jakarta",
    contact: { phone: "0857-5555-6666", whatsapp: "6285755556666" },
    ...coord("Jakarta Timur", 0.008, 0.018),
    available: false,
    verified: true,
    gender: "P",
    avatarGradient: "from-purple-500 to-fuchsia-600",
    schedule: defaultSchedule(5),
  },
  {
    id: "u6",
    name: "Yusuf Ramadhan",
    title: "Ustadz",
    credentials: "S.Pd",
    specializations: ["Muamalah & Ekonomi Syariah", "Fiqih"],
    eventTypes: ["Kajian Korporat", "Kajian Rutin", "Khutbah Jumat"],
    city: "Tangerang",
    area: "Tangerang Selatan",
    bio: "Praktisi ekonomi syariah sekaligus ustadz. Konsultan keuangan syariah untuk lembaga zakat dan koperasi. Mengajar fiqih muamalah dengan studi kasus praktis.",
    rating: 4.6,
    reviewCount: 58,
    experience: 8,
    fee: 1400000,
    almaMater: "Institut Agama Islam Tazkia, Bogor",
    contact: { phone: "0821-4444-5555", whatsapp: "6282144445555" },
    ...coord("Tangerang", 0.014, -0.006),
    available: true,
    verified: true,
    gender: "L",
    avatarGradient: "from-amber-500 to-orange-600",
    schedule: defaultSchedule(6),
  },
  {
    id: "u7",
    name: "Ibrahim Hakim",
    title: "Ustadz",
    credentials: "Lc.",
    specializations: ["Fiqih", "Aqidah"],
    eventTypes: ["Khutbah Jumat", "Kajian Rutin", "Tabligh Akbar"],
    city: "Bogor",
    area: "Bogor Tengah",
    bio: "Lulusan Universitas Ummul Qura Mekkah. Spesialis fiqih ibadah dan muamalah. Pengasuh rubrik tanya jawab fiqih di majelis online.",
    rating: 4.8,
    reviewCount: 112,
    experience: 15,
    fee: 2000000,
    almaMater: "Universitas Ummul Qura, Mekkah",
    contact: { phone: "0812-8888-9900", whatsapp: "6281288889900" },
    ...coord("Bogor", -0.011, 0.009),
    available: true,
    verified: true,
    gender: "L",
    avatarGradient: "from-green-600 to-emerald-700",
    schedule: defaultSchedule(7),
  },
  {
    id: "u8",
    name: "Aisyah Salsabila",
    title: "Ustadzah",
    credentials: "Hafidzah",
    specializations: ["Tahsin & Tahfidz"],
    eventTypes: ["Tahsin / Tahfidz", "Pengajian Anak", "Wirid Ibu-ibu"],
    city: "Bandung",
    area: "Bandung Wetan",
    bio: "Hafidzah 30 juz, pembimbing tahfidz untuk anak dan dewasa. Pendiri Markaz Tahfidz Aisyah. Metode pembelajaran menyenangkan dengan target hafalan realistis.",
    rating: 4.9,
    reviewCount: 87,
    experience: 10,
    fee: 900000,
    almaMater: "Ma'had Tahfidz Al-Qur'an, Bandung",
    contact: { phone: "0896-1111-2222", whatsapp: "6289611112222" },
    ...coord("Bandung", 0.016, -0.013),
    available: true,
    verified: true,
    gender: "P",
    avatarGradient: "from-cyan-500 to-sky-600",
    schedule: defaultSchedule(8),
  },
  {
    id: "u9",
    name: "Abdul Rahman",
    title: "Ustadz",
    credentials: "M.A",
    specializations: ["Tasawuf & Akhlak", "Ceramah & Tausiyah"],
    eventTypes: ["Kajian Rutin", "Ceramah 7 Bulanan", "Tabligh Akbar"],
    city: "Surabaya",
    area: "Gubeng",
    bio: "Dosen tetap dan pembina majelis dzikir. Fokus pada pembinaan akhlak dan tasawuf praktis untuk menyehatkan hati di tengah kesibukan dunia kerja.",
    rating: 4.7,
    reviewCount: 65,
    experience: 13,
    fee: 1300000,
    almaMater: "UIN Sunan Ampel, Surabaya",
    contact: { phone: "0852-3333-4444", whatsapp: "6285233334444" },
    ...coord("Surabaya", 0.009, -0.014),
    available: true,
    verified: true,
    gender: "L",
    avatarGradient: "from-slate-600 to-gray-700",
    schedule: defaultSchedule(9),
  },
  {
    id: "u10",
    name: "Hasan Mubarak",
    title: "Ustadz",
    credentials: "S.Ag",
    specializations: ["Tafsir Al-Qur'an", "Fiqih"],
    eventTypes: ["Kajian Rutin", "Khutbah Jumat", "Pengajian Anak"],
    city: "Yogyakarta",
    area: "Gondokusuman",
    bio: "Pengajar Tafsir dan fiqih di kota pelajar. Menyukai pendekatan tafsir tematis yang menjawab isu kontemporer. Aktif menulis di media dakwah.",
    rating: 4.8,
    reviewCount: 81,
    experience: 9,
    fee: 1100000,
    almaMater: "UIN Sunan Kalijaga, Yogyakarta",
    contact: { phone: "0878-6666-7777", whatsapp: "6287866667777" },
    ...coord("Yogyakarta", -0.013, 0.011),
    available: true,
    verified: true,
    gender: "L",
    avatarGradient: "from-emerald-600 to-green-700",
    schedule: defaultSchedule(10),
  },
  {
    id: "u11",
    name: "Maryam Hidayah",
    title: "Ustadzah",
    credentials: "S.Psi",
    specializations: ["Parenting Islami", "Nikah & Keluarga"],
    eventTypes: ["Konseling", "Wirid Ibu-ibu", "Pengajian Anak", "Ceramah Keluarga / Arisan"],
    city: "Semarang",
    area: "Semarang Tengah",
    bio: "Psikolog Islam yang memadukan ilmu psikologi perkembangan dengan nilai-nilai Qur'ani. Konsultan parenting untuk sekolah Islam dan komunitas muslimah.",
    rating: 4.9,
    reviewCount: 73,
    experience: 8,
    fee: 1250000,
    almaMater: "Universitas Negeri Semarang",
    contact: { phone: "0838-9999-1010", whatsapp: "6283899991010" },
    ...coord("Semarang", 0.012, 0.007),
    available: true,
    verified: true,
    gender: "P",
    avatarGradient: "from-pink-500 to-rose-600",
    schedule: defaultSchedule(11),
  },
  {
    id: "u12",
    name: "Omar Faruq",
    title: "Ustadz",
    credentials: "Lc.",
    specializations: ["Aqidah", "Tafsir Al-Qur'an"],
    eventTypes: ["Tabligh Akbar", "Kajian Rutin", "Khutbah Jumat"],
    city: "Makassar",
    area: "Mariso",
    bio: "Lulusan Universitas Al-Azhar. Mengajar aqidah dengan pendekatan rasional yang menjawab keraguan kalangan intelektual dan mahasiswa.",
    rating: 4.7,
    reviewCount: 49,
    experience: 14,
    fee: 1350000,
    almaMater: "Universitas Al-Azhar, Kairo",
    contact: { phone: "0813-5656-7878", whatsapp: "6281356567878" },
    ...coord("Makassar", -0.009, 0.016),
    available: true,
    verified: true,
    gender: "L",
    avatarGradient: "from-teal-500 to-emerald-700",
    schedule: defaultSchedule(12),
  },
];

/* =====================================================================
 * JARINGAN NASIONAL
 *
 * 472 profil tambahan dibangkitkan secara deterministik (tanpa Math.random)
 * agar hasil build selalu identik. Nama, kecamatan, institusi, dan kampus
 * memakai kosakata nyata per wilayah supaya profil terasa hidup, bukan
 * template kosong.
 *
 * Hasil akhir: 484 ustadz & ustadzah — 319 laki-laki, 165 perempuan —
 * tersebar di 54 kota, 38 provinsi, seluruh pulau besar Indonesia.
 * ===================================================================== */

/** Jumlah profil baru per kota: [laki-laki, perempuan] */
const CITY_QUOTA: Record<string, [number, number]> = {
  "Jakarta Selatan": [19, 14],
  "Jakarta Timur": [14, 7],
  Tangerang: [9, 4],
  "Tangerang Selatan": [4, 3],
  Depok: [9, 4],
  Bekasi: [9, 4],
  Bogor: [8, 3],
  Serang: [4, 2],
  Bandung: [18, 16],
  Cirebon: [4, 2],
  Surabaya: [15, 6],
  Yogyakarta: [11, 8],
  Semarang: [9, 4],
  Surakarta: [7, 3],
  Magelang: [3, 2],
  Malang: [7, 3],
  Kediri: [4, 3],
  "Banda Aceh": [4, 2],
  Lhokseumawe: [2, 1],
  Medan: [10, 6],
  Padang: [8, 2],
  Bukittinggi: [6, 2],
  Pekanbaru: [6, 2],
  Batam: [6, 2],
  Jambi: [3, 1],
  Palembang: [9, 3],
  Pangkalpinang: [3, 1],
  Bengkulu: [3, 1],
  "Bandar Lampung": [5, 3],
  Denpasar: [4, 3],
  Mataram: [4, 3],
  Bima: [2, 1],
  Kupang: [2, 1],
  Pontianak: [5, 3],
  "Palangka Raya": [4, 2],
  Banjarmasin: [9, 6],
  Samarinda: [4, 2],
  Balikpapan: [3, 2],
  Tarakan: [2, 1],
  Makassar: [10, 5],
  Parepare: [3, 2],
  Palu: [4, 2],
  Manado: [4, 2],
  Gorontalo: [3, 2],
  Kendari: [3, 1],
  Mamuju: [2, 1],
  Ambon: [3, 1],
  Ternate: [3, 1],
  Jayapura: [3, 2],
  Sorong: [3, 1],
  Manokwari: [3, 1],
  Timika: [3, 1],
  Merauke: [3, 1],
  Wamena: [2, 0],
};

/** Kecamatan nyata per kota (dipakai sebagai area domisili) */
const CITY_AREAS: Record<string, string[]> = {
  "Jakarta Selatan": ["Tebet", "Cipete", "Pasar Minggu", "Kebayoran Lama", "Jagakarsa"],
  "Jakarta Timur": ["Duren Sawit", "Cipayung", "Pasar Rebo", "Cakung", "Makasar"],
  Tangerang: ["Cibodas", "Karawaci", "Ciledug", "Pinang"],
  "Tangerang Selatan": ["Serpong", "Pamulang", "Ciputat"],
  Depok: ["Sawangan", "Cimanggis", "Limo", "Cilodong"],
  Bekasi: ["Bekasi Timur", "Jatiasih", "Mustika Jaya", "Bekasi Selatan"],
  Bogor: ["Bogor Utara", "Tanah Sareal", "Bogor Timur"],
  Serang: ["Serang Kota", "Kasemen", "Taktakan"],
  Bandung: ["Buahbatu", "Antapani", "Cibiru", "Arcamanik", "Cicendo", "Lengkong"],
  Cirebon: ["Kesenden", "Kejaksan", "Harjamukti"],
  Surabaya: ["Rungkut", "Sukolilo", "Wonokromo", "Karang Pilang", "Wiyung"],
  Yogyakarta: ["Umbulharjo", "Kotagede", "Mergangsan", "Gondomanan"],
  Semarang: ["Banyumanik", "Tembalang", "Pedurungan", "Semarang Selatan"],
  Surakarta: ["Laweyan", "Banjarsari", "Jebres"],
  Magelang: ["Magelang Tengah", "Potrobangsan"],
  Malang: ["Klojen", "Lowokwaru", "Kedungkandang"],
  Kediri: ["Mojoroto", "Kota Kediri"],
  "Banda Aceh": ["Kuta Alam", "Baiturrahman", "Lueng Bata"],
  Lhokseumawe: ["Banda Sakti", "Cunda"],
  Medan: ["Medan Baru", "Medan Tembung", "Marelan", "Medan Kota"],
  Padang: ["Kuranji", "Padang Timur", "Nanggalo"],
  Bukittinggi: ["Guguk Panjang", "Mandiangin Koto Selayan"],
  Pekanbaru: ["Sail", "Marpoyan Damai", "Sukajadi"],
  Batam: ["Batam Kota", "Sekupang", "Nongsa"],
  Jambi: ["Pasir Jaya", "Telanaipura", "Jelutung"],
  Palembang: ["Ilir Barat I", "Kalidoni", "Sukarami", "Bukit Kecil"],
  Pangkalpinang: ["Taman Sari", "Girimaya"],
  Bengkulu: ["Teluk Segara", "Muara Bangka Hulu"],
  "Bandar Lampung": ["Kedaton", "Rajabasa", "Sukarame"],
  Denpasar: ["Denpasar Selatan", "Denpasar Barat"],
  Mataram: ["Selaparang", "Cakranegara", "Ampenan"],
  Bima: ["Rasanae Barat", "Asakota"],
  Kupang: ["Kelapa Lima", "Oebobo"],
  Pontianak: ["Pontianak Kota", "Pontianak Timur", "Siantan"],
  "Palangka Raya": ["Jekan Raya", "Rakumpit"],
  Banjarmasin: ["Banjarmasin Tengah", "Banjarmasin Timur", "Cempaka"],
  Samarinda: ["Samarinda Ilir", "Samarinda Ulu", "Samarinda Kota"],
  Balikpapan: ["Balikpapan Kota", "Balikpapan Barat"],
  Tarakan: ["Tarakan Tengah", "Tarakan Timur"],
  Makassar: ["Rappocini", "Ujung Tanah", "Tamalate", "Wajo"],
  Parepare: ["Bacukiki", "Soreang"],
  Palu: ["Palu Timur", "Palu Selatan", "Tatanga"],
  Manado: ["Wenang", "Tuminting", "Sario"],
  Gorontalo: ["Kota Selatan", "Kota Tengah", "Kota Utara"],
  Kendari: ["Kendari Barat", "Poasia", "Mandonga"],
  Mamuju: ["Simboro", "Mamuju"],
  Ambon: ["Sirimau", "Nusaniwe"],
  Ternate: ["Ternate Tengah", "Foramadiahi"],
  Jayapura: ["Jayapura Utara", "Abepura", "Muara Tami"],
  Sorong: ["Sorong Kota", "Sorong Timur"],
  Manokwari: ["Manokwari Barat", "Manokwari Timur"],
  Timika: ["Mimika Baru", "Kuala Kencana"],
  Merauke: ["Merauke Kota", "Maro"],
  Wamena: ["Walesi", "Wouma"],
};

/** Tempat ikonik per kota untuk memperkaya bio (masjid, pesantren, komunitas) */
const CITY_SPOTS: Record<string, string[]> = {
  "Jakarta Selatan": ["Masjid Agung Al-Azhar", "komunitas profesional Kuningan"],
  "Jakarta Timur": ["Masjid At-Tin", "asrama mahasiswa Cipinang"],
  Tangerang: ["Masjid Agung Tangerang", "komunitas pabrik Cikokol"],
  "Tangerang Selatan": ["kampus-kampus Serpong", "majelis muslimah Pamulang"],
  Depok: ["Masjid Dian Al-Mahri", "komunitas mahasiswa Depok"],
  Bekasi: ["Masjid Agung Bekasi", "komunitas pemuda Harapan Indah"],
  Bogor: ["Masjid Agung Bogor", "komunitas Cibinong"],
  Serang: ["Masjid Agung Serang", "komunitas pesisir Banten"],
  Bandung: ["Masjid Raya Bandung", "Masjid Salman ITB", "komunitas profesional Dago"],
  Cirebon: ["Masjid Agung Sang Cipta Rasa", "komunitas batik Trusmi"],
  Surabaya: ["Masjid Al-Akbar Surabaya", "komunitas pelabuhan Tanjung Perak"],
  Yogyakarta: ["Masjid Gede Kauman", "komunitas mahasiswa UIN dan UGM"],
  Semarang: ["Masjid Agung Jawa Tengah", "komunitas pelajar Tembalang"],
  Surakarta: ["Masjid Agung Surakarta", "komunitas batik Laweyan"],
  Magelang: ["Masjid Agung Magelang", "komunitas pondok sekitar Borobudur"],
  Malang: ["Masjid Agung Malang", "komunitas mahasiswa Malang"],
  Kediri: ["Masjid Agung Kediri", "alumni pesantren Lirboyo"],
  "Banda Aceh": ["Masjid Raya Baiturrahman", "dayah-dayah Banda Aceh"],
  Lhokseumawe: ["Masjid Agung Lhokseumawe", "komunitas pesisir Lhokseumawe"],
  Medan: ["Masjid Raya Al-Mashun", "komunitas Belawan"],
  Padang: ["Masjid Raya Sumatera Barat", "komunitas Minang merantau"],
  Bukittinggi: ["Masjid Jamik Bukittinggi", "tradisi surau di Bukittinggi"],
  Pekanbaru: ["Masjid Raya An-Nur", "komunitas pengusaha Pekanbaru"],
  Batam: ["Masjid Raya Batam", "komunitas pekerja industri Batam"],
  Jambi: ["Masjid Agung Al-Falah", "komunitas Jelutung"],
  Palembang: ["Masjid Agung Sultan Mahmud Badaruddin I", "komunitas Musi"],
  Pangkalpinang: ["Masjid Agung Pangkalpinang", "komunitas timah Bangka"],
  Bengkulu: ["Masjid Jamik Bengkulu", "komunitas pesisir Bengkulu"],
  "Bandar Lampung": ["Masjid Agung Bandar Lampung", "komunitas transmigran Lampung"],
  Denpasar: ["Masjid Agung Denpasar", "komunitas muslim Denpasar"],
  Mataram: ["Masjid Agung Nahdlatul Wathan", "komunitas Lombok"],
  Bima: ["Masjid Agung Bima", "komunitas pesisir Bima"],
  Kupang: ["Masjid Agung Kupang", "komunitas muslim Kupang"],
  Pontianak: ["Masjid Abdurrahman Al-Kadrie", "komunitas Melayu Pontianak"],
  "Palangka Raya": ["masjid induk Palangka Raya", "komunitas dayak muslim"],
  Banjarmasin: ["Masjid Sabilal Muhtadin", "komunitas wadah Banjarmasin"],
  Samarinda: ["Masjid Islamic Center Samarinda", "komunitas mahalap Samarinda"],
  Balikpapan: ["Masjid Agung Balikpapan", "komunitas migas Balikpapan"],
  Tarakan: ["Masjid Agung Tarakan", "komunitas pesisir Tarakan"],
  Makassar: ["Masjid Raya Makassar", "komunitas kampus Makassar"],
  Parepare: ["Masjid Agung Parepare", "komunitas pelaut Parepare"],
  Palu: ["Masjid Agung Palu", "komunitas pemulihan Palu"],
  Manado: ["Masjid Agung Manado", "komunitas muslim Minahasa"],
  Gorontalo: ["Masjid Agung Gorontalo", "komunitas sandiq Gorontalo"],
  Kendari: ["Masjid Agung Kendari", "komunitas nelayan Kendari"],
  Mamuju: ["Masjid Agung Mamuju", "komunitas Sulbar"],
  Ambon: ["Masjid Agung Ambon", "komunitas interfaith Ambon"],
  Ternate: ["Masjid Sultan Ternate", "komunitas kesultanan Ternate"],
  Jayapura: ["masjid induk Jayapura", "komunitas muslim Jayapura"],
  Sorong: ["Masjid Agung Sorong", "komunitas migas Sorong"],
  Manokwari: ["Masjid Agung Manokwari", "komunitas pegunungan Arfak"],
  Timika: ["masjid jemaah Timika", "komunitas pekerja tambang Mimika"],
  Merauke: ["masjid raya Merauke", "komunitas transmigran Merauke"],
  Wamena: ["jemaah muslim pegunungan Papua", "komunitas pelajar Wamena"],
};

/** Kampus / lembaga pendidikan asal per kota */
const CITY_ALMA: Record<string, string[]> = {
  "Jakarta Selatan": ["UIN Syarif Hidayatullah, Jakarta", "LIPIA, Jakarta", "Universitas Al-Azhar, Kairo"],
  "Jakarta Timur": ["UIN Syarif Hidayatullah, Jakarta", "LIPIA, Jakarta"],
  Tangerang: ["UIN Sultan Maulana Hasanuddin, Banten"],
  "Tangerang Selatan": ["UIN Sultan Maulana Hasanuddin, Banten", "Universitas Islam Madinah"],
  Depok: ["UIN Syarif Hidayatullah, Jakarta"],
  Bekasi: ["UIN Syarif Hidayatullah, Jakarta", "Universitas Islam Madinah"],
  Bogor: ["UIN Syarif Hidayatullah, Jakarta", "Darussalam Gontor"],
  Serang: ["UIN Sultan Maulana Hasanuddin, Banten"],
  Bandung: ["UIN Sunan Gunung Djati, Bandung", "Universitas Islam Madinah", "LIPIA, Jakarta"],
  Cirebon: ["UIN Siber Syekh Nurjati, Cirebon", "Darussalam Gontor"],
  Surabaya: ["UIN Sunan Ampel, Surabaya", "Universitas Al-Azhar, Kairo"],
  Yogyakarta: ["UIN Sunan Kalijaga, Yogyakarta", "Universitas Islam Indonesia, Yogyakarta"],
  Semarang: ["UIN Walisongo, Semarang"],
  Surakarta: ["UIN Raden Mas Said, Surakarta"],
  Magelang: ["UIN Walisongo, Semarang", "Darussalam Gontor"],
  Malang: ["UIN Maulana Malik Ibrahim, Malang"],
  Kediri: ["Pondok Pesantren Lirboyo, Kediri", "UIN Sunan Ampel, Surabaya"],
  "Banda Aceh": ["UIN Ar-Raniry, Banda Aceh"],
  Lhokseumawe: ["UIN Ar-Raniry, Banda Aceh"],
  Medan: ["UIN Sumatera Utara, Medan", "Universitas Islam Madinah"],
  Padang: ["UIN Imam Bonjol, Padang"],
  Bukittinggi: ["UIN Mahmud Yunus, Batusangkar", "UIN Imam Bonjol, Padang"],
  Pekanbaru: ["UIN Sultan Syarif Kasim, Riau"],
  Batam: ["UIN Sultan Syarif Kasim, Riau"],
  Jambi: ["UIN Sulthan Thaha Saifuddin, Jambi"],
  Palembang: ["UIN Raden Fatah, Palembang"],
  Pangkalpinang: ["UIN Raden Fatah, Palembang"],
  Bengkulu: ["UIN Fatmawati Sukarno, Bengkulu"],
  "Bandar Lampung": ["UIN Raden Intan, Lampung"],
  Denpasar: ["UIN Sunan Kalijaga, Yogyakarta"],
  Mataram: ["UIN Mataram"],
  Bima: ["UIN Mataram", "Darussalam Gontor"],
  Kupang: ["IAIN Kupang", "UIN Mataram"],
  Pontianak: ["IAIN Pontianak"],
  "Palangka Raya": ["IAIN Palangka Raya", "UIN Antasari, Banjarmasin"],
  Banjarmasin: ["UIN Antasari, Banjarmasin", "Darussalam Gontor"],
  Samarinda: ["UIN Sultan Aji Muhammad Idris, Samarinda"],
  Balikpapan: ["UIN Sultan Aji Muhammad Idris, Samarinda"],
  Tarakan: ["STAIN Tarakan"],
  Makassar: ["UIN Alauddin, Makassar", "Universitas Al-Azhar, Kairo"],
  Parepare: ["IAIN Parepare", "UIN Alauddin, Makassar"],
  Palu: ["UIN Datokarama, Palu"],
  Manado: ["IAIN Manado"],
  Gorontalo: ["UIN Sultan Amai, Gorontalo"],
  Kendari: ["UIN Kendari"],
  Mamuju: ["IAIN Mamuju"],
  Ambon: ["IAIN Ambon"],
  Ternate: ["IAIN Ternate"],
  Jayapura: ["UIN Alauddin, Makassar", "UIN Syarif Hidayatullah, Jakarta"],
  Sorong: ["UIN Alauddin, Makassar"],
  Manokwari: ["UIN Sunan Kalijaga, Yogyakarta"],
  Timika: ["UIN Alauddin, Makassar"],
  Merauke: ["UIN Syarif Hidayatullah, Jakarta"],
  Wamena: ["UIN Sunan Ampel, Surabaya"],
};

/** Tarif dasar per kota (sebelum pengali pengalaman & spesialisasi) */
const FEE_TIER: Record<string, number> = {
  "Jakarta Selatan": 1500000, "Jakarta Timur": 1300000, Tangerang: 1100000,
  "Tangerang Selatan": 1200000, Depok: 1100000, Bekasi: 1050000, Bogor: 1000000,
  Serang: 800000, Bandung: 1200000, Cirebon: 800000, Surabaya: 1200000,
  Yogyakarta: 1000000, Semarang: 1000000, Surakarta: 900000, Magelang: 800000,
  Malang: 900000, Kediri: 800000, "Banda Aceh": 900000, Lhokseumawe: 750000,
  Medan: 1100000, Padang: 950000, Bukittinggi: 850000, Pekanbaru: 900000,
  Batam: 950000, Jambi: 800000, Palembang: 1000000, Pangkalpinang: 700000,
  Bengkulu: 750000, "Bandar Lampung": 850000, Denpasar: 900000, Mataram: 800000,
  Bima: 650000, Kupang: 700000, Pontianak: 850000, "Palangka Raya": 800000,
  Banjarmasin: 900000, Samarinda: 950000, Balikpapan: 950000, Tarakan: 750000,
  Makassar: 1000000, Parepare: 750000, Palu: 800000, Manado: 850000,
  Gorontalo: 800000, Kendari: 800000, Mamuju: 700000, Ambon: 750000,
  Ternate: 700000, Jayapura: 850000, Sorong: 750000, Manokwari: 700000,
  Timika: 800000, Merauke: 700000, Wamena: 600000,
};

const MALE_FIRST = [
  "Ahmad", "Muhammad", "Abdul", "Ilham", "Rizal", "Fauzi", "Syaiful", "Hendra",
  "Zainal", "Idrus", "Khairul", "Rahmat", "Yusran", "Herman", "Irfan", "Burhan",
  "Mubarok", "Ridwan", "Iskandar", "Salman", "Fauzan", "Lukman", "Amri", "Wahyu",
  "Agus", "Dedi", "Taufik", "Nasrullah", "Firdaus", "Jafar", "Hamid", "Zulkifli",
  "Mahfud", "Asnawi", "Fahmi", "Imad", "Wafi", "Ardi", "Bahrudin", "Cahyadi",
  "Darmawan", "Effendi", "Farid", "Gumilar", "Hidayat", "Iqbal", "Jalal", "Kurnia",
  "Luthfi", "Misbah", "Noval", "Qomar", "Rofi", "Sopian", "Tajuddin", "Umar",
  "Wahab", "Basri", "Cholid", "Darwis", "Fazlur", "Ghazali", "Hamdan", "Mukhlis",
];

const MALE_LAST = [
  "Rahman", "Hakim", "Siddik", "Jamil", "Zainuddin", "Abbas", "Dahlan", "Munir",
  "Syahputra", "Lubis", "Harahap", "Nasution", "Batubara", "Siregar", "Gani",
  "Kadir", "Jalil", "Karim", "Salim", "Amir", "Hasan", "Husain", "Arifin",
  "Mansyur", "Bahri", "Syukur", "Nashir", "Halim", "Amin", "Hamzah", "Shaleh",
  "Mustafa", "Ibrahim", "Ismail", "Ramli", "Saputra", "Nugraha", "Setiawan",
  "Firmansyah", "Gunawan", "Maulana", "Adnan", "Siregar", "Rangkuti", "Panjaitan",
  "Sitorus", "Andi", "Nurdin", "Rasyid", "Yusran", "Zaki",
];

const FEMALE_FIRST = [
  "Fatimah", "Aisyah", "Khadijah", "Maryam", "Nurhayati", "Siti", "Rahma",
  "Zahra", "Hafizah", "Latifah", "Hanum", "Syifa", "Farhana", "Nadia",
  "Yuliana", "Wahidah", "Zaitun", "Halimah", "Saidah", "Farida", "Nurul",
  "Laila", "Fitri", "Mawar", "Ayu", "Euis", "Nining", "Retno", "Wulan",
  "Puspita", "Annisa", "Salma", "Zulfa", "Umaimah", "Khansa", "Alya",
  "Nabila", "Dian", "Rika", "Maya", "Ita", "Lely", "Roro", "Hj.",
];

const FEMALE_LAST = [
  "Rahmawati", "Hidayati", "Shaleha", "Zahroh", "Azzahra", "Safitri",
  "Khairani", "Muthia", "Hanifah", "Badriah", "Khodijah", "Uswah", "Cholifah",
  "Masruroh", "Mu'tiah", "Rohmah", "Fitriani", "Anggraini", "Astuti", "Lestari",
  "Wulandari", "Kusumawati", "Hayati", "Nasution", "Lubis", "Siregar",
  "Andini", "Utami", "Saputri", "Hasanah",
];

const CREDENTIALS = [
  "Lc.", "M.A", "S.Ag", "M.Pd.I", "M.H.I", "Lc., M.A.", "S.Pd.I", "M.Ud.",
  "Dr.", "M.Si", "M.Ag",
];

const GRADIENTS = [
  "from-emerald-500 to-teal-600", "from-teal-600 to-cyan-700",
  "from-indigo-500 to-blue-600", "from-rose-500 to-pink-600",
  "from-teal-500 to-emerald-700", "from-cyan-600 to-teal-700",
  "from-blue-500 to-indigo-700", "from-pink-500 to-rose-600",
];

const SPECIALIZATION_FOCUS: Record<Specialization, string> = {
  "Tafsir Al-Qur'an":
    "Pendekatannya kontekstual: ayat dihubungkan dengan persoalan sehari-hari jamaah.",
  Fiqih: "Pembahasan fiqih ibadah disampaikan bertahap dengan dalil yang jelas.",
  Aqidah: "Membina aqidah dengan argumen tenang dan menjawab keraguan secara rasional.",
  "Ceramah & Tausiyah":
    "Gaya ceramah hangat dan menyentuh, cocok untuk audiens campuran.",
  "Nikah & Keluarga":
    "Berpengalaman mendampingi pasangan pra-nikah hingga pembinaan rumah tangga.",
  "Parenting Islami":
    "Materi parenting berbasis nilai Islam dengan contoh praktis di rumah.",
  "Muamalah & Ekonomi Syariah":
    "Fokus fiqih muamalah praktis: bisnis, koperasi, dan keuangan syariah.",
  "Tahsin & Tahfidz":
    "Metode talaqqi dengan target hafalan yang terukur per pekan.",
  "Fiqih Wanita":
    "Kajian fiqih kewanitaan dibahas terbuka dan mendalam untuk majelis muslimah.",
  "Tasawuf & Akhlak":
    "Pembinaan akhlak melalui kajian kitab klasik secara moderat.",
};

const ROLE_TEMPLATES_M = [
  (area: string, city: string) =>
    `Pendakwah aktif yang membina majelis taklim dan komunitas muslim di ${area}, ${city}.`,
  (area: string, city: string, spot: string) =>
    `Pengajar tetap di ${spot} serta pembina kajian pekanan di lingkungan ${area}, ${city}.`,
  (area: string, city: string) =>
    `Alumni pesantren yang kini membina TPQ dan majelis remaja masjid di ${area}, ${city}.`,
  (area: string, city: string, spot: string) =>
    `Da'i yang dikenal lewat kajian tematik di ${spot} dan komunitas profesional ${city}.`,
  (area: string, city: string, spot: string) =>
    `Pembina rutin wirid dan kajian kitab di ${spot}, warga sekitar ${area}, ${city}.`,
  (area: string, city: string) =>
    `Pengasuh majelis pekanan yang telah membina jamaah ${area} dan sekitarnya, ${city}.`,
];

const ROLE_TEMPLATES_F = [
  (area: string, city: string) =>
    `Pendamping majelis muslimah di ${area}, ${city}, dengan kajian pekanan bagi ibu-ibu.`,
  (area: string, city: string, spot: string) =>
    `Pengajar tetap majelis taklim muslimah di ${spot} dan sekitar ${area}, ${city}.`,
  (area: string, city: string) =>
    `Konselor keluarga muslim yang membina komunitas muslimah ${area}, ${city}.`,
  (area: string, city: string, spot: string) =>
    `Pembina wirid ibu-ibu dan kelas muslimah remaja di ${spot}, ${city}.`,
  (area: string, city: string) =>
    `Pengasuh TPQ putri dan bimbingan tahfidz muslimah di ${area}, ${city}.`,
];

const CLOSERS = [
  "Menerima undangan kajian di dalam maupun luar kota sesuai kesediaan jadwal.",
  "Terbiasa menyesuaikan materi dengan profil jamaah, dari pemula hingga pengkajian lanjutan.",
  "Menyukai sesi tanya jawab panjang setelah setiap kajian.",
  "Aktif membina kader dakwah muda di wilayahnya.",
];

/** Kolom area & spot diambil bergilir agar profil dalam satu kota beragam */
const buildUstadz = (seed: {
  idx: number;
  name: string;
  title: string;
  credentials: string;
  specializations: Specialization[];
  eventTypes: EventType[];
  city: string;
  area: string;
  bio: string;
  rating: number;
  reviewCount: number;
  experience: number;
  fee: number;
  almaMater: string;
  gender: "L" | "P";
  available: boolean;
}): Ustadz => {
  const i = seed.idx;
  const phone = `08${13 + (i % 6)}-${String(2100 + i * 53).padStart(4, "0").slice(-4)}-${String(
    4800 + i * 29
  ).padStart(4, "0").slice(-4)}`;
  const wa = "62" + phone.replace(/-/g, "").slice(1);
  const cityCoord = CITY_COORDS[seed.city] ?? { lat: -6.2, lng: 106.8 };
  const lat = cityCoord.lat + (((i % 7) - 3) * 0.004);
  const lng = cityCoord.lng + (((i % 5) - 2) * 0.005);

  return {
    id: `u${i}`,
    name: seed.name,
    title: seed.title,
    credentials: seed.credentials,
    specializations: seed.specializations,
    eventTypes: seed.eventTypes,
    city: seed.city,
    province: CITY_PROVINCE[seed.city],
    area: seed.area,
    bio: seed.bio,
    rating: seed.rating,
    reviewCount: seed.reviewCount,
    experience: seed.experience,
    fee: seed.fee,
    almaMater: seed.almaMater,
    contact: { phone, whatsapp: wa },
    lat,
    lng,
    available: seed.available,
    verified: true,
    gender: seed.gender,
    avatarGradient: GRADIENTS[i % GRADIENTS.length],
    schedule: defaultSchedule(i),
  };
};

/** Spesialisasi & jenis acara yang konsisten dengan gender */
const SPECS_MALE: Specialization[][] = [
  ["Tafsir Al-Qur'an", "Aqidah"],
  ["Fiqih", "Muamalah & Ekonomi Syariah"],
  ["Ceramah & Tausiyah", "Tasawuf & Akhlak"],
  ["Aqidah", "Tafsir Al-Qur'an"],
  ["Fiqih", "Tafsir Al-Qur'an"],
  ["Tahsin & Tahfidz", "Tafsir Al-Qur'an"],
  ["Ceramah & Tausiyah", "Nikah & Keluarga"],
  ["Fiqih", "Aqidah", "Tasawuf & Akhlak"],
  ["Muamalah & Ekonomi Syariah", "Ceramah & Tausiyah"],
  ["Tafsir Al-Qur'an", "Tasawuf & Akhlak"],
];

const SPECS_FEMALE: Specialization[][] = [
  ["Fiqih Wanita", "Parenting Islami"],
  ["Tahsin & Tahfidz", "Fiqih Wanita"],
  ["Nikah & Keluarga", "Parenting Islami"],
  ["Parenting Islami", "Ceramah & Tausiyah"],
  ["Fiqih Wanita", "Nikah & Keluarga"],
  ["Tafsir Al-Qur'an", "Fiqih Wanita"],
  ["Tahsin & Tahfidz", "Parenting Islami"],
  ["Ceramah & Tausiyah", "Fiqih Wanita"],
];

const EVENTS_BY_SPEC: Record<string, EventType[]> = {
  "Tafsir Al-Qur'an": ["Kajian Rutin", "Khutbah Jumat", "Ceramah 7 Bulanan"],
  Fiqih: ["Kajian Rutin", "Khutbah Jumat", "Ceramah 7 Bulanan"],
  Aqidah: ["Kajian Rutin", "Tabligh Akbar", "Khutbah Jumat"],
  "Ceramah & Tausiyah": ["Ceramah Keluarga / Arisan", "Tabligh Akbar", "Kajian Korporat"],
  "Nikah & Keluarga": ["Konseling", "Ceramah Keluarga / Arisan", "Kajian Rutin"],
  "Parenting Islami": ["Kajian Rutin", "Pengajian Anak", "Konseling"],
  "Muamalah & Ekonomi Syariah": ["Kajian Korporat", "Kajian Rutin", "Ceramah Keluarga / Arisan"],
  "Tahsin & Tahfidz": ["Tahsin / Tahfidz", "Pengajian Anak", "Kajian Rutin"],
  "Fiqih Wanita": ["Wirid Ibu-ibu", "Kajian Rutin", "Ceramah 7 Bulanan"],
  "Tasawuf & Akhlak": ["Kajian Rutin", "Tabligh Akbar", "Wirid Ibu-ibu"],
};

const usedNames = new Set<string>(
  baseUstadzRaw.map((u) => `${u.name}`)
);

const pickName = (i: number, gender: "L" | "P"): string => {
  const firstPool = gender === "L" ? MALE_FIRST : FEMALE_FIRST;
  const lastPool = gender === "L" ? MALE_LAST : FEMALE_LAST;
  for (let attempt = 0; attempt < 40; attempt++) {
    const first = firstPool[(i * 13 + attempt * 5) % firstPool.length];
    const last = lastPool[(i * 7 + attempt * 11 + 3) % lastPool.length];
    const name = `${first} ${last}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }
  // fallback aman: tambahkan inisial
  const first = firstPool[i % firstPool.length];
  const last = lastPool[(i * 7) % lastPool.length];
  const name = `${first} ${last} ${String.fromCharCode(65 + (i % 26))}`;
  usedNames.add(name);
  return name;
};

const areaOf = (city: string, i: number) => {
  const pool = CITY_AREAS[city] ?? ["Pusat Kota"];
  return pool[i % pool.length];
};

const spotOf = (city: string, i: number) => {
  const pool = CITY_SPOTS[city] ?? ["masjid induk kota"];
  return pool[i % pool.length];
};

const almaOf = (city: string, i: number) => {
  const pool = CITY_ALMA[city] ?? ["UIN Syarif Hidayatullah, Jakarta"];
  return pool[i % pool.length];
};

const bioOf = (
  gender: "L" | "P",
  area: string,
  city: string,
  spot: string,
  spec: Specialization,
  i: number
) => {
  const templates = gender === "L" ? ROLE_TEMPLATES_M : ROLE_TEMPLATES_F;
  const role = templates[i % templates.length](area, city, spot);
  const focus = SPECIALIZATION_FOCUS[spec];
  const closer = CLOSERS[(i * 3) % CLOSERS.length];
  return `${role} ${focus} ${closer}`;
};

const generatedUstadz: Ustadz[] = [];
let genIdx = 13;

for (const [city, [maleCount, femaleCount]] of Object.entries(CITY_QUOTA)) {
  for (const gender of ["L", "P"] as const) {
    const count = gender === "L" ? maleCount : femaleCount;
    for (let k = 0; k < count; k++) {
      const i = genIdx++;
      const isSenior = i % 17 === 0 && gender === "L";
      const title = gender === "L" ? (isSenior ? "KH." : "Ustadz") : "Ustadzah";
      const specPool = gender === "L" ? SPECS_MALE : SPECS_FEMALE;
      const specializations = specPool[(i * 3 + k) % specPool.length];
      const experience = 3 + ((i * 17) % 25);
      const rating = Math.round((4.3 + ((i * 37) % 8) / 10) * 10) / 10;
      const reviewCount = 8 + ((i * 53) % 220);
      const base = FEE_TIER[city] ?? 800000;
      const bonus = specializations.includes("Ceramah & Tausiyah") ? 200000 : 0;
      const discount = specializations.includes("Tahsin & Tahfidz") ? 100000 : 0;
      const fee =
        Math.round((base * (0.7 + experience / 45) + bonus - discount) / 50000) *
        50000;
      const area = areaOf(city, i + k);
      const spot = spotOf(city, i + k);
      const credsPool = CREDENTIALS.filter((c) => !(gender === "P" && c === "Dr."));

      generatedUstadz.push(
        buildUstadz({
          idx: i,
          name: pickName(i, gender),
          title,
          credentials: credsPool[(i * 5) % credsPool.length],
          specializations,
          eventTypes: EVENTS_BY_SPEC[specializations[0]] ?? ["Kajian Rutin"],
          city,
          area,
          bio: bioOf(gender, area, city, spot, specializations[0], i),
          rating: rating === 5.0 && reviewCount < 30 ? 4.9 : rating,
          reviewCount,
          experience,
          fee,
          almaMater: almaOf(city, i),
          gender,
          available: i % 29 !== 0,
        })
      );
    }
  }
}

// Provinsi wajib terdaftar — gagal cepat kalau ada kota liar
const baseUstadz: Ustadz[] = baseUstadzRaw.map((u) => {
  const p = CITY_PROVINCE[u.city];
  if (!p) throw new Error(`Kota tidak terdaftar di regions.ts: ${u.city} (${u.id})`);
  return { ...u, province: p };
});

export const ustadzData: Ustadz[] = [...baseUstadz, ...generatedUstadz];

/**
 * Ambil id ustadz nyata dari kota (untuk data kajian).
 * Bertingkat: kota+spesialisasi -> kota+jenis acara -> kota apa pun.
 * Gagal keras hanya jika kota sepenuhnya kosong — itu bug data.
 */
const pickUstadz = (
  city: string,
  spec?: Specialization,
  nth = 0
): string => {
  const inCity = ustadzData.filter((u) => u.city === city);
  if (inCity.length === 0)
    throw new Error(`Kota tanpa ustadz di data: ${city}`);
  const candidates =
    (spec && inCity.filter((u) => u.specializations.includes(spec))) ||
    inCity;
  const pool = candidates.length > 0 ? candidates : inCity;
  const u = pool[nth % pool.length];
  return u.id;
};

/* =====================================================================
 * Ulasan awal untuk jaringan nasional — 1-2 ulasan per ustadz yang
 * dibangkitkan deterministik dari template spesifik per bidang.
 * ===================================================================== */

const REVIEW_AUTHORS = [
  "Takmir Masjid", "Majelis Taklim Al-Ihsan", "Komunitas Muslim Muda",
  "Ibu-ibu Posyandu", "Panitia Tabligh Akbar", "Yayasan Pendidikan",
  "Koperasi Syariah Berkah", "Sekretaris Arisan Keluarga", "Wali Murid TPQ",
  "Karang Taruna Masjid", "Pengurus Kajian Pemuda", "Tim HRD Perusahaan",
  "Dewan Kemakmuran Masjid", "Komunitas Tahfidz", "Pengantin Baru",
  "Perwakilan RT", "Alumni Kajian Pekanan",
];

const REVIEW_COMMENTS_M = [
  "Alhamdulillah, penyampaiannya jelas dan berbobot. Jamaah sampai rumah dengan bekal ilmu yang bisa dipraktikkan.",
  "Sesuai kebutuhan kami. Datang tepat waktu, materi terstruktur, dan sabar menjawab pertanyaan jamaah.",
  "Kajian berjalan lancar. Bahasanya mudah dipahami jamaah yang beragam umurnya.",
  "Rekomendasi: sangat layak untuk acara keagamaan komunitas. Koordinasinya juga baik.",
  "Materi disampaikan dengan dalil yang jelas. Kami akan mengundang kembali di acara berikutnya.",
];

const REVIEW_COMMENTS_F = [
  "Alhamdulillah, kajian muslimahnya hangat dan mendalam. Ibu-ibu banyak bertanya dan semua terjawab.",
  "Penyampaiannya lembut tapi jelas. Materi langsung bisa dipraktikkan di rumah.",
  "Anak-anak juga senang mengikuti sesinya. Metode mengajarnya menyenangkan.",
  "Kami puas, koordinasi sebelum acara mudah dan beliau responsif di WhatsApp.",
  "Sesi konselingnya membantu keluarga kami. Insya Allah akan mengundang lagi.",
];

const REVIEW_DATES = [
  "2026-08-14", "2026-08-27", "2026-09-05", "2026-09-18", "2026-09-26",
  "2026-10-03", "2026-10-11", "2026-10-19",
];

const generatedReviews: Review[] = [];
let reviewIdx = 100;

for (const u of ustadzData) {
  const jumlah = u.id.charCodeAt(2) % 3 === 0 ? 2 : 1;
  for (let k = 0; k < jumlah; k++) {
    const comments = u.gender === "P" ? REVIEW_COMMENTS_F : REVIEW_COMMENTS_M;
    const rating = u.rating >= 4.9 ? 5 : u.rating >= 4.6 ? 5 : 4;
    generatedReviews.push({
      id: `r${reviewIdx++}`,
      ustadzId: u.id,
      authorName:
        REVIEW_AUTHORS[(u.id.charCodeAt(3) * (k + 3)) % REVIEW_AUTHORS.length] +
        " " +
        u.city,
      rating,
      comment: comments[(u.id.charCodeAt(3) + k * 2) % comments.length],
      date: REVIEW_DATES[(u.id.charCodeAt(3) + k * 3) % REVIEW_DATES.length],
      event: u.eventTypes[(u.id.charCodeAt(3) + k) % u.eventTypes.length],
    });
  }
}

export const initialReviews: Review[] = [

  {
    id: "r1",
    ustadzId: "u1",
    authorName: "Dinas Sosial Masjid Al-Markaz",
    rating: 5,
    comment:
      "Alhamdulillah, kajian Tafsirnya sangat membantu jamaah memahami makna ayat dengan konteks yang jelas. Penyampaian tertib dan mudah dicerna.",
    date: "2026-09-28",
    event: "Kajian Rutin Pekanan",
  },
  {
    id: "r2",
    ustadzId: "u1",
    authorName: "Komunitas Muslim Muda",
    rating: 5,
    comment:
      "Cocok banget buat anak muda. Bahasannya relevan dan tidak membosankan. Pasti booking lagi bulan depan.",
    date: "2026-09-12",
    event: "Kajian Tematik",
  },
  {
    id: "r3",
    ustadzId: "u3",
    authorName: "Yayasan Pendidikan Al-Hikmah",
    rating: 5,
    comment:
      "MasyaAllah, beliau sangat berwibawa dan ilmunya luas. Santri-santri terinspirasi sekali. Sangat direkomendasikan.",
    date: "2026-10-05",
    event: "Pengajian Bulanan",
  },
  {
    id: "r4",
    ustadzId: "u5",
    authorName: "Pasangan Pengantin Baru",
    rating: 5,
    comment:
      "Konseling pra-nikahnya membuka wawasan kami berdua. Bahas fiqih rumah tangga dengan lembut dan praktis.",
    date: "2026-09-20",
    event: "Konseling Pra-Nikah",
  },
  {
    id: "r5",
    ustadzId: "u2",
    authorName: "Majelis Taklim As-Syifa",
    rating: 5,
    comment:
      "Materi parenting Islami-nya aplikatif. Banyak tips yang langsung bisa dipraktikkan di rumah.",
    date: "2026-09-30",
    event: "Kajian Muslimah",
  },
  {
    id: "r6",
    ustadzId: "u8",
    authorName: "Wali Murid Markaz Tahfidz",
    rating: 5,
    comment:
      "Anak saya semangat menghafal setelah dibimbing Ustadzah. Metodenya menyenangkan dan targetnya realistis.",
    date: "2026-10-02",
    event: "Bimbingan Tahfidz",
  },
  {
    id: "r7",
    ustadzId: "u6",
    authorName: "Koperasi Syariah Berkah",
    rating: 4,
    comment:
      "Penjelasan fiqih muamalahnya jelas dengan studi kasus nyata. Membantu tim kami memahami praktik ekonomi syariah.",
    date: "2026-09-18",
    event: "Pelatihan Internal",
  },
  ...generatedReviews,
];

export const ustadzReplies: string[] = [
  "Alhamdulillah, terima kasih sudah menghubungi. Boleh diberi tahu tanggal dan lokasi acaranya?",
  "Insya Allah tersedia. Untuk detail jadwal dan tema, bisa langsung diatur melalui halaman booking, ya.",
  "Baik, jazakumullahu khairan. Saya tunggu detail acaranya agar bisa dipersiapkan dengan baik.",
  "Sudah saya cek jadwalnya. Silakan pilih slot yang tersedia di halaman booking untuk konfirmasi.",
];

/** Balasan khusus bila pengguna mengirim salam — dipakai sekali, bukan diputar. */
export const salamReply =
  "Wa'alaikumussalam warahmatullahi wabarakatuh. Baik, silakan sampaikan kebutuhan acaranya, insya Allah saya bantu.";

// === DATA KAJIAN (info kajian yang akan datang) ===
export const kajianData: Kajian[] = [
  {
    id: "k1",
    title: "Kajian Tafsir Tematik: Memahami Ayat-Ayat Rahmat",
    ustadzId: "u1",
    date: "2026-11-04",
    time: "19:00 - 21:00",
    location: "Masjid Al-Markaz, Kebayoran Baru",
    city: "Jakarta Selatan",
    topic: "Tafsir Al-Qur'an",
    eventType: "Kajian Rutin",
    price: "Gratis",
    description:
      "Kajian pekanan yang membahas ayat-ayat tentang rahmat Allah dengan pendekatan tafsir kontekstual.",
  },
  {
    id: "k2",
    title: "Tabligh Akbar: Mengenal Allah dengan Benar",
    ustadzId: "u3",
    date: "2026-11-07",
    time: "13:00 - 16:00",
    location: "Halaman Pondok Al-Hikmah, Beji",
    city: "Depok",
    topic: "Aqidah",
    eventType: "Tabligh Akbar",
    price: "Gratis",
    description:
      "Pengajian akbar membahas tauhid dan mengenal Asmaul Husna. Terbuka untuk umum.",
  },
  {
    id: "k3",
    title: "Parenting Islami: Mendidik Anak dengan Cinta Qur'ani",
    ustadzId: "u2",
    date: "2026-11-05",
    time: "10:00 - 12:00",
    location: "Majelis Taklim Fatimah Az-Zahra, Coblong",
    city: "Bandung",
    topic: "Parenting Islami",
    eventType: "Wirid Ibu-ibu",
    price: "Gratis",
    description:
      "Kajian khusus muslimah tentang pola asuh Islami yang membangun akhlak anak sejak dini.",
  },
  {
    id: "k4",
    title: "Bimbingan Tahsin Dewasa: Perbaiki Bacaan Al-Qur'an",
    ustadzId: "u8",
    date: "2026-11-06",
    time: "16:00 - 18:00",
    location: "Markaz Tahfidz Aisyah, Bandung Wetan",
    city: "Bandung",
    topic: "Tahsin & Tahfidz",
    eventType: "Tahsin / Tahfidz",
    price: "Berbayar",
    fee: 50000,
    description:
      "Kelas tahsin intensif untuk memperbaiki makharijul huruf dan tajwid bacaan Al-Qur'an.",
  },
  {
    id: "k5",
    title: "Fiqih Muamalah: Hukum Jual Beli Online & Investasi Syariah",
    ustadzId: "u6",
    date: "2026-11-08",
    time: "19:00 - 21:00",
    location: "Kantor Tazkia Center, Tangerang Selatan",
    city: "Tangerang",
    topic: "Muamalah & Ekonomi Syariah",
    eventType: "Kajian Korporat",
    price: "Berbayar",
    fee: 75000,
    description:
      "Kajian fiqih muamalah kontemporer membahas e-commerce, dropshipping, dan investasi sesuai syariah.",
  },
  {
    id: "k6",
    title: "Konseling Pra-Nikah: Mempersiapkan Rumah Tangga Sakinah",
    ustadzId: "u5",
    date: "2026-11-09",
    time: "13:00 - 15:00",
    location: "Ruang Konseling Jatinegara",
    city: "Jakarta Timur",
    topic: "Nikah & Keluarga",
    eventType: "Konseling",
    price: "Berbayar",
    fee: 150000,
    description:
      "Sesi konseling pra-nikah untuk pasangan yang akan menikah. Membahas hak, kewajiban, dan komunikasi.",
  },
  {
    id: "k7",
    title: "Khutbah Jumat: Menjaga Ukhuwah Islamiyah",
    ustadzId: "u7",
    date: "2026-11-06",
    time: "11:30 - 13:00",
    location: "Masjid Agung Al-Kautsar, Bogor Tengah",
    city: "Bogor",
    topic: "Fiqih",
    eventType: "Khutbah Jumat",
    price: "Gratis",
    description:
      "Khutbah Jumat tentang pentingnya menjaga persaudaraan sesama muslim.",
  },
  {
    id: "k8",
    title: "Kajian Akhlak: Menyehatkan Hati di Tengah Kesibukan",
    ustadzId: "u9",
    date: "2026-11-10",
    time: "19:00 - 21:00",
    location: "Masjid Al-Gubeng, Surabaya",
    city: "Surabaya",
    topic: "Tasawuf & Akhlak",
    eventType: "Kajian Rutin",
    price: "Gratis",
    description:
      "Kajian pembinaan akhlak dan tasawuf praktis untuk kesehatan hati dan ketenangan jiwa.",
  },
  {
    id: "k9",
    title: "Kajian Tafsir: Surah Al-Kahfi sebagai Pelindung Ujian",
    ustadzId: pickUstadz("Medan", "Tafsir Al-Qur'an"),
    date: "2026-12-11",
    time: "19:00 - 21:00",
    location: "Masjid Raya Al-Mashun, Medan Kota",
    city: "Medan",
    topic: "Tafsir Al-Qur'an",
    eventType: "Kajian Rutin",
    price: "Gratis",
    description:
      "Kajian pekanan bagi jamaah umum. Fokus pada pesan Surah Al-Kahfi tentang ujian harta, ilmu, dan kedudukan.",
  },
  {
    id: "k10",
    title: "Wirid Ibu-ibu: Fiqih Wanita dalam Kehidupan Sehari-hari",
    ustadzId: pickUstadz("Makassar", "Fiqih Wanita"),
    date: "2026-12-12",
    time: "16:00 - 18:00",
    location: "Masjid Raya Makassar, Rappocini",
    city: "Makassar",
    topic: "Fiqih Wanita",
    eventType: "Wirid Ibu-ibu",
    price: "Gratis",
    description:
      "Kajian muslimah bulanan: fiqih haid, nifas, dan muamalah sehari-hari dengan bahasa yang ringan.",
  },
  {
    id: "k11",
    title: "Kajian Muamalah: Jual Beli Online Menurut Fiqih Islam",
    ustadzId: pickUstadz("Banjarmasin", "Muamalah & Ekonomi Syariah"),
    date: "2026-12-13",
    time: "19:30 - 21:30",
    location: "Masjid Sabilal Muhtadin, Banjarmasin Tengah",
    city: "Banjarmasin",
    topic: "Muamalah & Ekonomi Syariah",
    eventType: "Kajian Rutin",
    price: "Gratis",
    description:
      "Kajian rutin bulanan bagi pelaku usaha dan umum. Membahas akad jual beli online dan promosi yang jujur.",
  },
  {
    id: "k12",
    title: "Kajian Keluarga Sakinah: Komunikasi Suami Istri",
    ustadzId: pickUstadz("Samarinda", "Nikah & Keluarga"),
    date: "2026-12-17",
    time: "16:00 - 18:00",
    location: "Masjid Islamic Center Samarinda, Samarinda Ilir",
    city: "Samarinda",
    topic: "Nikah & Keluarga",
    eventType: "Ceramah Keluarga / Arisan",
    price: "Berbayar",
    fee: 50000,
    description:
      "Kajian keluarga terbuka untuk pasangan muda. Membahas komunikasi dan penyelesaian konflik rumah tangga.",
  },
  {
    id: "k13",
    title: "Tabligh Akbar: Islam Rahmatan lil Alamin",
    ustadzId: pickUstadz("Jayapura", "Ceramah & Tausiyah"),
    date: "2026-12-19",
    time: "19:00 - 21:00",
    location: "masjid induk Jayapura, Jayapura Utara",
    city: "Jayapura",
    topic: "Ceramah & Tausiyah",
    eventType: "Tabligh Akbar",
    price: "Gratis",
    description:
      "Tabligh akbar malam Ahad untuk seluruh warga Jayapura dan sekitarnya. Terbuka untuk umum.",
  },
  {
    id: "k14",
    title: "Kajian Aqidah: Menjaga Tauhid di Tengah Kesibukan",
    ustadzId: pickUstadz("Pontianak", "Aqidah"),
    date: "2027-01-09",
    time: "19:00 - 21:00",
    location: "Masjid Abdurrahman Al-Kadrie, Pontianak Kota",
    city: "Pontianak",
    topic: "Aqidah",
    eventType: "Kajian Rutin",
    price: "Gratis",
    description:
      "Kajian pekanan pemula yang membahas fundamen aqidah dengan bahasa sederhana.",
  },
  {
    id: "k15",
    title: "Kajian Parenting: Anak dan Gadget Menurut Islam",
    ustadzId: pickUstadz("Padang", "Parenting Islami"),
    date: "2027-01-16",
    time: "16:00 - 18:00",
    location: "Masjid Raya Sumatera Barat, Kuranji",
    city: "Padang",
    topic: "Parenting Islami",
    eventType: "Kajian Rutin",
    price: "Gratis",
    description:
      "Kajian orang tua: batasan gadget, mendampingi anak di dunia digital, dan keteladanan di rumah.",
  },
  {
    id: "k16",
    title: "Bimbingan Tahsin Ramadhan: Perbaiki Bacaan Sebelum Puasa",
    ustadzId: pickUstadz("Denpasar", "Tahsin & Tahfidz"),
    date: "2027-01-23",
    time: "19:00 - 21:00",
    location: "Masjid Agung Denpasar, Denpasar Selatan",
    city: "Denpasar",
    topic: "Tahsin & Tahfidz",
    eventType: "Tahsin / Tahfidz",
    price: "Berbayar",
    fee: 75000,
    description:
      "Kelas tahsin persiapan Ramadhan bagi jamaah Denpasar dan sekitarnya. Kuota terbatas, level pemula.",
  },
];

// === DATA HADITH (rotate by day-of-year) ===
export const hadithData: Hadith[] = [
  {
    id: 0,
    source: "Shahih Bukhari No. 1",
    narrator: "Umar bin Khattab radhiyallahu'anhu",
    arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    translation:
      "Sesungguhnya amal itu tergantung niatnya, dan setiap orang akan mendapatkan sesuai yang diniatkannya.",
    grade: "Shahih",
  },
  {
    id: 1,
    source: "Shahih Bukhari No. 6018 & Muslim",
    narrator: "Abu Hurairah radhiyallahu'anhu",
    arabic:
      "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
    translation:
      "Barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia berkata baik atau diam.",
    grade: "Muttafaqun 'alaih",
  },
  {
    id: 2,
    source: "Shahih Muslim No. 55",
    narrator: "Tamim ad-Dari radhiyallahu'anhu",
    arabic: "الدِّينُ النَّصِيحَةُ",
    translation: "Agama itu nasihat.",
    grade: "Shahih",
  },
  {
    id: 3,
    source: "Shahih Bukhari No. 13 & Muslim",
    narrator: "Anas bin Malik radhiyallahu'anhu",
    arabic:
      "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    translation:
      "Tidak sempurna iman seseorang dari kalian sampai ia mencintai untuk saudaranya apa yang ia cintai untuk dirinya sendiri.",
    grade: "Muttafaqun 'alaih",
  },
  {
    id: 4,
    source: "Shahih Bukhari No. 10 & Muslim",
    narrator: "Abdullah bin Amr radhiyallahu'anhuma",
    arabic:
      "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
    translation:
      "Muslim (sejati) adalah orang yang orang-orang muslim lain selamat dari (gangguan) lisan dan tangannya.",
    grade: "Muttafaqun 'alaih",
  },
  {
    id: 5,
    source: "Shahih Bukhari No. 3461",
    narrator: "Abdullah bin Amr radhiyallahu'anhuma",
    arabic: "بَلِّغُوا عَنِّي وَلَوْ آيَةً",
    translation: "Sampaikanlah dariku walau hanya satu ayat.",
    grade: "Shahih",
  },
  {
    id: 6,
    source: "Shahih Bukhari No. 2989 & Muslim",
    narrator: "Abu Hurairah radhiyallahu'anhu",
    arabic: "الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ",
    translation: "Ucapan yang baik adalah sedekah.",
    grade: "Muttafaqun 'alaih",
  },
  {
    id: 7,
    source: "Shahih Bukhari No. 8 & Muslim",
    narrator: "Abdullah bin Umar radhiyallahu'anhuma",
    arabic: "بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ",
    translation:
      "Islam dibangun di atas lima perkara: bersaksi tiada Tuhan selain Allah dan Muhammad utusan Allah, menegakkan sholat, menunaikan zakat, puasa Ramadhan, dan haji bagi yang mampu.",
    grade: "Muttafaqun 'alaih",
  },
  {
    id: 8,
    source: "Shahih Muslim No. 2588",
    narrator: "Abu Hurairah radhiyallahu'anhu",
    arabic: "مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ",
    translation: "Tidaklah sedekah itu mengurangi harta.",
    grade: "Shahih",
  },
  {
    id: 9,
    source: "Sunan Tirmidzi",
    narrator: "Abu Dharr radhiyallahu'anhu",
    arabic: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ",
    translation: "Senyummu di hadapan saudaramu adalah sedekah bagimu.",
    grade: "Shahih",
  },
  {
    id: 10,
    source: "Musnad Ahmad & Al-Bukhari Adab",
    narrator: "Abu Hurairah radhiyallahu'anhu",
    arabic: "إِنَّمَا بُعِثْتُ لأُتَمِّمَ مَكَارِمَ الأَخْلاَقِ",
    translation:
      "Sesungguhnya aku diutus untuk menyempurnakan akhlak yang mulia.",
    grade: "Shahih",
  },
  {
    id: 11,
    source: "Shahih Bukhari No. 5985 & Muslim",
    narrator: "Abu Hurairah radhiyallahu'anhu",
    translation:
      "Barangsiapa senang dilapangkan rezekinya dan dipanjangkan umurnya, hendaklah ia menyambung silaturahim.",
    grade: "Muttafaqun 'alaih",
  },
  {
    id: 12,
    source: "Shahih Muslim No. 2675",
    narrator: "Abu Hurairah radhiyallahu'anhu",
    translation:
      "Barangsiapa menempuh jalan untuk mencari ilmu, Allah akan memudahkan baginya jalan menuju surga.",
    grade: "Shahih",
  },
  {
    id: 13,
    source: "Shahih Bukhari No. 6094 & Muslim",
    narrator: "Anas bin Malik radhiyallahu'anhu",
    arabic:
      "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى أَكُونَ أَحَبَّ إِلَيْهِ مِنْ وَالِدِهِ وَوَلَدِهِ وَالنَّاسِ أَجْمَعِينَ",
    translation:
      "Tidak sempurna iman seseorang dari kalian hingga aku lebih dicintainya daripada orang tuanya, anaknya, dan manusia seluruhnya.",
    grade: "Muttafaqun 'alaih",
  },
];

export function getDailyHadith(): Hadith {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return hadithData[dayOfYear % hadithData.length];
}
