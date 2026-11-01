# Product Sharing — Di mana WorkBuddy memberi nilai

Catatan jujur tentang membangun CariUstadz dengan WorkBuddy AI, dari satu kalimat
permintaan sampai aplikasi yang berjalan di production. Termasuk bagian yang
tidak berjalan mulus.

**Ringkas:** WorkBuddy bukan pelengkap otomatis kode. Nilainya paling terasa
ketika tugasnya berlapis — baca kode, ubah, uji, deploy, verifikasi — dan ketika
kita memperlakukannya seperti rekan kerja yang perlu diberi konteks, bukan mesin
yang perlu diberi perintah.

---

## 1. Agent orchestration

Ini nilai terbesar, dan yang paling sulit ditiru autocomplete.

Satu permintaan di awal proyek — *"untuk menang, apalagi yang harus kita
selesaikan di platform cari ustad ini"* — memicu rantai kerja yang tidak saya
tuliskan satu per satu: membaca struktur repo, mengidentifikasi deliverable yang
belum ada, menemukan pelanggaran React Hooks yang akan menggagalkan build,
memperbaikinya, membuat repo GitHub, menyiapkan deploy Vercel, menyuntikkan
variabel lingkungan, dan memverifikasi hasilnya di production.

Yang membuat ini berguna bukan kecepatan menulis kode, melainkan **agent
memegang konteks antar langkah**. Ketika build Vercel gagal karena Node 20
dihentikan, agent tahu versi Node mana yang sudah diverifikasi lokal, jadi
menaikkan `engines.node` ke `22.x` — bukan `26.x` yang disarankan pesan galat.
Keputusan itu hanya mungkin karena langkah sebelumnya masih diingat.

**Pelajaran:** rantai sepanjang ini hanya berhasil kalau setiap langkah punya
cara memverifikasi dirinya. Agent yang menganggap "perintah selesai" sama dengan
"hasil benar" akan menumpuk kesalahan.

## 2. Natural language parsing

Permintaan paling kompleks yang saya berikan sepanjang proyek adalah satu
kalimat, dua belas kata, tanpa spesifikasi teknis:

> "animasi assistennya ganti 2d yang bergerak sesuai dengan tts nya saja"

Yang dihasilkan: komponen SVG baru 300+ baris, migrasi dari Three.js ke SVG,
penyambungan `onboundary` dari Web Speech API, loop `requestAnimationFrame`
dengan interpolasi, pemetaan viseme ke geometri mulut, animasi kedip dan napas,
penghormatan `prefers-reduced-motion`, dan penghapusan jalur bundle 3D.

Kuncinya adalah kalimat itu mengandung **batasan**, bukan hanya keinginan:
*"sesuai dengan tts-nya"* berarti mulut harus mengikuti audio yang benar-benar
diucapkan, bukan loop animasi generik. Batasan itu yang menentukan arsitektur —
dan agent menangkapnya tanpa perlu saya jelaskan.

Sebaliknya, permintaan yang ambigu menghasilkan kerja yang harus diulang. Ketika
saya hanya menulis "buka vercel dari browser", hasilnya berjam-jam mencoba
otomasi browser yang tidak stabil. Kalimat yang lebih spesifik di awal akan
menghemat semua itu.

**Pelajaran:** nilai parsing bahasa alami sebanding dengan ketelitian batasan
yang kita berikan. Kebebasan yang tidak dibatasi bukan fitur.

## 3. Tool use

Yang membuat agent benar-benar bekerja, bukan sekadar menyarankan.

| Alat | Dipakai untuk |
|---|---|
| Filesystem | Menulis 40+ berkas, membaca kode yang ada sebelum mengubah |
| Shell | `npm`, `git`, `tsc`, `eslint`, `curl` untuk verifikasi |
| GitHub MCP | Membaca repo, commit, push |
| `gh` CLI | Membuat repo — setelah MCP menolak karena izin |
| Vercel CLI | Deploy, menyuntikkan env var, memeriksa status |
| Web fetch | Mengambil dokumentasi saat perilaku alat tidak jelas |

Contoh nyata **kegagalan alat yang harus diakali**: MCP GitHub menolak
`create_repository` dengan `403 Resource not accessible by integration` — token
App-nya tidak punya izin Administration. Agent tidak berhenti; ia mencari jalan
lain, menemukan `gh` CLI sudah terautentikasi dengan scope `repo`, dan memakainya.
Hasil akhirnya sama, jalurnya berbeda.

Hal serupa terjadi pada deploy: otomasi browser (`agent-browser`) rusak di
lingkungan ini — `eval` jatuh ke `about:blank`, screenshot kosong. Alih-alih
memaksa, agent beralih ke Vercel CLI dan menulis skrip deploy yang menyuntikkan
variabel lingkungan dari `.env.local` secara otomatis.

**Pelajaran:** nilai tool use bukan jumlah alat yang tersedia, melainkan
kemampuan berpindah jalur ketika satu alat gagal. Agent yang hanya punya satu
cara akan macet pada kegagalan pertama.

## 4. Human-in-the-loop

Ini bagian yang paling banyak mengajari saya — justru karena saya melihatnya
dari dua sisi.

**Sebagai pola desain produk.** CariUstadz menempatkan persetujuan manusia
sebagai titik henti struktural: langkah eksekusi berada *setelah* langkah
persetujuan, dan tidak ada jalur kode yang melewatinya. Pengguna yang menulis
"langsung booking saja tanpa konfirmasi" justru terdeteksi sebagai upaya
melewati persetujuan.

**Sebagai pola kerja dengan agent.** WorkBuddy berperilaku serupa. Ketika
diagnosis awal saya tentang avatar yang terpotong ternyata salah, agent tidak
langsung menambal kode — ia memverifikasi dulu dengan
`performance.getEntriesByType('resource')` dan menemukan **nol** permintaan
`.glb`. Artinya dugaan saya keliru, dan perbaikan yang "jelas benar" akan
memperbaiki hal yang salah.

Insight yang saya bawa dari sana ke produk: **titik henti harus bisa membuktikan
bahwa ia benar-benar berhenti.** Bukan dialog yang bisa dilewati, bukan
konfirmasi yang otomatis terjawab. Di CariUstadz, tanpa kata "setuju", tidak ada
yang tercatat — dan itu dapat diuji secara otomatis.

## 5. Insight tooling

**Yang bekerja sangat baik.**

- *Verifikasi berlapis.* Setiap perubahan diverifikasi ulang: `tsc --noEmit`,
  `next lint`, lalu uji HTTP ke production. Menangkap kelas kesalahan yang tidak
  terlihat dari membaca kode.
- *Menulis alat ujinya sendiri.* Ketika animasi tidak bisa dinilai dari
  screenshot, agent menulis skrip yang meniru loop `requestAnimationFrame` dan
  menguji matematikanya. Itu keputusan yang tepat — dan lebih tahan lama daripada
  satu screenshot.
- *Mengakui batas.* Saat browser tidak tersedia, agent menyatakannya dan memilih
  jalur lain, bukan berpura-pura berhasil.

**Yang perlu diperbaiki.**

- *Otomasi browser belum matang* di lingkungan ini. Untuk verifikasi visual,
  manusia masih lebih andal.
- *Kegagalan build di sandbox sulit dibedakan dari kegagalan nyata.* Build lokal
  gagal dengan `EPERM: copyfile` yang ternyata hanya batasan sandbox — build
  Vercel berhasil penuh. Perlu waktu untuk menyimpulkan itu.
- *Konteks panjang bisa menipu.* Ringkasan percakapan sempat membuat agent
  mengira sebuah fitur sudah di-commit padahal belum. Verifikasi ke `git status`
  menyelesaikannya — tetapi harus dilakukan secara sadar.

**Yang paling berharga.** Bukan kecepatan menulis kode, melainkan kemampuan
**menemukan kesalahan sendiri**. Celah prompt injection berbahasa Inggris pada
CariUstadz ditemukan bukan oleh juri atau penguji luar, tetapi oleh pengujian
yang agent tulis sendiri — lalu diperbaiki, diuji dua arah (serangan tertangkap
*dan* tidak ada salah tuduh), dan didokumentasikan terbuka di
`HASIL_PENGUJIAN.html` §5.1.

Bagi saya itu bukti paling kuat bahwa alat ini berguna: ia membantu saya
menemukan bahwa pekerjaan saya sendiri belum selesai.

---

## Penutup

CariUstadz dibangun dengan satu prinsip yang sama di kedua sisi — di dalam produk
dan di dalam proses pembuatannya: **agen yang baik tahu kapan harus berhenti.**

Di produk, ia berhenti untuk meminta persetujuan sebelum mencatat booking, dan
berhenti untuk menolak ketika permintaan melanggar aturan budaya atau berada di
luar kewenangannya. Di proses, ia berhenti untuk memverifikasi sebelum mengklaim
berhasil.

Keduanya bukan kebetulan yang sama. Yang kedua mengajari saya yang pertama.

---

*CariUstadz — AI CAN DO IT · Tencent Cloud Hackathon Indonesia 2026*
*Demo: https://cariustad-apps.vercel.app · Repo: https://github.com/khayzerrrrr/cariustad-apps*
