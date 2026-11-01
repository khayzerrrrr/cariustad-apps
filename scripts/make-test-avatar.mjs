/**
 * Membuat model GLB uji: kepala sederhana + morph target lip sync + blink.
 * Tujuannya memverifikasi jalur kode AvatarGLB → glbProbe tanpa perlu
 * mengunduh model asli lebih dulu.
 *
 * Jalankan:
 *   node scripts/make-test-avatar.mjs
 * Hasil: public/models/test-avatar.glb
 *
 * Tidak butuh dependensi tambahan — GLB ditulis manual sesuai spesifikasi
 * glTF 2.0 binary container.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "models");
const OUT_FILE = join(OUT_DIR, "test-avatar.glb");

/* ================================================================== */
/*  GEOMETRI                                                           */
/* ================================================================== */

const SEG_LON = 48; // keliling
const SEG_LAT = 40; // atas-bawah

/** Titik bola dengan deformasi sederhana membentuk kepala. */
function headPoint(u, v) {
  // u: 0..1 keliling, v: 0..1 dari atas ke bawah
  const theta = u * Math.PI * 2;
  const phi = v * Math.PI;

  let x = Math.sin(phi) * Math.cos(theta);
  let y = Math.cos(phi);
  let z = Math.sin(phi) * Math.sin(theta);

  // Skala dasar kepala
  x *= 0.21;
  y *= 0.275;
  z *= 0.235;

  // Rapatkan dagu
  if (y < 0) {
    const down = -y / 0.55;
    x *= 1 - down * 0.35;
    z *= 1 - down * 0.25;
  }
  return [x, y, z];
}

/** Varian untuk morph target "jawOpen": rahang turun. */
function headPointJawOpen(u, v, amount) {
  const [x, y, z] = headPoint(u, v);
  if (y < 0.0) {
    const t = Math.min(1, -y / 0.275);
    const weight = t * t;
    return [x, y - amount * weight, z * (1 + amount * 0.15 * weight)];
  }
  return [x, y, z];
}

/** Varian "mouthSmile": sudut mulut naik & melebar sedikit. */
function headPointSmile(u, v) {
  const [x, y, z] = headPoint(u, v);
  const inMouthBand = y > -0.45 && y < -0.2 && z > 0.15;
  if (inMouthBand) {
    const side = Math.sign(x);
    return [x + side * 0.02, y + 0.018, z + 0.004];
  }
  return [x, y, z];
}

/* ================================================================== */
/*  BUILD BUFFER                                                       */
/* ================================================================== */

const vertexCount = (SEG_LON + 1) * (SEG_LAT + 1);
const positions = new Float32Array(vertexCount * 3);
const normals = new Float32Array(vertexCount * 3);
const uvs = new Float32Array(vertexCount * 2);
const jawOpenPos = new Float32Array(vertexCount * 3);
const smilePos = new Float32Array(vertexCount * 3);

let p = 0;
for (let lat = 0; lat <= SEG_LAT; lat++) {
  const v = lat / SEG_LAT;
  for (let lon = 0; lon <= SEG_LON; lon++) {
    const u = lon / SEG_LON;
    const [x, y, z] = headPoint(u, v);
    positions[p * 3] = x;
    positions[p * 3 + 1] = y;
    positions[p * 3 + 2] = z;

    // Normal ≈ arah dari pusat (cukup untuk bola terdeformasi ringan)
    const len = Math.hypot(x / 0.21, y / 0.275, z / 0.235) || 1;
    normals[p * 3] = x / 0.21 / len;
    normals[p * 3 + 1] = y / 0.275 / len;
    normals[p * 3 + 2] = z / 0.235 / len;

    uvs[p * 2] = u;
    uvs[p * 2 + 1] = 1 - v;

    const jw = headPointJawOpen(u, v, 0.12);
    jawOpenPos[p * 3] = jw[0];
    jawOpenPos[p * 3 + 1] = jw[1];
    jawOpenPos[p * 3 + 2] = jw[2];

    const sm = headPointSmile(u, v);
    smilePos[p * 3] = sm[0];
    smilePos[p * 3 + 1] = sm[1];
    smilePos[p * 3 + 2] = sm[2];

    p++;
  }
}

// Indeks
const indices = [];
for (let lat = 0; lat < SEG_LAT; lat++) {
  for (let lon = 0; lon < SEG_LON; lon++) {
    const a = lat * (SEG_LON + 1) + lon;
    const b = a + SEG_LON + 1;
    indices.push(a, b, a + 1);
    indices.push(a + 1, b, b + 1);
  }
}
const indexArray = new Uint16Array(indices);

/* ================================================================== */
/*  PACK BIN                                                           */
/* ================================================================== */

const chunks = [];
let offset = 0;

/**
 * glTF tidak mengizinkan `byteOffset` pada accessor yang menunjuk ke
 * bufferView dengan target vertex. Jadi setiap larik WAJIB punya
 * bufferView sendiri, dan bufferView-lah yang memegang byteOffset global.
 */
function pushView(typedArray, target) {
  const buf = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
  const pad = (4 - (buf.length % 4)) % 4;
  const padded = Buffer.concat([buf, Buffer.alloc(pad)]);
  const byteOffset = offset;
  chunks.push({ buffer: padded, byteOffset, target });
  offset += padded.length;
  return { byteOffset, byteLength: buf.length };
}

const posView = pushView(positions, 34962);
const normView = pushView(normals, 34962);
const uvView = pushView(uvs, 34962);
const jawView = pushView(jawOpenPos, 34962);
const smileView = pushView(smilePos, 34962);
const idxView = pushView(indexArray, 34963);

const binBuffer = Buffer.concat(chunks.map((c) => c.buffer));

/* Indeks bufferView untuk tiap atribut */
const BV = { pos: 0, norm: 1, uv: 2, jaw: 3, smile: 4, idx: 5 };

/** Hitung min/max untuk sebuah larik VEC3. */
function vec3Bounds(arr) {
  const mn = [Infinity, Infinity, Infinity];
  const mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < arr.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const v = arr[i + k];
      if (v < mn[k]) mn[k] = v;
      if (v > mx[k]) mx[k] = v;
    }
  }
  return { min: mn, max: mx };
}

/* ================================================================== */
/*  glTF JSON                                                          */
/* ================================================================== */

const gltf = {
  asset: { version: "2.0", generator: "CariUstadz test-avatar generator" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: "TestHead" }],
  meshes: [
    {
      name: "TestHead",
      primitives: [
        {
          attributes: {
            POSITION: 0,
            NORMAL: 1,
            TEXCOORD_0: 2,
          },
          indices: 3,
          material: 0,
          targets: [{ POSITION: 4 }, { POSITION: 5 }],
        },
      ],
      weights: [0, 0],
    },
  ],
  materials: [
    {
      name: "Skin",
      pbrMetallicRoughness: {
        baseColorFactor: [0.78, 0.6, 0.46, 1],
        metallicFactor: 0,
        roughnessFactor: 0.72,
      },
      doubleSided: false,
    },
  ],
  accessors: [
    {
      bufferView: BV.pos,
      byteOffset: 0,
      componentType: 5126,
      count: vertexCount,
      type: "VEC3",
      ...vec3Bounds(positions),
    },
    {
      bufferView: BV.norm,
      byteOffset: 0,
      componentType: 5126,
      count: vertexCount,
      type: "VEC3",
    },
    {
      bufferView: BV.uv,
      byteOffset: 0,
      componentType: 5126,
      count: vertexCount,
      type: "VEC2",
    },
    {
      bufferView: BV.idx,
      byteOffset: 0,
      componentType: 5123,
      count: indexArray.length,
      type: "SCALAR",
    },
    {
      bufferView: BV.jaw,
      byteOffset: 0,
      componentType: 5126,
      count: vertexCount,
      type: "VEC3",
      ...vec3Bounds(jawOpenPos),
    },
    {
      bufferView: BV.smile,
      byteOffset: 0,
      componentType: 5126,
      count: vertexCount,
      type: "VEC3",
      ...vec3Bounds(smilePos),
    },
  ],
  bufferViews: [
    { buffer: 0, byteOffset: posView.byteOffset, byteLength: posView.byteLength, target: 34962 },
    { buffer: 0, byteOffset: normView.byteOffset, byteLength: normView.byteLength, target: 34962 },
    { buffer: 0, byteOffset: uvView.byteOffset, byteLength: uvView.byteLength, target: 34962 },
    { buffer: 0, byteOffset: jawView.byteOffset, byteLength: jawView.byteLength, target: 34962 },
    { buffer: 0, byteOffset: smileView.byteOffset, byteLength: smileView.byteLength, target: 34962 },
    { buffer: 0, byteOffset: idxView.byteOffset, byteLength: idxView.byteLength, target: 34963 },
  ],
  buffers: [{ byteLength: binBuffer.length }],
};

// Nama morph target disimpan di extras — tapi nama yang dikenali three.js
// adalah `mesh.morphTargetDictionary` yang berasal dari field `targetNames`
// pada mesh (ekstensi KHR di glTF: `mesh.extras.targetNames`).
gltf.meshes[0].extras = { targetNames: ["jawOpen", "mouthSmile"] };

/* ================================================================== */
/*  TULIS GLB                                                          */
/* ================================================================== */

const jsonStr = JSON.stringify(gltf);
const jsonBufRaw = Buffer.from(jsonStr, "utf8");
const jsonPad = (4 - (jsonBufRaw.length % 4)) % 4;
const jsonBuf = Buffer.concat([jsonBufRaw, Buffer.alloc(jsonPad, 0x20)]);
const binPad = (4 - (binBuffer.length % 4)) % 4;
const binBuf = Buffer.concat([binBuffer, Buffer.alloc(binPad, 0)]);

const totalLength = 12 + 8 + jsonBuf.length + 8 + binBuf.length;

const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0); // "glTF"
header.writeUInt32LE(2, 4);
header.writeUInt32LE(totalLength, 8);

const jsonHeader = Buffer.alloc(8);
jsonHeader.writeUInt32LE(jsonBuf.length, 0);
jsonHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON"

const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(binBuf.length, 0);
binHeader.writeUInt32LE(0x004e4942, 4); // "BIN"

const glb = Buffer.concat([header, jsonHeader, jsonBuf, binHeader, binBuf]);

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, glb);

console.log("✓ Model uji dibuat:", OUT_FILE);
console.log("  Ukuran      :", (glb.length / 1024).toFixed(1), "KB");
console.log("  Vertex      :", vertexCount);
console.log("  Triangle    :", indexArray.length / 3);
console.log("  Morph target: jawOpen, mouthSmile");
console.log("");
console.log("Aktifkan dengan menambahkan ke .env.local:");
console.log("  NEXT_PUBLIC_AVATAR_GLB=/models/test-avatar.glb");
