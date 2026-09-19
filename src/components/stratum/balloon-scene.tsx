import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import { useStratum } from "@/lib/stratum/engine";

function envelopeProfile(segments = 40): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * 6.5;
    const mouth = 0.58;
    const bulge = 2.95;
    const envelope = Math.sin(Math.PI * t ** 0.7);
    const r = mouth + (bulge - mouth) * envelope;
    pts.push(new THREE.Vector2(r, y));
  }
  return pts;
}

function Envelope() {
  const geo = useMemo(() => {
    const g = new THREE.LatheGeometry(envelopeProfile(), 48);
    g.computeVertexNormals();
    return g;
  }, []);
  const wire = useMemo(() => {
    const g = new THREE.LatheGeometry(envelopeProfile(), 16);
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial
          color="#c2410c"
          roughness={0.62}
          metalness={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={wire} scale={1.004}>
        <meshBasicMaterial color="#f4d3c0" wireframe transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

function Gondola() {
  const frame = useMemo(() => {
    const w = 1.5;
    const h = 1.35;
    const d = 2.4;
    const hw = w / 2;
    const hd = d / 2;
    const pts: THREE.Vector3[] = [];
    const corners = [
      [-hw, 0, -hd],
      [hw, 0, -hd],
      [hw, 0, hd],
      [-hw, 0, hd],
      [-hw, h, -hd],
      [hw, h, -hd],
      [hw, h, hd],
      [-hw, h, hd],
    ] as const;
    const edges: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
      [0, 5],
      [1, 6],
      [2, 7],
      [3, 4],
    ];
    for (const [a, b] of edges) {
      pts.push(new THREE.Vector3(...corners[a]), new THREE.Vector3(...corners[b]));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return geo;
  }, []);

  return (
    <group position={[0, -0.2, 0]}>
      <lineSegments geometry={frame}>
        <lineBasicMaterial color="#9aa4ae" />
      </lineSegments>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[1.35, 0.08, 2.2]} />
        <meshStandardMaterial color="#2a3138" roughness={0.8} metalness={0.2} />
      </mesh>
    </group>
  );
}

function Cables() {
  const geo = useMemo(() => {
    const mouthY = 0.15;
    const mouthR = 0.7;
    const gondolaY = 1.15;
    const corners: [number, number][] = [
      [-0.7, -1.1],
      [0.7, -1.1],
      [0.7, 1.1],
      [-0.7, 1.1],
    ];
    const pts: THREE.Vector3[] = [];
    for (const [x, z] of corners) {
      const nx = (x / 0.7) * mouthR * 0.55;
      const nz = (z / 1.1) * mouthR * 0.55;
      pts.push(new THREE.Vector3(nx, mouthY, nz), new THREE.Vector3(x, gondolaY, z));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#c5ccd3" />
    </lineSegments>
  );
}

function Burner() {
  const throttle = useStratum((s) => s.throttle);
  const flame = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;
    const flicker = 0.85 + Math.sin(t * 22) * 0.08 + Math.sin(t * 41) * 0.05;
    const on = throttle > 0.04;
    const scale = on ? (0.35 + throttle * 0.9) * flicker : 0.001;
    if (flame.current) {
      flame.current.scale.set(scale * 0.55, scale, scale * 0.55);
      flame.current.visible = on;
    }
    if (light.current) {
      light.current.intensity = on ? (1.2 + throttle * 3.2) * flicker : 0;
    }
    void d;
  });

  return (
    <group position={[0, 0.55, 0]}>
      <mesh>
        <cylinderGeometry args={[0.18, 0.22, 0.42, 12]} />
        <meshStandardMaterial color="#8b939c" metalness={0.7} roughness={0.28} />
      </mesh>
      <mesh ref={flame} position={[0, 0.55, 0]}>
        <coneGeometry args={[0.28, 1.1, 10]} />
        <meshStandardMaterial
          color="#e24a12"
          emissive="#e24a12"
          emissiveIntensity={2.4}
          transparent
          opacity={0.85}
        />
      </mesh>
      <pointLight
        ref={light}
        position={[0, 0.9, 0]}
        color="#ff7a3c"
        distance={10}
        decay={2}
      />
    </group>
  );
}

function SceneRig() {
  return (
    <>
      <color attach="background" args={["#07090c"]} />
      <fog attach="fog" args={["#07090c", 18, 48]} />
      <hemisphereLight args={["#c5cdd6", "#1a140f", 0.55]} />
      <directionalLight position={[10, 16, 6]} intensity={1.35} color="#fff3e4" />
      <directionalLight position={[-8, 4, -10]} intensity={0.28} color="#7d8fa3" />
      <group position={[0, -2.4, 0]}>
        <Envelope />
        <group position={[0, 0, 0]}>
          <Cables />
          <Gondola />
          <Burner />
        </group>
      </group>
      <Grid
        args={[40, 40]}
        cellSize={1}
        sectionSize={5}
        cellColor="#1c242c"
        sectionColor="#2a3540"
        fadeDistance={36}
        fadeStrength={1.4}
        infiniteGrid
        position={[0, -2.6, 0]}
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={7}
        maxDistance={26}
        maxPolarAngle={Math.PI * 0.49}
        target={[0, 1.2, 0]}
      />
    </>
  );
}

export function BalloonScene() {
  return (
    <Canvas
      camera={{ position: [11, 5.5, 12], fov: 40, near: 0.1, far: 80 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      style={{ touchAction: "none" }}
    >
      <SceneRig />
    </Canvas>
  );
}
