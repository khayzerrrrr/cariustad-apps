# Deskripsi Proyek — siap salin ke formulir

> Teks di bawah menjawab tiga bagian wajib sekaligus: (1) Gambaran Umum + skenario dunia nyata,
> (2) Desain Solusi Komprehensif (arsitektur bisnis & teknis + peran prompt), (3) Nilai Bisnis.
> Salin seluruh blok, atau potong per bagian bila formulir memisahkannya.

---

## 1. Gambaran Umum Proyek

**Skenario target & pengguna.** Takmir masjid yang satu orang itu — mengurus jadwal kajian,
mendatangkan penceramah, mengoordinasi acara, sambil mengurus pekerjaan lain. Sekunder:
admin pesantren dan lembaga dakwah yang mengelola banyak ustadz dan banyak jadwal.

**Skenario dunia nyata.** Rapat pengurus masjid Selasa malam berakhir dengan keputusan:
"Bulan depan kajian fiqih untuk 50 orang di Bandung, Senin malam jam 7." Tidak ada yang
mencatat siapa ustadznya. Tiga hari kemudian keputusan itu masih sebatas notulen.
**Masalah inti** bukan sulitnya mencari nomor ustadz, melainkan pekerjaan administratif di
sekelilingnya: mencocokkan bidang keahlian dengan kebutuhan, memastikan jadwal tidak
bertabrakan dengan Salat Jumat atau waktu salat, menjaga ustadzah untuk majelis muslimah,
dan mencatat semuanya agar tidak ada yang terlupa.

**Proposisi nilai.** CariUstadz mengubah percakapan menjadi tindakan tercatat: takmir cukup
mengetik "booking ustadz kajian fiqih, Senin jam 19:00, Bandung, 50 orang" — agen mencari
kandidat, memeriksa aturan budaya, menyusun rencana, lalu berhenti menunggu persetujuan
manusia sebelum mengeksekusi. Keputusan rapat tidak lagi hilang di notulen.

## 2. Desain Solusi Komprehensif

**Arsitektur bisnis.** Direktori ustadz terverifikasi (483 profil, 54 kota) + agen percakapan
gratis bagi institusi; jalur komersial berupa langganan bulanan untuk pesantren/lembaga dan
biaya per booking berhasil untuk penyelenggara acara.

**Arsitektur teknis.** Next.js 14 (App Router) + TypeScript. Seluruh panggilan LLM melewati
route server `/api/llm` — kunci API tidak pernah menyentuh browser. Alur agent 11 langkah:
Input → Prompt Guard (23 pola injeksi ID+EN) → Scope Guard → Parse niat → Pencarian →
Cultural Rules (Salat Jumat, waktu salat, gender) → Klarifikasi → Susun rencana →
**Persetujuan manusia** → Eksekusi → Audit Log. Tanpa kunci API pun aplikasi berjalan penuh
dengan mesin aturan lokal deterministik.

**Bagaimana perintah mendorong generasi AI.** Model tidak pernah mengarang sendiri: mesin
lokal menghitung draf final (kandidat ustadz, urutan, link undang, peringatan waktu), lalu
system prompt berlapis mengunci generasi — "jawab HANYA dari data terverifikasi, dilarang
mengubah angka/nama/hari, detail yang tidak tertulis berarti tidak ada". Keluaran model
divalidasi setelahnya: nama ustadz yang tidak ada di database atau hari yang dikarang
ditolak (HTTP 422) dan jawaban lokal yang benar dipakai. Untuk pertanyaan dalil, mode
Ustadz Hafizh mengunci kutipan pada dataset 26+ ayat/hadis shahih dengan tautan verifikasi
per kutipan. Aturan budaya (Salat Jumat 11:30–13:00, jeda waktu salat, preferensi gender)
berjalan sebagai kode, bukan inferensi model — hasilnya tidak berubah-ubah.

## 3. Nilai Bisnis

- **Waktu administrasi** dari berbulan-bulan telepon dan pencocokan jadwal manual menjadi
  satu percakapan: proses booking terukur dalam hitungan menit per acara.
- **Nol booking tanpa persetujuan** — dijamin secara struktural (tidak ada jalur kode yang
  melewati langkah persetujuan), bukan sekadar kebijakan.
- **118 pemeriksaan otomatis** (route, batas domain, prompt injection, grounding dalil,
  suara, lip-sync) semuanya lulus pada commit yang disubmit, diuji langsung terhadap
  production — bisa diulang siapa saja dengan satu perintah.
- **Biaya operasional rendah dan bisa diprediksi**: penolakan ditentukan sebelum panggilan
  LLM — 5 dari 7 jalur yang diuji tidak memanggil model sama sekali, sehingga biaya per
  penolakan adalah nol dan batas domain tidak bisa dinegosiasikan lewat prompt.
- **Kepatuhan**: selaras dengan PP 33/2026 tentang tata kelola AI — manusia memegang
  keputusan akhir, batas kewenangan terdokumentasi, setiap tindakan tercatat di audit log.
