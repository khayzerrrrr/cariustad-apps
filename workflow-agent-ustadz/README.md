# Workflow Agent Ustadz — Bentuk WorkBuddy (CariUstadz)

Ini adalah **bentuk workflow WorkBuddy** dari agen CariUstadz — sesuai format
yang diresepkan panduan resmi panitia (SESI 2: "Bentuk proyek: folder kerja di
WorkBuddy"). Submission hackathon menerima "repo publik ATAU workflow WorkBuddy
ekspor"; proyek ini punya keduanya.

## Cara menjalankan di WorkBuddy

1. Buka folder `workflow-agent-ustadz/` ini sebagai folder kerja di WorkBuddy.
2. Bicara ke agen di chat, contoh:
   > "Saya mau booking ustadz untuk kajian, Senin jam 19:00, di Bandung, 50 orang"
3. Agen membaca `AGENTS.md`, lalu:
   - mengklarifikasi detail yang ambigu (jangan menebak),
   - menampilkan **rencana/preview** booking,
   - **berhenti menunggu "setuju"** — hanya setelah itu hasil ditulis ke `output/`.
4. Atau beri tugas lewat file: taruh catatan rapat di `input/`, lalu minta
   "proses notulen di input/".

## Struktur folder

```
workflow-agent-ustadz/
├── README.md          ← file ini
├── AGENTS.md          ← aturan perilaku agen (wajib dibaca agen dulu)
├── data/
│   ├── ustadz.json    ← dataset ustadz (subset kecil, sumber rekomendasi)
│   └── dalil.json     ← satu-satunya sumber kutipan dalil yang boleh dipakai
├── input/
│   └── contoh-notulen-rapat.md   ← contoh tugas sintetis (kasus ambigu)
├── output/            ← hasil booking + audit log (ditulis HANYA setelah setuju)
└── tests/
    └── kasus-uji.md   ← kasus uji: normal, ambigu, batas — beserta hasil
```

## Pemetaan ke alur agen di aplikasi (11 langkah)

Workflow ini adalah cermin dari agen di aplikasi Next.js
(`src/lib/ai/*`, halaman `/asisten`):

| Langkah workflow WorkBuddy | Implementasi di aplikasi |
|---|---|
| GUARD (injeksi) | `promptGuard.ts` — 23 pola, deterministik |
| SCOPE | `scopeGuard.ts` — klasifikasi domain |
| PARSE | `bookingParser.ts` + `intentMatcher.ts` |
| CARI | `tools.ts` — searchUstadz / recommendUstadz |
| BUDAYA | `culturalRules.ts` — Salat Jumat, waktu salat, gender |
| KLARIFIKASI → RENCANA | `answerEngine.ts` |
| PERSETUJUAN | gerbang struktural di `intentMatcher.ts` |
| AUDIT | `auditLog.ts` (localStorage) → di sini `output/audit-log.md` |

Aturan budaya dan batas domain **identik** di kedua bentuk — keduanya
deterministik dan dikodekan eksplisit, bukan hasil inferensi model.

## Kenapa bentuk ini penting untuk submission

- Membuktikan pola panitia: **baca input → klarifikasi → preview → persetujuan
  → simpan hasil** — bukan prompt sekali jalan.
- `tests/kasus-uji.md` memuat kasus normal DAN kasus yang harus gagal
  (panduan: "tampilkan juga apa yang harus gagal").
- `AGENTS.md` mendokumentasikan trust boundary: izin tulis hanya ke `output/`,
  aksi eksternal terlarang, persetujuan manusia mendahului perubahan file.
