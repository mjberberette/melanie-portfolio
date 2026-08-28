"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import * as THREE from "three";
import { useReducedMotion } from "motion/react";

import { useIntro } from "@/components/providers/intro-context";
import { clamp, lerp } from "@/lib/utils";

const MARK_URL = "/logo/mb-mark.svg";

function MonogramMesh({
  revealed,
  reduceMotion,
}: {
  revealed: boolean;
  reduceMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const data = useLoader(SVGLoader, MARK_URL);
  const entry = useRef(0);

  const geometry = useMemo(() => {
    const shapes: THREE.Shape[] = [];
    for (const path of data.paths) {
      shapes.push(...SVGLoader.createShapes(path));
    }

    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 30,
      bevelEnabled: true,
      bevelThickness: 5,
      bevelSize: 4,
      bevelOffset: 0,
      bevelSegments: 5,
      curveSegments: 10,
    });

    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, [data]);

  useFrame((state, delta) => {
    if (!group.current || !inner.current) return;

    const step = clamp(delta * 3.2, 0, 1);

    // Entry: the mark lands from behind once the curtain lifts.
    const target = revealed ? 1 : 0;
    entry.current = lerp(entry.current, target, clamp(delta * 1.6, 0, 1));
    const eased = 1 - Math.pow(1 - entry.current, 3);

    const scrolled =
      typeof window === "undefined"
        ? 0
        : clamp(window.scrollY / Math.max(window.innerHeight, 1), 0, 1.4);

    const pointerX = reduceMotion ? 0 : state.pointer.x;
    const pointerY = reduceMotion ? 0 : state.pointer.y;
    const time = state.clock.elapsedTime;

    // Pointer parallax stays subtle so the mark always reads as the logo.
    const targetRotY =
      pointerX * 0.34 +
      (reduceMotion ? 0 : Math.sin(time * 0.35) * 0.09) +
      scrolled * 1.15 +
      (1 - eased) * -0.9;
    const targetRotX =
      -pointerY * 0.22 +
      (reduceMotion ? 0 : Math.cos(time * 0.29) * 0.06) +
      scrolled * 0.25;

    inner.current.rotation.y = lerp(inner.current.rotation.y, targetRotY, step);
    inner.current.rotation.x = lerp(inner.current.rotation.x, targetRotX, step);
    inner.current.rotation.z = lerp(
      inner.current.rotation.z,
      scrolled * -0.18,
      step,
    );

    const bob = reduceMotion ? 0 : Math.sin(time * 0.6) * 0.045;
    group.current.position.y = lerp(
      group.current.position.y,
      bob - scrolled * 1.1 + (1 - eased) * -0.6,
      step,
    );
    group.current.position.z = lerp(
      group.current.position.z,
      -scrolled * 2.4 + (1 - eased) * -3.2,
      step,
    );

    const scale = 0.94 * eased + 0.06;
    group.current.scale.setScalar(scale);
  });

  return (
    <group ref={group} scale={0.06}>
      {/* PI rotation on X flips the SVG's y-down space without mirroring normals. */}
      <group ref={inner} rotation={[Math.PI, 0, 0]}>
        <mesh geometry={geometry} castShadow receiveShadow scale={0.0042}>
          <meshPhysicalMaterial
            color="#efeae0"
            metalness={0.58}
            roughness={0.3}
            clearcoat={0.85}
            clearcoatRoughness={0.2}
            envMapIntensity={1.8}
            reflectivity={0.6}
            sheen={0.3}
            sheenColor="#ffd9c8"
          />
        </mesh>
      </group>
    </group>
  );
}

function Rig() {
  const light = useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    if (!light.current) return;
    light.current.position.x = lerp(
      light.current.position.x,
      3 + state.pointer.x * 2,
      0.05,
    );
    light.current.position.y = lerp(
      light.current.position.y,
      4 + state.pointer.y * 2,
      0.05,
    );
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        ref={light}
        position={[3, 4, 6]}
        intensity={2.4}
        color="#fff6ec"
      />
      <directionalLight position={[-5, -2, -4]} intensity={1.6} color="#ff4a1c" />
      <directionalLight position={[0, -6, 2]} intensity={0.5} color="#6f8cff" />
    </>
  );
}

export default function MonogramScene({ className }: { className?: string }) {
  const { revealed } = useIntro();
  const reduceMotion = useReducedMotion() ?? false;
  const [ready, setReady] = useState(false);

  return (
    <div
      className={className}
      style={{ opacity: ready ? 1 : 0, transition: "opacity 900ms ease" }}
    >
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        dpr={[1, 1.8]}
        onCreated={() => setReady(true)}
        style={{ pointerEvents: "none" }}
      >
        <PerspectiveCamera makeDefault fov={34} position={[0, 0, 9]} />
        <Rig />
        <Suspense fallback={null}>
          <MonogramMesh revealed={revealed} reduceMotion={reduceMotion} />
          <Environment resolution={256}>
            <Lightformer
              intensity={3.2}
              position={[0, 3, -5]}
              scale={[12, 8, 1]}
              color="#ffffff"
            />
            <Lightformer
              intensity={2.4}
              position={[-6, 1, 2]}
              rotation-y={Math.PI / 2}
              scale={[8, 6, 1]}
              color="#ff6a3c"
            />
            <Lightformer
              intensity={1.6}
              position={[6, -2, 2]}
              rotation-y={-Math.PI / 2}
              scale={[8, 6, 1]}
              color="#8aa2ff"
            />
            <Lightformer
              intensity={2}
              position={[0, -5, 1]}
              rotation-x={Math.PI / 2}
              scale={[10, 6, 1]}
              color="#ffffff"
            />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
}
