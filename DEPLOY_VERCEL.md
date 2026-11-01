# Deploy ke Vercel — Panduan Langkah demi Langkah

Tujuan: mendapatkan **live URL** untuk submission hackathon (poin bonus) sekaligus bukti
platform benar-benar jalan, bukan hanya screenshot.

Repo sudah siap: https://github.com/khayzerrrrr/cariustad-apps

---

## Ringkasan yang sudah disiapkan

| Berkas | Isi |
|---|---|
| `vercel.json` | Framework Next.js, region `sin1` (Singapura — terdekat ke Indonesia) |
| `package.json` | `engines.node = 20.x` supaya Vercel tidak menebak versi |
| `.gitignore` | `.env*.local` dikecualikan — kunci API tidak pernah masuk repo |

Build lokal sudah diverifikasi: **TypeScript 0 error, ESLint 0 warning.**

---

## Langkah 1 — Buka Vercel

1. Buka https://vercel.com/signup
2. Pilih **Continue with GitHub**
3. Login sebagai `khayzerrrrr`, lalu **Authorize Vercel**

Tidak perlu kartu kredit untuk paket Hobby.

---

## Langkah 2 — Import repo

1. Buka https://vercel.com/new
2. Cari `cariustad-apps` → klik **Import**
3. Konfigurasi terdeteksi otomatis:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `next build`
   - Output Directory: `.next`
4. **Jangan klik Deploy dulu** — isi environment variables lebih dulu (langkah 3)

---

## Langkah 3 — Environment Variables

Di bagian **Environment Variables**, tambahkan satu per satu. Nilai diambil dari berkas
`.env.local` di komputer Anda (jangan pernah di-commit).

| Name | Value | Environment | Wajib? |
|---|---|---|---|
| `DEEPSEEK_API_KEY` | *(salin dari `.env.local`)* | Production, Preview, Development | Ya, untuk kualitas jawaban terbaik |
| `DEEPSEEK_MODEL` | `deepseek-flash` | semua | Ya |
| `OPENROUTER_API_KEY` | *(salin dari `.env.local`)* | semua | Cadangan — sangat disarankan |
| `OPENROUTER_CHEAP_MODEL` | `mistralai/mistral-nemo` | semua | Ya |
| `OPENROUTER_PREFER_FREE` | `false` | semua | Ya |

**Jangan** menambahkan `NEXT_PUBLIC_AVATAR_GLB`. Tanpa variabel itu, agent memakai avatar 3D
prosedural yang lebih rapi. Model GLB uji di `public/models/test-avatar.glb` hanya untuk
pengujian lokal.

> **Kalau env vars dilewatkan:** aplikasi tetap jalan penuh dengan mesin aturan lokal.
> Yang berkurang hanya kehalusan bahasa jawaban naratif. Fitur inti — pencarian, aturan
> budaya, persetujuan manusia, audit log — tidak terpengaruh.

---

## Langkah 4 — Deploy

Klik **Deploy**. Proses sekitar 2-3 menit. Anda akan mendapat URL seperti:

```
https://cariustad-apps.vercel.app
```

---

## Langkah 5 — Verifikasi setelah live

Buka URL tersebut dan periksa enam hal ini. Kalau semua lolos, platform siap didemokan.

| # | Yang diperiksa | Cara | Harapan |
|---|---|---|---|
| 1 | Halaman utama | buka `/` | Hero, statistik, ustadz pilihan tampil |
| 2 | Direktori + filter | buka `/ustadz`, pilih kota | Daftar menyaring dengan benar |
| 3 | Agent hidup | buka `/asisten` | Avatar 3D muncul, sapaan otomatis |
| 4 | Status LLM | lihat badge kanan atas di `/asisten` | Tertulis `DeepSeek deepseek-flash`, bukan `Mesin lokal` |
| 5 | Alur booking | ketik: `Booking ustadz untuk kajian, Senin jam 19:00, di Bandung, 50 orang` | Muncul **RENCANA BOOKING** dan menunggu persetujuan |
| 6 | Aturan budaya | ketik: `Booking ustadz Jumat jam 11:30` | **Ditolak**, ditawari waktu setelah 13:00 |

Kalau nomor 4 masih `Mesin lokal`, env var belum terbaca — buka
**Settings → Environment Variables**, pastikan nilainya ada, lalu **Redeploy**.

---

## Langkah 6 — Catat untuk submission

Simpan dua tautan ini, keduanya diminta di Google Form:

```
Live demo : https://cariustad-apps.vercel.app
Source    : https://github.com/khayzerrrrr/cariustad-apps
```

---

## Catatan penting untuk demo hari-H

**Mikrofon hanya berjalan di HTTPS atau localhost.** Vercel otomatis memberi HTTPS, jadi
input suara berfungsi. Kalau Anda mendemokan lewat IP lokal (`http://192.168.x.x`), browser
akan memblokir mikrofon secara permanen — pakai URL Vercel saja.

**Jangan hapus `.env.local` dari komputer.** Berkas itu tidak ada di repo, jadi satu-satunya
salinan kunci Anda ada di situ.

**Rotasi kunci setelah hackathon.** `DEEPSEEK_API_KEY` dan `OPENROUTER_API_KEY` pernah
dikirim lewat chat, jadi anggap sudah bocor. Buat kunci baru di dashboard masing-masing
penyedia setelah acara selesai.

---

## Troubleshooting

| Gejala | Sebab | Solusi |
|---|---|---|
| Build gagal: `React Hook "useX" cannot be called inside a callback` | Sudah diperbaiki di commit terakhir | Pastikan deploy dari branch `main` terbaru |
| Build gagal: `Module not found: leaflet` | `npm install` tidak jalan | Hapus `node_modules` di Vercel (Settings → General → Clear Build Cache), redeploy |
| Agent balas "Mesin lokal" terus | Env var tidak terbaca saat build | Redeploy setelah menambah env var |
| `/api/llm` balas 501 | `DEEPSEEK_API_KEY` kosong | Isi env var, redeploy |
| `/api/llm` balas 422 | Input di luar domain / terdeteksi injeksi | Itu perilaku yang benar — scope guard bekerja |
| Mikrofon tidak jalan | Halaman bukan HTTPS | Pakai URL `vercel.app`, bukan IP lokal |
| Peta kosong | Tile OpenStreetMap lambat | Tunggu, atau muat ulang |

---

## Alternatif: deploy lewat CLI

Kalau lebih suka terminal:

```bash
npm i -g vercel
vercel login          # pilih Continue with GitHub
vercel                # deploy ke preview
vercel --prod         # deploy ke production
```

Saat ditanya, terima nilai bawaan. Tambahkan env var lewat `vercel env add` atau dashboard.
