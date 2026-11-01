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
const META = resolve(__dirname, "../public/avatar/photo-face-meta.json");

let fails = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "GAGAL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) fails++;
};

check("file PNG wajah ada", existsSync(IMG), IMG);
check("file metadata ada", existsSync(META), META);
if (fails > 0) process.exit(1);

/* --- PNG IHDR: lebar & tinggi dari byte 16..24 --- */
const buf = readFileSync(IMG);
const isPng =
  buf.length > 24 &&
  buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
check("berkas adalah PNG valid", isPng);
const w = isPng ? buf.readUInt32BE(16) : 0;
const h = isPng ? buf.readUInt32BE(20) : 0;
const bitDepth = isPng ? buf[24] : 0;
const colorType = isPng ? buf[25] : 0;
check("ukuran PNG = metadata", w === 640 && h === 853, `${w}x${h}`);
check("PNG punya kanal alfa (RGBA)", colorType === 6, `colorType=${colorType}, depth=${bitDepth}`);

/* --- metadata --- */
const meta = JSON.parse(readFileSync(META, "utf8"));
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

console.log(fails === 0 ? "\nSEMUA LULUS — aset avatar foto siap" : `\n${fails} cek gagal`);
process.exit(fails === 0 ? 0 : 1);
