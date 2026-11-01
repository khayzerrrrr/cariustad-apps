# Model Avatar 3D (GLB)

Folder ini menampung model avatar 3D ber-rig. Avatar prosedural bawaan
(`AvatarHead.tsx`) hanya pengganti sementara — begitu ada file GLB di sini
dan URL-nya diisi di `.env.local`, aplikasi otomatis memakai model tersebut.

---

## Mulai cepat: Ready Player Me (15 menit)

Ini jalur tercepat dan paling aman untuk demo. Model RPM punya morph target
ARKit lengkap, jadi lip sync dan kedip mata langsung jalan tanpa penyesuaian.

### 1. Buat avatar

1. Buka https://readyplayer.me
2. Klik **Create Avatar** (tidak perlu daftar untuk ekspor cepat;
   daftar kalau ingin menyimpan dan mengedit ulang).
3. Rias sedemikian rupa — pilih kulit, bentuk wajah, kumis/jenggot,
   dan **peci/kopiah** jika tersedia di bagian *Headwear*.
4. Selesai → klik **Next** → **Download avatar**.

### 2. Ekspor sebagai GLB

Pada dialog ekspor:

| Setelan | Nilai yang dipakai |
|---|---|
| Format | **glTF Binary (.glb)** |
| Include | Centang **morph targets** / *ARKit blendshapes* |
| Pose | **A-pose** atau **T-pose** (jangan pose kustom) |
| Texture | Ukuran penuh, tapi lihat catatan kompresi di bawah |

Simpan filenya sebagai:

```
public/models/avatar.glb
```

### 3. Aktifkan

Buka `.env.local` di root proyek, ubah baris berikut:

```env
NEXT_PUBLIC_AVATAR_GLB=/models/avatar.glb
```

Lalu restart dev server:

```bash
npm run dev
```

### 4. Periksa hasilnya

```bash
node scripts/check-avatar-glb.mjs public/models/avatar.glb
```

Kalau muncul:

```
✓ Rahang (buka mulut)    jawOpen
✓ Lebar mulut            mouthSmile
✓ Kedip kiri             eyeBlinkLeft
✓ Kedip kanan            eyeBlinkRight
✓ Model siap dipakai. Lip sync akan berjalan.
```

…berarti sudah benar. Buka `/asisten` dan ucapkan sesuatu.

---

## Cara kerja otomatis

Kode menyesuaikan diri sendiri, jadi Anda **tidak perlu** mengedit kode saat
mengganti model (`src/lib/avatar/glbProbe.ts` + `src/components/avatar/AvatarGLB.tsx`).

| Yang dilakukan | Bagaimana |
|---|---|
| **Skala** | Model diukur, ditinggikan otomatis ke 1,05 m. Model 1,7 m atau 70 cm sama-sama pas. |
| **Posisi** | Titik terendah model diletakkan di `y = 0`, lalu digeser horizontal ke tengah. |
| **Orientasi** | Kalau model lebih tebal di Z daripada X (menghadap samping), diputar 90° otomatis. |
| **Nama morph** | Dicocokkan 3 tahap: persis → abaikan kapital → per-kata. Mendukung RPM, ARKit, VRM, MetaHuman, dan viseme Apple. |
| **Tekstur** | Tekstur > 1024 px dikecilkan saat dimuat supaya RAM GPU aman di ponsel. |
| **Bayangan** | `castShadow` / `receiveShadow` dinyalakan otomatis untuk semua mesh. |
| **Kamera** | Jarak kamera dan titik fokus menyesuaikan setelan GLB (lihat `AvatarScene.tsx`). |
| **Kegagalan** | Model gagal dimuat → otomatis kembali ke avatar prosedural, tidak crash. |

### Nama morph yang dikenali

- **Rahang:** `jawOpen`, `jaw_open`, `mouthOpen`, `viseme_aa`, `A`, `aa`
- **Lebar mulut:** `mouthSmile`, `mouthSmileLeft`, `viseme_I`, `viseme_E`
- **Bibir bulat:** `mouthPucker`, `mouthFunnel`, `viseme_O`, `viseme_U`
- **Kedip:** `eyeBlinkLeft`, `eyeBlinkRight`, `eyesClosed`

Hanya `jawOpen` yang wajib. Sisanya opsional — tanpa itu, lip sync tetap
jalan dengan gerakan rahang saja.

---

## Model uji bawaan

`test-avatar.glb` adalah kepala sederhana (3.840 segitiga) yang dibuat oleh
`scripts/make-test-avatar.mjs`. Model ini **bukan** untuk demo ke juri —
gunanya memverifikasi bahwa jalur GLB bekerja sebelum Anda sempat mengunduh
model asli. Cara membuat ulang:

```bash
node scripts/make-test-avatar.mjs
```

---

## Sumber model lain

**Gratis:**

| Sumber | Kualitas | Catatan |
|---|---|---|
| **Ready Player Me** — readyplayer.me | Semi-realistis | Paling praktis, morph lengkap |
| **Sketchfab** — sketchfab.com | Bisa fotorealistis | Filter CC0 / CC-BY, cari "muslim man rigged" |
| **Mixamo** — mixamo.com | Rig humanoik | Animasi gratis, tapi tak ada blendShapes |

**Berbayar (fotorealistis):**

| Sumber | Kualitas | Catatan |
|---|---|---|
| **Character Creator 4** | Produksi | Ekspor GLB langsung |
| **MetaHuman** (Unreal) | Sangat tinggi | Butuh konversi ke GLB lewat plugin |
| **CGTrader / TurboSquid** | Bervariasi | Cari "photorealistic head rigged blendshapes" |

---

## Kalau butuh avatar ustadzah

Sama persis — cukup ganti file GLB. Model berhijab tidak punya morph target
rambut, jadi tidak ada konflik. Semua logika lip sync & kedip tetap berlaku.
Ready Player Me punya opsi hijab di bagian *Headwear*.

---

## Kompresi kalau file terlalu besar

GLB dari RPM bisa 5–15 MB. Target aman untuk demo adalah **< 5 MB**:

```bash
npx @gltf-transform/cli optimize avatar.glb avatar-opt.glb --texture-compress webp
```

Periksa hasilnya lagi dengan `node scripts/check-avatar-glb.mjs`.

---

## Kembali ke avatar prosedural

Hapus atau kosongkan baris di `.env.local`:

```env
# NEXT_PUBLIC_AVATAR_GLB=/models/avatar.glb
```

Restart server. Aplikasi memakai `AvatarHead.tsx` lagi.
