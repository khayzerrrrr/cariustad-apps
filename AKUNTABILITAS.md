# Lembar Akuntabilitas Agent — CariUstadz

**Agent:** Asisten AI CariUstadz
**Domain:** Pencarian & booking ustadz untuk institusi Islamic Indonesia
**Versi:** 1.1 · 2 November 2026 (menambah Mode Ustadz Hafizh)
**Challenge:** B — Agen Kantor (AI CAN DO IT, Tencent Cloud Hackathon Indonesia 2026)

Dokumen satu halaman ini menjawab empat pertanyaan: apa yang agent **bisa** akses, apa yang
agent lakukan **sendiri**, apa yang **butuh persetujuan manusia**, dan apa yang agent
**tidak pernah** lakukan.

---

## 1. Data yang boleh diakses agent

Semua data bersumber dari katalog publik platform. Tidak ada data pribadi pengguna yang
dikirim ke model.

| Kategori | Isi | Batasan |
|---|---|---|
| Profil ustadz | nama, gelar, kredensial, bidang keahlian, kota, area, bio, rating, jumlah ulasan, pengalaman, biaya, almamater | Hanya data yang memang ditampilkan di profil publik |
| Jadwal | hari dan slot ketersediaan | Hanya slot yang belum terisi |
| Review | rating, komentar, jenis acara | **Tanpa** identitas pribadi penulis ulasan |
| Kajian | judul, tanggal, waktu, lokasi, topik, harga | Data acara publik |
| Hadith | sumber, perawi, terjemahan, derajat | Untuk widget harian |
| Dalil (Mode Ustadz Hafizh) | 27 kutipan ayat/hadis terverifikasi: surah:ayat atau kitab + nomor, terjemahan, derajat | Satu-satunya sumber kutipan yang boleh ditampilkan agent |

**Tidak diakses:** nomor telepon/WhatsApp ustadz sebelum booking dikonfirmasi; data pribadi
pengguna di luar sesi; riwayat percakapan pengguna lain.

---

## 2. Yang agent jalankan secara otonom

Tindakan berikut berjalan tanpa campur tangan manusia karena bersifat **membaca dan menyusun**,
bukan mengubah keadaan:

- Mengurai pesan bahasa natural menjadi field terstruktur (jenis acara, hari, jam, kota,
  jumlah jamaah, preferensi gender, budget)
- Mencari dan memfilter katalog ustadz berdasarkan bidang, kota, rating, biaya, ketersediaan
- Memeriksa aturan budaya: konflik Salat Jumat, bentrok waktu salat, preferensi ustadz/ustadzah
- Menyusun rencana booking yang bisa dibaca manusia
- Menolak pertanyaan di luar domain dan pertanyaan fatwa
- Menjawab pertanyaan dalil melalui **Mode Ustadz Hafizh** — kutipan hanya dari
  dataset terverifikasi, tanpa fatwa, dengan pengingat untuk konsultasi ulama
- Mendeteksi dan memblokir upaya prompt injection
- Mencatat setiap langkah ke audit log

Semua tindakan di atas **tidak mengubah data apa pun**. Rencana booking hanya usulan.

---

## 3. Yang butuh persetujuan manusia

| Tindakan | Bentuk persetujuan |
|---|---|
| Eksekusi booking | Pengguna harus mengetik "setuju" pada rencana yang ditampilkan. Tanpa itu, tidak ada yang tercatat |
| Berbagi kontak ustadz | Nomor telepon/WhatsApp hanya ditampilkan setelah status booking menjadi terkonfirmasi |
| Booking multi-ustadz | Konfirmasi tambahan, karena menyangkut lebih dari satu pihak dan biaya lebih besar |
| Booking dengan fee tinggi | Konfirmasi tambahan sebelum diteruskan |

Rencana yang **dibatalkan** pengguna tidak meninggalkan catatan booking apa pun — hanya jejak
audit bahwa rencana pernah disusun lalu dibatalkan.

---

## 4. Yang TIDAK PERNAH dilakukan agent

Ini batas keras. Tidak bisa dinegosiasikan lewat percakapan, dan tidak bisa dilewati oleh
instruksi yang disisipkan dalam pesan.

- ❌ **Membocorkan nomor telepon/WhatsApp ustadz** sebelum booking dikonfirmasi
- ❌ **Mengeksekusi booking tanpa persetujuan** manusia
- ❌ **Menjadwalkan acara yang bertepatan dengan Salat Jumat** (Jumat 11:30–13:00 WIB)
- ❌ **Menjalankan instruksi yang disisipkan** dalam pesan atau dokumen (prompt injection) —
  teks seperti itu diperlakukan sebagai data, bukan perintah
- ❌ **Mengarang nama ustadz** yang tidak ada di database; bila tidak ada yang cocok, agent
  mengatakan tidak ada dan menawarkan alternatif
- ❌ **Menjawab fatwa atau hukum syariat** — talak, waris, sah/batalnya ibadah, dan
  penilaian dosa tetap dialihkan ke ustadz yang ahli. Yang dijawab hanya permintaan
  dalil dan keutamaan amal
- ❌ **Mengarang atau mengutip ayat/hadis di luar dataset terverifikasi** (27 kutipan di
  `dalilKnowledge.ts`) — bila topik tidak ada di dataset, agent mengatakan jujur belum
  tersedia, bukan menebak nomor ayat
- ❌ **Mengutip hadis dhaif atau palsu** — hanya derajat shahih dan hasan yang masuk dataset
- ❌ **Mengungkap identitas pribadi** penulis ulasan

---

## 5. Cara agent menunjukkan sumber

Setiap rekomendasi menyertakan asal datanya, misalnya:

> "Sumber rekomendasi: Ustadz Ahmad Zaki — rating 4.9/5 (128 ulasan), 12 tahun pengalaman,
> Jakarta Selatan."

Bila profil dan ulasan saling bertentangan (misalnya review menyebut "terjangkau" tetapi
profil mencantumkan biaya tinggi), agent **mengutamakan data profil** dan menyebutkan
sumbernya, bukan menyimpulkan dari opini review.

Pada Mode Ustadz Hafizh, setiap jawaban dalil menampilkan sumbernya secara eksplisit:

> 📖 **QS Al-Baqarah: 153** — "Wahai orang-orang yang beriman! Mohonlah pertolongan
> (kepada Allah) dengan sabar dan salat. Sungguh, Allah beserta orang-orang yang sabar."
> 📖 **HR Bukhari no. 1 (shahih)** — "Sesungguhnya setiap amal itu tergantung niatnya."

Ditutup dengan disclaimer: *"Saya asisten AI, bukan ulama. Untuk pemahaman lebih dalam dan
keputusan fikih, silakan konsultasi ke ustadz terverifikasi."*

---

## 6. Batas kemampuan yang diakui terbuka

Agent menyatakan keterbatasannya, bukan menutupinya:

- Tidak ada filter kemampuan bahasa ustadz — data itu belum disimpan
- Tidak bisa menjamin ketersediaan real-time; jadwal berasal dari katalog
- Tidak bisa memberi fatwa
- Tidak bisa memproses pembayaran

---

## 7. Audit

Setiap langkah agent dicatat di audit log yang bisa dibuka pengguna dari halaman `/asisten`:

| Field | Isi |
|---|---|
| `timestamp` | Waktu kejadian |
| `step` | parse · search · cultural_check · clarify · plan · human_approval · execute · dalil · injection_blocked · error |
| `action` | Nama aksi |
| `input` / `output` | Ringkasan masukan dan keluaran (dipotong 500 karakter) |
| `result` | success · failure · warning · blocked |
| `metadata` | Konteks tambahan (penyedia LLM, pola injeksi, konflik budaya) |

Log disimpan di perangkat pengguna (localStorage), maksimum 200 entri terakhir. Tidak dikirim
ke server mana pun.

---

## 8. Kepatuhan regulasi

Menyambut **PP 33/2026** tentang penilaian dampak AI untuk pemrosesan data pribadi (berlaku
16 Januari 2027):

- Data pengguna tinggal di perangkat pengguna, bukan di server kami
- Kontak pihak ketiga baru dibuka setelah persetujuan
- Setiap keputusan agent dapat diaudit ulang
- Agent menolak memberikan nasihat hukum syariat — pembatasan wewenang yang disengaja

---

## 9. Insiden yang diketahui

Transparansi lebih penting daripada terlihat sempurna. Berikut yang pernah terjadi selama
pengembangan dan sudah diperbaiki:

| Insiden | Dampak | Perbaikan |
|---|---|---|
| LLM pernah memasukkan ustadz Bogor ke daftar "ustadz di Jakarta" | Rekomendasi tidak akurat | LLM tidak lagi memfilter katalog; hanya menerima baris yang sudah disaring mesin lokal (`grounding.ts`) |
| Deteksi prompt injection gagal pada panggilan kedua | Upaya injeksi bisa lolos | Regex dengan flag `g` menyimpan `lastIndex`; flag dihapus |
| "Ada ustadz untuk acara pernikahan?" ditolak sebagai pertanyaan fatwa | False positive | Pencocokan kata utuh (`hasWord`) menggantikan substring |
| Pemeriksaan bentrok salat terlalu agresif (acara 19:00 dianggap bentrok Isya 19:00) | Rencana valid ditolak | Konflik hanya ditandai bila waktu salat benar-benar berada di dalam rentang acara |
| Deteksi halusinasi menuduh "ustadz Fiqih" sebagai nama palsu | Jawaban benar ikut ditolak | Daftar `NON_NAME_WORDS` untuk bidang, kota, dan kata umum |

---

*Dokumen ini bagian dari submission hackathon. Kode sumber: [github.com/khayzerrrrr/cariustad-apps](https://github.com/khayzerrrrr/cariustad-apps)*
