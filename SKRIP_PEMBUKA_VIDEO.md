# Skrip Produksi PEMBUKA — Video Demo CariUstadz

**Cakupan:** shot-per-shot dari 0:00 sampai perkenalan aplikasi tuntas (0:00–1:20).
**Pendamping:** `SKRIP_VIDEO_DEMO.md` (narasi induk) + `VEO_SCENES.md` (prompt Veo).
**Prinsip:** satu shot = satu keputusan visual. Narasi direkam SATU TAKE untuk seluruh
pembuka (lebih konsisten temponya), lalu dipotong-potong di editor mengikuti tabel ini.

---

## Peta pembukaan (6 shot + 1 jembatan)

| Shot | Waktu | Durasi | Sumber visual | Isi narasi |
|---|---|---|---|---|
| 1 | 0:00–0:08 | 8 dtk | **Veo S1** (aula usai rapat) | "Selasa malam…" |
| 2 | 0:08–0:16 | 8 dtk | **Veo S2** (notulen) | "Keputusannya satu…" |
| 3 | 0:16–0:24 | 8 dtk | **Veo S3** (tiga hari berlalu) | "Tiga hari kemudian…" |
| 4 | 0:24–0:40 | 16 dtk | **Rekaman R1** (/ustadz cepat) | "Di ribuan masjid…" |
| 5 | 0:40–0:48 | 8 dtk | **Veo S4** (cahaya kisi islami) | — (musik + ambience saja) |
| 6 | 0:48–1:05 | 17 dtk | **Rekaman R2** (home scroll) | "Ini CariUstadz…" |
| 7 | 1:05–1:20 | 15 dtk | **Rekaman R2** (lanjutan) | "Yang membuatnya berbeda…" |

Musik latar mulai di Shot 1 (volume 15%), naik tipis di Shot 5 (jembatan), bertahan
sampai segmen demo. Fade out global hanya di 15 detik terakhir video.

---

## SHOT 1 — 0:00–0:08 · Aula usai rapat

**Visual:** klip Veo **S1** (aula masjid kosong usai rapat malam) — prompt lengkap
di `VEO_SCENES.md`. Generate 2–3 varian, pilih yang dolly-nya paling pelan.

**Narasi (potongan ini saja):**

> Selasa malam, rapat pengurus masjid.

*(±3 detik bicara, sisanya biarkan ambience napas — jangan buru-buru ke kalimat
berikutnya; keheningan di sini yang bikin sinematik.)*

**Overlay editor:** kartu hitam kecil, teks putih `Keputusan rapat ≠ tindakan.`
Muncul di detik ke-6, fade 0,3 dtk, hilang saat masuk Shot 2.

**Editing:** video mulai dari hitam → fade-in 0,5 dtk ke klip S1.

---

## SHOT 2 — 0:08–0:16 · Notulen yang terlupakan

**Visual:** klip Veo **S2** (close-up notulen + penangan, tulisan tangan blur).
Kalau Veo mengarang huruf terbaca: regenerate dengan baris
`the handwriting must remain completely blurred and out of focus`.

**Narasi:**

> Keputusannya satu: bulan depan ada kajian fiqih, Senin malam jam tujuh,
> untuk lima puluh orang di Bandung. Tidak ada yang mencatat siapa ustadznya.

*(Kalimat ini paling panjang di shot 8 detik — tempo boleh sedikit naik, tapi
jangan sampai menyeret. Kalau sempit, panjangkan shot jadi 10 dtk di editor dengan
memperlambat klip Veo 80% — aman karena klipnya hampir statis.)*

**Overlay:** tanpa teks — biarkan gambarnya bicara.

---

## SHOT 3 — 0:16–0:24 · Tiga hari berlalu

**Visual:** klip Veo **S3** (timelapse cahaya menyapu lantai, jam dinding berputar).

**Narasi:**

> Tiga hari kemudian, keputusan itu masih sebatas notulen.

*(±4 detik bicara, 4 detik diam. Diamnya PENTING — ini punchline hook.)*

**Overlay:** tanpa teks.

**Editing:** crossfade 0,3 dtk dari S2 → S3.

---

## SHOT 4 — 0:24–0:40 · Skala masalah (layar asli)

**Visual:** **Rekaman R1** — halaman `/ustadz` production, scroll cepat melewati
grid ustadz sambil filter kota berganti-ganti (Jakarta → Bandung → Surabaya → …).
Tunjukkan counter "483 profil" bila terlihat di layar — itu bukti skala.
Rekam ±30 detik, pakai 16 detik terbaik.

**Narasi:**

> Di ribuan masjid dan pesantren di Indonesia, pekerjaan seperti ini jatuh ke
> satu orang takmir — sambil mengurus pekerjaan lainnya.

**Overlay:** `483 profil · 54 kota · 38 provinsi` (fade-in detik ke-4, pojok kiri bawah).

**Editing:** potongan layar ini jangan diberi zoom berlebihan — cukup kecepatan
scroll 1,2x di editor. Transisi masuk dari S3: crossfade 0,4 dtk (dari cahaya pagi
ke layar — kontras "masalah nyata vs dunia digital").

---

## SHOT 5 — 0:40–0:48 · Jembatan transisi (tanpa narasi)

**Visual:** klip Veo **S4** (cahaya pagi menembus kisi geometris islami, pola
emerald-emas meluncur di meja putih). **Tanpa narasi sama sekali** — hanya musik
yang naik tipis + ambience. Ini jeda napas sebelum produk muncul.

**Editing:** **KUNCI transisi paling penting di seluruh video:** akhir klip S4
di-crossfade 0,5 dtk ke layar asli `/` (hero website). Pola geometris islami di
kisi jendela harus terasa "nyambung" dengan pola hero — kalau hasil generate S4
pola kisi-nya tidak mirip, regenerate sampai dapat.

---

## SHOT 6 — 0:48–1:05 · Perkenalan produk

**Visual:** **Rekaman R2** — halaman `/` production, scroll PELAN dari hero ke
bawah melewati statistik count-up (483 / 54 / angka rating) dan section "Cara Kerja".
Kecepatan scroll: satu layar per ±4 detik. Zoom browser 110–125%.

**Narasi:**

> Ini CariUstadz — agen AI yang mengubah percakapan menjadi tindakan nyata:
> mencari ustadz yang tepat, memeriksa aturan budaya Islam, dan mencatat
> undangan — **tetapi hanya setelah manusia menyetujuinya.**

*(Tekankan "hanya setelah manusia menyetujuinya" — itu kalimat paling penting
di perkenalan; juri Challenge B menilai dari frasa ini.)*

**Overlay:** `CariUstadz — AI Agent Booking Ustadz` (fade-in detik ke-2, kanan atas
atau tengah bawah, hilang saat masuk Shot 7).

**Editing:** saat narasi menyebut "statistik" jangan sebut — cukup biarkan angka
count-up terlihat. Jangan scroll sampai bawah; sisa halaman untuk Shot 7.

---

## SHOT 7 — 1:05–1:20 · Pembeda + track Challenge

**Visual:** **Rekaman R2** (lanjutan, satu file rekaman dengan Shot 6) — scroll
pelan ke CTA "Asisten AI" / bagian yang menunjukkan kartu agen. Bisa juga zoom-in
tipis (110%→118%) di kartu "Cara Kerja" langkah ke-3 untuk memberi penekanan
"persetujuan".

**Narasi:**

> Yang membuatnya berbeda bukan apa yang dilakukannya, melainkan apa yang
> tidak dilakukannya: ia tidak berfatwa, tidak keluar dari domain, dan tidak
> pernah mengeksekusi tanpa persetujuan.
> Ini jawaban kami untuk Challenge B — Agen Kantor.

**Overlay:** `Challenge B — Agen Kantor` (fade-in pada kalimat terakhir, tahan 3 dtk).

**Editing:** akhir Shot 7 → cut keras (tanpa crossfade) ke layar
`DIAGRAM_ARSITEKTUR.html`. Cut keras di sini terasa tegas: "teori selesai,
sekarang bukti."

---

## Varian opsional dengan green screen (jika sudah generate S8)

Bila mau pembukaan lebih "bercerita", selipkan klip **S8** (takmir mengangkat HP
layar hijau) sebagai Shot 4b — antara Shot 4 dan Shot 5:

- **Posisi:** 0:36–0:40 → sisip 6 dtk S8 di 0:32–0:38, geser Shot 5 turun 2 dtk.
- **Isi layar HP:** rekaman mobile 9:16 halaman `/` (RM1) — sisip via chroma key
  sesuai panduan `VEO_SCENES.md` (panduan bawah).
- **Narasi tidak berubah** — hanya visualnya berganti: "…sambil mengurus
  pekerjaan lainnya." ditampilkan sambil takmir membuka HP = "dari ponsel".
- Kalau chroma key pertama kali dan hasilnya berantakan: **buang saja** —
  pembukaan tanpa S8 sudah lengkap. Ini bonus, bukan wajib.

---

## Checklist perekaman bagian pembuka

- [ ] Generate Veo S1, S2, S3, S4 (2–3 varian masing-masing; cek: tak ada teks
      terbaca, tak ada wajah aneh, palet emerald-emas konsisten)
- [ ] (Opsional) Generate S8 green screen
- [ ] Rekam **R1**: `/ustadz` scroll + ganti-ganti filter kota, ±30 dtk
- [ ] Rekam **R2**: `/` home scroll pelan hero → bawah, ±35 dtk, SATU file
      (dipakai Shot 6 & 7 sekaligus)
- [ ] Rekam **RM1** (opsional, untuk S8): mobile 9:16 halaman `/`, device mode 375px
- [ ] Rekam voiceover pembuka SATU TAKE penuh (0:00–1:20) — temponya konsisten
      dari satu napas, dipotong per shot di editor
- [ ] Rakit: kartu hitam → S1 → S2 → S3 → R1 → S4 (crossfade 0,5 dtk) → R2
- [ ] Overlay: `Keputusan rapat ≠ tindakan.` (Shot 1), `483 profil · 54 kota ·
      38 provinsi` (Shot 4), `CariUstadz — AI Agent Booking Ustadz` (Shot 6),
      `Challenge B — Agen Kantor` (Shot 7)
- [ ] Cek akhir pembuka: transisi S4→home harus terasa nyambung (polanya mirip);
      kalau tidak, regenerate S4

## Target durasi bagian pembuka: **1:20** (meleset 3–5 detik masih aman —
## kompensasi dengan memangkas diam di Shot 3 atau memperlambat R2).
