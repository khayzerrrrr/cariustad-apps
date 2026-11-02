# dalil-db — Basis Data Dalil Terverifikasi

Basis data dalil Al-Quran dan hadis untuk Mode Ustadz Hafizh CariUstadz.
**Folder ini mandiri** — bisa dipakai tanpa AI agent, tanpa Next.js, tanpa
kunci API, tanpa jaringan. Cukup Node.js ≥ 18.

## Isi

| Berkas | Fungsi |
|---|---|
| `dalil.json` | Sumber kebenaran tunggal: 26 kutipan ayat/hadis + makna + penerapan + tautan verifikasi |
| `cari.mjs` | CLI pencari dalil (nol dependensi) |

## Cara pakai CLI

```bash
# Jawab pertanyaan dengan dalil
node cari.mjs "apa dalil tentang sabar"

# Keluaran JSON — untuk bot WhatsApp/Telegram, n8n, atau aplikasi lain
node cari.mjs --json "keutamaan sedekah"

# Daftar semua kutipan / semua topik
node cari.mjs --daftar
node cari.mjs --topik
```

Contoh keluaran:

```
📖 QS Al-Baqarah: 153
   "Wahai orang-orang yang beriman! Mohonlah pertolongan (kepada Allah)
   dengan sabar dan salat. Sungguh, Allah beserta orang-orang yang sabar."

   Maknanya: Sabar dan salat adalah dua kunci pertolongan Allah...
   Verifikasi: https://quran.com/2/153
```

## Dari mana datanya diambil?

Dataset ini hasil kurasi manual, bukan hasil kembalian model AI. Sumbernya:

1. **Al-Quran** — teks dan terjemahan dari mushaf standar (terjemahan Kemenag RI).
2. **Hadis** — hanya dari kitab koleksi shahih/hasan: Shahih Bukhari, Shahih
   Muslim, Sunan Abu Dawud, Jami' Tirmidzi. Penomoran mengikuti penomoran
   standar yang dipakai sunnah.com (identik dengan penomoran cetak yang lazim).

## Sumber khusus untuk validasi

Setiap entri punya field `verifyUrl` — klik untuk cek silang langsung:

| Sumber | Fungsi | URL |
|---|---|---|
| **Sunnah.com** | Hadis lengkap: teks Arab, terjemahan, penomoran, dan **derajat** (Darussalam / Al-Albani) | https://sunnah.com |
| **Quran.com** | Ayat per surah:nomor, multi-terjemahan | https://quran.com |
| **Tanzil.net** | Teks Arab Al-Quran standar Uthmani (untuk verifikasi redaksi) | https://tanzil.net |
| **Quran Kemenag** | Terjemahan resmi Kementerian Agama RI | https://quran.kemenag.go.id |
| **Dorar.net** | Tahkik (penelitian derajat) hadis dari para ulama muhaddits | https://dorar.net |

**Log audit verifikasi (2 November 2026)** — spot-check ke sunnah.com:

| Entri | Hasil | Tindakan |
|---|---|---|
| HR Abu Dawud no. 61 | Redaksi lama keliru | ✏️ Dikoreksi: "Kunci salat adalah kesucian; pembukanya takbir dan penutupnya salam" (hasan shahih — Al-Albani) |
| HR Tirmidzi no. 2396 | Derajat tepatnya "hasan" (Darussalam) | ✏️ Derajat diperbaiki |
| HR Tirmidzi no. 1956 (senyum) | Cocok, hasan | ✓ Dipertahankan |
| HR Tirmidzi no. 3371 ("doa inti ibadah") | **Dhaif** (Darussalam) | ❌ Dihapus dari dataset |
| HR Tirmidzi no. 2499 ("setiap anak Adam salah") | **Dhaif** (Darussalam) | 🔄 Diganti HR Muslim no. 2747 (taubat, shahih) |

Dua hadis dhaif yang populer itu justru sempat masuk dataset versi pertama.
Inilah alasan prosedur validasi wajib: **populer ≠ shahih**.

## Kebijakan kurasi (wajib dipatuhi bila menambah entri)

1. Hanya ayat Al-Quran atau hadis berderajat **shahih / hasan**. Hadis dhaif
   atau palsu dilarang masuk walau populer.
2. Wajib ada `citation` berformat `QS NamaSurah: ayat` atau `HR Kitab no. N`.
3. Wajib ada `verifyUrl` yang benar-benar menunjuk ke sumber online.
4. Hadis wajib mencantumkan `grade` sesuai penilaian di sunnah.com
   (Darussalam / Al-Albani), bukan penilaian sendiri.
5. Terjemahan tidak boleh dimodifikasi maknanya agar "lebih enak dibaca".
6. Setiap penambahan → jalankan `npm run test:expert` (menguji format,
   duplikat, kelengkapan, dan konsistensi JSON ↔ aplikasi web).

## Dipakai di aplikasi web

`src/lib/ai/dalilKnowledge.ts` mengimpor `dalil.json` ini langsung — jadi
web dan CLI **selalu membaca data yang sama**. Mengubah JSON otomatis
mengubah jawaban Mode Ustadz Hafizh di production (setelah deploy).

## Pemisahan jadi repo terpisah (nanti, setelah hackathon)

Folder ini sengaja dibuat bebas dari aplikasi (tidak mengimpor apa pun dari
`src/`). Saat ingin jadi repo/package sendiri:

```bash
# cara termudah: salin folder + git init baru
cp -r dalil-db/ cariustad-dalil-db/
cd cariustad-dalil-db && git init && git add -A && git commit -m "dalil-db v1.1"
```

Atau pakai `git subtree split` supaya riwayat commit ikut terbawa. Dengan
CLI `cari.mjs` yang sudah ada, repo baru itu langsung berguna tanpa perlu
menulis kode tambahan — dan bisa jadi fondasi API/bot WhatsApp nantinya.
