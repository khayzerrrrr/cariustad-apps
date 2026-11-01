/**
 * Utilitas untuk "membaca" struktur model GLB pada saat runtime.
 * Tujuannya: avatar apa pun (Ready Player Me, Sketchfab, Mixamo, MetaHuman)
 * boleh ditaruh apa adanya, dan kode menyesuaikan sendiri — tanpa edit manual.
 */

import * as THREE from "three";

/* ================================================================== */
/*  NAMA MORPH TARGET                                                  */
/* ================================================================== */

/** Bukaan rahang — dipakai untuk semua fonem vokal & konsonan */
export const JAW_NAMES = [
  "jawOpen",
  "jaw_open",
  "mouthOpen",
  "mouth_open",
  "viseme_aa",
  "viseme_AA",
  "A",
  "aa",
  "Ah",
];

/** Lebar mulut / senyum */
export const WIDE_NAMES = [
  "mouthSmile",
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouth_wide",
  "viseme_I",
  "viseme_E",
  "I",
  "E",
];

/** Kebulatan bibir (O / U) */
export const PUCKER_NAMES = [
  "mouthPucker",
  "mouthFunnel",
  "mouth_pucker",
  "viseme_O",
  "viseme_U",
  "viseme_ou",
  "O",
  "U",
];

/** Kedip mata kiri & kanan dipisah supaya bisa independen */
export const BLINK_LEFT_NAMES = ["eyeBlinkLeft", "eyesClosed", "eyeBlink_L", "blinkLeft"];
export const BLINK_RIGHT_NAMES = ["eyeBlinkRight", "eyesClosed", "eyeBlink_R", "blinkRight"];

/**
 * Penanda morph yang BUKAN mulut. Dicocokkan per-kata (dipisah `_`, `-`,
 * atau CamelCase), supaya "MOUTH_SMILE" tidak ikut tertolak hanya karena
 * huruf "e" di kata "sneer".
 */
const NON_MOUTH_WORDS = new Set([
  "eye", "eyes", "blink", "brow", "brows", "nose", "cheek", "cheeks",
  "tongue", "teeth", "squint", "puff", "look", "sneer", "lid", "lids",
  "jaw", "chin", "ear", "ears", "forehead",
]);

/**
 * Pecah nama morph jadi kata-kata: "MOUTH_SMILE" → mouth, smile;
 * "eyeBlinkLeft" → eye, blink, left.
 */
function wordsOf(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_\-.:]+/)
    .map((w) => w.toLowerCase())
    .filter(Boolean);
}

/** Apakah morph ini jelas berada di area mata/hidung (bukan mulut). */
function isNonMouth(name: string): boolean {
  return wordsOf(name).some((w) => NON_MOUTH_WORDS.has(w));
}

/**
 * Cari indeks morph target dari daftar nama kandidat.
 *
 * Tiga tahap, dari paling aman ke paling longgar:
 *   1. Cocok persis
 *   2. Cocok tanpa peduli huruf besar/kecil
 *   3. Cocok sebagian — HANYA untuk nama kandidat yang panjang (>= 5 huruf),
 *      supaya "O" tidak menyerempet "eyesClosed" atau "noseSneer",
 *      dan dilewati kalau morph-nya jelas milik area mata/hidung.
 */
export function findMorphIndex(
  dict: Record<string, number> | undefined,
  names: string[]
): number {
  if (!dict) return -1;

  // 1. Cocok persis
  for (const n of names) {
    if (n in dict) return dict[n];
  }

  const keys = Object.keys(dict);

  // 2. Cocok tanpa peduli huruf besar/kecil
  for (const n of names) {
    const hit = keys.find((k) => k.toLowerCase() === n.toLowerCase());
    if (hit) return dict[hit];
  }

  // 3. Cocok sebagian — hanya nama panjang, dan hanya di luar area mata/hidung
  for (const n of names) {
    const target = wordsOf(n);
    if (target.join("").length < 5) continue;

    const hit = keys.find((k) => {
      if (isNonMouth(k)) return false;
      const kw = wordsOf(k);
      const joined = kw.join("");
      // Semua kata kandidat harus muncul di nama morph, atau sebaliknya
      return (
        target.every((w) => kw.includes(w)) ||
        kw.every((w) => target.includes(w)) ||
        joined.includes(target.join("")) ||
        target.join("").includes(joined)
      );
    });
    if (hit) return dict[hit];
  }

  return -1;
}

/* ================================================================== */
/*  UKURAN & PEMUSATAN                                                 */
/* ================================================================== */

export interface ModelMetrics {
  /** Bounding box seluruh model dalam ruang lokal (world-ready) */
  box: THREE.Box3;
  size: THREE.Vector3;
  center: THREE.Vector3;
  /** Tinggi total model (meter, kalau model memakai skala meter) */
  height: number;
  /** Rasio tinggi/lebar — dipakai untuk mendeteksi model "potret saja" */
  aspect: number;
  /** Apakah modelnya cuma kepala (tidak ada badan) */
  headOnly: boolean;
}

/**
 * Ukur model. `refHeight` adalah tinggi yang diharapkan:
 * model dewasa berdiri ≈ 1.7 m, model setengah badan ≈ 0.9 m.
 */
export function measureModel(scene: THREE.Object3D): ModelMetrics {
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const height = Math.max(size.y, 1e-4);
  const width = Math.max(size.x, 1e-4);

  return {
    box,
    size,
    center,
    height,
    aspect: height / width,
    // Model hanya-kepala biasanya jauh lebih tinggi dari lebar
    // (kepala manusia ≈ 1.3× lebih tinggi dari lebar bahu kalau tanpa badan)
    headOnly: height / Math.max(size.z, 1e-4) < 1.4 && height < width * 1.9,
  };
}

/**
 * Normalisasi skala: jadikan model setinggi `targetHeight`,
 * lalu letakkan titik terendahnya di `groundY`.
 */
export function normalizeScale(metrics: ModelMetrics, targetHeight: number): number {
  if (!Number.isFinite(metrics.height) || metrics.height <= 0) return 1;
  return targetHeight / metrics.height;
}

/* ================================================================== */
/*  ORIENTASI                                                          */
/* ================================================================== */

/**
 * Beberapa model diekspor menghadap -Z atau +X.
 * Fungsi ini menebak orientasi dari bounding box; kalau wajah tidak
 * terdeteksi, kembalikan 0 supaya model dibiarkan apa adanya.
 */
export function guessYawFix(scene: THREE.Object3D): number {
  // Cari tulang hidung — penanda paling andal arah hadap wajah
  let nose: THREE.Object3D | null = null;
  scene.traverse((o) => {
    if (!nose && /nose|head|face/i.test(o.name)) nose = o;
  });

  // Tanpa petunjuk, coba tebak dari asimetri sumbu Z
  const meshBox = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  meshBox.getSize(size);

  // Model manusia lebih tipis di Z daripada di X (bahu lebih lebar dari tebal badan)
  if (size.x > 1e-4 && size.z > 1e-4) {
    if (size.z > size.x * 1.35) {
      // Kemungkinan menghadap +X atau -X → putar 90°
      return Math.PI / 2;
    }
  }
  return 0;
}

/* ================================================================== */
/*  BONE                                                               */
/* ================================================================== */

/** Cari bone kepala untuk animasi menoleh dan pengaturan kamera. */
export function findHeadBone(scene: THREE.Object3D): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  scene.traverse((o) => {
    if (found) return;
    // Ketat: harus Bone atau punya nama Head persis
    if (o.type === "Bone" && /^(head|mixamorig:head|head_?\d*)$/i.test(o.name)) {
      found = o;
    }
  });
  if (found) return found;

  // Longgar: apa pun yang mengandung "head"
  scene.traverse((o) => {
    if (found) return;
    if (o.type === "Bone" && /head/i.test(o.name)) found = o;
  });
  return found;
}

/** Ambil posisi dunia bone kepala — untuk mengarahkan kamera tepat ke wajah. */
export function headWorldPosition(
  scene: THREE.Object3D,
  head: THREE.Object3D | null
): THREE.Vector3 | null {
  if (!head) return null;
  scene.updateWorldMatrix(true, true);
  return new THREE.Vector3().setFromMatrixPosition(head.matrixWorld);
}

/* ================================================================== */
/*  TEKSTUR                                                            */
/* ================================================================== */

/**
 * Model Sketchfab sering membawa gambar 4K (10–20 MB) yang membuat
 * ponsel juri tersedak. Turunkan resolusi tekstur ke `maxSize` piksel.
 */
export function clampTextureSize(material: THREE.Material, maxSize = 1024): void {
  const m = material as THREE.MeshStandardMaterial;
  const maps: Array<keyof THREE.MeshStandardMaterial> = ["map", "normalMap", "roughnessMap"];

  for (const key of maps) {
    const tex = m[key] as THREE.Texture | null | undefined;
    if (!tex || !tex.image) continue;
    const img = tex.image as { width?: number; height?: number };
    const w = img.width ?? 0;
    const h = img.height ?? 0;
    if (w <= maxSize && h <= maxSize) continue;

    // Three.js bisa menurunkan resolusi saat upload ke GPU lewat
    // `minFilter` + `anisotropy`, tapi cara paling hemat memori adalah
    // membatasi ukuran gambar sumber sebelum diunggah.
    try {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxSize / w, maxSize / h);
      canvas.width = Math.max(1, Math.round(w * ratio));
      canvas.height = Math.max(1, Math.round(h * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      ctx.drawImage(tex.image as CanvasImageSource, 0, 0, canvas.width, canvas.height);
      const scaled = new THREE.CanvasTexture(canvas);
      scaled.colorSpace = tex.colorSpace;
      scaled.flipY = tex.flipY;
      scaled.wrapS = tex.wrapS;
      scaled.wrapT = tex.wrapT;
      scaled.needsUpdate = true;
      tex.dispose();
      (m as unknown as Record<string, unknown>)[key as string] = scaled;
    } catch {
      /* Kalau gagal, biarkan tekstur asli — lebih baik berat daripada kosong */
    }
  }
  m.needsUpdate = true;
}

/** Beri tahu berapa morph target yang berhasil dikenali (untuk debugging). */
export function describeMorphs(scene: THREE.Object3D): string[] {
  const found = new Set<string>();
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && mesh.morphTargetDictionary) {
      Object.keys(mesh.morphTargetDictionary).forEach((k) => found.add(k));
    }
  });
  return Array.from(found).sort();
}
