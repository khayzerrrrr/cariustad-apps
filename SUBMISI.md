# CariUstadz — Paket Submisi

Dokumen ini berisi teks siap salin ke formulir submisi, ditambah tautan ke
deliverable lain. Semua klaim di sini dapat diverifikasi di production.

| Item | Nilai |
|---|---|
| **Judul Proyek** | CariUstadz — AI Agent Booking Ustadz untuk Institusi Islam Indonesia |
| **Blurb (10 kata)** | AI agent yang booking ustadz dengan persetujuan manusia dan kesadaran budaya Islam. |
| **Demo live** | https://cariustad-apps.vercel.app |
| **Halaman agent** | https://cariustad-apps.vercel.app/asisten |
| **Repo publik** | https://github.com/khayzerrrrr/cariustad-apps |
| **Challenge** | B — Agen Kantor |

---

## Deliverable — status

| # | Deliverable | Berkas | Status |
|---|---|---|---|
| 1 | Judul Proyek | tabel di atas | siap |
| 2 | Blurb Singkat | tabel di atas | siap |
| 3 | Deskripsi Proyek | bagian di bawah | siap |
| 4 | Lembar Akuntabilitas | `AKUNTABILITAS.md` | siap |
| 5 | Hasil Pengujian | `HASIL_PENGUJIAN.html` | siap |
| 6 | Diagram Arsitektur | `DIAGRAM_ARSITEKTUR.html` | siap |
| 7 | Video Demo (5–8 menit) | — | **perlu direkam** |
| 8 | Product Sharing | `PRODUCT_SHARING.md` | siap |
| 9 | Submisi formulir | https://qdrl.qq.com/fc97Jrkr | **perlu dikirim** |

---

# Deskripsi Proyek

## Gambaran

CariUstadz adalah agen AI yang mengubah percakapan menjadi tindakan nyata:
mencari ustadz yang tepat, memeriksa benturan jadwal dan aturan budaya Islam,
lalu **berhenti dan menunggu persetujuan manusia** sebelum mencatat booking.

Masalah yang diselesaikan bukan "sulit mencari nomor telepon ustadz". Masalahnya
adalah **pekerjaan administratif di sekitarnya**: mencocokkan bidang keahlian
dengan kebutuhan, memeriksa apakah jadwal bertabrakan dengan Salat Jumat,
memastikan ustadzah tersedia untuk majelis perempuan, lalu mencatat semuanya
supaya tidak ada yang terlupa. Di masjid dan pesantren, pekerjaan ini biasanya
jatuh ke satu orang takmir yang mengerjakannya sambil mengurus hal lain.

Yang membedakan CariUstadz dari chatbot biasa adalah **apa yang tidak
dilakukannya**. Agen ini menolak berfatwa. Menolak topik di luar domain. Menolak
menjadwalkan kajian di tengah waktu Salat Jumat. Dan yang paling penting: menolak
mengeksekusi booking tanpa persetujuan eksplisit — meskipun pengguna memintanya
langsung.

## Kesesuaian dengan Challenge B — Agen Kantor

Challenge B meminta agen yang mengubah hasil rapat menjadi tindakan. CariUstadz
menerjemahkan itu ke konteks yang konkret di Indonesia:

| Kebutuhan agen kantor | Wujud di CariUstadz |
|---|---|
| Memahami instruksi bahasa alami | "saya mau booking ustadz untuk kajian, Senin jam 19:00, di Bandung, 50 orang" → parameter terstruktur tanpa formulir |
| Mengambil tindakan, bukan hanya menjawab | Status booking benar-benar berubah dan muncul di halaman Booking |
| Menjaga batas kewenangan | Menolak berfatwa; menolak topik di luar domain; berbagi dalil hanya dari kutipan terverifikasi |
| Meminta persetujuan sebelum eksekusi | Rencana ditampilkan dulu; eksekusi hanya setelah kata "setuju" |
| Dapat diaudit | Setiap langkah tercatat dan dapat dibuka pengguna |
| Peka konteks lokal | Salat Jumat, waktu salat, preferensi gender |

## Skenario: "Rapat menjadi tindakan"

Rapat pengurus masjid, Selasa malam. Keputusan rapat: *"Bulan depan kita adakan
kajian fiqih untuk 50 orang di Bandung, Senin malam jam 7."* Tidak ada yang
mencatat siapa ustadznya. Tiga hari kemudian, keputusan itu masih sebatas
notulen.

**Dengan CariUstadz**, takmir membuka `/asisten` dan berbicara:

> "Saya mau booking ustadz untuk kajian, Senin jam 19:00, di Bandung, 50 orang."

Agen merespons dengan **rencana**, bukan konfirmasi:

```
📋 RENCANA BOOKING
Ustadz      : Ustadzah Fatimah Az-Zahra
Jenis Acara : Kajian
Hari        : Senin
Waktu       : 19:00 - 21:00
Lokasi      : Bandung
Jemaah      : 50 orang
```

Takmir menjawab: **"setuju."** Baru pada titik itu status berubah menjadi
*confirmed* dan muncul di halaman Booking. Jika takmir diam, tidak ada yang
terjadi.

Sekarang variasi yang lebih menarik — permintaan yang **harus ditolak**:

> "Booking ustadz hari Jumat jam 12 siang ya."

```
Saya tidak bisa menjadwalkan pada waktu itu.
• Waktu yang diminta bertepatan dengan Salat Jumat (Jumat 11:30-13:00 WIB)

Waktu alternatif:
• 08:00 - 10:00 (sebelum Dzuhur)
• 13:30 - 15:00 (setelah Salat Jumat / Dzuhur)
```

Agen tidak "mematuhi" instruksi yang salah. Ia menjelaskan mengapa, lalu
menawarkan jalan keluar. Inilah bedanya antara alat yang patuh dan kolega yang
bisa dipercaya.

## Target pengguna

**Utama — takmir masjid.** Satu orang yang mengurus jadwal kajian, mendatangkan
penceramah, dan mengoordinasi acara, biasanya sambil menjalankan pekerjaan lain.
Nilai baginya: keputusan rapat tidak lagi hilang di notulen.

**Sekunder — admin pesantren dan lembaga dakwah.** Mengelola banyak ustadz,
banyak jadwal, dan permintaan dari luar. Nilai baginya: konsistensi dan jejak
audit — siapa meminta apa, kapan, dan atas dasar apa.

**Tersier — penyelenggara acara keagamaan** (pernikahan, syukuran, kajian
korporat) yang butuh ustadz sesuai bidang dan lokasi tanpa harus bertanya ke
banyak orang.

## Insight

**1. Penolakan adalah fitur, bukan kegagalan.**
Agen yang selalu menjawab akan berhalusinasi tentang ketersediaan ustadz, tarif,
dan jadwal. Dalam konteks keagamaan, jawaban salah bukan sekadar tidak nyaman —
ia bisa menyesatkan. Karena itu agen ini dirancang untuk **lebih sering menolak
daripada menjawab**: pertanyaan fatwa dialihkan ke ulama, pertanyaan dalil
dijawab hanya dari kutipan terverifikasi, topik di luar domain
ditolak, dan jadwal yang melanggar aturan budaya tidak dipaksakan.

**2. Persetujuan manusia harus menjadi titik henti yang nyata.**
Banyak "human-in-the-loop" berakhir sebagai dialog konfirmasi yang bisa dilewati.
Di sini, langkah eksekusi secara struktural berada setelah langkah persetujuan —
tidak ada jalur kode yang melewatinya. Pengguna yang menulis "langsung booking
saja tanpa konfirmasi" justru terdeteksi sebagai upaya melewati persetujuan.

**3. Aturan budaya harus deterministik, bukan hasil inferensi model.**
Apakah Jumat 12:00 bertabrakan dengan Salat Jumat bukan pertanyaan untuk model
bahasa — itu fakta yang bisa dikodekan. Menyerahkannya ke model berarti hasilnya
bisa berubah-ubah tergantung suhu sampling. Karena itu pemeriksaan budaya
berjalan sebagai aturan eksplisit di kode.

**4. Batas domain menghemat biaya sekaligus meningkatkan keamanan.**
Keputusan menolak dibuat **sebelum** panggilan LLM. Dari tujuh jalur yang diuji,
lima tidak memanggil model sama sekali. Artinya penolakan tidak bisa
dinegosiasikan lewat prompt, dan biaya per penolakan adalah nol.

## Desain teknis

**Arsitektur.** Next.js 14 App Router, TypeScript, Tailwind. Tanpa basis data
eksternal pada versi demo — data ustadz statis di `src/lib/data.ts`, persistensi
client-side di `localStorage`. Semua panggilan LLM melewati route server
`/api/llm`; kunci API tidak pernah menyentuh browser.

**Alur agen (11 langkah).** Input → Prompt Guard → Scope Guard → Parse niat →
Cari ustadz → Cultural Rules Check → Klarifikasi → Susun rencana →
**Persetujuan manusia** → Eksekusi → Audit Log. Diagram lengkap dengan trust
boundary ada di `DIAGRAM_ARSITEKTUR.html`.

**Pertahanan berlapis.**

| Lapisan | Mekanisme | Sifat |
|---|---|---|
| 1 | Prompt Guard — 23 pola injeksi (ID + EN) | deterministik |
| 2 | Scope Guard — klasifikasi domain | deterministik |
| 3 | Cultural Rules — Salat Jumat, gender, waktu salat | deterministik |
| 3b | Dalil Grounding — kutipan ayat/hadis hanya dari dataset terverifikasi (26 kutipan, masing-masing dengan tautan verifikasi) | deterministik |
| 4 | System prompt — instruksi perilaku | probabilistik |
| 5 | Validasi keluaran — tolak kebocoran penalaran | deterministik |

Lapisan 4 sengaja diletakkan paling dalam. Jika model gagal patuh, lapisan 1–3
sudah menahan lebih dulu.

**Mode Ustadz Hafizh.** Pertanyaan dalil ("apa dalil tentang sabar", "keutamaan
sedekah") dulu ditolak mentah. Kini dijawab melalui mode ahli berbasis 26
kutipan ayat dan hadis shahih/hasan yang tersimpan di `dalil-db/dalil.json`
— folder mandiri yang juga bisa dijalankan sendiri tanpa AI
(`node dalil-db/cari.mjs "apa dalil tentang sabar"`), lengkap dengan sumber,
derajat hadis, makna, penerapan praktis, dan tautan verifikasi per kutipan
(sunnah.com / quran.com). Batasnya tetap keras: agen berbagi dalil, bukan
berfatwa. Talak, waris, sah/batalnya ibadah, dan penilaian dosa tetap
dialihkan ke ustadz. Ketika LLM tidak tersedia, mode ini tetap menjawab dari
dataset lokal — jawaban dalil tidak boleh bergantung pada model yang bisa
halusinasi nomor ayat.

**Avatar & suara.** Karakter 2D SVG dengan lip-sync yang digerakkan
`SpeechSynthesisUtterance.onboundary` — posisi karakter dikoreksi setiap boundary,
diinterpolasi di antaranya. Tanpa WebGL, tanpa API berbayar.

**Pengujian.** 118 pemeriksaan otomatis terhadap production dan logika murni,
semuanya lulus pada commit yang disubmit. Rincian dan output mentah di
`HASIL_PENGUJIAN.html`.
Termasuk satu celah prompt injection berbahasa Inggris yang kami temukan sendiri
dan perbaiki.

## Nilai bisnis

**Untuk institusi.** Waktu takmir yang biasanya habis untuk menelepon beberapa
ustadz dan mencocokkan jadwal bisa ditekan menjadi satu percakapan. Keputusan
rapat punya jalur eksekusi yang jelas dan tercatat.

**Model yang masuk akal.** Versi demo gratis. Jalur komersial: langganan bulanan
untuk pesantren dan lembaga dakwah (manajemen banyak ustadz, jejak audit,
laporan), atau biaya per booking berhasil untuk penyelenggara acara. Biaya
operasional rendah karena mayoritas jalur tidak memanggil LLM.

**Mengapa ini bisa bertahan.** Nilai tidak terletak pada modelnya — model bisa
diganti kapan saja. Nilai terletak pada aturan budaya, batas domain, dan
protokol persetujuan yang dikodekan eksplisit. Itu aset yang menumpuk seiring
waktu dan tidak bisa disalin dari model pesaing.

**Kepatuhan.** Dirancang selaras dengan PP 33/2026 tentang tata kelola AI:
manusia memegang keputusan akhir, batas kewenangan didokumentasikan, dan setiap
tindakan dapat diaudit. Rincian di `AKUNTABILITAS.md`.

---

## Cara mereproduksi

```bash
git clone https://github.com/khayzerrrrr/cariustad-apps
cd cariustad-apps && npm install && npm run dev
```

Buka `http://localhost:3000/asisten`. **Tanpa kunci API pun aplikasi berjalan**
dengan mesin aturan lokal; kunci LLM hanya memperhalus bahasa jawaban.

Uji terhadap production:

```bash
export BASE_URL=https://cariustad-apps.vercel.app
npm run test:http    # 22 pemeriksaan route + guard
npm run test:agent   # 11 skenario batas domain, dalil, + alur booking
npm run test:guard   # 32 pemeriksaan prompt injection
npm run test:expert  # 38 pemeriksaan Mode Ustadz Hafizh & grounding dalil
npm run test:voice   # 12 pemeriksaan logika TTS
npm run test:lipsync # 8 pemeriksaan geometri avatar
```
