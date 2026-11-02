/**
 * Basis data dalil terverifikasi untuk Mode Ustadz Hafizh.
 *
 * ATURAN FUNDAMENTAL: agen HANYA boleh mengutip ayat/hadis yang ada di sini.
 * Setiap entri sudah diverifikasi sumbernya (nama surah:ayat atau nama kitab
 * + nomor hadis). Ini grounding deterministik — model tidak pernah mengarang
 * nomor ayat, karena jawaban lokal menyusun dari baris-baris berikut dan
 * jawaban LLM dilarang mengutip di luar data ini.
 *
 * Hadis yang dipakai semuanya berderajat shahih atau hasan. Derajat dicatat
 * di field `grade` bila bukan shahih murni.
 */

export interface DalilEntry {
  id: string;
  /** Topik yang dipakai pencocokan kata kunci (lowercase) */
  topics: string[];
  /** Contoh: "QS Al-Baqarah: 153" atau "HR Bukhari no. 1" */
  citation: string;
  /** Terjemahan resmi yang lazim dipakai */
  text: string;
  /** Derajat hadis; untuk ayat Al-Quran tidak diisi */
  grade?: string;
  /** Penjelasan makna singkat */
  meaning: string;
  /** Penerapan praktis sehari-hari */
  practice: string;
}

export const DALIL_DATA: DalilEntry[] = [
  {
    id: "sabar",
    topics: ["sabar", "kesabaran", "sabar menghadapi ujian", "gelisah", "tertahan"],
    citation: "QS Al-Baqarah: 153",
    text: "Wahai orang-orang yang beriman! Mohonlah pertolongan (kepada Allah) dengan sabar dan salat. Sungguh, Allah beserta orang-orang yang sabar.",
    meaning:
      "Sabar dan salat adalah dua kunci pertolongan Allah. Janji 'Allah berserta' di ayat ini adalah kedekatan khusus berupa pertolongan dan penjagaan bagi yang bersabar.",
    practice:
      "Saat berat, mulai dari yang paling dekat: tahan lisan dari keluhan, lalu tegakkan salat tepat waktu. Sabar bukan menahan rasa, tapi menahan diri dari larangan-Nya.",
  },
  {
    id: "ujian-sabar",
    topics: ["ujian", "musibah", "cobaan", "kesulitan hidup", "kehilangan", "sakit"],
    citation: "QS Al-Baqarah: 155",
    text: "Dan Kami pasti akan menguji kamu dengan sedikit ketakutan, kelaparan, kekurangan harta, jiwa, dan buah-buahan. Dan sampaikanlah kabar gembira kepada orang-orang yang sabar.",
    meaning:
      "Ujian itu kepastian, bukan kebetulan — dan justru menjadi tanda kasih sayang karena dijanjikan kabar gembira bagi yang menyambutnya dengan sabar.",
    practice:
      "Ucapkan istirja' saat tertimpa musibah (innalillahi wa inna ilaihi raji'un), lalu lihat ujian sebagai babak, bukan seluruh cerita hidup.",
  },
  {
    id: "pahala-ujian",
    topics: ["balasan ujian", "pahala musibah", "sakit menghapus dosa", "besarnya pahala"],
    citation: "HR Tirmidzi no. 2396",
    grade: "hasan shahih",
    text: "Sungguh, besarnya pahala bersama besarnya ujian. Dan apabila Allah mencintai suatu kaum, Dia uji mereka.",
    meaning:
      "Derajat di sisi Allah dicapai lewat kesabaran atas ujian, bukan hanya lewat kenyamanan.",
    practice:
      "Saat diuji, ingat: ini bisa jadi tanda Allah sedang mendidihkan diri kita agar bersih. Balas dengan sabar dan harap pahala, bukan keluhan.",
  },
  {
    id: "niat",
    topics: ["niat", "ikhlas", "ketulusan", "amal", "niat baik"],
    citation: "HR Bukhari no. 1",
    grade: "shahih",
    text: "Sesungguhnya setiap amal itu tergantung niatnya. Dan setiap orang hanya mendapatkan apa yang ia niatkan.",
    meaning:
      "Pembuka kitab Shahih Bukhari — hadis pertama — menunjukkan semua amal dinilai dari arah hatinya, bukan bentuk luarnya.",
    practice:
      "Sebelum bekerja, berdagang, bahkan beristirahat, niatkan untuk kebaikan. Amal biasa pun bernilai pahala bila niatnya benar.",
  },
  {
    id: "ilmu-hadis",
    topics: ["ilmu", "belajar", "menuntut ilmu", "menuntut ilmu", "pendidikan", "mencari ilmu"],
    citation: "HR Muslim no. 2699",
    grade: "shahih",
    text: "Barangsiapa menempuh jalan untuk mencari ilmu, Allah akan memudahkan baginya jalan menuju surga.",
    meaning:
      "Mencari ilmu bukan sekadar menambah pengetahuan — ia adalah jalan menuju surga yang Allah mudahkan.",
    practice:
      "Jadwalkan waktu belajar ilmu agama setiap hari walau 15 menit, dan mulai dari yang paling dibutuhkan: ilmu salat dan puasa yang kita lakukan tiap hari.",
  },
  {
    id: "iqra",
    topics: ["membaca", "iqra", "ayat pertama", "mulai belajar"],
    citation: "QS Al-'Alaq: 1",
    text: "Bacalah dengan (menyebut) nama Tuhanmu yang menciptakan.",
    meaning:
      "Ayat pertama yang diturunkan kepada Nabi Muhammad ﷺ — wahyu pembuka dimulai dari perintah membaca, menunjukkan betapa mulianya ilmu.",
    practice:
      "Mulai dari satu halaman Al-Quran dan terjemahannya setiap hari. Konsistensi kecil mengalahkan semangat besar yang sesekali.",
  },
  {
    id: "sedekah-ayat",
    topics: ["sedekah", "infak", "menafkahkan harta", "berbagi", "derma"],
    citation: "QS Al-Baqarah: 261",
    text: "Perumpamaan orang yang menafkahkan hartanya di jalan Allah seperti sebutir biji yang menumbuhkan tujuh tangkai; pada setiap tangkai ada seratus biji. Allah melipatgandakan bagi siapa yang Dia kehendaki.",
    meaning:
      "Satu sedekah dilipatgandakan minimal 700 kali — dan Allah berjanji menambah lagi sesuai kehendak-Nya.",
    practice:
      "Sisihkan sedekah rutin sekecil apa pun, walai Rp1.000 per hari. Konsisten lebih dicintai daripada besar tapi sekali.",
  },
  {
    id: "sedekah-hadis",
    topics: ["sedekah mengurangi harta", "takut miskin karena sedekah", "rezeki"],
    citation: "HR Muslim no. 2588",
    grade: "shahih",
    text: "Tidaklah sedekah mengurangi harta. Dan tidaklah seseorang memaafkan (kesalahan orang) kecuali Allah meninggikan derajatnya.",
    meaning:
      "Logika dunia bilang memberi = berkurang; logika iman bilang memberi = bertambah, karena sedekah datang kembali dalam bentuk lain.",
    practice:
      "Bila ragu sedekah karena takut kurang, ingat ayat ini — sedekah justru jalan pintas rezeki yang tidak terduga.",
  },
  {
    id: "senyum",
    topics: ["senyum", "senyummu", "kebaikan kecil", "buat orang senang"],
    citation: "HR Tirmidzi no. 1956",
    grade: "hasan",
    text: "Senyummu di wajah saudaramu adalah sedekah.",
    meaning:
      "Ibadah bukan hanya ritual — kebaikan sesederhana tersenyum kepada orang lain pun bernilai sedekah.",
    practice:
      "Hari ini coba berikan satu kebaikan kecil gratis: senyum, sapa ramah, atau bantu orang tua angkat barangnya.",
  },
  {
    id: "shalat-ayat",
    topics: ["shalat", "sholat", "salat", "ibadah", "menjauhi maksiat"],
    citation: "QS Al-'Ankabut: 45",
    text: "Dan laksanakanlah salat. Sungguh, salat itu mencegah dari perbuatan keji dan mungkar.",
    meaning:
      "Salat yang khusyuk otomatis membentengi dari maksiat — efeknya terasa bertahap, bila salatnya ditegakkan sungguh-sungguh.",
    practice:
      "Perbaiki kualitas salat sebelum menambah kuantitas ibadah: hadir hati, pahami bacaannya, dan tepati waktunya.",
  },
  {
    id: "shalat-lima",
    topics: ["shalat lima waktu", "rukun islam", "pondasi islam", "lima waktu"],
    citation: "HR Bukhari no. 8",
    grade: "shahih",
    text: "Islam didirikan atas lima (perkara): kesaksian bahwa tiada Tuhan selain Allah dan Muhammad adalah utusan Allah, mendirikan salat, menunaikan zakat, haji ke Baitullah, dan puasa Ramadan.",
    meaning:
      "Salat adalah pilar kedua Islam — fondasi yang kalau tegak, amal-amal lain ikut terbangun di atasnya.",
    practice:
      "Jika susah salat 5 waktu sekaligus, mulai dari yang paling mudah hilang: jaga salat Subuh dan Isya dengan alarm khusus.",
  },
  {
    id: "wudhu",
    topics: ["wudhu", "wudu", "bersuci", "kesucian", "thaharah"],
    citation: "HR Abu Dawud no. 61",
    grade: "shahih",
    text: "Tidak sah salat seseorang sampai ia berwudhu.",
    meaning:
      "Kesucian lahir adalah syarat sahnya salat — wudhu bukan formalitas, tapi gerbang masuk menghadap Allah.",
    practice:
      "Belajar wudhu sesuai sunnah: niat, urutan anggota wudhu, dan doa setelahnya. Kehalusannya bisa ditanyakan ke ustadz fiqih terverifikasi.",
  },
  {
    id: "puasa-ayat",
    topics: ["puasa", "ramadan", "shaum", "siyam"],
    citation: "QS Al-Baqarah: 183",
    text: "Wahai orang-orang yang beriman! Diwajibkan atas kamu berpuasa sebagaimana diwajibkan atas orang-orang sebelum kamu agar kamu bertakwa.",
    meaning:
      "Tujuan akhir puasa bukan lapar, tapi takwa: kesadaran hidup yang menjaga diri dari larangan Allah sepanjang tahun.",
    practice:
      "Isi waktu puasa dengan membaca Al-Quran dan mengurangi gosip. Puasa yang hanya menahan lapar tanpa menjaga lisan, manfaatnya terbatas.",
  },
  {
    id: "puasa-hadis",
    topics: ["pahala puasa", "puasa untuk allah", "balasan puasa"],
    citation: "HR Bukhari no. 1904",
    grade: "shahih",
    text: "Setiap amal anak Adam adalah untuknya, kecuali puasa — ia untuk-Ku dan Akulah yang akan membalasnya.",
    meaning:
      "Puasa adalah ibadah rahasia: tidak ada yang melihat kecuali Allah, karena itu balasannya juga khusus dari-Nya.",
    practice:
      "Jaga puasa sunnah seperti Senin-Kamis atau puasa Dawud (sehari puasa sehari tidak) bila mampu.",
  },
  {
    id: "doa-ayat",
    topics: ["doa", "berdoa", "doa dikabulkan", "terkabul"],
    citation: "QS Al-Baqarah: 186",
    text: "Dan apabila hamba-hamba-Ku bertanya kepadaku (tentang) Aku, maka sesungguhnya Aku dekat. Aku menyambut seruan orang yang berdoa apabila ia memohon kepada-Ku.",
    meaning:
      "Allah mendekat tanpa perantara waktu kita berdoa — doa adalah momen paling dekat antara hamba dan Rabbnya.",
    practice:
      "Perbanyak doa di waktu-waktu mustajab: sepertiga malam terakhir, antara adzan dan iqamah, dan saat sujud.",
  },
  {
    id: "doa-ibadah",
    topics: ["doa adalah ibadah", "inti ibadah", "makna doa"],
    citation: "HR Tirmidzi no. 3371",
    grade: "hasan shahih",
    text: "Doa adalah inti (hakikat) ibadah.",
    meaning:
      "Doa bukan pelengkap, melainkan jantungnya ibadah — tanda tawakal dan pengakuan kebutuhan hamba kepada Allah.",
    practice:
      "Jangan hanya berdoa saat sulit. Biasakan berdoa dan bersyukur juga saat keadaan baik.",
  },
  {
    id: "nikah-ayat",
    topics: ["nikah", "pernikahan", "menikah", "pasangan", "rumah tangga", "mawaddah"],
    citation: "QS Ar-Rum: 21",
    text: "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih (mawaddah) dan sayang (rahmah).",
    meaning:
      "Tujuan nikah adalah sakinah (tenteram), mawaddah (kasih), dan rahmah (sayang) — bukan sekadar status atau harta.",
    practice:
      "Dalam rumah tangga, ukur keberhasilan dari seberapa tenteram suasananya, bukan dari perbandingan dengan keluarga lain.",
  },
  {
    id: "nikah-hadis",
    topics: ["saran menikah", "pemuda menikah", "waktu menikah", "menjaga pandangan"],
    citation: "HR Bukhari no. 5065",
    grade: "shahih",
    text: "Wahai para pemuda! Siapa di antara kalian yang sudah mampu, maka menikahlah. Karena menikah lebih menundukkan pandangan dan lebih menjaga kemaluan.",
    meaning:
      "Islam memandang nikah sebagai benteng praktis bagi pemuda — bukan beban, tapi pelindung.",
    practice:
      "Siapkan diri bertahap: fisik, ilmu agama, dan kemandirian. Konsultasikan waktu yang tepat ke orang tua dan ustadz pembina.",
  },
  {
    id: "orangtua",
    topics: ["orang tua", "ibu", "ayah", "bapak", "berbakti", "durhaka"],
    citation: "QS Al-Isra: 23",
    text: "Dan Tuhanmu telah memerintahkan agar kamu tidak menyembah selain Dia dan berbuat baik kepada ibu dan ayahmu. Jika salah seorang di antara keduanya atau keduanya mencapai umur tua dalam pemeliharaanmu, maka jangan sekali-kali engkau mengatakan 'ah' dan jangan engkau membentak mereka.",
    meaning:
      "Berbakti kepada orang tua disandingkan dengan tauhid — dan larangan termunculnya bahkan hanya berkata 'ah', menunjukkan tingginya derajat keduanya.",
    practice:
      "Hubungi ibu/ayah hari ini juga. Kalimat sederhana 'aku sayang ibu' lebih berarti daripada bunga di hari spesial saja.",
  },
  {
    id: "hati-tenang",
    topics: ["gelisah", "hati tidak tenang", "cemas", "overthinking", "tenang", "dzikir"],
    citation: "QS Ar-Ra'd: 28",
    text: "(Yaitu) orang-orang yang beriman dan hati mereka menjadi tenang dengan mengingat Allah. Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.",
    meaning:
      "Kegelisahan sering bukan soal masalah yang banyak, tapi hati yang jauh dari Pemiliknya. Dzikir adalah penyegar hati yang paling langsung.",
    practice:
      "Coba dzikir sederhana saat cemas: subhanallah, alhamdulillah, la ilaha illallah, allahu akbar — diulang sambil merenungi maknanya.",
  },
  {
    id: "putus-asa",
    topics: ["putus asa", "berdosa banyak", "dosa besar", "apakah allah ampuni", "harapan"],
    citation: "QS Az-Zumar: 53",
    text: "Katakanlah: Wahai hamba-hamba-Ku yang melampaui batas terhadap dirinya sendiri! Janganlah kamu berputus asa dari rahmat Allah. Sesungguhnya Allah mengampuni dosa-dosa semuanya.",
    meaning:
      "Pintu taubat tidak pernah tertutup selama masih hidup. Satu-satunya dosa yang tak terampuni adalah putus asa dari rahmat Allah.",
    practice:
      "Lakukan taubat sekarang: berhenti dari dosanya, menyesal, memohon ampun, dan berniat tidak mengulang. Coba lagi bila terulang — itu bagian dari proses.",
  },
  {
    id: "taubat-hadis",
    topics: ["semua manusia berbuat salah", "manusia tidak luput salah", "terbaik yang salah"],
    citation: "HR Tirmidzi no. 2499",
    grade: "hasan shahih",
    text: "Setiap anak Adam pasti berbuat salah, dan yang terbaik di antara para pemalalah (yang bersalah) adalah mereka yang bertaubat.",
    meaning:
      "Salah itu manusiawi; yang membedakan adalah responsnya. Yang terbaik bukan yang tak pernah salah, tapi yang kembali (taubat).",
    practice:
      "Jadikan taubat kebiasaan harian, misalnya istighfar 100 kali sehari — Nabi ﷺ sendiri memohon ampun lebih dari 70 kali sehari.",
  },
  {
    id: "tawakal",
    topics: ["tawakal", "pasrah", "usaha dan tawakal", "perencanaan", "khawatir masa depan"],
    citation: "QS At-Talaq: 3",
    text: "Dan barangsiapa bertawakal kepada Allah, niscaya Allah akan mencukupkan (keperluan)nya. Sesungguhnya Allah melaksanakan urusan (yang dikehendaki-Nya). Allah telah mengadakan ketentuan untuk tiap-tiap sesuatu.",
    meaning:
      "Tawakal bukan pasrah tanpa usaha — tawakal adalah ikhtiar maksimal lalu menyerahkan hasilnya kepada Allah.",
    practice:
      "Usahakan sepenuh hati, rencanakan dengan matang, lalu lepaskan cemasnya lewat doa. Hasil akhir ada di tangan Allah.",
  },
  {
    id: "taawun",
    topics: ["tolong menolong", "gotong royong", "bantu sesama", "kerja sama", "kolaborasi"],
    citation: "QS Al-Maidah: 2",
    text: "Dan tolong-menolonglah kamu dalam (mengerjakan) kebajikan dan takwa, dan jangan tolong-menolong dalam berbuat dosa dan permusuhan.",
    meaning:
      "Kerja sama itu disyariatkan — batasnya jelas: dalam kebaikan dan takwa boleh, dalam dosa dan permusuhan tidak.",
    practice:
      "Bila diminta tolong, tawakal periksa dulu baik-buruknya, lalu bantu dengan ikhlas. Tak mampu? Tunjukkan jalan ke yang mampu.",
  },
  {
    id: "jujur",
    topics: ["jujur", "kejujuran", "dusta", "berbohong", "amanah"],
    citation: "HR Bukhari no. 6094",
    grade: "shahih",
    text: "Wajib bagi kalian berkata benar, karena kebenaran mengantarkan kepada kebajikan, dan kebajikan mengantarkan ke surga.",
    meaning:
      "Kejujuran adalah pintu berantai ke kebaikan; sedangkan dusta pintu berantai ke maksiat.",
    practice:
      "Mulai dari jujur pada hal kecil: jam datang, jumlah uang kembalian, dan pekerjaan yang diminta orang lain.",
  },
  {
    id: "waktu-asr",
    topics: ["waktu", "umur", "masa muda", "menghargai waktu", "manfaatkan waktu"],
    citation: "QS Al-'Asr: 1-3",
    text: "Demi masa. Sungguh, manusia berada dalam kerugian, kecuali orang-orang yang beriman dan mengerjakan kebajikan serta saling menasihati untuk kebenaran dan saling menasihati untuk kesabaran.",
    meaning:
      "Tanpa iman, amal, dan nasihat-menasihati, manusia dalam keadaan rugi — waktu adalah modal yang tidak bisa dikembalikan.",
    practice:
      "Akhiri hari dengan evaluasi tiga hal: apakah iman bertambah, apakah ada amal nyata, dan apakah ada orang yang saya bantu hari ini.",
  },
  {
    id: "mudah-selepas-berat",
    topics: ["kesabaran menghadapi masalah", "berat disertai kemudahan", "mengeluh", "capek"],
    citation: "QS Al-Insyirah: 6",
    text: "Sesungguhnya sesudah kesulitan itu ada kemudahan.",
    meaning:
      "Allah menjanjikan kemudahan setelah kesulitan — dan dalam tafsir banyak ulama, kemudahannya bahkan digandakan (dua kali disebut di ayat sebelum dan sesudahnya).",
    practice:
      "Kalau sekarang berat, hitung nikmat yang masih ada hari ini. Ujian selalu punya batas waktu yang ditetapkan Allah.",
  },
];

/* ------------------------- pencarian dalil ------------------------- */

function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/\s+/g, " ").trim()} `;
}

/**
 * Cari dalil yang topiknya cocok dengan pertanyaan.
 * Skor = jumlah kata kunci topik yang muncul; ambil kandidat terbaik,
 * maksimal 3 entri agar jawaban tetap ringkas.
 */
export function findDalil(message: string): DalilEntry[] {
  const msg = normalize(message);
  const scored = DALIL_DATA.map((d) => ({
    entry: d,
    score: d.topics.reduce(
      (acc, t) => (msg.includes(` ${t}`) || msg.includes(`${t} `) ? acc + 1 : acc),
      0
    ),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored.map((x) => x.entry);
}

/** Jumlah dalil di basis data — untuk kalimat transparansi. */
export function dalilCount(): number {
  return DALIL_DATA.length;
}

/** Daftar topik yang tersedia — untuk pesan bantu. */
export function dalilTopics(): string[] {
  const all = DALIL_DATA.flatMap((d) => d.topics);
  return Array.from(new Set(all)).sort().slice(0, 24);
}
