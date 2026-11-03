# CariUstadz — AI Agent Booking Ustadz untuk Institusi Islamic Indonesia

> **AI CAN DO IT — Tencent Cloud Hackathon Indonesia 2026** · Challenge B (Agen Kantor)

**Live demo:** https://cariustad-apps.vercel.app
**Halaman agent:** https://cariustad-apps.vercel.app/asisten

Platform pencarian & booking ustadz terverifikasi, dengan AI Agent yang menerima permintaan
bahasa natural (teks maupun suara), menyusun rencana booking, dan **tidak pernah mengeksekusi
apa pun tanpa persetujuan manusia**.

### Berkas submisi

| Deliverable | Berkas |
|---|---|
| Judul, blurb & deskripsi proyek | [`SUBMISI.md`](SUBMISI.md) |
| Lembar akuntabilitas | [`AKUNTABILITAS.md`](AKUNTABILITAS.md) |
| Hasil pengujian (output mentah) | [`HASIL_PENGUJIAN.html`](HASIL_PENGUJIAN.html) |
| Diagram arsitektur + trust boundary | [`DIAGRAM_ARSITEKTUR.html`](DIAGRAM_ARSITEKTUR.html) |
| Product sharing / nilai WorkBuddy | [`PRODUCT_SHARING.md`](PRODUCT_SHARING.md) |
| Panduan deploy | [`DEPLOY_VERCEL.md`](DEPLOY_VERCEL.md) |

---

## Masalah

Di Indonesia ada lebih dari 200 ribu masjid, ditambah pesantren dan sekolah Islam. Hampir
semuanya masih mengatur undangan ustadz secara manual: telepon, WhatsApp ke sana-sini, cek
jadwal di buku, lalu mencatat di kertas. Satu booking bisa memakan berhari-hari, dan bentrok
jadwal dengan Salat Jumat baru ketahuan di hari-H.

Permintaan dari jamaah pun datang dalam bentuk paling tidak terstruktur:

> "Assalamualaikum, saya butuh ustadz untuk pengajian 7 bulanan di Depok, Sabtu depan,
> budget 1,5 juta, ibu-ibu semua."

## Solusi

Agent AI yang mengubah pesan seperti itu menjadi booking yang terverifikasi — dengan tiga
pilar: **Trust**, **Culture**, dan **Impact**.

### Tiga pilar

| Pilar | Wujudnya di produk |
|---|---|
| **Trust** | Tidak pernah membocorkan kontak sebelum booking dikonfirmasi, tidak pernah mengeksekusi tanpa persetujuan, selalu mencantumkan sumber rekomendasi, dan menolak menjawab fatwa |
| **Culture** | Satu-satunya agent yang tahu Salat Jumat (Jumat 11:30–13:00 WIB), bentrok waktu salat, dan preferensi ustadz/ustadzah untuk audience muslimah |
| **Impact** | Bukan mainan demo — masalah nyata pada 200 ribu+ institusi, dan platformnya sudah bisa dipakai hari ini |

---

## Agent Flow — 7 langkah

```
1. Parse & Ekstrak      pesan bebas → jenis acara, hari, jam, kota, audiens, gender, budget
2. Cari Ustadz          filter katalog berdasarkan bidang, kota, ketersediaan, rating
3. Cek Aturan Budaya    Salat Jumat, bentrok waktu salat, preferensi gender
4. Ajukan Klarifikasi   hanya bila ada field kritis yang kosong — tidak menebak
5. Susun Rencana        tampilkan siapa / apa / kapan / di mana / berapa + sumbernya
6. Tunggu Persetujuan   ⛔ tidak ada eksekusi tanpa "setuju" dari manusia
7. Eksekusi & Audit     booking dicatat, seluruh langkah masuk audit log
```

### Trust boundary

```
┌─────────────── ZONA OTONOM (agent bertindak sendiri) ───────────────┐
│  parsing · pencarian · filter · cek aturan budaya · susun rencana   │
│  · tulis audit log                                                  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │  butuh persetujuan manusia
┌─────────────────────────────▼───────────────────────────────────────┐
│  ZONA PERSETUJUAN: eksekusi booking · berbagi kontak ustadz         │
│  · booking multi-ustadz · fee tinggi                                │
└─────────────────────────────┬───────────────────────────────────────┘
                              │  tidak pernah, dalam kondisi apa pun
┌─────────────────────────────▼───────────────────────────────────────┐
│  ZONA TERLARANG: bocorkan nomor sebelum konfirmasi · eksekusi tanpa  │
│  approval · jadwalkan acara di jam Salat Jumat · jalankan instruksi  │
│  yang disisipkan dalam pesan (prompt injection) · mengarang nama     │
│  ustadz · menjawab fatwa/hukum syariat                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fitur

### Asisten AI (`/asisten`)
- **Avatar 2D** — SVG, mulut bergerak mengikuti suara TTS (`onboundary`), kedip mata,
  arah pandang per state. Tanpa WebGL, tanpa beban three.js.
- **Input suara** — Web Speech API (gratis, tanpa API key), plus input teks
- **Cultural Rules Engine** — Salat Jumat, bentrok waktu salat, preferensi gender
- **Prompt Injection Guard** — 23 pola (Indonesia + Inggris), input diperlakukan sebagai data
- **Scope Guard** — menolak pertanyaan fatwa & topik di luar domain
- **Human-in-the-Loop** — booking selalu butuh persetujuan eksplisit
- **Audit Log** — setiap langkah agent tercatat dan bisa dibuka pengguna
- **Grounding** — rekomendasi hanya dari baris data yang sudah diverifikasi mesin lokal

### Platform
- Direktori **483 ustadz & ustadzah** terverifikasi · 10 bidang keahlian · **54 kota di 38 provinsi** se-Indonesia (Aceh–Papua)
- Filter bidang, kota, rating, dan **radius jarak** (geolocation)
- Profil ustadz: jadwal, biaya, ulasan, kegiatan yang bisa diisi
- Booking dengan pemilih lokasi peta (Photon/Nominatim, gratis tanpa API key)
- Konsultasi chat, halaman kajian, jadwal sholat (Kemenag), arah kiblat, hadith harian
- Pelacakan perjalanan ustadz di peta (Leaflet)

---

## Arsitektur

```
Browser
  │
  ├── /asisten  ──► answerEngine.ts
  │                   │
  │                   ├─ 1. scopeGuard      → tolak fatwa / off-topic (deterministik)
  │                   ├─ 2. intentMatcher   → tentukan aksi & mesin lokal
  │                   ├─ 3. aksi terstruktur? → teks dari mesin lokal (bukan LLM)
  │                   ├─ 4. /api/llm        → DeepSeek → OpenRouter (cadangan)
  │                   └─ 5. fallback        → mesin lokal murni
  │
  └── localStorage: booking · review · chat · audit log
```

**Kenapa aksi terstruktur tidak diserahkan ke LLM?** Rencana booking punya format baku dan
angka yang harus persis (biaya, jadwal). Profil memuat jadwal asli. Penolakan harus
deterministik. LLM hanya menulis jawaban naratif; angka dan keputusan tetap dari mesin lokal.

### Pencegahan halusinasi
- LLM hanya menerima **baris data yang sudah disaring** (`grounding.ts`), tidak lagi memfilter
  katalog sendiri — ini pernah membuat ustadz Bogor masuk ke daftar "ustadz di Jakarta"
- `detectUnknownUstadzNames()` menolak jawaban yang menyebut ustadz di luar database
- `redactContactBeforeApproval()` menyensor nomor telepon/WhatsApp sebelum booking dikonfirmasi
- `looksLikeReasoningLeak()` menolak keluaran model yang berisi proses berpikir, bukan jawaban

---

## Menjalankan

```bash
npm install
cp .env.local.example .env.local   # isi kunci LLM (opsional)
npm run dev
```

Buka http://localhost:3000 — halaman agent ada di `/asisten`.

**Tanpa kunci LLM pun aplikasi tetap jalan** dengan mesin aturan lokal. Kunci hanya
meningkatkan kualitas bahasa jawaban naratif.

### Variabel lingkungan

| Variabel | Wajib | Keterangan |
|---|---|---|
| `OPENROUTER_API_KEY` | tidak | Penyedia utama (gratis dulu, termurah sebagai cadangan) |
| `OPENROUTER_PREFER_FREE` | tidak | `true` = coba model `:free` lebih dulu |
| `OPENROUTER_CHEAP_MODEL` | tidak | Default `openai/gpt-oss-120b` |
| `DEEPSEEK_API_KEY` | tidak | Opsional sejak 3 Nov 2026 — bila diisi, otomatis mendahului OpenRouter |
| `DEEPSEEK_MODEL` | tidak | Default `deepseek-flash` |
| `NEXT_PUBLIC_AVATAR_GLB` | tidak | Path model GLB; kosong = avatar prosedural |

> Kunci API **tidak pernah** dikirim ke browser. Semua panggilan LLM lewat route server
> `/api/llm`. `.env*.local` sudah dikecualikan di `.gitignore`.

### Uji

```bash
node scripts/check-agent.mjs        # 9 skenario batas domain + alur booking + Salat Jumat
node scripts/check-deepseek.mjs     # perutean penyedia LLM
node scripts/check-avatar-glb.mjs   # validasi struktur model GLB
npm run test:lipsync                # 8 assert geometri mulut avatar 2D (tanpa browser)
```

---

## Struktur proyek

```
src/
├── app/
│   ├── asisten/          AI Agent + avatar 2D
│   ├── api/llm/          gerbang LLM sisi server
│   ├── ustadz/           direktori + profil
│   ├── booking/          form + riwayat
│   ├── kajian/ sholat/ kiblat/ hadith/ tracking/
│   └── konsultasi/ tentang/
├── components/
│   ├── avatar/           Avatar2D (dipakai), AvatarScene/AvatarHead/AvatarGLB (cadangan 3D)
│   └── asisten/          AsistenClient, TranscriptPanel, VoiceControls
└── lib/
    ├── ai/
    │   ├── intentMatcher.ts    mesin aturan utama
    │   ├── answerEngine.ts     orkestrasi scope → LLM → validasi → fallback
    │   ├── culturalRules.ts    Salat Jumat, waktu salat, gender
    │   ├── scopeGuard.ts       batas domain + deteksi fatwa
    │   ├── promptGuard.ts      23 pola prompt injection
    │   ├── grounding.ts        data terverifikasi untuk LLM
    │   ├── auditLog.ts         jejak audit
    │   └── bookingParser.ts    bahasa natural → field terstruktur
    └── avatar/           state machine, voice engine, viseme
```

---

## Akuntabilitas

Lembar lengkap ada di [`AKUNTABILITAS.md`](./AKUNTABILITAS.md).

**Ringkasnya:**

| Agent BISA akses | Agent OTONOM | Butuh PERSETUJUAN | TIDAK PERNAH |
|---|---|---|---|
| Profil ustadz publik, jadwal, review anonim, data kajian | Parsing, pencarian, filter, cek budaya, susun rencana, tulis audit | Eksekusi booking, berbagi kontak, booking multi-ustadz | Bocor kontak pra-booking, eksekusi tanpa approval, jadwal di jam Jumat, ikuti prompt injection, mengarang nama, menjawab fatwa |

---

## Kepatuhan

Sejalan dengan arah **PP 33/2026** (penilaian dampak AI untuk pemrosesan data pribadi, berlaku
16 Januari 2027): data pengguna disimpan di perangkat pengguna sendiri (localStorage), bukan
di server; kontak ustadz baru dibuka setelah persetujuan; dan seluruh keputusan agent dapat
diaudit ulang.

---

## Lisensi

MIT — dibuat untuk AI CAN DO IT Hackathon 2026.
