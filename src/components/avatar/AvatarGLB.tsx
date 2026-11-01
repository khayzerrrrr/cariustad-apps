"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { AvatarState } from "@/lib/avatar/stateMachine";
import { buildVisemeTimeline, frameAt, MOUTH_CLOSED } from "@/lib/avatar/visemes";
import {
  BLINK_LEFT_NAMES,
  BLINK_RIGHT_NAMES,
  JAW_NAMES,
  PUCKER_NAMES,
  WIDE_NAMES,
  clampTextureSize,
  describeMorphs,
  findHeadBone,
  findMorphIndex,
  guessYawFix,
  measureModel,
  normalizeScale,
} from "@/lib/avatar/glbProbe";

/** Model setengah badan (bahu ke atas) dipakai untuk demo asisten. */
const TARGET_HEIGHT = 1.05;

interface MorphSlot {
  mesh: THREE.Mesh;
  jaw: number;
  wide: number;
  pucker: number;
  blinkL: number;
  blinkR: number;
}

interface AvatarGLBProps {
  url: string;
  state: AvatarState;
  speakingText?: string;
  /** Override skala manual; kalau kosong, dihitung otomatis dari tinggi model */
  scale?: number;
  position?: [number, number, number];
}

export default function AvatarGLB({
  url,
  state: avatarState,
  speakingText,
  scale: scaleOverride,
  position = [0, -0.62, 0],
}: AvatarGLBProps) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const headBoneRef = useRef<THREE.Object3D | null>(null);
  const blinkRef = useRef({ next: 2 + Math.random() * 3, phase: 0, active: false, side: 0 });
  const morphsRef = useRef<MorphSlot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [hasMorphs, setHasMorphs] = useState(true);

  /* ---------------- Persiapan sekali saat model dimuat ---------------- */
  const prepared = useMemo(() => {
    // 1. Siapkan material: tekstur dikecilkan, bayangan aktif
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;

      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (!mat) continue;
        clampTextureSize(mat, 1024);
      }
    });

    // 2. Ukur & hitung skala normalisasi
    const metrics = measureModel(scene);
    const autoScale = normalizeScale(metrics, TARGET_HEIGHT);
    const finalScale = scaleOverride ?? autoScale;

    // 3. Perbaiki orientasi menghadap kamera (+Z)
    const yaw = guessYawFix(scene);

    // 4. Geser supaya titik terendah model menyentuh y = 0 di dalam group
    const bottomY = metrics.box.min.y * finalScale;
    const centerX = metrics.center.x * finalScale;
    const centerZ = metrics.center.z * finalScale;

    // 5. Kumpulkan morph target
    const slots: MorphSlot[] = [];
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const dict = mesh.morphTargetDictionary;
      if (!dict) return;

      const jaw = findMorphIndex(dict, JAW_NAMES);
      const wide = findMorphIndex(dict, WIDE_NAMES);
      const pucker = findMorphIndex(dict, PUCKER_NAMES);
      const blinkL = findMorphIndex(dict, BLINK_LEFT_NAMES);
      const blinkR = findMorphIndex(dict, BLINK_RIGHT_NAMES);

      if (jaw >= 0 || wide >= 0 || pucker >= 0 || blinkL >= 0) {
        slots.push({ mesh, jaw, wide, pucker, blinkL, blinkR });
      }
    });

    // 6. Bone kepala
    const headBone = findHeadBone(scene);

    return {
      finalScale,
      yaw,
      offset: [-centerX, -bottomY, -centerZ] as [number, number, number],
      slots,
      headBone,
      morphNames: describeMorphs(scene),
    };
  }, [scene, scaleOverride]);

  /* ---------------- Terapkan hasil persiapan ---------------- */
  useEffect(() => {
    morphsRef.current = prepared.slots;
    headBoneRef.current = prepared.headBone;
    setHasMorphs(prepared.slots.length > 0);
    setLoaded(true);

    if (process.env.NODE_ENV !== "production") {
      console.info(
        "[AvatarGLB] %d mesh morph terdeteksi. Morph target tersedia: %s",
        prepared.slots.length,
        prepared.morphNames.length ? prepared.morphNames.join(", ") : "(tidak ada)"
      );
      if (prepared.slots.length === 0) {
        console.warn(
          "[AvatarGLB] Model tidak punya morph target. Lip sync akan memakai\n" +
            "gerakan kepala saja. Pakai model Ready Player Me untuk hasil terbaik."
        );
      }
    }
  }, [prepared]);

  const timeline = useMemo(
    () => buildVisemeTimeline(speakingText || "", 13),
    [speakingText]
  );

  /* ---------------- Animasi per frame ---------------- */
  useFrame((threeState, delta) => {
    const t = threeState.clock.elapsedTime;

    /* ===== Gerak kepala ===== */
    if (groupRef.current) {
      let rotY = 0;
      let rotX = 0;
      let rotZ = 0;

      switch (avatarState) {
        case "idle":
          rotY = Math.sin(t * 0.32) * 0.06;
          rotX = Math.sin(t * 0.52) * 0.018;
          break;
        case "listening":
          rotY = Math.sin(t * 0.45) * 0.03;
          rotX = 0.035;
          break;
        case "thinking":
          rotX = -0.045;
          rotZ = Math.sin(t * 0.65) * 0.02;
          break;
        case "speaking":
          rotY = Math.sin(t * 1.35) * 0.045;
          rotX = Math.sin(t * 1.9) * 0.02;
          rotZ = Math.sin(t * 0.9) * 0.01;
          break;
        case "greeting":
          rotX = 0.05;
          break;
        case "error":
          rotX = -0.02;
          break;
      }

      groupRef.current.rotation.y += (rotY - groupRef.current.rotation.y) * 0.08;
      groupRef.current.rotation.x += (rotX - groupRef.current.rotation.x) * 0.08;
      groupRef.current.rotation.z += (rotZ - groupRef.current.rotation.z) * 0.08;
      groupRef.current.position.y =
        position[1] + Math.sin(t * 0.85) * 0.006;
    }

    /* ===== Kedip mata (kiri & kanan bergantian sedikit) ===== */
    const b = blinkRef.current;
    if (!b.active) {
      b.next -= delta;
      if (b.next <= 0) {
        b.active = true;
        b.phase = 0;
        b.side = Math.random() > 0.85 ? 1 : 0; // kadang berkedip satu mata
      }
    } else {
      b.phase += delta;
      if (b.phase > 0.17) {
        b.active = false;
        b.next = 2.4 + Math.random() * 3.4;
      }
    }
    const blinkVal = b.active ? Math.sin(Math.min(1, b.phase / 0.17) * Math.PI) : 0;

    /* ===== Lip sync ===== */
    const frame =
      avatarState === "speaking" ? frameAt(timeline, t, 13) : MOUTH_CLOSED;
    const smooth = avatarState === "speaking" ? 0.35 : 0.12;

    for (const slot of morphsRef.current) {
      const inf = slot.mesh.morphTargetInfluences;
      if (!inf) continue;

      if (slot.jaw >= 0) {
        inf[slot.jaw] += (frame.jaw - inf[slot.jaw]) * smooth;
      }
      if (slot.wide >= 0) {
        inf[slot.wide] += (frame.width * 0.55 - inf[slot.wide]) * smooth;
      }
      if (slot.pucker >= 0) {
        inf[slot.pucker] += (frame.round * 0.7 - inf[slot.pucker]) * smooth;
      }

      // Blink — set langsung ke nilai target (naik & turun sama-sama mengikuti kurva)
      const sideBias = b.side === 1 ? 0.35 : 1;
      if (slot.blinkL >= 0) {
        inf[slot.blinkL] += (blinkVal * sideBias - inf[slot.blinkL]) * 0.5;
      }
      if (slot.blinkR >= 0 && slot.blinkR !== slot.blinkL) {
        inf[slot.blinkR] += (blinkVal * sideBias - inf[slot.blinkR]) * 0.5;
      }
    }

    /* ===== Rotasi halus bone kepala ===== */
    const head = headBoneRef.current;
    if (head) {
      let hY = 0;
      let hX = 0;
      if (avatarState === "idle") hY = Math.sin(t * 0.28) * 0.05;
      else if (avatarState === "speaking") hY = Math.sin(t * 1.1) * 0.035;
      else if (avatarState === "listening") hX = 0.04;

      // Simpan rotasi awal supaya tidak "melayang" menjauh dari pose asli
      if (!head.userData.baseRot) {
        head.userData.baseRot = head.rotation.clone();
      }
      const base = head.userData.baseRot as THREE.Euler;
      head.rotation.y += (base.y + hY - head.rotation.y) * 0.06;
      head.rotation.x += (base.x + hX - head.rotation.x) * 0.06;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <group rotation={[0, prepared.yaw, 0]}>
        <primitive object={scene} scale={prepared.finalScale} position={prepared.offset} />
      </group>

      {/* Penanda saat model belum siap — hilang otomatis */}
      {!loaded && (
        <Html center>
          <div className="text-xs text-white/60">memuat model…</div>
        </Html>
      )}
    </group>
  );
}

/** Preload supaya tidak ada jeda saat pertama tampil */
export function preloadAvatar(url: string) {
  try {
    useGLTF.preload(url);
  } catch {
    /* noop */
  }
}
