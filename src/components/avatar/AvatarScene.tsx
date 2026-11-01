"use client";

import { Component, ReactNode, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import AvatarHead from "./AvatarHead";
import AvatarGLB from "./AvatarGLB";
import { AvatarState } from "@/lib/avatar/stateMachine";

interface AvatarSceneProps {
  state: AvatarState;
  speakingText?: string;
}

/** URL model 3D asli. Set NEXT_PUBLIC_AVATAR_GLB=/models/avatar.glb untuk mengaktifkan. */
const AVATAR_GLB = (process.env.NEXT_PUBLIC_AVATAR_GLB || "").trim();

/** Error boundary: kalau GLB gagal dimuat, jatuh ke avatar prosedural. */
class AvatarErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: unknown) {
    console.warn("[AvatarScene] Gagal memuat model GLB, memakai avatar prosedural.", err);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function ProceduralAvatar({ state, speakingText }: AvatarSceneProps) {
  return <AvatarHead state={state} speakingText={speakingText} />;
}

/**
 * Setelan kamera berbeda antara avatar prosedural (potret kepala, sumbu Y
 * di sekitar 0.28) dan model GLB (setengah badan, berdiri dari y = 0).
 */
const CAMERA_PROCEDURAL = { position: [0, 0.45, 3.05] as [number, number, number], fov: 34 };
const CAMERA_GLB = { position: [0, 0.46, 1.95] as [number, number, number], fov: 32 };

export default function AvatarScene({ state, speakingText }: AvatarSceneProps) {
  const useGLB = Boolean(AVATAR_GLB);
  const cam = useGLB ? CAMERA_GLB : CAMERA_PROCEDURAL;

  return (
    <Canvas
      camera={cam}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      dpr={[1, 2]}
      shadows
    >
      {/* ===== Pencahayaan 3 titik + rim ===== */}
      <ambientLight intensity={0.35} />
      {/* Key light — hangat, dari kanan atas depan */}
      <directionalLight
        position={[2.6, 3.4, 2.8]}
        intensity={2.4}
        color="#fff3e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-camera-near={0.1}
        shadow-camera-far={12}
      />
      {/* Fill light — dingin, lembut, dari kiri */}
      <directionalLight position={[-3.2, 1.6, 1.6]} intensity={0.85} color="#bcd8ff" />
      {/* Rim / back light — memisahkan siluet dari latar */}
      <directionalLight position={[-1.2, 2.2, -3.4]} intensity={1.5} color="#9be8c4" />
      {/* Bounce hangat dari bawah — menerangi dagu & leher */}
      <pointLight position={[0, -1.1, 1.6]} intensity={0.6} color="#ffc98a" />

      {/* ===== Avatar ===== */}
      {useGLB ? (
        <AvatarErrorBoundary fallback={<ProceduralAvatar state={state} speakingText={speakingText} />}>
          <Suspense fallback={<ProceduralAvatar state={state} speakingText={speakingText} />}>
            <AvatarGLB url={AVATAR_GLB} state={state} speakingText={speakingText} />
          </Suspense>
        </AvatarErrorBoundary>
      ) : (
        <ProceduralAvatar state={state} speakingText={speakingText} />
      )}

      {/* ===== Bayangan kontak ===== */}
      <ContactShadows
        position={[0, -1.92, 0]}
        opacity={0.32}
        scale={4.5}
        blur={2.8}
        far={3.2}
        resolution={512}
      />

      {/* ===== Environment lokal (tanpa unduh HDRI — aman saat offline) ===== */}
      <Environment resolution={256} frames={1}>
        <mesh scale={80}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial color="#161d26" side={THREE.BackSide} />
        </mesh>
        <Lightformer form="rect" intensity={2.6} position={[0, 3.5, 3]} scale={[6, 4, 1]} color="#fff3e0" />
        <Lightformer form="rect" intensity={1.1} position={[-4, 1, 2]} scale={[4, 4, 1]} color="#bcd8ff" />
        <Lightformer form="rect" intensity={1.8} position={[0, 2, -5]} scale={[8, 5, 1]} color="#9be8c4" />
        <Lightformer form="circle" intensity={1.2} position={[0, -3, 1]} scale={[4, 4, 1]} color="#ffc98a" />
      </Environment>

      {/* ===== Kontrol kamera ===== */}
      <OrbitControls
        target={[0, useGLB ? 0.44 : 0.28, 0]}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 2.75}
        maxPolarAngle={Math.PI / 1.85}
        minAzimuthAngle={-0.38}
        maxAzimuthAngle={0.38}
        autoRotate={state === "idle"}
        autoRotateSpeed={0.25}
      />
    </Canvas>
  );
}
