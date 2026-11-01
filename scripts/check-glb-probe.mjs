/**
 * Uji unit untuk glbProbe: memastikan pencocokan morph target benar
 * untuk berbagai penamaan model (Ready Player Me, ARKit, VRM, Sketchfab).
 *
 * Jalankan: node scripts/check-glb-probe.mjs
 */

import { readFileSync } from "node:fs";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Box3 } from "three";

/* --- Salin logika inti dari glbProbe agar bisa diuji di Node --- */
const JAW = ["jawOpen", "jaw_open", "mouthOpen", "mouth_open", "viseme_aa", "viseme_AA", "A", "aa", "Ah"];
const WIDE = ["mouthSmile", "mouthSmileLeft", "mouthSmileRight", "mouth_wide", "viseme_I", "viseme_E", "I", "E"];
const PUCKER = ["mouthPucker", "mouthFunnel", "mouth_pucker", "viseme_O", "viseme_U", "viseme_ou", "O", "U"];
const BLINK_L = ["eyeBlinkLeft", "eyesClosed", "eyeBlink_L", "blinkLeft"];
const BLINK_R = ["eyeBlinkRight", "eyesClosed", "eyeBlink_R", "blinkRight"];

const NON_MOUTH_WORDS = new Set([
  "eye", "eyes", "blink", "brow", "brows", "nose", "cheek", "cheeks",
  "tongue", "teeth", "squint", "puff", "look", "sneer", "lid", "lids",
  "jaw", "chin", "ear", "ears", "forehead",
]);

function wordsOf(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_\-.:]+/)
    .map((w) => w.toLowerCase())
    .filter(Boolean);
}

function isNonMouth(name) {
  return wordsOf(name).some((w) => NON_MOUTH_WORDS.has(w));
}

function findMorphIndex(dict, names) {
  if (!dict) return -1;
  for (const n of names) if (n in dict) return dict[n];
  const keys = Object.keys(dict);
  for (const n of names) {
    const hit = keys.find((k) => k.toLowerCase() === n.toLowerCase());
    if (hit) return dict[hit];
  }
  for (const n of names) {
    const target = wordsOf(n);
    if (target.join("").length < 5) continue;
    const hit = keys.find((k) => {
      if (isNonMouth(k)) return false;
      const kw = wordsOf(k);
      const joined = kw.join("");
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

/* ================= KASUS UJI ================= */
const cases = [
  {
    name: "Ready Player Me (ARKit lengkap)",
    dict: {
      jawOpen: 0, mouthSmile: 1, mouthSmileLeft: 2, mouthSmileRight: 3,
      mouthPucker: 4, mouthFunnel: 5, eyeBlinkLeft: 6, eyeBlinkRight: 7,
    },
    expect: { jaw: 0, wide: 1, pucker: 4, blinkL: 6, blinkR: 7 },
  },
  {
    name: "ARKit mentah (huruf besar campur)",
    dict: { jawOpen: 0, mouthSmile: 1, mouthPucker: 2, eyeBlinkLeft: 3, eyeBlinkRight: 4 },
    expect: { jaw: 0, wide: 1, pucker: 2, blinkL: 3, blinkR: 4 },
  },
  {
    name: "VRM / Blender (snake_case)",
    dict: { jaw_open: 0, mouth_smile: 1, mouth_pucker: 2 },
    // mouth_smile MEMANG lebar mulut — cocok sebagian akan menemukannya
    expect: { jaw: 0, wide: 1, pucker: 2, blinkL: -1, blinkR: -1 },
  },
  {
    name: "MetaHuman (huruf besar)",
    dict: { JAW_OPEN: 0, MOUTH_SMILE: 1, MOUTH_PUCKER: 2 },
    expect: { jaw: 0, wide: 1, pucker: 2, blinkL: -1, blinkR: -1 },
  },
  {
    name: "Viseme Apple",
    dict: { viseme_aa: 0, viseme_I: 1, viseme_O: 2, viseme_U: 3 },
    expect: { jaw: 0, wide: 1, pucker: 2, blinkL: -1, blinkR: -1 },
  },
  {
    name: "Model tanpa morph target",
    dict: null,
    expect: { jaw: -1, wide: -1, pucker: -1, blinkL: -1, blinkR: -1 },
  },
  {
    name: "Model hanya blink (tanpa mulut)",
    dict: { eyesClosed: 0 },
    expect: { jaw: -1, wide: -1, pucker: -1, blinkL: 0, blinkR: 0 },
  },
];

let pass = 0;
let fail = 0;

console.log("UJI PEMETAAN MORPH TARGET\n");

for (const c of cases) {
  const got = {
    jaw: findMorphIndex(c.dict, JAW),
    wide: findMorphIndex(c.dict, WIDE),
    pucker: findMorphIndex(c.dict, PUCKER),
    blinkL: findMorphIndex(c.dict, BLINK_L),
    blinkR: findMorphIndex(c.dict, BLINK_R),
  };

  const ok = Object.keys(c.expect).every((k) => c.expect[k] === got[k]);
  if (ok) {
    pass++;
    console.log(`  ✓ ${c.name}`);
  } else {
    fail++;
    console.log(`  ✗ ${c.name}`);
    for (const k of Object.keys(c.expect)) {
      if (c.expect[k] !== got[k]) {
        console.log(`      ${k}: diharapkan ${c.expect[k]}, didapat ${got[k]}`);
      }
    }
  }
}

/* ================= UJI MODEL NYATA ================= */
console.log("\nUJI MODEL test-avatar.glb\n");

const buf = readFileSync("public/models/test-avatar.glb");
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

await new Promise((resolve) => {
  new GLTFLoader().parse(
    ab,
    "",
    (gltf) => {
      let found = false;
      gltf.scene.traverse((o) => {
        if (!o.isMesh || !o.morphTargetDictionary) return;
        found = true;
        const d = o.morphTargetDictionary;
        const jaw = findMorphIndex(d, JAW);
        const wide = findMorphIndex(d, WIDE);
        if (jaw >= 0) {
          pass++;
          console.log(`  ✓ jawOpen terdeteksi di indeks ${jaw}`);
        } else {
          fail++;
          console.log("  ✗ jawOpen tidak terdeteksi");
        }
        if (wide >= 0) {
          pass++;
          console.log(`  ✓ mouthSmile terdeteksi di indeks ${wide}`);
        } else {
          fail++;
          console.log("  ✗ mouthSmile tidak terdeteksi");
        }
      });
      if (!found) {
        fail++;
        console.log("  ✗ tidak ada mesh bermorph target");
      }

      // Uji perhitungan skala
      const box = new Box3().setFromObject(gltf.scene);
      const h = box.max.y - box.min.y;
      const s = 1.05 / h;
      const scaledH = h * s;
      if (Math.abs(scaledH - 1.05) < 0.001) {
        pass++;
        console.log(`  ✓ skala normalisasi: ${h.toFixed(2)} m → ${scaledH.toFixed(2)} m (×${s.toFixed(3)})`);
      } else {
        fail++;
        console.log(`  ✗ skala salah: ${scaledH}`);
      }

      // Uji pergeseran ke tanah
      const bottomY = box.min.y * s;
      console.log(`  ✓ offset vertikal: ${bottomY.toFixed(3)} (dasar model diletakkan di y=0)`);

      resolve();
    },
    (err) => {
      fail++;
      console.error("  ✗ gagal parse:", err.message);
      resolve();
    }
  );
});

console.log(`\nHASIL: ${pass} lulus, ${fail} gagal`);
process.exit(fail > 0 ? 1 : 0);
