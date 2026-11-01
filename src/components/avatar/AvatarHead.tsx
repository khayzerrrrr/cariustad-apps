"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AvatarState } from "@/lib/avatar/stateMachine";
import {
  buildVisemeTimeline,
  frameAt,
  MOUTH_CLOSED,
  MOUTH_REST,
} from "@/lib/avatar/visemes";

interface AvatarHeadProps {
  state: AvatarState;
  /** Teks yang sedang diucapkan — dipakai untuk lip sync */
  speakingText?: string;
}

/* ================================================================== */
/*  DEFORMASI KEPALA                                                   */
/*  Satu sumber kebenaran: dipakai untuk membangun geometri sekaligus   */
/*  untuk menghitung posisi fitur wajah (surfaceZ).                     */
/* ================================================================== */
const HALF_W = 0.645;
const HALF_H = 0.885;
const HALF_D = 0.685;

function deformPoint(xu: number, yu: number, zu: number): [number, number, number] {
  let nx = xu * HALF_W;
  let ny = yu * HALF_H;
  let nz = zu * HALF_D;

  // Rahang mengerucut ke dagu
  const down = Math.max(0, -ny);
  const jawTaper = 1 - Math.pow(down, 1.25) * 0.6;
  nx *= jawTaper;
  nz *= 1 - Math.pow(down, 1.4) * 0.26;

  // Belakang tengkorak pipih
  if (nz < 0) nz *= 0.94;

  // Dahi mundur ke atas
  if (ny > 0.34 && nz > 0) nz -= (ny - 0.34) * 0.11;

  // Tonjolan alis
  const browBand = Math.exp(-Math.pow((ny - 0.285) / 0.105, 2));
  if (nz > 0.18) nz += browBand * 0.036 * Math.max(0, 1 - Math.abs(nx) / 0.55);

  // Rongga mata
  const dEye = Math.hypot((Math.abs(nx) - 0.235) / 0.155, (ny - 0.105) / 0.125);
  if (nz > 0.22) nz -= Math.exp(-dEye * dEye * 2.3) * 0.048;

  // Tulang pipi
  const dCheek = Math.hypot((Math.abs(nx) - 0.335) / 0.175, (ny + 0.045) / 0.155);
  if (nz > 0.05) nz += Math.exp(-dCheek * dCheek * 2.1) * 0.026;

  // Dagu maju
  if (ny < -0.44 && nz > 0) {
    const t = Math.exp(-Math.pow((ny + 0.615) / 0.115, 2));
    nz += t * 0.05 * Math.max(0, 1 - Math.abs(nx) / 0.21);
  }

  // Cekung area mulut
  const dMouth = Math.hypot(nx / 0.16, (ny + 0.3) / 0.085);
  if (nz > 0.25) nz -= Math.exp(-dMouth * dMouth * 1.6) * 0.018;

  // Pelipis cekung
  const dTemple = Math.hypot((Math.abs(nx) - 0.52) / 0.16, (ny - 0.3) / 0.22);
  if (nz > -0.1) nz -= Math.exp(-dTemple * dTemple * 2.4) * 0.016;

  return [nx, ny, nz];
}

/** Z permukaan depan kepala pada koordinat (x, y) tertentu. */
function surfaceZ(targetX: number, targetY: number): number {
  const down = Math.max(0, -targetY);
  const jawTaper = 1 - Math.pow(down, 1.25) * 0.6;
  let xu = targetX / (HALF_W * jawTaper);
  let yu = targetY / HALF_H;

  const r2 = xu * xu + yu * yu;
  if (r2 >= 0.9985) {
    const s = Math.sqrt(0.9985 / r2);
    xu *= s;
    yu *= s;
  }
  const zu = Math.sqrt(Math.max(0, 1 - xu * xu - yu * yu));
  return deformPoint(xu, yu, zu)[2];
}

function createHeadGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 128, 128);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const [nx, ny, nz] = deformPoint(v.x, v.y, v.z);
    pos.setXYZ(i, nx, ny, nz);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/* ================================================================== */
/*  TEKSTUR IRIS                                                       */
/* ================================================================== */
function createIrisTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const g = ctx.createRadialGradient(
    size / 2, size / 2, size * 0.04,
    size / 2, size / 2, size * 0.5
  );
  g.addColorStop(0, "#1e0f05");
  g.addColorStop(0.3, "#5e3517");
  g.addColorStop(0.6, "#8a5223");
  g.addColorStop(0.86, "#38200e");
  g.addColorStop(1, "#0a0502");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  ctx.globalAlpha = 0.26;
  for (let i = 0; i < 240; i++) {
    const a = (i / 240) * Math.PI * 2;
    const r0 = size * (0.13 + Math.random() * 0.07);
    const r1 = size * (0.35 + Math.random() * 0.14);
    ctx.strokeStyle = Math.random() > 0.5 ? "#c58a4a" : "#160b03";
    ctx.lineWidth = Math.random() * 1.6 + 0.4;
    ctx.beginPath();
    ctx.moveTo(size / 2 + Math.cos(a) * r0, size / 2 + Math.sin(a) * r0);
    ctx.lineTo(size / 2 + Math.cos(a) * r1, size / 2 + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(8,4,2,0.85)";
  ctx.lineWidth = size * 0.035;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.455, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ================================================================== */
/*  KOMPONEN                                                           */
/* ================================================================== */
export default function AvatarHead({ state: avatarState, speakingText }: AvatarHeadProps) {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftLidRef = useRef<THREE.Mesh>(null);
  const rightLidRef = useRef<THREE.Mesh>(null);
  const mouthGroupRef = useRef<THREE.Group>(null);
  const lowerLipRef = useRef<THREE.Mesh>(null);
  const mouthCavityRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Group>(null);

  const blink = useRef({ next: 2 + Math.random() * 3, phase: 0, active: false });
  const greetingTimer = useRef(0);
  const viseme = useRef({ ...MOUTH_REST });

  const headGeo = useMemo(() => createHeadGeometry(), []);
  const irisTex = useMemo(() => createIrisTexture(), []);

  useEffect(() => {
    return () => {
      headGeo.dispose();
      irisTex.dispose();
    };
  }, [headGeo, irisTex]);

  const timeline = useMemo(
    () => buildVisemeTimeline(speakingText || "", 13),
    [speakingText]
  );

  /* ---------- Posisi fitur wajah, dihitung dari permukaan ---------- */
  const P = useMemo(() => {
    const eyeX = 0.235;
    const eyeY = 0.105;
    const zEye = surfaceZ(eyeX, eyeY);      // permukaan di rongga mata
    const zBrow = surfaceZ(eyeX, 0.208);
    const zMouth = surfaceZ(0, -0.305);
    const zNoseBridge = surfaceZ(0, 0.045);
    const zNoseTip = surfaceZ(0, -0.095);
    const zChin = surfaceZ(0, -0.6);
    const zJaw = surfaceZ(0.32, -0.42);
    const zMustache = surfaceZ(0, -0.262);

    return {
      eye: [eyeX, eyeY, zEye - 0.062] as [number, number, number],
      brow: [eyeX, 0.208, zBrow + 0.006] as [number, number, number],
      mouth: [0, -0.305, zMouth + 0.004] as [number, number, number],
      noseBridge: [0, 0.045, zNoseBridge] as [number, number, number],
      noseTip: [0, -0.095, zNoseTip] as [number, number, number],
      chin: [0, -0.6, zChin + 0.004] as [number, number, number],
      jaw: [0.32, -0.42, zJaw + 0.004] as [number, number, number],
      mustache: [0, -0.262, zMustache + 0.006] as [number, number, number],
      ear: [0.615, 0.02, -0.02] as [number, number, number],
    };
  }, []);

  /* ---------- Material ---------- */
  const skinMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#c68d63",
        roughness: 0.6,
        metalness: 0.0,
        clearcoat: 0.18,
        clearcoatRoughness: 0.6,
        sheen: 0.45,
        sheenColor: new THREE.Color("#ff9d78"),
        sheenRoughness: 0.85,
      }),
    []
  );
  const skinShadowMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#a9744e", roughness: 0.8 }),
    []
  );
  const lipMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#9d5b4b",
        roughness: 0.4,
        clearcoat: 0.55,
        clearcoatRoughness: 0.32,
        sheen: 0.3,
        sheenColor: new THREE.Color("#e08a76"),
      }),
    []
  );
  const mouthInnerMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3a1414", roughness: 0.95 }),
    []
  );
  const scleraMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#f3f0ea",
        roughness: 0.13,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
      }),
    []
  );
  const corneaMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        roughness: 0.02,
        clearcoat: 1,
        clearcoatRoughness: 0.0,
        transparent: true,
        opacity: 0.07,
      }),
    []
  );
  const irisMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: irisTex,
        roughness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
      }),
    [irisTex]
  );
  const pupilMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#050302" }), []);
  const browMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#191110", roughness: 0.93 }),
    []
  );
  const beardMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1b1410",
        roughness: 0.98,
        transparent: true,
        opacity: 0.5,
      }),
    []
  );
  const peciMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#0e0e10",
        roughness: 0.88,
        metalness: 0.0,
        sheen: 0.75,
        sheenColor: new THREE.Color("#3a3a42"),
        sheenRoughness: 0.5,
        clearcoat: 0.12,
      }),
    []
  );
  const clothMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#f6f3ea",
        roughness: 0.76,
        sheen: 0.5,
        sheenColor: new THREE.Color("#ffffff"),
        sheenRoughness: 0.7,
      }),
    []
  );

  /* ---------- Alis melengkung ---------- */
  const browGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.105, 0.0, 0.0),
      new THREE.Vector3(-0.045, 0.024, 0.006),
      new THREE.Vector3(0.02, 0.03, 0.01),
      new THREE.Vector3(0.085, 0.006, 0.002),
    ]);
    return new THREE.TubeGeometry(curve, 24, 0.017, 8, false);
  }, []);

  useEffect(() => () => browGeo.dispose(), [browGeo]);

  /* ---------- Animasi ---------- */
  useFrame((threeState, delta) => {
    if (!rootRef.current || !headRef.current) return;
    const t = threeState.clock.elapsedTime;
    const head = headRef.current;

    /* BLINK */
    const b = blink.current;
    if (!b.active) {
      b.next -= delta;
      if (b.next <= 0) {
        b.active = true;
        b.phase = 0;
      }
    } else {
      b.phase += delta;
      const dur = 0.17;
      let s = 1;
      if (b.phase < dur * 0.4) {
        s = 1 - (b.phase / (dur * 0.4)) * 0.94;
      } else if (b.phase < dur) {
        s = 0.06 + ((b.phase - dur * 0.4) / (dur * 0.6)) * 0.94;
      } else {
        s = 1;
        b.active = false;
        b.next = 2.4 + Math.random() * 3.4;
      }
      if (leftEyeRef.current) leftEyeRef.current.scale.y = s;
      if (rightEyeRef.current) rightEyeRef.current.scale.y = s;
      if (leftLidRef.current) leftLidRef.current.position.y = 0.108 - (1 - s) * 0.082;
      if (rightLidRef.current) rightLidRef.current.position.y = 0.108 - (1 - s) * 0.082;
    }

    /* GERAK KEPALA */
    let rotX = 0, rotY = 0, rotZ = 0;
    switch (avatarState) {
      case "idle":
        rotY = Math.sin(t * 0.32) * 0.07;
        rotX = Math.sin(t * 0.52) * 0.022;
        break;
      case "listening":
        rotY = Math.sin(t * 0.45) * 0.032;
        rotX = 0.045 + Math.abs(Math.sin(t * 1.15)) * 0.03;
        break;
      case "thinking":
        rotX = -0.05;
        rotZ = Math.sin(t * 0.65) * 0.025;
        break;
      case "speaking":
        rotY = Math.sin(t * 1.35) * 0.05;
        rotX = Math.sin(t * 1.9) * 0.024;
        rotZ = Math.sin(t * 0.9) * 0.012;
        break;
      case "greeting":
        greetingTimer.current += delta;
        rotX = greetingTimer.current < 0.6
          ? 0.13 * Math.sin((greetingTimer.current / 0.6) * Math.PI)
          : 0;
        break;
      case "error":
        rotX = -0.025;
        break;
    }
    head.rotation.x += (rotX - head.rotation.x) * 0.09;
    head.rotation.y += (rotY - head.rotation.y) * 0.09;
    head.rotation.z += (rotZ - head.rotation.z) * 0.09;

    if (bodyRef.current) {
      bodyRef.current.position.y = -1.32 + Math.sin(t * 0.85) * 0.012;
      bodyRef.current.rotation.z = Math.sin(t * 0.55) * 0.004;
    }

    /* LIP SYNC */
    let target = MOUTH_CLOSED;
    if (avatarState === "speaking") target = frameAt(timeline, t, 13);
    else if (avatarState === "listening") target = { jaw: 0.05, width: 0.34, round: 0.12 };
    else if (avatarState === "thinking") target = { jaw: 0.03, width: 0.28, round: 0.16 };
    else target = MOUTH_CLOSED;

    const vs = viseme.current;
    const k = avatarState === "speaking" ? 0.42 : 0.16;
    vs.jaw += (target.jaw - vs.jaw) * k;
    vs.width += (target.width - vs.width) * k;
    vs.round += (target.round - vs.round) * k;

    if (lowerLipRef.current) {
      lowerLipRef.current.position.y = -0.034 - vs.jaw * 0.05;
      lowerLipRef.current.scale.x = 0.105 * (0.9 + vs.width * 0.38);
    }
    if (mouthCavityRef.current) {
      const open = Math.max(0.0006, vs.jaw);
      mouthCavityRef.current.scale.set(0.88 + vs.width * 0.45, open * 1.1 + 0.006, 1);
      mouthCavityRef.current.visible = vs.jaw > 0.02;
    }
    if (mouthGroupRef.current) {
      mouthGroupRef.current.scale.x = 1 - vs.round * 0.32;
    }
  });

  /* ---------- Render ---------- */
  return (
    <group ref={rootRef} position={[0, 0.28, 0]}>
      <group ref={headRef}>
        {/* ===== KULIT / WAJAH ===== */}
        <mesh geometry={headGeo} material={skinMat} castShadow receiveShadow />

        {/* ===== MATA ===== */}
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[side * P.eye[0], P.eye[1], P.eye[2]]}
          >
            <mesh
              ref={side === -1 ? leftEyeRef : rightEyeRef}
              material={scleraMat}
            >
              <sphereGeometry args={[0.072, 40, 40]} />
            </mesh>
            <mesh position={[0, 0, 0.0722]} material={irisMat}>
              <circleGeometry args={[0.034, 40]} />
            </mesh>
            <mesh position={[0, 0, 0.0729]} material={pupilMat}>
              <circleGeometry args={[0.0135, 28]} />
            </mesh>
            {/* Catchlight */}
            <mesh position={[-0.017, 0.021, 0.0735]}>
              <sphereGeometry args={[0.0085, 14, 14]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Kornea */}
            <mesh material={corneaMat}>
              <sphereGeometry args={[0.0745, 32, 32]} />
            </mesh>
            {/* Kelopak atas */}
            <mesh
              ref={side === -1 ? leftLidRef : rightLidRef}
              position={[0, 0.108, 0.004]}
              scale={[0.092, 0.06, 0.08]}
              material={skinMat}
            >
              <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
            </mesh>
          </group>
        ))}

        {/* ===== ALIS ===== */}
        {[-1, 1].map((side) => (
          <mesh
            key={`brow-${side}`}
            geometry={browGeo}
            material={browMat}
            position={[side * P.brow[0], P.brow[1], P.brow[2]]}
            rotation={[0, side * -0.12, side * 0.06]}
            scale={[1.15, 1, 1]}
          />
        ))}

        {/* ===== HIDUNG ===== */}
        {/* Batang hidung — sphere memanjang, menyatu dengan wajah */}
        <mesh
          position={[0, 0.01, (P.noseBridge[2] + P.noseTip[2]) / 2 - 0.012]}
          rotation={[0.2, 0, 0]}
          scale={[0.046, 0.135, 0.052]}
          material={skinMat}
        >
          <sphereGeometry args={[1, 28, 28]} />
        </mesh>
        <mesh position={[0, P.noseTip[1], P.noseTip[2] + 0.014]} material={skinMat}>
          <sphereGeometry args={[0.048, 28, 28]} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh
            key={`nostril-${side}`}
            position={[side * 0.038, P.noseTip[1] - 0.012, P.noseTip[2] - 0.004]}
            scale={[1, 0.85, 0.8]}
            material={skinMat}
          >
            <sphereGeometry args={[0.029, 20, 20]} />
          </mesh>
        ))}
        {[-1, 1].map((side) => (
          <mesh
            key={`hole-${side}`}
            position={[side * 0.024, P.noseTip[1] - 0.026, P.noseTip[2] + 0.004]}
            scale={[1, 0.55, 0.7]}
          >
            <sphereGeometry args={[0.011, 14, 14]} />
            <meshStandardMaterial color="#4e2d1f" roughness={1} />
          </mesh>
        ))}

        {/* ===== MULUT ===== */}
        <group ref={mouthGroupRef} position={[P.mouth[0], P.mouth[1], P.mouth[2]]}>
          <mesh ref={mouthCavityRef} position={[0, -0.014, -0.01]} scale={[0.9, 0.008, 1]} material={mouthInnerMat}>
            <circleGeometry args={[0.056, 32]} />
          </mesh>
          <mesh position={[0, 0.01, 0.002]} scale={[0.112, 0.025, 0.038]} material={lipMat}>
            <sphereGeometry args={[1, 28, 28]} />
          </mesh>
          <mesh
            ref={lowerLipRef}
            position={[0, -0.034, 0.002]}
            scale={[0.105, 0.031, 0.04]}
            material={lipMat}
          >
            <sphereGeometry args={[1, 28, 28]} />
          </mesh>
        </group>

        {/* ===== JAMBANG (bayangan jenggot tipis, menempel di kulit) ===== */}
        <mesh
          position={[0, P.chin[1], P.chin[2] + 0.006]}
          scale={[0.145, 0.1, 0.018]}
          material={beardMat}
        >
          <sphereGeometry args={[1, 24, 24]} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh
            key={`jaw-${side}`}
            position={[side * P.jaw[0], P.jaw[1], P.jaw[2] + 0.006]}
            scale={[0.105, 0.145, 0.016]}
            material={beardMat}
          >
            <sphereGeometry args={[1, 24, 24]} />
          </mesh>
        ))}
        {/* Kumis */}
        <mesh
          position={[P.mustache[0], P.mustache[1], P.mustache[2] + 0.002]}
          scale={[0.09, 0.013, 0.012]}
          material={beardMat}
        >
          <sphereGeometry args={[1, 20, 20]} />
        </mesh>

        {/* ===== TELINGA ===== */}
        {[-1, 1].map((side) => (
          <group key={`ear-${side}`} position={[side * P.ear[0], P.ear[1], P.ear[2]]}>
            <mesh scale={[0.4, 0.76, 0.3]} material={skinMat}>
              <sphereGeometry args={[0.105, 28, 28]} />
            </mesh>
            <mesh
              position={[side * 0.01, 0, 0.02]}
              scale={[0.22, 0.42, 0.14]}
              material={skinShadowMat}
            >
              <sphereGeometry args={[0.088, 20, 20]} />
            </mesh>
          </group>
        ))}

        {/* ===== PECI ===== */}
        <mesh position={[0, 0.69, -0.012]} material={peciMat}>
          <cylinderGeometry args={[0.5, 0.575, 0.34, 64, 1, true]} />
        </mesh>
        <mesh position={[0, 0.858, -0.012]} scale={[0.5, 0.07, 0.5]} material={peciMat}>
          <sphereGeometry args={[1, 48, 20, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>
        <mesh position={[0, 0.522, -0.012]} material={peciMat}>
          <torusGeometry args={[0.578, 0.021, 16, 64]} />
        </mesh>

        {/* ===== RAMBUT SISI ===== */}
        <mesh position={[0, 0.42, -0.05]} scale={[0.62, 0.22, 0.64]} material={browMat}>
          <sphereGeometry args={[1, 32, 32, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.34]} />
        </mesh>
      </group>

      {/* ===== LEHER ===== */}
      <mesh position={[0, -0.72, -0.02]} material={skinMat}>
        <cylinderGeometry args={[0.175, 0.215, 0.32, 32]} />
      </mesh>

      {/* ===== BADAN (BAJU KOKO) ===== */}
      <group ref={bodyRef} position={[0, -1.32, 0]}>
        <mesh scale={[0.72, 0.56, 0.44]} material={clothMat}>
          <sphereGeometry args={[1, 48, 48]} />
        </mesh>
        <mesh position={[0, 0.36, 0.02]} material={clothMat}>
          <cylinderGeometry args={[0.2, 0.235, 0.19, 32, 1, true]} />
        </mesh>
        <mesh position={[0, 0.29, 0.185]} rotation={[0.05, 0, 0]} material={clothMat}>
          <boxGeometry args={[0.045, 0.2, 0.02]} />
        </mesh>
        <mesh position={[0, 0.2, 0.222]}>
          <sphereGeometry args={[0.014, 16, 16]} />
          <meshStandardMaterial color="#e8e2d2" roughness={0.4} metalness={0.2} />
        </mesh>
      </group>
    </group>
  );
}
