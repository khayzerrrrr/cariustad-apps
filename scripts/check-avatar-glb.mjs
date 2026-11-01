/**
 * Memvalidasi model GLB: apakah bisa dibaca, punya morph target yang
 * dikenali, dan dimensinya masuk akal untuk avatar asisten.
 *
 * Jalankan: node scripts/check-avatar-glb.mjs [path]
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const target = resolve(process.argv[2] || join(ROOT, "public", "models", "test-avatar.glb"));

const JAW = ["jawOpen", "jaw_open", "mouthOpen", "mouth_open", "viseme_aa", "A", "aa", "Ah"];
const WIDE = ["mouthSmile", "mouthSmileLeft", "mouthSmileRight", "mouth_wide", "viseme_I", "I", "E"];
const PUCKER = ["mouthPucker", "mouthFunnel", "mouth_pucker", "viseme_O", "viseme_U", "O", "U"];
const BLINK_L = ["eyeBlinkLeft", "eyesClosed", "blinkLeft"];
const BLINK_R = ["eyeBlinkRight", "eyesClosed", "blinkRight"];

function match(names, available) {
  for (const n of names) {
    if (available.includes(n)) return n;
  }
  const lower = available.map((a) => a.toLowerCase());
  for (const n of names) {
    const i = lower.indexOf(n.toLowerCase());
    if (i >= 0) return available[i];
  }
  return null;
}

/* ---------------- Baca GLB ---------------- */
console.log("Memeriksa:", target, "\n");

if (!existsSync(target)) {
  console.error("✗ File tidak ditemukan.");
  process.exit(1);
}

const sizeMB = statSync(target).size / (1024 * 1024);
const buf = readFileSync(target);

const magic = buf.readUInt32LE(0);
if (magic !== 0x46546c67) {
  console.error("✗ Bukan file GLB yang sah (magic bytes salah).");
  process.exit(1);
}

const version = buf.readUInt32LE(4);
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));

/* ---------------- Laporan ---------------- */
const lines = [];
const ok = (label, value) => lines.push(`  ✓ ${label.padEnd(22)} ${value}`);
const warn = (label, value) => lines.push(`  ! ${label.padEnd(22)} ${value}`);
const bad = (label, value) => lines.push(`  ✗ ${label.padEnd(22)} ${value}`);

lines.push("STRUKTUR");
ok("Versi glTF", version);
ok("Ukuran file", `${sizeMB.toFixed(2)} MB`);
ok("Mesh", json.meshes?.length ?? 0);
ok("Node", json.nodes?.length ?? 0);
ok("Material", json.materials?.length ?? 0);
ok("Skin / rig", json.skins?.length ? `${json.skins.length} skin` : "tidak ada");

/* ---------------- Morph target ---------------- */
const morphNames = new Set();
for (const mesh of json.meshes ?? []) {
  const names = mesh.extras?.targetNames ?? [];
  names.forEach((n) => morphNames.add(n));
  for (const prim of mesh.primitives ?? []) {
    (prim.targets ?? []).forEach((_, i) => {
      if (!names[i]) morphNames.add(`target_${i}`);
    });
  }
}
const available = Array.from(morphNames);

lines.push("");
lines.push("LIP SYNC");
if (available.length === 0) {
  bad("Morph target", "TIDAK ADA — lip sync tidak akan jalan");
} else {
  ok("Jumlah morph target", available.length);
  lines.push(`    ${available.join(", ")}`);

  const jaw = match(JAW, available);
  const wide = match(WIDE, available);
  const pucker = match(PUCKER, available);
  const bl = match(BLINK_L, available);
  const br = match(BLINK_R, available);

  lines.push("");
  lines.push("  Pemetaan:");
  jaw ? ok("Rahang (buka mulut)", jaw) : bad("Rahang (buka mulut)", "tidak ditemukan");
  wide ? ok("Lebar mulut", wide) : warn("Lebar mulut", "tidak ditemukan (opsional)");
  pucker ? ok("Bibir bulat O/U", pucker) : warn("Bibir bulat O/U", "tidak ditemukan (opsional)");
  bl ? ok("Kedip kiri", bl) : warn("Kedip kiri", "tidak ditemukan (opsional)");
  br ? ok("Kedip kanan", br) : warn("Kedip kanan", "tidak ditemukan (opsional)");
}

/* ---------------- Dimensi ---------------- */
lines.push("");
lines.push("DIMENSI");
const posAcc = json.accessors?.[0];
if (posAcc?.min && posAcc?.max) {
  const w = posAcc.max[0] - posAcc.min[0];
  const h = posAcc.max[1] - posAcc.min[1];
  const d = posAcc.max[2] - posAcc.min[2];
  ok("Lebar (X)", `${w.toFixed(3)} m`);
  ok("Tinggi (Y)", `${h.toFixed(3)} m`);
  ok("Tebal (Z)", `${d.toFixed(3)} m`);
  ok("Rasio T/L", (h / w).toFixed(2));

  // Skala normalisasi yang akan dipakai kode
  const TARGET = 1.05;
  ok("Skala otomatis", `${(TARGET / h).toFixed(3)}×`);

  if (h > 3) warn("Catatan", "Model lebih tinggi dari 3 m — cek satuan (cm bukan m?)");
  if (h < 0.2) warn("Catatan", "Model sangat kecil — kemungkinan satuan berbeda");
}

/* ---------------- kesimpulan ---------------- */
lines.push("");
const jawOk = match(JAW, available);
lines.push("KESIMPULAN");
if (jawOk) {
  lines.push("  ✓ Model siap dipakai. Lip sync akan berjalan.");
} else {
  lines.push("  ! Model bisa dimuat, tapi tanpa lip sync — hanya gerak kepala.");
  lines.push("    Coba model Ready Player Me untuk morph target lengkap.");
}

console.log(lines.join("\n"));
