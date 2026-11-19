# Riwayat Percakapan WorkBuddy — Pengembangan CariUstadz

Pengembangan proyek CariUstadz dilakukan penuh melalui percakapan dengan
WorkBuddy AI (agen "Ken") dari 31 Oktober sampai 7 November 2026. Dokumen ini
meringkas sesi-sesi tersebut; bukti fisiknya berupa 4 gambar log obrolan
(`chatlog-1.png` s.d. `chatlog-4.png`) dan commit nyata yang dapat diverifikasi
di https://github.com/khayzerrrrr/cariustad-apps

| Sesi | Tanggal | Bahasan | Hasil terverifikasi |
|---|---|---|---|
| 1 | 31 Okt 2026 | MVP platform "cari ustadz" dibangun dalam satu sesi: 6 halaman (beranda, direktori, detail+review, booking, konsultasi, tentang), 12 profil ustadz awal, tema emerald/teal | Semua route 200, build bersih |
| 2 | 30 Okt – 1 Nov 2026 | AI Agent Challenge B di `/asisten`: agent flow, Prompt Guard, cultural rules, audit log; pembuatan repo GitHub (MCP 403 → diakali `gh` CLI) | Repo publik, 85 file, commit `021d5ce`, audit: tanpa kunci API bocor |
| 3 | 2 Nov 2026 | Anti-abuse booking (bookingGuard: duplikat, rate limit, cooldown) + verifikasi OTP WhatsApp | `test:bookingguard` 24/24, commit `391f299` |
| 4 | 7 Nov 2026 | Demo menemukan bug alur booking ("baik di jam 13.30 saja" jatuh ke fallback); perbaikan konteks + aturan waktu lunak + jawaban LLM-first + guard anti-halusinasi | commit `e5aebf3` + `81adb46`; test:agent 0 gagal, test:guard 32/32, test:expert 38/38 |

## Sorotan nilai percakapan dalam pengembangan

1. **Masalah ditemukan dari penggunaan nyata.** Bug alur booking pada Sesi 4
   ditemukan saat menguji alur "booking Rabu 14.00 → ganti jam 13.30" — bukan
   dari skenario buatan. Perbaikan diakhiri test baru
   (`scripts/check-conversation.ts`) yang meniru persis percakapan yang gagal.
2. **Keputusan arsitektur lahir dari diskusi.** Contoh: model AI hanya
   menuliskan ulang draf terverifikasi dari mesin lokal (bukan mengarang
   sendiri), dan penolakan dibuat sebelum panggilan LLM sehingga tidak bisa
   dinegosiasikan lewat prompt.
3. **Kesalahan diakui dan diperbaiki.** Saat pengujian, model OpenRouter
   mengarang hari "Selasa" padahal yang diminta Rabu — ditemukan, lalu
   ditambahkan guard deterministik di server yang menolak jawaban dengan hari
   yang tidak ada di data.
4. **Keamanan dicek sepanjang jalan.** Verifikasi tanpa kunci API di repo
   (Sesi 2), guard anti-abuse (Sesi 3), audit log semua langkah agen.

## File dalam upload ini

- `chatlog-1.png` — Sesi 1: pembangunan MVP
- `chatlog-2.png` — Sesi 2: AI Agent + repo publik
- `chatlog-3.png` — Sesi 3: anti-abuse + OTP
- `chatlog-4.png` — Sesi 4: bug demo hari submit + perbaikan LLM-first
