/**
 * Cek aset avatar foto (lokal, tanpa jaringan):
 *  - PNG wajah ada & ukurannya cocok dengan metadata
 *  - Metadata landmark masuk akal: urutan vertikal mata < hidung < mulut,
 *    pusat mulut di antara dua sudut, semua nilai 0..1
 *  - Proporsi overlay masuk akal (lebar mulut < jarak antar mata × 1.2)
 *
 * Jalankan: npx tsx scripts/check-photo-avatar.ts
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const IMG = resolve(__dirname, "../public/avatar/photo-face.png");
const JAW = resolve(__dirname, "../public/avatar/photo-face-jaw.png");
const META = resolve(__dirname, "../public/avatar/photo-face-meta.json");

let fails = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "GAGAL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) fails++;
};

check("file PNG wajah ada", existsSync(IMG), IMG);
check("file PNG rahang ada", existsSync(JAW), JAW);
check("file metadata ada", existsSync(META), META);
if (fails > 0) process.exit(1);

/* --- PNG IHDR: lebar & tinggi dari byte 16..24 --- */
const buf = readFileSync(IMG);
const jawBuf = readFileSync(JAW);
const isPng = (b: Buffer) =>
  b.length > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
check("berkas wajah adalah PNG valid", isPng(buf));
check("berkas rahang adalah PNG valid", isPng(jawBuf));
const w = buf.readUInt32BE(16);
const h = buf.readUInt32BE(20);
const jw = jawBuf.readUInt32BE(16);
const jh = jawBuf.readUInt32BE(20);
check("ukuran PNG wajah = metadata", w === 640 && h === 853, `${w}x${h}`);
check(
  "kedua PNG punya kanal alfa (RGBA)",
  buf[25] === 6 && jawBuf[25] === 6,
  `colorType wajah=${buf[25]}, rahang=${jawBuf[25]}`
);

/* --- metadata --- */
const meta = JSON.parse(readFileSync(META, "utf8"));

/* Rahang HARUS LEBIH PENDEK dari wajah — ini potongan, bukan wajah kedua.
   Jika sama tinggi, komponen akan menampilkan wajah ganda (bug double). */
check(
  "PNG rahang = potongan (lebar sama, tinggi = (1-topY) × tinggi wajah)",
  jw === w && Math.abs(jh - h * (1 - meta.jawSlice.topY)) <= 2,
  `${jw}x${jh} vs ekspektasi ${w}x${Math.round(h * (1 - meta.jawSlice.topY))}`
);
const inRange = (v: number) => v >= 0 && v <= 1;
const allPts = [meta.eyeR, meta.eyeL, meta.nose, meta.mouthCenter, meta.mouthCornerR, meta.mouthCornerL];
check(
  "semua landmark dalam rentang 0..1",
  allPts.every((p: { x: number; y: number }) => inRange(p.x) && inRange(p.y))
);

const eyesMaxY = Math.max(meta.eyeR.y, meta.eyeL.y);
check("hidung di bawah mata", meta.nose.y > eyesMaxY, `hidung ${meta.nose.y} > mata ${eyesMaxY.toFixed(4)}`);
check("mulut di bawah hidung", meta.mouthCenter.y > meta.nose.y, `mulut ${meta.mouthCenter.y} > hidung ${meta.nose.y}`);

const cxMid = (meta.mouthCornerR.x + meta.mouthCornerL.x) / 2;
check(
  "pusat mulut di antara dua sudut",
  meta.mouthCenter.x > Math.min(meta.mouthCornerR.x, meta.mouthCornerL.x) &&
    meta.mouthCenter.x < Math.max(meta.mouthCornerR.x, meta.mouthCornerL.x),
  `pusat ${meta.mouthCenter.x}, tengah sudut ${cxMid.toFixed(4)}`
);

check(
  "lebar mulut < 1.2 × jarak antar mata (proporsi wajar)",
  meta.mouthWidthNorm < meta.eyeSpreadNorm * 1.2,
  `mulut ${meta.mouthWidthNorm} vs mata ${meta.eyeSpreadNorm}`
);

check("warna kulit terdefinisi (hex)", /^#[0-9a-f]{6}$/i.test(meta.skinColor ?? ""), meta.skinColor);
check("skor deteksi wajah > 0.8", meta.face.score > 0.8, `skor ${meta.face.score}`);

/* --- lapisan rahang (jaw slice) --- */
const js = meta.jawSlice;
check("metadata jawSlice ada", !!js && typeof js.topY === "number");
check(
  "garis potong rahang antara hidung dan bawah gambar",
  js.topY > meta.nose.y && js.topY < 0.95,
  `topY ${js.topY} vs hidung ${meta.nose.y}`
);
check(
  "garis potong dekat pusat mulut (±5%)",
  Math.abs(js.topY - meta.mouthCenter.y) < 0.05,
  `topY ${js.topY} vs mulut ${meta.mouthCenter.y}`
);
check("turunan rahang wajar (1%..6% tinggi gambar)", js.maxDrop > 0.01 && js.maxDrop < 0.06, `maxDrop ${js.maxDrop}`);
check("feather rahang ada (>0)", js.feather > 0, `feather ${js.feather}`);

console.log(fails === 0 ? "\nSEMUA LULUS — aset avatar foto siap" : `\n${fails} cek gagal`);
process.exit(fails === 0 ? 0 : 1);
